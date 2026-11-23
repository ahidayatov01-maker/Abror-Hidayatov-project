import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  filterTodoTasks,
  isDuplicateTask,
  type TodoCategory,
  type TodoFilterTab,
  type TodoRecommendation,
} from '../../utils/productivityEngine';
import { getUniversalMicroCopy } from '../../utils/displayCopy';

const CATEGORIES: TodoCategory[] = [
  'Admissions',
  'Exams',
  'Scholarships',
  'Documents',
  'Research',
  'Financial',
  'Milestone',
  'Personal',
];

const FILTER_TABS: Array<{ id: TodoFilterTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

export const TodoListView: React.FC = () => {
  const {
    journeyTasks,
    addJourneyTask,
    updateJourneyTask,
    deleteJourneyTask,
    savedUniversities,
    profile,
    language,
  } = useApp();

  const {
    todoRecommendations,
    setTodoRecommendations,
    roadmapState,
    getAuthHeaders,
    refreshEntitlementStatus,
    showToast,
  } = useWorkspaceIntelligence();

  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const todayISO = new Date().toISOString().slice(0, 10);

  const [filterTab, setFilterTab] = useState<TodoFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Manual task creation
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TodoCategory>('Admissions');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Inline editing of personal task
  const [editingTaskId, setEditingTaskId] = useState<number | string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Confirm delete state (no window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);

  // Editing an AI recommendation before accepting
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [recEditTitle, setRecEditTitle] = useState('');
  const [recEditDue, setRecEditDue] = useState('');

  const filteredTasks = useMemo(() => {
    const normalized = journeyTasks.map((t, idx) => ({
      ...t,
      numericId: typeof t.id === 'number' ? t.id : idx + 1,
      rawId: t.id,
    }));
    const result = filterTodoTasks(
      normalized.map((item) => ({
        id: item.numericId,
        title: item.title,
        category: item.category,
        targetUniversitySlug: item.targetUniversitySlug,
        dueDate: item.dueDate,
        status: item.status,
        notes: item.notes,
        rawId: item.rawId,
      })),
      filterTab,
      searchQuery,
      todayISO
    );
    return result;
  }, [journeyTasks, filterTab, searchQuery, todayISO]);

  const stats = useMemo(() => {
    let active = 0;
    let completed = 0;
    let overdue = 0;
    for (const t of journeyTasks) {
      if (t.status === 'completed') {
        completed += 1;
      } else {
        active += 1;
        if (t.dueDate && t.dueDate.slice(0, 10) < todayISO) overdue += 1;
      }
    }
    return { total: journeyTasks.length, active, completed, overdue };
  }, [journeyTasks, todayISO]);

  const handleAddManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (isDuplicateTask(journeyTasks, newTitle)) {
      showToast('An active task with this title already exists in Mening vazifalarim.', 'info');
      return;
    }
    await addJourneyTask({
      title: newTitle.trim(),
      category: newCategory,
      status: 'pending',
      dueDate: newDueDate || null,
      notes: newNotes.trim(),
    });
    setNewTitle('');
    setNewDueDate('');
    setNewNotes('');
    showToast('Task added to Mening vazifalarim.', 'success');
  };

  const handleFetchRecommendations = async () => {
    setLoadingRecs(true);
    setRecError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/todo-recommendations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language,
          existingTaskTitles: journeyTasks.map((t) => t.title),
          userContext: {
            country: profile.country,
            targetDegree: profile.targetDegree,
            targetDisciplines: profile.targetDisciplines,
            savedUniversities: savedUniversities.map((u) => u.universitySlug),
            targetUniversityName: roadmapState.targetUniversityName,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not retrieve AI task recommendations.');
      }
      const list = Array.isArray(data.recommendations)
        ? (data.recommendations as TodoRecommendation[])
        : [];
      setTodoRecommendations(list);
      await refreshEntitlementStatus();
      showToast(`Generated ${list.length} grounded task recommendations.`, 'success');
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Unable to generate recommendations.');
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleAcceptRecommendation = async (
    rec: TodoRecommendation,
    override?: { title?: string; dueDate?: string | null }
  ) => {
    const finalTitle = (override?.title ?? rec.title).trim();
    if (!finalTitle) return;

    if (isDuplicateTask(journeyTasks, finalTitle)) {
      showToast('This task is already in your active task list.', 'info');
      setTodoRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
      return;
    }

    await addJourneyTask({
      title: finalTitle,
      category: rec.category || 'Admissions',
      status: 'pending',
      dueDate: override?.dueDate !== undefined ? override.dueDate : rec.suggestedDueDate,
      targetUniversitySlug: rec.targetUniversitySlug || null,
      notes: `AI Orchestrator rationale: ${rec.rationale}`,
    });
    setTodoRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    setEditingRecId(null);
    showToast(`Accepted task into Mening vazifalarim: "${finalTitle}"`, 'success');
  };

  const handleDismissRecommendation = (id: string) => {
    setTodoRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveTaskEdit = async (rawId: number | string) => {
    if (!editTitle.trim()) return;
    await updateJourneyTask(rawId, {
      title: editTitle.trim(),
      dueDate: editDueDate || null,
      notes: editNotes.trim(),
    });
    setEditingTaskId(null);
    showToast('Task updated.', 'success');
  };

  return (
    <div className="space-y-6" data-testid="todo-list-view">
      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {micro.productivity.todoTitle}
        </h1>

        <div className="flex items-center gap-3 text-xs font-mono-tabular">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2">
            <span className="text-[var(--text-muted)]">{micro.productivity.activeLabel}:</span>{' '}
            <strong>{stats.active}</strong>
          </div>
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2">
            <span className="text-[var(--text-muted)]">{micro.productivity.doneLabel}:</span>{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">{stats.completed}</strong>
          </div>
          {stats.overdue > 0 && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
              <span>{micro.productivity.overdueLabel}:</span> <strong>{stats.overdue}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* AI Suggestions Panel */}
        <section
          className="xl:col-span-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-4"
          data-testid="todo-area-ai"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              {micro.productivity.aiSuggestionsTitle}
            </h2>
            <button
              type="button"
              onClick={handleFetchRecommendations}
              disabled={loadingRecs}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95 disabled:opacity-50 shrink-0 cursor-pointer"
              data-testid="todo-ai-refresh-btn"
            >
              {loadingRecs ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {micro.productivity.suggestBtn}
            </button>
          </div>

          {recError && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              {recError}
            </div>
          )}

          {todoRecommendations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center space-y-1.5">
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)] mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">
                {micro.productivity.suggestBtn}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todoRecommendations.map((rec) => {
                const isEditing = editingRecId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-2.5"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={recEditTitle}
                          onChange={(e) => setRecEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                        />
                        <input
                          type="date"
                          value={recEditDue}
                          onChange={(e) => setRecEditDue(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleAcceptRecommendation(rec, {
                                title: recEditTitle,
                                dueDate: recEditDue || null,
                              })
                            }
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white"
                          >
                            Save & Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRecId(null)}
                            className="text-xs text-[var(--text-muted)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-secondary)]">
                            {rec.category}
                          </span>
                          <span
                            className={`font-semibold uppercase tracking-wide ${
                              rec.priority === 'high'
                                ? 'text-rose-600 dark:text-rose-400'
                                : rec.priority === 'medium'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-snug">{rec.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {rec.rationale}
                        </p>
                        {rec.suggestedDueDate && (
                          <p className="text-[11px] font-mono-tabular text-[var(--text-muted)] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Suggested due: {rec.suggestedDueDate}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => void handleAcceptRecommendation(rec)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecId(rec.id);
                              setRecEditTitle(rec.title);
                              setRecEditDue(rec.suggestedDueDate || '');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissRecommendation(rec.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-rose-600"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Personal Tasks Panel */}
        <section
          className="xl:col-span-7 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-5"
          data-testid="todo-area-personal"
        >
          <h2 className="text-base font-semibold">{micro.productivity.myTasksTitle}</h2>

          {/* Quick Add Task Form */}
          <form
            onSubmit={handleAddManualTask}
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5 space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a concrete academic task (e.g., Request professor recommendation letter)"
                className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                data-testid="todo-manual-title-input"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] disabled:opacity-40"
                data-testid="todo-manual-add-btn"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TodoCategory)}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              />
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional note..."
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
          </form>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    filterTab === tab.id
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-8 text-center text-xs text-[var(--text-muted)]">
                No tasks match this filter yet. Add one above or accept a recommendation from Area A.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'completed';
                const isOverdue = !isDone && Boolean(task.dueDate && task.dueDate.slice(0, 10) < todayISO);
                const isEditing = editingTaskId === task.rawId;

                return (
                  <div
                    key={String(task.rawId)}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isDone
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isOverdue
                        ? 'border-rose-500/35 bg-rose-500/5'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                          />
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notes"
                            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveTaskEdit(task.rawId)}
                            className="rounded-lg px-3 py-1 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="text-xs text-[var(--text-muted)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              void updateJourneyTask(task.rawId, {
                                status: isDone ? 'pending' : 'completed',
                              })
                            }
                            className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-emerald-600"
                            aria-label={`Toggle ${task.title}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                isDone ? 'line-through text-[var(--text-muted)]' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[var(--text-muted)] mt-1">
                              <span>{task.category}</span>
                              {task.dueDate && (
                                <span
                                  className={`font-mono-tabular ${
                                    isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                                  }`}
                                >
                                  Due: {task.dueDate.slice(0, 10)}
                                  {isOverdue ? ' (Overdue)' : ''}
                                </span>
                              )}
                            </div>
                            {task.notes && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTaskId(task.rawId);
                              setEditTitle(task.title);
                              setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
                              setEditNotes(task.notes || '');
                            }}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Edit task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === task.rawId ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteJourneyTask(task.rawId);
                                  setConfirmDeleteId(null);
                                  showToast('Task deleted.', 'info');
                                }}
                                className="rounded-md px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[11px] text-[var(--text-muted)] px-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(task.rawId)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
