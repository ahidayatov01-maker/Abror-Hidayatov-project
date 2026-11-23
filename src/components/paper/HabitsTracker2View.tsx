import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Dumbbell,
  Edit3,
  Feather,
  Flame,
  GraduationCap,
  Languages,
  MoreHorizontal,
  PauseCircle,
  PenTool,
  PlayCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  computeHabitsDashboardSummary,
  formatHabitFrequencyLabel,
  getISOWeekday,
  getMondayOfWeekISO,
  getWeekDatesMonToSun,
  HABIT_ACCENT_COLORS,
  HABIT_CATEGORIES,
  isHabitScheduledOnDate,
  ISO_WEEKDAY_LABELS,
  normalizeCompletionRecords,
  normalizeScheduledDays,
  shiftDateISO,
  STARTER_HABIT_TEMPLATES,
  toggleHabitCompletion,
  type DailyReflectionRecord,
  type HabitAccentColor,
  type HabitCategory,
  type HabitCompletionRecord,
  type HabitFrequencyType,
  type HabitIconId,
  type HabitItem,
  type HabitsTrackerState,
  type StarterHabitTemplate,
} from '../../utils/habitTrackerEngine';
import { useApp } from '../../context/AppContext';
import { getUniversalMicroCopy } from '../../utils/displayCopy';

interface HabitsTracker2ViewProps {
  trackerState: HabitsTrackerState;
  onUpdateTrackerState: (updater: (prev: HabitsTrackerState) => HabitsTrackerState) => void;
  todayISO: string;
  saveStatus: 'saved' | 'saving';
  onOpenNotebookMode?: () => void;
}

export function renderHabitIcon(icon: HabitIconId, className = 'w-4 h-4') {
  switch (icon) {
    case 'book-open':
      return <BookOpen className={className} />;
    case 'languages':
      return <Languages className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'graduation-cap':
      return <GraduationCap className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'pen-tool':
      return <PenTool className={className} />;
    case 'sparkles':
    default:
      return <Sparkles className={className} />;
  }
}

const ICON_OPTIONS: Array<{ id: HabitIconId; label: string }> = [
  { id: 'graduation-cap', label: 'Academic' },
  { id: 'languages', label: 'Languages' },
  { id: 'book-open', label: 'Reading' },
  { id: 'code', label: 'Coding' },
  { id: 'brain', label: 'Deep Work' },
  { id: 'clock', label: 'Routine' },
  { id: 'target', label: 'Goals' },
  { id: 'pen-tool', label: 'Writing' },
  { id: 'dumbbell', label: 'Fitness' },
  { id: 'sparkles', label: 'Focus' },
];

function formatReadableDate(dateISO: string, todayISO: string): string {
  if (dateISO === todayISO) {
    return `Today · ${dateISO}`;
  }
  if (dateISO === shiftDateISO(todayISO, -1)) {
    return `Yesterday · ${dateISO}`;
  }
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const formatted = dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return `${formatted} · ${dateISO}`;
}

