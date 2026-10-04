import { useEffect, useState, type CSSProperties } from "react";
import { site } from "../data/site";
import { Link, useRouter, type Route } from "../lib/router";
import { useTheme } from "../lib/theme";
import { ArrowUpRight, Moon, Sun } from "./icons";
import "./Nav.css";

type Item = { label: string; to?: string; href?: string; match?: Route["name"][] };

const ITEMS: Item[] = [
  { label: "Home", to: "/", match: ["home"] },
  { label: "Works", to: "/works", match: ["works", "work"] },
  { label: "Blog", href: site.blog },
  { label: "Contact", to: "/contact", match: ["contact"] },
];

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="nav__icon" onClick={toggle} aria-label={`Switch to ${next} appearance`} title={`Switch to ${next} appearance`}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}

/** True while a dark band (.section--ink) is under the bar, so the glass can darken with it. */
function useOverDark(pathname: string) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const setup = () => {
      io?.disconnect();
      const hits = new Set<Element>();
      // The root shrinks to a 1px line behind the bar's middle. (A strip from the very
      // top would count a band whose bottom edge merely touches it — IO treats
      // edge-adjacent as intersecting, which is exactly where snapped sections sit.)
      const mid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) / 2 || 26;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) hits.add(e.target);
            else hits.delete(e.target);
          }
          setDark(hits.size > 0);
        },
        { rootMargin: `${-(mid - 1)}px 0px ${-(window.innerHeight - mid)}px 0px` },
      );
      document.querySelectorAll(".section--ink").forEach((el) => io!.observe(el));
      setDark(false);
    };
    const id = requestAnimationFrame(setup);
    window.addEventListener("resize", setup);
    return () => {
      cancelAnimationFrame(id);
      io?.disconnect();
      window.removeEventListener("resize", setup);
    };
  }, [pathname]);
  return dark;
}

export function Nav() {
  const { route, pathname } = useRouter();
  const [open, setOpen] = useState(false);
  const overDark = useOverDark(pathname);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const link = (item: Item, className: string, i = 0) => {
    const active = !!item.match?.includes(route.name);
    const cls = `${className}${active ? " is-active" : ""}`;
    const style = { "--i": i } as CSSProperties;
    return item.to ? (
      <Link key={item.label} to={item.to} className={cls} style={style} aria-current={active ? "page" : undefined}>
        {item.label}
      </Link>
    ) : (
      <a key={item.label} href={item.href} className={cls} style={style}>
        {item.label}
        <ArrowUpRight className="nav__ext" />
      </a>
    );
  };

  return (
    <header className={`nav${open ? " is-open" : ""}${overDark && !open ? " is-dark" : ""}`}>
      <div className="nav__bar">
        <Link to="/" className="nav__brand">
          {site.name}
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {ITEMS.map((item) => link(item, "nav__link"))}
        </nav>
        <div className="nav__tools">
          <ThemeButton />
          <button
            type="button"
            className="nav__icon nav__burger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="nav__menu" id="nav-menu" inert={!open}>
        <nav aria-label="Menu">{ITEMS.map((item, i) => link(item, "nav__menu-link", i))}</nav>
      </div>
    </header>
  );
}
