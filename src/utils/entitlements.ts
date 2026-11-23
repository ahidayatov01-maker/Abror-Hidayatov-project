export type SubscriptionTierId = 'free' | 'standard' | 'premium';

export interface TierEntitlements {
  tierId: SubscriptionTierId;
  name: string;
  tagline: string;
  recommended?: boolean;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  priceMonthlyUzs: string;
  maxSavedUniversities: number;
  maxCompareSlots: number;
  maxActiveGoals: number;
  maxCertificateCompareSlots: number;
  dailyAiMessages: number;
  dailyRoadmapGenerations: number;
  dailyRoutineGenerations: number;
  dailyTodoRecommendations: number;
  dailyGoalStrategyGenerations: number;
  availableAgentIds: string[];
  multiRouteComparison: boolean;
  fullTeamOrchestration: boolean;
  audioGuideEnabled: boolean;
  audioGuideSemanticActions: boolean;
  advancedFinancialScenarios: boolean;
  multiCertificateSimulator: boolean;
  multiCountryComparison: boolean;
  aiGoalStrategistEnabled: boolean;
  goalDependencyManagement: boolean;
  goalPlanExportEnabled: boolean;
  dataExportEnabled: boolean;
  highlights: string[];
}

export interface UsageCounters {
  aiMessagesToday: number;
  roadmapGenerationsToday: number;
  routineGenerationsToday: number;
  todoRecommendationsToday: number;
  goalStrategiesToday?: number;
  savedUniversitiesCount?: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  unlimited?: boolean;
  reason?: string;
}

export const TIER_ENTITLEMENTS: Record<SubscriptionTierId, TierEntitlements> = {
  free: {
    tierId: 'free',
    name: 'Free Explorer',
    tagline: 'Core discovery workspace',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    priceMonthlyUzs: '0 UZS',
    maxSavedUniversities: 5,
    maxCompareSlots: 2,
    maxActiveGoals: 3,
    maxCertificateCompareSlots: 2,
    dailyAiMessages: 12,
    dailyRoadmapGenerations: 2,
    dailyRoutineGenerations: 2,
    dailyTodoRecommendations: 3,
    dailyGoalStrategyGenerations: 0,
    availableAgentIds: [
      'university_scout',
      'academic_cartographer',
      'voice_navigator',
    ],
    multiRouteComparison: false,
    fullTeamOrchestration: false,
    audioGuideEnabled: true,
    audioGuideSemanticActions: true,
    advancedFinancialScenarios: false,
    multiCertificateSimulator: false,
    multiCountryComparison: false,
    aiGoalStrategistEnabled: false,
    goalDependencyManagement: false,
    goalPlanExportEnabled: false,
    dataExportEnabled: true,
    highlights: [
      '3D World Map & catalog',
      'Up to 3 active goals',
      '3 core AI agents',
      '12 AI messages per day',
      'Routine, To-Do & Habits',
    ],
  },
  standard: {
    tierId: 'standard',
    name: 'Scholar Plus',
    tagline: 'Full applicant toolkit',
    recommended: true,
    priceMonthlyUsd: 9,
    priceYearlyUsd: 90,
    priceMonthlyUzs: '~115,000 UZS',
    maxSavedUniversities: 25,
    maxCompareSlots: 4,
    maxActiveGoals: 25,
    maxCertificateCompareSlots: 4,
    dailyAiMessages: 60,
    dailyRoadmapGenerations: 10,
    dailyRoutineGenerations: 10,
    dailyTodoRecommendations: 12,
    dailyGoalStrategyGenerations: 10,
    availableAgentIds: [
      'university_scout',
      'scholarship_hunter',
      'admission_auditor',
      'academic_cartographer',
      'routine_architect',
      'task_orchestrator',
      'voice_navigator',
    ],
    multiRouteComparison: true,
    fullTeamOrchestration: true,
    audioGuideEnabled: true,
    audioGuideSemanticActions: true,
    advancedFinancialScenarios: true,
    multiCertificateSimulator: true,
    multiCountryComparison: false,
    aiGoalStrategistEnabled: true,
    goalDependencyManagement: true,
    goalPlanExportEnabled: false,
    dataExportEnabled: true,
    highlights: [
      '25 active goals & AI Plan',
      'Multi-exam country simulator',
      '7 specialized AI agents',
      '3-route academic roadmap',
      '60 AI messages per day',
    ],
  },
  premium: {
    tierId: 'premium',
    name: 'Global Elite Pro',
    tagline: 'Complete 10-agent ecosystem',
    priceMonthlyUsd: 24,
    priceYearlyUsd: 240,
    priceMonthlyUzs: '~306,000 UZS',
    maxSavedUniversities: 200,
    maxCompareSlots: 6,
    maxActiveGoals: 200,
    maxCertificateCompareSlots: 6,
    dailyAiMessages: 250,
    dailyRoadmapGenerations: 50,
    dailyRoutineGenerations: 50,
    dailyTodoRecommendations: 40,
    dailyGoalStrategyGenerations: 50,
    availableAgentIds: [
      'university_scout',
      'scholarship_hunter',
      'admission_auditor',
      'transfer_architect',
      'academic_cartographer',
      'routine_architect',
      'task_orchestrator',
      'habit_coach',
      'tuition_analyst',
      'voice_navigator',
    ],
    multiRouteComparison: true,
    fullTeamOrchestration: true,
    audioGuideEnabled: true,
    audioGuideSemanticActions: true,
    advancedFinancialScenarios: true,
    multiCertificateSimulator: true,
    multiCountryComparison: true,
    aiGoalStrategistEnabled: true,
    goalDependencyManagement: true,
    goalPlanExportEnabled: true,
    dataExportEnabled: true,
    highlights: [
      'All 10 AI agents unlocked',
      'Unlimited goals & exports',
      'Transfer & Finance architects',
      '250 AI messages per day',
      'Compare up to 6 universities',
    ],
  },
};

