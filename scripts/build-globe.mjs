/**
 * Generates public/data/land.bin — evenly spread points that fall on land,
 * used by the WebGL globe. Run with `npm run globe`.
 *
 * Format: Int16Array of [lat * 100, lon * 100] pairs.
 * Source: Natural Earth land polygons via the `world-atlas` package.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const topo = JSON.parse(readFileSync(resolve(root, 'node_modules/world-atlas/land-110m.json'), 'utf8'));
const land = feature(topo, topo.objects.land);

const CANDIDATES = 46000;
const golden = Math.PI * (3 - Math.sqrt(5));
const out = [];

for (let i = 0; i < CANDIDATES; i++) {
  const y = 1 - (i / (CANDIDATES - 1)) * 2; // 1 → -1
  const theta = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  let lon = ((theta * 180) / Math.PI) % 360;
  if (lon > 180) lon -= 360;
  if (lat < -60) continue; // skip Antarctica — it reads as clutter at the pole
  if (geoContains(land, [lon, lat])) out.push(Math.round(lat * 100), Math.round(lon * 100));
}

const file = resolve(root, 'public/data/land.bin');
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, Buffer.from(new Int16Array(out).buffer));
console.log(`land.bin → ${out.length / 2} points, ${(out.length * 2 / 1024).toFixed(1)} KB`);
