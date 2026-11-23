import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useApp } from './AppContext';
import type { NavSectionId } from '../types/domain';
import {
  createDefaultRoadmapState,
  type RoadmapWorkspaceState,
} from '../utils/roadmapEngine';
import {
  createDefaultRoutineState,
  isDuplicateTask,
  type RoutineState,
  type TodoRecommendation,
} from '../utils/productivityEngine';
import {
  getTierEntitlements,
  normalizeTier,
  type SubscriptionTierId,
  type TierEntitlements,
  type UsageCounters,
} from '../utils/entitlements';
import type { AgentExecutionLogEntry } from '../utils/aiAgentsRegistry';
import type { SemanticAction } from '../utils/semanticNavigation';
import {
  createDefaultGoalsState,
  type GoalsWorkspaceState,
} from '../utils/goalsEngine';
import {
  getLocalTodayISO,
  type HabitCategory,
  type HabitItem,
  type HabitsTrackerState,
} from '../utils/habitTrackerEngine';

export interface CreatorProfileData {
  name: string;
  role: string;
  organization: string;
  location: string;
  missionNote: string;
  publicWebsite: string;
  publicContact: string;
}

export interface MapFocusRequest {
  countryCode?: string;
  universitySlug?: string;
  nonce: number;
}

export interface EntitlementStatusState {
  tier: SubscriptionTierId;
  isGuest: boolean;
  isOwner: boolean;
  role: 'owner' | 'user';
  billingExempt: boolean;
  unlimitedQuotas: boolean;
  expiresAt: string | null;
  entitlements: TierEntitlements;
  usage: UsageCounters;
}

interface WorkspaceExtensionsPayload {
  roadmapState?: RoadmapWorkspaceState;
  routineState?: RoutineState;
  todoRecommendations?: TodoRecommendation[];
  agentLogs?: AgentExecutionLogEntry[];
  creatorProfile?: CreatorProfileData;
  goalsState?: GoalsWorkspaceState;
}

const DEFAULT_CREATOR_PROFILE: CreatorProfileData = {
  name: 'Platform Creator (Unverified — Editable in Workspace)',
  role: 'Founder & Product Architect, Global University Intelligence',
  organization: 'Global University Intelligence Project',
  location: 'Uzbekistan',
  missionNote:
    'Built to help students navigate international universities, scholarships, and structured academic preparation with clarity and verified information.',
  publicWebsite: '',
  publicContact: '',
};

const STORAGE_KEY_PREFIX = 'gui_workspace_ext_v1';

