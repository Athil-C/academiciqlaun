import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { env, $, $$, clamp, lerp } from './env.js';

gsap.registerPlugin(Draggable, InertiaPlugin);

/**
 * Interactive blocks that appear on more than one page.
 * Every initialiser is a no-op when its markup is not on the page.
 */

/* ─────────────────────── background switch ────────────────────── */

export function initBackground() {
  const root = $('[data-bg]');
  if (!root) return;
  const tabs = $$('[data-bg-tab]', root);
  const value = $('[data-bg-value]', root);
  const text = $('[data-bg-text]', root);
  const bar = $('[data-bg-bar]', root);
  const cells = $$('i', bar);
  const pct = { non: parseFloat(bar.dataset.non), it: parseFloat(bar.dataset.it) };
  const state = { v: pct.non };

  const paint = (key, animate = true) => {
    const on = Math.round((pct[key] / 100) * cells.length);
    cells.forEach((c, i) => {
      const lit = i < on;
      if (animate && !env.reduced) {
        gsap.to(c, {
          scaleY: 0.35,
          duration: 0.18,
          delay: i * 0.012,
          onComplete: () => {
            c.classList.toggle('is-on', lit);
            gsap.to(c, { scaleY: 1, duration: 0.5, ease: 'back.out(3)' });
          },
        });
      } else c.classList.toggle('is-on', lit);
    });
  };

  const select = (key) => {
    tabs.forEach((t) => {
      const active = t.dataset.bgTab === key;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    const copy = $(`template[data-bg-copy="${key}"]`, root);
    if (env.reduced) {
      value.textContent = pct[key];
      text.innerHTML = copy.innerHTML;
      paint(key, false);
      return;
    }
    gsap.to(state, {
      v: pct[key],
      duration: 1.1,
      ease: 'expo.out',
      onUpdate: () => (value.textContent = state.v.toFixed(1)),
    });
    gsap
      .timeline()
      .to(text, { opacity: 0, y: 8, duration: 0.2 })
      .add(() => (text.innerHTML = copy.innerHTML))
      .to(text, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    paint(key);
  };

  tabs.forEach((t) => t.addEventListener('click', () => !t.classList.contains('is-active') && select(t.dataset.bgTab)));

  // first paint when the tile scrolls in
  ScrollTrigger.create({ trigger: bar, start: 'top 92%', once: true, onEnter: () => paint('non') });
}

/* ─────────────────────────── alumni rail ──────────────────────── */

export function initRail() {
  const root = $('[data-rail]');
  if (!root) return;
  const track = $('[data-rail-track]', root);
  const cards = $$('[data-person]', root);

  const bounds = () => ({ minX: Math.min(0, root.clientWidth - track.scrollWidth - 2 * parseFloat(getComputedStyle(root).paddingLeft)), maxX: 0 });
  const skew = gsap.quickTo(cards, 'skewX', { duration: 0.5, ease: 'power3' });
  const tip = gsap.quickTo(cards, 'rotateY', { duration: 0.5, ease: 'power3' });
  gsap.set(cards, { transformPerspective: 900 });

  const [drag] = Draggable.create(track, {
    type: 'x',
    inertia: true,
    bounds: bounds(),
    edgeResistance: 0.82,
    dragResistance: 0.05,
    cursor: env.touch ? 'grab' : 'none',
    activeCursor: env.touch ? 'grabbing' : 'none',
    onDrag: tilt,
    onThrowUpdate: tilt,
    onDragEnd: settle,
    onThrowComplete: settle,
    onPress() {
      root.classList.add('is-grabbing');
    },
    onRelease() {
      root.classList.remove('is-grabbing');
    },
  });

  function tilt() {
    if (env.reduced) return;
    const v = InertiaPlugin.getVelocity(track, 'x') || this.deltaX * 40;
    skew(clamp(v * -0.0022, -7, 7));
    tip(clamp(v * 0.004, -12, 12));
  }
  function settle() {
    skew(0);
    tip(0);
  }

  // cards slide in from the right the first time the rail is seen
  if (!env.reduced) {
    gsap.fromTo(cards, { x: 220, opacity: 0 }, {
      x: 0,
      opacity: 1,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: root, start: 'top 85%', once: true },
    });
  }

  // trackpads: horizontal two-finger scroll moves the rail
  root.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const b = bounds();
      gsap.to(track, { x: clamp(gsap.getProperty(track, 'x') - e.deltaX * 1.2, b.minX, b.maxX), duration: 0.4, overwrite: true, onUpdate: () => drag.update() });
    },
    { passive: false },
  );

  window.addEventListener('resize', () => drag.applyBounds(bounds()));
}

/* ───────────────────────────── hubs ───────────────────────────── */

export function initHubs() {
  const root = $('[data-hubs]');
  if (!root) return;
  const rows = $$('[data-hub]', root);
  const nodes = $$('[data-atlas-node]', root);
  const links = $$('[data-atlas-link]', root);

  const activate = (i) => {
    rows.forEach((r, k) => r.classList.toggle('is-active', k === i));
    nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
    links.forEach((l, k) => {
      l.style.opacity = i === 0 || k === i - 1 ? '' : '0.18';
      l.style.strokeWidth = k === i - 1 ? '0.5' : '';
    });
  };

  rows.forEach((r, i) => {
    r.addEventListener('pointerenter', () => activate(i));
    r.addEventListener('focusin', () => activate(i));
  });
  nodes.forEach((n, i) => n.addEventListener('pointerenter', () => activate(i)));
  activate(0);

  if (!env.reduced) {
    links.forEach((l) => {
      l.dataset.x2 = l.getAttribute('x2');
      l.dataset.y2 = l.getAttribute('y2');
    });
    gsap.fromTo(links, { attr: { x2: (i, el) => el.getAttribute('x1'), y2: (i, el) => el.getAttribute('y1') } }, {
      attr: { x2: (i, el) => el.dataset.x2, y2: (i, el) => el.dataset.y2 },
      duration: 1.4,
      ease: 'expo.inOut',
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-atlas]', start: 'top 80%', once: true },
    });
    // nodes are placed with a transform attribute, so animate what is inside them
    gsap.fromTo($$('.atlas__dot, text', root), { opacity: 0 }, {
      opacity: 1,
      duration: 0.9,
      ease: 'power2.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '[data-atlas]', start: 'top 80%', once: true },
    });
  }
}

/* ─────────────────────────── stamp ────────────────────────────── */

export function initStamp() {
  const el = $('[data-stamp]');
  if (!el || env.reduced) return;
  // spins faster while you scroll
  const svg = $('svg', el);
  let extra = 0;
  let angle = 0;
  svg.style.animation = 'none';
  gsap.ticker.add((t, dt) => {
    const v = env.lenis ? Math.abs(env.lenis.velocity) : 0;
    extra = lerp(extra, v, 0.08);
    angle = (angle + (dt / 1000) * (16 + extra * 9)) % 360;
    svg.style.transform = `rotate(${angle.toFixed(2)}deg)`;
  });
}


export function initBlocks() {
  initBackground();
  initRail();
  initHubs();
  initStamp();
}
