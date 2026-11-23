import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStaggerDelay,
  getPageTransitionVariants,
  MOTION_DURATION,
  MOTION_EASE,
  shouldUseOpacityOnlyTransition,
} from './tokens';

test('computeStaggerDelay caps cumulative stagger cleanly', () => {
  assert.equal(computeStaggerDelay(0), 0);
  assert.equal(computeStaggerDelay(-3), 0);
  assert.ok(computeStaggerDelay(2) > 0 && computeStaggerDelay(2) < 0.12);
  assert.equal(computeStaggerDelay(50), 0.28);
});

test('shouldUseOpacityOnlyTransition protects 3D WebGL globe and physical paper journal', () => {
  assert.equal(shouldUseOpacityOnlyTransition('world-explorer'), true);
  assert.equal(shouldUseOpacityOnlyTransition('paper-journal'), true);
  assert.equal(shouldUseOpacityOnlyTransition('dashboard'), false);
  assert.equal(shouldUseOpacityOnlyTransition('universities'), false);
});

test('MOTION_DURATION enforces fluid, unhurried deceleration timing budgets', () => {
  assert.ok(MOTION_DURATION.micro >= 0.18 && MOTION_DURATION.micro <= 0.25);
  assert.ok(MOTION_DURATION.buttonHover >= 0.25 && MOTION_DURATION.buttonHover <= 0.35);
  assert.ok(MOTION_DURATION.glassLight >= 0.35 && MOTION_DURATION.glassLight <= 0.5);
  assert.ok(MOTION_DURATION.cardHover >= 0.3 && MOTION_DURATION.cardHover <= 0.45);
  assert.ok(MOTION_DURATION.panelOpen >= 0.45 && MOTION_DURATION.panelOpen <= 0.6);
  assert.ok(MOTION_DURATION.modal >= 0.35 && MOTION_DURATION.modal <= 0.5);
  assert.ok(MOTION_DURATION.sidebar >= 0.4 && MOTION_DURATION.sidebar <= 0.55);
  assert.ok(MOTION_DURATION.pageEnter >= 0.4 && MOTION_DURATION.pageEnter <= 0.65);
  assert.deepEqual(MOTION_EASE, [0.22, 1, 0.36, 1]);
});

test('getPageTransitionVariants avoids CSS transforms on protected sections', () => {
  const globeVariants = getPageTransitionVariants('world-explorer');
  assert.equal('y' in globeVariants.initial, false);
  assert.equal('y' in globeVariants.animate, false);
  assert.equal('y' in globeVariants.exit, false);

  const dashVariants = getPageTransitionVariants('dashboard');
  assert.equal('y' in dashVariants.initial, true);
});
