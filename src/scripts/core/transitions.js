import { gsap } from 'gsap';
import { env, $, $$, store } from './env.js';
import { scrollTo } from './scroll.js';
import { closeMenu } from './nav.js';

/** What follows the [AC] box on the curtain, per destination. */
const SUFFIX = {
  '/': 'ADEMIQ',
  '/brocamp/': 'ADEMIQ',
  '/courses/': 'ADEMIQ',
  '/pay-after-placement/': 'ADEMIQ',
  '/placements/': 'ADEMIQ',
  '/hire/': 'ADEMIQ',
  '/apply/': ', LETâ€™S GO',
};

const norm = (p) => (p.endsWith('/') ? p : `${p}/`);

let curtain;
let cols;
let labelA;
let labelB;
let leaving = false;

function leave(href, suffix) {
  if (leaving) return;
  leaving = true;
  closeMenu();
  labelB.textContent = suffix;
  curtain.classList.add('is-active');
  env.lenis?.stop();

  gsap
    .timeline({
      onComplete: () => {
        store.set('bro:nav', '1');
        window.location.href = href;
      },
    })
    .set(cols, { transformOrigin: 'bottom center', scaleY: 0 })
    .set([labelA, labelB], { y: 0, yPercent: 115 })
    .to(cols, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', stagger: 0.055 })
    .to([labelA, labelB], { yPercent: 0, duration: 0.65, ease: 'expo.out', stagger: 0.06 }, 0.42)
    .to({}, { duration: 0.1 });
}

/** Plays when a page is reached through an internal link. */
export function enter() {
  return new Promise((resolve) => {
    const html = document.documentElement;
    if (!curtain || !html.classList.contains('is-entering')) return resolve();

    labelB.textContent = document.body.dataset.suffix || 'THER';
    gsap.set(cols, { scaleY: 1, transformOrigin: 'top center' });
    gsap.set([labelA, labelB], { y: 0, yPercent: 0 });

    gsap
      .timeline({
        onComplete: () => {
          html.classList.remove('is-entering');
          curtain.classList.remove('is-active');
          gsap.set(cols, { clearProps: 'all' });
          gsap.set([labelA, labelB], { clearProps: 'all' });
        },
      })
      .to([labelA, labelB], { yPercent: -115, duration: 0.55, ease: 'expo.inOut', stagger: 0.05 }, 0.12)
      .add(resolve, 0.5)
      .to(cols, { scaleY: 0, duration: 0.85, ease: 'expo.inOut', stagger: 0.055 }, 0.42);
  });
}

export function initTransitions() {
  curtain = $('[data-curtain]');
  if (!curtain) return;
  cols = $$('.curtain__cols i', curtain);
  labelA = $('[data-curtain-a]', curtain);
  labelB = $('[data-curtain-b]', curtain);

  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('a[href]');
    if (!link || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download') || link.dataset.native !== undefined) return;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;

    const samePage = norm(url.pathname) === norm(window.location.pathname) && url.search === window.location.search;

    if (samePage) {
      e.preventDefault();
      closeMenu();
      const target = url.hash && url.hash !== '#top' ? document.querySelector(url.hash) : null;
      scrollTo(target || 0, { offset: target ? -60 : 0 });
      return;
    }

    if (env.reduced) return; // let the browser navigate normally
    e.preventDefault();
    leave(url.href, SUFFIX[norm(url.pathname)] ?? 'TOTYPE');
  });

  // back/forward cache: never resurrect a page with the curtain drawn
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    curtain.classList.remove('is-active');
    gsap.set(cols, { scaleY: 0 });
    env.lenis?.start();
  });
}
