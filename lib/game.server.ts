import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { publicCase } from "./catalog";
import { caseSecrets } from "./cases.server";
import { askHost, judgeTheory } from "./host.server";
import {
  claimAction,
  completeAction,
  releaseAction,
  insertSession,
  view,
  GameError,
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
  const c = publicCase(caseId);
  if (!c) throw new GameError("Case not found.", 404);
  const now = new Date().toISOString();
  const s: GameSession = {
    id: randomUUID(),
    caseId: c.id,
    caseVersion: caseSecrets[c.id].version,
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
  insertSession(s, owner);
  return view(s);
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
  const c = caseSecrets[s.caseId];
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
    if (s.caseVersion !== c.version)
      throw new GameError(
        "This case has been revised. Please start a new investigation.",
        409,
      );
    if (a.type === "question") {
      const result = await services.ask(s.caseId, a.text!, s.messages);
      add("player", a.text!, "question");
      add("host", answers[result.verdict], "question", result.verdict);
      s.questions++;
      if (result.verdict === "YES" || result.verdict === "NO") {
        s.clues.push({
          id: randomUUID(),
          question: a.text!,
          text: result.verdict === "YES" ? "Confirmed" : "Ruled out",
        });
      }
    } else if (a.type === "theory") {
      const result = await services.judge(s.caseId, a.text!);
      add("player", a.text!, "theory");
      s.theories++;
      if (result.solved) {
        s.status = "solved";
        s.reveal = { timeline: c.timeline, insight: c.insight };
        add(
          "host",
          "The pieces fit. You have uncovered the truth.",
          "theory",
          "SOLVED",
        );
      } else
        add(
          "host",
          result.contradicted
            ? "Part of this explanation conflicts with the case. Revisit your assumptions and try again."
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
        "Every mystery has another side. Here is what really happened.",
        "reveal",
      );
    }
    return completeAction(s, claim.lockId, a.requestId);
  } catch (e) {
    releaseAction(id, claim.lockId);
    throw e;
  }
}
