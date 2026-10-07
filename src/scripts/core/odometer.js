import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $$ } from './env.js';

/**
 * <span data-odo="2,395"></span> → each digit rolls into place like a counter.
 * The real value stays in the DOM for screen readers.
 */
export function buildOdometer(el) {
  const value = el.dataset.odo ?? el.textContent.trim();
  el.textContent = '';
  el.classList.add('odo');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', (el.dataset.odoLabel || value).trim());

  const strips = [];
  const digits = [...value].filter((c) => /\d/.test(c)).length;
  let seen = 0;

  [...value].forEach((ch) => {
    if (/\d/.test(ch)) {
      const target = Number(ch);
      const spins = 1 + Math.min(2, digits - seen - 1 > 2 ? 1 : seen); // later digits travel further
      const col = document.createElement('span');
      col.className = 'odo__col';
      const strip = document.createElement('span');
      strip.className = 'odo__strip';
      const total = spins * 10 + target + 1;
      for (let i = 0; i < total; i++) {
        const d = document.createElement('span');
        d.textContent = String(i % 10);
        strip.appendChild(d);
      }
      col.appendChild(strip);
      el.appendChild(col);
      strips.push({ strip, to: -((total - 1) / total) * 100 });
      seen++;
    } else {
      const s = document.createElement('span');
      s.className = 'odo__static';
      s.textContent = ch;
      el.appendChild(s);
    }
  });

  return strips;
}

export function playOdometer(strips, { delay = 0, duration = 2 } = {}) {
  return gsap.to(
    strips.map((s) => s.strip),
    {
      yPercent: (i) => strips[i].to,
      duration,
      delay,
      ease: 'expo.inOut',
      stagger: 0.07,
    },
  );
}

export function initOdometers(root = document) {
  $$('[data-odo]', root).forEach((el) => {
    if (el.__odo) return;
    el.__odo = true;

    if (env.reduced) return; // plain text is already correct
    const strips = buildOdometer(el);
    if (el.dataset.odoManual !== undefined) {
      el.__play = (opts) => playOdometer(strips, opts);
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => playOdometer(strips, { delay: parseFloat(el.dataset.delay) || 0 }),
    });
  });
}
