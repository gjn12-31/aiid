import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type {
  BuiltInCaseId,
  CaseSummary,
  GameSession,
  SessionSummary,
  SessionView,
} from "./types";
import { caseSecrets, type CaseDefinition } from "./cases.server";
import { publicCase } from "./catalog";
import { scoreFor, ratingFor } from "./rules";

export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
let db: DatabaseSync | undefined;
function database() {
  if (db) return db;
  const path = resolve(
    /* turbopackIgnore: true */ process.env.DATABASE_PATH ||
      "./data/mystery.sqlite",
  );
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, owner TEXT NOT NULL, state TEXT NOT NULL, updated TEXT NOT NULL, busy_until INTEGER NOT NULL DEFAULT 0, lock_id TEXT);
    CREATE INDEX IF NOT EXISTS session_owners ON sessions(owner, updated);
    CREATE TABLE IF NOT EXISTS actions (session_id TEXT NOT NULL, request_id TEXT NOT NULL, digest TEXT NOT NULL, result TEXT, created INTEGER NOT NULL, PRIMARY KEY(session_id,request_id));
    CREATE TABLE IF NOT EXISTS model_calls (id TEXT PRIMARY KEY, owner TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS call_times ON model_calls(created);
    CREATE TABLE IF NOT EXISTS generated_cases (id TEXT PRIMARY KEY, owner TEXT NOT NULL, summary TEXT NOT NULL, secret TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS generation_requests (owner TEXT NOT NULL, id TEXT NOT NULL, digest TEXT NOT NULL, created INTEGER NOT NULL, busy_until INTEGER NOT NULL DEFAULT 0, lock_id TEXT, session_id TEXT, PRIMARY KEY(owner,id));`);
  return db;
}
export function ownerHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function readSession(id: string, owner: string): GameSession {
  const row = database()
    .prepare("SELECT state FROM sessions WHERE id=? AND owner=?")
    .get(id, owner) as { state: string } | undefined;
  if (!row) throw new GameError("This investigation could not be found.", 404);
  return JSON.parse(row.state);
}
export function view(s: GameSession): SessionView {
  return {
    ...s,
    case: caseSummary(s.caseId),
    score: scoreFor(s),
    rating: ratingFor(s),
  };
}
export function listSessions(owner: string): SessionSummary[] {
  const rows = database()
    .prepare(
      "SELECT state FROM sessions WHERE owner=? ORDER BY updated DESC LIMIT 30",
    )
    .all(owner) as { state: string }[];
  return rows.map((r) => {
    const s: GameSession = JSON.parse(r.state);
    return {
      id: s.id,
      caseId: s.caseId,
      status: s.status,
      updatedAt: s.updatedAt,
      questions: s.questions,
      case: caseSummary(s.caseId),
    };
  });
}
function caseSummary(id: string): CaseSummary {
  const builtIn = publicCase(id);
  if (builtIn) return builtIn;
  const row = database()
    .prepare("SELECT summary FROM generated_cases WHERE id=?")
    .get(id) as { summary: string } | undefined;
  if (!row) throw new GameError("This story could not be found.", 404);
  return JSON.parse(row.summary);
}
export function readCaseDefinition(id: string, owner: string): CaseDefinition {
  const summary = publicCase(id);
  if (summary) return { summary, secret: caseSecrets[id as BuiltInCaseId] };
  const row = database()
    .prepare(
      "SELECT summary,secret FROM generated_cases WHERE id=? AND owner=?",
    )
    .get(id, owner) as { summary: string; secret: string } | undefined;
  if (!row) throw new GameError("This story could not be found.", 404);
  return { summary: JSON.parse(row.summary), secret: JSON.parse(row.secret) };
}

// Call inside a transaction so simultaneous generations and turns share one budget.
function reserveModelCall(owner: string, now: number) {
  const d = database();
  const recent = d
    .prepare(
      "SELECT count(*) AS n FROM model_calls WHERE owner=? AND created>?",
    )
    .get(owner, now - 60_000) as { n: number };
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  const daily = d
    .prepare("SELECT count(*) AS n FROM model_calls WHERE created>=?")
    .get(day.getTime()) as { n: number };
  const configured = Number(process.env.LLM_DAILY_CALL_LIMIT || "200");
  if (recent.n >= 8)
    throw new GameError(
      "A moment to think: please wait before asking another question.",
      429,
    );
  if (daily.n >= (Number.isFinite(configured) ? configured : 200))
    throw new GameError(
      "The host has reached today's limit. Your progress is saved; please return tomorrow.",
      429,
    );
  d.prepare("INSERT INTO model_calls VALUES (?,?,?)").run(
    randomUUID(),
    owner,
    now,
  );
}

export function claimGeneration(
  owner: string,
  requestId: string,
  input: unknown,
) {
  const d = database();
  const now = Date.now();
  const digest = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  d.exec("BEGIN IMMEDIATE");
  try {
    const old = d
      .prepare(
        "SELECT digest,session_id FROM generation_requests WHERE owner=? AND id=?",
      )
      .get(owner, requestId) as
      | { digest: string; session_id: string | null }
      | undefined;
    if (old && old.digest !== digest)
      throw new GameError(
        "A retry must contain the same story preferences.",
        409,
      );
    if (old?.session_id) {
      const cached = view(readSession(old.session_id, owner));
      d.exec("COMMIT");
      return { cached, lockId: "" };
    }
    const pending = d
      .prepare(
        "SELECT id FROM generation_requests WHERE owner=? AND busy_until>?",
      )
      .get(owner, now);
    if (pending)
      throw new GameError(
        "A story is already brewing. Please wait before trying again.",
        409,
      );
    const recent = d
      .prepare(
        "SELECT count(*) AS n FROM generation_requests WHERE owner=? AND created>? AND id<>?",
      )
      .get(owner, now - 600_000, requestId) as { n: number };
    if (recent.n >= 5)
      throw new GameError(
        "Five tales in ten minutes! Let the ink dry, then try again.",
        429,
      );
    const sessions = d
      .prepare("SELECT count(*) AS n FROM sessions WHERE owner=?")
      .get(owner) as { n: number };
    if (sessions.n >= 100)
      throw new GameError(
        "You have reached the investigation limit for this browser.",
        429,
      );
    reserveModelCall(owner, now);
    const lockId = randomUUID();
    d.prepare(
      "INSERT INTO generation_requests(owner,id,digest,created,busy_until,lock_id) VALUES (?,?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET busy_until=excluded.busy_until,lock_id=excluded.lock_id",
    ).run(owner, requestId, digest, now, now + 120_000, lockId);
    d.exec("COMMIT");
    return { cached: null, lockId };
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function reserveGenerationCall(
  owner: string,
  requestId: string,
  lockId: string,
) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    const held = d
      .prepare(
        "SELECT id FROM generation_requests WHERE owner=? AND id=? AND lock_id=? AND busy_until>?",
      )
      .get(owner, requestId, lockId, Date.now());
    if (!held)
      throw new GameError("This story request changed. Please retry.", 409);
    reserveModelCall(owner, Date.now());
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function finishGeneration(
  owner: string,
  requestId: string,
  lockId: string,
  c: CaseDefinition,
  s: GameSession,
) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    const held = d
      .prepare(
        "SELECT id FROM generation_requests WHERE owner=? AND id=? AND lock_id=?",
      )
      .get(owner, requestId, lockId);
    if (!held) throw new GameError("This request changed. Please retry.", 409);
    d.prepare("INSERT INTO generated_cases VALUES (?,?,?,?)").run(
      c.summary.id,
      owner,
      JSON.stringify(c.summary),
      JSON.stringify(c.secret),
    );
    insertSession(s, owner);
    d.prepare(
      "UPDATE generation_requests SET session_id=?,busy_until=0,lock_id=NULL WHERE owner=? AND id=?",
    ).run(s.id, owner, requestId);
    const result = view(s);
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function releaseGeneration(
  owner: string,
  requestId: string,
  lockId: string,
) {
  database()
    .prepare(
      "UPDATE generation_requests SET busy_until=0,lock_id=NULL WHERE owner=? AND id=? AND lock_id=?",
    )
    .run(owner, requestId, lockId);
}
export function insertSession(s: GameSession, owner: string) {
  const count = database()
    .prepare("SELECT count(*) AS n FROM sessions WHERE owner=?")
    .get(owner) as { n: number };
  if (count.n >= 100)
    throw new GameError(
      "You have reached the investigation limit for this browser.",
      429,
    );
  database()
    .prepare("INSERT INTO sessions (id,owner,state,updated) VALUES (?,?,?,?)")
    .run(s.id, owner, JSON.stringify(s), s.updatedAt);
}
export function claimAction(
  id: string,
  owner: string,
  requestId: string,
  payload: unknown,
  modelCall: boolean,
) {
  const d = database();
  const now = Date.now();
  const digest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  d.exec("BEGIN IMMEDIATE");
  try {
    const state = readSession(id, owner);
    const old = d
      .prepare(
        "SELECT digest,result FROM actions WHERE session_id=? AND request_id=?",
      )
      .get(id, requestId) as
      | { digest: string; result: string | null }
      | undefined;
    if (old && old.digest !== digest)
      throw new GameError("A retry must contain the same action.", 409);
    if (old?.result) {
      d.exec("COMMIT");
      return {
        state,
        cached: JSON.parse(old.result) as SessionView,
        lockId: "",
      };
    }
    const row = d
      .prepare("SELECT busy_until FROM sessions WHERE id=?")
      .get(id) as { busy_until: number };
    if (row.busy_until > now)
      throw new GameError(
        "The host is still processing your previous action. Please wait.",
        409,
      );
    if (state.status !== "active")
      throw new GameError(
        "This case is closed. Start a new investigation to play again.",
        409,
      );
    if (modelCall) {
      if (state.questions + state.theories >= 60)
        throw new GameError(
          "This investigation has reached 60 turns. You can still use hints or reveal the story.",
          429,
        );
      reserveModelCall(owner, now);
    }
    const lockId = randomUUID();
    d.prepare("UPDATE sessions SET busy_until=?,lock_id=? WHERE id=?").run(
      now + 50_000,
      lockId,
      id,
    );
    d.prepare("INSERT OR REPLACE INTO actions VALUES (?,?,?,?,?)").run(
      id,
      requestId,
      digest,
      null,
      now,
    );
    d.exec("COMMIT");
    return { state, lockId, cached: null };
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function completeAction(
  s: GameSession,
  lockId: string,
  requestId: string,
) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    s.updatedAt = new Date().toISOString();
    s.revision++;
    const updated = d
      .prepare(
        "UPDATE sessions SET state=?,updated=?,busy_until=0,lock_id=NULL WHERE id=? AND lock_id=?",
      )
      .run(JSON.stringify(s), s.updatedAt, s.id, lockId);
    if (updated.changes !== 1)
      throw new GameError(
        "The investigation changed. Reload to continue.",
        409,
      );
    const result = view(s);
    d.prepare(
      "UPDATE actions SET result=? WHERE session_id=? AND request_id=?",
    ).run(JSON.stringify(result), s.id, requestId);
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function releaseAction(id: string, lockId: string) {
  database()
    .prepare(
      "UPDATE sessions SET busy_until=0,lock_id=NULL WHERE id=? AND lock_id=?",
    )
    .run(id, lockId);
}
export function updateNotes(id: string, owner: string, notes: string) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    const s = readSession(id, owner);
    const row = d
      .prepare("SELECT busy_until FROM sessions WHERE id=?")
      .get(id) as { busy_until: number };
    if (row.busy_until > Date.now())
      throw new GameError("Wait for the host before saving your note.", 409);
    s.notes = notes;
    s.updatedAt = new Date().toISOString();
    s.revision++;
    d.prepare("UPDATE sessions SET state=?,updated=? WHERE id=?").run(
      JSON.stringify(s),
      s.updatedAt,
      id,
    );
    d.exec("COMMIT");
    return view(s);
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
