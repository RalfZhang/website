import { useState } from "react";
import { useI18n } from "../i18n";
import { fmt } from "../i18n/fmt";
import "./CstuVisual.css";

type Page = "home" | "courses";
const PAGES: Page[] = ["home", "courses"];

/**
 * Screenshots of the live site in a 1440 × 900 window, in each language
 * (./cstu/<page>-<lang>-<width>.webp, at 1x and 2x). Each runs 45px below the
 * fold, to take in the hero's figures and the course cards' buttons; the chat
 * button is hidden.
 */
const SHOTS = import.meta.glob<string>("./cstu/*.webp", { eager: true, import: "default" });

const SIZES = {
  stage: "(max-width: 1000px) 100vw, 960px",
  card: "(max-width: 1000px) 90vw, 520px",
  detail: "(max-width: 1000px) 100vw, 1000px",
};

/**
 * CSTU Courses as it looks live: the site in a flat browser window, in the
 * page's language. The switch below flips between pages; the card shows only
 * the home page.
 */
export function CstuVisual({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const { lang, t } = useI18n();
  const [page, setPage] = useState<Page>("home");
  const shown = variant === "card" ? (["home"] as Page[]) : PAGES;
  const shot = (p: Page, w: number) => SHOTS[`./cstu/${p}-${lang}-${w}.webp`];

  return (
    <figure className={`site site--${variant}`}>
      <div className="site__window">
        <div className="site__bar">
          <span className="site__lights">
            <i />
            <i />
            <i />
          </span>
          <span className="site__url">short.cstu.cloud/{page}</span>
        </div>
        <div className="site__view">
          {shown.map((p) => (
            <img
              key={p}
              src={shot(p, 1440)}
              srcSet={`${shot(p, 1440)} 1440w, ${shot(p, 2880)} 2880w`}
              sizes={SIZES[variant]}
              width={1440}
              height={945}
              loading="lazy"
              decoding="async"
              alt={fmt(t.cstu.alt, { page: t.cstu[p] })}
              aria-hidden={p !== page}
              className={p === page ? "is-shown" : undefined}
            />
          ))}
        </div>
      </div>

      {variant !== "card" && (
        <div className="site__controls">
          <div className="segmented" role="radiogroup" aria-label={t.cstu.pages}>
            {PAGES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={page === p}
                className={page === p ? "is-on" : undefined}
                onClick={() => setPage(p)}
              >
                {t.cstu[p]}
              </button>
            ))}
          </div>
          <figcaption className="t-label">{t.cstu.caption}</figcaption>
        </div>
      )}
    </figure>
  );
}
