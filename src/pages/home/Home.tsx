import { useLayoutEffect, useRef, type ComponentType } from "react";
import { Footer } from "../../components/Footer";
import { Jobs } from "../../components/Jobs";
import { ArrowDown } from "../../components/icons";
import { SocialRow } from "../../components/SocialRow";
import { site } from "../../data/site";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { d, prefersReducedMotion, useReveal } from "../../lib/motion";
import { BigBenFeature } from "./BigBenFeature";
import { Feature } from "./Feature";
import { FileTemplateFeature } from "./FileTemplateFeature";
import { InkCityFeature } from "./InkCityFeature";
import "./Home.css";

/** Works whose home screen is designed on its own, by slug; the rest get Feature. */
const screens: Partial<Record<string, ComponentType<{ work: Work }>>> = {
  inkcity: InkCityFeature,
  "file-template": FileTemplateFeature,
  "big-ben": BigBenFeature,
};

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

  // A layout effect, so the page scrolls where it will (Home.css) before any
  // screen's own effects start watching it.
  useLayoutEffect(() => {
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

      {works.featured.map((w) => {
        const Screen = screens[w.slug] ?? Feature;
        return <Screen key={w.slug} work={w} />;
      })}

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
