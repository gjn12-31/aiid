import Link from "next/link";
import { Fingerprint, ArrowUpRight } from "lucide-react";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${small ? "small-brand" : ""}`}
      aria-label="Behind the Mystery home"
    >
      <Fingerprint size={small ? 28 : 34} strokeWidth={1.25} />
      <span>
        BEHIND
        <br />
        <b>THE MYSTERY</b>
      </span>
    </Link>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <span>
        Behind the Mystery <i> / </i> An independent mystery collection
      </span>
      <span>
        Stay curious. Question the obvious. <ArrowUpRight size={14} />
      </span>
    </footer>
  );
}
