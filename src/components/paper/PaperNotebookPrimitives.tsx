import React from 'react';
import { Paperclip } from 'lucide-react';
import type {
  FoldMode,
  JournalPreferences,
  NotebookCoverStyle,
  PaperColorPreset,
} from '../../types/journal';

export const PAPER_PALETTES: Record<
  PaperColorPreset,
  { bg: string; edge: string; edgeDark: string; text: string; faintText: string }
> = {
  'warm-ivory': {
    bg: '#FAF5E8',
    edge: '#EFE6D1',
    edgeDark: '#DFD2B6',
    text: '#221F1A',
    faintText: '#7C7262',
  },
  'natural-cream': {
    bg: '#F7F1E1',
    edge: '#EAE0C9',
    edgeDark: '#D7C8AA',
    text: '#241F18',
    faintText: '#7A6F5E',
  },
  'aged-parchment': {
    bg: '#F1E6CE',
    edge: '#E2D2B1',
    edgeDark: '#CEBA91',
    text: '#292116',
    faintText: '#75664F',
  },
  'cool-cotton': {
    bg: '#F9F8F4',
    edge: '#EAE7DF',
    edgeDark: '#D6D2C7',
    text: '#1D2024',
    faintText: '#6F757D',
  },
};

export const LINE_COLORS: Record<JournalPreferences['lineColor'], string> = {
  'slate-blue': 'rgba(110, 140, 182, 0.28)',
  sepia: 'rgba(138, 108, 76, 0.25)',
  graphite: 'rgba(92, 98, 105, 0.22)',
  sage: 'rgba(84, 128, 108, 0.25)',
};

export const COVER_STYLES: Record<
  NotebookCoverStyle,
  {
    label: string;
    bg: string;
    spine: string;
    border: string;
    accent: string;
    text: string;
    band: string;
  }
> = {
  leather: {
    label: 'Classic Leather',
    bg: 'linear-gradient(145deg, #3D261C 0%, #2B1A12 58%, #1E110B 100%)',
    spine: '#180D08',
    border: 'rgba(218, 185, 130, 0.28)',
    accent: '#D6B178',
    text: '#F5E7CE',
    band: '#180E09',
  },
  linen: {
    label: 'Minimalist Linen',
    bg: 'linear-gradient(150deg, #D9D1C3 0%, #C8BEB0 60%, #B7AC9C 100%)',
    spine: '#9E9384',
    border: 'rgba(56, 48, 38, 0.16)',
    accent: '#4A4238',
    text: '#2B2620',
    band: '#7D7265',
  },
  school: {
    label: 'School Composition',
    bg: 'linear-gradient(155deg, #1E3247 0%, #162536 65%, #0F1A27 100%)',
    spine: '#111111',
    border: 'rgba(255, 255, 255, 0.18)',
    accent: '#EAE2D0',
    text: '#F7F3E9',
    band: '#121D2B',
  },
  vintage: {
    label: 'Vintage Botanical',
    bg: 'linear-gradient(145deg, #2D4234 0%, #203126 60%, #15221A 100%)',
    spine: '#131D16',
    border: 'rgba(214, 191, 134, 0.35)',
    accent: '#DFC78B',
    text: '#F4ECDA',
    band: '#1B2820',
  },
  modern: {
    label: 'Modern Slate',
    bg: 'linear-gradient(150deg, #262930 0%, #1C1E24 60%, #141519 100%)',
    spine: '#0F1014',
    border: 'rgba(255, 255, 255, 0.14)',
    accent: '#D4CFC7',
    text: '#F3F2EE',
    band: '#3B3F4A',
  },
};

const PAPER_GRAIN_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const PaperMaterialDefs: React.FC = () => null;

