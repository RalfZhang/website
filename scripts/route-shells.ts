/**
 * Build step: a copy of index.html for every route in every language
 * (en/works/inkcity/index.html …), plus the language-free ones (/, works/,
 * contact/ …, which send visitors on to their language) and 404.html — so a
 * plain static server, nginx with its stock config and no try_files, answers
 * every deep link. The app routes client-side from there.
 *
 * Each language's copy carries that page's own <html lang>, title,
 * description, Open Graph tags, canonical URL and hreflang alternates, so
 * crawlers and link previews get them without running the bundle.
 */
import type { Plugin } from "vite";
import { workSlugs } from "../src/data/works";
import { absoluteUrl, alternates, pageMeta } from "../src/i18n/head";
import { LANGS, LOCALES, type Lang } from "../src/i18n/locales";
import { localePath, matchRoute } from "../src/lib/routes";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PATHS = ["/", "/works", "/contact", ...workSlugs.map((s) => `/works/${s}`)];

function alternateLinks(path: string) {
  return alternates(path).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`);
}

function set(html: string, re: RegExp, value: string) {
  if (!re.test(html)) throw new Error(`route-shells: index.html has no ${re}`);
  return html.replace(re, (_, open: string, close: string) => open + esc(value) + close);
}

const inject = (html: string, tags: string[]) => html.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);

/** index.html, as it should be for `path` in `lang`. */
function localized(shell: string, lang: Lang, path: string) {
  const meta = pageMeta(lang, matchRoute(path));
  const url = absoluteUrl(localePath(lang, path));
  let html = shell.replace(/<html lang="[^"]*"/, `<html lang="${LOCALES[lang].tag}"`);
  html = set(html, /(<title>)[^<]*(<\/title>)/, meta.title);
  html = set(html, /(<meta name="description" content=")[^"]*(")/, meta.description);
  html = set(html, /(<meta property="og:title" content=")[^"]*(")/, meta.title);
  html = set(html, /(<meta property="og:description" content=")[^"]*(")/, meta.description);
  return inject(html, [
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:locale" content="${LOCALES[lang].og}" />`,
    ...LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${LOCALES[l].og}" />`),
    `<link rel="canonical" href="${esc(url)}" />`,
    ...alternateLinks(path),
  ]);
}

export function routeShells(): Plugin {
  return {
    name: "route-shells",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const asset = bundle["index.html"];
      if (asset?.type !== "asset") throw new Error("route-shells: no index.html in the bundle");
      const shell = String(asset.source);
      const emit = (fileName: string, source: string) => this.emitFile({ type: "asset", fileName, source });

      for (const lang of LANGS)
        for (const path of PATHS) emit(`${lang}${path === "/" ? "" : path}/index.html`, localized(shell, lang, path));

      // Language-free: the inline script redirects; the alternates tell crawlers where each language is.
      asset.source = inject(shell, alternateLinks("/"));
      for (const path of PATHS.slice(1)) emit(`${path.slice(1)}/index.html`, inject(shell, alternateLinks(path)));
      emit("404.html", inject(shell, ['<meta name="robots" content="noindex" />']));

      console.log(`route shells: ${PATHS.length} routes × ${LANGS.length} languages, ${PATHS.length - 1} redirects, 404.html`);
    },
  };
}
