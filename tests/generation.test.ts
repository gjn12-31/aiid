import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  generationInput,
  generatedStorySchema,
  generateSession as generateReviewedSession,
  storyBrief,
} from "../lib/generation.server";
const approved = async () => ({ acceptable: true, feedback: "" });
const generateSession = (
  owner: string,
  raw: unknown,
  compose: Parameters<typeof generateReviewedSession>[2],
) => generateReviewedSession(owner, raw, compose, approved);
import { caseSecrets } from "../lib/cases.server";
import { publicCase } from "../lib/catalog";
import {
  readCaseDefinition,
  readSession,
  listSessions,
  view,
} from "../lib/db.server";
import { playAction, actionSchema, startSession } from "../lib/game.server";
const scratch = mkdtempSync(join(tmpdir(), "mystery-generation-"));
process.env.DATABASE_PATH = join(scratch, "test.sqlite");
process.env.LLM_DAILY_CALL_LIMIT = "1000";
after(() => rmSync(scratch, { recursive: true, force: true }));
const fixture = () => ({
  title: "An Unusual Birthday",
  subtitle: "The last candle changes everything.",
  surface: publicCase("candles")!.surface,
  ...structuredClone(caseSecrets.candles),
});
const input = (style = "") => ({
  requestId: randomUUID(),
  style,
  language: "en" as const,
});
const action = (
  type: "question" | "theory" | "hint" | "giveup",
  text?: string,
) => actionSchema.parse({ type, text, requestId: randomUUID() });

