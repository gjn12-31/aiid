export type CaseId = "monopoly" | "candles" | "pilot";
export type Verdict = "YES" | "NO" | "IRRELEVANT" | "CLARIFY" | "UNKNOWN";
export type CaseSummary = {
  id: CaseId;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: string;
  minutes: string;
  surface: string;
  opening: string;
};
export type Message = {
  id: string;
  role: "player" | "host";
  text: string;
  kind: "question" | "theory" | "hint" | "opening" | "reveal";
  verdict?: Verdict | "SOLVED" | "KEEP_GOING";
};
export type ConfirmedClue = { id: string; text: string; question: string };
export type GameSession = {
  id: string;
  caseId: CaseId;
  caseVersion: number;
  status: "active" | "solved" | "revealed";
  messages: Message[];
  clues: ConfirmedClue[];
  questions: number;
  theories: number;
  hintsUsed: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  reveal?: { timeline: string[]; insight: string };
};
export type SessionView = GameSession & {
  score: number;
  rating: string;
  case: CaseSummary;
};
export type SessionSummary = {
  id: string;
  caseId: CaseId;
  status: GameSession["status"];
  updatedAt: string;
  questions: number;
};