export const HabitsTracker2View: React.FC<HabitsTracker2ViewProps> = ({
  trackerState,
  onUpdateTrackerState,
  todayISO,
  saveStatus,
  onOpenNotebookMode,
}) => {
  const { language } = useApp();
  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'archived' | 'all'>('active');
  const [quickHabitTitle, setQuickHabitTitle] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [deleteConfirmHabit, setDeleteConfirmHabit] = useState<HabitItem | null>(null);
  const [openMenuHabitId, setOpenMenuHabitId] = useState<string | null>(null);

  // Habit History & Analytics view states
  const [historyMode, setHistoryMode] = useState<'weekly' | 'monthly'>('monthly');
  const [calendarMonthAnchor, setCalendarMonthAnchor] = useState<string>(() =>
    todayISO.slice(0, 7)
  );
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Daily Reflection states
  const [reflectionExpanded, setReflectionExpanded] = useState<boolean>(false);
  const [reflectionDraft, setReflectionDraft] = useState<string>(
    () => trackerState.reflections[selectedDateISO]?.note || ''
  );
  const [reflectionSavedToast, setReflectionSavedToast] = useState(false);

  // Sync reflection draft when selectedDateISO changes
  useEffect(() => {
    setReflectionDraft(trackerState.reflections[selectedDateISO]?.note || '');
  }, [selectedDateISO, trackerState.reflections]);

  // Close 3-dot dropdown on outside click
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuHabitId(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Form state for New / Edit Habit Modal
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<HabitCategory>('Education');
  const [formIcon, setFormIcon] = useState<HabitIconId>('graduation-cap');
  const [formAccentColor, setFormAccentColor] = useState<HabitAccentColor>('cyan');
  const [formFrequency, setFormFrequency] = useState<HabitFrequencyType>('daily');
  const [formScheduledDays, setFormScheduledDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [formCustomWeeklyCount, setFormCustomWeeklyCount] = useState<number>(3);
  const [formTarget, setFormTarget] = useState<string>('30');
  const [formTargetUnit, setFormTargetUnit] = useState<string>('minutes');
  const [formStartDate, setFormStartDate] = useState<string>(todayISO);
  const [formReminderEnabled, setFormReminderEnabled] = useState<boolean>(false);
  const [formReminderTime, setFormReminderTime] = useState<string>('08:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState<boolean>(false);

  // Compute complete real-time summary & analytics
  const summary = useMemo(
    () =>
      computeHabitsDashboardSummary(
        trackerState.habits,
        trackerState.completions,
        todayISO,
        selectedDateISO
      ),
    [trackerState.habits, trackerState.completions, todayISO, selectedDateISO]
  );

  const completionLookup = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const c of trackerState.completions) {
      if (!c.completed) continue;
      if (!map[c.habitId]) map[c.habitId] = {};
      map[c.habitId][c.date] = true;
    }
    return map;
  }, [trackerState.completions]);

  const filteredHabits = useMemo(() => {
    return trackerState.habits.filter((h) => {
      if (statusFilter === 'all') return true;
      return h.status === statusFilter;
    });
  }, [trackerState.habits, statusFilter]);

  const activeCount = useMemo(
    () => trackerState.habits.filter((h) => h.status === 'active').length,
    [trackerState.habits]
  );
  const pausedCount = useMemo(
    () => trackerState.habits.filter((h) => h.status === 'paused').length,
    [trackerState.habits]
  );
  const archivedCount = useMemo(
    () => trackerState.habits.filter((h) => h.status === 'archived').length,
    [trackerState.habits]
  );

  const weekDates = useMemo(
    () => getWeekDatesMonToSun(selectedDateISO),
    [selectedDateISO]
  );

  // Open modal for New Habit
  const openCreateModal = () => {
    setEditingHabitId(null);
    setFormTitle('');
    setFormCategory('Education');
    setFormIcon('graduation-cap');
    setFormAccentColor('cyan');
    setFormFrequency('daily');
    setFormScheduledDays([1, 2, 3, 4, 5, 6, 7]);
    setFormCustomWeeklyCount(3);
    setFormTarget('30');
    setFormTargetUnit('minutes');
    setFormStartDate(shiftDateISO(todayISO, -7));
    setFormReminderEnabled(false);
    setFormReminderTime('08:00');
    setFormError(null);
    setIsSubmittingModal(false);
    setModalOpen(true);
  };

  // Open modal for Editing an existing Habit
  const openEditModal = (habit: HabitItem) => {
    setOpenMenuHabitId(null);
    setEditingHabitId(habit.id);
    setFormTitle(habit.title);
    setFormCategory(habit.category);
    setFormIcon(habit.icon);
    setFormAccentColor(habit.accentColor);
    setFormFrequency(habit.frequency);
    setFormScheduledDays(normalizeScheduledDays(habit.scheduledDays));
    setFormCustomWeeklyCount(habit.customWeeklyCount || habit.scheduledDays.length || 3);
    setFormTarget(habit.target !== null ? String(habit.target) : '');
    setFormTargetUnit(habit.targetUnit || 'minutes');
    setFormStartDate(habit.startDate || todayISO);
    setFormReminderEnabled(Boolean(habit.reminderTime));
    setFormReminderTime(habit.reminderTime || '08:00');
    setFormError(null);
    setIsSubmittingModal(false);
    setModalOpen(true);
  };

  // Quick-add habit handler
  const handleQuickAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickHabitTitle.trim();
    if (!trimmed) return;

    const nowISO = new Date().toISOString();
    const defaultStart = shiftDateISO(todayISO, -7);
    const created: HabitItem = {
      id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      category: 'Education',
      icon: 'sparkles',
      accentColor: 'cyan',
      frequency: 'daily',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      target: 30,
      targetUnit: 'minutes',
      startDate: defaultStart,
      reminderTime: null,
      status: 'active',
      scheduleHistory: [
        {
          effectiveFromDate: defaultStart,
          frequency: 'daily',
          scheduledDays: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    onUpdateTrackerState((prev) => ({
      ...prev,
      habits: [created, ...prev.habits],
      updatedAt: nowISO,
    }));
    setQuickHabitTitle('');
    if (statusFilter !== 'active' && statusFilter !== 'all') {
      setStatusFilter('active');
    }
  };

  // Activate a Starter Template (Section 11)
  const handleActivateStarterTemplate = (tpl: StarterHabitTemplate) => {
    const nowISO = new Date().toISOString();
    const defaultStart = shiftDateISO(todayISO, -7);
    const created: HabitItem = {
      id: `hab-${Date.now()}-${tpl.id}`,
      title: tpl.title,
      category: tpl.category,
      icon: tpl.icon,
      accentColor: tpl.accentColor,
      frequency: tpl.frequency,
      scheduledDays: [...tpl.scheduledDays],
      target: tpl.target,
      targetUnit: tpl.targetUnit,
      startDate: defaultStart,
      reminderTime: null,
      status: 'active',
      scheduleHistory: [
        {
          effectiveFromDate: defaultStart,
          frequency: tpl.frequency,
          scheduledDays: [...tpl.scheduledDays],
        },
      ],
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    onUpdateTrackerState((prev) => ({
      ...prev,
      habits: [...prev.habits, created],
      updatedAt: nowISO,
    }));
    setStatusFilter('active');
  };

  // Toggle weekday inside modal
  const handleToggleFormWeekday = (day: number) => {
    setFormScheduledDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev; // require at least 1 day
        return prev.filter((d) => d !== day).sort((a, b) => a - b);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  // Request notification permission only when user explicitly enables reminder
  const handleToggleReminder = async (enabled: boolean) => {
    setFormReminderEnabled(enabled);
    if (
      enabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore permission prompt error in headless/sandbox environments
      }
    }
  };

  // Save New or Edited Habit
  const handleSaveHabitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingModal) return;

    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      setFormError('Please enter a habit name.');
      return;
    }

    const effectiveDays =
      formFrequency === 'daily'
        ? [1, 2, 3, 4, 5, 6, 7]
        : normalizeScheduledDays(formScheduledDays);

    if (effectiveDays.length === 0) {
      setFormError('Select at least one scheduled weekday.');
      return;
    }

    setIsSubmittingModal(true);
    const parsedTarget =
      formTarget.trim() !== '' && Number.isFinite(Number(formTarget)) && Number(formTarget) > 0
        ? Number(formTarget)
        : null;
    const cleanUnit = formTargetUnit.trim() || 'minutes';
    const nowISO = new Date().toISOString();

    if (editingHabitId) {
      onUpdateTrackerState((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== editingHabitId) return h;
          const scheduleChanged =
            h.frequency !== formFrequency ||
            JSON.stringify(normalizeScheduledDays(h.scheduledDays)) !==
              JSON.stringify(effectiveDays);

          const nextHistory = [...(h.scheduleHistory || [])];
          if (scheduleChanged) {
            // Record schedule change effective from todayISO so historical completion records are not rewritten
            const existingTodayIdx = nextHistory.findIndex(
              (s) => s.effectiveFromDate === todayISO
            );
            const snap = {
              effectiveFromDate: todayISO,
              frequency: formFrequency,
              scheduledDays: effectiveDays,
              ...(formFrequency === 'custom_weekly'
                ? { customWeeklyCount: formCustomWeeklyCount }
                : {}),
            };
            if (existingTodayIdx >= 0) {
              nextHistory[existingTodayIdx] = snap;
            } else {
              nextHistory.push(snap);
            }
          }

          return {
            ...h,
            title: cleanTitle,
            category: formCategory,
            icon: formIcon,
            accentColor: formAccentColor,
            frequency: formFrequency,
            scheduledDays: effectiveDays,
            customWeeklyCount:
              formFrequency === 'custom_weekly' ? formCustomWeeklyCount : undefined,
            target: parsedTarget,
            targetUnit: cleanUnit,
            startDate: formStartDate || h.startDate,
            reminderTime: formReminderEnabled ? formReminderTime : null,
            scheduleHistory: nextHistory,
            updatedAt: nowISO,
          };
        }),
        updatedAt: nowISO,
      }));
    } else {
      const start = formStartDate || todayISO;
      const created: HabitItem = {
        id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: cleanTitle,
        category: formCategory,
        icon: formIcon,
        accentColor: formAccentColor,
        frequency: formFrequency,
        scheduledDays: effectiveDays,
        customWeeklyCount:
          formFrequency === 'custom_weekly' ? formCustomWeeklyCount : undefined,
        target: parsedTarget,
        targetUnit: cleanUnit,
        startDate: start,
        reminderTime: formReminderEnabled ? formReminderTime : null,
        status: 'active',
        scheduleHistory: [
          {
            effectiveFromDate: start,
            frequency: formFrequency,
            scheduledDays: effectiveDays,
            ...(formFrequency === 'custom_weekly'
              ? { customWeeklyCount: formCustomWeeklyCount }
              : {}),
          },
        ],
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      onUpdateTrackerState((prev) => ({
        ...prev,
        habits: [created, ...prev.habits],
        updatedAt: nowISO,
      }));
      setStatusFilter('active');
    }

    setModalOpen(false);
    setIsSubmittingModal(false);
  };

  // Toggle completion for a habit on any non-future date
  const handleToggleCompletion = (habitId: string, dateISO: string) => {
    if (dateISO > todayISO) return;
    onUpdateTrackerState((prev) => {
      const res = toggleHabitCompletion(prev.completions, habitId, dateISO, todayISO);
      if (res.blockedFuture) return prev;
      return {
        ...prev,
        completions: res.completions,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Change habit status (active / paused / archived)
  const handleSetHabitStatus = (habitId: string, nextStatus: HabitItem['status']) => {
    setOpenMenuHabitId(null);
    onUpdateTrackerState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === habitId ? { ...h, status: nextStatus, updatedAt: new Date().toISOString() } : h
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Permanently delete habit & its completion records (after confirmation)
  const handleConfirmPermanentDelete = () => {
    if (!deleteConfirmHabit) return;
    const targetId = deleteConfirmHabit.id;
    onUpdateTrackerState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== targetId),
      completions: normalizeCompletionRecords(
        prev.completions.filter((c) => c.habitId !== targetId)
      ),
      updatedAt: new Date().toISOString(),
    }));
    setDeleteConfirmHabit(null);
  };

  // Save Daily Reflection for selectedDateISO
  const handleSaveReflection = (noteText: string) => {
    const clean = noteText.trim();
    onUpdateTrackerState((prev) => {
      const nextReflections: Record<string, DailyReflectionRecord> = {
        ...prev.reflections,
      };
      if (clean) {
        nextReflections[selectedDateISO] = {
          date: selectedDateISO,
          note: noteText,
          updatedAt: new Date().toISOString(),
        };
      } else {
        delete nextReflections[selectedDateISO];
      }
      return {
        ...prev,
        reflections: nextReflections,
        updatedAt: new Date().toISOString(),
      };
    });
    setReflectionSavedToast(true);
    window.setTimeout(() => setReflectionSavedToast(false), 1800);
  };

  // Monthly calendar cells for Section 8 (Habit History)
  const monthlyCalendarData = useMemo(() => {
    const [yStr, mStr] = calendarMonthAnchor.split('-');
    const year = Number(yStr) || 2026;
    const month = Number(mStr) || 11;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstDateISO = `${year}-${String(month).padStart(2, '0')}-01`;
    const firstIsoWeekday = getISOWeekday(firstDateISO); // 1 (Mon) .. 7 (Sun)
    const leadingBlanks = firstIsoWeekday - 1;

    const activeHabits = trackerState.habits.filter((h) => h.status === 'active');
    const cells: Array<{
      dateISO: string;
      dayNum: number;
      scheduledCount: number;
      completedCount: number;
      rate: number;
      isFuture: boolean;
      isToday: boolean;
      isSelected: boolean;
    } | null> = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isFuture = dateISO > todayISO;
      let scheduledCount = 0;
      let completedCount = 0;

      for (const h of activeHabits) {
        if (isHabitScheduledOnDate(h, dateISO)) {
          scheduledCount += 1;
          if (!isFuture && completionLookup[h.id]?.[dateISO]) {
            completedCount += 1;
          }
        }
      }

      const rate =
        scheduledCount > 0 && !isFuture
          ? Math.round((completedCount / scheduledCount) * 100)
          : 0;

      cells.push({
        dateISO,
        dayNum: d,
        scheduledCount,
        completedCount,
        rate,
        isFuture,
        isToday: dateISO === todayISO,
        isSelected: dateISO === selectedDateISO,
      });
    }

    const monthTitle = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    return { year, month, monthTitle, cells };
  }, [calendarMonthAnchor, trackerState.habits, completionLookup, todayISO, selectedDateISO]);

  const shiftCalendarMonth = (deltaMonths: number) => {
    const [yStr, mStr] = calendarMonthAnchor.split('-');
    const dt = new Date(Date.UTC(Number(yStr) || 2026, (Number(mStr) || 11) - 1 + deltaMonths, 1));
    const nextY = dt.getUTCFullYear();
    const nextM = String(dt.getUTCMonth() + 1).padStart(2, '0');
    setCalendarMonthAnchor(`${nextY}-${nextM}`);
  };

  // Ring geometry for Card A (Daily Progress)
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (summary.dailyPercentage / 100) * ringCircumference;

  return (
    <div
      data-testid="habits-tracker-2-root"
      className="space-y-6 pb-8 text-[var(--text-primary)]"
    >
      {/* =====================================================================
          HEADER & QUICK ACTION BAR (Section 6)
      ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {micro.productivity.habitsTitle}
          </h1>
          <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
            {formatReadableDate(selectedDateISO, todayISO)}
          </span>
          {selectedDateISO !== todayISO && (
            <button
              type="button"
              data-testid="reset-to-today-btn"
              onClick={() => setSelectedDateISO(todayISO)}
              className="btn-glass rounded-lg px-2.5 py-1 text-xs font-medium text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}
        </div>

        {/* Quick-Add Input + New Habit Modal Trigger + Optional Classic Notebook Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form
            onSubmit={handleQuickAddHabit}
            className="flex items-center gap-1.5 flex-1 sm:flex-initial"
          >
            <input
              type="text"
              data-testid="quick-add-habit-input"
              value={quickHabitTitle}
              onChange={(e) => setQuickHabitTitle(e.target.value)}
              placeholder={micro.productivity.quickAddPlaceholder}
              aria-label="Quick add habit name"
              className="glass-input rounded-xl px-3.5 py-2 text-xs sm:text-sm min-w-[170px] sm:w-52"
            />
            {quickHabitTitle.trim().length > 0 && (
              <button
                type="submit"
                data-testid="quick-add-habit-btn"
                className="btn-glass rounded-xl px-3 py-2 text-xs font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap cursor-pointer"
              >
                +
              </button>
            )}
          </form>

          <button
            type="button"
            data-testid="open-new-habit-modal-btn"
            onClick={openCreateModal}
            className="btn-primary rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{micro.productivity.newHabitBtn.replace(/^\+\s*/, '')}</span>
          </button>

          {onOpenNotebookMode && (
            <button
              type="button"
              data-testid="switch-to-notebook-btn"
              onClick={onOpenNotebookMode}
              className="btn-glass rounded-xl px-3.5 py-2 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Feather className="w-3.5 h-3.5 text-amber-400" />
              <span>Notebook Pages</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          SECTION 3 — TOP SUMMARY: SMART BENTO HEADER (Cards A, B, C)
      ===================================================================== */}
      <section
        aria-label="Habit summary metrics"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
      >
        {/* CARD A — DAILY PROGRESS */}
        <div
          data-testid="bento-card-daily-progress"
          className="surface-card rounded-2xl p-5 flex items-center justify-between gap-4"
        >
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Daily Progress
            </p>
            <p
              data-testid="daily-progress-pct"
              className="font-display font-mono-tabular text-2xl sm:text-3xl font-semibold tracking-tight"
            >
              {summary.dailyPercentage}% Done
            </p>
            <p
              data-testid="daily-progress-count"
              className="text-xs sm:text-sm font-mono-tabular text-[var(--text-secondary)]"
            >
              {summary.dailyCompletedCount} of {summary.dailyScheduledCount} habits
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {selectedDateISO === todayISO
                ? 'Scheduled for today'
                : `Scheduled on ${selectedDateISO}`}
            </p>
          </div>

          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg
              width="96"
              height="96"
              viewBox="0 0 96 96"
              className="-rotate-90"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="habit-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
              <circle
                cx="48"
                cy="48"
                r={ringRadius}
                fill="none"
                stroke="var(--border-hairline)"
                strokeWidth="8"
              />
              <motion.circle
                cx="48"
                cy="48"
                r={ringRadius}
                fill="none"
                stroke="url(#habit-ring-grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={false}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono-tabular text-sm font-semibold">
                {summary.dailyCompletedCount}/{summary.dailyScheduledCount}
              </span>
            </div>
          </div>
        </div>

        {/* CARD B — STREAK & MOMENTUM */}
        <div
          data-testid="bento-card-streak-momentum"
          className="surface-card rounded-2xl p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Streak & Momentum
              </p>
              <p
                data-testid="streak-current-value"
                className="font-display font-mono-tabular text-2xl sm:text-3xl font-semibold tracking-tight"
              >
                {summary.overallCurrentStreak}-Day Streak
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2 text-xs">
            <span
              data-testid="streak-momentum-status"
              className="font-medium text-sky-400 truncate"
            >
              {summary.momentumStatus}
            </span>
            <span
              data-testid="streak-best-value"
              className="font-mono-tabular text-[var(--text-secondary)] shrink-0"
            >
              Best: {summary.overallBestStreak}d
            </span>
          </div>
        </div>

        {/* CARD C — WEEKLY CONSISTENCY (Monday - Sunday) */}
        <div
          data-testid="bento-card-weekly-consistency"
          className="surface-card rounded-2xl p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Weekly Consistency
              </p>
              <p
                data-testid="weekly-consistency-pct"
                className="font-display font-mono-tabular text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5"
              >
                {summary.weeklyPercentage}%
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-[var(--text-secondary)]">
              {summary.weeklyCompletedTotal}/{summary.weeklyScheduledTotal} sessions
            </span>
          </div>

          {/* 7 Interactive Day Bars/Dots (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {summary.weekDays.map((dayItem) => {
              const barColor =
                dayItem.status === 'completed'
                  ? 'bg-emerald-400 border-emerald-300/60 text-slate-950'
                  : dayItem.status === 'partial'
                  ? 'bg-sky-400/50 border-sky-300/60 text-white'
                  : dayItem.status === 'missed'
                  ? 'bg-rose-500/20 border-rose-400/35 text-rose-200'
                  : dayItem.status === 'future'
                  ? 'bg-white/[0.03] border-white/10 text-[var(--text-muted)] opacity-45'
                  : 'bg-white/[0.05] border-white/15 text-[var(--text-muted)]';

              const statusText =
                dayItem.status === 'completed'
                  ? 'Completed'
                  : dayItem.status === 'partial'
                  ? `Partial (${dayItem.completedCount}/${dayItem.scheduledCount})`
                  : dayItem.status === 'missed'
                  ? 'Missed scheduled day'
                  : dayItem.status === 'future'
                  ? 'Future day'
                  : 'Not scheduled';

              return (
                <button
                  key={dayItem.dateISO}
                  type="button"
                  disabled={dayItem.isFuture}
                  data-testid={`weekly-bento-day-${dayItem.dateISO}`}
                  onClick={() => {
                    if (!dayItem.isFuture) {
                      setSelectedDateISO(dayItem.dateISO);
                    }
                  }}
                  title={`${dayItem.shortLabel} (${dayItem.dateISO}) · ${statusText}`}
                  aria-label={`${dayItem.shortLabel} ${dayItem.dateISO} ${statusText}`}
                  className={`group rounded-xl p-1.5 flex flex-col items-center gap-1 transition-all border ${
                    dayItem.isSelected
                      ? 'ring-2 ring-sky-400 border-sky-400/60 bg-sky-500/10'
                      : 'border-transparent hover:bg-white/[0.05]'
                  } ${dayItem.isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`text-[10px] font-mono-tabular ${
                      dayItem.isToday
                        ? 'font-bold text-sky-400'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {dayItem.shortLabel}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-mono-tabular font-semibold transition-transform group-hover:scale-105 ${barColor}`}
                  >
                    {dayItem.status === 'completed' ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : dayItem.status === 'partial' ? (
                      `${dayItem.completedCount}`
                    ) : dayItem.status === 'unscheduled' ? (
                      '–'
                    ) : (
                      dayItem.dateISO.slice(8)
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FILTER BAR & STATUS SEGMENTED CONTROLS
      ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter habits by status"
          className="inline-flex items-center gap-1 p-1 rounded-xl surface-card"
        >
          {(
            [
              { id: 'active', label: 'Active', count: activeCount },
              { id: 'paused', label: 'Paused', count: pausedCount },
              { id: 'archived', label: 'Archived', count: archivedCount },
              { id: 'all', label: 'All', count: trackerState.habits.length },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`habit-filter-${tab.id}`}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="font-mono-tabular">
            {saveStatus === 'saving' ? 'Syncing changes...' : 'All changes saved'}
          </span>
        </div>
      </div>

      {/* =====================================================================
          SECTION 4, 5 & 11 — MAIN HABIT CARDS OR SMART STARTER EMPTY STATE
      ===================================================================== */}
      {filteredHabits.length === 0 ? (
        <section
          data-testid="habits-empty-state"
          className="surface-card rounded-2xl p-8 sm:p-10 text-center space-y-6"
        >
          <div className="max-w-lg mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/12 border border-sky-400/30 flex items-center justify-center mx-auto text-sky-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              Build Your Daily Momentum
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Small consistent actions create extraordinary progress.
            </p>
          </div>

          {/* 4 One-Click Starter Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
            {STARTER_HABIT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                data-testid={`starter-template-${tpl.id}`}
                onClick={() => handleActivateStarterTemplate(tpl)}
                className="surface-card motion-interactive-card rounded-2xl p-4 flex flex-col justify-between gap-3 text-left hover:border-sky-400/45 transition-all cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/12 border border-sky-400/30 flex items-center justify-center text-sky-300">
                    {renderHabitIcon(tpl.icon, 'w-4 h-4')}
                  </div>
                  <h3 className="font-display text-base font-semibold group-hover:text-sky-300 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
                <span className="text-xs font-semibold text-sky-400 inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Activate Template</span>
                </span>
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              data-testid="empty-create-own-habit-btn"
              onClick={openCreateModal}
              className="btn-primary rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create My Own Habit</span>
            </button>
          </div>
        </section>
      ) : (
        <section
          ref={menuContainerRef}
          aria-label="Habit cards"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {filteredHabits.map((habit) => {
            const habitMetrics = summary.perHabit[habit.id] || {
              currentStreak: 0,
              bestStreak: 0,
              totalCompleted: 0,
              completedOnSelectedDate: false,
              scheduledOnSelectedDate: true,
            };

            const isCompleted = habitMetrics.completedOnSelectedDate;
            const isScheduledToday = habitMetrics.scheduledOnSelectedDate;
            const isPaused = habit.status === 'paused';
            const isArchived = habit.status === 'archived';
            const accentObj =
              HABIT_ACCENT_COLORS.find((a) => a.id === habit.accentColor) ||
              HABIT_ACCENT_COLORS[0];
            const freqLabel = formatHabitFrequencyLabel(habit);
            const menuOpen = openMenuHabitId === habit.id;

            return (
              <div
                key={habit.id}
                data-testid={`habit-card-${habit.id}`}
                className={`surface-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-400/45 shadow-[0_0_28px_rgba(16,185,129,0.08)]'
                    : ''
                } ${isPaused || isArchived ? 'opacity-75' : ''}`}
              >
                {/* Top Row: Category Icon, Habit Title, Metadata, One-Tap Check-In & 3-Dot Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accentObj.ringClass}`}
                    >
                      {renderHabitIcon(habit.icon, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3
                        data-testid={`habit-title-${habit.id}`}
                        className={`font-display text-lg font-semibold leading-snug truncate ${
                          isCompleted ? 'text-emerald-400' : ''
                        }`}
                      >
                        {habit.title}
                      </h3>

                      {/* Clean Unboxed Metadata with middot separators */}
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        <span>{habit.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{freqLabel}</span>
                        {habit.target ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono-tabular">
                              {habit.target} {habit.targetUnit}
                            </span>
                          </>
                        ) : null}
                        {habit.reminderTime ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono-tabular">
                              Reminder {habit.reminderTime}
                            </span>
                          </>
                        ) : null}
                      </p>

                      {/* Streak & Today's Status */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular pt-0.5">
                        <span
                          data-testid={`habit-streak-${habit.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{habitMetrics.currentStreak}-day streak</span>
                        </span>
                        <span aria-hidden="true" className="text-[var(--text-muted)]">
                          ·
                        </span>
                        <span className="text-[var(--text-muted)]">
                          Best {habitMetrics.bestStreak}d
                        </span>
                        <span aria-hidden="true" className="text-[var(--text-muted)]">
                          ·
                        </span>
                        <span
                          className={
                            isPaused
                              ? 'text-amber-600 dark:text-amber-400'
                              : isArchived
                              ? 'text-[var(--text-muted)]'
                              : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                              : isScheduledToday
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-[var(--text-muted)]'
                          }
                        >
                          {isPaused
                            ? 'Paused'
                            : isArchived
                            ? 'Archived'
                            : isCompleted
                            ? 'Completed'
                            : isScheduledToday
                            ? 'Scheduled'
                            : 'Optional day'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: One-Tap Completion Button + 3-Dot Management Menu */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isPaused && !isArchived && (
                      <button
                        type="button"
                        data-testid={`habit-complete-btn-${habit.id}`}
                        disabled={selectedDateISO > todayISO}
                        onClick={() => handleToggleCompletion(habit.id, selectedDateISO)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          isCompleted
                            ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-600/40 dark:border-emerald-400/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                            : 'btn-glass hover:border-sky-400/50 text-[var(--text-primary)]'
                        }`}
                      >
                        <motion.span
                          key={isCompleted ? 'done' : 'pending'}
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.18 }}
                          className="inline-flex items-center"
                        >
                          <Check
                            className={`w-3.5 h-3.5 ${
                              isCompleted
                                ? 'text-emerald-700 dark:text-emerald-300 stroke-[2.5]'
                                : 'opacity-65'
                            }`}
                          />
                        </motion.span>
                        <span>{isCompleted ? 'Completed' : 'Complete'}</span>
                      </button>
                    )}

                    {/* Three-Dot Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        data-testid={`habit-menu-btn-${habit.id}`}
                        aria-label={`Manage ${habit.title}`}
                        aria-expanded={menuOpen}
                        onClick={() =>
                          setOpenMenuHabitId((prev) => (prev === habit.id ? null : habit.id))
                        }
                        className="btn-glass p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-1.5 w-44 rounded-2xl glass-panel bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl p-1.5 z-30 space-y-0.5"
                          >
                            <button
                              type="button"
                              data-testid={`habit-action-edit-${habit.id}`}
                              onClick={() => openEditModal(habit)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                              <span>Edit Habit</span>
                            </button>

                            {habit.status === 'paused' ? (
                              <button
                                type="button"
                                data-testid={`habit-action-resume-${habit.id}`}
                                onClick={() => handleSetHabitStatus(habit.id, 'active')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] cursor-pointer"
                              >
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Resume Habit</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid={`habit-action-pause-${habit.id}`}
                                onClick={() => handleSetHabitStatus(habit.id, 'paused')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] cursor-pointer"
                              >
                                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Pause Habit</span>
                              </button>
                            )}

                            {habit.status === 'archived' ? (
                              <button
                                type="button"
                                data-testid={`habit-action-restore-${habit.id}`}
                                onClick={() => handleSetHabitStatus(habit.id, 'active')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                                <span>Restore Habit</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid={`habit-action-archive-${habit.id}`}
                                onClick={() => handleSetHabitStatus(habit.id, 'archived')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.08] cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span>Archive Habit</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-[var(--border-hairline)]" />

                            <button
                              type="button"
                              data-testid={`habit-action-delete-${habit.id}`}
                              onClick={() => {
                                setOpenMenuHabitId(null);
                                setDeleteConfirmHabit(habit);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Habit</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* =========================================================
                    SECTION 5 — INDIVIDUAL HABIT 7-DAY TRACKING ROW (Mon–Sun)
                ========================================================= */}
                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                    This week
                  </span>

                  <div className="grid grid-cols-7 gap-1.5 flex-1 max-w-[300px]">
                    {weekDates.map((dt, idx) => {
                      const dayShort = ISO_WEEKDAY_LABELS[idx].short;
                      const isFuture = dt > todayISO;
                      const isScheduled = isHabitScheduledOnDate(habit, dt);
                      const isDone = Boolean(completionLookup[habit.id]?.[dt]);
                      const isTodayCell = dt === todayISO;

                      const statusDesc = isFuture
                        ? 'Future date (disabled)'
                        : isDone
                        ? 'Completed (click to undo)'
                        : isScheduled
                        ? 'Scheduled (click to mark complete)'
                        : 'Unscheduled day (click to log bonus completion)';

                      return (
                        <button
                          key={dt}
                          type="button"
                          disabled={isFuture}
                          data-testid={`habit-week-cell-${habit.id}-${dt}`}
                          onClick={() => handleToggleCompletion(habit.id, dt)}
                          title={`${dayShort} ${dt} · ${statusDesc}`}
                          aria-label={`${habit.title} on ${dayShort} ${dt}: ${statusDesc}`}
                          className={`rounded-lg py-1 px-1 flex flex-col items-center gap-0.5 border text-[10px] font-mono-tabular transition-all ${
                            isDone
                              ? 'bg-emerald-500/15 dark:bg-emerald-500/22 border-emerald-600/45 dark:border-emerald-400/55 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : isFuture
                              ? 'bg-transparent border-slate-300/40 dark:border-white/5 text-[var(--text-muted)] opacity-45 cursor-not-allowed'
                              : isScheduled
                              ? 'bg-slate-100/70 dark:bg-white/[0.04] border-slate-300/80 dark:border-white/15 text-[var(--text-secondary)] hover:border-sky-500/50 cursor-pointer'
                              : 'bg-transparent border-dashed border-slate-300/60 dark:border-white/10 text-[var(--text-muted)] opacity-65 hover:opacity-100 cursor-pointer'
                          } ${isTodayCell ? 'ring-1 ring-sky-500/60' : ''}`}
                        >
                          <span className="text-[9px] leading-none opacity-80">
                            {dayShort.slice(0, 2)}
                          </span>
                          <span className="h-3.5 flex items-center justify-center">
                            {isDone ? (
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            ) : isScheduled ? (
                              '·'
                            ) : (
                              '–'
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* =====================================================================
          SECTIONS 8 & 9 — HABIT HISTORY CALENDAR + ANALYTICS & INSIGHTS BENTO
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SECTION 8 — HABIT HISTORY CALENDAR */}
        <section
          data-testid="habit-history-section"
          className="lg:col-span-6 surface-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Habit History
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Select any date to inspect or correct historical completion records.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-[var(--border-hairline)]">
              <button
                type="button"
                data-testid="history-mode-weekly"
                onClick={() => setHistoryMode('weekly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  historyMode === 'weekly'
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                data-testid="history-mode-monthly"
                onClick={() => setHistoryMode('monthly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  historyMode === 'monthly'
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {historyMode === 'monthly' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(-1)}
                  aria-label="Previous month"
                  className="btn-glass p-1.5 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-semibold font-mono-tabular">
                  {monthlyCalendarData.monthTitle}
                </span>
                <button
                  type="button"
                  onClick={() => shiftCalendarMonth(1)}
                  aria-label="Next month"
                  className="btn-glass p-1.5 rounded-lg cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono-tabular text-[var(--text-muted)]">
                {ISO_WEEKDAY_LABELS.map((w) => (
                  <div key={w.day} className="py-1">
                    {w.short}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthlyCalendarData.cells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`blank-${idx}`} className="h-10" />;
                  }
                  const intensityClass = cell.isFuture
                    ? 'bg-transparent border-white/5 text-[var(--text-muted)] opacity-35 cursor-not-allowed'
                    : cell.scheduledCount === 0
                    ? 'bg-white/[0.03] border-white/10 text-[var(--text-muted)]'
                    : cell.rate === 100
                    ? 'bg-emerald-500/28 border-emerald-400/55 text-emerald-200 font-semibold'
                    : cell.rate >= 50
                    ? 'bg-sky-500/25 border-sky-400/45 text-sky-200'
                    : cell.rate > 0
                    ? 'bg-sky-500/12 border-sky-400/25 text-sky-200'
                    : 'bg-white/[0.04] border-white/10 text-[var(--text-secondary)]';

                  return (
                    <button
                      key={cell.dateISO}
                      type="button"
                      disabled={cell.isFuture}
                      data-testid={`history-date-cell-${cell.dateISO}`}
                      onClick={() => {
                        if (!cell.isFuture) {
                          setSelectedDateISO(cell.dateISO);
                        }
                      }}
                      title={`${cell.dateISO}: ${cell.completedCount}/${cell.scheduledCount} (${cell.rate}%)`}
                      className={`h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-mono-tabular transition-all ${intensityClass} ${
                        cell.isSelected ? 'ring-2 ring-sky-400' : ''
                      } ${!cell.isFuture ? 'cursor-pointer hover:border-sky-400/50' : ''}`}
                    >
                      <span>{cell.dayNum}</span>
                      {!cell.isFuture && cell.scheduledCount > 0 && (
                        <span className="text-[9px] leading-none opacity-80">
                          {cell.rate}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Weekly History Overview */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Week of {getMondayOfWeekISO(selectedDateISO)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDateISO(shiftDateISO(selectedDateISO, -7))}
                    className="btn-glass px-2 py-1 rounded-lg text-xs cursor-pointer"
                  >
                    Prev Week
                  </button>
                  <button
                    type="button"
                    disabled={shiftDateISO(selectedDateISO, 7) > todayISO}
                    onClick={() => {
                      const next = shiftDateISO(selectedDateISO, 7);
                      setSelectedDateISO(next > todayISO ? todayISO : next);
                    }}
                    className="btn-glass px-2 py-1 rounded-lg text-xs cursor-pointer disabled:opacity-40"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[var(--border-hairline)]">
                {summary.weekDays.map((d) => (
                  <button
                    key={d.dateISO}
                    type="button"
                    disabled={d.isFuture}
                    onClick={() => !d.isFuture && setSelectedDateISO(d.dateISO)}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-xs transition-colors ${
                      d.isSelected ? 'bg-sky-500/12 font-semibold' : 'hover:bg-white/[0.04]'
                    } ${d.isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="font-mono-tabular">
                      {d.shortLabel} · {d.dateISO}
                    </span>
                    <span className="font-mono-tabular text-[var(--text-secondary)]">
                      {d.isFuture
                        ? 'Future'
                        : d.scheduledCount === 0
                        ? 'Not scheduled'
                        : `${d.completedCount}/${d.scheduledCount} (${d.percentage}%)`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Date Breakdown (Completed vs Missed Scheduled Habits) */}
          <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">
                Records for {selectedDateISO}
              </span>
              <span className="font-mono-tabular text-[var(--text-secondary)]">
                {summary.dailyCompletedCount}/{summary.dailyScheduledCount} completed (
                {summary.dailyPercentage}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {trackerState.habits
                .filter((h) => h.status === 'active' && isHabitScheduledOnDate(h, selectedDateISO))
                .map((h) => {
                  const done = Boolean(completionLookup[h.id]?.[selectedDateISO]);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      disabled={selectedDateISO > todayISO}
                      onClick={() => handleToggleCompletion(h.id, selectedDateISO)}
                      className={`rounded-xl px-3 py-2 border flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        done
                          ? 'bg-emerald-500/12 border-emerald-400/35 text-emerald-300'
                          : 'bg-white/[0.03] border-white/10 text-[var(--text-secondary)] hover:border-sky-400/40'
                      }`}
                    >
                      <span className="truncate">{h.title}</span>
                      <span className="font-mono-tabular text-[11px] shrink-0">
                        {done ? 'Done ✓' : 'Missed'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </section>

        {/* SECTION 9 — ANALYTICS & CONSISTENCY INSIGHTS */}
        <section
          data-testid="habit-analytics-section"
          className="lg:col-span-6 surface-card rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Analytics & Consistency Insights
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Calculated from your actual completion records.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-[var(--border-hairline)]">
              <button
                type="button"
                data-testid="analytics-tab-weekly"
                onClick={() => setAnalyticsPeriod('weekly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  analyticsPeriod === 'weekly'
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                data-testid="analytics-tab-monthly"
                onClick={() => setAnalyticsPeriod('monthly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  analyticsPeriod === 'monthly'
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {analyticsPeriod === 'weekly' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Scheduled</p>
                <p className="font-mono-tabular text-xl font-semibold mt-0.5">
                  {summary.weeklyScheduledTotal}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Completed</p>
                <p className="font-mono-tabular text-xl font-semibold text-emerald-400 mt-0.5">
                  {summary.weeklyCompletedTotal}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-[var(--text-muted)]">Consistency</p>
                <p className="font-mono-tabular text-xl font-semibold text-sky-400 mt-0.5">
                  {summary.weeklyPercentage}%
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">30d Rate</p>
                <p className="font-mono-tabular text-xl font-semibold text-sky-400 mt-0.5">
                  {summary.analytics.monthlyPercentage}%
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Trend</p>
                <p className="font-mono-tabular text-xl font-semibold text-emerald-400 mt-0.5">
                  {summary.analytics.monthlyTrendDelta >= 0 ? '+' : ''}
                  {summary.analytics.monthlyTrendDelta}%
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Best Week</p>
                <p className="font-mono-tabular text-xl font-semibold mt-0.5">
                  {summary.analytics.bestPerformingWeekRate}%
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-[var(--border-hairline)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Longest Streak</p>
                <p className="font-mono-tabular text-xl font-semibold text-amber-400 mt-0.5">
                  {summary.overallBestStreak}d
                </p>
              </div>
            </div>
          )}

          {/* Most & Least Consistent Habit Summary */}
          {summary.analytics.mostConsistentHabit && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <span className="text-[var(--text-secondary)]">
                Most consistent:{' '}
                <strong className="text-[var(--text-primary)]">
                  {summary.analytics.mostConsistentHabit.title}
                </strong>{' '}
                ({summary.analytics.mostConsistentHabit.rate}%)
              </span>
              {summary.analytics.leastConsistentHabit &&
                summary.analytics.leastConsistentHabit.title !==
                  summary.analytics.mostConsistentHabit.title && (
                  <span className="text-[var(--text-muted)]">
                    Needs focus: {summary.analytics.leastConsistentHabit.title} (
                    {summary.analytics.leastConsistentHabit.rate}%)
                  </span>
                )}
            </div>
          )}

          {/* Habit-by-Habit Consistency Bars */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
            {summary.analytics.habitBreakdown.map((item) => {
              const rate =
                analyticsPeriod === 'weekly' ? item.weeklyRate : item.monthlyRate;
              const counts =
                analyticsPeriod === 'weekly'
                  ? `${item.weeklyCompleted}/${item.weeklyScheduled}`
                  : `${item.monthlyCompleted}/${item.monthlyScheduled}`;

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{item.title}</span>
                    <span className="font-mono-tabular text-[var(--text-secondary)] shrink-0">
                      {counts} ({rate}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-[width] duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Intelligent Insights List */}
          <div className="pt-3 border-t border-[var(--border-hairline)] space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Intelligent Insights</span>
            </p>
            <ul
              data-testid="habit-insights-list"
              className="space-y-1.5 text-xs text-[var(--text-secondary)]"
            >
              {summary.analytics.insights.map((insight, idx) => (
                <li key={idx} className="leading-relaxed">
                  · {insight}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* =====================================================================
          SECTION 10 — DAILY REFLECTION (Optional & Compact)
      ===================================================================== */}
      <section
        data-testid="daily-reflection-section"
        className="surface-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="toggle-reflection-btn"
            onClick={() => setReflectionExpanded((v) => !v)}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <Feather className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold">
                Daily Reflection · {selectedDateISO}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Optional note: What went well today? What made today's habits easier?
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setReflectionExpanded((v) => !v)}
            aria-label="Expand or collapse daily reflection"
            className="btn-glass px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{reflectionExpanded ? 'Hide' : 'Write Note'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                reflectionExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {reflectionExpanded && (
          <div className="pt-2 space-y-3">
            <textarea
              rows={3}
              data-testid="daily-reflection-textarea"
              value={reflectionDraft}
              onChange={(e) => setReflectionDraft(e.target.value)}
              placeholder="Write a brief note on what went well today, what made your habits easier, or what you want to improve tomorrow..."
              className="glass-input w-full rounded-xl p-3 text-xs sm:text-sm leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-emerald-400">
                {reflectionSavedToast ? 'Reflection saved for ' + selectedDateISO : ''}
              </span>
              <button
                type="button"
                data-testid="save-reflection-btn"
                onClick={() => handleSaveReflection(reflectionDraft)}
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Save Reflection
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          SECTION 6 — NEW / EDIT HABIT GLASSMORPHISM MODAL
      ===================================================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div
            data-testid="habit-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl glass-panel bg-[#071022]/95 border border-cyan-300/25 text-white shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 id="habit-modal-title" className="font-display text-xl font-semibold">
                  {editingHabitId ? 'Edit Habit' : 'New Habit'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="btn-glass p-1.5 rounded-xl text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleSaveHabitModal}
                className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
              >
                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-400/40 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-200"
                  >
                    {formError}
                  </div>
                )}

                {/* A. Habit Name */}
                <div>
                  <label
                    htmlFor="habit-modal-name"
                    className="block text-xs font-medium text-slate-200 mb-1"
                  >
                    Habit Name *
                  </label>
                  <input
                    id="habit-modal-name"
                    data-testid="habit-modal-name-input"
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. IELTS Listening Practice, Read 20 Minutes"
                    className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {/* B. Category & G. Start Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="habit-modal-category"
                      className="block text-xs font-medium text-slate-200 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="habit-modal-category"
                      data-testid="habit-modal-category-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as HabitCategory)}
                      className="w-full rounded-xl bg-[#0B1730] border border-white/15 focus:border-sky-400 px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    >
                      {HABIT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="habit-modal-start-date"
                      className="block text-xs font-medium text-slate-200 mb-1"
                    >
                      Start Date
                    </label>
                    <input
                      id="habit-modal-start-date"
                      data-testid="habit-modal-start-date-input"
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400 px-3 py-2 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* C. Icon Picker */}
                <div>
                  <span className="block text-xs font-medium text-slate-200 mb-1.5">
                    Icon
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {ICON_OPTIONS.map((ico) => {
                      const active = formIcon === ico.id;
                      return (
                        <button
                          key={ico.id}
                          type="button"
                          title={ico.label}
                          aria-label={ico.label}
                          onClick={() => setFormIcon(ico.id)}
                          className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            active
                              ? 'bg-sky-500/25 border-sky-400 text-sky-300'
                              : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.09]'
                          }`}
                        >
                          {renderHabitIcon(ico.id, 'w-4 h-4')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* D. Accent Color */}
                <div>
                  <span className="block text-xs font-medium text-slate-200 mb-1.5">
                    Accent Color
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {HABIT_ACCENT_COLORS.map((col) => {
                      const active = formAccentColor === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setFormAccentColor(col.id)}
                          className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                            active
                              ? 'border-white bg-white/15 text-white font-semibold'
                              : 'border-white/10 bg-white/[0.04] text-slate-300'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
                          <span>{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* E. Frequency */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-medium text-slate-200">
                    Frequency
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'daily', label: 'Daily' },
                        { id: 'specific_days', label: 'Specific Weekdays' },
                        { id: 'custom_weekly', label: 'Custom Weekly' },
                      ] as const
                    ).map((freq) => {
                      const active = formFrequency === freq.id;
                      return (
                        <button
                          key={freq.id}
                          type="button"
                          data-testid={`habit-freq-${freq.id}`}
                          onClick={() => {
                            setFormFrequency(freq.id);
                            if (freq.id === 'daily') {
                              setFormScheduledDays([1, 2, 3, 4, 5, 6, 7]);
                            } else if (
                              freq.id === 'specific_days' &&
                              formScheduledDays.length === 7
                            ) {
                              setFormScheduledDays([1, 3, 5]);
                            }
                          }}
                          className={`rounded-xl px-2.5 py-2 text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'bg-sky-500/25 border-sky-400 text-white font-semibold'
                              : 'bg-white/[0.04] border-white/10 text-slate-300'
                          }`}
                        >
                          {freq.label}
                        </button>
                      );
                    })}
                  </div>

                  {formFrequency !== 'daily' && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-7 gap-1.5">
                        {ISO_WEEKDAY_LABELS.map((w) => {
                          const selected = formScheduledDays.includes(w.day);
                          return (
                            <button
                              key={w.day}
                              type="button"
                              data-testid={`habit-weekday-btn-${w.day}`}
                              onClick={() => handleToggleFormWeekday(w.day)}
                              className={`py-1.5 rounded-xl text-xs font-mono-tabular border cursor-pointer transition-all ${
                                selected
                                  ? 'bg-sky-500/25 border-sky-400 text-white font-semibold'
                                  : 'bg-white/[0.04] border-white/10 text-slate-400'
                              }`}
                            >
                              {w.short}
                            </button>
                          );
                        })}
                      </div>

                      {formFrequency === 'custom_weekly' && (
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                          <span>Target sessions per week:</span>
                          <select
                            value={formCustomWeeklyCount}
                            onChange={(e) => setFormCustomWeeklyCount(Number(e.target.value))}
                            className="rounded-lg bg-[#0B1730] border border-white/15 px-2.5 py-1 text-xs text-white"
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n} times / week
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* F. Optional Daily Target & Custom Measurement Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="habit-modal-target"
                      className="block text-xs font-medium text-slate-200 mb-1"
                    >
                      Daily Target (optional)
                    </label>
                    <input
                      id="habit-modal-target"
                      data-testid="habit-modal-target-input"
                      type="number"
                      min="1"
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      placeholder="30"
                      className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400 px-3 py-2 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="habit-modal-unit"
                      className="block text-xs font-medium text-slate-200 mb-1"
                    >
                      Measurement Unit
                    </label>
                    <input
                      id="habit-modal-unit"
                      data-testid="habit-modal-unit-input"
                      type="text"
                      value={formTargetUnit}
                      onChange={(e) => setFormTargetUnit(e.target.value)}
                      placeholder="minutes, pages, words..."
                      className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* H. Optional Reminder */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">Daily Reminder</p>
                      <p className="text-[11px] text-slate-400">
                        Optional preferred check-in time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Enable reminder"
                      checked={formReminderEnabled}
                      onChange={(e) => void handleToggleReminder(e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    {formReminderEnabled && (
                      <input
                        type="time"
                        value={formReminderTime}
                        onChange={(e) => setFormReminderTime(e.target.value)}
                        className="rounded-lg bg-[#0B1730] border border-white/15 px-2 py-1 text-xs font-mono-tabular text-white"
                      />
                    )}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-glass rounded-xl px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="habit-modal-submit-btn"
                    disabled={isSubmittingModal}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 cursor-pointer shadow-md disabled:opacity-60"
                  >
                    {editingHabitId ? 'Save Changes' : 'Create Habit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          SECTION 7 — DELETE CONFIRMATION MODAL
      ===================================================================== */}
      <AnimatePresence>
        {deleteConfirmHabit && (
          <div
            data-testid="delete-habit-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-habit-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-3xl glass-panel bg-[#071022]/95 border border-rose-400/35 text-white p-6 space-y-4 shadow-2xl"
            >
              <div className="space-y-1.5">
                <h2 id="delete-habit-modal-title" className="font-display text-xl font-semibold">
                  Delete “{deleteConfirmHabit.title}”?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Permanent deletion will remove this habit and all of its historical completion
                  records. If you want to hide this habit while keeping its history intact, choose{' '}
                  <strong>Archive Instead</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmHabit(null)}
                  className="btn-glass rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="archive-instead-habit-btn"
                  onClick={() => {
                    handleSetHabitStatus(deleteConfirmHabit.id, 'archived');
                    setDeleteConfirmHabit(null);
                  }}
                  className="btn-glass rounded-xl px-3.5 py-2 text-xs font-semibold text-sky-300 cursor-pointer"
                >
                  Archive Instead
                </button>
                <button
                  type="button"
                  data-testid="confirm-delete-habit-btn"
                  onClick={handleConfirmPermanentDelete}
                  className="rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-semibold text-xs px-4 py-2 cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
