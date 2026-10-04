/**
 * What goes in <head> for each page, in each language: title, description,
 * canonical URL and the hreflang alternates. The router keeps the live document
 * in step; the build writes the same tags into each page's static HTML, so
 * crawlers and link previews see them without running any script.
 */
import { site } from "../data/site";
import { worksIn } from "../data/works";
import { localePath, type Route } from "../lib/routes";
import { LANGS, LOCALES, type Lang } from "./locales";
import { messages } from "./messages";
import { fmt } from "./fmt";

/**
 * Absolute URL of a page as the static server answers it: every page is a
 * folder, so with a trailing slash (nginx would 301 the bare form to this).
 */
export const absoluteUrl = (path: string) => `${site.origin}${path === "/" ? "/" : `${path}/`}`;

export interface PageMeta {
  title: string;
  description: string;
  /** Language-free path ("/works"), or null for pages that shouldn't be indexed. */
  path: string | null;
}

export function pageMeta(lang: Lang, route: Route): PageMeta {
  const t = messages[lang];
  const titled = (page: string) => fmt(t.meta.title, { page, name: site.name });
  switch (route.name) {
    case "home":
      return { title: site.name, description: t.meta.description, path: "/" };
    case "works":
      return { title: titled(t.nav.works), description: t.works.lead, path: "/works" };
    case "contact":
      return { title: titled(t.contact.title), description: t.meta.contact, path: "/contact" };
    case "work": {
      const w = worksIn(lang).get(route.slug)!;
      return { title: titled(w.title), description: w.tagline, path: `/works/${w.slug}` };
    }
    default:
      return { title: titled(t.notFound.title), description: t.meta.description, path: null };
  }
}

/**
 * The same page in every language, plus x-default: the language-free URL,
 * which sends each visitor on to the language that suits them.
 */
export function alternates(path: string): { hreflang: string; href: string }[] {
  return [
    ...LANGS.map((l) => ({ hreflang: LOCALES[l].hreflang, href: absoluteUrl(localePath(l, path)) })),
    { hreflang: "x-default", href: absoluteUrl(path) },
  ];
}
