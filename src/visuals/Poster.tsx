import type { Work } from "../data/works";
import "./Poster.css";

/** For works without a live visual: the name, set big, like a product poster. */
export function Poster({ work, variant = "detail" }: { work: Work; variant?: "card" | "detail" }) {
  return (
    <div className={`poster poster--${variant}`} aria-hidden>
      <span className="poster__meta">
        {work.kind} · {work.year}
      </span>
      <span className="poster__title">
        {work.title}
        {work.titleZh && <span className="poster__zh">{work.titleZh}</span>}
      </span>
      <span className="poster__stack">{work.stack.join(" · ")}</span>
    </div>
  );
}
