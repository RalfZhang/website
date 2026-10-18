#!/usr/bin/env node
/**
 * Builds src/data/maps/<slug>.json — one city for the InkCity visuals, with the
 * layers InkCity's own `standard` wallpaper draws (../ink-city/src/core/render.ts):
 *
 *   roads    every class the standard preset strokes, by weight
 *   rails    surface railways (drawn in InkCity's "plain" mode)
 *   runways  runways and taxiways, as filled areas and as centrelines
 *   water    lakes, rivers and the sea
 *
 * Source is an InkCity payload — OpenStreetMap data for a square around the
 * centre, `{ v, elements, water, airports, railways, …, km, city }` — as InkCity
 * fetches it for the app:
 *
 *   (in ../ink-city) pnpm render <lat>/<lon> --fetch-only --km 20 -o road-test/json
 *
 * The output is that square simplified and quantised, so a city ships as a few
 * hundred KB that the page fetches only when it's about to show it, instead of
 * tens of MB of lat/lon objects. The site's cities, and the payload each was
 * built from, are listed in src/data/cities.ts.
 *
 * Every line is split at its vertex nearest the centre and oriented outward, and
 * each list (the runway outlines too) is sorted by that distance — so the client
 * can "spread the ink" from the centre just by drawing each polyline from its
 * first point, delayed by how far that first point is.
 *
 *   node scripts/build-map.mjs <payload.json> <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [SRC, SLUG] = process.argv.slice(2);
if (!SRC || !SLUG) {
  console.error("usage: node scripts/build-map.mjs <payload.json> <slug>");
  process.exit(1);
}
const OUT = path.resolve(ROOT, `src/data/maps/${SLUG}.json`);

const Q = 2; // quantisation step, metres per unit
const TOL = 3.5; // Douglas–Peucker tolerance, metres

// Road classes as indices into the client's ROAD_WEIGHTS (src/visuals/RoadMap.tsx),
// heaviest first — InkCity's `standard` preset. `_link` ramps fold into their base
// class, as in InkCity's widthFor(); anything not listed isn't drawn (footways,
// paths, steps…). Area-mapped highways never reach here: InkCity drops them when
// it fetches.
const ROAD_CLASS = {
  motorway: 0,
  trunk: 1,
  primary: 2,
  secondary: 3,
  tertiary: 4,
  residential: 5,
  unclassified: 5,
  track: 6,
  road: 6,
  living_street: 6,
  service: 7,
  pedestrian: 7,
  cycleway: 8,
};
const RUNWAY_KIND = { taxiway: 0, runway: 1 };
const WATER_LINE_CLASS = { river: 0, canal: 1 }; // others → 2

const payload = JSON.parse(fs.readFileSync(SRC, "utf8"));
const { lat: lat0, lon: lon0 } = payload.city;
const KM = payload.km ?? 20; // the side of the square
const HALF = KM * 500; // half of it, metres
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((lat0 * Math.PI) / 180);
const ky = (Math.PI / 180) * R;
const project = (p) => [(p.lon - lon0) * kx, -(p.lat - lat0) * ky];

// ---------------------------------------------------------------- geometry

/** Clip a polyline to the square; returns the runs that stay inside. */
function clipPolyline(pts) {
  const runs = [];
  let run = [];
  for (let i = 1; i < pts.length; i++) {
    const seg = clipSegment(pts[i - 1], pts[i]);
    if (!seg) {
      if (run.length > 1) runs.push(run);
      run = [];
      continue;
    }
    const [a, b, aClipped, bClipped] = seg;
    if (aClipped || run.length === 0) {
      if (run.length > 1) runs.push(run);
      run = [a];
    }
    run.push(b);
    if (bClipped) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

/** Liang–Barsky against [-HALF, HALF]². */
function clipSegment([x0, y0], [x1, y1]) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  const edges = [
    [-dx, x0 + HALF],
    [dx, HALF - x0],
    [-dy, y0 + HALF],
    [dy, HALF - y0],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [[x0 + t0 * dx, y0 + t0 * dy], [x0 + t1 * dx, y0 + t1 * dy], t0 > 0, t1 < 1];
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const tol2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let worst = -1;
    let worstD = tol2;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    }
    if (worst > 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function quantize(pts) {
  const out = [];
  for (const [x, y] of pts) {
    const qx = Math.round(x / Q);
    const qy = Math.round(y / Q);
    const last = out[out.length - 1];
    if (!last || last[0] !== qx || last[1] !== qy) out.push([qx, qy]);
  }
  return out;
}

const dist = ([x, y]) => Math.hypot(x, y);

/** Split at the vertex nearest the centre so both halves grow outward from it. */
function orientOutward(pts) {
  let k = 0;
  for (let i = 1; i < pts.length; i++) if (dist(pts[i]) < dist(pts[k])) k = i;
  const parts = [];
  if (k > 0) parts.push(pts.slice(0, k + 1).reverse());
  if (k < pts.length - 1) parts.push(pts.slice(k));
  return parts.filter((p) => p.length > 1);
}

/** [prefix, x0, y0, dx1, dy1, …] — first point absolute, the rest as deltas. */
function encode(prefix, pts) {
  const out = prefix === null ? [] : [prefix];
  let px = 0;
  let py = 0;
  pts.forEach(([x, y], i) => {
    out.push(i === 0 ? x : x - px, i === 0 ? y : y - py);
    px = x;
    py = y;
  });
  return out;
}

function prepLine(latlon) {
  return clipPolyline(latlon.map(project))
    .map((run) => quantize(simplify(run, TOL)))
    .filter((run) => run.length > 1);
}

/** A closed ring, simplified and quantised like every line. */
const ring = (latlon) => quantize(simplify(latlon.map(project), TOL));

/** An outline, unless it lies wholly outside the square (a cheap bbox test). */
function prepRing(latlon) {
  const r = ring(latlon);
  const lim = HALF / Q;
  const xs = r.map((p) => p[0]);
  const ys = r.map((p) => p[1]);
  const spans = Math.min(...xs) < lim && Math.max(...xs) > -lim && Math.min(...ys) < lim && Math.max(...ys) > -lim;
  return r.length > 2 && spans ? r : null;
}

/** Lines split outward and nearest-first, each tagged with its class (or none). */
function outward(items) {
  const out = [];
  for (const { cls, line } of items)
    for (const run of prepLine(line)) for (const pts of orientOutward(run)) out.push({ cls, pts, d: dist(pts[0]) });
  return out.sort((a, b) => a.d - b.d).map((r) => encode(r.cls, r.pts));
}

// ---------------------------------------------------------------- layers

const roads = outward(
  payload.elements
    .filter((el) => el.type === "way" && el.geometry?.length >= 2)
    .map((el) => ({ cls: ROAD_CLASS[(el.tags?.highway ?? "").replace(/_link$/, "")], line: el.geometry }))
    .filter((r) => r.cls !== undefined),
);

const rails = outward((payload.railways ?? []).map((r) => ({ cls: null, line: r.line })));

const airports = payload.airports ?? [];
const runways = {
  lines: outward(airports.filter((f) => f.line).map((f) => ({ cls: RUNWAY_KIND[f.kind], line: f.line }))),
  // drawn in the centrelines' colour, so a paved area is just its outline
  areas: airports
    .filter((f) => f.area)
    .map((f) => prepRing(f.area))
    .filter(Boolean)
    .map((r) => ({ r, d: Math.min(...r.map(dist)) }))
    .sort((a, b) => a.d - b.d)
    .map(({ r }) => encode(null, r)),
};

const waterAreas = [];
const waterLines = [];
for (const w of payload.water ?? []) {
  if (w.kind === "line") {
    for (const run of prepLine(w.line)) waterLines.push(encode(WATER_LINE_CLASS[w.cls] ?? 2, run));
    continue;
  }
  // a lake or river area, or the sea ("ocean", traced from the coastline)
  const outer = prepRing(w.polygon.outer);
  if (!outer) continue;
  const holes = (w.polygon.holes ?? []).map(ring).filter((r) => r.length > 2);
  waterAreas.push([outer, ...holes].map((r) => encode(null, r)));
}

const out = {
  v: 2,
  center: { lat: lat0, lon: lon0 },
  km: KM,
  q: Q,
  roads,
  rails,
  runways,
  waterAreas,
  waterLines,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const json = JSON.stringify(out);
fs.writeFileSync(OUT, json);

const byClass = roads.reduce((m, r) => ((m[r[0]] = (m[r[0]] ?? 0) + 1), m), {});
console.log(
  `wrote ${path.relative(ROOT, OUT)}: ${(json.length / 1024).toFixed(0)} KB — ` +
    `${roads.length} road lines ${JSON.stringify(byClass)}, ${rails.length} rail lines, ` +
    `${runways.lines.length + runways.areas.length} runway/taxiway shapes, ` +
    `${waterAreas.length} water areas, ${waterLines.length} waterways`,
);
