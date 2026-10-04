import { useEffect, useRef, useState } from "react";
import { useInView } from "../lib/motion";
import "./WatchClock.css";

/* ------------------------------------------------------------------ time
 * Big Ben keeps Beijing time (UTC+8, no DST), whoever is looking at it.
 */
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function beijing(now = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  return { year: +p.year, h: +p.hour, m: +p.minute, s: +p.second };
}

const OFFSET = 8 * 3600_000;
const yearProgress = (at: number, year: number) =>
  (at - (Date.UTC(year, 0, 1) - OFFSET)) / (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1));

/** What the bot posted on the most recent hour — same rules as big-ben/lib/text.js. */
function lastChime(now = Date.now()) {
  const at = Math.floor((now + OFFSET) / 3600_000) * 3600_000 - OFFSET;
  const t = beijing(new Date(at));
  let year = t.year;
  let progress = Math.round(100000 * yearProgress(at, year)) / 1000;
  if (progress === 0) {
    year -= 1;
    progress = 100;
  }
  return { hour: t.h === 0 ? 24 : t.h, year, progress, hhmm: `${String(t.h).padStart(2, "0")}:00` };
}

/** Hand angles, accumulated so the hands only ever move clockwise (no unwinding at 12 or :00). */
type Hands = { h: number; m: number; s: number };
function angles(): Hands {
  const t = beijing();
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

function Face() {
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
        北京时间
      </text>
    </>
  );
}

/* ------------------------------------------------------------------ component */
export function WatchClock({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15 });
  const [hands, setHands] = useState<Hands>(angles);
  const [chime, setChime] = useState(lastChime);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const showPost = variant !== "card";

  // Tick once a second while visible.
  useEffect(() => {
    if (!inView) return;
    const tick = () => {
      const a = angles();
      setHands((p) => ({ h: forward(p.h, a.h), m: forward(p.m, a.m), s: forward(p.s, a.s) }));
      setChime((c) => {
        const n = lastChime();
        return n.hour === c.hour && n.year === c.year ? c : n;
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [inView]);

  // The year, slipping away to seven decimals.
  useEffect(() => {
    if (!inView || !showPost) return;
    const update = () => {
      const now = Date.now();
      const p = yearProgress(now, beijing(new Date(now)).year);
      if (pct.current) pct.current.textContent = (p * 100).toFixed(7);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    update();
    const id = window.setInterval(update, 100);
    return () => clearInterval(id);
  }, [inView, showPost]);

  const rot = (deg: number) => ({ transform: `rotate(${deg}deg)` });

  return (
    <div className={`bigben bigben--${variant}`} ref={ref}>
      <button type="button" className="watch" onClick={bong} aria-label="Ring the bell" title="Ring the bell">
        <svg viewBox="-200 -200 400 400" aria-hidden>
          <Face />
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
              钟
            </span>
            <div className="notif__body">
              <div className="notif__head">
                <span className="notif__app">豆瓣大笨钟</span>
                <span className="notif__time">{chime.hhmm}</span>
              </div>
              <p className="notif__text" lang="zh-CN">
                {"咣！".repeat(chime.hour)}豆瓣大笨钟提醒您：北京时间 {chime.hour} 点整，{chime.year} 年已悄悄溜走 {chime.progress}%。
              </p>
            </div>
          </div>
          <div className="yearbar">
            <p className="yearbar__label">
              <strong>
                <span ref={pct}>{(yearProgress(Date.now(), chime.year) * 100).toFixed(7)}</span>%
              </strong>{" "}
              of {chime.year} has quietly slipped away.
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
