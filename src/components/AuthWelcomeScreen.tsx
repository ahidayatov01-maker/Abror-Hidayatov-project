import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Loader2,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LuminousAura } from './glass/LuminousAtmosphere';
import { BrandLogoMark } from './brand/BrandLogo';
import { authProvidersConfig } from '../lib/firebase';
import { ONBOARDING_TRANSLATIONS } from '../i18n/onboardingTranslations';
import {
  FIELD_OF_INTEREST_OPTIONS,
  ONBOARDING_COUNTRIES_LIST,
  STUDY_DESTINATION_OPTIONS,
  computeUserInitials,
  getCitySuggestionsForCountry,
} from '../utils/userProfileHelpers';
import { MOTION_EASE } from '../motion/tokens';
import type { LanguageCode } from '../types/domain';

const LANGUAGES: Array<{ code: LanguageCode; label: string; short: string }> = [
  { code: 'uz', label: 'O‘zbek', short: 'UZ' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
];

const OfficialGoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.69h6.45c-.28 1.5-1.125 2.775-2.395 3.625v3.015h3.875c2.265-2.085 3.56-5.16 3.56-8.855z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.955-1.075 7.94-2.905l-3.875-3.015c-1.075.72-2.45 1.15-4.065 1.15-3.125 0-5.77-2.11-6.715-4.945H1.28v3.11C3.255 21.32 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.285 14.285c-.24-.72-.375-1.49-.375-2.285s.135-1.565.375-2.285V6.605H1.28C.465 8.23 0 10.065 0 12s.465 3.77 1.28 5.395l4.005-3.11z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.605 4.585 1.795l3.435-3.435C17.95 1.19 15.235 0 12 0 7.31 0 3.255 2.68 1.28 6.605l4.005 3.11C6.23 6.88 8.875 4.77 12 4.77z"
    />
  </svg>
);

