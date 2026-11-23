import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeChecklistProgress } from '../utils/academicLogic';
import { formatCleanUniversityName } from '../utils/displayCopy';

export const AdmissionIntelligenceView: React.FC = () => {
  const {
    catalog,
    universitiesBySlug,
    countriesByCode,
    checklists,
    toggleChecklistItem,
    openUniversityProfile,
    t,
  } = useApp();

  const admissionUnis = useMemo(
    () =>
      catalog.admissions
        .map((a) => universitiesBySlug[a.universitySlug])
        .filter(Boolean),
    [catalog.admissions, universitiesBySlug]
  );

  const [selectedSlug, setSelectedSlug] = useState<string>(
    admissionUnis[0]?.slug || 'university-of-tokyo'
  );

  const activeAdmission =
    catalog.admissions.find((a) => a.universitySlug === selectedSlug) ||
    catalog.admissions[0];
  const activeUni = universitiesBySlug[activeAdmission?.universitySlug || ''];
  const activeCountry = activeUni ? countriesByCode[activeUni.countryCode] : null;

  const checklistItems = useMemo(() => {
    if (!activeAdmission || !activeUni) return [];
    const baseDocs = activeAdmission.requiredDocumentsJson.map((doc, idx) => ({
      key: `doc-${idx}`,
      label: doc,
    }));
    const savedMap = new Map(
      checklists
        .filter((c) => c.universitySlug === activeUni.slug)
        .map((c) => [c.requirementKey, c.completed])
    );
    return baseDocs.map((item) => ({
      ...item,
      completed: Boolean(savedMap.get(item.key)),
    }));
  }, [activeAdmission, activeUni, checklists]);

  const progress = computeChecklistProgress(checklistItems);

  if (!activeAdmission || !activeUni) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">{t.admissionView.title}</h1>

        <select
          aria-label={t.common.university}
          value={activeUni.slug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="glass-input w-full lg:w-auto max-w-full rounded-xl px-4 py-2 text-sm font-medium"
        >
          {catalog.admissions.map((adm) => {
            const u = universitiesBySlug[adm.universitySlug];
            if (!u) return null;
            return (
              <option key={u.slug} value={u.slug}>
                {formatCleanUniversityName(u.name)} ({adm.degreeLevel})
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verified Requirements Dossier */}
        <div className="lg:col-span-7 min-w-0 surface-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4 border-b border-[var(--border-hairline)] pb-4">
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">
                {activeCountry?.flagEmoji} {activeCountry?.name} · {activeAdmission.degreeLevel} ·{' '}
                {activeAdmission.academicYear}
              </p>
              <button
                type="button"
                onClick={() => openUniversityProfile(activeUni.slug)}
                className="font-display text-2xl sm:text-3xl font-semibold text-left hover:text-[var(--accent-primary)] cursor-pointer mt-1"
              >
                {formatCleanUniversityName(activeUni.name)}
              </button>
            </div>
            <span className="text-xs text-[var(--text-muted)] shrink-0">
              {t.common.verified} {activeAdmission.verifiedAt}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.admissionView.academicQuals}
              </h3>
              <p className="text-[var(--text-primary)] mt-1">{activeAdmission.academicQualifications}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.admissionView.languageTests}
              </h3>
              <p className="text-[var(--text-primary)] mt-1">{activeAdmission.languageTests}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.admissionView.standardizedTests}
              </h3>
              <p className="text-[var(--text-primary)] mt-1">{activeAdmission.standardizedTests}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{activeAdmission.entranceExamInfo}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.admissionView.applicationProcess}
              </h3>
              <p className="text-[var(--text-primary)] mt-1">{activeAdmission.applicationProcess}</p>
              <p className="text-xs font-semibold text-[var(--accent-secondary)] mt-1">
                {t.common.deadline}: {activeAdmission.applicationDeadline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={activeAdmission.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <span>Official Application Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={activeAdmission.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium"
            >
              <span>Source Guidelines</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Interactive Document Checklist */}
        <div className="lg:col-span-5 min-w-0 surface-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Application Checklist</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Mark documents as prepared for {activeUni.shortName}
              </p>
            </div>
            <span className="font-mono-tabular text-lg font-semibold text-[var(--accent-primary)]">
              {progress.percent}%
            </span>
          </div>

          <div className="glass-progress-track w-full h-2.5 rounded-full overflow-hidden">
            <div
              className="glass-progress-fill h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="space-y-2.5">
            {checklistItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  toggleChecklistItem(activeUni.slug, item.key, item.label, !item.completed)
                }
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-[transform,opacity,border-color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  item.completed
                    ? 'surface-subtle opacity-85'
                    : 'btn-glass'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-sm ${
                    item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
