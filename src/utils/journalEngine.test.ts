import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceCrumpleStage,
  buildSmoothStrokePath,
  canTransitionPaperState,
  computeHabitStats,
  createDefaultJournalState,
  eraseStrokesNearPoint,
  generateJaggedTearPath,
  restorePageFromArchive,
  searchJournalContent,
  stepThrowPhysics,
} from './journalEngine';
import type { TornPaperObject } from '../types/journal';

test('paper state transitions reject impossible jumps and allow physical progression', () => {
  assert.equal(canTransitionPaperState('flat', 'bending'), true);
  assert.equal(canTransitionPaperState('bending', 'partially_torn'), true);
  assert.equal(canTransitionPaperState('partially_torn', 'fully_torn'), true);
  assert.equal(canTransitionPaperState('fully_torn', 'crumpled'), true);
  assert.equal(canTransitionPaperState('crumpled', 'flying'), true);
  assert.equal(canTransitionPaperState('flat', 'flying'), false);
  assert.equal(canTransitionPaperState('archived', 'crumpled'), false);
});

test('progressive crumpling advances monotonically and caps at stage 4', () => {
  assert.equal(advanceCrumpleStage(0), 1);
  assert.equal(advanceCrumpleStage(1), 2);
  assert.equal(advanceCrumpleStage(3), 4);
  assert.equal(advanceCrumpleStage(4), 4);
});

test('throw physics moves paper ball, decelerates, and captures into wastebasket', () => {
  const ball: TornPaperObject = {
    id: 't1',
    sourcePageId: 'p1',
    title: 'Draft page',
    snippet: 'Sample note',
    tearKind: 'full-page',
    x: 100,
    y: 200,
    vx: 450,
    vy: -60,
    rotation: 0,
    angularVelocity: 180,
    crumpleStage: 4,
    foldMode: 'none',
    state: 'flying',
    inWastebasket: false,
    createdAt: new Date().toISOString(),
  };

  const bounds = {
    width: 900,
    height: 600,
    wastebasket: { x: 820, y: 510, radius: 55 },
  };

  const stepped = stepThrowPhysics(ball, 0.03, bounds);
  assert.ok(stepped.x > ball.x);
  assert.ok(stepped.vx < ball.vx);
  assert.equal(stepped.state, 'flying');

  const directDrop = stepThrowPhysics(
    { ...ball, x: 825, y: 505, vx: 50, vy: 20 },
    0.016,
    bounds
  );
  assert.equal(directDrop.state, 'archived');
  assert.equal(directDrop.inWastebasket, true);
});

test('jagged tear path produces organic non-flat fiber offsets', () => {
  const pts = generateJaggedTearPath(42, 400, 6, 20);
  assert.equal(pts.length, 21);
  assert.equal(pts[0].offset, 0);
  assert.equal(pts[pts.length - 1].offset, 0);
  const nonZero = pts.some((p) => Math.abs(p.offset) > 0.5);
  assert.equal(nonZero, true);
});

test('freehand smooth path and proximity eraser work cleanly', () => {
  const path = buildSmoothStrokePath(
    [
      { x: 0.1, y: 0.2, pressure: 0.5 },
      { x: 0.2, y: 0.25, pressure: 0.7 },
      { x: 0.3, y: 0.3, pressure: 0.6 },
    ],
    500,
    700
  );
  assert.ok(path.startsWith('M 50.0 140.0'));
  assert.ok(path.includes('Q '));

  const remaining = eraseStrokesNearPoint(
    [
      {
        id: 's1',
        instrument: 'fountain',
        color: '#000',
        baseWidth: 2,
        opacity: 1,
        points: [{ x: 0.5, y: 0.5, pressure: 0.5 }],
      },
      {
        id: 's2',
        instrument: 'fountain',
        color: '#000',
        baseWidth: 2,
        opacity: 1,
        points: [{ x: 0.1, y: 0.1, pressure: 0.5 }],
      },
    ],
    { x: 0.51, y: 0.49 },
    0.04
  );
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, 's2');
});

test('habit analytics computes daily, weekly, monthly, and streaks accurately', () => {
  const state = createDefaultJournalState('2026-11-18');
  const stats = computeHabitStats(state.habits, state.habitLog, '2026-11-18');
  assert.equal(stats.dailyTotal, 5);
  assert.equal(stats.dailyCompleted, 2);
  assert.equal(stats.dailyPercent, 40);
  assert.ok(stats.perHabit['hab-wake'].currentStreak >= 4);
  assert.ok(stats.perHabit['hab-read'].longestStreak >= 5);
});

test('search and archive restoration preserve page content safely', () => {
  const state = createDefaultJournalState('2026-11-18');
  const hits = searchJournalContent(state.pages, state.stickyNotes, 'Tokyo');
  assert.ok(hits.length >= 1);

  const pageId = state.pages[0].id;
  const archivedState = {
    ...state,
    pages: state.pages.map((p) => (p.id === pageId ? { ...p, isTornOut: true, isArchived: true } : p)),
    tornObjects: [
      {
        id: 'torn-1',
        sourcePageId: pageId,
        title: state.pages[0].title,
        snippet: 'Morning Focus',
        tearKind: 'full-page' as const,
        x: 300,
        y: 300,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0,
        crumpleStage: 4 as const,
        foldMode: 'none' as const,
        state: 'archived' as const,
        inWastebasket: true,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const restored = restorePageFromArchive(archivedState, pageId);
  assert.equal(restored.pages[0].isTornOut, false);
  assert.equal(restored.pages[0].isArchived, false);
  assert.equal(restored.tornObjects.length, 0);
});
