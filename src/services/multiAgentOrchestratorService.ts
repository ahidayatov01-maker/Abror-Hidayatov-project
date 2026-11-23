import type { GoogleGenAI } from '@google/genai';
import {
  selectAgentsForQuery,
  type AgentId,
  type AgentTeamId,
  type ProposedAgentAction,
} from '../utils/aiAgentsRegistry.ts';
import {
  checkDailyQuota,
  getTierEntitlements,
  type SubscriptionTierId,
  type UsageCounters,
} from '../utils/entitlements.ts';
import type { RoutineHorizon } from '../utils/productivityEngine.ts';
import type { RoadmapRouteMode } from '../utils/roadmapEngine.ts';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  uz: 'Uzbek (Oʻzbek tili)',
  ru: 'Russian (Русский)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese (中文)',
  de: 'German (Deutsch)',
};

// Server-side daily quota tracking (per authenticated UID or guest IP/session key)
const dailyUsageStore = new Map<string, UsageCounters>();

function getTodayKey(actorKey: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${actorKey}:${day}`;
}

export function getActorUsage(actorKey: string): UsageCounters {
  const key = getTodayKey(actorKey);
  const existing = dailyUsageStore.get(key);
  if (existing) return { ...existing };
  return {
    aiMessagesToday: 0,
    roadmapGenerationsToday: 0,
    routineGenerationsToday: 0,
    todoRecommendationsToday: 0,
    goalStrategiesToday: 0,
  };
}

export function incrementActorUsage(
  actorKey: string,
  action: 'ai_message' | 'roadmap' | 'routine' | 'todo' | 'goal_strategy'
): UsageCounters {
  const key = getTodayKey(actorKey);
  const current = getActorUsage(actorKey);
  if (action === 'ai_message') current.aiMessagesToday += 1;
  if (action === 'roadmap') current.roadmapGenerationsToday += 1;
  if (action === 'routine') current.routineGenerationsToday += 1;
  if (action === 'todo') current.todoRecommendationsToday += 1;
  if (action === 'goal_strategy') current.goalStrategiesToday = (current.goalStrategiesToday || 0) + 1;
  dailyUsageStore.set(key, current);
  return { ...current };
}

export function enforceActorQuota(
  actorKey: string,
  tier: SubscriptionTierId,
  action: 'ai_message' | 'roadmap' | 'routine' | 'todo' | 'goal_strategy',
  isOwner = false
) {
  const usage = getActorUsage(actorKey);
  const used =
    action === 'ai_message'
      ? usage.aiMessagesToday
      : action === 'roadmap'
      ? usage.roadmapGenerationsToday
      : action === 'routine'
      ? usage.routineGenerationsToday
      : action === 'goal_strategy'
      ? usage.goalStrategiesToday || 0
      : usage.todoRecommendationsToday;

  return {
    quota: checkDailyQuota(tier, action, used, isOwner),
    usage,
    entitlements: getTierEntitlements(isOwner ? 'premium' : tier),
  };
}

const PRIMARY_GEMINI_MODEL = 'gemini-4-hydrogen';
const FALLBACK_GEMINI_MODEL = 'gemini-3.1-flash-lite';

function isTransientDemandError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|rate/i.test(msg);
}

function formatReadableAiError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (isTransientDemandError(err)) {
    return new Error(
      'AI models are momentarily experiencing high demand. Please retry in a few seconds.'
    );
  }
  return new Error(msg || 'AI service could not complete this request.');
}

async function generateContentWithResilience(
  ai: GoogleGenAI,
  contents: string,
  config?: { systemInstruction?: string; responseMimeType?: string }
) {
  const modelsToTry = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config,
      });
    } catch (err) {
      lastError = err;
      if (!isTransientDemandError(err)) {
        throw formatReadableAiError(err);
      }
    }
  }

  throw formatReadableAiError(lastError);
}

function safeParseJson<T>(rawText: string): T | null {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const startIdx = candidate.indexOf('{');
    const endIdx = candidate.lastIndexOf('}');
    if (startIdx >= 0 && endIdx > startIdx) {
      try {
        return JSON.parse(candidate.slice(startIdx, endIdx + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface CatalogUniversityBrief {
  slug: string;
  name: string;
  shortName: string;
  citySlug: string;
  countryCode: string;
  institutionType: string;
  primaryLanguage: string;
  tuitionLocalDisplay: string;
  academicStrengthsJson: string[];
  officialWebsite: string;
  verificationStatus: string;
}

export interface CatalogScholarshipBrief {
  slug: string;
  name: string;
  countryCode: string;
  degreeLevelsJson: string[];
  deadlineText: string;
  coverageSummary: string;
  officialUrl: string;
}

export async function orchestrateAdvisorRequest(params: {
  ai: GoogleGenAI;
  message: string;
  history: Array<{ role?: string; content?: string }>;
  userContext: Record<string, unknown>;
  language: string;
  tier: SubscriptionTierId;
  preferredAgentId?: AgentId | null;
  preferredTeamId?: AgentTeamId | null;
  universities: CatalogUniversityBrief[];
  scholarships: CatalogScholarshipBrief[];
}) {
  const {
    ai,
    message,
    history,
    userContext,
    language,
    tier,
    preferredAgentId,
    preferredTeamId,
    universities,
    scholarships,
  } = params;

  const routing = selectAgentsForQuery({
    query: message,
    tier,
    preferredAgentId,
    preferredTeamId,
  });

  const lowerMsg = message.toLowerCase();
  const terms = lowerMsg
    .split(/[^a-z0-9\u0400-\u04ff\u3040-\u30ff\u4e00-\u9faf]+/)
    .filter((t) => t.length > 2);

  const matchedUnis = universities
    .filter((u) => {
      const hay = `${u.name} ${u.shortName} ${u.countryCode} ${u.citySlug} ${u.academicStrengthsJson.join(' ')}`.toLowerCase();
      return terms.some((term) => hay.includes(term));
    })
    .slice(0, 4);

  const matchedSchols = scholarships
    .filter((s) => {
      const hay = `${s.name} ${s.countryCode} ${s.coverageSummary}`.toLowerCase();
      return terms.some((term) => hay.includes(term));
    })
    .slice(0, 3);

  const activeLanguageLabel = LANGUAGE_NAMES[language] || 'English';
  const agentBrief = routing.selectedAgents
    .map((a) => `- ${a.name} (${a.shortRole}): ${a.description}`)
    .join('\n');

  const systemInstruction = `You are the Central Multi-Agent Orchestrator for Global University Intelligence.
Respond strictly in ${activeLanguageLabel}.

ACTIVE SPECIALIZED AGENTS FOR THIS CONSULTATION:
${agentBrief}

STRICT TRUTH & VERIFICATION PRINCIPLES:
1. Ground every university, tuition figure, and scholarship statement in the verified catalog preview below or clearly label external items as "Estimated / Requires Official Verification".
2. NEVER fabricate acceptance guarantees, hidden admission percentages, or unverified deadlines.
3. Structure your answer clearly with concise headings or bullet points and concrete next steps.
4. Keep your tone scholarly, calm, executive, and actionable.
5. Never claim you already saved a university, modified a routine, or created a task unless the user clicks the confirmation action button; instead explain what action you recommend executing.

USER WORKSPACE CONTEXT:
${JSON.stringify(userContext || {})}

MATCHED VERIFIED UNIVERSITIES (${matchedUnis.length}):
${JSON.stringify(
  matchedUnis.map((u) => ({
    slug: u.slug,
    name: u.name,
    country: u.countryCode,
    tuition: u.tuitionLocalDisplay,
    strengths: u.academicStrengthsJson.slice(0, 4),
    website: u.officialWebsite,
  }))
)}

MATCHED VERIFIED SCHOLARSHIPS (${matchedSchols.length}):
${JSON.stringify(
  matchedSchols.map((s) => ({
    slug: s.slug,
    name: s.name,
    country: s.countryCode,
    deadline: s.deadlineText,
    coverage: s.coverageSummary,
  }))
)}

CATALOG COVERAGE: ${universities.length} verified universities, ${scholarships.length} scholarships.`;

  const conversationHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Student' : 'AI Maslahatchi'}: ${m.content || ''}`)
        .join('\n\n')
    : '';

  const fullPrompt = conversationHistory
    ? `${conversationHistory}\n\nStudent: ${message.trim()}`
    : message.trim();

  const response = await generateContentWithResilience(ai, fullPrompt, {
    systemInstruction,
  });

  // Build grounded permission-gated proposed actions
  const primaryAgentId = routing.selectedAgents[0]?.id || 'university_scout';
  const proposedActions: ProposedAgentAction[] = [];

  if (matchedUnis[0]) {
    proposedActions.push({
      id: `act-save-${matchedUnis[0].slug}`,
      type: 'save_university',
      label: `Save ${matchedUnis[0].shortName || matchedUnis[0].name}`,
      description: `Add ${matchedUnis[0].name} to My Universities shortlist.`,
      agentId: 'university_scout',
      requiresApproval: true,
      payload: {
        universitySlug: matchedUnis[0].slug,
        universityName: matchedUnis[0].name,
      },
    });
    proposedActions.push({
      id: `act-map-${matchedUnis[0].slug}`,
      type: 'locate_map_university',
      label: `Locate ${matchedUnis[0].shortName || matchedUnis[0].name} on 3D Globe`,
      description: `Focus World Explorer on ${matchedUnis[0].name}.`,
      agentId: 'voice_navigator',
      requiresApproval: false,
      payload: {
        universitySlug: matchedUnis[0].slug,
        universityName: matchedUnis[0].name,
        countryCode: matchedUnis[0].countryCode,
      },
    });
  }

  if (matchedUnis.length >= 2) {
    proposedActions.push({
      id: `act-cmp-${matchedUnis[0].slug}-${matchedUnis[1].slug}`,
      type: 'add_comparison',
      label: `Compare ${matchedUnis[0].shortName} vs ${matchedUnis[1].shortName}`,
      description: 'Open side-by-side institutional comparison table.',
      agentId: 'university_scout',
      requiresApproval: false,
      payload: {
        slugs: [matchedUnis[0].slug, matchedUnis[1].slug],
      },
    });
  }

  if (
    routing.selectedAgents.some(
      (a) => a.id === 'academic_cartographer' || a.id === 'transfer_architect'
    )
  ) {
    proposedActions.push({
      id: 'act-roadmap-open',
      type: 'open_roadmap_generator',
      label: "Open Akademik yo'lim Route Map",
      description: 'Launch interactive multi-route navigation map for this target.',
      agentId: 'academic_cartographer',
      requiresApproval: false,
      payload: {
        targetUniversitySlug: matchedUnis[0]?.slug || null,
        targetUniversityName: matchedUnis[0]?.name || null,
        targetCountry: matchedUnis[0]?.countryCode || null,
      },
    });
  }

  if (routing.selectedAgents.some((a) => a.id === 'routine_architect')) {
    proposedActions.push({
      id: 'act-routine-open',
      type: 'open_routine_generator',
      label: 'Open Smart Routine Planner',
      description: 'Review or generate a lock-safe daily/weekly study schedule.',
      agentId: 'routine_architect',
      requiresApproval: false,
      payload: {},
    });
  }

  if (
    routing.selectedAgents.some(
      (a) =>
        a.id === 'task_orchestrator' ||
        a.id === 'admission_auditor' ||
        a.id === 'scholarship_hunter'
    )
  ) {
    const taskTitle = matchedSchols[0]
      ? `Review ${matchedSchols[0].name} eligibility & deadline`
      : matchedUnis[0]
      ? `Audit admission requirements for ${matchedUnis[0].name}`
      : 'Complete weekly university admission & exam audit';
    proposedActions.push({
      id: `act-task-${Date.now()}`,
      type: 'create_task',
      label: `Add Task: ${taskTitle.slice(0, 42)}`,
      description: 'Create an actionable item in your To-Do List.',
      agentId: 'task_orchestrator',
      requiresApproval: true,
      payload: {
        title: taskTitle,
        category: matchedSchols[0] ? 'Scholarships' : 'Admissions',
        targetUniversitySlug: matchedUnis[0]?.slug || null,
      },
    });
  }

  if (routing.selectedAgents.some((a) => a.id === 'habit_coach')) {
    proposedActions.push({
      id: `act-habit-${Date.now()}`,
      type: 'create_habit',
      label: 'Add Daily Study Habit in Habits Tracker',
      description: 'Create a tracked daily academic focus habit.',
      agentId: 'habit_coach',
      requiresApproval: true,
      payload: {
        title: 'Focused IELTS & Application Prep (45 min)',
        category: 'Academic',
      },
    });
  }

  if (routing.selectedAgents.some((a) => a.id === 'tuition_analyst')) {
    proposedActions.push({
      id: 'act-finance-open',
      type: 'navigate_section',
      label: 'Open Financial Planner',
      description: 'Model tuition, living costs, and scholarship offsets.',
      agentId: 'tuition_analyst',
      requiresApproval: false,
      payload: { section: 'financial-planner' },
    });
  }

  return {
    reply: response.text || 'Unable to generate an advisory response for that query.',
    model: 'gemini-4-hydrogen',
    primaryAgentId,
    activeAgents: routing.selectedAgents.map((a) => ({
      id: a.id,
      name: a.name,
      teamId: a.teamId,
      shortRole: a.shortRole,
      status: 'completed' as const,
    })),
    lockedAgentNotices: routing.lockedMatches.map((a) => ({
      id: a.id,
      name: a.name,
      minimumTier: a.minimumTier,
    })),
    groundedCount: universities.length,
    matchedUniversities: matchedUnis.map((u) => ({
      slug: u.slug,
      name: u.name,
      shortName: u.shortName,
      citySlug: u.citySlug,
      countryCode: u.countryCode,
      tuition: u.tuitionLocalDisplay,
      strengths: u.academicStrengthsJson,
    })),
    matchedScholarships: matchedSchols.map((s) => ({
      slug: s.slug,
      name: s.name,
      deadline: s.deadlineText,
      coverage: s.coverageSummary,
    })),
    proposedActions: proposedActions.slice(0, 4),
    executionSteps: [
      `Central Orchestrator routed query to ${routing.selectedAgents.map((a) => a.name).join(' + ')}`,
      `Grounded context against ${universities.length} universities and ${scholarships.length} scholarships`,
      `Generated response in ${activeLanguageLabel} with permission-gated workspace actions`,
    ],
  };
}

