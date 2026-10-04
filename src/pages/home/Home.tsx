import { useEffect, useRef, type CSSProperties } from "react";
import { ContactGrid } from "../../components/ContactGrid";
import { Footer } from "../../components/Footer";
import { ArrowDown, ArrowRight, ArrowUpRight } from "../../components/icons";
import { site } from "../../data/site";
import { featuredWorks, type Work } from "../../data/works";
import { useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Home.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Feature({ work }: { work: Work }) {
  const primary = work.links[0];
  return (
    <section id={work.slug} className={`screen feature feature--${work.slug}`} aria-labelledby={`${work.slug}-title`}>
      <div className="wrap feature__grid">
        <div className="feature__copy">
          <p className="t-label" data-reveal>
            {work.kind} · {work.year}
          </p>
          <h2 id={`${work.slug}-title`} className="t-headline" data-reveal style={d(40)}>
            {work.title}
            {work.titleZh && <span className="muted"> {work.titleZh}</span>}
          </h2>
          <p className="t-lead muted" data-reveal style={d(80)}>
            {work.tagline}
          </p>
          <div className="feature__ctas" data-reveal style={d(120)}>
            <Link to={`/works/${work.slug}`} className="button">
              Learn more <ArrowRight />
            </Link>
            {primary && (
              <a className="button button--quiet" href={primary.href} target="_blank" rel="noreferrer">
                {primary.label} <ArrowUpRight />
              </a>
            )}
          </div>
        </div>
        <div className="feature__media" data-reveal style={d(80)}>
          <WorkVisual work={work} variant="stage" />
        </div>
      </div>
    </section>
  );
}

/**
 * Home: the name alone, then one featured work per screen, then every way to
 * get in touch. Each section is a full screen, but scrolling is left entirely
 * to the browser — no snap points, no paging, nothing to hold it back.
 */
export function Home() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  // A deep link like /#big-ben: the section didn't exist when the browser
  // looked for it, so go there now that it does.
  useEffect(() => {
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }, []);

  const first = featuredWorks[0]?.slug;

  return (
    <main className="page home" ref={root}>
      <section id="top" className="screen hero">
        <h1 className="t-hero hero__name">{site.name}</h1>
        {first && (
          <a
            className="hero__next"
            href={`#${first}`}
            aria-label="See the work"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(first)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowDown />
          </a>
        )}
      </section>

      {featuredWorks.map((w) => (
        <Feature key={w.slug} work={w} />
      ))}

      <section id="contact" className="screen home-contact" aria-labelledby="contact-title">
        <div className="wrap home-contact__inner">
          <h2 id="contact-title" className="t-headline" data-reveal>
            Say hello
          </h2>
          <p className="t-lead muted home-contact__lead" data-reveal style={d(40)}>
            Find me on any of these.
          </p>
          <ContactGrid compact />
        </div>
        <Footer />
      </section>
    </main>
  );
}
