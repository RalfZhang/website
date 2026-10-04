import { useRef, type CSSProperties } from "react";
import { Footer } from "../../components/Footer";
import { SocialRow } from "../../components/SocialRow";
import { useI18n } from "../../i18n";
import { useReveal } from "../../lib/motion";
import "./Contact.css";

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const { t } = useI18n();
  useReveal(root);

  return (
    <main className="page contactpage" ref={root}>
      <section className="wrap contactpage__inner">
        <h1 className="t-section" data-reveal>
          {t.contact.title}
        </h1>
        <div className="contactpage__row" data-reveal style={{ "--d": "60ms" } as CSSProperties}>
          <SocialRow size="lg" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
