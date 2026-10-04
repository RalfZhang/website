/**
 * The site's two languages. The URL is the source of truth — every page lives
 * under /en or /cn — and `Lang` is that path segment. The BCP 47 tags that go
 * into `<html lang>`, hreflang and Intl are kept separately, because "cn" is
 * what the URL says, not a language code.
 */
export const LANGS = ["en", "cn"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export const LOCALES: Record<Lang, { tag: string; hreflang: string; og: string; name: string }> = {
  // `name` is the language's own name for itself — that's what a reader looks for in a switcher.
  en: { tag: "en", hreflang: "en", og: "en_US", name: "English" },
  // Every flavour of Chinese is served the Simplified pages, so hreflang claims all of "zh";
  // `zh-CN` on <html> picks Simplified glyphs and the right system font.
  cn: { tag: "zh-CN", hreflang: "zh", og: "zh_CN", name: "中文" },
};

export const isLang = (s: unknown): s is Lang => LANGS.includes(s as Lang);

/** The first of the visitor's languages we have decides: any Chinese → cn, English → en; nothing → en. */
export function detectLang(languages: readonly string[]): Lang {
  for (const l of languages) {
    const primary = l.toLowerCase().split("-")[0];
    if (primary === "zh") return "cn";
    if (primary === "en") return "en";
  }
  return DEFAULT_LANG;
}

/* An explicit pick from the switcher outranks the browser's languages. Mirrored
   by the inline script in index.html, which picks the language before first paint. */
const KEY = "lang";

export function storedLang(): Lang | null {
  try {
    const l = localStorage.getItem(KEY);
    return isLang(l) ? l : null;
  } catch {
    return null;
  }
}

export function storeLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* private mode — the choice just won't stick */
  }
}

export const preferredLang = (): Lang => storedLang() ?? detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
