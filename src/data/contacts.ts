import qr from "./qr.json";

export type QrId = keyof typeof qr;

export interface Contact {
  id: string;
  name: string;
  nameZh?: string;
  handle: string;
  /** Opens in a new tab. Contacts without one open their QR code instead. */
  href?: string;
  /** Key into qr.json — shown on hover (desktop) and in the QR dialog. */
  qr?: QrId;
  /** The original screenshot from the old site, kept for long-press / saving. */
  image?: string;
}

export const contacts: Contact[] = [
  { id: "github", name: "GitHub", handle: "@RalfZhang", href: "https://github.com/RalfZhang" },
  {
    id: "telegram",
    name: "Telegram",
    handle: "@RalfZhang",
    href: "https://t.me/RalfZhang",
    qr: "telegram",
    image: "/telegram.png",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    handle: "Scan or tap",
    href: "https://wa.me/qr/ZUWG4TFNPUZOL1",
    qr: "whatsapp",
    image: "/whatsapp.png",
  },
  { id: "wechat", name: "WeChat", nameZh: "微信", handle: "Scan to add", qr: "wechat", image: "/wechat.png" },
  { id: "instagram", name: "Instagram", handle: "@ralf_zhang", href: "https://www.instagram.com/ralf_zhang/" },
  { id: "douban", name: "Douban", nameZh: "豆瓣", handle: "RalfZ", href: "https://www.douban.com/people/RalfZ/" },
  { id: "duolingo", name: "Duolingo", handle: "KangZhang", href: "https://www.duolingo.com/profile/KangZhang" },
];

export const qrCodes = qr;
