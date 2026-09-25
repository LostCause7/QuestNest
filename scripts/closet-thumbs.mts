import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../lib/cosmetics";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "closet");

function hue(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) % 360;
  return h;
}

function svgFor(kind: string, key: string, emoji: string, label: string) {
  const h = hue(`${kind}:${key}`);
  const h2 = (h + 42) % 360;
  const mark = emoji || label.slice(0, 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h} 55% 42%)"/>
      <stop offset="100%" stop-color="hsl(${h2} 60% 28%)"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <rect x="10" y="10" width="108" height="108" rx="22" fill="rgba(0,0,0,0.18)"/>
  <text x="64" y="78" text-anchor="middle" font-size="52">${mark}</text>
</svg>
`;
}

for (const item of CATALOG) {
  if (item.kind === "face" || item.kind === "title" || item.kind === "hat" || item.kind === "sticker") continue;
  const dir = join(root, item.kind);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${item.key}.svg`), svgFor(item.kind, item.key, item.emoji ?? "", item.label));
}

console.log("Wrote Closet thumbs.");
