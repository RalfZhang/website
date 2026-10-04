import { site } from "../data/site";
import { Link } from "../lib/router";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner t-small">
        <p>
          Copyright © {new Date().getFullYear()} {site.name}. Map data © OpenStreetMap contributors.
        </p>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/works">Works</Link>
          <a href={site.blog}>Blog</a>
          <a href={site.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
