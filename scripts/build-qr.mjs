#!/usr/bin/env node
/**
 * Builds src/data/qr.json — module matrices for the contact QR codes, so the
 * site can draw them as ink-on-paper SVG instead of shipping screenshots.
 *
 * The payloads were decoded from the QR images on the old site
 * (/telegram.png, /whatsapp.png, /wechat.png, still served from public/).
 *
 *   node scripts/build-qr.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(ROOT, "src/data/qr.json");

// Only platforms reached by scanning need one — WeChat has no web link.
// (Telegram: https://t.me/RalfZhang, WhatsApp: https://wa.me/qr/ZUWG4TFNPUZOL1.)
const CODES = {
  wechat: "https://u.wechat.com/EHMlkrVRbJX5_VxB4IUvuyQ",
};

const out = {};
for (const [id, text] of Object.entries(CODES)) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const rows = [];
  for (let y = 0; y < modules.size; y++) {
    let row = "";
    for (let x = 0; x < modules.size; x++) row += modules.get(y, x) ? "1" : "0";
    rows.push(row);
  }
  out[id] = { text, size: modules.size, rows };
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(
  `wrote ${path.relative(ROOT, OUT)}:`,
  Object.entries(out)
    .map(([k, v]) => `${k} ${v.size}×${v.size}`)
    .join(", "),
);
