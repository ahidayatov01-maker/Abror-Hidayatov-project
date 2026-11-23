import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHabitStreak,
  computeHabitsDashboardSummary,
  getISOWeekday,
  getWeekDatesMonToSun,
  isHabitScheduledOnDate,
  migrateJournalStateToHabitsTracker,
  toggleHabitCompletion,
  type HabitCompletionRecord,
  type HabitItem,
} from './habitTrackerEngine';
import { createDefaultJournalState } from './journalEngine';

function makeTestHabit(overrides: Partial<HabitItem> = {}): HabitItem {
  return {
    id: 'hab-test-1',
    title: 'IELTS Listening Practice',
    category: 'Language Learning',
    icon: 'languages',
    accentColor: 'cyan',
    frequency: 'daily',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    target: 30,
    targetUnit: 'minutes',
    startDate: '2026-11-01',
    reminderTime: null,
    status: 'active',
    scheduleHistory: [
      {
        effectiveFromDate: '2026-11-01',
        frequency: 'daily',
        scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      },
    ],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

test('Mon/Wed/Fri habit keeps its streak across unscheduled Tuesday and Thursday', () => {
  // 2026-11-16 is Monday (1), 2026-11-17 is Tuesday (2), 2026-11-18 is Wednesday (3)
  assert.equal(getISOWeekday('2026-11-16'), 1);
  assert.equal(getISOWeekday('2026-11-17'), 2);
  assert.equal(getISOWeekday('2026-11-18'), 3);

  const mwfHabit = makeTestHabit({
    id: 'hab-mwf',
    frequency: 'specific_days',
    scheduledDays: [1, 3, 5],
    scheduleHistory: [
      {
        effectiveFromDate: '2026-11-01',
        frequency: 'specific_days',
        scheduledDays: [1, 3, 5],
      },
    ],
  });

  // Completed on Fri Nov 13, Mon Nov 16, and Wed Nov 18 (not completed on Sat/Sun/Tue)
  const completionsMap: Record<string, boolean> = {
    '2026-11-13': true, // Friday
    '2026-11-16': true, // Monday
    '2026-11-18': true, // Wednesday
  };

  const streakOnTue = computeHabitStreak(mwfHabit, completionsMap, '2026-11-17', '2026-11-17');
  assert.equal(streakOnTue.currentStreak, 2); // Fri + Mon unbroken across Tuesday!

  const streakOnWed = computeHabitStreak(mwfHabit, completionsMap, '2026-11-18', '2026-11-18');
  assert.equal(streakOnWed.currentStreak, 3); // Fri + Mon + Wed
  assert.equal(streakOnWed.bestStreak, 3);
});

test('Daily progress ring counts only active habits scheduled for the selected day', () => {
  // Tuesday 2026-11-17 (weekday = 2)
  const todayISO = '2026-11-17';
  const habits: HabitItem[] = [
    makeTestHabit({ id: 'h-daily-1', title: 'Daily 1', status: 'active' }),
    makeTestHabit({ id: 'h-daily-2', title: 'Daily 2', status: 'active' }),
    makeTestHabit({
      id: 'h-mwf',
      title: 'MWF Only',
      frequency: 'specific_days',
      scheduledDays: [1, 3, 5],
      scheduleHistory: [
        { effectiveFromDate: '2026-11-01', frequency: 'specific_days', scheduledDays: [1, 3, 5] },
      ],
      status: 'active',
    }),
    makeTestHabit({ id: 'h-paused', title: 'Paused Habit', status: 'paused' }),
    makeTestHabit({ id: 'h-archived', title: 'Archived Habit', status: 'archived' }),
  ];

  const completions: HabitCompletionRecord[] = [
    {
      id: `h-daily-1_${todayISO}`,
      habitId: 'h-daily-1',
      date: todayISO,
      completed: true,
      completedAt: '2026-11-17T10:00:00Z',
    },
  ];

  const summary = computeHabitsDashboardSummary(habits, completions, todayISO, todayISO);
  // Only h-daily-1 and h-daily-2 are active and scheduled on Tuesday
  assert.equal(summary.dailyScheduledCount, 2);
  assert.equal(summary.dailyCompletedCount, 1);
  assert.equal(summary.dailyPercentage, 50);
});

test('toggleHabitCompletion blocks future dates and deduplicates records', () => {
  const todayISO = '2026-11-18';
  const futureAttempt = toggleHabitCompletion([], 'hab-1', '2026-11-19', todayISO);
  assert.equal(futureAttempt.blockedFuture, true);
  assert.equal(futureAttempt.completions.length, 0);

  const checkIn = toggleHabitCompletion([], 'hab-1', todayISO, todayISO);
  assert.equal(checkIn.blockedFuture, false);
  assert.equal(checkIn.completed, true);
  assert.equal(checkIn.completions.length, 1);

  // Undo check-in
  const undo = toggleHabitCompletion(checkIn.completions, 'hab-1', todayISO, todayISO);
  assert.equal(undo.completed, false);
  assert.equal(undo.completions.length, 0);
});

test('scheduleHistory preserves historical schedule when user edits frequency later', () => {
  const habit = makeTestHabit({
    id: 'hab-sched-change',
    startDate: '2026-11-01',
    frequency: 'specific_days',
    scheduledDays: [1, 3, 5],
    scheduleHistory: [
      {
        effectiveFromDate: '2026-11-01',
        frequency: 'daily',
        scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      },
      {
        effectiveFromDate: '2026-11-16',
        frequency: 'specific_days',
        scheduledDays: [1, 3, 5],
      },
    ],
  });

  // Tuesday Nov 10 (before Nov 16) was scheduled under the old daily rule
  assert.equal(isHabitScheduledOnDate(habit, '2026-11-10'), true);
  // Tuesday Nov 17 (after Nov 16) is NOT scheduled under the new Mon/Wed/Fri rule
  assert.equal(isHabitScheduledOnDate(habit, '2026-11-17'), false);
});

test('migrateJournalStateToHabitsTracker preserves all existing habits and completion history', () => {
  const todayISO = '2026-11-18';
  const defaultJournal = createDefaultJournalState(todayISO);
  const migrated = migrateJournalStateToHabitsTracker(defaultJournal, todayISO);

  assert.equal(migrated.habits.length, 5);
  assert.ok(migrated.completions.length > 20);
  const weekDates = getWeekDatesMonToSun(todayISO);
  assert.equal(weekDates.length, 7);
  assert.equal(getISOWeekday(weekDates[0]), 1); // Monday
  assert.equal(getISOWeekday(weekDates[6]), 7); // Sunday
});
