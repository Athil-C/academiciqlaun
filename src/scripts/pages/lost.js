import { pageHero } from '../core/phero.js';

export default function init() {
  const intro = pageHero();
  const stops = [
    {
      el: '[data-stop="hero"]',
      shape: 'text:404',
      x: 0.46,
      y: 0.18,
      size: 0.3,
      fit: 0.24,
      red: 0.5,
      drift: 0.03,
      look: 0.5,
      point: 2.5,
      force: 0.9,
      m: { x: 0.2, y: 0.5, size: 0.18, alpha: 0.5 },
    },
  ];
  return { stops, intro };
}
