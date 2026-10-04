import { Footer } from "../components/Footer";
import { ArrowLeft } from "../components/icons";
import { useI18n } from "../i18n";
import { Link } from "../lib/router";

export function NotFound() {
  const { t } = useI18n();
  return (
    <main className="page lost">
      <section className="wrap lost__inner">
        <p className="t-label">404</p>
        <h1 className="t-headline">{t.notFound.headline}</h1>
        <p className="t-lead muted">{t.notFound.text}</p>
        <Link to="/" className="button lost__home">
          <ArrowLeft /> {t.notFound.home}
        </Link>
      </section>
      <Footer />
    </main>
  );
}
