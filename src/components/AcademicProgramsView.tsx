import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp, ExternalLink, RotateCcw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DISCIPLINE_CATEGORIES } from '../data/seedCatalog';
import { filterAcademicPrograms } from '../utils/academicLogic';
import { formatCleanUniversityName } from '../utils/displayCopy';
import { MOTION_DURATION, MOTION_EASE } from '../motion/tokens';

export const AcademicProgramsView: React.FC = () => {
  const {
    catalog,
    universitiesBySlug,
    countriesByCode,
    citiesBySlug,
    openUniversityProfile,
    t,
  } = useApp();

  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('all');
  const [countryCode, setCountryCode] = useState('all');
  const [universitySlug, setUniversitySlug] = useState('all');
  const [degreeLevel, setDegreeLevel] = useState('all');
  const [language, setLanguage] = useState('all');
  const [maxTuitionUsd, setMaxTuitionUsd] = useState<string>('');
  const [maxDurationYears, setMaxDurationYears] = useState<string>('');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return filterAcademicPrograms(catalog.programs, universitiesBySlug, {
      query,
      discipline,
      countryCode,
      universitySlug,
      degreeLevel,
      language,
      maxTuitionUsd: maxTuitionUsd ? Number(maxTuitionUsd) : null,
      maxDurationYears: maxDurationYears ? Number(maxDurationYears) : null,
    });
  }, [
    catalog.programs,
    universitiesBySlug,
    query,
    discipline,
    countryCode,
    universitySlug,
    degreeLevel,
    language,
    maxTuitionUsd,
    maxDurationYears,
  ]);

  const resetAll = () => {
    setQuery('');
    setDiscipline('all');
    setCountryCode('all');
    setUniversitySlug('all');
    setDegreeLevel('all');
    setLanguage('all');
    setMaxTuitionUsd('');
    setMaxDurationYears('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">{t.programsView.title}</h1>
        <button
          type="button"
          onClick={resetAll}
          className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium self-start cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.common.resetFilters}</span>
        </button>
      </div>

      {/* Discipline Category Selector */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDiscipline('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
            discipline === 'all'
              ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
              : 'btn-glass'
          }`}
        >
          {t.common.all} ({catalog.programs.length})
        </button>
        {DISCIPLINE_CATEGORIES.map((cat) => {
          const count = catalog.programs.filter((p) => p.discipline === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setDiscipline(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                discipline === cat
                  ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                  : 'btn-glass'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="surface-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.programsView.searchPlaceholder}
            aria-label={t.programsView.searchPlaceholder}
            className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>

        <select
          aria-label={t.common.country}
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-xs"
        >
          <option value="all">{t.common.allCountries}</option>
          {catalog.countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flagEmoji} {c.name}
            </option>
          ))}
        </select>

        <select
          aria-label={t.common.university}
          value={universitySlug}
          onChange={(e) => setUniversitySlug(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-xs"
        >
          <option value="all">{t.common.all} · {t.nav.universities}</option>
          {catalog.universities.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.shortName}
            </option>
          ))}
        </select>

        <select
          aria-label={t.programsView.degreeLevel}
          value={degreeLevel}
          onChange={(e) => setDegreeLevel(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-xs"
        >
          <option value="all">{t.common.all} · {t.programsView.degreeLevel}</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
        </select>

        <select
          aria-label={t.common.language}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-xs"
        >
          <option value="all">{t.common.all} · {t.common.language}</option>
          <option value="English">English</option>
          <option value="Japanese">Japanese</option>
          <option value="German">German</option>
          <option value="French">French</option>
          <option value="Korean">Korean</option>
          <option value="Uzbek">Uzbek</option>
        </select>

        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 text-xs">
          <label htmlFor="prog-max-tuition" className="text-[var(--text-muted)] whitespace-nowrap">
            {t.common.tuitionAnnual} (max USD):
          </label>
          <input
            id="prog-max-tuition"
            type="number"
            min={0}
            step={1000}
            value={maxTuitionUsd}
            onChange={(e) => setMaxTuitionUsd(e.target.value)}
            placeholder={t.common.all}
            className="glass-input w-32 rounded-xl px-3 py-1.5 text-xs font-mono-tabular"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 text-xs">
          <label htmlFor="prog-max-dur" className="text-[var(--text-muted)] whitespace-nowrap">
            {t.programsView.duration} (max yrs):
          </label>
          <input
            id="prog-max-dur"
            type="number"
            min={1}
            max={6}
            step={0.5}
            value={maxDurationYears}
            onChange={(e) => setMaxDurationYears(e.target.value)}
            placeholder={t.common.all}
            className="glass-input w-28 rounded-xl px-3 py-1.5 text-xs font-mono-tabular"
          />
        </div>
      </div>

      {/* Minimal Program Cards with On-Demand Details */}
      {filtered.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-3">
          <p className="font-display text-2xl font-semibold">No matching academic programs</p>
          <button
            type="button"
            onClick={resetAll}
            className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            {t.common.resetFilters}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((prog) => {
            const uni = universitiesBySlug[prog.universitySlug];
            const country = uni ? countriesByCode[uni.countryCode] : null;
            const city = uni ? citiesBySlug[uni.citySlug] : null;
            const isExpanded = expandedSlug === prog.slug;

            return (
              <article
                key={prog.slug}
                className="surface-card motion-interactive-card rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold leading-snug">
                      {prog.name}
                    </h2>
                    <span className="font-mono-tabular text-xs font-semibold text-[var(--text-primary)] shrink-0">
                      {prog.tuitionAnnualUsd !== null
                        ? `~$${prog.tuitionAnnualUsd.toLocaleString()}/yr`
                        : `${prog.durationYears} yrs`}
                    </span>
                  </div>

                  {uni && (
                    <button
                      type="button"
                      onClick={() => openUniversityProfile(uni.slug)}
                      className="text-xs font-medium text-[var(--accent-primary)] hover:underline cursor-pointer text-left"
                    >
                      {country?.flagEmoji} {formatCleanUniversityName(uni.name)} · {city?.name}
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: MOTION_DURATION.micro, ease: MOTION_EASE }}
                        className="pt-3 mt-3 border-t border-[var(--border-hairline)] space-y-2.5 text-xs text-[var(--text-secondary)]"
                      >
                        <p className="text-[var(--text-muted)]">
                          {prog.discipline} · {prog.degreeLevel} · {prog.durationYears} yrs · {prog.language}
                        </p>
                        <p className="leading-relaxed">{prog.overview}</p>
                        <p>
                          <strong className="text-[var(--text-primary)]">
                            {t.programsView.careerOutcomes}:
                          </strong>{' '}
                          {prog.careerOutcomes}
                        </p>
                        <a
                          href={prog.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-[var(--accent-primary)] hover:underline pt-1"
                        >
                          <span>Department Curriculum</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] font-mono-tabular">
                    {prog.degreeLevel} · {prog.durationYears} yrs
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedSlug(isExpanded ? null : prog.slug)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] cursor-pointer"
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
