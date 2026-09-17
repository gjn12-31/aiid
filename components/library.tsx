"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Sparkles,
  LoaderCircle,
  Check,
  Eye,
  MessageCircle,
  NotebookPen,
  Dices,
  WandSparkles,
  ScrollText,
} from "lucide-react";
import { Brand, Footer } from "./brand";
import { CaseArt } from "./case-art";
import { TavernScene } from "./tavern-scene";
import { catalog } from "@/lib/catalog";
import type { SessionSummary } from "@/lib/types";
type BrewRequest = { requestId: string; style: string; language: "en" | "zh" };
const moods = [
  { label: "Spooky", value: "恐怖 / spooky, a chilling mystery", icon: "☾" },
  { label: "Eerie", value: "阴森 / eerie and unsettling", icon: "✧" },
  { label: "Cheerful", value: "开心 / cheerful and heartwarming", icon: "☀" },
  { label: "Absurd", value: "荒诞 / absurd and funny", icon: "⁂" },
];
export function Library({
  sessions,
  available,
}: {
  sessions: SessionSummary[];
  available: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState("");
  const [error, setError] = useState("");
  const [style, setStyle] = useState("");
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [filter, setFilter] = useState("all");
  const lock = useRef(false);
  const retry = useRef<BrewRequest | null>(null);
  const generated = sessions.filter(
    (s, i, all) =>
      s.case?.generated &&
      all.findIndex((other) => other.caseId === s.caseId) === i,
  );
  function changeStyle(value: string) {
    setStyle(value);
    retry.current = null;
    setError("");
  }
  async function brew() {
    if (lock.current) return;
    lock.current = true;
    setStarting("brew");
    setError("");
    const input = retry.current ?? {
      requestId: crypto.randomUUID(),
      style: style.trim(),
      language,
    };
    retry.current = input;
    try {
      // Establish the guest before a paid request so a lost response can be retried safely.
      const guest = await fetch("/api/guest", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
      });
      if (!guest.ok)
        throw new Error("Could not open the tavern. Please try again.");
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(115_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/play/${data.id}`);
    } catch (e) {
      setError(
        e instanceof Error && !["TimeoutError", "AbortError"].includes(e.name)
          ? e.message
          : "The storyteller needs a little longer. Retry to recover this same tale.",
      );
      lock.current = false;
      setStarting("");
    }
  }
  async function start(id: string) {
    if (lock.current) return;
    lock.current = true;
    setStarting(id);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/play/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this tale.");
      lock.current = false;
      setStarting("");
    }
  }
  return (
    <main className="tavern-page">
      <nav className="tavern-nav">
        <Brand />
        <div className="tavern-links">
          <a href="#collection">The story shelf</a>
          <a href="#how-it-works">How to play</a>
        </div>
        <span className="tavern-edition">A PENNY FOR YOUR THEORY</span>
      </nav>
      <section className="tavern-hero">
        <div className="tavern-intro">
          <span className="eyebrow">
            <span>✦</span> COME IN. THE CANDLES ARE LIT.
          </span>
          <h1>
            Something strange
            <br />
            is <em>brewing.</em>
          </h1>
          <p>
            A peculiar tale. A well-kept secret.
            <br />
            Bring your questions. Leave your assumptions.
          </p>
          <div className="hero-flourish">
            <span />✧<span />
          </div>
          <span className="handwritten">
            One more question might change everything.
          </span>
        </div>
        <TavernScene />
      </section>
      <section
        className={`brew-panel ${starting === "brew" ? "is-brewing" : ""}`}
        aria-labelledby="brew-heading"
        id="brew"
      >
        <div className="brew-heading">
          <span className="wax-seal">
            <WandSparkles size={25} />
          </span>
          <div>
            <h2 id="brew-heading">What shall we brew?</h2>
            <p>Give your story a mood, or let fate decide.</p>
          </div>
          <span className="brew-mark">
            A FRESH TALE
            <br />
            EVERY TIME
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void brew();
          }}
        >
          <div className="brew-fields">
            <label className="sr-only" htmlFor="story-style">
              Story style (optional)
            </label>
            <textarea
              id="story-style"
              value={style}
              maxLength={240}
              rows={2}
              disabled={!!starting}
              onChange={(e) => changeStyle(e.target.value)}
              placeholder="A haunted castle? A cheerful village? Leave blank for a surprise..."
            />
            <div className="mood-row">
              <span className="mood-label">A pinch of...</span>
              {moods.map((m) => (
                <button
                  type="button"
                  key={m.label}
                  className={`mood-chip ${style === m.value ? "chosen" : ""}`}
                  aria-pressed={style === m.value}
                  disabled={!!starting}
                  onClick={() => changeStyle(style === m.value ? "" : m.value)}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                </button>
              ))}
              <button
                type="button"
                className="random-mood"
                disabled={!!starting}
                onClick={() => changeStyle("")}
                aria-label="Clear style for a random story"
              >
                <Dices size={17} /> Surprise me
              </button>
            </div>
          </div>
          <div className="brew-submit">
            <label htmlFor="story-language">
              Story language{" "}
              <select
                id="story-language"
                value={language}
                disabled={!!starting}
                onChange={(e) => {
                  setLanguage(e.target.value as "en" | "zh");
                  retry.current = null;
                }}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </label>
            <button
              className="brew-button"
              disabled={!!starting || !available}
              type="submit"
            >
              {starting === "brew" ? (
                <LoaderCircle className="spin" size={20} />
              ) : (
                <WandSparkles size={21} />
              )}
              <span>
                {starting === "brew"
                  ? "Brewing your tale..."
                  : error && retry.current
                    ? "Retry this brew"
                    : "Brew a mystery"}
              </span>
            </button>
            <p>Leave it blank. Take a chance.</p>
          </div>
        </form>
        {starting === "brew" && (
          <div className="brew-status" role="status">
            <span className="ink-dots">● ● ●</span> The storyteller is weaving a
            new mystery. A good twist takes a moment.
          </div>
        )}
        {!available && (
          <p className="brew-error" role="status">
            The storyteller is away. Your saved tales are still here.
          </p>
        )}
        {error && (
          <p className="brew-error" role="alert">
            {error}
          </p>
        )}
        <div className="paper-corner" aria-hidden="true" />
      </section>
      {generated.length > 0 && (
        <section
          className="tale-shelf generated-shelf"
          aria-labelledby="your-tales"
        >
          <div className="shelf-heading">
            <div>
              <span className="eyebrow">INKED JUST FOR YOU</span>
              <h2 id="your-tales">
                Your conjured tales <span>({generated.length})</span>
              </h2>
            </div>
            <ScrollText size={28} />
          </div>
          <div className="generated-grid">
            {generated.map((s) => (
              <article className="conjured-card" key={s.caseId}>
                <div className="conjured-icon">
                  <ScrollText size={31} strokeWidth={1.3} />
                </div>
                <div>
                  <span className="tale-mood">{s.case!.mood}</span>
                  <h3>{s.case!.title}</h3>
                  <p>{s.case!.subtitle}</p>
                </div>
                <button
                  disabled={!!starting}
                  onClick={() => router.push(`/play/${s.id}`)}
                >
                  {s.status === "active"
                    ? "Continue the tale"
                    : "Revisit the tale"}
                  <ArrowRight size={17} />
                </button>
                <span className="tale-state">
                  {s.status === "solved" ? (
                    <>
                      <Check size={12} /> SOLVED
                    </>
                  ) : s.status === "revealed" ? (
                    "REVEALED"
                  ) : (
                    `${s.questions} QUESTIONS`
                  )}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="tale-shelf" id="collection">
        <div className="shelf-heading">
          <div>
            <span className="eyebrow">
              DUSTY BOOKS. DELICIOUSLY ODD SECRETS.
            </span>
            <h2>Stories on the shelf</h2>
          </div>
          <div className="shelf-filters" aria-label="Filter cases">
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              All tales
            </button>
            <button
              className={filter === "active" ? "selected" : ""}
              onClick={() => setFilter("active")}
            >
              Unfinished
            </button>
          </div>
        </div>
        <div className="tale-grid">
          {catalog
            .filter(
              (c) =>
                filter === "all" ||
                sessions.some(
                  (s) => s.caseId === c.id && s.status === "active",
                ),
            )
            .map((c) => {
              const active = sessions.find(
                (s) => s.caseId === c.id && s.status === "active",
              );
              const solved = sessions.some(
                (s) => s.caseId === c.id && s.status === "solved",
              );
              return (
                <article className="tale-card" key={c.id}>
                  <div className="tale-illustration">
                    <CaseArt id={c.id} />
                    <span className="tale-number">TALE {c.number}</span>
                    {solved && (
                      <span className="tale-solved">
                        <Check size={13} /> SOLVED
                      </span>
                    )}
                  </div>
                  <div className="tale-content">
                    <span className="tale-category">{c.category}</span>
                    <h3>{c.title}</h3>
                    <p>{c.subtitle}</p>
                    <div className="tale-meta">
                      <span>
                        <Sparkles size={13} />
                        {c.difficulty}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {c.minutes}
                      </span>
                    </div>
                    <button
                      disabled={!!starting || (!available && !active)}
                      onClick={() =>
                        active
                          ? router.push(`/play/${active.id}`)
                          : void start(c.id)
                      }
                    >
                      {active ? "Continue the tale" : "Unroll the story"}
                      {starting === c.id ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : (
                        <ArrowRight size={17} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
        {filter === "active" &&
          !sessions.some(
            (s) => !s.case?.generated && s.status === "active",
          ) && (
            <div className="shelf-empty">
              <Eye size={28} />
              <p>No unfinished tales on this shelf. A fresh mystery awaits.</p>
              <button onClick={() => setFilter("all")}>Browse the shelf</button>
            </div>
          )}
      </section>
      <section className="tavern-how" id="how-it-works">
        <div className="how-title">
          <span className="eyebrow">THE TAVERN'S THREE RULES</span>
          <h2>
            Curiosity is your
            <br />
            only weapon.
          </h2>
          <p>
            Turtle Soup: a game of lateral thinking.
            <br />
            No dice rolls. Just the right questions.
          </p>
        </div>
        {[
          {
            n: "I",
            icon: Eye,
            title: "Read the strange",
            body: "A scene that should not make sense. Notice what feels out of place.",
          },
          {
            n: "II",
            icon: MessageCircle,
            title: "Question the keeper",
            body: "Ask one yes-or-no question at a time. The truth will not change.",
          },
          {
            n: "III",
            icon: NotebookPen,
            title: "Unravel the truth",
            body: "Gather your clues and tell the whole story. Every odd detail has a reason.",
          },
        ].map((s) => (
          <div className="tavern-rule" key={s.n}>
            <span className="rule-number">{s.n}</span>
            <s.icon size={26} strokeWidth={1.5} />
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </section>
      <Footer />
    </main>
  );
}
