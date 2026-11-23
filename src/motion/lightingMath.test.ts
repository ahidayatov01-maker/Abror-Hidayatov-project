import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampPercent,
  classifyGlassPerfTier,
  computeExpSmoothingFactor,
  stepLightingVector,
} from './lightingMath';

test('clampPercent bounds coordinates cleanly within [0, 100]', () => {
  assert.equal(clampPercent(-12), 0);
  assert.equal(clampPercent(145), 100);
  assert.equal(clampPercent(48.5), 48.5);
  assert.equal(clampPercent(Number.NaN), 0);
});

test('computeExpSmoothingFactor scales proportionally across 60Hz and 120Hz frame times', () => {
  const factor120 = computeExpSmoothingFactor(8.33, 10.5);
  const factor60 = computeExpSmoothingFactor(16.67, 10.5);
  assert.ok(factor120 > 0 && factor120 < factor60);
  // Two 8.33ms steps should match one 16.67ms exponential step: 1 - (1 - f120)^2 == f60
  const twoHalfSteps = 1 - Math.pow(1 - factor120, 2);
  assert.ok(Math.abs(twoHalfSteps - factor60) < 0.005);
});

test('stepLightingVector interpolates smoothly and settles cleanly to rest', () => {
  let state = { x: 20, y: 20, opacity: 0.2 };
  const target = { x: 80, y: 60, opacity: 1.0 };

  const first = stepLightingVector(state, target, 16.67, 10.5);
  assert.equal(first.settled, false);
  assert.ok(first.next.x > 20 && first.next.x < 80);
  assert.ok(first.next.opacity > 0.2 && first.next.opacity < 1.0);

  state = first.next;
  let steps = 1;
  let settled = false;
  while (!settled && steps < 120) {
    const res = stepLightingVector(state, target, 16.67, 10.5);
    state = res.next;
    settled = res.settled;
    steps += 1;
  }

  assert.equal(settled, true);
  assert.equal(state.x, 80);
  assert.equal(state.y, 60);
  assert.equal(state.opacity, 1);
});

test('classifyGlassPerfTier adapts cleanly to reduced motion, touch, and constrained hardware', () => {
  assert.equal(
    classifyGlassPerfTier({
      prefersReducedMotion: true,
      hasCoarsePointer: false,
      canHover: true,
      deviceMemoryGb: 16,
      hardwareConcurrency: 12,
    }),
    'reduced'
  );
  assert.equal(
    classifyGlassPerfTier({
      prefersReducedMotion: false,
      hasCoarsePointer: true,
      canHover: false,
      deviceMemoryGb: 8,
      hardwareConcurrency: 8,
    }),
    'balanced'
  );
  assert.equal(
    classifyGlassPerfTier({
      prefersReducedMotion: false,
      hasCoarsePointer: false,
      canHover: true,
      deviceMemoryGb: 2,
      hardwareConcurrency: 8,
    }),
    'balanced'
  );
  assert.equal(
    classifyGlassPerfTier({
      prefersReducedMotion: false,
      hasCoarsePointer: false,
      canHover: true,
      deviceMemoryGb: 8,
      hardwareConcurrency: 8,
    }),
    'high'
  );
});
