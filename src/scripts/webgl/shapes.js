/**
 * Particle target shapes. Every builder returns Float32Array(count * 4):
 * x, y, z in "unit space" (roughly -1…1) and a per-particle alpha.
 */

const TAU = Math.PI * 2;

/** Deterministic PRNG so shapes do not reshuffle between visits. */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const latLon = (lat, lon, r = 1) => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
};

/** Loose cloud filling the whole view. */
export function dust(count, seed = 7) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    out[i * 4] = (rnd() * 2 - 1) * 1.15;
    out[i * 4 + 1] = (rnd() * 2 - 1) * 1.15;
    out[i * 4 + 2] = (rnd() * 2 - 1) * 1.0;
    out[i * 4 + 3] = 0.25 + rnd() * 0.6;
  }
  return out;
}

/** Wide shell the particles arrive from during the intro. */
export function scatter(count, seed = 11) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * TAU;
    const r = 2.2 + rnd() * 2.6;
    const s = Math.sqrt(1 - u * u);
    out[i * 4] = r * s * Math.cos(th);
    out[i * 4 + 1] = r * u;
    out[i * 4 + 2] = r * s * Math.sin(th);
    out[i * 4 + 3] = 0;
  }
  return out;
}

/** Dotted earth: land points first, then a faint halo of leftovers. */
export function globe(count, land, seed = 3) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  const total = land.length / 2;
  const landCount = Math.min(total, Math.floor(count * 0.84));
  const step = total / landCount;

  for (let i = 0; i < landCount; i++) {
    const k = Math.floor(i * step) * 2;
    const [x, y, z] = latLon(land[k] / 100, land[k + 1] / 100, 1);
    out[i * 4] = x;
    out[i * 4 + 1] = y;
    out[i * 4 + 2] = z;
    out[i * 4 + 3] = 0.9;
  }
  // the rest: a sparse sphere of "ocean" dust + a distant halo
  for (let i = landCount; i < count; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * TAU;
    const s = Math.sqrt(1 - u * u);
    const far = rnd() > 0.55;
    const r = far ? 1.18 + rnd() * rnd() * 1.5 : 1.0;
    out[i * 4] = r * s * Math.cos(th);
    out[i * 4 + 1] = r * u;
    out[i * 4 + 2] = r * s * Math.sin(th);
    out[i * 4 + 3] = far ? 0.12 + rnd() * 0.3 : 0.1;
  }
  return out;
}

/** Flat ring / orbit. */
export function ring(count, seed = 5) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const th = rnd() * TAU;
    const band = rnd();
    const r = band < 0.7 ? 1 + (rnd() - 0.5) * 0.05 : 0.55 + rnd() * 0.9;
    out[i * 4] = r * Math.cos(th);
    out[i * 4 + 1] = (rnd() - 0.5) * (band < 0.7 ? 0.03 : 0.12);
    out[i * 4 + 2] = r * Math.sin(th);
    out[i * 4 + 3] = band < 0.7 ? 0.9 : 0.25;
  }
  return out;
}

/** Rising bars — growth, salaries, the curve going the right way. */
export function bars(count, seed = 13) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  const n = 9;
  const heights = Array.from({ length: n }, (_, i) => 0.22 + Math.pow(i / (n - 1), 1.7) * 1.55);
  const gap = 2.2 / n;
  const width = gap * 0.62;
  const weights = heights.map((h) => h);
  const sum = weights.reduce((a, b) => a + b, 0);
  let i = 0;
  for (let b = 0; b < n; b++) {
    const share = b === n - 1 ? count - i : Math.floor((weights[b] / sum) * count);
    const x0 = -1.1 + b * gap + (gap - width) / 2;
    for (let k = 0; k < share && i < count; k++, i++) {
      out[i * 4] = x0 + rnd() * width;
      out[i * 4 + 1] = -0.85 + rnd() * heights[b];
      out[i * 4 + 2] = (rnd() - 0.5) * 0.16;
      out[i * 4 + 3] = 0.85;
    }
  }
  return out;
}

