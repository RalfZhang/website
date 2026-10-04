import { useEffect, useState, type RefObject } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fade-up on first sight: every `[data-reveal]` under `ref` gets `.is-in` once
 * it scrolls into view (CSS in base.css does the rest). Runs again when `key`
 * changes, for pages that swap content in place.
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

/** True while the element is in view — or, with `once`, from the first time it is. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = false, threshold = 0.25 }: { once?: boolean; threshold?: number } = {},
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
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold]);
  return inView;
}
