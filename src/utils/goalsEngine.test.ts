import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CERTIFICATES_CATALOG,
  analyzeDeadlineRisks,
  buildOpportunityMatrix,
  computeClusterWeightedProgress,
  computeDailyPriorityAction,
  computeDynamicGoalStatus,
  computeGoalProgress,
  computeGoalsAnalytics,
  computeRemainingDays,
  countActiveGoals,
  detectDeadlineConflicts,
  filterAndSortCertificates,
  hasDuplicateCertificateGoal,
  simulateCountryOpportunity,
  type GoalGroup,
  type GoalRecord,
} from './goalsEngine';

function makeGoal(overrides: Partial<GoalRecord> = {}): GoalRecord {
  return {
    id: 'g-1',
    title: 'Sample Goal',
    category: 'language_certificates',
    goalType: 'score',
    startDate: '2026-11-01',
    targetDate: '2027-03-01',
    baselineNumeric: 5.5,
    currentNumeric: 6.5,
    targetNumeric: 7.5,
    milestones: [],
    priority: 'high',
    lifecycleOverride: 'active',
    motivation: 'Graduate admission',
    linkedLibraryMaterialIds: [],
    dependsOnGoalIds: [],
    evidence: [],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

test('certificate catalog has unique IDs, official sources, and valid scoring formats', () => {
  const ids = new Set<string>();
  assert.ok(CERTIFICATES_CATALOG.length >= 35, 'Should include rich verified catalog across all 5 categories');
  const categories = new Set(CERTIFICATES_CATALOG.map((c) => c.category));
  assert.equal(categories.size, 5, 'All 5 primary categories must be represented');

  for (const cert of CERTIFICATES_CATALOG) {
    assert.ok(!ids.has(cert.id), `Duplicate cert id: ${cert.id}`);
    ids.add(cert.id);
    assert.ok(cert.officialName.trim().length > 0);
    assert.ok(cert.officialWebsite.startsWith('http'), `Missing official website on ${cert.id}`);
    assert.ok(cert.lastVerifiedAt.length >= 8);
    assert.ok(cert.informationSource.trim().length > 0);
  }
});

test('non-linear JLPT level progress does not assume equal spacing between N5..N1', () => {
  const jlptGoal = makeGoal({
    goalType: 'level',
    certificateId: 'jlpt',
    levelScale: ['None', 'N5', 'N4', 'N3', 'N2', 'N1'],
    currentLevel: 'N4',
    targetLevel: 'N2',
  });
  const res = computeGoalProgress(jlptGoal);
  // N4 effort weight = 22, N2 effort weight = 68 -> ~32%, NOT linear 2/4 = 50%
  assert.equal(res.percent, 32);
  assert.match(res.basisLabel, /non-linear/i);
});

test('all 5 goal types compute accurate progress and handle missing scores gracefully', () => {
  // Score-based
  const scoreGoal = makeGoal({ baselineNumeric: 5.5, currentNumeric: 6.5, targetNumeric: 7.5 });
  assert.equal(computeGoalProgress(scoreGoal).percent, 50);

  // Missing current score returns null (never invents progress)
  const missingScore = makeGoal({ currentNumeric: null, targetNumeric: 7.5 });
  assert.equal(computeGoalProgress(missingScore).percent, null);

  // Quantitative
  const quantGoal = makeGoal({
    goalType: 'quantitative',
    currentNumeric: 6,
    targetNumeric: 20,
    numericUnit: 'projects',
  });
  assert.equal(computeGoalProgress(quantGoal).percent, 30);

  // Binary
  assert.equal(computeGoalProgress(makeGoal({ goalType: 'binary', binaryState: 'not_started' })).percent, 0);
  assert.equal(computeGoalProgress(makeGoal({ goalType: 'binary', binaryState: 'in_progress' })).percent, 50);
  assert.equal(computeGoalProgress(makeGoal({ goalType: 'binary', binaryState: 'achieved' })).percent, 100);

  // Milestone-based
  const msGoal = makeGoal({
    goalType: 'milestone',
    milestones: [
      { id: 'm1', title: 'Research eligibility', completed: true },
      { id: 'm2', title: 'Language cert', completed: true },
      { id: 'm3', title: 'Academic docs', completed: false },
      { id: 'm4', title: 'Apply', completed: false },
    ],
  });
  assert.equal(computeGoalProgress(msGoal).percent, 50);
});

test('achieved goals NEVER become overdue even after target date passes', () => {
  const achievedPastDeadline = makeGoal({
    targetDate: '2025-01-01',
    lifecycleOverride: 'achieved',
    achievedAt: '2025-02-10T10:00:00Z',
  });
  assert.equal(computeDynamicGoalStatus(achievedPastDeadline, '2026-11-20'), 'achieved');

  const activePastDeadline = makeGoal({
    targetDate: '2026-11-10',
    lifecycleOverride: 'active',
  });
  assert.equal(computeDynamicGoalStatus(activePastDeadline, '2026-11-20'), 'overdue');

  const noTargetDate = makeGoal({
    targetDate: null,
    lifecycleOverride: 'active',
  });
  assert.equal(computeRemainingDays(noTargetDate.targetDate, '2026-11-20'), null);
  assert.equal(computeDynamicGoalStatus(noTargetDate, '2026-11-20'), 'in_progress');
});

test('completed and archived goals do NOT consume Free active goal quota', () => {
  const goals = [
    makeGoal({ id: 'a1', lifecycleOverride: 'active' }),
    makeGoal({ id: 'a2', lifecycleOverride: 'paused' }),
    makeGoal({ id: 'a3', lifecycleOverride: 'achieved' }),
    makeGoal({ id: 'a4', lifecycleOverride: 'archived' }),
  ];
  assert.equal(countActiveGoals(goals), 2);
});

test('duplicate certificate prevention detects existing active/achieved certificate goals but ignores archived', () => {
  const goals = [
    makeGoal({ id: 'g1', certificateId: 'ielts-academic', lifecycleOverride: 'active' }),
    makeGoal({ id: 'g2', certificateId: 'toefl-ibt', lifecycleOverride: 'archived' }),
  ];
  assert.equal(hasDuplicateCertificateGoal(goals, 'ielts-academic'), true);
  assert.equal(hasDuplicateCertificateGoal(goals, 'toefl-ibt'), false);
  assert.equal(hasDuplicateCertificateGoal(goals, 'jlpt'), false);
});

test('Goal Cluster weighted progress respects custom weights instead of naive unweighted average', () => {
  const g1 = makeGoal({ id: 'g1', baselineNumeric: 0, currentNumeric: 100, targetNumeric: 100 }); // 100%
  const g2 = makeGoal({ id: 'g2', baselineNumeric: 0, currentNumeric: 0, targetNumeric: 100 }); // 0%
  const group: GoalGroup = {
    id: 'grp-1',
    title: 'Japan Admission Strategy',
    description: 'Weighted cluster',
    priority: 'high',
    members: [
      { goalId: 'g1', weight: 80 },
      { goalId: 'g2', weight: 20 },
    ],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };
  const result = computeClusterWeightedProgress(group, [g1, g2]);
  assert.equal(result.percent, 80, 'Should equal weighted 80%, not unweighted 50%');
  assert.equal(result.usesCustomWeights, true);
});

test('conflicting deadline detection and deadline risk analysis surface actionable warnings', () => {
  const g1 = makeGoal({ id: 'g1', title: 'IELTS', targetDate: '2026-12-05', currentNumeric: 6.0, baselineNumeric: 5.5, targetNumeric: 7.5 });
  const g2 = makeGoal({ id: 'g2', title: 'SAT', targetDate: '2026-12-08', currentNumeric: 1200, baselineNumeric: 1000, targetNumeric: 1500 });
  const conflicts = detectDeadlineConflicts([g1, g2], 7);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].daysApart, 3);

  const risks = analyzeDeadlineRisks([g1, g2], '2026-11-20');
  assert.ok(risks.length >= 1);
});

