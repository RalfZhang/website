import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion, useInView } from "../lib/motion";
import { loadCity } from "./cityMaps";
import { RAIL, TAXIWAY, type MapData, type Paths, type ROAD_CLASSES } from "./mapData";
import "./RoadMap.css";

/* ------------------------------------------------------------------ style
 * InkCity's `standard` wallpaper (../ink-city/src/core/render.ts), as data. Every
 * weight is in its units: one covers 12 m of ground, so a line is as wide as the
 * ground it stands for, at any canvas size. Every tint is the ink laid over the
 * paper at that opacity, baked into one opaque colour (InkCity's mixColor).
 */
export type Palette = { bg: string; ink: string };

/** InkCity's own wallpaper themes. */
export const WALLPAPER: Record<"light" | "dark", Palette> = {
  light: { bg: "#eee8d6", ink: "#2d2d2d" },
  dark: { bg: "#000000", ink: "#5e5d58" },
};

const METERS_PER_WEIGHT = 12;

// Roads by the class build-map.mjs gives them, heaviest first: motorway, trunk,
// primary, secondary, tertiary, residential, track/road/living street,
// service/pedestrian, cycleway — one weight per class, or this doesn't compile.
const ROAD_WEIGHTS = [1.8, 1.5, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6] as const satisfies { length: typeof ROAD_CLASSES };

type Layer = { weight: number; tint: number; cap: CanvasLineCap };

/** Everything stroked, bottom to top as InkCity stacks it. */
const LAYERS: Layer[] = [
  // the roads, thinnest first so the heavier ones lie on top
  ...ROAD_WEIGHTS.map((weight): Layer => ({ weight, tint: 1, cap: "round" })).reverse(),
  { weight: 1.1, tint: 0.7, cap: "round" }, // railways, in InkCity's "plain" mode
  { weight: 1.8, tint: 0.6, cap: "butt" }, // taxiway centrelines…
  { weight: 6, tint: 0.6, cap: "butt" }, // …and runway ones, over the paved areas, in the same tint
];
/** The layer a line is drawn in: a road by its class; RAIL, TAXIWAY and runways, in that order, above the roads. */
const layerOf = (kind: number) => (kind < RAIL ? RAIL - 1 - kind : kind);
const PAVED = layerOf(TAXIWAY); // the paved runway areas go in just under this layer, in its colour
const WATER_TINT = 0.3;
const WATER_WEIGHTS = [1.6, 1.3, 0.7]; // river, canal, the rest

