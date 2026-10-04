#!/usr/bin/env node
/**
 * Builds src/data/brands.json — the platform logos for the contact tiles, taken
 * from Simple Icons (CC0; the marks themselves belong to their owners). Only the
 * paths we use are kept, so the site doesn't ship the whole icon set.
 *
 *   node scripts/build-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as si from "simple-icons";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(ROOT, "src/data/brands.json");

// contact id → Simple Icons export
const ICONS = {
  github: "siGithub",
  telegram: "siTelegram",
  whatsapp: "siWhatsapp",
  wechat: "siWechat",
  instagram: "siInstagram",
  douban: "siDouban",
  duolingo: "siDuolingo",
};

const out = {};
for (const [id, key] of Object.entries(ICONS)) {
  const icon = si[key];
  if (!icon) throw new Error(`simple-icons has no ${key}`);
  out[id] = { title: icon.title, path: icon.path };
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`wrote ${path.relative(ROOT, OUT)}: ${Object.keys(out).join(", ")}`);
