import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { startSession } from "@/lib/game.server";
import { guestCookie, sameOrigin, readJson, failure } from "@/lib/http.server";
import { ownerHash, GameError } from "@/lib/db.server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const parsed = z
      .object({ caseId: z.string() })
      .safeParse(await readJson(request));
    if (!parsed.success) throw new GameError("Choose a case to begin.");
    let token = (await cookies()).get(guestCookie)?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      token = randomBytes(32).toString("hex");
    const session = startSession(parsed.data.caseId, ownerHash(token));
    const response = NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(guestCookie, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: (process.env.APP_ORIGIN || request.url).startsWith("https:"),
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
