/**
 * A city map as the renderer holds it: every layer in a few flat typed arrays
 * instead of tens of thousands of little objects, so a city decodes off the main
 * thread (./mapWorker.ts), crosses over without being copied, and costs the
 * garbage collector nothing to keep.
 *
 * The source is src/data/maps/<slug>.json, from scripts/build-map.mjs: each
 * polyline as [kind?, x0, y0, dx1, dy1, …] in steps of `q` metres, every line
 * already split at its vertex nearest the centre, oriented outward and sorted by
 * that distance.
 */

/** Many polylines in one buffer: path i is vertices first[i] … first[i + 1] - 1, vertex k at xy[2k], xy[2k + 1]. */
export type Paths = { xy: Float32Array; first: Uint32Array };

export type MapData = {
  /** What the ink draws along — roads, railways, runway centrelines — nearest the centre first within each kind. */
  lines: Paths & {
    kind: Uint8Array; // a road class, RAIL, TAXIWAY, or TAXIWAY + 1 for a runway
    cum: Float32Array; // distance along its line, at each vertex
    d0: Float32Array; // how far the line starts from the centre
    box: Float32Array; // its bounds: minX, minY, maxX, maxY at 4i
  };
  /** Runways and taxiways mapped as their paved outline, nearest the centre first. */
  areas: Paths & { d0: Float32Array; box: Float32Array };
  /** Lakes, rivers and the sea: polygon j is rings polys[j] … polys[j + 1] - 1, its outline and then its holes. */
  water: Paths & { polys: Uint32Array };
  /** Waterways drawn as lines: 0 river, 1 canal, 2 the rest. */
  waterLines: Paths & { kind: Uint8Array };
};

/** Road classes, 0 motorway … 8 cycleway, as scripts/build-map.mjs numbers them; the other kinds follow. */
export const ROAD_CLASSES = 9;
export const RAIL = ROAD_CLASSES;
export const TAXIWAY = RAIL + 1;

type Raw = {
  q: number;
  roads: number[][]; // [class, x0, y0, dx1, dy1, …]
  rails: number[][]; // [x0, y0, dx1, dy1, …]
  runways: { lines: number[][]; areas: number[][] }; // lines [0 taxiway | 1 runway, x0, y0, …], areas [x0, y0, …]
  waterAreas: number[][][]; // per polygon, its rings as [x0, y0, dx1, dy1, …]
  waterLines: number[][]; // [kind, x0, y0, …]
};

/** One encoded polyline: its numbers, where its coordinates start in them, and its kind. */
type Src = { a: number[]; at: number; kind: number };

/** Lay polylines end to end in one buffer, undoing the deltas and the quantisation. */
function pack(src: Src[], q: number): Paths & { kind: Uint8Array } {
  let n = 0;
  for (const s of src) n += (s.a.length - s.at) / 2;
  const xy = new Float32Array(n * 2);
  const first = new Uint32Array(src.length + 1);
  const kind = new Uint8Array(src.length);
  let k = 0;
  src.forEach(({ a, at, kind: kd }, i) => {
    first[i] = k;
    kind[i] = kd;
    let x = 0;
    let y = 0;
    for (let j = at; j < a.length; j += 2, k++) {
      x = j === at ? a[j] : x + a[j];
      y = j === at ? a[j + 1] : y + a[j + 1];
      xy[2 * k] = x * q;
      xy[2 * k + 1] = y * q;
    }
  });
  first[src.length] = k;
  return { xy, first, kind };
}

/** Each path's bounds, and its distance from the centre: of its first vertex, or of its nearest one. */
function measure({ xy, first }: Paths, from: "start" | "nearest") {
  const n = first.length - 1;
  const box = new Float32Array(n * 4);
  const d0 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let d = Infinity;
    for (let k = first[i]; k < first[i + 1]; k++) {
      const x = xy[2 * k];
      const y = xy[2 * k + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (from === "nearest" || k === first[i]) d = Math.min(d, Math.hypot(x, y));
    }
    box.set([minX, minY, maxX, maxY], 4 * i);
    d0[i] = d;
  }
  return { box, d0 };
}

export function decodeMap(raw: Raw): MapData {
  const { q } = raw;
  const lines = pack(
    [
      ...raw.roads.map((a) => ({ a, at: 1, kind: a[0] })),
      ...raw.rails.map((a) => ({ a, at: 0, kind: RAIL })),
      ...raw.runways.lines.map((a) => ({ a, at: 1, kind: TAXIWAY + a[0] })),
    ],
    q,
  );
  const cum = new Float32Array(lines.xy.length / 2);
  const { xy, first } = lines;
  for (let i = 0; i + 1 < first.length; i++)
    for (let k = first[i] + 1; k < first[i + 1]; k++)
      cum[k] = cum[k - 1] + Math.hypot(xy[2 * k] - xy[2 * k - 2], xy[2 * k + 1] - xy[2 * k - 1]);

  const areas = pack(raw.runways.areas.map((a) => ({ a, at: 0, kind: 0 })), q);

  const rings: Src[] = [];
  const polys = new Uint32Array(raw.waterAreas.length + 1);
  raw.waterAreas.forEach((poly, j) => {
    polys[j] = rings.length;
    for (const a of poly) rings.push({ a, at: 0, kind: 0 });
  });
  polys[raw.waterAreas.length] = rings.length;
  const water = pack(rings, q);

  return {
    lines: { ...lines, cum, ...measure(lines, "start") },
    areas: { xy: areas.xy, first: areas.first, ...measure(areas, "nearest") },
    water: { xy: water.xy, first: water.first, polys },
    waterLines: pack(raw.waterLines.map((a) => ({ a, at: 1, kind: a[0] })), q),
  };
}

/** Fetch and decode a city map: in ./mapWorker.ts, or here where a worker can't start. */
export async function fetchMap(url: string): Promise<MapData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return decodeMap(await res.json());
}

/** What ./mapWorker.ts answers a URL with. */
export type MapReply = { map: MapData } | { error: string };

/** Every buffer behind a map, to hand them over rather than copy them. */
export function transferables(m: MapData): ArrayBuffer[] {
  const arrays = [m.lines, m.areas, m.water, m.waterLines].flatMap((p) => Object.values(p) as ArrayBufferView[]);
  return [...new Set(arrays.map((a) => a.buffer as ArrayBuffer))];
}
