import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelcomeGiftModal } from './WelcomeGiftModal';

export const WelcomeGiftBoxCard: React.FC = () => {
  const { profile, t } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const hasRedeemed = profile.subscriptionTier !== 'free' || localStorage.getItem('gui_welcome_gift_redeemed') === 'true';

  const handleClick = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
      setModalOpen(true);
    }, 750);
  };

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-[#120822] via-[#1a0b36] to-[#0f071f] p-6 sm:p-8 shadow-[0_20px_50px_rgba(147,51,234,0.22),inset_0_1px_0_rgba(236,72,153,0.35)] flex flex-col justify-between min-h-[280px] group">
        {/* Ambient Golden & Purple Lighting / Sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-pink-500/15 rounded-full blur-2xl" />
          <div className="absolute top-6 right-10 w-2 h-2 bg-amber-300 rounded-full animate-ping" />
          <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" />
        </div>

        {/* Top Header & Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            First Purchase Benefit
          </span>
          <span className="text-xs font-bold text-amber-300 font-mono-tabular">
            50% – 70% OFF
          </span>
        </div>

        {/* Center 3D Gift Box Visual & Interactive trigger */}
        <div className="relative z-10 my-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClick}
            aria-label="Open Welcome Gift Box"
            className="group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-2xl p-4 transition-transform duration-500 hover:scale-105"
          >
            {/* Rotating & Floating 3D Gift Box Illustration */}
            <motion.div
              animate={
                isOpening
                  ? { rotateY: 360, scale: 1.15, y: -10 }
                  : { rotateY: [0, 8, 0, -8, 0], y: [0, -6, 0] }
              }
              transition={
                isOpening
                  ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 14, repeat: Infinity, ease: 'easeInOut' }
              }
              className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-[#7c3aed] via-[#9333ea] to-[#db2777] shadow-[0_16px_36px_rgba(147,51,234,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center border border-pink-300/50"
            >
              {/* Pink Satin Ribbon Vertical & Horizontal */}
              <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 shadow-md" />
              <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-pink-400 via-pink-500 to-rose-500 shadow-md" />
              
              {/* 3D Bow on top */}
              <div className="absolute -top-4 w-14 h-6 rounded-full bg-pink-400 shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/60 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-amber-300 shadow-sm" />
              </div>

              {/* Gift Icon inside */}
              <Gift className={`relative z-10 w-12 h-12 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform duration-500 ${isOpening ? 'scale-125 rotate-12' : 'group-hover:scale-110'}`} />

              {/* Opening light burst effect */}
              {isOpening && (
                <div className="absolute inset-0 rounded-3xl bg-amber-300/60 animate-ping pointer-events-none" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Bottom Call to Action */}
        <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-purple-500/25">
          <div>
            <h3 className="font-display text-lg font-semibold text-white tracking-tight">
              Exclusive Welcome Gift
            </h3>
            <p className="text-xs text-purple-200/80">
              {hasRedeemed ? 'Welcome discount redeemed' : 'Tap gift box to unlock your discount'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="btn-primary rounded-xl px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-purple-900/40"
          >
            <span>Open Gift</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal */}
      <WelcomeGiftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
