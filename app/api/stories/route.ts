import { NextResponse } from "next/server";
import { generationInput, generateSession } from "@/lib/generation.server";
import { owner, sameOrigin, readJson, failure } from "@/lib/http.server";
import { GameError } from "@/lib/db.server";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = generationInput.safeParse(await readJson(request));
    if (!input.success) throw new GameError(input.error.issues[0].message);
    return NextResponse.json(await generateSession(await owner(), input.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
