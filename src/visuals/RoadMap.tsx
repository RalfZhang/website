import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import "./RoadMap.css";

/* ------------------------------------------------------------------ data
 * src/data/xian-map.json comes from scripts/build-map.mjs: roads already split at
 * their vertex nearest the centre, oriented outward and sorted by that distance.
 */
type Raw = {
  q: number;
  roads: number[][];
  waterAreas: number[][][];
  waterLines: number[][];
};

type Road = {
  cls: number;
  xy: Float32Array; // metres from the centre, y down
  cum: Float32Array; // cumulative length at each vertex
  len: number;
  d0: number; // distance of the first vertex from the centre
  box: [number, number, number, number];
};

type MapData = {
  roads: Road[];
  water: Float32Array[][];
  waterLines: { cls: number; xy: Float32Array }[];
};

function decode(a: number[], offset: number, q: number): Float32Array {
  const n = (a.length - offset) / 2;
  const out = new Float32Array(n * 2);
  let x = 0;
  let y = 0;
  for (let i = 0; i < n; i++) {
    x = i === 0 ? a[offset] : x + a[offset + 2 * i];
    y = i === 0 ? a[offset + 1] : y + a[offset + 2 * i + 1];
    out[2 * i] = x * q;
    out[2 * i + 1] = y * q;
  }
  return out;
}

