import { element, wait } from './util.js';

const DRIVE_MS = 3600;
const CAR_URL = 'assets/mini-cooper.svg';
const WHEEL_CENTERS = [
  [23.1, 59.4],
  [79.1, 59.4],
];
// Fetched early so the car is ready when MINI is laid.
const carMarkup = fetch(CAR_URL).then((response) => response.text());

function addSpokes(svg) {
  for (const [cx, cy] of WHEEL_CENTERS) {
    const wheel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wheel.setAttribute('class', 'wheel');
    // An invisible ring keeps the group's box centred on the hub for rotation.
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    Object.entries({ cx, cy, r: 4.5, fill: 'none', stroke: 'none' }).forEach(([k, v]) => ring.setAttribute(k, v));
    wheel.append(ring);
    for (const angle of [0, 120, 240]) {
      const spoke = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      Object.entries({ x1: cx, y1: cy, x2: cx, y2: cy - 4, transform: `rotate(${angle} ${cx} ${cy})` }).forEach(([k, v]) => spoke.setAttribute(k, v));
      wheel.append(spoke);
    }
    svg.append(wheel);
  }
}

export async function play({ layer, reducedMotion, comic, layout }) {
  const stage = element(reducedMotion ? 'mini-stage calm' : 'mini-stage', layer);
  const car = element('mini-car', stage);
  car.innerHTML = await carMarkup;
  addSpokes(car.querySelector('svg'));
  element('mini-credit', car, 'Icon: kiddo / Noun Project');
  car.style.top = `${layout.floorY - car.offsetHeight + 14}px`;
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
