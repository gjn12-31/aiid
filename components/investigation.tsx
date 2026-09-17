"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Flame,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  NotebookPen,
  RotateCcw,
  X,
  Eye,
  FileText,
  Send,
  Bookmark,
} from "lucide-react";
import { Brand } from "./brand";
import { CaseArt } from "./case-art";
import type { SessionView } from "@/lib/types";
type Action = {
  type: "question" | "theory" | "hint" | "giveup";
  requestId: string;
  text?: string;
};
export function Investigation({ initial }: { initial: SessionView }) {
  const [game, setGame] = useState(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"theory" | "hint" | "giveup" | null>(null);
  const [theory, setTheory] = useState("");
  const [tab, setTab] = useState<"conversation" | "case" | "notebook">(
    initial.status === "active" && initial.messages.length === 1
      ? "case"
      : "conversation",
  );
  const [notes, setNotes] = useState(initial.notes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lock = useRef(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const active = game.status === "active";
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [game.messages.length, busy]);
  useEffect(() => {
    if (modal) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [modal]);
  async function refresh() {
    const res = await fetch(`/api/sessions/${game.id}`, { cache: "no-store" });
    if (res.ok) {
      const next: SessionView = await res.json();
      setGame((g) => (next.revision >= g.revision ? next : g));
    }
  }
  async function perform(action: Action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setPending(action);
    setModal(null);
    setTab("conversation");
    try {
      const res = await fetch(`/api/sessions/${game.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
        signal: AbortSignal.timeout(45_000),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(
          result.error || "The host could not answer. Please retry.",
        );
      setGame((g) => (result.revision >= g.revision ? result : g));
      setPending(null);
      if (action.type === "question") setInput("");
      if (action.type === "theory") setTheory("");
    } catch (e) {
      setError(
        e instanceof Error && !["TimeoutError", "AbortError"].includes(e.name)
          ? e.message
          : "The host is taking longer than expected. Retry to recover the same turn.",
      );
      await refresh().catch(() => undefined);
    } finally {
      lock.current = false;
      setBusy(false);
      textRef.current?.focus();
    }
  }
  function act(type: Action["type"], text?: string) {
    void perform({ type, text, requestId: crypto.randomUUID() });
  }
  async function saveNotes() {
    if (lock.current) return;
    lock.current = true;
    setNoteBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGame((g) => (data.revision >= g.revision ? data : g));
      setNotesSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your notes.");
    } finally {
      lock.current = false;
      setNoteBusy(false);
    }
  }
  async function restart() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: game.caseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/play/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start a new case.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="play-page">
      <nav className="play-nav">
        <Brand small />
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Back to the tavern
        </Link>
        <span className="saved-label">
          <span /> PROGRESS SAVED
        </span>
      </nav>
      <div className="mobile-tabs">
        {(["case", "conversation", "notebook"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t === "case"
              ? "Case file"
              : t === "conversation"
                ? "Investigation"
                : "Notebook"}
          </button>
        ))}
      </div>
      <div className="investigation-grid">
        <aside
          className={`case-panel ${tab === "case" ? "mobile-active" : ""}`}
        >
          <div className="case-panel-top">
            <span className="eyebrow">
              {game.case.generated
                ? "FRESHLY INKED"
                : `TALE ${game.case.number}`}
            </span>
            <span className="mini-tag">{game.case.difficulty}</span>
          </div>
          <h1>{game.case.title}</h1>
          <CaseArt id={game.caseId} />
          <div className="surface-label">
            <FileText size={14} /> THE KNOWN STORY
          </div>
          <p className="surface-text">{game.case.surface}</p>
          <div className="case-reminder">
            <Flame size={22} />
            <p>
              Question the obvious.
              <br />
              The explanation is already there.
            </p>
          </div>
          <div className="case-stats">
            <span>
              <b>{game.questions}</b> questions
            </span>
            <span>
              <b>{game.hintsUsed}/3</b> hints
            </span>
          </div>
          <button
            className="hint-button"
            disabled={!active || busy || noteBusy || game.hintsUsed >= 3}
            onClick={() => setModal("hint")}
          >
            <Lightbulb size={17} /> A nudge in the right direction{" "}
            <ChevronDown size={15} />
          </button>
          {active && (
            <button
              className="reveal-link"
              disabled={busy || noteBusy}
              onClick={() => setModal("giveup")}
            >
              Reveal the full story
            </button>
          )}
        </aside>
        <section
          className={`conversation-panel ${tab === "conversation" ? "mobile-active" : ""}`}
        >
          <header className="conversation-heading">
            <div className="host-avatar">
              <Flame size={24} />
            </div>
            <div>
              <h2>The keeper of the story</h2>
              <span>
                <span className="status-dot" />
                {active ? "Ready when you are" : "Investigation complete"}
              </span>
            </div>
            <span className="host-label">YOUR HOST</span>
          </header>
          <div
            className="conversation-scroll"
            role="log"
            aria-label="Investigation conversation"
            aria-live="polite"
          >
            <div className="chapter-divider">
              <span>THE INVESTIGATION BEGINS</span>
            </div>
            {game.messages.map((m) => (
              <article
                key={m.id}
                className={`message ${m.role} ${m.kind === "hint" ? "hint-message" : ""}`}
              >
                <div className="message-label">
                  {m.role === "player"
                    ? m.kind === "theory"
                      ? "YOUR THEORY"
                      : "YOU"
                    : m.kind === "hint"
                      ? "A LITTLE DIRECTION"
                      : "THE HOST"}
                  {m.verdict && (
                    <span
                      className={`verdict verdict-${m.verdict.toLowerCase()}`}
                    >
                      {m.verdict.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
                <p>{m.text}</p>
              </article>
            ))}
            {busy && (
              <div className="thinking">
                <span />
                <span />
                <span />
                <em>
                  {pending?.type === "theory"
                    ? "Connecting the pieces..."
                    : "Considering your question..."}
                </em>
              </div>
            )}
            {game.reveal && (
              <section className="case-resolution">
                <span className="resolution-seal">
                  {game.status === "solved" ? (
                    <Check size={28} />
                  ) : (
                    <Eye size={26} />
                  )}
                </span>
                <span className="eyebrow">THE OTHER SIDE OF THE STORY</span>
                <h2>
                  {game.status === "solved"
                    ? "Mystery, solved."
                    : "The truth, revealed."}
                </h2>
                <ol>
                  {game.reveal.timeline.map((t, i) => (
                    <li key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <p>{t}</p>
                    </li>
                  ))}
                </ol>
                <div className="insight">
                  <Lightbulb size={18} />
                  <p>{game.reveal.insight}</p>
                </div>
                <div className="resolution-score">
                  <b>
                    {game.status === "solved"
                      ? `${game.score}/100`
                      : "Case reviewed"}
                  </b>
                  <span>{game.rating}</span>
                </div>
                <Link className="button dark" href="/">
                  Find your next mystery{" "}
                  <ArrowUp size={16} className="rotate-arrow" />
                </Link>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void restart()}
                >
                  <RotateCcw size={14} /> Play this case again
                </button>
              </section>
            )}
            <div ref={endRef} />
          </div>
          {error && (
            <div className="action-error" role="alert">
              <p>{error}</p>
              {pending && active && (
                <button disabled={busy} onClick={() => void perform(pending)}>
                  Retry this turn
                </button>
              )}
            </div>
          )}
          {active && (
            <div className="composer">
              <div className="composer-top">
                <span>FOLLOW YOUR CURIOSITY</span>
                <button
                  disabled={busy || noteBusy}
                  onClick={() => setModal("theory")}
                >
                  <LockKeyhole size={13} /> I have a theory
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim() && !busy && !noteBusy)
                    act("question", input.trim());
                }}
              >
                <textarea
                  ref={textRef}
                  aria-label="Your yes-or-no question"
                  placeholder="Could it have happened somewhere else?"
                  value={input}
                  maxLength={500}
                  rows={2}
                  disabled={busy || noteBusy}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      if (input.trim() && !busy && !noteBusy)
                        act("question", input.trim());
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy || noteBusy}
                  aria-label="Ask the host"
                >
                  {busy ? (
                    <LoaderCircle size={19} className="spin" />
                  ) : (
                    <ArrowUp size={20} />
                  )}
                </button>
              </form>
              <p className="composer-foot">
                One yes-or-no question at a time.{" "}
                <span>{input.length}/500</span>
              </p>
            </div>
          )}
        </section>
        <aside
          className={`notebook-panel ${tab === "notebook" ? "mobile-active" : ""}`}
        >
          <header>
            <NotebookPen size={18} />
            <h2>Your notebook</h2>
            <span>{game.clues.length}</span>
          </header>
          <p className="notebook-intro">
            The trail so far. Only what you actually asked and learned.
          </p>
          <div className="clue-list">
            {game.clues.length ? (
              game.clues.map((c, i) => (
                <div className="clue" key={c.id}>
                  <span className="clue-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p>{c.question}</p>
                    <span
                      className={
                        c.text === "Confirmed" ? "clue-yes" : "clue-no"
                      }
                    >
                      {c.text === "Confirmed" ? (
                        <Check size={11} />
                      ) : (
                        <X size={11} />
                      )}{" "}
                      {c.text}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="notebook-empty">
                <Bookmark size={25} strokeWidth={1} />
                <p>
                  A blank page,
                  <br />
                  full of possibilities.
                </p>
                <span>Your confirmed answers will appear here.</span>
              </div>
            )}
          </div>
          <div className="personal-notes">
            <label htmlFor="notes">YOUR OWN THOUGHTS</label>
            <textarea
              id="notes"
              placeholder="A hunch, a connection, something to ask next..."
              maxLength={3000}
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSaved(false);
              }}
            />
            <button
              disabled={busy || noteBusy || notes === game.notes}
              onClick={() => void saveNotes()}
            >
              {noteBusy
                ? "Saving..."
                : notesSaved || notes === game.notes
                  ? "Notes saved"
                  : "Save notes"}{" "}
              <Check size={12} />
            </button>
          </div>
          <div className="score-note">
            <span>
              DETECTIVE SCORE <b>{game.score}</b>
            </span>
            <p>
              First 8 questions are free. Then -1 per question; extra theories
              -3. Hints cost 5, 10, and 20 points.
            </p>
          </div>
        </aside>
      </div>
      <dialog
        ref={modalRef}
        className="game-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <button
          className="dialog-close"
          aria-label="Close dialog"
          onClick={() => setModal(null)}
        >
          <X size={20} />
        </button>
        {modal === "theory" && (
          <>
            <span className="eyebrow">CONNECT THE PIECES</span>
            <h2>What really happened?</h2>
            <p>
              Tell the whole story in your own words. Explain who was involved,
              what happened, and why.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (theory.trim()) act("theory", theory.trim());
              }}
            >
              <textarea
                aria-label="Your complete theory"
                autoFocus
                value={theory}
                onChange={(e) => setTheory(e.target.value)}
                placeholder="I think the real explanation is..."
                rows={6}
                maxLength={1800}
              />
              <span className="dialog-help">
                {theory.length}/1800 characters · Your{" "}
                {game.theories
                  ? "next attempt costs 3 points"
                  : "first attempt is free"}
              </span>
              <button
                className="button dark"
                type="submit"
                disabled={!theory.trim() || busy}
              >
                Submit my theory <Send size={15} />
              </button>
            </form>
          </>
        )}
        {modal === "hint" && (
          <>
            <Lightbulb size={32} strokeWidth={1.2} />
            <h2>A little direction?</h2>
            <p>
              Hint {game.hintsUsed + 1} will reveal a little more of the story
              and cost {[5, 10, 20][game.hintsUsed]} points.
            </p>
            <button className="button dark" onClick={() => act("hint")}>
              Open hint {game.hintsUsed + 1} <Eye size={16} />
            </button>
            <button className="text-button" onClick={() => setModal(null)}>
              I will keep thinking
            </button>
          </>
        )}
        {modal === "giveup" && (
          <>
            <Eye size={32} strokeWidth={1.2} />
            <h2>Turn the final page?</h2>
            <p>
              This will reveal the entire explanation and close this
              investigation without a solved score.
            </p>
            <button className="button dark" onClick={() => act("giveup")}>
              Reveal the story <Eye size={16} />
            </button>
            <button className="text-button" onClick={() => setModal(null)}>
              Keep the mystery alive
            </button>
          </>
        )}
      </dialog>
    </main>
  );
}
