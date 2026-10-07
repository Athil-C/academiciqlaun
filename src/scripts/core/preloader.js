import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { $, $$, store } from './env.js';

gsap.registerPlugin(Flip);

/**
 * First visit of the session: count up to the number of engineers placed while
 * BROÂ·TOTYPE becomes BROÂ·THER, then hand the word over to the page.
 *
 * `onExit` fires the moment the preloader starts to leave â€” start page intros there.
 */
export function runPreloader({ onExit } = {}) {
  return new Promise((resolve) => {
    const html = document.documentElement;
    const pre = $('[data-pre]');
    if (!pre || !html.classList.contains('is-loading')) {
      onExit?.();
      return resolve();
    }

    const box = $('[data-pre-box]', pre);
    const a = $('[data-pre-a]', pre);
    const b = $('[data-pre-b]', pre);
    const suffix = a.parentElement;
    const word = suffix.parentElement;
    const count = $('[data-pre-count]', pre);
    const bar = $('[data-pre-bar]', pre);
    const chrome = $$('.pre__top, .pre__bottom', pre);
    const to = Number(count.dataset.to) || 0;
    const digits = String(to).length;
    const counter = { v: 0 };

    // the word the preloader settles on matches the page it hands over to
    const target = $('[data-pre-target]');
    if (target) b.textContent = target.dataset.preSuffix ?? target.querySelector('.bw__rest')?.textContent.trim() ?? '';

    // the suffix box is as wide as whichever word it currently shows
    const wA = a.getBoundingClientRect().width;
    const wB = b.textContent ? b.getBoundingClientRect().width : 0;
    gsap.set(suffix, { width: wA, minWidth: 0 });
    gsap.set(b, { yPercent: 115 });

    const finish = () => {
      store.set('aq:seen', '1');
      html.classList.remove('is-loading');
      pre.style.display = 'none';
      resolve();
    };

    const exit = () => {
      // page content becomes visible beneath the (still opaque) preloader
      pre.style.display = 'grid';
      html.classList.remove('is-loading');
      onExit?.();

      const tl = gsap.timeline({ onComplete: finish });
      tl.to(chrome, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0).to(bar.parentElement, { opacity: 0, duration: 0.3 }, 0);

      if (target) {
        // shared-element hand-off: the preloader word lands exactly on the headline
        gsap.set(target, { visibility: 'hidden' });
        const fit = Flip.fit(word, target, { scale: true, getVars: true });
        tl.to(pre, { backgroundColor: 'rgba(9,9,10,0)', duration: 0.9, ease: 'power2.inOut' }, 0.1)
          .to(word, { ...fit, duration: 1.25, ease: 'expo.inOut' }, 0)
          .set(target, { visibility: 'visible' }, 1.25)
          .set(word, { visibility: 'hidden' }, 1.25);
      } else {
        tl.to(word, { yPercent: -60, opacity: 0, duration: 0.7, ease: 'expo.in' }, 0).to(
          pre,
          { yPercent: -100, duration: 0.95, ease: 'expo.inOut' },
          0.15,
        );
      }
    };

    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(box, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0.1)
      .fromTo(a, { yPercent: 115 }, { yPercent: 0, duration: 0.9 }, 0.35)
      .fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.2)
      .to(
        counter,
        {
          v: to,
          duration: 2.1,
          ease: 'power3.inOut',
          onUpdate: () => (count.textContent = String(Math.round(counter.v)).padStart(digits, '0')),
        },
        0.25,
      )
      .to(bar, { scaleX: 1, duration: 2.1, ease: 'power3.inOut' }, 0.25)
      .to(a, { yPercent: -115, duration: 0.75, ease: 'expo.inOut' }, 1.35)
      .to(b, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 1.35)
      .to(suffix, { width: wB, ...(wB ? {} : { paddingLeft: 0 }), duration: 0.75, ease: 'expo.inOut' }, 1.35)
      .add(exit, 2.55);
  });
}