const PlatformCrestEmblem: React.FC = () => (
  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-sky-400/25 via-cyan-500/10 to-slate-900/90 border border-cyan-300/40 shadow-[0_0_40px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0">
    <LuminousAura size="w-20 h-20" />
    <BrandLogoMark className="w-12 h-12 sm:w-14 sm:h-14" />
  </div>
);

export const AuthWelcomeScreen: React.FC = () => {
  const {
    signInWithGoogle,
    completeOnboarding,
    enterGuestMode,
    logout,
    authLoading,
    authError,
    needsOnboarding,
    profile,
    language,
    setLanguage,
  } = useApp();

  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  const [videoFailed, setVideoFailed] = useState(false);

  // Onboarding Step 2 form state
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [country, setCountry] = useState(profile.country || 'Uzbekistan');
  const [city, setCity] = useState(profile.city || '');
  const [targetDegree, setTargetDegree] = useState<string>(
    profile.targetDegree || 'Bachelor'
  );
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    profile.targetCountries?.length ? profile.targetCountries : ['JP', 'US', 'GB', 'DE']
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.targetDisciplines?.length
      ? profile.targetDisciplines
      : ['Computer Science', 'Artificial Intelligence']
  );

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [onboardingSavedSuccess, setOnboardingSavedSuccess] = useState(false);

  const copy = ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS.en;

  // Sync Google account name into form fields when entering Step 2
  useEffect(() => {
    if (needsOnboarding) {
      if (profile.firstName && !firstName) {
        setFirstName(profile.firstName);
      }
      if (profile.lastName && !lastName) {
        setLastName(profile.lastName);
      }
      if (profile.country) {
        setCountry(profile.country);
      }
      if (profile.city) {
        setCity(profile.city);
      }
    }
  }, [
    needsOnboarding,
    profile.firstName,
    profile.lastName,
    profile.country,
    profile.city,
    firstName,
    lastName,
  ]);

  // Close country dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setCountryPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Ensure background video plays or respects reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (prefersReducedMotion) {
      v.pause();
      return;
    }
    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay fallback handled silently; poster remains visible
      });
    }
  }, [prefersReducedMotion]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return ONBOARDING_COUNTRIES_LIST;
    return ONBOARDING_COUNTRIES_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.cities.some((cityItem) => cityItem.toLowerCase().includes(q))
    );
  }, [countrySearch]);

  const citySuggestions = useMemo(
    () => getCitySuggestionsForCountry(country),
    [country]
  );

  const toggleDestination = (code: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOnboarding || onboardingSavedSuccess) return;
    setFormError(null);

    if (!firstName.trim()) {
      setFormError(copy.firstNameRequiredError);
      return;
    }

    setIsSubmittingOnboarding(true);
    setOnboardingSavedSuccess(true);

    // Wait briefly so the subtle success confirmation is perceptible before entering the dashboard
    await new Promise((resolve) => setTimeout(resolve, 260));

    const result = await completeOnboarding({
      firstName,
      lastName,
      country,
      city,
      targetDegree,
      targetCountries: selectedDestinations,
      targetDisciplines: selectedInterests,
    });

    if (!result.ok) {
      setOnboardingSavedSuccess(false);
      setIsSubmittingOnboarding(false);
      setFormError(result.error || copy.firstNameRequiredError);
    }
  };

  const previewInitials = computeUserInitials(
    {
      firstName: firstName || profile.firstName,
      lastName: lastName || profile.lastName,
      displayName: profile.displayName,
      accountType: 'authenticated',
    },
    false
  );

  return (
    <div
      data-testid="cinematic-landing-screen"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020611] text-white flex flex-col justify-between select-none"
    >
      {/* Full-Screen 100vw x 100vh Promotional Video Background */}
      <div
        className="fixed inset-0 z-0 w-screen h-screen overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {!videoFailed ? (
          <video
            ref={videoRef}
            data-testid="landing-bg-video"
            className="w-full h-full object-cover object-center"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/src/assets/images/hero_editorial_campus_1794911987494.jpg"
            onError={() => setVideoFailed(true)}
          >
            <source
              src="/assets/aistudio/gemini_generated_video_a03f2bc6_3da6b840.mp4"
              type="video/mp4"
            />
            <source src="/video_1.mp4" type="video/mp4" />
          </video>
        ) : (
          <div
            data-testid="landing-video-fallback"
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/src/assets/images/hero_editorial_campus_1794911987494.jpg")',
            }}
          />
        )}

        {/* Sophisticated Dark Navy Tint + Radial Vignette + Subtle Cyan-Blue Atmospheric Illumination */}
        <div className="absolute inset-0 bg-[#030816]/48" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(6, 16, 36, 0.22) 0%, rgba(3, 9, 22, 0.66) 64%, rgba(2, 5, 14, 0.92) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.05) 42%, transparent 72%)',
          }}
        />
      </div>

      {/* Top Floating Language Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-end">
        <nav
          aria-label="Interface language selector"
          className="inline-flex items-center gap-1 rounded-2xl bg-[#071126]/70 backdrop-blur-xl border border-cyan-300/20 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16)]"
        >
          {LANGUAGES.map((langItem) => {
            const active = language === langItem.code;
            return (
              <button
                key={langItem.code}
                type="button"
                data-testid={`landing-lang-${langItem.code}`}
                onClick={() => setLanguage(langItem.code)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-sky-500/25 text-white border border-sky-300/40 shadow-[0_0_14px_rgba(56,189,248,0.25)] font-semibold'
                    : 'text-slate-300/80 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {langItem.short}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Central Viewport Container for the Premium Glass Authentication / Onboarding Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
        <motion.section
          data-testid="central-glass-auth-card"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: MOTION_EASE }}
          className={`w-full ${
            needsOnboarding ? 'max-w-[620px]' : 'max-w-[460px]'
          } rounded-3xl bg-[#060E22]/74 backdrop-blur-2xl border border-cyan-300/22 shadow-[0_32px_90px_rgba(2,6,23,0.88),0_0_55px_rgba(14,165,233,0.13),inset_0_1px_0_rgba(255,255,255,0.25)] overflow-hidden transition-[max-width] duration-500`}
        >
          {/* Delicate Top Specular Glass Highlight Line */}
          <div
            className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent"
            aria-hidden="true"
          />

          <div
            className={`${
              needsOnboarding ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
            } max-h-[calc(100vh-4.5rem)] overflow-y-auto custom-scrollbar`}
          >
            {/* Brand Identity Header */}
            <div
              className={
                needsOnboarding
                  ? 'flex items-center justify-center gap-3.5 text-left'
                  : 'flex flex-col items-center text-center space-y-3'
              }
            >
              <div className={needsOnboarding ? 'scale-90 shrink-0' : ''}>
                <PlatformCrestEmblem />
              </div>
              <div className="space-y-0.5">
                <h1
                  data-testid="landing-brand-title"
                  className={`font-display ${
                    needsOnboarding ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                  } font-semibold tracking-[0.08em] uppercase text-white`}
                >
                  {copy.officialBrand}
                </h1>
                <p
                  data-testid="landing-brand-tagline"
                  className="text-xs sm:text-sm font-medium tracking-wide text-sky-200/90"
                >
                  {copy.officialTagline}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {!needsOnboarding ? (
                /* =========================================================
                   STEP 1 — GOOGLE OAUTH & GUEST AUTHENTICATION
                ========================================================= */
                <motion.div
                  key="auth-step-1"
                  data-testid="auth-step-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: MOTION_EASE }}
                  className="mt-6 space-y-5"
                >
                  <p className="text-xs sm:text-sm text-slate-300/85 text-center leading-relaxed">
                    {copy.step1Subtitle}
                  </p>

                  {authError && (
                    <div
                      role="alert"
                      data-testid="auth-error-alert"
                      className="rounded-2xl border border-red-400/40 bg-red-950/55 px-4 py-3 text-xs sm:text-sm text-red-100 leading-relaxed"
                    >
                      {authError}
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    {authProvidersConfig.google ? (
                      <button
                        type="button"
                        data-testid="google-signin-btn"
                        disabled={authLoading}
                        onClick={() => void signInWithGoogle()}
                        className="w-full rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-900 font-semibold text-sm px-5 py-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-sky-600 shrink-0" />
                            <span>{copy.authenticatingGoogle}</span>
                          </>
                        ) : (
                          <>
                            <OfficialGoogleLogo className="w-5 h-5 shrink-0" />
                            <span>{copy.continueWithGoogle}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div
                        role="alert"
                        className="rounded-2xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-xs text-amber-200"
                      >
                        Google OAuth requires valid Firebase `apiKey` and `oAuthClientId` in `firebase-applet-config.json`.
                      </div>
                    )}

                    <button
                      type="button"
                      data-testid="guest-signin-btn"
                      disabled={authLoading}
                      onClick={enterGuestMode}
                      className="w-full rounded-2xl bg-white/[0.06] hover:bg-white/[0.11] active:scale-[0.99] border border-cyan-200/20 text-slate-100 font-medium text-xs sm:text-sm px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                    >
                      <Compass className="w-4 h-4 text-sky-300 shrink-0" />
                      <span>{copy.continueAsGuest}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300/80 shrink-0" />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{copy.securityNote}</span>
                  </div>
                </motion.div>
              ) : (
                /* =========================================================
                   STEP 2 — FIRST-LOGIN PERSONAL PROFILE ONBOARDING
                ========================================================= */
                <motion.form
                  key="auth-step-2"
                  data-testid="onboarding-profile-step"
                  onSubmit={handleSaveOnboarding}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: MOTION_EASE }}
                  className="mt-3.5 space-y-3 text-left"
                >
                  {/* Step 2 Header & Connected Google Identity Badge */}
                  <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2
                        data-testid="onboarding-step-title"
                        className="font-display text-lg sm:text-xl font-semibold text-white"
                      >
                        {copy.step2Header}
                      </h2>
                      <p className="text-xs text-slate-300/85 mt-0.5">
                        {copy.step2Subtitle}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-white/[0.06] border border-white/15 px-2.5 py-1.5">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-cyan-300/30"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-sky-500/25 border border-sky-300/40 text-[11px] font-semibold text-sky-200 flex items-center justify-center">
                          {previewInitials}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-200 truncate max-w-[140px]">
                        {profile.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => void logout()}
                        title={copy.signOutAccountBtn}
                        aria-label={copy.signOutAccountBtn}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      data-testid="onboarding-error-alert"
                      className="rounded-xl border border-red-400/40 bg-red-950/55 px-3.5 py-2.5 text-xs text-red-100"
                    >
                      {formError}
                    </div>
                  )}

                  {onboardingSavedSuccess && (
                    <div
                      role="status"
                      data-testid="onboarding-success-banner"
                      className="rounded-xl border border-emerald-400/40 bg-emerald-950/55 px-3.5 py-2.5 text-xs text-emerald-100 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>{copy.profileSavedSuccess}</span>
                    </div>
                  )}

                  {/* A. First Name (Ism) & B. Last Name (Familiya) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="onboarding-first-name"
                        className="block text-xs font-medium text-slate-200 mb-1"
                      >
                        {copy.firstNameLabel} <span className="text-sky-400">*</span>
                      </label>
                      <input
                        id="onboarding-first-name"
                        data-testid="onboarding-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder={copy.firstNamePlaceholder}
                        className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400/70 focus:outline-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400/70 transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="onboarding-last-name"
                        className="block text-xs font-medium text-slate-200 mb-1"
                      >
                        {copy.lastNameLabel}
                      </label>
                      <input
                        id="onboarding-last-name"
                        data-testid="onboarding-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={copy.lastNamePlaceholder}
                        className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400/70 focus:outline-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400/70 transition-colors"
                      />
                    </div>
                  </div>

                  {/* C. Country (Mamlakat) & D. City (Shahar) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div ref={countryDropdownRef} className="relative">
                      <label
                        htmlFor="onboarding-country-input"
                        className="block text-xs font-medium text-slate-200 mb-1"
                      >
                        {copy.countryLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="onboarding-country-input"
                          data-testid="onboarding-country-input"
                          type="text"
                          value={country}
                          onFocus={() => setCountryPickerOpen(true)}
                          onChange={(e) => {
                            setCountry(e.target.value);
                            setCountrySearch(e.target.value);
                            setCountryPickerOpen(true);
                          }}
                          placeholder={copy.countrySearchPlaceholder}
                          className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400/70 focus:outline-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400/70 transition-colors"
                        />
                        <button
                          type="button"
                          data-testid="onboarding-country-toggle"
                          aria-label="Toggle country list"
                          onClick={() => setCountryPickerOpen((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {countryPickerOpen && (
                        <div
                          data-testid="onboarding-country-dropdown"
                          className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-2xl bg-[#071226]/95 backdrop-blur-2xl border border-cyan-300/25 shadow-2xl p-1.5 z-40 space-y-0.5"
                        >
                          <div className="sticky top-0 bg-[#071226] pb-1 mb-1 border-b border-white/10 flex items-center gap-2 px-2 py-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              data-testid="onboarding-country-search"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder={copy.countrySearchPlaceholder}
                              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                          {filteredCountries.map((c) => {
                            const selected =
                              country.toLowerCase() === c.name.toLowerCase() ||
                              country.toLowerCase() === c.code.toLowerCase();
                            return (
                              <button
                                key={c.code}
                                type="button"
                                data-testid={`onboarding-country-option-${c.code}`}
                                onClick={() => {
                                  setCountry(c.name);
                                  setCountrySearch('');
                                  setCountryPickerOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-colors ${
                                  selected
                                    ? 'bg-sky-500/25 text-white font-semibold'
                                    : 'text-slate-200 hover:bg-white/[0.08]'
                                }`}
                              >
                                <span className="truncate">
                                  {c.flag} {c.name}
                                </span>
                                {selected && <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="onboarding-city-input"
                        className="block text-xs font-medium text-slate-200 mb-1"
                      >
                        {copy.cityLabel}
                      </label>
                      <input
                        id="onboarding-city-input"
                        data-testid="onboarding-city-input"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={copy.cityPlaceholder}
                        className="w-full rounded-xl bg-white/[0.06] border border-white/15 focus:border-sky-400/70 focus:outline-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400/70 transition-colors"
                      />
                      {/* Country-dependent quick city suggestions */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {citySuggestions.slice(0, 4).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            data-testid={`onboarding-city-chip-${suggestion}`}
                            onClick={() => setCity(suggestion)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors cursor-pointer ${
                              city.toLowerCase() === suggestion.toLowerCase()
                                ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.12]'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* E. Target Degree Level (Ta'lim bosqichi) */}
                  <div>
                    <p className="block text-xs font-medium text-slate-200 mb-1.5">
                      {copy.degreeLabel}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: 'Bachelor', label: copy.degreeBachelor },
                          { value: 'Master', label: copy.degreeMaster },
                          { value: 'PhD', label: copy.degreePhd },
                        ] as const
                      ).map((deg) => {
                        const active = targetDegree === deg.value;
                        return (
                          <button
                            key={deg.value}
                            type="button"
                            data-testid={`onboarding-degree-${deg.value}`}
                            onClick={() => setTargetDegree(deg.value)}
                            className={`rounded-xl px-3 py-2.5 text-xs font-medium text-center transition-all cursor-pointer border ${
                              active
                                ? 'bg-sky-500/25 border-sky-300/55 text-white font-semibold shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                                : 'bg-white/[0.05] border-white/12 text-slate-300 hover:bg-white/[0.1] hover:text-white'
                            }`}
                          >
                            {deg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* F. Preferred Study Destinations (O'qishni xohlagan davlatlar) */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-200">
                        {copy.destinationsLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {copy.destinationsHint}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {STUDY_DESTINATION_OPTIONS.map((dest) => {
                        const active = selectedDestinations.includes(dest.code);
                        return (
                          <button
                            key={dest.code}
                            type="button"
                            data-testid={`onboarding-dest-${dest.code}`}
                            onClick={() => toggleDestination(dest.code)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
                              active
                                ? 'bg-sky-500/25 border-sky-300/50 text-white font-medium shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                                : 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.1]'
                            }`}
                          >
                            <span>{dest.flag}</span>
                            <span>{dest.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* G. Field of Interest (Qiziqqan yo'nalish) */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-200">
                        {copy.interestsLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {copy.interestsHint}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_OF_INTEREST_OPTIONS.map((interest) => {
                        const active = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            data-testid={`onboarding-interest-${interest
                              .toLowerCase()
                              .replace(/\s+/g, '-')}`}
                            onClick={() => toggleInterest(interest)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                              active
                                ? 'bg-cyan-500/25 border-cyan-300/50 text-white font-medium shadow-[0_0_12px_rgba(34,211,238,0.18)]'
                                : 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.1]'
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Submit Button: Platformaga kirish / Save & Continue */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      data-testid="onboarding-submit-btn"
                      disabled={isSubmittingOnboarding}
                      className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500 hover:from-sky-400 hover:to-cyan-300 active:scale-[0.99] text-slate-950 font-semibold text-sm px-5 py-3.5 shadow-[0_12px_30px_rgba(14,165,233,0.38),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                    >
                      {isSubmittingOnboarding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                          <span>{copy.savingProfile}</span>
                        </>
                      ) : (
                        <>
                          <span>{copy.saveAndContinueBtn}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </main>

      {/* Subtle Bottom Attribution Footer */}
      <footer className="relative z-10 pb-3 sm:pb-4 text-center text-[11px] text-slate-400/75 pointer-events-none">
        <span>Global University Intelligence · Verified International Academic Atlas</span>
      </footer>
    </div>
  );
};
