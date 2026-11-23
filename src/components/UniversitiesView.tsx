import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitCompare,
  Info,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Search,
  Sparkles,
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
import { InstitutionalMediaPlate } from './InstitutionalMediaPlate';
import { GlassButton, GlassCard, GlassInput, GlassSegmented, GlassSelect } from './glass';
import {
  fetchGlobalCountries,
  fetchGlobalUniversities,
  fetchGlobalUniversityDetail,
  type GlobalUniversitiesSearchResponse,
} from '../services/globalApi';
import type { GlobalCountrySummary, GlobalUniversityDetail } from '../types/domain';

const CONTINENTS = [
  'All',
  'Asia',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Oceania',
] as const;

const FIELDS = [
  'all',
  'Computer Science',
  'Engineering',
  'Medicine',
  'Economics',
  'Physics',
  'Mathematics',
  'Business',
  'Law',
  'Biology',
] as const;

export const UniversitiesView: React.FC = () => {
  const {
    catalog,
    countriesByCode,
    citiesBySlug,
    selectedUniversitySlug,
    setSelectedUniversitySlug,
    openUniversityProfile,
    savedUniversities,
    saveUniversity,
    removeSavedUniversity,
    compareSlugs,
    toggleCompareSlug,
    setActiveSection,
    language,
    t,
  } = useApp();
  const ui = getExtendedUIStrings(language).universitiesPage;
  const micro = getUniversalMicroCopy(language);

  // Directory search & filter state
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [continentFilter, setContinentFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [onlyRanked, setOnlyRanked] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'rank' | 'name' | 'citations'>('rank');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Remote search results
  const [searchData, setSearchData] = useState<GlobalUniversitiesSearchResponse | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listRetryTick, setListRetryTick] = useState(0);

  // Global countries dropdown
  const [allCountries, setAllCountries] = useState<GlobalCountrySummary[]>([]);

  // Complete University Detail profile (works for BOTH seeded & global OpenAlex/ROR institutions!)
  const [detailData, setDetailData] = useState<GlobalUniversityDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchGlobalCountries({}, controller.signal)
      .then((res) => setAllCountries(res.countries))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [query, countryFilter, cityFilter, continentFilter, typeFilter, fieldFilter, onlyRanked, sortBy]);

  // Execute global 6-layer university search
  useEffect(() => {
    if (selectedUniversitySlug) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoadingList(true);
      setListError(null);
      fetchGlobalUniversities(
        {
          q: query,
          country: countryFilter,
          city: cityFilter,
          continent: continentFilter,
          type: typeFilter,
          field: fieldFilter,
          hasRanking: onlyRanked,
          sort: query.trim() && sortBy === 'rank' ? 'relevance' : sortBy,
          page,
          limit: 24,
        },
        controller.signal
      )
        .then((res) => {
          setSearchData(res);
          setIsLoadingList(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsLoadingList(false);
          setListError(
            err instanceof Error ? err.message : 'Unable to search global universities right now.'
          );
        });
    }, query.trim() || cityFilter.trim() ? 240 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    selectedUniversitySlug,
    query,
    countryFilter,
    cityFilter,
    continentFilter,
    typeFilter,
    fieldFilter,
    onlyRanked,
    sortBy,
    page,
    listRetryTick,
  ]);

  // Fetch complete 18-field profile whenever selectedUniversitySlug is set
  useEffect(() => {
    if (!selectedUniversitySlug) {
      setDetailData(null);
      setDetailError(null);
      return;
    }
    const controller = new AbortController();
    setIsLoadingDetail(true);
    setDetailError(null);
    fetchGlobalUniversityDetail(selectedUniversitySlug, controller.signal)
      .then((detail) => {
        setDetailData(detail);
        setIsLoadingDetail(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setIsLoadingDetail(false);
        setDetailError(
          err instanceof Error ? err.message : 'Unable to load university profile.'
        );
      });
    return () => controller.abort();
  }, [selectedUniversitySlug]);

  // =========================================================================
  // COMPLETE UNIVERSITY PROFILE VIEW (Works for Seeded AND Global OpenAlex/ROR)
  // =========================================================================
  if (selectedUniversitySlug) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSelectedUniversitySlug(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {t.common.back} · {t.nav.universities}
            </span>
          </button>
          <div className="surface-card rounded-2xl p-12 flex items-center justify-center gap-3 text-sm text-[var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
            <span>Loading verified institutional profile...</span>
          </div>
        </div>
      );
    }

    if (detailError || !detailData) {
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSelectedUniversitySlug(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {t.common.back} · {t.nav.universities}
            </span>
          </button>
          <div className="surface-card rounded-2xl p-8 space-y-3">
            <h2 className="font-display text-2xl font-semibold">Profile Unavailable</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {detailError || 'This institution could not be loaded from verified registries.'}
            </p>
          </div>
        </div>
      );
    }

    const seededCity = detailData.citySlug ? citiesBySlug[detailData.citySlug] : undefined;
    const isSaved = savedUniversities.some((s) => s.universitySlug === detailData.slug);
    const isComparing = compareSlugs.includes(detailData.slug);
    const cleanUniName = formatCleanUniversityName(detailData.name);
    const tuitionSplit = splitTuitionDisplay(detailData.tuitionLocalDisplay);
    const monogram = (detailData.shortName || cleanUniName)
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();

    return (
      <div className="space-y-8" data-testid="university-detail-profile">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedUniversitySlug(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{micro.back}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                isSaved
                  ? removeSavedUniversity(detailData.slug)
                  : saveUniversity({ universitySlug: detailData.slug })
              }
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer ${
                isSaved
                  ? 'glass-pill-active text-[var(--accent-primary)] font-semibold'
                  : 'btn-glass'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? micro.saved : micro.save}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleCompareSlug(detailData.slug)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer ${
                isComparing
                  ? 'glass-pill-active text-[var(--accent-secondary)] font-semibold'
                  : 'btn-glass'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isComparing ? micro.compared : micro.compare}</span>
            </button>
            {(detailData.officialApplicationUrl || detailData.officialWebsite) && (
              <a
                href={detailData.officialApplicationUrl || detailData.officialWebsite || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                <span>{micro.portal}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Hero Plate & Core Facts */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 min-w-0">
            <InstitutionalMediaPlate
              title={cleanUniName}
              subtitle={`${detailData.cityName}, ${detailData.countryName}`}
              monogram={monogram || 'UNI'}
              motif="classical"
              accentHue="#0ea5e9"
              imageUrl={detailData.imageUrl || undefined}
              universitySlug={detailData.slug}
              officialMediaUrl={detailData.officialWebsite || detailData.sourceUrl || '#'}
              officialLabel={micro.gallery}
              coordinatesLabel={
                detailData.latitude != null && detailData.longitude != null
                  ? `${detailData.latitude.toFixed(2)}°, ${detailData.longitude.toFixed(2)}°`
                  : undefined
              }
              aspectClass="h-full min-h-[280px]"
            />
          </div>

          <div className="lg:col-span-6 min-w-0 surface-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>
                  {detailData.countryFlag} {detailData.cityName}, {detailData.countryName}
                </span>
                <span>·</span>
                <span>{detailData.institutionType}</span>
                {detailData.foundedYear && (
                  <>
                    <span>·</span>
                    <span className="font-mono-tabular">{detailData.foundedYear}</span>
                  </>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
                {cleanUniName}
              </h1>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {detailData.overview}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-hairline)]">
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">{micro.students}</p>
                <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                  {detailData.studentCount ? detailData.studentCount.toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">{micro.intlPct}</p>
                <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                  {detailData.internationalRatioPct != null
                    ? `${detailData.internationalRatioPct}%`
                    : detailData.worksCount != null
                    ? detailData.worksCount.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">{micro.tuition}</p>
                <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                  {tuitionSplit.primary}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-3">
                {detailData.officialWebsite && (
                  <a
                    href={detailData.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    <span>{micro.portal}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {detailData.rorId && (
                  <a
                    href={detailData.rorId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:underline"
                  >
                    ROR
                  </a>
                )}
              </div>

              {/* Subtle Hover/Focus Info Tooltip for Verification Date & Fee Notes */}
              <div className="relative group/info">
                <button
                  type="button"
                  data-testid="uni-verification-info-trigger"
                  aria-label={micro.verifiedInfoTitle}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer focus:outline-none"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{micro.verifiedInfoTitle}</span>
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none opacity-0 group-hover/info:opacity-100 group-focus-within/info:opacity-100 transition-opacity duration-150 absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3 text-[11px] text-[var(--text-secondary)] shadow-xl z-20 space-y-1"
                >
                  <p className="font-semibold text-[var(--text-primary)]">{detailData.sourceName}</p>
                  <p className="font-mono-tabular">
                    {micro.verifiedDateLabel}: {detailData.verifiedAt}
                  </p>
                  {tuitionSplit.note && (
                    <p>
                      {micro.feeNoteLabel}: {tuitionSplit.note}
                    </p>
                  )}
                  <p className="text-[var(--text-muted)]">{micro.sourceNoteLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rankings + International & Location Info */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">
              Published Global Rankings & Research Impact
            </h2>
            {detailData.rankings.length === 0 ? (
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>
                  Global ranking snapshot (QS / THE / ARWU) is not yet curated for{' '}
                  <strong>{detailData.name}</strong>.
                </p>
                {(detailData.worksCount || detailData.citedByCount) && (
                  <p className="text-xs font-mono-tabular text-[var(--text-muted)]">
                    OpenAlex Verified Research Metrics:{' '}
                    {detailData.worksCount?.toLocaleString() || 0} scholarly works ·{' '}
                    {detailData.citedByCount?.toLocaleString() || 0} citations.
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {detailData.rankings.map((r) => (
                  <div
                    key={`${r.provider}-${r.publicationYear}`}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{r.provider}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Publication Year {r.publicationYear} · Subject: {r.subjectArea}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-tabular text-xl font-semibold">
                        {formatCleanRankDisplay(r.worldRankDisplay)}
                      </p>
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[var(--accent-primary)] hover:underline"
                      >
                        {micro.portal} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">
              International Student Information
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {detailData.internationalInfo ||
                'Institution-specific international admission policies, English-taught degree availability, and housing support should be confirmed on the official university website.'}
            </p>
            <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2 text-xs">
              <p>
                <strong>Instruction Languages:</strong>{' '}
                {detailData.primaryLanguage || 'Not yet verified (see official catalog)'}
              </p>
              <p>
                <strong>City Living Estimate ({detailData.cityName}):</strong>{' '}
                {seededCity
                  ? `$${seededCity.monthlyLivingMinUsd}–$${seededCity.monthlyLivingMaxUsd}/month`
                  : 'Not yet curated for this city'}
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('financial-planner')}
                className="text-[var(--accent-primary)] font-semibold hover:underline cursor-pointer"
              >
                Model full annual cost in Financial Planner →
              </button>
            </div>
          </div>
        </section>

        {/* Faculties, Departments, Research Areas & Facilities */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: 'Faculties & Schools', items: detailData.faculties },
            { title: 'Key Departments', items: detailData.departments },
            {
              title: 'Research Frontiers',
              items:
                detailData.researchAreas.length > 0
                  ? detailData.researchAreas
                  : detailData.topTopics,
            },
            { title: 'Campus Facilities', items: detailData.facilities },
          ].map((col) => (
            <div key={col.title} className="surface-card rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-xl font-semibold">{col.title}</h3>
              {col.items.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Not yet curated — inspect official university catalog.
                </p>
              ) : (
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className="pb-2 border-b border-[var(--border-hairline)] last:border-0 last:pb-0"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* Programs, Admissions & Scholarships */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">
              Featured Academic Programs ({detailData.programs.length})
            </h2>
            {detailData.programs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Detailed program catalog is not yet indexed locally for this institution.
                {detailData.officialWebsite ? (
                  <>
                    {' '}
                    Browse degrees directly at{' '}
                    <a
                      href={detailData.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-primary)] hover:underline"
                    >
                      {detailData.officialWebsite}
                    </a>
                    .
                  </>
                ) : null}
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {detailData.programs.map((p) => (
                  <div key={p.slug} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                        {p.degreeLevel} · {p.durationYears} yrs
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{p.overview}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {p.discipline} · Language: {p.language}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="surface-card rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">Admission Requirements</h2>
                <button
                  type="button"
                  onClick={() => setActiveSection('admission-intelligence')}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  Open Checklist →
                </button>
              </div>
              {!detailData.admissions ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Institution-specific admission criteria are not yet curated in our local database. Verify exact degree prerequisites, language scores, and deadlines on the official admissions portal.
                </p>
              ) : (
                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {detailData.admissions.degreeLevel}
                  </p>
                  <p>
                    <strong>Academic:</strong> {detailData.admissions.academicQualifications}
                  </p>
                  <p>
                    <strong>Language:</strong> {detailData.admissions.languageTests}
                  </p>
                  <p>
                    <strong>Tests:</strong> {detailData.admissions.standardizedTests}
                  </p>
                  <p>
                    <strong>Deadlines:</strong> {detailData.admissions.applicationDeadline}
                  </p>
                </div>
              )}
            </div>

            <div className="surface-card rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-2xl font-semibold">
                Related Country & Institutional Scholarships ({detailData.relatedScholarships.length})
              </h2>
              {detailData.relatedScholarships.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Consult institutional financial aid pages and national scholarships in{' '}
                  {detailData.countryName} for merit and need-based funding.
                </p>
              ) : (
                <div className="space-y-3">
                  {detailData.relatedScholarships.map((s) => (
                    <div
                      key={s.slug}
                      className="pb-3 border-b border-[var(--border-hairline)] last:border-0 last:pb-0 flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {s.coverageSummary}
                        </p>
                      </div>
                      <a
                        href={s.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent-primary)] hover:underline shrink-0"
                      >
                        Official →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // GLOBAL UNIVERSITIES DIRECTORY VIEW (6-Layer Smart Search + Pagination)
  // =========================================================================
  const items = searchData?.items || [];
  const totalCount = searchData?.totalCount ?? 0;
  const totalPages = searchData?.totalPages ?? 1;

  const hasActiveFilters =
    Boolean(query.trim()) ||
    countryFilter !== 'all' ||
    Boolean(cityFilter.trim()) ||
    continentFilter !== 'All' ||
    typeFilter !== 'all' ||
    fieldFilter !== 'all' ||
    onlyRanked;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-3xl font-semibold">{t.universitiesView.title}</h1>
          {searchData && (
            <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
              {totalCount.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <GlassInput
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.universitiesView.searchPlaceholder}
              aria-label={t.universitiesView.searchPlaceholder}
              data-testid="global-uni-search-input"
              className="pl-9 pr-8 py-1.5 text-sm w-full sm:w-80"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear university search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <GlassSegmented
            ariaLabel="Directory view mode"
            value={viewMode}
            onChange={setViewMode}
            layoutGroupId="universities-view-mode"
            buttonClassName="p-1.5 rounded-lg"
            options={[
              { value: 'grid', ariaLabel: 'Grid view', label: <LayoutGrid className="w-4 h-4" /> },
              { value: 'table', ariaLabel: 'Table view', label: <List className="w-4 h-4" /> },
            ]}
          />
        </div>
      </div>

      {/* Multi-Facet Verified Filter Bar */}
      <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center gap-2.5">
        <GlassSelect
          aria-label={t.common.country}
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          data-testid="uni-country-filter"
          className="px-3 py-1.5 text-xs max-w-full"
        >
          <option value="all">{t.common.allCountries}</option>
          {(allCountries.length > 0 ? allCountries : catalog.countries).map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flagEmoji} {c.name}
            </option>
          ))}
        </GlassSelect>

        <GlassSelect
          aria-label="Continent filter"
          value={continentFilter}
          onChange={(e) => setContinentFilter(e.target.value)}
          className="px-3 py-1.5 text-xs max-w-full"
        >
          {CONTINENTS.map((cont) => (
            <option key={cont} value={cont}>
              {translateContinentName(cont, language)}
            </option>
          ))}
        </GlassSelect>

        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder={ui.allCities}
            aria-label={ui.allCities}
            className="glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs w-36 sm:w-40"
          />
        </div>

        <GlassSelect
          aria-label="Academic field filter"
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="px-3 py-1.5 text-xs max-w-full"
        >
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {f === 'all' ? t.common.program : f}
            </option>
          ))}
        </GlassSelect>

        <GlassSelect
          aria-label="Institution type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs max-w-full"
        >
          <option value="all">{ui.allTypes}</option>
          <option value="public">{ui.publicType}</option>
          <option value="private">{ui.privateType}</option>
        </GlassSelect>

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl surface-subtle text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyRanked}
            onChange={(e) => setOnlyRanked(e.target.checked)}
            className="accent-[var(--accent-primary)] cursor-pointer"
          />
          <span>{t.rankingsView.worldRank}</span>
        </label>

        <GlassSelect
          aria-label="Sort universities"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'relevance' | 'rank' | 'name' | 'citations')
          }
          className="px-3 py-1.5 text-xs max-w-full ml-auto"
        >
          <option value="rank">{ui.sortRankAsc}</option>
          <option value="relevance">{ui.sortRelevance}</option>
          <option value="citations">{ui.sortAcceptanceAsc}</option>
          <option value="name">{ui.sortTuitionAsc}</option>
        </GlassSelect>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCountryFilter('all');
              setCityFilter('');
              setContinentFilter('All');
              setTypeFilter('all');
              setFieldFilter('all');
              setOnlyRanked(false);
            }}
            className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
          >
            {t.common.cancel}
          </button>
        )}
      </div>

      {/* Intelligent Typo / Transliteration Suggestion Banner */}
      {searchData?.didYouMean && (
        <div
          className="rounded-2xl border border-cyan-500/35 bg-cyan-500/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
          data-testid="did-you-mean-banner"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>
              <strong>{ui.didYouMean}</strong>{' '}
              <button
                type="button"
                onClick={() => setQuery(searchData.didYouMean || '')}
                className="font-semibold text-[var(--accent-primary)] underline cursor-pointer"
              >
                {searchData.didYouMean}
              </button>
            </span>
          </div>
          <span className="text-[var(--text-muted)]">
            Showing typo-tolerant & alias-expanded verified matches
          </span>
        </div>
      )}

      {/* Minimal Loading Strip */}
      {isLoadingList && items.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
          <span>{t.common.loading}</span>
        </div>
      )}

      {/* Directory Content */}
      {listError ? (
        <div className="surface-card rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">{listError}</p>
          <button
            type="button"
            onClick={() => setListRetryTick((n) => n + 1)}
            className="btn-glass px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : isLoadingList && items.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 flex items-center justify-center gap-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
          <span>{t.common.loading}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-2">
          <p className="font-display text-2xl font-semibold">{t.universitiesView.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{t.universitiesView.searchPlaceholder}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          data-testid="universities-results-grid"
        >
          {items.map((uni) => {
            const isSaved = savedUniversities.some((s) => s.universitySlug === uni.slug);
            const isComparing = compareSlugs.includes(uni.slug);
            const cleanName = formatCleanUniversityName(uni.name);
            const cleanRank = formatCleanRankDisplay(uni.qsRankDisplay);
            const cleanTuition = uni.tuitionLocalDisplay
              ? splitTuitionDisplay(uni.tuitionLocalDisplay).primary
              : uni.institutionType;

            return (
              <GlassCard
                key={uni.slug}
                interactive
                className="p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  {/* 2. Key Metric */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <span className="truncate">
                      {uni.countryFlag} {uni.cityName}
                    </span>
                    {cleanRank ? (
                      <span className="font-mono-tabular font-semibold text-[var(--text-primary)] shrink-0">
                        QS {cleanRank}
                      </span>
                    ) : null}
                  </div>
                  {/* 1. Primary Title */}
                  <h2 className="font-display text-xl font-semibold leading-snug">{cleanName}</h2>
                  {/* 3. Clean Financial / Stat Value */}
                  <p className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                    {cleanTuition}
                  </p>
                </div>

                {/* 4. Clean Action Row */}
                <div className="pt-3.5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <GlassButton
                      variant="pill"
                      active={isSaved}
                      onClick={() =>
                        isSaved
                          ? removeSavedUniversity(uni.slug)
                          : saveUniversity({ universitySlug: uni.slug })
                      }
                      aria-label={isSaved ? `${micro.saved} ${cleanName}` : `${micro.save} ${cleanName}`}
                      className={`p-2 rounded-xl cursor-pointer ${
                        isSaved ? 'text-[var(--accent-primary)]' : ''
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </GlassButton>
                    <GlassButton
                      variant="pill"
                      active={isComparing}
                      onClick={() => toggleCompareSlug(uni.slug)}
                      aria-label={`${micro.compare} ${cleanName}`}
                      className={`p-2 rounded-xl cursor-pointer ${
                        isComparing ? 'text-[var(--accent-secondary)]' : ''
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </GlassButton>
                  </div>

                  <GlassButton
                    variant="primary"
                    onClick={() => openUniversityProfile(uni.slug)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <span>{micro.view}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="surface-card rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">{t.nav.universities}</th>
                <th className="py-3 px-4">{t.common.city}</th>
                <th className="py-3 px-4 text-right">QS</th>
                <th className="py-3 px-4">{micro.tuition}</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {items.map((uni) => (
                <tr key={uni.slug} className="hover:bg-[var(--bg-surface)]/50">
                  <td className="py-3 px-4 font-semibold">{formatCleanUniversityName(uni.name)}</td>
                  <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                    {uni.countryFlag} {uni.cityName}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-xs">
                    {uni.qsRankDisplay ? formatCleanRankDisplay(uni.qsRankDisplay) : '—'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono-tabular">
                    {uni.tuitionLocalDisplay
                      ? splitTuitionDisplay(uni.tuitionLocalDisplay).primary
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openUniversityProfile(uni.slug)}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      {micro.view} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Server-Side Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            disabled={page <= 1 || isLoadingList}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-glass inline-flex items-center gap-1 rounded-xl px-3.5 py-2 font-medium disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="font-mono-tabular text-[var(--text-muted)]">
            Page {page} of {totalPages} ({totalCount.toLocaleString()} total verified)
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoadingList}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn-glass inline-flex items-center gap-1 rounded-xl px-3.5 py-2 font-medium disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
