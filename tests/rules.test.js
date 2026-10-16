import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELD_COUNT,
  SECRET_WORDS,
  KONAMI_SEQUENCE,
  KONAMI_TIMEOUT_MS,
  SNAP_MAX_POINTER_SPEED,
  SNAP_TOLERANCE,
} from '../js/config.js';
import {
  findWord,
  createWordWatcher,
  pickSnapField,
  createKonamiDetector,
  swipeDirection,
  fieldLetters,
  createRewardGate,
} from '../js/rules.js';

function row(letters, start = 0) {
  const fields = Array(FIELD_COUNT).fill(null);
  [...letters].forEach((letter, i) => {
    fields[start + i] = letter === '_' ? null : letter;
  });
  return fields;
}

test('findWord finds a bounded word in the middle of the row', () => {
  assert.deepEqual(findWord(row('BENNI', 1), SECRET_WORDS), { word: 'BENNI', start: 1 });
});

test('findWord finds words touching either edge of the row', () => {
  assert.deepEqual(findWord(row('NINJA', 0), SECRET_WORDS), { word: 'NINJA', start: 0 });
  assert.deepEqual(findWord(row('BENNI', 10), SECRET_WORDS), { word: 'BENNI', start: 10 });
});

test('findWord ignores a word with an extra adjacent letter', () => {
  assert.equal(findWord(row('BENNIA', 0), SECRET_WORDS), null);
});

test('findWord ignores a word interrupted by a gap', () => {
  assert.equal(findWord(row('BEN_NI', 0), SECRET_WORDS), null);
});

test('findWord returns null for an empty row', () => {
  assert.equal(findWord(row(''), SECRET_WORDS), null);
});

test('createWordWatcher reports a word only when it is formed', () => {
  const watcher = createWordWatcher(SECRET_WORDS);
  const formed = row('BENNI', 2);
  assert.equal(watcher.update(formed), 'BENNI');
  assert.equal(watcher.update([...formed]), null);
  assert.equal(watcher.update(row('BENN', 2)), null);
  assert.equal(watcher.update(row('BENNI', 2)), 'BENNI');
});

const FIELD = 50;
const ROW_Y = 200;
const fieldRects = Array.from({ length: FIELD_COUNT }, (_, i) => ({ x: 100 + i * FIELD, y: ROW_Y, w: FIELD, h: FIELD }));
const free = Array(FIELD_COUNT).fill(false);
const field2Center = { x: 100 + 2 * FIELD + FIELD / 2, y: ROW_Y + FIELD / 2 };

test('pickSnapField picks the free field under a slow pointer', () => {
  assert.equal(pickSnapField({ ...field2Center, speed: 0 }, fieldRects, free), 2);
});

test('pickSnapField tolerates a pointer slightly outside the field', () => {
  const y = ROW_Y - SNAP_TOLERANCE * FIELD * 0.9;
  assert.equal(pickSnapField({ x: field2Center.x, y, speed: 0 }, fieldRects, free), 2);
});

test('pickSnapField rejects a pointer that moves fast at release', () => {
  assert.equal(pickSnapField({ ...field2Center, speed: SNAP_MAX_POINTER_SPEED + 0.01 }, fieldRects, free), -1);
});

test('pickSnapField rejects an occupied field', () => {
  const occupied = free.map((_, i) => i === 2);
  assert.equal(pickSnapField({ ...field2Center, speed: 0 }, fieldRects, occupied), -1);
});

test('pickSnapField rejects a pointer beside the row', () => {
  assert.equal(pickSnapField({ x: 50, y: field2Center.y, speed: 0 }, fieldRects, free), -1);
});

test('pickSnapField rejects a pointer far above or below the row', () => {
  assert.equal(pickSnapField({ x: field2Center.x, y: ROW_Y - FIELD, speed: 0 }, fieldRects, free), -1);
  assert.equal(pickSnapField({ x: field2Center.x, y: ROW_Y + 2 * FIELD, speed: 0 }, fieldRects, free), -1);
});

function enterSequence(konami, sequence, now) {
  sequence.forEach((dir) => konami.pushDirection(dir, now));
}

test('createKonamiDetector completes on the sequence followed by B and A', () => {
  const konami = createKonamiDetector();
  enterSequence(konami, KONAMI_SEQUENCE, 1000);
  assert.equal(konami.pushTap('B', 1100), false);
  assert.equal(konami.pushTap('A', 1200), true);
});

test('createKonamiDetector tolerates an extra leading up', () => {
  const konami = createKonamiDetector();
  enterSequence(konami, ['up', ...KONAMI_SEQUENCE], 1000);
  konami.pushTap('B', 1100);
  assert.equal(konami.pushTap('A', 1200), true);
});

test('createKonamiDetector rejects A before B', () => {
  const konami = createKonamiDetector();
  enterSequence(konami, KONAMI_SEQUENCE, 1000);
  assert.equal(konami.pushTap('A', 1100), false);
  assert.equal(konami.pushTap('B', 1200), false);
});

test('createKonamiDetector rejects taps after the timeout', () => {
  const konami = createKonamiDetector();
  enterSequence(konami, KONAMI_SEQUENCE, 1000);
  konami.pushTap('B', 1000 + KONAMI_TIMEOUT_MS + 1);
  assert.equal(konami.pushTap('A', 1000 + KONAMI_TIMEOUT_MS + 2), false);
});

test('createKonamiDetector forgets partial input after reset', () => {
  const konami = createKonamiDetector();
  enterSequence(konami, KONAMI_SEQUENCE.slice(0, 4), 1000);
  konami.reset();
  enterSequence(konami, KONAMI_SEQUENCE.slice(4), 1000);
  konami.pushTap('B', 1100);
  assert.equal(konami.pushTap('A', 1200), false);
});

test('swipeDirection maps dominant axis to a direction', () => {
  assert.equal(swipeDirection(0, -80), 'up');
  assert.equal(swipeDirection(90, 10), 'right');
  assert.equal(swipeDirection(10, 10), null);
});

test('fieldLetters maps snapped tiles onto their fields', () => {
  const letters = fieldLetters([{ letter: 'B', snappedField: 2 }, { letter: 'E', snappedField: null }], 15);
  assert.equal(letters.length, 15);
  assert.equal(letters[2], 'B');
  assert.equal(letters.filter((l) => l !== null).length, 1);
});

test('createRewardGate lets only one reward run at a time', () => {
  const gate = createRewardGate();
  assert.equal(gate.tryStart(), true);
  assert.equal(gate.active, true);
  assert.equal(gate.tryStart(), false);
  gate.finish();
  assert.equal(gate.active, false);
  assert.equal(gate.tryStart(), true);
});
