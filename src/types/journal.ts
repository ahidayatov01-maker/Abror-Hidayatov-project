export type WritingInstrument =
  | 'fine-tip'
  | 'fountain'
  | 'ballpoint'
  | 'pencil'
  | 'highlighter'
  | 'colored';

export type HandwritingFont = 'caveat' | 'kalam' | 'patrick' | 'bad-script';

export type NotebookCoverStyle =
  | 'leather'
  | 'linen'
  | 'school'
  | 'vintage'
  | 'modern';

export type DeskSurfaceTheme = 'walnut' | 'slate' | 'linen' | 'pine';

export type LightingTheme = 'morning' | 'lamp' | 'evening' | 'daylight';

export type PaperColorPreset = 'warm-ivory' | 'natural-cream' | 'aged-parchment' | 'cool-cotton';

export type PageTemplateType =
  | 'daily'
  | 'reflection'
  | 'calendar'
  | 'weekly'
  | 'monthly'
  | 'goals'
  | 'books'
  | 'memories';

export type PaperPhysicsState =
  | 'flat'
  | 'hovered'
  | 'held'
  | 'dragging'
  | 'bending'
  | 'partially_torn'
  | 'fully_torn'
  | 'folded'
  | 'crumpled'
  | 'flying'
  | 'landed'
  | 'archived';

export type FoldMode = 'none' | 'corner' | 'half' | 'quarter';

export interface JournalLineEntry {
  id: string;
  text: string;
  instrument: WritingInstrument;
  inkColor: string;
  font: HandwritingFont;
  align: 'left' | 'center' | 'right';
  isHeading?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  highlighted?: boolean;
  highlightColor?: string;
}

export interface StrokePoint {
  x: number; // normalized 0..1 relative to page width
  y: number; // normalized 0..1 relative to page height
  pressure: number; // 0.1..1.0
}

export interface InkStroke {
  id: string;
  instrument: WritingInstrument;
  color: string;
  baseWidth: number;
  opacity: number;
  points: StrokePoint[];
}

export interface DailyReflectionData {
  accomplished: string;
  learned: string;
  improve: string;
  tomorrowPriority: string;
  highlightLine: string;
}

export interface WeeklyReviewData {
  bestAchievement: string;
  mainDifficulty: string;
  nextWeekPriority: string;
  notes: string;
}

export interface MonthlyReviewData {
  themeOfMonth: string;
  milestonesSummary: string;
  lessonsLearned: string;
  nextMonthFocus: string;
}

export interface GoalEntry {
  id: string;
  title: string;
  horizon: string;
  whyItMatters: string;
  nextStep: string;
  completed: boolean;
}

export interface BookLearningEntry {
  id: string;
  title: string;
  author: string;
  pagesRead: number;
  totalPages: number;
  keyIdeas: string;
  vocabularyNotes: string;
}

export interface MemoryEntry {
  id: string;
  dateLabel: string;
  location: string;
  title: string;
  story: string;
}

export interface JournalPage {
  id: string;
  pageNumber: number;
  dateISO: string;
  title: string;
  template: PageTemplateType;
  lines: JournalLineEntry[];
  strokes: InkStroke[];
  bookmarked: boolean;
  paperClipped: boolean;
  foldMode: FoldMode;
  reflection: DailyReflectionData;
  weeklyReview: WeeklyReviewData;
  monthlyReview: MonthlyReviewData;
  goals: GoalEntry[];
  books: BookLearningEntry[];
  memories: MemoryEntry[];
  isTornOut: boolean;
  isArchived: boolean;
  archivedAt?: string;
}

export type HabitPriority = 'most_important' | 'important' | 'optional';

export interface HabitDefinition {
  id: string;
  name: string;
  description: string;
  schedule: 'daily' | 'weekdays' | 'weekends' | 'custom';
  startDateISO: string;
  targetPerWeek: number;
  priority: HabitPriority;
}

// dateISO -> habitId -> completed
export type HabitCompletionLog = Record<string, Record<string, boolean>>;

export interface StickyNoteItem {
  id: string;
  pageId: string;
  xPct: number;
  yPct: number;
  color: 'canary' | 'sage' | 'blush' | 'kraft';
  text: string;
  rotationDeg: number;
}

export interface TornPaperObject {
  id: string;
  sourcePageId: string;
  title: string;
  snippet: string;
  tearKind: 'full-page' | 'corner' | 'strip';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  crumpleStage: 0 | 1 | 2 | 3 | 4;
  foldMode: FoldMode;
  state: PaperPhysicsState;
  inWastebasket: boolean;
  createdAt: string;
}

export interface JournalPreferences {
  coverStyle: NotebookCoverStyle;
  coverTitle: string;
  coverOwner: string;
  paperColor: PaperColorPreset;
  lineColor: 'slate-blue' | 'sepia' | 'graphite' | 'sage';
  lineSpacing: 'compact' | 'classic' | 'relaxed';
  marginStyle: 'double-crimson' | 'single-amber' | 'subtle-rule' | 'none';
  defaultFont: HandwritingFont;
  defaultInstrument: WritingInstrument;
  defaultInkColor: string;
  deskTheme: DeskSurfaceTheme;
  lightingTheme: LightingTheme;
  soundEnabled: boolean;
  soundVolume: number;
  showDeskObjects: boolean;
}

export interface PaperJournalState {
  version: number;
  notebookOpen: boolean;
  activePageId: string;
  pages: JournalPage[];
  habits: HabitDefinition[];
  habitLog: HabitCompletionLog;
  habitsV2?: {
    version: number;
    habits: Array<Record<string, unknown>>;
    completions: Array<Record<string, unknown>>;
    reflections: Record<string, { date: string; note: string; updatedAt: string }>;
    updatedAt: string;
  };
  stickyNotes: StickyNoteItem[];
  tornObjects: TornPaperObject[];
  preferences: JournalPreferences;
  updatedAt: string;
}
