import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessAgent,
  checkDailyQuota,
  getAllTierDefinitions,
  getTierEntitlements,
} from './entitlements';
import {
  AGENT_TEAMS,
  AI_AGENTS,
  MAX_PLATFORM_AGENTS,
  selectAgentsForQuery,
} from './aiAgentsRegistry';
import {
  createDefaultRoutineState,
  filterTodoTasks,
  isDuplicateTask,
  mergeGeneratedRoutineWithLocks,
  validateRoutineCapacity,
} from './productivityEngine';
import {
  computeCurvedPathD,
  computeRouteMetrics,
  createDefaultRoadmapState,
  mergeAiGeneratedRoute,
} from './roadmapEngine';
import { resolveSemanticVoiceCommand } from './semanticNavigation';

test('Subscription tiers & entitlements enforce strict server-ready boundaries', () => {
  const tiers = getAllTierDefinitions();
  assert.equal(tiers.length, 3);
  assert.equal(tiers[1].tierId, 'standard');
  assert.equal(tiers[1].name, 'Scholar Plus');
  assert.equal(tiers[1].recommended, true);

  assert.equal(canAccessAgent('free', 'university_scout'), true);
  assert.equal(canAccessAgent('free', 'transfer_architect'), false);
  assert.equal(canAccessAgent('premium', 'transfer_architect'), true);

  const freeEnt = getTierEntitlements('free');
  const qAllowed = checkDailyQuota('free', 'ai_message', freeEnt.dailyAiMessages - 1);
  assert.equal(qAllowed.allowed, true);
  assert.equal(qAllowed.remaining, 1);

  const qBlocked = checkDailyQuota('free', 'ai_message', freeEnt.dailyAiMessages);
  assert.equal(qBlocked.allowed, false);
  assert.equal(qBlocked.remaining, 0);
});

test('Multi-agent architecture strictly caps user-facing agents at 10 across 3 teams', () => {
  assert.equal(MAX_PLATFORM_AGENTS, 10);
  assert.equal(AI_AGENTS.length, 10);
  assert.equal(AGENT_TEAMS.length, 3);

  const uniqueIds = new Set(AI_AGENTS.map((a) => a.id));
  assert.equal(uniqueIds.size, 10);

  // Free user asking about transfer gets a fallback agent plus locked match notice
  const routedFree = selectAgentsForQuery({
    query: 'Build a transfer pathway to Germany',
    tier: 'free',
  });
  assert.ok(routedFree.selectedAgents.length >= 1);
  assert.ok(routedFree.lockedMatches.some((a) => a.id === 'transfer_architect'));

  // Premium user gets Transfer Architect directly
  const routedPremium = selectAgentsForQuery({
    query: 'Build a transfer pathway and tuition cost comparison',
    tier: 'premium',
  });
  assert.ok(routedPremium.selectedAgents.some((a) => a.id === 'transfer_architect'));
  assert.ok(routedPremium.selectedAgents.some((a) => a.id === 'tuition_analyst'));
});

test('Routine merge preserves locked and user-edited blocks and records version history', () => {
  const initial = createDefaultRoutineState();
  const dailyBlocks = initial.blocks.filter((b) => b.horizon === 'daily');
  assert.ok(dailyBlocks.some((b) => b.locked));

  // Mark one additional block as userEdited
  const modified = {
    ...initial,
    blocks: initial.blocks.map((b) =>
      b.id === 'rt-d-1' ? { ...b, userEdited: true, title: 'My Custom IELTS Block' } : b
    ),
  };

  const merged = mergeGeneratedRoutineWithLocks(modified, 'daily', [
    {
      title: 'AI Generated SAT Quant Sprint',
      slotLabel: '18:00 - 19:00',
      durationMinutes: 60,
      category: 'academic_study',
      notes: 'Focus on algebra & geometry.',
    },
  ]);

  const updatedDaily = merged.blocks.filter((b) => b.horizon === 'daily');
  assert.ok(updatedDaily.some((b) => b.title === 'My Custom IELTS Block'));
  assert.ok(updatedDaily.some((b) => b.locked && b.category === 'break_recovery'));
  assert.ok(updatedDaily.some((b) => b.title === 'AI Generated SAT Quant Sprint'));
  assert.equal(merged.versions.length, 1);

  const cap = validateRoutineCapacity(merged.blocks, 'daily');
  assert.equal(cap.warnings.length, 0);
});

