import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { CaseDefinition } from "./cases.server";
import { askHost, judgeTheory } from "./host.server";
import {
  claimAction,
  completeAction,
  releaseAction,
  insertSession,
  view,
  GameError,
  readCaseDefinition,
} from "./db.server";
import type { GameSession, Message, Verdict } from "./types";
export const actionSchema = z
  .object({
    type: z.enum(["question", "theory", "hint", "giveup"]),
    requestId: z.uuid(),
    text: z.string().trim().max(1800).optional(),
  })
  .superRefine((v, ctx) => {
    if (["question", "theory"].includes(v.type) && !v.text)
      ctx.addIssue({
        code: "custom",
        message: "Write your question or explanation first.",
      });
    if (v.type === "question" && (v.text?.length || 0) > 500)
      ctx.addIssue({
        code: "custom",
        message: "Keep questions under 500 characters.",
      });
  });
export const answers: Record<Verdict, string> = {
  YES: "Yes.",
  NO: "No.",
  IRRELEVANT: "That detail does not affect the explanation.",
  CLARIFY:
    "Please ask one clear yes-or-no question at a time, without assuming an unconfirmed detail.",
  UNKNOWN: "The case does not establish that detail. Try another angle.",
};
export function startSession(caseId: string, owner: string) {
  const c = readCaseDefinition(caseId, owner);
  const s = newSession(c);
  insertSession(s, owner);
  return view(s);
}
export function newSession({
  summary: c,
  secret,
}: CaseDefinition): GameSession {
  const now = new Date().toISOString();
  const s: GameSession = {
    id: randomUUID(),
    caseId: c.id,
    caseVersion: secret.version,
    status: "active",
    messages: [
      { id: randomUUID(), role: "host", text: c.opening, kind: "opening" },
    ],
    clues: [],
    questions: 0,
    theories: 0,
    hintsUsed: 0,
    notes: "",
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
  return s;
}
export type HostServices = { ask: typeof askHost; judge: typeof judgeTheory };
export async function playAction(
  id: string,
  owner: string,
  a: z.infer<typeof actionSchema>,
  services: HostServices = { ask: askHost, judge: judgeTheory },
) {
  const claim = claimAction(
    id,
    owner,
    a.requestId,
    { type: a.type, text: a.text },
    a.type === "question" || a.type === "theory",
  );
  if (claim.cached) return claim.cached;
  const s = claim.state;
  const add = (
    role: Message["role"],
    text: string,
    kind: Message["kind"],
    verdict?: Message["verdict"],
  ) =>
    s.messages.push({
      id: randomUUID(),
      role,
      text,
      kind,
      ...(verdict ? { verdict } : {}),
    });
  try {
    const definition = readCaseDefinition(s.caseId, owner);
    const c = definition.secret;
    const chinese = definition.summary.language === "zh";
    if (s.caseVersion !== c.version)
      throw new GameError(
        "This case has been revised. Please start a new investigation.",
        409,
      );
    if (a.type === "question") {
      const result = await services.ask(definition, a.text!, s.messages);
      add("player", a.text!, "question");
      const chineseAnswers: Record<Verdict, string> = {
        YES: "是的。",
        NO: "不是。",
        IRRELEVANT: "这个细节与真相无关。",
        CLARIFY: "请一次只问一个清晰的是非问题，不要预设尚未确认的事实。",
        UNKNOWN: "故事没有确定这个细节，可以换个角度试试。",
      };
      add(
        "host",
        (definition.summary.language === "zh" ? chineseAnswers : answers)[
          result.verdict
        ],
        "question",
        result.verdict,
      );
      s.questions++;
      if (result.verdict === "YES" || result.verdict === "NO") {
        s.clues.push({
          id: randomUUID(),
          question: a.text!,
          text: result.verdict === "YES" ? "Confirmed" : "Ruled out",
        });
      }
    } else if (a.type === "theory") {
      const result = await services.judge(definition, a.text!);
      add("player", a.text!, "theory");
      s.theories++;
      if (result.solved) {
        s.status = "solved";
        s.reveal = { timeline: c.timeline, insight: c.insight };
        add(
          "host",
          chinese
            ? "线索已经串起来了。你找到了故事的真相。"
            : "The pieces fit. You have uncovered the truth.",
          "theory",
          "SOLVED",
        );
      } else
        add(
          "host",
          result.contradicted
            ? chinese
              ? "这个解释有一部分与故事事实冲突。重新检查假设，再试一次。"
              : "Part of this explanation conflicts with the case. Revisit your assumptions and try again."
            : chinese
              ? "还缺少关键联系。请解释谁参与了、发生了什么，以及为什么。"
              : "There is more to connect. Explain who was involved, what happened, and why.",
          "theory",
          "KEEP_GOING",
        );
    } else if (a.type === "hint") {
      if (s.hintsUsed >= c.hints.length)
        throw new GameError("All three hints have been opened.");
      add("host", c.hints[s.hintsUsed], "hint");
      s.hintsUsed++;
    } else {
      s.status = "revealed";
      s.reveal = { timeline: c.timeline, insight: c.insight };
      add(
        "host",
        chinese
          ? "每个谜题都有另一面。下面就是完整的真相。"
          : "Every mystery has another side. Here is what really happened.",
        "reveal",
      );
    }
    return completeAction(s, claim.lockId, a.requestId);
  } catch (e) {
    releaseAction(id, claim.lockId);
    throw e;
  }
}
