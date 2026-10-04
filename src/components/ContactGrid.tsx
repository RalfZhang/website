import { useCallback, useState, type CSSProperties } from "react";
import { contacts, type Contact } from "../data/contacts";
import { ChevronRight, QrIcon } from "./icons";
import { QrSheet } from "./QrSheet";
import "./ContactGrid.css";

/**
 * Every way to reach me, one tile each. Linked platforms open in a new tab;
 * WeChat has no link, so its tile opens the QR code — as does the small QR
 * button on Telegram and WhatsApp.
 */
export function ContactGrid({ compact = false }: { compact?: boolean }) {
  const [sheet, setSheet] = useState<Contact | null>(null);
  const close = useCallback(() => setSheet(null), []);

  return (
    <>
      <ul className={`cgrid${compact ? " cgrid--compact" : ""}`}>
        {contacts.map((c, i) => {
          const body = (
            <>
              <span className="ctile__name">
                {c.name}
                {c.nameZh && <span className="ctile__zh"> {c.nameZh}</span>}
              </span>
              <span className="ctile__handle">{c.handle}</span>
              <span className="ctile__action">
                {c.href ? "Open" : "Show QR code"} <ChevronRight />
              </span>
            </>
          );
          return (
            <li key={c.id} className="cgrid__item" data-reveal style={{ "--d": `${i * 50}ms` } as CSSProperties}>
              {c.href ? (
                <a className="ctile" href={c.href} target="_blank" rel="noreferrer">
                  {body}
                </a>
              ) : (
                <button type="button" className="ctile" onClick={() => setSheet(c)}>
                  {body}
                </button>
              )}
              {c.qr && c.href && (
                <button type="button" className="ctile__qr" onClick={() => setSheet(c)} aria-label={`Show the ${c.name} QR code`} title="QR code">
                  <QrIcon />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <QrSheet contact={sheet} onClose={close} />
    </>
  );
}
