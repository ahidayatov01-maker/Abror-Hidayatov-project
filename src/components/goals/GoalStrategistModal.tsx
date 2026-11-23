import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Flame,
  ListTodo,
  Route,
  Sparkles,
} from 'lucide-react';
import { GlassModal, GlassButton } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import { getCertificateById } from '../../data/certificatesCatalog';
import {
  computeGoalProgress,
  type GoalPreparationPlan,
  type GoalRecord,
} from '../../utils/goalsEngine';
import { isDuplicateTask, type RoutineBlock } from '../../utils/productivityEngine';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface GoalStrategistModalProps {
  open: boolean;
  onClose: () => void;
  goal: GoalRecord | null;
  t: GoalsTranslationBundle;
}

const COLLABORATING_AGENTS = [
  'Academic Cartographer (Agent 2)',
  'Admission Profile Auditor (Agent 3)',
  'Scholarship Strategist (Agent 5)',
  'Financial Planner (Agent 6)',
  'Routine & Habit Architect (Agent 7)',
  'Research & Library Analyst (Agent 8)',
  'Task Prioritizer (Agent 9)',
];

export const GoalStrategistModal: React.FC<GoalStrategistModalProps> = ({
  open,
  onClose,
  goal,
  t,
}) => {
  const { language, journeyTasks, addJourneyTask, setActiveSection } = useApp();
  const {
    setGoalsState,
    setRoutineState,
    setRoadmapState,
    addHabitToTracker,
    entitlementStatus,
    getAuthHeaders,
    showToast,
  } = useWorkspaceIntelligence();

  const [dailyHours, setDailyHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<GoalPreparationPlan | null>(null);

  // Preview-before-apply selective sync toggles
  const [syncRoutine, setSyncRoutine] = useState(true);
  const [syncTodo, setSyncTodo] = useState(true);
  const [syncHabits, setSyncHabits] = useState(true);
  const [syncRoadmap, setSyncRoadmap] = useState(false);
  const [syncLibrary, setSyncLibrary] = useState(false);
  const [applying, setApplying] = useState(false);

  const canUseStrategist =
    entitlementStatus.isOwner || entitlementStatus.entitlements.aiGoalStrategistEnabled;

  useEffect(() => {
    if (open && goal) {
      setPlan(goal.aiPlan || null);
      setErrorMsg(null);
    }
  }, [open, goal]);

  if (!goal) return null;

  const cert = getCertificateById(goal.certificateId);
  const progress = computeGoalProgress(goal);

  const handleGenerate = async () => {
    if (!canUseStrategist) {
      setErrorMsg(t.strategist.upgradeRequired);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/goal-strategy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          goal: {
            title: goal.title,
            category: goal.category,
            goalType: goal.goalType,
            currentState: progress.basisLabel,
            targetState:
              goal.targetLevel ||
              (goal.targetNumeric != null ? `${goal.targetNumeric} ${goal.numericUnit || ''}` : 'Achieved'),
            startDate: goal.startDate,
            targetDate: goal.targetDate,
            motivation: goal.motivation,
            targetCountry: goal.targetCountry,
            certificateName: cert?.officialName,
          },
          dailyStudyHours: dailyHours,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate AI preparation strategy.');
      }

      const generated = data.plan as Record<string, unknown>;
      const builtPlan: GoalPreparationPlan = {
        id: `plan-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        generatedByAgents: COLLABORATING_AGENTS,
        modelUsed: (data.model as string) || 'gemini-2.5-flash',
        goalAnalysis: String(generated.goalAnalysis || ''),
        currentPositionAssessment: String(generated.currentPositionAssessment || ''),
        clarificationNeeded: generated.clarificationNeeded
          ? String(generated.clarificationNeeded)
          : null,
        stages: Array.isArray(generated.stages)
          ? (generated.stages as Array<{ title: string; durationLabel: string; focus: string }>)
          : [],
        weeklyTargets: Array.isArray(generated.weeklyTargets)
          ? (generated.weeklyTargets as string[])
          : [],
        monthlyMilestones: Array.isArray(generated.monthlyMilestones)
          ? (generated.monthlyMilestones as string[])
          : [],
        dailyStudyAllocationNote: String(generated.dailyStudyAllocationNote || ''),
        reviewSessions: Array.isArray(generated.reviewSessions)
          ? (generated.reviewSessions as string[])
          : [],
        practiceRecommendations: Array.isArray(generated.practiceRecommendations)
          ? (generated.practiceRecommendations as string[])
          : [],
        progressCheckpoints: Array.isArray(generated.progressCheckpoints)
          ? (generated.progressCheckpoints as string[])
          : [],
        fallbackStrategy: String(generated.fallbackStrategy || ''),
        syncProposals: {
          routineBlocks: Array.isArray(
            (generated.syncProposals as Record<string, unknown>)?.routineBlocks
          )
            ? ((generated.syncProposals as Record<string, unknown>)
                .routineBlocks as GoalPreparationPlan['syncProposals']['routineBlocks'])
            : [],
          todoTasks: Array.isArray((generated.syncProposals as Record<string, unknown>)?.todoTasks)
            ? ((generated.syncProposals as Record<string, unknown>)
                .todoTasks as GoalPreparationPlan['syncProposals']['todoTasks'])
            : [],
          habits: Array.isArray((generated.syncProposals as Record<string, unknown>)?.habits)
            ? ((generated.syncProposals as Record<string, unknown>)
                .habits as GoalPreparationPlan['syncProposals']['habits'])
            : [],
          roadmapMilestoneTitle: (generated.syncProposals as Record<string, unknown>)
            ?.roadmapMilestoneTitle
            ? String((generated.syncProposals as Record<string, unknown>).roadmapMilestoneTitle)
            : undefined,
          librarySearchQuery: (generated.syncProposals as Record<string, unknown>)
            ?.librarySearchQuery
            ? String((generated.syncProposals as Record<string, unknown>).librarySearchQuery)
            : undefined,
        },
        syncedTargets: {},
      };

      setPlan(builtPlan);
      setGoalsState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goal.id ? { ...g, aiPlan: builtPlan, updatedAt: new Date().toISOString() } : g
        ),
        updatedAt: new Date().toISOString(),
      }));
      showToast('AI Goal Preparation Strategy ready.', 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Strategy generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelectedSync = async () => {
    if (!plan) return;
    setApplying(true);
    const appliedSummary: string[] = [];

    try {
      // 1. Lock-safe Routine append (never overwrites locked or userEdited blocks)
      if (syncRoutine && plan.syncProposals.routineBlocks.length > 0) {
        setRoutineState((prev) => {
          const existingTitles = new Set(prev.blocks.map((b) => b.title.trim().toLowerCase()));
          const additions: RoutineBlock[] = plan.syncProposals.routineBlocks
            .filter((rb) => !existingTitles.has(rb.title.trim().toLowerCase()))
            .map((rb, idx) => ({
              id: `rt-goal-${Date.now()}-${idx}`,
              horizon: 'daily',
              title: rb.title,
              slotLabel: rb.slotLabel || 'Flexible Focus Block',
              durationMinutes: Number(rb.durationMinutes) || 45,
              category: rb.category || 'academic_study',
              notes: rb.notes || `Synced from Maqsadlar: ${goal.title}`,
              completed: false,
              locked: false,
              userEdited: false,
              source: 'ai',
              linkedSection: 'my-academic-journey',
            }));
          if (additions.length === 0) return prev;
          return {
            ...prev,
            blocks: [...prev.blocks, ...additions],
            updatedAt: new Date().toISOString(),
          };
        });
        appliedSummary.push('AI Routine');
      }

      // 2. Duplicate-safe To-Do tasks
      if (syncTodo && plan.syncProposals.todoTasks.length > 0) {
        const normalizedExisting = journeyTasks.map((jt) => ({
          title: jt.title,
          status: jt.status,
        }));
        let addedTasks = 0;
        for (const task of plan.syncProposals.todoTasks) {
          if (!isDuplicateTask(normalizedExisting, task.title)) {
            await addJourneyTask({
              title: task.title,
              category: task.category || 'Exams',
              status: 'pending',
              dueDate: task.dueDate || goal.targetDate || null,
              notes: task.notes || `Synced from Maqsadlar goal: ${goal.title}`,
            });
            normalizedExisting.push({ title: task.title, status: 'pending' });
            addedTasks++;
          }
        }
        if (addedTasks > 0) appliedSummary.push(`To-Do (${addedTasks})`);
      }

      // 3. Non-destructive Habits Tracker append
      if (syncHabits && plan.syncProposals.habits.length > 0) {
        let addedHabits = 0;
        for (const h of plan.syncProposals.habits) {
          const res = await addHabitToTracker({
            title: h.title,
            category: h.category || 'Education',
            targetMinutes: h.targetMinutes || 30,
            frequency: h.frequency === 'custom_weekly' ? 'custom_weekly' : 'daily',
          });
          if (res.added) addedHabits++;
        }
        if (addedHabits > 0) appliedSummary.push(`Habits (${addedHabits})`);
      }

      // 4. Non-destructive Akademik yo'lim custom milestone station
      if (syncRoadmap && plan.syncProposals.roadmapMilestoneTitle) {
        const stationTitle = plan.syncProposals.roadmapMilestoneTitle;
        setRoadmapState((prev) => {
          const mode = prev.activeMode;
          const route = prev.routes[mode];
          if (!route) return prev;
          const alreadyExists = route.stations.some(
            (s) => s.title.trim().toLowerCase() === stationTitle.trim().toLowerCase()
          );
          if (alreadyExists) return prev;
          const nextOrder = route.stations.length + 1;
          return {
            ...prev,
            routes: {
              ...prev.routes,
              [mode]: {
                ...route,
                stations: [
                  ...route.stations,
                  {
                    id: `goal-st-${Date.now()}`,
                    order: nextOrder,
                    title: stationTitle,
                    subtitle: `Linked Goal: ${goal.title}`,
                    phase: 'Exams & Docs',
                    status: 'in_progress',
                    weight: 10,
                    timeframe: goal.targetDate ? `Target ${goal.targetDate}` : 'Ongoing',
                    estimatedCostUsd: goal.estimatedBudgetUsd || 0,
                    evidenceCategory: 'user_provided',
                    description: plan.goalAnalysis,
                    requirements: plan.weeklyTargets.slice(0, 3),
                    completionCriteria: `Achieve ${goal.title}`,
                    isCustom: true,
                    x: Math.min(920, 120 + nextOrder * 110),
                    y: nextOrder % 2 === 0 ? 290 : 150,
                  },
                ],
              },
            },
          };
        });
        appliedSummary.push("Akademik yo'lim");
      }

      // Record sync state on goal
      setGoalsState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goal.id && g.aiPlan
            ? {
                ...g,
                aiPlan: {
                  ...g.aiPlan,
                  syncedTargets: {
                    ...g.aiPlan.syncedTargets,
                    routine: syncRoutine ? ['synced'] : g.aiPlan.syncedTargets.routine,
                    todo: syncTodo ? ['synced'] : g.aiPlan.syncedTargets.todo,
                    habits: syncHabits ? ['synced'] : g.aiPlan.syncedTargets.habits,
                    roadmap: syncRoadmap || g.aiPlan.syncedTargets.roadmap,
                    library: syncLibrary || g.aiPlan.syncedTargets.library,
                  },
                },
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
        updatedAt: new Date().toISOString(),
      }));

      showToast(
        appliedSummary.length > 0
          ? `${t.strategist.syncedSuccess}: ${appliedSummary.join(', ')}`
          : 'Selected items are already synced (duplicates prevented).',
        'success'
      );

      if (syncLibrary) {
        onClose();
        setActiveSection('research-library');
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={`${t.strategist.modalTitle} — ${goal.title}`}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-5 text-xs">
        {/* Active Existing Platform Agents (10-Agent Ecosystem — No 11th Agent) */}
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-primary)] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            {t.strategist.activeAgentsHeading}
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {COLLABORATING_AGENTS.join(' · ')}
          </p>
        </div>

        {/* Generation Controls */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.strategist.studyHoursLabel}
            </span>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value) || 2)}
              className="block w-36 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm tabular-nums text-[var(--text-primary)]"
            />
          </label>

          <GlassButton
            variant="primary"
            disabled={loading || !canUseStrategist}
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {loading
              ? t.strategist.generating
              : plan
              ? t.strategist.regenerateBtn
              : t.strategist.generateBtn}
          </GlassButton>
        </div>

        {!canUseStrategist && (
          <p className="text-amber-700 dark:text-amber-400 font-medium">
            {t.strategist.upgradeRequired}
          </p>
        )}
        {errorMsg && <p className="text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>}

        {/* Rendered Strategy Plan */}
        {plan && (
          <div className="space-y-5 pt-3 border-t border-[var(--border-hairline)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-1.5">
                <h4 className="font-semibold text-[var(--text-primary)]">Strategic Analysis</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">{plan.goalAnalysis}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-1.5">
                <h4 className="font-semibold text-[var(--text-primary)]">Current Position</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {plan.currentPositionAssessment}
                </p>
              </div>
            </div>

            {/* Stages */}
            {plan.stages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-[var(--text-primary)] uppercase tracking-[0.06em] text-[11px]">
                  {t.strategist.stagesTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plan.stages.map((st, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-1"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-primary)]">
                        {st.durationLabel}
                      </p>
                      <p className="font-semibold text-[var(--text-primary)]">{st.title}</p>
                      <p className="text-[var(--text-secondary)] leading-snug">{st.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly & Monthly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  {t.strategist.weeklyTargetsTitle}
                </h4>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  {plan.weeklyTargets.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  {t.strategist.monthlyMilestonesTitle}
                </h4>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  {plan.monthlyMilestones.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Checkpoints & Fallback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-1.5">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  {t.strategist.checkpointsTitle}
                </h4>
                <ul className="space-y-1 text-[var(--text-secondary)]">
                  {plan.progressCheckpoints.map((cp, i) => (
                    <li key={i}>• {cp}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-1.5">
                <h4 className="font-semibold text-[var(--text-primary)]">
                  {t.strategist.fallbackTitle}
                </h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {plan.fallbackStrategy}
                </p>
              </div>
            </div>

            {/* Preview-Before-Apply 1-Click Ecosystem Sync */}
            <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  {t.strategist.syncPanelTitle}
                </h4>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Non-destructive · Preserves locked items
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncRoutine}
                    onChange={(e) => setSyncRoutine(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {t.strategist.syncRoutine} ({plan.syncProposals.routineBlocks.length})
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {plan.syncProposals.routineBlocks.map((b) => b.title).join(', ') || 'No blocks'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncTodo}
                    onChange={(e) => setSyncTodo(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {t.strategist.syncTodo} ({plan.syncProposals.todoTasks.length})
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {plan.syncProposals.todoTasks.map((tk) => tk.title).join(', ') || 'No tasks'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncHabits}
                    onChange={(e) => setSyncHabits(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {t.strategist.syncHabits} ({plan.syncProposals.habits.length})
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {plan.syncProposals.habits.map((h) => h.title).join(', ') || 'No habits'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncRoadmap}
                    onChange={(e) => setSyncRoadmap(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <Route className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {t.strategist.syncRoadmap}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {plan.syncProposals.roadmapMilestoneTitle || `Link "${goal.title}" station`}
                    </p>
                  </div>
                </label>

                <label className="sm:col-span-2 flex items-start gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncLibrary}
                    onChange={(e) => setSyncLibrary(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      {t.strategist.syncLibrary}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Open Research Library for study materials:{' '}
                      {plan.syncProposals.librarySearchQuery || goal.title}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-1">
                <GlassButton
                  variant="primary"
                  disabled={applying}
                  onClick={handleApplySelectedSync}
                  className="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.strategist.applySelected}
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
