import { fetchMap, transferables, type MapReply } from "./mapData";

/**
 * Fetches and decodes one city map off the main thread, then hands it over.
 * Parsing a big city's JSON and laying out its 90,000 lines would otherwise
 * freeze a slow phone for a tenth of a second, and the home page loads the next
 * city while the reader may well be scrolling.
 */
self.onmessage = async ({ data: url }: MessageEvent<string>) => {
  try {
    const map = await fetchMap(url);
    self.postMessage({ map } satisfies MapReply, { transfer: transferables(map) });
  } catch (err) {
    self.postMessage({ error: String(err) } satisfies MapReply);
  }
};
