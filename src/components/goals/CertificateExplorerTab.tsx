import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  ExternalLink,
  GitCompare,
  Info,
  Plus,
  Search,
  Sparkles,
  Clock,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassModal } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  CERTIFICATES_CATALOG,
  CERTIFICATE_CATEGORIES,
  getCertificateById,
  type CertificateCategoryId,
  type CertificateRecord,
  type ScoringFormatType,
} from '../../data/certificatesCatalog';
import { COUNTRY_QUALIFICATION_PROFILES } from '../../data/countryQualificationRules';
import {
  filterAndSortCertificates,
  hasDuplicateCertificateGoal,
} from '../../utils/goalsEngine';
import { getUniversalMicroCopy } from '../../utils/displayCopy';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface CertificateExplorerTabProps {
  t: GoalsTranslationBundle;
  onAddCertificateAsGoal: (cert: CertificateRecord) => void;
}

export const CertificateExplorerTab: React.FC<CertificateExplorerTabProps> = ({
  t,
  onAddCertificateAsGoal,
}) => {
  const { language } = useApp();
  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const { goalsState, setGoalsState, entitlementStatus, showToast } = useWorkspaceIntelligence();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CertificateCategoryId | 'all'>('all');
  const [subcategory, setSubcategory] = useState('all');
  const [countryCode, setCountryCode] = useState('all');
  const [scoreFormat, setScoreFormat] = useState<ScoringFormatType | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'fee_asc' | 'fee_desc' | 'validity'>('popularity');

  const [detailCert, setDetailCert] = useState<CertificateRecord | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const maxCompareSlots = entitlementStatus.isOwner
    ? 6
    : entitlementStatus.entitlements.maxCertificateCompareSlots;

  const availableSubcategories = useMemo(() => {
    const set = new Set<string>();
    CERTIFICATES_CATALOG.forEach((c) => {
      if (category === 'all' || c.category === category) {
        set.add(c.subcategory);
      }
    });
    return Array.from(set).sort();
  }, [category]);

  const filteredCertificates = useMemo(
    () =>
      filterAndSortCertificates(CERTIFICATES_CATALOG, {
        search,
        category,
        languageOrSubcategory: subcategory,
        countryCode,
        scoreFormat,
        onlyFavorites,
        favoriteIds: goalsState.favoriteCertificateIds,
        sortBy,
      }),
    [
      search,
      category,
      subcategory,
      countryCode,
      scoreFormat,
      onlyFavorites,
      goalsState.favoriteCertificateIds,
      sortBy,
    ]
  );

  const recentlyViewedCerts = useMemo(
    () =>
      goalsState.recentlyViewedCertificateIds
        .map((id) => getCertificateById(id))
        .filter((c): c is CertificateRecord => Boolean(c))
        .slice(0, 6),
    [goalsState.recentlyViewedCertificateIds]
  );

  const comparedCerts = useMemo(
    () =>
      goalsState.compareCertificateIds
        .slice(0, maxCompareSlots)
        .map((id) => getCertificateById(id))
        .filter((c): c is CertificateRecord => Boolean(c)),
    [goalsState.compareCertificateIds, maxCompareSlots]
  );

  const openDetail = (cert: CertificateRecord) => {
    setDetailCert(cert);
    setGoalsState((prev) => ({
      ...prev,
      recentlyViewedCertificateIds: [
        cert.id,
        ...prev.recentlyViewedCertificateIds.filter((id) => id !== cert.id),
      ].slice(0, 10),
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleFavorite = (certId: string) => {
    setGoalsState((prev) => {
      const exists = prev.favoriteCertificateIds.includes(certId);
      return {
        ...prev,
        favoriteCertificateIds: exists
          ? prev.favoriteCertificateIds.filter((id) => id !== certId)
          : [...prev.favoriteCertificateIds, certId],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const toggleCompare = (certId: string) => {
    setGoalsState((prev) => {
      const exists = prev.compareCertificateIds.includes(certId);
      if (exists) {
        return {
          ...prev,
          compareCertificateIds: prev.compareCertificateIds.filter((id) => id !== certId),
          updatedAt: new Date().toISOString(),
        };
      }
      if (prev.compareCertificateIds.length >= maxCompareSlots) {
        showToast(
          `Compare limit (${maxCompareSlots}) reached on your plan. Remove an exam to add another.`,
          'info'
        );
        return prev;
      }
      return {
        ...prev,
        compareCertificateIds: [...prev.compareCertificateIds, certId],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Selector Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCategory('all');
            setSubcategory('all');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            category === 'all'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
              : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {t.certExplorer.allCategories} ({CERTIFICATES_CATALOG.length})
        </button>
        {CERTIFICATE_CATEGORIES.map((cat) => {
          const count = CERTIFICATES_CATALOG.filter((c) => c.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setSubcategory('all');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                category === cat.id
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                  : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.certCategories[cat.id]} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.certExplorer.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            />
          </div>

          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            aria-label="Subcategory"
            className="lg:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            <option value="all">{t.certExplorer.allSubcategories}</option>
            {availableSubcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            aria-label="Country availability"
            className="lg:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            <option value="all">{t.certExplorer.allCountries}</option>
            {COUNTRY_QUALIFICATION_PROFILES.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.flagEmoji} {c.countryName}
              </option>
            ))}
          </select>

          <select
            value={scoreFormat}
            onChange={(e) => setScoreFormat(e.target.value as ScoringFormatType | 'all')}
            aria-label="Scoring format"
            className="lg:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            <option value="all">{t.certExplorer.allScoreFormats}</option>
            <option value="band">Band (e.g., IELTS)</option>
            <option value="numeric">Numeric Score</option>
            <option value="level">Level (JLPT / CEFR / TOPIK)</option>
            <option value="pass_fail">Pass / Fail</option>
            <option value="grade">Grade Scale</option>
            <option value="award">Award / Distinction</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'popularity' | 'fee_asc' | 'fee_desc' | 'validity')
            }
            aria-label="Sort certificates"
            className="lg:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            <option value="popularity">{t.certExplorer.sortPopularity}</option>
            <option value="fee_asc">{t.certExplorer.sortFeeAsc}</option>
            <option value="fee_desc">{t.certExplorer.sortFeeDesc}</option>
            <option value="validity">{t.certExplorer.sortValidity}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                onlyFavorites ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
              {t.certExplorer.favoritesOnly} ({goalsState.favoriteCertificateIds.length})
            </button>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {filteredCertificates.length} / {CERTIFICATES_CATALOG.length}
            </span>
          </div>

          {comparedCerts.length >= 2 && (
            <GlassButton
              variant="primary"
              onClick={() => setCompareOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5" />
              {t.certExplorer.compareSelected} ({comparedCerts.length}/{maxCompareSlots})
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Recently Viewed Strip */}
      {recentlyViewedCerts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {t.certExplorer.recentlyViewed}:
          </span>
          {recentlyViewedCerts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openDetail(c)}
              className="shrink-0 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] cursor-pointer"
            >
              {c.shortName}
            </button>
          ))}
        </div>
      )}

      {/* Certificate Cards Grid */}
      {filteredCertificates.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">{t.certExplorer.noResults}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCertificates.map((cert) => {
            const isFav = goalsState.favoriteCertificateIds.includes(cert.id);
            const isComparing = goalsState.compareCertificateIds.includes(cert.id);
            const alreadyGoal = hasDuplicateCertificateGoal(goalsState.goals, cert.id);

            return (
              <GlassCard key={cert.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                      {cert.officialName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(cert.id)}
                      aria-label={t.certExplorer.saveFavorite}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        isFav
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs font-medium text-[var(--text-secondary)] truncate">
                    {cert.scoringModel.scaleLabel}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-hairline)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDetail(cert)}
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {micro.view}
                    </button>
                    <span className="text-[var(--border-hairline)]">·</span>
                    <button
                      type="button"
                      onClick={() => toggleCompare(cert.id)}
                      className={`text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        isComparing
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      {isComparing ? micro.compared : micro.compare}
                    </button>
                  </div>

                  {alreadyGoal ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      {t.certExplorer.alreadyInGoals}
                    </span>
                  ) : (
                    <GlassButton
                      variant="primary"
                      onClick={() => onAddCertificateAsGoal(cert)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.certExplorer.addAsGoal}
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Certificate Detail Modal */}
      <GlassModal
        open={Boolean(detailCert)}
        onClose={() => setDetailCert(null)}
        title={detailCert?.officialName}
        maxWidthClass="max-w-3xl"
      >
        {detailCert && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <span>
                {detailCert.issuingOrganization} · {detailCert.languageOrSubject}
              </span>
              <span className="tabular-nums">
                {t.certExplorer.verifiedLabel}: {detailCert.lastVerifiedAt}
              </span>
            </div>

            <p className="text-[var(--text-primary)] leading-relaxed">{detailCert.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Exam Format & Frequency
                </p>
                <p className="font-medium text-[var(--text-primary)]">{detailCert.examFormat}</p>
                <p className="text-[var(--text-secondary)]">{detailCert.examFrequency}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Scoring & Passing Rules
                </p>
                <p className="font-medium text-[var(--text-primary)]">
                  {detailCert.scoringModel.scaleLabel}
                </p>
                <p className="text-[var(--text-secondary)]">
                  {detailCert.scoringModel.passingRequirement}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {t.certExplorer.feeLabel} & {t.certExplorer.validityLabel}
                </p>
                <p className="font-medium text-[var(--text-primary)] tabular-nums">
                  {detailCert.fee.displayText} · {detailCert.validityPeriod}
                </p>
                <p className="text-[var(--text-secondary)]">{detailCert.fee.regionalNote}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Registration & Scope
                </p>
                <p className="text-[var(--text-secondary)]">{detailCert.registrationInfo}</p>
                <p className="text-[var(--text-secondary)]">{detailCert.acceptedCountriesNote}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-primary)]">University Relevance</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {detailCert.universityRelevance}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-primary)]">Career Relevance</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {detailCert.careerRelevance}
                </p>
              </div>
            </div>

            {detailCert.officialPrepResources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Official Preparation Resources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailCert.officialPrepResources.map((res, idx) => (
                    <a
                      key={idx}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary)] hover:underline px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
                    >
                      {res.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-hairline)]">
              <a
                href={detailCert.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                {t.certExplorer.officialSite}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {!hasDuplicateCertificateGoal(goalsState.goals, detailCert.id) && (
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    const target = detailCert;
                    setDetailCert(null);
                    onAddCertificateAsGoal(target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.certExplorer.addAsGoal}
                </GlassButton>
              )}
            </div>
          </div>
        )}
      </GlassModal>

      {/* Side-by-Side Comparison Modal */}
      <GlassModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={t.certExplorer.compareModalTitle}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">{t.certExplorer.compareSubtitle}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)]">
                  <th className="py-2.5 pr-4 font-semibold text-[var(--text-muted)] uppercase tracking-[0.05em]">
                    Dimension
                  </th>
                  {comparedCerts.map((c) => (
                    <th key={c.id} className="py-2.5 px-3 font-semibold text-[var(--text-primary)] min-w-[180px]">
                      <div className="flex items-center justify-between gap-2">
                        <span>{c.officialName}</span>
                        <button
                          type="button"
                          onClick={() => toggleCompare(c.id)}
                          className="text-[10px] text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">Issuer</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-primary)]">
                      {c.issuingOrganization}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">Scale & Format</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-primary)]">
                      {c.scoringModel.scaleLabel}
                      <div className="text-[var(--text-secondary)] mt-0.5">{c.examFormat}</div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">Validity</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-primary)]">
                      {c.validityPeriod}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">Approximate Fee</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-primary)] tabular-nums">
                      {c.fee.displayText}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">University Relevance</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-secondary)]">
                      {c.universityRelevance}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[var(--text-muted)]">Career Relevance</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-3 text-[var(--text-secondary)]">
                      {c.careerRelevance}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
