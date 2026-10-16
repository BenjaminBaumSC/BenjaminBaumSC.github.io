import {
  KONAMI_SEQUENCE,
  KONAMI_TAIL,
  KONAMI_TIMEOUT_MS,
  SNAP_MAX_POINTER_SPEED,
  SNAP_TOLERANCE,
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

export function pickSnapField({ x, y, speed }, fieldRects, occupied) {
  if (speed > SNAP_MAX_POINTER_SPEED) return -1;
  let best = -1;
  let bestDistance = Infinity;
  fieldRects.forEach((rect, i) => {
    if (occupied[i]) return;
    const margin = SNAP_TOLERANCE * rect.w;
    const inside = x >= rect.x - margin && x <= rect.x + rect.w + margin && y >= rect.y - margin && y <= rect.y + rect.h + margin;
    const distance = Math.hypot(x - (rect.x + rect.w / 2), y - (rect.y + rect.h / 2));
    if (inside && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
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

export function fieldLetters(tileStates, fieldCount) {
  const letters = Array(fieldCount).fill(null);
  for (const tile of tileStates) {
    if (tile.snappedField !== null) letters[tile.snappedField] = tile.letter;
  }
  return letters;
}
