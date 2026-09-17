import type { GameSession } from "./types";
export function scoreFor(
  s: Pick<GameSession, "questions" | "theories" | "hintsUsed" | "status">,
) {
  if (s.status === "revealed") return 0;
  const hints = [0, 5, 15, 35][Math.min(s.hintsUsed, 3)];
  return Math.max(
    0,
    100 -
      Math.max(0, s.questions - 8) -
      Math.max(0, s.theories - 1) * 3 -
      hints,
  );
}
export function ratingFor(
  s: Pick<GameSession, "questions" | "theories" | "hintsUsed" | "status">,
) {
  if (s.status === "revealed") return "Truth revealed";
  if (s.status === "active") return "Investigation in progress";
  const score = scoreFor(s);
  return score >= 90
    ? "Master detective"
    : score >= 70
      ? "Sharp investigator"
      : "Case closed";
}
