import { ArrowRight, ArrowUpRight } from "../../components/icons";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { d } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";

/** A featured work's words: what it is, its name, one line, and the way in. They fade up as they come into view. */
export function FeatureCopy({ work }: { work: Work }) {
  const { t } = useI18n();
  const primary = work.links[0];
  return (
    <div className="feature__copy">
      <p className="t-label" data-reveal>
        {work.kind} · {work.year}
      </p>
      <h2 id={`${work.slug}-title`} className="t-headline" data-reveal style={d(40)}>
        {work.title}
      </h2>
      <p className="t-lead muted" data-reveal style={d(80)}>
        {work.tagline}
      </p>
      <div className="feature__ctas" data-reveal style={d(120)}>
        <Link to={`/works/${work.slug}`} className="button">
          {t.home.learnMore} <ArrowRight />
        </Link>
        {primary && (
          <a className="button button--quiet" href={primary.href} target="_blank" rel="noreferrer">
            {primary.label} <ArrowUpRight />
          </a>
        )}
      </div>
    </div>
  );
}

/** The usual featured-work screen: the words on the left, the work itself on the right. */
export function Feature({ work }: { work: Work }) {
  return (
    <section id={work.slug} className={`screen feature feature--${work.slug}`} aria-labelledby={`${work.slug}-title`}>
      <div className="wrap feature__grid">
        <FeatureCopy work={work} />
        <div className="feature__media" data-reveal style={d(80)}>
          <WorkVisual work={work} variant="stage" />
        </div>
      </div>
    </section>
  );
}
