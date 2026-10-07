/** Shared environment flags + tiny helpers. */
const html = document.documentElement;

export const env = {
  html,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: window.matchMedia('(hover: none), (pointer: coarse)').matches,
  small: window.matchMedia('(max-width: 800px)').matches,
  lenis: null,
  stage: null,
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const store = {
  get(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* private mode — carry on */
    }
  },
};

/** Resolves when web fonts are usable, or after `ms` — whichever is first. */
export const fontsReady = (ms = 2500) =>
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);

export function toast(message) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('is-on'), 2200);
}
