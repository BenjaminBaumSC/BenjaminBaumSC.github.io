import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idleStage } from '../js/idle-stage.js';

test('idleStage stays quiet during the first ten seconds', () => {
  assert.equal(idleStage(0), 0);
  assert.equal(idleStage(9999), 0);
});

test('idleStage escalates at 10, 25 and 45 seconds', () => {
  assert.equal(idleStage(10000), 1);
  assert.equal(idleStage(24999), 1);
  assert.equal(idleStage(25000), 2);
  assert.equal(idleStage(44999), 2);
  assert.equal(idleStage(45000), 3);
  assert.equal(idleStage(600000), 3);
});