export async function generateRoadmapWithGemini(params: {
  ai: GoogleGenAI;
  originCountry: string;
  originEducationLevel: string;
  targetCountry: string;
  targetUniversityName: string;
  targetDegree: string;
  targetDiscipline: string;
  mode: RoadmapRouteMode;
  language: string;
}) {
  const langLabel = LANGUAGE_NAMES[params.language] || 'English';
  const prompt = `You are the Academic Cartographer Agent for Global University Intelligence.
Generate a realistic, structured 6-station academic roadmap for:
- Origin Country: ${params.originCountry}
- Current Education Level: ${params.originEducationLevel}
- Target Country: ${params.targetCountry}
- Target University: ${params.targetUniversityName}
- Target Degree & Discipline: ${params.targetDegree} in ${params.targetDiscipline}
- Route Mode: ${params.mode} (direct = direct admission, transfer = transfer or foundation bridge, scholarship = scholarship-first funded track)
- Output language for titles/descriptions: ${langLabel}

Return ONLY valid JSON with this exact schema (no markdown commentary outside JSON):
{
  "tagline": "string",
  "estimatedDurationMonths": 14,
  "summaryNote": "concise honest note distinguishing strategy from items requiring official verification",
  "stations": [
    {
      "title": "short milestone title",
      "subtitle": "concise badge/target e.g. IELTS 7.0+",
      "phase": "Foundation" | "Exams & Docs" | "Application" | "Funding & Visa" | "Arrival",
      "weight": 15,
      "timeframe": "Months 1-2",
      "estimatedCostUsd": 250,
      "evidenceCategory": "verified" | "user_provided" | "ai_recommendation" | "estimated" | "requires_verification",
      "description": "1-2 sentences describing actionable milestone",
      "requirements": ["req 1", "req 2", "req 3"],
      "completionCriteria": "clear objective condition to mark complete",
      "officialCheckNote": "optional verification reminder"
    }
  ]
}`;

  const response = await generateContentWithResilience(params.ai, prompt, {
    responseMimeType: 'application/json',
  });

  const parsed = safeParseJson<{
    tagline?: string;
    estimatedDurationMonths?: number;
    summaryNote?: string;
    stations?: Array<{
      title: string;
      subtitle: string;
      phase: 'Foundation' | 'Exams & Docs' | 'Application' | 'Funding & Visa' | 'Arrival';
      weight: number;
      timeframe: string;
      estimatedCostUsd: number;
      evidenceCategory:
        | 'verified'
        | 'user_provided'
        | 'ai_recommendation'
        | 'estimated'
        | 'requires_verification';
      description: string;
      requirements: string[];
      completionCriteria: string;
      officialCheckNote?: string;
    }>;
  }>(response.text || '');

  if (!parsed || !Array.isArray(parsed.stations) || parsed.stations.length < 3) {
    throw new Error('Academic Cartographer returned an incomplete route structure. Please retry.');
  }

  return parsed;
}

