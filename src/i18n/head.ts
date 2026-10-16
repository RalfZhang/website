/**
 * What goes in <head> for each page, in each language: title, description,
 * keywords, canonical URL, the hreflang alternates and, on some pages, schema.org
 * JSON-LD. The router keeps the live document in step; the build writes the
 * same tags into each page's static HTML, so crawlers and link previews see
 * them without running any script.
 */
import { contactName, contacts } from "../data/contacts";
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

/* ------------------------------------------------------------------ structured data */

/** One person behind every page: both languages' nodes share this id, so search engines merge them. */
const PERSON_ID = `${site.origin}/#person`;

function person(lang: Lang) {
  const t = messages[lang];
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    alternateName: site.aliases,
    url: absoluteUrl(localePath(lang, "/")),
    jobTitle: t.home.role,
    description: t.meta.about,
    knowsAbout: [...new Set(worksIn(lang).all.flatMap((w) => w.stack))],
    // Accounts only — a contact with a handle is a profile; WhatsApp's link is just a QR code.
    sameAs: [site.blog, ...contacts.filter((c) => c.handle && c.href).map((c) => c.href!)],
  };
}

/**
 * schema.org JSON-LD for a page, or null for none. Home describes the site and
 * who made it; About is the profile page, with the same person as its subject.
 */
export function structuredData(lang: Lang, route: Route): object | null {
  const inLanguage = LOCALES[lang].tag;
  switch (route.name) {
    case "home":
      return {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${site.origin}/#website`,
            url: absoluteUrl("/"),
            name: site.name,
            alternateName: site.aliases,
            inLanguage,
            author: { "@id": PERSON_ID },
          },
          person(lang),
        ],
      };
    case "about":
      return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: absoluteUrl(localePath(lang, "/about")),
        inLanguage,
        mainEntity: person(lang),
      };
    default:
      return null;
  }
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so no string can close the tag. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
