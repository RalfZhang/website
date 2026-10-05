import { useCallback, useState } from "react";
import { contactName, contacts, type Contact } from "../data/contacts";
import { fmt, useI18n } from "../i18n";
import { ArrowUpRight, BrandIcon, type BrandId } from "./icons";
import { QrSheet } from "./QrSheet";
import "./SocialRow.css";

/**
 * Every way to reach me as one row of platform logos. The line under the row
 * names whichever icon is hovered or focused (on touch screens it just reads
 * as the hint). Linked platforms open in a new tab; WeChat has no web link,
 * so it opens its QR code instead.
 */
export function SocialRow({ size = "md", hint }: { size?: "md" | "lg"; hint?: string }) {
  const { lang, t } = useI18n();
  const [active, setActive] = useState<Contact | null>(null);
  const [sheet, setSheet] = useState<Contact | null>(null);
  const close = useCallback(() => setSheet(null), []);

  return (
    <div className={`social social--${size}${active ? " is-pointing" : ""}`}>
      <ul className="social__row" aria-label={t.contact.rowLabel} onPointerLeave={() => setActive(null)}>
        {contacts.map((c) => {
          const props = {
            className: `social__link${active?.id === c.id ? " is-active" : ""}`,
            onPointerEnter: () => setActive(c),
            onFocus: () => setActive(c),
            onBlur: () => setActive(null),
          };
          const icon = <BrandIcon id={c.id as BrandId} />;
          return (
            <li key={c.id}>
              {c.href ? (
                <a {...props} href={c.href} target="_blank" rel="noreferrer" aria-label={[contactName(c, lang), c.handle].filter(Boolean).join(" ")}>
                  {icon}
                </a>
              ) : (
                <button {...props} type="button" onClick={() => setSheet(c)} aria-label={fmt(t.contact.showQr, { name: contactName(c, lang) })}>
                  {icon}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="social__caption" aria-hidden>
        {active ? (
          <span className="social__now" key={active.id}>
            {contactName(active, lang)}
            {active.handle && <span className="muted"> {active.handle}</span>}
            {active.href ? <ArrowUpRight className="social__ext" /> : <span className="muted"> {t.contact.qr}</span>}
          </span>
        ) : (
          <span className="muted">{hint ?? t.contact.hint}</span>
        )}
      </p>

      <QrSheet contact={sheet} onClose={close} />
    </div>
  );
}
