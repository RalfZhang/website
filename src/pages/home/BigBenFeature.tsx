import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { Work } from "../../data/works";
import { fmt, rich, useI18n } from "../../i18n";
import { prefersReducedMotion, useInView, usePageVisible } from "../../lib/motion";
import { useHands, useZone, type Zone } from "../../visuals/bigBen";
import { Dial } from "../../visuals/Dial";
import { boxOf, byLine, crossAt, print, textLines, type Head, type Line } from "../../visuals/dotPrint";
import { FeatureCopy } from "./Feature";
import "./BigBenFeature.css";

/** Seconds to ink a whole year's worth of the screen: less of the year takes less, but at least FILL_MIN_S. */
const FILL_S = 1.4;
const FILL_MIN_S = 0.5;
/**
 * The print heads that put the words and the dial down once the year is in
 * (visuals/dotPrint.ts): square dots of `dot` CSS pixels; a head crossing a
 * line of words at up to `speed` CSS pixels a second, and a picture (the dial,
 * the loupe) at `dotMs` a dot down each column, whichever is slower; dots
 * landing up to `ragged` columns behind the head; `returnMs` between lines.
 * To print faster or slower, change `speed`, and `dotMs` for the dial.
 */
const HEAD: Head = { dot: 10, speed: 1000, dotMs: 0.6, ragged: 20, returnMs: 10 };
/** CSS pixels kept clear either side of the ink's edge, so it can be watched (less down a phone, where room is short). */
const EDGE_GAP = 40;
const EDGE_GAP_ROWS = 24;
/** CSS pixels between the edge and the loupe beside it. */
const LOUPE_GAP = 12;
/** CSS pixels the loupe keeps from the screen's sides and from the nav bar, at the least. */
const SCREEN_GAP = 12;
/** CSS pixels between the words and the dial when they share a side (less down a phone), and between the loupe and its scale. */
const COPY_GAP = 40;
const COPY_GAP_ROWS = 24;
const CAPTION_GAP = 6;
/** The words' width: at most, across the screen and down it; and as narrow as they go to leave the dial DIAL_MIN beside them. */
const COPY_W = 440;
const COPY_W_ROWS = 560;
const COPY_MIN = 260;
/** The dial's diameter: at most, across the screen and down it; under SIDE_BY_SIDE down it, it sits beside its lines. */
const DIAL = 400;
const DIAL_ROWS = 320;
const DIAL_MIN = 200;
const SIDE_BY_SIDE = 180;
/** The loupe's reach: cells either side of the pixel being inked. */
const REACH = 3;

/* ------------------------------------------------------------------ the pixels
 * The screen as a grid of its own device pixels, each one a slice of the year,
 * inked one at a time: down each column from the top-left, a column after
 * another — or, on a screen taller than it's wide, along each row, a row after
 * another — so the ink always travels the screen's longer way.
 */
type Grid = { w: number; h: number; dpr: number; rows: boolean };

/** `n` pixels inked: how many whole lines (columns, or rows), and how far along the next one. */
function lineOf(n: number, g: Grid) {
  const per = g.rows ? g.w : g.h;
  const line = Math.floor(n / per);
  return { line, at: n - line * per };
}

/** `n` pixels inked, in CSS pixels: the whole lines' extent, and the next one's. */
function inked(n: number, g: Grid) {
  const { line, at } = lineOf(n, g);
  return { full: line / g.dpr, part: at / g.dpr };
}

/** `n` pixels inked, on the field (BigBenFeature.css draws it from these). */
function paint(field: HTMLElement, n: number, g: Grid) {
  const { full, part } = inked(n, g);
  field.style.setProperty("--full", `${full}px`);
  field.style.setProperty("--part", `${part}px`);
  field.style.setProperty("--px", `${1 / g.dpr}px`);
}

/**
 * The year in `zone` at instant `t`, how much of it has gone, and that in
 * `total` pixels: how many are in, and how far into its slice the next one is.
 */
function read(zone: Zone, total: number) {
  const { year, p } = zone.gone(Date.now());
  const n = Math.min(total, Math.floor(p * total));
  return { year, p, n, f: Math.min(1, p * total - n) };
}

