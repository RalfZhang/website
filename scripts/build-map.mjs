#!/usr/bin/env node
/**
 * Builds src/data/xian-map.json — the road network behind the InkCity visual.
 *
 * Source is one of InkCity's road-test payloads (OpenStreetMap data, the same
 * `{ v, elements, water, railways, … }` shape the app renders). The output is a
 * square crop around the city centre, simplified and quantised so it ships as a
 * small lazy-loaded chunk instead of 17 MB of lat/lon objects.
 *
 * Every road is split at its vertex nearest the centre and oriented outward, and
 * the list is sorted by that distance — so the client can "spread the ink" from
 * the centre just by drawing each polyline from its first point, delayed by how
 * far that first point is.
 *
 *   node scripts/build-map.mjs [path/to/payload.json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC =
  process.argv[2] ??
  path.resolve(ROOT, "../ink-city/road-test/json/34.2690176_108.9471409_20260912-180617.json");
const OUT = path.resolve(ROOT, "src/data/xian-map.json");

const HALF = 6500; // half the side of the square crop, metres
const Q = 2; // quantisation step, metres per unit
const TOL = 3.5; // Douglas–Peucker tolerance, metres

// Road classes, heaviest first. `_link` ramps fold into their base class, as in
// InkCity's widthFor(). Anything not listed is not drawn (footways, service…).
const ROAD_CLASS = {
  motorway: 0,
  trunk: 1,
  primary: 2,
  secondary: 3,
  tertiary: 4,
  residential: 5,
  unclassified: 5,
  living_street: 5,
  pedestrian: 5,
  road: 5,
};
const RAIL_CLASS = 6;
const WATER_LINE_CLASS = { river: 0, canal: 1 }; // others → 2

const payload = JSON.parse(fs.readFileSync(SRC, "utf8"));
const { lat: lat0, lon: lon0 } = payload.city;
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((lat0 * Math.PI) / 180);
const ky = (Math.PI / 180) * R;
const project = (p) => [(p.lon - lon0) * kx, -(p.lat - lat0) * ky];

// ---------------------------------------------------------------- geometry

/** Clip a polyline to the crop square; returns the runs that stay inside. */
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

/** [cls, x0, y0, dx1, dy1, …] — first point absolute, the rest as deltas. */
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

// ---------------------------------------------------------------- layers

const roads = [];
for (const el of payload.elements) {
  if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;
  const cls = ROAD_CLASS[(el.tags?.highway ?? "").replace(/_link$/, "")];
  if (cls === undefined) continue;
  for (const run of prepLine(el.geometry))
    for (const part of orientOutward(run)) roads.push({ cls, pts: part, d: dist(part[0]) });
}
for (const rail of payload.railways ?? []) {
  for (const run of prepLine(rail.line))
    for (const part of orientOutward(run)) roads.push({ cls: RAIL_CLASS, pts: part, d: dist(part[0]) });
}
roads.sort((a, b) => a.d - b.d);

const waterAreas = [];
const waterLines = [];
for (const w of payload.water ?? []) {
  if (w.kind === "area") {
    const rings = [w.polygon.outer, ...(w.polygon.holes ?? [])];
    const projected = rings.map((ring) => quantize(simplify(ring.map(project), TOL)));
    // Skip polygons entirely outside the crop (cheap bbox test on the outer ring).
    const outer = projected[0];
    const lim = HALF / Q;
    const inside = outer.some(([x, y]) => Math.abs(x) <= lim && Math.abs(y) <= lim);
    const spans =
      Math.min(...outer.map((p) => p[0])) < lim &&
      Math.max(...outer.map((p) => p[0])) > -lim &&
      Math.min(...outer.map((p) => p[1])) < lim &&
      Math.max(...outer.map((p) => p[1])) > -lim;
    if (!inside && !spans) continue;
    if (outer.length < 3) continue;
    waterAreas.push(projected.filter((r) => r.length > 2).map((r) => encode(null, r)));
  } else if (w.kind === "line") {
    const cls = WATER_LINE_CLASS[w.cls] ?? 2;
    for (const run of prepLine(w.line)) waterLines.push(encode(cls, run));
  }
}

const out = {
  v: 1,
  name: "Xi'an",
  center: { lat: lat0, lon: lon0 },
  q: Q,
  half: HALF / Q,
  roads: roads.map((r) => encode(r.cls, r.pts)),
  waterAreas,
  waterLines,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const json = JSON.stringify(out);
fs.writeFileSync(OUT, json);

const points = roads.reduce((n, r) => n + r.pts.length, 0);
const byClass = roads.reduce((m, r) => ((m[r.cls] = (m[r.cls] ?? 0) + 1), m), {});
console.log(
  `wrote ${path.relative(ROOT, OUT)}: ${(json.length / 1024).toFixed(0)} KB, ` +
    `${roads.length} polylines / ${points} points, ${waterAreas.length} water areas, ` +
    `${waterLines.length} waterways; by class ${JSON.stringify(byClass)}`,
);
