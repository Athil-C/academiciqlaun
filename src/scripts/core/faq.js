import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $$ } from './env.js';

/** Eases <details> open and shut. One item open at a time per list. */
export function initFaq(root = document) {
  $$('[data-faq]', root).forEach((list) => {
    const items = $$('[data-faq-item]', list);

    const close = (item) => {
      if (!item.open || item.classList.contains('is-closing')) return;
      const panel = item.querySelector('[data-faq-panel]');
      item.classList.add('is-closing');
      gsap.to(panel, {
        height: 0,
        duration: env.reduced ? 0 : 0.55,
        ease: 'power3.inOut',
        onComplete: () => {
          item.open = false;
          item.classList.remove('is-closing');
          gsap.set(panel, { clearProps: 'height' });
          ScrollTrigger.refresh();
        },
      });
    };

    const open = (item) => {
      const panel = item.querySelector('[data-faq-panel]');
      items.forEach((other) => other !== item && close(other));
      item.open = true;
      gsap.killTweensOf(panel);
      item.classList.remove('is-closing');
      gsap.fromTo(
        panel,
        { height: 0 },
        {
          height: 'auto',
          duration: env.reduced ? 0 : 0.75,
          ease: 'expo.out',
          onComplete: () => {
            gsap.set(panel, { clearProps: 'height' });
            ScrollTrigger.refresh();
          },
        },
      );
      if (!env.reduced) {
        gsap.fromTo(
          panel.querySelector('p'),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.12, ease: 'power3.out' },
        );
      }
    };

    items.forEach((item) => {
      item.querySelector('summary').addEventListener('click', (e) => {
        e.preventDefault();
        if (item.open && !item.classList.contains('is-closing')) close(item);
        else open(item);
      });
    });
  });
}
