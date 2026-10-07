import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { env, $, $$, toast } from '../core/env.js';
import { pageHero, markSteps } from '../core/phero.js';

gsap.registerPlugin(DrawSVGPlugin);

/* the fee chart draws itself as it scrolls into view */
function chart() {
  const root = $('[data-chart]');
  if (!root || env.reduced) return;
  const up = $('[data-chart-up]', root);
  const pap = $('[data-chart-pap]', root);
  const after = $('[data-chart-after]', root);
  const dot = $('[data-chart-dot]', root);
  const tags = $$('[data-chart-tag]', root);

  // the tags are positioned with a transform attribute, so only their opacity is animated
  gsap.set(tags, { opacity: 0 });
  gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(after, { opacity: 0 });

  gsap
    .timeline({ scrollTrigger: { trigger: $('svg', root), start: 'top 72%', once: true } })
    .from(up, { drawSVG: '0%', duration: 1.9, ease: 'power2.inOut' }, 0)
    .to(tags[0], { opacity: 1, duration: 0.6 }, 0.35)
    .to(tags[1], { opacity: 1, duration: 0.6 }, 1.1)
    .from(pap, { drawSVG: '0%', duration: 1.8, ease: 'power2.inOut' }, 0.5)
    .to(tags[2], { opacity: 1, duration: 0.6 }, 1.5)
    .to(dot, { scale: 1, duration: 0.8, ease: 'back.out(3)' }, 2.2)
    .to(after, { opacity: 1, duration: 0.8 }, 2.4)
    .to(tags[3], { opacity: 1, duration: 0.6 }, 2.6)
    .to(dot, { scale: 1.5, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true }, 3);
}

/* the list of questions is a checklist you can actually tick */
function asks() {
  const items = $$('[data-ask]');
  if (!items.length) return;
  items.forEach((item) => {
    item.setAttribute('role', 'checkbox');
    item.setAttribute('aria-checked', 'false');
    item.setAttribute('tabindex', '0');
    item.dataset.cursor = 'link';
    const toggle = () => {
      const done = item.classList.toggle('is-done');
      item.setAttribute('aria-checked', String(done));
      if (done && items.every((i) => i.classList.contains('is-done'))) toast('All asked. You are ready to decide.');
    };
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

export default function init() {
  const intro = pageHero();
  chart();
  asks();
  markSteps();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'text:₹0',
      x: 0.6,
      y: 0.2,
      size: 0.27,
      fit: 0.17,
      red: 0.8,
      drift: 0.005,
      look: 0.36,
      point: 2.5,
      force: 0.5,
      m: { x: 0.3, y: 0.5, size: 0.17, alpha: 0.5 },
    },
    { el: '[data-stop="dust"]', shape: 'dust', alpha: 0.6, red: 0.3, drift: 0.07, point: 2.6, force: 0.6, look: 0.05 },
  ];

  return { stops, intro };
}
