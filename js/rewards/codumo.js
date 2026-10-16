import { element, wait } from './util.js';

const TEXT = 'codumo.de';
const TYPE_MS = 90;

// Traced from https://codumo.de/wp-content/uploads/2025/06/CODUMO-Logo-2023.png
const LOGO_SVG = `
<svg viewBox="300 110 450 280" aria-hidden="true">
  <polygon class="chevron left" points="388,130 431,130 362,249 431,369 388,369 319,249" />
  <polygon class="chevron right" points="617,130 660,130 729,249 660,369 617,369 686,249" />
  <path class="hexagon" pathLength="1"
    d="M455 130 L594 130 L663 249 L594 369 L541 369 L520 333 L572 333 L621 249 L572 167 L476 167 L428 249 L497 369 L455 369 L385 249 Z" />
</svg>`;

export async function play({ layer, reducedMotion }) {
  const overlay = element(reducedMotion ? 'codumo calm' : 'codumo', layer);
  const logo = element('codumo-logo', overlay);
  logo.innerHTML = LOGO_SVG;
  const text = element('codumo-text', overlay);
  await wait(reducedMotion ? 400 : 1700);
  if (reducedMotion) {
    text.textContent = TEXT;
  } else {
    for (const char of TEXT) {
      text.textContent += char;
      await wait(TYPE_MS);
    }
  }
  await wait(2000);
  overlay.classList.add('out');
  await wait(400);
  overlay.remove();
}
