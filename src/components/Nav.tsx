import { useEffect, useState, type CSSProperties } from "react";
import { site } from "../data/site";
import { Link, useRouter, type Route } from "../lib/router";
import { useTheme } from "../lib/theme";
import { ArrowUpRight, Close, Contrast, Menu } from "./icons";
import "./Nav.css";

type Item = { label: string; to?: string; href?: string; match?: Route["name"][] };

const ITEMS: Item[] = [
  { label: "Home", to: "/", match: ["home"] },
  { label: "Works", to: "/works", match: ["works", "work"] },
  { label: "Blog", href: site.blog },
  { label: "Contact", to: "/contact", match: ["contact"] },
];

export function Nav() {
  const { route, pathname } = useRouter();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

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

  const next = theme === "dark" ? "light" : "dark";

  return (
    <header className={`nav${open ? " is-open" : ""}`}>
      <div className="nav__bar">
        <Link to="/" className="nav__brand">
          {site.name}
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {ITEMS.map((item) => link(item, "nav__link"))}
        </nav>
        <button type="button" className="nav__icon" onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
          <Contrast />
        </button>
        <button
          type="button"
          className="nav__icon nav__burger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>
      <div className="nav__menu" id="nav-menu" inert={!open}>
        <nav aria-label="Menu">{ITEMS.map((item, i) => link(item, "nav__menu-link", i))}</nav>
      </div>
    </header>
  );
}
