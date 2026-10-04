import { useRef, type CSSProperties } from "react";
import { ContactGrid } from "../../components/ContactGrid";
import { Footer } from "../../components/Footer";
import { ArrowUpRight, BrandIcon, type BrandId } from "../../components/icons";
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
      <header className="wrap page-head" data-reveal>
        <h1 className="t-section">Contact</h1>
        <p className="t-lead muted">Find me on any of these — tap through, or scan a code.</p>
      </header>

      <section className="wrap" aria-label="Platforms">
        <ContactGrid />
      </section>

      <section className="wrap contactpage__codes" aria-labelledby="codes-title">
        <div className="contactpage__head" data-reveal>
          <h2 id="codes-title" className="t-section">
            Scan to chat
          </h2>
          <p className="t-lead muted">扫码添加</p>
        </div>
        <ul className="qrtiles">
          {withQr.map((c, i) => (
            <li key={c.id} className="qrtile" data-reveal style={d(i * 50)}>
              <div className="qrtile__head">
                <BrandIcon id={c.id as BrandId} className="qrtile__logo" />
                <span className="qrtile__name">
                  {c.name}
                  {c.nameZh && <span className="muted"> {c.nameZh}</span>}
                </span>
              </div>
              <div className="qrtile__code">
                <QrCode id={c.qr!} />
              </div>
              {c.href ? (
                <a className="text-link" href={c.href} target="_blank" rel="noreferrer">
                  Open {c.name} <ArrowUpRight />
                </a>
              ) : (
                <p className="t-label">Scan with WeChat</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
