import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, $, $$, toast } from './env.js';
import { scrollTo } from './scroll.js';

export function initMisc() {
  // scroll progress hairline
  const bar = $('[data-progress]');
  if (bar) {
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }

  // wayand time
  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => {
      const t = fmt.format(new Date());
      clocks.forEach((c) => (c.textContent = t));
    };
    tick();
    setInterval(tick, 1000);
  }

  // back to top
  $$('[data-totop]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo(0, { duration: 1.8 });
    }),
  );

  // click to copy
  document.addEventListener('click', async (e) => {
    const el = e.target.closest?.('[data-copy]');
    if (!el) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(el.dataset.copy);
      toast(el.dataset.copyDone || 'Copied');
    } catch {
      window.location.href = el.getAttribute('href') || `mailto:${el.dataset.copy}`;
    }
  });

  // keep ScrollTrigger honest once everything has loaded
  window.addEventListener('load', () => ScrollTrigger.refresh());

  if (!env.touch) {
    // eslint-disable-next-line no-console
    console.log(
      '%c AQ %c ACADEMIQ — CONNECTING MINDS',
      'background:#38bdf8;color:#fff;font:800 22px/1.6 sans-serif;padding:2px 6px',
      'color:#38bdf8;font:800 22px/1.6 sans-serif',
    );
    // eslint-disable-next-line no-console
    console.log('Reading the source? Good instinct. Come build with us â†’ contact@academiq.org');
  }
}

