import { element, wait } from './util.js';

const CONFETTI_COLORS = ['#c8423a', '#e9a3a3', '#2f6db5', '#9cc8e8', '#ecd29c', '#ffffff'];
const PIXEL_COLORS = ['#f4a7c0', '#fbe3ec', '#8b5a3c', '#fff6dd', '#ffd34d'];
const CONFETTI = 70;
const PIXEL_GRID = 10;

const CAKE_SVG = `
<svg viewBox="0 0 200 220" aria-hidden="true">
  <ellipse cx="100" cy="206" rx="92" ry="10" fill="#e8eef8" />
  <rect x="22" y="130" width="156" height="72" rx="10" fill="#8b5a3c" />
  <path d="M22 140 q13 18 26 0 t26 0 t26 0 t26 0 t26 0 t26 0 v-12 h-156 z" fill="#f4a7c0" />
  <rect x="48" y="78" width="104" height="58" rx="9" fill="#8b5a3c" />
  <path d="M48 88 q13 16 26 0 t26 0 t26 0 t26 0 v-12 h-104 z" fill="#fbe3ec" />
  <circle cx="70" cy="112" r="5" fill="#c8423a" />
  <circle cx="100" cy="118" r="5" fill="#c8423a" />
  <circle cx="130" cy="112" r="5" fill="#c8423a" />
  <rect x="94" y="38" width="12" height="42" rx="3" fill="#fff6dd" stroke="#e9a3a3" stroke-width="2" />
  <path class="flame" d="M100 6 C112 22 110 34 100 36 C90 34 88 22 100 6 Z" fill="#ffd34d" />
</svg>`;

function burstConfetti(layer, x, y) {
  for (let i = 0; i < CONFETTI; i++) {
    const piece = element('confetti', layer);
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 280;
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance * 0.6 + 260}px`);
    piece.style.setProperty('--spin', `${(Math.random() - 0.5) * 1080}deg`);
    piece.style.animationDelay = `${Math.random() * 120}ms`;
  }
}

function dissolveIntoPixels(layer, rect) {
  const size = rect.width / PIXEL_GRID;
  for (let row = 0; row < PIXEL_GRID; row++) {
    for (let col = 0; col < PIXEL_GRID; col++) {
      const pixel = element('cake-pixel', layer);
      Object.assign(pixel.style, {
        left: `${rect.left + col * size}px`,
        top: `${rect.top + row * size * (rect.height / rect.width)}px`,
        width: `${size}px`,
        height: `${size}px`,
        background: PIXEL_COLORS[(row * 7 + col * 3) % PIXEL_COLORS.length],
        animationDelay: `${Math.random() * 400}ms`,
      });
      pixel.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      pixel.style.setProperty('--dy', `${-40 - Math.random() * 120}px`);
    }
  }
}

export async function play({ layer, reducedMotion }) {
  const stage = element(reducedMotion ? 'cake-stage calm' : 'cake-stage', layer);
  const cake = element('cake', stage);
  cake.innerHTML = CAKE_SVG;
  await wait(1400);

  const rect = cake.getBoundingClientRect();
  if (!reducedMotion) burstConfetti(stage, rect.left + rect.width / 2, rect.top + rect.height * 0.3);
  await wait(1600);

  if (reducedMotion) {
    cake.classList.add('fade');
  } else {
    cake.classList.add('glitch');
    await wait(600);
    cake.classList.add('gone');
    dissolveIntoPixels(stage, rect);
  }
  await wait(700);

  element('lie', stage, 'the cake was a lie');
  await wait(2200);
  stage.classList.add('out');
  await wait(500);
  stage.remove();
}
