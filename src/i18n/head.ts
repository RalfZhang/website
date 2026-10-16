/**
 * What goes in <head> for each page, in each language: title, description,
 * keywords, canonical URL and the hreflang alternates. The router keeps the live document
 * in step; the build writes the same tags into each page's static HTML, so
 * crawlers and link previews see them without running any script.
 */
import { contactName, contacts } from "../data/contacts";
import { site } from "../data/site";
import { worksIn } from "../data/works";
import { localePath, type Route } from "../lib/routes";
import { LANGS, type Lang } from "./locales";
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
  /** Comma-separated, starting with the name and its spellings. */
  keywords: string;
  /** Language-free path ("/works"), or null for pages that shouldn't be indexed. */
  path: string | null;
}

/** The name and its spellings, then `terms` — each once, whatever its case. */
function keywords(...terms: string[]) {
  const seen = new Set<string>();
  return [site.name, ...site.aliases, ...terms]
    .filter((k) => !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))
    .join(", ");
}

export function pageMeta(lang: Lang, route: Route): PageMeta {
  const t = messages[lang];
  const k = t.meta.keywords;
  const titled = (page: string) => fmt(t.meta.title, { page, name: site.name });
  switch (route.name) {
    case "home":
      return { title: site.name, description: t.meta.description, keywords: keywords(...k.home), path: "/" };
    case "works": {
      const all = worksIn(lang).all;
      const terms = [...k.works, ...all.map((w) => w.title), ...all.flatMap((w) => w.stack)];
      return { title: titled(t.nav.works), description: t.works.lead, keywords: keywords(...terms), path: "/works" };
    }
    case "about":
      return { title: titled(t.about.title), description: t.meta.about, keywords: keywords(...k.about), path: "/about" };
    case "contact": {
      const terms = [...k.contact, ...contacts.map((c) => contactName(c, lang))];
      return { title: titled(t.contact.title), description: t.meta.contact, keywords: keywords(...terms), path: "/contact" };
    }
    case "work": {
      const w = worksIn(lang).get(route.slug)!;
      const terms = [w.title, w.kind, ...w.stack, ...(w.keywords ?? [])];
      return { title: titled(w.title), description: w.tagline, keywords: keywords(...terms), path: `/works/${w.slug}` };
    }
    default:
      return { title: titled(t.notFound.title), description: t.meta.description, keywords: keywords(...k.home), path: null };
  }
}

/**
 * The same page in every language, plus x-default: the language-free URL,
 * which sends each visitor on to the language that suits them.
 */
export function alternates(path: string): { hreflang: string; href: string }[] {
  return [
    ...LANGS.map((l) => ({ hreflang: l, href: absoluteUrl(localePath(l, path)) })),
    { hreflang: "x-default", href: absoluteUrl(path) },
  ];
}
