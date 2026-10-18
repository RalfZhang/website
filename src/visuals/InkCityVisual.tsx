import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CITIES } from "../data/cities";
import { useI18n } from "../i18n";
import { fmt } from "../i18n/fmt";
import { pick } from "../i18n/locales";
import { crossFade, useInView } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { RoadMap, WALLPAPER } from "./RoadMap";
import "./InkCityVisual.css";

type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];
/** The monitor shows the first of the home page's cities. */
const CITY = CITIES[0];

/**
 * InkCity as it's meant to be seen: today's wallpaper on a monitor, drawn flat
 * like the app's own icon. The first time it scrolls into view the roads grow
 * out from the centre; the switch cross-fades between InkCity's light and dark
 * wallpapers (following the site's theme until it's touched).
 */
export function InkCityVisual({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const { theme } = useTheme();
  const { lang, t } = useI18n();
  const [picked, setPicked] = useState<Mode | null>(null);
  const mode = picked ?? theme;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, threshold: 0.35 });

  return (
    <figure className={`inkcity inkcity--${variant}`} ref={ref}>
      <div className="monitor">
        <div className="monitor__screen">
          <div className="monitor__display">
            <RoadMap src={CITY.url} palette={WALLPAPER[mode]} start={seen} spanKm={variant === "card" ? 7 : 9} />
          </div>
        </div>
        <div className="monitor__neck" />
        <div className="monitor__foot" />
      </div>

      {variant !== "card" && (
        <div className="inkcity__controls">
          <div className="segmented" role="radiogroup" aria-label={t.inkcity.wallpaper}>
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={mode === m ? "is-on" : undefined}
                onClick={() => crossFade(() => flushSync(() => setPicked(m)))}
              >
                {t.inkcity[m]}
              </button>
            ))}
          </div>
          <figcaption className="t-label">
            {fmt(t.inkcity.caption, { city: pick(CITY.name, lang), centre: pick(CITY.centre, lang) })}
          </figcaption>
        </div>
      )}
    </figure>
  );
}
