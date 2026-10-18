import { experienceIn } from "../data/experience";
import { useI18n } from "../i18n";
import { d } from "../lib/motion";
import "./Jobs.css";

/**
 * "Experience" and where I've worked — on the About page and on its own home
 * screen. `level` is the heading's rank on the page it's in; `delay` is when
 * its fade-up starts.
 */
export function Jobs({ id, level, delay = 60 }: { id: string; level: 2 | 3; delay?: number }) {
  const { lang, t } = useI18n();
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section className="jobs" aria-labelledby={id}>
      <Heading id={id} className="t-label jobs__title" data-reveal style={d(delay)}>
        {t.about.experience}
      </Heading>
      <ol className="jobs__list">
        {experienceIn(lang).map((j, i) => (
          <li key={j.company} className="job" data-reveal style={d(delay + 40 + i * 40)}>
            <p className="t-title">{j.company}</p>
            <p className="muted">
              {j.team} · {j.role}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