export const ClosedNotebookCover: React.FC<{
  preferences: JournalPreferences;
  onOpen: () => void;
  pageCount: number;
}> = ({ preferences, onOpen, pageCount }) => {
  const cover = COVER_STYLES[preferences.coverStyle] || COVER_STYLES.leather;

  return (
    <div className="w-full flex items-center justify-center py-8 sm:py-12 px-4">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open physical notebook"
        className="group relative w-full max-w-[440px] aspect-[3/4] rounded-r-2xl rounded-l-md text-left transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-[-0.4deg] cursor-pointer focus-visible:outline-none"
        style={{
          background: cover.bg,
          boxShadow:
            '18px 26px 48px rgba(15, 10, 6, 0.36), 4px 6px 14px rgba(15, 10, 6, 0.22), inset 0 1px 1px rgba(255,255,255,0.14)',
        }}
      >
        {/* Spine ridge */}
        <div
          className="absolute inset-y-0 left-0 w-7 sm:w-9 rounded-l-md border-r border-black/30"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, ${cover.spine} 45%, rgba(0,0,0,0.45) 100%)`,
          }}
        />

        {/* Stacked paper edge visible on right */}
        <div
          className="absolute top-3 bottom-3 -right-2.5 w-2.5 rounded-r-sm pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(90deg, #F5EFE0 0px, #F5EFE0 1px, #DDD1B8 2px, #EFE6D1 3px)',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
          }}
        />

        {/* Debossed perimeter frame */}
        <div
          className="absolute inset-4 left-10 sm:left-12 rounded-xl border pointer-events-none"
          style={{ borderColor: cover.border }}
        />

        {/* Elastic band */}
        <div
          className="absolute inset-y-0 right-7 w-3.5 shadow-inner pointer-events-none"
          style={{ backgroundColor: cover.band, opacity: 0.88 }}
        />

        {/* Corner brass / subtle edge details for vintage & leather */}
        {(preferences.coverStyle === 'leather' || preferences.coverStyle === 'vintage') && (
          <>
            <span
              className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg opacity-55"
              style={{ borderColor: cover.accent }}
            />
            <span
              className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-lg opacity-55"
              style={{ borderColor: cover.accent }}
            />
          </>
        )}

        {/* Composition label for school style, embossed typography otherwise */}
        <div className="relative z-10 h-full pl-14 sm:pl-16 pr-12 py-12 flex flex-col justify-between">
          {preferences.coverStyle === 'school' ? (
            <div className="bg-[#F9F4E8] text-[#1D242B] rounded-lg p-5 shadow-md border border-black/15">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B6458]">
                Personal Archive
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                {preferences.coverTitle}
              </h2>
              <div className="mt-4 pt-3 border-t border-[#1D242B]/15 text-xs font-hw-caveat text-lg">
                {preferences.coverOwner}
              </div>
            </div>
          ) : (
            <div className="pt-8 space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.26em] opacity-75"
                style={{ color: cover.accent }}
              >
                Personal Edition
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-tight"
                style={{
                  color: cover.text,
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                }}
              >
                {preferences.coverTitle}
              </h2>
              <div
                className="w-14 h-px opacity-50 my-3"
                style={{ backgroundColor: cover.accent }}
              />
              <p className="text-xs opacity-75" style={{ color: cover.text }}>
                {preferences.coverOwner}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs" style={{ color: cover.text }}>
            <span className="opacity-75 font-mono-tabular">{pageCount} pages</span>
            <span
              className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4 group-hover:translate-x-0.5 transition-transform"
              style={{ color: cover.accent }}
            >
              Open Notebook →
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export const HandwrittenCheckbox: React.FC<{
  checked: boolean;
  inkColor: string;
  label: string;
  onToggle: () => void;
}> = ({ checked, inkColor, label, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className="relative w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-sm cursor-pointer focus-visible:outline-none group"
  >
    <svg viewBox="0 0 28 28" className="w-6 h-6 overflow-visible">
      {/* Hand-drawn uneven ink box */}
      <path
        d="M 4.5 5.2 C 9.2 4.6, 18.8 5.0, 23.2 4.7 C 23.6 10.2, 23.1 18.6, 23.5 23.1 C 17.5 23.6, 10.1 23.1, 4.7 23.4 C 4.3 17.8, 4.7 10.8, 4.5 5.2 Z"
        fill="none"
        stroke={inkColor}
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.72"
        className="group-hover:opacity-100 transition-opacity"
      />
      {checked && (
        <path
          d="M 7.5 14.5 C 9.8 17.2, 11.4 19.8, 12.6 20.6 C 15.8 15.2, 20.2 9.4, 24.4 4.8"
          fill="none"
          stroke={inkColor}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ink-check"
        />
      )}
    </svg>
  </button>
);

export const PhysicalBookFrame: React.FC<{
  preferences: JournalPreferences;
  pageNumber: number;
  totalPages: number;
  bookmarked: boolean;
  paperClipped: boolean;
  foldMode: FoldMode;
  turnAnimation: 'none' | 'next' | 'prev';
  tearProgress: number; // 0..1 when dragging edge to tear
  onCornerNext: () => void;
  onStartTearDrag: (e: React.PointerEvent<HTMLDivElement>) => void;
  onToggleFoldCorner: () => void;
  children: React.ReactNode;
}> = ({
  preferences,
  pageNumber,
  totalPages,
  bookmarked,
  paperClipped,
  foldMode,
  turnAnimation,
  tearProgress,
  onCornerNext,
  onStartTearDrag,
  onToggleFoldCorner,
  children,
}) => {
  const palette = PAPER_PALETTES[preferences.paperColor] || PAPER_PALETTES['warm-ivory'];
  const cover = COVER_STYLES[preferences.coverStyle] || COVER_STYLES.leather;
  const isCornerFolded = foldMode === 'corner' || foldMode === 'half' || foldMode === 'quarter';

  return (
    <div className="relative mx-auto w-full max-w-[920px] select-text">
      {/* Outer Leather/Linen Notebook Board peeking out around page block */}
      <div
        className="relative rounded-r-2xl rounded-l-lg p-1 sm:p-2.5 transition-[background] duration-300"
        style={{
          background: cover.bg,
          boxShadow:
            '0 26px 56px rgba(15, 10, 6, 0.34), 0 8px 20px rgba(15, 10, 6, 0.2), inset 0 1px 0 rgba(255,255,255,0.14)',
        }}
      >
        {/* Layered paper deck edges (right & bottom stacked sheets) */}
        <div
          className="relative rounded-r-xl rounded-l-[4px]"
          style={{
            boxShadow: `
              3px 3px 0 ${palette.edge},
              5px 5px 0 ${palette.edgeDark},
              7px 7px 0 ${palette.edge},
              9px 9px 10px rgba(20, 14, 8, 0.22)
            `,
          }}
        >
          {/* Active Physical Sheet */}
          <div
            className={`relative rounded-r-xl rounded-l-[3px] overflow-hidden transition-transform duration-200 ${
              turnAnimation === 'next'
                ? 'animate-paper-turn-next'
                : turnAnimation === 'prev'
                ? 'animate-paper-turn-prev'
                : ''
            }`}
            style={{
              backgroundColor: palette.bg,
              color: palette.text,
              transform:
                tearProgress > 0
                  ? `perspective(1200px) rotateX(${(tearProgress * 5).toFixed(1)}deg) skewX(${(
                      tearProgress * 1.6
                    ).toFixed(1)}deg)`
                  : foldMode === 'half'
                  ? 'perspective(1200px) scaleX(0.96)'
                  : undefined,
              boxShadow:
                'inset 24px 0 32px -20px rgba(55, 38, 22, 0.22), inset -3px 0 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Fast tiled subtle paper fiber grain layer */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-80"
              aria-hidden="true"
              style={{
                backgroundImage: PAPER_GRAIN_DATA_URI,
                backgroundRepeat: 'repeat',
              }}
            />

            {/* Sewn Spine Binding Gutter Shadows + Subtle Stitching */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-9 z-10"
              style={{
                background:
                  'linear-gradient(90deg, rgba(40,26,14,0.22) 0%, rgba(40,26,14,0.08) 45%, transparent 100%)',
              }}
            >
              <div className="h-full flex flex-col justify-around py-10 pl-1.5 opacity-45">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="block w-2 h-0.5 rounded-full bg-[#4A3828]"
                  />
                ))}
              </div>
            </div>

            {/* Subtle Surface Curvature Shading */}
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22) 0%, transparent 55%), linear-gradient(105deg, transparent 78%, rgba(40,28,16,0.05) 100%)',
              }}
            />

            {/* Vertical Notebook Margin Line */}
            {preferences.marginStyle !== 'none' && (
              <div
                className="pointer-events-none absolute inset-y-0 left-6 sm:left-16 z-10 flex gap-[3px]"
                aria-hidden="true"
              >
                <div
                  className="w-px h-full"
                  style={{
                    backgroundColor:
                      preferences.marginStyle === 'double-crimson'
                        ? 'rgba(176, 62, 68, 0.34)'
                        : preferences.marginStyle === 'single-amber'
                        ? 'rgba(168, 108, 42, 0.32)'
                        : 'rgba(110, 120, 134, 0.22)',
                  }}
                />
                {preferences.marginStyle === 'double-crimson' && (
                  <div
                    className="w-px h-full"
                    style={{ backgroundColor: 'rgba(176, 62, 68, 0.22)' }}
                  />
                )}
              </div>
            )}

            {/* Metallic Paper Clip */}
            {paperClipped && (
              <div
                className="pointer-events-none absolute -top-1 right-16 sm:right-24 z-30 drop-shadow-md"
                aria-label="Page marked with paper clip"
              >
                <div className="bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 p-1.5 rounded-b-full border border-slate-500/40 shadow">
                  <Paperclip className="w-5 h-5 text-slate-700 rotate-12" />
                </div>
              </div>
            )}

            {/* Ribbon Bookmark */}
            {bookmarked && (
              <div
                className="pointer-events-none absolute -bottom-2 left-10 sm:left-14 z-30"
                aria-label="Ribbon bookmark"
              >
                <svg width="20" height="44" viewBox="0 0 20 44" className="drop-shadow-md">
                  <path
                    d="M 2 0 L 18 0 L 18 42 L 10 34 L 2 42 Z"
                    fill="#8B2635"
                  />
                  <path d="M 4 0 L 6 0 L 6 38 L 4 40 Z" fill="rgba(255,255,255,0.18)" />
                </svg>
              </div>
            )}

            {/* Interactive Tear Boundary Strip (Top Perforated Tear Handle) */}
            <div
              onPointerDown={onStartTearDrag}
              title="Grab & drag downward to tear this page out"
              aria-label="Drag downward from top edge to tear page"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(tearProgress * 100)}
              tabIndex={0}
              className="group relative z-30 h-5 w-full cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-amber-900/5 transition-colors"
            >
              <div className="w-28 h-[1.5px] rounded-full bg-[#8D7C64]/25 group-hover:bg-[#9A3412]/55 transition-colors" />
              {tearProgress > 0.03 && (
                <svg
                  className="absolute top-3 left-0 w-full h-5 pointer-events-none"
                  viewBox="0 0 800 20"
                  preserveAspectRatio="none"
                >
                  <path
                    d={`M 0 2 L ${(tearProgress * 800).toFixed(0)} 8`}
                    stroke="#8B4513"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    fill="none"
                  />
                </svg>
              )}
            </div>

            {/* Fold Crease Visual Lines when page is folded */}
            {foldMode !== 'none' && (
              <div className="pointer-events-none absolute inset-0 z-20">
                {(foldMode === 'half' || foldMode === 'quarter') && (
                  <div
                    className="absolute inset-y-0 left-1/2 w-[2px]"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(0,0,0,0.14), rgba(255,255,255,0.45), rgba(0,0,0,0.08))',
                    }}
                  />
                )}
                {foldMode === 'quarter' && (
                  <div
                    className="absolute inset-x-0 top-1/2 h-[2px]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(0,0,0,0.14), rgba(255,255,255,0.45), rgba(0,0,0,0.08))',
                    }}
                  />
                )}
              </div>
            )}

            {/* Main Paper Content Area */}
            <div className="relative z-20 pl-8 sm:pl-20 pr-3.5 sm:pr-10 pt-2 pb-12 min-h-[540px] sm:min-h-[600px]">
              {children}
            </div>

            {/* Page Number Footer */}
            <div
              className="relative z-20 px-4 sm:px-8 pb-4 pt-1 flex items-center justify-between text-[11px] font-mono-tabular"
              style={{ color: palette.faintText }}
            >
              <span>
                p. {pageNumber} / {totalPages}
              </span>

              {/* Fold Corner Toggle & Bottom-Right Page Curl */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleFoldCorner}
                  className="text-[11px] hover:underline cursor-pointer"
                >
                  {foldMode === 'none' ? 'Fold corner' : `Folded (${foldMode})`}
                </button>
              </div>
            </div>

            {/* Interactive Corner Curl (Bottom-Right) */}
            <button
              type="button"
              onClick={onCornerNext}
              aria-label="Turn to next page"
              title="Turn to next page"
              className="group absolute bottom-0 right-0 z-30 w-12 h-12 cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`absolute bottom-0 right-0 transition-[width,height] duration-300 ease-out ${
                  isCornerFolded
                    ? 'w-11 h-11'
                    : 'w-6 h-6 group-hover:w-10 group-hover:h-10'
                }`}
                style={{
                  background: `linear-gradient(135deg, transparent 48%, ${palette.edgeDark} 49%, ${palette.bg} 78%, ${palette.edge} 100%)`,
                  boxShadow: '-3px -3px 8px rgba(30, 20, 10, 0.16)',
                  borderTopLeftRadius: '4px',
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
