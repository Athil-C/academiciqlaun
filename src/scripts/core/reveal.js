import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { env, $$ } from './env.js';

const st = (el, start = 'top 90%') => ({ trigger: el, start, once: true });

/**
 * Declarative reveals:
 *   data-reveal="lines|chars|words|up|fade|scale|rule"   data-delay="0.2"
 *   data-scrub-words     → words light up as you scroll through the block
 *   data-parallax="0.15" → drifts against the scroll
 */
export function initReveals(root = document) {
  if (env.reduced) {
    $$('[data-reveal]', root).forEach((el) => gsap.set(el, { opacity: 1, visibility: 'visible', clearProps: 'transform' }));
    return;
  }

  $$('[data-reveal]', root).forEach((el) => {
    if (el.__rev) return;
    el.__rev = true;
    const type = el.dataset.reveal;
    const delay = parseFloat(el.dataset.delay) || 0;
    const start = el.dataset.start || 'top 90%';

    if (type === 'lines') {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, {
            yPercent: 112,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.09,
            delay,
            scrollTrigger: st(el, start),
          });
        },
      });
    } else if (type === 'chars') {
      SplitText.create(el, {
        type: 'words,chars',
        mask: 'words',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.chars, {
            yPercent: 115,
            duration: 1,
            ease: 'expo.out',
            stagger: { each: 0.022, from: 'start' },
            delay,
            scrollTrigger: st(el, start),
          });
        },
      });
    } else if (type === 'words') {
      SplitText.create(el, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.words, {
            opacity: 0,
            y: 18,
            filter: 'blur(6px)',
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.025,
            delay,
            scrollTrigger: st(el, start),
          });
        },
      });
    } else if (type === 'rule') {
      gsap.to(el, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', delay, scrollTrigger: st(el, 'top 95%') });
    } else if (type === 'scale') {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.3, ease: 'expo.out', delay, scrollTrigger: st(el, start) },
      );
    }
  });

  // siblings that enter together are staggered together
  const batch = (selector, from, to) => {
    const els = $$(selector, root).filter((el) => !el.__batched);
    if (!els.length) return;
    els.forEach((el) => (el.__batched = true));
    gsap.set(els, from);
    ScrollTrigger.batch(els, {
      start: 'top 92%',
      once: true,
      onEnter: (group) => {
        // After a jump (anchor link, restored scroll) dozens of elements "enter" at once.
        // Anything already above the viewport is simply shown, so what is on screen never waits.
        const passed = group.filter((el) => el.getBoundingClientRect().bottom < 0);
        const seen = group.filter((el) => !passed.includes(el));
        // once shown, hand the element back to CSS so hover states are not fighting inline styles
        const release = (els) => {
          els.forEach((el) => el.classList.add('is-revealed'));
          gsap.set(els, { clearProps: 'opacity,transform' });
        };
        if (passed.length) {
          gsap.killTweensOf(passed);
          release(passed);
        }
        if (seen.length) {
          gsap.to(seen, {
            ...to,
            stagger: 0.085,
            delay: (i, el) => parseFloat(el.dataset.delay) || 0,
            overwrite: true,
            onComplete: () => release(seen),
          });
        }
      },
    });
  };

  batch('[data-reveal="up"]', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 1.15, ease: 'expo.out' });
  batch('[data-reveal="fade"]', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });

  // scrubbed word highlight
  $$('[data-scrub-words]', root).forEach((el) => {
    if (el.__scrub) return;
    el.__scrub = true;
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.words,
          { opacity: 0.13 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: {
              trigger: el,
              start: el.dataset.start || 'top 78%',
              end: el.dataset.end || 'bottom 45%',
              scrub: 0.6,
            },
          },
        );
      },
    });
  });

  // parallax
  $$('[data-parallax]', root).forEach((el) => {
    if (el.__plx || env.small) return;
    el.__plx = true;
    const amount = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(
      el,
      { yPercent: amount * 100 },
      {
        yPercent: -amount * 100,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}
