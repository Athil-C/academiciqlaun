import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $, $$ } from '../core/env.js';
import { scrollTo } from '../core/scroll.js';
import { pageHero } from '../core/phero.js';

gsap.registerPlugin(Flip);

function catalog() {
  const root = $('[data-catalog]');
  if (!root) return;
  const cards = $$('[data-course]', root);
  const tabs = $$('[data-filter]', root);
  const count = $('[data-cat-count]', root);
  let busy = false;

  let current = 'All';

  /** Resolves once the grid has settled — Flip lifts cards out of flow while it runs. */
  const filter = (family) =>
    new Promise((resolve) => {
      if (busy || family === current) return resolve();
      current = family;
      const show = (c) => family === 'All' || c.dataset.family === family;
      tabs.forEach((t) => {
        const on = t.dataset.filter === family;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      count.textContent = String(cards.filter(show).length).padStart(2, '0');

      if (env.reduced) {
        cards.forEach((c) => c.classList.toggle('is-hidden', !show(c)));
        ScrollTrigger.refresh();
        return resolve();
      }

      busy = true;
      const state = Flip.getState(cards);
      cards.forEach((c) => c.classList.toggle('is-hidden', !show(c)));
      Flip.from(state, {
        duration: 0.85,
        ease: 'expo.inOut',
        absolute: true,
        stagger: 0.025,
        onEnter: (els) =>
          gsap.fromTo(els, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.7, delay: 0.2, ease: 'expo.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.86, duration: 0.4 }),
        onComplete: () => {
          busy = false;
          gsap.set(cards, { clearProps: 'opacity,scale' });
          ScrollTrigger.refresh();
          resolve();
        },
      });
    });

  tabs.forEach((t) => t.addEventListener('click', () => filter(t.dataset.filter)));

  // cards deal themselves onto the table the first time
  if (!env.reduced) {
    gsap.fromTo(cards, { y: 80, opacity: 0, rotate: (i) => (i % 2 ? 2.5 : -2.5) }, {
      y: 0,
      opacity: 1,
      rotate: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: { each: 0.06, grid: 'auto', from: 'start' },
      scrollTrigger: { trigger: '[data-cat-grid]', start: 'top 85%', once: true },
      // hand the cards back to CSS so hover tilt and Flip start from a clean slate
      onComplete: () => gsap.set(cards, { clearProps: 'transform,opacity' }),
    });
  }

  // the filter bar tucks under the nav only while the nav is visible
  const nav = $('[data-nav]');
  if (nav) {
    new MutationObserver(() =>
      document.documentElement.classList.toggle('nav-away', nav.classList.contains('is-hidden')),
    ).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  return {
    async focus(id) {
      const card = document.getElementById(id);
      if (!card) return;
      await filter('All');
      scrollTo(card, { offset: -150, duration: env.reduced ? 0 : 1.6 });
      card.classList.add('is-target');
      setTimeout(() => card.classList.remove('is-target'), 3400);
    },
  };
}

export default function init() {
  const hero = pageHero();
  const cat = catalog();

  // links between the builder tiles and their cards
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('.sb__card[href^="#"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    cat?.focus(a.getAttribute('href').slice(1));
  }, true);

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'text:</>',
      x: 0.52,
      y: 0.1,
      size: 0.27,
      fit: 0.23,
      red: 0.4,
      drift: 0.006,
      look: 0.4,
      point: 2.5,
      force: 0.5,
      m: { x: 0.3, y: 0.52, size: 0.14, alpha: 0.5 },
    },
    {
      el: '[data-stop="builders"]',
      shape: 'network',
      x: 0.36,
      y: 0.1,
      size: 0.4,
      red: 0.35,
      drift: 0.01,
      turn: 0.05,
      look: 0.3,
      alpha: 0.7,
      point: 2.6,
      force: 0.4,
      m: { x: 0, y: 0.3, size: 0.28, alpha: 0.4 },
    },
  ];

  return {
    stops,
    intro: () => {
      hero();
      const id = window.location.hash.slice(1);
      if (id) setTimeout(() => cat?.focus(id), 900);
    },
  };
}
