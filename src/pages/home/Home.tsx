import { useEffect, useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { Jobs } from "../../components/Jobs";
import { ArrowDown, ArrowRight, ArrowUpRight } from "../../components/icons";
import { SocialRow } from "../../components/SocialRow";
import { site } from "../../data/site";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { prefersReducedMotion, useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Home.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Feature({ work }: { work: Work }) {
  const { t } = useI18n();
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
        <div className="feature__media" data-reveal style={d(80)}>
          <WorkVisual work={work} variant="stage" />
        </div>
      </div>
    </section>
  );
}

/**
 * Home: the name, then who I am and where I've worked, then one featured work
 * per screen, then every way to get in touch — scrolled a screen at a time. That's CSS scroll snapping on
 * the page itself (see Home.css), so the browser does all of it: nothing here
 * listens to wheel, touch or scroll events.
 */
export function Home() {
  const root = useRef<HTMLElement>(null);
  const { lang, t, works } = useI18n();
  useReveal(root, lang);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("fullpage");
    // A deep link like /#big-ben: the section didn't exist when the browser
    // looked for it, so go there now that it does.
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return () => html.classList.remove("fullpage");
  }, []);

  return (
    <main className="page home" ref={root}>
      <section id="top" className="screen hero">
        <h1 className="t-hero hero__name">{site.name}</h1>
        <p className="t-lead muted hero__role">{t.home.role}</p>
        <a
          className="hero__next"
          href="#about"
          aria-label={t.home.toAbout}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("about")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
          }}
        >
          <ArrowDown />
        </a>
      </section>

      <section id="about" className="screen home-about" aria-labelledby="about-title">
        <div className="wrap home-about__inner">
          <h2 id="about-title" className="t-headline" data-reveal>
            {t.about.title}
          </h2>
          <p className="t-lead muted home-about__intro" data-reveal style={d(40)}>
            {t.about.intro}
          </p>
          <div className="home-about__jobs">
            <Jobs id="experience-title" level={3} delay={80} />
          </div>
        </div>
      </section>

      {works.featured.map((w) => (
        <Feature key={w.slug} work={w} />
      ))}

      <section id="contact" className="screen home-contact" aria-labelledby="contact-title">
        <div className="wrap home-contact__inner">
          <h2 id="contact-title" className="t-headline" data-reveal>
            {t.home.sayHello}
          </h2>
          <div className="home-contact__row" data-reveal style={d(60)}>
            <SocialRow />
          </div>
        </div>
        <Footer />
      </section>
    </main>
  );
}
