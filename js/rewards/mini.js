import { element, wait } from './util.js';

const DRIVE_MS = 3600;

const WHEEL = (cx) => `
  <g class="wheel" style="transform-origin: ${cx}px 118px">
    <circle cx="${cx}" cy="118" r="24" />
    <circle cx="${cx}" cy="118" r="8" />
    ${[0, 72, 144, 216, 288].map((a) => `<line x1="${cx}" y1="110" x2="${cx}" y2="96" transform="rotate(${a} ${cx} 118)" />`).join('')}
  </g>`;

// Side view of a first-generation BMW MINI (R50/R53), drawn as a blueprint line sketch.
const CAR_SVG = `
<svg viewBox="0 0 400 150" aria-hidden="true">
  <path d="M18 118 L18 74 Q18 60 32 58 L70 56 L98 30 Q104 24 114 24 L262 24 Q272 24 280 32 L312 60 L368 66 Q386 68 388 86 L388 118 L336 118 A26 26 0 0 0 284 118 L126 118 A26 26 0 0 0 74 118 Z" />
  <path d="M104 34 L114 30 L180 30 L180 56 L84 56 Z" />
  <path d="M190 30 L262 30 Q268 30 274 36 L294 56 L190 56 Z" />
  <line x1="186" y1="60" x2="186" y2="112" />
  <line x1="196" y1="70" x2="214" y2="70" />
  <circle cx="372" cy="78" r="6" />
  <rect x="18" y="70" width="8" height="14" />
  <line x1="300" y1="96" x2="388" y2="96" />
  ${WHEEL(100)}
  ${WHEEL(310)}
</svg>`;

export async function play({ layer, reducedMotion, comic, layout }) {
  const stage = element(reducedMotion ? 'mini-stage calm' : 'mini-stage', layer);
  const car = element('mini-car', stage);
  car.innerHTML = CAR_SVG;
  car.style.top = `${layout.floorY - car.offsetHeight + 4}px`;
  for (let i = 0; i < 6; i++) {
    const puff = element('mini-puff', car);
    puff.style.animationDelay = `${i * 260}ms`;
  }
  const logo = document.createElement('img');
  logo.className = 'mini-logo';
  logo.src = 'assets/mini-logo.svg';
  logo.alt = '';
  stage.append(logo);
  if (!reducedMotion) comic('BRUMM!', layout.width * 0.18, layout.floorY - car.offsetHeight);
  await wait(DRIVE_MS);
  stage.classList.add('out');
  await wait(400);
  stage.remove();
}
