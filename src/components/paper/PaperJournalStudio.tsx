import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Bookmark,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Eraser,
  FilePlus2,
  Highlighter,
  Layers,
  Paperclip,
  PenTool,
  Pencil,
  Redo2,
  RotateCcw,
  Scissors,
  Search,
  SlidersHorizontal,
  StickyNote,
  Type,
  Underline,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  DeskSurfaceTheme,
  HabitDefinition,
  HabitPriority,
  HandwritingFont,
  JournalPage,
  JournalPreferences,
  LightingTheme,
  NotebookCoverStyle,
  PageTemplateType,
  PaperColorPreset,
  PaperJournalState,
  TornPaperObject,
  WritingInstrument,
} from '../../types/journal';
import {
  createBlankPage,
  createDefaultJournalState,
  DEFAULT_PREFERENCES,
  nextFoldMode,
  restorePageFromArchive,
  searchJournalContent,
} from '../../utils/journalEngine';
import { paperAudio } from '../../utils/paperAudio';
import {
  ClosedNotebookCover,
  COVER_STYLES,
  PaperMaterialDefs,
  PhysicalBookFrame,
} from './PaperNotebookPrimitives';
import { InkCanvasLayer } from './InkCanvasLayer';
import {
  DESK_THEMES,
  DeskEnvironmentLayer,
  LIGHTING_OVERLAYS,
} from './DeskEnvironmentAndPhysics';
import { PaperPageViews } from './PaperPageViews';
import { HabitsTracker2View } from './HabitsTracker2View';
import {
  getLocalTodayISO,
  migrateJournalStateToHabitsTracker,
  syncHabitsTrackerIntoJournalState,
  type HabitsTrackerState,
} from '../../utils/habitTrackerEngine';

const STORAGE_PREFIX = 'gui_paper_journal_v1_';
const HABITS_V2_STORAGE_PREFIX = 'gui_habits_tracker_v2_';

const INK_SWATCHES = [
  { label: 'Midnight Navy', hex: '#1B2E4B' },
  { label: 'Carbon Black', hex: '#1F1E1C' },
  { label: 'Sepia Brown', hex: '#543828' },
  { label: 'Forest Ink', hex: '#1E4631' },
  { label: 'Burgundy', hex: '#7A232D' },
  { label: 'Slate Graphite', hex: '#4B5058' },
];

const TEMPLATE_LABELS: Array<{ id: PageTemplateType; label: string }> = [
  { id: 'daily', label: 'Daily & Habits' },
  { id: 'reflection', label: 'Reflection' },
  { id: 'calendar', label: 'Habit Calendar' },
  { id: 'weekly', label: 'Weekly Review' },
  { id: 'monthly', label: 'Monthly Review' },
  { id: 'goals', label: 'Personal Goals' },
  { id: 'books', label: 'Reading & Notes' },
  { id: 'memories', label: 'Memory Pages' },
];

const INSTRUMENTS: Array<{ id: WritingInstrument; label: string }> = [
  { id: 'fountain', label: 'Fountain Pen' },
  { id: 'fine-tip', label: 'Fine-Tip' },
  { id: 'ballpoint', label: 'Ballpoint' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'colored', label: 'Colored Pen' },
];

const FONTS: Array<{ id: HandwritingFont; label: string }> = [
  { id: 'caveat', label: 'Caveat Script' },
  { id: 'kalam', label: 'Kalam Neat' },
  { id: 'patrick', label: 'Patrick Print' },
  { id: 'bad-script', label: 'Bad Script (Cyrillic)' },
];