export async function generateRoutineWithGemini(params: {
  ai: GoogleGenAI;
  horizon: RoutineHorizon;
  focusGoal: string;
  dailyCapacityHours: number;
  targetUniversityName?: string;
  language: string;
}) {
  const langLabel = LANGUAGE_NAMES[params.language] || 'English';
  const prompt = `You are the Smart Routine Architect Agent for Global University Intelligence.
Generate a realistic, sustainable ${params.horizon} academic preparation routine.
- Focus Goal: ${params.focusGoal}
- Daily Study Capacity: ${params.dailyCapacityHours} hours/day
- Target University Context: ${params.targetUniversityName || 'International University Admissions'}
- Output language: ${langLabel}

RULES:
- Must include at least one break_recovery block for daily or weekly horizons to avoid unrealistic burnout schedules.
- Return 4 to 6 concrete blocks.
- Return ONLY valid JSON matching:
{
  "rationale": "1 sentence rationale",
  "blocks": [
    {
      "title": "Block title",
      "slotLabel": "e.g. 07:30 - 08:30 or Mon-Tue or Week 1 or Q1",
      "durationMinutes": 60,
      "category": "language_exam" | "university_research" | "application_docs" | "academic_study" | "scholarship_prep" | "break_recovery" | "personal",
      "notes": "practical execution guidance"
    }
  ]
}`;

  const response = await generateContentWithResilience(params.ai, prompt, {
    responseMimeType: 'application/json',
  });

  const parsed = safeParseJson<{
    rationale?: string;
    blocks?: Array<{
      title: string;
      slotLabel: string;
      durationMinutes: number;
      category:
        | 'language_exam'
        | 'university_research'
        | 'application_docs'
        | 'academic_study'
        | 'scholarship_prep'
        | 'break_recovery'
        | 'personal';
      notes?: string;
    }>;
  }>(response.text || '');

  if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    throw new Error('Smart Routine Architect could not generate structured routine blocks.');
  }

  return parsed;
}

