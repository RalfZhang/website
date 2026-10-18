import { useEffect, useRef, useState } from "react";
import { CITIES, formatLatLon } from "../../data/cities";
import type { Work } from "../../data/works";
import { prefersReducedMotion, useInView, useMediaQuery, usePageVisible } from "../../lib/motion";
import { useTheme } from "../../lib/theme";
import { preloadCity } from "../../visuals/cityMaps";
import { RoadMap, WALLPAPER } from "../../visuals/RoadMap";
import { FeatureCopy } from "./Feature";
import "./InkCityFeature.css";

/** Seconds for the roads to reach the screen's edges: brisk, to keep pace with the words after them. */
const SPREAD_S = 1.1;
/** Ground across the screen's longer side: InkCity's own wallpaper span. */
const SPAN_KM = 20;
/** InkCityFeature.css's narrow layout, where everything comes in from the top rather than the left: the maps, and the panel by the section's inkscreen--top. */
const NARROW = "(max-width: 900px)";

/**
 * InkCity's home screen is the wallpaper itself. It arrives blank, just the
 * paper (or the night), and the first time it's scrolled to, the roads grow
 * across the screen, left to right (top to bottom on a phone). Only then do the
 * words open over them, on a frosted panel uncovered the same way.
 *
 * Then it changes city, as the app changes the wallpaper every day: each one
 * stays a few seconds, with InkCity's caption in its corner and its division of
 * the scale bar filling for the time it stays, until an edge of paper sweeps
 * over it the same way, the next city's roads appearing behind it; the new
 * water comes in once the edge is across. Round the list in src/data/cities.ts,
 * only while the screen is in view, and not at all for anyone who asks for
 * reduced motion. The scale bar is the timer: the next city starts when the
 * current division is full, and it stops while the screen is out of view, so
 * the two never disagree.
 *
 * Each city is fetched only when it's about to be needed: the first once the
 * screen is a scroll away, the next while the current one shows. Until it's
 * there, the current city simply stays. The maps follow the site's theme,
 * repainted in place when it changes.
 */
export function InkCityFeature({ work }: { work: Work }) {
  const { theme } = useTheme();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { threshold: 0.5 });
  // Latched: from the first time the screen is in view on.
  const [seen, setSeen] = useState(false);
  if (inView && !seen) setSeen(true);
  const pageVisible = usePageVisible();
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  // The city being covered, kept underneath until the new one is laid over it.
  const [under, setUnder] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const cycling = !prefersReducedMotion();
  const from = useMediaQuery(NARROW) ? "top" : "left";
  const next = CITIES[(at + 1) % CITIES.length];
  // The caption keeps the old city's name until the new one is drawn.
  const caption = CITIES[under ?? at];

  // Should the map be slow to come, or never come, the words still do.
  useEffect(() => {
    if (!seen) return;
    const id = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(id);
  }, [seen]);
  // While a city shows, fetch the one after it.
  useEffect(() => {
    if (done && cycling) preloadCity(next.url);
  }, [done, cycling, next]);

  // The current city's division of the scale bar is full: lay the next one over it.
  const advance = () => {
    setUnder(at);
    setAt((at + 1) % CITIES.length);
    setDone(false);
  };
  const finished = () => {
    setDone(true);
    setUnder(null);
  };

  return (
    <section
      id={work.slug}
      ref={ref}
      className={`screen inkscreen inkscreen--${from}${open ? " is-open" : ""}`}
      aria-labelledby={`${work.slug}-title`}
    >
      <div className="inkscreen__map" aria-hidden>
        {/* One keyed list, so the city going under keeps its drawn map rather than starting over. */}
        {(under === null ? [at] : [under, at]).map((i) => (
          <RoadMap
            key={CITIES[i].slug}
            src={CITIES[i].url}
            palette={WALLPAPER[theme]}
            start={seen}
            appear={i === at && under !== null ? "over" : "grow"}
            from={from}
            spanKm={SPAN_KM}
            spreadS={SPREAD_S}
            onSpread={i === at ? () => setOpen(true) : undefined}
            onDone={i === at ? finished : undefined}
          />
        ))}
        <div className="inkscreen__legend">
          <p className={`inkscreen__label${done ? " is-shown" : ""}`}>
            <span className="inkscreen__title" lang={caption.label.lang}>
              {caption.label.title}
            </span>
            {caption.label.subtitle && <span className="inkscreen__subtitle">{caption.label.subtitle}</span>}
            <span className="inkscreen__coords">{formatLatLon(caption.lat, caption.lon)}</span>
          </p>
          {cycling && (
            <ol
              className={`inkscreen__progress${done || under !== null ? " is-on" : ""}${inView && pageVisible ? "" : " is-paused"}`}
            >
              {CITIES.map((c, i) => (
                <li key={c.slug} className={i < at ? "is-past" : i === at && done ? "is-running" : undefined}>
                  <span onAnimationEnd={i === at ? advance : undefined} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <div className="wrap inkscreen__inner">
        {/* Out of reach while it's clipped shut (reduced motion has it open from the start), so Tab never lands on a link no one can see. */}
        <div className="inkscreen__panel" inert={!open && !prefersReducedMotion()}>
          <FeatureCopy work={work} />
        </div>
      </div>
    </section>
  );
}
