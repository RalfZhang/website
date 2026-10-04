import { site } from "../data/site";
import { fmt, useI18n } from "../i18n";
import { Link } from "../lib/router";
import "./Footer.css";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <p>{fmt(t.footer.copyright, { year: new Date().getFullYear(), name: site.name })}</p>
        <nav className="footer__links" aria-label={t.footer.label}>
          <Link to="/works">{t.nav.works}</Link>
          <a href={site.blog}>{t.nav.blog}</a>
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link to="/contact">{t.nav.contact}</Link>
        </nav>
      </div>
    </footer>
  );
}
