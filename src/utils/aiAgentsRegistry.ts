import { canAccessAgent, type SubscriptionTierId } from './entitlements';

export type AgentTeamId = 'admissions' | 'strategy' | 'finance_guidance';

export type AgentId =
  | 'university_scout'
  | 'scholarship_hunter'
  | 'admission_auditor'
  | 'transfer_architect'
  | 'academic_cartographer'
  | 'routine_architect'
  | 'task_orchestrator'
  | 'habit_coach'
  | 'tuition_analyst'
  | 'voice_navigator';

export type AgentExecutionStatus =
  | 'idle'
  | 'ready'
  | 'running'
  | 'completed'
  | 'locked'
  | 'error';

export interface AgentTeamDefinition {
  id: AgentTeamId;
  name: string;
  shortName: string;
  description: string;
}

export interface SpecializedAgentDefinition {
  id: AgentId;
  teamId: AgentTeamId;
  name: string;
  shortRole: string;
  description: string;
  minimumTier: SubscriptionTierId;
  capabilities: string[];
  keywords: string[];
  samplePrompt: string;
}

export interface ProposedAgentAction {
  id: string;
  type:
    | 'save_university'
    | 'add_comparison'
    | 'create_task'
    | 'create_habit'
    | 'navigate_section'
    | 'locate_map_country'
    | 'locate_map_university'
    | 'open_roadmap_generator'
    | 'open_routine_generator';
  label: string;
  description: string;
  agentId: AgentId;
  requiresApproval: boolean;
  payload: Record<string, unknown>;
}

export interface AgentExecutionLogEntry {
  id: string;
  timestamp: string;
  query: string;
  activeAgentIds: AgentId[];
  summary: string;
  status: 'completed' | 'partial' | 'error';
  executedActions: string[];
}

export const MAX_PLATFORM_AGENTS = 10;

export const AGENT_TEAMS: AgentTeamDefinition[] = [
  {
    id: 'admissions',
    name: 'Global Admissions & University Intelligence',
    shortName: 'Team 1 · Admissions',
    description:
      'University discovery, scholarship matching, profile readiness auditing, and transfer pathway design.',
  },
  {
    id: 'strategy',
    name: 'Academic Strategy, Roadmap & Productivity',
    shortName: 'Team 2 · Strategy',
    description:
      'Interactive academic roadmaps, realistic daily-to-yearly routines, prioritized tasks, and habit consistency.',
  },
  {
    id: 'finance_guidance',
    name: 'Financial Planning & Platform Guidance',
    shortName: 'Team 3 · Finance & Voice',
    description:
      'Tuition and living-cost modeling, funding scenarios, and multilingual voice & map navigation.',
  },
];