/** `fg` over `bg` at `alpha`, as one opaque colour. */
function mix(fg: string, bg: string, alpha: number) {
  const ch = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(fg, i) * alpha + ch(bg, i) * (1 - alpha)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/* ------------------------------------------------------------------ engine */

const SPREAD_S = 2.4; // seconds until the farthest visible line starts drawing
const SPREAD_CURVE = 0.85; // a line starts at SPREAD_S × (the ink's way to it / its way to the farthest edge) ^ this
/** The ink front's pace as a CSS easing — how far it has come goes as (t / SPREAD_S) ^ (1 / SPREAD_CURVE) — for the shape that lays one map over another. */
const FRONT_EASE = `linear(${Array.from({ length: 11 }, (_, i) => ((i / 10) ** (1 / SPREAD_CURVE)).toFixed(3)).join(", ")})`;
const MAX_PIXELS = 3840 * 2400; // per canvas: past this a huge screen gets a lower resolution, not more memory
const RESIZE_SETTLE_MS = 150; // a drawn map redraws once its new size has held this long
const START_STEPS = 256; // lines are put in order of when they start to within SPREAD_S / this: well under a frame

/** Where the ink starts: the centre, spreading out to every edge, or the left or top edge, sweeping across to the other side. */
export type From = "centre" | "left" | "top";

/** Path i of `p` onto the current path, at `s` px per metre. */
function trace(ctx: CanvasRenderingContext2D, { xy, first }: Paths, i: number, s: number) {
  let k = first[i];
  ctx.moveTo(xy[2 * k] * s, xy[2 * k + 1] * s);
  for (k++; k < first[i + 1]; k++) ctx.lineTo(xy[2 * k] * s, xy[2 * k + 1] * s);
}

/** `items` in order of when each starts, `start[i]` of 0 … `end` seconds, to within one of START_STEPS: a counting sort, one pass however big the city. */
function byStart(items: number[], start: Float32Array, end: number) {
  const step = (i: number) => Math.min(START_STEPS - 1, Math.floor((start[i] / end) * START_STEPS));
  const at = new Uint32Array(START_STEPS + 1);
  for (const i of items) at[step(i) + 1]++;
  for (let k = 1; k <= START_STEPS; k++) at[k] += at[k - 1];
  const out = new Array<number>(items.length);
  for (const i of items) out[at[step(i)]++] = i;
  return out;
}

class Engine {
  data: MapData | null = null;
  w = 0;
  h = 0;
  dpr = 1;
  /** Drawing has begun: growing, or painted. */
  started = false;
  private raf = 0; // non-zero while growing
  private settling = 0;
  private visible: number[][] = []; // the lines in view, by layer: nearest the centre first, as built, or as grow() reorders them
  private areas: number[] = []; // the paved runway areas in view, likewise
  private colors: string[] = []; // by layer
  private water = "";
  private spread = false;
  private done = false;

  constructor(
    private waterCv: HTMLCanvasElement,
    private roadCv: HTMLCanvasElement,
    private palette: Palette,
    private spanKm: number,
    private spreadS: number,
    private onSpread: () => void,
    private onDone: () => void,
  ) {
    this.mixColors();
  }

  private mixColors() {
    const { ink, bg } = this.palette;
    this.colors = LAYERS.map((l) => mix(ink, bg, l.tint));
    this.water = mix(ink, bg, WATER_TINT);
  }

  setData(d: MapData) {
    this.data = d;
    this.layout();
  }

  /** Another palette: from now on, and for what's drawn already, at once. */
  setPalette(p: Palette) {
    this.palette = p;
    this.mixColors();
    if (this.started) this.settle();
  }

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PIXELS / (w * h)));
    if (!this.started) return this.layout();
    // Drawn already: CSS stretches the picture while the size keeps changing; redraw once it holds.
    clearTimeout(this.settling);
    this.settling = window.setTimeout(() => {
      this.layout();
      this.settle();
    }, RESIZE_SETTLE_MS);
  }

  get ready() {
    return !!this.data && this.w > 0;
  }

  private get scale() {
    return Math.max(this.w, this.h) / (this.spanKm * 1000);
  }

  /** Bucket what intersects the canvas by layer. */
  private layout() {
    if (!this.data || !this.w) return;
    const s = this.scale;
    const x1 = this.w / 2 / s + 30 / s;
    const y1 = this.h / 2 / s + 30 / s;
    const inView = (box: Float32Array, i: number) =>
      !(box[4 * i + 2] < -x1 || box[4 * i] > x1 || box[4 * i + 3] < -y1 || box[4 * i + 1] > y1);
    const { lines, areas } = this.data;
    this.visible = LAYERS.map(() => []);
    for (let i = 0; i < lines.kind.length; i++) if (inView(lines.box, i)) this.visible[layerOf(lines.kind[i])].push(i);
    this.areas = [];
    for (let i = 0; i + 1 < areas.first.length; i++) if (inView(areas.box, i)) this.areas.push(i);
  }

  /** A canvas, cleared — and only given its pixels once there's something to draw on it. */
  private ctx(cv: HTMLCanvasElement) {
    const width = Math.round(this.w * this.dpr);
    const height = Math.round(this.h * this.dpr);
    if (cv.width !== width || cv.height !== height) {
      cv.width = width;
      cv.height = height;
    }
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, this.w / 2 * this.dpr, this.h / 2 * this.dpr);
    ctx.lineJoin = "round";
    ctx.clearRect(-this.w / 2, -this.h / 2, this.w, this.h);
    return ctx;
  }

  private pen(ctx: CanvasRenderingContext2D, layer: number) {
    const { weight, cap } = LAYERS[layer];
    ctx.lineWidth = weight * METERS_PER_WEIGHT * this.scale;
    ctx.lineCap = cap;
    ctx.strokeStyle = this.colors[layer];
  }

  /** The paved runway areas in view, from `from` up to `to`. */
  private fill(ctx: CanvasRenderingContext2D, from = 0, to = this.areas.length) {
    if (from >= to) return;
    const s = this.scale;
    ctx.fillStyle = this.colors[PAVED];
    ctx.beginPath();
    for (let j = from; j < to; j++) {
      trace(ctx, this.data!.areas, this.areas[j], s);
      ctx.closePath();
    }
    ctx.fill();
  }

  /** The layers from `from` up, each whole, the paved areas going in under the runway lines. */
  private layers(ctx: CanvasRenderingContext2D, from: number) {
    const s = this.scale;
    for (let k = from; k < LAYERS.length; k++) {
      if (k === PAVED) this.fill(ctx);
      if (!this.visible[k].length) continue;
      this.pen(ctx, k);
      ctx.beginPath();
      for (const i of this.visible[k]) trace(ctx, this.data!.lines, i, s);
      ctx.stroke();
    }
  }

  private drawWater() {
    const ctx = this.ctx(this.waterCv);
    const { water, waterLines } = this.data!;
    const s = this.scale;
    ctx.fillStyle = ctx.strokeStyle = this.water;
    for (let j = 0; j + 1 < water.polys.length; j++) {
      ctx.beginPath();
      for (let r = water.polys[j]; r < water.polys[j + 1]; r++) {
        trace(ctx, water, r, s);
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
    ctx.lineCap = "round";
    WATER_WEIGHTS.forEach((weight, kind) => {
      ctx.lineWidth = weight * METERS_PER_WEIGHT * s;
      ctx.beginPath();
      for (let i = 0; i < waterLines.kind.length; i++) if (waterLines.kind[i] === kind) trace(ctx, waterLines, i, s);
      ctx.stroke();
    });
  }

  /** The finished map, at once. */
  paint() {
    if (!this.ready) return;
    this.started = true;
    this.layers(this.ctx(this.roadCv), 0);
    this.drawWater();
  }

  /** The finished map now, whatever was under way: a growth cut short ends here. */
  private settle() {
    const growing = this.raf !== 0;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.paint();
    if (growing) this.finish();
  }

  /** The ink has reached every edge — every visible line has started. Once. */
  private reachEdges() {
    if (this.spread) return;
    this.spread = true;
    this.onSpread();
  }

  /** The map has appeared, however it did, or never will: spread and done, each announced once. */
  finish() {
    this.reachEdges();
    if (this.done) return;
    this.done = true;
    this.onDone();
  }

  /**
   * Ink spreading out from the centre, or sweeping across from an edge: each line
   * grows from the end the ink reaches first. Lines come split at their vertex
   * nearest the centre and running outward (mapData.ts), so from the centre that's
   * always their first vertex; across, it's either end, and the line is drawn back
   * from its last when that's the nearer. Each paved area starts with its nearest vertex.
   */
  grow(from: From) {
    if (!this.ready) return;
    if (prefersReducedMotion()) {
      this.paint();
      return this.finish();
    }
    this.started = true;

    const { lines, areas } = this.data!;
    const { xy, cum, first } = lines;
    const s = this.scale;
    const x0 = this.w / 2 / s;
    const y0 = this.h / 2 / s;
    // The ink's way to a point: out from the centre, or across from the left or top edge…
    const dist: (x: number, y: number) => number =
      from === "left" ? (x) => x + x0 : from === "top" ? (_, y) => y + y0 : (x, y) => Math.sqrt(x * x + y * y);
    const distAt = (p: Paths, k: number) => dist(p.xy[2 * k], p.xy[2 * k + 1]);
    // …and to the farthest corner, bottom right for each of them.
    const reach = dist(x0, y0);
    const delay = (d: number) => this.spreadS * Math.pow(Math.min(1, Math.max(0, d) / reach), SPREAD_CURVE);
    // Each line grows as fast as the front moves on, at any scale.
    const speed = reach / this.spreadS;

    const n = first.length - 1;
    const begin = new Float32Array(n); // when each line starts…
    const rev = new Uint8Array(n); // …whether from its last vertex…
    const drawn = new Float32Array(n); // …how far along it is drawn…
    const at = new Uint32Array(n); // …and the vertex that leaves it at
    for (const bucket of this.visible)
      for (const i of bucket) {
        const last = first[i + 1] - 1;
        const p = distAt(lines, first[i]);
        const q = distAt(lines, last);
        rev[i] = q < p ? 1 : 0;
        at[i] = q < p ? last : first[i];
        begin[i] = delay(Math.min(p, q));
      }
    const areaBegin = new Float32Array(areas.first.length - 1);
    for (const j of this.areas) {
      let d = Infinity;
      for (let k = areas.first[j]; k < areas.first[j + 1]; k++) d = Math.min(d, distAt(areas, k));
      areaBegin[j] = delay(d);
    }
    // In the order the ink reaches them, as the build has them already from the centre;
    // painting whole layers, the order doesn't matter.
    if (from !== "centre") {
      this.visible = this.visible.map((bucket) => byStart(bucket, begin, this.spreadS));
      this.areas = byStart(this.areas, areaBegin, this.spreadS);
    }

    const ctx = this.ctx(this.roadCv);
    this.drawWater();
    // Onto the path, the point `c` along the line (its cum) between vertices v and w.
    const to = (v: number, w: number, c: number, move: boolean) => {
      const f = (c - cum[v]) / (cum[w] - cum[v] || 1);
      const x = (xy[2 * v] + (xy[2 * w] - xy[2 * v]) * f) * s;
      const y = (xy[2 * v + 1] + (xy[2 * w + 1] - xy[2 * v + 1]) * f) * s;
      if (move) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    };
    const next = LAYERS.map(() => 0);
    const live: number[][] = LAYERS.map(() => []);
    let nextArea = 0;
    const t0 = performance.now();

    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      let pending = false;
      let waiting = false;
      for (let k = 0; k < LAYERS.length; k++) {
        if (k === PAVED) {
          const filled = nextArea;
          while (nextArea < this.areas.length && areaBegin[this.areas[nextArea]] <= t) nextArea++;
          if (nextArea < this.areas.length) pending = waiting = true;
          this.fill(ctx, filled, nextArea);
        }
        const bucket = this.visible[k];
        while (next[k] < bucket.length && begin[bucket[next[k]]] <= t) live[k].push(bucket[next[k]++]);
        if (next[k] < bucket.length) pending = waiting = true;
        const L = live[k];
        if (!L.length) continue;
        this.pen(ctx, k);
        ctx.beginPath();
        for (let j = L.length - 1; j >= 0; j--) {
          const i = L[j];
          const last = first[i + 1] - 1;
          const len = cum[last];
          const a = drawn[i];
          const b = Math.min(len, (t - begin[i]) * speed);
          if (b > a) {
            // a to b of the way it grows, as cum measures the line: walked up the buffer, or back down it.
            const dir = rev[i] ? -1 : 1;
            const end = rev[i] ? first[i] : last;
            const ca = rev[i] ? len - a : a;
            const cb = rev[i] ? len - b : b;
            let v = at[i];
            while (v + dir !== end && dir * (cum[v + dir] - ca) <= 0) v += dir;
            to(v, v + dir, ca, true);
            while (v !== end && dir * (cum[v + dir] - cb) <= 0) {
              v += dir;
              ctx.lineTo(xy[2 * v] * s, xy[2 * v + 1] * s);
            }
            if (v !== end) to(v, v + dir, cb, false);
            at[i] = v;
            drawn[i] = b;
          }
          if (b >= len) {
            L[j] = L[L.length - 1];
            L.pop();
          } else pending = true;
        }
        ctx.stroke();
      }
      if (!waiting) this.reachEdges();
      if (pending) {
        this.raf = requestAnimationFrame(frame);
        return;
      }
      this.raf = 0;
      // Grown piece by piece on one canvas, roads that came late lie over the
      // layers meant to sit above them: lay those down once more, whole, on top.
      this.layers(ctx, RAIL);
      this.finish();
    };
    this.raf = requestAnimationFrame(frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.settling);
    // Give the pixels back now, rather than whenever the canvases are collected.
    for (const cv of [this.waterCv, this.roadCv]) cv.width = cv.height = 0;
  }
}

