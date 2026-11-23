import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  GitCompare,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SavedUniversityEntry } from '../types/domain';
import { formatCleanUniversityName, splitTuitionDisplay } from '../utils/displayCopy';
import { ResearchLibraryStudio } from './library/ResearchLibraryStudio';
import { AcademicNavigationSystem } from './roadmap/AcademicNavigationSystem';

export const MyUniversitiesView: React.FC = () => {
  const {
    savedUniversities,
    saveUniversity,
    removeSavedUniversity,
    universitiesBySlug,
    citiesBySlug,
    countriesByCode,
    openUniversityProfile,
    compareSlugs,
    toggleCompareSlug,
    setActiveSection,
    t,
  } = useApp();

  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Dream' | 'Target' | 'Safety'>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  const collections = useMemo(() => {
    const set = new Set(savedUniversities.map((u) => u.collectionName || 'Shortlist'));
    return ['all', ...Array.from(set)];
  }, [savedUniversities]);

  const filtered = useMemo(() => {
    return savedUniversities.filter((item) => {
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (collectionFilter !== 'all' && item.collectionName !== collectionFilter) return false;
      return Boolean(universitiesBySlug[item.universitySlug]);
    });
  }, [savedUniversities, priorityFilter, collectionFilter, universitiesBySlug]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {t.workspaceViews.myUnisTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('universities')}
            className="btn-glass rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer"
          >
            Browse Universities
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('university-comparison')}
            className="btn-primary rounded-lg px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare ({compareSlugs.length})</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Dream', 'Target', 'Safety'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setPriorityFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                priorityFilter === tier
                  ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                  : 'btn-glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tier === 'all' ? 'All Priorities' : tier}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="collection-filter" className="text-xs text-[var(--text-muted)]">
            Collection:
          </label>
          <select
            id="collection-filter"
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs"
          >
            {collections.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Collections' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Saved List */}
      {filtered.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-4">
          <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold">No Saved Universities Match</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Save universities from World Explorer, City Discovery, or the University Database to
              organize your shortlist here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('explore-by-city')}
            className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Explore by City
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((entry) => {
            const uni = universitiesBySlug[entry.universitySlug];
            if (!uni) return null;
            const city = citiesBySlug[uni.citySlug];
            const country = countriesByCode[uni.countryCode];
            const isComparing = compareSlugs.includes(uni.slug);

            return (
              <div
                key={uni.slug}
                className="surface-card motion-interactive-card rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {country?.flagEmoji} {city?.name}, {country?.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => openUniversityProfile(uni.slug)}
                        className="font-display text-2xl font-semibold text-left hover:text-[var(--accent-primary)] transition-colors mt-0.5 cursor-pointer"
                      >
                        {formatCleanUniversityName(uni.name)}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSavedUniversity(uni.slug)}
                      aria-label={`Remove ${formatCleanUniversityName(uni.name)}`}
                      className="btn-glass p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                        Collection
                      </label>
                      <input
                        type="text"
                        value={entry.collectionName}
                        onChange={(e) =>
                          saveUniversity({
                            universitySlug: uni.slug,
                            collectionName: e.target.value,
                          })
                        }
                        className="glass-input w-full rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                        Priority
                      </label>
                      <select
                        value={entry.priority}
                        onChange={(e) =>
                          saveUniversity({
                            universitySlug: uni.slug,
                            priority: e.target.value as SavedUniversityEntry['priority'],
                          })
                        }
                        className="glass-input w-full rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="Dream">Dream</option>
                        <option value="Target">Target</option>
                        <option value="Safety">Safety</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                        Application Stage
                      </label>
                      <select
                        value={entry.applicationStatus}
                        onChange={(e) =>
                          saveUniversity({
                            universitySlug: uni.slug,
                            applicationStatus:
                              e.target.value as SavedUniversityEntry['applicationStatus'],
                          })
                        }
                        className="glass-input w-full rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <option value="Researching">Researching</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Decision">Decision</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                      Personal Notes
                    </label>
                    <textarea
                      rows={2}
                      value={entry.personalNotes}
                      placeholder="Add faculty contacts, scholarship requirements, or document reminders..."
                      onChange={(e) =>
                        saveUniversity({
                          universitySlug: uni.slug,
                          personalNotes: e.target.value,
                        })
                      }
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-hairline)]">
                  <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
                    {splitTuitionDisplay(uni.tuitionLocalDisplay).primary}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompareSlug(uni.slug)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer ${
                        isComparing
                          ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                          : 'btn-glass text-[var(--text-secondary)]'
                      }`}
                    >
                      {isComparing ? t.common.comparing : t.common.compare}
                    </button>
                    <button
                      type="button"
                      onClick={() => openUniversityProfile(uni.slug)}
                      className="btn-glass rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] cursor-pointer"
                    >
                      {t.common.viewUniversity}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const MyAcademicJourneyView: React.FC = () => {
  return <AcademicNavigationSystem />;
};

export const ResearchLibraryView: React.FC = () => {
  return <ResearchLibraryStudio />;
};