export function normalizeTier(tier?: string | null): SubscriptionTierId {
  if (tier === 'standard' || tier === 'premium' || tier === 'free') {
    return tier;
  }
  return 'free';
}

export function getTierEntitlements(tier?: string | null): TierEntitlements {
  return TIER_ENTITLEMENTS[normalizeTier(tier)];
}

export function getAllTierDefinitions(): TierEntitlements[] {
  return [
    TIER_ENTITLEMENTS.free,
    TIER_ENTITLEMENTS.standard,
    TIER_ENTITLEMENTS.premium,
  ];
}

export function canAccessAgent(
  tier: string | null | undefined,
  agentId: string,
  isOwner = false
): boolean {
  if (isOwner) {
    return TIER_ENTITLEMENTS.premium.availableAgentIds.includes(agentId);
  }
  const ent = getTierEntitlements(tier);
  return ent.availableAgentIds.includes(agentId);
}

export function checkActiveGoalQuota(
  tier: string | null | undefined,
  currentActiveGoals: number,
  isOwner = false
): QuotaCheckResult {
  const safeCount = Math.max(0, Math.floor(currentActiveGoals));
  if (isOwner) {
    return {
      allowed: true,
      used: safeCount,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      unlimited: true,
    };
  }
  const ent = getTierEntitlements(tier);
  const limit = ent.maxActiveGoals;
  const remaining = Math.max(0, limit - safeCount);
  if (safeCount >= limit) {
    return {
      allowed: false,
      used: safeCount,
      limit,
      remaining: 0,
      unlimited: false,
      reason: `Active goal limit reached (${safeCount}/${limit}) for ${ent.name}. Completed and archived goals do not count toward this limit. Upgrade to Scholar Plus or Global Elite Pro for expanded goals.`,
    };
  }
  return {
    allowed: true,
    used: safeCount,
    limit,
    remaining,
    unlimited: false,
  };
}

export function checkDailyQuota(
  tier: string | null | undefined,
  action: 'ai_message' | 'roadmap' | 'routine' | 'todo' | 'goal_strategy',
  usedToday: number,
  isOwner = false
): QuotaCheckResult {
  const safeUsed = Math.max(0, Math.floor(usedToday));
  if (isOwner) {
    return {
      allowed: true,
      used: safeUsed,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      unlimited: true,
    };
  }

  const ent = getTierEntitlements(tier);
  const limit =
    action === 'ai_message'
      ? ent.dailyAiMessages
      : action === 'roadmap'
      ? ent.dailyRoadmapGenerations
      : action === 'routine'
      ? ent.dailyRoutineGenerations
      : action === 'goal_strategy'
      ? ent.dailyGoalStrategyGenerations
      : ent.dailyTodoRecommendations;

  if (limit === 0) {
    return {
      allowed: false,
      used: safeUsed,
      limit: 0,
      remaining: 0,
      unlimited: false,
      reason: `AI Goal Strategist requires Scholar Plus or Global Elite Pro. Upgrade to generate AI preparation plans and one-click ecosystem sync.`,
    };
  }

  const remaining = Math.max(0, limit - safeUsed);
  if (safeUsed >= limit) {
    return {
      allowed: false,
      used: safeUsed,
      limit,
      remaining: 0,
      unlimited: false,
      reason: `Daily limit reached (${safeUsed}/${limit}) for ${ent.name}. Upgrade to Scholar Plus or Global Elite Pro for higher daily quotas.`,
    };
  }
  return {
    allowed: true,
    used: safeUsed,
    limit,
    remaining,
    unlimited: false,
  };
}
