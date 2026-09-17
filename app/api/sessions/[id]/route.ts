import { NextResponse } from "next/server";
import { z } from "zod";
import { owner, sameOrigin, readJson, failure } from "@/lib/http.server";
import { readSession, view, updateNotes, GameError } from "@/lib/db.server";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return NextResponse.json(
      view(readSession((await context.params).id, await owner())),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const parsed = z
      .object({ notes: z.string().max(3000) })
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new GameError("Notes must be under 3,000 characters.");
    return NextResponse.json(
      updateNotes((await context.params).id, await owner(), parsed.data.notes),
    );
  } catch (e) {
    return failure(e);
  }
}
