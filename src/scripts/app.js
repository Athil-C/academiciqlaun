/**
 * ACADEMIQ â€” application entry.
 * Boots the shared shell, then hands over to the module for the current page.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { env, $, fontsReady } from './core/env.js';
import { initScroll } from './core/scroll.js';
import { initCursor } from './core/cursor.js';
import { initNav } from './core/nav.js';
import { initTransitions, enter } from './core/transitions.js';
import { initButtons, initMagnetic, initTilt, initWordmark } from './core/hover.js';
import { initReveals } from './core/reveal.js';
import { initMarquees } from './core/marquee.js';
import { initOdometers } from './core/odometer.js';
import { initFaq } from './core/faq.js';
import { initVideo } from './core/video.js';
import { initMisc } from './core/misc.js';
import { initForms } from './core/forms.js';
import { initDots } from './core/dots.js';
import { initTerms } from './core/term.js';
import { initBlocks } from './core/blocks.js';
import { runPreloader } from './core/preloader.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });
ScrollTrigger.config({ ignoreMobileResize: true });
if (import.meta.env.DEV) window.__ST = ScrollTrigger;

const pages = {
  home: () => import('./pages/home.js'),
  brocamp: () => import('./pages/brocamp.js'),
  courses: () => import('./pages/courses.js'),
  pap: () => import('./pages/pap.js'),
  placements: () => import('./pages/placements.js'),
  hire: () => import('./pages/hire.js'),
  apply: () => import('./pages/apply.js'),
  lost: () => import('./pages/lost.js'),
};

async function startStage(stops) {
  const canvas = $('[data-gl]');
  if (!canvas || !stops?.length) return null;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
    const { Stage } = await import('./webgl/stage.js');
    const stage = new Stage(canvas);
    await stage.init(stops);
    env.stage = stage;
    return stage;
  } catch (err) {
    // WebGL is decoration; the page must work without it.
    console.warn('[stage] disabled:', err);
    canvas.remove();
    return null;
  }
}

async function boot() {
  const html = document.documentElement;

  initScroll();
  initCursor();
  initNav();
  initTransitions();
  initButtons();
  initMagnetic();
  initTilt();
  initWordmark();
  initFaq();
  initVideo();
  initForms();

  await fontsReady();

  // page module: builds its own scroll scenes and returns { stops, intro }
  let page = {};
  const load = pages[document.body.dataset.page];
  if (load) {
    try {
      const mod = await load();
      page = (await mod.default?.()) || {};
    } catch (err) {
      console.error('[page]', err);
    }
  }

  const stage = await startStage(page.stops);
  page.onStage?.(stage);

  initMarquees();
  initOdometers();
  initDots();
  initTerms();
  initBlocks();
  initMisc();

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    initReveals();
    stage?.playIntro(html.classList.contains('is-loading') ? 3 : 2.2);
    page.intro?.();
    ScrollTrigger.refresh();
  };

  if (html.classList.contains('is-loading')) await runPreloader({ onExit: start });
  else if (html.classList.contains('is-entering')) await enter().then(start);
  else start();

  start();
  clearTimeout(window.__aqFailsafe);
  html.classList.add('is-ready');
}

boot().catch((err) => {
  console.error('[boot]', err);
  document.documentElement.classList.add('is-failsafe');
  document.documentElement.classList.remove('is-loading', 'is-entering');
});

