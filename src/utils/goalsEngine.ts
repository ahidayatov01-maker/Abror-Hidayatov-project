import {
  CERTIFICATES_CATALOG,
  getCertificateById,
  type CertificateCategoryId,
  type CertificateRecord,
  type ScoringFormatType,
} from '../data/certificatesCatalog';
import {
  COUNTRY_QUALIFICATION_PROFILES,
  getCountryQualificationProfile,
  type CountryQualificationProfile,
  type EvidenceStatusTag,
} from '../data/countryQualificationRules';

export type GoalType = 'score' | 'level' | 'binary' | 'quantitative' | 'milestone';

export type GoalCategoryId =
  | 'language_certificates'
  | 'math_sciences'
  | 'national_certificates'
  | 'it_professional'
  | 'universities_scholarships'
  | 'programming_tech'
  | 'personal_development'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export type GoalLifecycleOverride = 'active' | 'paused' | 'achieved' | 'archived';

export type GoalComputedStatus =
  | 'planned'
  | 'in_progress'
  | 'approaching'
  | 'overdue'
  | 'achieved'
  | 'paused'
  | 'archived';

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null; // YYYY-MM-DD
  completed: boolean;
}

export interface GoalEvidence {
  id: string;
  label: string;
  referenceUrl?: string;
  evidenceType: 'score_report' | 'certificate' | 'portfolio' | 'practice_test' | 'note';
  addedAt: string;
}

export interface GoalSyncProposal {
  routineBlocks: Array<{
    id: string;
    title: string;
    slotLabel: string;
    durationMinutes: number;
    category: 'language_exam' | 'academic_study' | 'scholarship_prep' | 'application_docs' | 'break_recovery';
    notes: string;
  }>;
  todoTasks: Array<{
    id: string;
    title: string;
    category: 'Exams' | 'Admissions' | 'Scholarships' | 'Documents' | 'Research' | 'Milestone';
    dueDate?: string | null;
    notes: string;
  }>;
  habits: Array<{
    id: string;
    title: string;
    category: 'Education' | 'Language Learning' | 'Programming' | 'Reading' | 'Personal Development';
    targetMinutes: number;
    frequency: 'daily' | 'custom_weekly';
  }>;
  roadmapMilestoneTitle?: string;
  librarySearchQuery?: string;
}

export interface GoalPreparationPlan {
  id: string;
  generatedAt: string;
  generatedByAgents: string[];
  modelUsed: string;
  goalAnalysis: string;
  currentPositionAssessment: string;
  clarificationNeeded?: string | null;
  stages: Array<{ title: string; durationLabel: string; focus: string }>;
  weeklyTargets: string[];
  monthlyMilestones: string[];
  dailyStudyAllocationNote: string;
  reviewSessions: string[];
  practiceRecommendations: string[];
  progressCheckpoints: string[];
  fallbackStrategy: string;
  syncProposals: GoalSyncProposal;
  syncedTargets: {
    routine?: string[];
    todo?: string[];
    habits?: string[];
    roadmap?: boolean;
    library?: boolean;
  };
}

export interface GoalRecord {
  id: string;
  title: string;
  description?: string;
  category: GoalCategoryId;
  customCategoryLabel?: string;
  goalType: GoalType;
  certificateId?: string | null;
  startDate: string; // YYYY-MM-DD
  targetDate?: string | null; // YYYY-MM-DD (optional — edge case supported)
  // Score / Quantitative values
  baselineNumeric?: number | null;
  currentNumeric?: number | null;
  targetNumeric?: number | null;
  numericUnit?: string;
  // Level values (e.g., JLPT N5..N1, CEFR A1..C2)
  levelScale?: string[];
  currentLevel?: string | null;
  targetLevel?: string | null;
  // Binary / Manual progress
  binaryState?: 'not_started' | 'in_progress' | 'achieved';
  // Milestones
  milestones: GoalMilestone[];
  priority: GoalPriority;
  lifecycleOverride: GoalLifecycleOverride;
  motivation: string;
  targetCountry?: string | null;
  targetUniversitySlug?: string | null;
  relatedRoadmapStationId?: string | null;
  linkedLibraryMaterialIds: string[];
  estimatedBudgetUsd?: number | null;
  studyResourcesNote?: string;
  personalNotes?: string;
  dependsOnGoalIds: string[];
  evidence: GoalEvidence[];
  aiPlan?: GoalPreparationPlan | null;
  createdAt: string;
  updatedAt: string;
  achievedAt?: string | null;
}

export interface GoalGroupMember {
  goalId: string;
  weight?: number | null; // optional custom weight (0-100)
}

