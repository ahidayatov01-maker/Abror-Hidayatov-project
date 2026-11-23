import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Loader2,
  Network,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { LibraryMaterialRecord, StudySessionItem } from '../../types/domain';
import { buildWeekDaySlots, formatLocalDateKey } from '../../utils/researchLibraryEngine';
import type { LibraryLocaleStrings } from './libraryStrings';

interface AIPlannerWorkspaceProps {
  strings: LibraryLocaleStrings;
  onOpenMaterial: (material: LibraryMaterialRecord) => void;
}

type PlannerSubTab = 'daily' | 'weekly' | 'upcoming' | 'cross';

export const AIPlannerWorkspace: React.FC<AIPlannerWorkspaceProps> = ({
  strings,
  onOpenMaterial,
}) => {
  const {
    libraryWorkspace,
    analyzeLibraryMaterial,
    runCrossMaterialAnalysis,
    generateSmartSchedule,
    updateStudySession,
    deleteStudySession,
    addMaterialToPlan,
    updateSchedulePreferences,
  } = useApp();

  const [subTab, setSubTab] = useState<PlannerSubTab>('daily');
  const [generating, setGenerating] = useState(false);
  const [runningCross, setRunningCross] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const materialsById = useMemo(
    () => new Map(libraryWorkspace.materials.map((m) => [m.id, m])),
    [libraryWorkspace.materials]
  );
  const foldersById = useMemo(
    () => new Map(libraryWorkspace.folders.map((f) => [f.id, f])),
    [libraryWorkspace.folders]
  );

  const todayKey = formatLocalDateKey(new Date());
  const weekSlots = useMemo(
    () =>
      buildWeekDaySlots(
        new Date(),
        Math.max(1, Math.min(7, libraryWorkspace.schedulePreferences.studyDaysPerWeek))
      ),
    [libraryWorkspace.schedulePreferences.studyDaysPerWeek]
  );

  const dailySessions = useMemo(
    () =>
      libraryWorkspace.scheduleSessions.filter(
        (s) => s.dayKey === todayKey || s.slotType === 'today'
      ),
    [libraryWorkspace.scheduleSessions, todayKey]
  );

  const weekDayKeys = useMemo(() => new Set(weekSlots.map((d) => d.dayKey)), [weekSlots]);

  const upcomingSessions = useMemo(
    () =>
      libraryWorkspace.scheduleSessions.filter(
        (s) => s.slotType === 'upcoming' || (!weekDayKeys.has(s.dayKey) && s.dayKey > todayKey)
      ),
    [libraryWorkspace.scheduleSessions, weekDayKeys, todayKey]
  );

  const scheduledMaterialIds = useMemo(
    () => new Set(libraryWorkspace.scheduleSessions.map((s) => s.materialId)),
    [libraryWorkspace.scheduleSessions]
  );

  const unscheduledActiveMaterials = useMemo(
    () =>
      libraryWorkspace.materials.filter(
        (m) => m.studyStatus !== 'completed' && !scheduledMaterialIds.has(m.id)
      ),
    [libraryWorkspace.materials, scheduledMaterialIds]
  );

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    setFeedback(null);
    const res = await generateSmartSchedule();
    setGenerating(false);
    if (res.ok) {
      setFeedback({ ok: true, text: 'AI study schedule updated from analyzed materials.' });
    } else {
      setFeedback({ ok: false, text: res.error || 'Could not generate AI schedule.' });
    }
  };

  const handleRunCrossAnalysis = async () => {
    setRunningCross(true);
    setFeedback(null);
    const res = await runCrossMaterialAnalysis();
    setRunningCross(false);
    if (res.ok) {
      setFeedback({ ok: true, text: 'Cross-material dependency map refreshed.' });
    } else {
      setFeedback({ ok: false, text: res.error || 'Could not run cross-material analysis.' });
    }
  };

  const handleQuickAnalyze = async (materialId: string) => {
    setAnalyzingId(materialId);
    setFeedback(null);
    const res = await analyzeLibraryMaterial(materialId);
    setAnalyzingId(null);
    if (!res.ok) {
      setFeedback({ ok: false, text: res.error || 'Unable to analyze material.' });
    }
  };

  const renderSessionRow = (session: StudySessionItem) => {
    const mat = materialsById.get(session.materialId);
    if (!mat) return null;
    const folder = foldersById.get(session.folderId);

    return (
      <div
        key={session.id}
        data-testid={`study-session-${session.id}`}
        className={`rounded-2xl border p-4 transition-colors space-y-3 ${
          session.completed
            ? 'border-emerald-500/20 bg-emerald-950/25 opacity-75'
            : 'border-emerald-400/25 bg-[#061811]/85 hover:border-emerald-300/45'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() =>
                updateStudySession(session.id, { completed: !session.completed })
              }
              aria-label={session.completed ? strings.completedBtn : strings.markCompleteBtn}
              className="mt-0.5 text-emerald-300 hover:text-emerald-200 shrink-0 cursor-pointer"
            >
              {session.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-emerald-300/60" />
              )}
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-mono text-emerald-300/80">
                {session.dayLabel}
                {folder ? ` · ${folder.name}` : ''}
                {session.partLabel ? ` · ${session.partLabel}` : ''}
              </p>
              <button
                type="button"
                onClick={() => onOpenMaterial(mat)}
                className={`text-left text-sm sm:text-base font-semibold hover:text-emerald-200 transition-colors cursor-pointer ${
                  session.completed ? 'line-through text-emerald-200/55' : 'text-white'
                }`}
              >
                {mat.title}
              </button>
              <p className="text-xs text-emerald-100/80 mt-1">{session.learningObjective}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenMaterial(mat)}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-medium text-emerald-100 whitespace-nowrap cursor-pointer"
            >
              {strings.openMaterialBtn}
            </button>
            <button
              type="button"
              onClick={() => deleteStudySession(session.id)}
              aria-label="Remove session"
              className="p-1.5 rounded-lg text-emerald-200/45 hover:text-rose-300 hover:bg-rose-500/15 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-400/15 text-[11px] text-emerald-200/75">
          <span>
            {session.pagesOrSections} · {session.difficulty} ·{' '}
            <strong className="text-emerald-300">{session.estimatedMinutes} min</strong>
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="Move session day"
              value={session.dayKey}
              onChange={(e) => {
                const chosen = weekSlots.find((d) => d.dayKey === e.target.value);
                if (chosen) {
                  updateStudySession(session.id, {
                    dayKey: chosen.dayKey,
                    dayLabel: chosen.dayLabel,
                    slotType: chosen.dayKey === todayKey ? 'today' : 'weekly',
                  });
                }
              }}
              className="rounded-lg border border-emerald-400/25 bg-[#04110b] px-2 py-1 text-[11px] text-emerald-100"
            >
              {!weekDayKeys.has(session.dayKey) && (
                <option value={session.dayKey}>{session.dayLabel}</option>
              )}
              {weekSlots.map((d) => (
                <option key={d.dayKey} value={d.dayKey}>
                  {d.dayLabel}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={10}
              max={240}
              step={5}
              aria-label="Session minutes"
              value={session.estimatedMinutes}
              onChange={(e) =>
                updateStudySession(session.id, {
                  estimatedMinutes: Math.max(10, Math.min(240, Number(e.target.value) || 30)),
                })
              }
              className="w-16 rounded-lg border border-emerald-400/25 bg-[#04110b] px-2 py-1 text-[11px] font-mono text-emerald-100"
            />
          </div>
        </div>

        <p className="text-[11px] text-emerald-300/75">{session.whyScheduled}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="ai-planner-workspace">
      {/* Top Planner Control Strip */}
      <div className="rounded-2xl border border-emerald-400/25 bg-[#05160f]/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            {strings.plannerTitle}
          </h2>
          <p className="text-xs text-emerald-100/70 mt-1 max-w-2xl">
            {strings.plannerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRunCrossAnalysis}
            disabled={runningCross}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/35 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-45 px-3.5 py-2 text-xs font-medium text-emerald-100 whitespace-nowrap cursor-pointer"
          >
            {runningCross ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Network className="w-3.5 h-3.5 text-emerald-300" />
            )}
            <span>
              {runningCross ? strings.runningCrossAnalysis : strings.runCrossAnalysisBtn}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGenerateSchedule}
            disabled={generating}
            data-testid="generate-ai-schedule-btn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-emerald-950 font-semibold px-4 py-2 text-xs whitespace-nowrap cursor-pointer"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{generating ? strings.generatingPlan : strings.generatePlanBtn}</span>
          </button>
        </div>
      </div>

      {/* Study Budget Preferences */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-emerald-400/20 bg-[#05140e]/70 p-4">
        <div>
          <label htmlFor="pref-daily-min" className="block text-[11px] text-emerald-200/75 mb-1">
            {strings.dailyBudgetLabel}
          </label>
          <input
            id="pref-daily-min"
            type="number"
            min={30}
            max={360}
            step={15}
            value={libraryWorkspace.schedulePreferences.dailyStudyMinutes}
            onChange={(e) =>
              updateSchedulePreferences({
                dailyStudyMinutes: Math.max(30, Math.min(360, Number(e.target.value) || 90)),
              })
            }
            className="w-full rounded-xl border border-emerald-400/25 bg-[#030d09] px-3 py-1.5 text-xs font-mono text-white"
          />
        </div>
        <div>
          <label htmlFor="pref-days-week" className="block text-[11px] text-emerald-200/75 mb-1">
            {strings.daysPerWeekLabel}
          </label>
          <select
            id="pref-days-week"
            value={libraryWorkspace.schedulePreferences.studyDaysPerWeek}
            onChange={(e) =>
              updateSchedulePreferences({ studyDaysPerWeek: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-emerald-400/25 bg-[#030d09] px-3 py-1.5 text-xs text-white"
          >
            {[3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} days / week
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pref-max-hard" className="block text-[11px] text-emerald-200/75 mb-1">
            {strings.maxHardLabel}
          </label>
          <select
            id="pref-max-hard"
            value={libraryWorkspace.schedulePreferences.maxHardSessionsPerDay}
            onChange={(e) =>
              updateSchedulePreferences({ maxHardSessionsPerDay: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-emerald-400/25 bg-[#030d09] px-3 py-1.5 text-xs text-white"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} advanced session(s)
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs flex items-start gap-2.5 ${
            feedback.ok
              ? 'border-emerald-400/35 bg-emerald-950/60 text-emerald-200'
              : 'border-amber-400/35 bg-amber-950/45 text-amber-200'
          }`}
        >
          {!feedback.ok && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {libraryWorkspace.scheduleSummaryNote && (
        <p className="text-xs text-emerald-200/80 rounded-xl border border-emerald-400/20 bg-emerald-950/35 px-4 py-2.5">
          {libraryWorkspace.scheduleSummaryNote}
        </p>
      )}

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'daily' as const, label: `${strings.dailyPlanTab} (${dailySessions.length})`, icon: Clock },
          { id: 'weekly' as const, label: strings.weeklyPlanTab, icon: CalendarDays },
          { id: 'upcoming' as const, label: strings.upcomingTab, icon: Layers },
          { id: 'cross' as const, label: strings.crossAnalysisTab, icon: Network },
        ].map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-semibold'
                  : 'bg-[#061811] border-emerald-400/20 text-emerald-100/80 hover:border-emerald-300/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* DAILY PLAN */}
      {subTab === 'daily' && (
        <div className="space-y-3">
          {dailySessions.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/65 p-8 text-center space-y-2">
              <Clock className="w-7 h-7 text-emerald-300/60 mx-auto" />
              <p className="text-sm text-white font-medium">No sessions scheduled for today</p>
              <p className="text-xs text-emerald-100/65 max-w-md mx-auto">
                Analyze accessible materials and click &ldquo;{strings.generatePlanBtn}&rdquo;, or open any file and add it to Today’s Plan.
              </p>
            </div>
          ) : (
            dailySessions.map(renderSessionRow)
          )}
        </div>
      )}

      {/* WEEKLY PLAN */}
      {subTab === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weekSlots.map((slot) => {
            const daySessions = libraryWorkspace.scheduleSessions.filter(
              (s) => s.dayKey === slot.dayKey
            );
            const totalMin = daySessions.reduce((acc, s) => acc + s.estimatedMinutes, 0);
            return (
              <div
                key={slot.dayKey}
                className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/75 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-emerald-400/15 pb-2.5">
                  <span className="text-xs font-semibold text-white">{slot.dayLabel}</span>
                  <span className="text-[11px] font-mono text-emerald-300">
                    {totalMin} / {libraryWorkspace.schedulePreferences.dailyStudyMinutes} min
                  </span>
                </div>

                {daySessions.length === 0 ? (
                  <p className="text-xs text-emerald-100/45 py-4 text-center">Rest / Open slot</p>
                ) : (
                  <div className="space-y-2">
                    {daySessions.map((s) => {
                      const mat = materialsById.get(s.materialId);
                      if (!mat) return null;
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-emerald-400/20 bg-emerald-950/45 p-3 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenMaterial(mat)}
                              className={`text-left text-xs font-semibold hover:text-emerald-200 cursor-pointer ${
                                s.completed ? 'line-through text-emerald-200/50' : 'text-white'
                              }`}
                            >
                              {mat.title}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateStudySession(s.id, { completed: !s.completed })
                              }
                              className="text-emerald-300 shrink-0 cursor-pointer"
                            >
                              {s.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-emerald-300/60" />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-emerald-200/70">
                            {s.pagesOrSections} · {s.estimatedMinutes}m · {s.difficulty}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UPCOMING & UNSCHEDULED */}
      {subTab === 'upcoming' && (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                Scheduled Upcoming Sessions
              </h3>
              {upcomingSessions.map(renderSessionRow)}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300">
              Unscheduled Library Materials ({unscheduledActiveMaterials.length})
            </h3>
            {unscheduledActiveMaterials.length === 0 ? (
              <p className="text-xs text-emerald-100/60">
                Every active material in your library is already scheduled or completed.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unscheduledActiveMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/75 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenMaterial(mat)}
                        className="text-left text-sm font-semibold text-white hover:text-emerald-200 cursor-pointer"
                      >
                        {mat.title}
                      </button>
                      <p className="text-[11px] text-emerald-200/70 mt-1">
                        {mat.analysis
                          ? `${mat.analysis.mainSubject} · ${mat.analysis.difficultyLevel} · ${mat.analysis.estimatedMinutes} min`
                          : mat.contentAccess === 'unreadable'
                          ? mat.unreadableReason
                          : 'Not yet analyzed with AI'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-400/15">
                      {!mat.analysis && mat.contentAccess !== 'unreadable' && (
                        <button
                          type="button"
                          onClick={() => handleQuickAnalyze(mat.id)}
                          disabled={analyzingId === mat.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/35 px-2.5 py-1 text-[11px] text-emerald-200 cursor-pointer"
                        >
                          {analyzingId === mat.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>{strings.analyzeWithAi}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => addMaterialToPlan(mat.id, 'today')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15 cursor-pointer"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        <span>{strings.addToToday}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addMaterialToPlan(mat.id, 'weekly')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{strings.addToWeekly}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CROSS-MATERIAL ANALYSIS */}
      {subTab === 'cross' && (
        <div className="space-y-5">
          {!libraryWorkspace.crossAnalysis ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-[#05140e]/65 p-8 text-center space-y-2">
              <Network className="w-7 h-7 text-emerald-300/60 mx-auto" />
              <p className="text-sm font-medium text-white">No cross-material map generated yet</p>
              <p className="text-xs text-emerald-100/65 max-w-md mx-auto">
                Analyze your accessible materials first, then click &ldquo;{strings.runCrossAnalysisBtn}&rdquo; to detect prerequisite relationships, overlaps, and knowledge gaps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recommended Study Sequence */}
              <div className="rounded-2xl border border-emerald-400/25 bg-[#05140e]/80 p-5 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                  Recommended Study Sequence
                </h3>
                <div className="space-y-2">
                  {libraryWorkspace.crossAnalysis.studySequence.map((item) => {
                    const mat = materialsById.get(item.materialId);
                    if (!mat) return null;
                    return (
                      <div
                        key={item.materialId}
                        className="rounded-xl border border-emerald-400/15 bg-emerald-950/35 p-3 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-300/35 text-xs font-mono text-emerald-200 flex items-center justify-center shrink-0">
                          {item.order}
                        </span>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenMaterial(mat)}
                            className="text-left text-xs font-semibold text-white hover:text-emerald-200 cursor-pointer"
                          >
                            {mat.title}
                          </button>
                          <p className="text-[11px] text-emerald-100/70 mt-0.5">
                            {item.rationale}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prerequisites, Overlaps & Knowledge Gaps */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/25 bg-[#05140e]/80 p-5 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                    Prerequisite Dependencies
                  </h3>
                  {libraryWorkspace.crossAnalysis.prerequisiteLinks.length === 0 ? (
                    <p className="text-xs text-emerald-100/60">
                      No strict prerequisite chains detected between analyzed items.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {libraryWorkspace.crossAnalysis.prerequisiteLinks.map((link, idx) => {
                        const from = materialsById.get(link.fromMaterialId);
                        const to = materialsById.get(link.toMaterialId);
                        if (!from || !to) return null;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-emerald-400/15 bg-emerald-950/35 p-3 text-xs space-y-1"
                          >
                            <p className="font-semibold text-white flex flex-wrap items-center gap-1.5">
                              <span>{from.title}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{to.title}</span>
                            </p>
                            <p className="text-[11px] text-emerald-100/70">{link.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {libraryWorkspace.crossAnalysis.knowledgeGaps.length > 0 && (
                  <div className="rounded-2xl border border-emerald-400/25 bg-[#05140e]/80 p-5 space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                      Detected Knowledge Gaps
                    </h3>
                    <ul className="space-y-1.5 text-xs text-emerald-100/85 list-disc pl-4">
                      {libraryWorkspace.crossAnalysis.knowledgeGaps.map((gap, idx) => (
                        <li key={idx}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
