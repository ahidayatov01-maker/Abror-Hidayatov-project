import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { TRANSLATIONS } from '../i18n/translations';
import type { TranslationBundle } from '../i18n/translations';
import { CURRENCY_REFERENCE_RATES } from '../data/seedCatalog';
import type {
  AdmissionRequirementRecord,
  AppearanceMode,
  CityRecord,
  CountryRecord,
  FolderAccentVariant,
  JourneyTaskEntry,
  LanguageCode,
  LibraryFolderRecord,
  LibraryMaterialRecord,
  MaterialContentAccess,
  MaterialStudyStatus,
  MaterialType,
  NavSectionId,
  ProgramRecord,
  RankingRecord,
  ResearchLibraryWorkspaceState,
  ResearchResourceEntry,
  SavedUniversityEntry,
  ScholarshipRecord,
  StudySchedulePreferences,
  StudySessionItem,
  SubscriptionTier,
  UniversityRecord,
  UserProfile,
} from '../types/domain';
import {
  createDefaultLibraryWorkspace,
  FOLDER_ACCENT_VARIANTS,
  formatLocalDateKey,
} from '../utils/researchLibraryEngine';
import {
  deleteMaterialBlob,
  getMaterialBlobAsBase64,
  saveMaterialBlob,
} from '../utils/libraryBlobStore';
import {
  parseFullName,
  validateOnboardingProfile,
  type OnboardingFormInput,
} from '../utils/userProfileHelpers';

interface E2EGoogleIdentity {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface PaymentProviderInfo {
  id: string;
  name: string;
  region: string;
  configured: boolean;
  requiredEnvVars: string[];
  mode: string;
}

interface PaymentTransactionItem {
  id: number;
  provider: string;
  amountMinor: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

interface NotificationItem {
  id: number | string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt?: string;
}

interface CatalogState {
  countries: CountryRecord[];
  cities: CityRecord[];
  universities: UniversityRecord[];
  programs: ProgramRecord[];
  rankings: RankingRecord[];
  scholarships: ScholarshipRecord[];
  admissions: AdmissionRequirementRecord[];
}

interface SavedScholarshipEntry {
  scholarshipSlug: string;
  status: string;
  notes: string;
}

interface ChecklistEntry {
  universitySlug: string;
  requirementKey: string;
  label: string;
  completed: boolean;
}

interface AppContextValue {
  authReady: boolean;
  authLoading: boolean;
  firebaseUser: FirebaseUser | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isAuthenticatedOrGuest: boolean;
  needsOnboarding: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  completeOnboarding: (input: OnboardingFormInput) => Promise<{ ok: boolean; error?: string }>;
  enterGuestMode: () => void;
  logout: () => Promise<void>;

  activeSection: NavSectionId;
  setActiveSection: (section: NavSectionId) => void;
  selectedCountryCode: string;
  setSelectedCountryCode: (code: string) => void;
  selectedCitySlug: string;
  setSelectedCitySlug: (slug: string) => void;
  selectedUniversitySlug: string | null;
  setSelectedUniversitySlug: (slug: string | null) => void;

  openUniversityProfile: (slug: string) => void;
  openCountryProfile: (isoCode: string) => void;
  openCityInExplorer: (countryCode: string, citySlug?: string) => void;

  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationBundle;
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;

  catalogLoading: boolean;
  catalogError: string | null;
  catalog: CatalogState;
  countriesByCode: Record<string, CountryRecord>;
  citiesBySlug: Record<string, CityRecord>;
  universitiesBySlug: Record<string, UniversityRecord>;

  currencyRates: {
    updatedAt: string;
    sourceOrg: string;
    isLive?: boolean;
    ratesFromUsd: Record<string, number>;
  };

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;

  savedUniversities: SavedUniversityEntry[];
  saveUniversity: (entry: Partial<SavedUniversityEntry> & { universitySlug: string }) => Promise<void>;
  removeSavedUniversity: (slug: string) => Promise<void>;

  compareSlugs: string[];
  toggleCompareSlug: (slug: string) => void;
  recentlyViewedSlugs: string[];
  recordRecentlyViewedUniversity: (slug: string) => void;

  journeyTasks: JourneyTaskEntry[];
  addJourneyTask: (task: Omit<JourneyTaskEntry, 'id'>) => Promise<void>;
  updateJourneyTask: (id: number | string, patch: Partial<JourneyTaskEntry>) => Promise<void>;
  deleteJourneyTask: (id: number | string) => Promise<void>;

  checklists: ChecklistEntry[];
  toggleChecklistItem: (
    universitySlug: string,
    requirementKey: string,
    label: string,
    completed: boolean
  ) => Promise<void>;

  savedScholarships: SavedScholarshipEntry[];
  saveScholarship: (slug: string, status?: string, notes?: string) => Promise<void>;
  removeSavedScholarship: (slug: string) => Promise<void>;

  researchResources: ResearchResourceEntry[];
  addResearchResource: (res: Omit<ResearchResourceEntry, 'id'>) => Promise<void>;
  deleteResearchResource: (id: number | string) => Promise<void>;

  libraryWorkspace: ResearchLibraryWorkspaceState;
  createLibraryFolder: (input: {
    name: string;
    description?: string;
    accentVariant?: FolderAccentVariant;
  }) => LibraryFolderRecord;
  renameLibraryFolder: (
    folderId: string,
    patch: { name?: string; description?: string; accentVariant?: FolderAccentVariant }
  ) => void;
  deleteLibraryFolder: (folderId: string) => Promise<void>;
  toggleFavoriteFolder: (folderId: string) => void;
  addLibraryMaterials: (
    items: Array<{
      folderId: string;
      title: string;
      fileName?: string;
      mimeType?: string;
      fileSizeBytes?: number;
      materialType: MaterialType;
      url?: string;
      universitySlug?: string | null;
      tags?: string[];
      notes?: string;
      extractedText?: string;
      slideTexts?: string[];
      pageCount?: number | null;
      contentAccess: MaterialContentAccess;
      unreadableReason?: string;
      blob?: Blob;
      previewDataUrl?: string;
    }>
  ) => Promise<LibraryMaterialRecord[]>;
  updateLibraryMaterial: (
    materialId: string,
    patch: Partial<LibraryMaterialRecord>
  ) => void;
  moveLibraryMaterial: (materialId: string, targetFolderId: string) => void;
  deleteLibraryMaterial: (materialId: string) => Promise<void>;
  analyzeLibraryMaterial: (materialId: string) => Promise<{ ok: boolean; error?: string }>;
  runCrossMaterialAnalysis: () => Promise<{ ok: boolean; error?: string }>;
  generateSmartSchedule: (
    preferencesPatch?: Partial<StudySchedulePreferences>
  ) => Promise<{ ok: boolean; error?: string }>;
  updateStudySession: (sessionId: string, patch: Partial<StudySessionItem>) => void;
  deleteStudySession: (sessionId: string) => void;
  addMaterialToPlan: (materialId: string, slot: 'today' | 'weekly') => void;
  updateSchedulePreferences: (patch: Partial<StudySchedulePreferences>) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: number | string) => Promise<void>;

