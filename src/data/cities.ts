/**
 * The cities the InkCity visuals draw, in the order the home page cycles them.
 * The monitor on the work's own page and its card show the first.
 *
 * Each map is a 20 km square around `lat`/`lon`, built by scripts/build-map.mjs
 * into src/data/maps/<slug>.json from the InkCity payload named beside it (kept
 * in ../ink-city/road-test/json). `url` is only fetched once a map is about to
 * be shown.
 */
import type { Text } from "../i18n/locales";
import hongKong from "./maps/hong-kong.json?url";
import kualaLumpur from "./maps/kuala-lumpur.json?url";
import monaco from "./maps/monaco.json?url";
import newYork from "./maps/new-york.json?url";

export interface City {
  slug: string;
  url: string;
  lat: number;
  lon: number;
  /** The city and the landmark the map is centred on, for the caption under the monitor. */
  name: Text;
  centre: Text;
  /**
   * The caption InkCity prints in the wallpaper's corner (its core/label.ts): the
   * city's own name, in its own language, then its English name and country where
   * those add something.
   */
  label: { title: string; lang: string; subtitle?: string };
}

export const CITIES: City[] = [
  {
    // from 40.7484_-73.9857_20261016-192650.json
    slug: "new-york",
    url: newYork,
    lat: 40.7484,
    lon: -73.9857,
    name: { en: "New York", zh: "纽约" },
    centre: { en: "the Empire State Building", zh: "帝国大厦" },
    label: { title: "New York", lang: "en", subtitle: "New York City · United States" },
  },
  {
    // from 22.29_114.165_20261016-201320.json
    slug: "hong-kong",
    url: hongKong,
    lat: 22.29,
    lon: 114.165,
    name: { en: "Hong Kong", zh: "香港" },
    centre: { en: "Victoria Harbour", zh: "维多利亚港" },
    label: { title: "香港", lang: "zh-HK", subtitle: "Hong Kong" },
  },
  {
    // from 3.1579_101.7116_20261016-232245.json
    slug: "kuala-lumpur",
    url: kualaLumpur,
    lat: 3.1579,
    lon: 101.7116,
    name: { en: "Kuala Lumpur", zh: "吉隆坡" },
    centre: { en: "the Petronas Towers", zh: "双子塔" },
    label: { title: "Kuala Lumpur", lang: "ms", subtitle: "Malaysia" },
  },
  {
    // from 43.7396_7.4277_20261016-223018.json
    slug: "monaco",
    url: monaco,
    lat: 43.7396,
    lon: 7.4277,
    name: { en: "Monaco", zh: "摩纳哥" },
    centre: { en: "the Monte Carlo Casino", zh: "蒙特卡洛赌场" },
    label: { title: "Monaco", lang: "fr" },
  },
];

/** Where on Earth, as InkCity prints it: `40.7484° N, 73.9857° W`. */
export function formatLatLon(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}
