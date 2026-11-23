import type {
  FoldMode,
  HabitCompletionLog,
  HabitDefinition,
  InkStroke,
  JournalPage,
  JournalPreferences,
  PaperJournalState,
  PaperPhysicsState,
  StickyNoteItem,
  StrokePoint,
  TornPaperObject,
} from '../types/journal';

export const DEFAULT_PREFERENCES: JournalPreferences = {
  coverStyle: 'leather',
  coverTitle: 'PAPER — My Personal Journal',
  coverOwner: 'Personal Edition',
  paperColor: 'warm-ivory',
  lineColor: 'slate-blue',
  lineSpacing: 'classic',
  marginStyle: 'double-crimson',
  defaultFont: 'caveat',
  defaultInstrument: 'fountain',
  defaultInkColor: '#1B2E4B',
  deskTheme: 'walnut',
  lightingTheme: 'morning',
  soundEnabled: false,
  soundVolume: 0.45,
  showDeskObjects: true,
};

const ALLOWED_TRANSITIONS: Record<PaperPhysicsState, PaperPhysicsState[]> = {
  flat: ['hovered', 'held', 'bending', 'folded', 'partially_torn', 'archived'],
  hovered: ['flat', 'held', 'bending', 'partially_torn'],
  held: ['flat', 'dragging', 'bending', 'partially_torn', 'folded', 'crumpled', 'flying'],
  dragging: ['flat', 'held', 'bending', 'partially_torn', 'fully_torn', 'flying', 'landed'],
  bending: ['flat', 'hovered', 'held', 'partially_torn', 'folded'],
  partially_torn: ['flat', 'bending', 'fully_torn', 'held'],
  fully_torn: ['held', 'dragging', 'folded', 'crumpled', 'flying', 'landed', 'archived'],
  folded: ['flat', 'held', 'dragging', 'crumpled', 'flying', 'landed', 'archived'],
  crumpled: ['held', 'dragging', 'flying', 'landed', 'archived'],
  flying: ['landed', 'archived', 'held'],
  landed: ['held', 'dragging', 'folded', 'crumpled', 'flying', 'archived'],
  archived: ['flat', 'landed'],
};

export function canTransitionPaperState(
  from: PaperPhysicsState,
  to: PaperPhysicsState
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function advanceCrumpleStage(stage: 0 | 1 | 2 | 3 | 4): 0 | 1 | 2 | 3 | 4 {
  if (stage >= 4) return 4;
  return (stage + 1) as 0 | 1 | 2 | 3 | 4;
}

export function nextFoldMode(current: FoldMode): FoldMode {
  switch (current) {
    case 'none':
      return 'corner';
    case 'corner':
      return 'half';
    case 'half':
      return 'quarter';
    case 'quarter':
      return 'none';
  }
}

export interface PhysicsBounds {
  width: number;
  height: number;
  wastebasket: {
    x: number;
    y: number;
    radius: number;
  };
}

/**
 * Steps a floating/thrown torn or crumpled paper object over dt seconds.
 * Models pointer velocity carry, downward gravity arc, drag deceleration,
 * rotational inertia, desk boundary bounce, and wastebasket capture.
 */
export function stepThrowPhysics(
  obj: TornPaperObject,
  dtSec: number,
  bounds: PhysicsBounds
): TornPaperObject {
  if (obj.state !== 'flying') return obj;

  const clampedDt = Math.min(0.05, Math.max(0.001, dtSec));
  const gravity = 820; // px/s^2 soft desk gravity
  const airDrag = Math.pow(0.24, clampedDt);

  let vx = obj.vx * airDrag;
  let vy = (obj.vy + gravity * clampedDt) * airDrag;
  let x = obj.x + vx * clampedDt;
  let y = obj.y + vy * clampedDt;
  let rotation = obj.rotation + obj.angularVelocity * clampedDt;
  let angularVelocity = obj.angularVelocity * Math.pow(0.18, clampedDt);

  const margin = 36;
  const maxX = Math.max(margin + 20, bounds.width - margin);
  const maxY = Math.max(margin + 20, bounds.height - margin);

  if (x < margin) {
    x = margin;
    vx = Math.abs(vx) * 0.45;
  } else if (x > maxX) {
    x = maxX;
    vx = -Math.abs(vx) * 0.45;
  }

  let hitFloor = false;
  if (y < margin) {
    y = margin;
    vy = Math.abs(vy) * 0.4;
  } else if (y > maxY) {
    y = maxY;
    if (Math.abs(vy) > 95) {
      vy = -Math.abs(vy) * 0.32;
      vx *= 0.72;
    } else {
      vy = 0;
      hitFloor = true;
    }
  }

  // Check wastebasket intersection
  const dx = x - bounds.wastebasket.x;
  const dy = y - bounds.wastebasket.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= bounds.wastebasket.radius) {
    return {
      ...obj,
      x: bounds.wastebasket.x,
      y: bounds.wastebasket.y,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      rotation: rotation % 360,
      state: 'archived',
      inWastebasket: true,
    };
  }

  const speed = Math.hypot(vx, vy);
  if (speed < 28 && (hitFloor || obj.vy >= -10)) {
    return {
      ...obj,
      x,
      y,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      rotation: rotation % 360,
      state: 'landed',
      inWastebasket: false,
    };
  }

  return {
    ...obj,
    x,
    y,
    vx,
    vy,
    rotation: rotation % 360,
    angularVelocity,
    state: 'flying',
  };
}

