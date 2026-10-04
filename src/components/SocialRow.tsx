import { useCallback, useState } from "react";
import { contacts, type Contact } from "../data/contacts";
import { ArrowUpRight, BrandIcon, type BrandId } from "./icons";
import { QrSheet } from "./QrSheet";
import "./SocialRow.css";

/**
 * Every way to reach me as one row of platform logos. The line under the row
 * names whichever icon is hovered or focused (on touch screens it just reads
 * as the hint). Linked platforms open in a new tab; WeChat has no web link,
 * so it opens its QR code instead.
 */
export function SocialRow({ size = "md", hint = "Find me on any of these." }: { size?: "md" | "lg"; hint?: string }) {
  const [active, setActive] = useState<Contact | null>(null);
  const [sheet, setSheet] = useState<Contact | null>(null);
  const close = useCallback(() => setSheet(null), []);

  return (
    <div className={`social social--${size}${active ? " is-pointing" : ""}`}>
      <ul className="social__row" aria-label="Find me on" onPointerLeave={() => setActive(null)}>
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
                <a {...props} href={c.href} target="_blank" rel="noreferrer" aria-label={[c.name, c.handle].filter(Boolean).join(" ")}>
                  {icon}
                </a>
              ) : (
                <button {...props} type="button" onClick={() => setSheet(c)} aria-label={`${c.name} — show QR code`}>
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
            {active.name}
            {active.nameZh && ` ${active.nameZh}`}
            {active.handle && <span className="muted"> {active.handle}</span>}
            {active.href ? <ArrowUpRight className="social__ext" /> : <span className="muted"> QR code</span>}
          </span>
        ) : (
          <span className="muted">{hint}</span>
        )}
      </p>

      <QrSheet contact={sheet} onClose={close} />
    </div>
  );
}
