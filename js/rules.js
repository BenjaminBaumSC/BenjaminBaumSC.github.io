import {
  KONAMI_SEQUENCE,
  KONAMI_TAIL,
  KONAMI_TIMEOUT_MS,
  SNAP_MAX_POINTER_SPEED,
  SNAP_TOLERANCE,
} from './config.js';

// A space in a word stands for exactly one empty field.
export function findWords(fieldLetters, words) {
  const row = `.${fieldLetters.map((letter) => letter ?? '.').join('')}.`;
  const matches = [];
  for (const word of words) {
    const pattern = `.${word.replaceAll(' ', '.')}.`;
    for (let i = row.indexOf(pattern); i >= 0; i = row.indexOf(pattern, i + 1)) {
      matches.push({ word, start: i });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

export function createWordWatcher(words) {
  let current = new Set();
  return {
    update(fieldLetters) {
      const matches = findWords(fieldLetters, words);
      const keys = new Set(matches.map((m) => `${m.word}@${m.start}`));
      const formed = matches.filter((m) => !current.has(`${m.word}@${m.start}`));
      current = keys;
      return formed;
    },
  };
}

export function scoreRow(fieldLetters, premiums, points) {
  let total = 0;
  let sum = 0;
  let factor = 1;
  fieldLetters.forEach((letter, i) => {
    if (letter !== null) {
      sum += points[letter] * (premiums[i] === 'DL' ? 2 : 1);
      if (premiums[i] === 'TW') factor *= 3;
    }
    if (letter === null || i === fieldLetters.length - 1) {
      total += sum * factor;
      sum = 0;
      factor = 1;
    }
  });
  return total;
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

export function createRewardGate() {
  let active = false;
  return {
    get active() {
      return active;
    },
    tryStart() {
      if (active) return false;
      active = true;
      return true;
    },
    finish() {
      active = false;
    },
  };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