export const AI_AGENTS: SpecializedAgentDefinition[] = [
  // Team 1 — Global Admissions & University Intelligence (4 agents)
  {
    id: 'university_scout',
    teamId: 'admissions',
    name: 'University Scout Agent',
    shortRole: 'Global Discovery & Fit',
    description:
      'Searches verified global universities by discipline, degree level, tuition range, language, and country.',
    minimumTier: 'free',
    capabilities: ['Search verified catalog', 'Compare institutional fit', 'Shortlist candidates'],
    keywords: [
      'university',
      'universitet',
      'college',
      'campus',
      'program',
      'faculty',
      'degree',
      'major',
      'ranking',
      'scout',
      'find',
      'top',
      'qidir',
      'вуз',
      'университет',
    ],
    samplePrompt: 'Find the best Computer Science Bachelor programs in Japan or Germany with English tracks.',
  },
  {
    id: 'scholarship_hunter',
    teamId: 'admissions',
    name: 'Scholarship & Grant Hunter Agent',
    shortRole: 'Funding & Deadlines',
    description:
      'Identifies government scholarships (MEXT, DAAD, Chevening, GKS, Fulbright), coverage details, and eligibility checks.',
    minimumTier: 'standard',
    capabilities: ['Match scholarships', 'Surface official deadlines', 'Compare funding coverage'],
    keywords: [
      'scholarship',
      'grant',
      'stipendiya',
      'mext',
      'daad',
      'chevening',
      'gks',
      'fulbright',
      'funding',
      'free tuition',
      'грант',
      'стипендия',
    ],
    samplePrompt: 'Which full scholarships match an applicant from Uzbekistan aiming for STEM Master studies?',
  },
  {
    id: 'admission_auditor',
    teamId: 'admissions',
    name: 'Admission Profile Auditor Agent',
    shortRole: 'Readiness & Gaps',
    description:
      'Audits GPA, IELTS/TOEFL, SAT/GRE, essays, and extracurricular strength against verified entry requirements.',
    minimumTier: 'standard',
    capabilities: ['Audit profile gaps', 'Check language thresholds', 'Prioritize documents'],
    keywords: [
      'ielts',
      'toefl',
      'sat',
      'gre',
      'gpa',
      'requirement',
      'admission',
      'qabul',
      'hujjat',
      'essay',
      'sop',
      'cv',
      'profile',
      'audit',
      'поступление',
    ],
    samplePrompt: 'Audit my current profile (GPA 3.7, IELTS 6.5) for top European engineering universities.',
  },
  {
    id: 'transfer_architect',
    teamId: 'admissions',
    name: 'Transfer & Pathway Architect Agent',
    shortRole: 'Credit & Foundation Routes',
    description:
      'Designs realistic university transfer, Studienkolleg, foundation year, and credit-bridging pathways.',
    minimumTier: 'premium',
    capabilities: ['Map transfer pathways', 'Plan foundation years', 'Identify bridge requirements'],
    keywords: [
      'transfer',
      'pathway',
      'foundation',
      'studienkolleg',
      'bridge',
      'credit',
      'ko\'chirish',
      'perevod',
      'перевод',
    ],
    samplePrompt: 'Build a realistic transfer pathway from a university in Uzbekistan to a German TU9 university.',
  },

  // Team 2 — Academic Strategy, Roadmap & Productivity (4 agents)
  {
    id: 'academic_cartographer',
    teamId: 'strategy',
    name: 'Academic Cartographer Agent',
    shortRole: 'Interactive Route Maps',
    description:
      'Constructs multi-stage Akademik yo\'lim roadmaps with Direct, Transfer, and Scholarship tracks and milestones.',
    minimumTier: 'free',
    capabilities: ['Design multi-route maps', 'Sequence milestones', 'Estimate timeline stages'],
    keywords: [
      'roadmap',
      'yo\'l',
      'yolim',
      'akademik',
      'milestone',
      'step',
      'timeline',
      'route',
      'journey',
      'plan',
      'reja',
      'дорожная карта',
    ],
    samplePrompt: 'Design a 12-month Akademik yo\'lim roadmap from Tashkent to University of Tokyo.',
  },
  {
    id: 'routine_architect',
    teamId: 'strategy',
    name: 'Smart Routine Architect Agent',
    shortRole: 'Daily to Yearly Schedules',
    description:
      'Creates balanced Daily, Weekly, Monthly, and Yearly study routines with breaks and lock-safe scheduling.',
    minimumTier: 'standard',
    capabilities: ['Build balanced schedules', 'Respect locked blocks', 'Align with exam dates'],
    keywords: [
      'routine',
      'schedule',
      'tartib',
      'jadval',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'time block',
      'kunlik',
      'haftalik',
      'расписание',
    ],
    samplePrompt: 'Create a balanced weekly study routine for IELTS 7.5 prep alongside school classes.',
  },
  {
    id: 'task_orchestrator',
    teamId: 'strategy',
    name: 'Task & Priority Orchestrator Agent',
    shortRole: 'Actionable To-Do Prioritization',
    description:
      'Breaks roadmaps and deadlines into concrete, prioritized To-Do tasks without duplicating existing work.',
    minimumTier: 'standard',
    capabilities: ['Prioritize deadlines', 'Generate concrete tasks', 'Resolve bottlenecks'],
    keywords: [
      'task',
      'todo',
      'to-do',
      'vazifa',
      'deadline',
      'priority',
      'checklist',
      'next step',
      'задача',
    ],
    samplePrompt: 'Suggest my top 5 prioritized tasks for this week based on my shortlisted universities.',
  },
  {
    id: 'habit_coach',
    teamId: 'strategy',
    name: 'Habit & Consistency Coach Agent',
    shortRole: 'Sustainable Study Habits',
    description:
      'Turns long-term admission goals into measurable daily habits synced with Habits Tracker.',
    minimumTier: 'premium',
    capabilities: ['Design study habits', 'Diagnose streak friction', 'Prevent burnout'],
    keywords: [
      'habit',
      'odat',
      'streak',
      'consistency',
      'discipline',
      'tracker',
      'focus',
      'привычка',
    ],
    samplePrompt: 'Recommend 3 sustainable daily study habits to stay consistent for 6 months before exams.',
  },

  // Team 3 — Financial Planning & Platform Guidance (2 agents)
  {
    id: 'tuition_analyst',
    teamId: 'finance_guidance',
    name: 'Tuition & Living Cost Analyst Agent',
    shortRole: 'Budget & Funding Scenarios',
    description:
      'Compares tuition, housing, insurance, and currency conversions across countries and scholarship scenarios.',
    minimumTier: 'premium',
    capabilities: ['Compare annual budgets', 'Model scholarship offset', 'Flag hidden living costs'],
    keywords: [
      'cost',
      'tuition',
      'budget',
      'finance',
      'money',
      'narx',
      'xarajat',
      'moliya',
      'living',
      'housing',
      'usd',
      'eur',
      'uzs',
      'стоимость',
      'бюджет',
    ],
    samplePrompt: 'Compare annual living and tuition costs between Munich, Tokyo, and Seoul in USD and UZS.',
  },
  {
    id: 'voice_navigator',
    teamId: 'finance_guidance',
    name: 'Voice Guide & Platform Navigator Agent',
    shortRole: 'Voice & Semantic Navigation',
    description:
      'Guides users across sections, locates countries or universities on the 3D World Explorer, and explains features.',
    minimumTier: 'free',
    capabilities: ['Locate countries on map', 'Navigate workspace views', 'Run contextual tutorials'],
    keywords: [
      'map',
      'xarita',
      'globe',
      'show',
      'open',
      'navigate',
      'go to',
      'tutorial',
      'guide',
      'help',
      'voice',
      'ko\'rsat',
      'och',
      'карта',
    ],
    samplePrompt: 'Show Uzbekistan on the World Explorer map and explain how to compare universities.',
  },
];

