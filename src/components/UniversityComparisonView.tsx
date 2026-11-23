import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Building2,
  ExternalLink,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getExtendedUIStrings } from '../i18n/uiStrings';
import { TOP_10_STUDENT_CITIES } from '../data/topStudentCities';
import { CERTIFICATES_CATALOG, type CertificateRecord } from '../data/certificatesCatalog';
import {
  fetchGlobalCities,
  fetchGlobalCountries,
  fetchGlobalScholarships,
  fetchGlobalUniversities,
  fetchGlobalUniversityDetail,
  type EnrichedScholarshipItem,
} from '../services/globalApi';
import type {
  GlobalCityCluster,
  GlobalCountrySummary,
  GlobalUniversityDetail,
  GlobalUniversitySummary,
} from '../types/domain';

type ComparisonTab = 'universities' | 'countries' | 'cities' | 'scholarships' | 'certificates';

export const UniversityComparisonView: React.FC = () => {
  const {
    compareSlugs,
    toggleCompareSlug,
    citiesBySlug,
    openUniversityProfile,
    language,
    t,
  } = useApp();
  const ui = getExtendedUIStrings(language).comparisonPage;

  const [activeTab, setActiveTab] = useState<ComparisonTab>('universities');

  // =========================================================================
  // 1. UNIVERSITIES COMPARISON (Supports ANY global university, not just seeded!)
  // =========================================================================
  const [uniSearch, setUniSearch] = useState('');
  const [uniSuggestions, setUniSuggestions] = useState<GlobalUniversitySummary[]>([]);
  const [isSearchingUnis, setIsSearchingUnis] = useState(false);
  const [uniDetailsBySlug, setUniDetailsBySlug] = useState<Record<string, GlobalUniversityDetail>>(
    {}
  );

  // Fetch full details for all currently compared university slugs
  useEffect(() => {
    const activeSlugs = compareSlugs.slice(0, 4);
    const missing = activeSlugs.filter((s) => !uniDetailsBySlug[s]);
    if (missing.length === 0) return;

    const controller = new AbortController();
    Promise.all(
      missing.map((slug) =>
        fetchGlobalUniversityDetail(slug, controller.signal).catch(() => null)
      )
    ).then((results) => {
      if (controller.signal.aborted) return;
      setUniDetailsBySlug((prev) => {
        const next = { ...prev };
        for (const detail of results) {
          if (detail) next[detail.slug] = detail;
        }
        return next;
      });
    });

    return () => controller.abort();
  }, [compareSlugs, uniDetailsBySlug]);

  // Live global search for adding universities to comparison
  useEffect(() => {
    if (activeTab !== 'universities') return;
    const q = uniSearch.trim();
    if (q.length < 2) {
      setUniSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearchingUnis(true);
      fetchGlobalUniversities({ q, limit: 8 }, controller.signal)
        .then((res) => {
          setUniSuggestions(res.items.filter((u) => !compareSlugs.includes(u.slug)));
          setIsSearchingUnis(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setIsSearchingUnis(false);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, uniSearch, compareSlugs]);

  const comparedUnis = useMemo(
    () =>
      compareSlugs
        .slice(0, 4)
        .map((slug) => uniDetailsBySlug[slug])
        .filter((x): x is GlobalUniversityDetail => Boolean(x)),
    [compareSlugs, uniDetailsBySlug]
  );

  const costChartData = useMemo(() => {
    return comparedUnis
      .filter((u) => u.tuitionAnnualMinUsd !== null || (u.citySlug && citiesBySlug[u.citySlug]))
      .map((u) => {
        const city = u.citySlug ? citiesBySlug[u.citySlug] : undefined;
        const annualLivingEst = city
          ? Math.round(((city.monthlyLivingMinUsd + city.monthlyLivingMaxUsd) / 2) * 12)
          : 0;
        const annualTuitionMid =
          u.tuitionAnnualMinUsd !== null && u.tuitionAnnualMaxUsd !== null
            ? Math.round((u.tuitionAnnualMinUsd + u.tuitionAnnualMaxUsd) / 2)
            : u.tuitionAnnualMinUsd ?? 0;
        return {
          name: u.shortName || u.name.slice(0, 18),
          TuitionUSD: annualTuitionMid,
          LivingEstUSD: annualLivingEst,
        };
      });
  }, [comparedUnis, citiesBySlug]);

  // =========================================================================
  // 2. COUNTRIES COMPARISON
  // =========================================================================
  const [allCountries, setAllCountries] = useState<GlobalCountrySummary[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(['JP', 'DE', 'GB']);

  useEffect(() => {
    const controller = new AbortController();
    fetchGlobalCountries({}, controller.signal)
      .then((res) => setAllCountries(res.countries))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const comparedCountries = useMemo(
    () =>
      selectedCountryCodes
        .map((code) => allCountries.find((c) => c.isoCode === code))
        .filter((c): c is GlobalCountrySummary => Boolean(c)),
    [selectedCountryCodes, allCountries]
  );

  const countrySuggestions = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return [];
    return allCountries
      .filter(
        (c) =>
          !selectedCountryCodes.includes(c.isoCode) &&
          (c.name.toLowerCase().includes(q) || c.isoCode.toLowerCase() === q)
      )
      .slice(0, 8);
  }, [allCountries, countrySearch, selectedCountryCodes]);

  // =========================================================================
  // 3. CITIES COMPARISON
  // =========================================================================
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<GlobalCityCluster[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [comparedCities, setComparedCities] = useState<GlobalCityCluster[]>(() =>
    TOP_10_STUDENT_CITIES.slice(0, 3).map((tc) => ({
      name: tc.name,
      slug: tc.slug,
      countryCode: tc.countryCode,
      countryName: tc.countryName,
      countryFlag: tc.countryFlag,
      continent: tc.continent,
      latitude: tc.latitude,
      longitude: tc.longitude,
      universityCount: tc.flagshipUniversities.length,
      isSeededCity: true,
      qsStudentCityRank: tc.rank,
      qsRankingSource: tc.rankingSource,
      shortDescription: tc.shortDescription,
      monthlyLivingMinUsd: tc.monthlyLivingMinUsd,
      monthlyLivingMaxUsd: tc.monthlyLivingMaxUsd,
      topUniversityNames: tc.flagshipUniversities,
    }))
  );

  useEffect(() => {
    if (activeTab !== 'cities') return;
    const q = citySearch.trim();
    if (q.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearchingCities(true);
      fetchGlobalCities({ q }, controller.signal)
        .then((res) => {
          setCitySuggestions(
            res.matchedCities.filter((c) => !comparedCities.some((x) => x.slug === c.slug))
          );
          setIsSearchingCities(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setIsSearchingCities(false);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, citySearch, comparedCities]);

  // =========================================================================
  // 4. SCHOLARSHIPS COMPARISON
  // =========================================================================
  const [allScholarships, setAllScholarships] = useState<EnrichedScholarshipItem[]>([]);
  const [scholarshipSearch, setScholarshipSearch] = useState('');
  const [selectedScholarshipSlugs, setSelectedScholarshipSlugs] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGlobalScholarships({}, controller.signal)
      .then((res) => {
        setAllScholarships(res.items);
        if (selectedScholarshipSlugs.length === 0 && res.items.length > 0) {
          setSelectedScholarshipSlugs(res.items.slice(0, 3).map((s) => s.slug));
        }
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comparedScholarships = useMemo(
    () =>
      selectedScholarshipSlugs
        .map((slug) => allScholarships.find((s) => s.slug === slug))
        .filter((s): s is EnrichedScholarshipItem => Boolean(s)),
    [selectedScholarshipSlugs, allScholarships]
  );

  const scholarshipSuggestions = useMemo(() => {
    const q = scholarshipSearch.trim().toLowerCase();
    if (!q) return [];
    return allScholarships
      .filter(
        (s) =>
          !selectedScholarshipSlugs.includes(s.slug) &&
          (s.name.toLowerCase().includes(q) ||
            s.provider.toLowerCase().includes(q) ||
            s.countryName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allScholarships, scholarshipSearch, selectedScholarshipSlugs]);

  // =========================================================================
  // 5. CERTIFICATES COMPARISON
  // =========================================================================
  const [certSearch, setCertSearch] = useState('');
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>(() =>
    CERTIFICATES_CATALOG.slice(0, 3).map((c) => c.id)
  );

  const comparedCerts = useMemo(
    () =>
      selectedCertIds
        .map((id) => CERTIFICATES_CATALOG.find((c) => c.id === id))
        .filter((c): c is CertificateRecord => Boolean(c)),
    [selectedCertIds]
  );

  const certSuggestions = useMemo(() => {
    const q = certSearch.trim().toLowerCase();
    if (!q) return [];
    return CERTIFICATES_CATALOG.filter(
      (c) =>
        !selectedCertIds.includes(c.id) &&
        (c.officialName.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.issuingOrganization.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [certSearch, selectedCertIds]);

  const TABS: Array<{ id: ComparisonTab; label: string; icon: React.ReactNode }> = [
    { id: 'universities', label: t.nav.universities, icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'countries', label: t.nav.countries, icon: <Globe2 className="w-3.5 h-3.5" /> },
    { id: 'cities', label: t.nav.exploreByCity, icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'scholarships', label: t.nav.scholarships, icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'certificates', label: t.admissionView.languageTests, icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t.comparisonView.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {ui.subtitle}
          </p>
        </div>

        {/* Multi-Entity Comparison Mode Switcher */}
        <div className="glass-segmented inline-flex flex-wrap items-center gap-1 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`compare-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-[transform,opacity,border-color,color] duration-300 ${
                activeTab === tab.id
                  ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: UNIVERSITIES COMPARISON                                    */}
      {/* ================================================================= */}
      {activeTab === 'universities' && (
        <div className="space-y-6" data-testid="comparison-universities-panel">
          {compareSlugs.length < 4 && (
            <div className="surface-card rounded-2xl p-4 space-y-2 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {ui.addUniversityBtn} ({compareSlugs.length}/4)
                </span>
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={uniSearch}
                    onChange={(e) => setUniSearch(e.target.value)}
                    placeholder={ui.searchToAddPlaceholder}
                    aria-label={ui.searchToAddPlaceholder}
                    data-testid="compare-uni-search-input"
                    className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                  />
                </div>
              </div>
              {(isSearchingUnis || uniSuggestions.length > 0) && (
                <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-2">
                  {isSearchingUnis && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching global registry...
                    </span>
                  )}
                  {uniSuggestions.map((u) => (
                    <button
                      key={u.slug}
                      type="button"
                      onClick={() => {
                        toggleCompareSlug(u.slug);
                        setUniSearch('');
                        setUniSuggestions([]);
                      }}
                      className="btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>
                        {u.countryFlag} {u.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">({u.cityName})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {comparedUnis.length === 0 ? (
            <div className="surface-card rounded-2xl p-10 text-center space-y-2">
              <p className="font-display text-2xl font-semibold">{t.comparisonView.emptyState}</p>
              <p className="text-xs text-[var(--text-muted)]">
                Use the search bar above to add up to 4 verified universities from anywhere in the world.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {comparedUnis.map((uni) => (
                  <div
                    key={uni.slug}
                    className="surface-card motion-interactive-card rounded-2xl p-5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-[var(--text-muted)]">
                        {uni.countryFlag} {uni.cityName}, {uni.countryName}
                      </p>
                      <button
                        type="button"
                        onClick={() => openUniversityProfile(uni.slug)}
                        className="font-display text-xl font-semibold text-left hover:text-[var(--accent-primary)] cursor-pointer leading-snug"
                      >
                        {uni.name}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompareSlug(uni.slug)}
                      aria-label={`${t.common.delete} ${uni.name}`}
                      className="btn-glass p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {costChartData.length > 0 && (
                <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-4 min-w-0">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">
                      Estimated Annual Cost Comparison (USD)
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Published international tuition midpoint paired with estimated 12-month city living expenses where verified.
                    </p>
                  </div>
                  <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={costChartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--bg-solid-surface)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-hairline)',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="TuitionUSD" name="Tuition (USD/yr)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="LivingEstUSD" name="Est. City Living (USD/yr)" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="surface-card rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="py-3 px-4 w-44">Dimension</th>
                      {comparedUnis.map((u) => (
                        <th key={u.slug} className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                          {u.shortName || u.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Location</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4">
                          {u.countryFlag} {u.cityName}, {u.countryName}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Type / Founded</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4">
                          {u.institutionType}
                          {u.foundedYear ? ` · Est. ${u.foundedYear}` : ''}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">QS / THE Rankings</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4 font-mono-tabular">
                          QS: {u.qsRankDisplay || 'Not verified'} · THE: {u.theRankDisplay || 'Not verified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Research Output</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4 font-mono-tabular">
                          {u.worksCount != null
                            ? `${u.worksCount.toLocaleString()} works`
                            : 'See official portal'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Published Tuition</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4 font-mono-tabular">
                          {u.tuitionLocalDisplay || 'Not yet verified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Language</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4">
                          {u.primaryLanguage || 'Check official catalog'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Strengths / Topics</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4">
                          {(u.academicStrengths.length > 0 ? u.academicStrengths : u.topTopics)
                            .slice(0, 4)
                            .join(', ') || 'See catalog'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Data Source</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4 text-xs text-[var(--text-muted)]">
                          {u.sourceName}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Official Portal</td>
                      {comparedUnis.map((u) => (
                        <td key={u.slug} className="py-3 px-4">
                          {u.officialWebsite ? (
                            <a
                              href={u.officialWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline text-xs font-medium"
                            >
                              <span>Visit Site</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: COUNTRIES COMPARISON                                       */}
      {/* ================================================================= */}
      {activeTab === 'countries' && (
        <div className="space-y-6" data-testid="comparison-countries-panel">
          {selectedCountryCodes.length < 4 && (
            <div className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Add any country worldwide ({selectedCountryCodes.length}/4 selected)
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country (Uzbekistan, Canada, South Korea...)"
                    className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                  />
                </div>
              </div>
              {countrySuggestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-2">
                  {countrySuggestions.map((c) => (
                    <button
                      key={c.isoCode}
                      type="button"
                      onClick={() => {
                        setSelectedCountryCodes((prev) => [...prev, c.isoCode].slice(0, 4));
                        setCountrySearch('');
                      }}
                      className="btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>
                        {c.flagEmoji} {c.name} ({c.totalVerifiedUniversities.toLocaleString()})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="surface-card rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-44">Dimension</th>
                  {comparedCountries.map((c) => (
                    <th key={c.isoCode} className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {c.flagEmoji} {c.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCountryCodes((prev) => prev.filter((x) => x !== c.isoCode))
                          }
                          aria-label={`Remove ${c.name}`}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Continent / Capital</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4">
                      {c.continent}
                      {c.capital ? ` · ${c.capital}` : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Verified Universities</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4 font-mono-tabular font-semibold">
                      {c.totalVerifiedUniversities.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Annual Tuition Range</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4 font-mono-tabular">
                      {c.tuitionRangeMinUsd != null && c.tuitionRangeMaxUsd != null
                        ? `$${c.tuitionRangeMinUsd.toLocaleString()} – $${c.tuitionRangeMaxUsd.toLocaleString()}`
                        : 'Varies by institution'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Monthly Living Cost</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4 font-mono-tabular">
                      {c.livingCostMonthlyMinUsd != null && c.livingCostMonthlyMaxUsd != null
                        ? `$${c.livingCostMonthlyMinUsd.toLocaleString()} – $${c.livingCostMonthlyMaxUsd.toLocaleString()}/mo`
                        : 'Not yet verified'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Language Requirements</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4 text-xs">
                      {c.languageRequirements || 'Set at institution / program level'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Official Portal</td>
                  {comparedCountries.map((c) => (
                    <td key={c.isoCode} className="py-3 px-4">
                      {c.officialPortalUrl ? (
                        <a
                          href={c.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline text-xs font-medium"
                        >
                          Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: CITIES COMPARISON                                          */}
      {/* ================================================================= */}
      {activeTab === 'cities' && (
        <div className="space-y-6" data-testid="comparison-cities-panel">
          {comparedCities.length < 4 && (
            <div className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Add any student city worldwide ({comparedCities.length}/4 selected)
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search city (Fukuoka, Berlin, Tashkent, Munich...)"
                    className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                  />
                </div>
              </div>
              {(isSearchingCities || citySuggestions.length > 0) && (
                <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-2">
                  {isSearchingCities && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {citySuggestions.map((city) => (
                    <button
                      key={`${city.countryCode}-${city.slug}`}
                      type="button"
                      onClick={() => {
                        setComparedCities((prev) => [...prev, city].slice(0, 4));
                        setCitySearch('');
                        setCitySuggestions([]);
                      }}
                      className="btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>
                        {city.countryFlag} {city.name}, {city.countryName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="surface-card rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-44">Dimension</th>
                  {comparedCities.map((c) => (
                    <th key={c.slug} className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {c.countryFlag} {c.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setComparedCities((prev) => prev.filter((x) => x.slug !== c.slug))
                          }
                          aria-label={`Remove ${c.name}`}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Country / Continent</td>
                  {comparedCities.map((c) => (
                    <td key={c.slug} className="py-3 px-4">
                      {c.countryName} · {c.continent}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">QS Best Student City</td>
                  {comparedCities.map((c) => (
                    <td key={c.slug} className="py-3 px-4 font-mono-tabular">
                      {c.qsStudentCityRank ? `#${c.qsStudentCityRank} (2025)` : 'Not in Top 10'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Est. Monthly Living</td>
                  {comparedCities.map((c) => (
                    <td key={c.slug} className="py-3 px-4 font-mono-tabular">
                      {c.monthlyLivingMinUsd && c.monthlyLivingMaxUsd
                        ? `$${c.monthlyLivingMinUsd}–$${c.monthlyLivingMaxUsd}/mo`
                        : 'Not yet curated'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Notable Institutions</td>
                  {comparedCities.map((c) => (
                    <td key={c.slug} className="py-3 px-4 text-xs">
                      {(c.topUniversityNames || []).slice(0, 3).join(', ') || 'See City Explorer'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: SCHOLARSHIPS COMPARISON                                    */}
      {/* ================================================================= */}
      {activeTab === 'scholarships' && (
        <div className="space-y-6" data-testid="comparison-scholarships-panel">
          {selectedScholarshipSlugs.length < 4 && (
            <div className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Add verified scholarships ({selectedScholarshipSlugs.length}/4 selected)
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={scholarshipSearch}
                    onChange={(e) => setScholarshipSearch(e.target.value)}
                    placeholder="Search scholarship (MEXT, DAAD, GKS, Chevening...)"
                    className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                  />
                </div>
              </div>
              {scholarshipSuggestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-2">
                  {scholarshipSuggestions.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => {
                        setSelectedScholarshipSlugs((prev) => [...prev, s.slug].slice(0, 4));
                        setScholarshipSearch('');
                      }}
                      className="btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>
                        {s.countryFlag} {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="surface-card rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-44">Dimension</th>
                  {comparedScholarships.map((s) => (
                    <th key={s.slug} className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {s.countryFlag} {s.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedScholarshipSlugs((prev) => prev.filter((x) => x !== s.slug))
                          }
                          aria-label={`Remove ${s.name}`}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Host Country</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4">
                      {s.countryFlag} {s.countryName}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Application Status</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4 font-semibold">
                      {s.computedStatus.label}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Degree Levels</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4">
                      {s.degreeLevelsJson.join(' / ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Coverage</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4 text-xs">
                      {s.coverageSummary}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Deadline Window</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4 font-mono-tabular text-xs">
                      {s.deadlineText}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Official Portal</td>
                  {comparedScholarships.map((s) => (
                    <td key={s.slug} className="py-3 px-4">
                      <a
                        href={s.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline text-xs font-medium"
                      >
                        Official <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: CERTIFICATES COMPARISON                                    */}
      {/* ================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-6" data-testid="comparison-certificates-panel">
          {selectedCertIds.length < 4 && (
            <div className="surface-card rounded-2xl p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Add verified international certificates ({selectedCertIds.length}/4 selected)
                </span>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={certSearch}
                    onChange={(e) => setCertSearch(e.target.value)}
                    placeholder="Search IELTS, TOEFL, SAT, GRE, JLPT, TestDaF..."
                    className="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs"
                  />
                </div>
              </div>
              {certSuggestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-2">
                  {certSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCertIds((prev) => [...prev, c.id].slice(0, 4));
                        setCertSearch('');
                      }}
                      className="btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>{c.shortName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="surface-card rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-44">Dimension</th>
                  {comparedCerts.map((c) => (
                    <th key={c.id} className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center justify-between gap-2">
                        <span>{c.shortName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCertIds((prev) => prev.filter((x) => x !== c.id))
                          }
                          aria-label={`Remove ${c.shortName}`}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Full Name</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4">
                      {c.officialName}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Official Provider</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4">
                      {c.issuingOrganization}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Scoring Scale</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4 font-mono-tabular">
                      {c.scoringModel.scaleLabel}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Typical Exam Fee</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4 font-mono-tabular">
                      {c.fee.displayText}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Validity Period</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4">
                      {c.validityPeriod}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[var(--text-muted)]">Official Website</td>
                  {comparedCerts.map((c) => (
                    <td key={c.id} className="py-3 px-4">
                      <a
                        href={c.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline text-xs font-medium"
                      >
                        Official <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
