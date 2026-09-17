import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { guestCookie, sameOrigin, failure } from "@/lib/http.server";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    let token = (await cookies()).get(guestCookie)?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      token = randomBytes(32).toString("hex");
    const response = NextResponse.json(
      { ready: true },
      { headers: { "Cache-Control": "no-store" } },
    );
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
