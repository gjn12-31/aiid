"use client";
import { useState } from "react";
import { Feather, LoaderCircle, Send } from "lucide-react";
export function Feedback() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function send() {
    if (sending || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setText("");
      setDone(true);
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "The messenger could not be reached. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="feedback-card" aria-label="Anonymous feedback">
      {!open ? (
        <button
          className="feedback-toggle"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          <Feather size={16} />
          {done ? "Send another note" : "Leave anonymous feedback"}
        </button>
      ) : (
        <div className="feedback-form">
          <h3 className="feedback-heading">A word with the keeper?</h3>
          <p className="feedback-note">
            Anonymous — no name, no account, no trail. Only your words and the
            time they were written.
          </p>
          <textarea
            value={text}
            maxLength={2000}
            rows={4}
            autoFocus
            disabled={sending}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you think of the tavern? Any tale, any trouble, any wish..."
            aria-label="Your anonymous feedback"
          />
          <div className="feedback-actions">
            <button
              className="feedback-send"
              disabled={sending || !text.trim()}
              onClick={() => void send()}
            >
              {sending ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              {sending ? "Sending..." : "Send the note"}
            </button>
            <button
              className="feedback-cancel"
              disabled={sending}
              onClick={() => setOpen(false)}
            >
              Never mind
            </button>
          </div>
        </div>
      )}
      {done && (
        <p className="feedback-status" role="status">
          Thank you — your note is safely inked into the keeper&apos;s ledger.
        </p>
      )}
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
