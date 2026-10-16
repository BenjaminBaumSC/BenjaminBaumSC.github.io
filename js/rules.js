import {
  KONAMI_SEQUENCE,
  KONAMI_TAIL,
  KONAMI_TIMEOUT_MS,
  SNAP_MAX_SPEED,
  SNAP_CAPTURE_HEIGHT,
} from './config.js';

export function findWord(fieldLetters, words) {
  let start = 0;
  while (start < fieldLetters.length) {
    if (fieldLetters[start] === null) {
      start++;
      continue;
    }
    let end = start;
    while (end < fieldLetters.length && fieldLetters[end] !== null) end++;
    const run = fieldLetters.slice(start, end).join('');
    if (words.includes(run)) return { word: run, start };
    start = end;
  }
  return null;
}

export function createWordWatcher(words) {
  let current = null;
  return {
    update(fieldLetters) {
      const match = findWord(fieldLetters, words);
      const key = match ? `${match.word}@${match.start}` : null;
      const formed = key !== null && key !== current;
      current = key;
      return formed ? match.word : null;
    },
  };
}

export function pickSnapField({ x, y, speed }, fieldRects, occupied, floorY) {
  if (speed > SNAP_MAX_SPEED) return -1;
  const index = fieldRects.findIndex((rect) => x >= rect.x && x < rect.x + rect.w);
  if (index < 0 || occupied[index]) return -1;
  const rect = fieldRects[index];
  const top = floorY - SNAP_CAPTURE_HEIGHT * rect.h;
  const bottom = floorY + rect.h;
  return y >= top && y <= bottom ? index : -1;
}

export function createKonamiDetector() {
  let history = [];
  let completedAt = null;
  let tailProgress = 0;

  function reset() {
    history = [];
    completedAt = null;
    tailProgress = 0;
  }

  return {
    pushDirection(dir, now) {
      history = [...history, dir].slice(-KONAMI_SEQUENCE.length);
      tailProgress = 0;
      completedAt = history.join() === KONAMI_SEQUENCE.join() ? now : null;
    },
    pushTap(letter, now) {
      if (completedAt === null) return false;
      if (now - completedAt > KONAMI_TIMEOUT_MS || letter !== KONAMI_TAIL[tailProgress]) {
        reset();
        return false;
      }
      tailProgress++;
      if (tailProgress < KONAMI_TAIL.length) return false;
      reset();
      return true;
    },
    reset,
  };
}

export function swipeDirection(dx, dy, minDistance = 30) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
