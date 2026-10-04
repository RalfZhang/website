#!/usr/bin/env node
/**
 * Post-build: copy dist/index.html into a folder per route (works/, contact/,
 * works/<slug>/) plus 404.html, so a plain static server — nginx with its stock
 * config, no try_files — serves every deep link. The app routes client-side
 * from there.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const shell = fs.readFileSync(path.join(DIST, "index.html"));

const worksSrc = fs.readFileSync(path.join(ROOT, "src/data/works.ts"), "utf8");
const slugs = [...worksSrc.matchAll(/slug:\s*"([\w-]+)"/g)].map((m) => m[1]);

const routes = ["works", "contact", ...slugs.map((s) => `works/${s}`)];
for (const r of routes) {
  fs.mkdirSync(path.join(DIST, r), { recursive: true });
  fs.writeFileSync(path.join(DIST, r, "index.html"), shell);
}
fs.writeFileSync(path.join(DIST, "404.html"), shell);

console.log(`route shells: ${routes.length} routes + 404.html`);
