import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Compass, Database, Globe2, GraduationCap, Info, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import { COSMIC_SECTIONS } from './cosmicSections';

interface CosmicInsightsPanelProps {
  exploredShardIds: string[];
  onClose: () => void;
}

/**
 * Stage 4 Cosmic Center Core insight overlay ("Koinot Tahlili").
 * Grounded 100% in genuine live application data from AppContext and
 * WorkspaceIntelligenceContext — never fabricates user achievements, scores,
 * or personal progress when user data is unavailable.
 */
export const CosmicInsightsPanel: React.FC<CosmicInsightsPanelProps> = ({
  exploredShardIds,
  onClose,
}) => {
  const { catalog, savedUniversities, compareSlugs, checklists, journeyTasks, isGuest } = useApp();
  const { roadmapState, routineState, goalsState, agentLogs } = useWorkspaceIntelligence();

  const summary = useMemo(() => {
    const activeRoute = roadmapState.routes[roadmapState.activeMode];
    const completedStations = activeRoute
      ? activeRoute.stations.filter((st) => st.status === 'completed').length
      : 0;
    const totalStations = activeRoute ? activeRoute.stations.length : 0;

    const safeSaved = Array.isArray(savedUniversities) ? savedUniversities : [];
    const safeCompare = Array.isArray(compareSlugs) ? compareSlugs : [];
    const safeChecklists = Array.isArray(checklists) ? checklists : [];
    const safeJourney = Array.isArray(journeyTasks) ? journeyTasks : [];
    const safeGoals = Array.isArray(goalsState?.goals) ? goalsState.goals : [];
    const safeBlocks = Array.isArray(routineState?.blocks) ? routineState.blocks : [];
    const safeLogs = Array.isArray(agentLogs) ? agentLogs : [];

    const completedChecklists = safeChecklists.filter((c) => c.completed).length;
    const completedRoutine = safeBlocks.filter((b) => b.completed).length;
    const completedJourney = safeJourney.filter((t) => t.status === 'completed').length;

    const personalActivitySignals =
      safeSaved.length +
      safeCompare.length +
      completedChecklists +
      safeGoals.length +
      completedRoutine +
      completedJourney +
      safeLogs.length;

    return {
      countriesCount: catalog.countries.length,
      universitiesCount: catalog.universities.length,
      scholarshipsCount: catalog.scholarships.length,
      programsCount: catalog.programs.length,
      savedCount: safeSaved.length,
      comparisonCount: safeCompare.length,
      completedChecklists,
      totalChecklists: safeChecklists.length,
      activeRouteName: activeRoute?.name || null,
      completedStations,
      totalStations,
      goalsCount: safeGoals.length,
      routineCompleted: completedRoutine,
      routineTotal: safeBlocks.length,
      agentLogsCount: safeLogs.length,
      // Only treat as synced personal progress when authenticated with recorded activity
      hasPersonalData: !isGuest && personalActivitySignals > 0,
    };
  }, [
    catalog,
    savedUniversities,
    compareSlugs,
    checklists,
    journeyTasks,
    isGuest,
    roadmapState,
    routineState,
    goalsState,
    agentLogs,
  ]);

  return (
    <motion.section
      key="cosmic-insights-panel"
      role="region"
      aria-label="Koinot Tahlili"
      data-testid="cosmic-insights-panel"
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto relative w-full max-w-[460px] rounded-[26px] border border-cyan-200/28 text-violet-50 p-5 space-y-4"
      style={{
        background:
          'linear-gradient(135deg, rgba(22, 16, 54, 0.16) 0%, rgba(11, 9, 32, 0.12) 52%, rgba(14, 24, 56, 0.16) 100%)',
        backdropFilter: 'blur(16px) saturate(145%)',
        WebkitBackdropFilter: 'blur(16px) saturate(145%)',
        boxShadow:
          'inset 0 1px 0 0 rgba(224, 242, 254, 0.42), inset 1px 0 0 0 rgba(192, 132, 252, 0.26), inset -1px -1px 0 0 rgba(56, 189, 248, 0.18), 0 24px 64px rgba(2, 1, 12, 0.46)',
        textShadow: '0 1px 10px rgba(3, 2, 14, 0.65)',
      }}
    >
      <div
        className="pointer-events-none absolute top-0 inset-x-10 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #38bdf8, #a855f7, transparent)',
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-400/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Koinot Yadroviy Impulsi</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">Koinot Tahlili</h2>
          <p className="text-xs text-violet-100/85">
            Global University Intelligence tizimining joriy real ma’lumotlari
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Koinot Tahlilini yopish"
          data-testid="cosmic-insights-close-btn"
          className="p-1.5 rounded-xl border border-white/20 bg-white/[0.06] text-violet-100 hover:text-white hover:border-cyan-300/50 hover:bg-white/[0.14] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real Catalog Snapshot */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100/90">
          <Database className="w-3.5 h-3.5 text-cyan-300" />
          <span>Jonli Katalog Ko‘rsatkichlari</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/14 bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-violet-100/80">
              <Globe2 className="w-3 h-3 text-cyan-300" />
              <span>Davlatlar</span>
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-white">
              {summary.countriesCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/14 bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-violet-100/80">
              <GraduationCap className="w-3 h-3 text-violet-300" />
              <span>OTMlar</span>
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-white">
              {summary.universitiesCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/14 bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-violet-100/80">
              <Compass className="w-3 h-3 text-fuchsia-300" />
              <span>Grantlar</span>
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-white">
              {summary.scholarshipsCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Honest Personal Workspace Status */}
      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold uppercase tracking-[0.12em] text-cyan-200">
            Shaxsiy Ishchi Maydon Holati
          </span>
          <span className="font-mono text-violet-100/90">
            {exploredShardIds.length} / {COSMIC_SECTIONS.length} qirra
          </span>
        </div>

        {summary.hasPersonalData ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] text-violet-200/65">Saqlangan / Taqqoslash</p>
              <p className="mt-0.5 font-semibold font-mono text-white">
                {summary.savedCount} saqlangan · {summary.comparisonCount} taqqos
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] text-violet-200/65">Akademik Marshrut</p>
              <p className="mt-0.5 font-semibold font-mono text-cyan-200">
                {summary.completedStations}/{summary.totalStations} bekat
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] text-violet-200/65">Maqsadlar & Kun Tartibi</p>
              <p className="mt-0.5 font-semibold font-mono text-white">
                {summary.goalsCount} maqsad · {summary.routineCompleted}/{summary.routineTotal} blok
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] text-violet-200/65">Chek-list & AI Tahlil</p>
              <p className="mt-0.5 font-semibold font-mono text-violet-100">
                {summary.completedChecklists}/{summary.totalChecklists} · {summary.agentLogsCount} tahlil
              </p>
            </div>
          </div>
        ) : (
          <div
            data-testid="cosmic-insights-neutral-fallback"
            className="flex items-start gap-2.5 rounded-xl border border-violet-300/18 bg-white/[0.03] p-3 text-xs text-violet-200/85 leading-relaxed"
          >
            <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
            <p>
              {isGuest
                ? 'Hozircha shaxsiy foydalanuvchi profili ulanmagan (mehmon rejimi). Yuqoridagi raqamlar platformaning real katalog bazasidan olingan.'
                : 'Hozircha shaxsiy saqlangan universitetlar, maqsadlar yoki tahlillar qayd etilmagan. Bo‘limlardan foydalanishni boshlaganingizda real holatingiz shu yerda aks etadi.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <p className="text-[11px] text-violet-200/65 leading-snug">
        Koinotdagi 12 kristall bo‘lagidan birini tanlab bo‘lim pasportini oching yoki uzoqdagi Qora
        Teshik orqali Boshqaruv paneliga qayting.
      </p>
    </motion.section>
  );
};
