import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GlassModal, GlassButton } from '../glass';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  getLocalTodayIsoDate,
  type GoalCategoryId,
  type GoalMilestone,
  type GoalPriority,
  type GoalRecord,
  type GoalType,
} from '../../utils/goalsEngine';
import type { CertificateRecord } from '../../data/certificatesCatalog';
import { COUNTRY_QUALIFICATION_PROFILES } from '../../data/countryQualificationRules';
import type { GoalsTranslationBundle } from '../../i18n/goalsTranslations';

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  t: GoalsTranslationBundle;
  editingGoal?: GoalRecord | null;
  prefillCertificate?: CertificateRecord | null;
  onSave: (goal: GoalRecord, isNew: boolean) => void;
}

const DEFAULT_LEVEL_SCALES: Record<string, string[]> = {
  cefr: ['None', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  jlpt: ['None', 'N5', 'N4', 'N3', 'N2', 'N1'],
  topik: ['None', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'],
  hsk: ['None', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'],
};

function mapCertCategoryToGoalCategory(cert: CertificateRecord): GoalCategoryId {
  if (cert.id.startsWith('uz-')) return 'national_certificates';
  if (cert.category === 'languages') return 'language_certificates';
  if (cert.category === 'math_science') return 'math_sciences';
  if (cert.category === 'it_tech') return 'it_professional';
  if (cert.category === 'business_pro') return 'it_professional';
  return 'universities_scholarships';
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  open,
  onClose,
  t,
  editingGoal,
  prefillCertificate,
  onSave,
}) => {
  const { libraryWorkspace } = useApp();
  const { goalsState } = useWorkspaceIntelligence();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategoryId>('language_certificates');
  const [goalType, setGoalType] = useState<GoalType>('score');
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(getLocalTodayIsoDate());
  const [targetDate, setTargetDate] = useState('');
  const [baselineNumeric, setBaselineNumeric] = useState('0');
  const [currentNumeric, setCurrentNumeric] = useState('0');
  const [targetNumeric, setTargetNumeric] = useState('100');
  const [numericUnit, setNumericUnit] = useState('points');
  const [levelPreset, setLevelPreset] = useState<string>('cefr');
  const [levelScale, setLevelScale] = useState<string[]>(DEFAULT_LEVEL_SCALES.cefr);
  const [currentLevel, setCurrentLevel] = useState('None');
  const [targetLevel, setTargetLevel] = useState('B2');
  const [binaryState, setBinaryState] = useState<'not_started' | 'in_progress' | 'achieved'>('in_progress');
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('high');
  const [motivation, setMotivation] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [estimatedBudgetUsd, setEstimatedBudgetUsd] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [dependsOnGoalIds, setDependsOnGoalIds] = useState<string[]>([]);
  const [linkedLibraryMaterialIds, setLinkedLibraryMaterialIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setCategory(editingGoal.category);
      setGoalType(editingGoal.goalType);
      setCertificateId(editingGoal.certificateId || null);
      setStartDate(editingGoal.startDate || getLocalTodayIsoDate());
      setTargetDate(editingGoal.targetDate || '');
      setBaselineNumeric(editingGoal.baselineNumeric != null ? String(editingGoal.baselineNumeric) : '0');
      setCurrentNumeric(editingGoal.currentNumeric != null ? String(editingGoal.currentNumeric) : '0');
      setTargetNumeric(editingGoal.targetNumeric != null ? String(editingGoal.targetNumeric) : '100');
      setNumericUnit(editingGoal.numericUnit || 'points');
      setLevelScale(editingGoal.levelScale?.length ? editingGoal.levelScale : DEFAULT_LEVEL_SCALES.cefr);
      setCurrentLevel(editingGoal.currentLevel || 'None');
      setTargetLevel(editingGoal.targetLevel || 'B2');
      setBinaryState(editingGoal.binaryState || 'in_progress');
      setMilestones(editingGoal.milestones || []);
      setPriority(editingGoal.priority);
      setMotivation(editingGoal.motivation || '');
      setTargetCountry(editingGoal.targetCountry || '');
      setEstimatedBudgetUsd(
        editingGoal.estimatedBudgetUsd != null ? String(editingGoal.estimatedBudgetUsd) : ''
      );
      setPersonalNotes(editingGoal.personalNotes || '');
      setDependsOnGoalIds(editingGoal.dependsOnGoalIds || []);
      setLinkedLibraryMaterialIds(editingGoal.linkedLibraryMaterialIds || []);
      return;
    }

    if (prefillCertificate) {
      setTitle(prefillCertificate.officialName);
      setDescription(prefillCertificate.summary);
      setCategory(mapCertCategoryToGoalCategory(prefillCertificate));
      setCertificateId(prefillCertificate.id);
      setStartDate(getLocalTodayIsoDate());
      setTargetDate('');
      setPriority('high');
      setMotivation(prefillCertificate.universityRelevance);
      setTargetCountry('');
      setEstimatedBudgetUsd(
        prefillCertificate.fee.approximateAmount != null
          ? String(prefillCertificate.fee.approximateAmount)
          : ''
      );
      setPersonalNotes('');
      setDependsOnGoalIds([]);
      setLinkedLibraryMaterialIds([]);
      setMilestones([
        {
          id: `ms-1-${Date.now()}`,
          title: `Complete diagnostic mock test for ${prefillCertificate.shortName}`,
          completed: false,
          targetDate: null,
        },
        {
          id: `ms-2-${Date.now()}`,
          title: `Book official ${prefillCertificate.shortName} sitting`,
          completed: false,
          targetDate: null,
        },
      ]);

      const fmt = prefillCertificate.scoringModel.format;
      if (fmt === 'level' && prefillCertificate.scoringModel.levels?.length) {
        const scale = ['None', ...prefillCertificate.scoringModel.levels];
        setGoalType('level');
        setLevelScale(scale);
        setCurrentLevel('None');
        setTargetLevel(
          prefillCertificate.scoringModel.levels[
            Math.max(0, prefillCertificate.scoringModel.levels.length - 2)
          ]
        );
      } else if (fmt === 'pass_fail' || fmt === 'award') {
        setGoalType('binary');
        setBinaryState('in_progress');
      } else {
        setGoalType('score');
        const minVal = prefillCertificate.scoringModel.minScore ?? 0;
        const maxVal = prefillCertificate.scoringModel.maxScore ?? 100;
        const suggestedTarget =
          prefillCertificate.id.startsWith('ielts')
            ? 7.5
            : prefillCertificate.id === 'digital-sat'
            ? 1450
            : Math.round(minVal + (maxVal - minVal) * 0.8);
        setBaselineNumeric(String(minVal));
        setCurrentNumeric(String(minVal));
        setTargetNumeric(String(suggestedTarget));
        setNumericUnit(fmt === 'band' ? 'band' : 'score');
      }
      return;
    }

    // Fresh empty goal
    setTitle('');
    setDescription('');
    setCategory('language_certificates');
    setGoalType('score');
    setCertificateId(null);
    setStartDate(getLocalTodayIsoDate());
    setTargetDate('');
    setBaselineNumeric('5.5');
    setCurrentNumeric('6.0');
    setTargetNumeric('7.5');
    setNumericUnit('band');
    setLevelPreset('cefr');
    setLevelScale(DEFAULT_LEVEL_SCALES.cefr);
    setCurrentLevel('None');
    setTargetLevel('B2');
    setBinaryState('in_progress');
    setMilestones([]);
    setPriority('high');
    setMotivation('');
    setTargetCountry('');
    setEstimatedBudgetUsd('');
    setPersonalNotes('');
    setDependsOnGoalIds([]);
    setLinkedLibraryMaterialIds([]);
  }, [open, editingGoal, prefillCertificate]);

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones((prev) => [
      ...prev,
      {
        id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: newMilestoneTitle.trim(),
        targetDate: newMilestoneDate || null,
        completed: false,
      },
    ]);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a clear goal title.');
      return;
    }

    const now = new Date().toISOString();
    const record: GoalRecord = {
      id: editingGoal?.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      goalType,
      certificateId,
      startDate: startDate || getLocalTodayIsoDate(),
      targetDate: targetDate || null,
      baselineNumeric:
        goalType === 'score' || goalType === 'quantitative' ? Number(baselineNumeric) || 0 : null,
      currentNumeric:
        goalType === 'score' || goalType === 'quantitative' ? Number(currentNumeric) || 0 : null,
      targetNumeric:
        goalType === 'score' || goalType === 'quantitative' ? Number(targetNumeric) || 0 : null,
      numericUnit:
        goalType === 'score' || goalType === 'quantitative' ? numericUnit.trim() || 'units' : undefined,
      levelScale: goalType === 'level' ? levelScale : undefined,
      currentLevel: goalType === 'level' ? currentLevel : null,
      targetLevel: goalType === 'level' ? targetLevel : null,
      binaryState: goalType === 'binary' ? binaryState : undefined,
      milestones,
      priority,
      lifecycleOverride:
        editingGoal?.lifecycleOverride ||
        (goalType === 'binary' && binaryState === 'achieved' ? 'achieved' : 'active'),
      motivation: motivation.trim(),
      targetCountry: targetCountry || null,
      targetUniversitySlug: editingGoal?.targetUniversitySlug || null,
      relatedRoadmapStationId: editingGoal?.relatedRoadmapStationId || null,
      linkedLibraryMaterialIds,
      estimatedBudgetUsd: estimatedBudgetUsd ? Number(estimatedBudgetUsd) : null,
      studyResourcesNote: editingGoal?.studyResourcesNote,
      personalNotes: personalNotes.trim() || undefined,
      dependsOnGoalIds,
      evidence: editingGoal?.evidence || [],
      aiPlan: editingGoal?.aiPlan || null,
      createdAt: editingGoal?.createdAt || now,
      updatedAt: now,
      achievedAt: editingGoal?.achievedAt || null,
    };

    onSave(record, !editingGoal);
    onClose();
  };

  const otherGoals = goalsState.goals.filter(
    (g) => g.id !== editingGoal?.id && g.lifecycleOverride !== 'archived'
  );

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={editingGoal ? t.goalsWorkspace.editGoal : t.goalsWorkspace.createGoal}
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && <p className="text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.goalTitle} *
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., IELTS Academic 7.5 or JLPT N2"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </label>

          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.category}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategoryId)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {(Object.keys(t.goalCategories) as GoalCategoryId[]).map((cat) => (
                <option key={cat} value={cat}>
                  {t.goalCategories[cat]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.goalType}
            </span>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {(Object.keys(t.goalTypes) as GoalType[]).map((gt) => (
                <option key={gt} value={gt}>
                  {t.goalTypes[gt]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Dynamic Goal-Type Measurement Inputs */}
        {(goalType === 'score' || goalType === 'quantitative') && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Baseline</span>
              <input
                type="number"
                step="any"
                value={baselineNumeric}
                onChange={(e) => setBaselineNumeric(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm tabular-nums text-[var(--text-primary)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Current</span>
              <input
                type="number"
                step="any"
                value={currentNumeric}
                onChange={(e) => setCurrentNumeric(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm tabular-nums text-[var(--text-primary)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Target</span>
              <input
                type="number"
                step="any"
                value={targetNumeric}
                onChange={(e) => setTargetNumeric(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm tabular-nums text-[var(--text-primary)]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Unit</span>
              <input
                type="text"
                value={numericUnit}
                onChange={(e) => setNumericUnit(e.target.value)}
                placeholder="band / pts / books"
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
              />
            </label>
          </div>
        )}

        {goalType === 'level' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Scale System</span>
              <select
                value={levelPreset}
                onChange={(e) => {
                  const key = e.target.value;
                  setLevelPreset(key);
                  const next = DEFAULT_LEVEL_SCALES[key] || DEFAULT_LEVEL_SCALES.cefr;
                  setLevelScale(next);
                  setCurrentLevel(next[0]);
                  setTargetLevel(next[next.length - 2]);
                }}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="cefr">CEFR (A1–C2)</option>
                <option value="jlpt">JLPT (N5–N1)</option>
                <option value="topik">TOPIK (1–6)</option>
                <option value="hsk">HSK (1–6)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Current Level</span>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
              >
                {levelScale.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[var(--text-muted)]">Target Level</span>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
              >
                {levelScale
                  .filter((lvl) => lvl !== 'None')
                  .map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        )}

        {goalType === 'binary' && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
            <label className="space-y-1 block">
              <span className="text-[11px] text-[var(--text-muted)]">Current Status</span>
              <select
                value={binaryState}
                onChange={(e) =>
                  setBinaryState(e.target.value as 'not_started' | 'in_progress' | 'achieved')
                }
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="achieved">Achieved / Passed</option>
              </select>
            </label>
          </div>
        )}

        {/* Dates, Priority, Country & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.startDate}
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
            />
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.targetDate}
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
            />
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.priority}
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as GoalPriority)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
            >
              {(Object.keys(t.priorities) as GoalPriority[]).map((p) => (
                <option key={p} value={p}>
                  {t.priorities[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.estimatedBudget}
            </span>
            <input
              type="number"
              min="0"
              value={estimatedBudgetUsd}
              onChange={(e) => setEstimatedBudgetUsd(e.target.value)}
              placeholder="USD"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-2 text-xs tabular-nums text-[var(--text-primary)]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.targetCountry}
            </span>
            <select
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            >
              <option value="">Optional</option>
              {COUNTRY_QUALIFICATION_PROFILES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji} {c.countryName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="font-semibold text-[var(--text-secondary)]">
              {t.goalsWorkspace.motivation}
            </span>
            <input
              type="text"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Why this goal matters for your university or career"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </label>
        </div>

        {/* Milestones Section */}
        <div className="space-y-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
          <p className="font-semibold text-[var(--text-primary)]">
            {t.goalsWorkspace.milestonesTitle} ({milestones.length})
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Add milestone checkpoint..."
              className="flex-1 min-w-[180px] rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
            />
            <input
              type="date"
              value={newMilestoneDate}
              onChange={(e) => setNewMilestoneDate(e.target.value)}
              className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
            />
            <GlassButton
              variant="glass"
              onClick={handleAddMilestone}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.goalsWorkspace.addMilestone}
            </GlassButton>
          </div>
          {milestones.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span className="truncate">
                    {m.title} {m.targetDate ? `(${m.targetDate})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))}
                    className="text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dependencies & Research Library Linking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {otherGoals.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
              <p className="font-semibold text-[var(--text-primary)]">
                {t.goalsWorkspace.dependsOn}
              </p>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {otherGoals.map((og) => {
                  const checked = dependsOnGoalIds.includes(og.id);
                  return (
                    <label key={og.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDependsOnGoalIds((prev) =>
                            checked ? prev.filter((id) => id !== og.id) : [...prev, og.id]
                          )
                        }
                      />
                      <span className="truncate text-[var(--text-secondary)]">{og.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {libraryWorkspace.materials.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
              <p className="font-semibold text-[var(--text-primary)]">
                {t.goalsWorkspace.linkedLibrary}
              </p>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {libraryWorkspace.materials.slice(0, 12).map((mat) => {
                  const checked = linkedLibraryMaterialIds.includes(mat.id);
                  return (
                    <label key={mat.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setLinkedLibraryMaterialIds((prev) =>
                            checked ? prev.filter((id) => id !== mat.id) : [...prev, mat.id]
                          )
                        }
                      />
                      <span className="truncate text-[var(--text-secondary)]">{mat.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <label className="space-y-1 block">
          <span className="font-semibold text-[var(--text-secondary)]">
            {t.goalsWorkspace.notes}
          </span>
          <textarea
            rows={2}
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="Personal notes, test center details, or study resources..."
            className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
          />
        </label>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-hairline)]">
          <GlassButton variant="glass" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold">
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" className="px-5 py-2 rounded-xl text-xs font-semibold">
            {editingGoal ? 'Save Changes' : t.goalsWorkspace.createGoal}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};
