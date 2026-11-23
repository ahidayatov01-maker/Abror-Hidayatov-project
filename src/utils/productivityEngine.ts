export type RoutineHorizon = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RoutineBlockCategory =
  | 'language_exam'
  | 'university_research'
  | 'application_docs'
  | 'academic_study'
  | 'scholarship_prep'
  | 'break_recovery'
  | 'personal';

export interface RoutineBlock {
  id: string;
  horizon: RoutineHorizon;
  title: string;
  slotLabel: string; // e.g., "07:30 - 09:00", "Monday", "Week 2", "Q2 (Apr-Jun)"
  durationMinutes: number;
  category: RoutineBlockCategory;
  notes?: string;
  completed: boolean;
  locked: boolean;
  userEdited: boolean;
  source: 'starter' | 'user' | 'ai';
  linkedSection?: 'my-academic-journey' | 'todo-list' | 'paper-journal' | 'scholarships';
}

export interface RoutineVersionSnapshot {
  id: string;
  createdAt: string;
  label: string;
  horizon: RoutineHorizon;
  blocks: RoutineBlock[];
}

export interface RoutineState {
  activeHorizon: RoutineHorizon;
  blocks: RoutineBlock[];
  versions: RoutineVersionSnapshot[];
  focusGoal: string;
  dailyCapacityHours: number;
  updatedAt: string;
}

export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoCategory =
  | 'Admissions'
  | 'Exams'
  | 'Scholarships'
  | 'Documents'
  | 'Research'
  | 'Financial'
  | 'Milestone'
  | 'Personal';

export type TodoFilterTab = 'all' | 'active' | 'completed' | 'overdue' | 'upcoming';

export interface TodoRecommendation {
  id: string;
  title: string;
  category: TodoCategory;
  priority: TodoPriority;
  suggestedDueDate: string | null;
  rationale: string;
  targetUniversitySlug?: string | null;
  agentId: string;
  createdAt: string;
}

export interface TodoTaskLike {
  id: number;
  title: string;
  category: string;
  targetUniversitySlug?: string | null;
  dueDate?: string | null;
  status: string;
  notes?: string | null;
}

