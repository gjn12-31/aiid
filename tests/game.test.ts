import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  actionSchema,
  startSession,
  playAction,
  type HostServices,
} from "../lib/game.server";
import { readSession, updateNotes } from "../lib/db.server";
import { checkAssessment } from "../lib/host.server";
import { caseSecrets } from "../lib/cases.server";
import { scoreFor } from "../lib/rules";
import { validOrigin } from "../lib/origin";

const scratch = mkdtempSync(join(tmpdir(), "mystery-tests-"));
process.env.DATABASE_PATH = join(scratch, "test.sqlite");
process.env.LLM_DAILY_CALL_LIMIT = "1000";
after(() => rmSync(scratch, { recursive: true, force: true }));
const fake: HostServices = {
  ask: async () => ({ verdict: "YES" }),
  judge: async () => ({ solved: false, contradicted: false }),
};
const action = (
  type: "question" | "theory" | "hint" | "giveup",
  text?: string,
) => actionSchema.parse({ type, requestId: randomUUID(), text });

test("same-origin writes use the browser destination and reject cross-site requests", () => {
  const internal = "http://localhost:3100/api/sessions";
  assert.equal(
    validOrigin("http://127.0.0.1:3100", "127.0.0.1:3100", internal),
    true,
  );
  assert.equal(
    validOrigin("https://evil.example", "127.0.0.1:3100", internal),
    false,
  );
  assert.equal(validOrigin(null, "127.0.0.1:3100", internal), false);
  assert.equal(validOrigin("null", "127.0.0.1:3100", internal), false);
  assert.equal(
    validOrigin(
      "https://game.example",
      "internal:3000",
      internal,
      "https://game.example",
    ),
    true,
  );
  assert.equal(
    validOrigin(
      "http://game.example",
      "game.example",
      internal,
      "https://game.example",
    ),
    false,
  );
});

