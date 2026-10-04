import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useInView } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { RoadMap, WALLPAPER } from "./RoadMap";
import "./InkCityVisual.css";

type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];

/**
 * InkCity as it's meant to be seen: today's wallpaper on a monitor, drawn flat
 * like the app's own icon. The first time it scrolls into view the roads grow
 * out from the Bell Tower; the switch flips between InkCity's light and dark
 * wallpapers (following the site's theme until it's touched).
 */
export function InkCityVisual({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [picked, setPicked] = useState<Mode | null>(null);
  const mode = picked ?? theme;
  const first = useRef<Mode>(mode);
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, threshold: 0.35 });
  // The other palette is drawn only once it's asked for — drawing it in one go
  // takes a frame or three, which mustn't land while the page is scrolling.
  const [other, setOther] = useState(false);
  useEffect(() => {
    if (mode !== first.current) setOther(true);
  }, [mode]);

  return (
    <figure className={`inkcity inkcity--${variant}`} ref={ref}>
      <div className="monitor">
        <div className="monitor__screen">
          <div className="monitor__display">
            {MODES.map((m) => (
              <RoadMap
                key={m}
                palette={WALLPAPER[m]}
                start={seen && (m === first.current || other)}
                grow={m === first.current}
                spanKm={variant === "card" ? 7 : 9}
                className={m === mode ? "is-shown" : undefined}
              />
            ))}
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
                onClick={() => setPicked(m)}
              >
                {t.inkcity[m]}
              </button>
            ))}
          </div>
          <figcaption className="t-label">{t.inkcity.caption}</figcaption>
        </div>
      )}
    </figure>
  );
}