/**
 * Generates deterministic organic fiber-tear polyline points between two coordinates.
 */
export function generateJaggedTearPath(
  seed: number,
  lengthPx: number,
  amplitude = 6,
  segments = 28
): Array<{ t: number; offset: number }> {
  const pts: Array<{ t: number; offset: number }> = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const waveA = Math.sin(seed * 13.7 + i * 2.13);
    const waveB = Math.cos(seed * 7.3 + i * 4.91);
    const spike = (waveA * 0.62 + waveB * 0.38) * amplitude;
    const edgeFade = i === 0 || i === segments ? 0 : 1;
    pts.push({ t: t * lengthPx, offset: Number((spike * edgeFade).toFixed(2)) });
  }
  return pts;
}

/**
 * Builds an SVG quadratic Bezier path from pointer stroke points for natural handwriting curves.
 */
export function buildSmoothStrokePath(
  points: StrokePoint[],
  width: number,
  height: number
): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${(p.x * width).toFixed(1)} ${(p.y * height).toFixed(1)} l 0.5 0.5`;
  }

  const scaled = points.map((p) => ({ x: p.x * width, y: p.y * height }));
  let d = `M ${scaled[0].x.toFixed(1)} ${scaled[0].y.toFixed(1)}`;
  for (let i = 1; i < scaled.length - 1; i++) {
    const midX = (scaled[i].x + scaled[i + 1].x) / 2;
    const midY = (scaled[i].y + scaled[i + 1].y) / 2;
    d += ` Q ${scaled[i].x.toFixed(1)} ${scaled[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = scaled[scaled.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export function eraseStrokesNearPoint(
  strokes: InkStroke[],
  normalizedPt: { x: number; y: number },
  radiusNormalized = 0.032
): InkStroke[] {
  const r2 = radiusNormalized * radiusNormalized;
  return strokes.filter((stroke) => {
    for (const pt of stroke.points) {
      const dx = pt.x - normalizedPt.x;
      const dy = pt.y - normalizedPt.y;
      if (dx * dx + dy * dy <= r2) {
        return false;
      }
    }
    return true;
  });
}

export function shiftISODate(dateISO: string, deltaDays: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export interface HabitAnalytics {
  dailyCompleted: number;
  dailyTotal: number;
  dailyPercent: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  weeklyPercent: number;
  monthlyCompleted: number;
  monthlyTotal: number;
  monthlyPercent: number;
  totalCompletedAllTime: number;
  perHabit: Record<
    string,
    {
      currentStreak: number;
      longestStreak: number;
      totalCompleted: number;
      completedToday: boolean;
      weekCompletedCount: number;
    }
  >;
}

export function computeHabitStats(
  habits: HabitDefinition[],
  log: HabitCompletionLog,
  referenceDateISO: string
): HabitAnalytics {
  const perHabit: HabitAnalytics['perHabit'] = {};
  const todayMap = log[referenceDateISO] || {};

  let dailyCompleted = 0;
  let weeklyCompleted = 0;
  let monthlyCompleted = 0;
  let totalCompletedAllTime = 0;

  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    weekDates.push(shiftISODate(referenceDateISO, -i));
  }
  const monthDates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    monthDates.push(shiftISODate(referenceDateISO, -i));
  }

  const allLoggedDates = Object.keys(log).sort();

  for (const h of habits) {
    const completedToday = Boolean(todayMap[h.id]);
    if (completedToday) dailyCompleted += 1;

    let weekCount = 0;
    for (const dt of weekDates) {
      if (log[dt]?.[h.id]) weekCount += 1;
    }
    weeklyCompleted += weekCount;

    let monthCount = 0;
    for (const dt of monthDates) {
      if (log[dt]?.[h.id]) monthCount += 1;
    }
    monthlyCompleted += monthCount;

    // Current streak ending at referenceDateISO (or yesterday if today not yet checked)
    let currentStreak = 0;
    let cursor = completedToday ? referenceDateISO : shiftISODate(referenceDateISO, -1);
    for (let i = 0; i < 365; i++) {
      if (log[cursor]?.[h.id]) {
        currentStreak += 1;
        cursor = shiftISODate(cursor, -1);
      } else {
        break;
      }
    }

    // Longest streak + total across all logged dates
    let habitTotal = 0;
    let longestStreak = 0;
    let run = 0;
    let prevDate: string | null = null;

    for (const dt of allLoggedDates) {
      if (log[dt]?.[h.id]) {
        habitTotal += 1;
        if (prevDate && shiftISODate(prevDate, 1) === dt) {
          run += 1;
        } else {
          run = 1;
        }
        if (run > longestStreak) longestStreak = run;
        prevDate = dt;
      }
    }

    totalCompletedAllTime += habitTotal;
    perHabit[h.id] = {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalCompleted: habitTotal,
      completedToday,
      weekCompletedCount: weekCount,
    };
  }

  const dailyTotal = habits.length;
  const weeklyTotal = habits.length * 7;
  const monthlyTotal = habits.length * 30;

  return {
    dailyCompleted,
    dailyTotal,
    dailyPercent: dailyTotal ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
    weeklyCompleted,
    weeklyTotal,
    weeklyPercent: weeklyTotal ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
    monthlyCompleted,
    monthlyTotal,
    monthlyPercent: monthlyTotal ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0,
    totalCompletedAllTime,
    perHabit,
  };
}

export interface SearchHit {
  pageId: string;
  pageNumber: number;
  title: string;
  dateISO: string;
  excerpt: string;
}

export function searchJournalContent(
  pages: JournalPage[],
  stickyNotes: StickyNoteItem[],
  query: string
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const page of pages) {
    if (page.isArchived && page.isTornOut) continue;
    const chunks: string[] = [
      page.title,
      ...page.lines.map((l) => l.text),
      page.reflection.accomplished,
      page.reflection.learned,
      page.reflection.improve,
      page.reflection.tomorrowPriority,
      page.reflection.highlightLine,
      page.weeklyReview.bestAchievement,
      page.weeklyReview.nextWeekPriority,
      page.monthlyReview.themeOfMonth,
      page.monthlyReview.lessonsLearned,
      ...page.goals.map((g) => `${g.title} ${g.nextStep}`),
      ...page.books.map((b) => `${b.title} ${b.author} ${b.keyIdeas} ${b.vocabularyNotes}`),
      ...page.memories.map((m) => `${m.title} ${m.location} ${m.story}`),
      ...stickyNotes.filter((n) => n.pageId === page.id).map((n) => n.text),
    ];

    const matched = chunks.find((c) => c && c.toLowerCase().includes(q));
    if (matched) {
      hits.push({
        pageId: page.id,
        pageNumber: page.pageNumber,
        title: page.title,
        dateISO: page.dateISO,
        excerpt: matched.slice(0, 90),
      });
    }
  }

  return hits;
}

export function restorePageFromArchive(
  state: PaperJournalState,
  pageId: string
): PaperJournalState {
  return {
    ...state,
    pages: state.pages.map((p) =>
      p.id === pageId ? { ...p, isTornOut: false, isArchived: false, foldMode: 'none' } : p
    ),
    tornObjects: state.tornObjects.filter((obj) => obj.sourcePageId !== pageId),
    activePageId: pageId,
  };
}

function makeLine(
  id: string,
  text = '',
  overrides: Partial<JournalPage['lines'][number]> = {}
): JournalPage['lines'][number] {
  return {
    id,
    text,
    instrument: 'fountain',
    inkColor: '#1B2E4B',
    font: 'caveat',
    align: 'left',
    ...overrides,
  };
}

export function createBlankPage(
  pageNumber: number,
  dateISO: string,
  template: JournalPage['template'] = 'daily',
  title?: string
): JournalPage {
  const blankLines = Array.from({ length: 14 }, (_, idx) =>
    makeLine(`line-${Date.now()}-${pageNumber}-${idx}`, '')
  );

  return {
    id: `page-${Date.now()}-${pageNumber}`,
    pageNumber,
    dateISO,
    title:
      title ||
      (template === 'daily'
        ? 'Daily Notes & Habits'
        : template === 'reflection'
        ? 'Evening Reflection'
        : template === 'calendar'
        ? 'Monthly Habit Calendar'
        : template === 'weekly'
        ? 'Weekly Review'
        : template === 'monthly'
        ? 'Monthly Journal'
        : template === 'goals'
        ? 'Long-Term Personal Goals'
        : template === 'books'
        ? 'Book & Learning Journal'
        : 'Memory Pages'),
    template,
    lines: blankLines,
    strokes: [],
    bookmarked: false,
    paperClipped: false,
    foldMode: 'none',
    reflection: {
      accomplished: '',
      learned: '',
      improve: '',
      tomorrowPriority: '',
      highlightLine: '',
    },
    weeklyReview: {
      bestAchievement: '',
      mainDifficulty: '',
      nextWeekPriority: '',
      notes: '',
    },
    monthlyReview: {
      themeOfMonth: '',
      milestonesSummary: '',
      lessonsLearned: '',
      nextMonthFocus: '',
    },
    goals: [],
    books: [],
    memories: [],
    isTornOut: false,
    isArchived: false,
  };
}

export function createDefaultJournalState(todayISO = '2026-11-18'): PaperJournalState {
  const habits: HabitDefinition[] = [
    {
      id: 'hab-wake',
      name: 'Wake up early (06:15)',
      description: 'Begin the morning quietly before checking screens',
      schedule: 'daily',
      startDateISO: shiftISODate(todayISO, -21),
      targetPerWeek: 7,
      priority: 'most_important',
    },
    {
      id: 'hab-read',
      name: 'Read 25 pages',
      description: 'Academic & literary reading with margin notes',
      schedule: 'daily',
      startDateISO: shiftISODate(todayISO, -18),
      targetPerWeek: 6,
      priority: 'most_important',
    },
    {
      id: 'hab-lang',
      name: 'Study English & Japanese vocabulary',
      description: 'Review 20 spaced-repetition cards + handwriting practice',
      schedule: 'daily',
      startDateISO: shiftISODate(todayISO, -14),
      targetPerWeek: 6,
      priority: 'important',
    },
    {
      id: 'hab-math',
      name: 'Practice mathematics & problem sets',
      description: 'Linear algebra and Olympiad proof exercises',
      schedule: 'weekdays',
      startDateISO: shiftISODate(todayISO, -14),
      targetPerWeek: 5,
      priority: 'important',
    },
    {
      id: 'hab-code',
      name: 'Practice programming (45 min)',
      description: 'Algorithms and software craft without distraction',
      schedule: 'daily',
      startDateISO: shiftISODate(todayISO, -10),
      targetPerWeek: 5,
      priority: 'optional',
    },
  ];

  // Deterministic 10-day realistic history
  const habitLog: HabitCompletionLog = {};
  for (let offset = 9; offset >= 1; offset--) {
    const dt = shiftISODate(todayISO, -offset);
    habitLog[dt] = {
      'hab-wake': offset !== 4,
      'hab-read': offset !== 6,
      'hab-lang': offset % 2 === 1 || offset <= 3,
      'hab-math': offset <= 5 && offset !== 2,
      'hab-code': offset % 3 !== 0,
    };
  }
  habitLog[todayISO] = {
    'hab-wake': true,
    'hab-read': true,
    'hab-lang': false,
    'hab-math': false,
    'hab-code': false,
  };

  const p1 = createBlankPage(1, todayISO, 'daily', 'Morning Pages & Daily Rhythm');
  p1.bookmarked = true;
  p1.paperClipped = true;
  p1.lines[0] = makeLine('p1-l0', 'Morning Focus — Quiet Study Block', {
    isHeading: true,
    inkColor: '#1B2E4B',
  });
  p1.lines[1] = makeLine(
    'p1-l1',
    'Reviewed scholarship essays & mapped out three university deadlines before breakfast.',
    { instrument: 'fountain', inkColor: '#1B2E4B' }
  );
  p1.lines[2] = makeLine(
    'p1-l2',
    'Remember: small unhurried pages accumulate faster than grand plans left unopened.',
    { instrument: 'fountain', inkColor: '#2E4057', highlighted: true, highlightColor: 'rgba(245, 208, 72, 0.34)' }
  );
  p1.lines[3] = makeLine(
    'p1-l3',
    'Bugungi maqsad: 20 ta yangi so‘z va matematika masalalarini oxirigacha yechish.',
    { instrument: 'fine-tip', inkColor: '#3B2F2F' }
  );

  const p2 = createBlankPage(2, todayISO, 'reflection', 'Evening Reflection & Highlight');
  p2.reflection = {
    accomplished: 'Finished two chapters of linear algebra proofs and drafted the Tokyo SOP opening.',
    learned: 'Slowing down while taking handwritten notes helps retain formulas twice as long.',
    improve: 'Start language vocabulary drills right after lunch instead of late evening.',
    tomorrowPriority: 'Complete problem set #4 and review Japanese kanji stroke order.',
    highlightLine: 'Drafted the Tokyo statement of purpose opening in one quiet sitting.',
  };

  const p3 = createBlankPage(3, todayISO, 'calendar', 'Habit Calendar — November');
  const p4 = createBlankPage(4, todayISO, 'weekly', 'Weekly Review');
  p4.weeklyReview = {
    bestAchievement: 'Kept morning wake-up rhythm 6 out of 7 days.',
    mainDifficulty: 'Evening fatigue delayed programming practice mid-week.',
    nextWeekPriority: 'Protect the 07:00–08:30 deep work window every morning.',
    notes: 'Consistent mornings made every afternoon calmer.',
  };

  const p5 = createBlankPage(5, todayISO, 'monthly', 'Monthly Review');
  p5.monthlyReview = {
    themeOfMonth: 'Depth Over Speed',
    milestonesSummary: 'Shortlisted 4 target universities and established daily reading discipline.',
    lessonsLearned: 'Writing by hand clears mental clutter before difficult problem sets.',
    nextMonthFocus: 'Finalize scholarship documentation and complete mock timed essays.',
  };

  const p6 = createBlankPage(6, todayISO, 'goals', 'Personal Goals');
  p6.goals = [
    {
      id: 'goal-1',
      title: 'Reach B2/N2 academic fluency & complete scholarship portfolio',
      horizon: 'Spring 2027',
      whyItMatters: 'Opens international engineering research opportunities.',
      nextStep: 'Finish two practice interviews and verify sealed transcripts.',
      completed: false,
    },
    {
      id: 'goal-2',
      title: 'Read 18 foundational books across science, history, and literature',
      horizon: 'This Year',
      whyItMatters: 'Builds breadth of thought and sharper written expression.',
      nextStep: 'Log 25 pages every morning with 3 margin takeaways.',
      completed: false,
    },
  ];

  const p7 = createBlankPage(7, todayISO, 'books', 'Book & Learning Journal');
  p7.books = [
    {
      id: 'book-1',
      title: 'The Art of Doing Science and Engineering',
      author: 'Richard W. Hamming',
      pagesRead: 164,
      totalPages: 340,
      keyIdeas: 'Style in thinking comes from studying first principles rather than memorizing tricks.',
      vocabularyNotes: 'First principles · Heuristics · Compounding curiosity',
    },
  ];

  const p8 = createBlankPage(8, todayISO, 'memories', 'Memory Pages');
  p8.memories = [
    {
      id: 'mem-1',
      dateLabel: 'Autumn Morning',
      location: 'University Library Reading Room',
      title: 'First rain against the high arched windows',
      story:
        'Sat at the oak table with warm tea and a fresh fountain pen. Everything clicked on the third proof.',
    },
  ];

  return {
    version: 1,
    notebookOpen: true,
    activePageId: p1.id,
    pages: [p1, p2, p3, p4, p5, p6, p7, p8],
    habits,
    habitLog,
    stickyNotes: [
      {
        id: 'note-1',
        pageId: p1.id,
        xPct: 68,
        yPct: 48,
        color: 'canary',
        text: 'Library closes at 21:00 today — bring fountain pen refill.',
        rotationDeg: 2.5,
      },
    ],
    tornObjects: [],
    preferences: DEFAULT_PREFERENCES,
    updatedAt: new Date().toISOString(),
  };
}
