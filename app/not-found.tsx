import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow">FILE NOT FOUND</span>
      <h1>This trail has gone cold.</h1>
      <p>That investigation may belong to a different browser.</p>
      <Link className="button light" href="/">
        Return to the collection
      </Link>
    </main>
  );
}
