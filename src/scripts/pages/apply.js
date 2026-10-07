import { pageHero, markSteps } from '../core/phero.js';

export default function init() {
  const intro = pageHero();
  markSteps();

  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'ring',
      x: 0.1,
      y: 0.05,
      size: 0.62,
      tilt: 1.12,
      turn: 0.09,
      red: 0.3,
      drift: 0.01,
      look: 0.3,
      alpha: 0.75,
      point: 2.5,
      force: 0.5,
      m: { x: 0, y: 0.3, size: 0.4, alpha: 0.4 },
    },
  ];

  return { stops, intro };
}
