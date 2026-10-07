import { gsap } from 'gsap';
import { env, $, $$ } from './env.js';

/**
 * Inner-page hero. Hides its parts, returns the function that plays them in.
 *   [data-phero-in]    lines that rise out of a mask
 *   [data-phero-fade]  supporting content that fades up
 *   .bw[data-pre-target] the BRO word — handed over by the preloader on a first visit
 */
export function pageHero() {
  const root = $('.phero');
  if (!root || env.reduced) return () => {};

  const first = env.html.classList.contains('is-loading');
  const ins = $$('[data-phero-in]', root);
  const fades = $$('[data-phero-fade]', root);
  const word = $('.bw', root);
  const box = word && $('.bw__box', word);
  const rest = word && $('.bw__rest', word);
  const handed = first && Boolean($('[data-pre-target]', root));

  gsap.set(ins, { yPercent: 118 });
  gsap.set(fades, { opacity: 0, y: 26 });
  if (word && !handed) {
    gsap.set(box, { clipPath: 'inset(0% 100% 0% 0%)' });
    if (rest) gsap.set(rest, { opacity: 0, xPercent: -22 });
  }

  const title = $('.phero__title', root);
  if (title) {
    gsap.to(title, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  return () => {
    const tl = gsap.timeline({ delay: handed ? 0.62 : first ? 0.35 : 0.05 });
    if (word && !handed) {
      tl.to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'expo.inOut' }, 0);
      if (rest) tl.to(rest, { opacity: 1, xPercent: 0, duration: 1.1, ease: 'expo.out' }, 0.42);
    }
    tl.to(ins, { yPercent: 0, duration: 1.35, ease: 'expo.out', stagger: 0.1 }, word ? 0.3 : 0).to(
      fades,
      { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07 },
      '-=1',
    );
    return tl;
  };
}

/** Steps draw their top rule once they are on screen. */
export function markSteps(root = document) {
  const steps = $$('.step', root);
  if (!steps.length) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = steps.indexOf(e.target) % 4;
        setTimeout(() => e.target.classList.add('is-in'), i * 140);
        io.unobserve(e.target);
      }),
    { threshold: 0.4 },
  );
  steps.forEach((s) => io.observe(s));
}
