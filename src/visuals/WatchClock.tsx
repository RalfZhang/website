import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "../components/icons";
import { fmt, rich, useI18n } from "../i18n";
import { useInView } from "../lib/motion";
import "./WatchClock.css";

/* ------------------------------------------------------------------ time
 * The Chinese pages keep Beijing time, as the bot does, whoever is looking. The
 * English pages keep the visitor's own time, so the year slipping away is theirs.
 */
type Wall = { year: number; month: number; day: number; h: number; m: number; s: number };

class Zone {
  private parts: Intl.DateTimeFormat;
  private names: Intl.DateTimeFormat;

  constructor(timeZone: string) {
    const numeric = "numeric" as const;
    this.parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: numeric,
      month: numeric,
      day: numeric,
      hour: numeric,
      minute: numeric,
      second: numeric,
      hourCycle: "h23",
    });
    this.names = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" });
  }

  /** The wall clock in this zone at instant `t`. */
  wall(t: number): Wall {
    const p = Object.fromEntries(this.parts.formatToParts(t).map((x) => [x.type, x.value]));
    return { year: +p.year, month: +p.month, day: +p.day, h: +p.hour, m: +p.minute, s: +p.second };
  }

  /** "UTC", "PDT", "GMT+8"… — as it stands at instant `t` (daylight saving changes it). */
  name(t: number) {
    return this.names.formatToParts(t).find((x) => x.type === "timeZoneName")?.value ?? "";
  }

  private offset(t: number) {
    const w = this.wall(t);
    return Date.UTC(w.year, w.month - 1, w.day, w.h, w.m, w.s) - Math.floor(t / 1000) * 1000;
  }

  /** The instant the year begins here: local midnight, 1 January. */
  private yearStart(year: number) {
    const u = Date.UTC(year, 0, 1);
    return u - this.offset(u - this.offset(u));
  }

  /** How much of `year` has gone by at instant `t`, 0–1. */
  progress(t: number, year: number) {
    const a = this.yearStart(year);
    return (t - a) / (this.yearStart(year + 1) - a);
  }
}

const zones = new Map<string, Zone>();
function zoneFor(timeZone: string) {
  let z = zones.get(timeZone);
  if (!z) zones.set(timeZone, (z = new Zone(timeZone)));
  return z;
}

const localTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * What the bot posts on the most recent hour — same rules as big-ben/lib/text.js:
 * one strike per hour of the 24 (midnight is 24), the year to three decimals.
 */
function lastChime(zone: Zone, now = Date.now()) {
  const w = zone.wall(now);
  const at = now - ((w.m * 60 + w.s) * 1000 + (now % 1000));
  const t = zone.wall(at);
  let year = t.year;
  let progress = Math.round(100000 * zone.progress(at, year)) / 1000;
  if (progress === 0) {
    year -= 1;
    progress = 100;
  }
  return { hour: t.h === 0 ? 24 : t.h, year, progress, hhmm: `${String(t.h).padStart(2, "0")}:00`, zone: zone.name(at) };
}

/** Hand angles, accumulated so the hands only ever move clockwise (no unwinding at 12 or :00). */
type Hands = { h: number; m: number; s: number };
function angles(zone: Zone): Hands {
  const t = zone.wall(Date.now());
  return { h: ((t.h % 12) + t.m / 60 + t.s / 3600) * 30, m: (t.m + t.s / 60) * 6, s: t.s * 6 };
}
const forward = (prev: number, next: number) => prev + ((((next - prev) % 360) + 360) % 360);

/* ------------------------------------------------------------------ sound */
let audio: AudioContext | null = null;

/** A struck bell, additively — hum, prime, tierce, quint, nominal… on E3 like the Great Bell. */
function bong() {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    void ctx.resume();
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);
    const partials: [number, number, number][] = [
      [0.5, 0.8, 7],
      [1, 1, 5],
      [1.183, 0.55, 3.6],
      [1.506, 0.35, 3],
      [2, 0.5, 2.6],
      [2.514, 0.22, 1.9],
      [2.662, 0.18, 1.7],
      [3.011, 0.14, 1.4],
      [4.166, 0.09, 1],
    ];
    for (const [ratio, gain, decay] of partials) {
      const o = ctx.createOscillator();
      o.frequency.value = 164.81 * ratio * (1 + (Math.random() - 0.5) * 0.003);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + decay + 0.1);
    }
  } catch {
    /* no audio — fine */
  }
}

