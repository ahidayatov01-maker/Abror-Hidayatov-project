import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  Hash,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getDefaultTop15Rankings,
  RANKING_PROVIDERS,
  searchRankingsByPosition,
  searchRankingsByUniversityName,
  type RankingProviderName,
  type VerifiedGlobalRankingEntry,
} from '../data/globalRankingsCatalog';
import { getExtendedUIStrings } from '../i18n/uiStrings';
import {
  formatCleanRankDisplay,
  formatCleanUniversityName,
  getUniversalMicroCopy,
} from '../utils/displayCopy';

export type RankingSearchMode = 'name' | 'position';

export const GlobalRankingsView: React.FC = () => {
  const { universitiesBySlug, openUniversityProfile, language } = useApp();
  const ui = getExtendedUIStrings(language).rankingsPage;
  const micro = getUniversalMicroCopy(language);

  const [provider, setProvider] = useState<RankingProviderName>('QS World University Rankings');
  const [searchMode, setSearchMode] = useState<RankingSearchMode>('name');
  const [nameQuery, setNameQuery] = useState('');
  const [positionQuery, setPositionQuery] = useState('');
  const [selectedUniSlug, setSelectedUniSlug] = useState<string>('mit');

  const isSearching =
    (searchMode === 'name' && nameQuery.trim().length > 0) ||
    (searchMode === 'position' && positionQuery.trim().length > 0);

  const searchOutcome = useMemo(() => {
    if (searchMode === 'position' && positionQuery.trim().length > 0) {
      const res = searchRankingsByPosition(provider, positionQuery);
      return {
        items: res.results,
        didYouMean: null as string | null,
        isDefaultTop15: false,
      };
    }

    if (searchMode === 'name' && nameQuery.trim().length > 0) {
      const res = searchRankingsByUniversityName(provider, nameQuery);
      return {
        items: res.results,
        didYouMean: res.didYouMean,
        isDefaultTop15: false,
      };
    }

    return {
      items: getDefaultTop15Rankings(provider),
      didYouMean: null as string | null,
      isDefaultTop15: true,
    };
  }, [provider, searchMode, nameQuery, positionQuery]);

  const displayedRankings = searchOutcome.items;

  const selectedEntry: VerifiedGlobalRankingEntry | null = useMemo(() => {
    const inDisplayed = displayedRankings.find((r) => r.universitySlug === selectedUniSlug);
    if (inDisplayed) return inDisplayed;
    return displayedRankings[0] || getDefaultTop15Rankings(provider)[0] || null;
  }, [displayedRankings, selectedUniSlug, provider]);

  const handleClearSearch = () => {
    setNameQuery('');
    setPositionQuery('');
  };

  const handleSelectUniversityRow = (entry: VerifiedGlobalRankingEntry) => {
    setSelectedUniSlug(entry.universitySlug);
  };

  return (
    <div className="space-y-6" data-testid="global-rankings-view">
      {/* Header & Top 15 / Full Dataset Status Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{ui.title}</h1>
          <span
            data-testid="rankings-dataset-mode-badge"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              searchOutcome.isDefaultTop15
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                : 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}
          >
            {searchOutcome.isDefaultTop15 ? ui.top15DefaultBadge : ui.searchingFullDatasetBadge}
          </span>
        </div>

        {/* Provider Selector Pills */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={ui.providerLabel}>
          {RANKING_PROVIDERS.map((p) => {
            const active = provider === p;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`ranking-provider-tab-${p.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setProvider(p)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  active
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'btn-glass'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Intelligent Dual-Mode Search Bar (Mode A: By Position | Mode B: By University Name) */}
      <div className="surface-card rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {ui.searchModeLabel}:
            </span>
            <button
              type="button"
              data-testid="ranking-search-mode-name"
              onClick={() => {
                setSearchMode('name');
                setPositionQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                searchMode === 'name'
                  ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                  : 'btn-glass'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{ui.modeByName}</span>
            </button>
            <button
              type="button"
              data-testid="ranking-search-mode-position"
              onClick={() => {
                setSearchMode('position');
                setNameQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                searchMode === 'position'
                  ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                  : 'btn-glass'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{ui.modeByPosition}</span>
            </button>
          </div>

          {isSearching && (
            <button
              type="button"
              data-testid="ranking-reset-top15-btn"
              onClick={handleClearSearch}
              className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{ui.clearSearchBtn}</span>
            </button>
          )}
        </div>

        {/* Active Search Input */}
        <div className="relative">
          {searchMode === 'name' ? (
            <>
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                data-testid="ranking-name-search-input"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder={ui.searchByNamePlaceholder}
                aria-label={ui.searchByNamePlaceholder}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm"
              />
            </>
          ) : (
            <>
              <Hash className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                data-testid="ranking-position-search-input"
                value={positionQuery}
                onChange={(e) => setPositionQuery(e.target.value)}
                placeholder={ui.searchByPositionPlaceholder}
                aria-label={ui.searchByPositionPlaceholder}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono-tabular"
              />
            </>
          )}
        </div>

        {/* Status / Fuzzy Match Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
          <span>
            {searchOutcome.isDefaultTop15 ? ui.showingTop15Notice : ui.showingSearchNotice}
          </span>
          {searchOutcome.didYouMean && (
            <span
              data-testid="ranking-fuzzy-match-banner"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                {ui.didYouMean} <strong>{searchOutcome.didYouMean}</strong>
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid: Rankings Table + Historical Trend Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 surface-card rounded-2xl overflow-hidden">
          {displayedRankings.length === 0 ? (
            <div
              data-testid="ranking-empty-state"
              className="p-8 text-center space-y-3"
            >
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                {ui.noRankFoundTitle}
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                {searchMode === 'position'
                  ? ui.noRankFoundByPositionDesc
                  : ui.noRankFoundByNameDesc}
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{ui.returnToTop15Btn}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="global-rankings-table">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3.5 px-4">{ui.positionCol}</th>
                    <th className="py-3.5 px-4">{ui.universityCol}</th>
                    <th className="py-3.5 px-4">{ui.countryCol}</th>
                    <th className="py-3.5 px-4">{ui.cityCol}</th>
                    <th className="py-3.5 px-4">{ui.providerCol}</th>
                    <th className="py-3.5 px-4 font-mono-tabular">{ui.yearCol}</th>
                    <th className="py-3.5 px-4 text-right">{ui.sourceCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] text-sm">
                  {displayedRankings.map((r) => {
                    const isSelected = selectedEntry?.universitySlug === r.universitySlug;
                    const hasFullProfile = Boolean(universitiesBySlug[r.universitySlug]);

                    return (
                      <tr
                        key={`${r.provider}-${r.worldRank}-${r.universitySlug}`}
                        data-testid={`ranking-row-${r.worldRank}`}
                        onClick={() => handleSelectUniversityRow(r)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-primary)]/[0.08]'
                            : 'hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tabular font-bold text-base text-[var(--accent-primary)]">
                              {formatCleanRankDisplay(r.worldRankDisplay)}
                            </span>
                            {!r.isTop15 && (
                              <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                {ui.outsideTop15Tag}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            {hasFullProfile ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUniversityProfile(r.universitySlug);
                                }}
                                className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] text-left cursor-pointer"
                              >
                                {formatCleanUniversityName(r.universityName)}
                              </button>
                            ) : (
                              <span className="font-semibold text-[var(--text-primary)]">
                                {formatCleanUniversityName(r.universityName)}
                              </span>
                            )}
                            <span className="text-[11px] text-[var(--text-muted)] font-mono-tabular">
                              {r.shortName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          <span className="mr-1.5">{r.flagEmoji}</span>
                          <span>{r.countryName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          {r.cityName}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)]">
                          {r.provider}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {r.publicationYear}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <a
                            href={r.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                          >
                            <span>{ui.sourceCol}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Multi-Year Historical Rank Trajectory Inspector */}
        <div className="lg:col-span-4 surface-card rounded-2xl p-5 space-y-5">
          {selectedEntry && (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {ui.trendCol}
                  </p>
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">
                    {formatCleanRankDisplay(selectedEntry.worldRankDisplay)} · {selectedEntry.publicationYear}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-semibold leading-snug">
                  {formatCleanUniversityName(selectedEntry.universityName)}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedEntry.flagEmoji} {selectedEntry.cityName}, {selectedEntry.countryName}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
                {selectedEntry.historicalRanksJson.map((point) => {
                  const barWidth = Math.max(16, 100 - Math.min(point.rank, 80));
                  return (
                    <div key={point.year} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono-tabular">
                        <span className="text-[var(--text-muted)]">{point.year}</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          #{point.rank}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
                {universitiesBySlug[selectedEntry.universitySlug] && (
                  <button
                    type="button"
                    onClick={() => openUniversityProfile(selectedEntry.universitySlug)}
                    className="btn-primary rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    {micro.view} →
                  </button>
                )}
                <a
                  href={selectedEntry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium"
                >
                  <span>{micro.portal}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
