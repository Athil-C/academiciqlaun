import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';

/** Smooth scroll, wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function initScroll() {
  if (env.reduced) return null;

  const lenis = new Lenis({
    lerp: 0.095,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  env.lenis = lenis;
  window.__lenis = lenis; // handy for debugging + automated screenshots
  return lenis;
}

export function scrollTo(target, opts = {}) {
  if (env.lenis) env.lenis.scrollTo(target, { duration: 1.4, ...opts });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (typeof target === 'number') window.scrollTo({ top: target });
    else el?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
}

export const lockScroll = () => {
  env.lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
};

export const unlockScroll = () => {
  env.lenis?.start();
  document.documentElement.style.overflow = '';
};
