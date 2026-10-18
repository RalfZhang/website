/**
 * Where the page scrolls: the window, except for the home page on iPhones and
 * iPads, which scrolls inside <body> (Home.css says why). Code that reads or
 * moves the page's scroll position goes through here, not the window.
 */

/** How far down the page is scrolled. */
export const pageScrollY = () => window.scrollY || document.body.scrollTop;

/** Back to the top of the page. Whichever of the two doesn't scroll ignores it. */
export function scrollPageToTop(behavior: ScrollBehavior) {
  window.scrollTo({ top: 0, behavior });
  document.body.scrollTo({ top: 0, behavior });
}

/**
 * What `el` scrolls in: its nearest ancestor that scrolls, or null for the
 * window. An IntersectionObserver needs it as its root for a rootMargin to
 * reach past the screen; with the window as root, the scroller's edges clip
 * the view first.
 */
export function scrollParent(el: Element): Element | null {
  for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (overflowY === "auto" || overflowY === "scroll") return p;
  }
  return null;
}
