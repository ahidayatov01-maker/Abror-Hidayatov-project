import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Calculator,
  Compass,
  GitCompare,
  Sparkles,
  Feather,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspaceIntelligence } from '../context/WorkspaceIntelligenceContext';
import { computeChecklistProgress, getBestRankByProvider } from '../utils/academicLogic';
import { countActiveGoals } from '../utils/goalsEngine';
import {
  formatCleanRankDisplay,
  formatCleanUniversityName,
  getUniversalMicroCopy,
  splitTuitionDisplay,
} from '../utils/displayCopy';
import { MotionCard, MotionReveal } from '../motion/MotionPrimitives';
import { MOTION_DURATION, MOTION_EASE } from '../motion/tokens';
import { GlassCard } from './glass';
import { FloatingGiftBox3D } from './welcome/FloatingGiftBox3D';
import { formatUserDisplayName } from '../utils/userProfileHelpers';

export const DashboardView: React.FC = () => {
  const {
    profile,
    isGuest,
    t,
    language,
    catalog,
    countriesByCode,
    citiesBySlug,
    universitiesBySlug,
    savedUniversities,
    recentlyViewedSlugs,
    journeyTasks,
    checklists,
    openUniversityProfile,
    openCountryProfile,
    openCityInExplorer,
    setActiveSection,
  } = useApp();
  const { goalsState } = useWorkspaceIntelligence();

  const micro = getUniversalMicroCopy(language);
  const userFullName = formatUserDisplayName(profile, isGuest);
  const activeGoalsCount = countActiveGoals(goalsState.goals);
  const checklistProgress = computeChecklistProgress(checklists);
  const completedTasks = journeyTasks.filter((task) => task.status === 'completed').length;
  const journeyPercent = journeyTasks.length
    ? Math.round((completedTasks / journeyTasks.length) * 100)
    : 0;
  const combinedReadiness = checklists.length
    ? Math.round((checklistProgress.percent + journeyPercent) / 2)
    : journeyPercent;

  const targetCodes =
    profile.targetCountries.length > 0 ? profile.targetCountries : ['JP', 'GB', 'DE', 'US'];
  const favoriteCountries = targetCodes
    .map((code) => countriesByCode[code])
    .filter(Boolean);

  const recommendedUnis = catalog.universities
    .filter((u) => {
      if (profile.targetDisciplines.length === 0) return true;
      return u.academicStrengthsJson.some((s) =>
        profile.targetDisciplines.some((d) => s.toLowerCase().includes(d.toLowerCase()))
      );
    })
    .slice(0, 4);

  const recentUnis = recentlyViewedSlugs
    .map((slug) => universitiesBySlug[slug])
    .filter(Boolean)
    .slice(0, 4);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (combinedReadiness / 100) * circumference;

  return (
    <div className="space-y-10 pt-2">
      {/* Editorial Hero Composition */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <GlassCard className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {(profile.country || profile.currentEducationLevel).toUpperCase()} • {profile.targetDegree.toUpperCase()}
              </p>
              <h1
                data-testid="dashboard-welcome-heading"
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight headline-balance"
              >
                {t.dashboard.welcomePrefix} {userFullName}
              </h1>
            </div>

            <div
              data-testid="dashboard-hero-kpis"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-[var(--border-hairline)]"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[var(--text-muted)]">{micro.docsKpi}:</span>
                <span className="font-mono-tabular text-sm font-semibold text-[var(--text-primary)]">
                  {combinedReadiness}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[var(--text-muted)]">{micro.savedKpi}:</span>
                <span className="font-mono-tabular text-sm font-semibold text-[var(--text-primary)]">
                  {savedUniversities.length}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[var(--text-muted)]">{micro.goalsKpi}:</span>
                <span className="font-mono-tabular text-sm font-semibold text-[var(--text-primary)]">
                  {activeGoalsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Instruments Row */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap border-t border-[var(--border-hairline)] pt-4 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSection('world-explorer')}
              className="btn-glass rounded-xl px-3 sm:px-3.5 py-2.5 text-left cursor-pointer flex items-center gap-2 min-w-0"
            >
              <Compass className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span className="text-xs font-semibold truncate">{t.nav.worldExplorer}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('explore-by-city')}
              className="btn-glass rounded-xl px-3 sm:px-3.5 py-2.5 text-left cursor-pointer flex items-center gap-2 min-w-0"
            >
              <Building2 className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span className="text-xs font-semibold truncate">{t.nav.exploreByCity}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('financial-planner')}
              className="btn-glass rounded-xl px-3 sm:px-3.5 py-2.5 text-left cursor-pointer flex items-center gap-2 min-w-0"
            >
              <Calculator className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span className="text-xs font-semibold truncate">{t.nav.financialPlanner}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('ai-advisor')}
              className="btn-glass rounded-xl px-3 sm:px-3.5 py-2.5 text-left cursor-pointer flex items-center gap-2 min-w-0"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-secondary)] shrink-0" />
              <span className="text-xs font-semibold truncate">{t.nav.aiAdvisor}</span>
            </button>
          </div>
        </GlassCard>

        {/* Right Visual & Welcome Gift Box */}
        <div className="lg:col-span-5 grid grid-rows-2 gap-6">
          <FloatingGiftBox3D />

          <div className="surface-card rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <svg width="92" height="92" className="shrink-0 -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="readiness-liquid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor="var(--accent-secondary)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="46"
                  cy="46"
                  r={radius}
                  fill="none"
                  stroke="var(--border-hairline)"
                  strokeWidth="7"
                />
                <motion.circle
                  cx="46"
                  cy="46"
                  r={radius}
                  fill="none"
                  stroke="url(#readiness-liquid-grad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: MOTION_DURATION.ringDraw, ease: MOTION_EASE }}
                />
              </svg>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  {t.dashboard.applicationProgress}
                </p>
                <p className="font-mono-tabular text-2xl font-semibold mt-0.5">
                  {combinedReadiness}%
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono-tabular">
                  {savedUniversities.length} {t.common.saved.toLowerCase()} · {completedTasks}/{journeyTasks.length}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSection('my-academic-journey')}
                className="btn-glass rounded-xl px-3 py-2 text-xs font-medium cursor-pointer text-center"
              >
                {t.common.roadmap}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('paper-journal')}
                className="rounded-xl border border-amber-400/35 bg-amber-500/12 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>{t.nav.paperJournal}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Favorite Destinations & Saved Shortlist */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">
              {t.dashboard.favoriteDestinations}
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('countries')}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              {t.common.allCountries}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteCountries.map((country, idx) => {
              const uniCount = catalog.universities.filter((u) => u.countryCode === country.isoCode).length;
              return (
                <MotionCard
                  key={country.isoCode}
                  delayIndex={idx}
                  interactive
                  className="surface-card rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl" aria-hidden="true">{country.flagEmoji}</span>
                      <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                        {uniCount} {t.worldExplorer.unisCount}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-semibold mt-1.5">{country.name}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)] text-xs">
                    <button
                      type="button"
                      onClick={() => openCityInExplorer(country.isoCode)}
                      className="font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      {t.worldExplorer.viewCities}
                    </button>
                    <button
                      type="button"
                      onClick={() => openCountryProfile(country.isoCode)}
                      className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline cursor-pointer"
                    >
                      {t.worldExplorer.countryDossier}
                    </button>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">
              {t.dashboard.savedCount}
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('my-universities')}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              {t.nav.myUniversities}
            </button>
          </div>

          <div className="surface-card rounded-2xl divide-y divide-[var(--border-hairline)]">
            {savedUniversities.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t.comparisonView.emptyState}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('universities')}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  {t.comparisonView.browseUnis}
                </button>
              </div>
            ) : (
              savedUniversities.slice(0, 4).map((saved) => {
                const uni = universitiesBySlug[saved.universitySlug];
                if (!uni) return null;
                const city = citiesBySlug[uni.citySlug];
                return (
                  <div
                    key={saved.universitySlug}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)]">
                        {city?.name} · {saved.priority}
                      </p>
                      <button
                        type="button"
                        onClick={() => openUniversityProfile(uni.slug)}
                        className="font-display text-lg font-semibold text-left hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                      >
                        {formatCleanUniversityName(uni.name)}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openUniversityProfile(uni.slug)}
                      className="btn-glass shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <span>{micro.view}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Recommended Institutions — Minimal cards: Title + Primary Metric */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">
            {t.dashboard.recommendedTitle}
          </h2>
          <button
            type="button"
            onClick={() => setActiveSection('university-comparison')}
            className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{t.nav.universityComparison}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {recommendedUnis.map((uni, idx) => {
            const city = citiesBySlug[uni.citySlug];
            const country = countriesByCode[uni.countryCode];
            const qsRank = getBestRankByProvider(
              catalog.rankings,
              uni.slug,
              'QS World University Rankings'
            );
            return (
              <motion.button
                key={uni.slug}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: MOTION_DURATION.cardReveal,
                  delay: Math.min(idx * 0.048, 0.24),
                  ease: MOTION_EASE,
                }}
                onClick={() => openUniversityProfile(uni.slug)}
                className="surface-card glass-interactive rounded-2xl p-5 text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--text-muted)]">
                    {country?.flagEmoji} {city?.name}
                  </p>
                  <h3 className="font-display text-xl font-semibold leading-snug">
                    {formatCleanUniversityName(uni.name)}
                  </h3>
                </div>
                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
                  <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                    {qsRank
                      ? `QS ${formatCleanRankDisplay(qsRank.worldRankDisplay)}`
                      : splitTuitionDisplay(uni.tuitionLocalDisplay).primary}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Recently Viewed + Scholarship Highlights */}
      <MotionReveal delayIndex={2} distance={10}>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-3">
          <h2 className="font-display text-2xl font-semibold">{t.dashboard.recentlyViewed}</h2>
          <div className="surface-card rounded-2xl divide-y divide-[var(--border-hairline)]">
            {recentUnis.map((uni) => {
              const city = citiesBySlug[uni.citySlug];
              return (
                <button
                  key={uni.slug}
                  type="button"
                  onClick={() => openUniversityProfile(uni.slug)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {formatCleanUniversityName(uni.name)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {city?.name} · {splitTuitionDisplay(uni.tuitionLocalDisplay).primary}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">{t.nav.scholarships}</h2>
            <button
              type="button"
              onClick={() => setActiveSection('scholarships')}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              {t.common.exploreAll}
            </button>
          </div>
          <div className="surface-card rounded-2xl divide-y divide-[var(--border-hairline)]">
            {catalog.scholarships.slice(0, 3).map((sch) => {
              const isFull = String(sch.coverageSummary || '').toLowerCase().includes('full');
              return (
                <div key={sch.slug} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-muted)]">
                      {countriesByCode[sch.countryCode]?.flagEmoji} {countriesByCode[sch.countryCode]?.name}
                    </p>
                    <p className="font-display text-lg font-semibold mt-0.5 truncate">{sch.name}</p>
                  </div>
                  <span className="shrink-0 font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">
                    {isFull ? micro.fullGrantLabel : micro.partialGrantLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </MotionReveal>
    </div>
  );
};
