import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $, $$, clamp, lerp } from '../core/env.js';
import { pageHero } from '../core/phero.js';

gsap.registerPlugin(Flip);

const YAW_INDIA = (-78 * Math.PI) / 180;
const TILT_INDIA = (16 * Math.PI) / 180;

/* strip plot: dots drop in, and each one introduces its owner */
function plot() {
  const root = $('[data-plot]');
  if (!root) return;
  const dots = $$('[data-plot-dot]', root);
  const tip = $('[data-plot-tip]', root);
  const f = {
    lpa: $('[data-tip-lpa]', tip),
    name: $('[data-tip-name]', tip),
    company: $('[data-tip-company]', tip),
    stack: $('[data-tip-stack]', tip),
  };

  const show = (dot) => {
    dots.forEach((d) => d.classList.toggle('is-on', d === dot));
    f.lpa.textContent = dot.dataset.lpa;
    f.name.textContent = dot.dataset.name;
    f.company.textContent = `${dot.dataset.kind === 'current' ? 'Now at' : 'Placed at'} ${dot.dataset.company}`;
    f.stack.textContent = dot.dataset.stack;

    const r = root.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    const w = tip.offsetWidth;
    const x = clamp(d.left - r.left + d.width / 2 - w / 2, 0, r.width - w);
    const y = d.top - r.top - tip.offsetHeight - 18;
    gsap.to(tip, { x, y, opacity: 1, duration: env.reduced ? 0 : 0.45, ease: 'expo.out', overwrite: true });
  };
  const hide = () => {
    dots.forEach((d) => d.classList.remove('is-on'));
    gsap.to(tip, { opacity: 0, duration: 0.25, overwrite: true });
  };

  dots.forEach((dot) => {
    dot.addEventListener('pointerenter', () => show(dot));
    dot.addEventListener('focus', () => show(dot));
    dot.addEventListener('click', () => show(dot));
    dot.addEventListener('blur', hide);
  });
  root.addEventListener('pointerleave', hide);

  if (env.reduced) return;
  gsap.fromTo(dots, { y: -260, opacity: 0 }, {
    y: 0,
    opacity: 1,
    duration: 1.1,
    ease: 'bounce.out',
    stagger: { each: 0.045, from: 'start' },
    scrollTrigger: {
      trigger: root,
      start: 'top 75%',
      once: true,
    },
    onComplete: () => show(dots[dots.length - 1]),
  });
  gsap.fromTo($('.plot__avg', root), { scaleY: 0, transformOrigin: 'bottom center' }, {
    scaleY: 1,
    duration: 1.2,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 75%', once: true },
  });
}

/* alumni wall with Flip-animated filtering */
function roll() {
  const root = $('[data-roll]');
  if (!root) return;
  const cards = $$('[data-person]', root);
  const tabs = $$('[data-filter]', root);
  let busy = false;
  let current = 'All';

  const filter = (track) => {
    if (busy || track === current) return;
    current = track;
    const show = (c) => track === 'All' || c.dataset.track === track;
    tabs.forEach((t) => {
      const on = t.dataset.filter === track;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    if (env.reduced) {
      cards.forEach((c) => c.classList.toggle('is-hidden', !show(c)));
      ScrollTrigger.refresh();
      return;
    }
    busy = true;
    const state = Flip.getState(cards);
    cards.forEach((c) => c.classList.toggle('is-hidden', !show(c)));
    Flip.from(state, {
      duration: 0.8,
      ease: 'expo.inOut',
      absolute: true,
      stagger: 0.012,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.2 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.35 }),
      onComplete: () => {
        busy = false;
        gsap.set(cards, { clearProps: 'opacity,scale' });
        ScrollTrigger.refresh();
      },
    });
  };

  tabs.forEach((t) => t.addEventListener('click', () => filter(t.dataset.filter)));

  if (!env.reduced) {
    gsap.fromTo(cards, { y: 70, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'expo.out',
      stagger: { each: 0.035, grid: 'auto', from: 'start' },
      scrollTrigger: { trigger: '[data-roll-grid]', start: 'top 86%', once: true },
      onComplete: () => gsap.set(cards, { clearProps: 'transform,opacity' }),
    });
  }
}

/* regions steer the globe */
function where(stage) {
  const root = $('[data-where]');
  if (!root) return;
  const regions = $$('[data-region]', root);

  const pick = (el) => {
    regions.forEach((r) => r.classList.toggle('is-on', r === el));
    stage?.focus(parseFloat(el.dataset.lon), parseFloat(el.dataset.lat));
  };

  regions.forEach((el) => {
    el.addEventListener('pointerenter', () => pick(el));
    el.addEventListener('focus', () => pick(el));
    el.addEventListener('click', () => pick(el));
  });

  ScrollTrigger.create({
    trigger: root,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => pick(regions[0]),
    onEnterBack: () => pick(regions[0]),
    onLeave: () => stage?.release(),
    onLeaveBack: () => stage?.release(),
  });
}

/* labels follow their cities around the globe */
function cities(stage) {
  const root = $('[data-cities]');
  if (!root || !stage?.arcs || env.small) return;
  const labels = $$('[data-city]', root).map((el) => ({ el, index: Number(el.dataset.city), a: 0 }));
  const windows = $$('[data-stop]');

  stage.onFrame = (s, { a, b, t }) => {
    // how much globe is on screen right now
    const presence = (a.c.arcs ? 1 - t : 0) + (b.c.arcs ? t : 0);
    const gate = clamp((Math.min(presence, 1) - 0.85) * 7) * clamp((s.intro.t - 0.85) * 7);
    const rects = windows.map((w) => w.getBoundingClientRect());

    for (const l of labels) {
      const facing = s.arcs.facing(l.index, s.camera);
      const p = s.project(s.arcs.worldOf(l.index));
      // the canvas is hidden behind solid sections; labels must not float over those
      const open = rects.some((r) => p.y > r.top + 8 && p.y < r.bottom - 28);
      const want = open ? gate * clamp((facing - 0.18) * 4) : 0;
      l.a = lerp(l.a, want, open ? 0.14 : 0.4);
      if (l.a < 0.01) {
        l.el.style.opacity = '0';
        continue;
      }
      l.el.style.opacity = l.a.toFixed(3);
      l.el.style.transform = `translate3d(${(p.x + 14).toFixed(1)}px, ${(p.y - 12).toFixed(1)}px, 0)`;
    }
  };
}

export default function init() {
  const intro = pageHero();
  plot();
  roll();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'globe',
      x: 0.5,
      y: 0.16,
      size: 0.42,
      yaw: (-92 * Math.PI) / 180,
      tilt: TILT_INDIA,
      look: 0.18,
      back: 1,
      arcs: true,
      drag: true,
      auto: 0.022,
      red: 0,
      drift: 0.002,
      point: 2.3,
      force: 0.14,
      m: { x: 0.25, y: 0.44, size: 0.26, alpha: 0.85 },
    },
    {
      el: '[data-stop="where"]',
      shape: 'globe',
      x: 0.5,
      y: -0.04,
      size: 0.44,
      yaw: (-92 * Math.PI) / 180,
      tilt: TILT_INDIA,
      look: 0.12,
      back: 1,
      arcs: true,
      drag: true,
      auto: 0.022,
      red: 0,
      drift: 0.002,
      point: 2.3,
      force: 0.14,
      start: 'top 95%',
      end: 'top 35%',
      m: { x: 0, y: 0.5, size: 0.3, alpha: 0.5 },
    },
  ];

  return {
    stops,
    intro,
    onStage(stage) {
      cities(stage);
      where(stage);
    },
  };
}
