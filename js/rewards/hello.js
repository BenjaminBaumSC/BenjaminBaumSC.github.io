import { PARTY_TILES } from '../config.js';
import { heartPoints } from '../layout.js';
import { element, wait } from './util.js';

const GREETING = 'HALLO, FREUND!';
const CONFETTI = 140;
const CONFETTI_COLORS = ['#c8423a', '#e9a3a3', '#2f6db5', '#9cc8e8', '#f5bc0a', '#20b69e', '#ecd29c', '#ffffff'];

function greet(layer, layout, calm) {
  const line = element(calm ? 'greeting calm' : 'greeting', layer);
  line.style.top = `${layout.rowY - layout.fieldSize * 1.4}px`;
  [...GREETING].forEach((char, i) => {
    const letter = document.createElement('span');
    letter.textContent = char;
    letter.style.animationDelay = `${i * 60}ms`;
    line.append(letter);
  });
  return line;
}

function rainConfetti(layer, calm) {
  const rain = element(calm ? 'confetti-rain calm' : 'confetti-rain', layer);
  for (let i = 0; i < CONFETTI; i++) {
    const piece = element('flake', rain);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${2.4 + Math.random() * 1.8}s, ${0.6 + Math.random() * 0.6}s`;
    piece.style.animationDelay = `${Math.random() * 1.6}s, 0s`;
    if (calm) piece.style.top = `${Math.random() * 90}%`;
  }
  return rain;
}

function heartTargets(physics, layout) {
  const loose = physics.tileStates().filter((tile) => tile.visible && tile.snappedField === null);
  let spacing = layout.tileSize * 1.3;
  let points = heartPoints(loose.length, spacing);
  const height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  // Shrink the heart (tiles may overlap a little) when it would not fit above the rack.
  const room = layout.rowY - layout.tileSize;
  if (height + layout.tileSize > room) {
    spacing *= room / (height + layout.tileSize);
    points = heartPoints(loose.length, spacing);
  }
  const cx = layout.width / 2;
  const cy = (layout.rowY - layout.tileSize * 0.2) / 2 + layout.tileSize * 0.3;
  // Nearest-first assignment keeps the flight paths short.
  const remaining = [...points];
  return loose
    .sort((a, b) => a.x - b.x)
    .map((tile) => {
      let best = 0;
      remaining.forEach((p, i) => {
        const d = Math.hypot(cx + p.x - tile.x, cy + p.y - tile.y);
        const bestD = Math.hypot(cx + remaining[best].x - tile.x, cy + remaining[best].y - tile.y);
        if (d < bestD) best = i;
      });
      const [p] = remaining.splice(best, 1);
      return { id: tile.id, x: cx + p.x, y: cy + p.y };
    });
}

export async function play({ layer, physics, renderer, reducedMotion, match, layout, comic }) {
  if (reducedMotion) {
    const line = greet(layer, layout, true);
    const rain = rainConfetti(layer, true);
    await wait(3000);
    line.remove();
    rain.remove();
    return;
  }

  const benni = physics
    .tileStates()
    .filter((tile) => tile.snappedField !== null && tile.snappedField >= match.start && tile.snappedField < match.start + match.word.length)
    .sort((a, b) => a.snappedField - b.snappedField)
    .map((tile) => tile.id);

  const line = greet(layer, layout, false);
  physics.addTiles(PARTY_TILES);
  renderer.wave(benni);
  const rain = rainConfetti(layer, false);
  await wait(1900);

  for (let i = 0; i < 3; i++) {
    physics.hop();
    await wait(480);
  }
  await wait(500);

  // Clear the stage so the greeting does not hide the heart's tip.
  line.classList.add('out');
  physics.formShape(heartTargets(physics, layout), 900);
  await wait(2000);
  physics.releaseShape();
  await wait(1500);

  const partyIds = PARTY_TILES.map((tile) => tile.id);
  for (const tile of physics.tileStates().filter((t) => partyIds.includes(t.id))) {
    comic('PLOPP!', tile.x, tile.y - layout.tileSize * 0.5);
  }
  physics.removeTiles(partyIds);
  await wait(500);
  line.remove();
  rain.remove();
}
