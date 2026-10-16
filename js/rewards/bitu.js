import { element, wait } from './util.js';

const TROPHY_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <path d="M12 8 H28 V16 A8 8 0 0 1 12 16 Z" />
  <path d="M12 10 H7 A5 5 0 0 0 12 19 M28 10 H33 A5 5 0 0 1 28 19" fill="none" />
  <rect x="18" y="24" width="4" height="6" />
  <rect x="13" y="30" width="14" height="3" rx="1" />
</svg>`;

export async function play({ layer, reducedMotion }) {
  const toast = element(reducedMotion ? 'achievement calm' : 'achievement', layer);
  const icon = element('achievement-icon', toast);
  icon.innerHTML = TROPHY_SVG;
  const text = element('achievement-text', toast);
  element('achievement-title', text, 'Erfolg freigeschaltet');
  element('achievement-name', text, '84G – BITU84');
  await wait(3400);
  toast.classList.add('out');
  await wait(500);
  toast.remove();
}
