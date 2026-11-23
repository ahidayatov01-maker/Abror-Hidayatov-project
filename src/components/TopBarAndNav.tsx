import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  Globe,
  Building2,
  Flag,
  GraduationCap,
  BookOpen,
  Award,
  BarChart3,
  ClipboardCheck,
  GitCompare,
  Bookmark,
  Route,
  Calculator,
  Sparkles,
  FolderKanban,
  Settings,
  Crown,
  Menu,
  X,
  Download,
  LogOut,
  Check,
  ChevronDown,
  WifiOff,
  Flame,
  CalendarClock,
  ListTodo,
  Info,
  CheckCircle2,
  AlertCircle,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspaceIntelligence } from '../context/WorkspaceIntelligenceContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getAllTierDefinitions, getTierEntitlements } from '../utils/entitlements';
import { countActiveGoals } from '../utils/goalsEngine';
import { AudioGuideControl } from './audio/AudioGuideControl';
import {
  MotionDrawer,
  MotionDropdown,
} from '../motion/MotionPrimitives';
import { MOTION_DURATION, MOTION_EASE } from '../motion/tokens';
import {
  GlassButton,
  GlassModal,
  GlassNavItem,
  DayNightLiquidToggle,
} from './glass';
import { AmbientAurora } from './glass/LuminousAtmosphere';
import { BrandLogoMark } from './brand/BrandLogo';
import { ONBOARDING_TRANSLATIONS } from '../i18n/onboardingTranslations';
import {
  computeUserInitials,
  formatUserDisplayName,
} from '../utils/userProfileHelpers';
import { getUniversalMicroCopy } from '../utils/displayCopy';
import type { AppearanceMode, LanguageCode, NavSectionId } from '../types/domain';

