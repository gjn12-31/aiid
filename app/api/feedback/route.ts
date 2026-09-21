import { existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readFile, set_fs, writeFile, utils } from "xlsx";
import { sameOrigin, readJson, failure } from "@/lib/http.server";
import { GameError } from "@/lib/db.server";
export const runtime = "nodejs";
// The ESM build of SheetJS cannot bundle node:fs itself; wire it in.
set_fs(fs);
const workbookFile = join(process.cwd(), "data", "feedback.xlsx");
const sheetName = "Feedback";
// Feedback is anonymous: no cookie or owner identity is read or stored.
let throttleWindow = 0;
let throttleCount = 0;
function allowWrite() {
  const now = Date.now();
  if (now - throttleWindow > 60_000) {
    throttleWindow = now;
    throttleCount = 0;
  }
  return ++throttleCount <= 20;
}
function appendFeedback(text: string, at: Date) {
  mkdirSync(dirname(workbookFile), { recursive: true });
  const book = existsSync(workbookFile)
    ? readFile(workbookFile)
    : utils.book_new();
  if (!book.Sheets[sheetName])
    utils.book_append_sheet(
      book,
      utils.aoa_to_sheet([["Time", "Feedback"]]),
      sheetName,
    );
  utils.sheet_add_aoa(book.Sheets[sheetName], [[at.toISOString(), text]], {
    origin: -1,
  });
  writeFile(book, workbookFile);
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!allowWrite())
      throw new GameError("Too many notes at once. Try again in a minute.", 429);
    const parsed = z
      .object({ text: z.string().trim().min(1).max(2000) })
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new GameError("Write your feedback before sending it.");
    appendFeedback(parsed.data.text, new Date());
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
