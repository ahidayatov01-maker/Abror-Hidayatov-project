import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getExtendedUIStrings } from '../i18n/uiStrings';
import { getUniversalMicroCopy } from '../utils/displayCopy';
import { MOTION_DURATION, MOTION_EASE } from '../motion/tokens';
import {
  fetchGlobalScholarships,
  type GlobalScholarshipsResponse,
} from '../services/globalApi';

const STATUS_BADGE_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  upcoming: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  recurring_unconfirmed: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  closed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  requires_verification: 'bg-slate-500/15 text-[var(--text-secondary)] border-[var(--border-hairline)]',
};

const FUNDING_LABELS: Record<string, string> = {
  full: 'Full Funding',
  partial: 'Partial Funding',
  tuition_waiver: 'Tuition Waiver',
  research: 'Research Grant',
  merit: 'Merit Award',
};

export const ScholarshipsView: React.FC = () => {
  const {
    universitiesBySlug,
    savedScholarships,
    saveScholarship,
    removeSavedScholarship,
    openUniversityProfile,
    language,
    t,
  } = useApp();
  const ui = getExtendedUIStrings(language).scholarshipsPage;
  const micro = getUniversalMicroCopy(language);

  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [fundingFilter, setFundingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const [data, setData] = useState<GlobalScholarshipsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      fetchGlobalScholarships(
        {
          q: query,
          country: countryFilter,
          degree: degreeFilter,
          fundingType: fundingFilter,
          status: statusFilter,
          field: fieldFilter,
          nationality: nationalityFilter || 'all',
        },
        controller.signal
      )
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsLoading(false);
          setError(err instanceof Error ? err.message : 'Unable to load verified scholarships.');
        });
    }, query.trim() || nationalityFilter.trim() ? 220 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    query,
    countryFilter,
    degreeFilter,
    fundingFilter,
    statusFilter,
    fieldFilter,
    nationalityFilter,
    retryTick,
  ]);

  const items = data?.items || [];
  const countriesAvailable = data?.countriesAvailable || [];

  const hasFilters =
    Boolean(query.trim()) ||
    countryFilter !== 'all' ||
    degreeFilter !== 'all' ||
    fundingFilter !== 'all' ||
    statusFilter !== 'all' ||
    fieldFilter !== 'all' ||
    Boolean(nationalityFilter.trim());

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-3xl font-semibold">{t.scholarshipsView.title}</h1>
          {data && (
            <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
              {data.totalCount}
            </span>
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.searchPlaceholder}
            aria-label={t.scholarshipsView.searchPlaceholder}
            data-testid="scholarships-search-input"
            className="glass-input pl-9 pr-8 py-1.5 rounded-xl text-sm w-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear scholarship search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Facet Verified Scholarship Filters */}
      <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center gap-2.5">
        <select
          aria-label={t.common.country}
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          data-testid="scholarship-country-filter"
          className="glass-input rounded-xl px-3 py-1.5 text-xs cursor-pointer"
        >
          <option value="all">{t.common.allCountries}</option>
          {countriesAvailable.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flagEmoji} {c.name} ({c.count})
            </option>
          ))}
        </select>

        <select
          aria-label={t.programsView.degreeLevel}
          value={degreeFilter}
          onChange={(e) => setDegreeFilter(e.target.value)}
          className="glass-input rounded-xl px-3 py-1.5 text-xs cursor-pointer"
        >
          <option value="all">{ui.eligibleDegrees}</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
        </select>

        <select
          aria-label="Funding type"
          value={fundingFilter}
          onChange={(e) => setFundingFilter(e.target.value)}
          data-testid="scholarship-funding-filter"
          className="glass-input rounded-xl px-3 py-1.5 text-xs cursor-pointer"
        >
          <option value="all">{ui.allFundingTypes}</option>
          <option value="full">{ui.fullFunding}</option>
          <option value="partial">{ui.partialFunding}</option>
          <option value="tuition_waiver">{ui.tuitionWaiver}</option>
          <option value="research">{ui.researchGrant}</option>
          <option value="merit">{ui.partialFunding}</option>
        </select>

        <select
          aria-label="Application status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-testid="scholarship-status-filter"
          className="glass-input rounded-xl px-3 py-1.5 text-xs cursor-pointer"
        >
          <option value="all">{ui.allStatuses}</option>
          <option value="open">{ui.statusOpen}</option>
          <option value="upcoming">{ui.statusUpcoming}</option>
          <option value="recurring_unconfirmed">{ui.statusRecurring}</option>
          <option value="closed">{ui.statusClosed}</option>
          <option value="requires_verification">{ui.statusVerify}</option>
        </select>

        <select
          aria-label="Eligible field of study"
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="glass-input rounded-xl px-3 py-1.5 text-xs cursor-pointer"
        >
          <option value="all">{t.common.program}</option>
          <option value="Engineering">Engineering</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Economics">Economics / Public Policy</option>
          <option value="Medicine">Medicine / Health</option>
          <option value="Sciences">Natural Sciences</option>
        </select>

        <input
          type="search"
          value={nationalityFilter}
          onChange={(e) => setNationalityFilter(e.target.value)}
          placeholder={ui.eligibilityCriteria}
          aria-label={ui.eligibilityCriteria}
          className="glass-input rounded-xl px-3 py-1.5 text-xs w-52"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCountryFilter('all');
              setDegreeFilter('all');
              setFundingFilter('all');
              setStatusFilter('all');
              setFieldFilter('all');
              setNationalityFilter('');
            }}
            className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer ml-auto"
          >
            {t.common.cancel}
          </button>
        )}
      </div>

      {error ? (
        <div className="surface-card rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={() => setRetryTick((n) => n + 1)}
            className="btn-glass px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : isLoading && items.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
          <span>Loading verified international scholarships...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-2">
          <p className="font-display text-2xl font-semibold">No matching scholarships found</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Try clearing a filter or broadening your search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="scholarships-grid">
          {items.map((sch) => {
            const tracked = savedScholarships.find((item) => item.scholarshipSlug === sch.slug);
            const isExpanded = expandedSlug === sch.slug;
            const statusStyle =
              STATUS_BADGE_STYLES[sch.computedStatus.status] ||
              STATUS_BADGE_STYLES.requires_verification;
            const fundingLabel =
              FUNDING_LABELS[(sch.fundingType || 'full').toLowerCase()] || sch.fundingType || 'Full Funding';

            return (
              <article
                key={sch.slug}
                className="surface-card motion-interactive-card rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)]">
                        {sch.countryFlag} {sch.countryName} · {sch.degreeLevelsJson.join(' / ')}
                      </p>
                      <h2 className="font-display text-2xl font-semibold mt-0.5 leading-snug">
                        {sch.name}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        data-testid={`scholarship-status-${sch.slug}`}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${statusStyle}`}
                      >
                        {sch.computedStatus.label}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">
                        {fundingLabel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-[var(--text-primary)] line-clamp-2">
                      {sch.coverageSummary}
                    </p>
                    <p className="text-[var(--text-muted)] font-mono-tabular">
                      {sch.deadlineText}
                    </p>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: MOTION_DURATION.micro, ease: MOTION_EASE }}
                        className="pt-3 mt-3 border-t border-[var(--border-hairline)] space-y-4 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] surface-subtle rounded-xl p-3">
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[10px] text-[var(--text-muted)]">
                              Eligible Nationalities
                            </p>
                            <p className="text-[var(--text-secondary)] mt-0.5">
                              {(sch.eligibleNationalitiesJson || ['All international applicants']).join(', ')}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[10px] text-[var(--text-muted)]">
                              Eligible Fields
                            </p>
                            <p className="text-[var(--text-secondary)] mt-0.5">
                              {(sch.eligibleFieldsJson || ['All disciplines']).join(', ')}
                            </p>
                          </div>
                        </div>

                        <p className="text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{sch.provider}</strong> ·{' '}
                          {t.common.verified} {sch.verifiedAt} ({sch.academicYear})
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[11px] text-[var(--text-muted)] mb-1.5">
                              {t.scholarshipsView.eligibility}
                            </p>
                            <ul className="space-y-1 text-[var(--text-secondary)] list-disc pl-4">
                              {sch.eligibilityCriteriaJson.map((crit) => (
                                <li key={crit}>{crit}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[11px] text-[var(--text-muted)] mb-1.5">
                              {t.scholarshipsView.requiredDocuments}
                            </p>
                            <ul className="space-y-1 text-[var(--text-secondary)] list-disc pl-4">
                              {sch.requiredDocumentsJson.map((doc) => (
                                <li key={doc}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {sch.eligibleUniversitySlugsJson.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-hairline)]">
                            {sch.eligibleUniversitySlugsJson.map((slug) => {
                              const uni = universitiesBySlug[slug];
                              if (!uni) return null;
                              return (
                                <button
                                  key={slug}
                                  type="button"
                                  onClick={() => openUniversityProfile(slug)}
                                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer"
                                >
                                  {uni.shortName}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <a
                          href={sch.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold"
                        >
                          <span>{t.common.officialWebsite}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        tracked
                          ? removeSavedScholarship(sch.slug)
                          : saveScholarship(sch.slug, 'Saved')
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer ${
                        tracked
                          ? 'glass-pill-active text-[var(--accent-primary)] font-semibold'
                          : 'btn-glass'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{tracked ? micro.saved : micro.save}</span>
                    </button>

                    {tracked && (
                      <select
                        aria-label={`Application status for ${sch.name}`}
                        value={tracked.status}
                        onChange={(e) => saveScholarship(sch.slug, e.target.value, tracked.notes)}
                        className="glass-input rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="Saved">Saved</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Awarded">Awarded</option>
                      </select>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedSlug(isExpanded ? null : sch.slug)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] cursor-pointer"
                  >
                    <span>{isExpanded ? t.common.hideDetails : t.common.details}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