if (AI_AGENTS.length !== MAX_PLATFORM_AGENTS) {
  throw new Error(
    `Platform architecture violation: expected exactly ${MAX_PLATFORM_AGENTS} agents, got ${AI_AGENTS.length}.`
  );
}

export function getAgentById(id: AgentId): SpecializedAgentDefinition {
  const found = AI_AGENTS.find((a) => a.id === id);
  if (!found) {
    return AI_AGENTS[0];
  }
  return found;
}

export function getAgentsByTeam(teamId: AgentTeamId): SpecializedAgentDefinition[] {
  return AI_AGENTS.filter((a) => a.teamId === teamId);
}

export interface AgentRoutingResult {
  selectedAgents: SpecializedAgentDefinition[];
  lockedMatches: SpecializedAgentDefinition[];
  primaryTeamId: AgentTeamId;
}

/**
 * Central Orchestrator Agent Router:
 * Routes a user query to 1–3 relevant specialized agents while honoring subscription entitlements.
 */
export function selectAgentsForQuery(params: {
  query: string;
  tier: string | null | undefined;
  preferredAgentId?: AgentId | null;
  preferredTeamId?: AgentTeamId | null;
}): AgentRoutingResult {
  const { query, tier, preferredAgentId, preferredTeamId } = params;
  const lower = query.toLowerCase();

  // Direct agent targeting if user explicitly clicked an agent
  if (preferredAgentId) {
    const target = getAgentById(preferredAgentId);
    if (canAccessAgent(tier, target.id)) {
      return {
        selectedAgents: [target],
        lockedMatches: [],
        primaryTeamId: target.teamId,
      };
    }
    // Requested agent is outside tier: record as locked match and fall back to an accessible agent
    const fallback =
      AI_AGENTS.find((a) => a.teamId === target.teamId && canAccessAgent(tier, a.id)) ||
      getAgentById('university_scout');
    return {
      selectedAgents: [fallback],
      lockedMatches: [target],
      primaryTeamId: target.teamId,
    };
  }

  // Score all 10 agents against multilingual keywords
  const scored = AI_AGENTS.map((agent) => {
    let score = 0;
    for (const kw of agent.keywords) {
      if (lower.includes(kw)) {
        score += kw.length > 5 ? 3 : 2;
      }
    }
    if (preferredTeamId && agent.teamId === preferredTeamId) {
      score += 1;
    }
    return { agent, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const selectedAgents: SpecializedAgentDefinition[] = [];
  const lockedMatches: SpecializedAgentDefinition[] = [];

  for (const item of scored) {
    if (selectedAgents.length >= 3) break;
    if (canAccessAgent(tier, item.agent.id)) {
      selectedAgents.push(item.agent);
    } else if (lockedMatches.length < 2) {
      lockedMatches.push(item.agent);
    }
  }

  // Default fallback when query is general (e.g. "Salom" or broad question)
  if (selectedAgents.length === 0) {
    const teamFallback = preferredTeamId
      ? AI_AGENTS.find((a) => a.teamId === preferredTeamId && canAccessAgent(tier, a.id))
      : null;
    selectedAgents.push(teamFallback || getAgentById('university_scout'));
  }

  return {
    selectedAgents,
    lockedMatches,
    primaryTeamId: selectedAgents[0].teamId,
  };
}