test("empty or omitted styles create a varied, retry-stable brief", () => {
  const parsed = generationInput.parse({ requestId: randomUUID() });
  assert.equal(parsed.style, "");
  assert.equal(parsed.language, "en");
  assert.deepEqual(storyBrief(parsed), storyBrief(parsed));
  assert.ok(storyBrief(parsed).mood);
  assert.ok(storyBrief(parsed).setting);
  const briefs = Array.from({ length: 12 }, () =>
    storyBrief(generationInput.parse(input())),
  );
  assert.ok(new Set(briefs.map((b) => b.nonce)).size === 12);
  assert.ok(new Set(briefs.map((b) => b.setting + ":" + b.object)).size > 1);
  assert.equal(storyBrief(generationInput.parse(input("开心"))).mood, "开心");
  assert.equal(
    generationInput.safeParse({ ...input(), style: "a".repeat(241) }).success,
    false,
  );
});
test("generated secrets stay off session and shelf payloads, and are isolated by owner", async () => {
  const owner = randomUUID();
  const s = await generateSession(owner, input(), async () => fixture());
  assert.equal(s.case.generated, true);
  assert.match(s.caseId, /^tale-/);
  assert.doesNotMatch(
    JSON.stringify(s),
    /prison|father|counterexamples|"required"|"facts"/i,
  );
  assert.doesNotMatch(
    JSON.stringify(listSessions(owner)),
    /prison|father|counterexamples|"required"|"facts"/i,
  );
  assert.deepEqual(view(readSession(s.id, owner)), s);
  assert.deepEqual(
    readCaseDefinition(s.caseId, owner).secret.facts,
    caseSecrets.candles.facts,
  );
  assert.throws(
    () => readCaseDefinition(s.caseId, randomUUID()),
    /not be found/,
  );
  assert.throws(() => startSession(s.caseId, randomUUID()), /not be found/);
});
test("lost-response retries reuse one story and replay preserves its truth", async () => {
  const owner = randomUUID(),
    request = input("eerie");
  let calls = 0;
  const compose = async () => {
    calls++;
    return fixture();
  };
  const first = await generateSession(owner, request, compose);
  const second = await generateSession(owner, request, compose);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  await assert.rejects(
    generateSession(owner, { ...request, style: "happy" }, compose),
    /same story preferences/,
  );
  const replay = startSession(first.caseId, owner);
  assert.notEqual(replay.id, first.id);
  assert.deepEqual(replay.case, first.case);
});
test("invalid generations leave no playable orphan and release the reservation", async () => {
  const owner = randomUUID(),
    request = input();
  const bad = fixture();
  bad.required = ["invented", "father", "release"];
  assert.equal(generatedStorySchema.safeParse(bad).success, false);
  await assert.rejects(
    generateSession(owner, request, async () => bad),
    /did not pass/,
  );
  assert.equal(listSessions(owner).length, 0);
  await assert.rejects(
    generateSession(owner, request, async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
  const s = await generateSession(owner, request, async () => fixture());
  assert.equal(s.status, "active");
  assert.equal(listSessions(owner).length, 1);
});
test("only one story per guest can be generated at a time", async () => {
  const owner = randomUUID();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = generateSession(owner, input(), async () => {
    await gate;
    return fixture();
  });
  await assert.rejects(
    generateSession(owner, input(), async () => fixture()),
    /already brewing/,
  );
  release();
  await first;
});
test("every game action reads the saved generated facts rather than inventing a new story", async () => {
  const owner = randomUUID();
  const s = await generateSession(
    owner,
    { ...input("开心"), language: "zh" },
    async () => fixture(),
  );
  const saved = readCaseDefinition(s.caseId, owner);
  const services = {
    ask: async (c: unknown) => {
      assert.deepEqual(c, saved);
      return { verdict: "YES" as const };
    },
    judge: async (c: unknown) => {
      assert.deepEqual(c, saved);
      return { solved: true, contradicted: false };
    },
  };
  const asked = await playAction(
    s.id,
    owner,
    action("question", "Does the sender matter?"),
    services,
  );
  assert.equal(asked.messages.at(-1)?.text, "是的。");
  assert.equal(asked.reveal, undefined);
  const hint = await playAction(s.id, owner, action("hint"), services);
  assert.equal(hint.messages.at(-1)?.text, saved.secret.hints[0]);
  const solved = await playAction(
    s.id,
    owner,
    action("theory", saved.secret.timeline.join(" ")),
    services,
  );
  assert.equal(solved.status, "solved");
  assert.deepEqual(solved.reveal?.timeline, saved.secret.timeline);
  assert.deepEqual(readCaseDefinition(s.caseId, owner), saved);
});
test("story generation and host turns share the model-call budget", async () => {
  const owner = randomUUID();
  let s;
  for (let i = 0; i < 3; i++)
    s = await generateSession(owner, input(), async () => fixture());
  const fake = {
    ask: async () => ({ verdict: "YES" as const }),
    judge: async () => ({ solved: false, contradicted: false }),
  };
  for (let i = 0; i < 2; i++)
    await playAction(
      s!.id,
      owner,
      action("question", "Is the sender important?"),
      fake,
    );
  await assert.rejects(
    playAction(s!.id, owner, action("question", "One more?"), fake),
    /please wait/,
  );
  process.env.LLM_DAILY_CALL_LIMIT = "0";
  try {
    await assert.rejects(
      generateSession(randomUUID(), input(), async () => fixture()),
      /today's limit/,
    );
  } finally {
    process.env.LLM_DAILY_CALL_LIMIT = "1000";
  }
});

test("rejected stories are rewritten once and never published before editorial approval", async () => {
  const owner = randomUUID();
  let calls = 0,
    reviews = 0;
  const s = await generateReviewedSession(
    owner,
    input(),
    async (_brief, feedback) => {
      calls++;
      if (calls === 2)
        assert.equal(feedback, "The mechanism contradicts the surface.");
      return {
        ...fixture(),
        title: calls === 1 ? "Rejected first draft" : "Approved second draft",
      };
    },
    async () => ({
      acceptable: ++reviews === 2,
      feedback: "The mechanism contradicts the surface.",
    }),
  );
  assert.equal(calls, 2);
  assert.equal(s.case.title, "Approved second draft");
  assert.equal(listSessions(owner).length, 1);
  const other = randomUUID();
  await assert.rejects(
    generateReviewedSession(
      other,
      input(),
      async () => fixture(),
      async () => ({ acceptable: false, feedback: "Not inferable." }),
    ),
    /did not pass/,
  );
  assert.equal(listSessions(other).length, 0);
});

test("the ten-minute generation limit survives the shorter model-call window", async () => {
  const owner = randomUUID();
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    for (let i = 0; i < 5; i++) {
      await generateSession(owner, input(), async () => fixture());
      now += 61_000;
    }
    await assert.rejects(
      generateSession(owner, input(), async () => fixture()),
      /Five tales/,
    );
  } finally {
    Date.now = originalNow;
  }
});
