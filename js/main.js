import { FIELD_PREMIUMS } from './config.js';
import { computeLayout, clampDelta } from './layout.js';
import { createPhysics } from './physics.js';
import { createRenderer } from './render.js';

const canvas = document.getElementById('tiles');
const fieldsEl = document.getElementById('fields');
const floorEl = document.getElementById('floor');

let layout = computeLayout(window.innerWidth, window.innerHeight);
let physics = null;
let renderer = null;
let fieldEls = [];
let lastFrame = performance.now();

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
}

function start() {
  drawFields();
  renderer = createRenderer(canvas, layout);
  physics = createPhysics(layout, {}, canvas);
  requestAnimationFrame(frame);
}

function frame(now) {
  const delta = clampDelta(now - lastFrame);
  lastFrame = now;
  if (!layout.portrait) {
    physics.step(delta);
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
