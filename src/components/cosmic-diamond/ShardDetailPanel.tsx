import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flame,
  Globe2,
  GraduationCap,
  Headphones,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDiamondMicroCopy, getLocalizedShardCopy } from '../../utils/displayCopy';
import type { CosmicSectionConfig } from './cosmicTypes';

interface ShardDetailPanelProps {
  section: CosmicSectionConfig;
  exploredCount: number;
  totalCount: number;
  onStepShard?: (direction: -1 | 1) => void;
  onNavigateToSection: (section: CosmicSectionConfig) => void;
  onReturnToUniverse: () => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'ai-ecosystem': <Bot className="w-4 h-4" />,
  'world-explorer': <Globe2 className="w-4 h-4" />,
  'academic-roadmap': <Compass className="w-4 h-4" />,
  'goals-certificates': <Award className="w-4 h-4" />,
  'smart-routine': <CalendarClock className="w-4 h-4" />,
  'admission-intelligence': <ShieldCheck className="w-4 h-4" />,
  scholarships: <GraduationCap className="w-4 h-4" />,
  'financial-planner': <Wallet className="w-4 h-4" />,
  'voice-ai-guide': <Headphones className="w-4 h-4" />,
  'habits-tracker': <Flame className="w-4 h-4" />,
  'global-rankings': <Trophy className="w-4 h-4" />,
  'university-comparison': <Scale className="w-4 h-4" />,
};

export const ShardDetailPanel: React.FC<ShardDetailPanelProps> = ({
  section,
  exploredCount,
  totalCount,
  onStepShard,
  onNavigateToSection,
  onReturnToUniverse,
}) => {
  const { language } = useApp();
  const copy = getDiamondMicroCopy(language);
  const shardCopy = getLocalizedShardCopy(section.id, language, section.title);

  return (
    <motion.aside
      key={section.id}
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 18, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      data-testid="cosmic-shard-detail-panel"
      aria-label={`${copy.passportBadge}: ${shardCopy.title}`}
      className="pointer-events-auto relative flex flex-col w-full lg:w-[46%] xl:w-[42%] max-w-[520px] overflow-hidden rounded-[28px] border border-cyan-200/24 text-violet-50 p-6 sm:p-7"
      style={{
        background:
          'linear-gradient(135deg, rgba(22, 16, 54, 0.22) 0%, rgba(11, 9, 32, 0.18) 52%, rgba(14, 24, 56, 0.22) 100%)',
        backdropFilter: 'blur(18px) saturate(145%)',
        WebkitBackdropFilter: 'blur(18px) saturate(145%)',
        boxShadow: `0 24px 64px rgba(3, 2, 14, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.24), inset 1px 0 0 rgba(165, 243, 252, 0.14), 0 0 38px ${section.accentHex}22`,
      }}
    >
      {/* Subtle diagonal glass refraction sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(125deg, rgba(255, 255, 255, 0.08) 0%, rgba(165, 243, 252, 0.03) 28%, rgba(255, 255, 255, 0) 60%)',
        }}
      />

      {/* Subtle top luminous rim */}
      <div
        className="pointer-events-none absolute top-0 inset-x-8 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${section.accentHex}, ${section.secondaryHex}, transparent)`,
        }}
      />

      {/* Minimal 4-Element Capability Card */}
      <div className="relative z-10 space-y-5">
        {/* Top Meta & Shard Stepper */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-cyan-300">
            {section.order} / {totalCount}
            <span className="mx-2 text-white/30">·</span>
            <span className="text-violet-200/80">
              {exploredCount}/{totalCount} {copy.exploredLabel}
            </span>
          </span>
          {onStepShard && (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => onStepShard(-1)}
                aria-label="Previous facet"
                data-testid="cosmic-prev-shard-btn"
                className="p-1.5 rounded-lg border border-cyan-200/22 bg-white/[0.05] text-violet-100 hover:text-white hover:border-cyan-300/50 hover:bg-violet-500/20 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepShard(1)}
                aria-label="Next facet"
                data-testid="cosmic-next-shard-btn"
                className="p-1.5 rounded-lg border border-cyan-200/22 bg-white/[0.05] text-violet-100 hover:text-white hover:border-cyan-300/50 hover:bg-violet-500/20 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 1. Section Title */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${section.accentHex}34, ${section.secondaryHex}24)`,
              color: '#f5f3ff',
            }}
          >
            {SECTION_ICONS[section.id] || <Sparkles className="w-4 h-4" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {shardCopy.title}
          </h2>
        </div>

        {/* 2. Single 1-Sentence Core Value */}
        <p className="text-sm sm:text-[15px] text-violet-50/92 leading-relaxed">
          {shardCopy.valueLine}
        </p>

        {/* 3. Strictly 3 Crisp Feature Bullets */}
        <ul className="space-y-2.5 pt-1">
          {shardCopy.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5"
            >
              <CheckCircle2
                className="w-4 h-4 shrink-0"
                style={{ color: section.secondaryHex }}
              />
              <span className="text-xs sm:text-[13px] font-medium text-violet-50/92">
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        {/* 4. Clean Action Pair */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/12">
          <button
            type="button"
            onClick={() => onNavigateToSection(section)}
            data-testid="cosmic-go-to-section-btn"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 cursor-pointer shadow-[0_10px_30px_rgba(139,92,246,0.45)] hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${section.accentHex}, ${section.secondaryHex})`,
            }}
          >
            <span>{copy.openSection}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReturnToUniverse}
            data-testid="cosmic-back-to-universe-btn"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/24 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-violet-50 hover:bg-white/[0.12] hover:border-cyan-200/45 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{copy.back}</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
