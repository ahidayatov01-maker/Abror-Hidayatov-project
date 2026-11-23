import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Check,
  Feather,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  HabitCompletionLog,
  HabitDefinition,
  HabitPriority,
  HandwritingFont,
  JournalLineEntry,
  JournalPage,
  JournalPreferences,
  StickyNoteItem,
  WritingInstrument,
} from '../../types/journal';
import {
  computeHabitStats,
  shiftISODate,
} from '../../utils/journalEngine';
import { paperAudio } from '../../utils/paperAudio';
import {
  HandwrittenCheckbox,
  LINE_COLORS,
  PAPER_PALETTES,
} from './PaperNotebookPrimitives';

export function getFontClass(font: HandwritingFont): string {
  switch (font) {
    case 'caveat':
      return 'font-hw-caveat';
    case 'kalam':
      return 'font-hw-kalam';
    case 'patrick':
      return 'font-hw-patrick';
    case 'bad-script':
      return 'font-hw-bad-script';
  }
}

export function getInstrumentClass(instrument: WritingInstrument): string {
  switch (instrument) {
    case 'fountain':
      return 'ink-fountain';
    case 'pencil':
      return 'ink-pencil';
    case 'highlighter':
      return 'ink-highlighter';
    case 'fine-tip':
      return 'ink-fine-tip';
    case 'ballpoint':
      return 'ink-ballpoint';
    case 'colored':
      return 'ink-fountain';
  }
}

function getLineHeightClass(spacing: JournalPreferences['lineSpacing']): string {
  switch (spacing) {
    case 'compact':
      return 'min-h-[28px] leading-[26px] text-[15px] sm:min-h-[30px] sm:leading-[28px] sm:text-[18px]';
    case 'relaxed':
      return 'min-h-[36px] leading-[34px] text-[18px] sm:min-h-[42px] sm:leading-[40px] sm:text-[22px]';
    default:
      return 'min-h-[32px] leading-[30px] text-[16px] sm:min-h-[36px] sm:leading-[34px] sm:text-[20px]';
  }
}

const STICKY_COLORS: Record<StickyNoteItem['color'], string> = {
  canary: '#F8E69D',
  sage: '#D8E7CE',
  blush: '#F4D8D5',
  kraft: '#E9D8BE',
};

const PRIORITY_MARKS: Record<HabitPriority, { mark: string; label: string }> = {
  most_important: { mark: '★★★', label: 'Most important' },
  important: { mark: '★★', label: 'Important' },
  optional: { mark: '★', label: 'Optional' },
};

interface PaperPageViewsProps {
  page: JournalPage;
  preferences: JournalPreferences;
  activeTool: 'type' | 'draw' | 'erase';
  activeLineId: string | null;
  onSelectLine: (lineId: string) => void;
  onUpdatePage: (updater: (p: JournalPage) => JournalPage) => void;
  habits: HabitDefinition[];
  habitLog: HabitCompletionLog;
  todayISO: string;
  onAddHabit: (name: string, priority: HabitPriority, schedule: HabitDefinition['schedule']) => void;
  onToggleHabitToday: (habitId: string, dateISO?: string) => void;
  onDeleteHabit: (habitId: string) => void;
  stickyNotes: StickyNoteItem[];
  onUpdateStickyNote: (id: string, patch: Partial<StickyNoteItem>) => void;
  onDeleteStickyNote: (id: string) => void;
}

