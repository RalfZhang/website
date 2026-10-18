import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";

/*
 * Big Ben's clock, kept as the bot keeps it (big-ben/lib/text.js): the time in
 * its zone, the strike on the hour, how much of the year has gone, and the
 * bell. How it's drawn is up to whoever draws it (WatchClock, a dial with the
 * bot's last post; the home page's Big Ben screen, the year as the screen).
 */

/* ------------------------------------------------------------------ time
 * The Chinese pages keep Beijing time, as the bot does, whoever is looking. The
 * English pages keep the visitor's own time, so the year slipping away is theirs.
 */
type Wall = { year: number; month: number; day: number; h: number; m: number; s: number };

const QUARTER_HOUR = 15 * 60 * 1000;

export class Zone {
  private parts: Intl.DateTimeFormat;
  private names: Intl.DateTimeFormat;
  private spans = new Map<number, [number, number]>();
  private current: { year: number; span: [number, number] } | null = null;
  private named = new Map<number, string>();

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

  /**
   * "UTC", "PDT", "GMT+8"… — as it stands at instant `t` (daylight saving changes it).
   * Read once a quarter hour, as offsets and their changes all fall on one;
   * a few kept (the dial asks for now, the chime for the hour).
   */
  name(t: number) {
    const at = Math.floor(t / QUARTER_HOUR);
    let name = this.named.get(at);
    if (name === undefined) {
      if (this.named.size >= 8) this.named.clear();
      name = this.names.formatToParts(t).find((x) => x.type === "timeZoneName")?.value ?? "";
      this.named.set(at, name);
    }
    return name;
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

  /** The instants `year` begins and ends here. */
  span(year: number): [number, number] {
    let s = this.spans.get(year);
    if (!s) this.spans.set(year, (s = [this.yearStart(year), this.yearStart(year + 1)]));
    return s;
  }

  /** How much of `year` has gone by at instant `t`, 0–1. */
  progress(t: number, year: number) {
    const [a, b] = this.span(year);
    return (t - a) / (b - a);
  }

  /** The year at instant `t`, and how much of it has gone — the wall clock read only when the year turns. */
  gone(t: number) {
    let y = this.current;
    if (!y || t < y.span[0] || t >= y.span[1]) {
      const year = this.wall(t).year;
      y = this.current = { year, span: this.span(year) };
    }
    return { year: y.year, p: this.progress(t, y.year) };
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

/** The zone the current language's pages keep. */
export function useZone() {
  const { lang } = useI18n();
  return useMemo(() => zoneFor(lang === "zh" ? "Asia/Shanghai" : localTimeZone()), [lang]);
}

/**
 * What the bot posts on the most recent hour — same rules as big-ben/lib/text.js:
 * one strike per hour of the 24 (midnight is 24), the year to three decimals.
 */
export function lastChime(zone: Zone, now = Date.now()) {
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

/* ------------------------------------------------------------------ hands */
/** Hand angles, accumulated so the hands only ever move clockwise (no unwinding at 12 or :00). */
export type Hands = { h: number; m: number; s: number };

function angles(zone: Zone): Hands {
  const t = zone.wall(Date.now());
  return { h: ((t.h % 12) + t.m / 60 + t.s / 3600) * 30, m: (t.m + t.s / 60) * 6, s: t.s * 6 };
}
const forward = (prev: number, next: number) => prev + ((((next - prev) % 360) + 360) % 360);

/** The hands at the time in `zone`, moving on once a second while `running`. */
export function useHands(zone: Zone, running: boolean): Hands {
  const [hands, setHands] = useState<Hands>(() => angles(zone));
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const a = angles(zone);
      setHands((p) => ({ h: forward(p.h, a.h), m: forward(p.m, a.m), s: forward(p.s, a.s) }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, zone]);
  return hands;
}

/* ------------------------------------------------------------------ sound */
let audio: AudioContext | null = null;

/** A struck bell, additively — hum, prime, tierce, quint, nominal… on E3 like the Great Bell. */
export function bong() {
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
