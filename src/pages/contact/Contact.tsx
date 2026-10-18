import { useRef } from "react";
import { Footer } from "../../components/Footer";
import { SocialRow } from "../../components/SocialRow";
import { useI18n } from "../../i18n";
import { d, useReveal } from "../../lib/motion";
import "./Contact.css";

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useI18n();
  useReveal(root, lang);

  return (
    <main className="page contactpage" ref={root}>
      <section className="wrap contactpage__inner">
        <h1 className="t-section" data-reveal>
          {t.contact.title}
        </h1>
        <div className="contactpage__row" data-reveal style={d(60)}>
          <SocialRow size="lg" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
