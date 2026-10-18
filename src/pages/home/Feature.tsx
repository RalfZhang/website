import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "../../components/icons";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { d } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Feature.css";

/** The words FeatureCopy shows, in reading order: what it is, its name, one line, then each button's label. */
export function copyWords(work: Work, learnMore: string): string[] {
  const primary = work.links[0];
  return [`${work.kind} · ${work.year}`, work.title, work.tagline, learnMore, ...(primary ? [primary.label] : [])];
}

/**
 * A featured work's words: what it is, its name, one line, and the way in.
 * By default they fade up as they come into view, like everything on the site;
 * a screen with an entrance of its own turns `reveal` off and can draw each
 * run of words its own way with `words` (given each one's index in copyWords),
 * handing in as `text` the copyWords it works from, so the two never differ.
 */
export function FeatureCopy({
  work,
  text: given,
  reveal = true,
  words = (text) => text,
}: {
  work: Work;
  text?: string[];
  reveal?: boolean;
  words?: (text: string, i: number) => ReactNode;
}) {
  const { t } = useI18n();
  const primary = work.links[0];
  const text = given ?? copyWords(work, t.home.learnMore);
  const fade = (ms: number) => (reveal ? { "data-reveal": true, style: d(ms) } : {});
  return (
    <div className="feature__copy">
      <p className="t-label" {...fade(0)}>
        {words(text[0], 0)}
      </p>
      <h2 id={`${work.slug}-title`} className="t-headline" {...fade(40)}>
        {words(text[1], 1)}
      </h2>
      <p className="t-lead muted" {...fade(80)}>
        {words(text[2], 2)}
      </p>
      <div className="feature__ctas" {...fade(120)}>
        <Link to={`/works/${work.slug}`} className="button">
          {words(text[3], 3)} <ArrowRight />
        </Link>
        {primary && (
          <a className="button button--quiet" href={primary.href} target="_blank" rel="noreferrer">
            {words(text[4], 4)} <ArrowUpRight />
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
