import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Check,
  CheckCircle2,
  Globe2,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateAnnualStudyCost,
  convertUsdToCurrency,
  formatCurrencyAmount,
} from '../utils/academicLogic';
import {
  CITY_CONTINENT_CATEGORIES,
  filterAndRankGlobalCities,
  GLOBAL_CITIES_LIVING_CATALOG,
  type CityContinentCategory,
  type GlobalCityLivingProfile,
} from '../data/globalCitiesLivingCatalog';
import {
  getExtendedUIStrings,
  translateContinentName,
} from '../i18n/uiStrings';
import { GlassCard } from './glass';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CHF', 'SGD', 'CAD', 'AUD', 'UZS'];

const DEFAULT_COMPARE_CITY_SLUGS = [
  'tokyo-jp',
  'kyoto-jp',
  'munich-de',
  'london-gb',
  'boston-us',
  'seoul-kr',
  'tashkent-uz',
];

export const FinancialPlannerView: React.FC = () => {
  const {
    catalog,
    citiesBySlug,
    countriesByCode,
    currencyRates,
    t,
    language,
    setActiveSection,
  } = useApp();

  const fcUi = getExtendedUIStrings(language).financialCityComparison;

  const [presetUniSlug, setPresetUniSlug] = useState<string>('university-of-tokyo');
  const [presetCitySlug, setPresetCitySlug] = useState<string>('tokyo-jp');
  const [currency, setCurrency] = useState<string>('USD');

  const initialUni =
    catalog.universities.find((u) => u.slug === 'university-of-tokyo') ||
    catalog.universities[0];
  const initialCity =
    citiesBySlug['tokyo-jp'] || catalog.cities[0];

  const [tuitionAnnualUsd, setTuitionAnnualUsd] = useState<number>(
    initialUni?.tuitionAnnualMinUsd ?? 3700
  );
  const [housingMonthlyUsd, setHousingMonthlyUsd] = useState<number>(
    initialCity?.housingMonthlyUsd ?? 620
  );
  const [foodMonthlyUsd, setFoodMonthlyUsd] = useState<number>(
    initialCity?.foodMonthlyUsd ?? 320
  );
  const [transportMonthlyUsd, setTransportMonthlyUsd] = useState<number>(
    initialCity?.transportMonthlyUsd ?? 75
  );
  const [monthsPerYear, setMonthsPerYear] = useState<number>(12);
  const [insuranceAnnualUsd, setInsuranceAnnualUsd] = useState<number>(
    initialCity?.insuranceAnnualUsd ?? 250
  );
  const [materialsAnnualUsd, setMaterialsAnnualUsd] = useState<number>(500);
  const [otherAnnualUsd, setOtherAnnualUsd] = useState<number>(800);
  const [scholarshipAnnualUsd, setScholarshipAnnualUsd] = useState<number>(0);

  // Global City Discovery & Multi-City Comparison State
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [selectedContinent, setSelectedContinent] = useState<CityContinentCategory>('All cities');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [selectedCompareCitySlugs, setSelectedCompareCitySlugs] = useState<string[]>(
    DEFAULT_COMPARE_CITY_SLUGS
  );

  const handleSelectUniversityPreset = (slug: string) => {
    setPresetUniSlug(slug);
    const uni = catalog.universities.find((u) => u.slug === slug);
    if (!uni) return;
    if (uni.tuitionAnnualMinUsd !== null) {
      setTuitionAnnualUsd(uni.tuitionAnnualMinUsd);
    }
    const city = citiesBySlug[uni.citySlug];
    const globalCity = GLOBAL_CITIES_LIVING_CATALOG.find((c) => c.slug === uni.citySlug);
    if (globalCity) {
      setPresetCitySlug(globalCity.slug);
      setHousingMonthlyUsd(globalCity.accommodationMonthlyUsd);
      setFoodMonthlyUsd(globalCity.foodMonthlyUsd);
      setTransportMonthlyUsd(globalCity.transportMonthlyUsd);
    } else if (city) {
      setPresetCitySlug(city.slug);
      setHousingMonthlyUsd(city.housingMonthlyUsd);
      setFoodMonthlyUsd(city.foodMonthlyUsd);
      setTransportMonthlyUsd(city.transportMonthlyUsd);
      setInsuranceAnnualUsd(city.insuranceAnnualUsd);
    }
  };

  const handleSelectCityPreset = (slug: string) => {
    setPresetCitySlug(slug);
    const globalCity = GLOBAL_CITIES_LIVING_CATALOG.find((c) => c.slug === slug);
    if (globalCity) {
      setHousingMonthlyUsd(globalCity.accommodationMonthlyUsd);
      setFoodMonthlyUsd(globalCity.foodMonthlyUsd);
      setTransportMonthlyUsd(globalCity.transportMonthlyUsd);
      setOtherAnnualUsd(
        (globalCity.utilitiesMonthlyUsd +
          globalCity.internetMonthlyUsd +
          globalCity.otherMonthlyUsd) *
          12
      );
      return;
    }
    const city = citiesBySlug[slug];
    if (!city) return;
    setHousingMonthlyUsd(city.housingMonthlyUsd);
    setFoodMonthlyUsd(city.foodMonthlyUsd);
    setTransportMonthlyUsd(city.transportMonthlyUsd);
    setInsuranceAnnualUsd(city.insuranceAnnualUsd);
  };

  const breakdown = useMemo(
    () =>
      calculateAnnualStudyCost({
        tuitionAnnualUsd,
        housingMonthlyUsd,
        foodMonthlyUsd,
        transportMonthlyUsd,
        monthsPerAcademicYear: monthsPerYear,
        insuranceAnnualUsd,
        studyMaterialsAnnualUsd: materialsAnnualUsd,
        otherExpensesAnnualUsd: otherAnnualUsd,
        scholarshipDeductionAnnualUsd: scholarshipAnnualUsd,
      }),
    [
      tuitionAnnualUsd,
      housingMonthlyUsd,
      foodMonthlyUsd,
      transportMonthlyUsd,
      monthsPerYear,
      insuranceAnnualUsd,
      materialsAnnualUsd,
      otherAnnualUsd,
      scholarshipAnnualUsd,
    ]
  );

  const fmt = (usd: number) =>
    formatCurrencyAmount(
      convertUsdToCurrency(usd, currency, currencyRates.ratesFromUsd),
      currency
    );

  // Countries available in Global Cities Living Catalog (filtered by selected continent if active)
  const availableCityCountries = useMemo(() => {
    const map = new Map<string, { code: string; name: string; flag: string }>();
    for (const c of GLOBAL_CITIES_LIVING_CATALOG) {
      if (selectedContinent !== 'All cities' && c.continent !== selectedContinent) continue;
      if (!map.has(c.countryCode)) {
        map.set(c.countryCode, {
          code: c.countryCode,
          name: c.countryName,
          flag: c.flagEmoji,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedContinent]);

  // Filtered & Ranked Global Cities for Discovery Selector
  const filteredGlobalCities = useMemo(
    () =>
      filterAndRankGlobalCities({
        query: citySearchQuery,
        continent: selectedContinent,
        countryCode: selectedCountryFilter,
      }),
    [citySearchQuery, selectedContinent, selectedCountryFilter]
  );

  // Resolved Selected Cities for Side-by-Side Comparison
  const comparedCityProfiles: GlobalCityLivingProfile[] = useMemo(() => {
    const bySlug = new Map(GLOBAL_CITIES_LIVING_CATALOG.map((c) => [c.slug, c]));
    return selectedCompareCitySlugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is GlobalCityLivingProfile => Boolean(c));
  }, [selectedCompareCitySlugs]);

  const handleToggleCompareCity = (slug: string) => {
    setSelectedCompareCitySlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.length > 1 ? prev.filter((s) => s !== slug) : prev;
      }
      if (prev.length >= 8) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  };

  const cityComparisonChartData = useMemo(() => {
    return comparedCityProfiles.map((c) => {
      const monthlyConverted = convertUsdToCurrency(
        c.totalMonthlyUsd,
        currency,
        currencyRates.ratesFromUsd
      );
      const annualConverted = convertUsdToCurrency(
        c.totalMonthlyUsd * monthsPerYear,
        currency,
        currencyRates.ratesFromUsd
      );
      return {
        city: c.cityName,
        monthlyCost: Math.round(monthlyConverted),
        livingCost: Math.round(annualConverted),
      };
    });
  }, [comparedCityProfiles, monthsPerYear, currency, currencyRates]);

  return (
    <div className="space-y-8" data-testid="financial-planner-view">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t.financialView.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t.financialView.subtitle} ({currencyRates.sourceOrg}, {currencyRates.updatedAt})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="currency-select" className="text-xs text-[var(--text-muted)]">
            {t.financialView.currencyLabel}:
          </label>
          <select
            id="currency-select"
            data-testid="financial-currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs font-mono-tabular font-semibold"
          >
            {CURRENCIES.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Row: Annual Study Cost Calculator + Annual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-6 min-w-0 surface-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="preset-uni-select"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                {t.nav.universities}
              </label>
              <select
                id="preset-uni-select"
                value={presetUniSlug}
                onChange={(e) => handleSelectUniversityPreset(e.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2 text-xs"
              >
                {catalog.universities.map((u) => (
                  <option key={u.slug} value={u.slug}>
                    {u.shortName} ({u.tuitionLocalDisplay})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="preset-city-select"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                {t.common.city}
              </label>
              <select
                id="preset-city-select"
                value={presetCitySlug}
                onChange={(e) => handleSelectCityPreset(e.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2 text-xs"
              >
                {GLOBAL_CITIES_LIVING_CATALOG.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.flagEmoji} {c.cityName}, {c.countryName} (${c.totalMonthlyUsd}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-hairline)]">
            <NumberField
              id="fp-tuition"
              label={t.financialView.tuitionInput}
              value={tuitionAnnualUsd}
              onChange={setTuitionAnnualUsd}
            />
            <NumberField
              id="fp-months"
              label={t.financialView.monthsInput}
              value={monthsPerYear}
              min={1}
              max={12}
              onChange={setMonthsPerYear}
            />
            <NumberField
              id="fp-housing"
              label={t.financialView.housingInput}
              value={housingMonthlyUsd}
              onChange={setHousingMonthlyUsd}
            />
            <NumberField
              id="fp-food"
              label={t.financialView.foodInput}
              value={foodMonthlyUsd}
              onChange={setFoodMonthlyUsd}
            />
            <NumberField
              id="fp-transport"
              label={t.financialView.transportInput}
              value={transportMonthlyUsd}
              onChange={setTransportMonthlyUsd}
            />
            <NumberField
              id="fp-insurance"
              label={t.financialView.insuranceInput}
              value={insuranceAnnualUsd}
              onChange={setInsuranceAnnualUsd}
            />
            <NumberField
              id="fp-materials"
              label={t.financialView.materialsInput}
              value={materialsAnnualUsd}
              onChange={setMaterialsAnnualUsd}
            />
            <NumberField
              id="fp-other"
              label={t.financialView.otherInput}
              value={otherAnnualUsd}
              onChange={setOtherAnnualUsd}
            />
          </div>

          <div className="pt-2 border-t border-[var(--border-hairline)] space-y-3">
            <NumberField
              id="fp-scholarship"
              label={t.financialView.scholarshipInput}
              value={scholarshipAnnualUsd}
              onChange={setScholarshipAnnualUsd}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setScholarshipAnnualUsd(0)}
                className="rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-medium hover:border-[var(--accent-primary)] cursor-pointer"
              >
                $0
              </button>
              <button
                type="button"
                onClick={() => setScholarshipAnnualUsd(Math.round(tuitionAnnualUsd * 0.5))}
                className="rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-medium hover:border-[var(--accent-primary)] cursor-pointer"
              >
                50% {t.financialView.tuitionInput}
              </button>
              <button
                type="button"
                onClick={() => setScholarshipAnnualUsd(Math.round(breakdown.grossAnnualCostUsd))}
                className="rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-medium hover:border-[var(--accent-primary)] cursor-pointer"
              >
                100% {t.common.scholarship}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setActiveSection('my-academic-journey')}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent-primary)] cursor-pointer"
              >
                {t.nav.myAcademicJourney}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('ai-advisor')}
                className="rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                {t.nav.aiAdvisor}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Breakdown & Multi-City Visual Chart */}
        <div className="lg:col-span-6 min-w-0 space-y-6">
          <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  {t.financialView.netAnnualCost} ({monthsPerYear})
                </p>
                <p className="font-display text-4xl font-semibold mt-1 font-mono-tabular">
                  {fmt(breakdown.netAnnualCostUsd)}
                </p>
                {currency !== 'USD' && (
                  <p className="text-xs font-mono-tabular text-[var(--text-muted)] mt-0.5">
                    USD ${breakdown.netAnnualCostUsd.toLocaleString()}
                  </p>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)]">{t.common.estimated}</span>
            </div>

            <div className="space-y-2.5 text-sm">
              <LineRow label={t.financialView.tuitionInput} value={fmt(breakdown.tuitionUsd)} />
              <LineRow
                label={`${fcUi.accommodationCol} (${monthsPerYear})`}
                value={fmt(breakdown.accommodationUsd)}
              />
              <LineRow
                label={`${fcUi.foodCol} (${monthsPerYear})`}
                value={fmt(breakdown.foodUsd)}
              />
              <LineRow
                label={`${fcUi.transportCol} (${monthsPerYear})`}
                value={fmt(breakdown.transportationUsd)}
              />
              <LineRow label={t.financialView.insuranceInput} value={fmt(breakdown.insuranceUsd)} />
              <LineRow label={t.financialView.materialsInput} value={fmt(breakdown.studyMaterialsUsd)} />
              <LineRow label={fcUi.otherCol} value={fmt(breakdown.otherExpensesUsd)} />
              <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between font-medium">
                <span>{t.financialView.grossTotal}</span>
                <span className="font-mono-tabular">{fmt(breakdown.grossAnnualCostUsd)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span>{t.common.scholarship}</span>
                <span className="font-mono-tabular">-{fmt(breakdown.scholarshipDeductionUsd)}</span>
              </div>
            </div>
          </div>

          <GlassCard className="p-5 sm:p-6 space-y-4 min-w-0">
            <div>
              <h3 className="font-display text-xl font-semibold">
                {fcUi.annualProjectionTitle}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {fcUi.totalMonthlyCol} & {fcUi.totalAnnualCol} ({monthsPerYear}) · {currency}
              </p>
            </div>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart
                  data={cityComparisonChartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-solid-surface)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-hairline)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: 'var(--glass-shadow)',
                    }}
                  />
                  <Bar
                    dataKey="monthlyCost"
                    name={`${fcUi.totalMonthlyCol} (${currency})`}
                    fill="var(--accent-primary)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Global City Living Cost Discovery & Multi-City Itemized Monthly Comparison */}
      <section
        data-testid="financial-city-comparison-section"
        className="surface-card rounded-2xl p-5 sm:p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/35 bg-[var(--accent-primary)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--accent-primary)]">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{GLOBAL_CITIES_LIVING_CATALOG.length}+ Global Academic Cities</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              {fcUi.sectionTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              {fcUi.sectionSubtitle}
            </p>
          </div>

          <button
            type="button"
            data-testid="reset-default-cities-btn"
            onClick={() => {
              setSelectedCompareCitySlugs(DEFAULT_COMPARE_CITY_SLUGS);
              setCitySearchQuery('');
              setSelectedContinent('All cities');
              setSelectedCountryFilter('all');
            }}
            className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium self-start lg:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{fcUi.resetDefaultCitiesBtn}</span>
          </button>
        </div>

        {/* City Search & Geographical Category Filter Bar */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-8">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                data-testid="financial-city-search-input"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder={fcUi.searchCityPlaceholder}
                aria-label={fcUi.searchCityPlaceholder}
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="md:col-span-4">
              <select
                aria-label={fcUi.countryFilterLabel}
                data-testid="financial-city-country-select"
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm"
              >
                <option value="all">{fcUi.allCountriesOption}</option>
                {availableCityCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Geographical Continent Category Filter Tabs */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label={fcUi.continentFilterLabel}
          >
            {CITY_CONTINENT_CATEGORIES.map((cat) => {
              const active = selectedContinent === cat;
              const count =
                cat === 'All cities'
                  ? GLOBAL_CITIES_LIVING_CATALOG.length
                  : GLOBAL_CITIES_LIVING_CATALOG.filter((c) => c.continent === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`financial-continent-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setSelectedContinent(cat);
                    setSelectedCountryFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    active
                      ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                      : 'btn-glass'
                  }`}
                >
                  <span>{translateContinentName(cat, language)}</span>
                  <span className="ml-1.5 font-mono-tabular text-[11px] opacity-75">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currently Selected Cities Strip */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {fcUi.selectedCitiesHeading} ({comparedCityProfiles.length}/8)
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">{fcUi.replaceHint}</span>
          </div>
          <div className="flex flex-wrap gap-2" data-testid="selected-comparison-cities-strip">
            {comparedCityProfiles.map((city) => (
              <div
                key={city.slug}
                data-testid={`selected-city-chip-${city.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 px-3 py-1.5 text-xs font-medium"
              >
                <span>{city.flagEmoji}</span>
                <span className="font-semibold text-[var(--text-primary)]">{city.cityName}</span>
                <span className="text-[var(--text-muted)] font-mono-tabular">
                  {fmt(city.totalMonthlyUsd)}/mo
                </span>
                {comparedCityProfiles.length > 1 && (
                  <button
                    type="button"
                    aria-label={`${fcUi.removeCityBtn} ${city.cityName}`}
                    onClick={() => handleToggleCompareCity(city.slug)}
                    className="text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Organized Selectable City Directory Grid */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {fcUi.availableCitiesHeading} ({filteredGlobalCities.length})
          </h3>

          {filteredGlobalCities.length === 0 ? (
            <div className="surface-subtle rounded-xl p-6 text-center text-xs text-[var(--text-secondary)]">
              {fcUi.noCitiesMatchFilter}
            </div>
          ) : (
            <div
              data-testid="global-city-selector-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1"
            >
              {filteredGlobalCities.map((city) => {
                const isSelected = selectedCompareCitySlugs.includes(city.slug);
                return (
                  <button
                    key={city.slug}
                    type="button"
                    data-testid={`city-selector-card-${city.slug}`}
                    onClick={() => handleToggleCompareCity(city.slug)}
                    className={`rounded-xl p-3 text-left transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/12'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">{city.flagEmoji}</span>
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {city.cityName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {city.countryName} · {translateContinentName(city.continent, language)}
                      </p>
                      <p className="text-xs font-mono-tabular font-semibold text-[var(--accent-primary)] mt-1">
                        {fmt(city.totalMonthlyUsd)}/mo
                      </p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                          : 'border border-[var(--border-hairline)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Itemized Monthly Living-Cost Comparison Table */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-hairline)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold">
              {fcUi.monthlyBreakdownTitle} ({currency})
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">
              {fcUi.sourceAttributionPrefix} {currencyRates.sourceOrg} ({currencyRates.updatedAt})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table
              data-testid="financial-city-monthly-table"
              className="w-full text-left border-collapse text-xs sm:text-sm"
            >
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-3">{fcUi.cityCol}</th>
                  <th className="py-3 px-3">{fcUi.countryCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.accommodationCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.foodCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.transportCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.utilitiesCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.internetCol}</th>
                  <th className="py-3 px-3 text-right">{fcUi.otherCol}</th>
                  <th className="py-3 px-3 text-right font-semibold text-[var(--text-primary)]">
                    {fcUi.totalMonthlyCol}
                  </th>
                  <th className="py-3 px-3 text-right">{fcUi.statusCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {comparedCityProfiles.map((city) => (
                  <tr
                    key={city.slug}
                    data-testid={`city-comparison-row-${city.slug}`}
                    onClick={() => handleSelectCityPreset(city.slug)}
                    className="hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {city.cityName}
                    </td>
                    <td className="py-3 px-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      <span className="mr-1">{city.flagEmoji}</span>
                      <span>{city.countryName}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.accommodationMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.foodMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.transportMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.utilitiesMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.internetMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular">
                      {fmt(city.otherMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular font-bold text-[var(--accent-primary)] whitespace-nowrap">
                      {fmt(city.totalMonthlyUsd)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {city.dataStatus === 'verified'
                            ? fcUi.verifiedBadge
                            : fcUi.estimatedBadge}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const NumberField: React.FC<{
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}> = ({ id, label, value, min = 0, max = 250000, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
      {label}
    </label>
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
      className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-tabular"
    />
  </div>
);

const LineRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-[var(--text-secondary)]">
    <span>{label}</span>
    <span className="font-mono-tabular text-[var(--text-primary)]">{value}</span>
  </div>
);
