import { gsap } from 'gsap';
import { env, $$, lerp } from './env.js';

class Marquee {
  constructor(el) {
    this.el = el;
    this.track = el.querySelector('[data-mq-track]');
    this.speed = parseFloat(el.dataset.speed) || 70;
    this.dir = parseFloat(el.dataset.dir) || -1;
    this.react = el.dataset.react !== 'false';
    this.x = 0;
    this.sign = 1;
    this.boost = 0;
    this.hold = 1;
    this.visible = false;
    this.originals = Array.from(this.track.children);

    this.build();
    new ResizeObserver(() => this.build()).observe(el);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: '20% 0px' }).observe(el);

    if (el.dataset.pause !== undefined && !env.touch) {
      el.addEventListener('pointerenter', () => gsap.to(this, { hold: 0.12, duration: 0.6 }));
      el.addEventListener('pointerleave', () => gsap.to(this, { hold: 1, duration: 0.9 }));
    }
  }

  build() {
    const w = this.el.offsetWidth;
    if (!w || w === this.w) return;
    this.w = w;
    this.track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
    this.unit = this.originals.reduce((sum, n) => sum + n.getBoundingClientRect().width, 0);
    if (!this.unit) return;
    const copies = Math.ceil((w * 1.5) / this.unit) + 1;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < copies; i++) {
      this.originals.forEach((n) => {
        const c = n.cloneNode(true);
        c.dataset.clone = '';
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('a, button').forEach((a) => a.setAttribute('tabindex', '-1'));
        frag.appendChild(c);
      });
    }
    this.track.appendChild(frag);
  }

  tick(dt, velocity) {
    if (!this.visible || !this.unit) return;
    if (this.react) {
      const wanted = velocity < -0.4 ? -1 : velocity > 0.4 ? 1 : this.sign >= 0 ? 1 : -1;
      this.sign = lerp(this.sign, wanted, 0.06);
      this.boost = lerp(this.boost, Math.min(Math.abs(velocity), 90), 0.1);
    }
    const v = this.dir * this.sign * (this.speed + this.boost * 9) * this.hold;
    this.x += v * dt;
    this.x = (((this.x % this.unit) + this.unit) % this.unit) - this.unit;
    this.track.style.transform = `translate3d(${this.x.toFixed(2)}px,0,0)`;
  }
}

export function initMarquees(root = document) {
  if (env.reduced) return;
  const list = $$('[data-mq]', root)
    .filter((el) => !el.__mq)
    .map((el) => (el.__mq = new Marquee(el)));
  if (!list.length) return;

  gsap.ticker.add((time, delta) => {
    const dt = Math.min(delta, 60) / 1000;
    const v = env.lenis ? env.lenis.velocity : 0;
    for (const m of list) m.tick(dt, v);
  });
}
