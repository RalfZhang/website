import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { crossFade } from "./motion";

export type Theme = "light" | "dark";

const BG: Record<Theme, string> = { light: "#eee8d6", dark: "#000000" };

type ThemeCtx = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

function readStored(): Theme | null {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function store(theme: Theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* private mode — the choice just won't stick */
  }
}

/** The browser chrome should follow the chosen palette, not the OS one. */
function syncThemeColor(theme: Theme) {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m, i) => {
    if (i === 0) {
      m.removeAttribute("media");
      m.content = BG[theme];
    } else m.remove();
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  const apply = useCallback((next: Theme) => {
    const commit = () => {
      document.documentElement.dataset.theme = next;
      flushSync(() => setTheme(next));
      syncThemeColor(next);
    };
    crossFade(commit);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    store(next);
    apply(next);
  }, [apply]);

  // Follow the OS until the visitor makes a choice of their own.
  useEffect(() => {
    syncThemeColor(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!readStored()) apply(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