test('To-Do deduplication and filtering handle overdue, upcoming, active, and completed states', () => {
  const tasks = [
    { id: 1, title: 'Submit MEXT Form', category: 'Scholarships', dueDate: '2026-11-10', status: 'pending' },
    { id: 2, title: 'Take IELTS Mock Test', category: 'Exams', dueDate: '2026-11-25', status: 'pending' },
    { id: 3, title: 'Audit Transcripts', category: 'Documents', dueDate: '2026-11-01', status: 'completed' },
  ];

  assert.equal(isDuplicateTask(tasks, 'submit mext form!'), true);
  assert.equal(isDuplicateTask(tasks, 'Audit Transcripts'), false); // completed task can be recreated
  assert.equal(isDuplicateTask(tasks, 'Write Statement of Purpose'), false);

  const today = '2026-11-19';
  assert.equal(filterTodoTasks(tasks, 'overdue', '', today).length, 1);
  assert.equal(filterTodoTasks(tasks, 'upcoming', '', today).length, 1);
  assert.equal(filterTodoTasks(tasks, 'completed', '', today).length, 1);
  assert.equal(filterTodoTasks(tasks, 'active', '', today).length, 2);
});

test('Akademik yo\'lim roadmap computes curved paths, weighted progress, and preserves completed milestones on AI merge', () => {
  const state = createDefaultRoadmapState({
    originCountry: 'Uzbekistan',
    targetUniversityName: 'The University of Tokyo',
  });

  const metrics = computeRouteMetrics(state.routes.direct);
  assert.ok(metrics.progressPercent > 0 && metrics.progressPercent < 100);
  assert.equal(metrics.completedCount, 1);
  assert.ok(metrics.currentStation?.status === 'in_progress');

  const pathD = computeCurvedPathD(state.routes.direct.stations);
  assert.ok(pathD.startsWith('M '));
  assert.ok(pathD.includes(' C '));

  const merged = mergeAiGeneratedRoute(state.routes.direct, [
    {
      title: 'Embassy Interview Simulation',
      subtitle: 'Tashkent Prep',
      phase: 'Application',
      weight: 20,
      timeframe: 'Month 9',
      estimatedCostUsd: 0,
      evidenceCategory: 'ai_recommendation',
      description: 'Practice structured academic interview responses.',
      requirements: ['Mock panel prep'],
      completionCriteria: 'Two mock interviews completed.',
    },
  ]);

  // Original completed station MUST remain preserved
  assert.ok(merged.stations.some((s) => s.title === 'Academic Baseline & Transcript Audit' && s.status === 'completed'));
  assert.ok(merged.stations.some((s) => s.title === 'Embassy Interview Simulation'));
});

test('Semantic voice navigation resolves Uzbek/English map, university, section, and task commands', () => {
  const unis = [
    { slug: 'university-of-tokyo', name: 'The University of Tokyo', shortName: 'UTokyo', countryCode: 'JP' },
    { slug: 'mit', name: 'Massachusetts Institute of Technology', shortName: 'MIT', countryCode: 'US' },
  ];

  const uzMap = resolveSemanticVoiceCommand("O'zbekistonni xaritada ko'rsat", unis, 'dashboard');
  assert.equal(uzMap.matched, true);
  assert.equal(uzMap.actions[0].type, 'navigateToSection');
  assert.equal(uzMap.actions[1].type, 'locateCountry');
  if (uzMap.actions[1].type === 'locateCountry') {
    assert.equal(uzMap.actions[1].countryCode, 'UZ');
  }

  const uniLocate = resolveSemanticVoiceCommand('Show UTokyo on the globe', unis, 'dashboard');
  assert.equal(uniLocate.matched, true);
  assert.ok(uniLocate.actions.some((a) => a.type === 'locateUniversity' && a.universitySlug === 'university-of-tokyo'));

  const addTask = resolveSemanticVoiceCommand('Create task: Register for IELTS Academic', unis, 'dashboard');
  assert.equal(addTask.matched, true);
  assert.ok(addTask.actions.some((a) => a.type === 'createTask'));

  const navHabits = resolveSemanticVoiceCommand('Open Habits Tracker', unis, 'dashboard');
  assert.equal(navHabits.matched, true);
  assert.ok(navHabits.actions.some((a) => a.type === 'navigateToSection' && a.section === 'paper-journal'));
});