test('Country Simulator distinguishes Japanese-taught vs English-taught tracks and handles unknown countries safely', () => {
  const jpSim = simulateCountryOpportunity('JP', [
    { id: 's1', certificateId: 'jlpt', status: 'planned', currentScoreOrLevel: 'N4', targetScoreOrLevel: 'N2' },
    { id: 's2', certificateId: 'ielts-academic', status: 'obtained', currentScoreOrLevel: '6.5', targetScoreOrLevel: '7.5' },
  ]);
  assert.equal(jpSim.hasVerifiedProfile, true);
  assert.ok(jpSim.universityInsights.some((u) => u.instructionLanguage === 'English'));
  assert.ok(jpSim.universityInsights.some((u) => u.instructionLanguage === 'Local'));
  assert.ok(jpSim.careerInsights.length >= 2);
  assert.ok(jpSim.scholarshipVisaInsights.some((s) => /MEXT/i.test(s.programName)));
  assert.match(jpSim.disclaimer, /not an official/i);

  const unknownSim = simulateCountryOpportunity('ZZ', [
    { id: 's1', certificateId: 'ielts-academic', status: 'obtained', currentScoreOrLevel: '7.0', targetScoreOrLevel: '7.5' },
  ]);
  assert.equal(unknownSim.hasVerifiedProfile, false);
  assert.match(unknownSim.selectedDetails[0].countryRelevanceNote, /tasdiqlanmagan/i);

  const matrix = buildOpportunityMatrix(['ielts-academic', 'jlpt'], ['JP', 'DE', 'KR', 'US']);
  assert.equal(matrix.length, 2);
  assert.equal(matrix[0].cells.length, 4);
});

test('analytics, daily priority action, and certificate filtering work deterministically', () => {
  const g1 = makeGoal({ id: 'g1', title: 'IELTS 7.5', certificateId: 'ielts-academic', targetDate: '2026-12-01', priority: 'critical' });
  const g2 = makeGoal({ id: 'g2', title: 'Portfolio', goalType: 'binary', binaryState: 'achieved', lifecycleOverride: 'achieved', achievedAt: '2026-11-15T00:00:00Z' });
  const analytics = computeGoalsAnalytics([g1, g2], '2026-11-20');
  assert.equal(analytics.activeGoals, 1);
  assert.equal(analytics.achievedGoals, 1);
  assert.equal(analytics.nearestDeadline?.remainingDays, 11);

  const daily = computeDailyPriorityAction([g1, g2], '2026-11-20');
  assert.equal(daily.goalId, 'g1');

  const filtered = filterAndSortCertificates(CERTIFICATES_CATALOG, {
    search: 'jlpt',
    category: 'languages',
    languageOrSubcategory: 'all',
    countryCode: 'JP',
    scoreFormat: 'all',
    onlyFavorites: false,
    favoriteIds: [],
    sortBy: 'popularity',
  });
  assert.ok(filtered.some((c) => c.id === 'jlpt'));
});