export const PaperPageViews: React.FC<PaperPageViewsProps> = ({
  page,
  preferences,
  activeTool,
  activeLineId,
  onSelectLine,
  onUpdatePage,
  habits,
  habitLog,
  todayISO,
  onAddHabit,
  onToggleHabitToday,
  onDeleteHabit,
  stickyNotes,
  onUpdateStickyNote,
  onDeleteStickyNote,
}) => {
  const palette = PAPER_PALETTES[preferences.paperColor] || PAPER_PALETTES['warm-ivory'];
  const lineBorder = LINE_COLORS[preferences.lineColor] || LINE_COLORS['slate-blue'];
  const lineHeightCls = getLineHeightClass(preferences.lineSpacing);

  const lineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitPriority, setNewHabitPriority] = useState<HabitPriority>('important');
  const [newHabitSchedule, setNewHabitSchedule] = useState<HabitDefinition['schedule']>('daily');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalHorizon, setNewGoalHorizon] = useState('This Quarter');

  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryLocation, setNewMemoryLocation] = useState('');
  const [newMemoryStory, setNewMemoryStory] = useState('');

  const habitStats = useMemo(
    () => computeHabitStats(habits, habitLog, todayISO),
    [habits, habitLog, todayISO]
  );

  const handleLineChange = (lineId: string, text: string) => {
    paperAudio.playWriteScratch();
    onUpdatePage((p) => ({
      ...p,
      lines: p.lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              text,
              instrument: l.text === '' ? preferences.defaultInstrument : l.instrument,
              inkColor: l.text === '' ? preferences.defaultInkColor : l.inkColor,
              font: l.text === '' ? preferences.defaultFont : l.font,
            }
          : l
      ),
    }));
  };

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = page.lines[index + 1];
      if (next) {
        onSelectLine(next.id);
        lineInputRefs.current[next.id]?.focus();
      } else {
        const created: JournalLineEntry = {
          id: `line-${Date.now()}-${page.lines.length}`,
          text: '',
          instrument: preferences.defaultInstrument,
          inkColor: preferences.defaultInkColor,
          font: preferences.defaultFont,
          align: 'left',
        };
        onUpdatePage((p) => ({ ...p, lines: [...p.lines, created] }));
        setTimeout(() => {
          onSelectLine(created.id);
          lineInputRefs.current[created.id]?.focus();
        }, 20);
      }
    } else if (e.key === 'ArrowDown') {
      const next = page.lines[index + 1];
      if (next) {
        e.preventDefault();
        onSelectLine(next.id);
        lineInputRefs.current[next.id]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      const prev = page.lines[index - 1];
      if (prev) {
        e.preventDefault();
        onSelectLine(prev.id);
        lineInputRefs.current[prev.id]?.focus();
      }
    } else if (e.key === 'Backspace' && page.lines[index].text === '' && index > 0) {
      e.preventDefault();
      const prev = page.lines[index - 1];
      onSelectLine(prev.id);
      lineInputRefs.current[prev.id]?.focus();
    }
  };

  // Month grid data for Habit Calendar template
  const calendarDays = useMemo(() => {
    const [y, m] = todayISO.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const cells: Array<{ day: number; iso: string; done: number; total: number } | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayLog = habitLog[iso] || {};
      const done = habits.filter((h) => dayLog[h.id]).length;
      cells.push({ day: d, iso, done, total: habits.length });
    }
    return { year: y, month: m, cells };
  }, [todayISO, habitLog, habits]);

  // Weekly 7-day breakdown
  const weekDays = useMemo(() => {
    const arr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      arr.push(shiftISODate(todayISO, -i));
    }
    return arr;
  }, [todayISO]);

  return (
    <div ref={pageContainerRef} className="relative space-y-5">
      {/* Page Date & Editable Handwritten Header */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b"
        style={{ borderColor: lineBorder }}
      >
        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdatePage((p) => ({ ...p, title: e.target.value }))}
          aria-label="Page title"
          className={`bg-transparent border-0 outline-none focus-visible:outline-none text-xl sm:text-3xl font-semibold w-full sm:flex-1 sm:w-auto min-w-0 ${getFontClass(
            preferences.defaultFont
          )}`}
          style={{ color: palette.text }}
        />

        <div className="flex items-center gap-3 text-xs font-mono-tabular" style={{ color: palette.faintText }}>
          <input
            type="date"
            value={page.dateISO}
            onChange={(e) => onUpdatePage((p) => ({ ...p, dateISO: e.target.value }))}
            aria-label="Page date"
            className="bg-transparent border-0 outline-none focus-visible:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Template-Specific Body Directly on Paper */}
      {page.template === 'daily' && (
        <div className="space-y-6">
          {/* Direct-on-Paper Ruled Lines */}
          <div className="relative">
            {page.lines.map((line, idx) => {
              const isFocused = activeLineId === line.id && activeTool === 'type';
              return (
                <div
                  key={line.id}
                  onClick={() => {
                    if (activeTool === 'type') {
                      onSelectLine(line.id);
                      lineInputRefs.current[line.id]?.focus();
                    }
                  }}
                  style={{ borderBottom: `1px solid ${lineBorder}` }}
                  className={`relative flex items-center gap-2 transition-colors ${
                    isFocused ? 'bg-amber-950/[0.025]' : ''
                  }`}
                >
                  {/* Realistic Pen Nib Marker on Active Line */}
                  {isFocused && (
                    <Feather
                      aria-hidden="true"
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 -ml-3.5 sm:-ml-5 text-[#1B2E4B] opacity-75"
                    />
                  )}

                  <input
                    ref={(el) => {
                      lineInputRefs.current[line.id] = el;
                    }}
                    type="text"
                    value={line.text}
                    readOnly={activeTool !== 'type'}
                    onFocus={() => onSelectLine(line.id)}
                    onChange={(e) => handleLineChange(line.id, e.target.value)}
                    onKeyDown={(e) => handleLineKeyDown(e, idx)}
                    aria-label={`Notebook line ${idx + 1}`}
                    placeholder={idx === 0 ? 'Click any line and begin writing...' : ''}
                    className={`w-full bg-transparent border-0 outline-none focus-visible:outline-none placeholder:opacity-35 ${getFontClass(
                      line.font
                    )} ${getInstrumentClass(line.instrument)} ${lineHeightCls} ${
                      line.isHeading ? 'font-bold text-[24px]' : ''
                    } ${line.underline ? 'underline decoration-1 underline-offset-4' : ''} ${
                      line.strikethrough ? 'line-through' : ''
                    } ${line.align === 'center' ? 'text-center' : line.align === 'right' ? 'text-right' : 'text-left'}`}
                    style={{
                      color: line.inkColor,
                      backgroundColor: line.highlighted
                        ? line.highlightColor || 'rgba(250, 219, 95, 0.42)'
                        : 'transparent',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Native-on-Paper Habit Tracker Section */}
          <div className="pt-3 space-y-2" style={{ borderTop: `1.5px solid ${lineBorder}` }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3
                className={`text-xl font-semibold ${getFontClass(preferences.defaultFont)}`}
                style={{ color: palette.text }}
              >
                Daily Habits & Commitments
              </h3>
              <p className="text-xs font-mono-tabular" style={{ color: palette.faintText }}>
                Today {habitStats.dailyCompleted}/{habitStats.dailyTotal} ({habitStats.dailyPercent}%) · 7d{' '}
                {habitStats.weeklyPercent}% · 30d {habitStats.monthlyPercent}%
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: lineBorder }}>
              {habits.map((habit) => {
                const stats = habitStats.perHabit[habit.id];
                const checked = Boolean(stats?.completedToday);
                const pri = PRIORITY_MARKS[habit.priority];
                return (
                  <div
                    key={habit.id}
                    style={{ borderColor: lineBorder }}
                    className="py-1.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HandwrittenCheckbox
                        checked={checked}
                        inkColor={preferences.defaultInkColor}
                        label={`Toggle habit ${habit.name}`}
                        onToggle={() => {
                          paperAudio.playInkClick();
                          onToggleHabitToday(habit.id, todayISO);
                        }}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-lg leading-snug truncate ${getFontClass(
                            preferences.defaultFont
                          )} ${checked ? 'line-through opacity-60' : ''}`}
                          style={{ color: preferences.defaultInkColor }}
                        >
                          <span
                            title={pri.label}
                            className="text-xs mr-1.5 opacity-60 tracking-tighter"
                          >
                            {pri.mark}
                          </span>
                          {habit.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-[11px] font-mono-tabular" style={{ color: palette.faintText }}>
                      <span>{stats?.currentStreak ?? 0}d streak</span>
                      <span>·</span>
                      <span>best {stats?.longestStreak ?? 0}d</span>
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        aria-label={`Remove habit ${habit.name}`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inline on-paper habit creation line */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newHabitName.trim()) return;
                paperAudio.playInkClick();
                onAddHabit(newHabitName.trim(), newHabitPriority, newHabitSchedule);
                setNewHabitName('');
              }}
              style={{ borderBottom: `1px solid ${lineBorder}` }}
              className="flex flex-wrap items-center gap-2 pt-1 pb-1"
            >
              <Plus className="w-4 h-4 shrink-0 opacity-60" />
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Write a new habit directly on this line..."
                aria-label="New habit name"
                className={`flex-1 min-w-[180px] bg-transparent border-0 outline-none focus-visible:outline-none text-lg ${getFontClass(
                  preferences.defaultFont
                )}`}
                style={{ color: preferences.defaultInkColor }}
              />
              <select
                aria-label="Habit priority"
                value={newHabitPriority}
                onChange={(e) => setNewHabitPriority(e.target.value as HabitPriority)}
                className="bg-transparent text-xs border-b border-black/15 py-0.5 outline-none cursor-pointer"
              >
                <option value="most_important">★★★ Most important</option>
                <option value="important">★★ Important</option>
                <option value="optional">★ Optional</option>
              </select>
              <select
                aria-label="Habit schedule"
                value={newHabitSchedule}
                onChange={(e) =>
                  setNewHabitSchedule(e.target.value as HabitDefinition['schedule'])
                }
                className="bg-transparent text-xs border-b border-black/15 py-0.5 outline-none cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
              <button
                type="submit"
                className="text-xs font-medium underline underline-offset-4 px-1.5 py-1 cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Daily Reflection & Daily Highlight */}
      {page.template === 'reflection' && (
        <div className="space-y-5">
          <div className="rounded-lg p-3.5 border border-amber-800/20 bg-amber-400/10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
              <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-700" />
              <span>Daily Highlight</span>
            </div>
            <input
              type="text"
              value={page.reflection.highlightLine}
              onChange={(e) =>
                onUpdatePage((p) => ({
                  ...p,
                  reflection: { ...p.reflection, highlightLine: e.target.value },
                }))
              }
              placeholder="Mark the single most meaningful accomplishment today..."
              className={`w-full bg-transparent border-0 outline-none text-xl ${getFontClass(
                preferences.defaultFont
              )}`}
              style={{ color: preferences.defaultInkColor }}
            />
          </div>

          {[
            {
              key: 'accomplished' as const,
              prompt: 'What did I accomplish today?',
            },
            {
              key: 'learned' as const,
              prompt: 'What did I learn today?',
            },
            {
              key: 'improve' as const,
              prompt: 'What could I improve?',
            },
            {
              key: 'tomorrowPriority' as const,
              prompt: "What is tomorrow's priority?",
            },
          ].map((field) => (
            <div key={field.key} className="space-y-1">
              <p className="text-xs uppercase tracking-wider" style={{ color: palette.faintText }}>
                {field.prompt}
              </p>
              <textarea
                rows={2}
                value={page.reflection[field.key]}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    reflection: { ...p.reflection, [field.key]: e.target.value },
                  }))
                }
                placeholder="Write freely on the paper..."
                style={{
                  borderBottom: `1px solid ${lineBorder}`,
                  color: preferences.defaultInkColor,
                }}
                className={`w-full bg-transparent border-0 outline-none resize-none text-xl leading-8 ${getFontClass(
                  preferences.defaultFont
                )}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Handwritten Habit Calendar */}
      {page.template === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs" style={{ color: palette.faintText }}>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CalendarDays className="w-3.5 h-3.5" />
              {calendarDays.year} · Month {String(calendarDays.month).padStart(2, '0')}
            </span>
            <span className="font-mono-tabular">
              30-day consistency: {habitStats.monthlyPercent}% · Total check-ins:{' '}
              {habitStats.totalCompletedAllTime}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono-tabular" style={{ color: palette.faintText }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-14" />;
              const ratio = cell.total > 0 ? cell.done / cell.total : 0;
              const isToday = cell.iso === todayISO;
              return (
                <div
                  key={cell.iso}
                  style={{
                    border: `1px solid ${isToday ? preferences.defaultInkColor : lineBorder}`,
                  }}
                  className="h-14 rounded-md p-1.5 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono-tabular">{cell.day}</span>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {Array.from({ length: Math.min(cell.total, 5) }, (_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            dotIdx < cell.done ? preferences.defaultInkColor : 'rgba(120,110,95,0.2)',
                        }}
                      />
                    ))}
                  </div>
                  {ratio >= 0.8 && (
                    <span className="text-[9px] font-hw-caveat self-end leading-none">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Review */}
      {page.template === 'weekly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b" style={{ borderColor: lineBorder }}>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: palette.faintText }}>
                Weekly Consistency
              </p>
              <p className="font-mono-tabular text-2xl font-semibold mt-0.5">
                {habitStats.weeklyPercent}%
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: palette.faintText }}>
                Completed Sessions
              </p>
              <p className="font-mono-tabular text-2xl font-semibold mt-0.5">
                {habitStats.weeklyCompleted}/{habitStats.weeklyTotal}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: palette.faintText }}>
                Top Streak
              </p>
              <p className="font-mono-tabular text-2xl font-semibold mt-0.5">
                {Math.max(0, ...Object.values(habitStats.perHabit).map((p) => p.currentStreak))}d
              </p>
            </div>
          </div>

          {/* Compact 7-day Habit Matrix */}
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ color: palette.faintText }}>
                  <th className="text-left py-1 font-normal">Habit</th>
                  {weekDays.map((dt) => (
                    <th key={dt} className="text-center py-1 font-mono-tabular font-normal">
                      {dt.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr key={h.id} style={{ borderTop: `1px solid ${lineBorder}` }}>
                    <td className={`py-1.5 pr-2 text-base ${getFontClass(preferences.defaultFont)}`}>
                      {h.name}
                    </td>
                    {weekDays.map((dt) => {
                      const done = Boolean(habitLog[dt]?.[h.id]);
                      return (
                        <td key={dt} className="text-center py-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleHabitToday(h.id, dt)}
                            aria-label={`${h.name} on ${dt}`}
                            className="w-6 h-6 rounded-sm inline-flex items-center justify-center cursor-pointer"
                          >
                            {done ? (
                              <Check className="w-3.5 h-3.5" style={{ color: preferences.defaultInkColor }} />
                            ) : (
                              <span className="text-[10px] opacity-30">·</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {[
            { key: 'bestAchievement' as const, label: 'Best Achievement This Week' },
            { key: 'mainDifficulty' as const, label: 'Main Difficulty Encountered' },
            { key: 'nextWeekPriority' as const, label: 'Next Week’s Anchor Priority' },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <p className="text-xs uppercase tracking-wider" style={{ color: palette.faintText }}>
                {item.label}
              </p>
              <textarea
                rows={2}
                value={page.weeklyReview[item.key]}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    weeklyReview: { ...p.weeklyReview, [item.key]: e.target.value },
                  }))
                }
                style={{
                  borderBottom: `1px solid ${lineBorder}`,
                  color: preferences.defaultInkColor,
                }}
                className={`w-full bg-transparent border-0 outline-none resize-none text-xl leading-8 ${getFontClass(
                  preferences.defaultFont
                )}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Monthly Review */}
      {page.template === 'monthly' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: lineBorder }}>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: palette.faintText }}>
                30-Day Habit Rate
              </p>
              <p className="font-mono-tabular text-2xl font-semibold">
                {habitStats.monthlyPercent}% ({habitStats.monthlyCompleted} check-ins)
              </p>
            </div>
            <div className="flex items-center gap-1 flex-wrap max-w-xs">
              {Array.from({ length: 30 }, (_, idx) => {
                const dt = shiftISODate(todayISO, -(29 - idx));
                const doneCount = habits.filter((h) => habitLog[dt]?.[h.id]).length;
                const intensity = habits.length ? doneCount / habits.length : 0;
                return (
                  <span
                    key={dt}
                    title={`${dt}: ${doneCount}/${habits.length}`}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: preferences.defaultInkColor,
                      opacity: intensity === 0 ? 0.12 : 0.25 + intensity * 0.75,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {[
            { key: 'themeOfMonth' as const, label: 'Theme of the Month' },
            { key: 'milestonesSummary' as const, label: 'Milestones & Breakthroughs' },
            { key: 'lessonsLearned' as const, label: 'Key Lessons Learned' },
            { key: 'nextMonthFocus' as const, label: 'Next Month Direction' },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <p className="text-xs uppercase tracking-wider" style={{ color: palette.faintText }}>
                {item.label}
              </p>
              <textarea
                rows={2}
                value={page.monthlyReview[item.key]}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    monthlyReview: { ...p.monthlyReview, [item.key]: e.target.value },
                  }))
                }
                style={{
                  borderBottom: `1px solid ${lineBorder}`,
                  color: preferences.defaultInkColor,
                }}
                className={`w-full bg-transparent border-0 outline-none resize-none text-xl leading-8 ${getFontClass(
                  preferences.defaultFont
                )}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Personal Goals */}
      {page.template === 'goals' && (
        <div className="space-y-4">
          {page.goals.map((g) => (
            <div
              key={g.id}
              style={{ borderBottom: `1px solid ${lineBorder}` }}
              className="pb-3 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 flex-1">
                <HandwrittenCheckbox
                  checked={g.completed}
                  inkColor={preferences.defaultInkColor}
                  label={`Toggle goal ${g.title}`}
                  onToggle={() =>
                    onUpdatePage((p) => ({
                      ...p,
                      goals: p.goals.map((item) =>
                        item.id === g.id ? { ...item, completed: !item.completed } : item
                      ),
                    }))
                  }
                />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className={`text-xl font-semibold ${getFontClass(preferences.defaultFont)} ${
                        g.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {g.title}
                    </p>
                    <span className="text-xs font-mono-tabular" style={{ color: palette.faintText }}>
                      {g.horizon}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={g.nextStep}
                    onChange={(e) =>
                      onUpdatePage((p) => ({
                        ...p,
                        goals: p.goals.map((item) =>
                          item.id === g.id ? { ...item, nextStep: e.target.value } : item
                        ),
                      }))
                    }
                    placeholder="Next concrete step..."
                    className={`w-full bg-transparent border-0 outline-none text-base ${getFontClass(
                      preferences.defaultFont
                    )}`}
                    style={{ color: palette.faintText }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdatePage((p) => ({ ...p, goals: p.goals.filter((item) => item.id !== g.id) }))
                }
                aria-label={`Delete goal ${g.title}`}
                className="p-1 opacity-55 hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newGoalTitle.trim()) return;
              onUpdatePage((p) => ({
                ...p,
                goals: [
                  ...p.goals,
                  {
                    id: `goal-${Date.now()}`,
                    title: newGoalTitle.trim(),
                    horizon: newGoalHorizon,
                    whyItMatters: '',
                    nextStep: '',
                    completed: false,
                  },
                ],
              }));
              setNewGoalTitle('');
            }}
            style={{ borderBottom: `1px solid ${lineBorder}` }}
            className="flex flex-wrap items-center gap-2 py-2"
          >
            <Plus className="w-4 h-4 opacity-60" />
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="Write a long-term goal..."
              className={`flex-1 min-w-[180px] bg-transparent border-0 outline-none text-lg ${getFontClass(
                preferences.defaultFont
              )}`}
            />
            <input
              type="text"
              value={newGoalHorizon}
              onChange={(e) => setNewGoalHorizon(e.target.value)}
              placeholder="Horizon"
              className="w-28 bg-transparent border-b border-black/15 text-xs outline-none"
            />
            <button type="submit" className="text-xs underline underline-offset-4 cursor-pointer">
              Add Goal
            </button>
          </form>
        </div>
      )}

      {/* Book & Learning Journal */}
      {page.template === 'books' && (
        <div className="space-y-4">
          {page.books.map((book) => (
            <div
              key={book.id}
              style={{ borderBottom: `1px solid ${lineBorder}` }}
              className="pb-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-xl font-semibold ${getFontClass(preferences.defaultFont)}`}>
                    <BookOpen className="w-4 h-4 inline mr-1.5 opacity-60" />
                    {book.title}
                  </p>
                  <p className="text-xs" style={{ color: palette.faintText }}>
                    {book.author} · {book.pagesRead}/{book.totalPages} pages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={book.totalPages}
                    value={book.pagesRead}
                    onChange={(e) =>
                      onUpdatePage((p) => ({
                        ...p,
                        books: p.books.map((b) =>
                          b.id === book.id ? { ...b, pagesRead: Number(e.target.value) || 0 } : b
                        ),
                      }))
                    }
                    aria-label={`Pages read for ${book.title}`}
                    className="w-16 bg-transparent border-b border-black/20 text-xs font-mono-tabular text-center outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePage((p) => ({
                        ...p,
                        books: p.books.filter((b) => b.id !== book.id),
                      }))
                    }
                    aria-label={`Delete book ${book.title}`}
                    className="p-1 opacity-55 hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={book.keyIdeas}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    books: p.books.map((b) =>
                      b.id === book.id ? { ...b, keyIdeas: e.target.value } : b
                    ),
                  }))
                }
                placeholder="Important ideas & reflections..."
                className={`w-full bg-transparent border-0 outline-none resize-none text-lg ${getFontClass(
                  preferences.defaultFont
                )}`}
                style={{ color: preferences.defaultInkColor }}
              />
              <input
                type="text"
                value={book.vocabularyNotes}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    books: p.books.map((b) =>
                      b.id === book.id ? { ...b, vocabularyNotes: e.target.value } : b
                    ),
                  }))
                }
                placeholder="Vocabulary & terms..."
                className={`w-full bg-transparent border-0 outline-none text-base ${getFontClass(
                  preferences.defaultFont
                )}`}
                style={{ color: palette.faintText }}
              />
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBookTitle.trim()) return;
              onUpdatePage((p) => ({
                ...p,
                books: [
                  ...p.books,
                  {
                    id: `book-${Date.now()}`,
                    title: newBookTitle.trim(),
                    author: newBookAuthor.trim() || 'Author',
                    pagesRead: 0,
                    totalPages: 250,
                    keyIdeas: '',
                    vocabularyNotes: '',
                  },
                ],
              }));
              setNewBookTitle('');
              setNewBookAuthor('');
            }}
            style={{ borderBottom: `1px solid ${lineBorder}` }}
            className="flex flex-wrap items-center gap-2 py-2"
          >
            <Plus className="w-4 h-4 opacity-60" />
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder="Book title..."
              className={`flex-1 min-w-[160px] bg-transparent border-0 outline-none text-lg ${getFontClass(
                preferences.defaultFont
              )}`}
            />
            <input
              type="text"
              value={newBookAuthor}
              onChange={(e) => setNewBookAuthor(e.target.value)}
              placeholder="Author"
              className="w-32 bg-transparent border-b border-black/15 text-xs outline-none"
            />
            <button type="submit" className="text-xs underline underline-offset-4 cursor-pointer">
              Add Book
            </button>
          </form>
        </div>
      )}

      {/* Memory Pages */}
      {page.template === 'memories' && (
        <div className="space-y-4">
          {page.memories.map((mem) => (
            <div
              key={mem.id}
              style={{ borderBottom: `1px solid ${lineBorder}` }}
              className="pb-4 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-mono-tabular" style={{ color: palette.faintText }}>
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {mem.dateLabel} · {mem.location}
                  </p>
                  <h4 className={`text-2xl font-semibold ${getFontClass(preferences.defaultFont)}`}>
                    {mem.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePage((p) => ({
                      ...p,
                      memories: p.memories.filter((m) => m.id !== mem.id),
                    }))
                  }
                  aria-label={`Delete memory ${mem.title}`}
                  className="p-1 opacity-55 hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={3}
                value={mem.story}
                onChange={(e) =>
                  onUpdatePage((p) => ({
                    ...p,
                    memories: p.memories.map((m) =>
                      m.id === mem.id ? { ...m, story: e.target.value } : m
                    ),
                  }))
                }
                className={`w-full bg-transparent border-0 outline-none resize-none text-lg leading-7 ${getFontClass(
                  preferences.defaultFont
                )}`}
                style={{ color: preferences.defaultInkColor }}
              />
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newMemoryTitle.trim()) return;
              onUpdatePage((p) => ({
                ...p,
                memories: [
                  ...p.memories,
                  {
                    id: `mem-${Date.now()}`,
                    dateLabel: todayISO,
                    location: newMemoryLocation.trim() || 'Quiet Desk',
                    title: newMemoryTitle.trim(),
                    story: newMemoryStory.trim(),
                  },
                ],
              }));
              setNewMemoryTitle('');
              setNewMemoryLocation('');
              setNewMemoryStory('');
            }}
            className="space-y-2 pt-2"
          >
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newMemoryTitle}
                onChange={(e) => setNewMemoryTitle(e.target.value)}
                placeholder="Preserve a meaningful moment..."
                className={`flex-1 min-w-[180px] bg-transparent border-b border-black/15 outline-none text-lg ${getFontClass(
                  preferences.defaultFont
                )}`}
              />
              <input
                type="text"
                value={newMemoryLocation}
                onChange={(e) => setNewMemoryLocation(e.target.value)}
                placeholder="Place"
                className="w-36 bg-transparent border-b border-black/15 text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMemoryStory}
                onChange={(e) => setNewMemoryStory(e.target.value)}
                placeholder="Write what happened..."
                className={`flex-1 bg-transparent border-b border-black/15 outline-none text-base ${getFontClass(
                  preferences.defaultFont
                )}`}
              />
              <button type="submit" className="text-xs underline underline-offset-4 cursor-pointer">
                Save Memory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attached Sticky Notes on this Page */}
      {stickyNotes.map((note) => (
        <div
          key={note.id}
          style={
            {
              '--sx': `${note.xPct}%`,
              '--sy': `${note.yPct}%`,
              backgroundColor: STICKY_COLORS[note.color],
              transform: `rotate(${note.rotationDeg}deg)`,
            } as React.CSSProperties
          }
          className="relative sm:absolute sm:left-[var(--sx)] sm:top-[var(--sy)] z-30 w-full sm:w-48 p-3 rounded-sm shadow-lg border border-black/10 text-[#26211A] space-y-1.5 mt-4 sm:mt-0"
        >
          <div
            onPointerDown={(e) => {
              const container = pageContainerRef.current;
              if (!container || window.innerWidth < 640) return;
              e.preventDefault();
              const rect = container.getBoundingClientRect();
              const startX = e.clientX;
              const startY = e.clientY;
              const initXPct = note.xPct;
              const initYPct = note.yPct;
              const onMove = (ev: PointerEvent) => {
                const dxPct = ((ev.clientX - startX) / Math.max(1, rect.width)) * 100;
                const dyPct = ((ev.clientY - startY) / Math.max(1, rect.height)) * 100;
                onUpdateStickyNote(note.id, {
                  xPct: Math.max(2, Math.min(72, Math.round(initXPct + dxPct))),
                  yPct: Math.max(4, Math.min(82, Math.round(initYPct + dyPct))),
                });
              };
              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
            title="Drag to reposition sticky note"
            className="flex items-center justify-between gap-1 sm:cursor-grab sm:active:cursor-grabbing"
          >
            <div className="flex items-center gap-1">
              {(['canary', 'sage', 'blush', 'kraft'] as const).map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onUpdateStickyNote(note.id, { color: clr })}
                  aria-label={`Sticky note color ${clr}`}
                  className="w-2.5 h-2.5 rounded-full border border-black/20 cursor-pointer"
                  style={{ backgroundColor: STICKY_COLORS[clr] }}
                />
              ))}
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDeleteStickyNote(note.id)}
              aria-label="Remove sticky note"
              className="opacity-55 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <textarea
            rows={3}
            value={note.text}
            onChange={(e) => onUpdateStickyNote(note.id, { text: e.target.value })}
            placeholder="Quick sticky note..."
            className={`w-full bg-transparent border-0 outline-none resize-none text-base leading-5 ${getFontClass(
              preferences.defaultFont
            )}`}
          />
        </div>
      ))}
    </div>
  );
};
