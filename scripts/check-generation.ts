import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateSession } from "../lib/generation.server";
import { readCaseDefinition } from "../lib/db.server";
import { judgeTheory } from "../lib/host.server";

// Opt-in: 9-15 billable calls including editorial checks and one possible rewrite per story.
const scratch = mkdtempSync(join(tmpdir(), "mystery-live-generation-"));
process.env.DATABASE_PATH = join(scratch, "test.sqlite");
try {
  for (const [style, language] of [
    ["", "en"],
    ["恐怖、阴森的中世纪城堡", "zh"],
    ["开心、温馨的小村庄，不要死亡或暴力", "zh"],
  ] as const) {
    const owner = randomUUID();
    const start = Date.now();
    const s = await generateSession(owner, {
      requestId: randomUUID(),
      style,
      language,
    });
    assert.equal(s.status, "active");
    assert.equal(s.reveal, undefined);
    const c = readCaseDefinition(s.caseId, owner);
    assert.ok(c.secret.timeline.join(" ").length <= 1800);
    assert.equal(c.summary.language, language);
    assert.deepEqual(
      c.secret.timeline,
      c.secret.facts.map((f) => f.statement),
    );
    if (language === "zh") assert.match(c.summary.surface, /[\u4e00-\u9fff]/);
    const judged = await judgeTheory(c, c.secret.timeline.join(" "));
    if (!judged.solved)
      console.error("Inconsistent generated fixture", JSON.stringify(c));
    assert.equal(judged.solved, true);
    console.log(
      JSON.stringify({
        result: "PASS",
        style: style || "(random)",
        title: s.case.title,
        surface: s.case.surface,
        ms: Date.now() - start,
      }),
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
