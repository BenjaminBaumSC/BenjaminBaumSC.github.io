import { FIELD_COUNT, MAX_FIELD_SIZE, MIN_HIT_SIZE } from './config.js';

const GUTTER = 16;
// Room below the field row for the drawing's title block.
const TITLE_BLOCK_SPACE = 60;

export function computeLayout(width, height) {
  const fieldSize = Math.min(MAX_FIELD_SIZE, Math.floor((width - 2 * GUTTER) / FIELD_COUNT));
  const tileSize = Math.round(fieldSize * 0.9);
  const floorY = height - TITLE_BLOCK_SPACE - fieldSize;
  const rowX = (width - FIELD_COUNT * fieldSize) / 2;
  const fieldRects = Array.from({ length: FIELD_COUNT }, (_, i) => ({
    x: rowX + i * fieldSize,
    y: floorY,
    w: fieldSize,
    h: fieldSize,
  }));
  return {
    width,
    height,
    portrait: height > width,
    fieldSize,
    tileSize,
    hitSize: Math.max(tileSize, MIN_HIT_SIZE),
    floorY,
    fieldRects,
  };
}

export function isOutside(x, y, layout) {
  return x < 0 || x > layout.width || y > layout.height || y < -layout.height;
}

export function clampDelta(ms) {
  return Math.min(Math.max(ms, 0), 1000 / 60);
}
