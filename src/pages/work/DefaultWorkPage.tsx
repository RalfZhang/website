import { useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { ChevronRight } from "../../components/icons";
import { nextWork, type Work } from "../../data/works";
import { useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import { formatStat } from "../works/Works";
import "./DefaultWorkPage.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** "First sentence. The rest…" → the first sentence is set dark, the rest grey. */
function splitLead(text: string): [string, string] {
  const i = text.search(/[.。]\s/);
  return i < 0 ? [text, ""] : [text.slice(0, i + 1), text.slice(i + 2)];
}

/** The page every work gets until it has a bespoke one (see ./custom). */
export function DefaultWorkPage({ work }: { work: Work }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, work.slug);
  const next = nextWork(work.slug);
  const [lead, rest] = splitLead(work.summary);
  const [primary, ...others] = work.links;

  const specs: [string, string][] = [
    ["Year", work.year],
    ["Type", work.kind],
    ["Built with", work.stack.join(", ")],
  ];
  if (work.platforms) specs.push(["Runs on", work.platforms.replaceAll(" · ", ", ")]);

  return (
    <main className="page detail" ref={root}>
      <section className="wrap detail__hero">
        <Link to="/works" className="detail__crumb" data-reveal>
          Works
        </Link>
        <h1 className="t-headline" data-reveal style={d(60)}>
          {work.title}
          {work.titleZh && <span className="muted"> {work.titleZh}</span>}
        </h1>
        <p className="t-sub detail__tagline" data-reveal style={d(120)}>
          {work.tagline}
        </p>
        <div className="detail__ctas" data-reveal style={d(180)}>
          {primary && (
            <a className="button" href={primary.href} target="_blank" rel="noreferrer">
              {primary.label}
            </a>
          )}
          {others.map((l) => (
            <a key={l.href} className="chevron-link" href={l.href} target="_blank" rel="noreferrer">
              {l.label} <ChevronRight />
            </a>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className={`detail__media detail__media--${work.visual ?? "poster"}`} data-reveal="media" style={d(220)}>
          <WorkVisual work={work} variant="detail" />
        </div>
      </section>

      <section className="wrap detail__intro">
        <p className="t-intro two-tone" data-reveal>
          <strong>{lead}</strong> {rest}
        </p>
      </section>

      {work.features && (
        <section className="wrap detail__section" aria-labelledby="highlights">
          <h2 id="highlights" className="t-section" data-reveal>
            Highlights.
          </h2>
          <ul className="highlights" style={{ "--cols": work.features.length % 2 === 0 ? 2 : 3 } as CSSProperties}>
            {work.features.map((f, i) => (
              <li key={f.title} className="highlight" data-reveal style={d(i * 70)}>
                <p className="two-tone">
                  <strong>{f.title}</strong> {f.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {work.stats && (
        <section className="wrap detail__section" aria-label="In numbers">
          <ul className="numbers">
            {work.stats.map((s, i) => (
              <li key={s.label} className="number" data-reveal style={d(i * 70)}>
                <span className="number__value">{formatStat(s)}</span>
                <span className="number__label">{s.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wrap detail__section" aria-labelledby="details">
        <h2 id="details" className="t-section" data-reveal>
          Details.
        </h2>
        <dl className="specs" data-reveal>
          {specs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div>
            <dt>Links</dt>
            <dd className="specs__links">
              {work.links.map((l) => (
                <a key={l.href} className="chevron-link" href={l.href} target="_blank" rel="noreferrer">
                  {l.label} <ChevronRight />
                </a>
              ))}
            </dd>
          </div>
          {work.credits && (
            <div>
              <dt>Credits</dt>
              <dd>{work.credits}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="wrap detail__section detail__next-wrap">
        <Link to={`/works/${next.slug}`} className="next" data-reveal>
          <span className="next__label">Next</span>
          <span className="t-headline next__title">{next.title}</span>
          <span className="next__tagline">{next.tagline}</span>
          <span className="chevron-link next__cta">
            See it <ChevronRight />
          </span>
        </Link>
      </section>

      <Footer />
    </main>
  );
}