/* ------------------------------------------------------------------ component */

type Appear = "grow" | "still" | "over";

type Props = {
  /**
   * The city map's URL, from src/data/cities.ts; fetched once the map is within a
   * screen of the viewport. Fixed for the life of a map: key it by city.
   */
  src: string;
  /** InkCity's light or dark wallpaper. Switching repaints the map in place. */
  palette: Palette;
  /** Draw once `start` turns true. */
  start: boolean;
  /**
   * How the map appears: `grow` on blank paper, the ink spreading from `from`;
   * `still`, finished at once; or `over` whatever is beneath it — drawn finished,
   * then uncovered from `from` at the ink's pace, by a circle of paper widening
   * from the centre or an edge sweeping across, its water coming in once that's
   * past the far side.
   */
  appear?: Appear;
  /** Where the ink starts, growing or laid over: the centre, or the left or top edge. */
  from?: From;
  /** Ground covered by the canvas's longer side. */
  spanKm?: number;
  /** Seconds for the ink to reach the edges. */
  spreadS?: number;
  /** Called once the ink has spread to the canvas's edges; appearing any other way, or not at all, with onDone. */
  onSpread?: () => void;
  /** Called once the map has appeared — or couldn't be loaded, so whatever waits on it moves on. */
  onDone?: () => void;
};

