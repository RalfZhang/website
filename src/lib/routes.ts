/**
 * Route matching, with no React in it — the build reads it too, to write a page
 * per route (scripts/route-shells.ts). Paths here are language-free ("/works");
 * the /en or /zh in front is split off first.
 */
import { hasWork } from "../data/works";
import { isLang, type Lang } from "../i18n/locales";

export type Route =
  | { name: "home" }
  | { name: "works" }
  | { name: "work"; slug: string }
  | { name: "contact" }
  | { name: "notfound" };

export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/** "/zh/works/" → { lang: "zh", path: "/works" }; "/works" → { lang: null, path: "/works" }. */
export function splitLang(pathname: string): { lang: Lang | null; path: string } {
  const p = normalizePath(pathname);
  const seg = p.split("/")[1];
  if (!isLang(seg)) return { lang: null, path: p };
  return { lang: seg, path: normalizePath(p.slice(seg.length + 1)) };
}

/** "/works" in Chinese → "/zh/works"; home is just "/zh". */
export const localePath = (lang: Lang, path: string) => `/${lang}${path === "/" ? "" : path}`;

export function matchRoute(path: string): Route {
  if (path === "/") return { name: "home" };
  if (path === "/works") return { name: "works" };
  if (path === "/contact") return { name: "contact" };
  const m = /^\/works\/([\w-]+)$/.exec(path);
  if (m && hasWork(m[1])) return { name: "work", slug: m[1] };
  return { name: "notfound" };
}
