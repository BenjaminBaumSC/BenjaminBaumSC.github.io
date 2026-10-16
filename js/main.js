import { EXTRA_TILES, FIELD_COUNT, FIELD_PREMIUMS, POINTS, SECRET_WORDS, TILES } from './config.js';
import { computeLayout, createStepper } from './layout.js';
import { createKonamiDetector, createRewardGate, createWordWatcher, fieldLetters, pickSnapField, scoreRow, swipeDirection } from './rules.js';
import { createPhysics } from './physics.js';
import { createRenderer } from './render.js';
import { glowFields, showComicWord, showImpact } from './fx.js';
import * as hello from './rewards/hello.js';
import * as ninja from './rewards/ninja.js';
import * as cake from './rewards/cake.js';
import * as approved from './rewards/approved.js';
import * as mini from './rewards/mini.js';
import * as codumo from './rewards/codumo.js';
import * as bitu from './rewards/bitu.js';
import * as ben32 from './rewards/ben32.js';

const canvas = document.getElementById('tiles');
const fieldsEl = document.getElementById('fields');
const floorEl = document.getElementById('floor');
const fxEl = document.getElementById('fx');
const rewardEl = document.getElementById('reward');
const scoreEl = document.getElementById('score');
const revEl = document.getElementById('rev');
const restartEl = document.getElementById('restart');
const REV_DRAFT = 'REV: 0.1 · BL. 1/1';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let layout = computeLayout(window.innerWidth, window.innerHeight);
let physics = null;
let renderer = null;
let fieldEls = [];
let lastFrame = performance.now();
const STEP_MS = 1000 / 60;
const stepper = createStepper(STEP_MS, 6);
let paused = false;
const rewardGate = createRewardGate();
const REWARDS = { BENNI: hello, NINJA: ninja, KONAMI: cake, 'BENJAMIN BAUM': approved, MINI: mini, CODUMO: codumo, BITU84: bitu, BEN32: ben32 };
const NAME = 'BENJAMIN BAUM';
const REV_APPROVED = 'REV: 1.0 · FREIGEGEBEN';
let unlocked = false;
const ARROWS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
let wordWatcher = createWordWatcher(SECRET_WORDS);
const konami = createKonamiDetector();

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
  for (const el of [fxEl, rewardEl]) el.style.setProperty('--comic-size', `${Math.round(layout.tileSize * 0.8)}px`);
}

function currentLetters() {
  return fieldLetters(physics.tileStates(), FIELD_COUNT);
}

async function playReward(name, match) {
  if (!rewardGate.tryStart()) return;
  // Lock input before the glow so the row cannot change under the reward.
  physics.setInputEnabled(false);
  try {
    if (match) await glowFields(fieldEls, Array.from({ length: match.word.length }, (_, i) => match.start + i));
    await REWARDS[name].play({
      layer: rewardEl,
      physics,
      reducedMotion,
      match,
      setPaused: (value) => {
        paused = value;
      },
      layout,
      // Reward comics sit in the reward layer so overlays do not hide them.
      comic: (text, x, y) => showComicWord(rewardEl, text, x, y, { reducedMotion }),
    });
    if (name === NAME) approveDrawing();
  } finally {
    paused = false;
    rewardGate.finish();
    konami.reset();
    physics.setInputEnabled(true);
    checkWords();
  }
}

function updateScore() {
  const score = String(scoreRow(currentLetters(), FIELD_PREMIUMS, POINTS));
  if (scoreEl.textContent === score) return;
  scoreEl.textContent = score;
  scoreEl.classList.remove('bump');
  // Restart the bump animation on consecutive changes.
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');
}

function approveDrawing() {
  revEl.textContent = REV_APPROVED;
  if (unlocked) return;
  unlocked = true;
  physics.addTiles(EXTRA_TILES);
}

function restart() {
  if (!physics || rewardGate.active) return;
  physics.reset(TILES);
  unlocked = false;
  wordWatcher = createWordWatcher(SECRET_WORDS);
  konami.reset();
  revEl.textContent = REV_DRAFT;
  updateScore();
}

restartEl.addEventListener('click', restart);

function checkWords() {
  updateScore();
  const [match] = wordWatcher.update(currentLetters());
  if (match && REWARDS[match.word]) playReward(match.word, match);
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

function onTap(tileId) {
  const { letter } = physics.tileStates()[tileId];
  if (konami.pushTap(letter, performance.now())) playReward('KONAMI');
}

function onBackgroundGesture(dx, dy) {
  const direction = swipeDirection(dx, dy);
  if (direction) konami.pushDirection(direction, performance.now());
}

window.addEventListener('keydown', (event) => {
  const direction = ARROWS[event.key];
  if (!direction) return;
  event.preventDefault();
  if (!rewardGate.active) konami.pushDirection(direction, performance.now());
});

function start() {
  drawFields();
  renderer = createRenderer(canvas, layout);
  physics = createPhysics(layout, { onGrab, onRelease, onTap, onBackgroundGesture }, canvas);
  if (reducedMotion) physics.settle();
  requestAnimationFrame(frame);
}

function frame(now) {
  const steps = stepper.advance(now - lastFrame);
  lastFrame = now;
  if (!layout.portrait) {
    if (!paused) for (let i = 0; i < steps; i++) physics.step(STEP_MS);
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
