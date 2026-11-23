import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  FolderKanban,
  Layers,
  LayoutGrid,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  computeClusterWeightedProgress,
  computeDynamicGoalStatus,
  computeGoalProgress,
  computeRemainingDays,
  countActiveGoals,
  detectDeadlineConflicts,
  getLocalTodayIsoDate,
  type GoalComputedStatus,
  type GoalGroup,
  type GoalRecord,
} from '../../utils/goalsEngine';
import { checkActiveGoalQuota } from '../../utils/entitlements';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface PersonalGoalsTabProps {
  t: GoalsTranslationBundle;
  onCreateGoal: () => void;
  onEditGoal: (goal: GoalRecord) => void;
  onOpenStrategist: (goal: GoalRecord) => void;
}

type WorkspaceSubView = 'cards' | 'timeline' | 'clusters';
type TimelineFilter = 'all' | 'week' | 'month' | 'year' | 'upcoming' | 'completed' | 'overdue';

export const PersonalGoalsTab: React.FC<PersonalGoalsTabProps> = ({
  t,
  onCreateGoal,
  onEditGoal,
  onOpenStrategist,
}) => {
  const { goalsState, setGoalsState, entitlementStatus, showToast } = useWorkspaceIntelligence();

  const [subView, setSubView] = useState<WorkspaceSubView>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalComputedStatus | 'all_active' | 'all'>('all_active');
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Cluster creation form state
  const [newClusterTitle, setNewClusterTitle] = useState('');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [newClusterDate, setNewClusterDate] = useState('');

  const activeCount = useMemo(() => countActiveGoals(goalsState.goals), [goalsState.goals]);
  const quota = useMemo(
    () => checkActiveGoalQuota(entitlementStatus.tier, activeCount, entitlementStatus.isOwner),
    [entitlementStatus.tier, activeCount, entitlementStatus.isOwner]
  );

  const conflicts = useMemo(() => detectDeadlineConflicts(goalsState.goals), [goalsState.goals]);

  const filteredGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return goalsState.goals.filter((g) => {
      const status = computeDynamicGoalStatus(g);
      if (statusFilter === 'all_active' && status === 'archived') return false;
      if (statusFilter !== 'all' && statusFilter !== 'all_active' && status !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = `${g.title} ${g.motivation} ${g.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [goalsState.goals, search, statusFilter]);

  const timelineGoals = useMemo(() => {
    const nonArchived = goalsState.goals.filter((g) => g.lifecycleOverride !== 'archived');
    return nonArchived
      .filter((g) => {
        const status = computeDynamicGoalStatus(g);
        const rem = computeRemainingDays(g.targetDate);
        if (timelineFilter === 'completed') return status === 'achieved';
        if (timelineFilter === 'overdue') return status === 'overdue';
        if (timelineFilter === 'week') return status !== 'achieved' && rem !== null && rem >= 0 && rem <= 7;
        if (timelineFilter === 'month') return status !== 'achieved' && rem !== null && rem >= 0 && rem <= 31;
        if (timelineFilter === 'year') return status !== 'achieved' && rem !== null && rem >= 0 && rem <= 365;
        if (timelineFilter === 'upcoming') return status !== 'achieved' && rem !== null && rem >= 0;
        return true;
      })
      .sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return a.targetDate.localeCompare(b.targetDate);
      });
  }, [goalsState.goals, timelineFilter]);

  const updateGoal = (goalId: string, updater: (g: GoalRecord) => GoalRecord) => {
    setGoalsState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? updater(g) : g)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleMarkAchieved = (goal: GoalRecord) => {
    const today = getLocalTodayIsoDate();
    updateGoal(goal.id, (g) => ({
      ...g,
      lifecycleOverride: 'achieved',
      binaryState: g.goalType === 'binary' ? 'achieved' : g.binaryState,
      currentNumeric:
        g.goalType === 'score' || g.goalType === 'quantitative'
          ? g.targetNumeric ?? g.currentNumeric
          : g.currentNumeric,
      currentLevel: g.goalType === 'level' ? g.targetLevel ?? g.currentLevel : g.currentLevel,
      achievedAt: today,
      updatedAt: new Date().toISOString(),
    }));
    showToast(`${goal.title} — ${t.goalsWorkspace.achievedBadge}`, 'success');
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalsState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
      groups: prev.groups.map((grp) => ({
        ...grp,
        members: grp.members.filter((m) => m.goalId !== goalId),
      })),
      updatedAt: new Date().toISOString(),
    }));
    setConfirmDeleteId(null);
    showToast('Goal deleted.', 'info');
  };

  const handleCreateCluster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClusterTitle.trim()) return;
    const now = new Date().toISOString();
    const newGroup: GoalGroup = {
      id: `grp-${Date.now()}`,
      title: newClusterTitle.trim(),
      description: newClusterDesc.trim(),
      targetDate: newClusterDate || null,
      priority: 'high',
      members: [],
      createdAt: now,
      updatedAt: now,
    };
    setGoalsState((prev) => ({
      ...prev,
      groups: [newGroup, ...prev.groups],
      updatedAt: now,
    }));
    setNewClusterTitle('');
    setNewClusterDesc('');
    setNewClusterDate('');
    showToast('Strategy cluster created.', 'success');
  };

  const toggleGoalInCluster = (groupId: string, goalId: string) => {
    setGoalsState((prev) => ({
      ...prev,
      groups: prev.groups.map((grp) => {
        if (grp.id !== groupId) return grp;
        const exists = grp.members.some((m) => m.goalId === goalId);
        return {
          ...grp,
          members: exists
            ? grp.members.filter((m) => m.goalId !== goalId)
            : [...grp.members, { goalId, weight: 25 }],
          updatedAt: new Date().toISOString(),
        };
      }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateClusterMemberWeight = (groupId: string, goalId: string, weight: number) => {
    setGoalsState((prev) => ({
      ...prev,
      groups: prev.groups.map((grp) => {
        if (grp.id !== groupId) return grp;
        return {
          ...grp,
          members: grp.members.map((m) => (m.goalId === goalId ? { ...m, weight } : m)),
          updatedAt: new Date().toISOString(),
        };
      }),
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Create CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1 gap-1">
          {(
            [
              { id: 'cards', label: t.goalsWorkspace.viewCards, icon: LayoutGrid },
              { id: 'timeline', label: t.goalsWorkspace.viewTimeline, icon: Calendar },
              { id: 'clusters', label: t.goalsWorkspace.viewClusters, icon: Layers },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = subView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubView(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <GlassButton
          variant="primary"
          onClick={onCreateGoal}
          className="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t.goalsWorkspace.createGoal}
        </GlassButton>
      </div>

      {/* Quota notice for non-owner users at active limit */}
      {!quota.allowed && !entitlementStatus.isOwner && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t.goalsWorkspace.quotaReachedBanner}</span>
        </div>
      )}

      {/* Deadline Conflict Banner */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 space-y-1 text-xs">
          <p className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.goalsWorkspace.conflictWarning}
          </p>
          {conflicts.slice(0, 2).map((c, i) => (
            <p key={i} className="text-[var(--text-secondary)]">
              {c.message}
            </p>
          ))}
        </div>
      )}

      {/* SUBVIEW 1: CARDS */}
      {subView === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personal goals..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] text-sm text-[var(--text-primary)]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as GoalComputedStatus | 'all_active' | 'all')
              }
              aria-label="Filter goals by status"
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
            >
              <option value="all_active">Active & Achieved (Hide Archived)</option>
              <option value="all">All Goals</option>
              <option value="in_progress">{t.statuses.in_progress}</option>
              <option value="approaching">{t.statuses.approaching}</option>
              <option value="overdue">{t.statuses.overdue}</option>
              <option value="achieved">{t.statuses.achieved}</option>
              <option value="paused">{t.statuses.paused}</option>
              <option value="archived">{t.statuses.archived}</option>
            </select>
          </div>

          {filteredGoals.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t.goalsWorkspace.emptyGoalsTitle}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {t.goalsWorkspace.emptyGoalsBody}
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const progress = computeGoalProgress(goal);
                const status = computeDynamicGoalStatus(goal);
                const remaining = computeRemainingDays(goal.targetDate);
                const isAchieved = status === 'achieved';

                return (
                  <GlassCard key={goal.id} className="p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                            {t.goalCategories[goal.category]}
                          </p>
                          <h3 className="text-base font-semibold text-[var(--text-primary)] mt-0.5">
                            {goal.title}
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            isAchieved
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : status === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : status === 'approaching'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-[var(--accent-primary)]'
                          }`}
                        >
                          {isAchieved ? t.goalsWorkspace.achievedBadge : t.statuses[status]}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[var(--text-primary)]">
                            {progress.basisLabel}
                          </span>
                          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                            {progress.percent !== null ? `${progress.percent}%` : '—'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--border-hairline)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isAchieved ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'
                            }`}
                            style={{ width: `${progress.percent ?? 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Tailored Quick-Update Controls per Goal Type */}
                      {!isAchieved && goal.lifecycleOverride !== 'archived' && (
                        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 space-y-2 text-xs">
                          {(goal.goalType === 'score' || goal.goalType === 'quantitative') && (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[var(--text-muted)]">
                                Update current ({goal.numericUnit || 'score'}):
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={goal.currentNumeric ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (!Number.isNaN(val)) {
                                    updateGoal(goal.id, (g) => ({
                                      ...g,
                                      currentNumeric: val,
                                      updatedAt: new Date().toISOString(),
                                    }));
                                  }
                                }}
                                aria-label={`Current value for ${goal.title}`}
                                className="w-24 rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1 text-xs tabular-nums text-[var(--text-primary)]"
                              />
                            </div>
                          )}

                          {goal.goalType === 'level' && goal.levelScale && (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[var(--text-muted)]">Current level:</span>
                              <select
                                value={goal.currentLevel || goal.levelScale[0]}
                                onChange={(e) =>
                                  updateGoal(goal.id, (g) => ({
                                    ...g,
                                    currentLevel: e.target.value,
                                    updatedAt: new Date().toISOString(),
                                  }))
                                }
                                aria-label={`Current level for ${goal.title}`}
                                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                              >
                                {goal.levelScale.map((lvl) => (
                                  <option key={lvl} value={lvl}>
                                    {lvl}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {goal.goalType === 'binary' && (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[var(--text-muted)]">Completion state:</span>
                              <select
                                value={goal.binaryState || 'in_progress'}
                                onChange={(e) => {
                                  const next = e.target.value as
                                    | 'not_started'
                                    | 'in_progress'
                                    | 'achieved';
                                  updateGoal(goal.id, (g) => ({
                                    ...g,
                                    binaryState: next,
                                    lifecycleOverride: next === 'achieved' ? 'achieved' : g.lifecycleOverride,
                                    achievedAt: next === 'achieved' ? getLocalTodayIsoDate() : g.achievedAt,
                                    updatedAt: new Date().toISOString(),
                                  }));
                                }}
                                aria-label={`Status for ${goal.title}`}
                                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="achieved">Achieved / Passed</option>
                              </select>
                            </div>
                          )}

                          {/* Milestones Checklist (shown for milestone goals or any goal with milestones) */}
                          {goal.milestones.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {goal.milestones.slice(0, 4).map((ms) => (
                                <li key={ms.id}>
                                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                                    <input
                                      type="checkbox"
                                      checked={ms.completed}
                                      onChange={() =>
                                        updateGoal(goal.id, (g) => ({
                                          ...g,
                                          milestones: g.milestones.map((x) =>
                                            x.id === ms.id ? { ...x, completed: !x.completed } : x
                                          ),
                                          updatedAt: new Date().toISOString(),
                                        }))
                                      }
                                    />
                                    <span className={ms.completed ? 'line-through opacity-60' : ''}>
                                      {ms.title}
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="space-y-2.5 pt-3 border-t border-[var(--border-hairline)] text-xs">
                      <div className="flex items-center justify-between text-[var(--text-muted)] tabular-nums">
                        <span>
                          {isAchieved && goal.achievedAt
                            ? `${t.goalsWorkspace.achievedBadge} · ${goal.achievedAt}`
                            : goal.targetDate
                            ? `${goal.targetDate} · ${
                                remaining !== null && remaining >= 0
                                  ? `${remaining} ${t.kpis.daysLeft}`
                                  : `-${Math.abs(remaining ?? 0)}d`
                              }`
                            : t.kpis.noDeadline}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenStrategist(goal)}
                            className="inline-flex items-center gap-1 font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {t.goalsWorkspace.aiStrategyBtn}
                          </button>

                          {!isAchieved && (
                            <button
                              type="button"
                              onClick={() => handleMarkAchieved(goal)}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.goalsWorkspace.markAchieved}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditGoal(goal)}
                            aria-label={t.goalsWorkspace.editGoal}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!isAchieved && (
                            <button
                              type="button"
                              onClick={() =>
                                updateGoal(goal.id, (g) => ({
                                  ...g,
                                  lifecycleOverride:
                                    g.lifecycleOverride === 'paused' ? 'active' : 'paused',
                                  updatedAt: new Date().toISOString(),
                                }))
                              }
                              aria-label={
                                goal.lifecycleOverride === 'paused'
                                  ? t.goalsWorkspace.resume
                                  : t.goalsWorkspace.pause
                              }
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              {goal.lifecycleOverride === 'paused' ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              updateGoal(goal.id, (g) => ({
                                ...g,
                                lifecycleOverride:
                                  g.lifecycleOverride === 'archived' ? 'active' : 'archived',
                                updatedAt: new Date().toISOString(),
                              }))
                            }
                            aria-label={t.goalsWorkspace.archive}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === goal.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(goal.id)}
                              aria-label="Delete goal"
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: TIMELINE */}
      {subView === 'timeline' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              ['all', 'week', 'month', 'year', 'upcoming', 'completed', 'overdue'] as TimelineFilter[]
            ).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTimelineFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  timelineFilter === f
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                    : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                {t.goalsWorkspace.timelineFilters[f]}
              </button>
            ))}
          </div>

          <GlassCard className="p-5">
            {timelineGoals.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                No goals match this timeline filter.
              </p>
            ) : (
              <ol className="space-y-4">
                {timelineGoals.map((goal) => {
                  const status = computeDynamicGoalStatus(goal);
                  const progress = computeGoalProgress(goal);
                  const rem = computeRemainingDays(goal.targetDate);
                  return (
                    <li
                      key={goal.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)] last:border-b-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold tabular-nums text-[var(--accent-primary)]">
                            {goal.targetDate || t.kpis.noDeadline}
                          </span>
                          <span className="text-[var(--text-muted)]">·</span>
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {t.statuses[status]}
                          </span>
                          {status !== 'achieved' && rem !== null && (
                            <span className="text-[var(--text-muted)] tabular-nums">
                              · {rem >= 0 ? `${rem} ${t.kpis.daysLeft}` : `-${Math.abs(rem)}d`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {goal.title}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {progress.basisLabel}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {progress.percent !== null ? `${progress.percent}%` : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenStrategist(goal)}
                          className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                        >
                          {t.goalsWorkspace.aiStrategyBtn}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </GlassCard>
        </div>
      )}

      {/* SUBVIEW 3: GOAL STRATEGY CLUSTERS */}
      {subView === 'clusters' && (
        <div className="space-y-5">
          <GlassCard className="p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[var(--accent-primary)]" />
                {t.goalsWorkspace.clustersTitle}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t.goalsWorkspace.clustersSubtitle}
              </p>
            </div>

            <form onSubmit={handleCreateCluster} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                value={newClusterTitle}
                onChange={(e) => setNewClusterTitle(e.target.value)}
                placeholder="e.g., Tokyo University Admission 2027"
                className="sm:col-span-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
              />
              <input
                type="text"
                value={newClusterDesc}
                onChange={(e) => setNewClusterDesc(e.target.value)}
                placeholder="Combined strategy objective..."
                className="sm:col-span-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
              />
              <input
                type="date"
                value={newClusterDate}
                onChange={(e) => setNewClusterDate(e.target.value)}
                className="sm:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
              />
              <GlassButton
                type="submit"
                variant="primary"
                className="sm:col-span-2 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.goalsWorkspace.createCluster}
              </GlassButton>
            </form>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goalsState.groups.map((grp) => {
              const weighted = computeClusterWeightedProgress(grp, goalsState.goals);
              const eligibleGoals = goalsState.goals.filter(
                (g) => g.lifecycleOverride !== 'archived'
              );
              return (
                <GlassCard key={grp.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-[var(--text-primary)]">
                        {grp.title}
                      </h4>
                      {grp.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {grp.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setGoalsState((prev) => ({
                          ...prev,
                          groups: prev.groups.filter((x) => x.id !== grp.id),
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                      aria-label="Delete cluster"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">
                        {t.goalsWorkspace.weightedProgress} (
                        {
                          weighted.resolvedMembers.filter(
                            (m) => m.goal.lifecycleOverride === 'achieved'
                          ).length
                        }
                        /{weighted.resolvedMembers.length} achieved)
                      </span>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                        {weighted.percent !== null ? `${weighted.percent}%` : '—'}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--border-hairline)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                        style={{ width: `${weighted.percent ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)] text-xs">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                      Assigned Goals & Weights
                    </p>
                    {eligibleGoals.map((g) => {
                      const member = grp.members.find((m) => m.goalId === g.id);
                      const isIncluded = Boolean(member);
                      const gProg = computeGoalProgress(g);
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between gap-2 py-1"
                        >
                          <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={() => toggleGoalInCluster(grp.id, g.id)}
                            />
                            <span className="truncate text-[var(--text-primary)]">{g.title}</span>
                            <span className="text-[var(--text-muted)] tabular-nums shrink-0">
                              ({gProg.percent ?? 0}%)
                            </span>
                          </label>
                          {isIncluded && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-[var(--text-muted)]">Wt:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={member?.weight ?? 25}
                                onChange={(e) =>
                                  updateClusterMemberWeight(
                                    grp.id,
                                    g.id,
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                }
                                aria-label={`Weight for ${g.title}`}
                                className="w-14 rounded-md border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-1.5 py-0.5 text-xs tabular-nums text-[var(--text-primary)]"
                              />
                              <Check className="w-3 h-3 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
