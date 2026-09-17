"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <h1>A brief interruption.</h1>
      <p>Your saved progress is safe. Let us try that again.</p>
      <button className="button light" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