export function createDefaultRoutineState(): RoutineState {
  const now = new Date().toISOString();
  return {
    activeHorizon: 'daily',
    focusGoal: 'International University Admission & Scholarship Readiness',
    dailyCapacityHours: 4,
    updatedAt: now,
    versions: [],
    blocks: [
      // Daily blocks (balanced with recovery)
      {
        id: 'rt-d-1',
        horizon: 'daily',
        title: 'IELTS / Academic English Reading & Listening Drill',
        slotLabel: '07:30 - 08:30',
        durationMinutes: 60,
        category: 'language_exam',
        notes: 'Timed practice section + error log review.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
        linkedSection: 'paper-journal',
      },
      {
        id: 'rt-d-2',
        horizon: 'daily',
        title: 'Short Break & Hydration Reset',
        slotLabel: '08:30 - 08:50',
        durationMinutes: 20,
        category: 'break_recovery',
        notes: 'Screen-free recovery before deep academic work.',
        completed: false,
        locked: true,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-d-3',
        horizon: 'daily',
        title: 'Target University & Program Requirements Audit',
        slotLabel: '16:30 - 17:30',
        durationMinutes: 60,
        category: 'university_research',
        notes: 'Verify prerequisites, language cutoffs, and tuition on official portals.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
        linkedSection: 'my-academic-journey',
      },
      {
        id: 'rt-d-4',
        horizon: 'daily',
        title: 'Core Subject / Standardized Exam Practice',
        slotLabel: '19:00 - 20:15',
        durationMinutes: 75,
        category: 'academic_study',
        notes: 'SAT Math / STEM fundamentals or major-specific coursework.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
        linkedSection: 'todo-list',
      },

      // Weekly blocks
      {
        id: 'rt-w-1',
        horizon: 'weekly',
        title: 'Monday–Wednesday: Deep Exam & Language Sprints',
        slotLabel: 'Mon – Wed',
        durationMinutes: 300,
        category: 'language_exam',
        notes: 'Focused practice blocks with mock test scoring.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-w-2',
        horizon: 'weekly',
        title: 'Thursday: Scholarship & Essay Drafting Clinic',
        slotLabel: 'Thursday',
        durationMinutes: 120,
        category: 'scholarship_prep',
        notes: 'Refine SOP paragraphs and scholarship motivation letters.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
        linkedSection: 'scholarships',
      },
      {
        id: 'rt-w-3',
        horizon: 'weekly',
        title: 'Saturday: Full Timed Practice Test + Roadmap Review',
        slotLabel: 'Saturday',
        durationMinutes: 180,
        category: 'academic_study',
        notes: 'Simulate test conditions and update Akademik yo\'lim milestones.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
        linkedSection: 'my-academic-journey',
      },
      {
        id: 'rt-w-4',
        horizon: 'weekly',
        title: 'Sunday: Rest, Light Reading & Weekly Reset',
        slotLabel: 'Sunday',
        durationMinutes: 60,
        category: 'break_recovery',
        notes: 'Prevent burnout and review next week priorities.',
        completed: false,
        locked: true,
        userEdited: false,
        source: 'starter',
      },

      // Monthly blocks
      {
        id: 'rt-m-1',
        horizon: 'monthly',
        title: 'Week 1: Shortlist Refinement & Admissions Audit',
        slotLabel: 'Week 1',
        durationMinutes: 240,
        category: 'university_research',
        notes: 'Lock Reach / Target / Safety universities and entry requirements.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-m-2',
        horizon: 'monthly',
        title: 'Week 2–3: Exam Score Milestone & Document Drafting',
        slotLabel: 'Weeks 2–3',
        durationMinutes: 480,
        category: 'application_docs',
        notes: 'Complete CV, transcripts audit, and recommender outreach.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-m-3',
        horizon: 'monthly',
        title: 'Week 4: Financial Budget & Scholarship Deadline Check',
        slotLabel: 'Week 4',
        durationMinutes: 180,
        category: 'scholarship_prep',
        notes: 'Verify budget gaps in Financial Planner and prepare funding dossiers.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },

      // Yearly blocks
      {
        id: 'rt-y-1',
        horizon: 'yearly',
        title: 'Q1 (Jan–Mar): Diagnostics, Country Selection & Exam Prep',
        slotLabel: 'Q1 · Jan–Mar',
        durationMinutes: 1200,
        category: 'language_exam',
        notes: 'Establish baseline scores and target country strategy.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-y-2',
        horizon: 'yearly',
        title: 'Q2 (Apr–Jun): Official Exams (IELTS/SAT) & MEXT/Embassy Windows',
        slotLabel: 'Q2 · Apr–Jun',
        durationMinutes: 1200,
        category: 'scholarship_prep',
        notes: 'Sit official language/aptitude exams; submit early embassy scholarships.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-y-3',
        horizon: 'yearly',
        title: 'Q3 (Jul–Sep): Application Essays, Portfolio & Reference Letters',
        slotLabel: 'Q3 · Jul–Sep',
        durationMinutes: 1200,
        category: 'application_docs',
        notes: 'Finalize personal statements, recommendation letters, and notarized translations.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
      {
        id: 'rt-y-4',
        horizon: 'yearly',
        title: 'Q4 (Oct–Dec): Portal Submissions, Interviews & Visa Preparation',
        slotLabel: 'Q4 · Oct–Dec',
        durationMinutes: 1200,
        category: 'university_research',
        notes: 'Submit early/regular applications, track offers, and prepare financial proofs.',
        completed: false,
        locked: false,
        userEdited: false,
        source: 'starter',
      },
    ],
  };
}

/**
 * Lock-safe merge when Smart Routine Architect regenerates a horizon:
 * Preserves ALL locked blocks and ALL user-edited blocks untouched,
 * while recording a version snapshot for rollback.
 */
export function mergeGeneratedRoutineWithLocks(
  state: RoutineState,
  horizon: RoutineHorizon,
  aiBlocks: Omit<RoutineBlock, 'id' | 'horizon' | 'locked' | 'userEdited' | 'source' | 'completed'>[],
  versionLabel = 'Before AI Routine Generation'
): RoutineState {
  const existingForHorizon = state.blocks.filter((b) => b.horizon === horizon);
  const otherHorizonBlocks = state.blocks.filter((b) => b.horizon !== horizon);

  const snapshot: RoutineVersionSnapshot = {
    id: `ver-${Date.now()}`,
    createdAt: new Date().toISOString(),
    label: versionLabel,
    horizon,
    blocks: existingForHorizon,
  };

  const preservedBlocks = existingForHorizon.filter((b) => b.locked || b.userEdited);
  const preservedTitleKeys = new Set(preservedBlocks.map((b) => b.title.trim().toLowerCase()));

  const normalizedIncoming: RoutineBlock[] = aiBlocks
    .filter((b) => b.title && b.title.trim().length > 0)
    .filter((b) => !preservedTitleKeys.has(b.title.trim().toLowerCase()))
    .map((b, idx) => ({
      id: `rt-ai-${horizon}-${Date.now()}-${idx}`,
      horizon,
      title: b.title.trim(),
      slotLabel: b.slotLabel?.trim() || `Block ${idx + 1}`,
      durationMinutes: Math.max(10, Math.min(480, Math.round(Number(b.durationMinutes) || 45))),
      category: b.category || 'academic_study',
      notes: b.notes?.trim() || '',
      completed: false,
      locked: false,
      userEdited: false,
      source: 'ai',
      linkedSection: b.linkedSection,
    }));

  return {
    ...state,
    blocks: [...otherHorizonBlocks, ...preservedBlocks, ...normalizedIncoming],
    versions: [snapshot, ...state.versions].slice(0, 8),
    updatedAt: new Date().toISOString(),
  };
}

export interface RoutineCapacitySummary {
  totalMinutes: number;
  studyMinutes: number;
  breakMinutes: number;
  completedCount: number;
  totalCount: number;
  lockedCount: number;
  warnings: string[];
}

export function validateRoutineCapacity(
  blocks: RoutineBlock[],
  horizon: RoutineHorizon
): RoutineCapacitySummary {
  const scoped = blocks.filter((b) => b.horizon === horizon);
  let totalMinutes = 0;
  let studyMinutes = 0;
  let breakMinutes = 0;
  let completedCount = 0;
  let lockedCount = 0;

  for (const b of scoped) {
    totalMinutes += b.durationMinutes;
    if (b.category === 'break_recovery') {
      breakMinutes += b.durationMinutes;
    } else {
      studyMinutes += b.durationMinutes;
    }
    if (b.completed) completedCount += 1;
    if (b.locked) lockedCount += 1;
  }

  const warnings: string[] = [];
  if (horizon === 'daily') {
    if (studyMinutes > 600) {
      warnings.push(
        'Daily study load exceeds 10 hours. Consider reducing scope or adding recovery buffers to prevent burnout.'
      );
    }
    if (studyMinutes >= 150 && breakMinutes === 0) {
      warnings.push('Add at least one short break or recovery block to sustain focus.');
    }
  }

  return {
    totalMinutes,
    studyMinutes,
    breakMinutes,
    completedCount,
    totalCount: scoped.length,
    lockedCount,
    warnings,
  };
}

export function normalizeTaskKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\u3040-\u30ff\u4e00-\u9faf]+/g, ' ')
    .trim();
}

export function isDuplicateTask(
  existingTasks: Pick<TodoTaskLike, 'title' | 'status'>[],
  candidateTitle: string
): boolean {
  const key = normalizeTaskKey(candidateTitle);
  if (!key) return true;
  return existingTasks.some(
    (t) => t.status !== 'completed' && normalizeTaskKey(t.title) === key
  );
}

export function filterTodoTasks<T extends TodoTaskLike>(
  tasks: T[],
  filter: TodoFilterTab,
  searchQuery: string,
  todayISO: string
): T[] {
  const q = searchQuery.trim().toLowerCase();
  return tasks.filter((task) => {
    if (q) {
      const hay = `${task.title} ${task.category} ${task.notes || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    const isDone = task.status === 'completed';
    const due = task.dueDate ? task.dueDate.slice(0, 10) : null;
    const isOverdue = !isDone && Boolean(due && due < todayISO);
    const isUpcoming = !isDone && Boolean(due && due >= todayISO);

    switch (filter) {
      case 'active':
        return !isDone;
      case 'completed':
        return isDone;
      case 'overdue':
        return isOverdue;
      case 'upcoming':
        return isUpcoming;
      case 'all':
      default:
        return true;
    }
  });
}