export async function generateTodoRecommendationsWithGemini(params: {
  ai: GoogleGenAI;
  userContext: Record<string, unknown>;
  existingTaskTitles: string[];
  language: string;
}) {
  const langLabel = LANGUAGE_NAMES[params.language] || 'English';
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are the Task & Priority Orchestrator Agent for Global University Intelligence.
Generate 4 high-impact, concrete academic preparation tasks grounded in this student's workspace context.
Today's date: ${today}.
Output language: ${langLabel}.
Do NOT duplicate any of these existing active tasks: ${JSON.stringify(params.existingTaskTitles.slice(0, 20))}

USER WORKSPACE CONTEXT:
${JSON.stringify(params.userContext)}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "title": "Actionable task title (max 80 chars)",
      "category": "Admissions" | "Exams" | "Scholarships" | "Documents" | "Research" | "Financial" | "Milestone",
      "priority": "high" | "medium" | "low",
      "suggestedDueDate": "YYYY-MM-DD",
      "rationale": "1 short sentence explaining why this matters now"
    }
  ]
}`;

  const response = await generateContentWithResilience(params.ai, prompt, {
    responseMimeType: 'application/json',
  });

  const parsed = safeParseJson<{
    recommendations?: Array<{
      title: string;
      category: string;
      priority: 'high' | 'medium' | 'low';
      suggestedDueDate?: string | null;
      rationale: string;
    }>;
  }>(response.text || '');

  if (!parsed || !Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    throw new Error('Task & Priority Orchestrator returned an empty recommendation list.');
  }

  return parsed.recommendations;
}

export async function generateGoalStrategyWithGemini(params: {
  ai: GoogleGenAI;
  goal: Record<string, unknown>;
  dailyStudyHours?: number | null;
  workspaceContext: Record<string, unknown>;
  language: string;
}) {
  const langLabel = LANGUAGE_NAMES[params.language] || 'English';
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are the Central Multi-Agent Orchestrator for Global University Intelligence coordinating existing specialized agents (DO NOT invent an 11th agent):
- Agent 3: Admission Profile Auditor (exam & qualification requirements)
- Agent 5: Academic Cartographer (Akademik yo'lim milestone link)
- Agent 6: Smart Routine Architect (realistic study allocation preserving sleep/breaks)
- Agent 7: Task & Priority Orchestrator (actionable non-duplicate tasks)
- Agent 8: Habit & Consistency Coach (sustainable daily/weekly habits)
- Agent 2: Scholarship & Grant Hunter (scholarship alignment where relevant)
- Agent 9: Tuition & Living Cost Analyst (realistic exam/prep budget awareness)

Today's date: ${today}.
Output language for ALL user-facing prose: ${langLabel}.

STRICT RULES:
1. NEVER promise or guarantee a specific exam score from a fixed number of study hours.
2. NEVER invent the user's current level or available study hours if missing; if critical details are missing, note a concise question in "clarificationNeeded".
3. Respect sleep, school obligations, and recovery breaks in suggested routine blocks.
4. Keep every proposed task, habit, and routine block concrete and realistic.

GOAL DATA:
${JSON.stringify(params.goal)}

USER AVAILABLE DAILY STUDY HOURS: ${params.dailyStudyHours ?? 'Not specified'}
WORKSPACE CONTEXT:
${JSON.stringify(params.workspaceContext)}

Return ONLY valid JSON matching this exact structure:
{
  "generatedByAgents": ["Admission Profile Auditor", "Academic Cartographer", "Smart Routine Architect", "Task & Priority Orchestrator", "Habit & Consistency Coach"],
  "goalAnalysis": "2-3 sentence objective assessment of scope, difficulty, and value",
  "currentPositionAssessment": "2 sentences assessing current level vs target gap without fabricating data",
  "clarificationNeeded": null,
  "stages": [
    { "title": "Stage 1 title", "durationLabel": "Weeks 1-4", "focus": "Clear stage focus" }
  ],
  "weeklyTargets": ["Weekly target 1", "Weekly target 2", "Weekly target 3"],
  "monthlyMilestones": ["Month 1 checkpoint", "Month 2 checkpoint"],
  "dailyStudyAllocationNote": "Balanced daily study guidance preserving rest and schoolwork",
  "reviewSessions": ["Spaced repetition / error log review habit"],
  "practiceRecommendations": ["Official practice test recommendation"],
  "progressCheckpoints": ["Measurable checkpoint 1", "Measurable checkpoint 2"],
  "fallbackStrategy": "Constructive adjustment plan if progress is slower than expected",
  "syncProposals": {
    "routineBlocks": [
      {
        "title": "Focused Study Block",
        "slotLabel": "18:00 - 19:00",
        "durationMinutes": 60,
        "category": "language_exam",
        "notes": "Actionable study focus"
      }
    ],
    "todoTasks": [
      {
        "title": "Concrete preparation task",
        "category": "Exams",
        "dueDate": "YYYY-MM-DD",
        "notes": "Why this task matters"
      }
    ],
    "habits": [
      {
        "title": "Daily 30-min focused practice",
        "category": "Language Learning",
        "targetMinutes": 30,
        "frequency": "daily"
      }
    ],
    "roadmapMilestoneTitle": "Milestone title to connect to Akademik yo'lim",
    "librarySearchQuery": "Concise search keyword for Research Library"
  }
}`;

  const response = await generateContentWithResilience(params.ai, prompt, {
    responseMimeType: 'application/json',
  });

  const parsed = safeParseJson<Record<string, unknown>>(response.text || '');
  if (!parsed || !parsed.goalAnalysis || !Array.isArray(parsed.stages)) {
    throw new Error('AI Goal Strategist returned an incomplete preparation plan. Please retry.');
  }

  return parsed;
}

