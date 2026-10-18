import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { scrollParent } from "./scroll";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Make a change as a plain cross-fade where View Transitions exist, at once
 * otherwise (or for anyone who asks for reduced motion). `update` must have
 * changed the page by the time it returns: wrap a React update in flushSync.
 */
export function crossFade(update: () => void) {
  if (prefersReducedMotion() || typeof document.startViewTransition !== "function") update();
  else document.startViewTransition(update);
}

/**
 * Fade-up on first sight: every `[data-reveal]` under `ref` gets `.is-in` once
 * it scrolls into view (CSS in base.css does the rest). Runs again when `key`
 * changes, for pages that swap content in place (another work, another language).
 */
export function useReveal(ref: RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, key]);
}

/** A `[data-reveal]` element's stagger: its fade-up starts `ms` later (the `--d` in base.css). */
export const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * True while the element is in view — or, with `once`, from the first time it is.
 * `rootMargin` widens the view, e.g. "100% 0px" for "within a screen of it".
 * The view is that of whatever the element scrolls in (scrollParent).
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = false, threshold = 0.25, rootMargin = "0px" }: { once?: boolean; threshold?: number; rootMargin?: string } = {},
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { root: scrollParent(el), threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold, rootMargin]);
  return inView;
}

/** False while the page is in a background tab or a minimised window. */
export function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/** Whether a media query matches, kept up to date. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}