export interface GoalGroup {
  id: string;
  title: string;
  description: string;
  targetCountry?: string | null;
  targetUniversityName?: string | null;
  targetDate?: string | null;
  priority: GoalPriority;
  members: GoalGroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface SimulatorSelectedQualification {
  id: string;
  certificateId: string;
  status: 'obtained' | 'planned';
  currentScoreOrLevel: string;
  targetScoreOrLevel: string;
}

export interface GoalsWorkspaceState {
  goals: GoalRecord[];
  groups: GoalGroup[];
  favoriteCertificateIds: string[];
  recentlyViewedCertificateIds: string[];
  compareCertificateIds: string[];
  simulatorCountryCode: string;
  simulatorCompareCountryCode: string | null;
  simulatorSelections: SimulatorSelectedQualification[];
  updatedAt: string;
}

// Non-linear cumulative effort weights for categorical proficiency levels
// (e.g., JLPT N5 -> N4 -> N3 -> N2 -> N1 is NOT evenly spaced!)
const NON_LINEAR_LEVEL_EFFORT: Record<string, Record<string, number>> = {
  jlpt: {
    None: 0,
    N5: 10,
    N4: 22,
    N3: 42,
    N2: 68,
    N1: 100,
  },
  cefr: {
    None: 0,
    A1: 10,
    A2: 22,
    B1: 40,
    B2: 62,
    C1: 84,
    C2: 100,
  },
  topik: {
    None: 0,
    'Level 1': 10,
    'Level 2': 22,
    'Level 3': 42,
    'Level 4': 62,
    'Level 5': 82,
    'Level 6': 100,
  },
  hsk: {
    None: 0,
    'HSK 1': 8,
    'HSK 2': 16,
    'HSK 3': 28,
    'HSK 4': 44,
    'HSK 5': 64,
    'HSK 6': 82,
    'HSK 7–9': 100,
  },
  uz_grade: {
    None: 0,
    C: 35,
    'C+': 48,
    B: 62,
    'B+': 75,
    A: 88,
    'A+': 100,
  },
};

function resolveNonLinearLevelWeight(level: string, scale: string[]): number | null {
  const clean = level.trim();
  const joined = scale.join('|').toLowerCase();
  let table: Record<string, number> | null = null;
  if (joined.includes('n5') && joined.includes('n1')) table = NON_LINEAR_LEVEL_EFFORT.jlpt;
  else if (joined.includes('a1') && joined.includes('c2')) table = NON_LINEAR_LEVEL_EFFORT.cefr;
  else if (joined.includes('b1') && joined.includes('c1')) table = NON_LINEAR_LEVEL_EFFORT.cefr;
  else if (joined.includes('level 3') && joined.includes('level 6')) table = NON_LINEAR_LEVEL_EFFORT.topik;
  else if (joined.includes('hsk 1')) table = NON_LINEAR_LEVEL_EFFORT.hsk;
  else if (joined.includes('a+') && joined.includes('b+')) table = NON_LINEAR_LEVEL_EFFORT.uz_grade;

  if (table && Object.prototype.hasOwnProperty.call(table, clean)) {
    return table[clean];
  }
  return null;
}

export function getLocalTodayIsoDate(referenceDate = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const d = String(referenceDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalIsoDate(dateStr?: string | null): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return null;
  const [y, m, d] = dateStr.trim().split('-').map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/**
 * Computes exact remaining calendar days using local midnight boundaries.
 * Returns null if no targetDate is set. Negative values indicate days past targetDate.
 */
export function computeRemainingDays(
  targetDate?: string | null,
  todayIso = getLocalTodayIsoDate()
): number | null {
  const target = parseLocalIsoDate(targetDate);
  const today = parseLocalIsoDate(todayIso);
  if (!target || !today) return null;
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86_400_000);
}

/**
 * Computes objective, mathematically defensible progress (0–100) for each goal type.
 * Returns null when progress cannot be computed without inventing values (e.g., missing scores).
 */
export function computeGoalProgress(goal: GoalRecord): {
  percent: number | null;
  basisLabel: string;
} {
  if (goal.lifecycleOverride === 'achieved') {
    return { percent: 100, basisLabel: 'Achieved' };
  }

  switch (goal.goalType) {
    case 'binary': {
      if (goal.binaryState === 'achieved') return { percent: 100, basisLabel: 'Completed' };
      if (goal.binaryState === 'in_progress') {
        if (goal.milestones.length > 0) {
          const done = goal.milestones.filter((m) => m.completed).length;
          return {
            percent: Math.round((done / goal.milestones.length) * 100),
            basisLabel: `${done}/${goal.milestones.length} milestones`,
          };
        }
        return { percent: 50, basisLabel: 'In progress' };
      }
      return { percent: 0, basisLabel: 'Not started' };
    }

    case 'milestone': {
      if (goal.milestones.length === 0) {
        return { percent: 0, basisLabel: 'No milestones added' };
      }
      const done = goal.milestones.filter((m) => m.completed).length;
      return {
        percent: Math.round((done / goal.milestones.length) * 100),
        basisLabel: `${done}/${goal.milestones.length} milestones`,
      };
    }

    case 'quantitative': {
      const target = goal.targetNumeric;
      const current = goal.currentNumeric;
      if (target == null || target <= 0 || current == null) {
        return { percent: null, basisLabel: 'Set current & target count' };
      }
      const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
      return {
        percent: pct,
        basisLabel: `${current}/${target}${goal.numericUnit ? ` ${goal.numericUnit}` : ''}`,
      };
    }

    case 'score': {
      const target = goal.targetNumeric;
      const current = goal.currentNumeric;
      if (target == null || current == null) {
        return { percent: null, basisLabel: 'Enter current & target score' };
      }
      if (current >= target) {
        return { percent: 100, basisLabel: `${current} / ${target}` };
      }
      const cert = getCertificateById(goal.certificateId);
      const floor =
        goal.baselineNumeric != null && goal.baselineNumeric < target
          ? goal.baselineNumeric
          : cert?.scoringModel.minScore ?? 0;
      const denom = target - floor;
      if (denom <= 0) {
        return { percent: 0, basisLabel: `${current} / ${target}` };
      }
      const ratio = (current - floor) / denom;
      return {
        percent: Math.max(0, Math.min(100, Math.round(ratio * 100))),
        basisLabel: `${current} → ${target}`,
      };
    }

    case 'level': {
      const scale =
        goal.levelScale && goal.levelScale.length > 1
          ? goal.levelScale
          : getCertificateById(goal.certificateId)?.scoringModel.levels || [];
      if (!goal.targetLevel || scale.length < 2) {
        return { percent: null, basisLabel: 'Select proficiency level' };
      }
      const currentLvl = goal.currentLevel || scale[0];
      const curIdx = scale.indexOf(currentLvl);
      const tgtIdx = scale.indexOf(goal.targetLevel);
      if (tgtIdx <= 0) return { percent: 0, basisLabel: `${currentLvl} → ${goal.targetLevel}` };
      if (curIdx >= tgtIdx && curIdx >= 0) {
        return { percent: 100, basisLabel: `${currentLvl} (target reached)` };
      }

      // Use non-linear cumulative proficiency weights when available (JLPT, CEFR, TOPIK, HSK)
      const curEffort = resolveNonLinearLevelWeight(currentLvl, scale);
      const tgtEffort = resolveNonLinearLevelWeight(goal.targetLevel, scale);
      if (curEffort !== null && tgtEffort !== null && tgtEffort > 0) {
        const pct = Math.max(0, Math.min(100, Math.round((curEffort / tgtEffort) * 100)));
        return {
          percent: pct,
          basisLabel: `${currentLvl} → ${goal.targetLevel} (non-linear effort scale)`,
        };
      }

      // Fallback ordinal steps when scale is custom
      const safeCur = Math.max(0, curIdx);
      const pct = Math.max(0, Math.min(100, Math.round((safeCur / tgtIdx) * 100)));
      return {
        percent: pct,
        basisLabel: `${currentLvl} → ${goal.targetLevel}`,
      };
    }
  }
}

/**
 * Computes dynamic lifecycle status from actual dates and completion conditions.
 * CRITICAL RULE: An achieved goal NEVER becomes overdue even if its targetDate has passed.
 */
export function computeDynamicGoalStatus(
  goal: GoalRecord,
  todayIso = getLocalTodayIsoDate()
): GoalComputedStatus {
  if (goal.lifecycleOverride === 'achieved') return 'achieved';
  if (goal.lifecycleOverride === 'archived') return 'archived';
  if (goal.lifecycleOverride === 'paused') return 'paused';

  const progress = computeGoalProgress(goal);
  if (progress.percent === 100 && goal.achievedAt) {
    return 'achieved';
  }

  const remaining = computeRemainingDays(goal.targetDate, todayIso);
  if (remaining !== null && remaining < 0) {
    return 'overdue';
  }
  if (remaining !== null && remaining <= 21) {
    return 'approaching';
  }

  const start = parseLocalIsoDate(goal.startDate);
  const today = parseLocalIsoDate(todayIso);
  if (start && today && start.getTime() > today.getTime() && (progress.percent ?? 0) === 0) {
    return 'planned';
  }

  if ((progress.percent ?? 0) === 0 && goal.goalType === 'binary' && goal.binaryState === 'not_started') {
    return 'planned';
  }

  return 'in_progress';
}

export function countActiveGoals(goals: GoalRecord[]): number {
  return goals.filter(
    (g) => g.lifecycleOverride !== 'achieved' && g.lifecycleOverride !== 'archived'
  ).length;
}

export function hasDuplicateCertificateGoal(
  goals: GoalRecord[],
  certificateId: string
): boolean {
  return goals.some(
    (g) =>
      g.certificateId === certificateId &&
      g.lifecycleOverride !== 'archived'
  );
}

/**
 * Computes weighted progress for a Goal Cluster (GoalGroup).
 * Uses user-provided weights when specified; falls back to normalized equal weights only when unspecified.
 */
export function computeClusterWeightedProgress(
  group: GoalGroup,
  goals: GoalRecord[]
): {
  percent: number | null;
  totalConfiguredWeight: number;
  usesCustomWeights: boolean;
  resolvedMembers: Array<{
    goal: GoalRecord;
    weightPercent: number;
    goalProgress: number | null;
  }>;
} {
  const foundMembers = group.members
    .map((m) => ({
      member: m,
      goal: goals.find((g) => g.id === m.goalId),
    }))
    .filter((entry): entry is { member: GoalGroupMember; goal: GoalRecord } => Boolean(entry.goal));

  if (foundMembers.length === 0) {
    return {
      percent: null,
      totalConfiguredWeight: 0,
      usesCustomWeights: false,
      resolvedMembers: [],
    };
  }

  const hasCustomWeights = foundMembers.some(
    (x) => typeof x.member.weight === 'number' && x.member.weight > 0
  );
  const rawTotal = hasCustomWeights
    ? foundMembers.reduce((acc, x) => acc + Math.max(0, x.member.weight ?? 0), 0)
    : foundMembers.length;

  let weightedSum = 0;
  let computableWeightSum = 0;

  const resolvedMembers = foundMembers.map(({ member, goal }) => {
    const rawWeight = hasCustomWeights ? Math.max(0, member.weight ?? 0) : 1;
    const weightPercent = rawTotal > 0 ? Math.round((rawWeight / rawTotal) * 100) : 0;
    const gp = computeGoalProgress(goal).percent;
    if (gp !== null && rawWeight > 0) {
      weightedSum += gp * rawWeight;
      computableWeightSum += rawWeight;
    }
    return { goal, weightPercent, goalProgress: gp };
  });

  return {
    percent: computableWeightSum > 0 ? Math.round(weightedSum / computableWeightSum) : null,
    totalConfiguredWeight: hasCustomWeights
      ? Math.round(foundMembers.reduce((a, b) => a + (b.member.weight ?? 0), 0))
      : 100,
    usesCustomWeights: hasCustomWeights,
    resolvedMembers,
  };
}

export interface DeadlineConflict {
  goalAId: string;
  goalATitle: string;
  goalBId: string;
  goalBTitle: string;
  daysApart: number;
  message: string;
}

/**
 * Detects active goals whose target dates fall within 7 days of each other (exam scheduling conflict).
 */
export function detectDeadlineConflicts(
  goals: GoalRecord[],
  thresholdDays = 7
): DeadlineConflict[] {
  const activeDated = goals.filter(
    (g) =>
      g.lifecycleOverride !== 'achieved' &&
      g.lifecycleOverride !== 'archived' &&
      Boolean(parseLocalIsoDate(g.targetDate))
  );

  const conflicts: DeadlineConflict[] = [];
  for (let i = 0; i < activeDated.length; i++) {
    for (let j = i + 1; j < activeDated.length; j++) {
      const a = activeDated[i];
      const b = activeDated[j];
      const dA = parseLocalIsoDate(a.targetDate)!;
      const dB = parseLocalIsoDate(b.targetDate)!;
      const daysApart = Math.abs(Math.round((dA.getTime() - dB.getTime()) / 86_400_000));
      if (daysApart <= thresholdDays) {
        conflicts.push({
          goalAId: a.id,
          goalATitle: a.title,
          goalBId: b.id,
          goalBTitle: b.title,
          daysApart,
          message:
            daysApart === 0
              ? `"${a.title}" and "${b.title}" share the exact same target date (${a.targetDate}). Consider staggering preparation checkpoints.`
              : `"${a.title}" (${a.targetDate}) and "${b.title}" (${b.targetDate}) are only ${daysApart} days apart. Plan buffer time between exam sittings.`,
        });
      }
    }
  }
  return conflicts;
}

export interface DeadlineRiskItem {
  goalId: string;
  goalTitle: string;
  severity: 'attention' | 'elevated';
  reason: string;
  supportiveAction: string;
}

export function analyzeDeadlineRisks(
  goals: GoalRecord[],
  todayIso = getLocalTodayIsoDate()
): DeadlineRiskItem[] {
  const risks: DeadlineRiskItem[] = [];
  const active = goals.filter(
    (g) =>
      g.lifecycleOverride !== 'achieved' &&
      g.lifecycleOverride !== 'archived' &&
      g.lifecycleOverride !== 'paused'
  );

  for (const goal of active) {
    const remaining = computeRemainingDays(goal.targetDate, todayIso);
    const progress = computeGoalProgress(goal).percent;

    // 1. Overdue
    if (remaining !== null && remaining < 0) {
      risks.push({
        goalId: goal.id,
        goalTitle: goal.title,
        severity: 'elevated',
        reason: `Target date (${goal.targetDate}) passed ${Math.abs(remaining)} day(s) ago.`,
        supportiveAction: 'Review whether to adjust the target date to the next official exam window or update your current result.',
      });
      continue;
    }

    // 2. Nearby deadline with low measurable progress
    if (remaining !== null && remaining <= 30 && progress !== null && progress < 50) {
      risks.push({
        goalId: goal.id,
        goalTitle: goal.title,
        severity: 'elevated',
        reason: `Only ${remaining} days left while current progress is ${progress}%.`,
        supportiveAction: 'Focus on high-yield timed mock practice or shift the target sitting to avoid unnecessary stress.',
      });
      continue;
    }

    // 3. Unmet prerequisite dependency
    if (goal.dependsOnGoalIds.length > 0) {
      const unmetDeps = goal.dependsOnGoalIds
        .map((id) => goals.find((g) => g.id === id))
        .filter((dep): dep is GoalRecord => dep != null && dep.lifecycleOverride !== 'achieved');
      if (unmetDeps.length > 0 && remaining !== null && remaining <= 45) {
        risks.push({
          goalId: goal.id,
          goalTitle: goal.title,
          severity: 'attention',
          reason: `Depends on unfinished prerequisite: ${unmetDeps.map((d) => d.title).join(', ')}.`,
          supportiveAction: 'Prioritize completing the prerequisite milestone first or decouple the schedule.',
        });
      }
    }
  }

  return risks;
}

export interface DailyPriorityRecommendation {
  goalId: string | null;
  goalTitle: string;
  actionText: string;
  rationale: string;
  remainingDays: number | null;
}

export function computeDailyPriorityAction(
  goals: GoalRecord[],
  todayIso = getLocalTodayIsoDate()
): DailyPriorityRecommendation {
  const active = goals.filter(
    (g) =>
      g.lifecycleOverride !== 'achieved' &&
      g.lifecycleOverride !== 'archived' &&
      g.lifecycleOverride !== 'paused'
  );

  if (active.length === 0) {
    return {
      goalId: null,
      goalTitle: 'Maqsadlar',
      actionText: 'Explore the Certificate Explorer and create your first measurable academic goal.',
      rationale: 'Defining a concrete target score and realistic date unlocks tailored AI planning.',
      remainingDays: null,
    };
  }

  const priorityWeight: Record<GoalPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const ranked = [...active].sort((a, b) => {
    const remA = computeRemainingDays(a.targetDate, todayIso);
    const remB = computeRemainingDays(b.targetDate, todayIso);
    const urgA = remA !== null ? (remA <= 14 ? 50 : remA <= 45 ? 25 : 5) : 0;
    const urgB = remB !== null ? (remB <= 14 ? 50 : remB <= 45 ? 25 : 5) : 0;
    const scoreA = urgA + priorityWeight[a.priority] * 8;
    const scoreB = urgB + priorityWeight[b.priority] * 8;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (remA ?? 9999) - (remB ?? 9999);
  });

  const top = ranked[0];
  const remaining = computeRemainingDays(top.targetDate, todayIso);
  const nextMilestone = top.milestones.find((m) => !m.completed);

  let actionText = `Dedicate a focused 45-minute preparation block toward "${top.title}".`;
  if (nextMilestone) {
    actionText = `Complete next milestone for "${top.title}": ${nextMilestone.title}.`;
  } else if (top.certificateId === 'ielts-academic' || top.certificateId === 'ielts-general') {
    actionText = `Complete one timed IELTS Reading or Writing practice section for "${top.title}" and log mistakes.`;
  } else if (top.certificateId === 'jlpt') {
    actionText = `Run a 30-minute JLPT Kanji/Grammar & Listening drill targeting ${top.targetLevel || 'your next level'}.`;
  } else if (top.certificateId === 'digital-sat') {
    actionText = `Solve one timed Digital SAT Math or Reading/Writing module on Bluebook/Khan Academy.`;
  }

  const rationale =
    remaining !== null
      ? remaining < 0
        ? `Target date passed ${Math.abs(remaining)} days ago — update date or log latest score.`
        : `${remaining} days remaining · ${top.priority.toUpperCase()} priority.`
      : `${top.priority.toUpperCase()} priority active goal without a fixed deadline yet.`;

  return {
    goalId: top.id,
    goalTitle: top.title,
    actionText,
    rationale,
    remainingDays: remaining,
  };
}

export interface Next7DaysSummary {
  upcomingDeadlines: Array<{ goalId: string; title: string; targetDate: string; remainingDays: number }>;
  upcomingMilestones: Array<{ goalId: string; goalTitle: string; milestoneTitle: string; targetDate: string }>;
  atRiskCount: number;
  conflictsCount: number;
}

export function computeNext7DaysAgenda(
  goals: GoalRecord[],
  todayIso = getLocalTodayIsoDate()
): Next7DaysSummary {
  const active = goals.filter(
    (g) => g.lifecycleOverride !== 'achieved' && g.lifecycleOverride !== 'archived'
  );

  const upcomingDeadlines: Next7DaysSummary['upcomingDeadlines'] = [];
  const upcomingMilestones: Next7DaysSummary['upcomingMilestones'] = [];

  for (const g of active) {
    const rem = computeRemainingDays(g.targetDate, todayIso);
    if (rem !== null && rem >= 0 && rem <= 14 && g.targetDate) {
      upcomingDeadlines.push({
        goalId: g.id,
        title: g.title,
        targetDate: g.targetDate,
        remainingDays: rem,
      });
    }
    for (const ms of g.milestones) {
      if (ms.completed || !ms.targetDate) continue;
      const msRem = computeRemainingDays(ms.targetDate, todayIso);
      if (msRem !== null && msRem >= 0 && msRem <= 7) {
        upcomingMilestones.push({
          goalId: g.id,
          goalTitle: g.title,
          milestoneTitle: ms.title,
          targetDate: ms.targetDate,
        });
      }
    }
  }

  upcomingDeadlines.sort((a, b) => a.remainingDays - b.remainingDays);
  upcomingMilestones.sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return {
    upcomingDeadlines,
    upcomingMilestones,
    atRiskCount: analyzeDeadlineRisks(goals, todayIso).length,
    conflictsCount: detectDeadlineConflicts(goals).length,
  };
}

export interface GoalsAnalyticsSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  overdueGoals: number;
  pausedGoals: number;
  archivedGoals: number;
  averageComputableProgress: number | null;
  categoryDistribution: Array<{ category: GoalCategoryId; count: number; achievedCount: number }>;
  monthlyAchievements: Array<{ monthKey: string; count: number }>;
  nearestDeadline: { goalTitle: string; targetDate: string; remainingDays: number } | null;
}

export function computeGoalsAnalytics(
  goals: GoalRecord[],
  todayIso = getLocalTodayIsoDate()
): GoalsAnalyticsSummary {
  let activeGoals = 0;
  let achievedGoals = 0;
  let overdueGoals = 0;
  let pausedGoals = 0;
  let archivedGoals = 0;
  const computablePercents: number[] = [];
  const catMap = new Map<GoalCategoryId, { count: number; achievedCount: number }>();
  const monthMap = new Map<string, number>();
  let nearest: { goalTitle: string; targetDate: string; remainingDays: number } | null = null;

  for (const g of goals) {
    const status = computeDynamicGoalStatus(g, todayIso);
    if (status === 'achieved') achievedGoals++;
    else if (status === 'archived') archivedGoals++;
    else if (status === 'paused') {
      pausedGoals++;
      activeGoals++;
    } else {
      activeGoals++;
      if (status === 'overdue') overdueGoals++;
    }

    if (status !== 'archived') {
      const p = computeGoalProgress(g).percent;
      if (p !== null) computablePercents.push(p);
    }

    const prevCat = catMap.get(g.category) || { count: 0, achievedCount: 0 };
    prevCat.count += 1;
    if (status === 'achieved') prevCat.achievedCount += 1;
    catMap.set(g.category, prevCat);

    if (status === 'achieved' && g.achievedAt) {
      const mKey = g.achievedAt.slice(0, 7);
      monthMap.set(mKey, (monthMap.get(mKey) || 0) + 1);
    }

    if (status !== 'achieved' && status !== 'archived' && g.targetDate) {
      const rem = computeRemainingDays(g.targetDate, todayIso);
      if (rem !== null && rem >= 0) {
        if (!nearest || rem < nearest.remainingDays) {
          nearest = { goalTitle: g.title, targetDate: g.targetDate, remainingDays: rem };
        }
      }
    }
  }

  return {
    totalGoals: goals.filter((g) => g.lifecycleOverride !== 'archived').length,
    activeGoals,
    achievedGoals,
    overdueGoals,
    pausedGoals,
    archivedGoals,
    averageComputableProgress:
      computablePercents.length > 0
        ? Math.round(computablePercents.reduce((a, b) => a + b, 0) / computablePercents.length)
        : null,
    categoryDistribution: Array.from(catMap.entries()).map(([category, v]) => ({
      category,
      count: v.count,
      achievedCount: v.achievedCount,
    })),
    monthlyAchievements: Array.from(monthMap.entries())
      .map(([monthKey, count]) => ({ monthKey, count }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    nearestDeadline: nearest,
  };
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function computeAchievementBadges(goals: GoalRecord[]): AchievementBadge[] {
  const nonArchived = goals.filter((g) => g.lifecycleOverride !== 'archived');
  const achievedCount = nonArchived.filter((g) => g.lifecycleOverride === 'achieved').length;
  const maxProgress = nonArchived.reduce((mx, g) => {
    const p = computeGoalProgress(g).percent ?? 0;
    return Math.max(mx, p);
  }, 0);

  return [
    {
      id: 'first-goal',
      title: 'First Milestone Set',
      description: 'Created your first structured personal goal.',
      unlocked: nonArchived.length >= 1,
    },
    {
      id: 'quarter-progress',
      title: 'Momentum 25%',
      description: 'Reached at least 25% verified progress on a goal.',
      unlocked: maxProgress >= 25,
    },
    {
      id: 'halfway',
      title: 'Halfway Mark',
      description: 'Crossed 50% measurable progress toward a target.',
      unlocked: maxProgress >= 50,
    },
    {
      id: 'first-achieved',
      title: 'Target Reached',
      description: 'Completed and achieved your first goal.',
      unlocked: achievedCount >= 1,
    },
    {
      id: 'multi-achieved',
      title: 'Consistent Achiever',
      description: 'Achieved 3 or more personal goals.',
      unlocked: achievedCount >= 3,
    },
  ];
}

// =========================================================================
// CERTIFICATE EXPLORER FILTERING & SORTING
// =========================================================================
export interface CertificateFilterOptions {
  search: string;
  category: CertificateCategoryId | 'all';
  languageOrSubcategory: string; // 'all' or value
  countryCode: string; // 'all' or ISO code
  scoreFormat: ScoringFormatType | 'all';
  onlyFavorites: boolean;
  favoriteIds: string[];
  sortBy: 'popularity' | 'fee_asc' | 'fee_desc' | 'validity';
}

export function filterAndSortCertificates(
  certificates: CertificateRecord[],
  opts: CertificateFilterOptions
): CertificateRecord[] {
  const q = opts.search.trim().toLowerCase();
  const filtered = certificates.filter((c) => {
    if (opts.onlyFavorites && !opts.favoriteIds.includes(c.id)) return false;
    if (opts.category !== 'all' && c.category !== opts.category) return false;
    if (
      opts.languageOrSubcategory !== 'all' &&
      c.subcategory.toLowerCase() !== opts.languageOrSubcategory.toLowerCase()
    ) {
      return false;
    }
    if (
      opts.countryCode !== 'all' &&
      !c.countryAvailability.includes('GLOBAL') &&
      !c.countryAvailability.includes(opts.countryCode)
    ) {
      return false;
    }
    if (opts.scoreFormat !== 'all' && c.scoringModel.format !== opts.scoreFormat) {
      return false;
    }
    if (q) {
      const hay = `${c.officialName} ${c.shortName} ${c.subcategory} ${c.languageOrSubject} ${c.issuingOrganization} ${c.summary}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (opts.sortBy === 'fee_asc') {
      return (a.fee.approximateAmount ?? 99999) - (b.fee.approximateAmount ?? 99999);
    }
    if (opts.sortBy === 'fee_desc') {
      return (b.fee.approximateAmount ?? -1) - (a.fee.approximateAmount ?? -1);
    }
    if (opts.sortBy === 'validity') {
      const valA = a.validityYearsNumeric === null ? 99 : a.validityYearsNumeric;
      const valB = b.validityYearsNumeric === null ? 99 : b.validityYearsNumeric;
      return valB - valA;
    }
    return a.popularityRank - b.popularityRank;
  });
}

// =========================================================================
// COUNTRY VALUE & OPPORTUNITY SIMULATOR ENGINE
// =========================================================================
export interface CountrySimulationOutput {
  country: CountryQualificationProfile | null;
  countryCode: string;
  hasVerifiedProfile: boolean;
  selectedDetails: Array<{
    selection: SimulatorSelectedQualification;
    certificate: CertificateRecord;
    countryRelevanceNote: string;
    evidenceStatus: EvidenceStatusTag;
  }>;
  universityInsights: Array<{
    trackTitle: string;
    instructionLanguage: string;
    matchSummary: string;
    acceptedExams: string[];
    typicalThresholds: string;
    universityTiers: string[];
    prerequisitesNote: string;
    evidenceStatus: EvidenceStatusTag;
    sourceOrg: string;
    sourceUrl: string;
    lastVerifiedAt: string;
  }>;
  careerInsights: Array<{
    sector: string;
    certificateRole: string;
    matchedCertificates: string[];
    languageExpectations: string;
    educationAndExperience: string;
    licensingNote?: string;
    realisticCaveat: string;
    evidenceStatus: EvidenceStatusTag;
  }>;
  scholarshipVisaInsights: Array<{
    programName: string;
    type: string;
    matchedCertificates: string[];
    eligibilitySummary: string;
    cautionNote: string;
    evidenceStatus: EvidenceStatusTag;
    sourceUrl: string;
    lastVerifiedAt: string;
  }>;
  studentWorkAuthorizationNote: string;
  disclaimer: string;
}

export function simulateCountryOpportunity(
  countryCode: string,
  selections: SimulatorSelectedQualification[]
): CountrySimulationOutput {
  const profile = getCountryQualificationProfile(countryCode);
  const disclaimer =
    'Educational planning tool only — not an official university admission, employment, legal, or immigration decision service. Always confirm current thresholds and policies on official institutional or government portals.';

  if (!profile) {
    return {
      country: null,
      countryCode,
      hasVerifiedProfile: false,
      selectedDetails: selections
        .map((sel) => {
          const cert = getCertificateById(sel.certificateId);
          if (!cert) return null;
          return {
            selection: sel,
            certificate: cert,
            countryRelevanceNote:
              "Ma'lumot tasdiqlanmagan — country-specific qualification rules are not yet verified in the database for this country.",
            evidenceStatus: 'requires_confirmation' as EvidenceStatusTag,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
      universityInsights: [],
      careerInsights: [],
      scholarshipVisaInsights: [],
      studentWorkAuthorizationNote:
        "Ma'lumot tasdiqlanmagan — verify student work authorization rules directly with the destination country's immigration authority.",
      disclaimer,
    };
  }

  const selectedIds = selections.map((s) => s.certificateId);
  const selectedDetails = selections
    .map((sel) => {
      const cert = getCertificateById(sel.certificateId);
      if (!cert) return null;
      const matrixEntry = profile.certificateMatrixNotes[cert.id];
      return {
        selection: sel,
        certificate: cert,
        countryRelevanceNote: matrixEntry
          ? `${matrixEntry.applicability}: ${matrixEntry.detail}`
          : cert.acceptedCountriesNote,
        evidenceStatus: (matrixEntry?.status || 'institution_specific') as EvidenceStatusTag,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const universityInsights = profile.universityTracks.map((track) => {
    const matched = selectedDetails.filter((d) => {
      const hay = `${track.acceptedExams.join(' ')} ${track.typicalThresholds}`.toLowerCase();
      return (
        hay.includes(d.certificate.shortName.toLowerCase()) ||
        hay.includes(d.certificate.id.split('-')[0]) ||
        (track.instructionLanguage === 'English' && d.certificate.subcategory === 'English') ||
        (track.instructionLanguage === 'Local' &&
          ((profile.countryCode === 'JP' && d.certificate.subcategory === 'Japanese') ||
            (profile.countryCode === 'DE' && d.certificate.subcategory === 'German') ||
            (profile.countryCode === 'KR' && d.certificate.subcategory === 'Korean') ||
            (profile.countryCode === 'FR' && d.certificate.subcategory === 'French') ||
            (profile.countryCode === 'CN' && d.certificate.subcategory === 'Chinese') ||
            (profile.countryCode === 'IT' && d.certificate.subcategory === 'Italian') ||
            (profile.countryCode === 'UZ' && d.certificate.subcategory === 'Uzbekistan')))
      );
    });

    const obtainedNames = matched
      .filter((m) => m.selection.status === 'obtained')
      .map((m) => `${m.certificate.shortName} (${m.selection.currentScoreOrLevel || 'obtained'})`);
    const plannedNames = matched
      .filter((m) => m.selection.status === 'planned')
      .map((m) => `${m.certificate.shortName} (target: ${m.selection.targetScoreOrLevel || 'planned'})`);

    let matchSummary = 'None of your currently selected certificates directly map to this track.';
    if (obtainedNames.length > 0 && plannedNames.length > 0) {
      matchSummary = `Obtained: ${obtainedNames.join(', ')} · Planned: ${plannedNames.join(', ')}.`;
    } else if (obtainedNames.length > 0) {
      matchSummary = `Currently held credentials relevant here: ${obtainedNames.join(', ')}.`;
    } else if (plannedNames.length > 0) {
      matchSummary = `Planned target credentials relevant here: ${plannedNames.join(', ')}.`;
    }

    return {
      ...track,
      matchSummary,
    };
  });

  const careerInsights = profile.careerPaths.map((cp) => {
    const matchedCertificates = cp.relevantCertificateIds
      .filter((id) => selectedIds.includes(id))
      .map((id) => getCertificateById(id)?.shortName || id);
    return {
      ...cp,
      matchedCertificates,
    };
  });

  const scholarshipVisaInsights = profile.scholarshipsAndVisas.map((sv) => {
    const matchedCertificates = sv.relevantCertificateIds
      .filter((id) => selectedIds.includes(id))
      .map((id) => getCertificateById(id)?.shortName || id);
    return {
      ...sv,
      matchedCertificates,
    };
  });

  return {
    country: profile,
    countryCode: profile.countryCode,
    hasVerifiedProfile: true,
    selectedDetails,
    universityInsights,
    careerInsights,
    scholarshipVisaInsights,
    studentWorkAuthorizationNote: profile.studentWorkAuthorizationNote,
    disclaimer,
  };
}

export function buildOpportunityMatrix(
  certificateIds: string[],
  countryCodes: string[]
): Array<{
  certificateId: string;
  certificateName: string;
  cells: Array<{
    countryCode: string;
    countryName: string;
    applicability: string;
    detail: string;
    status: EvidenceStatusTag;
  }>;
}> {
  return certificateIds
    .map((certId) => {
      const cert = getCertificateById(certId);
      if (!cert) return null;
      const cells = countryCodes.map((code) => {
        const profile = getCountryQualificationProfile(code);
        const entry = profile?.certificateMatrixNotes[certId];
        return {
          countryCode: code,
          countryName: profile?.countryName || code,
          applicability: entry?.applicability || 'Institution-dependent',
          detail:
            entry?.detail ||
            'Check individual university or employer policies for this qualification.',
          status: (entry?.status || 'institution_specific') as EvidenceStatusTag,
        };
      });
      return {
        certificateId: cert.id,
        certificateName: cert.shortName,
        cells,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export function createDefaultGoalsState(): GoalsWorkspaceState {
  const today = getLocalTodayIsoDate();
  const addDays = (days: number) => {
    const dt = parseLocalIsoDate(today) || new Date();
    dt.setDate(dt.getDate() + days);
    return getLocalTodayIsoDate(dt);
  };

  return {
    goals: [
      {
        id: 'goal-starter-ielts',
        title: 'IELTS Academic 7.5',
        description: 'Reach Band 7.5 overall (minimum 6.5 in Writing & Speaking) for international STEM admissions.',
        category: 'language_certificates',
        goalType: 'score',
        certificateId: 'ielts-academic',
        startDate: today,
        targetDate: addDays(150),
        baselineNumeric: 5.5,
        currentNumeric: 6.0,
        targetNumeric: 7.5,
        numericUnit: 'Band',
        milestones: [
          {
            id: 'ms-ielts-1',
            title: 'Complete diagnostic full mock test and error log',
            targetDate: addDays(10),
            completed: true,
          },
          {
            id: 'ms-ielts-2',
            title: 'Raise Academic Writing Task 2 to consistent 7.0+',
            targetDate: addDays(60),
            completed: false,
          },
          {
            id: 'ms-ielts-3',
            title: 'Register for official test center date via British Council / IDP',
            targetDate: addDays(115),
            completed: false,
          },
        ],
        priority: 'high',
        lifecycleOverride: 'active',
        motivation: 'Qualify for English-taught research universities in Japan, Germany, and global scholarship tracks.',
        targetCountry: 'JP',
        linkedLibraryMaterialIds: [],
        estimatedBudgetUsd: 215,
        dependsOnGoalIds: [],
        evidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'goal-starter-jlpt',
        title: 'JLPT N2 Certification',
        description: 'Build Japanese reading, grammar, and listening fluency to N2 for Japan university life and engineering internships.',
        category: 'language_certificates',
        goalType: 'level',
        certificateId: 'jlpt',
        startDate: today,
        targetDate: addDays(210),
        levelScale: ['None', 'N5', 'N4', 'N3', 'N2', 'N1'],
        currentLevel: 'N4',
        targetLevel: 'N2',
        milestones: [
          {
            id: 'ms-jlpt-1',
            title: 'Finish N3 core Kanji (650 characters) and Bunpro grammar deck',
            targetDate: addDays(90),
            completed: false,
          },
          {
            id: 'ms-jlpt-2',
            title: 'Pass two timed N2 past-paper reading & listening mocks',
            targetDate: addDays(180),
            completed: false,
          },
        ],
        priority: 'medium',
        lifecycleOverride: 'active',
        motivation: 'Unlock bilingual tech internships and scholarship opportunities in Japan.',
        targetCountry: 'JP',
        linkedLibraryMaterialIds: [],
        estimatedBudgetUsd: 45,
        dependsOnGoalIds: [],
        evidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    groups: [
      {
        id: 'group-starter-japan',
        title: 'Japan Engineering Admission Strategy',
        description: 'Coordinated qualification roadmap combining English proficiency and Japanese readiness for Japan.',
        targetCountry: 'JP',
        targetUniversityName: 'The University of Tokyo / Kyutech',
        targetDate: addDays(240),
        priority: 'high',
        members: [
          { goalId: 'goal-starter-ielts', weight: 60 },
          { goalId: 'goal-starter-jlpt', weight: 40 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    favoriteCertificateIds: ['ielts-academic', 'jlpt', 'digital-sat', 'goethe-zertifikat'],
    recentlyViewedCertificateIds: ['ielts-academic', 'jlpt'],
    compareCertificateIds: ['ielts-academic', 'toefl-ibt'],
    simulatorCountryCode: 'JP',
    simulatorCompareCountryCode: 'DE',
    simulatorSelections: [
      {
        id: 'sim-1',
        certificateId: 'jlpt',
        status: 'planned',
        currentScoreOrLevel: 'N4',
        targetScoreOrLevel: 'N2',
      },
      {
        id: 'sim-2',
        certificateId: 'ielts-academic',
        status: 'obtained',
        currentScoreOrLevel: '6.5',
        targetScoreOrLevel: '7.5',
      },
      {
        id: 'sim-3',
        certificateId: 'digital-sat',
        status: 'planned',
        currentScoreOrLevel: '1320',
        targetScoreOrLevel: '1450',
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export { CERTIFICATES_CATALOG, COUNTRY_QUALIFICATION_PROFILES };
