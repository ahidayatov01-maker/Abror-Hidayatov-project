import type {
  HabitCompletionLog,
  HabitDefinition,
  PaperJournalState,
} from '../types/journal';

export type HabitCategory =
  | 'Education'
  | 'Language Learning'
  | 'Reading'
  | 'Programming'
  | 'Personal Development'
  | 'Physical Activity'
  | 'Other';

export type HabitIconId =
  | 'book-open'
  | 'languages'
  | 'code'
  | 'graduation-cap'
  | 'brain'
  | 'dumbbell'
  | 'sparkles'
  | 'clock'
  | 'target'
  | 'pen-tool';

export type HabitAccentColor =
  | 'cyan'
  | 'sky'
  | 'emerald'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'violet';

export type HabitFrequencyType = 'daily' | 'specific_days' | 'custom_weekly';

export type HabitStatus = 'active' | 'paused' | 'archived';

export interface HabitScheduleSnapshot {
  effectiveFromDate: string; // YYYY-MM-DD
  frequency: HabitFrequencyType;
  scheduledDays: number[]; // ISO weekday 1 (Mon) .. 7 (Sun)
  customWeeklyCount?: number;
}

export interface HabitItem {
  id: string;
  title: string;
  category: HabitCategory;
  icon: HabitIconId;
  accentColor: HabitAccentColor;
  frequency: HabitFrequencyType;
  scheduledDays: number[]; // 1 = Monday .. 7 = Sunday
  customWeeklyCount?: number;
  target: number | null;
  targetUnit: string;
  startDate: string; // YYYY-MM-DD
  reminderTime: string | null; // HH:mm
  status: HabitStatus;
  scheduleHistory: HabitScheduleSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletionRecord {
  id: string; // `${habitId}_${date}`
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string;
  note?: string;
}

export interface DailyReflectionRecord {
  date: string; // YYYY-MM-DD
  note: string;
  updatedAt: string;
}

export interface HabitsTrackerState {
  version: number;
  habits: HabitItem[];
  completions: HabitCompletionRecord[];
  reflections: Record<string, DailyReflectionRecord>;
  updatedAt: string;
}

export interface StarterHabitTemplate {
  id: string;
  title: string;
  category: HabitCategory;
  icon: HabitIconId;
  accentColor: HabitAccentColor;
  frequency: HabitFrequencyType;
  scheduledDays: number[];
  target: number;
  targetUnit: string;
  description: string;
}

export const STARTER_HABIT_TEMPLATES: StarterHabitTemplate[] = [
  {
    id: 'tpl-study-1h',
    title: 'Study for 1 Hour',
    category: 'Education',
    icon: 'graduation-cap',
    accentColor: 'cyan',
    frequency: 'daily',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    target: 60,
    targetUnit: 'minutes',
    description: 'Deep focused academic study session without distractions.',
  },
  {
    id: 'tpl-read-20m',
    title: 'Read for 20 Minutes',
    category: 'Reading',
    icon: 'book-open',
    accentColor: 'sky',
    frequency: 'daily',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    target: 20,
    targetUnit: 'minutes',
    description: 'Build comprehension and breadth through daily reading.',
  },
  {
    id: 'tpl-practice-english',
    title: 'Practice English',
    category: 'Language Learning',
    icon: 'languages',
    accentColor: 'emerald',
    frequency: 'daily',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    target: 20,
    targetUnit: 'vocabulary words',
    description: 'IELTS/TOEFL listening, speaking, and active vocabulary.',
  },
  {
    id: 'tpl-review-goals',
    title: 'Review Daily Goals',
    category: 'Personal Development',
    icon: 'target',
    accentColor: 'indigo',
    frequency: 'daily',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    target: 1,
    targetUnit: 'session',
    description: 'Align daily tasks with university and scholarship milestones.',
  },
];

export const HABIT_CATEGORIES: HabitCategory[] = [
  'Education',
  'Language Learning',
  'Reading',
  'Programming',
  'Personal Development',
  'Physical Activity',
  'Other',
];

export const HABIT_ACCENT_COLORS: Array<{
  id: HabitAccentColor;
  label: string;
  hex: string;
  ringClass: string;
  badgeTextClass: string;
  dotClass: string;
}> = [
  {
    id: 'cyan',
    label: 'Cyan',
    hex: '#22D3EE',
    ringClass: 'border-cyan-400/40 bg-cyan-500/12 text-cyan-300',
    badgeTextClass: 'text-cyan-300',
    dotClass: 'bg-cyan-400',
  },
  {
    id: 'sky',
    label: 'Sky Blue',
    hex: '#38BDF8',
    ringClass: 'border-sky-400/40 bg-sky-500/12 text-sky-300',
    badgeTextClass: 'text-sky-300',
    dotClass: 'bg-sky-400',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    hex: '#34D399',
    ringClass: 'border-emerald-400/40 bg-emerald-500/12 text-emerald-300',
    badgeTextClass: 'text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    hex: '#818CF8',
    ringClass: 'border-indigo-400/40 bg-indigo-500/12 text-indigo-300',
    badgeTextClass: 'text-indigo-300',
    dotClass: 'bg-indigo-400',
  },
  {
    id: 'violet',
    label: 'Violet',
    hex: '#A78BFA',
    ringClass: 'border-violet-400/40 bg-violet-500/12 text-violet-300',
    badgeTextClass: 'text-violet-300',
    dotClass: 'bg-violet-400',
  },
  {
    id: 'amber',
    label: 'Amber',
    hex: '#FBBF24',
    ringClass: 'border-amber-400/40 bg-amber-500/12 text-amber-300',
    badgeTextClass: 'text-amber-300',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'rose',
    label: 'Rose',
    hex: '#FB7185',
    ringClass: 'border-rose-400/40 bg-rose-500/12 text-rose-300',
    badgeTextClass: 'text-rose-300',
    dotClass: 'bg-rose-400',
  },
];

export const ISO_WEEKDAY_LABELS: Array<{ day: number; short: string; narrow: string; full: string }> = [
  { day: 1, short: 'Mon', narrow: 'M', full: 'Monday' },
  { day: 2, short: 'Tue', narrow: 'T', full: 'Tuesday' },
  { day: 3, short: 'Wed', narrow: 'W', full: 'Wednesday' },
  { day: 4, short: 'Thu', narrow: 'T', full: 'Thursday' },
  { day: 5, short: 'Fri', narrow: 'F', full: 'Friday' },
  { day: 6, short: 'Sat', narrow: 'S', full: 'Saturday' },
  { day: 7, short: 'Sun', narrow: 'S', full: 'Sunday' },
];

/**
 * Returns today's date in YYYY-MM-DD in the user's configured or local timezone.
 */
export function getLocalTodayISO(timeZone?: string, now: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) {
      return `${y}-${m}-${d}`;
    }
  } catch {
    // fallback below
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure calendar arithmetic on YYYY-MM-DD strings without timezone drift.
 */
export function shiftDateISO(dateISO: string, deltaDays: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns ISO weekday 1 (Monday) .. 7 (Sunday) for a YYYY-MM-DD string.
 */
export function getISOWeekday(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const utcDay = new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

/**
 * Returns the Monday YYYY-MM-DD of the ISO week containing dateISO.
 */
export function getMondayOfWeekISO(dateISO: string): string {
  const weekday = getISOWeekday(dateISO);
  return shiftDateISO(dateISO, -(weekday - 1));
}

/**
 * Returns the 7 YYYY-MM-DD dates [Monday .. Sunday] for the week containing dateISO.
 */
export function getWeekDatesMonToSun(dateISO: string): string[] {
  const monday = getMondayOfWeekISO(dateISO);
  return Array.from({ length: 7 }, (_, idx) => shiftDateISO(monday, idx));
}

/**
 * Normalizes a list of weekday numbers (1..7) sorted ascending with duplicates removed.
 */
export function normalizeScheduledDays(days: number[]): number[] {
  const valid = Array.from(
    new Set(days.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))
  ).sort((a, b) => a - b);
  return valid.length > 0 ? valid : [1, 2, 3, 4, 5, 6, 7];
}

/**
 * Formats a human-readable frequency label for a habit card.
 */
export function formatHabitFrequencyLabel(habit: Pick<HabitItem, 'frequency' | 'scheduledDays' | 'customWeeklyCount'>): string {
  const days = normalizeScheduledDays(habit.scheduledDays);
  if (habit.frequency === 'daily' || days.length === 7) {
    return 'Daily';
  }
  if (
    days.length === 5 &&
    days[0] === 1 &&
    days[1] === 2 &&
    days[2] === 3 &&
    days[3] === 4 &&
    days[4] === 5
  ) {
    return 'Mon–Fri';
  }
  if (days.length === 2 && days[0] === 6 && days[1] === 7) {
    return 'Weekends';
  }
  if (habit.frequency === 'custom_weekly' && habit.customWeeklyCount) {
    const dayNames = days
      .map((d) => ISO_WEEKDAY_LABELS.find((l) => l.day === d)?.short)
      .filter(Boolean)
      .join(', ');
    return `${habit.customWeeklyCount}x/wk (${dayNames})`;
  }
  return days
    .map((d) => ISO_WEEKDAY_LABELS.find((l) => l.day === d)?.short)
    .filter(Boolean)
    .join(', ');
}

/**
 * Resolves the schedule snapshot that was active on a given date so changing a schedule
 * later does not rewrite how past dates were scheduled.
 */
export function getScheduleSnapshotForDate(habit: HabitItem, dateISO: string): {
  frequency: HabitFrequencyType;
  scheduledDays: number[];
} {
  if (Array.isArray(habit.scheduleHistory) && habit.scheduleHistory.length > 0) {
    const sorted = [...habit.scheduleHistory].sort((a, b) =>
      a.effectiveFromDate.localeCompare(b.effectiveFromDate)
    );
    let chosen = sorted[0];
    for (const snap of sorted) {
      if (snap.effectiveFromDate <= dateISO) {
        chosen = snap;
      } else {
        break;
      }
    }
    return {
      frequency: chosen.frequency,
      scheduledDays: normalizeScheduledDays(chosen.scheduledDays),
    };
  }
  return {
    frequency: habit.frequency,
    scheduledDays: normalizeScheduledDays(habit.scheduledDays),
  };
}

/**
 * Determines whether a habit is scheduled on a specific YYYY-MM-DD date.
 */
export function isHabitScheduledOnDate(habit: HabitItem, dateISO: string): boolean {
  if (dateISO < habit.startDate) {
    return false;
  }
  const snap = getScheduleSnapshotForDate(habit, dateISO);
  const weekday = getISOWeekday(dateISO);
  return snap.scheduledDays.includes(weekday);
}

/**
 * Builds a fast lookup map: habitId -> dateISO -> boolean (completed)
 */
export function buildCompletionLookup(
  completions: HabitCompletionRecord[]
): Record<string, Record<string, boolean>> {
  const map: Record<string, Record<string, boolean>> = {};
  for (const rec of completions) {
    if (!rec || !rec.habitId || !rec.date) continue;
    if (!map[rec.habitId]) {
      map[rec.habitId] = {};
    }
    if (rec.completed) {
      map[rec.habitId][rec.date] = true;
    } else {
      delete map[rec.habitId][rec.date];
    }
  }
  return map;
}

/**
 * Deduplicates completion records by (habitId, date), keeping only completed=true records.
 */
export function normalizeCompletionRecords(
  completions: HabitCompletionRecord[]
): HabitCompletionRecord[] {
  const byKey = new Map<string, HabitCompletionRecord>();
  for (const rec of completions) {
    if (!rec || typeof rec.habitId !== 'string' || typeof rec.date !== 'string') continue;
    const key = `${rec.habitId}_${rec.date}`;
    if (rec.completed) {
      byKey.set(key, {
        id: key,
        habitId: rec.habitId,
        date: rec.date,
        completed: true,
        completedAt: rec.completedAt || new Date().toISOString(),
        ...(rec.note ? { note: rec.note } : {}),
      });
    } else {
      byKey.delete(key);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Toggles a completion record for (habitId, dateISO), disallowing future dates (> todayISO).
 */
export function toggleHabitCompletion(
  completions: HabitCompletionRecord[],
  habitId: string,
  dateISO: string,
  todayISO: string
): { completions: HabitCompletionRecord[]; completed: boolean; blockedFuture: boolean } {
  if (dateISO > todayISO) {
    return { completions, completed: false, blockedFuture: true };
  }
  const normalized = normalizeCompletionRecords(completions);
  const existingIdx = normalized.findIndex(
    (c) => c.habitId === habitId && c.date === dateISO && c.completed
  );
  if (existingIdx >= 0) {
    const next = normalized.filter((_, idx) => idx !== existingIdx);
    return { completions: next, completed: false, blockedFuture: false };
  }
  const created: HabitCompletionRecord = {
    id: `${habitId}_${dateISO}`,
    habitId,
    date: dateISO,
    completed: true,
    completedAt: new Date().toISOString(),
  };
  return {
    completions: normalizeCompletionRecords([...normalized, created]),
    completed: true,
    blockedFuture: false,
  };
}

export interface HabitStreakResult {
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  completedOnSelectedDate: boolean;
  scheduledOnSelectedDate: boolean;
}

/**
 * Computes Current Streak and Best Streak for a single habit according to its schedule.
 * - Unscheduled days NEVER break a streak.
 * - Future dates (> todayISO) are ignored.
 * - If todayISO is scheduled and not yet completed, current streak is preserved from the most recent scheduled day prior to todayISO.
 */
export function computeHabitStreak(
  habit: HabitItem,
  habitCompletionsMap: Record<string, boolean>,
  todayISO: string,
  selectedDateISO: string = todayISO
): HabitStreakResult {
  const completedDates = Object.keys(habitCompletionsMap)
    .filter((d) => d <= todayISO && habitCompletionsMap[d])
    .sort();

  const totalCompleted = completedDates.length;
  const completedOnSelectedDate = Boolean(habitCompletionsMap[selectedDateISO]);
  const scheduledOnSelectedDate = isHabitScheduledOnDate(habit, selectedDateISO);

  const earliestDate =
    completedDates.length > 0 && completedDates[0] < habit.startDate
      ? completedDates[0]
      : habit.startDate;

  if (earliestDate > todayISO) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalCompleted,
      completedOnSelectedDate,
      scheduledOnSelectedDate,
    };
  }

  // 1. Current Streak: walk backward from todayISO down to earliestDate
  let currentStreak = 0;
  let cursor = todayISO;
  let maxDaysSafety = 730;

  while (cursor >= earliestDate && maxDaysSafety > 0) {
    maxDaysSafety -= 1;
    const isScheduled = isHabitScheduledOnDate(habit, cursor);
    const isDone = Boolean(habitCompletionsMap[cursor]);

    if (isScheduled) {
      if (isDone) {
        currentStreak += 1;
      } else if (cursor === todayISO) {
        // Today is scheduled but not yet checked in — do not break the streak yet
      } else {
        // Missed a past scheduled day — streak ends
        break;
      }
    } else if (isDone) {
      // Completed on an unscheduled day — counts positively without breaking
      currentStreak += 1;
    }

    cursor = shiftDateISO(cursor, -1);
  }

  // 2. Best Streak: walk forward chronologically from earliestDate to todayISO
  let bestStreak = 0;
  let running = 0;
  let forwardCursor = earliestDate;
  maxDaysSafety = 730;

  while (forwardCursor <= todayISO && maxDaysSafety > 0) {
    maxDaysSafety -= 1;
    const isScheduled = isHabitScheduledOnDate(habit, forwardCursor);
    const isDone = Boolean(habitCompletionsMap[forwardCursor]);

    if (isScheduled) {
      if (isDone) {
        running += 1;
        if (running > bestStreak) bestStreak = running;
      } else if (forwardCursor < todayISO) {
        running = 0;
      }
    } else if (isDone) {
      running += 1;
      if (running > bestStreak) bestStreak = running;
    }

    forwardCursor = shiftDateISO(forwardCursor, 1);
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  return {
    currentStreak,
    bestStreak,
    totalCompleted,
    completedOnSelectedDate,
    scheduledOnSelectedDate,
  };
}

export type DayConsistencyStatus =
  | 'completed'
  | 'partial'
  | 'missed'
  | 'unscheduled'
  | 'future';

export interface DayConsistencySummary {
  dateISO: string;
  weekday: number; // 1..7
  shortLabel: string;
  scheduledCount: number;
  completedCount: number;
  percentage: number;
  status: DayConsistencyStatus;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
}

export interface HabitsDashboardSummary {
  // Card A — Daily Progress (for selectedDateISO)
  selectedDateISO: string;
  dailyScheduledCount: number;
  dailyCompletedCount: number;
  dailyPercentage: number;

  // Card B — Streak & Momentum
  overallCurrentStreak: number;
  overallBestStreak: number;
  momentumStatus: string;
  topStreakHabitTitle: string | null;

  // Card C — Weekly Consistency (Mon..Sun of selectedDateISO's week)
  weekDays: DayConsistencySummary[];
  weeklyScheduledTotal: number;
  weeklyCompletedTotal: number;
  weeklyPercentage: number;

  // Per-habit metrics
  perHabit: Record<string, HabitStreakResult>;

  // Analytics & Consistency Insights (Section 9)
  analytics: {
    mostConsistentHabit: { title: string; rate: number } | null;
    leastConsistentHabit: { title: string; rate: number } | null;
    monthlyScheduledTotal: number;
    monthlyCompletedTotal: number;
    monthlyPercentage: number;
    monthlyTrendDelta: number; // vs previous 30d window
    bestPerformingWeekRate: number;
    habitBreakdown: Array<{
      id: string;
      title: string;
      accentColor: HabitAccentColor;
      weeklyCompleted: number;
      weeklyScheduled: number;
      weeklyRate: number;
      monthlyCompleted: number;
      monthlyScheduled: number;
      monthlyRate: number;
      currentStreak: number;
      bestStreak: number;
    }>;
    insights: string[];
  };
}

/**
 * Computes all Bento Header cards, Weekly Consistency states, Streaks, and Analytics
 * strictly from actual habit definitions and completion records.
 */
export function computeHabitsDashboardSummary(
  habits: HabitItem[],
  completions: HabitCompletionRecord[],
  todayISO: string,
  selectedDateISO: string = todayISO
): HabitsDashboardSummary {
  const lookup = buildCompletionLookup(completions);
  const activeHabits = habits.filter((h) => h.status === 'active');

  const perHabit: Record<string, HabitStreakResult> = {};
  for (const h of habits) {
    perHabit[h.id] = computeHabitStreak(h, lookup[h.id] || {}, todayISO, selectedDateISO);
  }

  // Card A — Daily Progress for selectedDateISO (only active habits scheduled on selectedDateISO)
  let dailyScheduledCount = 0;
  let dailyCompletedCount = 0;

  for (const h of activeHabits) {
    const scheduled = isHabitScheduledOnDate(h, selectedDateISO);
    if (scheduled) {
      dailyScheduledCount += 1;
      if (lookup[h.id]?.[selectedDateISO]) {
        dailyCompletedCount += 1;
      }
    }
  }

  const dailyPercentage =
    dailyScheduledCount > 0 ? Math.round((dailyCompletedCount / dailyScheduledCount) * 100) : 0;

  // Card B — Streak & Momentum across active habits
  let overallCurrentStreak = 0;
  let overallBestStreak = 0;
  let topStreakHabitTitle: string | null = null;

  for (const h of activeHabits) {
    const st = perHabit[h.id];
    if (!st) continue;
    if (st.currentStreak > overallCurrentStreak) {
      overallCurrentStreak = st.currentStreak;
      topStreakHabitTitle = h.title;
    }
    if (st.bestStreak > overallBestStreak) {
      overallBestStreak = st.bestStreak;
    }
  }

  let momentumStatus = 'Start Your First Check-In';
  if (activeHabits.length === 0) {
    momentumStatus = 'Add a Habit to Begin';
  } else if (overallCurrentStreak > 0 && overallCurrentStreak >= overallBestStreak && overallCurrentStreak >= 3) {
    momentumStatus = 'New Personal Record';
  } else if (overallCurrentStreak >= 14) {
    momentumStatus = `${overallCurrentStreak}-Day Consistency`;
  } else if (overallCurrentStreak >= 7) {
    momentumStatus = 'Strong Weekly Momentum';
  } else if (overallCurrentStreak >= 3) {
    momentumStatus = 'Building Momentum';
  } else if (dailyScheduledCount > 0 && dailyCompletedCount === dailyScheduledCount) {
    momentumStatus = 'All Scheduled Habits Complete';
  } else if (overallCurrentStreak >= 1) {
    momentumStatus = 'Active Streak Underway';
  }

  // Card C — Weekly Consistency (Monday..Sunday of the week containing selectedDateISO)
  const weekDates = getWeekDatesMonToSun(selectedDateISO);
  let weeklyScheduledTotal = 0;
  let weeklyCompletedTotal = 0;

  const weekDays: DayConsistencySummary[] = weekDates.map((dt, idx) => {
    const weekday = idx + 1;
    const shortLabel = ISO_WEEKDAY_LABELS[idx].short;
    const isFuture = dt > todayISO;
    const isToday = dt === todayISO;
    const isSelected = dt === selectedDateISO;

    let scheduledCount = 0;
    let completedCount = 0;

    for (const h of activeHabits) {
      if (isHabitScheduledOnDate(h, dt)) {
        scheduledCount += 1;
        if (!isFuture && lookup[h.id]?.[dt]) {
          completedCount += 1;
        }
      }
    }

    if (!isFuture) {
      weeklyScheduledTotal += scheduledCount;
      weeklyCompletedTotal += completedCount;
    }

    let status: DayConsistencyStatus = 'unscheduled';
    if (isFuture) {
      status = 'future';
    } else if (scheduledCount === 0) {
      status = 'unscheduled';
    } else if (completedCount >= scheduledCount) {
      status = 'completed';
    } else if (completedCount > 0) {
      status = 'partial';
    } else {
      status = 'missed';
    }

    const percentage =
      scheduledCount > 0 && !isFuture ? Math.round((completedCount / scheduledCount) * 100) : 0;

    return {
      dateISO: dt,
      weekday,
      shortLabel,
      scheduledCount,
      completedCount,
      percentage,
      status,
      isToday,
      isSelected,
      isFuture,
    };
  });

  const weeklyPercentage =
    weeklyScheduledTotal > 0
      ? Math.round((weeklyCompletedTotal / weeklyScheduledTotal) * 100)
      : 0;

  // Section 9 — Analytics & Consistency Insights (past 30 days up to todayISO)
  const last30Dates = Array.from({ length: 30 }, (_, idx) =>
    shiftDateISO(todayISO, -(29 - idx))
  );
  const prev30Dates = Array.from({ length: 30 }, (_, idx) =>
    shiftDateISO(todayISO, -(59 - idx))
  );

  let monthlyScheduledTotal = 0;
  let monthlyCompletedTotal = 0;
  let prevMonthlyScheduled = 0;
  let prevMonthlyCompleted = 0;

  const habitBreakdown = activeHabits.map((h) => {
    let wSched = 0;
    let wComp = 0;
    for (const dt of weekDates) {
      if (dt > todayISO) continue;
      if (isHabitScheduledOnDate(h, dt)) {
        wSched += 1;
        if (lookup[h.id]?.[dt]) wComp += 1;
      }
    }

    let mSched = 0;
    let mComp = 0;
    for (const dt of last30Dates) {
      if (isHabitScheduledOnDate(h, dt)) {
        mSched += 1;
        if (lookup[h.id]?.[dt]) mComp += 1;
      }
    }

    for (const dt of prev30Dates) {
      if (isHabitScheduledOnDate(h, dt)) {
        prevMonthlyScheduled += 1;
        if (lookup[h.id]?.[dt]) prevMonthlyCompleted += 1;
      }
    }

    monthlyScheduledTotal += mSched;
    monthlyCompletedTotal += mComp;

    const st = perHabit[h.id] || { currentStreak: 0, bestStreak: 0 };

    return {
      id: h.id,
      title: h.title,
      accentColor: h.accentColor,
      weeklyCompleted: wComp,
      weeklyScheduled: wSched,
      weeklyRate: wSched > 0 ? Math.round((wComp / wSched) * 100) : 0,
      monthlyCompleted: mComp,
      monthlyScheduled: mSched,
      monthlyRate: mSched > 0 ? Math.round((mComp / mSched) * 100) : 0,
      currentStreak: st.currentStreak,
      bestStreak: st.bestStreak,
    };
  });

  const monthlyPercentage =
    monthlyScheduledTotal > 0
      ? Math.round((monthlyCompletedTotal / monthlyScheduledTotal) * 100)
      : 0;
  const prevMonthlyPercentage =
    prevMonthlyScheduled > 0
      ? Math.round((prevMonthlyCompleted / prevMonthlyScheduled) * 100)
      : monthlyPercentage;
  const monthlyTrendDelta = monthlyPercentage - prevMonthlyPercentage;

  // Best-performing 7-day block in the last 28 days
  let bestPerformingWeekRate = 0;
  for (let w = 0; w < 4; w++) {
    let wSched = 0;
    let wDone = 0;
    for (let d = 0; d < 7; d++) {
      const dt = shiftDateISO(todayISO, -(w * 7 + d));
      for (const h of activeHabits) {
        if (isHabitScheduledOnDate(h, dt)) {
          wSched += 1;
          if (lookup[h.id]?.[dt]) wDone += 1;
        }
      }
    }
    if (wSched > 0) {
      const rate = Math.round((wDone / wSched) * 100);
      if (rate > bestPerformingWeekRate) bestPerformingWeekRate = rate;
    }
  }

  const habitsWithScheduledHistory = habitBreakdown.filter((b) => b.monthlyScheduled > 0);
  const sortedByConsistency = [...habitsWithScheduledHistory].sort(
    (a, b) => b.monthlyRate - a.monthlyRate || b.monthlyCompleted - a.monthlyCompleted
  );

  const mostConsistentHabit =
    sortedByConsistency.length > 0
      ? { title: sortedByConsistency[0].title, rate: sortedByConsistency[0].monthlyRate }
      : null;

  const leastConsistentHabit =
    sortedByConsistency.length > 1
      ? {
          title: sortedByConsistency[sortedByConsistency.length - 1].title,
          rate: sortedByConsistency[sortedByConsistency.length - 1].monthlyRate,
        }
      : mostConsistentHabit;

  // Generate data-grounded intelligent insights
  const insights: string[] = [];
  if (activeHabits.length === 0 || completions.length === 0) {
    insights.push(
      'Check in on your scheduled habits for a few days to unlock personalized consistency insights.'
    );
  } else {
    // 1. Weekly session count insight
    if (weeklyScheduledTotal > 0) {
      insights.push(
        `You completed ${weeklyCompletedTotal} of ${weeklyScheduledTotal} scheduled sessions this week (${weeklyPercentage}%).`
      );
    }

    // 2. Most consistent habit insight
    if (mostConsistentHabit && mostConsistentHabit.rate > 0) {
      insights.push(
        `${mostConsistentHabit.title} is your most consistent habit (${mostConsistentHabit.rate}% over 30 days).`
      );
    }

    // 3. Best weekday insight from last 30 days
    const weekdayTotals: Record<number, { sched: number; done: number }> = {
      1: { sched: 0, done: 0 },
      2: { sched: 0, done: 0 },
      3: { sched: 0, done: 0 },
      4: { sched: 0, done: 0 },
      5: { sched: 0, done: 0 },
      6: { sched: 0, done: 0 },
      7: { sched: 0, done: 0 },
    };
    for (const dt of last30Dates) {
      const wd = getISOWeekday(dt);
      for (const h of activeHabits) {
        if (isHabitScheduledOnDate(h, dt)) {
          weekdayTotals[wd].sched += 1;
          if (lookup[h.id]?.[dt]) weekdayTotals[wd].done += 1;
        }
      }
    }
    let bestWd = 0;
    let bestWdRate = -1;
    for (let wd = 1; wd <= 7; wd++) {
      const { sched, done } = weekdayTotals[wd];
      if (sched > 0) {
        const rate = done / sched;
        if (rate > bestWdRate) {
          bestWdRate = rate;
          bestWd = wd;
        }
      }
    }
    if (bestWd >= 1 && bestWdRate > 0) {
      const wdName = ISO_WEEKDAY_LABELS.find((l) => l.day === bestWd)?.full || 'Monday';
      insights.push(
        `Your strongest consistency was on ${wdName} (${Math.round(bestWdRate * 100)}% completion rate).`
      );
    }
  }

  return {
    selectedDateISO,
    dailyScheduledCount,
    dailyCompletedCount,
    dailyPercentage,
    overallCurrentStreak,
    overallBestStreak,
    momentumStatus,
    topStreakHabitTitle,
    weekDays,
    weeklyScheduledTotal,
    weeklyCompletedTotal,
    weeklyPercentage,
    perHabit,
    analytics: {
      mostConsistentHabit,
      leastConsistentHabit,
      monthlyScheduledTotal,
      monthlyCompletedTotal,
      monthlyPercentage,
      monthlyTrendDelta,
      bestPerformingWeekRate,
      habitBreakdown,
      insights,
    },
  };
}

/**
 * Migrates legacy PaperJournalState habits & habitLog into HabitsTrackerState
 * while preserving every existing habit and completion record.
 */
export function migrateJournalStateToHabitsTracker(
  journal: PaperJournalState | null | undefined,
  todayISO: string
): HabitsTrackerState {
  const legacyHabits: HabitDefinition[] = journal?.habits || [];
  const legacyLog: HabitCompletionLog = journal?.habitLog || {};

  const presetMeta: Record<
    string,
    {
      category: HabitCategory;
      icon: HabitIconId;
      accentColor: HabitAccentColor;
      target: number | null;
      targetUnit: string;
    }
  > = {
    'hab-wake': {
      category: 'Personal Development',
      icon: 'clock',
      accentColor: 'cyan',
      target: 1,
      targetUnit: 'morning routine',
    },
    'hab-read': {
      category: 'Reading',
      icon: 'book-open',
      accentColor: 'sky',
      target: 25,
      targetUnit: 'pages',
    },
    'hab-lang': {
      category: 'Language Learning',
      icon: 'languages',
      accentColor: 'emerald',
      target: 20,
      targetUnit: 'vocabulary words',
    },
    'hab-math': {
      category: 'Education',
      icon: 'graduation-cap',
      accentColor: 'indigo',
      target: 45,
      targetUnit: 'minutes',
    },
    'hab-code': {
      category: 'Programming',
      icon: 'code',
      accentColor: 'violet',
      target: 45,
      targetUnit: 'minutes',
    },
  };

  const habits: HabitItem[] = legacyHabits.map((lh, idx) => {
    const meta = presetMeta[lh.id] || {
      category: 'Education' as HabitCategory,
      icon: 'sparkles' as HabitIconId,
      accentColor: HABIT_ACCENT_COLORS[idx % HABIT_ACCENT_COLORS.length].id,
      target: null,
      targetUnit: 'minutes',
    };

    let frequency: HabitFrequencyType = 'daily';
    let scheduledDays: number[] = [1, 2, 3, 4, 5, 6, 7];
    if (lh.schedule === 'weekdays') {
      frequency = 'specific_days';
      scheduledDays = [1, 2, 3, 4, 5];
    } else if (lh.schedule === 'weekends') {
      frequency = 'specific_days';
      scheduledDays = [6, 7];
    }

    const startDate = lh.startDateISO || shiftDateISO(todayISO, -21);
    return {
      id: lh.id,
      title: lh.name,
      category: meta.category,
      icon: meta.icon,
      accentColor: meta.accentColor,
      frequency,
      scheduledDays,
      target: meta.target,
      targetUnit: meta.targetUnit,
      startDate,
      reminderTime: null,
      status: 'active',
      scheduleHistory: [
        {
          effectiveFromDate: startDate,
          frequency,
          scheduledDays,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const completions: HabitCompletionRecord[] = [];
  for (const [dateISO, dayMap] of Object.entries(legacyLog)) {
    if (!dayMap || typeof dayMap !== 'object') continue;
    for (const [habitId, done] of Object.entries(dayMap)) {
      if (done) {
        completions.push({
          id: `${habitId}_${dateISO}`,
          habitId,
          date: dateISO,
          completed: true,
          completedAt: new Date().toISOString(),
        });
      }
    }
  }

  const reflections: Record<string, DailyReflectionRecord> = {};
  if (Array.isArray(journal?.pages)) {
    for (const p of journal.pages) {
      const parts = [
        p.reflection?.highlightLine,
        p.reflection?.accomplished,
        p.reflection?.learned,
        p.reflection?.improve,
      ]
        .map((s) => (s || '').trim())
        .filter(Boolean);
      if (parts.length > 0 && p.dateISO) {
        reflections[p.dateISO] = {
          date: p.dateISO,
          note: parts.join(' — '),
          updatedAt: journal?.updatedAt || new Date().toISOString(),
        };
      }
    }
  }

  return {
    version: 2,
    habits,
    completions: normalizeCompletionRecords(completions),
    reflections,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Synchronizes HabitsTrackerState back into PaperJournalState so the PostgreSQL
 * /api/user/journal endpoint and classic notebook pages stay in sync.
 */
export function syncHabitsTrackerIntoJournalState(
  journal: PaperJournalState,
  tracker: HabitsTrackerState
): PaperJournalState {
  const legacyHabits: HabitDefinition[] = tracker.habits
    .filter((h) => h.status !== 'archived')
    .map((h) => ({
      id: h.id,
      name: h.title,
      description: h.target ? `${h.target} ${h.targetUnit}` : h.category,
      schedule:
        h.frequency === 'daily'
          ? 'daily'
          : h.scheduledDays.length === 5 &&
            h.scheduledDays.every((d, i) => d === i + 1)
          ? 'weekdays'
          : h.scheduledDays.length === 2 &&
            h.scheduledDays[0] === 6 &&
            h.scheduledDays[1] === 7
          ? 'weekends'
          : 'custom',
      startDateISO: h.startDate,
      targetPerWeek: h.scheduledDays.length,
      priority: 'important',
    }));

  const habitLog: HabitCompletionLog = {};
  for (const rec of tracker.completions) {
    if (!rec.completed) continue;
    if (!habitLog[rec.date]) {
      habitLog[rec.date] = {};
    }
    habitLog[rec.date][rec.habitId] = true;
  }

  return {
    ...journal,
    habits: legacyHabits,
    habitLog,
    updatedAt: new Date().toISOString(),
  };
}
