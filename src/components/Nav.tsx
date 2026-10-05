import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { site } from "../data/site";
import { useI18n } from "../i18n";
import { LANGS, LOCALES, storeLang } from "../i18n/locales";
import { prefersReducedMotion } from "../lib/motion";
import { isPlainClick, Link, localePath, useRouter, type Route } from "../lib/router";
import { useTheme } from "../lib/theme";
import { ArrowUpRight, Close, Contrast, Menu } from "./icons";
import "./Nav.css";

type Item = { label: string; to?: string; href?: string; match?: Route["name"][] };

/**
 * The same page in the other language, named in that language. Remembers the
 * pick (it then outranks the browser's languages on the next visit to /), and
 * keeps the scroll position and #section: it's the same page, re-worded.
 */
function LangSwitch() {
  const { lang, path, navigate } = useRouter();
  const other = LANGS.find((l) => l !== lang)!;
  const href = localePath(other, path);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    storeLang(other);
    if (!isPlainClick(e)) return;
    e.preventDefault();
    const go = () => navigate(href + location.hash, { keepScroll: true });
    if (prefersReducedMotion() || typeof document.startViewTransition !== "function") go();
    else document.startViewTransition(go);
  };

  return (
    <a className="nav__lang" href={href} hrefLang={other} lang={LOCALES[other].tag} onClick={onClick}>
      {LOCALES[other].name}
    </a>
  );
}

export function Nav() {
  const { route, path } = useRouter();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items: Item[] = [
    { label: t.nav.home, to: "/", match: ["home"] },
    { label: t.nav.works, to: "/works", match: ["works", "work"] },
    { label: t.nav.blog, href: site.blog },
    { label: t.nav.contact, to: "/contact", match: ["contact"] },
  ];

  const link = (item: Item, className: string, i = 0) => {
    const active = !!item.match?.includes(route.name);
    const cls = `${className}${active ? " is-active" : ""}`;
    const style = { "--i": i } as CSSProperties;
    return item.to ? (
      <Link key={item.to} to={item.to} className={cls} style={style} aria-current={active ? "page" : undefined}>
        {item.label}
      </Link>
    ) : (
      <a key={item.href} href={item.href} className={cls} style={style}>
        {item.label}
        <ArrowUpRight className="nav__ext" />
      </a>
    );
  };

  const themeLabel = theme === "dark" ? t.nav.toLight : t.nav.toDark;

  return (
    <header className={`nav${open ? " is-open" : ""}`}>
      <div className="nav__bar">
        <Link to="/" className="nav__brand">
          {site.name}
        </Link>
        <nav className="nav__links" aria-label={t.nav.primary}>
          {items.map((item) => link(item, "nav__link"))}
        </nav>
        <LangSwitch />
        <button type="button" className="nav__icon" onClick={toggle} aria-label={themeLabel} title={themeLabel}>
          <Contrast />
        </button>
        <button
          type="button"
          className="nav__icon nav__burger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>
      <div className="nav__menu" id="nav-menu" inert={!open}>
        <nav aria-label={t.nav.menu}>{items.map((item, i) => link(item, "nav__menu-link", i))}</nav>
      </div>
    </header>
  );
}
