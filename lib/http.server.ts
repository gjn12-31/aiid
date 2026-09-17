import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ownerHash, GameError } from "./db.server";
import { HostUnavailable } from "./host.server";
import { validOrigin } from "./origin";
export const guestCookie = "mystery_guest";
export async function owner() {
  const token = (await cookies()).get(guestCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new GameError("Start an investigation to continue.", 401);
  return ownerHash(token);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !validOrigin(
      origin,
      request.headers.get("host"),
      request.url,
      process.env.APP_ORIGIN,
    )
  )
    throw new GameError(
      "This request could not be verified. Reload and try again.",
      403,
    );
}
export async function readJson(request: Request) {
  // Bound the actual bytes, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new GameError("Missing request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12000) {
      await reader.cancel();
      throw new GameError("Request is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new GameError("Invalid request.");
  }
}
export function failure(e: unknown) {
  if (e instanceof GameError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof HostUnavailable)
    return NextResponse.json({ error: e.message }, { status: 503 });
  // Provider payloads may contain request metadata; never forward or log them.
  return NextResponse.json(
    {
      error:
        "Something went wrong. Your saved progress is safe. Please try again.",
    },
    { status: 500 },
  );
}