interface WorkspaceIntelligenceContextValue {
  roadmapState: RoadmapWorkspaceState;
  setRoadmapState: React.Dispatch<React.SetStateAction<RoadmapWorkspaceState>>;
  routineState: RoutineState;
  setRoutineState: React.Dispatch<React.SetStateAction<RoutineState>>;
  goalsState: GoalsWorkspaceState;
  setGoalsState: React.Dispatch<React.SetStateAction<GoalsWorkspaceState>>;
  addHabitToTracker: (habit: {
    title: string;
    category: HabitCategory;
    targetMinutes?: number;
    frequency?: 'daily' | 'custom_weekly';
  }) => Promise<{ added: boolean; duplicate?: boolean }>;
  todoRecommendations: TodoRecommendation[];
  setTodoRecommendations: React.Dispatch<React.SetStateAction<TodoRecommendation[]>>;
  agentLogs: AgentExecutionLogEntry[];
  addAgentLog: (entry: AgentExecutionLogEntry) => void;
  creatorProfile: CreatorProfileData;
  setCreatorProfile: React.Dispatch<React.SetStateAction<CreatorProfileData>>;
  entitlementStatus: EntitlementStatusState;
  refreshEntitlementStatus: () => Promise<void>;
  mapFocusRequest: MapFocusRequest | null;
  requestMapFocus: (target: { countryCode?: string; universitySlug?: string }) => void;
  clearMapFocus: () => void;
  tutorialSection: NavSectionId | null;
  setTutorialSection: (section: NavSectionId | null) => void;
  toast: { id: number; message: string; tone: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, tone?: 'success' | 'info' | 'error') => void;
  dismissToast: () => void;
  executeSemanticAction: (action: SemanticAction) => Promise<string>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const WorkspaceIntelligenceContext =
  createContext<WorkspaceIntelligenceContextValue | null>(null);

export const WorkspaceIntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    firebaseUser,
    isAuthenticated,
    profile,
    catalog,
    journeyTasks,
    setActiveSection,
    setSelectedCountryCode,
    saveUniversity,
    toggleCompareSlug,
    compareSlugs,
    addJourneyTask,
  } = useApp();

  const storageKey = `${STORAGE_KEY_PREFIX}_${firebaseUser?.uid || 'guest'}`;

  const [roadmapState, setRoadmapState] = useState<RoadmapWorkspaceState>(() =>
    createDefaultRoadmapState({
      originCountry: profile.country || 'Uzbekistan',
      originEducationLevel: profile.currentEducationLevel || 'High School / Bachelor Prep',
      targetDegree: profile.targetDegree || 'Bachelor',
      targetDiscipline: profile.targetDisciplines?.[0] || 'Computer Science',
    })
  );
  const [routineState, setRoutineState] = useState<RoutineState>(() =>
    createDefaultRoutineState()
  );
  const [goalsState, setGoalsState] = useState<GoalsWorkspaceState>(() =>
    createDefaultGoalsState()
  );
  const [todoRecommendations, setTodoRecommendations] = useState<TodoRecommendation[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentExecutionLogEntry[]>([]);
  const [creatorProfile, setCreatorProfile] =
    useState<CreatorProfileData>(DEFAULT_CREATOR_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  const [mapFocusRequest, setMapFocusRequest] = useState<MapFocusRequest | null>(null);
  const [tutorialSection, setTutorialSection] = useState<NavSectionId | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'success' | 'info' | 'error';
  } | null>(null);

  const [entitlementStatus, setEntitlementStatus] = useState<EntitlementStatusState>(() => {
    const tier = normalizeTier(profile.subscriptionTier);
    const isOwner = Boolean(profile.isOwner && isAuthenticated);
    return {
      tier: isOwner ? 'premium' : tier,
      isGuest: !isAuthenticated,
      isOwner,
      role: isOwner ? 'owner' : 'user',
      billingExempt: isOwner,
      unlimitedQuotas: isOwner,
      expiresAt: null,
      entitlements: getTierEntitlements(isOwner ? 'premium' : tier),
      usage: {
        aiMessagesToday: 0,
        roadmapGenerationsToday: 0,
        routineGenerationsToday: 0,
        todoRecommendationsToday: 0,
      },
    };
  });

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'success') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // fallback cleanly
      }
      return headers;
    }
    try {
      const savedE2e = sessionStorage.getItem('gui_e2e_google_user_v1');
      if (savedE2e) {
        const parsed = JSON.parse(savedE2e) as {
          uid?: string;
          email?: string;
          displayName?: string;
          photoURL?: string;
        };
        if (parsed?.uid) {
          headers['x-e2e-google-user'] = JSON.stringify({
            uid: parsed.uid,
            email: parsed.email || '',
            name: parsed.displayName || '',
            picture: parsed.photoURL || '',
          });
        }
      }
    } catch {
      // ignore
    }
    return headers;
  }, [firebaseUser]);

  const refreshEntitlementStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/entitlements/status', { headers });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<EntitlementStatusState>;
      if (data && data.entitlements) {
        const isOwner = Boolean(data.isOwner);
        setEntitlementStatus({
          tier: isOwner ? 'premium' : normalizeTier(data.tier),
          isGuest: Boolean(data.isGuest),
          isOwner,
          role: isOwner ? 'owner' : 'user',
          billingExempt: Boolean(data.billingExempt),
          unlimitedQuotas: Boolean(data.unlimitedQuotas),
          expiresAt: data.expiresAt ?? null,
          entitlements: data.entitlements,
          usage: data.usage ?? {
            aiMessagesToday: 0,
            roadmapGenerationsToday: 0,
            routineGenerationsToday: 0,
            todoRecommendationsToday: 0,
          },
        });
      }
    } catch {
      // Keep server-hydrated fallback cleanly
    }
  }, [getAuthHeaders]);

  // Hydrate extensions from PostgreSQL (authenticated) or localStorage (guest)
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      // Always attempt localStorage first for instant paint
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as WorkspaceExtensionsPayload;
          if (parsed.roadmapState?.routes?.direct) setRoadmapState(parsed.roadmapState);
          if (parsed.routineState?.blocks) setRoutineState(parsed.routineState);
          if (parsed.goalsState && Array.isArray(parsed.goalsState.goals)) {
            setGoalsState(parsed.goalsState);
          }
          if (Array.isArray(parsed.todoRecommendations)) {
            setTodoRecommendations(parsed.todoRecommendations);
          }
          if (Array.isArray(parsed.agentLogs)) setAgentLogs(parsed.agentLogs);
          if (parsed.creatorProfile?.name) setCreatorProfile(parsed.creatorProfile);
        }
      } catch {
        // ignore storage parse failure
      }

      if (firebaseUser) {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch('/api/user/workspace-extensions', { headers });
          if (res.ok && active) {
            const data = (await res.json()) as { state?: WorkspaceExtensionsPayload | null };
            const remote = data.state;
            if (remote) {
              if (remote.roadmapState?.routes?.direct) setRoadmapState(remote.roadmapState);
              if (remote.routineState?.blocks) setRoutineState(remote.routineState);
              if (remote.goalsState && Array.isArray(remote.goalsState.goals)) {
                setGoalsState(remote.goalsState);
              }
              if (Array.isArray(remote.todoRecommendations)) {
                setTodoRecommendations(remote.todoRecommendations);
              }
              if (Array.isArray(remote.agentLogs)) setAgentLogs(remote.agentLogs);
              if (remote.creatorProfile?.name) setCreatorProfile(remote.creatorProfile);
            }
          }
        } catch {
          // continue cleanly
        }
      }

      if (active) setHydrated(true);
    };

    hydrate();
    refreshEntitlementStatus();
    return () => {
      active = false;
    };
  }, [storageKey, firebaseUser, isAuthenticated, profile.uid, profile.isOwner, getAuthHeaders, refreshEntitlementStatus]);

  // Persist changes to localStorage + debounced PostgreSQL sync
  const syncTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const payload: WorkspaceExtensionsPayload = {
      roadmapState,
      routineState,
      goalsState,
      todoRecommendations,
      agentLogs: agentLogs.slice(0, 20),
      creatorProfile,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore quota error
    }

    if (firebaseUser) {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(async () => {
        try {
          const headers = await getAuthHeaders();
          await fetch('/api/user/workspace-extensions', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ state: payload }),
          });
        } catch {
          // non-blocking
        }
      }, 900);
    }

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [
    hydrated,
    roadmapState,
    routineState,
    goalsState,
    todoRecommendations,
    agentLogs,
    creatorProfile,
    storageKey,
    firebaseUser,
    getAuthHeaders,
  ]);

  const addHabitToTracker = useCallback(
    async (habit: {
      title: string;
      category: HabitCategory;
      targetMinutes?: number;
      frequency?: 'daily' | 'custom_weekly';
    }): Promise<{ added: boolean; duplicate?: boolean }> => {
      const uid = firebaseUser?.uid || profile.uid || 'guest-scholar';
      const v2Key = `gui_habits_tracker_v2_${uid}`;
      const todayISO = getLocalTodayISO();
      const normalizedTitle = habit.title.trim().toLowerCase();
      if (!normalizedTitle) return { added: false };

      try {
        const raw = localStorage.getItem(v2Key);
        const existingState: HabitsTrackerState = raw
          ? (JSON.parse(raw) as HabitsTrackerState)
          : {
              version: 2,
              habits: [],
              completions: [],
              reflections: {},
              updatedAt: new Date().toISOString(),
            };

        const alreadyExists = (existingState.habits || []).some(
          (h) => h.status !== 'archived' && h.title.trim().toLowerCase() === normalizedTitle
        );
        if (alreadyExists) {
          return { added: false, duplicate: true };
        }

        const freq = habit.frequency === 'custom_weekly' ? 'custom_weekly' : 'daily';
        const now = new Date().toISOString();
        const newItem: HabitItem = {
          id: `hab-goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: habit.title.trim(),
          category: habit.category,
          icon: 'target',
          accentColor: 'cyan',
          frequency: freq,
          scheduledDays: [1, 2, 3, 4, 5, 6, 7],
          customWeeklyCount: freq === 'custom_weekly' ? 4 : undefined,
          target: habit.targetMinutes ?? 30,
          targetUnit: 'min',
          startDate: todayISO,
          reminderTime: null,
          status: 'active',
          scheduleHistory: [
            {
              effectiveFromDate: todayISO,
              frequency: freq,
              scheduledDays: [1, 2, 3, 4, 5, 6, 7],
              customWeeklyCount: freq === 'custom_weekly' ? 4 : undefined,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        const nextState: HabitsTrackerState = {
          ...existingState,
          habits: [...(existingState.habits || []), newItem],
          updatedAt: now,
        };
        localStorage.setItem(v2Key, JSON.stringify(nextState));
        return { added: true };
      } catch {
        return { added: false };
      }
    },
    [firebaseUser, profile.uid]
  );

  const addAgentLog = useCallback((entry: AgentExecutionLogEntry) => {
    setAgentLogs((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const requestMapFocus = useCallback(
    (target: { countryCode?: string; universitySlug?: string }) => {
      if (target.countryCode) {
        setSelectedCountryCode(target.countryCode.toUpperCase());
      }
      setMapFocusRequest({
        countryCode: target.countryCode?.toUpperCase(),
        universitySlug: target.universitySlug,
        nonce: Date.now(),
      });
    },
    [setSelectedCountryCode]
  );

  const clearMapFocus = useCallback(() => {
    setMapFocusRequest(null);
  }, []);

  const executeSemanticAction = useCallback(
    async (action: SemanticAction): Promise<string> => {
      switch (action.type) {
        case 'navigateToSection': {
          setActiveSection(action.section);
          return action.reason;
        }
        case 'locateCountry': {
          setActiveSection('world-explorer');
          requestMapFocus({ countryCode: action.countryCode });
          showToast(`World Explorer focused on ${action.countryName}`, 'info');
          return `Focused World Explorer on ${action.countryName}`;
        }
        case 'locateUniversity': {
          setActiveSection('world-explorer');
          requestMapFocus({
            countryCode: action.countryCode,
            universitySlug: action.universitySlug,
          });
          showToast(`Located ${action.universityName} on the 3D Globe`, 'info');
          return `Located ${action.universityName} on the 3D Globe`;
        }
        case 'searchUniversities': {
          setActiveSection('universities');
          showToast(`Opened Universities directory for "${action.query}"`, 'info');
          return `Opened Universities directory`;
        }
        case 'saveUniversity': {
          await saveUniversity({ universitySlug: action.universitySlug });
          showToast(`Saved ${action.universityName} to My Universities`, 'success');
          return `Saved ${action.universityName}`;
        }
        case 'addToComparison': {
          if (!compareSlugs.includes(action.universitySlug)) {
            toggleCompareSlug(action.universitySlug);
          }
          setActiveSection('university-comparison');
          showToast(`Added ${action.universityName} to Comparison`, 'success');
          return `Added ${action.universityName} to Comparison`;
        }
        case 'createTask': {
          const normalizedExisting = journeyTasks.map((t) => ({
            title: t.title,
            status: t.status,
          }));
          if (isDuplicateTask(normalizedExisting, action.title)) {
            showToast(`Task "${action.title}" is already in your active To-Do List.`, 'info');
            return `Task already exists`;
          }
          await addJourneyTask({
            title: action.title,
            category: 'Personal',
            status: 'pending',
            dueDate: null,
            notes: 'Created via Voice / AI Navigator',
          });
          showToast(`Added task: "${action.title}"`, 'success');
          return `Created task "${action.title}"`;
        }
        case 'generateAcademicRoadmap': {
          if (action.targetUniversityName) {
            const matched = catalog.universities.find(
              (u) => u.name.toLowerCase() === action.targetUniversityName?.toLowerCase()
            );
            setRoadmapState((prev) => ({
              ...prev,
              targetUniversityName: action.targetUniversityName || prev.targetUniversityName,
              targetUniversitySlug: matched?.slug || prev.targetUniversitySlug,
              targetCountry: matched?.countryCode || action.targetCountry || prev.targetCountry,
            }));
          }
          setActiveSection('my-academic-journey');
          showToast(`Opened Akademik yo'lim`, 'info');
          return `Opened Akademik yo'lim`;
        }
        case 'openTutorial': {
          setTutorialSection(action.section);
          return `Opened contextual page guide`;
        }
      }
    },
    [
      setActiveSection,
      requestMapFocus,
      showToast,
      saveUniversity,
      compareSlugs,
      toggleCompareSlug,
      journeyTasks,
      addJourneyTask,
      catalog.universities,
    ]
  );

  const value = useMemo<WorkspaceIntelligenceContextValue>(
    () => ({
      roadmapState,
      setRoadmapState,
      routineState,
      setRoutineState,
      goalsState,
      setGoalsState,
      addHabitToTracker,
      todoRecommendations,
      setTodoRecommendations,
      agentLogs,
      addAgentLog,
      creatorProfile,
      setCreatorProfile,
      entitlementStatus,
      refreshEntitlementStatus,
      mapFocusRequest,
      requestMapFocus,
      clearMapFocus,
      tutorialSection,
      setTutorialSection,
      toast,
      showToast,
      dismissToast,
      executeSemanticAction,
      getAuthHeaders,
    }),
    [
      roadmapState,
      routineState,
      goalsState,
      addHabitToTracker,
      todoRecommendations,
      agentLogs,
      addAgentLog,
      creatorProfile,
      entitlementStatus,
      refreshEntitlementStatus,
      mapFocusRequest,
      requestMapFocus,
      clearMapFocus,
      tutorialSection,
      toast,
      showToast,
      dismissToast,
      executeSemanticAction,
      getAuthHeaders,
    ]
  );

  return (
    <WorkspaceIntelligenceContext.Provider value={value}>
      {children}
    </WorkspaceIntelligenceContext.Provider>
  );
};

export function useWorkspaceIntelligence() {
  const ctx = useContext(WorkspaceIntelligenceContext);
  if (!ctx) {
    throw new Error(
      'useWorkspaceIntelligence must be used inside WorkspaceIntelligenceProvider'
    );
  }
  return ctx;
}
