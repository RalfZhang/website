import { useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { ArrowRight, ArrowUpRight } from "../../components/icons";
import { featuredWorks, otherWorks, type Stat, type Work } from "../../data/works";
import { useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Works.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export const formatStat = (s: Stat) =>
  `${s.prefix ?? ""}${s.format === "plain" ? s.value : s.value.toLocaleString("en-US")}${s.suffix ?? ""}`;

function FeaturedCard({ work, i }: { work: Work; i: number }) {
  const primary = work.links[0];
  return (
    <article className="fcard" data-reveal style={d(i * 60)}>
      <Link to={`/works/${work.slug}`} className={`fcard__media fcard__media--${work.slug}`} aria-label={work.title} tabIndex={-1}>
        <WorkVisual work={work} variant="card" />
      </Link>
      <p className="t-label fcard__kind">
        {work.kind} · {work.year}
      </p>
      <h2 className="t-title">{work.title}</h2>
      <p className="fcard__tagline muted">{work.tagline}</p>
      {work.stats && (
        <p className="fcard__stats">
          {work.stats.map((s) => (
            <span key={s.label}>
              <strong>{formatStat(s)}</strong> {s.label}
            </span>
          ))}
        </p>
      )}
      <div className="fcard__ctas">
        <Link to={`/works/${work.slug}`} className="button">
          Learn more <ArrowRight />
        </Link>
        {primary && (
          <a className="button button--quiet" href={primary.href} target="_blank" rel="noreferrer">
            {primary.label} <ArrowUpRight />
          </a>
        )}
      </div>
    </article>
  );
}

export function Works() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <main className="page works" ref={root}>
      <header className="wrap page-head" data-reveal>
        <h1 className="t-section">Works</h1>
        <p className="t-lead muted">Apps, extensions and bots — and the experiments before them.</p>
      </header>

      <section className="wrap lineup" aria-label="Selected works">
        {featuredWorks.map((w, i) => (
          <FeaturedCard key={w.slug} work={w} i={i} />
        ))}
      </section>

      <section className="wrap more" aria-labelledby="more-title">
        <div className="more__head" data-reveal>
          <h2 id="more-title" className="t-section">
            More
          </h2>
          <p className="t-lead muted">Older things, still on GitHub.</p>
        </div>
        <ul className="more__grid">
          {otherWorks.map((w, i) => (
            <li key={w.slug} data-reveal style={d(i * 40)}>
              <Link to={`/works/${w.slug}`} className="more__tile">
                <span className="more__top">
                  <span className="t-label">
                    {w.year} · {w.kind}
                  </span>
                  <ArrowRight className="more__go" />
                </span>
                <span className="t-title">
                  {w.title}
                  {w.titleZh && <span className="muted"> {w.titleZh}</span>}
                </span>
                <span className="more__tagline muted">{w.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
