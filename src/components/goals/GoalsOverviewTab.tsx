import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  Globe2,
  Plus,
  Sparkles,
  Target,
  AlertTriangle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  computeDailyPriorityAction,
  computeDynamicGoalStatus,
  computeGoalProgress,
  computeNext7DaysAgenda,
  computeRemainingDays,
  type GoalRecord,
} from '../../utils/goalsEngine';
import { COUNTRY_QUALIFICATION_PROFILES } from '../../data/countryQualificationRules';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface CertificateRecommendationResult {
  summary: string;
  required: Array<{ name: string; reason: string; targetBenchmark?: string }>;
  recommended: Array<{ name: string; reason: string; targetBenchmark?: string }>;
  optional: Array<{ name: string; reason: string }>;
  unnecessary: Array<{ name: string; reason: string }>;
  recommendedOrder: string[];
  verificationReminder?: string;
}

interface GoalsOverviewTabProps {
  t: GoalsTranslationBundle;
  onCreateGoal: () => void;
  onOpenCertificates: () => void;
  onOpenSimulator: () => void;
  onOpenMyGoals: () => void;
  onOpenStrategist: (goal: GoalRecord) => void;
}

export const GoalsOverviewTab: React.FC<GoalsOverviewTabProps> = ({
  t,
  onCreateGoal,
  onOpenCertificates,
  onOpenSimulator,
  onOpenMyGoals,
  onOpenStrategist,
}) => {
  const { language, profile } = useApp();
  const { goalsState, getAuthHeaders, showToast } = useWorkspaceIntelligence();

  const dailyAction = useMemo(
    () => computeDailyPriorityAction(goalsState.goals),
    [goalsState.goals]
  );
  const next7Days = useMemo(
    () => computeNext7DaysAgenda(goalsState.goals),
    [goalsState.goals]
  );

  const activeGoalsPreview = useMemo(() => {
    return goalsState.goals
      .filter((g) => g.lifecycleOverride !== 'achieved' && g.lifecycleOverride !== 'archived')
      .slice(0, 4);
  }, [goalsState.goals]);

  // "Qaysi sertifikat menga kerak?" interactive AI recommender state
  const [targetCountry, setTargetCountry] = useState(
    profile.targetCountries?.[0] || goalsState.simulatorCountryCode || 'JP'
  );
  const [intendedDegree, setIntendedDegree] = useState(profile.targetDegree || 'Bachelor');
  const [studyLanguage, setStudyLanguage] = useState('English-taught');
  const [intendedCareer, setIntendedCareer] = useState(
    profile.targetDisciplines?.[0] || 'Software Engineering / Computer Science'
  );
  const [currentQualifications, setCurrentQualifications] = useState('');
  const [targetAdmissionYear, setTargetAdmissionYear] = useState('2027');
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<CertificateRecommendationResult | null>(null);
  const [recError, setRecError] = useState<string | null>(null);

  const handleAnalyzeNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecommending(true);
    setRecError(null);
    try {
      const headers = await getAuthHeaders();
      const countryName =
        COUNTRY_QUALIFICATION_PROFILES.find((c) => c.countryCode === targetCountry)?.countryName ||
        targetCountry;
      const res = await fetch('/api/ai/certificate-recommendation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetCountry: countryName,
          intendedDegree,
          studyLanguage,
          intendedCareer,
          currentQualifications,
          targetAdmissionYear,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate certificate recommendation.');
      }
      setRecommendation(data.recommendation as CertificateRecommendationResult);
      showToast(t.overview.whichCertTitle, 'success');
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Recommendation request failed.');
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Today's Priority Focus & Next 7 Days Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard className="lg:col-span-7 p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)]">
                <Flame className="w-3.5 h-3.5" />
                {t.overview.dailyStepTitle}
              </span>
              {dailyAction.remainingDays !== null && (
                <span className="text-xs font-medium tabular-nums text-[var(--text-muted)]">
                  {dailyAction.remainingDays >= 0
                    ? `${dailyAction.remainingDays} ${t.kpis.daysLeft}`
                    : `${Math.abs(dailyAction.remainingDays)}d overdue`}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
              {dailyAction.actionText}
            </h2>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              <span className="font-medium text-[var(--text-primary)]">{dailyAction.goalTitle}</span>
              {' · '}
              {dailyAction.rationale}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[var(--border-hairline)]">
            <GlassButton
              variant="primary"
              onClick={onCreateGoal}
              className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.overview.createNewGoal}
            </GlassButton>
            <GlassButton
              variant="glass"
              onClick={onOpenCertificates}
              className="px-3.5 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {t.overview.exploreCertificates}
            </GlassButton>
            <GlassButton
              variant="glass"
              onClick={onOpenSimulator}
              className="px-3.5 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2"
            >
              <Globe2 className="w-4 h-4" />
              {t.overview.openSimulator}
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {t.overview.next7DaysTitle}
            </span>
            <div className="flex items-center gap-3 text-xs tabular-nums">
              {next7Days.atRiskCount > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {next7Days.atRiskCount} {t.overview.atRiskLabel}
                </span>
              )}
              {next7Days.conflictsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {next7Days.conflictsCount} {t.overview.conflictsLabel}
                </span>
              )}
            </div>
          </div>

          {next7Days.upcomingDeadlines.length === 0 && next7Days.upcomingMilestones.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed py-2">
              {t.overview.noUpcoming7Days}
            </p>
          ) : (
            <div className="space-y-3">
              {next7Days.upcomingDeadlines.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    {t.overview.upcomingDeadlines}
                  </p>
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {next7Days.upcomingDeadlines.slice(0, 3).map((d) => (
                      <li key={d.goalId} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {d.title}
                        </span>
                        <span className="text-xs font-medium tabular-nums text-[var(--accent-primary)] shrink-0">
                          {d.targetDate} ({d.remainingDays}d)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {next7Days.upcomingMilestones.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    {t.overview.upcomingMilestones}
                  </p>
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {next7Days.upcomingMilestones.slice(0, 3).map((m, idx) => (
                      <li key={`${m.goalId}-${idx}`} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--text-secondary)] truncate">
                          <span className="font-medium text-[var(--text-primary)]">{m.milestoneTitle}</span>
                          {' · '}
                          {m.goalTitle}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--text-muted)] shrink-0">
                          {m.targetDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Row 2: Active Goals Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--accent-primary)]" />
            {t.overview.activeGoalsPreview}
          </h3>
          <button
            type="button"
            onClick={onOpenMyGoals}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            {t.tabs.myGoals}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeGoalsPreview.length === 0 ? (
          <GlassCard className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t.goalsWorkspace.emptyGoalsTitle}
            </p>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              {t.goalsWorkspace.emptyGoalsBody}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoalsPreview.map((goal) => {
              const progress = computeGoalProgress(goal);
              const status = computeDynamicGoalStatus(goal);
              const remaining = computeRemainingDays(goal.targetDate);
              return (
                <GlassCard key={goal.id} className="p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                          {t.goalCategories[goal.category]}
                        </p>
                        <h4 className="text-base font-semibold text-[var(--text-primary)] truncate mt-0.5">
                          {goal.title}
                        </h4>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          status === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : status === 'approaching'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[var(--accent-primary)]'
                        }`}
                      >
                        {t.statuses[status]}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{progress.basisLabel}</span>
                        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                          {progress.percent !== null ? `${progress.percent}%` : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border-hairline)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                          style={{ width: `${progress.percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)] text-xs">
                    <span className="text-[var(--text-muted)] tabular-nums">
                      {goal.targetDate
                        ? `${goal.targetDate} · ${remaining !== null && remaining >= 0 ? `${remaining} ${t.kpis.daysLeft}` : `-${Math.abs(remaining ?? 0)}d`}`
                        : t.kpis.noDeadline}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenStrategist(goal)}
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.goalsWorkspace.aiStrategyBtn}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: "Qaysi sertifikat menga kerak?" Smart Recommender */}
      <GlassCard className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {t.overview.whichCertTitle}
        </h3>

        <form onSubmit={handleAnalyzeNeed} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>{t.simulator.targetCountry}</span>
            <select
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            >
              {COUNTRY_QUALIFICATION_PROFILES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji} {c.countryName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Degree Level</span>
            <select
              value={intendedDegree}
              onChange={(e) => setIntendedDegree(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            >
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD / Research</option>
              <option value="Direct Career / Skilled Work">Direct Career / Skilled Work</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Instruction Language</span>
            <select
              value={studyLanguage}
              onChange={(e) => setStudyLanguage(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            >
              <option value="English-taught">English-taught</option>
              <option value="Local language (Japanese / German / Korean / Chinese)">
                Local Language Track
              </option>
              <option value="Bilingual / Flexible">Bilingual / Flexible</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Field / Career Track</span>
            <input
              type="text"
              value={intendedCareer}
              onChange={(e) => setIntendedCareer(e.target.value)}
              placeholder="e.g., Computer Science, Medicine, Finance"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            />
          </label>

          <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Current Certificates (Optional)</span>
            <input
              type="text"
              value={currentQualifications}
              onChange={(e) => setCurrentQualifications(e.target.value)}
              placeholder="e.g., IELTS 6.5, SAT 1320"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            />
          </label>

          <div className="flex items-end gap-2">
            <label className="space-y-1.5 text-xs font-medium text-[var(--text-secondary)] w-28 shrink-0">
              <span>Year</span>
              <input
                type="text"
                value={targetAdmissionYear}
                onChange={(e) => setTargetAdmissionYear(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              />
            </label>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={recommending}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {recommending ? t.overview.analyzingBtn : t.overview.analyzeNeedBtn}
            </GlassButton>
          </div>
        </form>

        {recError && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{recError}</p>
        )}

        {recommendation && (
          <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
            <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
              {recommendation.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-400">
                  {t.overview.requiredExams}
                </h4>
                {recommendation.required.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">—</p>
                ) : (
                  <ul className="space-y-2">
                    {recommendation.required.map((item, i) => (
                      <li key={i} className="text-xs space-y-0.5">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {item.name}
                          {item.targetBenchmark ? ` · ${item.targetBenchmark}` : ''}
                        </div>
                        <p className="text-[var(--text-secondary)]">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-primary)]">
                  {t.overview.recommendedExams}
                </h4>
                {recommendation.recommended.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">—</p>
                ) : (
                  <ul className="space-y-2">
                    {recommendation.recommended.map((item, i) => (
                      <li key={i} className="text-xs space-y-0.5">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {item.name}
                          {item.targetBenchmark ? ` · ${item.targetBenchmark}` : ''}
                        </div>
                        <p className="text-[var(--text-secondary)]">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                  {t.overview.optionalExams}
                </h4>
                {recommendation.optional.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">—</p>
                ) : (
                  <ul className="space-y-1.5">
                    {recommendation.optional.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{item.name}:</span>{' '}
                        {item.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-400">
                  {t.overview.unnecessaryExams}
                </h4>
                {recommendation.unnecessary.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">—</p>
                ) : (
                  <ul className="space-y-1.5">
                    {recommendation.unnecessary.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{item.name}:</span>{' '}
                        {item.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {recommendation.recommendedOrder?.length > 0 && (
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {t.overview.prepOrder}
                </h4>
                <ol className="space-y-1 text-xs text-[var(--text-secondary)]">
                  {recommendation.recommendedOrder.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {recommendation.verificationReminder && (
              <p className="text-[11px] text-[var(--text-muted)]">
                {recommendation.verificationReminder}
              </p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
