import { Footer } from "../components/Footer";
import { ArrowLeft } from "../components/icons";
import { Link } from "../lib/router";

export function NotFound() {
  return (
    <main className="page lost">
      <section className="wrap lost__inner">
        <p className="t-label">404</p>
        <h1 className="t-headline">Off the map</h1>
        <p className="t-lead muted">There’s no road here. The page you’re after may have moved.</p>
        <Link to="/" className="button lost__home">
          <ArrowLeft /> Back home
        </Link>
      </section>
      <Footer />
    </main>
  );
}
