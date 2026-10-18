/*
 * Printing, the way a dot-matrix printer prints: line by line, its head
 * crossing each line a column of dots at a time, each dot a square you can
 * see. Done in reverse: a canvas over what's to be printed is painted to look
 * like what's beneath it, and cleared a dot at a time in the head's order, so
 * the page beneath shows through where the head has been, and stays crisp.
 * The dots of a line land a little raggedly behind the head, as from a worn
 * ribbon. A tall line (a picture) goes a dot at a time down each column, so it
 * takes longer to cross than a line of words. Several runs of lines can be
 * printed at once, a head for each, all on one grid of dots.
 */

/** A line to print: a box in CSS pixels, in the canvas's own box. */
export type Line = { x: number; y: number; w: number; h: number };

export type Head = {
  /** A dot's side, in CSS pixels. */
  dot: number;
  /** CSS pixels a second the head crosses a line at, at its fastest. */
  speed: number;
  /** Milliseconds per dot down a column, for lines too tall to cross at full speed. */
  dotMs: number;
  /** How many columns behind the head a dot may land. */
  ragged: number;
  /** Milliseconds from the end of one line to the start of the next. */
  returnMs: number;
};

/** A line's grid of dots: its first column and row, how many of each, and how long each column takes. */
function grid(line: Line, head: Head) {
  const c0 = Math.floor(line.x / head.dot);
  const r0 = Math.floor(line.y / head.dot);
  const cols = Math.ceil((line.x + line.w) / head.dot) - c0;
  const rows = Math.ceil((line.y + line.h) / head.dot) - r0;
  return { c0, r0, cols, rows, col: Math.max((head.dot / head.speed) * 1000, rows * head.dotMs) };
}

/** A head's job: each line's grid, and when it starts it, in milliseconds from the start. */
function plan(lines: Line[], head: Head) {
  let t = 0;
  return lines.map((line) => {
    const g = grid(line, head);
    const start = t;
    t += (g.cols + head.ragged) * g.col + head.returnMs;
    return { start, ...g };
  });
}

/** Milliseconds a head printing `run` takes from its start to `x` along `line`, one of the run's. */
export function crossAt(run: Line[], line: Line, x: number, head: Head) {
  const g = plan(run, head)[run.indexOf(line)];
  return g.start + (Math.floor(x / head.dot) - g.c0) * g.col;
}

/* ------------------------------------------------------------------ lines from the page */
/** Boxes merged into one for each line they sit on, top to bottom, in `origin`'s coordinates. */
export function byLine(rects: DOMRect[], origin: DOMRect): Line[] {
  const lines: { l: number; t: number; r: number; b: number }[] = [];
  for (const r of rects) {
    if (r.width < 1 || r.height < 1) continue;
    const same = lines.find((l) => r.top < l.b - 2 && r.bottom > l.t + 2);
    if (!same) lines.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
    else {
      same.l = Math.min(same.l, r.left);
      same.t = Math.min(same.t, r.top);
      same.r = Math.max(same.r, r.right);
      same.b = Math.max(same.b, r.bottom);
    }
  }
  return lines.sort((a, b) => a.t - b.t).map((l) => ({ x: l.l - origin.left, y: l.t - origin.top, w: l.r - l.l, h: l.b - l.t }));
}

/** `el`'s box as one line (a picture), in `origin`'s coordinates. */
export function boxOf(el: Element, origin: DOMRect): Line {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}

/** `el`'s words, a line at a time, in `origin`'s coordinates. */
export function textLines(el: Element, origin: DOMRect): Line[] {
  const range = document.createRange();
  range.selectNodeContents(el);
  return byLine(Array.from(range.getClientRects()), origin);
}

/** A fixed scatter in [0, 1) for each dot, so a reprint lands the same way. */
function scatter(x: number, y: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Prints `runs` of lines through `canvas`, which lies over them, sized to its
 * own box at `dpr`, a head for each run, all starting together:
 * `cover(ctx, x, y, w, h)` paints a box (CSS pixels) as it looks under the
 * canvas, and each dot is cleared once its head has passed it. `done` once
 * the last is down. Returns a stop, which leaves it as it is.
 */
export function print(
  canvas: HTMLCanvasElement,
  dpr: number,
  runs: Line[][],
  head: Head,
  cover: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void,
  done: () => void,
) {
  const box = canvas.getBoundingClientRect();
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Every line covered now, in the order the heads reach them.
  const across = Math.ceil(box.width / head.dot);
  const down = Math.ceil(box.height / head.dot);
  const queue = runs.flatMap((lines) => plan(lines, head)).sort((a, b) => a.start - b.start);
  for (const { c0, r0, cols, rows } of queue) cover(ctx, c0 * head.dot, r0 * head.dot, cols * head.dot, rows * head.dot);

  // A line's dots are worked out only once its head gets there, so the work is
  // spread over the printing: those on the canvas that no line before it took,
  // each with when it lands, in that order.
  const taken = new Uint8Array(across * down);
  const begin = ({ start, c0, r0, cols, rows, col }: (typeof queue)[number]) => {
    const when = new Float32Array(cols * rows);
    const where = new Uint32Array(cols * rows);
    let n = 0;
    for (let c = Math.max(0, -c0); c < cols && c0 + c < across; c++)
      for (let r = Math.max(0, -r0); r < rows && r0 + r < down; r++) {
        const i = (r0 + r) * across + c0 + c;
        if (taken[i]) continue;
        taken[i] = 1;
        // Down the column as the head passes it, then landing up to `ragged` columns late.
        when[n] = start + (c + r / rows) * col + scatter(c0 + c, r0 + r) * head.ragged * col;
        where[n++] = i;
      }
    const order = Uint32Array.from({ length: n }, (_, j) => j).sort((a, b) => when[a] - when[b]);
    return { when, where, order, k: 0 };
  };

  let next = 0;
  let going: ReturnType<typeof begin>[] = [];
  let raf = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = now - t0;
    while (next < queue.length && queue[next].start <= t) going.push(begin(queue[next++]));
    for (const line of going)
      for (; line.k < line.order.length && line.when[line.order[line.k]] <= t; line.k++) {
        const i = line.where[line.order[line.k]];
        ctx.clearRect((i % across) * head.dot, Math.floor(i / across) * head.dot, head.dot, head.dot);
      }
    going = going.filter((line) => line.k < line.order.length);
    if (next < queue.length || going.length) raf = requestAnimationFrame(frame);
    else done();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
