import { useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "../../components/icons";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { d, useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import { formatStat } from "../works/Works";
import "./DefaultWorkPage.css";

/** The page every work gets until it has a bespoke one (see ./custom). */
export function DefaultWorkPage({ work }: { work: Work }) {
  const root = useRef<HTMLElement>(null);
  const { lang, t, works, formatNumber } = useI18n();
  useReveal(root, `${lang}/${work.slug}`);
  const next = works.next(work.slug);
  const [primary, ...others] = work.links;

  const specs: [string, string][] = [
    [t.work.year, work.year],
    [t.work.type, work.kind],
    [t.work.builtWith, work.stack.join(t.work.list)],
  ];
  if (work.platforms) specs.push([t.work.runsOn, work.platforms.replaceAll(" · ", t.work.list)]);

  return (
    <main className="page detail" ref={root}>
      <section className="wrap detail__hero">
        <Link to="/works" className="detail__crumb t-label" data-reveal>
          <ArrowLeft /> {t.nav.works}
        </Link>
        <p className="t-label" data-reveal style={d(30)}>
          {work.kind} · {work.year}
        </p>
        <h1 className="t-headline" data-reveal style={d(60)}>
          {work.title}
        </h1>
        <p className="t-lead muted detail__tagline" data-reveal style={d(90)}>
          {work.tagline}
        </p>
        <div className="detail__ctas" data-reveal style={d(120)}>
          {primary && (
            <a className="button" href={primary.href} target="_blank" rel="noreferrer">
              {primary.label} <ArrowUpRight />
            </a>
          )}
          {others.map((l) => (
            <a key={l.href} className="button button--quiet" href={l.href} target="_blank" rel="noreferrer">
              {l.label} <ArrowUpRight />
            </a>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className={`detail__media detail__media--${work.visual ?? "poster"}`} data-reveal style={d(120)}>
          <WorkVisual work={work} variant="detail" />
        </div>
      </section>

      <section className="wrap detail__intro">
        <p className="t-lead" data-reveal>
          {work.summary}
        </p>
      </section>

      {work.features && (
        <section className="wrap detail__section" aria-labelledby="highlights">
          <h2 id="highlights" className="t-section" data-reveal>
            {t.work.highlights}
          </h2>
          <ul className="highlights" style={{ "--cols": work.features.length % 2 === 0 ? 2 : 3 } as CSSProperties}>
            {work.features.map((f, i) => (
              <li key={i} className="highlight" data-reveal style={d(i * 50)}>
                <h3 className="highlight__title">{f.title}</h3>
                <p className="muted">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {work.stats && (
        <section className="wrap detail__section" aria-label={t.work.inNumbers}>
          <ul className="numbers">
            {work.stats.map((s, i) => (
              <li key={i} className="number" data-reveal style={d(i * 50)}>
                <span className="number__value">{formatStat(s, formatNumber)}</span>
                <span className="number__label muted">{s.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wrap detail__section" aria-labelledby="details">
        <h2 id="details" className="t-section" data-reveal>
          {t.work.details}
        </h2>
        <dl className="specs" data-reveal>
          {specs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div>
            <dt>{t.work.links}</dt>
            <dd className="specs__links">
              {work.links.map((l) => (
                <a key={l.href} className="text-link" href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </dd>
          </div>
          {work.credits && (
            <div>
              <dt>{t.work.credits}</dt>
              <dd>{work.credits}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="wrap detail__section detail__next-wrap">
        <Link to={`/works/${next.slug}`} className="next" data-reveal>
          <span className="t-label next__label">{t.work.next}</span>
          <span className="next__row">
            <span className="t-headline">{next.title}</span>
            <ArrowRight className="next__go" />
          </span>
          <span className="next__tagline">{next.tagline}</span>
        </Link>
      </section>

      <Footer />
    </main>
  );
}
