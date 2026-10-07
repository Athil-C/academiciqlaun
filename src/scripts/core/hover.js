import { gsap } from 'gsap';
import { env, $$ } from './env.js';

/** Buttons: the fill grows from wherever the pointer enters, and shrinks to where it leaves. */
export function initButtons() {
  const place = (btn, e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const far = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    btn.style.setProperty('--px', `${x}px`);
    btn.style.setProperty('--py', `${y}px`);
    btn.style.setProperty('--ps', `${Math.ceil(far) + 4}`);
  };

  document.addEventListener(
    'pointerover',
    (e) => {
      const btn = e.target.closest?.('[data-btn]');
      if (btn && !btn.contains(e.relatedTarget)) place(btn, e);
    },
    { passive: true },
  );
  document.addEventListener(
    'pointerout',
    (e) => {
      const btn = e.target.closest?.('[data-btn]');
      if (btn && !btn.contains(e.relatedTarget)) place(btn, e);
    },
    { passive: true },
  );
}

/** Magnetic pull toward the pointer. data-magnetic="0.3" sets the strength. */
export function initMagnetic(root = document) {
  if (env.touch || env.reduced) return;

  $$('[data-magnetic]', root).forEach((el) => {
    if (el.__mag) return;
    el.__mag = true;
    const strength = parseFloat(el.dataset.magnetic) || 0.3;
    const inner = el.querySelector('.btn__label, [data-magnetic-inner]');
    const x = gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.4)' });
    const ix = inner && gsap.quickTo(inner, 'x', { duration: 1, ease: 'elastic.out(1, 0.4)' });
    const iy = inner && gsap.quickTo(inner, 'y', { duration: 1, ease: 'elastic.out(1, 0.4)' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      x(mx * strength);
      y(my * strength);
      ix?.(mx * strength * 0.35);
      iy?.(my * strength * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
      ix?.(0);
      iy?.(0);
    });
  });
}

/** 3D tilt + spotlight. data-tilt="7" sets the max angle in degrees. */
export function initTilt(root = document) {
  // spotlight position for every .card, tilt or not
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = e.target.closest?.('.card, [data-spot]');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    },
    { passive: true },
  );

  if (env.touch || env.reduced) return;

  $$('[data-tilt]', root).forEach((el) => {
    if (el.__tilt) return;
    el.__tilt = true;
    const max = parseFloat(el.dataset.tilt) || 6;
    gsap.set(el, { transformPerspective: 1100, transformOrigin: 'center' });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 2 * max);
      rx(-py * 2 * max);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

/** Letters of a word lean away from the pointer. Used on the footer wordmark. */
export function initWordmark() {
  const mark = document.querySelector('[data-foot-mark]');
  if (!mark || env.touch || env.reduced) return;
  const chars = $$('[data-foot-char]', mark);
  const setters = chars.map((c) => gsap.quickTo(c, 'yPercent', { duration: 0.7, ease: 'power3' }));

  mark.addEventListener('pointermove', (e) => {
    chars.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2)) / r.width;
      setters[i](-Math.max(0, 1 - d / 1.8) * 9);
    });
  });
  mark.addEventListener('pointerleave', () => setters.forEach((s) => s(0)));
}
