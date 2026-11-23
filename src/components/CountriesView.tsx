import React, { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getExtendedUIStrings, translateContinentName } from '../i18n/uiStrings';
import {
  formatCleanRankDisplay,
  formatCleanUniversityName,
  getUniversalMicroCopy,
  splitTuitionDisplay,
} from '../utils/displayCopy';
import {
  fetchCountryUniversities,
  fetchGlobalCountries,
  fetchGlobalScholarships,
  type EnrichedScholarshipItem,
  type GlobalCountriesResponse,
  type GlobalCountryUniversitiesResponse,
} from '../services/globalApi';
import type { GlobalCountrySummary } from '../types/domain';

interface GeoFeature {
  type: 'Feature';
  id?: string | number;
  geometry: unknown;
}

const CONTINENTS = [
  'All',
  'Asia',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Oceania',
] as const;

export const CountriesView: React.FC = () => {
  const {
    catalog,
    countriesByCode,
    selectedCountryCode,
    setSelectedCountryCode,
    openCityInExplorer,
    openUniversityProfile,
    language,
    t,
  } = useApp();
  const ui = getExtendedUIStrings(language).countriesPage;
  const micro = getUniversalMicroCopy(language);

  const [continentFilter, setContinentFilter] = useState<string>('All');
  const [countrySearch, setCountrySearch] = useState('');
  const [showAllCountriesInStrip, setShowAllCountriesInStrip] = useState(false);

  const [globalCountriesData, setGlobalCountriesData] = useState<GlobalCountriesResponse | null>(
    null
  );
  const [allGlobalCountries, setAllGlobalCountries] = useState<GlobalCountrySummary[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Selected country paginated university directory
  const [uniQuery, setUniQuery] = useState('');
  const [uniCityFilter, setUniCityFilter] = useState('');
  const [uniSort, setUniSort] = useState<'prominence' | 'name' | 'citations'>('prominence');
  const [uniPage, setUniPage] = useState(1);
  const [countryUnisData, setCountryUnisData] =
    useState<GlobalCountryUniversitiesResponse | null>(null);
  const [isLoadingUnis, setIsLoadingUnis] = useState(false);
  const [unisError, setUnisError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Country verified scholarships
  const [countryScholarships, setCountryScholarships] = useState<EnrichedScholarshipItem[]>([]);

  // Fetch full unfiltered list once so we can always resolve activeCountry even across filters
  useEffect(() => {
    const controller = new AbortController();
    fetchGlobalCountries({}, controller.signal)
      .then((res) => {
        setAllGlobalCountries(res.countries);
      })
      .catch(() => {
        // Fallback to catalog.countries smoothly
      });
    return () => controller.abort();
  }, []);

  // Fetch filtered/searched countries (global search ALWAYS searches across ALL continents when query is non-empty)
  useEffect(() => {
    const controller = new AbortController();
    const q = countrySearch.trim();
    const timer = window.setTimeout(() => {
      setIsLoadingCountries(true);
      fetchGlobalCountries(
        {
          q,
          continent: q ? 'All' : continentFilter,
        },
        controller.signal
      )
        .then((res) => {
          setGlobalCountriesData(res);
          setIsLoadingCountries(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setIsLoadingCountries(false);
        });
    }, q ? 180 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [countrySearch, continentFilter]);

  const displayedCountries: GlobalCountrySummary[] = useMemo(() => {
    if (globalCountriesData?.countries) return globalCountriesData.countries;
    return catalog.countries
      .filter((c) => continentFilter === 'All' || c.continent === continentFilter)
      .map((c) => ({
        isoCode: c.isoCode,
        isoNumeric: c.isoNumeric,
        name: c.name,
        continent: c.continent,
        flagEmoji: c.flagEmoji,
        capital: c.capital,
        totalVerifiedUniversities: catalog.universities.filter((u) => u.countryCode === c.isoCode)
          .length,
        seededUniversityCount: catalog.universities.filter((u) => u.countryCode === c.isoCode)
          .length,
        isSeededDossier: true,
        tuitionRangeMinUsd: c.tuitionRangeMinUsd,
        tuitionRangeMaxUsd: c.tuitionRangeMaxUsd,
        livingCostMonthlyMinUsd: c.livingCostMonthlyMinUsd,
        livingCostMonthlyMaxUsd: c.livingCostMonthlyMaxUsd,
        educationSystem: c.educationSystem,
        admissionSystem: c.admissionSystem,
        languageRequirements: c.languageRequirements,
        internationalInfo: c.internationalInfo,
        academicOpportunities: c.academicOpportunities,
        officialPortalUrl: c.officialPortalUrl,
        sourceOrg: c.sourceOrg,
        verifiedAt: c.verifiedAt,
      }));
  }, [globalCountriesData, catalog.countries, catalog.universities, continentFilter]);

  const activeCountry: GlobalCountrySummary | null = useMemo(() => {
    const code = (selectedCountryCode || 'JP').toUpperCase();
    return (
      allGlobalCountries.find((c) => c.isoCode === code) ||
      displayedCountries.find((c) => c.isoCode === code) ||
      displayedCountries[0] ||
      allGlobalCountries[0] ||
      null
    );
  }, [selectedCountryCode, allGlobalCountries, displayedCountries]);

  const seededCountryRecord = activeCountry ? countriesByCode[activeCountry.isoCode] : undefined;

  // Reset university filters when active country changes
  useEffect(() => {
    setUniQuery('');
    setUniCityFilter('');
    setUniSort('prominence');
    setUniPage(1);
  }, [activeCountry?.isoCode]);

  useEffect(() => {
    setUniPage(1);
  }, [uniQuery, uniCityFilter, uniSort]);

  // Fetch complete paginated university dataset & real city clusters for active country
  useEffect(() => {
    if (!activeCountry) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoadingUnis(true);
      setUnisError(null);
      fetchCountryUniversities(
        activeCountry.isoCode,
        {
          q: uniQuery,
          city: uniCityFilter,
          sort: uniSort,
          page: uniPage,
          limit: 20,
        },
        controller.signal
      )
        .then((res) => {
          setCountryUnisData(res);
          setIsLoadingUnis(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsLoadingUnis(false);
          setUnisError(
            err instanceof Error ? err.message : 'Unable to load universities for this country.'
          );
        });
    }, uniQuery ? 220 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCountry?.isoCode, uniQuery, uniCityFilter, uniSort, uniPage, retryTick]);

  // Fetch verified scholarships for active country
  useEffect(() => {
    if (!activeCountry) return;
    const controller = new AbortController();
    fetchGlobalScholarships({ country: activeCountry.isoCode }, controller.signal)
      .then((res) => setCountryScholarships(res.items))
      .catch(() => {
        if (!controller.signal.aborted) setCountryScholarships([]);
      });
    return () => controller.abort();
  }, [activeCountry?.isoCode]);

  const countryFeature = useMemo(() => {
    if (!activeCountry) return null;
    const topology = worldAtlas as unknown as {
      type: 'Topology';
      objects: { countries: unknown };
    };
    const geo = feature(topology as never, topology.objects.countries as never) as unknown as {
      features: GeoFeature[];
    };
    return (
      geo.features.find(
        (f) =>
          String(f.id) === String(Number(activeCountry.isoNumeric)) ||
          String(f.id).padStart(3, '0') === String(activeCountry.isoNumeric).padStart(3, '0')
      ) || null
    );
  }, [activeCountry]);

  const { pathD, projectPoint } = useMemo(() => {
    if (!countryFeature) {
      return {
        pathD: '',
        projectPoint: (_coords: [number, number]) => null as [number, number] | null,
      };
    }
    const proj = geoNaturalEarth1().fitExtent(
      [
        [24, 24],
        [436, 236],
      ],
      countryFeature as never
    );
    const generator = geoPath().projection(proj);
    return {
      pathD: generator(countryFeature as never) || '',
      projectPoint: (coords: [number, number]) => proj(coords),
    };
  }, [countryFeature]);

  // Combine real verified city clusters from API with seeded catalog cities for mini-map markers
  const mapCityClusters = useMemo(() => {
    if (!activeCountry) return [];
    const apiClusters = (countryUnisData?.cities || []).filter(
      (c) => c.latitude !== null && c.longitude !== null
    );
    if (apiClusters.length > 0) return apiClusters.slice(0, 12);
    return catalog.cities
      .filter((c) => c.countryCode === activeCountry.isoCode)
      .map((c) => ({
        name: c.name,
        count: catalog.universities.filter((u) => u.citySlug === c.slug).length,
        latitude: c.latitude,
        longitude: c.longitude,
      }));
  }, [activeCountry, countryUnisData?.cities, catalog.cities, catalog.universities]);

  if (!activeCountry) return null;

  const visibleStripCountries =
    countrySearch.trim() || showAllCountriesInStrip
      ? displayedCountries
      : displayedCountries.slice(0, 28);

  return (
    <div className="space-y-8">
      {/* Header + Global Country Search + All 6 Continents */}
      <section className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-3xl font-semibold">{t.countriesView.title}</h1>
            {globalCountriesData && (
              <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                {globalCountriesData.totalCountries}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Global Country Search (searches across ALL continents regardless of tab) */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder={ui.searchPlaceholder}
                aria-label={ui.searchPlaceholder}
                data-testid="global-country-search-input"
                className="glass-input w-full pl-9 pr-8 py-1.5 rounded-xl text-sm"
              />
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch('')}
                  aria-label="Clear country search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-xl glass-segmented p-0.5">
              {CONTINENTS.map((cont) => {
                const cnt =
                  cont === 'All'
                    ? globalCountriesData?.totalCountries
                    : globalCountriesData?.continentCounts?.[cont];
                return (
                  <button
                    key={cont}
                    type="button"
                    data-testid={`continent-tab-${cont.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      setContinentFilter(cont);
                      setCountrySearch('');
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      continentFilter === cont && !countrySearch.trim()
                        ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {translateContinentName(cont, language)}
                    {typeof cnt === 'number' ? ` (${cnt})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Country Selector Pills with Real Verified University Counts */}
        <div className="space-y-2">
          {isLoadingCountries && displayedCountries.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading global countries directory...</span>
            </div>
          ) : displayedCountries.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              No countries matched &ldquo;{countrySearch.trim()}&rdquo;. Try an official name or 2-letter ISO code.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2" data-testid="countries-selector-list">
              {visibleStripCountries.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  data-testid={`country-pill-${country.isoCode}`}
                  onClick={() => setSelectedCountryCode(country.isoCode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                    activeCountry.isoCode === country.isoCode
                      ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                      : 'btn-glass'
                  }`}
                >
                  <span>
                    {country.flagEmoji} {country.name}
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                    ({country.totalVerifiedUniversities.toLocaleString()})
                  </span>
                </button>
              ))}
              {!countrySearch.trim() && displayedCountries.length > 28 && (
                <button
                  type="button"
                  onClick={() => setShowAllCountriesInStrip((v) => !v)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  {showAllCountriesInStrip
                    ? 'Show fewer'
                    : `+ Show all ${displayedCountries.length} countries`}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Country Hero Dossier + Interactive Location Map with Real City Clusters */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 surface-card rounded-2xl p-6 sm:p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {translateContinentName(activeCountry.continent, language)}
                  {activeCountry.capital ? ` · ${activeCountry.capital}` : ''}
                  {seededCountryRecord?.academicYear ? ` · ${seededCountryRecord.academicYear}` : ''}
                </p>
                <h2 className="font-display text-4xl font-semibold mt-1">
                  {activeCountry.flagEmoji} {activeCountry.name}
                </h2>
              </div>
              <div className="px-3.5 py-2 rounded-xl surface-subtle text-right">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {ui.verifiedUnisLabel}
                </p>
                <p className="font-mono-tabular text-xl font-semibold text-[var(--accent-primary)]">
                  {(
                    countryUnisData?.totalCount ?? activeCountry.totalVerifiedUniversities
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                  {t.countriesView.educationSystem} (Country-Level Overview)
                </h3>
                <p>
                  {activeCountry.educationSystem ||
                    `${activeCountry.name} hosts ${(
                      countryUnisData?.totalCount ?? activeCountry.totalVerifiedUniversities
                    ).toLocaleString()} verified higher-education institutions indexed via OpenAlex and ROR. Country-level system summary is not yet curated — inspect individual university profiles below for institution-specific degree structures.`}
                </p>
              </div>
              {activeCountry.academicOpportunities && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                    {t.countriesView.academicOpportunities}
                  </h3>
                  <p>{activeCountry.academicOpportunities}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-hairline)]">
            <div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t.countriesView.tuitionRange} ·{' '}
                {activeCountry.tuitionRangeMinUsd != null ? t.common.verified : 'Varies by Institution'}
              </p>
              <p className="font-mono-tabular text-lg font-semibold mt-1">
                {activeCountry.tuitionRangeMinUsd != null &&
                activeCountry.tuitionRangeMaxUsd != null
                  ? `$${activeCountry.tuitionRangeMinUsd.toLocaleString()} – $${activeCountry.tuitionRangeMaxUsd.toLocaleString()} USD`
                  : 'Check university portals'}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t.countriesView.livingCost} ·{' '}
                {activeCountry.livingCostMonthlyMinUsd != null
                  ? t.common.estimated
                  : 'Not Yet Verified'}
              </p>
              <p className="font-mono-tabular text-lg font-semibold mt-1">
                {activeCountry.livingCostMonthlyMinUsd != null &&
                activeCountry.livingCostMonthlyMaxUsd != null
                  ? `$${activeCountry.livingCostMonthlyMinUsd.toLocaleString()} – $${activeCountry.livingCostMonthlyMaxUsd.toLocaleString()} / mo`
                  : 'Not yet curated'}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Country Sub-Map with Real Multi-City University Clusters */}
        <div className="lg:col-span-5 surface-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Major University Cities ({mapCityClusters.length})
            </span>
            <button
              type="button"
              onClick={() => openCityInExplorer(activeCountry.isoCode)}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              {t.worldExplorer.viewCities} →
            </button>
          </div>

          <svg
            viewBox="0 0 460 260"
            role="img"
            aria-label={`Map outline of ${activeCountry.name}`}
            className="w-full h-64 surface-subtle border-x-0"
          >
            {pathD && (
              <path
                d={pathD}
                fill="color-mix(in srgb, var(--accent-primary) 18%, var(--bg-elevated))"
                stroke="var(--accent-primary)"
                strokeWidth="1.2"
              />
            )}
            {mapCityClusters.map((city, idx) => {
              if (city.latitude == null || city.longitude == null) return null;
              const pt = projectPoint([city.longitude, city.latitude]);
              if (!pt) return null;
              const radius = Math.min(9, Math.max(4.5, 4 + Math.log2(city.count + 1)));
              return (
                <g
                  key={city.name}
                  transform={`translate(${pt[0]}, ${pt[1]})`}
                  className="cursor-pointer"
                  onClick={() => setUniCityFilter((prev) => (prev === city.name ? '' : city.name))}
                >
                  <circle
                    r={radius}
                    fill={
                      uniCityFilter === city.name
                        ? 'var(--accent-primary)'
                        : 'var(--accent-secondary)'
                    }
                    stroke="var(--bg-elevated)"
                    strokeWidth="1.8"
                  />
                  {idx < 6 && (
                    <text
                      x={radius + 4}
                      y="4"
                      fontSize="10"
                      fontWeight="600"
                      fill="var(--text-primary)"
                    >
                      {city.name} ({city.count})
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="p-4 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-muted)] font-mono-tabular">
              {activeCountry.sourceOrg}
            </span>
            {activeCountry.officialPortalUrl && (
              <a
                href={activeCountry.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[var(--accent-primary)] hover:underline"
              >
                <span>{micro.portal}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Country-Level vs Institution-Specific Admission, Language & Visa Guidance */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-card rounded-2xl p-5 space-y-2">
          <h3 className="font-display text-xl font-semibold">{t.countriesView.admissionSystem}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {activeCountry.admissionSystem ||
              'Admission requirements and entrance examinations vary by institution and degree level. Verify exact prerequisites on each university’s official admissions page.'}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5 space-y-2">
          <h3 className="font-display text-xl font-semibold">{t.countriesView.languageReq}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {activeCountry.languageRequirements ||
              'Language proficiency thresholds (local language or English tracks such as IELTS/TOEFL) are set at the program and faculty level.'}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5 space-y-2">
          <h3 className="font-display text-xl font-semibold">{t.countriesView.internationalInfo}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {activeCountry.internationalInfo ||
              'Consult the host country’s official immigration/embassy portal and university international student office for current student visa, residence permit, and work-hour regulations.'}
          </p>
        </div>
      </section>

      {/* Full Paginated Universities in Country + Country Scholarships */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3" data-testid="country-universities-section">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-2xl font-semibold">
                {t.nav.universities} · {activeCountry.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono-tabular">
                {countryUnisData
                  ? `Showing ${countryUnisData.items.length} on page ${countryUnisData.page}/${countryUnisData.totalPages} (${countryUnisData.totalCount.toLocaleString()} verified)`
                  : 'Loading verified registry...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={uniQuery}
                  onChange={(e) => setUniQuery(e.target.value)}
                  placeholder={`Search in ${activeCountry.name}...`}
                  aria-label={`Search universities in ${activeCountry.name}`}
                  className="glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs w-44 sm:w-52"
                />
              </div>
              <select
                value={uniSort}
                onChange={(e) =>
                  setUniSort(e.target.value as 'prominence' | 'name' | 'citations')
                }
                aria-label="Sort country universities"
                className="glass-input px-2.5 py-1.5 rounded-xl text-xs cursor-pointer"
              >
                <option value="prominence">Top</option>
                <option value="citations">Impact</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>

          {/* City filter chips */}
          {countryUnisData && countryUnisData.cities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setUniCityFilter('')}
                className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                  !uniCityFilter
                    ? 'glass-pill-active font-semibold text-[var(--text-primary)]'
                    : 'btn-glass text-[var(--text-muted)]'
                }`}
              >
                All cities
              </button>
              {countryUnisData.cities.slice(0, 10).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setUniCityFilter((prev) => (prev === c.name ? '' : c.name))}
                  className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                    uniCityFilter === c.name
                      ? 'glass-pill-active font-semibold text-[var(--text-primary)]'
                      : 'btn-glass text-[var(--text-secondary)]'
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
          )}

          <div className="surface-card rounded-2xl divide-y divide-[var(--border-hairline)]">
            {unisError ? (
              <div className="p-5 text-sm space-y-2">
                <p className="text-[var(--text-secondary)]">{unisError}</p>
                <button
                  type="button"
                  onClick={() => setRetryTick((n) => n + 1)}
                  className="btn-glass px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : isLoadingUnis ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                <span>Loading verified universities in {activeCountry.name}...</span>
              </div>
            ) : !countryUnisData || countryUnisData.items.length === 0 ? (
              <div className="p-6 text-sm text-[var(--text-secondary)]">
                No verified universities matched your current filter in {activeCountry.name}.
              </div>
            ) : (
              countryUnisData.items.map((uni) => {
                const cleanName = formatCleanUniversityName(uni.name);
                const cleanRank = formatCleanRankDisplay(uni.qsRankDisplay);
                const cleanTuition = uni.tuitionLocalDisplay
                  ? splitTuitionDisplay(uni.tuitionLocalDisplay).primary
                  : uni.institutionType;

                return (
                  <div
                    key={uni.slug}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)]">
                        {uni.cityName}
                        {cleanRank ? ` · QS ${cleanRank}` : ''}
                      </p>
                      <p className="font-display text-lg font-semibold mt-0.5 truncate">
                        {cleanName}
                      </p>
                      <p className="text-xs font-mono-tabular text-[var(--text-secondary)] mt-0.5">
                        {cleanTuition}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openUniversityProfile(uni.slug)}
                      className="btn-glass shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      <span>{micro.view}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {countryUnisData && countryUnisData.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                disabled={uniPage <= 1}
                onClick={() => setUniPage((p) => Math.max(1, p - 1))}
                className="btn-glass inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-mono-tabular text-[var(--text-muted)]">
                Page {countryUnisData.page} of {countryUnisData.totalPages}
              </span>
              <button
                type="button"
                disabled={uniPage >= countryUnisData.totalPages}
                onClick={() => setUniPage((p) => Math.min(countryUnisData.totalPages, p + 1))}
                className="btn-glass inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-display text-2xl font-semibold">
            {t.nav.scholarships} ({countryScholarships.length})
          </h3>
          <div className="surface-card rounded-2xl divide-y divide-[var(--border-hairline)]">
            {countryScholarships.length === 0 ? (
              <div className="p-5 text-sm text-[var(--text-secondary)]">
                No national-level scholarship is currently cataloged for {activeCountry.name}. Explore university-specific merit, research, or need-based aid on each institution’s official portal.
              </div>
            ) : (
              countryScholarships.map((sch) => (
                <div key={sch.slug} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-semibold leading-snug">{sch.name}</p>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md surface-subtle text-[var(--text-secondary)]">
                      {sch.computedStatus.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{sch.coverageSummary}</p>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                    <span>{sch.deadlineText}</span>
                    <a
                      href={sch.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      Official <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
