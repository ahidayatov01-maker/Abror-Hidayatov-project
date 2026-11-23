import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitCompare,
  Globe2,
  Loader2,
  MapPin,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getExtendedUIStrings } from '../i18n/uiStrings';
import {
  formatCleanRankDisplay,
  formatCleanUniversityName,
  getUniversalMicroCopy,
  splitTuitionDisplay,
} from '../utils/displayCopy';
import { TOP_10_STUDENT_CITIES } from '../data/topStudentCities';
import {
  fetchCityUniversities,
  fetchGlobalCities,
  type GlobalCitiesResponse,
  type GlobalCityUniversitiesResponse,
} from '../services/globalApi';
import type { GlobalCityCluster } from '../types/domain';

interface SelectedCityState {
  name: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  slug?: string;
  qsRank?: number | null;
  qsSource?: string | null;
  shortDescription?: string | null;
  monthlyLivingMinUsd?: number | null;
  monthlyLivingMaxUsd?: number | null;
  officialTourismUrl?: string | null;
}

export const ExploreByCityView: React.FC = () => {
  const {
    catalog,
    countriesByCode,
    selectedCountryCode,
    selectedCitySlug,
    setSelectedCitySlug,
    openUniversityProfile,
    savedUniversities,
    saveUniversity,
    removeSavedUniversity,
    compareSlugs,
    toggleCompareSlug,
    language,
    t,
  } = useApp();
  const ui = getExtendedUIStrings(language).citiesPage;
  const micro = getUniversalMicroCopy(language);

  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState<GlobalCitiesResponse | null>(null);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [citySearchError, setCitySearchError] = useState<string | null>(null);

  // Selected city (defaults to catalog selectedCitySlug if matched, else Top #1 London or Tokyo)
  const initialCity = useMemo<SelectedCityState>(() => {
    const seeded = catalog.cities.find((c) => c.slug === selectedCitySlug);
    if (seeded) {
      const country = countriesByCode[seeded.countryCode];
      const topMatch = TOP_10_STUDENT_CITIES.find(
        (tc) => tc.name.toLowerCase() === seeded.name.toLowerCase() && tc.countryCode === seeded.countryCode
      );
      return {
        name: seeded.name,
        countryCode: seeded.countryCode,
        countryName: country?.name || seeded.countryCode,
        countryFlag: country?.flagEmoji || '',
        slug: seeded.slug,
        qsRank: topMatch?.rank ?? null,
        qsSource: topMatch?.rankingSource ?? null,
        shortDescription: topMatch?.shortDescription || seeded.academicProfile,
        monthlyLivingMinUsd: seeded.monthlyLivingMinUsd,
        monthlyLivingMaxUsd: seeded.monthlyLivingMaxUsd,
        officialTourismUrl: seeded.officialTourismUrl,
      };
    }
    const topDefault = TOP_10_STUDENT_CITIES[0];
    return {
      name: topDefault.name,
      countryCode: topDefault.countryCode,
      countryName: topDefault.countryName,
      countryFlag: topDefault.countryFlag,
      slug: topDefault.slug,
      qsRank: topDefault.rank,
      qsSource: topDefault.rankingSource,
      shortDescription: topDefault.shortDescription,
      monthlyLivingMinUsd: topDefault.monthlyLivingMinUsd,
      monthlyLivingMaxUsd: topDefault.monthlyLivingMaxUsd,
    };
  }, [catalog.cities, countriesByCode, selectedCitySlug]);

  const [activeCity, setActiveCity] = useState<SelectedCityState>(initialCity);

  // Sync if user jumped here from World Map or Countries view with a specific city slug
  useEffect(() => {
    if (!selectedCitySlug) return;
    const seeded = catalog.cities.find((c) => c.slug === selectedCitySlug);
    if (seeded && seeded.name !== activeCity.name) {
      const country = countriesByCode[seeded.countryCode];
      const topMatch = TOP_10_STUDENT_CITIES.find(
        (tc) => tc.name.toLowerCase() === seeded.name.toLowerCase() && tc.countryCode === seeded.countryCode
      );
      setActiveCity({
        name: seeded.name,
        countryCode: seeded.countryCode,
        countryName: country?.name || seeded.countryCode,
        countryFlag: country?.flagEmoji || '',
        slug: seeded.slug,
        qsRank: topMatch?.rank ?? null,
        qsSource: topMatch?.rankingSource ?? null,
        shortDescription: topMatch?.shortDescription || seeded.academicProfile,
        monthlyLivingMinUsd: seeded.monthlyLivingMinUsd,
        monthlyLivingMaxUsd: seeded.monthlyLivingMaxUsd,
        officialTourismUrl: seeded.officialTourismUrl,
      });
    } else if (!seeded && selectedCountryCode) {
      const byCountry = TOP_10_STUDENT_CITIES.find((tc) => tc.countryCode === selectedCountryCode);
      if (byCountry && byCountry.countryCode !== activeCity.countryCode) {
        setActiveCity({
          name: byCountry.name,
          countryCode: byCountry.countryCode,
          countryName: byCountry.countryName,
          countryFlag: byCountry.countryFlag,
          slug: byCountry.slug,
          qsRank: byCountry.rank,
          qsSource: byCountry.rankingSource,
          shortDescription: byCountry.shortDescription,
          monthlyLivingMinUsd: byCountry.monthlyLivingMinUsd,
          monthlyLivingMaxUsd: byCountry.monthlyLivingMaxUsd,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCitySlug, selectedCountryCode]);

  // City university listing state
  const [uniQuery, setUniQuery] = useState('');
  const [uniSort, setUniSort] = useState<'prominence' | 'name' | 'citations'>('prominence');
  const [uniPage, setUniPage] = useState(1);
  const [cityUniData, setCityUniData] = useState<GlobalCityUniversitiesResponse | null>(null);
  const [isLoadingCityUnis, setIsLoadingCityUnis] = useState(false);
  const [cityUnisError, setCityUnisError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Universal Global City Search (debounced)
  useEffect(() => {
    const controller = new AbortController();
    const q = citySearch.trim();
    const timer = window.setTimeout(() => {
      setIsSearchingCities(true);
      setCitySearchError(null);
      fetchGlobalCities({ q }, controller.signal)
        .then((res) => {
          setCityResults(res);
          setIsSearchingCities(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsSearchingCities(false);
          setCitySearchError(
            err instanceof Error ? err.message : 'Unable to search global cities right now.'
          );
        });
    }, q ? 240 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [citySearch]);

  // Reset university filters when active city changes
  useEffect(() => {
    setUniQuery('');
    setUniSort('prominence');
    setUniPage(1);
  }, [activeCity.name, activeCity.countryCode]);

  useEffect(() => {
    setUniPage(1);
  }, [uniQuery, uniSort]);

  // Fetch complete verified universities for the selected city
  useEffect(() => {
    if (!activeCity.name) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoadingCityUnis(true);
      setCityUnisError(null);
      fetchCityUniversities(
        {
          city: activeCity.name,
          country: activeCity.countryCode || undefined,
          q: uniQuery,
          sort: uniSort,
          page: uniPage,
          limit: 24,
        },
        controller.signal
      )
        .then((res) => {
          setCityUniData(res);
          setIsLoadingCityUnis(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsLoadingCityUnis(false);
          setCityUnisError(
            err instanceof Error ? err.message : 'Unable to load universities for this city.'
          );
        });
    }, uniQuery ? 220 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCity.name, activeCity.countryCode, uniQuery, uniSort, uniPage, retryTick]);

  const handleSelectCityCluster = (cluster: GlobalCityCluster) => {
    const seeded = catalog.cities.find(
      (c) =>
        c.slug === cluster.slug ||
        (c.name.toLowerCase() === cluster.name.toLowerCase() && c.countryCode === cluster.countryCode)
    );
    if (seeded) setSelectedCitySlug(seeded.slug);
    setActiveCity({
      name: cluster.name,
      countryCode: cluster.countryCode,
      countryName: cluster.countryName,
      countryFlag: cluster.countryFlag,
      slug: cluster.slug,
      qsRank: cluster.qsStudentCityRank ?? null,
      qsSource: cluster.qsRankingSource ?? null,
      shortDescription: cluster.shortDescription || seeded?.academicProfile || null,
      monthlyLivingMinUsd: cluster.monthlyLivingMinUsd ?? seeded?.monthlyLivingMinUsd ?? null,
      monthlyLivingMaxUsd: cluster.monthlyLivingMaxUsd ?? seeded?.monthlyLivingMaxUsd ?? null,
      officialTourismUrl: seeded?.officialTourismUrl ?? null,
    });
  };

  const handleSelectTopCity = (tc: (typeof TOP_10_STUDENT_CITIES)[number]) => {
    const seeded = catalog.cities.find((c) => c.slug === tc.slug);
    if (seeded) setSelectedCitySlug(seeded.slug);
    setActiveCity({
      name: tc.name,
      countryCode: tc.countryCode,
      countryName: tc.countryName,
      countryFlag: tc.countryFlag,
      slug: tc.slug,
      qsRank: tc.rank,
      qsSource: tc.rankingSource,
      shortDescription: tc.shortDescription,
      monthlyLivingMinUsd: tc.monthlyLivingMinUsd,
      monthlyLivingMaxUsd: tc.monthlyLivingMaxUsd,
      officialTourismUrl: seeded?.officialTourismUrl ?? null,
    });
  };

  const rankingMeta = cityResults?.rankingMeta || {
    source: 'QS Best Student Cities 2025',
    year: 2025,
    url: 'https://www.topuniversities.com/city-rankings',
  };

  const isSearchingMode = citySearch.trim().length > 0;
  const matchedCities = cityResults?.matchedCities || [];

  return (
    <div className="space-y-8">
      {/* Editorial City Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden border border-[var(--border-hairline)] min-h-[168px] flex items-end">
        <img
          src="/src/assets/images/city_skyline_atelier_1794911987013.jpg"
          alt="International university city skyline editorial panorama"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
        <div className="relative z-10 p-6 sm:p-7 text-white max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            {t.cityExplorer.title}
          </h1>
        </div>
      </section>

      {/* Step 01: Universal Global City Search */}
      <section className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[var(--accent-primary)]" />
            <span>{ui.title}</span>
          </h2>
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder={ui.searchPlaceholder}
              aria-label={ui.searchPlaceholder}
              data-testid="global-city-search-input"
              className="glass-input w-full pl-9 pr-9 py-2 rounded-xl text-sm"
            />
            {citySearch && (
              <button
                type="button"
                onClick={() => setCitySearch('')}
                aria-label="Clear city search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Universal City Search Results (Shown when user searches) */}
        {isSearchingMode && (
          <div className="space-y-3 pt-2 border-t border-[var(--border-hairline)]" data-testid="global-city-search-results">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {isSearchingCities
                  ? `Searching global city registries for "${citySearch.trim()}"...`
                  : `${matchedCities.length} matching global student ${
                      matchedCities.length === 1 ? 'city' : 'cities'
                    } for "${citySearch.trim()}"`}
              </span>
              {isSearchingCities && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />}
            </div>

            {citySearchError ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">{citySearchError}</p>
            ) : !isSearchingCities && matchedCities.length === 0 ? (
              <div className="rounded-xl surface-subtle p-4 text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
                <span>
                  No pre-indexed cluster matched &ldquo;{citySearch.trim()}&rdquo; directly. You can still query universities located in this city directly:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCity({
                      name: citySearch.trim(),
                      countryCode: '',
                      countryName: 'Global Registry',
                      countryFlag: '🌍',
                    })
                  }
                  className="btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  Search universities in &ldquo;{citySearch.trim()}&rdquo;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedCities.map((city) => {
                  const selected =
                    activeCity.name.toLowerCase() === city.name.toLowerCase() &&
                    (!activeCity.countryCode || activeCity.countryCode === city.countryCode);
                  return (
                    <button
                      key={`${city.countryCode}-${city.slug}`}
                      type="button"
                      data-testid={`city-search-card-${city.slug}`}
                      onClick={() => handleSelectCityCluster(city)}
                      className={`surface-card motion-interactive-card rounded-2xl p-4 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                        selected
                          ? 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)]">
                            {city.countryFlag} {city.countryName} · {city.continent}
                          </p>
                          <h3 className="font-display text-xl font-semibold leading-tight mt-0.5 truncate">
                            {city.name}
                          </h3>
                        </div>
                        {city.qsStudentCityRank && (
                          <span className="shrink-0 text-[11px] font-mono-tabular font-semibold px-2 py-0.5 rounded-lg bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]">
                            #{city.qsStudentCityRank} QS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-hairline)]">
                        <span className="text-[var(--text-muted)] font-mono-tabular">
                          {city.universityCount > 0
                            ? `${city.universityCount} ${micro.universitiesCountUnit}`
                            : micro.view}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 02: Verified Top 10 Global Student Cities */}
      <section className="space-y-4" data-testid="top-10-student-cities-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--accent-primary)]" />
            <span>{ui.badge}</span>
          </h2>
          <a
            href={rankingMeta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            <span>{rankingMeta.source}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {TOP_10_STUDENT_CITIES.map((city) => {
            const selected =
              activeCity.name.toLowerCase() === city.name.toLowerCase() &&
              activeCity.countryCode === city.countryCode;
            return (
              <button
                key={city.slug}
                type="button"
                data-testid={`top-city-card-${city.slug}`}
                onClick={() => handleSelectTopCity(city)}
                className={`surface-card motion-interactive-card rounded-2xl p-4 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                  selected
                    ? 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
                    : ''
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-xs font-semibold text-[var(--accent-primary)]">
                      #{city.rank}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {city.countryFlag} {city.countryCode}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-tight">{city.name}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{city.countryName}</p>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Est. Living</span>
                  <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                    ${city.monthlyLivingMinUsd}–${city.monthlyLivingMaxUsd}/mo
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 03: Complete Verified Universities in Selected City */}
      <section className="space-y-4" data-testid="selected-city-universities-section">
        <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {activeCity.countryFlag} {cityUniData?.countryName || activeCity.countryName}
                </span>
                {activeCity.qsRank && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-[var(--accent-primary)]">
                      #{activeCity.qsRank} {activeCity.qsSource || rankingMeta.source}
                    </span>
                  </>
                )}
                {cityUniData?.latitude != null && cityUniData?.longitude != null && (
                  <>
                    <span>·</span>
                    <span className="font-mono-tabular">
                      {cityUniData.latitude.toFixed(2)}°, {cityUniData.longitude.toFixed(2)}°
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display text-3xl font-semibold">
                {t.cityExplorer.stepUniversities} {activeCity.name}
              </h2>
              {activeCity.shortDescription && (
                <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
                  {activeCity.shortDescription}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl surface-subtle">
                <span className="text-[var(--text-muted)]">Verified Institutions: </span>
                <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                  {(cityUniData?.totalCount ?? 0).toLocaleString()}
                </span>
              </div>
              {activeCity.monthlyLivingMinUsd && activeCity.monthlyLivingMaxUsd ? (
                <div className="px-3 py-1.5 rounded-xl surface-subtle">
                  <span className="text-[var(--text-muted)]">{t.common.livingMonthly}: </span>
                  <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                    ${activeCity.monthlyLivingMinUsd}–${activeCity.monthlyLivingMaxUsd}/mo
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl surface-subtle text-[var(--text-muted)]">
                  City cost estimate: Not yet verified
                </div>
              )}
              {activeCity.officialTourismUrl && (
                <a
                  href={activeCity.officialTourismUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[var(--accent-primary)] hover:underline"
                >
                  <span>City Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Search & Sort within Selected City */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={uniQuery}
                onChange={(e) => setUniQuery(e.target.value)}
                placeholder={`Filter universities in ${activeCity.name} (name, alias, field)...`}
                aria-label={`Filter universities in ${activeCity.name}`}
                data-testid="city-uni-filter-input"
                className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              {cityUniData && (
                <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
                  Showing {cityUniData.items.length} of {cityUniData.totalCount.toLocaleString()}
                </span>
              )}
              <select
                value={uniSort}
                onChange={(e) =>
                  setUniSort(e.target.value as 'prominence' | 'name' | 'citations')
                }
                aria-label="Sort universities in city"
                className="glass-input px-3 py-1.5 rounded-xl text-xs cursor-pointer"
              >
                <option value="prominence">Sort: Prominence</option>
                <option value="citations">Sort: Research Impact</option>
                <option value="name">Sort: Name (A–Z)</option>
              </select>
            </div>
          </div>

          {cityUnisError ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm space-y-2">
              <p className="text-[var(--text-secondary)]">{cityUnisError}</p>
              <button
                type="button"
                onClick={() => setRetryTick((n) => n + 1)}
                className="btn-glass px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : isLoadingCityUnis ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
              <span>Loading verified universities in {activeCity.name}...</span>
            </div>
          ) : !cityUniData || cityUniData.items.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-sm text-[var(--text-secondary)]">
              <p>No verified higher-education institutions matched this query in {activeCity.name}.</p>
              {uniQuery && (
                <button
                  type="button"
                  onClick={() => setUniQuery('')}
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {cityUniData.items.map((uni) => {
                  const isSaved = savedUniversities.some((s) => s.universitySlug === uni.slug);
                  const isComparing = compareSlugs.includes(uni.slug);
                  const cleanName = formatCleanUniversityName(uni.name);
                  const cleanRank = formatCleanRankDisplay(uni.qsRankDisplay);
                  const cleanTuition = uni.tuitionLocalDisplay
                    ? splitTuitionDisplay(uni.tuitionLocalDisplay).primary
                    : uni.institutionType;

                  return (
                    <article
                      key={uni.slug}
                      className="surface-subtle rounded-2xl p-5 flex flex-col justify-between gap-4 border border-[var(--border-hairline)]"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <span className="truncate">{uni.institutionType}</span>
                          {cleanRank ? (
                            <span className="font-mono-tabular font-semibold text-[var(--text-primary)] shrink-0">
                              QS {cleanRank}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="font-display text-xl font-semibold leading-snug">
                          {cleanName}
                        </h3>

                        <p className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                          {cleanTuition}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              isSaved
                                ? removeSavedUniversity(uni.slug)
                                : saveUniversity({ universitySlug: uni.slug })
                            }
                            aria-label={isSaved ? `${micro.saved} ${cleanName}` : `${micro.save} ${cleanName}`}
                            className={`p-2 rounded-xl cursor-pointer ${
                              isSaved
                                ? 'glass-pill-active text-[var(--accent-primary)]'
                                : 'btn-glass'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompareSlug(uni.slug)}
                            aria-label={`${micro.compare} ${cleanName}`}
                            className={`p-2 rounded-xl cursor-pointer ${
                              isComparing
                                ? 'glass-pill-active text-[var(--accent-secondary)]'
                                : 'btn-glass'
                            }`}
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openUniversityProfile(uni.slug)}
                          className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <span>{micro.view}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {cityUniData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-hairline)] text-xs">
                  <button
                    type="button"
                    disabled={uniPage <= 1}
                    onClick={() => setUniPage((p) => Math.max(1, p - 1))}
                    className="btn-glass inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{micro.back}</span>
                  </button>
                  <span className="font-mono-tabular text-[var(--text-muted)]">
                    {cityUniData.page} / {cityUniData.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={uniPage >= cityUniData.totalPages}
                    onClick={() => setUniPage((p) => Math.min(cityUniData.totalPages, p + 1))}
                    className="btn-glass inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium disabled:opacity-40 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