function prepare(raw: Raw): MapData {
  const roads = raw.roads.map((r): Road => {
    const xy = decode(r, 1, raw.q);
    const n = xy.length / 2;
    const cum = new Float32Array(n);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = xy[2 * i];
      const y = xy[2 * i + 1];
      if (i > 0) cum[i] = cum[i - 1] + Math.hypot(x - xy[2 * i - 2], y - xy[2 * i - 1]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return { cls: r[0], xy, cum, len: cum[n - 1], d0: Math.hypot(xy[0], xy[1]), box: [minX, minY, maxX, maxY] };
  });
  return {
    roads,
    water: raw.waterAreas.map((rings) => rings.map((ring) => decode(ring, 0, raw.q))),
    waterLines: raw.waterLines.map((l) => ({ cls: l[0], xy: decode(l, 1, raw.q) })),
  };
}

let cache: Promise<MapData> | null = null;
const loadMap = () =>
  (cache ??= import("../data/xian-map.json").then((m) => prepare(m.default as unknown as Raw)));

/* ------------------------------------------------------------------ palettes */
export type Palette = { bg: string; ink: string; water: string };

/** InkCity's own wallpaper themes. Water is the ink at 30% over the paper, as in the app. */
export const WALLPAPER: Record<"light" | "dark", Palette> = {
  light: { bg: "#eee8d6", ink: "#2d2d2d", water: "#b4b0a3" },
  dark: { bg: "#000000", ink: "#5e5d58", water: "#1c1c1a" },
};

/* ------------------------------------------------------------------ engine */

// Stroke weights per class in InkCity's units (one unit = 12 m of ground):
// motorway, trunk, primary, secondary, tertiary, minor streets, rail.
const WEIGHT = [1.8, 1.5, 1.2, 1.0, 1.0, 0.85, 0.6];
const WATER_WEIGHT = [1.6, 1.3, 0.7];
const METERS_PER_WEIGHT = 12;
const CLASSES = WEIGHT.length;

const SPREAD_S = 2.4; // seconds until the farthest visible road starts drawing
const SPEED_M_S = 2200; // how fast each road grows

class Engine {
  data: MapData | null = null;
  w = 0;
  h = 0;
  dpr = 1;
  started = false;
  private raf = 0;
  private visible: Road[][] = [];

  constructor(
    private roadCv: HTMLCanvasElement,
    private waterCv: HTMLCanvasElement,
    private palette: Palette,
    private spanKm: number,
    private onDone: () => void,
  ) {}

  setData(d: MapData) {
    this.data = d;
    this.layout();
  }

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const cv of [this.roadCv, this.waterCv]) {
      cv.width = Math.round(w * this.dpr);
      cv.height = Math.round(h * this.dpr);
    }
    this.layout();
    if (this.started) this.drawAll();
  }

  get ready() {
    return !!this.data && this.w > 0;
  }

  private get scale() {
    return Math.max(this.w, this.h) / (this.spanKm * 1000);
  }

  /** Bucket the roads that intersect the canvas by class. */
  private layout() {
    if (!this.data || !this.w) return;
    const s = this.scale;
    const x1 = this.w / 2 / s + 8 / s;
    const y1 = this.h / 2 / s + 8 / s;
    this.visible = Array.from({ length: CLASSES }, () => []);
    for (const r of this.data.roads) {
      const [a, b, c, d] = r.box;
      if (c < -x1 || a > x1 || d < -y1 || b > y1) continue;
      this.visible[r.cls]?.push(r);
    }
  }

  private width(cls: number) {
    return Math.max(0.6, WEIGHT[cls] * METERS_PER_WEIGHT * this.scale);
  }

  private ctx(cv: HTMLCanvasElement) {
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, this.w / 2 * this.dpr, this.h / 2 * this.dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }

  private drawWater() {
    const ctx = this.ctx(this.waterCv);
    ctx.clearRect(-this.w / 2, -this.h / 2, this.w, this.h);
    if (!this.data) return;
    const s = this.scale;
    ctx.fillStyle = ctx.strokeStyle = this.palette.water;
    for (const rings of this.data.water) {
      ctx.beginPath();
      for (const ring of rings) {
        for (let i = 0; i < ring.length; i += 2) {
          if (i === 0) ctx.moveTo(ring[i] * s, ring[i + 1] * s);
          else ctx.lineTo(ring[i] * s, ring[i + 1] * s);
        }
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
    for (const { cls, xy } of this.data.waterLines) {
      ctx.lineWidth = Math.max(0.6, (WATER_WEIGHT[cls] ?? 0.7) * METERS_PER_WEIGHT * s);
      ctx.beginPath();
      for (let i = 0; i < xy.length; i += 2) {
        if (i === 0) ctx.moveTo(xy[i] * s, xy[i + 1] * s);
        else ctx.lineTo(xy[i] * s, xy[i + 1] * s);
      }
      ctx.stroke();
    }
  }

  /** The finished map, at once. */
  drawAll() {
    if (!this.ready) return;
    this.started = true;
    cancelAnimationFrame(this.raf);
    const ctx = this.ctx(this.roadCv);
    ctx.clearRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.strokeStyle = this.palette.ink;
    const s = this.scale;
    for (let c = CLASSES - 1; c >= 0; c--) {
      ctx.lineWidth = this.width(c);
      ctx.beginPath();
      for (const r of this.visible[c]) {
        const xy = r.xy;
        ctx.moveTo(xy[0] * s, xy[1] * s);
        for (let i = 2; i < xy.length; i += 2) ctx.lineTo(xy[i] * s, xy[i + 1] * s);
      }
      ctx.stroke();
    }
    this.drawWater();
    this.onDone();
  }

  /** Ink spreading out from the centre: each road grows from its nearest point. */
  grow() {
    if (!this.ready) return;
    if (prefersReducedMotion()) return this.drawAll();
    this.started = true;
    cancelAnimationFrame(this.raf);

    const s = this.scale;
    const reach = Math.hypot(this.w / 2, this.h / 2) / s;
    const delay = (r: Road) => SPREAD_S * Math.pow(Math.min(1, r.d0 / reach), 0.85);

    const ctx = this.ctx(this.roadCv);
    ctx.clearRect(-this.w / 2, -this.h / 2, this.w, this.h);
    this.drawWater();
    const drawn = new Map<Road, number>();
    const cursor = new Map<Road, number>();
    const next = new Array<number>(CLASSES).fill(0);
    const live: Road[][] = Array.from({ length: CLASSES }, () => []);
    const t0 = performance.now();
    ctx.strokeStyle = this.palette.ink;

    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      let pending = false;
      for (let c = 0; c < CLASSES; c++) {
        const bucket = this.visible[c];
        while (next[c] < bucket.length && delay(bucket[next[c]]) <= t) live[c].push(bucket[next[c]++]);
        if (next[c] < bucket.length) pending = true;
        const L = live[c];
        if (!L.length) continue;
        ctx.lineWidth = this.width(c);
        ctx.beginPath();
        for (let i = L.length - 1; i >= 0; i--) {
          const r = L[i];
          const a = drawn.get(r) ?? 0;
          const b = Math.min(r.len, (t - delay(r)) * SPEED_M_S);
          if (b > a) {
            const { xy, cum } = r;
            const n = cum.length;
            let k = cursor.get(r) ?? 0;
            while (k < n - 2 && cum[k + 1] <= a) k++;
            const fa = (a - cum[k]) / (cum[k + 1] - cum[k] || 1);
            ctx.moveTo((xy[2 * k] + (xy[2 * k + 2] - xy[2 * k]) * fa) * s, (xy[2 * k + 1] + (xy[2 * k + 3] - xy[2 * k + 1]) * fa) * s);
            while (k < n - 1 && cum[k + 1] <= b) {
              k++;
              ctx.lineTo(xy[2 * k] * s, xy[2 * k + 1] * s);
            }
            if (k < n - 1) {
              const fb = (b - cum[k]) / (cum[k + 1] - cum[k] || 1);
              ctx.lineTo((xy[2 * k] + (xy[2 * k + 2] - xy[2 * k]) * fb) * s, (xy[2 * k + 1] + (xy[2 * k + 3] - xy[2 * k + 1]) * fb) * s);
            }
            cursor.set(r, k);
            drawn.set(r, b);
          }
          if (b >= r.len) {
            L[i] = L[L.length - 1];
            L.pop();
          } else pending = true;
        }
        ctx.stroke();
      }
      if (pending) this.raf = requestAnimationFrame(frame);
      else this.onDone();
    };
    this.raf = requestAnimationFrame(frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}

/* ------------------------------------------------------------------ component */

type Props = {
  palette: Palette;
  /** Draw once `start` turns true: grow the ink from the centre, or appear finished. */
  start: boolean;
  grow?: boolean;
  /** Ground covered by the canvas's longer side. */
  spanKm?: number;
  className?: string;
};

/** Xi'an's road network as an InkCity wallpaper, centred on the Bell Tower. */
export function RoadMap({ palette, start, grow = true, spanKm = 9, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const roadCv = useRef<HTMLCanvasElement>(null);
  const waterCv = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const want = useRef<"grow" | "still" | null>(null);
  // State, not a class toggled by hand: React owns className and would wipe it.
  const [done, setDone] = useState(false);

  const kick = () => {
    const e = engine.current;
    if (!e?.ready || e.started || !want.current) return;
    if (want.current === "grow") e.grow();
    else e.drawAll();
  };

  useEffect(() => {
    const el = wrap.current!;
    const e = new Engine(roadCv.current!, waterCv.current!, palette, spanKm, () => setDone(true));
    engine.current = e;
    const ro = new ResizeObserver(([entry]) => {
      e.resize(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
      kick();
    });
    ro.observe(el);
    let alive = true;
    loadMap().then((d) => {
      if (!alive) return;
      e.setData(d);
      kick();
    });
    return () => {
      alive = false;
      ro.disconnect();
      e.destroy();
      engine.current = null;
    };
  }, [palette, spanKm]); // kick() only reads refs

  useEffect(() => {
    if (!start) return;
    want.current = grow ? "grow" : "still";
    kick();
  }, [start, grow]); // kick() only reads refs

  return (
    <div className={`roadmap${done ? " is-done" : ""} ${className ?? ""}`} ref={wrap} style={{ background: palette.bg }} aria-hidden>
      <canvas className="roadmap__water" ref={waterCv} />
      <canvas className="roadmap__roads" ref={roadCv} />
    </div>
  );
}
