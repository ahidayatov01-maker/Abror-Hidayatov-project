import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Trophy,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  analyzeDeadlineRisks,
  computeAchievementBadges,
  computeGoalProgress,
  computeGoalsAnalytics,
} from '../../utils/goalsEngine';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface GoalsAnalyticsTabProps {
  t: GoalsTranslationBundle;
}

export const GoalsAnalyticsTab: React.FC<GoalsAnalyticsTabProps> = ({ t }) => {
  const { goalsState, entitlementStatus, showToast } = useWorkspaceIntelligence();

  const analytics = useMemo(() => computeGoalsAnalytics(goalsState.goals), [goalsState.goals]);
  const risks = useMemo(() => analyzeDeadlineRisks(goalsState.goals), [goalsState.goals]);
  const badges = useMemo(() => computeAchievementBadges(goalsState.goals), [goalsState.goals]);

  const completedGoals = useMemo(
    () =>
      goalsState.goals
        .filter((g) => g.lifecycleOverride === 'achieved')
        .sort((a, b) => (b.achievedAt || b.updatedAt).localeCompare(a.achievedAt || a.updatedAt)),
    [goalsState.goals]
  );

  const canExport =
    entitlementStatus.isOwner || entitlementStatus.entitlements.goalPlanExportEnabled;

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!canExport) {
      showToast(t.analytics.exportUpgradeNote, 'info');
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: analytics,
      goals: goalsState.goals,
      clusters: goalsState.groups,
    };
    triggerDownload(
      `maqsadlar-plan-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    showToast('Exported Maqsadlar plan as JSON.', 'success');
  };

  const handleExportMarkdown = () => {
    if (!canExport) {
      showToast(t.analytics.exportUpgradeNote, 'info');
      return;
    }
    const lines: string[] = [
      '# MAQSADLAR — Personal Academic & Career Goals Plan',
      `Exported: ${new Date().toISOString().slice(0, 10)}`,
      '',
      '## Summary',
      `- Active Goals: ${analytics.activeGoals}`,
      `- Achieved Goals: ${analytics.achievedGoals}`,
      `- Average Progress: ${analytics.averageComputableProgress ?? 0}%`,
      '',
      '## Goals',
      ...goalsState.goals
        .filter((g) => g.lifecycleOverride !== 'archived')
        .map((g) => {
          const p = computeGoalProgress(g);
          return `- **${g.title}** (${t.goalCategories[g.category]}) — ${p.basisLabel} | Target: ${
            g.targetDate || 'Flexible'
          }`;
        }),
    ];
    triggerDownload(
      `maqsadlar-plan-${new Date().toISOString().slice(0, 10)}.md`,
      lines.join('\n'),
      'text/markdown;charset=utf-8'
    );
    showToast('Exported Maqsadlar plan as Markdown.', 'success');
  };

  const maxCatCount = Math.max(1, ...analytics.categoryDistribution.map((c) => c.count));

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
            {t.analytics.title}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.analytics.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="glass"
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            {t.analytics.exportJson}
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleExportMarkdown}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            {t.analytics.exportMarkdown}
          </GlassButton>
        </div>
      </div>

      {!canExport && (
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          {t.analytics.exportUpgradeNote}
        </p>
      )}

      {/* Deeper Analytics KPI Metrics Row (distinct from top header KPI strip) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Completion Rate
          </p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {analytics.totalGoals > 0
              ? `${Math.round((analytics.achievedGoals / analytics.totalGoals) * 100)}%`
              : '0%'}
          </p>
        </GlassCard>
        <GlassCard className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Milestones Completed
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--accent-primary)]">
            {goalsState.goals.reduce(
              (acc, g) => acc + g.milestones.filter((m) => m.completed).length,
              0
            )}
            /
            {goalsState.goals.reduce((acc, g) => acc + g.milestones.length, 0)}
          </p>
        </GlassCard>
        <GlassCard className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Strategy Clusters
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {goalsState.groups.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Overdue / Paused
          </p>
          <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {analytics.overdueGoals} / {analytics.pausedGoals}
          </p>
        </GlassCard>
      </div>

      {/* Category Distribution SVG Bar Visualization + Deadline Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard className="lg:col-span-7 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t.analytics.categoryDistribution}
          </h3>
          {analytics.categoryDistribution.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No goal categories recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.categoryDistribution.map((row) => {
                const widthPct = Math.round((row.count / maxCatCount) * 100);
                const achievedPct = row.count > 0 ? Math.round((row.achievedCount / row.count) * 100) : 0;
                return (
                  <div key={row.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-primary)]">
                        {t.goalCategories[row.category]}
                      </span>
                      <span className="tabular-nums text-[var(--text-secondary)]">
                        {row.count} total · {row.achievedCount} achieved
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 400 10"
                      preserveAspectRatio="none"
                      className="w-full h-2.5 rounded-full overflow-hidden"
                      role="img"
                      aria-label={`${t.goalCategories[row.category]}: ${row.count} goals`}
                    >
                      <rect x="0" y="0" width="400" height="10" fill="var(--border-hairline)" />
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(12, Math.round((widthPct / 100) * 400))}
                        height="10"
                        fill="var(--chart-1)"
                      />
                      {row.achievedCount > 0 && (
                        <rect
                          x="0"
                          y="0"
                          width={Math.max(
                            8,
                            Math.round(((widthPct / 100) * (achievedPct / 100)) * 400)
                          )}
                          height="10"
                          fill="var(--chart-3)"
                        />
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t.analytics.deadlineRiskTitle}
          </h3>
          {risks.length === 0 ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              {t.analytics.noRisksMessage}
            </p>
          ) : (
            <ul className="space-y-3">
              {risks.map((risk) => (
                <li
                  key={risk.goalId}
                  className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {risk.goalTitle}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.05em] ${
                        risk.severity === 'elevated'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)]">{risk.reason}</p>
                  <p className="text-[11px] text-[var(--accent-primary)]">
                    {risk.supportiveAction}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* Achievement Milestones & Completed History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard className="lg:col-span-6 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--accent-primary)]" />
            {t.analytics.achievementsTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3.5 space-y-1 text-xs ${
                  b.unlocked
                    ? 'border-emerald-500/35 bg-emerald-500/8'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{b.title}</span>
                  {b.unlocked ? (
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">Locked</span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">{b.description}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-6 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {t.analytics.completedHistory} ({completedGoals.length})
          </h3>
          {completedGoals.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Completed goals will appear here with their achievement date and final verified result.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-hairline)]">
              {completedGoals.map((g) => {
                const p = computeGoalProgress(g);
                return (
                  <li key={g.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{g.title}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {t.goalCategories[g.category]} · {p.basisLabel}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                      {g.achievedAt || g.updatedAt.slice(0, 10)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
