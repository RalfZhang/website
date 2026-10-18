/**
 * A tiny history router — the site has five routes, each under /en or /zh.
 * Navigation swaps the page and goes to the top (or to the #hash), the way a
 * normal link would. Links inside the site are written language-free
 * (<Link to="/works">) and stay in the current language.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { absoluteUrl, alternates, jsonLd, pageMeta, structuredData } from "../i18n/head";
import { LOCALES, preferredLang, type Lang } from "../i18n/locales";
import { localePath, matchRoute, normalizePath, splitLang, type Route } from "./routes";
import { scrollPageToTop } from "./scroll";

export { localePath, type Route };

/**
 * The current path, always with a language. A language-free URL ("/", or an
 * old link like /works) is normally sent on by the inline script in
 * index.html before any of this loads; this is the fallback.
 */
function currentPath(): string {
  const { lang, path } = splitLang(location.pathname);
  if (lang) return normalizePath(location.pathname);
  const full = localePath(preferredLang(), path);
  history.replaceState(null, "", full + location.search + location.hash);
  return full;
}

/** "/works#x" in Chinese → "/zh/works#x". */
function withLang(lang: Lang, to: string): string {
  const i = to.search(/[?#]/);
  const path = i < 0 ? to : to.slice(0, i);
  return localePath(lang, normalizePath(path || "/")) + (i < 0 ? "" : to.slice(i));
}

function scrollToHash(hash: string, behavior: ScrollBehavior) {
  const el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (el) el.scrollIntoView({ behavior });
  else scrollPageToTop(behavior);
}

function setLink(rel: string, href: string | null, hreflang?: string) {
  const sel = `link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ":not([hreflang])"}`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!href) return el?.remove();
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.append(el);
  }
  el.href = href;
}

function setJsonLd(data: object | null) {
  let el = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (!data) return el?.remove();
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    document.head.append(el);
  }
  el.textContent = jsonLd(data);
}

/** Keep <html lang>, the title, the SEO links and the JSON-LD in step with the page (the build writes the same ones). */
function syncHead(lang: Lang, route: Route) {
  const meta = pageMeta(lang, route);
  document.documentElement.lang = LOCALES[lang].tag;
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  document.querySelector('meta[name="keywords"]')?.setAttribute("content", meta.keywords);
  setLink("canonical", meta.path === null ? null : absoluteUrl(localePath(lang, meta.path)));
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
  if (meta.path !== null) for (const a of alternates(meta.path)) setLink("alternate", a.href, a.hreflang);
  setJsonLd(structuredData(lang, route));
}

type NavigateOptions = { keepScroll?: boolean };
type RouterCtx = {
  lang: Lang;
  /** The current path without its language, e.g. "/works". */
  path: string;
  route: Route;
  /** Go to a full, language-prefixed path. */
  navigate: (to: string, options?: NavigateOptions) => void;
};
const RouterContext = createContext<RouterCtx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(currentPath);

  const navigate = useCallback((to: string, { keepScroll = false }: NavigateOptions = {}) => {
    const url = new URL(to, location.href);
    const next = normalizePath(url.pathname);
    const samePage = next === normalizePath(location.pathname);
    history.pushState(null, "", next + url.search + url.hash);
    if (samePage) return scrollToHash(url.hash, "smooth");
    flushSync(() => setPathname(next));
    if (!keepScroll) scrollToHash(url.hash, "instant");
  }, []);

  useEffect(() => {
    const onPop = () => setPathname(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo(() => {
    const { lang, path } = splitLang(pathname);
    return { lang: lang!, path, route: matchRoute(path), navigate };
  }, [pathname, navigate]);

  useEffect(() => syncHead(value.lang, value.route), [value.lang, value.route]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter outside RouterProvider");
  return ctx;
}

/** A left click with no modifier — the kind the router handles; the rest are the browser's (new tab etc.). */
export const isPlainClick = (e: MouseEvent) =>
  !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

type LinkProps = ComponentProps<"a"> & {
  /** Language-free path: "/works", "/#contact". */
  to: string;
  /** Link to the page in another language; the current one by default. */
  locale?: Lang;
};

/** In-site link: a real <a href> (new tabs, copy link, no-JS all work), routed client-side. */
export function Link({ to, locale, onClick, children, ...rest }: LinkProps) {
  const { lang, navigate } = useRouter();
  const href = withLang(locale ?? lang, to);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (!isPlainClick(e)) return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <a href={href} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
