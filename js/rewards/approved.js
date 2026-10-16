import { element, wait } from './util.js';

export async function play({ layer, reducedMotion, comic }) {
  const scene = document.getElementById('scene');
  const stamp = element(reducedMotion ? 'stamp calm' : 'stamp', layer);
  element('stamp-text', stamp, 'GENEHMIGT');
  if (!reducedMotion) {
    await wait(180);
    scene.classList.add('shake');
    const rect = stamp.getBoundingClientRect();
    comic('WUMMS!', rect.right - rect.width * 0.15, rect.top);
  }
  await wait(2200);
  stamp.classList.add('out');
  await wait(500);
  stamp.remove();
  scene.classList.remove('shake');
}