const easeInOut = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** Either side of the ink's edge: the inked side (left, or above), or the paper. */
type Side = "before" | "after";
/** What a side is, for data-on (BigBenFeature.css). */
const on = (side: Side) => (side === "before" ? "ink" : "paper");

/** Sets `el` straight to where `apply` puts it, past its transition. */
function jump(el: HTMLElement, apply: () => void) {
  el.style.transition = "none";
  apply();
  el.getBoundingClientRect();
  el.style.transition = "";
}

/**
 * Where the loupe's frame (`size` long) starts along the ink's way, in its
 * lane beside the edge on `side`, kept off the screen's ends: `length` long,
 * its first `top` covered (by the nav bar, down the screen).
 */
function laneAt(side: Side, size: number, edge: number, px: number, length: number, top: number) {
  const at = side === "before" ? edge - LOUPE_GAP - size : edge + px + LOUPE_GAP;
  return clamp(at, top + SCREEN_GAP, length - SCREEN_GAP - size);
}

/* ------------------------------------------------------------------ the loupe */
/**
 * The pixel being inked and its neighbours, a cell each, laid out as on the
 * screen with the pixel at the centre: those inked already, the one being
 * inked (`fill` is handed it, to set how far into its slice of the year it is,
 * 0–1, as --f), those to come, and none for pixels off the screen. When a
 * pixel is in and the next begins, the cells slide on by one, as film moves on
 * a frame: along its line, or over to the next line at the end of one. One
 * more cell is laid out on every side for them to slide in from.
 */
