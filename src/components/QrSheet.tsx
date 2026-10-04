import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Contact } from "../data/contacts";
import { ArrowUpRight, BrandIcon, Close, type BrandId } from "./icons";
import { QrCode } from "./QrCode";
import "./QrSheet.css";

const HINT: Record<string, string> = {
  wechat: "Scan with WeChat · 用微信扫一扫",
};

/** The QR code dialog. Portalled to <body>; closes on Esc, the backdrop, or the button. */
export function QrSheet({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const [shown, setShown] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Mount, then open on the next frame so the fade runs; close, then unmount.
  useEffect(() => {
    if (contact) {
      opener.current = document.activeElement as HTMLElement | null;
      setShown(contact);
      const id = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setOpen(false);
    const id = window.setTimeout(() => {
      setShown(null);
      opener.current?.focus?.();
    }, 200);
    return () => clearTimeout(id);
  }, [contact]);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const html = document.documentElement;
    html.classList.add("sheet-open");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      html.classList.remove("sheet-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!shown?.qr) return null;

  return createPortal(
    <div className={`sheet${open ? " is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet__head">
          <BrandIcon id={shown.id as BrandId} className="sheet__logo" />
          <h2 id="sheet-title" className="sheet__title">
            {shown.name}
            {shown.nameZh && <span className="muted"> {shown.nameZh}</span>}
          </h2>
          <button type="button" className="sheet__close" onClick={onClose} ref={closeBtn} aria-label="Close">
            <Close />
          </button>
        </div>
        <div className="sheet__qr">
          <QrCode id={shown.qr} />
        </div>
        <p className="sheet__hint muted">{HINT[shown.id] ?? "Scan with your phone’s camera."}</p>
        <div className="sheet__actions">
          {shown.href && (
            <a className="button" href={shown.href} target="_blank" rel="noreferrer">
              Open {shown.name} <ArrowUpRight />
            </a>
          )}
          {shown.image && (
            <a className="button button--quiet" href={shown.image} target="_blank" rel="noreferrer">
              Original image
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
