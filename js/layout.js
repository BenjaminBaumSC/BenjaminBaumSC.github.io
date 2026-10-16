import { FIELD_COUNT, MAX_FIELD_SIZE, MIN_HIT_SIZE } from './config.js';

const GUTTER = 16;
// Room below the field row for the drawing's title block.
const TITLE_BLOCK_SPACE = 82;
// Distance from the floor to the top of the field row, in field sizes.
const ROW_LIFT = 3.2;

export function computeLayout(width, height) {
  const fieldSize = Math.min(MAX_FIELD_SIZE, Math.floor((width - 2 * GUTTER) / FIELD_COUNT));
  const tileSize = Math.round(fieldSize * 0.9);
  const floorY = height - TITLE_BLOCK_SPACE;
  // The row hangs above the floor so loose tiles never rest on it.
  const rowY = floorY - fieldSize * ROW_LIFT;
  const rowX = (width - FIELD_COUNT * fieldSize) / 2;
  const fieldRects = Array.from({ length: FIELD_COUNT }, (_, i) => ({
    x: rowX + i * fieldSize,
    y: rowY,
    w: fieldSize,
    h: fieldSize,
  }));
  return {
    width,
    height,
    portrait: height >= width,
    fieldSize,
    tileSize,
    hitSize: Math.max(tileSize, MIN_HIT_SIZE),
    floorY,
    rowY,
    fieldRects,
  };
}

export function isOutside(x, y, layout) {
  return x < 0 || x > layout.width || y > layout.height || y < -layout.height;
}

// Fixed-size physics steps keep real-time speed at any frame rate without
// large steps that would let tiles tunnel through the floor.
export function createStepper(stepMs, maxSteps) {
  let pending = 0;
  return {
    advance(deltaMs) {
      pending = Math.min(pending + Math.max(deltaMs, 0), stepMs * maxSteps);
      const steps = Math.floor(pending / stepMs + 1e-9);
      pending = Math.max(pending - steps * stepMs, 0);
      return steps;
    },
  };
}

export function shiftForResize({ x, y }, before, after) {
  const half = after.tileSize / 2;
  return {
    x: Math.min(Math.max(x, half), after.width - half),
    y: y + (after.floorY - before.floorY),
  };
}
