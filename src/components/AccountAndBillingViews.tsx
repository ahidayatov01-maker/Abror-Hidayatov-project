import React, { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Download,
  Info,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspaceIntelligence } from '../context/WorkspaceIntelligenceContext';
import { getAllTierDefinitions } from '../utils/entitlements';
import {
  computeUserInitials,
  formatUserDisplayName,
} from '../utils/userProfileHelpers';
import { ONBOARDING_TRANSLATIONS } from '../i18n/onboardingTranslations';
import { GlassButton, GlassInput, GlassSegmented, GlassSelect } from './glass';
import { getUniversalMicroCopy } from '../utils/displayCopy';
import type { AppearanceMode, LanguageCode, SubscriptionTier } from '../types/domain';

const DISCIPLINE_OPTIONS = [
  'Computer Science',
  'Artificial Intelligence',
  'Information Technology',
  'Engineering',
  'Business',
  'Economics',
  'Medicine',
  'Law',
  'Architecture',
  'Social Sciences',
  'Natural Sciences',
  'Mathematics',
  'Arts',
];

export const AccountSettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    isAuthenticated,
    isGuest,
    signInWithGoogle,
    language,
    setLanguage,
    appearance,
    setAppearance,
    exportUserData,
    deleteAccount,
    catalog,
    t,
  } = useApp();

  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [country, setCountry] = useState(profile.country || '');
  const [city, setCity] = useState(profile.city || '');
  const [educationLevel, setEducationLevel] = useState(profile.currentEducationLevel);
  const [targetDegree, setTargetDegree] = useState(profile.targetDegree);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setCountry(profile.country || '');
    setCity(profile.city || '');
    setEducationLevel(profile.currentEducationLevel);
    setTargetDegree(profile.targetDegree);
  }, [
    profile.firstName,
    profile.lastName,
    profile.country,
    profile.city,
    profile.currentEducationLevel,
    profile.targetDegree,
  ]);

  const copy = ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS.en;
  const userFullName = formatUserDisplayName(profile, isGuest);
  const userInitials = computeUserInitials(profile, isGuest);

  const toggleDiscipline = (disc: string) => {
    const exists = profile.targetDisciplines.includes(disc);
    const next = exists
      ? profile.targetDisciplines.filter((d) => d !== disc)
      : [...profile.targetDisciplines, disc];
    void updateProfile({ targetDisciplines: next });
  };

  const toggleCountry = (isoCode: string) => {
    const exists = profile.targetCountries.includes(isoCode);
    const next = exists
      ? profile.targetCountries.filter((c) => c !== isoCode)
      : [...profile.targetCountries, isoCode];
    void updateProfile({ targetCountries: next });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedFirst = firstName.trim();
    const cleanedLast = lastName.trim();
    const computedDisplay =
      [cleanedFirst, cleanedLast].filter(Boolean).join(' ') || profile.displayName;
    await updateProfile({
      firstName: cleanedFirst,
      lastName: cleanedLast,
      displayName: computedDisplay,
      country: country.trim(),
      city: city.trim(),
      currentEducationLevel: educationLevel,
      targetDegree,
    });
    setSaveNotice('Academic profile preferences saved.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-[var(--border-hairline)] pb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {t.accountView.title}
        </h1>
      </div>

      {/* Connected Account Status */}
      <section className="surface-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.avatarUrl && !isGuest ? (
            <img
              src={profile.avatarUrl}
              alt={userFullName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border border-[var(--border-hairline)]"
            />
          ) : (
            <span className="w-14 h-14 rounded-full glass-pill-active border border-cyan-300/35 text-lg font-mono-tabular font-bold text-[var(--accent-primary)] flex items-center justify-center shrink-0">
              {userInitials}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p
                data-testid="account-settings-display-name"
                className="font-display text-2xl font-semibold"
              >
                {userFullName}
              </p>
              {isAuthenticated && profile.isOwner && (
                <span
                  data-testid="account-owner-badge"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Platform Owner · Global Elite Pro
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {isAuthenticated
                ? profile.isOwner
                  ? `Verified Platform Owner (${profile.email}) · Permanent Global Elite Pro · No Billing Required`
                  : `Connected via Google (${profile.email}) · Synced to PostgreSQL`
                : isGuest
                ? 'Free Explorer Mode · Stored locally in browser'
                : 'Not signed in'}
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            {t.signInGoogle}
          </button>
        )}
      </section>

      {/* Academic Profile Form */}
      <form onSubmit={handleSaveProfile} className="surface-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{t.accountView.profileTitle}</h2>
          {saveNotice && (
            <span
              data-testid="account-profile-saved-notice"
              className="text-xs text-emerald-700 dark:text-emerald-400 font-medium"
            >
              {saveNotice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="acc-first-name" className="block text-xs text-[var(--text-muted)] mb-1">
              {copy.firstNameLabel}
            </label>
            <GlassInput
              id="acc-first-name"
              data-testid="account-first-name-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="acc-last-name" className="block text-xs text-[var(--text-muted)] mb-1">
              {copy.lastNameLabel}
            </label>
            <GlassInput
              id="acc-last-name"
              data-testid="account-last-name-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="acc-country" className="block text-xs text-[var(--text-muted)] mb-1">
              {copy.countryLabel}
            </label>
            <GlassInput
              id="acc-country"
              data-testid="account-country-input"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="acc-city" className="block text-xs text-[var(--text-muted)] mb-1">
              {copy.cityLabel}
            </label>
            <GlassInput
              id="acc-city"
              data-testid="account-city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="acc-level" className="block text-xs text-[var(--text-muted)] mb-1">
              {t.accountView.educationLevel}
            </label>
            <GlassSelect
              id="acc-level"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full text-sm"
            >
              <option value="High School Senior">High School Senior</option>
              <option value="Undergraduate Student">Undergraduate Student</option>
              <option value="Bachelor Graduate">Bachelor Graduate</option>
              <option value="Master Graduate">Master Graduate</option>
              <option value="Researcher / Counselor">Researcher / Counselor</option>
            </GlassSelect>
          </div>
          <div>
            <label htmlFor="acc-degree" className="block text-xs text-[var(--text-muted)] mb-1">
              {t.accountView.targetDegree}
            </label>
            <GlassSelect
              id="acc-degree"
              data-testid="account-degree-select"
              value={targetDegree}
              onChange={(e) => setTargetDegree(e.target.value)}
              className="w-full text-sm"
            >
              <option value="Bachelor">Bachelor (Bakalavr)</option>
              <option value="Master">Master (Magistratura)</option>
              <option value="PhD">PhD</option>
            </GlassSelect>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">{t.accountView.disciplines}</p>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINE_OPTIONS.map((disc) => {
              const active = profile.targetDisciplines.includes(disc);
              return (
                <GlassButton
                  key={disc}
                  variant="pill"
                  active={active}
                  onClick={() => toggleDiscipline(disc)}
                  className="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  {disc}
                </GlassButton>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">{t.accountView.countries}</p>
          <div className="flex flex-wrap gap-2">
            {catalog.countries.map((c) => {
              const active = profile.targetCountries.includes(c.isoCode);
              return (
                <GlassButton
                  key={c.isoCode}
                  variant="pill"
                  active={active}
                  onClick={() => toggleCountry(c.isoCode)}
                  className="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  {c.flagEmoji} {c.name}
                </GlassButton>
              );
            })}
          </div>
        </div>

        <GlassButton
          type="submit"
          variant="primary"
          className="rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
        >
          {t.common.save}
        </GlassButton>
      </form>

      {/* Appearance & Language */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold">{t.common.appearance}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {(['light', 'dark', 'bw'] as AppearanceMode[]).map((mode) => (
              <GlassButton
                key={mode}
                variant="pill"
                active={appearance === mode}
                onClick={() => setAppearance(mode)}
                className="rounded-xl p-3 text-xs font-medium text-center cursor-pointer"
              >
                {mode === 'light'
                  ? t.common.lightMode
                  : mode === 'dark'
                  ? t.common.darkMode
                  : t.common.bwMode}
              </GlassButton>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold">{t.common.language}</h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { code: 'en', label: 'English' },
                { code: 'uz', label: 'O‘zbek' },
                { code: 'ru', label: 'Русский' },
                { code: 'ja', label: '日本語' },
                { code: 'zh', label: '中文' },
                { code: 'de', label: 'Deutsch' },
              ] as Array<{ code: LanguageCode; label: string }>
            ).map((l) => (
              <GlassButton
                key={l.code}
                variant="pill"
                active={language === l.code}
                onClick={() => setLanguage(l.code)}
                className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
              >
                {l.label}
              </GlassButton>
            ))}
          </div>
        </div>
      </section>

      {/* Notification Preferences & Data Portability */}
      <section className="surface-card rounded-2xl p-6 space-y-5">
        <h2 className="font-display text-2xl font-semibold">{t.accountView.notifications}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {(
            [
              { key: 'deadlines', label: 'Admission Deadline Alerts' },
              { key: 'scholarships', label: 'Scholarship Cycle Notices' },
              { key: 'advisorDigest', label: 'Academic Digest Summaries' },
            ] as const
          ).map((pref) => {
            const enabled = profile.notificationPrefs[pref.key];
            return (
              <label
                key={pref.key}
                className="surface-subtle rounded-xl flex items-center justify-between gap-3 px-4 py-3 text-xs font-medium cursor-pointer"
              >
                <span>{pref.label}</span>
                <span className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={enabled}
                    checked={enabled}
                    onChange={(e) =>
                      void updateProfile({
                        notificationPrefs: {
                          ...profile.notificationPrefs,
                          [pref.key]: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <span
                    className={`w-11 h-6 rounded-full border transition-colors duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center px-0.5 ${
                      enabled
                        ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/25 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_12px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)]'
                        : 'border-[var(--border-hairline)] bg-[var(--glass-input-bg)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] border border-white/40 shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.7)] ${
                        enabled
                          ? 'translate-x-5 bg-gradient-to-b from-white to-sky-200 dark:from-sky-300 dark:to-sky-500'
                          : 'translate-x-0 bg-gradient-to-b from-white/90 to-slate-300 dark:from-slate-300 dark:to-slate-500'
                      }`}
                    />
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => void exportUserData()}
            className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.accountView.exportData}</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 text-red-700 dark:text-red-400 dark:border-red-900 px-4 py-2 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.accountView.deleteData}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 dark:text-red-400">
                Permanently erase saved data?
              </span>
              <button
                type="button"
                onClick={async () => {
                  await deleteAccount();
                  setConfirmDelete(false);
                }}
                className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                {t.common.delete}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-glass rounded-xl px-3 py-1.5 text-xs cursor-pointer"
              >
                {t.common.cancel}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const SubscriptionsAndPaymentsView: React.FC = () => {
  const {
    profile,
    isAuthenticated,
    language,
    paymentProviders,
    paymentHistory,
    switchSubscriptionTier,
    t,
  } = useApp();
  const { entitlementStatus } = useWorkspaceIntelligence();
  const allTiers = getAllTierDefinitions();
  const micro = getUniversalMicroCopy(language);
  const isOwner = Boolean(isAuthenticated && (profile.isOwner || entitlementStatus.isOwner));
  const activeTierId = isOwner ? 'premium' : profile.subscriptionTier;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedProvider, setSelectedProvider] = useState<string>('stripe_cards');
  const [checkoutFeedback, setCheckoutFeedback] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    const result = await switchSubscriptionTier(tier, selectedProvider, billingCycle);
    setCheckoutFeedback(result);
  };

  return (
    <div className="space-y-8 max-w-6xl" data-testid="subscriptions-view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          {t.subscriptionsView.title}
        </h1>

        {!isOwner && (
          <GlassSegmented
            ariaLabel="Billing Cycle"
            value={billingCycle}
            onChange={setBillingCycle}
            layoutGroupId="billing-cycle-pill"
            className="p-1"
            buttonClassName="px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize"
            options={[
              { value: 'monthly', label: t.subscriptionsView.monthly },
              { value: 'annual', label: t.subscriptionsView.annual },
            ]}
          />
        )}
      </div>

      {/* Compact Platform Owner Strip */}
      {isOwner && (
        <section
          data-testid="owner-permanent-banner"
          className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Global Elite Pro · Owner</h2>
              <p className="text-xs text-[var(--text-secondary)]">{profile.email}</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Permanent
          </span>
        </section>
      )}

      {/* Live Daily Usage & Active Entitlement Bar */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">Active Plan</p>
          <p data-testid="active-plan-name" className="text-base font-semibold mt-0.5">
            {isOwner ? 'Global Elite Pro (Owner)' : entitlementStatus.entitlements.name}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {entitlementStatus.entitlements.availableAgentIds.length}/10 AI Agents Unlocked
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">AI Consultations Today</p>
          <p className="text-base font-mono-tabular font-semibold mt-0.5">
            {entitlementStatus.unlimitedQuotas
              ? `${entitlementStatus.usage.aiMessagesToday} / Unlimited`
              : `${entitlementStatus.usage.aiMessagesToday} / ${entitlementStatus.entitlements.dailyAiMessages}`}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">Roadmap Generations Today</p>
          <p className="text-base font-mono-tabular font-semibold mt-0.5">
            {entitlementStatus.unlimitedQuotas
              ? `${entitlementStatus.usage.roadmapGenerationsToday} / Unlimited`
              : `${entitlementStatus.usage.roadmapGenerationsToday} / ${entitlementStatus.entitlements.dailyRoadmapGenerations}`}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">Routine Generations Today</p>
          <p className="text-base font-mono-tabular font-semibold mt-0.5">
            {entitlementStatus.unlimitedQuotas
              ? `${entitlementStatus.usage.routineGenerationsToday} / Unlimited`
              : `${entitlementStatus.usage.routineGenerationsToday} / ${entitlementStatus.entitlements.dailyRoutineGenerations}`}
          </p>
        </div>
      </section>

      {checkoutFeedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs flex items-start gap-2.5 ${
            checkoutFeedback.ok
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-200'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{checkoutFeedback.message}</span>
        </div>
      )}

      {/* 3 Crisp Pricing Cards ($0 / $9 / $24) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allTiers.map((tier) => {
          const cardCopy = micro.pricingCards.find((c) => c.tierId === tier.tierId);
          const isCurrent = activeTierId === tier.tierId;
          const displayPrice =
            billingCycle === 'annual'
              ? cardCopy?.priceYearlyUsd ?? tier.priceYearlyUsd
              : cardCopy?.priceMonthlyUsd ?? tier.priceMonthlyUsd;
          const highlightCard = isOwner ? tier.tierId === 'premium' : Boolean(tier.recommended);
          const bullets = cardCopy?.bullets ?? tier.highlights;
          return (
            <div
              key={tier.tierId}
              className={`rounded-2xl border bg-[var(--bg-elevated)] p-6 flex flex-col justify-between gap-6 ${
                highlightCard
                  ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]'
                  : 'border-[var(--border-hairline)]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-2xl font-semibold">
                      {cardCopy?.name ?? tier.name}
                    </h2>
                    {isOwner && tier.tierId === 'premium' ? (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Owner
                      </span>
                    ) : cardCopy?.badge ? (
                      <span className="text-[11px] font-semibold text-[var(--accent-primary)]">
                        {cardCopy.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-mono-tabular text-3xl font-semibold mt-3">
                    {isOwner && tier.tierId === 'premium'
                      ? 'Owner'
                      : displayPrice === 0
                      ? '$0'
                      : `$${displayPrice}${billingCycle === 'annual' ? '/yr' : '/mo'}`}
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border-hairline)]">
                  {bullets.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isOwner ? (
                <div
                  className={`w-full rounded-xl py-2.5 px-3 text-center text-xs font-semibold ${
                    tier.tierId === 'premium'
                      ? 'bg-emerald-500/15 border border-emerald-600/35 text-emerald-700 dark:text-emerald-300'
                      : 'surface-subtle text-[var(--text-muted)]'
                  }`}
                >
                  {tier.tierId === 'premium' ? t.subscriptionsView.activePlan : '—'}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => void handleSelectPlan(tier.tierId)}
                  className={`w-full rounded-xl py-2.5 text-xs font-semibold cursor-pointer ${
                    isCurrent
                      ? 'surface-subtle text-[var(--text-muted)] cursor-default'
                      : 'btn-primary'
                  }`}
                >
                  {isCurrent
                    ? t.subscriptionsView.activePlan
                    : t.subscriptionsView.upgradePlan}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Providers Matrix */}
      <section className="surface-card rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          {t.subscriptionsView.paymentGateways}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentProviders.map((prov) => {
            const active = selectedProvider === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => setSelectedProvider(prov.id)}
                className={`rounded-xl p-4 text-left transition-[transform,border-color,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  active
                    ? 'glass-pill-active text-[var(--text-primary)]'
                    : 'surface-subtle hover:border-[var(--accent-primary)]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{prov.name}</span>
                  <span className="text-[11px] font-mono-tabular text-[var(--text-muted)]">
                    {prov.region}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Billing History */}
      <section className="surface-card rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">{t.subscriptionsView.billingHistory}</h2>
        {paymentHistory.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">
            No completed payment transactions recorded on this account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Provider</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {paymentHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pr-4 font-mono-tabular">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-4">{tx.description}</td>
                    <td className="py-2.5 pr-4 uppercase font-mono-tabular">{tx.provider}</td>
                    <td className="py-2.5 pr-4 font-mono-tabular">
                      {(tx.amountMinor / 100).toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-2.5">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