/**
 * Samples filled pixels of a string drawn on a 2D canvas.
 * The result is centred, and scaled so the text is 2 units tall at most
 * and `maxWidth` units wide at most.
 */
export function text(count, string, { font, maxWidth = 3.4, depth = 0.1, seed = 17 } = {}) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  const size = 360;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const family = font || '800 condensed 360px "Anek Latin Variable", "Arial Narrow", sans-serif';

  ctx.font = family;
  const m = ctx.measureText(string);
  const w = Math.ceil(m.width + size * 0.2);
  const asc = m.actualBoundingBoxAscent || size * 0.75;
  const desc = m.actualBoundingBoxDescent || size * 0.05;
  const h = Math.ceil(asc + desc + size * 0.2);
  canvas.width = w;
  canvas.height = h;

  ctx.font = family;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(string, size * 0.1, asc + size * 0.1);

  const data = ctx.getImageData(0, 0, w, h).data;
  const pts = [];
  const stride = 2;
  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }

  if (!pts.length) return dust(count, seed);

  const inkH = asc + desc;
  const scale = Math.min(2 / inkH, maxWidth / m.width);
  const cx = size * 0.1 + m.width / 2;
  const cy = size * 0.1 + inkH / 2;
  const n = pts.length / 2;

  for (let i = 0; i < count; i++) {
    const k = Math.floor(rnd() * n) * 2;
    const edge = rnd() > 0.93; // a few strays, so the glyph breathes
    const jitter = edge ? 0.22 : 0.012;
    out[i * 4] = (pts[k] + rnd() * stride - cx) * scale + (rnd() - 0.5) * jitter;
    out[i * 4 + 1] = -(pts[k + 1] + rnd() * stride - cy) * scale + (rnd() - 0.5) * jitter;
    out[i * 4 + 2] = (rnd() - 0.5) * (edge ? 0.9 : depth);
    out[i * 4 + 3] = edge ? 0.22 : 0.92;
  }
  return out;
}

/** Small network of nodes and links — teams, peers, hiring. */
export function network(count, seed = 23) {
  const rnd = mulberry(seed);
  const out = new Float32Array(count * 4);
  const nodes = Array.from({ length: 16 }, () => [(rnd() * 2 - 1) * 1.25, (rnd() * 2 - 1) * 0.9, (rnd() - 0.5) * 0.7]);
  const links = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])])
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 2)
      .forEach(([j]) => links.push([i, j]));
  });

  for (let i = 0; i < count; i++) {
    const r = rnd();
    let x, y, z, a;
    if (r < 0.42) {
      const n = nodes[Math.floor(rnd() * nodes.length)];
      const u = rnd() * 2 - 1;
      const th = rnd() * TAU;
      const s = Math.sqrt(1 - u * u);
      const rad = 0.07 * Math.cbrt(rnd());
      x = n[0] + rad * s * Math.cos(th);
      y = n[1] + rad * u;
      z = n[2] + rad * s * Math.sin(th);
      a = 0.95;
    } else {
      const [p, q] = links[Math.floor(rnd() * links.length)];
      const t = rnd();
      x = nodes[p][0] + (nodes[q][0] - nodes[p][0]) * t + (rnd() - 0.5) * 0.012;
      y = nodes[p][1] + (nodes[q][1] - nodes[p][1]) * t + (rnd() - 0.5) * 0.012;
      z = nodes[p][2] + (nodes[q][2] - nodes[p][2]) * t;
      a = 0.4;
    }
    out[i * 4] = x;
    out[i * 4 + 1] = y;
    out[i * 4 + 2] = z;
    out[i * 4 + 3] = a;
  }
  return out;
}

export async function loadLand(url = '/data/land.bin') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`land data ${res.status}`);
  return new Int16Array(await res.arrayBuffer());
}
