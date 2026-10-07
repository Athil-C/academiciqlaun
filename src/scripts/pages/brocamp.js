import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $, $$, clamp, lerp } from '../core/env.js';
import { pageHero, markSteps } from '../core/phero.js';

/* the weekly loop: list on the right drives the orbit on the left */
function loop() {
  const root = $('[data-loop]');
  if (!root) return;
  const items = $$('[data-loop-item]', root);
  const nodes = $$('[data-orbit-node]', root);
  const arc = $('[data-orbit-arc]', root);
  const week = $('[data-orbit-week]', root);
  const len = 2 * Math.PI * 78;
  let current = -1;

  const activate = (i) => {
    if (i === current) return;
    current = i;
    items.forEach((el, k) => el.classList.toggle('is-now', k === i));
    nodes.forEach((el, k) => el.classList.toggle('is-now', k <= i));
    if (arc && !env.reduced) {
      gsap.to(arc, { strokeDashoffset: len * (1 - (i + 1) / items.length), duration: 1.1, ease: 'expo.out' });
    }
  };

  if (env.reduced || env.small) {
    items.forEach((el) => el.classList.add('is-now'));
    return;
  }

  items.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => self.isActive && activate(i),
    });
  });

  // a year of weeks ticks by as the section scrolls past
  if (week) {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 70%',
      end: 'bottom 40%',
      onUpdate: (self) => (week.textContent = String(clamp(Math.round(self.progress * 52), 1, 52)).padStart(2, '0')),
    });
  }
  activate(0);
}

/* the year: chapters on the right move the month meter on the left */
function year() {
  const root = $('[data-year]');
  if (!root) return;
  const chaps = $$('[data-chap]', root);
  const month = $('[data-year-month]', root);
  const fill = $('[data-year-fill]', root);
  const name = $('[data-year-name]', root);

  const set = (m, chap) => {
    month.textContent = String(Math.floor(m + 0.02)).padStart(2, '0');
    gsap.set(fill, { scaleX: clamp(m / 12) });
    if (chap && name.textContent !== chap.dataset.name) name.textContent = chap.dataset.name;
  };

  chaps.forEach((chap) => {
    const from = parseFloat(chap.dataset.from);
    const to = parseFloat(chap.dataset.to);
    ScrollTrigger.create({
      trigger: chap,
      start: 'top 58%',
      end: 'bottom 58%',
      onUpdate: (self) => set(lerp(from, to, self.progress), chap),
      onToggle: (self) => chap.classList.toggle('is-now', self.isActive),
    });
  });
}

export default function init() {
  const intro = pageHero();
  loop();
  year();
  markSteps();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'text:12',
      x: 0.6,
      y: 0.2,
      size: 0.3,
      fit: 0.2,
      red: 0.45,
      drift: 0.006,
      look: 0.4,
      point: 2.5,
      force: 0.5,
      m: { x: 0.35, y: 0.5, size: 0.17, alpha: 0.55 },
    },
    { el: '[data-stop="dust"]', shape: 'dust', alpha: 0.6, red: 0.14, drift: 0.07, point: 2.6, force: 0.6, look: 0.05 },
  ];

  return { stops, intro };
}