function Loupe({ n, grid, fill }: { n: number; grid: Grid; fill: RefObject<HTMLElement | null> }) {
  const { line, at } = lineOf(n, grid);
  const lines = grid.rows ? grid.h : grid.w;
  const per = grid.rows ? grid.w : grid.h;
  const strip = useRef<HTMLDivElement>(null);
  const was = useRef({ line, at });

  // A step on: the cells put back where they were, then let go, so they slide.
  useLayoutEffect(() => {
    const p = was.current;
    was.current = { line, at };
    const el = strip.current;
    const along = line === p.line && at === p.at + 1;
    const over = line === p.line + 1 && at === 0;
    if (!el || !(along || over)) return;
    // Across the screen the cells go up along a column and left to the next; down it, left along a row and up to the next.
    const left = grid.rows ? along : over;
    jump(el, () => (el.style.translate = left ? "0 calc(-1 * var(--pitch))" : "calc(-1 * var(--pitch)) 0"));
    el.style.translate = "";
  }, [line, at, grid.rows]);

  const side = 2 * REACH + 3;
  const cells = [];
  for (let r = 0; r < side; r++)
    for (let c = 0; c < side; c++) {
      const [l, a] = grid.rows ? [line - REACH - 1 + r, at - REACH - 1 + c] : [line - REACH - 1 + c, at - REACH - 1 + r];
      if (l === line && a === at)
        // Keyed by the pixel, so the next one starts empty rather than emptying.
        cells.push(<i key={`now ${n}`} className="is-now" ref={fill} />);
      else {
        const state = l < 0 || l >= lines || a < 0 || a >= per ? "is-out" : l < line || (l === line && a < at) ? "is-ink" : undefined;
        cells.push(<i key={r * side + c} className={state} />);
      }
    }
  return (
    <div className="bbloupe" style={{ "--side": side } as CSSProperties} aria-hidden>
      <div className="bbloupe__strip" ref={strip}>
        {cells}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ printing */
/** What's printed of `el`: its buttons, a row at a time; or its words, a line at a time. */
function linesOf(el: Element, origin: DOMRect): Line[] {
  const buttons = el.querySelectorAll(".button");
  return buttons.length ? byLine(Array.from(buttons, (b) => b.getBoundingClientRect()), origin) : textLines(el, origin);
}

/** The dial, its hands running while `running`: on its own, so their tick each second redraws only it. */
function LiveDial({ zone, running, waking }: { zone: Zone; running: boolean; waking: boolean }) {
  const hands = useHands(zone, running);
  return <Dial zone={zone} hands={hands} waking={waking} />;
}

/* ------------------------------------------------------------------ the screen */
/** Blank paper; the year being inked in; the rest being printed over it; then live, the ink keeping pace with the year. */
type Step = "blank" | "filling" | "printing" | "live";

/**
 * Big Ben's home screen is the year itself. It arrives blank, and the first
 * time it's scrolled to, its pixels are inked one by one in their order (see
 * above), quickly, until as many are inked as the share of the year that has
 * gone, in the zone the bot keeps (bigBen.ts). Then the words and the dial are
 * printed over it a line at a time, in visible dots, as a dot-matrix printer
 * prints (visuals/dotPrint.ts), and the hands run round from twelve to the
 * time once the head has crossed the dial's centre. From then on the ink keeps
 * pace with the year: a pixel more each time its slice of the year has gone
 * by, a few seconds apart on most screens, with a loupe on the pixel being
 * inked, right beside it.
 *
 * The edge is kept clear, so it can be watched: the words take its wider side,
 * the paper while the year is young and the ink after July; the dial goes
 * wherever is roomier after that; the loupe keeps to a lane beside the edge,
 * on the narrower side if it fits there. Each takes the colours of the side
 * it's on. With reduced motion, it's all there from the start.
 */
export function BigBenFeature({ work }: { work: Work }) {
  const { lang, t, formatNumber } = useI18n();
  const zone = useZone();
  const ref = useRef<HTMLElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLCanvasElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLElement>(null);
  // The side of the edge the loupe's lane is on, and the nav bar's height, as the layout last left them.
  const lane = useRef<Side | null>(null);
  const navH = useRef(0);
  const placed = useRef(false);

  const [still] = useState(prefersReducedMotion);
  const [step, setStep] = useState<Step>(still ? "live" : "blank");
  const [grid, setGrid] = useState<Grid | null>(null);
  const [now, setNow] = useState(() => ({ year: zone.gone(Date.now()).year, n: 0 }));
  const total = grid ? grid.w * grid.h : 0;
  const shown = step === "printing" || step === "live";

  const half = useInView(ref, { once: true, threshold: 0.5 });
  const visible = useInView(ref, { threshold: 0 });
  const pageVisible = usePageVisible();
  const live = visible && pageVisible;
  if (half && grid && step === "blank") setStep("filling");

  // The grid: the screen's size in device pixels, and which way the ink goes —
  // measured again when it's resized, and when the pixel ratio changes without
  // a resize (the window dragged to another screen).
  useEffect(() => {
    let size: DOMRectReadOnly | null = null;
    let ratio: MediaQueryList | null = null;
    const measure = () => {
      if (!size) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(size.width * dpr);
      const h = Math.round(size.height * dpr);
      setGrid((g) => (g && g.w === w && g.h === h && g.dpr === dpr ? g : { w, h, dpr, rows: h > w }));
      if (ratio?.matches) return;
      ratio?.removeEventListener("change", measure);
      ratio = window.matchMedia(`(resolution: ${dpr}dppx)`);
      ratio.addEventListener("change", measure);
    };
    const ro = new ResizeObserver(([e]) => {
      size = e.contentRect;
      measure();
    });
    ro.observe(field.current!);
    return () => {
      ro.disconnect();
      ratio?.removeEventListener("change", measure);
    };
  }, []);

  // The year as it stands: read again with each new grid, and every tenth of a
  // second while the screen and its words show — the share to seven decimals,
  // the loupe's pixel filling, and the count whenever another pixel's turn has come.
  useLayoutEffect(() => {
    if (!total) return;
    const update = () => {
      const r = read(zone, total);
      if (pct.current) pct.current.textContent = (r.p * 100).toFixed(7);
      fill.current?.style.setProperty("--f", String(r.f));
      setNow((o) => (o.n === r.n && o.year === r.year ? o : { year: r.year, n: r.n }));
    };
    update();
    if (!live || !shown) return;
    const id = window.setInterval(update, 100);
    return () => clearInterval(id);
  }, [total, zone, live, shown]);

  // Inked in from blank: each frame, the next run of pixels in their order, at a
  // pace that eases in and out, until the share of the year gone is in.
  const latest = useRef({ grid, now, zone });
  useLayoutEffect(() => {
    latest.current = { grid, now, zone };
  });
  useEffect(() => {
    if (step !== "filling") return;
    const g0 = latest.current.grid!;
    // Read now: `now` may not have caught up yet, or may have gone stale while the screen sat blank.
    const total0 = g0.w * g0.h;
    const share = read(latest.current.zone, total0).n / total0;
    const ms = Math.max(FILL_MIN_S, FILL_S * share) * 1000;
    const t0 = performance.now();
    let raf = requestAnimationFrame(function frame(at) {
      const u = Math.min(1, (at - t0) / ms);
      const g = latest.current.grid!;
      paint(field.current!, Math.round(share * easeInOut(u) * g.w * g.h), g);
      if (u < 1) raf = requestAnimationFrame(frame);
      else setStep("printing");
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Once it's in, the ink is the year's, pixel for pixel.
  useLayoutEffect(() => {
    if (grid && shown) paint(field.current!, now.n, grid);
  }, [grid, now.n, shown]);

  // Where the ink's edge is: CSS pixels from where it started.
  const edgeAt = grid ? inked(now.n, grid).full : 0;

  /**
   * The loupe, in its lane beside the edge, level with the pixel being inked
   * as far as the screen allows, and its scale on the side of it facing the
   * screen's middle, where there's room.
   */
  const follow = () => {
    const g = latest.current.grid;
    const fig = lens.current;
    if (!g || !fig || !lane.current) return;
    const f = field.current!.getBoundingClientRect();
    const rows = g.rows;
    const px = 1 / g.dpr;
    const { full, part } = inked(latest.current.now.n, g);
    const frame = fig.firstElementChild as HTMLElement;
    const caption = fig.lastElementChild as HTMLElement;
    const pixel = part + px / 2;
    // Along the ink's way and across it: the screen, the frame, the caption, and how much the nav bar covers.
    const [length, cross] = rows ? [f.height, f.width] : [f.width, f.height];
    const [frameAlong, frameCross] = rows ? [frame.offsetHeight, frame.offsetWidth] : [frame.offsetWidth, frame.offsetHeight];
    const cap = (rows ? caption.offsetWidth : caption.offsetHeight) + CAPTION_GAP;
    const [topAlong, topCross] = rows ? [navH.current, 0] : [0, navH.current];
    const toward: Side = pixel > cross / 2 ? "before" : "after";
    const along = laneAt(lane.current, frameAlong, full, px, length, topAlong);
    const across = clamp(
      pixel - frameCross / 2,
      topCross + SCREEN_GAP + (toward === "before" ? cap : 0),
      cross - SCREEN_GAP - frameCross - (toward === "after" ? cap : 0),
    );
    fig.dataset.caption = toward;
    // Put straight there the first time; from then on it glides, by a pixel or to the next line.
    const move = () => (fig.style.translate = rows ? `${across}px ${along}px` : `${along}px ${across}px`);
    if (placed.current) move();
    else {
      jump(fig, move);
      placed.current = true;
    }
  };
  useLayoutEffect(follow, [now.n]);

  // Everything's place along the ink's way (x across the screen, y down it),
  // kept clear of the edge; across it, the words and the dial are centred.
  useLayoutEffect(() => {
    if (!grid) return;
    const place = () => {
      const f = field.current!.getBoundingClientRect();
      const i = inner.current!.getBoundingClientRect();
      navH.current = parseFloat(getComputedStyle(ref.current!).getPropertyValue("--nav-h")) || 0;
      const rows = grid.rows;
      const px = 1 / grid.dpr;
      const e = edgeAt;
      const [from, to, length] = rows ? [i.top - f.top, i.bottom - f.top, f.height] : [i.left - f.left, i.right - f.left, f.width];
      const [crossFrom, crossTo] = rows ? [i.left - f.left, i.right - f.left] : [i.top - f.top, i.bottom - f.top];
      const setAt = (el: HTMLElement, along: number, cross: number) => {
        el.style.left = `${rows ? cross : along}px`;
        el.style.top = `${rows ? along : cross}px`;
      };

      const edgeGap = rows ? EDGE_GAP_ROWS : EDGE_GAP;
      const copyGap = rows ? COPY_GAP_ROWS : COPY_GAP;

      // The words take the wider side; the loupe's lane the narrower, if it fits
      // between the edge and the screen's end (or the nav bar), else the wider.
      const wide: Side = e - from >= to - (e + px) ? "before" : "after";
      const narrow: Side = wide === "before" ? "after" : "before";
      const frame = lens.current!.firstElementChild as HTMLElement;
      const frameLength = rows ? frame.offsetHeight : frame.offsetWidth;
      const top = rows ? navH.current : 0;
      const roomFor = (s: Side) => (s === "before" ? e - top - SCREEN_GAP : length - (e + px) - SCREEN_GAP);
      lane.current = roomFor(narrow) >= LOUPE_GAP + frameLength ? narrow : wide;
      lens.current!.dataset.on = on(lane.current);
      const l0 = laneAt(lane.current, frameLength, e, px, length, top);

      // Either side, what's left for the words and the dial, clear of the edge and the lane.
      const span: Record<Side, [number, number]> = {
        before: [from, Math.min(e - edgeGap, lane.current === "before" ? l0 - edgeGap : Infinity)],
        after: [Math.max(e + px + edgeGap, lane.current === "after" ? l0 + frameLength + edgeGap : -Infinity), to],
      };
      const [w0, w1] = span[wide];
      const words = copy.current!;
      words.dataset.on = on(wide);
      /** The words `width` wide, at the wide side's far end; what's left either side after them. */
      const lay = (width: number) => {
        words.style.width = `${Math.max(0, width)}px`;
        const taken = rows ? words.offsetHeight : Math.max(0, width);
        setAt(words, wide === "before" ? w0 : w1 - taken, rows ? crossFrom : (crossFrom + crossTo) / 2);
        const left: Record<Side, [number, number]> = { before: [...span.before], after: [...span.after] };
        if (wide === "before") left.before[0] = w0 + taken + copyGap;
        else left.after[1] = w1 - taken - copyGap;
        return left;
      };
      const full = rows ? Math.min(COPY_W_ROWS, crossTo - crossFrom) : Math.min(COPY_W, (to - from) / 2, w1 - w0);
      let left = lay(full);

      // The dial, on whichever side has more room left once the words are in.
      // Across the screen, sharing the words' side, it has them narrow (as far as
      // COPY_MIN) to leave it DIAL_MIN.
      const roomy = (s: Side) => left[s][1] - left[s][0];
      const side: Side = roomy(wide) >= roomy(narrow) ? wide : narrow;
      if (!rows && side === wide && roomy(wide) < DIAL_MIN) left = lay(clamp(w1 - w0 - copyGap - DIAL_MIN, Math.min(COPY_MIN, full), full));
      const [d0, d1] = left[side];
      const box = clock.current!;
      box.dataset.on = on(side);
      const readout = box.lastElementChild as HTMLElement;
      const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
      let size: number;
      box.classList.remove("is-beside");
      if (!rows) {
        // Across the screen: as wide as the room, the lines wrapping under the dial.
        const width = clamp(d1 - d0, 0, DIAL);
        box.style.width = `${width}px`;
        size = Math.min(width, crossTo - crossFrom - readout.offsetHeight - gap);
      } else {
        // Down it: the dial over its lines, or beside them if that would leave it small.
        box.style.width = `${crossTo - crossFrom}px`;
        size = Math.min(DIAL_ROWS, crossTo - crossFrom, d1 - d0 - readout.offsetHeight - gap);
        if (size < SIDE_BY_SIDE) {
          box.classList.add("is-beside");
          size = Math.min(SIDE_BY_SIDE, d1 - d0, (crossTo - crossFrom) / 2);
        }
      }
      box.style.setProperty("--watch-size", `${Math.max(0, size)}px`);
      const boxLength = rows ? box.offsetHeight : box.offsetWidth;
      setAt(box, (d0 + d1) / 2 - boxLength / 2, rows ? crossFrom : (crossFrom + crossTo) / 2);
      follow();
    };
    place();
    const ro = new ResizeObserver(place);
    for (const el of [copy.current!, clock.current!.lastElementChild!, lens.current!]) ro.observe(el);
    return () => ro.disconnect();
  }, [grid, edgeAt, lang]); // follow() only reads refs

  // Printed: the words, and the dial with what's under it and the loupe,
  // through a sheet painted like the year beneath, each a line at a time from
  // the top, the two at once.
  useLayoutEffect(() => {
    if (step !== "printing") return;
    const g = latest.current.grid!;
    const o = ref.current!.getBoundingClientRect();
    const words = Array.from(copy.current!.firstElementChild!.children).flatMap((el) => linesOf(el, o));
    const box = clock.current!;
    const face = boxOf(box.firstElementChild!, o);
    const under = Array.from(box.lastElementChild!.children).flatMap((el) => linesOf(el, o));
    const loupe = [boxOf(lens.current!.firstElementChild!, o), ...textLines(lens.current!.lastElementChild!, o)];
    // The hands set off as the head crosses the dial's centre.
    const dial = [face, ...under, ...loupe];
    box.style.setProperty("--w-wake", `${crossAt(dial, face, face.x + face.w / 2, HEAD) / 1000}s`);

    // The ink as it's drawn beneath: the field's boxes, in the section's coordinates.
    const inkBoxes = Array.from(field.current!.children, (el) => boxOf(el, o));
    const ink = getComputedStyle(field.current!.firstElementChild!).backgroundColor;
    const paper = getComputedStyle(document.body).backgroundColor;
    return print(
      sheet.current!,
      Math.min(g.dpr, 3),
      [words, dial],
      HEAD,
      (ctx, x, y, w, h) => {
        ctx.fillStyle = paper;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = ink;
        for (const a of inkBoxes) {
          const x0 = Math.max(x, a.x);
          const y0 = Math.max(y, a.y);
          const x1 = Math.min(x + w, a.x + a.w);
          const y1 = Math.min(y + h, a.y + a.h);
          if (x1 > x0 && y1 > y0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      },
      () => setStep("live"),
    );
  }, [step]); // the rest is read as it is when printing starts

  const span = total ? zone.span(now.year) : null;
  const perPixel = span ? (span[1] - span[0]) / 1000 / total : 0;
  const cls = ["screen", "bbscreen", grid?.rows ? "is-rows" : "is-cols", `is-${step}`];

  return (
    <section id={work.slug} ref={ref} className={cls.join(" ")} aria-labelledby={`${work.slug}-title`}>
      <div className="bbscreen__field" ref={field} aria-hidden>
        <i className="bbscreen__full" />
        <i className="bbscreen__part" />
      </div>
      {/* Where the words and the dial may go; out of reach until they're printed, so Tab never lands on a link no one can see. */}
      <div className="wrap bbscreen__inner" ref={inner} inert={!shown}>
        <div className="bbscreen__copy" ref={copy}>
          <FeatureCopy work={work} reveal={false} />
        </div>
        <div className="bbscreen__clock" ref={clock}>
          <LiveDial zone={zone} running={live && shown} waking={shown} />
          <p className="bbscreen__readout">
            <span>
              {rich(t.bigben.slipped, {
                year: now.year,
                pct: (
                  <strong>
                    <span ref={pct} />%
                  </strong>
                ),
              })}
            </span>
            <span>{fmt(t.bigben.pixels, { n: formatNumber(now.n), total: formatNumber(total) })}</span>
          </p>
        </div>
        <figure className="bbscreen__lens" ref={lens}>
          {grid && <Loupe n={now.n} grid={grid} fill={fill} />}
          <figcaption>{fmt(t.bigben.perPixel, { s: formatNumber(Math.round(perPixel * 10) / 10) })}</figcaption>
        </figure>
      </div>
      {step === "printing" && <canvas className="bbscreen__sheet" ref={sheet} aria-hidden />}
    </section>
  );
}
