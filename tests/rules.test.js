import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELD_COUNT,
  FIELD_PREMIUMS,
  POINTS,
  SECRET_WORDS,
  KONAMI_SEQUENCE,
  KONAMI_TIMEOUT_MS,
  SNAP_MAX_POINTER_SPEED,
  SNAP_TOLERANCE,
} from '../js/config.js';
import {
  findWords,
  scoreRow,
  createWordWatcher,
  pickSnapField,
  createKonamiDetector,
  swipeDirection,
  fieldLetters,
  createRewardGate,
  shuffle,
} from '../js/rules.js';

function row(letters, start = 0) {
  const fields = Array(FIELD_COUNT).fill(null);
  [...letters].forEach((letter, i) => {
    fields[start + i] = letter === '_' ? null : letter;
  });
  return fields;
}

const words = (matches) => matches.map((m) => `${m.word}@${m.start}`);

test('findWords finds a bounded word in the middle of the row', () => {
  assert.deepEqual(words(findWords(row('BENNI', 1), SECRET_WORDS)), ['BENNI@1']);
});

test('findWords finds words touching either edge of the row', () => {
  assert.deepEqual(words(findWords(row('NINJA', 0), SECRET_WORDS)), ['NINJA@0']);
  assert.deepEqual(words(findWords(row('BENNI', 10), SECRET_WORDS)), ['BENNI@10']);
});

test('findWords ignores a word with an extra adjacent letter', () => {
  assert.deepEqual(findWords(row('BENNIA', 0), SECRET_WORDS), []);
});

test('findWords ignores a word interrupted by a gap', () => {
  assert.deepEqual(findWords(row('BEN_NI', 0), SECRET_WORDS), []);
});

test('findWords returns nothing for an empty row', () => {
  assert.deepEqual(findWords(row(''), SECRET_WORDS), []);
});

test('findWords reads a space as exactly one empty field', () => {
  assert.deepEqual(words(findWords(row('BENJAMIN_BAUM', 0), SECRET_WORDS)), ['BENJAMIN BAUM@0']);
  assert.deepEqual(words(findWords(row('BENJAMIN_BAUM', 2), SECRET_WORDS)), ['BENJAMIN BAUM@2']);
});

test('findWords rejects the name with two gaps or an extra letter', () => {
  assert.deepEqual(findWords(row('BENJAMIN__BAUM', 0), SECRET_WORDS), []);
  assert.deepEqual(findWords(row('BENJAMIN_BAUMA', 0), SECRET_WORDS), []);
});

test('findWords reports several words lying at once', () => {
  assert.deepEqual(words(findWords(row('MINI_BEN32', 0), SECRET_WORDS)), ['MINI@0', 'BEN32@5']);
});

test('createWordWatcher reports a word only when it is formed', () => {
  const watcher = createWordWatcher(SECRET_WORDS);
  const formed = row('BENNI', 2);
  assert.deepEqual(words(watcher.update(formed)), ['BENNI@2']);
  assert.deepEqual(watcher.update([...formed]), []);
  assert.deepEqual(watcher.update(row('BENN', 2)), []);
  assert.deepEqual(words(watcher.update(row('BENNI', 2))), ['BENNI@2']);
});

test('createWordWatcher reports only the newly formed word next to an old one', () => {
  const watcher = createWordWatcher(SECRET_WORDS);
  watcher.update(row('MINI', 0));
  assert.deepEqual(words(watcher.update(row('MINI_BEN32', 0))), ['BEN32@5']);
});

test('scoreRow counts a plain letter by its points', () => {
  assert.equal(scoreRow(row('B', 1), FIELD_PREMIUMS, POINTS), 3);
});

test('scoreRow doubles a letter on a double letter field', () => {
  assert.equal(scoreRow(row('B', 3), FIELD_PREMIUMS, POINTS), 6);
});

test('scoreRow triples a word touching a triple word field', () => {
  assert.equal(scoreRow(row('BEN', 0), FIELD_PREMIUMS, POINTS), 15);
});

test('scoreRow multiplies by nine for two triple word fields and sums words', () => {
  // BENJAMIN on 0-7: 17 points plus J doubled on DL 3, times 9 for TW 0 and TW 7.
  // BAUM on 9-12 has U on DL 11: 3+1+2+3.
  assert.equal(scoreRow(row('BENJAMIN_BAUM', 0), FIELD_PREMIUMS, POINTS), (17 + 6) * 9 + 9);
});

test('scoreRow counts digits by their face value', () => {
  assert.equal(scoreRow(row('8', 1), FIELD_PREMIUMS, POINTS), 8);
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

test('shuffle returns every item once in a new order', () => {
  const values = [0.9, 0.1, 0.5, 0.3, 0.7];
  let i = 0;
  const shuffled = shuffle([1, 2, 3, 4, 5], () => values[i++ % values.length]);
  assert.deepEqual([...shuffled].sort(), [1, 2, 3, 4, 5]);
  assert.notDeepEqual(shuffled, [1, 2, 3, 4, 5]);
});

test('shuffle leaves the input untouched', () => {
  const input = [1, 2, 3];
  shuffle(input, () => 0);
  assert.deepEqual(input, [1, 2, 3]);
});
