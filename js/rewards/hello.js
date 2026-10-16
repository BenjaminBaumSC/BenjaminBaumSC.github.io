import { element, wait } from './util.js';

const TEXT = 'Hallo, Freund.';
const TYPE_MS = 90;

export async function play({ layer, setPaused, reducedMotion }) {
  setPaused(true);
  const overlay = element('hello', layer);
  const line = element('hello-line', overlay);
  const typed = element('hello-text', line);
  element('cursor', line);
  await wait(400);
  if (reducedMotion) {
    typed.textContent = TEXT;
  } else {
    for (const char of TEXT) {
      typed.textContent += char;
      await wait(TYPE_MS);
    }
  }
  await wait(2000);
  overlay.classList.add('out');
  await wait(400);
  overlay.remove();
  setPaused(false);
}
