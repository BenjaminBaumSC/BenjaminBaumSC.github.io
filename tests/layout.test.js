import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout, isOutside, createStepper, shiftForResize, heartPoints } from '../js/layout.js';

test('computeLayout caps fields at 64 px on a large desktop', () => {
  const layout = computeLayout(1920, 1080);
  assert.equal(layout.fieldSize, 64);
  assert.equal(layout.fieldRects.length, 15);
  assert.equal(layout.portrait, false);
});

test('computeLayout centers the field row', () => {
  const layout = computeLayout(1920, 1080);
  const first = layout.fieldRects[0];
  const last = layout.fieldRects.at(-1);
  assert.ok(Math.abs(first.x - (1920 - (last.x + last.w))) <= 1);
});

test('computeLayout fits a landscape phone', () => {
  const layout = computeLayout(812, 375);
  assert.ok(layout.fieldSize >= 48);
  for (const rect of layout.fieldRects) {
    assert.ok(rect.x >= 0 && rect.x + rect.w <= 812);
  }
  assert.ok(layout.floorY < 375);
  assert.ok(layout.rowY > 40);
  assert.ok(layout.hitSize >= 40);
});

test('computeLayout flags portrait viewports', () => {
  assert.equal(computeLayout(375, 812).portrait, true);
});

test('computeLayout lays fields left to right without overlap', () => {
  const { fieldRects } = computeLayout(1280, 720);
  for (let i = 0; i < fieldRects.length - 1; i++) {
    assert.ok(fieldRects[i + 1].x >= fieldRects[i].x + fieldRects[i].w);
  }
});

test('computeLayout hangs the field row above the floor with room for a tile', () => {
  const layout = computeLayout(1280, 720);
  assert.ok(layout.fieldRects.every((rect) => rect.y === layout.rowY));
  assert.ok(layout.rowY + layout.fieldSize <= layout.floorY - layout.tileSize);
});

test('isOutside detects positions that left the scene', () => {
  const layout = computeLayout(1280, 720);
  assert.equal(isOutside(640, 360, layout), false);
  assert.equal(isOutside(-10, 360, layout), true);
  assert.equal(isOutside(640, 730, layout), true);
  assert.equal(isOutside(640, -730, layout), true);
  assert.equal(isOutside(640, -50, layout), false);
});

test('createStepper runs two fixed steps for a 30 fps frame', () => {
  const stepper = createStepper(1000 / 60, 6);
  assert.equal(stepper.advance(1000 / 30), 2);
});

test('createStepper carries leftover time into the next frame', () => {
  const stepper = createStepper(1000 / 60, 6);
  assert.equal(stepper.advance(8), 0);
  assert.equal(stepper.advance(9), 1);
});

test('createStepper caps a long pause and drops the backlog', () => {
  const stepper = createStepper(1000 / 60, 6);
  assert.equal(stepper.advance(5000), 6);
  assert.equal(stepper.advance(8), 0);
});

test('createStepper ignores negative frame times', () => {
  const stepper = createStepper(1000 / 60, 6);
  assert.equal(stepper.advance(-20), 0);
  assert.equal(stepper.advance(1000 / 60), 1);
});

test('computeLayout treats a square viewport as portrait like CSS does', () => {
  assert.equal(computeLayout(600, 600).portrait, true);
});

test('shiftForResize keeps a resting tile on the moved floor', () => {
  const before = computeLayout(1280, 720);
  const after = computeLayout(1280, 660);
  const resting = { x: 400, y: before.floorY - before.tileSize / 2 };
  const shifted = shiftForResize(resting, before, after);
  assert.equal(shifted.x, 400);
  assert.equal(shifted.y, after.floorY - before.tileSize / 2);
});

test('shiftForResize pulls a tile back inside a narrower viewport', () => {
  const before = computeLayout(1280, 720);
  const after = computeLayout(900, 720);
  const shifted = shiftForResize({ x: 1250, y: 300 }, before, after);
  assert.ok(shifted.x <= 900 - after.tileSize / 2);
});

test('computeLayout hangs the bag mouth centered above the rack and inside the view', () => {
  for (const [w, h] of [[1920, 1080], [1200, 763], [812, 375], [572, 343]]) {
    const layout = computeLayout(w, h);
    assert.equal(layout.bagX, w / 2);
    assert.ok(layout.bagY < layout.rowY, `${w}x${h} mouth above rack`);
    assert.ok(layout.bagY - layout.bagSize * 0.8 >= 0, `${w}x${h} bag fully visible`);
  }
});

test('heartPoints returns the requested number of points', () => {
  assert.equal(heartPoints(12, 60).length, 12);
  assert.equal(heartPoints(22, 60).length, 22);
});

test('heartPoints spaces neighbours evenly along the outline', () => {
  const points = heartPoints(17, 60);
  const gaps = points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
  for (const gap of gaps) assert.ok(gap > 60 * 0.75 && gap < 60 * 1.25, `gap ${gap}`);
});

test('heartPoints is centered and mirror symmetric', () => {
  const points = heartPoints(16, 50);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  assert.ok(Math.abs(Math.max(...xs) + Math.min(...xs)) < 1);
  assert.ok(Math.abs(Math.max(...ys) + Math.min(...ys)) < 1);
  for (const p of points) {
    assert.ok(points.some((q) => Math.hypot(q.x + p.x, q.y - p.y) < 50 * 0.6), 'mirror point exists');
  }
});

test('heartPoints puts the tip at the bottom', () => {
  const points = heartPoints(12, 50);
  const lowest = points.reduce((a, b) => (b.y > a.y ? b : a));
  assert.ok(Math.abs(lowest.x) < 50 * 0.6);
});
