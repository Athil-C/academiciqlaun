import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $, $$, clamp, lerp } from '../core/env.js';

const YAW_INDIA = (-78 * Math.PI) / 180;
const YAW_HERO = (-100 * Math.PI) / 180; // Kerala sits left of centre, arcs fan out across the disc
const TILT_INDIA = (16 * Math.PI) / 180;

/* ───────────────────────────── hero ───────────────────────────── */

function hero() {
  const root = $('.hero');
  if (!root) return () => { };
  const first = env.html.classList.contains('is-loading');
  const lines = $$('[data-hero-line]', root);
  const fades = $$('[data-hero-fade]', root);
  const box = $('[data-hero-word] .bw__box', root);
  const rest = $('[data-hero-word] .bw__rest', root);

  if (env.reduced) return () => { };

  gsap.set(lines, { yPercent: 118 });
  gsap.set(fades, { opacity: 0, y: 26 });
  if (!first) {
    gsap.set(box, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set(rest, { opacity: 0, xPercent: -22 });
  }

  // the headline drifts up and thins out as the page leaves it behind
  gsap.to($('.hero__title', root), {
    yPercent: -14,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to($('.hero__foot', root), {
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: root, start: '35% top', end: '80% top', scrub: true },
  });

  return () => {
    const tl = gsap.timeline({ delay: first ? 0.62 : 0.05 });
    if (!first) {
      tl.to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'expo.inOut' }, 0).to(
        rest,
        { opacity: 1, xPercent: 0, duration: 1.1, ease: 'expo.out' },
        0.42,
      );
    }
    tl.to(lines, { yPercent: 0, duration: 1.35, ease: 'expo.out', stagger: 0.1 }, first ? 0.35 : 0.3).to(
      fades,
      { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07 },
      '-=1',
    );
    return tl;
  };
}

/* ────────────────────────── journey ───────────────────────────── */

function journey() {
  const section = $('[data-journey]');
  if (!section) return;
  const pin = $('[data-journey-pin]', section);
  const track = $('[data-journey-track]', section);
  const cards = $$('[data-phase]', section);
  const segs = $$('[data-ruler-seg]', section);
  const fill = $('[data-journey-fill]', section);
  const dot = $('[data-journey-dot]', section);
  const month = $('[data-journey-month]', section);
  const ruler = $('[data-journey-ruler]', section);

  // month boundaries: start of each phase, then the finish line
  const marks = segs.map((s) => parseFloat(s.style.getPropertyValue('--from')) * 12);
  marks.push(12);

  let current = -1;
  const update = (p) => {
    const c = p * (cards.length - 1);
    const k = clamp(Math.floor(c), 0, marks.length - 2);
    const m = lerp(marks[k], marks[k + 1], clamp(c - k, 0, 1));
    const r = m / 12;
    gsap.set(fill, { scaleX: r });
    const now = Math.round(c);
    const displayPhase = clamp(Math.min(now + 1, 6), 1, 6);
    month.textContent = String(displayPhase).padStart(2, '0');
    if (now !== current) {
      current = now;
      cards.forEach((el, i) => el.classList.toggle('is-now', i === now));
      segs.forEach((el, i) => el.classList.toggle('is-now', i === now));
    }
  };

  const mm = gsap.matchMedia();

  mm.add('(min-width: 801px) and (min-height: 561px) and (prefers-reduced-motion: no-preference)', () => {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${dist() * 1.15}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => update(self.progress),
      },
    });

    // cards tip slightly as they travel
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { rotate: 2.2, y: 46 },
        {
          rotate: 0,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 105%', end: 'left 62%', scrub: true },
        },
      );
    });

    update(0);
    return () => gsap.set(track, { clearProps: 'transform' });
  });

  mm.add('(max-width: 800px), (max-height: 560px), (prefers-reduced-motion: reduce)', () => {
    const view = track.parentElement;
    const onScroll = () => {
      const max = view.scrollWidth - view.clientWidth;
      update(max > 0 ? view.scrollLeft / max : 0);
    };
    view.addEventListener('scroll', onScroll, { passive: true });
    update(0);
    return () => view.removeEventListener('scroll', onScroll);
  });
}

/* ────────────────────────── domains ───────────────────────────── */