test("a broad question records only its actual answer, never hidden facts", async () => {
  const owner = randomUUID();
  const s = startSession("candles", owner);
  const result = await playAction(
    s.id,
    owner,
    action("question", "Does the sender matter?"),
    fake,
  );
  assert.equal(result.clues[0].question, "Does the sender matter?");
  assert.equal(result.clues[0].text, "Confirmed");
  assert.equal(result.questions, 1);
  assert.equal(result.reveal, undefined);
  assert.doesNotMatch(JSON.stringify(result), /prison|father|release/i);
});
test("retries are idempotent and cannot reuse the same key for a different turn", async () => {
  const owner = randomUUID();
  const s = startSession("monopoly", owner);
  let calls = 0;
  const services: HostServices = {
    ...fake,
    ask: async () => {
      calls++;
      return { verdict: "NO" };
    },
  };
  const a = action("question", "Is he playing chess?");
  const first = await playAction(s.id, owner, a, services);
  const second = await playAction(s.id, owner, a, services);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  await assert.rejects(
    playAction(s.id, owner, { ...a, text: "Is it real?" }, services),
    /same action/,
  );
});
test("failed model calls preserve state, release the lock, and permit retry", async () => {
  const owner = randomUUID();
  const s = startSession("monopoly", owner);
  const a = action("question", "Is it a game?");
  await assert.rejects(
    playAction(s.id, owner, a, {
      ...fake,
      ask: async () => {
        throw new Error("offline");
      },
    }),
    /offline/,
  );
  assert.equal(readSession(s.id, owner).questions, 0);
  const r = await playAction(s.id, owner, a, fake);
  assert.equal(r.questions, 1);
});
test("a session has one outstanding action; notes cannot overwrite it", async () => {
  const owner = randomUUID();
  const s = startSession("monopoly", owner);
  let unlock!: (value: { verdict: "YES" }) => void;
  const wait = new Promise<{ verdict: "YES" }>((resolve) => {
    unlock = resolve;
  });
  const inFlight = playAction(
    s.id,
    owner,
    action("question", "Is it a game?"),
    { ...fake, ask: () => wait },
  );
  await assert.rejects(
    playAction(s.id, owner, action("hint"), fake),
    /still processing/,
  );
  assert.throws(() => updateNotes(s.id, owner, "A note"), /Wait for the host/);
  unlock({ verdict: "YES" });
  await inFlight;
  assert.equal(updateNotes(s.id, owner, "A note").notes, "A note");
});
test("session ownership is checked for reads, writes, and model actions", async () => {
  const owner = randomUUID();
  const other = randomUUID();
  const s = startSession("monopoly", owner);
  assert.throws(() => readSession(s.id, other), /not be found/);
  assert.throws(() => updateNotes(s.id, other, "overwrite"), /not be found/);
  await assert.rejects(
    playAction(s.id, other, action("hint"), fake),
    /not be found/,
  );
});
test("hints use authored levels and giving up returns a zero score", async () => {
  const owner = randomUUID();
  const s = startSession("candles", owner);
  const scores = [];
  for (let i = 0; i < 3; i++)
    scores.push((await playAction(s.id, owner, action("hint"), fake)).score);
  assert.deepEqual(scores, [95, 85, 65]);
  await assert.rejects(
    playAction(s.id, owner, action("hint"), fake),
    /All three/,
  );
  const revealed = await playAction(s.id, owner, action("giveup"), fake);
  assert.equal(revealed.score, 0);
  assert.equal(revealed.status, "revealed");
  assert.ok(revealed.reveal);
  await assert.rejects(
    playAction(s.id, owner, action("question", "More?"), fake),
    /closed/,
  );
});
test("partial theories do not discover missing facts; solved cases reveal after adjudication", async () => {
  const owner = randomUUID();
  const s = startSession("monopoly", owner);
  const partial = await playAction(
    s.id,
    owner,
    action("theory", "It is a game."),
    fake,
  );
  assert.equal(partial.status, "active");
  assert.equal(partial.clues.length, 0);
  assert.equal(partial.reveal, undefined);
  const solved = await playAction(
    s.id,
    owner,
    action("theory", "Complete narrative"),
    { ...fake, judge: async () => ({ solved: true, contradicted: false }) },
  );
  assert.equal(solved.status, "solved");
  assert.ok(solved.reveal);
  assert.equal(solved.score, 97);
});
test("server validates fact IDs, exact evidence, and contradictions", () => {
  const text = "A full answer.";
  const valid = {
    assessments: caseSecrets.monopoly.facts.map((f) => ({
      factId: f.id,
      status: "supported" as const,
      evidence: text,
    })),
  };
  assert.equal(checkAssessment("monopoly", text, valid).solved, true);
  assert.throws(() =>
    checkAssessment("monopoly", text, {
      assessments: valid.assessments.slice(1),
    }),
  );
  assert.throws(() =>
    checkAssessment("monopoly", text, {
      assessments: valid.assessments.map((a) => ({
        ...a,
        evidence: "invented quote",
      })),
    }),
  );
  assert.equal(
    checkAssessment("monopoly", text, {
      assessments: valid.assessments.map((a) => ({
        ...a,
        status: a.factId === "game" ? "contradicted" : "supported",
      })),
    }).solved,
    false,
  );
});
test("request validation and scoring remain deterministic", () => {
  assert.equal(
    actionSchema.safeParse({
      type: "question",
      text: " ",
      requestId: randomUUID(),
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      type: "question",
      text: "a".repeat(501),
      requestId: randomUUID(),
    }).success,
    false,
  );
  assert.equal(
    scoreFor({ questions: 10, theories: 2, hintsUsed: 1, status: "solved" }),
    90,
  );
  assert.equal(
    scoreFor({ questions: 500, theories: 10, hintsUsed: 3, status: "solved" }),
    0,
  );
});
test("per-guest rate limits bound paid calls", async () => {
  const owner = randomUUID();
  const s = startSession("monopoly", owner);
  for (let i = 0; i < 8; i++)
    await playAction(s.id, owner, action("question", "Is it a game?"), fake);
  await assert.rejects(
    playAction(s.id, owner, action("question", "One more?"), fake),
    /please wait/,
  );
});