/**
 * A city as an InkCity wallpaper, around its centre. It fills its positioned
 * container; maps laid over one another stack in the order they're mounted.
 */
export function RoadMap({ src, palette, start, appear = "grow", from = "centre", spanKm = 9, spreadS = SPREAD_S, onSpread, onDone }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const waterCv = useRef<HTMLCanvasElement>(null);
  const roadCv = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const want = useRef<Appear | null>(null);
  // Any of it within a screen of the viewport.
  const near = useInView(wrap, { once: true, threshold: 0, rootMargin: "100% 0px" });
  // State, not classes toggled by hand: React owns className and would wipe them.
  const [done, setDone] = useState(false);
  const [opening, setOpening] = useState(false);
  // The engine outlives renders: it starts in the current palette, from the current side, and calls the current callbacks.
  const current = useRef({ palette, from, onSpread, onDone });
  useLayoutEffect(() => {
    current.current = { palette, from, onSpread, onDone };
  });

  const kick = () => {
    const e = engine.current;
    if (!e?.ready || e.started || !want.current) return;
    if (want.current === "grow") return e.grow(current.current.from);
    e.paint();
    // Laid over: the sweep uncovers it (RoadMap.css), and its end is the map's.
    if (want.current === "over" && !prefersReducedMotion()) setOpening(true);
    else e.finish();
  };

  useEffect(() => {
    const e = new Engine(
      waterCv.current!,
      roadCv.current!,
      current.current.palette,
      spanKm,
      spreadS,
      () => current.current.onSpread?.(),
      () => {
        setDone(true);
        current.current.onDone?.();
      },
    );
    engine.current = e;
    const ro = new ResizeObserver(([entry]) => {
      e.resize(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
      kick();
    });
    ro.observe(wrap.current!);
    return () => {
      ro.disconnect();
      e.destroy();
      engine.current = null;
    };
  }, [spanKm, spreadS]); // kick() only reads refs

  // Fetch the city once the map is about a screen away.
  useEffect(() => {
    if (!near) return;
    let alive = true;
    loadCity(src).then(
      (d) => {
        if (!alive || !engine.current) return;
        engine.current.setData(d);
        kick();
      },
      () => {
        if (alive) engine.current?.finish();
      },
    );
    return () => {
      alive = false;
    };
  }, [near, src]); // kick() only reads refs

  useEffect(() => {
    if (!start) return;
    want.current = appear;
    kick();
  }, [start, appear]); // kick() only reads refs

  // Before the frame is drawn, so it lands inside the cross-fade of a theme switch.
  useLayoutEffect(() => {
    engine.current?.setPalette(palette);
  }, [palette]);

  return (
    <div
      className={`roadmap roadmap--${from}${done ? " is-done" : appear === "over" ? " is-over" : ""}${opening ? " is-opening" : ""}`}
      ref={wrap}
      style={{ background: palette.bg, "--spread": `${spreadS}s`, "--front-ease": FRONT_EASE } as CSSProperties}
      onAnimationEnd={(ev) => ev.animationName.startsWith("roadmap-open") && engine.current?.finish()}
      aria-hidden
    >
      <canvas className="roadmap__water" ref={waterCv} />
      <canvas className="roadmap__roads" ref={roadCv} />
    </div>
  );
}
