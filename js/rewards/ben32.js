import { element, wait } from './util.js';

const IMAGE = 'assets/ben32.jpg';
// Load early so the panel never pops in empty.
new Image().src = IMAGE;

export async function play({ layer, reducedMotion, comic }) {
  const panel = element(reducedMotion ? 'ben32-panel calm' : 'ben32-panel', layer);
  const image = document.createElement('img');
  image.src = IMAGE;
  image.alt = '';
  panel.append(image);
  element('tape left', panel);
  element('tape right', panel);
  element('speech', panel, 'The fence is a lie.');
  await wait(450);
  if (!reducedMotion) {
    const rect = panel.getBoundingClientRect();
    comic('MÄH!', rect.left + rect.width * 0.1, rect.top + rect.height * 0.35);
  }
  await wait(3000);
  panel.classList.add('out');
  await wait(600);
  panel.remove();
}
