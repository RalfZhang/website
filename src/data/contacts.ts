import type { Lang } from "../i18n/locales";
import qr from "./qr.json";

export type QrId = keyof typeof qr;

export interface Contact {
  id: string;
  name: string;
  nameZh?: string;
  /** Account name, shown next to the platform when its icon is hovered. */
  handle?: string;
  /** Opens in a new tab. Contacts without one open their QR code instead. */
  href?: string;
  /** Key into qr.json, for contacts reached by scanning. */
  qr?: QrId;
  /** The original screenshot from the old site, linked from the QR dialog. */
  image?: string;
}

export const contacts: Contact[] = [
  { id: "github", name: "GitHub", handle: "@RalfZhang", href: "https://github.com/RalfZhang" },
  { id: "telegram", name: "Telegram", handle: "@RalfZhang", href: "https://t.me/RalfZhang" },
  { id: "whatsapp", name: "WhatsApp", href: "https://wa.me/qr/ZUWG4TFNPUZOL1" },
  { id: "wechat", name: "WeChat", nameZh: "微信", qr: "wechat", image: "/wechat.png" },
  { id: "instagram", name: "Instagram", handle: "@ralf_zhang", href: "https://www.instagram.com/ralf_zhang/" },
  { id: "douban", name: "Douban", nameZh: "豆瓣", handle: "RalfZ", href: "https://www.douban.com/people/RalfZ/" },
  { id: "duolingo", name: "Duolingo", handle: "KangZhang", href: "https://www.duolingo.com/profile/KangZhang" },
];

export const qrCodes = qr;

/**
 * A platform's name for the given language. English pages keep the Chinese
 * name alongside ("WeChat 微信") — that's what the app is called on the phone;
 * Chinese pages need only the one.
 */
export const contactName = (c: Contact, lang: Lang) => (lang === "cn" ? (c.nameZh ?? c.name) : c.name);
export const contactAside = (c: Contact, lang: Lang) => (lang === "cn" ? undefined : c.nameZh);