function domains() {
  const list = $('[data-domains]');
  const peek = $('[data-domain-peek]');
  if (!list || !peek || env.touch || env.reduced) return;

  const card = $('.peek__card', peek);
  const glyph = $('[data-peek-glyph]', peek);
  const line = $('[data-peek-line]', peek);
  const family = $('[data-peek-family]', peek);
  const x = gsap.quickTo(peek, 'x', { duration: 0.6, ease: 'power3' });
  const y = gsap.quickTo(peek, 'y', { duration: 0.6, ease: 'power3' });
  const rot = gsap.quickTo(card, 'rotation', { duration: 0.7, ease: 'power3' });
  let lastX = 0;
  let shown = false;

  list.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
    rot(clamp((e.clientX - lastX) * 0.9, -14, 14));
    lastX = e.clientX;
    if (!shown) {
      shown = true;
      gsap.set(peek, { x: e.clientX, y: e.clientY });
      gsap.to(peek, { opacity: 1, duration: 0.35 });
      gsap.fromTo(card, { scale: 0.7 }, { scale: 1, duration: 0.7, ease: 'expo.out' });
    }
  });

  list.addEventListener('pointerleave', () => {
    shown = false;
    gsap.to(peek, { opacity: 0, duration: 0.3 });
    rot(0);
  });

  $$('[data-domain]', list).forEach((row) => {
    row.addEventListener('pointerenter', () => {
      family.textContent = row.dataset.family;
      line.textContent = row.dataset.line;
      gsap.fromTo(
        glyph,
        { yPercent: 40, opacity: 0, rotate: -12 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.6,
          ease: 'expo.out',
          onStart: () => (glyph.textContent = row.dataset.glyph),
        },
      );
    });
  });
}

/* ───────────────────────── principles ─────────────────────────── */

function rules() {
  const cards = $$('[data-rule-card]');
  if (cards.length < 2 || env.reduced) return;

  cards.forEach((card, i) => {
    const title = $('.rule-card__title', card);
    gsap.fromTo(title, { yPercent: 30, opacity: 0 }, {
      yPercent: 0,
      opacity: 1,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 62%', once: true },
    });

    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.9,
      '--shade': 0.72,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
    });
  });
}

/* ─────────────────── label pinned to the wayand marker ─────────── */

function pin(stage) {
  const el = $('[data-pin]');
  if (!el || !stage?.arcs || env.small) return;
  let shown = 0;

  stage.onFrame = (s) => {
    // only while the hero globe is the active shape
    const want = clamp(1 - (s.P - 1) * 3.2) * clamp((s.intro.t - 0.82) * 6);
    const facing = s.arcs.facing(-1, s.camera);
    const target = want * clamp(facing * 5);
    shown = lerp(shown, target, 0.12);
    if (shown < 0.01) {
      el.style.opacity = '0';
      return;
    }
    const p = s.project(s.arcs.worldOf(-1));
    el.classList.toggle('is-flipped', p.x > window.innerWidth - 300);
    el.style.opacity = shown.toFixed(3);
    el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
  };
}

/* ───────────────────────────── page ───────────────────────────── */

export default function init() {
  const intro = hero();
  journey();
  domains();
  rules();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'globe',
      x: 0.47,
      y: 0.2,
      size: 0.41,
      yaw: YAW_HERO,
      tilt: TILT_INDIA,
      sway: 0.3,
      look: 0.2,
      back: 1,
      arcs: true,
      red: 0,
      drift: 0.002,
      point: 2.25,
      force: 0.16,
      m: { x: 0.35, y: 0.5, size: 0.24, alpha: 0.75 },
    },
    {
      el: '[data-stop="dust"]',
      shape: 'dust',
      alpha: 0.6,
      red: 0.14,
      drift: 0.07,
      point: 2.6,
      force: 0.6,
      look: 0.05,
    },
    {
      el: '[data-stop="rupee"]',
      shape: 'text:₹0',
      x: 0.5,
      y: -0.06,
      size: 0.3,
      fit: 0.19,
      red: 0.78,
      drift: 0.004,
      look: 0.34,
      point: 2.5,
      force: 0.5,
      start: 'top 85%',
      end: 'top 20%',
      m: { x: 0, y: 0.5, size: 0.2, alpha: 0.4 },
    },
    {
      el: '[data-stop="world"]',
      shape: 'globe',
      x: 0.5,
      y: 0.02,
      size: 0.44,
      yaw: (-88 * Math.PI) / 180,
      tilt: TILT_INDIA,
      sway: 0.75,
      look: 0.16,
      back: 1,
      arcs: true,
      red: 0,
      drift: 0.002,
      point: 2.3,
      force: 0.16,
      start: 'top 95%',
      end: 'top 30%',
      m: { x: 0, y: 0.34, size: 0.3, alpha: 0.75 },
    },
  ];

  return { stops, intro, onStage: pin };
}
