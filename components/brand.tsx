import Link from "next/link";
import { Flame, ArrowUpRight } from "lucide-react";
import { Feedback } from "./feedback";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${small ? "small-brand" : ""}`}
      aria-label="Behind the Mystery home"
    >
      <span className="brand-lantern">
        <Flame size={small ? 28 : 34} strokeWidth={1.4} />
      </span>
      <span>
        Behind
        <br />
        <b>the Mystery</b>
      </span>
    </Link>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Feedback />
      <span>
        Behind the Mystery <i> / </i> A tavern for curious souls
      </span>
      <span>
        Stay curious. Question the obvious. <ArrowUpRight size={14} />
      </span>
    </footer>
  );
}