  paymentProviders: PaymentProviderInfo[];
  paymentHistory: PaymentTransactionItem[];
  switchSubscriptionTier: (tier: SubscriptionTier, providerId?: string, billingCycle?: string) => Promise<{ ok: boolean; message: string }>;
  exportUserData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const GUEST_STORAGE_KEY = 'gui_guest_workspace_v1';
const GUEST_SESSION_ACTIVE_KEY = 'gui_guest_session_active_v1';
const E2E_GOOGLE_USER_KEY = 'gui_e2e_google_user_v1';
const GUEST_LIBRARY_STORAGE_KEY = 'gui_guest_library_workspace_v1';
const THEME_STORAGE_KEY = 'gui_appearance_v1';
const LANG_STORAGE_KEY = 'gui_language_v1';

const DEFAULT_GUEST_PROFILE: UserProfile = {
  uid: 'guest-scholar',
  email: 'guest@globaluni.local',
  firstName: '',
  lastName: '',
  displayName: 'Free Explorer',
  avatarUrl: '',
  country: '',
  city: '',
  preferredLanguage: 'en',
  appearanceMode: 'dark',
  currentEducationLevel: 'High School Senior',
  targetDegree: 'Bachelor',
  targetDisciplines: ['Computer Science', 'Artificial Intelligence', 'Engineering'],
  targetCountries: ['JP', 'GB', 'DE', 'US'],
  subscriptionTier: 'free',
  role: 'user',
  isOwner: false,
  billingExempt: false,
  subscriptionStatus: 'active',
  accountType: 'guest',
  onboardingCompleted: true,
  notificationPrefs: { deadlines: true, scholarships: true, advisorDigest: false },
};

const INITIAL_GUEST_TASKS: JourneyTaskEntry[] = [
  {
    id: 'g-task-1',
    title: 'Verify English proficiency test schedule (IELTS / TOEFL)',
    category: 'Exam',
    targetUniversitySlug: 'university-of-tokyo',
    dueDate: '2026-09-15',
    status: 'in_progress',
    notes: 'Confirm institution score reporting code on official portal.',
  },
  {
    id: 'g-task-2',
    title: 'Prepare official academic transcripts & counselor recommendations',
    category: 'Document',
    targetUniversitySlug: 'mit',
    dueDate: '2026-10-10',
    status: 'pending',
    notes: 'Request certified English translations where needed.',
  },
  {
    id: 'g-task-3',
    title: 'Review MEXT & El-Yurt Umidi scholarship cycle guidelines',
    category: 'Scholarship',
    targetUniversitySlug: null,
    dueDate: '2026-11-01',
    status: 'pending',
    notes: 'Check official embassy or foundation publication dates.',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const autostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [e2eGoogleUser, setE2eGoogleUser] = useState<E2EGoogleIdentity | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(E2E_GOOGLE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as E2EGoogleIdentity;
        if (parsed && parsed.uid) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (autostart) return true;
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem(GUEST_SESSION_ACTIVE_KEY) === '1';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSectionId>('dashboard');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('JP');
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>('tokyo-jp');
  const [selectedUniversitySlug, setSelectedUniversitySlug] = useState<string | null>(null);

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    if (saved && ['en', 'uz', 'ru', 'ja', 'zh', 'de'].includes(saved)) {
      return saved as LanguageCode;
    }
    return 'en';
  });

  const [appearance, setAppearanceState] = useState<AppearanceMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    if (saved && ['light', 'dark', 'bw'].includes(saved)) {
      return saved as AppearanceMode;
    }
    return 'dark';
  });

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogState>({
    countries: [],
    cities: [],
    universities: [],
    programs: [],
    rankings: [],
    scholarships: [],
    admissions: [],
  });

