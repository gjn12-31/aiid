import { NextResponse } from "next/server";
import { owner, sameOrigin, readJson, failure } from "@/lib/http.server";
import { actionSchema, playAction } from "@/lib/game.server";
import { GameError } from "@/lib/db.server";
export const runtime = "nodejs";
export const maxDuration = 45;
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const input = actionSchema.safeParse(await readJson(request));
    if (!input.success) throw new GameError(input.error.issues[0].message);
    const result = await playAction(
      (await context.params).id,
      await owner(),
      input.data,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
