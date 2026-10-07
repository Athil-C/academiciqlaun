import { gsap } from 'gsap';
import { env, $ } from './env.js';
import { lockScroll, unlockScroll } from './scroll.js';

/** Any element with data-video="<youtube id>" opens the player. */
export function initVideo() {
  const dialog = $('[data-vid]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const frame = $('[data-vid-frame]', dialog);
  const title = $('[data-vid-title]', dialog);
  let opener = null;

  const close = () => {
    if (!dialog.open) return;
    const done = () => {
      frame.textContent = '';
      dialog.close();
      unlockScroll();
      opener?.focus?.();
    };
    if (env.reduced) return done();
    gsap.to($('.vid__inner', dialog), { opacity: 0, y: 24, duration: 0.35, ease: 'power2.in', onComplete: done });
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest?.('[data-video]');
    if (!trigger) return;
    const id = trigger.dataset.video;
    if (!/^[\w-]{11}$/.test(id)) return;
    e.preventDefault();
    opener = trigger;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = trigger.dataset.videoTitle || 'AcademiQ video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.textContent = '';
    frame.appendChild(iframe);
    title.textContent = trigger.dataset.videoTitle || 'AcademiQ';

    dialog.showModal();
    lockScroll();
    if (!env.reduced) {
      gsap.fromTo(
        $('.vid__inner', dialog),
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' },
      );
    }
  });

  $('[data-vid-close]', dialog).addEventListener('click', close);
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
}

