import { $$ } from '../core/env.js';
import { pageHero } from '../core/phero.js';

function sieve() {
  const rows = $$('[data-sieve-row]');
  if (!rows.length) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }),
    { threshold: 0.5 },
  );
  rows.forEach((r) => io.observe(r));
}

export default function init() {
  const intro = pageHero();
  sieve();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'network',
      x: 0.5,
      y: 0.12,
      size: 0.42,
      red: 0.4,
      drift: 0.012,
      turn: 0.07,
      tilt: 0.2,
      look: 0.35,
      point: 2.7,
      force: 0.5,
      m: { x: 0.2, y: 0.46, size: 0.28, alpha: 0.6 },
    },
    { el: '[data-stop="dust"]', shape: 'dust', alpha: 0.6, red: 0.14, drift: 0.07, point: 2.6, force: 0.6, look: 0.05 },
  ];

  return { stops, intro };
}
