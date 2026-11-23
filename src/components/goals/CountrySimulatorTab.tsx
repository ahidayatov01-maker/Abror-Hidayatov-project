import React, { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  ExternalLink,
  Globe2,
  GraduationCap,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  CERTIFICATES_CATALOG,
  getCertificateById,
} from '../../data/certificatesCatalog';
import { COUNTRY_QUALIFICATION_PROFILES } from '../../data/countryQualificationRules';
import {
  buildOpportunityMatrix,
  simulateCountryOpportunity,
  type CountrySimulationOutput,
  type SimulatorSelectedQualification,
} from '../../utils/goalsEngine';
import { getUniversalMicroCopy } from '../../utils/displayCopy';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface CountrySimulatorTabProps {
  t: GoalsTranslationBundle;
}

export const CountrySimulatorTab: React.FC<CountrySimulatorTabProps> = ({ t }) => {
  const { language } = useApp();
  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const { goalsState, setGoalsState, entitlementStatus, showToast } = useWorkspaceIntelligence();
  const [certToAdd, setCertToAdd] = useState(CERTIFICATES_CATALOG[0]?.id || 'ielts-academic');

  const canMultiCert =
    entitlementStatus.isOwner || entitlementStatus.entitlements.multiCertificateSimulator;
  const canMultiCountry =
    entitlementStatus.isOwner || entitlementStatus.entitlements.multiCountryComparison;

  const primarySim = useMemo(
    () =>
      simulateCountryOpportunity(
        goalsState.simulatorCountryCode || 'JP',
        goalsState.simulatorSelections
      ),
    [goalsState.simulatorCountryCode, goalsState.simulatorSelections]
  );

  const compareSim = useMemo(() => {
    if (!canMultiCountry || !goalsState.simulatorCompareCountryCode) return null;
    return simulateCountryOpportunity(
      goalsState.simulatorCompareCountryCode,
      goalsState.simulatorSelections
    );
  }, [canMultiCountry, goalsState.simulatorCompareCountryCode, goalsState.simulatorSelections]);

  const matrixCountries = useMemo(() => {
    const base = [goalsState.simulatorCountryCode || 'JP', 'US', 'DE', 'KR', 'GB', 'UZ'];
    if (goalsState.simulatorCompareCountryCode) {
      base.splice(1, 0, goalsState.simulatorCompareCountryCode);
    }
    return Array.from(new Set(base)).slice(0, 6);
  }, [goalsState.simulatorCountryCode, goalsState.simulatorCompareCountryCode]);

  const matrixRows = useMemo(() => {
    const ids = Array.from(new Set(goalsState.simulatorSelections.map((s) => s.certificateId)));
    return buildOpportunityMatrix(ids.length > 0 ? ids : ['ielts-academic', 'jlpt'], matrixCountries);
  }, [goalsState.simulatorSelections, matrixCountries]);

  const handleAddSelection = () => {
    if (!canMultiCert && goalsState.simulatorSelections.length >= 1) {
      showToast(t.simulator.upgradeMultiCert, 'info');
      return;
    }
    const cert = getCertificateById(certToAdd);
    if (!cert) return;
    const defaultTarget =
      cert.scoringModel.levels?.[cert.scoringModel.levels.length - 2] ||
      (cert.scoringModel.maxScore ? String(cert.scoringModel.maxScore) : 'Pass');
    const newItem: SimulatorSelectedQualification = {
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      certificateId: cert.id,
      status: 'planned',
      currentScoreOrLevel: cert.scoringModel.levels?.[0] || '',
      targetScoreOrLevel: defaultTarget,
    };
    setGoalsState((prev) => ({
      ...prev,
      simulatorSelections: [...prev.simulatorSelections, newItem],
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateSelection = (id: string, patch: Partial<SimulatorSelectedQualification>) => {
    setGoalsState((prev) => ({
      ...prev,
      simulatorSelections: prev.simulatorSelections.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const removeSelection = (id: string) => {
    setGoalsState((prev) => ({
      ...prev,
      simulatorSelections: prev.simulatorSelections.filter((item) => item.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  const renderSimulationCards = (sim: CountrySimulationOutput) => (
    <div className="space-y-4">
      {/* Compact Country Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <span>{sim.country?.flagEmoji || '🌍'}</span>
          <span>{sim.country?.countryName || sim.countryCode}</span>
        </h3>
        {sim.country && (
          <a
            href={sim.country.officialPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
          >
            {micro.portal}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* 3 Clean Tag-Group Cards: Universities / Careers / Privileges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Group 1: Universities */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-primary)]">
            <GraduationCap className="w-4 h-4" />
            {micro.simulatorGroups.universities}
          </div>
          {sim.universityInsights.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sim.universityInsights.map((track, idx) => (
                <a
                  key={idx}
                  href={track.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${track.typicalThresholds} · ${track.sourceOrg}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                >
                  <span className="truncate max-w-[220px]">{track.trackTitle}</span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {track.instructionLanguage}
                  </span>
                </a>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Group 2: Careers */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-4 h-4" />
            {micro.simulatorGroups.careers}
          </div>
          {sim.careerInsights.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sim.careerInsights.map((path, idx) => (
                <span
                  key={idx}
                  title={`${path.languageExpectations} — ${path.realisticCaveat}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)]"
                >
                  <span className="truncate max-w-[220px]">{path.sector}</span>
                </span>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Group 3: Privileges & Grants */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-400">
            <Award className="w-4 h-4" />
            {micro.simulatorGroups.privileges}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {sim.scholarshipVisaInsights.map((item, idx) => (
                <a
                  key={idx}
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.eligibilitySummary}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:border-emerald-500/60 transition-colors"
                >
                  <span className="truncate max-w-[220px]">{item.programName}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)] shrink-0" />
                </a>
              ))}
            </div>

            {sim.studentWorkAuthorizationNote && (
              <p
                title={sim.studentWorkAuthorizationNote}
                className="text-[11px] text-[var(--text-muted)] line-clamp-2 pt-2 border-t border-[var(--border-hairline)]"
              >
                {sim.studentWorkAuthorizationNote}
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <GlassCard className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <label className="lg:col-span-3 space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {t.simulator.targetCountry}
            </span>
            <select
              value={goalsState.simulatorCountryCode}
              onChange={(e) =>
                setGoalsState((prev) => ({
                  ...prev,
                  simulatorCountryCode: e.target.value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {COUNTRY_QUALIFICATION_PROFILES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji} {c.countryName}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-3 space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>{t.simulator.compareCountry}</span>
            <select
              value={goalsState.simulatorCompareCountryCode || ''}
              disabled={!canMultiCountry}
              onChange={(e) =>
                setGoalsState((prev) => ({
                  ...prev,
                  simulatorCompareCountryCode: e.target.value || null,
                  updatedAt: new Date().toISOString(),
                }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60"
            >
              <option value="">{t.simulator.noneOption}</option>
              {COUNTRY_QUALIFICATION_PROFILES.filter(
                (c) => c.countryCode !== goalsState.simulatorCountryCode
              ).map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji} {c.countryName}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-4 space-y-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>{t.simulator.addQualification}</span>
            <select
              value={certToAdd}
              onChange={(e) => setCertToAdd(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {CERTIFICATES_CATALOG.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.officialName} ({c.scoringModel.scaleLabel})
                </option>
              ))}
            </select>
          </label>

          <div className="lg:col-span-2">
            <GlassButton
              variant="primary"
              onClick={handleAddSelection}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </GlassButton>
          </div>
        </div>

        {!canMultiCountry && (
          <p className="text-xs text-[var(--text-muted)]">{t.simulator.upgradeMultiCountry}</p>
        )}

        {/* Selected Qualifications Bundle */}
        <div className="space-y-2.5 pt-3 border-t border-[var(--border-hairline)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {t.simulator.selectedQualifications} ({goalsState.simulatorSelections.length})
          </p>

          <div className="space-y-2">
            {goalsState.simulatorSelections.map((sel) => {
              const cert = getCertificateById(sel.certificateId);
              if (!cert) return null;
              return (
                <div
                  key={sel.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs"
                >
                  <div className="sm:col-span-4">
                    <p className="font-semibold text-[var(--text-primary)]">{cert.officialName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{cert.scoringModel.scaleLabel}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={sel.status}
                      onChange={(e) =>
                        updateSelection(sel.id, {
                          status: e.target.value as 'obtained' | 'planned',
                        })
                      }
                      aria-label="Qualification status"
                      className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="obtained">{t.simulator.statusObtained}</option>
                      <option value="planned">{t.simulator.statusPlanned}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={sel.currentScoreOrLevel}
                      onChange={(e) =>
                        updateSelection(sel.id, { currentScoreOrLevel: e.target.value })
                      }
                      placeholder={t.simulator.currentScoreLabel}
                      className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={sel.targetScoreOrLevel}
                      onChange={(e) =>
                        updateSelection(sel.id, { targetScoreOrLevel: e.target.value })
                      }
                      placeholder={t.simulator.targetScoreLabel}
                      className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeSelection(sel.id)}
                      aria-label="Remove qualification"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Primary Country Output */}
      {renderSimulationCards(primarySim)}

      {/* Optional Second Country Comparison */}
      {compareSim && (
        <div className="space-y-3 pt-4 border-t border-[var(--border-hairline)]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)]">
            Side-by-Side Comparison: {compareSim.country?.countryName || compareSim.countryCode}
          </p>
          {renderSimulationCards(compareSim)}
        </div>
      )}

      {/* Cross-Country Opportunity Matrix */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
          {t.simulator.matrixTitle}
        </h3>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)]">
                <th className="py-2.5 pr-4 font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  Qualification
                </th>
                {matrixCountries.map((code) => {
                  const prof = COUNTRY_QUALIFICATION_PROFILES.find((c) => c.countryCode === code);
                  return (
                    <th key={code} className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                      {prof?.flagEmoji} {prof?.countryName || code}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {matrixRows.map((row) => (
                <tr key={row.certificateId}>
                  <td className="py-3 pr-4 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {row.certificateName}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.countryCode} className="py-3 px-3 align-top">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {cell.applicability}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                        {cell.detail}
                      </p>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {matrixRows.map((row) => (
            <div
              key={row.certificateId}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-2 text-xs"
            >
              <p className="font-semibold text-[var(--text-primary)]">{row.certificateName}</p>
              <div className="space-y-2">
                {row.cells.map((cell) => (
                  <div key={cell.countryCode} className="border-t border-[var(--border-hairline)] pt-2">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[var(--text-primary)]">{cell.countryName}</span>
                      <span className="text-[var(--accent-primary)]">{cell.applicability}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{cell.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