/* ------------------------------------------------------------------ face */
const NUMERALS: [string, number][] = [
  ["XII", 0],
  ["III", 90],
  ["VI", 180],
  ["IX", 270],
];

function Face({ label }: { label: string }) {
  return (
    <>
      <circle className="watch__face" r="200" />
      {Array.from({ length: 60 }, (_, i) =>
        i % 5 === 0 ? (
          <rect key={i} className="watch__marker" x="-4.5" y="-184" width="9" height="30" rx="4.5" transform={`rotate(${i * 6})`} />
        ) : (
          <rect key={i} className="watch__tick" x="-1.25" y="-184" width="2.5" height="10" rx="1.25" transform={`rotate(${i * 6})`} />
        ),
      )}
      {NUMERALS.map(([n, deg]) => {
        const a = (deg * Math.PI) / 180;
        return (
          <text key={n} className="watch__numeral" x={Math.sin(a) * 118} y={-Math.cos(a) * 118} dy="0.36em">
            {n}
          </text>
        );
      })}
      <text className="watch__label" y="62">
        {label}
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ component */
export function WatchClock({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15 });
  const { lang, t } = useI18n();
  const zone = useMemo(() => zoneFor(lang === "cn" ? "Asia/Shanghai" : localTimeZone()), [lang]);
  const [hands, setHands] = useState<Hands>(() => angles(zone));
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const showPost = variant !== "card";
  // Re-read on every render — the hands re-render it once a second while it's on screen.
  const chime = lastChime(zone);

  // Tick once a second while visible.
  useEffect(() => {
    if (!inView) return;
    const tick = () => {
      const a = angles(zone);
      setHands((p) => ({ h: forward(p.h, a.h), m: forward(p.m, a.m), s: forward(p.s, a.s) }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [inView, zone]);

  // The year, slipping away to seven decimals.
  useEffect(() => {
    if (!inView || !showPost) return;
    const update = () => {
      const now = Date.now();
      const p = zone.progress(now, zone.wall(now).year);
      if (pct.current) pct.current.textContent = (p * 100).toFixed(7);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    update();
    const id = window.setInterval(update, 100);
    return () => clearInterval(id);
  }, [inView, showPost, zone]);

  const rot = (deg: number) => ({ transform: `rotate(${deg}deg)` });

  return (
    <div className={`bigben bigben--${variant}`} ref={ref}>
      <button type="button" className="watch" onClick={bong} aria-label={t.bigben.ring} title={t.bigben.ring}>
        <svg viewBox="-200 -200 400 400" aria-hidden>
          <Face label={fmt(t.bigben.face, { zone: chime.zone })} />
          <g className="watch__hand watch__hand--hour" style={rot(hands.h)}>
            <rect x="-3" y="-28" width="6" height="30" rx="3" />
            <rect x="-8" y="-112" width="16" height="88" rx="8" />
          </g>
          <g className="watch__hand watch__hand--minute" style={rot(hands.m)}>
            <rect x="-3" y="-28" width="6" height="30" rx="3" />
            <rect x="-6.5" y="-172" width="13" height="148" rx="6.5" />
          </g>
          <g className="watch__hand watch__hand--second" style={rot(hands.s)}>
            <rect x="-1.6" y="-182" width="3.2" height="214" rx="1.6" />
          </g>
          <circle className="watch__pin" r="8" />
          <circle className="watch__pin-dot" r="3" />
        </svg>
      </button>

      {showPost && (
        <div className="bigben__side">
          <div className="notif">
            <span className="notif__icon" aria-hidden>
              {lang === "cn" ? "钟" : <Bell />}
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
                year: chime.year,
                pct: (
                  <strong>
                    <span ref={pct}>{(zone.progress(Date.now(), chime.year) * 100).toFixed(7)}</span>%
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
