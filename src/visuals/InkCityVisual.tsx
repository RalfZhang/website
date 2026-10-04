import { useRef, useState } from "react";
import { useInView } from "../lib/motion";
import { useTheme } from "../lib/theme";
import { RoadMap, WALLPAPER } from "./RoadMap";
import "./InkCityVisual.css";

type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];

/**
 * InkCity as it's meant to be seen: today's wallpaper on a laptop. The first
 * time it scrolls into view the roads grow out from the Bell Tower; the
 * switch flips between InkCity's light and dark wallpapers (it follows the
 * site's appearance until it's touched).
 */
export function InkCityVisual({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const { theme } = useTheme();
  const [picked, setPicked] = useState<Mode | null>(null);
  const mode = picked ?? theme;
  const first = useRef<Mode>(mode);
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, threshold: 0.35 });
  const span = variant === "card" ? 7 : 9;

  return (
    <figure className={`inkcity inkcity--${variant}`} ref={ref}>
      <div className="laptop">
        <div className="laptop__lid">
          <div className="laptop__screen">
            {MODES.map((m) => (
              <RoadMap
                key={m}
                palette={WALLPAPER[m]}
                start={seen}
                grow={m === first.current}
                spanKm={span}
                className={m === mode ? "is-shown" : undefined}
              />
            ))}
            <span className="laptop__notch" />
          </div>
        </div>
        <div className="laptop__base">
          <span className="laptop__groove" />
        </div>
      </div>

      {variant !== "card" && (
        <div className="inkcity__controls">
          <div className="segmented" role="radiogroup" aria-label="Wallpaper">
            <span className="segmented__thumb" style={{ transform: `translateX(${mode === "dark" ? 100 : 0}%)` }} />
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={mode === m ? "is-on" : undefined}
                onClick={() => setPicked(m)}
              >
                {m === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
          <figcaption className="t-caption muted">Xi’an, centred on the Bell Tower.</figcaption>
        </div>
      )}
    </figure>
  );
}
