import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDiamondMicroCopy, getLocalizedShardCopy } from '../../utils/displayCopy';
import type { CosmicSectionConfig, CosmicStage } from './cosmicTypes';
import { COSMIC_SECTIONS } from './cosmicSections';

interface CosmicControlsProps {
  stage: CosmicStage;
  exploredCount: number;
  exploredShardIds: string[];
  activeShardId: string | null;
  hoveredShardId: string | null;
  onHoverShard?: (shardId: string | null) => void;
  onSelectShard: (shardId: string) => void;
  onReassemble: () => void;
}

export const CosmicControls: React.FC<CosmicControlsProps> = ({
  stage,
  exploredCount,
  exploredShardIds,
  activeShardId,
  hoveredShardId,
  onHoverShard,
  onSelectShard,
  onReassemble,
}) => {
  const { language } = useApp();
  const copy = getDiamondMicroCopy(language);
  const showQuickRail = stage === 'universe';
  const progressPct = Math.round((exploredCount / COSMIC_SECTIONS.length) * 100);

  return (
    <>
      {/* Top Minimal Cosmic HUD */}
      <div className="pointer-events-none fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-7 sm:py-5">
        {/* Left: Exploration Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-violet-300/20 bg-[#0b0820]/82 px-3.5 py-2 shadow-[0_12px_36px_rgba(6,4,22,0.55)]"
          data-testid="cosmic-progress-indicator"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-300 shrink-0" />
          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-[13px] font-medium text-violet-50 tracking-tight whitespace-nowrap">
              {exploredCount} / {COSMIC_SECTIONS.length} {copy.exploredLabel}
            </span>
            <div className="hidden sm:block w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Right: Reassemble Diamond Exit Control */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={onReassemble}
          disabled={stage === 'reassembling'}
          data-testid="cosmic-reassemble-btn"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-[#0b0820]/85 px-4 py-2 text-xs sm:text-[13px] font-medium text-violet-50 hover:border-cyan-300/55 hover:bg-[#140f36]/95 hover:text-white transition-all duration-200 shadow-[0_12px_36px_rgba(6,4,22,0.55)] cursor-pointer disabled:opacity-50"
        >
          <span>{copy.reassemble}</span>
          <X className="w-3.5 h-3.5 text-violet-200" />
        </motion.button>
      </div>

      {/* Bottom Accessible Shard Quick-Selector Rail (Stage 2 Universe) */}
      {showQuickRail && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
          className="pointer-events-none fixed bottom-4 inset-x-0 z-30 flex flex-col items-center gap-2 px-3 sm:px-6"
        >
          <p className="text-[11px] font-medium tracking-wide text-violet-200/75 text-center">
            {copy.selectFacet}
          </p>
          <nav
            aria-label={copy.selectFacet}
            className="pointer-events-auto max-w-full overflow-x-auto no-scrollbar rounded-2xl border border-violet-300/18 bg-[#09071d]/82 px-2 py-1.5 shadow-[0_16px_48px_rgba(5,3,18,0.65)]"
          >
            <div className="flex items-center gap-1 min-w-max">
              {COSMIC_SECTIONS.map((section: CosmicSectionConfig) => {
                const isExplored = exploredShardIds.includes(section.id);
                const isActive = activeShardId === section.id;
                const isHovered = hoveredShardId === section.id;
                const shardTitle = getLocalizedShardCopy(section.id, language, section.title).title;

                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onSelectShard(section.id)}
                    onMouseEnter={() => onHoverShard?.(section.id)}
                    onMouseLeave={() => onHoverShard?.(null)}
                    onFocus={() => onHoverShard?.(section.id)}
                    onBlur={() => onHoverShard?.(null)}
                    data-testid={`cosmic-shard-pill-${section.id}`}
                    className={`group flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer border ${
                      isActive || isHovered
                        ? 'border-cyan-300/55 bg-violet-500/25 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)]'
                        : isExplored
                        ? 'border-violet-300/28 bg-violet-500/12 text-violet-100 hover:border-violet-300/50 hover:bg-violet-500/22'
                        : 'border-white/8 bg-white/[0.03] text-violet-200/80 hover:border-violet-300/35 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isExplored ? '#38bdf8' : section.accentHex,
                        boxShadow: isExplored ? '0 0 8px #38bdf8' : 'none',
                      }}
                    />
                    <span className="font-mono text-[10px] opacity-65">{section.order}</span>
                    <span className="whitespace-nowrap">{shardTitle}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </motion.div>
      )}
    </>
  );
};
