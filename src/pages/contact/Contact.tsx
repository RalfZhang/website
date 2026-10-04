import { useRef, type CSSProperties } from "react";
import { ContactGrid } from "../../components/ContactGrid";
import { Footer } from "../../components/Footer";
import { ChevronRight } from "../../components/icons";
import { QrCode } from "../../components/QrCode";
import { contacts } from "../../data/contacts";
import { useReveal } from "../../lib/motion";
import "./Contact.css";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Contact() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  const withQr = contacts.filter((c) => c.qr);

  return (
    <main className="page contactpage" ref={root}>
      <header className="wrap page-head">
        <h1 className="t-section two-tone" data-reveal>
          <strong>Contact.</strong> Find me on any of these — tap through, or scan a code.
        </h1>
      </header>

      <section className="wrap" aria-label="Platforms">
        <ContactGrid />
      </section>

      <section className="wrap contactpage__codes" aria-labelledby="codes-title">
        <h2 id="codes-title" className="t-section two-tone" data-reveal>
          <strong>Scan to chat.</strong> 扫码添加。
        </h2>
        <ul className="qrtiles">
          {withQr.map((c, i) => (
            <li key={c.id} className="qrtile" data-reveal style={d(i * 80)}>
              <div className="qrtile__code">
                <QrCode id={c.qr!} />
              </div>
              <p className="qrtile__name">
                {c.name}
                {c.nameZh && <span className="muted"> {c.nameZh}</span>}
              </p>
              {c.href ? (
                <a className="chevron-link" href={c.href} target="_blank" rel="noreferrer">
                  Open {c.name} <ChevronRight />
                </a>
              ) : (
                <p className="muted">Scan with WeChat</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
