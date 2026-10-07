import { gsap } from 'gsap';
import { env, $, $$ } from './env.js';
import { lockScroll, unlockScroll } from './scroll.js';

let menuOpen = false;
let closeMenuFn = () => {};

export const closeMenu = () => closeMenuFn();

export function initNav() {
  const nav = $('[data-nav]');
  const menu = $('[data-menu]');
  const burger = $('[data-burger]');
  if (!nav) return;

  /* ---- hide on the way down, return on the way up ------------------- */
  let lastY = window.scrollY;
  let hidden = false;
  let theme = '';

  const setTheme = (t) => {
    if (t === theme) return;
    theme = t;
    nav.dataset.theme = t;
  };

  // The nav takes its colours from whichever themed section sits beneath it.
  const probe = () => {
    if (menuOpen) return setTheme('dark');
    const y = nav.offsetHeight / 2;
    const stack = document.elementsFromPoint(window.innerWidth / 2, y);
    for (const el of stack) {
      if (nav.contains(el) || menu?.contains(el)) continue;
      const themed = el.closest('[data-theme]');
      if (themed && !nav.contains(themed)) return setTheme(themed.dataset.navTheme || themed.dataset.theme);
    }
    setTheme('dark');
  };

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    if (!menuOpen) {
      if (y > lastY + 6 && y > 360 && !hidden) {
        hidden = true;
        nav.classList.add('is-hidden');
      } else if ((y < lastY - 6 || y < 360) && hidden) {
        hidden = false;
        nav.classList.remove('is-hidden');
      }
    }
    lastY = y;
    probe();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', probe);
  onScroll();
  nav.__probe = probe;

  /* ---- fullscreen menu ---------------------------------------------- */
  if (!menu || !burger) return;

  const cols = $$('.menu__bg i', menu);
  const items = $$('[data-menu-in]', menu);
  const main = $('main');
  const foot = $('.foot');
  let tl;

  const open = () => {
    if (menuOpen) return;
    menuOpen = true;
    document.documentElement.classList.add('menu-open');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    main?.setAttribute('inert', '');
    foot?.setAttribute('inert', '');
    hidden = false;
    nav.classList.remove('is-hidden');
    lockScroll();
    probe();

    tl?.kill();
    gsap.set(menu, { visibility: 'visible' });
    if (env.reduced) {
      gsap.set(cols, { scaleY: 1 });
      gsap.set(items, { opacity: 1, y: 0 });
    } else {
      tl = gsap
        .timeline()
        .set(cols, { transformOrigin: 'top center' })
        .to(cols, { scaleY: 1, duration: 0.85, ease: 'expo.inOut', stagger: 0.055 })
        .fromTo(
          items,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.95, ease: 'expo.out', stagger: 0.05 },
          '-=0.45',
        );
    }
    requestAnimationFrame(() => menu.querySelector('a')?.focus({ preventScroll: true }));
  };

  const close = (instant = false) => {
    if (!menuOpen) return;
    menuOpen = false;
    document.documentElement.classList.remove('menu-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    main?.removeAttribute('inert');
    foot?.removeAttribute('inert');
    unlockScroll();

    tl?.kill();
    const done = () => {
      gsap.set(menu, { visibility: 'hidden' });
      gsap.set(cols, { scaleY: 0 });
      probe();
    };
    if (env.reduced || instant) return done();
    tl = gsap
      .timeline({ onComplete: done })
      .to(items, { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in', stagger: 0.02 })
      .set(cols, { transformOrigin: 'bottom center' })
      .to(cols, { scaleY: 0, duration: 0.75, ease: 'expo.inOut', stagger: { each: 0.05, from: 'end' } }, '-=0.15');
  };

  closeMenuFn = close;

  burger.addEventListener('click', () => (menuOpen ? close() : open()));

  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') {
      close();
      burger.focus();
      return;
    }
    if (e.key !== 'Tab') return;
    // keep focus inside the header + menu while it is open
    const focusables = [...$$('a, button', nav), ...$$('a, button', menu)].filter((el) => el.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
