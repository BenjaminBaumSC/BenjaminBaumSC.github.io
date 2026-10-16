import { FIELD_COUNT, FIELD_PREMIUMS, SECRET_WORDS } from './config.js';
import { computeLayout, clampDelta } from './layout.js';
import { createWordWatcher, fieldLetters, findWord, pickSnapField } from './rules.js';
import { createPhysics } from './physics.js';
import { createRenderer } from './render.js';
import { glowFields, showComicWord, showImpact } from './fx.js';
import * as hello from './rewards/hello.js';
import * as ninja from './rewards/ninja.js';

const canvas = document.getElementById('tiles');
const fieldsEl = document.getElementById('fields');
const floorEl = document.getElementById('floor');
const fxEl = document.getElementById('fx');
const rewardEl = document.getElementById('reward');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let layout = computeLayout(window.innerWidth, window.innerHeight);
let physics = null;
let renderer = null;
let fieldEls = [];
let lastFrame = performance.now();
let paused = false;
const REWARDS = { BENNI: hello, NINJA: ninja };
const wordWatcher = createWordWatcher(SECRET_WORDS);

function drawFields() {
  fieldsEl.replaceChildren();
  fieldEls = layout.fieldRects.map((rect, i) => {
    const el = document.createElement('div');
    el.className = `field ${FIELD_PREMIUMS[i]?.toLowerCase() ?? ''}`;
    Object.assign(el.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` });
    fieldsEl.append(el);
    return el;
  });
  floorEl.style.top = `${layout.floorY}px`;
  fxEl.style.setProperty('--comic-size', `${Math.round(layout.tileSize * 0.8)}px`);
}

function currentLetters() {
  return fieldLetters(physics.tileStates(), FIELD_COUNT);
}

async function playReward(name, match) {
  physics.setInputEnabled(false);
  try {
    await REWARDS[name].play({
      layer: rewardEl,
      physics,
      reducedMotion,
      match,
      setPaused: (value) => {
        paused = value;
      },
    });
  } finally {
    paused = false;
    physics.setInputEnabled(true);
    checkWords();
  }
}

function checkWords() {
  const letters = currentLetters();
  const word = wordWatcher.update(letters);
  if (!word) return;
  const match = findWord(letters, SECRET_WORDS);
  const indices = Array.from({ length: match.word.length }, (_, i) => match.start + i);
  glowFields(fieldEls, indices).then(() => playReward(word, match));
}

function onGrab(tileId) {
  const tile = physics.tileStates()[tileId];
  if (tile.snappedField === null) return;
  physics.unsnap(tileId);
  showComicWord(fxEl, 'PLOPP!', tile.x, tile.y - layout.tileSize * 0.6, { reducedMotion });
  checkWords();
}

function onRelease(tileId, release) {
  const occupied = currentLetters().map((letter) => letter !== null);
  const field = pickSnapField(release, layout.fieldRects, occupied);
  if (field < 0) return;
  physics.snap(tileId, field);
  renderer.squash(tileId);
  const rect = layout.fieldRects[field];
  const x = rect.x + rect.w / 2;
  showImpact(fxEl, x, rect.y + rect.h / 2, layout.tileSize * 2.2);
  showComicWord(fxEl, 'KLACK!', x, rect.y - layout.tileSize * 0.3, { reducedMotion });
  checkWords();
}

function start() {
  drawFields();
  renderer = createRenderer(canvas, layout);
  physics = createPhysics(layout, { onGrab, onRelease }, canvas);
  requestAnimationFrame(frame);
}

function frame(now) {
  const delta = clampDelta(now - lastFrame);
  lastFrame = now;
  if (!layout.portrait) {
    if (!paused) physics.step(delta);
    renderer.sync(physics.tileStates());
  }
  requestAnimationFrame(frame);
}

function onResize() {
  layout = computeLayout(window.innerWidth, window.innerHeight);
  if (layout.portrait) return;
  if (!physics) {
    start();
    return;
  }
  drawFields();
  physics.relayout(layout);
  renderer.resize(layout);
}

window.addEventListener('resize', onResize);
if (!layout.portrait) start();
