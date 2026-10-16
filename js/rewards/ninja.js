import { element, wait } from './util.js';

export async function play({ layer, physics, reducedMotion, match }) {
  const ids = physics
    .tileStates()
    .filter((tile) => tile.snappedField !== null && tile.snappedField >= match.start && tile.snappedField < match.start + match.word.length)
    .sort((a, b) => a.snappedField - b.snappedField)
    .map((tile) => tile.id);

  const dark = element(reducedMotion ? 'ninja calm' : 'ninja', layer);
  await wait(600);
  const goggles = element('goggles', dark);
  for (let i = 0; i < 3; i++) element('goggle', goggles);
  await wait(800);
  document.body.classList.add('nightvision');
  dark.classList.add('vision');
  await wait(500);
  for (const id of ids) {
    physics.unsnap(id);
    physics.setTilesVisible([id], false);
    await wait(350);
  }
  await wait(700);
  document.body.classList.remove('nightvision');
  dark.classList.add('out');
  await wait(500);
  dark.remove();
  await wait(700);
  physics.dropTiles(ids);
  physics.setTilesVisible(ids, true);
}
