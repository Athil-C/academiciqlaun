import { gsap } from 'gsap';
import { env, $ } from './env.js';

/**
 * Custom cursor: a quick dot and a lazy ring.
 *   data-cursor="link"            → ring swells
 *   data-cursor="view|drag|play"  → red disc with a label
 *   data-cursor-text="Custom"     → overrides the label
 */
const LABELS = { view: 'View', drag: 'Drag', play: 'Play', open: 'Open', copy: 'Copy', spin: 'Spin', call: 'Call', go: 'Go' };

export function initCursor() {
  const root = $('[data-cursor-el]');
  if (!root || env.touch || env.reduced) return;

  const dot = $('[data-cursor-dot]', root);
  const ring = $('[data-cursor-ring]', root);
  const text = $('[data-cursor-text]', root);

  document.documentElement.classList.add('has-cursor');

  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  let shown = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      if (!shown) {
        shown = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        root.classList.add('is-visible');
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    },
    { passive: true },
  );

  const apply = (target) => {
    const host = target?.closest?.('[data-cursor], a, button, summary, label, input, textarea, select');
    const themed = target?.closest?.('[data-theme]');
    root.dataset.on = themed?.dataset.theme || 'dark';

    root.classList.remove('is-link', 'is-label', 'is-hidden');
    if (!host) return;

    if (host.matches('input, textarea, select')) {
      root.classList.add('is-hidden');
      return;
    }

    const kind = host.dataset.cursor || 'link';
    if (kind === 'none') return;
    if (kind === 'hide') {
      root.classList.add('is-hidden');
      return;
    }
    const label = host.dataset.cursorText || LABELS[kind];
    if (label) {
      text.textContent = label;
      root.classList.add('is-label');
    } else {
      root.classList.add('is-link');
    }
  };

  document.addEventListener('pointerover', (e) => apply(e.target), { passive: true });
  document.addEventListener('pointerdown', () => root.classList.add('is-down'), { passive: true });
  document.addEventListener('pointerup', () => root.classList.remove('is-down'), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => root.classList.remove('is-visible'));
  document.documentElement.addEventListener('pointerenter', () => shown && root.classList.add('is-visible'));
}
