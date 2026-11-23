import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  History,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  mergeGeneratedRoutineWithLocks,
  validateRoutineCapacity,
  type RoutineBlock,
  type RoutineBlockCategory,
  type RoutineHorizon,
} from '../../utils/productivityEngine';
import { getUniversalMicroCopy } from '../../utils/displayCopy';
import type { NavSectionId } from '../../types/domain';

const HORIZONS: Array<{ id: RoutineHorizon; label: string; subtitle: string }> = [
  { id: 'daily', label: 'Daily', subtitle: 'Time-blocked focus & breaks' },
  { id: 'weekly', label: 'Weekly', subtitle: 'Balanced study cadence' },
  { id: 'monthly', label: 'Monthly', subtitle: 'Milestone sprint cycles' },
  { id: 'yearly', label: 'Yearly', subtitle: 'Admission season roadmap' },
];

const CATEGORY_LABELS: Record<RoutineBlockCategory, string> = {
  language_exam: 'Language & IELTS/TOEFL',
  university_research: 'University Research',
  application_docs: 'Application Documents',
  academic_study: 'Core Academic Study',
  scholarship_prep: 'Scholarship Prep',
  break_recovery: 'Break & Recovery',
  personal: 'Personal',
};

export const RoutineView: React.FC = () => {
  const { language, setActiveSection } = useApp();
  const {
    routineState,
    setRoutineState,
    roadmapState,
    getAuthHeaders,
    refreshEntitlementStatus,
    showToast,
  } = useWorkspaceIntelligence();

  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  // Add / Edit form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlot, setFormSlot] = useState('18:00 - 19:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formCategory, setFormCategory] = useState<RoutineBlockCategory>('academic_study');
  const [formNotes, setFormNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const activeHorizon = routineState.activeHorizon;

  const visibleBlocks = useMemo(
    () => routineState.blocks.filter((b) => b.horizon === activeHorizon),
    [routineState.blocks, activeHorizon]
  );

  const capacity = useMemo(
    () => validateRoutineCapacity(routineState.blocks, activeHorizon),
    [routineState.blocks, activeHorizon]
  );

  const horizonVersions = useMemo(
    () => routineState.versions.filter((v) => v.horizon === activeHorizon),
    [routineState.versions, activeHorizon]
  );

  const setHorizon = (horizon: RoutineHorizon) => {
    setRoutineState((prev) => ({ ...prev, activeHorizon: horizon }));
    setAiError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlot(
      activeHorizon === 'daily'
        ? '18:00 - 19:00'
        : activeHorizon === 'weekly'
        ? 'Friday'
        : activeHorizon === 'monthly'
        ? 'Week 2'
        : 'Q2 · Apr–Jun'
    );
    setFormDuration(60);
    setFormCategory('academic_study');
    setFormNotes('');
    setShowAddForm(false);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingId) {
      setRoutineState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === editingId
            ? {
                ...b,
                title: formTitle.trim(),
                slotLabel: formSlot.trim() || b.slotLabel,
                durationMinutes: Math.max(10, Number(formDuration) || 45),
                category: formCategory,
                notes: formNotes.trim(),
                userEdited: true,
              }
            : b
        ),
        updatedAt: new Date().toISOString(),
      }));
      showToast('Routine block updated and protected from AI overwrite.', 'success');
    } else {
      const newBlock: RoutineBlock = {
        id: `rt-user-${Date.now()}`,
        horizon: activeHorizon,
        title: formTitle.trim(),
        slotLabel: formSlot.trim() || 'Flexible Slot',
        durationMinutes: Math.max(10, Number(formDuration) || 45),
        category: formCategory,
        notes: formNotes.trim(),
        completed: false,
        locked: true,
        userEdited: true,
        source: 'user',
      };
      setRoutineState((prev) => ({
        ...prev,
        blocks: [...prev.blocks, newBlock],
        updatedAt: new Date().toISOString(),
      }));
      showToast('Added custom block to your routine.', 'success');
    }
    resetForm();
  };

  const startEdit = (block: RoutineBlock) => {
    setEditingId(block.id);
    setFormTitle(block.title);
    setFormSlot(block.slotLabel);
    setFormDuration(block.durationMinutes);
    setFormCategory(block.category);
    setFormNotes(block.notes || '');
    setShowAddForm(true);
  };

  const toggleComplete = (id: string) => {
    setRoutineState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleLock = (id: string) => {
    setRoutineState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, locked: !b.locked } : b)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteBlock = (id: string) => {
    setRoutineState((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
      updatedAt: new Date().toISOString(),
    }));
    showToast('Routine block removed.', 'info');
  };

  const handleGenerateRoutine = async () => {
    setIsGenerating(true);
    setAiError(null);
    setAiRationale(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/generate-routine', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          horizon: activeHorizon,
          focusGoal: routineState.focusGoal,
          dailyCapacityHours: routineState.dailyCapacityHours,
          targetUniversityName: roadmapState.targetUniversityName,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Smart Routine Architect failed to generate routine.');
      }

      setRoutineState((prev) =>
        mergeGeneratedRoutineWithLocks(
          prev,
          activeHorizon,
          data.blocks || [],
          `Snapshot before AI ${activeHorizon} update`
        )
      );
      if (data.rationale) setAiRationale(data.rationale);
      await refreshEntitlementStatus();
      showToast(
        `Smart Routine Architect updated ${activeHorizon} schedule while preserving locked blocks.`,
        'success'
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate routine.');
    } finally {
      setIsGenerating(false);
    }
  };

  const restoreVersion = (versionId: string) => {
    const snap = routineState.versions.find((v) => v.id === versionId);
    if (!snap) return;
    setRoutineState((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks.filter((b) => b.horizon !== snap.horizon),
        ...snap.blocks,
      ],
      updatedAt: new Date().toISOString(),
    }));
    showToast(`Restored routine snapshot (${snap.label}).`, 'info');
    setShowHistory(false);
  };

  return (
    <div className="space-y-6" data-testid="routine-view">
      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {micro.productivity.routineTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddForm((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
            data-testid="routine-add-btn"
          >
            <Plus className="w-4 h-4" />
            {micro.productivity.addBlockBtn.replace(/^\+\s*/, '')}
          </button>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <History className="w-4 h-4" />
            ({horizonVersions.length})
          </button>
          <button
            type="button"
            onClick={handleGenerateRoutine}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95 disabled:opacity-50 cursor-pointer"
            data-testid="routine-ai-generate-btn"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {micro.productivity.generateAiBtn}
          </button>
        </div>
      </div>

      {/* 4 Horizon Selector + Capacity Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {HORIZONS.map((h) => {
              const isActive = activeHorizon === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHorizon(h.id)}
                  className={`rounded-2xl p-3.5 text-left border transition-all ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)] shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'
                  }`}
                  data-testid={`routine-horizon-${h.id}`}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{h.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{h.subtitle}</p>
                </button>
              );
            })}
          </div>

          {aiError && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
              {aiError}
            </div>
          )}

          {aiRationale && (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-200">
              <strong>Smart Routine Architect:</strong> {aiRationale}
            </div>
          )}

          {capacity.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {capacity.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <form
              onSubmit={handleSaveBlock}
              className="rounded-2xl border border-[var(--accent-primary)]/40 bg-[var(--bg-elevated)] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {editingId ? 'Edit Routine Block' : `Add ${activeHorizon} Routine Block`}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., IELTS Writing Task 2 Review"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Time / Period Slot
                  </label>
                  <input
                    type="text"
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value)}
                    placeholder="07:30 - 08:30"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={480}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value) || 45)}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm font-mono-tabular text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RoutineBlockCategory)}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Notes</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optional study checklist or focus rule"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                >
                  {editingId ? 'Save Changes' : 'Add Block'}
                </button>
              </div>
            </form>
          )}

          {/* Version History Drawer */}
          {showHistory && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Saved Routine Versions ({activeHorizon})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-[var(--text-muted)]"
                >
                  Close
                </button>
              </div>
              {horizonVersions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  No snapshots saved yet. Snapshots are created automatically before AI regenerates
                  this horizon.
                </p>
              ) : (
                <div className="space-y-2">
                  {horizonVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium">{ver.label}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {new Date(ver.createdAt).toLocaleString()} · {ver.blocks.length} blocks
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreVersion(ver.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium border border-[var(--accent-primary)]/40 text-[var(--accent-primary)]"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Routine Blocks List */}
          <div className="space-y-3">
            {visibleBlocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-8 text-center">
                <CalendarClock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm font-medium">No blocks scheduled for this horizon yet.</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Add a custom time block or generate a balanced schedule with the Smart Routine
                  Architect Agent.
                </p>
              </div>
            ) : (
              visibleBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    block.completed
                      ? 'border-emerald-500/35 bg-emerald-500/5'
                      : block.category === 'break_recovery'
                      ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleComplete(block.id)}
                        className="mt-0.5 text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
                        aria-label={`Mark ${block.title} complete`}
                      >
                        {block.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--text-muted)]">
                          <span className="font-mono-tabular font-semibold text-[var(--accent-primary)]">
                            {block.slotLabel}
                          </span>
                          <span>·</span>
                          <span className="font-mono-tabular">{block.durationMinutes} min</span>
                          <span>·</span>
                          <span>{CATEGORY_LABELS[block.category]}</span>
                          {block.locked && (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <h3
                          className={`text-sm sm:text-base font-semibold mt-1 ${
                            block.completed ? 'line-through text-[var(--text-muted)]' : ''
                          }`}
                        >
                          {block.title}
                        </h3>
                        {block.notes && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                            {block.notes}
                          </p>
                        )}
                        {block.linkedSection && (
                          <button
                            type="button"
                            onClick={() => setActiveSection(block.linkedSection as NavSectionId)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-primary)] mt-2 hover:underline"
                          >
                            Open linked module
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleLock(block.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                        title={
                          block.locked
                            ? 'Unlock block (allow AI updates)'
                            : 'Lock block (protect from AI overwrite)'
                        }
                      >
                        {block.locked ? (
                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(block)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                        title="Edit block"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[var(--bg-surface)]"
                        title="Delete block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Architect Parameters & Balance Summary */}
        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
              <h2 className="text-sm font-semibold">Horizon Capacity & Balance</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Study Load</p>
                <p className="text-xl font-semibold font-mono-tabular mt-0.5">
                  {(capacity.studyMinutes / 60).toFixed(1)}h
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Breaks & Recovery</p>
                <p className="text-xl font-semibold font-mono-tabular mt-0.5">
                  {capacity.breakMinutes}m
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Completed</p>
                <p className="text-xl font-semibold font-mono-tabular mt-0.5">
                  {capacity.completedCount}/{capacity.totalCount}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Protected Locks</p>
                <p className="text-xl font-semibold font-mono-tabular mt-0.5">
                  {capacity.lockedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-4">
            <h2 className="text-sm font-semibold">Smart Routine Architect Settings</h2>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Primary Academic Goal
              </label>
              <input
                type="text"
                value={routineState.focusGoal}
                onChange={(e) =>
                  setRoutineState((prev) => ({ ...prev, focusGoal: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--text-muted)]">Realistic Daily Capacity</span>
                <span className="font-mono-tabular font-semibold">
                  {routineState.dailyCapacityHours} hrs/day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={routineState.dailyCapacityHours}
                onChange={(e) =>
                  setRoutineState((prev) => ({
                    ...prev,
                    dailyCapacityHours: Number(e.target.value),
                  }))
                }
                className="w-full accent-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
