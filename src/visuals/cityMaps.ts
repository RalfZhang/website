import { fetchMap, type MapData, type MapReply } from "./mapData";

/** A city map, fetched and decoded in a worker of its own (./mapWorker.ts) — or here, should one not start. */
function decode(url: string): Promise<MapData> {
  return new Promise((resolve, reject) => {
    const here = () => fetchMap(url).then(resolve, reject);
    let worker: Worker;
    try {
      worker = new Worker(new URL("./mapWorker.ts", import.meta.url), { type: "module" });
    } catch {
      return here();
    }
    worker.onmessage = ({ data }: MessageEvent<MapReply>) => {
      worker.terminate();
      if ("map" in data) resolve(data.map);
      else reject(new Error(data.error));
    };
    // A worker that can't start (no module workers): do the job here instead.
    worker.onerror = () => {
      worker.terminate();
      here();
    };
    worker.postMessage(new URL(url, location.href).href);
  });
}

/*
 * Every city asked for, decoded once: four of them, 12 MB in all, which the home
 * page goes round every half minute. A failed load is forgotten, so the next ask
 * tries again.
 */
const cache = new Map<string, Promise<MapData>>();

/** The city map at `url` (one of src/data/cities.ts's), decoded; fetched the first time it's asked for. */
export function loadCity(url: string): Promise<MapData> {
  let p = cache.get(url);
  if (!p) {
    p = decode(url);
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

/** Start fetching a city that's about to be needed. */
export const preloadCity = (url: string) => void loadCity(url);
