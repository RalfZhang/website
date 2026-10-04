import { useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { ChevronRight } from "../../components/icons";
import { featuredWorks, otherWorks, type Stat, type Work } from "../../data/works";
import { useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Works.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export const formatStat = (s: Stat) =>
  `${s.prefix ?? ""}${s.format === "plain" ? s.value : s.value.toLocaleString("en-US")}${s.suffix ?? ""}`;

function LineupCard({ work, i }: { work: Work; i: number }) {
  const primary = work.links[0];
  return (
    <article className="lineup__card" data-reveal style={d(i * 90)}>
      <Link to={`/works/${work.slug}`} className={`lineup__media lineup__media--${work.slug}`} aria-label={work.title} tabIndex={-1}>
        <WorkVisual work={work} variant="card" />
      </Link>
      <p className="lineup__kind">{work.kind}</p>
      <h2 className="t-title">{work.title}</h2>
      <p className="lineup__tagline muted">{work.tagline}</p>
      {work.stats && (
        <ul className="lineup__stats">
          {work.stats.map((s) => (
            <li key={s.label}>
              <strong>{formatStat(s)}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="lineup__ctas">
        <Link to={`/works/${work.slug}`} className="button button--small">
          Learn more
        </Link>
        {primary && (
          <a className="chevron-link" href={primary.href} target="_blank" rel="noreferrer">
            {primary.label} <ChevronRight />
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
      <header className="wrap page-head">
        <h1 className="t-section two-tone" data-reveal>
          <strong>Works.</strong> Apps, extensions and bots — and the experiments before them.
        </h1>
      </header>

      <section className="wrap lineup" aria-label="Selected works">
        {featuredWorks.map((w, i) => (
          <LineupCard key={w.slug} work={w} i={i} />
        ))}
      </section>

      <section className="wrap more" aria-labelledby="more-title">
        <h2 id="more-title" className="t-section two-tone" data-reveal>
          <strong>More.</strong> Older things, still on GitHub.
        </h2>
        <ul className="more__grid">
          {otherWorks.map((w, i) => (
            <li key={w.slug} data-reveal style={d(i * 60)}>
              <Link to={`/works/${w.slug}`} className="more__tile">
                <span className="more__year">{w.year}</span>
                <span className="more__title">
                  {w.title}
                  {w.titleZh && <span className="muted"> {w.titleZh}</span>}
                </span>
                <span className="more__tagline">{w.tagline}</span>
                <span className="more__cta">
                  Learn more <ChevronRight />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
