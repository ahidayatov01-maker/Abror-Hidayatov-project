import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Sparkles, Check, Gift, ShieldCheck, Zap, Crown, Calendar, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WelcomeGiftModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeGiftModal: React.FC<WelcomeGiftModalProps> = ({ open, onClose }) => {
  const { profile, switchSubscriptionTier, t } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [redeemingTier, setRedeemingTier] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasRedeemed = profile.subscriptionTier !== 'free' || localStorage.getItem('gui_welcome_gift_redeemed') === 'true';

  const handleClaim = (tierId: 'standard' | 'premium', planType: 'monthly' | 'yearly', discountPct: number) => {
    setRedeemingTier(`${tierId}-${planType}`);
    setTimeout(() => {
      switchSubscriptionTier(tierId);
      localStorage.setItem('gui_welcome_gift_redeemed', 'true');
      setRedeemingTier(null);
      setSuccessMessage(`Success! Your exclusive ${discountPct}% welcome discount (${planType} plan) has been applied.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    }, 600);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#0c0b14] via-[#140b24] to-[#090610] p-6 sm:p-8 text-white shadow-[0_30px_80px_rgba(107,33,168,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]"
      >
        {/* Floating background ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" aria-hidden="true">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-6 border-b border-purple-500/25">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/60 border border-purple-300/40">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Premium Membership Experience
              </span>
              <h2 id="welcome-modal-title" className="font-display text-2xl sm:text-3xl font-semibold">
                Unlock Your Academic Future
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="btn-glass p-2.5 rounded-xl text-purple-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Centerpiece Welcome Offer Banner */}
        <div className="relative z-10 my-6 text-center space-y-3 bg-purple-950/50 border border-purple-500/35 rounded-2xl p-6 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 animate-pulse pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>First-Time Subscriber Welcome Gift · 50% – 70% OFF</span>
          </div>
          <h3 className="font-display text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-pink-200 to-white bg-clip-text text-transparent">
            Exclusive Crystal Savings
          </h3>
          <p className="text-sm text-purple-200/90 max-w-lg mx-auto leading-relaxed">
            Select your preferred billing plan below to instantly activate professional global admission tools with your verified welcome discount.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex p-1 rounded-xl bg-purple-900/60 border border-purple-500/40">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Monthly Plan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md font-bold' : 'text-purple-300 hover:text-white'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yearly Plan (Save 70%)</span>
              </button>
            </div>
          </div>
        </div>

        {successMessage && (
          <div role="status" className="mb-6 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 text-emerald-200 text-sm font-semibold text-center shadow-lg">
            {successMessage}
          </div>
        )}

        {hasRedeemed ? (
          <div className="text-center py-10 space-y-4">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-display text-2xl font-semibold">Welcome Gift Already Redeemed</h3>
            <p className="text-sm text-purple-200/80 max-w-md mx-auto">
              Your welcome gift has already been applied to your account. Enjoy your active scholar privileges!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MONTHLY PLAN CARD */}
            <div className={`relative rounded-2xl border p-6 flex flex-col justify-between gap-6 transition-all ${billingCycle === 'monthly' ? 'border-purple-400 bg-purple-950/40 shadow-xl' : 'border-purple-500/30 bg-purple-950/20 opacity-80'}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-500/25 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-300" />
                    Monthly Plan
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono-tabular">50% Welcome Off</span>
                </div>
                <h4 className="font-display text-2xl font-semibold">Standard Monthly</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono-tabular text-white">$7</span>
                  <span className="text-xs text-purple-300/70">/ month</span>
                  <span className="text-sm line-through text-purple-300/50 font-mono-tabular ml-auto">$14/mo</span>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Flexible month-to-month access to full AI research assistant tools, university application tracker, and study planner.
                </p>
                <ul className="space-y-2.5 text-xs text-purple-100 pt-3 border-t border-purple-500/20">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Save up to 40 universities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Admission checklist sync & reminders</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>40 AI Advisor queries / day</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                disabled={redeemingTier !== null}
                onClick={() => handleClaim('standard', 'monthly', 50)}
                className="w-full btn-glass rounded-xl py-3.5 text-xs font-semibold cursor-pointer text-center bg-purple-600/30 hover:bg-purple-600/50"
              >
                {redeemingTier === 'standard-monthly' ? 'Applying Welcome Gift...' : 'Claim Monthly 50% Off'}
              </button>
            </div>

            {/* YEARLY PLAN CARD (Featured Gold & 70% Off) */}
            <div className={`relative rounded-2xl border-2 p-6 flex flex-col justify-between gap-6 transition-all shadow-xl ${billingCycle === 'yearly' ? 'border-amber-400 bg-gradient-to-b from-purple-900/70 to-[#16082b] shadow-amber-950/50 scale-[1.02]' : 'border-purple-400/50 bg-purple-900/30'}`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[11px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-950" />
                <span>Best Value · 70% OFF Yearly</span>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    Annual Subscription
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono-tabular">70% OFF</span>
                </div>
                <h4 className="font-display text-2xl font-semibold">Welcome Premium Yearly</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono-tabular text-amber-200">$8.70</span>
                  <span className="text-xs text-purple-300/70">/ month ($104 billed annually)</span>
                  <span className="text-sm line-through text-purple-300/50 font-mono-tabular ml-auto">$29/mo</span>
                </div>
                <p className="text-xs text-purple-100 leading-relaxed">
                  The ultimate academic powerhouse. Maximum savings, unlimited storage, priority AI engine access, and full financial planning simulator.
                </p>
                <ul className="space-y-2.5 text-xs text-purple-100 pt-3 border-t border-amber-400/30">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Unlimited saved universities (200+)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Full AI Research Library & Study Planner</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>200 AI Advisor queries / day + priority sync</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                disabled={redeemingTier !== null}
                onClick={() => handleClaim('premium', 'yearly', 70)}
                className="w-full btn-primary rounded-xl py-3.5 text-xs font-bold cursor-pointer text-center shadow-lg shadow-amber-500/30"
              >
                {redeemingTier === 'premium-yearly' ? 'Applying Yearly Gift...' : 'Claim Yearly 70% Off Exclusive'}
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="relative z-10 mt-6 pt-4 border-t border-purple-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-200/70">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>First-time subscriber welcome discount automatically verified at checkout. Cancel anytime.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-300 hover:text-white underline cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