export async function recommendCertificatesWithGemini(params: {
  ai: GoogleGenAI;
  targetCountry: string;
  targetUniversity?: string;
  intendedDegree: string;
  studyLanguage: string;
  intendedCareer: string;
  currentQualifications: string;
  targetAdmissionYear: string;
  language: string;
}) {
  const langLabel = LANGUAGE_NAMES[params.language] || 'English';
  const prompt = `You are the Admission Profile Auditor & Academic Cartographer Agents for Global University Intelligence.
Answer the student's question: "Which certificates do I actually need?" in ${langLabel}.

CRITICAL TRUTH RULES:
1. Actively help the student AVOID wasting money and time on unnecessary certificates.
2. Example: If studying an English-taught degree in Japan or Germany, explicitly list JLPT or TestDaF as Optional or Unnecessary for admission rather than pretending it is mandatory.
3. Never recommend certificates merely because they are popular.
4. Clearly note when requirements vary by specific university and require official portal verification.

STUDENT PROFILE:
- Target Country: ${params.targetCountry}
- Target University: ${params.targetUniversity || 'Not specified'}
- Intended Degree: ${params.intendedDegree}
- Study Language: ${params.studyLanguage}
- Intended Career: ${params.intendedCareer || 'Not specified'}
- Current Qualifications: ${params.currentQualifications || 'None specified'}
- Target Admission Year: ${params.targetAdmissionYear || 'Not specified'}

Return ONLY valid JSON:
{
  "summary": "2-sentence strategic recommendation tailored to the student's exact track",
  "required": [{ "name": "Exam name", "reason": "Why required", "targetBenchmark": "Typical threshold" }],
  "recommended": [{ "name": "Exam name", "reason": "Why strongly helpful", "targetBenchmark": "Typical benchmark" }],
  "optional": [{ "name": "Exam name", "reason": "When it adds extra value" }],
  "unnecessary": [{ "name": "Exam name", "reason": "Why you can skip this and save time/money" }],
  "recommendedOrder": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "verificationReminder": "Concise reminder to confirm official faculty requirements"
}`;

  const response = await generateContentWithResilience(params.ai, prompt, {
    responseMimeType: 'application/json',
  });

  const parsed = safeParseJson<Record<string, unknown>>(response.text || '');
  if (!parsed || !Array.isArray(parsed.required)) {
    throw new Error('Could not generate structured certificate recommendations. Please retry.');
  }
  return parsed;
}

