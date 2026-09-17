"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Sparkles,
  LoaderCircle,
  Check,
  Eye,
  MessageCircle,
  NotebookPen,
} from "lucide-react";
import { Brand, Footer } from "./brand";
import { CaseArt } from "./case-art";
import { catalog } from "@/lib/catalog";
import type { SessionSummary } from "@/lib/types";
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
  const [filter, setFilter] = useState("all");
  async function start(id: string) {
    if (starting) return;
    setStarting(id);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/play/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the case.");
      setStarting("");
    }
  }
  return (
    <main className="library-page">
      <nav className="main-nav">
        <Brand />
        <div className="nav-links">
          <a href="#collection">The collection</a>
          <a href="#how-it-works">
            How to play <ArrowUpRight size={14} />
          </a>
        </div>
        <span className="edition">
          VOL. 01 <span> / </span> THE UNEXPECTED
        </span>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-star">✳</span> SMALL QUESTIONS. UNEXPECTED
            TRUTHS.
          </span>
          <h1>
            There is always
            <br />
            another side
            <br />
            to <em>the story.</em>
          </h1>
          <p>
            A strange scene. A hidden explanation.
            <br />
            Ask the right questions and discover what
            <br className="desktop-br" /> everyone else overlooked.
          </p>
          <a className="button light" href="#collection">
            Open an investigation <ArrowUpRight size={18} />
          </a>
          <span className="hero-note">
            No account needed. Just a curious mind.
          </span>
        </div>
        <div className="hero-exhibit">
          <div className="exhibit-top">
            <span>FROM THE ARCHIVES</span>
            <span>001 — 003</span>
          </div>
          <div className="hero-file">
            <div className="file-tab">CASE No. 002</div>
            <CaseArt id="candles" hero />
            <div className="exhibit-caption">
              <span>
                ONE LESS CANDLE.
                <br />
                ONE MORE QUESTION.
              </span>
              <p>
                Why would an empty
                <br />
                birthday cake bring joy?
              </p>
            </div>
          </div>
          <span className="archive-stamp">
            NOTHING IS
            <br />
            QUITE AS IT SEEMS
          </span>
        </div>
      </section>
      <section className="collection" id="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR NEXT MYSTERY</span>
            <h2>
              The case files<span> / 03</span>
            </h2>
          </div>
          <div className="filter-tabs" aria-label="Filter cases">
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              All cases
            </button>
            <button
              className={filter === "active" ? "selected" : ""}
              onClick={() => setFilter("active")}
            >
              In progress
            </button>
          </div>
        </div>
        {!available && (
          <p className="notice">
            The host is temporarily unavailable. Existing investigations are
            safely saved.
          </p>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="case-grid">
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
                <article className="case-card" key={c.id}>
                  <div className="case-image">
                    <CaseArt id={c.id} />
                    <span className="case-tag">CASE {c.number}</span>
                    {solved && (
                      <span className="solved-tag">
                        <Check size={12} /> SOLVED
                      </span>
                    )}
                  </div>
                  <div className="case-copy">
                    <span className="case-category">{c.category}</span>
                    <h3>{c.title}</h3>
                    <p>{c.subtitle}</p>
                    <div className="case-meta">
                      <span>
                        <span className={`difficulty-dot ${c.id}`} />
                        {c.difficulty}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {c.minutes}
                      </span>
                    </div>
                    <button
                      disabled={!!starting || (!available && !active)}
                      className="case-open"
                      onClick={() =>
                        active ? router.push(`/play/${active.id}`) : start(c.id)
                      }
                    >
                      <span>
                        {active ? "Continue investigating" : "Open case file"}
                      </span>
                      {starting === c.id ? (
                        <LoaderCircle className="spin" size={18} />
                      ) : (
                        <ArrowRight size={18} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
        {filter === "active" &&
          !sessions.some((s) => s.status === "active") && (
            <div className="empty-state">
              <Eye size={30} />
              <h3>Your next story is waiting.</h3>
              <p>Open a case to begin your first investigation.</p>
              <button className="text-button" onClick={() => setFilter("all")}>
                Explore all cases <ArrowRight size={16} />
              </button>
            </div>
          )}
      </section>
      <section id="how-it-works" className="how-section">
        <div className="how-intro">
          <span className="eyebrow">THE ART OF ASKING</span>
          <h2>
            You bring the questions.
            <br />
            We keep the secret.
          </h2>
          <p>Inspired by Turtle Soup, the classic lateral-thinking game.</p>
        </div>
        <div className="how-steps">
          {[
            {
              icon: Eye,
              n: "01",
              title: "Notice the strange",
              body: "Read a scene that does not quite add up. Every word might matter.",
            },
            {
              icon: MessageCircle,
              n: "02",
              title: "Question your assumptions",
              body: "Ask the host yes-or-no questions. Follow your curiosity, one thought at a time.",
            },
            {
              icon: NotebookPen,
              n: "03",
              title: "Connect the story",
              body: "Use your notebook, explain the truth, and see the whole picture.",
            },
          ].map((s) => (
            <div key={s.n}>
              <span className="step-number">{s.n}</span>
              <s.icon size={21} strokeWidth={1.4} />
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="closing-line">
        <Sparkles size={18} />
        <span>The best clue is sometimes the assumption you let go of.</span>
      </div>
      <Footer />
    </main>
  );
}
