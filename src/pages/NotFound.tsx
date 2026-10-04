import { Footer } from "../components/Footer";
import { Link } from "../lib/router";

export function NotFound() {
  return (
    <main className="page lost">
      <section className="wrap lost__inner">
        <p className="t-eyebrow muted">404</p>
        <h1 className="t-headline">Off the map.</h1>
        <p className="t-sub muted">There’s no road here. The page you’re after may have moved.</p>
        <Link to="/" className="button lost__home">
          Back home
        </Link>
      </section>
      <Footer />
    </main>
  );
}
