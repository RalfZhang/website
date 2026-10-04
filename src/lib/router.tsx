/**
 * A tiny history router — the site has five routes. Navigation swaps the page
 * and goes to the top (or to the #hash), the way a normal link would.
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
import { getWork } from "../data/works";

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

export function matchRoute(pathname: string): Route {
  const p = normalizePath(pathname);
  if (p === "/") return { name: "home" };
  if (p === "/works") return { name: "works" };
  if (p === "/contact") return { name: "contact" };
  const m = /^\/works\/([\w-]+)$/.exec(p);
  if (m && getWork(m[1])) return { name: "work", slug: m[1] };
  return { name: "notfound" };
}

function routeTitle(route: Route): string {
  switch (route.name) {
    case "home":
      return "Ralf Zhang";
    case "works":
      return "Works — Ralf Zhang";
    case "contact":
      return "Contact — Ralf Zhang";
    case "work":
      return `${getWork(route.slug)?.title} — Ralf Zhang`;
    default:
      return "Not found — Ralf Zhang";
  }
}

function scrollToHash(hash: string, behavior: ScrollBehavior) {
  const el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (el) el.scrollIntoView({ behavior });
  else window.scrollTo({ top: 0, behavior });
}

type RouterCtx = { pathname: string; route: Route; navigate: (to: string) => void };
const RouterContext = createContext<RouterCtx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => normalizePath(location.pathname));

  const navigate = useCallback((to: string) => {
    const url = new URL(to, location.href);
    const next = normalizePath(url.pathname);
    const samePage = next === normalizePath(location.pathname);
    history.pushState(null, "", next + url.search + url.hash);
    if (samePage) return scrollToHash(url.hash, "smooth");
    flushSync(() => setPathname(next));
    scrollToHash(url.hash, "instant");
  }, []);

  useEffect(() => {
    const onPop = () => setPathname(normalizePath(location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const route = useMemo(() => matchRoute(pathname), [pathname]);
  useEffect(() => {
    document.title = routeTitle(route);
  }, [route]);

  const value = useMemo(() => ({ pathname, route, navigate }), [pathname, route, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter outside RouterProvider");
  return ctx;
}

type LinkProps = ComponentProps<"a"> & { to: string };

/** In-site link: a real <a href> (new tabs, copy link, no-JS all work), routed client-side. */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
