import { useEffect, useRef } from "react";
import { Bell } from "../components/icons";
import { fmt, rich, useI18n } from "../i18n";
import { useInView } from "../lib/motion";
import { lastChime, useHands, useZone } from "./bigBen";
import { Dial } from "./Dial";
import "./WatchClock.css";

/**
 * Big Ben on a page: the dial, keeping time while it's in view, and beside it
 * the bot's post for the last hour and the year slipping away. The card shows
 * just the dial.
 */
export function WatchClock({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15 });
  const { lang, t } = useI18n();
  const zone = useZone();
  const hands = useHands(zone, inView);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const showPost = variant !== "card";
  // Re-read on every render — the hands re-render it once a second while it's on screen.
  const chime = lastChime(zone);
  // The bar keeps the year as it stands, as its interval does — not the chime's, which is last year's in the hour after New Year.
  const year = zone.gone(Date.now());

  // The year, slipping away to seven decimals.
  useEffect(() => {
    if (!inView || !showPost) return;
    const update = () => {
      const { p } = zone.gone(Date.now());
      if (pct.current) pct.current.textContent = (p * 100).toFixed(7);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    update();
    const id = window.setInterval(update, 100);
    return () => clearInterval(id);
  }, [inView, showPost, zone]);

  return (
    <div className={`bigben bigben--${variant}`} ref={ref}>
      <Dial zone={zone} hands={hands} />

      {showPost && (
        <div className="bigben__side">
          <div className="notif">
            <span className="notif__icon" aria-hidden>
              {lang === "zh" ? "钟" : <Bell />}
            </span>
            <div className="notif__body">
              <div className="notif__head">
                <span className="notif__app">{t.bigben.app}</span>
                <span className="notif__time">{chime.hhmm}</span>
              </div>
              <p className="notif__text">
                {fmt(t.bigben.post, {
                  strikes: t.bigben.strike.repeat(chime.hour),
                  hour: chime.hour,
                  time: chime.hhmm,
                  zone: chime.zone,
                  year: chime.year,
                  pct: chime.progress,
                })}
              </p>
            </div>
          </div>
          <div className="yearbar">
            <p className="yearbar__label">
              {rich(t.bigben.slipped, {
                year: year.year,
                pct: (
                  <strong>
                    <span ref={pct}>{(year.p * 100).toFixed(7)}</span>%
                  </strong>
                ),
              })}
            </p>
            <span className="yearbar__track">
              <span ref={bar} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
