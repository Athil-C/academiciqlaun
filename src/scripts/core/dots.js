import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $$ } from './env.js';

const RED = '#00e5ff';

/**
 * <canvas data-dots data-count="2395" data-share="0.705">
 * One dot per placed student. The first `share` of them are drawn in red.
 * Dots swell under the pointer and a label names the one you are on.
 */
class Dots {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.n = Number(canvas.dataset.count) || 0;
    this.split = Math.floor(this.n * (Number(canvas.dataset.share) || 0));
    this.reveal = env.reduced ? 1 : 0;
    this.pointer = { x: -9999, y: -9999, on: 0, target: 0 };
    this.visible = false;
    this.dirty = true;
    this.ink = getComputedStyle(canvas).color || '#081325';
    this.draw = this.draw.bind(this);

    new ResizeObserver(() => this.layout()).observe(canvas);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.dirty = true;
    }).observe(canvas);

    if (!env.touch) {
      const host = canvas.parentElement;
      host.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
        this.pointer.target = 1;
        this.dirty = true;
      });
      host.addEventListener('pointerleave', () => {
        this.pointer.target = 0;
        this.dirty = true;
      });
    }

    if (!env.reduced) {
      ScrollTrigger.create({
        trigger: canvas,
        start: 'top 88%',
        once: true,
        onEnter: () =>
          gsap.to(this, { reveal: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: () => (this.dirty = true) }),
      });
    }

    this.layout();
    gsap.ticker.add(this.draw);
  }

  layout() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height || !this.n) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let cols = Math.max(1, Math.floor(this.w / Math.sqrt((this.w * this.h) / this.n)));
    while (Math.ceil(this.n / cols) * (this.w / cols) > this.h) cols++;
    this.cols = cols;
    this.rows = Math.ceil(this.n / cols);
    this.cell = this.w / cols;
    this.y0 = (this.h - this.rows * this.cell) / 2;
    this.dirty = true;
  }

  draw() {
    if (!this.visible || !this.cols) return;
    const p = this.pointer;
    if (Math.abs(p.on - p.target) > 0.002) {
      p.on += (p.target - p.on) * 0.14;
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;

    const { ctx, cell, cols, n } = this;
    const base = cell * 0.27;
    const reach = Math.max(48, cell * 5.5);
    ctx.clearRect(0, 0, this.w, this.h);

    let hot = -1;
    let hotD = Infinity;

    for (let i = 0; i < n; i++) {
      const cx = ((i % cols) + 0.5) * cell;
      const cy = this.y0 + (Math.floor(i / cols) + 0.5) * cell;

      // staggered pop-in, sweeping left â†’ right with a little noise
      const order = (i % cols) / cols + ((i * 7919) % 97) / 97 / 4;
      const t = Math.min(1, Math.max(0, this.reveal * 1.6 - order * 0.6) / 0.35);
      if (t <= 0) continue;

      const d = Math.hypot(cx - p.x, cy - p.y);
      const pull = p.on * Math.max(0, 1 - d / reach);
      if (d < hotD) {
        hotD = d;
        hot = i;
      }

      const r = base * t * (1 + pull * pull * 2.4);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = i < this.split ? RED : this.ink;
      ctx.globalAlpha = i < this.split ? 1 : 0.85 - pull * 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // name the dot under the pointer
    if (p.on > 0.4 && hot >= 0 && hotD < cell * 1.5 && this.reveal > 0.95) {
      const label = `No. ${String(hot + 1).padStart(4, '0')} Â· ${hot < this.split ? 'non-IT' : 'IT'}`;
      ctx.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
      const tw = ctx.measureText(label).width + 18;
      const x = Math.min(this.w - tw, Math.max(0, p.x + 14));
      const y = Math.max(0, p.y - 34);
      ctx.globalAlpha = Math.min(1, (p.on - 0.4) * 3);
      ctx.fillStyle = '#081325';
      ctx.fillRect(x, y, tw, 24);
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.toUpperCase(), x + 9, y + 12.5);
      ctx.globalAlpha = 1;
    }
  }
}

export function initDots(root = document) {
  $$('canvas[data-dots]', root).forEach((c) => {
    if (!c.__dots) c.__dots = new Dots(c);
  });
}