export const PaperJournalStudio: React.FC = () => {
  const { firebaseUser, profile } = useApp();
  const uid = firebaseUser?.uid || profile.uid || 'guest-scholar';
  const storageKey = `${STORAGE_PREFIX}${uid}`;
  const habitsV2StorageKey = `${HABITS_V2_STORAGE_PREFIX}${uid}`;
  const todayISO = useMemo(() => getLocalTodayISO(), []);

  const [studioMode, setStudioMode] = useState<'habits' | 'notebook'>('habits');

  const [journal, setJournal] = useState<PaperJournalState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as PaperJournalState;
          if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback below
      }
    }
    return createDefaultJournalState(todayISO);
  });

  const [trackerState, setTrackerState] = useState<HabitsTrackerState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawV2 = localStorage.getItem(habitsV2StorageKey);
        if (rawV2) {
          const parsedV2 = JSON.parse(rawV2) as HabitsTrackerState;
          if (parsedV2 && Array.isArray(parsedV2.habits) && Array.isArray(parsedV2.completions)) {
            return parsedV2;
          }
        }
      } catch {
        // fallback below
      }
    }
    if (
      journal.habitsV2 &&
      Array.isArray(journal.habitsV2.habits) &&
      Array.isArray(journal.habitsV2.completions)
    ) {
      return journal.habitsV2 as unknown as HabitsTrackerState;
    }
    return migrateJournalStateToHabitsTracker(journal, todayISO);
  });

  // Reload user-specific state if uid changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawV2 = localStorage.getItem(habitsV2StorageKey);
      if (rawV2) {
        const parsedV2 = JSON.parse(rawV2) as HabitsTrackerState;
        if (parsedV2 && Array.isArray(parsedV2.habits) && Array.isArray(parsedV2.completions)) {
          setTrackerState(parsedV2);
          return;
        }
      }
      const rawJournal = localStorage.getItem(storageKey);
      if (rawJournal) {
        const parsedJournal = JSON.parse(rawJournal) as PaperJournalState;
        if (parsedJournal && Array.isArray(parsedJournal.pages)) {
          setJournal(parsedJournal);
          if (
            parsedJournal.habitsV2 &&
            Array.isArray(parsedJournal.habitsV2.habits) &&
            Array.isArray(parsedJournal.habitsV2.completions)
          ) {
            setTrackerState(parsedJournal.habitsV2 as unknown as HabitsTrackerState);
          } else {
            setTrackerState(migrateJournalStateToHabitsTracker(parsedJournal, todayISO));
          }
        }
      }
    } catch {
      // ignore storage read error
    }
  }, [uid, storageKey, habitsV2StorageKey, todayISO]);

  const [undoStack, setUndoStack] = useState<PaperJournalState[]>([]);
  const [redoStack, setRedoStack] = useState<PaperJournalState[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const [activeTool, setActiveTool] = useState<'type' | 'draw' | 'erase'>('type');
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [turnAnim, setTurnAnim] = useState<'none' | 'next' | 'prev'>('none');
  const [tearProgress, setTearProgress] = useState(0);

  const [openDrawer, setOpenDrawer] = useState<
    'none' | 'pages' | 'search' | 'archive' | 'customize'
  >('none');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync audio synthesizer settings
  useEffect(() => {
    paperAudio.setConfig(
      journal.preferences.soundEnabled,
      journal.preferences.soundVolume
    );
  }, [journal.preferences.soundEnabled, journal.preferences.soundVolume]);

  // Helper to build auth headers for Firebase or E2E authenticated session
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      } catch {
        return null;
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const rawE2E = sessionStorage.getItem('gui_e2e_google_user_v1');
        if (rawE2E) {
          const parsed = JSON.parse(rawE2E) as {
            uid?: string;
            email?: string;
            displayName?: string;
            photoURL?: string;
          };
          if (parsed?.uid) {
            return {
              'x-e2e-google-user': JSON.stringify({
                uid: parsed.uid,
                email: parsed.email || '',
                name: parsed.displayName || '',
                picture: parsed.photoURL || '',
              }),
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  }, [firebaseUser]);

  // Load remote PostgreSQL state when signed in
  useEffect(() => {
    let active = true;
    (async () => {
      const headers = await getAuthHeaders();
      if (!headers) return;
      try {
        const res = await fetch('/api/user/journal', { headers });
        if (!res.ok || !active) return;
        const data = (await res.json()) as { state?: PaperJournalState | null };
        if (data.state && Array.isArray(data.state.pages) && data.state.pages.length > 0) {
          setJournal(data.state);
          if (
            data.state.habitsV2 &&
            Array.isArray(data.state.habitsV2.habits) &&
            Array.isArray(data.state.habitsV2.completions)
          ) {
            setTrackerState(data.state.habitsV2 as unknown as HabitsTrackerState);
          }
        }
      } catch {
        // keep local cache on network error
      }
    })();
    return () => {
      active = false;
    };
  }, [getAuthHeaders]);

  // Auto-save to localStorage + debounced PostgreSQL sync
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(storageKey, JSON.stringify(journal));
      localStorage.setItem(habitsV2StorageKey, JSON.stringify(trackerState));
    } catch {
      // ignore quota error
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      const headers = await getAuthHeaders();
      if (headers) {
        try {
          await fetch('/api/user/journal', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: JSON.stringify({
              state: {
                ...journal,
                habitsV2: trackerState,
              },
            }),
          });
        } catch {
          // localStorage retains changes safely
        }
      }
      setSaveStatus('saved');
    }, 350);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [journal, trackerState, storageKey, habitsV2StorageKey, getAuthHeaders]);

  const handleUpdateTrackerState = useCallback(
    (updater: (prev: HabitsTrackerState) => HabitsTrackerState) => {
      setTrackerState((prevTracker) => {
        const nextTracker = updater(prevTracker);
        if (nextTracker === prevTracker) return prevTracker;
        try {
          localStorage.setItem(habitsV2StorageKey, JSON.stringify(nextTracker));
        } catch {
          // ignore
        }
        setJournal((prevJournal) => {
          const synced = syncHabitsTrackerIntoJournalState(prevJournal, nextTracker);
          const withV2: PaperJournalState = {
            ...synced,
            habitsV2: nextTracker as unknown as PaperJournalState['habitsV2'],
          };
          try {
            localStorage.setItem(storageKey, JSON.stringify(withV2));
          } catch {
            // ignore
          }
          return withV2;
        });
        return nextTracker;
      });
    },
    [habitsV2StorageKey, storageKey]
  );

  const applyJournalMutation = useCallback(
    (updater: (prev: PaperJournalState) => PaperJournalState, recordHistory = true) => {
      setJournal((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        if (recordHistory) {
          setUndoStack((u) => [...u.slice(-24), prev]);
          setRedoStack([]);
        }
        return { ...next, updatedAt: new Date().toISOString() };
      });
    },
    []
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, journal]);
    setJournal(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, journal]);
    setJournal(next);
  };

  const visiblePages = useMemo(
    () => journal.pages.filter((p) => !p.isTornOut && !p.isArchived),
    [journal.pages]
  );

  const activePageIndex = useMemo(() => {
    const idx = visiblePages.findIndex((p) => p.id === journal.activePageId);
    return idx >= 0 ? idx : 0;
  }, [visiblePages, journal.activePageId]);

  const activePage = visiblePages[activePageIndex] || visiblePages[0];

  const turnToPageIndex = useCallback(
    (nextIdx: number, direction: 'next' | 'prev') => {
      const target = visiblePages[nextIdx];
      if (!target) return;
      paperAudio.playPageTurn();
      setTurnAnim(direction);
      setTimeout(() => setTurnAnim('none'), 350);
      applyJournalMutation((prev) => ({ ...prev, activePageId: target.id }), false);
    },
    [visiblePages, applyJournalMutation]
  );

  // Keyboard page navigation (Alt+Left / Alt+Right) & Escape drawer close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDrawer('none');
      } else if (e.altKey && e.key === 'ArrowRight') {
        if (activePageIndex < visiblePages.length - 1) {
          turnToPageIndex(activePageIndex + 1, 'next');
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        if (activePageIndex > 0) {
          turnToPageIndex(activePageIndex - 1, 'prev');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePageIndex, visiblePages.length, turnToPageIndex]);

  const updatePreferences = (patch: Partial<JournalPreferences>) => {
    applyJournalMutation((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  };

  const updateActivePage = (updater: (p: JournalPage) => JournalPage) => {
    if (!activePage) return;
    applyJournalMutation((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === activePage.id ? updater(p) : p)),
    }));
  };

  const handleAddPage = (template: PageTemplateType = 'daily') => {
    const nextNum = journal.pages.length + 1;
    const created = createBlankPage(nextNum, todayISO, template);
    paperAudio.playPageTurn();
    setTurnAnim('next');
    setTimeout(() => setTurnAnim('none'), 350);
    applyJournalMutation((prev) => ({
      ...prev,
      pages: [...prev.pages, created],
      activePageId: created.id,
    }));
  };

  const executeTearPageOut = useCallback(
    (pageToTear: JournalPage) => {
      paperAudio.playTear();
      const nonEmptyLine = pageToTear.lines.find((l) => l.text.trim())?.text || '';
      const tornObj: TornPaperObject = {
        id: `torn-${Date.now()}`,
        sourcePageId: pageToTear.id,
        title: pageToTear.title,
        snippet: nonEmptyLine,
        tearKind: 'full-page',
        x: 220 + Math.round(Math.random() * 80),
        y: 240 + Math.round(Math.random() * 60),
        vx: 0,
        vy: 0,
        rotation: -6 + Math.round(Math.random() * 12),
        angularVelocity: 0,
        crumpleStage: 0,
        foldMode: 'none',
        state: 'fully_torn',
        inWastebasket: false,
        createdAt: new Date().toISOString(),
      };

      applyJournalMutation((prev) => {
        const remaining = prev.pages.filter(
          (p) => p.id !== pageToTear.id && !p.isTornOut && !p.isArchived
        );
        let updatedPages = prev.pages.map((p) =>
          p.id === pageToTear.id
            ? { ...p, isTornOut: true, isArchived: true, archivedAt: new Date().toISOString() }
            : p
        );
        let nextActiveId = remaining[0]?.id;
        if (!nextActiveId) {
          const fresh = createBlankPage(prev.pages.length + 1, todayISO, 'daily');
          updatedPages = [...updatedPages, fresh];
          nextActiveId = fresh.id;
        }
        return {
          ...prev,
          pages: updatedPages,
          activePageId: nextActiveId,
          tornObjects: [...prev.tornObjects, tornObj],
        };
      });
    },
    [applyJournalMutation, todayISO]
  );

  // Drag-from-top-edge progressive tear gesture
  const handleStartTearDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePage) return;
    e.preventDefault();
    const startY = e.clientY;
    let maxProgress = 0;

    const onMove = (ev: PointerEvent) => {
      const dy = Math.max(0, ev.clientY - startY);
      const prog = Math.min(1, dy / 145);
      maxProgress = prog;
      setTearProgress(prog);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (maxProgress >= 0.62) {
        executeTearPageOut(activePage);
      }
      setTearProgress(0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const activeLine = activePage?.lines.find((l) => l.id === activeLineId) || null;

  const toggleActiveLineStyle = (
    prop: 'isHeading' | 'underline' | 'strikethrough' | 'highlighted'
  ) => {
    if (!activeLine) return;
    updateActivePage((p) => ({
      ...p,
      lines: p.lines.map((l) => (l.id === activeLine.id ? { ...l, [prop]: !l[prop] } : l)),
    }));
  };

  const searchHits = useMemo(
    () => searchJournalContent(journal.pages, journal.stickyNotes, searchQuery),
    [journal.pages, journal.stickyNotes, searchQuery]
  );

  const archivedOrTornPages = useMemo(
    () => journal.pages.filter((p) => p.isTornOut || p.isArchived),
    [journal.pages]
  );

  if (studioMode === 'habits') {
    return (
      <HabitsTracker2View
        trackerState={trackerState}
        onUpdateTrackerState={handleUpdateTrackerState}
        todayISO={todayISO}
        saveStatus={saveStatus}
        onOpenNotebookMode={() => setStudioMode('notebook')}
      />
    );
  }

  return (
    <div className="paper-journal-surface space-y-4">
      <PaperMaterialDefs />

      {/* Discreet Top Stationery Bar */}
      <div className="surface-card rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Switch back to Habits Tracker 2.0 */}
          <button
            type="button"
            data-testid="switch-to-habits-btn"
            onClick={() => setStudioMode('habits')}
            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <span>← Habits Tracker</span>
          </button>

          {/* Open / Close Cover */}
          <button
            type="button"
            onClick={() =>
              applyJournalMutation((prev) => ({ ...prev, notebookOpen: !prev.notebookOpen }), false)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>{journal.notebookOpen ? 'Close Cover' : 'Open Notebook'}</span>
          </button>

          {/* Write vs Freehand Draw vs Eraser */}
          <div
            role="group"
            aria-label="Writing mode"
            className="flex items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
          >
            <button
              type="button"
              onClick={() => setActiveTool('type')}
              aria-pressed={activeTool === 'type'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                activeTool === 'type' ? 'bg-[var(--bg-elevated)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('draw')}
              aria-pressed={activeTool === 'draw'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                activeTool === 'draw' ? 'bg-[var(--bg-elevated)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('erase')}
              aria-pressed={activeTool === 'erase'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                activeTool === 'erase' ? 'bg-[var(--bg-elevated)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </button>
          </div>

          {/* Instrument & Ink Selectors */}
          <select
            aria-label="Writing instrument"
            value={journal.preferences.defaultInstrument}
            onChange={(e) => {
              const inst = e.target.value as WritingInstrument;
              updatePreferences({ defaultInstrument: inst });
              if (activeLine) {
                updateActivePage((p) => ({
                  ...p,
                  lines: p.lines.map((l) =>
                    l.id === activeLine.id ? { ...l, instrument: inst } : l
                  ),
                }));
              }
            }}
            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Handwriting font"
            value={journal.preferences.defaultFont}
            onChange={(e) => {
              const font = e.target.value as HandwritingFont;
              updatePreferences({ defaultFont: font });
              if (activeLine) {
                updateActivePage((p) => ({
                  ...p,
                  lines: p.lines.map((l) => (l.id === activeLine.id ? { ...l, font } : l)),
                }));
              }
            }}
            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs max-w-[135px] sm:max-w-none"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Compact Ink Color Dots */}
          <div className="flex items-center gap-1 px-1.5">
            {INK_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                title={swatch.label}
                aria-label={`Ink color ${swatch.label}`}
                onClick={() => {
                  updatePreferences({ defaultInkColor: swatch.hex });
                  if (activeLine) {
                    updateActivePage((p) => ({
                      ...p,
                      lines: p.lines.map((l) =>
                        l.id === activeLine.id ? { ...l, inkColor: swatch.hex } : l
                      ),
                    }));
                  }
                }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  journal.preferences.defaultInkColor === swatch.hex
                    ? 'scale-125 ring-2 ring-[var(--accent-primary)]'
                    : 'border-black/25'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>

          {/* Line formatting controls */}
          {activeTool === 'type' && activeLine && (
            <div className="flex items-center gap-0.5 border-l border-[var(--border-hairline)] pl-2">
              <button
                type="button"
                onClick={() => toggleActiveLineStyle('isHeading')}
                title="Handwritten Heading"
                aria-label="Toggle handwritten heading"
                className={`p-1.5 rounded cursor-pointer ${
                  activeLine.isHeading ? 'bg-[var(--bg-surface)] font-bold' : ''
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleActiveLineStyle('underline')}
                title="Underline"
                aria-label="Toggle underline"
                className={`p-1.5 rounded cursor-pointer ${
                  activeLine.underline ? 'bg-[var(--bg-surface)]' : ''
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleActiveLineStyle('highlighted')}
                title="Highlight line"
                aria-label="Toggle highlight"
                className={`p-1.5 rounded cursor-pointer ${
                  activeLine.highlighted ? 'bg-amber-200/70 text-black' : ''
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Utility Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            aria-label="Undo"
            title="Undo"
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] disabled:opacity-35 hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            aria-label="Redo"
            title="Redo"
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] disabled:opacity-35 hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {activePage && (
            <>
              <button
                type="button"
                onClick={() => {
                  paperAudio.playInkClick();
                  updateActivePage((p) => ({ ...p, bookmarked: !p.bookmarked }));
                }}
                aria-label="Toggle ribbon bookmark"
                title="Toggle ribbon bookmark"
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  activePage.bookmarked
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-hairline)]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  paperAudio.playInkClick();
                  updateActivePage((p) => ({ ...p, paperClipped: !p.paperClipped }));
                }}
                aria-label="Toggle paper clip"
                title="Toggle metallic paper clip"
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  activePage.paperClipped
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-hairline)]'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activePage) return;
                  applyJournalMutation((prev) => ({
                    ...prev,
                    stickyNotes: [
                      ...prev.stickyNotes,
                      {
                        id: `sticky-${Date.now()}`,
                        pageId: activePage.id,
                        xPct: 68,
                        yPct: 48 + (prev.stickyNotes.length % 3) * 10,
                        color: 'canary',
                        text: '',
                        rotationDeg: -2 + (prev.stickyNotes.length % 4),
                      },
                    ],
                  }));
                }}
                aria-label="Attach sticky note"
                title="Attach sticky note"
                className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeTearPageOut(activePage)}
                aria-label="Tear out current page"
                title="Tear out page onto desk"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] px-2.5 py-1.5 text-xs hover:bg-[var(--bg-surface)] cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tear Page</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpenDrawer((d) => (d === 'search' ? 'none' : 'search'))}
            aria-label="Search notebook"
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpenDrawer((d) => (d === 'archive' ? 'none' : 'archive'))}
            aria-label="Open archive and torn recovery"
            title="Archive & Torn Pages"
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpenDrawer((d) => (d === 'customize' ? 'none' : 'customize'))}
            aria-label="Customize notebook and desk"
            title="Personalize Notebook"
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              updatePreferences({ soundEnabled: !journal.preferences.soundEnabled })
            }
            aria-label={journal.preferences.soundEnabled ? 'Mute paper sounds' : 'Enable paper sounds'}
            title={journal.preferences.soundEnabled ? 'Sound On' : 'Sound Off (Muted)'}
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            {journal.preferences.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
          </button>

          <span className="text-[11px] font-mono-tabular text-[var(--text-muted)] pl-1">
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        </div>
      </div>

      {/* Discreet Page Navigation & Template Strip */}
      {journal.notebookOpen && activePage && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePageIndex <= 0}
              onClick={() => turnToPageIndex(activePageIndex - 1, 'prev')}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenDrawer((d) => (d === 'pages' ? 'none' : 'pages'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-mono-tabular hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                Page {activePageIndex + 1} / {visiblePages.length}
              </span>
            </button>

            <button
              type="button"
              disabled={activePageIndex >= visiblePages.length - 1}
              onClick={() => turnToPageIndex(activePageIndex + 1, 'next')}
              aria-label="Next page"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium disabled:opacity-35 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Current page spread type"
              value={activePage.template}
              onChange={(e) =>
                updateActivePage((p) => ({
                  ...p,
                  template: e.target.value as PageTemplateType,
                }))
              }
              className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium"
            >
              {TEMPLATE_LABELS.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  Spread: {tpl.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddPage(activePage.template)}
              className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New Page</span>
            </button>
          </div>
        </div>
      )}

      {/* Contextual Support Drawers (Pages Index, Search, Archive & Recovery, Personalization) */}
      {openDrawer !== 'none' && (
        <div className="surface-card rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
            <h2 className="font-display text-xl font-semibold">
              {openDrawer === 'pages'
                ? 'Notebook Pages & Bookmarks'
                : openDrawer === 'search'
                ? 'Search Handwritten Pages'
                : openDrawer === 'archive'
                ? 'Archive & Torn Page Recovery'
                : 'Stationery & Desk Personalization'}
            </h2>
            <button
              type="button"
              onClick={() => setOpenDrawer('none')}
              aria-label="Close panel"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {openDrawer === 'pages' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {visiblePages.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    turnToPageIndex(idx, idx > activePageIndex ? 'next' : 'prev');
                    setOpenDrawer('none');
                  }}
                  className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    p.id === activePage?.id
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-surface)]'
                      : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[var(--text-muted)]">
                    <span>p. {idx + 1}</span>
                    {p.bookmarked && <Bookmark className="w-3 h-3 text-rose-700" />}
                  </div>
                  <p className="font-hw-caveat text-lg font-semibold truncate mt-1">{p.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)] capitalize">{p.template}</p>
                </button>
              ))}
            </div>
          )}

          {openDrawer === 'search' && (
            <div className="space-y-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handwritten entries, habits, books, or memories..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm"
              />
              {searchQuery.trim() && (
                <div className="divide-y divide-[var(--border-hairline)]">
                  {searchHits.length === 0 ? (
                    <p className="py-3 text-xs text-[var(--text-muted)]">No matching handwritten text found.</p>
                  ) : (
                    searchHits.map((hit) => (
                      <button
                        key={hit.pageId}
                        type="button"
                        onClick={() => {
                          applyJournalMutation(
                            (prev) => ({ ...prev, activePageId: hit.pageId, notebookOpen: true }),
                            false
                          );
                          setOpenDrawer('none');
                        }}
                        className="w-full py-2.5 text-left hover:bg-[var(--bg-surface)] px-2 rounded-lg cursor-pointer"
                      >
                        <p className="text-sm font-semibold">
                          {hit.title}{' '}
                          <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                            · {hit.dateISO}
                          </span>
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{hit.excerpt}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {openDrawer === 'archive' && (
            <div className="space-y-3">
              {archivedOrTornPages.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No torn or archived pages yet. Grab the top edge of any page and pull downward—or click Tear Page—to safely test tearing, crumpling, and throwing into the wastebasket.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-hairline)]">
                  {archivedOrTornPages.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-sm">{p.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {p.dateISO} · {p.lines.filter((l) => l.text.trim()).length} written lines ·{' '}
                          {p.strokes.length} ink strokes
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          paperAudio.playPageTurn();
                          applyJournalMutation((prev) => restorePageFromArchive(prev, p.id));
                          setOpenDrawer('none');
                        }}
                        className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore to Notebook</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {openDrawer === 'customize' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">Notebook Cover</label>
                <select
                  value={journal.preferences.coverStyle}
                  onChange={(e) =>
                    updatePreferences({ coverStyle: e.target.value as NotebookCoverStyle })
                  }
                  className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2"
                >
                  {Object.entries(COVER_STYLES).map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">Paper Tone</label>
                <select
                  value={journal.preferences.paperColor}
                  onChange={(e) =>
                    updatePreferences({ paperColor: e.target.value as PaperColorPreset })
                  }
                  className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2"
                >
                  <option value="warm-ivory">Warm Ivory</option>
                  <option value="natural-cream">Natural Cream</option>
                  <option value="aged-parchment">Aged Parchment</option>
                  <option value="cool-cotton">Cool Cotton</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">Line Ruling & Spacing</label>
                <div className="flex gap-2">
                  <select
                    value={journal.preferences.lineColor}
                    onChange={(e) =>
                      updatePreferences({
                        lineColor: e.target.value as JournalPreferences['lineColor'],
                      })
                    }
                    className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-2"
                  >
                    <option value="slate-blue">Slate Blue</option>
                    <option value="sepia">Warm Sepia</option>
                    <option value="graphite">Graphite</option>
                    <option value="sage">Sage</option>
                  </select>
                  <select
                    value={journal.preferences.lineSpacing}
                    onChange={(e) =>
                      updatePreferences({
                        lineSpacing: e.target.value as JournalPreferences['lineSpacing'],
                      })
                    }
                    className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-2"
                  >
                    <option value="compact">Compact</option>
                    <option value="classic">Classic</option>
                    <option value="relaxed">Relaxed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">Desk & Lighting</label>
                <div className="flex gap-2">
                  <select
                    value={journal.preferences.deskTheme}
                    onChange={(e) =>
                      updatePreferences({ deskTheme: e.target.value as DeskSurfaceTheme })
                    }
                    className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-2"
                  >
                    {Object.entries(DESK_THEMES).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={journal.preferences.lightingTheme}
                    onChange={(e) =>
                      updatePreferences({ lightingTheme: e.target.value as LightingTheme })
                    }
                    className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-2"
                  >
                    {Object.entries(LIGHTING_OVERLAYS).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">Margin Style</label>
                <select
                  value={journal.preferences.marginStyle}
                  onChange={(e) =>
                    updatePreferences({
                      marginStyle: e.target.value as JournalPreferences['marginStyle'],
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-2"
                >
                  <option value="double-crimson">Double Crimson</option>
                  <option value="single-amber">Single Amber</option>
                  <option value="subtle-rule">Subtle Rule</option>
                  <option value="none">No Margin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--text-muted)] block">
                  Sound Volume ({Math.round(journal.preferences.soundVolume * 100)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={journal.preferences.soundVolume}
                  onChange={(e) =>
                    updatePreferences({ soundVolume: Number(e.target.value) })
                  }
                  className="w-full accent-[var(--accent-primary)]"
                />
              </div>

              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={journal.preferences.showDeskObjects}
                    onChange={(e) =>
                      updatePreferences({ showDeskObjects: e.target.checked })
                    }
                  />
                  <span>Show desk stationery objects</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => updatePreferences(DEFAULT_PREFERENCES)}
                  className="w-full rounded-lg border border-[var(--border-hairline)] py-2 font-medium hover:bg-[var(--bg-surface)] cursor-pointer"
                >
                  Restore Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Physical Desk Scene + Physical Notebook Centerpiece */}
      <DeskEnvironmentLayer
        deskTheme={journal.preferences.deskTheme}
        lightingTheme={journal.preferences.lightingTheme}
        showDeskObjects={journal.preferences.showDeskObjects}
        activeTool={activeTool}
        instrument={journal.preferences.defaultInstrument}
        tornObjects={journal.tornObjects}
        onSelectInstrument={(inst, mode) => {
          updatePreferences({ defaultInstrument: inst });
          if (mode) setActiveTool(mode);
        }}
        onUpdateTornObjects={(updater) =>
          applyJournalMutation((prev) => ({
            ...prev,
            tornObjects: updater(prev.tornObjects),
          }), false)
        }
        onRestoreTornPage={(pageId) => {
          paperAudio.playPageTurn();
          applyJournalMutation((prev) => restorePageFromArchive(prev, pageId));
        }}
        onOpenArchiveDrawer={() => setOpenDrawer('archive')}
      >
        {!journal.notebookOpen || !activePage ? (
          <ClosedNotebookCover
            preferences={journal.preferences}
            pageCount={visiblePages.length}
            onOpen={() => {
              paperAudio.playPageTurn();
              applyJournalMutation((prev) => ({ ...prev, notebookOpen: true }), false);
            }}
          />
        ) : (
          <PhysicalBookFrame
            preferences={journal.preferences}
            pageNumber={activePageIndex + 1}
            totalPages={visiblePages.length}
            bookmarked={activePage.bookmarked}
            paperClipped={activePage.paperClipped}
            foldMode={activePage.foldMode}
            turnAnimation={turnAnim}
            tearProgress={tearProgress}
            onCornerNext={() => {
              if (activePageIndex < visiblePages.length - 1) {
                turnToPageIndex(activePageIndex + 1, 'next');
              } else {
                handleAddPage('daily');
              }
            }}
            onStartTearDrag={handleStartTearDrag}
            onToggleFoldCorner={() => {
              paperAudio.playFoldOrCrumple(1);
              updateActivePage((p) => ({ ...p, foldMode: nextFoldMode(p.foldMode) }));
            }}
          >
            {/* Freehand Digital Ink Layer Over Paper */}
            <InkCanvasLayer
              activeTool={activeTool}
              instrument={journal.preferences.defaultInstrument}
              inkColor={journal.preferences.defaultInkColor}
              strokes={activePage.strokes}
              onChangeStrokes={(nextStrokes) =>
                updateActivePage((p) => ({ ...p, strokes: nextStrokes }))
              }
            />

            {/* Direct-on-Paper Content & Habits */}
            <PaperPageViews
              page={activePage}
              preferences={journal.preferences}
              activeTool={activeTool}
              activeLineId={activeLineId}
              onSelectLine={setActiveLineId}
              onUpdatePage={updateActivePage}
              habits={journal.habits}
              habitLog={journal.habitLog}
              todayISO={todayISO}
              onAddHabit={(name: string, priority: HabitPriority, schedule: HabitDefinition['schedule']) => {
                const created: HabitDefinition = {
                  id: `hab-${Date.now()}`,
                  name,
                  description: '',
                  schedule,
                  startDateISO: todayISO,
                  targetPerWeek: schedule === 'daily' ? 7 : schedule === 'weekdays' ? 5 : 2,
                  priority,
                };
                applyJournalMutation((prev) => ({
                  ...prev,
                  habits: [...prev.habits, created],
                }));
              }}
              onToggleHabitToday={(habitId: string, dt = todayISO) => {
                applyJournalMutation((prev) => {
                  const dayMap = prev.habitLog[dt] || {};
                  return {
                    ...prev,
                    habitLog: {
                      ...prev.habitLog,
                      [dt]: {
                        ...dayMap,
                        [habitId]: !dayMap[habitId],
                      },
                    },
                  };
                });
              }}
              onDeleteHabit={(habitId: string) => {
                applyJournalMutation((prev) => ({
                  ...prev,
                  habits: prev.habits.filter((h) => h.id !== habitId),
                }));
              }}
              stickyNotes={journal.stickyNotes.filter((n) => n.pageId === activePage.id)}
              onUpdateStickyNote={(id, patch) => {
                applyJournalMutation((prev) => ({
                  ...prev,
                  stickyNotes: prev.stickyNotes.map((n) =>
                    n.id === id ? { ...n, ...patch } : n
                  ),
                }));
              }}
              onDeleteStickyNote={(id) => {
                applyJournalMutation((prev) => ({
                  ...prev,
                  stickyNotes: prev.stickyNotes.filter((n) => n.id !== id),
                }));
              }}
            />
          </PhysicalBookFrame>
        )}
      </DeskEnvironmentLayer>
    </div>
  );
};
