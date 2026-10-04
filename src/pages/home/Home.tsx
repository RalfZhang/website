import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { ContactGrid } from "../../components/ContactGrid";
import { Footer } from "../../components/Footer";
import { ChevronDown } from "../../components/icons";
import { site } from "../../data/site";
import { featuredWorks, type Work } from "../../data/works";
import { prefersReducedMotion, useReveal } from "../../lib/motion";
import { Link } from "../../lib/router";
import { WorkVisual } from "../../visuals/WorkVisual";
import "./Home.css";

/** Section backgrounds alternate, the way apple.com's product tiles do. */
const TONE: Record<string, string> = { inkcity: "section--alt", "file-template": "section--ink" };

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Feature({ work }: { work: Work }) {
  const primary = work.links[0];
  return (
    <section
      id={work.slug}
      className={`snap feature feature--${work.slug} ${TONE[work.slug] ?? ""}`}
      aria-labelledby={`${work.slug}-title`}
    >
      <div className="feature__copy">
        <p className="t-eyebrow feature__eyebrow" data-reveal>
          {work.kind}
        </p>
        <h2 id={`${work.slug}-title`} className="t-headline" data-reveal style={d(60)}>
          {work.title}
          {work.titleZh && <span className="feature__zh"> {work.titleZh}</span>}
        </h2>
        <p className="t-sub feature__sub" data-reveal style={d(120)}>
          {work.tagline}
        </p>
        <div className="feature__ctas" data-reveal style={d(180)}>
          <Link to={`/works/${work.slug}`} className="button">
            Learn more
          </Link>
          {primary && (
            <a className="button button--outline" href={primary.href} target="_blank" rel="noreferrer">
              {primary.label}
            </a>
          )}
        </div>
      </div>
      <div className="feature__media" data-reveal="media" style={d(240)}>
        <WorkVisual work={work} variant="stage" />
      </div>
    </section>
  );
}

/**
 * Mouse wheels move a notch (~100px) at a time, and mandatory snapping would
 * pull such a small scroll straight back — so on the home page a wheel turns
 * exactly one page, using the browser's own smooth scroll. Touch, keys and the
 * scrollbar are left entirely to native scroll-snap.
 */
function useWheelPaging(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const html = document.documentElement;
    let busy = false;
    let armed = true;
    let lastT = 0;
    let lastAbs = 0;
    let release = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (html.classList.contains("menu-open") || html.classList.contains("sheet-open")) return;
      const sections = Array.from(root.current?.querySelectorAll<HTMLElement>(":scope > .snap") ?? []);
      if (!sections.length) return;

      // Trackpads keep firing inertial events after a flick: one page per gesture,
      // re-armed by a pause or by a fresh flick on top of the inertia.
      const now = performance.now();
      const abs = Math.abs(e.deltaY);
      if (now - lastT > 180) armed = true;
      else if (abs > lastAbs * 2 && abs > 40) armed = true;
      lastT = now;
      lastAbs = abs;

      const dir = Math.sign(e.deltaY);
      const y = window.scrollY;
      const vh = window.innerHeight;
      let i = 0;
      sections.forEach((s, k) => s.offsetTop <= y + 2 && (i = k));
      const cur = sections[i];
      // A section taller than the screen (phones, short windows) scrolls itself first.
      if (cur.offsetHeight > vh + 4) {
        if (dir > 0 && y + vh < cur.offsetTop + cur.offsetHeight - 2) return;
        if (dir < 0 && y > cur.offsetTop + 2) return;
      }

      e.preventDefault();
      if (busy || !armed) return;
      const target = dir > 0 ? sections[i + 1] : y > cur.offsetTop + 2 ? cur : sections[i - 1];
      if (!target) return;
      armed = false;
      busy = true;
      const top =
        dir < 0 && target !== cur && target.offsetHeight > vh + 4
          ? target.offsetTop + target.offsetHeight - vh
          : target.offsetTop;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "instant" : "smooth" });
      const done = () => {
        busy = false;
        window.removeEventListener("scrollend", done);
        clearTimeout(release);
      };
      window.addEventListener("scrollend", done);
      release = window.setTimeout(done, 1000);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      clearTimeout(release);
    };
  }, [root]);
}

/**
 * Home: the name alone, then one featured work per screen, then every way to
 * get in touch. Each section snaps into place on scroll (CSS scroll-snap —
 * the browser does it, so it's as smooth as ordinary scrolling).
 */
export function Home() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("snap");
    // A deep link like /#big-ben: the section didn't exist when the browser
    // looked for it, so go there now that it does.
    if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return () => html.classList.remove("snap");
  }, []);

  useWheelPaging(root);

  const first = featuredWorks[0]?.slug;

  return (
    <main className="page home" ref={root}>
      <section id="top" className="snap hero">
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
            <ChevronDown />
          </a>
        )}
      </section>

      {featuredWorks.map((w) => (
        <Feature key={w.slug} work={w} />
      ))}

      <section id="contact" className="snap home-contact section--alt" aria-labelledby="contact-title">
        <div className="wrap home-contact__inner">
          <h2 id="contact-title" className="t-headline" data-reveal>
            Say hello.
          </h2>
          <p className="t-sub muted home-contact__sub" data-reveal style={d(60)}>
            Find me on any of these.
          </p>
          <ContactGrid compact />
        </div>
        <Footer />
      </section>
    </main>
  );
}