const LANGUAGES: Array<{ code: LanguageCode; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'uz', label: 'O‘zbek', native: 'UZ' },
  { code: 'ru', label: 'Русский', native: 'RU' },
  { code: 'ja', label: '日本語', native: 'JA' },
  { code: 'zh', label: '中文', native: 'ZH' },
  { code: 'de', label: 'Deutsch', native: 'DE' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeSection,
    setActiveSection,
    setSelectedUniversitySlug,
    t,
    language,
    setLanguage,
    appearance,
    setAppearance,
    profile,
    isAuthenticated,
    isGuest,
    logout,
    savedUniversities,
    compareSlugs,
    switchSubscriptionTier,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const langContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile.avatarUrl]);

  const userDisplayName = formatUserDisplayName(profile, isGuest);
  const userInitials = computeUserInitials(profile, isGuest);
  const onboardingCopy = ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS.en;
  const micro = getUniversalMicroCopy(language);
  const { toast, dismissToast, entitlementStatus, goalsState } = useWorkspaceIntelligence();
  const activeGoalsCount = countActiveGoals(goalsState.goals);
  const isOwner = Boolean(isAuthenticated && (profile.isOwner || entitlementStatus.isOwner));
  const userAccountTypeLabel = isOwner
    ? 'Global Elite Pro'
    : isAuthenticated
    ? onboardingCopy.accountTypeAuthenticated
    : isGuest
    ? onboardingCopy.accountTypeGuest
    : 'Scholar';

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (langContainerRef.current && !langContainerRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlanOpen(false);
        setLangOpen(false);
        setShowIOSGuide(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navGroups: Array<{
    title: string;
    items: Array<{ id: NavSectionId; label: string; icon: React.ReactNode; count?: number }>;
  }> = [
    {
      title: t.groups.discover,
      items: [
        { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'world-explorer', label: t.nav.worldExplorer, icon: <Globe className="w-4 h-4" /> },
        { id: 'explore-by-city', label: t.nav.exploreByCity, icon: <Building2 className="w-4 h-4" /> },
        { id: 'countries', label: t.nav.countries, icon: <Flag className="w-4 h-4" /> },
        { id: 'universities', label: t.nav.universities, icon: <GraduationCap className="w-4 h-4" /> },
      ],
    },
    {
      title: t.groups.academics,
      items: [
        { id: 'academic-programs', label: t.nav.academicPrograms, icon: <BookOpen className="w-4 h-4" /> },
        { id: 'scholarships', label: t.nav.scholarships, icon: <Award className="w-4 h-4" /> },
        { id: 'global-rankings', label: t.nav.globalRankings, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'admission-intelligence', label: t.nav.admissionIntelligence, icon: <ClipboardCheck className="w-4 h-4" /> },
        {
          id: 'university-comparison',
          label: t.nav.universityComparison,
          icon: <GitCompare className="w-4 h-4" />,
          count: compareSlugs.length,
        },
        { id: 'financial-planner', label: t.nav.financialPlanner, icon: <Calculator className="w-4 h-4" /> },
      ],
    },
    {
      title: t.groups.workspace,
      items: [
        {
          id: 'my-universities',
          label: t.nav.myUniversities,
          icon: <Bookmark className="w-4 h-4" />,
          count: savedUniversities.length,
        },
        {
          id: 'goals',
          label: t.nav.goals,
          icon: <Target className="w-4 h-4" />,
          count: activeGoalsCount > 0 ? activeGoalsCount : undefined,
        },
        { id: 'my-academic-journey', label: t.nav.myAcademicJourney, icon: <Route className="w-4 h-4" /> },
        { id: 'ai-advisor', label: t.nav.aiAdvisor, icon: <Sparkles className="w-4 h-4" /> },
        { id: 'routine', label: t.nav.routine, icon: <CalendarClock className="w-4 h-4" /> },
        { id: 'todo-list', label: t.nav.todoList, icon: <ListTodo className="w-4 h-4" /> },
        { id: 'paper-journal', label: t.nav.paperJournal, icon: <Flame className="w-4 h-4" /> },
        { id: 'research-library', label: t.nav.researchLibrary, icon: <FolderKanban className="w-4 h-4" /> },
      ],
    },
    {
      title: t.groups.account,
      items: [
        { id: 'account-settings', label: t.nav.accountSettings, icon: <Settings className="w-4 h-4" /> },
        { id: 'subscriptions', label: t.nav.subscriptions, icon: <Crown className="w-4 h-4" /> },
        { id: 'about', label: t.nav.about, icon: <Info className="w-4 h-4" /> },
      ],
    },
  ];

  const handleSelectNav = (id: NavSectionId) => {
    if (id !== 'universities') {
      setSelectedUniversitySlug(null);
    }
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const currentTierObj = getTierEntitlements(isOwner ? 'premium' : profile.subscriptionTier);
  const allTiers = getAllTierDefinitions();

  const activeNavLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === activeSection)?.label || t.nav.dashboard;

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex">
      <div className="liquid-ambient-backdrop" aria-hidden="true" />
      <AmbientAurora />

      {/* Floating 3D Liquid Glass Desktop Sidebar */}
      <aside className="relative z-20 hidden lg:flex lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:w-68 lg:shrink-0 lg:flex-col rounded-3xl glass-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <span className="shrink-0">
              <BrandLogoMark className="w-8 h-8" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight leading-snug">
              {t.brandName}
            </span>
          </button>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <p className="px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <GlassNavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    count={item.count}
                    isActive={activeSection === item.id}
                    onClick={() => handleSelectNav(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom User Summary Dock */}
        <div
          data-testid="sidebar-user-dock"
          className="p-3.5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2"
        >
          <button
            type="button"
            data-testid="sidebar-profile-trigger"
            onClick={() => handleSelectNav('account-settings')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 cursor-pointer"
          >
            {profile.avatarUrl && !avatarFailed && !isGuest ? (
              <div className="relative shrink-0">
                <img
                  src={profile.avatarUrl}
                  alt={userDisplayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-9 h-9 rounded-full object-cover border border-cyan-300/35 shadow-sm"
                />
                <span
                  data-testid="sidebar-user-initials"
                  className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-[18px] rounded-full bg-slate-900 border border-cyan-300/40 text-[9px] font-mono-tabular font-bold text-sky-200 flex items-center justify-center"
                >
                  {userInitials}
                </span>
              </div>
            ) : (
              <span
                data-testid="sidebar-user-initials"
                className="w-9 h-9 rounded-full glass-pill-active border border-cyan-300/35 text-xs font-mono-tabular font-bold text-[var(--accent-primary)] flex items-center justify-center shrink-0 shadow-sm"
              >
                {userInitials}
              </span>
            )}
            <div className="min-w-0">
              <p
                data-testid="sidebar-user-name"
                className="text-xs font-semibold truncate text-[var(--text-primary)]"
              >
                {userDisplayName}
              </p>
              <p
                data-testid="sidebar-user-account-type"
                className="text-[11px] text-[var(--text-muted)] truncate"
              >
                {userAccountTypeLabel}
              </p>
            </div>
          </button>
          <button
            type="button"
            data-testid="sidebar-logout-btn"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="btn-glass p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_DURATION.sidebar, ease: MOTION_EASE }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <MotionDrawer className="relative z-10 w-72 max-w-[85vw] glass-panel rounded-r-3xl flex flex-col h-full">
              <div className="px-4 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold truncate">{t.brandName}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="btn-glass p-2 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {group.title}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNav(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${
                          activeSection === item.id
                            ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-white/[0.06]'
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="p-3.5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectNav('account-settings')}
                  className="flex items-center gap-2.5 min-w-0 text-left"
                >
                  <span className="w-8 h-8 rounded-full glass-pill-active text-xs font-mono-tabular font-bold text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                    {userInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{userDisplayName}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {userAccountTypeLabel}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  aria-label="Sign out"
                  className="btn-glass p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </MotionDrawer>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Floating Glass Top Utility Header */}
        <header className="sticky top-3 z-30 mx-3 sm:mx-6 lg:mx-8 mt-3 rounded-2xl glass-panel px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden btn-glass p-2 -ml-0.5 rounded-xl shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-display text-base sm:text-xl font-semibold truncate">
              {activeNavLabel}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Day / Night Liquid Glass Toggle */}
            <DayNightLiquidToggle
              ariaLabel={t.common.appearance}
              appearance={appearance}
              onChange={setAppearance}
              className="hidden md:flex"
            />

            {/* Compact Language Selector Popover */}
            <div ref={langContainerRef} className="relative">
              <button
                type="button"
                data-testid="header-language-trigger"
                onClick={() => {
                  setLangOpen((v) => !v);
                  setPlanOpen(false);
                }}
                aria-expanded={langOpen}
                aria-label="Select interface language"
                className="btn-glass flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer"
              >
                <span className="font-mono-tabular uppercase">{language}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <MotionDropdown className="absolute right-0 mt-2 w-44 rounded-2xl glass-panel bg-[var(--bg-elevated)] shadow-2xl p-1.5 z-50">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        data-testid={`header-lang-option-${l.code}`}
                        onClick={() => {
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors ${
                          language === l.code
                            ? 'glass-pill-active font-semibold'
                            : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <span>{l.label}</span>
                        {language === l.code && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                      </button>
                    ))}
                  </MotionDropdown>
                )}
              </AnimatePresence>
            </div>

            {/* Multilingual Audio Guide & Voice Navigator (directly adjacent to language selector) */}
            <AudioGuideControl />

            {/* Clean Single-Line Tier Trigger */}
            <div>
              <button
                type="button"
                data-testid="header-plan-badge"
                onClick={() => {
                  setPlanOpen(true);
                  setLangOpen(false);
                }}
                aria-label="Open subscription plans modal"
                className={`btn-glass flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full whitespace-nowrap cursor-pointer ${
                  isOwner ? 'border-amber-500/45 dark:border-amber-400/45' : ''
                }`}
              >
                <Crown
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isOwner
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-[var(--accent-secondary)]'
                  }`}
                />
                <span className="text-[11px] sm:text-xs font-semibold">
                  {isOwner ? 'Global Elite Pro · Owner' : currentTierObj.name}
                </span>
              </button>
            </div>

            {/* In-App PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="btn-glass hidden sm:inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="btn-glass hidden sm:inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install iOS</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Section Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-900/90 text-amber-100 px-3.5 py-2 text-xs font-medium shadow-lg"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Cached catalog active</span>
        </div>
      )}

      {/* Global Non-Blocking Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-xs shadow-xl flex items-center gap-2.5 ${
            toast.tone === 'error'
              ? 'border-rose-500/40 bg-rose-950/95 text-rose-100'
              : toast.tone === 'info'
              ? 'border-[var(--accent-primary)]/40 bg-[var(--bg-solid-surface)] text-[var(--text-primary)]'
              : 'border-emerald-500/40 bg-[var(--bg-solid-surface)] text-[var(--text-primary)]'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subscription Plans Modal (centralized 3-tier entitlements) */}
      <GlassModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={isOwner ? 'Platform Owner · Global Elite Pro' : t.subscriptionsView.title}
        titleId="plan-modal-title"
        closeLabel={t.common.close}
        maxWidthClass="max-w-3xl"
      >
        {isOwner ? (
          <div className="space-y-4" data-testid="owner-plan-modal-summary">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Permanent Platform Owner Entitlement
                  </p>
                  <h3 className="font-display text-2xl font-semibold mt-0.5">
                    Global Elite Pro — Active Permanently
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  No Billing · Never Expires
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Verified server-side for platform owner <strong>{profile.email}</strong>. All 10
                specialized AI agents, unlimited daily AI consultations, 3-route Academic Roadmap,
                Smart Routine Architect, Audio Guide, Financial Planner, and full analytics are
                permanently unlocked.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
                {currentTierObj.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <GlassButton
                onClick={() => {
                  setPlanOpen(false);
                  handleSelectNav('subscriptions');
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                View Platform Plans Overview
              </GlassButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {micro.pricingCards.map((card) => {
                const tier = allTiers.find((item) => item.tierId === card.tierId);
                const active = card.tierId === profile.subscriptionTier;
                return (
                  <div
                    key={card.tierId}
                    className={`surface-card rounded-2xl p-5 flex flex-col justify-between gap-5 motion-interactive-card ${
                      active || tier?.recommended
                        ? 'ring-1 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
                        : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xl font-semibold block">
                          {card.name}
                        </span>
                        {card.badge && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-mono-tabular text-2xl font-semibold">
                        {card.priceMonthlyUsd === 0 ? '$0' : `$${card.priceMonthlyUsd}/mo`}
                      </p>
                      <ul className="space-y-2 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-hairline)]">
                        {card.bullets.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <GlassButton
                      variant={active ? 'subtle' : 'primary'}
                      disabled={active}
                      onClick={async () => {
                        if (card.tierId === 'free') {
                          await switchSubscriptionTier('free');
                          setPlanOpen(false);
                        } else {
                          setPlanOpen(false);
                          handleSelectNav('subscriptions');
                        }
                      }}
                      className={`w-full rounded-xl py-2.5 text-xs font-semibold ${
                        active ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      {active
                        ? t.subscriptionsView.activePlan
                        : t.subscriptionsView.upgradePlan}
                    </GlassButton>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-hairline)]">
              <p className="text-xs text-[var(--text-muted)]">
                Stripe · Payme · Click · Uzum
              </p>
              <GlassButton
                onClick={() => {
                  setPlanOpen(false);
                  handleSelectNav('subscriptions');
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                {t.nav.subscriptions}
              </GlassButton>
            </div>
          </>
        )}
      </GlassModal>

      {/* iOS PWA Guide Modal */}
      <GlassModal
        open={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
        title="Install on iPhone / iPad"
        titleId="ios-install-modal-title"
        maxWidthClass="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          1. Tap the <strong>Share</strong> icon in Safari.<br />
          2. Scroll down and select <strong>Add to Home Screen</strong>.
        </p>
        <GlassButton
          variant="primary"
          onClick={() => setShowIOSGuide(false)}
          className="w-full rounded-xl py-2 text-sm font-medium cursor-pointer"
        >
          Close
        </GlassButton>
      </GlassModal>
    </div>
  );
};