  const [currencyRates, setCurrencyRates] = useState<{
    updatedAt: string;
    sourceOrg: string;
    isLive?: boolean;
    ratesFromUsd: Record<string, number>;
  }>(CURRENCY_REFERENCE_RATES);

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_GUEST_PROFILE);
  const [savedUniversities, setSavedUniversities] = useState<SavedUniversityEntry[]>([
    {
      universitySlug: 'university-of-tokyo',
      collectionName: 'Asia Flagship',
      priority: 'Dream',
      applicationStatus: 'Researching',
      personalNotes: 'Review PEAK Environmental Sciences English track.',
    },
    {
      universitySlug: 'tu-munich',
      collectionName: 'Europe STEM',
      priority: 'Target',
      applicationStatus: 'Preparing',
      personalNotes: 'Check uni-assist VPD timeline and non-EU tuition rules.',
    },
  ]);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([
    'university-of-tokyo',
    'mit',
    'tu-munich',
  ]);
  const [recentlyViewedSlugs, setRecentlyViewedSlugs] = useState<string[]>([
    'university-of-tokyo',
    'eth-zurich',
  ]);
  const [journeyTasks, setJourneyTasks] = useState<JourneyTaskEntry[]>(INITIAL_GUEST_TASKS);
  const [checklists, setChecklists] = useState<ChecklistEntry[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarshipEntry[]>([
    { scholarshipSlug: 'mext-japan', status: 'Tracking', notes: 'Embassy track' },
  ]);
  const [researchResources, setResearchResources] = useState<ResearchResourceEntry[]>([
    {
      id: 'g-res-1',
      title: 'UTokyo PEAK Admissions Handbook',
      url: 'https://peak.c.u-tokyo.ac.jp/',
      folder: 'Japan Applications',
      tags: ['UTokyo', 'English Track'],
      universitySlug: 'university-of-tokyo',
      notes: 'Verify standardized score submission deadlines.',
    },
  ]);
  const [libraryWorkspace, setLibraryWorkspace] = useState<ResearchLibraryWorkspaceState>(() =>
    createDefaultLibraryWorkspace([
      {
        id: 'g-res-1',
        title: 'UTokyo PEAK Admissions Handbook',
        url: 'https://peak.c.u-tokyo.ac.jp/',
        folder: 'Japan Applications',
        tags: ['UTokyo', 'English Track'],
        universitySlug: 'university-of-tokyo',
        notes: 'Verify standardized score submission deadlines.',
      },
    ])
  );
  const [libraryHydrated, setLibraryHydrated] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Verify 2026–2027 Portal Deadlines',
      body: 'Always confirm final application dates on each university’s official admissions portal.',
      category: 'Verification',
      isRead: false,
    },
  ]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderInfo[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransactionItem[]>([]);

  // Apply appearance mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'bw');
    if (appearance === 'dark') {
      root.classList.add('dark');
    } else if (appearance === 'bw') {
      root.classList.add('bw');
    }
    localStorage.setItem(THEME_STORAGE_KEY, appearance);
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
  }, [language]);

  // Restore guest workspace from localStorage if in guest mode
  useEffect(() => {
    if (!firebaseUser && !e2eGoogleUser && isGuest) {
      let restoredResources: ResearchResourceEntry[] | null = null;
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.savedUniversities)) setSavedUniversities(parsed.savedUniversities);
          if (Array.isArray(parsed.journeyTasks)) setJourneyTasks(parsed.journeyTasks);
          if (Array.isArray(parsed.checklists)) setChecklists(parsed.checklists);
          if (Array.isArray(parsed.savedScholarships)) setSavedScholarships(parsed.savedScholarships);
          if (Array.isArray(parsed.researchResources)) {
            setResearchResources(parsed.researchResources);
            restoredResources = parsed.researchResources;
          }
          if (parsed.profile) {
            const restoredName =
              parsed.profile.displayName === 'Guest Scholar' || !parsed.profile.displayName
                ? 'Free Explorer'
                : parsed.profile.displayName;
            setProfile((prev) => ({
              ...prev,
              ...parsed.profile,
              displayName: restoredName,
              avatarUrl: '',
              accountType: 'guest',
              onboardingCompleted: true,
            }));
          } else {
            setProfile(DEFAULT_GUEST_PROFILE);
          }
        } else {
          setProfile(DEFAULT_GUEST_PROFILE);
        }
      } catch {
        setProfile(DEFAULT_GUEST_PROFILE);
      }
      try {
        const libRaw = localStorage.getItem(GUEST_LIBRARY_STORAGE_KEY);
        if (libRaw) {
          const parsedLib = JSON.parse(libRaw) as ResearchLibraryWorkspaceState;
          if (parsedLib && Array.isArray(parsedLib.folders) && Array.isArray(parsedLib.materials)) {
            setLibraryWorkspace(parsedLib);
          }
        } else if (restoredResources) {
          setLibraryWorkspace(createDefaultLibraryWorkspace(restoredResources));
        }
      } catch {
        // ignore invalid library cache
      }
      setLibraryHydrated(true);
    }
  }, [firebaseUser, e2eGoogleUser, isGuest]);

  // Persist guest workspace changes to localStorage
  useEffect(() => {
    if (!firebaseUser && isGuest) {
      try {
        localStorage.setItem(
          GUEST_STORAGE_KEY,
          JSON.stringify({
            profile,
            savedUniversities,
            journeyTasks,
            checklists,
            savedScholarships,
            researchResources,
          })
        );
      } catch {
        // ignore storage quota errors
      }
    }
  }, [
    firebaseUser,
    isGuest,
    profile,
    savedUniversities,
    journeyTasks,
    checklists,
    savedScholarships,
    researchResources,
  ]);

  // Persist rich Research Library workspace (guest localStorage or debounced authenticated PostgreSQL)
  useEffect(() => {
    if (!libraryHydrated) return;
    if (!firebaseUser && isGuest) {
      try {
        localStorage.setItem(GUEST_LIBRARY_STORAGE_KEY, JSON.stringify(libraryWorkspace));
      } catch {
        // ignore storage quota errors (raw binaries live in IndexedDB)
      }
      return;
    }
    if (firebaseUser) {
      const timer = setTimeout(async () => {
        try {
          const token = await firebaseUser.getIdToken();
          await fetch('/api/user/library-workspace', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ state: libraryWorkspace }),
          });
        } catch {
          // ignore transient sync error
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [libraryWorkspace, libraryHydrated, firebaseUser, isGuest]);

  // Load academic catalog & payment config & live/reference currency rates
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setCatalogLoading(true);
        const [catRes, payRes, fxRes] = await Promise.all([
          fetch('/api/catalog'),
          fetch('/api/payments/config'),
          fetch('/api/currency-rates'),
        ]);
        if (!catRes.ok) {
          throw new Error(`Catalog HTTP ${catRes.status}`);
        }
        const catData = (await catRes.json()) as CatalogState;
        if (active) {
          setCatalog({
            countries: catData.countries || [],
            cities: catData.cities || [],
            universities: catData.universities || [],
            programs: catData.programs || [],
            rankings: catData.rankings || [],
            scholarships: catData.scholarships || [],
            admissions: catData.admissions || [],
          });
          setCatalogError(null);
        }
        if (payRes.ok && active) {
          const payData = await payRes.json();
          setPaymentProviders(payData.providers || []);
        }
        if (fxRes.ok && active) {
          const fxData = await fxRes.json();
          if (fxData?.ratesFromUsd) {
            setCurrencyRates(fxData);
          }
        }
      } catch (err) {
        if (active) {
          setCatalogError(
            err instanceof Error ? err.message : 'Unable to load verified catalog.'
          );
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const buildAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    if (e2eGoogleUser) {
      return {
        'x-e2e-google-user': JSON.stringify({
          uid: e2eGoogleUser.uid,
          email: e2eGoogleUser.email,
          name: e2eGoogleUser.displayName,
          picture: e2eGoogleUser.photoURL || '',
        }),
      };
    }
    return null;
  }, [firebaseUser, e2eGoogleUser]);

  const hydrateAuthenticatedWorkspace = useCallback(
    async (
      headers: Record<string, string>,
      identityFallback: { email?: string | null; displayName?: string | null; photoURL?: string | null }
    ) => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/user/bootstrap', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const parsedFallback = parseFullName(
              data.profile.displayName || identityFallback.displayName,
              data.profile.email || identityFallback.email
            );
            const resolvedFirstName = data.profile.firstName || parsedFallback.firstName || '';
            const resolvedLastName = data.profile.lastName || parsedFallback.lastName || '';
            const resolvedDisplayName =
              [resolvedFirstName, resolvedLastName].filter(Boolean).join(' ') ||
              data.profile.displayName ||
              identityFallback.displayName ||
              'Scholar';

            setProfile({
              uid: data.profile.uid,
              email: data.profile.email || identityFallback.email || '',
              firstName: resolvedFirstName,
              lastName: resolvedLastName,
              displayName: resolvedDisplayName,
              avatarUrl: data.profile.avatarUrl || identityFallback.photoURL || '',
              country: data.profile.country || '',
              city: data.profile.city || '',
              preferredLanguage: data.profile.preferredLanguage || 'en',
              appearanceMode: data.profile.appearanceMode || 'dark',
              currentEducationLevel: data.profile.currentEducationLevel || 'High School Senior',
              targetDegree: data.profile.targetDegree || 'Bachelor',
              targetDisciplines: data.profile.targetDisciplines || [],
              targetCountries: data.profile.targetCountries || [],
              subscriptionTier: data.profile.subscriptionTier || 'free',
              role: data.profile.role === 'owner' || data.access?.isOwner ? 'owner' : 'user',
              isOwner: Boolean(data.profile.isOwner || data.access?.isOwner),
              billingExempt: Boolean(data.profile.billingExempt || data.access?.billingExempt),
              subscriptionStatus:
                data.profile.subscriptionStatus === 'permanent_owner' || data.access?.isOwner
                  ? 'permanent_owner'
                  : 'active',
              accountType: 'authenticated',
              onboardingCompleted: Boolean(data.profile.onboardingCompleted),
              createdAt: data.profile.createdAt,
              updatedAt: data.profile.updatedAt,
              notificationPrefs: data.profile.notificationPrefs || {
                deadlines: true,
                scholarships: true,
                advisorDigest: false,
              },
            });
            if (data.profile.preferredLanguage) {
              setLanguageState(data.profile.preferredLanguage);
            }
            if (data.profile.appearanceMode) {
              setAppearanceState(data.profile.appearanceMode);
            }
          }
          if (Array.isArray(data.savedUniversities)) setSavedUniversities(data.savedUniversities);
          if (Array.isArray(data.journeyTasks)) setJourneyTasks(data.journeyTasks);
          if (Array.isArray(data.admissionChecklists)) setChecklists(data.admissionChecklists);
          if (Array.isArray(data.savedScholarships)) setSavedScholarships(data.savedScholarships);
          if (Array.isArray(data.researchResources)) setResearchResources(data.researchResources);
          if (Array.isArray(data.notifications) && data.notifications.length > 0) {
            setNotifications(data.notifications);
          }
          if (Array.isArray(data.payments)) setPaymentHistory(data.payments);

          try {
            const libRes = await fetch('/api/user/library-workspace', { headers });
            if (libRes.ok) {
              const libData = await libRes.json();
              if (
                libData.state &&
                Array.isArray(libData.state.folders) &&
                Array.isArray(libData.state.materials)
              ) {
                setLibraryWorkspace(libData.state);
              } else {
                setLibraryWorkspace(
                  createDefaultLibraryWorkspace(
                    Array.isArray(data.researchResources) ? data.researchResources : []
                  )
                );
              }
            }
          } catch {
            setLibraryWorkspace(
              createDefaultLibraryWorkspace(
                Array.isArray(data.researchResources) ? data.researchResources : []
              )
            );
          } finally {
            setLibraryHydrated(true);
          }
        }
      } catch (err) {
        console.error('Failed to bootstrap authenticated workspace:', err);
      } finally {
        setAuthLoading(false);
        setAuthReady(true);
      }
    },
    []
  );

  // Auth listener & PostgreSQL workspace bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsGuest(false);
        try {
          sessionStorage.removeItem(GUEST_SESSION_ACTIVE_KEY);
        } catch {
          // ignore
        }
        const token = await user.getIdToken();
        await hydrateAuthenticatedWorkspace(
          { Authorization: `Bearer ${token}` },
          {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
        );
      } else if (e2eGoogleUser) {
        setIsGuest(false);
        await hydrateAuthenticatedWorkspace(
          {
            'x-e2e-google-user': JSON.stringify({
              uid: e2eGoogleUser.uid,
              email: e2eGoogleUser.email,
              name: e2eGoogleUser.displayName,
              picture: e2eGoogleUser.photoURL || '',
            }),
          },
          {
            email: e2eGoogleUser.email,
            displayName: e2eGoogleUser.displayName,
            photoURL: e2eGoogleUser.photoURL,
          }
        );
      } else {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, [e2eGoogleUser, hydrateAuthenticatedWorkspace]);

  // Register E2E test seam on window for Playwright verification of Google Auth + PostgreSQL persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      __e2eSignInGoogleUser?: (identity: E2EGoogleIdentity) => Promise<void>;
    };
    win.__e2eSignInGoogleUser = async (identity: E2EGoogleIdentity) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        sessionStorage.setItem(E2E_GOOGLE_USER_KEY, JSON.stringify(identity));
        sessionStorage.removeItem(GUEST_SESSION_ACTIVE_KEY);
      } catch {
        // ignore
      }
      setIsGuest(false);
      setE2eGoogleUser(identity);
    };
    return () => {
      delete win.__e2eSignInGoogleUser;
    };
  }, []);

  const authedFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const authHeaders = await buildAuthHeaders();
      if (!authHeaders) return null;
      return fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(init.headers || {}),
        },
      });
    },
    [buildAuthHeaders]
  );

  const signInWithGoogle = useCallback(async () => {
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      setAuthLoading(false);
      const code =
        err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in window was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by the browser. Please allow popups for this site and try again.');
      } else {
        const message =
          err instanceof Error ? err.message : 'Unable to complete Google authentication.';
        setAuthError(message);
      }
    }
  }, [authLoading]);

  const completeOnboarding = useCallback(
    async (input: OnboardingFormInput): Promise<{ ok: boolean; error?: string }> => {
      const validation = validateOnboardingProfile(input);
      if (!validation.valid) {
        return { ok: false, error: 'Please enter your first name to complete your profile.' };
      }

      const {
        firstName,
        lastName,
        displayName,
        country,
        city,
        targetDegree,
        targetCountries,
        targetDisciplines,
      } = validation.sanitized;

      try {
        const res = await authedFetch('/api/user/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            firstName,
            lastName,
            displayName,
            country,
            city,
            targetDegree,
            targetCountries,
            targetDisciplines,
            accountType: 'authenticated',
            onboardingCompleted: true,
          }),
        });

        if (!res || !res.ok) {
          return {
            ok: false,
            error: 'Unable to save profile to the database. Please try again.',
          };
        }

        const data = await res.json();
        const saved = data?.profile;

        setProfile((prev) => ({
          ...prev,
          firstName: saved?.firstName ?? firstName,
          lastName: saved?.lastName ?? lastName,
          displayName: saved?.displayName || displayName,
          country: saved?.country ?? country,
          city: saved?.city ?? city,
          targetDegree: saved?.targetDegree || targetDegree,
          targetCountries: Array.isArray(saved?.targetCountries)
            ? saved.targetCountries
            : targetCountries,
          targetDisciplines: Array.isArray(saved?.targetDisciplines)
            ? saved.targetDisciplines
            : targetDisciplines,
          accountType: 'authenticated',
          onboardingCompleted: true,
          updatedAt: saved?.updatedAt || new Date().toISOString(),
        }));

        if (targetCountries.length > 0) {
          setSelectedCountryCode(targetCountries[0]);
        }

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Network error while saving your profile. Please try again.',
        };
      }
    },
    [authedFetch]
  );

  const enterGuestMode = useCallback(() => {
    setAuthError(null);
    try {
      sessionStorage.setItem(GUEST_SESSION_ACTIVE_KEY, '1');
      sessionStorage.removeItem(E2E_GOOGLE_USER_KEY);
    } catch {
      // ignore
    }
    setE2eGoogleUser(null);
    setProfile(DEFAULT_GUEST_PROFILE);
    setIsGuest(true);
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      sessionStorage.removeItem(GUEST_SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(E2E_GOOGLE_USER_KEY);
    } catch {
      // ignore
    }
    if (firebaseUser) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    setE2eGoogleUser(null);
    setIsGuest(false);
    setProfile(DEFAULT_GUEST_PROFILE);
    setActiveSection('dashboard');
  }, [firebaseUser]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setLanguageState(lang);
      setProfile((prev) => ({ ...prev, preferredLanguage: lang }));
      if (firebaseUser || e2eGoogleUser) {
        void authedFetch('/api/user/profile', {
          method: 'PATCH',
          body: JSON.stringify({ preferredLanguage: lang }),
        });
      }
    },
    [firebaseUser, e2eGoogleUser, authedFetch]
  );

  const setAppearance = useCallback(
    (mode: AppearanceMode) => {
      setAppearanceState(mode);
      setProfile((prev) => ({ ...prev, appearanceMode: mode }));
      if (firebaseUser || e2eGoogleUser) {
        void authedFetch('/api/user/profile', {
          method: 'PATCH',
          body: JSON.stringify({ appearanceMode: mode }),
        });
      }
    },
    [firebaseUser, e2eGoogleUser, authedFetch]
  );

  const countriesByCode = useMemo(() => {
    const map: Record<string, CountryRecord> = {};
    for (const c of catalog.countries) map[c.isoCode] = c;
    return map;
  }, [catalog.countries]);

  const citiesBySlug = useMemo(() => {
    const map: Record<string, CityRecord> = {};
    for (const c of catalog.cities) map[c.slug] = c;
    return map;
  }, [catalog.cities]);

  const universitiesBySlug = useMemo(() => {
    const map: Record<string, UniversityRecord> = {};
    for (const u of catalog.universities) map[u.slug] = u;
    return map;
  }, [catalog.universities]);

  const recordRecentlyViewedUniversity = useCallback((slug: string) => {
    if (!slug) return;
    setRecentlyViewedSlugs((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, 8));
  }, []);

  const openUniversityProfile = useCallback((slug: string) => {
    setSelectedUniversitySlug(slug);
    setActiveSection('universities');
    recordRecentlyViewedUniversity(slug);
  }, [recordRecentlyViewedUniversity]);

  const openCountryProfile = useCallback((isoCode: string) => {
    setSelectedCountryCode(isoCode);
    setActiveSection('countries');
  }, []);

  const openCityInExplorer = useCallback((countryCode: string, citySlug?: string) => {
    setSelectedCountryCode(countryCode);
    if (citySlug) {
      setSelectedCitySlug(citySlug);
    } else {
      const firstCity = catalog.cities.find((c) => c.countryCode === countryCode);
      if (firstCity) setSelectedCitySlug(firstCity.slug);
    }
    setActiveSection('explore-by-city');
  }, [catalog.cities]);

  const updateProfile = async (patch: Partial<UserProfile>) => {
    const nextFirstName = patch.firstName !== undefined ? patch.firstName : profile.firstName;
    const nextLastName = patch.lastName !== undefined ? patch.lastName : profile.lastName;
    const computedDisplayName =
      patch.displayName !== undefined
        ? patch.displayName
        : patch.firstName !== undefined || patch.lastName !== undefined
        ? [nextFirstName || '', nextLastName || ''].filter(Boolean).join(' ') || profile.displayName
        : profile.displayName;

    const mergedPatch: Partial<UserProfile> = {
      ...patch,
      displayName: computedDisplayName,
    };

    setProfile((prev) => ({ ...prev, ...mergedPatch }));
    if (patch.preferredLanguage) setLanguageState(patch.preferredLanguage);
    if (patch.appearanceMode) setAppearanceState(patch.appearanceMode);
    if (firebaseUser || e2eGoogleUser) {
      await authedFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(mergedPatch),
      });
    }
  };

  const saveUniversity = async (
    entry: Partial<SavedUniversityEntry> & { universitySlug: string }
  ) => {
    setSavedUniversities((prev) => {
      const existing = prev.find((item) => item.universitySlug === entry.universitySlug);
      if (existing) {
        return prev.map((item) =>
          item.universitySlug === entry.universitySlug ? { ...item, ...entry } : item
        );
      }
      return [
        ...prev,
        {
          universitySlug: entry.universitySlug,
          collectionName: entry.collectionName || 'Shortlist',
          priority: entry.priority || 'Target',
          applicationStatus: entry.applicationStatus || 'Researching',
          personalNotes: entry.personalNotes || '',
        },
      ];
    });
    if (firebaseUser) {
      await authedFetch('/api/user/saved-universities', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    }
  };

  const removeSavedUniversity = async (slug: string) => {
    setSavedUniversities((prev) => prev.filter((item) => item.universitySlug !== slug));
    if (firebaseUser) {
      await authedFetch(`/api/user/saved-universities/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
    }
  };

  const toggleCompareSlug = (slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return [...prev.slice(1), slug];
      return [...prev, slug];
    });
  };

  const addJourneyTask = async (task: Omit<JourneyTaskEntry, 'id'>) => {
    const tempId = `local-${Date.now()}`;
    setJourneyTasks((prev) => [{ ...task, id: tempId }, ...prev]);
    if (firebaseUser) {
      const res = await authedFetch('/api/user/journey-tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
      if (res?.ok) {
        const data = await res.json();
        if (data.task) {
          setJourneyTasks((prev) => prev.map((t) => (t.id === tempId ? data.task : t)));
        }
      }
    }
  };

  const updateJourneyTask = async (id: number | string, patch: Partial<JourneyTaskEntry>) => {
    setJourneyTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (firebaseUser && typeof id === 'number') {
      await authedFetch(`/api/user/journey-tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    }
  };

  const deleteJourneyTask = async (id: number | string) => {
    setJourneyTasks((prev) => prev.filter((t) => t.id !== id));
    if (firebaseUser && typeof id === 'number') {
      await authedFetch(`/api/user/journey-tasks/${id}`, { method: 'DELETE' });
    }
  };

  const toggleChecklistItem = async (
    universitySlug: string,
    requirementKey: string,
    label: string,
    completed: boolean
  ) => {
    setChecklists((prev) => {
      const idx = prev.findIndex(
        (c) => c.universitySlug === universitySlug && c.requirementKey === requirementKey
      );
      if (idx >= 0) {
        return prev.map((c, i) => (i === idx ? { ...c, completed } : c));
      }
      return [...prev, { universitySlug, requirementKey, label, completed }];
    });

    if (firebaseUser) {
      await authedFetch('/api/user/checklists/toggle', {
        method: 'POST',
        body: JSON.stringify({ universitySlug, requirementKey, label, completed }),
      });
    }
  };

  const saveScholarship = async (slug: string, status = 'Saved', notes = '') => {
    setSavedScholarships((prev) => {
      const idx = prev.findIndex((s) => s.scholarshipSlug === slug);
      if (idx >= 0) {
        return prev.map((s, i) => (i === idx ? { ...s, status, notes } : s));
      }
      return [...prev, { scholarshipSlug: slug, status, notes }];
    });
    if (firebaseUser) {
      await authedFetch('/api/user/scholarships', {
        method: 'POST',
        body: JSON.stringify({ scholarshipSlug: slug, status, notes }),
      });
    }
  };

  const removeSavedScholarship = async (slug: string) => {
    setSavedScholarships((prev) => prev.filter((s) => s.scholarshipSlug !== slug));
    if (firebaseUser) {
      await authedFetch(`/api/user/scholarships/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
    }
  };

  const addResearchResource = async (resItem: Omit<ResearchResourceEntry, 'id'>) => {
    const tempId = `local-res-${Date.now()}`;
    setResearchResources((prev) => [{ ...resItem, id: tempId }, ...prev]);
    if (firebaseUser) {
      const res = await authedFetch('/api/user/research-resources', {
        method: 'POST',
        body: JSON.stringify(resItem),
      });
      if (res?.ok) {
        const data = await res.json();
        if (data.resource) {
          setResearchResources((prev) =>
            prev.map((r) => (r.id === tempId ? { ...data.resource, tags: data.resource.tagsJson || [] } : r))
          );
        }
      }
    }
  };

  const deleteResearchResource = async (id: number | string) => {
    setResearchResources((prev) => prev.filter((r) => r.id !== id));
    if (firebaseUser && typeof id === 'number') {
      await authedFetch(`/api/user/research-resources/${id}`, { method: 'DELETE' });
    }
  };

  // Intelligent Research Library Actions
  const createLibraryFolder = (input: {
    name: string;
    description?: string;
    accentVariant?: FolderAccentVariant;
  }): LibraryFolderRecord => {
    const now = new Date().toISOString();
    const record: LibraryFolderRecord = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim() || 'Untitled Folder',
      description: (input.description || '').trim(),
      accentVariant:
        input.accentVariant ||
        FOLDER_ACCENT_VARIANTS[libraryWorkspace.folders.length % FOLDER_ACCENT_VARIANTS.length],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    setLibraryWorkspace((prev) => ({
      ...prev,
      folders: [...prev.folders, record],
      updatedAt: now,
    }));
    return record;
  };

  const renameLibraryFolder = (
    folderId: string,
    patch: { name?: string; description?: string; accentVariant?: FolderAccentVariant }
  ) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId
          ? {
              ...f,
              ...(typeof patch.name === 'string' && patch.name.trim()
                ? { name: patch.name.trim() }
                : {}),
              ...(typeof patch.description === 'string'
                ? { description: patch.description.trim() }
                : {}),
              ...(patch.accentVariant ? { accentVariant: patch.accentVariant } : {}),
              updatedAt: now,
            }
          : f
      ),
      updatedAt: now,
    }));
  };

  const deleteLibraryFolder = async (folderId: string) => {
    const folderMaterials = libraryWorkspace.materials.filter((m) => m.folderId === folderId);
    for (const mat of folderMaterials) {
      if (mat.hasLocalBlob) {
        await deleteMaterialBlob(mat.id);
      }
      if (mat.legacyResourceId !== undefined) {
        await deleteResearchResource(mat.legacyResourceId);
      }
    }
    const deletedMaterialIds = new Set(folderMaterials.map((m) => m.id));
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId),
      materials: prev.materials.filter((m) => m.folderId !== folderId),
      scheduleSessions: prev.scheduleSessions.filter((s) => !deletedMaterialIds.has(s.materialId)),
      updatedAt: now,
    }));
  };

  const toggleFavoriteFolder = (folderId: string) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, isFavorite: !f.isFavorite, updatedAt: now } : f
      ),
      updatedAt: now,
    }));
  };

  const addLibraryMaterials: AppContextValue['addLibraryMaterials'] = async (items) => {
    const now = new Date().toISOString();
    const created: LibraryMaterialRecord[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const matId = `mat-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      let hasLocalBlob = false;
      if (item.blob) {
        await saveMaterialBlob({
          materialId: matId,
          mimeType: item.mimeType || item.blob.type || 'application/octet-stream',
          fileName: item.fileName || item.title,
          blob: item.blob,
          previewDataUrl: item.previewDataUrl,
          updatedAt: now,
        });
        hasLocalBlob = true;
      }

      const folderObj = libraryWorkspace.folders.find((f) => f.id === item.folderId);
      const legacyEntryId = `lib-${matId}`;
      if (item.materialType === 'link' || item.materialType === 'note' || item.materialType === 'study_doc') {
        void addResearchResource({
          title: item.title,
          url: item.url || '',
          folder: folderObj?.name || 'Research Library',
          tags: item.tags || [],
          universitySlug: item.universitySlug ?? null,
          notes: item.notes || item.extractedText?.slice(0, 280) || '',
        });
      }

      created.push({
        id: matId,
        legacyResourceId:
          item.materialType === 'link' || item.materialType === 'note' || item.materialType === 'study_doc'
            ? legacyEntryId
            : undefined,
        folderId: item.folderId,
        title: item.title.trim() || 'Untitled Resource',
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSizeBytes: item.fileSizeBytes,
        materialType: item.materialType,
        url: item.url,
        universitySlug: item.universitySlug ?? null,
        tags: item.tags || [],
        notes: item.notes || '',
        extractedText: item.extractedText,
        slideTexts: item.slideTexts,
        pageCount: item.pageCount ?? null,
        hasLocalBlob,
        contentAccess: item.contentAccess,
        unreadableReason: item.unreadableReason,
        studyStatus: 'not_reviewed',
        analysis: null,
        analysisError: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    setLibraryWorkspace((prev) => ({
      ...prev,
      materials: [...created, ...prev.materials],
      folders: prev.folders.map((f) =>
        created.some((m) => m.folderId === f.id) ? { ...f, updatedAt: now } : f
      ),
      updatedAt: now,
    }));

    return created;
  };

  const updateLibraryMaterial = (materialId: string, patch: Partial<LibraryMaterialRecord>) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, ...patch, updatedAt: now } : m
      ),
      updatedAt: now,
    }));
  };

  const moveLibraryMaterial = (materialId: string, targetFolderId: string) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, folderId: targetFolderId, updatedAt: now } : m
      ),
      scheduleSessions: prev.scheduleSessions.map((s) =>
        s.materialId === materialId ? { ...s, folderId: targetFolderId } : s
      ),
      updatedAt: now,
    }));
  };

  const deleteLibraryMaterial = async (materialId: string) => {
    const target = libraryWorkspace.materials.find((m) => m.id === materialId);
    if (target?.hasLocalBlob) {
      await deleteMaterialBlob(materialId);
    }
    if (target?.legacyResourceId !== undefined) {
      await deleteResearchResource(target.legacyResourceId);
    }
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== materialId),
      scheduleSessions: prev.scheduleSessions.filter((s) => s.materialId !== materialId),
      updatedAt: now,
    }));
  };

  const analyzeLibraryMaterial = async (
    materialId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const mat = libraryWorkspace.materials.find((m) => m.id === materialId);
    if (!mat) return { ok: false, error: 'Material not found.' };

    if (mat.contentAccess === 'unreadable' && !mat.notes.trim()) {
      const msg =
        mat.unreadableReason ||
        'Readable material content could not be accessed for AI analysis.';
      updateLibraryMaterial(materialId, { analysisError: msg });
      return { ok: false, error: msg };
    }

    let binaryBase64: string | undefined;
    let binaryMimeType: string | undefined;
    if (mat.hasLocalBlob && (mat.materialType === 'pdf' || mat.materialType === 'image')) {
      const blobData = await getMaterialBlobAsBase64(mat.id);
      if (blobData) {
        binaryBase64 = blobData.base64;
        binaryMimeType = blobData.mimeType;
      }
    }

    try {
      const resp = await fetch('/api/library/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: {
            id: mat.id,
            title: mat.title,
            materialType: mat.materialType,
            fileName: mat.fileName,
            url: mat.url,
            notes: mat.notes,
            extractedText: mat.extractedText,
            slideTexts: mat.slideTexts,
            pageCount: mat.pageCount,
          },
          binaryBase64,
          binaryMimeType,
          otherMaterialTitles: libraryWorkspace.materials
            .filter((o) => o.id !== mat.id)
            .map((o) => ({
              id: o.id,
              title: o.title,
              mainSubject: o.analysis?.mainSubject,
            })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.analysis) {
        const msg = data.error || 'AI analysis failed to inspect this resource.';
        updateLibraryMaterial(materialId, { analysisError: msg });
        return { ok: false, error: msg };
      }
      updateLibraryMaterial(materialId, {
        analysis: data.analysis,
        analysisError: null,
        studyStatus: mat.studyStatus === 'not_reviewed' ? 'analyzed' : mat.studyStatus,
      });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error during AI analysis.';
      updateLibraryMaterial(materialId, { analysisError: msg });
      return { ok: false, error: msg };
    }
  };

  const runCrossMaterialAnalysis = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const resp = await fetch('/api/library/cross-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: libraryWorkspace.materials.map((m) => ({
            id: m.id,
            title: m.title,
            materialType: m.materialType,
            analysis: m.analysis,
          })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.crossAnalysis) {
        return { ok: false, error: data.error || 'Unable to complete cross-material analysis.' };
      }
      const now = new Date().toISOString();
      setLibraryWorkspace((prev) => ({
        ...prev,
        crossAnalysis: data.crossAnalysis,
        updatedAt: now,
      }));
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error during cross-material analysis.',
      };
    }
  };

  const generateSmartSchedule = async (
    preferencesPatch?: Partial<StudySchedulePreferences>
  ): Promise<{ ok: boolean; error?: string }> => {
    const mergedPrefs: StudySchedulePreferences = {
      ...libraryWorkspace.schedulePreferences,
      ...preferencesPatch,
    };
    const manualSessions = libraryWorkspace.scheduleSessions.filter((s) => !s.isAiGenerated);
    try {
      const resp = await fetch('/api/library/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: libraryWorkspace.materials.map((m) => ({
            id: m.id,
            folderId: m.folderId,
            title: m.title,
            materialType: m.materialType,
            pageCount: m.pageCount,
            slideTexts: m.slideTexts ? m.slideTexts.map((_, i) => `Slide ${i + 1}`) : undefined,
            studyStatus: m.studyStatus,
            analysis: m.analysis,
            createdAt: m.createdAt,
          })),
          prerequisiteLinks: libraryWorkspace.crossAnalysis?.prerequisiteLinks || [],
          preferences: mergedPrefs,
          existingManualSessions: manualSessions,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !Array.isArray(data.sessions)) {
        return { ok: false, error: data.error || 'Unable to generate study schedule.' };
      }
      const now = new Date().toISOString();
      setLibraryWorkspace((prev) => ({
        ...prev,
        schedulePreferences: mergedPrefs,
        scheduleSessions: data.sessions,
        scheduleSummaryNote: data.summaryNote || undefined,
        updatedAt: now,
      }));
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error while generating schedule.',
      };
    }
  };

  const updateStudySession = (sessionId: string, patch: Partial<StudySessionItem>) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => {
      const updatedSessions = prev.scheduleSessions.map((s) =>
        s.id === sessionId ? { ...s, ...patch } : s
      );
      let updatedMaterials = prev.materials;
      if (typeof patch.completed === 'boolean') {
        const targetSession = updatedSessions.find((s) => s.id === sessionId);
        if (targetSession) {
          const allForMat = updatedSessions.filter((s) => s.materialId === targetSession.materialId);
          const allDone = allForMat.length > 0 && allForMat.every((s) => s.completed);
          updatedMaterials = prev.materials.map((m) => {
            if (m.id !== targetSession.materialId) return m;
            const nextStatus: MaterialStudyStatus = allDone
              ? 'completed'
              : patch.completed
              ? 'studying'
              : m.studyStatus === 'completed'
              ? 'studying'
              : m.studyStatus;
            return { ...m, studyStatus: nextStatus, updatedAt: now };
          });
        }
      }
      return {
        ...prev,
        scheduleSessions: updatedSessions,
        materials: updatedMaterials,
        updatedAt: now,
      };
    });
  };

  const deleteStudySession = (sessionId: string) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      scheduleSessions: prev.scheduleSessions.filter((s) => s.id !== sessionId),
      updatedAt: now,
    }));
  };

  const addMaterialToPlan = (materialId: string, slot: 'today' | 'weekly') => {
    const mat = libraryWorkspace.materials.find((m) => m.id === materialId);
    if (!mat) return;
    const now = new Date();
    const targetDate = new Date(now);
    if (slot === 'weekly') {
      targetDate.setDate(now.getDate() + 1);
    }
    const dayKey = formatLocalDateKey(targetDate);
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const dayLabel =
      slot === 'today' ? `Today · ${formatter.format(targetDate)}` : formatter.format(targetDate);

    const session: StudySessionItem = {
      id: `manual-${mat.id}-${Date.now()}`,
      materialId: mat.id,
      folderId: mat.folderId,
      dayKey,
      dayLabel,
      slotType: slot,
      pagesOrSections: mat.pageCount
        ? `Pages 1–${mat.pageCount}`
        : mat.slideTexts?.length
        ? `Slides 1–${mat.slideTexts.length}`
        : 'Full Material',
      estimatedMinutes: mat.analysis?.estimatedMinutes || 35,
      learningObjective:
        mat.analysis?.learningObjectives[0] ||
        mat.analysis?.conciseSummary ||
        `Study ${mat.title}`,
      priority: 'high',
      difficulty: mat.analysis?.difficultyLevel || 'Intermediate',
      whyScheduled:
        slot === 'today'
          ? 'Manually pinned to Today’s Study Plan from Library.'
          : 'Manually added to Weekly Study Plan from Library.',
      completed: false,
      isAiGenerated: false,
    };

    const iso = now.toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      scheduleSessions: [...prev.scheduleSessions, session],
      materials: prev.materials.map((m) =>
        m.id === mat.id && (m.studyStatus === 'not_reviewed' || m.studyStatus === 'analyzed')
          ? { ...m, studyStatus: 'ready_to_study', updatedAt: iso }
          : m
      ),
      updatedAt: iso,
    }));
  };

  const updateSchedulePreferences = (patch: Partial<StudySchedulePreferences>) => {
    const now = new Date().toISOString();
    setLibraryWorkspace((prev) => ({
      ...prev,
      schedulePreferences: { ...prev.schedulePreferences, ...patch },
      updatedAt: now,
    }));
  };

  const markNotificationRead = async (id: number | string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (firebaseUser && typeof id === 'number') {
      await authedFetch(`/api/user/notifications/${id}/read`, { method: 'PATCH' });
    }
  };

  const switchSubscriptionTier = async (
    tier: SubscriptionTier,
    providerId?: string,
    billingCycle = 'monthly'
  ): Promise<{ ok: boolean; message: string }> => {
    if (profile.isOwner) {
      return {
        ok: true,
        message:
          'Platform Owner account holds permanent Global Elite Pro access with no billing required.',
      };
    }

    if (tier === 'free') {
      if (firebaseUser) {
        const res = await authedFetch('/api/payments/checkout', {
          method: 'POST',
          body: JSON.stringify({ tier: 'free', billingCycle }),
        });
        if (!res?.ok) {
          return { ok: false, message: 'Failed to update subscription on server.' };
        }
      }
      setProfile((prev) => ({ ...prev, subscriptionTier: 'free' }));
      return { ok: true, message: 'Switched to Free Explorer plan.' };
    }

    if (!firebaseUser) {
      return {
        ok: false,
        message: 'Sign in with Google first to manage paid billing and checkout.',
      };
    }

    const res = await authedFetch('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier, providerId, billingCycle }),
    });
    const data = await res?.json();
    return {
      ok: Boolean(res?.ok),
      message:
        data?.error ||
        'Payment provider requires live merchant credentials before paid checkout can be processed.',
    };
  };

  const exportUserData = async () => {
    let payload: unknown = {
      exportedAt: new Date().toISOString(),
      platform: 'Global University Intelligence',
      profile,
      savedUniversities,
      journeyTasks,
      savedScholarships,
      researchResources,
    };

    if (firebaseUser) {
      const res = await authedFetch('/api/user/export');
      if (res?.ok) {
        payload = await res.json();
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global-university-intelligence-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (firebaseUser || e2eGoogleUser) {
      await authedFetch('/api/user/account', { method: 'DELETE' });
      if (firebaseUser) {
        await signOut(auth);
      }
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    try {
      sessionStorage.removeItem(GUEST_SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(E2E_GOOGLE_USER_KEY);
    } catch {
      // ignore
    }
    setE2eGoogleUser(null);
    setIsGuest(false);
    setProfile(DEFAULT_GUEST_PROFILE);
  };

  const t = TRANSLATIONS[language];

  const isAuthenticated = Boolean(firebaseUser || e2eGoogleUser);
  const needsOnboarding = Boolean(isAuthenticated && !profile.onboardingCompleted);

  const actionsRef = useRef({
    signInWithGoogle,
    completeOnboarding,
    enterGuestMode,
    logout,
    setLanguage,
    setAppearance,
    openUniversityProfile,
    openCountryProfile,
    openCityInExplorer,
    recordRecentlyViewedUniversity,
    updateProfile,
    saveUniversity,
    removeSavedUniversity,
    toggleCompareSlug,
    addJourneyTask,
    updateJourneyTask,
    deleteJourneyTask,
    toggleChecklistItem,
    saveScholarship,
    removeSavedScholarship,
    addResearchResource,
    deleteResearchResource,
    createLibraryFolder,
    renameLibraryFolder,
    deleteLibraryFolder,
    toggleFavoriteFolder,
    addLibraryMaterials,
    updateLibraryMaterial,
    moveLibraryMaterial,
    deleteLibraryMaterial,
    analyzeLibraryMaterial,
    runCrossMaterialAnalysis,
    generateSmartSchedule,
    updateStudySession,
    deleteStudySession,
    addMaterialToPlan,
    updateSchedulePreferences,
    markNotificationRead,
    switchSubscriptionTier,
    exportUserData,
    deleteAccount,
  });

  actionsRef.current = {
    signInWithGoogle,
    completeOnboarding,
    enterGuestMode,
    logout,
    setLanguage,
    setAppearance,
    openUniversityProfile,
    openCountryProfile,
    openCityInExplorer,
    recordRecentlyViewedUniversity,
    updateProfile,
    saveUniversity,
    removeSavedUniversity,
    toggleCompareSlug,
    addJourneyTask,
    updateJourneyTask,
    deleteJourneyTask,
    toggleChecklistItem,
    saveScholarship,
    removeSavedScholarship,
    addResearchResource,
    deleteResearchResource,
    createLibraryFolder,
    renameLibraryFolder,
    deleteLibraryFolder,
    toggleFavoriteFolder,
    addLibraryMaterials,
    updateLibraryMaterial,
    moveLibraryMaterial,
    deleteLibraryMaterial,
    analyzeLibraryMaterial,
    runCrossMaterialAnalysis,
    generateSmartSchedule,
    updateStudySession,
    deleteStudySession,
    addMaterialToPlan,
    updateSchedulePreferences,
    markNotificationRead,
    switchSubscriptionTier,
    exportUserData,
    deleteAccount,
  };

  const stableActions = useMemo(
    () => ({
      signInWithGoogle: (...args: Parameters<AppContextValue['signInWithGoogle']>) =>
        actionsRef.current.signInWithGoogle(...args),
      completeOnboarding: (...args: Parameters<AppContextValue['completeOnboarding']>) =>
        actionsRef.current.completeOnboarding(...args),
      enterGuestMode: (...args: Parameters<AppContextValue['enterGuestMode']>) =>
        actionsRef.current.enterGuestMode(...args),
      logout: (...args: Parameters<AppContextValue['logout']>) =>
        actionsRef.current.logout(...args),
      setLanguage: (...args: Parameters<AppContextValue['setLanguage']>) =>
        actionsRef.current.setLanguage(...args),
      setAppearance: (...args: Parameters<AppContextValue['setAppearance']>) =>
        actionsRef.current.setAppearance(...args),
      openUniversityProfile: (...args: Parameters<AppContextValue['openUniversityProfile']>) =>
        actionsRef.current.openUniversityProfile(...args),
      openCountryProfile: (...args: Parameters<AppContextValue['openCountryProfile']>) =>
        actionsRef.current.openCountryProfile(...args),
      openCityInExplorer: (...args: Parameters<AppContextValue['openCityInExplorer']>) =>
        actionsRef.current.openCityInExplorer(...args),
      recordRecentlyViewedUniversity: (
        ...args: Parameters<AppContextValue['recordRecentlyViewedUniversity']>
      ) => actionsRef.current.recordRecentlyViewedUniversity(...args),
      updateProfile: (...args: Parameters<AppContextValue['updateProfile']>) =>
        actionsRef.current.updateProfile(...args),
      saveUniversity: (...args: Parameters<AppContextValue['saveUniversity']>) =>
        actionsRef.current.saveUniversity(...args),
      removeSavedUniversity: (...args: Parameters<AppContextValue['removeSavedUniversity']>) =>
        actionsRef.current.removeSavedUniversity(...args),
      toggleCompareSlug: (...args: Parameters<AppContextValue['toggleCompareSlug']>) =>
        actionsRef.current.toggleCompareSlug(...args),
      addJourneyTask: (...args: Parameters<AppContextValue['addJourneyTask']>) =>
        actionsRef.current.addJourneyTask(...args),
      updateJourneyTask: (...args: Parameters<AppContextValue['updateJourneyTask']>) =>
        actionsRef.current.updateJourneyTask(...args),
      deleteJourneyTask: (...args: Parameters<AppContextValue['deleteJourneyTask']>) =>
        actionsRef.current.deleteJourneyTask(...args),
      toggleChecklistItem: (...args: Parameters<AppContextValue['toggleChecklistItem']>) =>
        actionsRef.current.toggleChecklistItem(...args),
      saveScholarship: (...args: Parameters<AppContextValue['saveScholarship']>) =>
        actionsRef.current.saveScholarship(...args),
      removeSavedScholarship: (...args: Parameters<AppContextValue['removeSavedScholarship']>) =>
        actionsRef.current.removeSavedScholarship(...args),
      addResearchResource: (...args: Parameters<AppContextValue['addResearchResource']>) =>
        actionsRef.current.addResearchResource(...args),
      deleteResearchResource: (...args: Parameters<AppContextValue['deleteResearchResource']>) =>
        actionsRef.current.deleteResearchResource(...args),
      createLibraryFolder: (...args: Parameters<AppContextValue['createLibraryFolder']>) =>
        actionsRef.current.createLibraryFolder(...args),
      renameLibraryFolder: (...args: Parameters<AppContextValue['renameLibraryFolder']>) =>
        actionsRef.current.renameLibraryFolder(...args),
      deleteLibraryFolder: (...args: Parameters<AppContextValue['deleteLibraryFolder']>) =>
        actionsRef.current.deleteLibraryFolder(...args),
      toggleFavoriteFolder: (...args: Parameters<AppContextValue['toggleFavoriteFolder']>) =>
        actionsRef.current.toggleFavoriteFolder(...args),
      addLibraryMaterials: (...args: Parameters<AppContextValue['addLibraryMaterials']>) =>
        actionsRef.current.addLibraryMaterials(...args),
      updateLibraryMaterial: (...args: Parameters<AppContextValue['updateLibraryMaterial']>) =>
        actionsRef.current.updateLibraryMaterial(...args),
      moveLibraryMaterial: (...args: Parameters<AppContextValue['moveLibraryMaterial']>) =>
        actionsRef.current.moveLibraryMaterial(...args),
      deleteLibraryMaterial: (...args: Parameters<AppContextValue['deleteLibraryMaterial']>) =>
        actionsRef.current.deleteLibraryMaterial(...args),
      analyzeLibraryMaterial: (...args: Parameters<AppContextValue['analyzeLibraryMaterial']>) =>
        actionsRef.current.analyzeLibraryMaterial(...args),
      runCrossMaterialAnalysis: (...args: Parameters<AppContextValue['runCrossMaterialAnalysis']>) =>
        actionsRef.current.runCrossMaterialAnalysis(...args),
      generateSmartSchedule: (...args: Parameters<AppContextValue['generateSmartSchedule']>) =>
        actionsRef.current.generateSmartSchedule(...args),
      updateStudySession: (...args: Parameters<AppContextValue['updateStudySession']>) =>
        actionsRef.current.updateStudySession(...args),
      deleteStudySession: (...args: Parameters<AppContextValue['deleteStudySession']>) =>
        actionsRef.current.deleteStudySession(...args),
      addMaterialToPlan: (...args: Parameters<AppContextValue['addMaterialToPlan']>) =>
        actionsRef.current.addMaterialToPlan(...args),
      updateSchedulePreferences: (
        ...args: Parameters<AppContextValue['updateSchedulePreferences']>
      ) => actionsRef.current.updateSchedulePreferences(...args),
      markNotificationRead: (...args: Parameters<AppContextValue['markNotificationRead']>) =>
        actionsRef.current.markNotificationRead(...args),
      switchSubscriptionTier: (...args: Parameters<AppContextValue['switchSubscriptionTier']>) =>
        actionsRef.current.switchSubscriptionTier(...args),
      exportUserData: (...args: Parameters<AppContextValue['exportUserData']>) =>
        actionsRef.current.exportUserData(...args),
      deleteAccount: (...args: Parameters<AppContextValue['deleteAccount']>) =>
        actionsRef.current.deleteAccount(...args),
    }),
    []
  );

  const contextValue = useMemo<AppContextValue>(
    () => ({
      authReady,
      authLoading,
      firebaseUser,
      isGuest,
      isAuthenticated,
      isAuthenticatedOrGuest: Boolean(isAuthenticated || isGuest),
      needsOnboarding,
      authError,
      activeSection,
      setActiveSection,
      selectedCountryCode,
      setSelectedCountryCode,
      selectedCitySlug,
      setSelectedCitySlug,
      selectedUniversitySlug,
      setSelectedUniversitySlug,
      language,
      t,
      appearance,
      catalogLoading,
      catalogError,
      catalog,
      countriesByCode,
      citiesBySlug,
      universitiesBySlug,
      currencyRates,
      profile,
      savedUniversities,
      compareSlugs,
      recentlyViewedSlugs,
      journeyTasks,
      checklists,
      savedScholarships,
      researchResources,
      libraryWorkspace,
      notifications,
      paymentProviders,
      paymentHistory,
      ...stableActions,
    }),
    [
      authReady,
      authLoading,
      firebaseUser,
      isGuest,
      isAuthenticated,
      needsOnboarding,
      authError,
      activeSection,
      selectedCountryCode,
      selectedCitySlug,
      selectedUniversitySlug,
      language,
      t,
      appearance,
      catalogLoading,
      catalogError,
      catalog,
      countriesByCode,
      citiesBySlug,
      universitiesBySlug,
      currencyRates,
      profile,
      savedUniversities,
      compareSlugs,
      recentlyViewedSlugs,
      journeyTasks,
      checklists,
      savedScholarships,
      researchResources,
      libraryWorkspace,
      notifications,
      paymentProviders,
      paymentHistory,
      stableActions,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
