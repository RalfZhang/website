import { useRef } from "react";
import { Footer } from "../../components/Footer";
import { Jobs } from "../../components/Jobs";
import { useI18n } from "../../i18n";
import { useReveal } from "../../lib/motion";
import "./About.css";

/** Who I am in a sentence, then where I've worked — names only, no résumé. */
export function About() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useI18n();
  useReveal(root, lang);

  return (
    <main className="page aboutpage" ref={root}>
      <header className="wrap page-head" data-reveal>
        <h1 className="t-section">{t.about.title}</h1>
        <p className="t-lead muted">{t.about.intro}</p>
      </header>

      <div className="wrap aboutpage__jobs">
        <Jobs id="experience-title" level={2} />
      </div>

      <Footer />
    </main>
  );
}
