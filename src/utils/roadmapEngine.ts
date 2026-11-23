export type RoadmapRouteMode = 'direct' | 'transfer' | 'scholarship';

export type StationStatus = 'completed' | 'in_progress' | 'upcoming' | 'locked';

export type EvidenceCategory =
  | 'verified'
  | 'user_provided'
  | 'ai_recommendation'
  | 'estimated'
  | 'requires_verification';

export type PlanetArchetype =
  | 'terrestrial_rocky'
  | 'atmospheric_super_earth'
  | 'oceanic_biosphere'
  | 'volcanic_forge'
  | 'ice_crystalline'
  | 'ringed_gas_giant'
  | 'amber_citadel'
  | 'emerald_horizon'
  | 'sapphire_crown';

export type VerificationMasteryLevel =
  | 'pending'
  | 'task_completed'
  | 'knowledge_assessed'
  | 'milestone_verified';

export type DependencyClassification =
  | 'required_prerequisite'
  | 'recommended_prep'
  | 'parallel_activity'
  | 'optional_enhancement';

export interface CosmicTaskStar {
  id: string;
  stationId: string;
  order: number;
  title: string;
  detailedInstructions: string;
  whyItMatters: string;
  expectedResult: string;
  completionCriteria: string;
  estimatedHours: number;
  deadlineWindow: string;
  dependencyType: DependencyClassification;
  prerequisiteStarIds: string[];
  resources: Array<{ title: string; type: string; url?: string }>;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  verificationLevel: VerificationMasteryLevel;
  evidenceNote?: string;
  /** Local orbital coordinates around parent planet */
  orbitRadius: number;
  orbitAngle: number;
  orbitInclination: number;
  orbitSpeed: number;
}

export interface RoadmapStation {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  phase: 'Foundation' | 'Exams & Docs' | 'Application' | 'Funding & Visa' | 'Arrival';
  status: StationStatus;
  weight: number; // Weighted contribution to overall progress
  timeframe: string; // e.g., "Months 1–2"
  estimatedCostUsd: number;
  evidenceCategory: EvidenceCategory;
  description: string;
  requirements: string[];
  completionCriteria: string;
  officialCheckNote?: string;
  isCustom?: boolean;
  /** Cartographic coordinates on normalized 1000 x 440 map canvas */
  x: number;
  y: number;
  /** Optional 3D Cosmic Academic GPS extensions (backward-compatible) */
  planetArchetype?: PlanetArchetype;
  orbitalRadius?: number;
  orbitalAngle?: number;
  orbitalElevation?: number;
  orbitalSpeed?: number;
  planetScale?: number;
  hasRings?: boolean;
  whyItMatters?: string;
  expectedOutcome?: string;
  plannedStartDate?: string;
  targetCompletionDate?: string;
  prerequisiteStationIds?: string[];
  parallelStationIds?: string[];
  verificationMastery?: VerificationMasteryLevel;
  verificationEvidenceNote?: string;
  taskStars?: CosmicTaskStar[];
}

export interface RoadmapRoute {
  mode: RoadmapRouteMode;
  name: string;
  tagline: string;
  accentHex: string;
  estimatedDurationMonths: number;
  estimatedTotalCostUsd: number;
  riskLevel: 'Low' | 'Moderate' | 'Competitive';
  stations: RoadmapStation[];
}

export interface RoadmapWorkspaceState {
  originCountry: string;
  originEducationLevel: string;
  targetCountry: string;
  targetUniversitySlug: string;
  targetUniversityName: string;
  targetDegree: string;
  targetDiscipline: string;
  activeMode: RoadmapRouteMode;
  routes: Record<RoadmapRouteMode, RoadmapRoute>;
  lastGeneratedAt: string | null;
  aiSummaryNote: string;
  /** Optional user scheduling preferences for Cosmic Academic GPS */
  weeklyStudyHours?: number;
  targetDeadlineMonths?: number;
  currentSkillLevel?: 'Foundation' | 'Intermediate' | 'Advanced';
}

export interface RouteMetrics {
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  remainingMonths: number;
  remainingCostUsd: number;
  currentStation: RoadmapStation | null;
  nextStation: RoadmapStation | null;
}

export interface CosmicRouteConnection {
  id: string;
  fromStationId: string;
  toStationId: string; // or 'SUN_DESTINATION'
  type: 'primary_sequence' | 'prerequisite_gate' | 'parallel_branch' | 'solar_ascent';
  state: 'completed' | 'active' | 'upcoming' | 'parallel_optional';
}

export interface ScheduleFeasibilityAnalysis {
  totalEstimatedHours: number;
  completedHours: number;
  remainingHours: number;
  weeklyStudyHours: number;
  targetDeadlineMonths: number;
  requiredWeeklyHoursForTarget: number;
  realisticDurationMonths: number;
  isFeasible: boolean;
  feasibilityStatus: 'optimal' | 'tight' | 'unrealistic';
  explanation: string;
  recommendedAlternative: string;
}

export interface AdaptiveScheduleProposal {
  paceMode: 'ahead_of_schedule' | 'on_track' | 'recovery_needed';
  summaryTitle: string;
  summaryReason: string;
  proposedDurationMonths: number;
  proposedWeeklyHours: number;
  prioritizedStationId: string | null;
  adjustments: Array<{
    stationId: string;
    stationTitle: string;
    previousTimeframe: string;
    proposedTimeframe: string;
    preservedStatus: StationStatus;
  }>;
}

export interface CosmicSolarSystemModel {
  sunDestination: {
    title: string;
    subtitle: string;
    degreeAndDiscipline: string;
    originToTargetLabel: string;
    routeBadge: string;
    overallProgressPercent: number;
    isGoalAchieved: boolean;
    verifiedMilestonesCount: number;
    totalMilestonesCount: number;
    completedStarsCount: number;
    totalStarsCount: number;
  };
  planets: Array<
    RoadmapStation & {
      planetArchetype: PlanetArchetype;
      orbitalRadius: number;
      orbitalAngle: number;
      orbitalElevation: number;
      orbitalSpeed: number;
      planetScale: number;
      hasRings: boolean;
      whyItMatters: string;
      expectedOutcome: string;
      plannedStartDate: string;
      targetCompletionDate: string;
      prerequisiteStationIds: string[];
      parallelStationIds: string[];
      verificationMastery: VerificationMasteryLevel;
      taskStars: CosmicTaskStar[];
      planetProgressPercent: number;
      isPrerequisiteMet: boolean;
    }
  >;
  connections: CosmicRouteConnection[];
  feasibility: ScheduleFeasibilityAnalysis;
  adaptiveProposal: AdaptiveScheduleProposal;
}

export const EVIDENCE_LABELS: Record<
  EvidenceCategory,
  { label: string; shortNote: string }
> = {
  verified: {
    label: 'Verified Catalog Data',
    shortNote: 'Grounded in the platform institutional catalog.',
  },
  user_provided: {
    label: 'User Profile Input',
    shortNote: 'Derived from your saved profile or manual entry.',
  },
  ai_recommendation: {
    label: 'AI Strategy Guidance',
    shortNote: 'Generated recommendation — adapt to your timeline.',
  },
  estimated: {
    label: 'Estimated Benchmark',
    shortNote: 'Indicative cost/timeframe estimate; verify exact fees.',
  },
  requires_verification: {
    label: 'Requires Official Verification',
    shortNote: 'Confirm current intake dates and rules on the university portal.',
  },
};

const PLANET_ARCHETYPE_SEQUENCE: PlanetArchetype[] = [
  'emerald_horizon',
  'sapphire_crown',
  'oceanic_biosphere',
  'ringed_gas_giant',
  'ice_crystalline',
  'ringed_gas_giant',
  'volcanic_forge',
  'amber_citadel',
  'atmospheric_super_earth',
];

/**
 * Computes smooth deterministic cartographic coordinates along a curved metro/route arc.
 */
export function layoutStationsOnArc(
  count: number,
  mode: RoadmapRouteMode
): Array<{ x: number; y: number }> {
  const startX = 85;
  const endX = 915;
  const baseY = mode === 'direct' ? 140 : mode === 'transfer' ? 235 : 330;
  const arcAmplitude = mode === 'direct' ? -42 : mode === 'transfer' ? 24 : 38;

  if (count <= 1) {
    return [{ x: 500, y: baseY }];
  }

  return Array.from({ length: count }, (_, idx) => {
    const t = idx / (count - 1);
    const x = Math.round(startX + (endX - startX) * t);
    const y = Math.round(baseY + Math.sin(t * Math.PI) * arcAmplitude);
    return { x, y };
  });
}

/**
 * Generates an SVG smooth cubic Bezier path connecting ordered stations.
 */
export function computeCurvedPathD(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = Math.round((p0.x + p1.x) / 2);
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * Generates specific, measurable, actionable Task Stars for a milestone station
 * tailored to the user's target university, degree, discipline, and station phase.
 */
export function synthesizeActionableTaskStars(
  station: RoadmapStation,
  context: {
    originCountry: string;
    targetCountry: string;
    targetUniversityName: string;
    targetDegree: string;
    targetDiscipline: string;
  }
): CosmicTaskStar[] {
  if (Array.isArray(station.taskStars) && station.taskStars.length > 0) {
    return station.taskStars;
  }

  const titleLower = `${station.title} ${station.subtitle}`.toLowerCase();
  const baseId = station.id;
  const isStationDone = station.status === 'completed';
  const isStationCurrent = station.status === 'in_progress';

  type StarTemplate = {
    title: string;
    detailedInstructions: string;
    whyItMatters: string;
    expectedResult: string;
    completionCriteria: string;
    estimatedHours: number;
    deadlineWindow: string;
    dependencyType: DependencyClassification;
    resources: Array<{ title: string; type: string; url?: string }>;
  };

  let templates: StarTemplate[] = [];

  if (
    titleLower.includes('baseline') ||
    titleLower.includes('transcript') ||
    titleLower.includes('credit') ||
    titleLower.includes('eligibility') ||
    station.order === 1
  ) {
    templates = [
      {
        title: 'Official Transcript & Grading Scale Audit',
        detailedInstructions: `Request official sealed transcripts from your current institution in ${context.originCountry}, calculate cumulative GPA on a 4.0 and 100-point scale, and compare against ${context.targetUniversityName} ${context.targetDegree} minimum cutoffs.`,
        whyItMatters: `Admissions committees at ${context.targetUniversityName} screen quantitative GPA equivalence in the first filtration round before reviewing essays.`,
        expectedResult: 'Verified GPA conversion worksheet + digital scan of official academic record.',
        completionCriteria: 'Cumulative GPA verified and mapped to destination country grading scale.',
        estimatedHours: 8,
        deadlineWindow: 'Weeks 1–2',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetUniversityName} Admissions Guidelines`, type: 'Official Portal' },
          { title: 'International GPA Equivalence Calculator', type: 'Diagnostic Tool' },
        ],
      },
      {
        title: `Prerequisite Syllabus Mapping for ${context.targetDiscipline}`,
        detailedInstructions: `Audit completed mathematics, science, and foundational ${context.targetDiscipline} course hours against the target faculty's mandatory subject prerequisites.`,
        whyItMatters: 'Missing core subject credit hours can disqualify an application even with a high overall GPA.',
        expectedResult: 'Course-by-course prerequisite coverage matrix identifying any syllabus gaps.',
        completionCriteria: '100% of required prerequisite subjects accounted for or scheduled for bridge study.',
        estimatedHours: 12,
        deadlineWindow: 'Weeks 2–3',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetDiscipline} Faculty Curriculum Matrix`, type: 'Academic Syllabus' },
        ],
      },
      {
        title: 'Admission Cycle & Scholarship Deadline Master Calendar',
        detailedInstructions: `Record exact application opening dates, document courier cutoffs, entrance exam windows, and scholarship deadlines for ${context.targetUniversityName} (${context.targetCountry}).`,
        whyItMatters: 'International admissions and full scholarships enforce strict non-negotiable submission timestamps.',
        expectedResult: 'Chronological timeline with 14-day safety buffers before every official cutoff.',
        completionCriteria: 'All primary and backup intake deadlines logged and verified.',
        estimatedHours: 6,
        deadlineWindow: 'Week 3',
        dependencyType: 'parallel_activity',
        resources: [
          { title: `${context.targetCountry} International Admissions Calendar`, type: 'Official Schedule' },
        ],
      },
      {
        title: 'Diagnostic Baseline Assessment & Study Capacity Plan',
        detailedInstructions: 'Complete a timed diagnostic test in academic English and core quantitative subjects to establish your starting score and weekly study hour allocation.',
        whyItMatters: 'Objective baseline scores prevent underestimating preparation time for standardized exams.',
        expectedResult: 'Baseline diagnostic report with section-by-section gap analysis.',
        completionCriteria: 'Diagnostic completed and weekly study schedule locked.',
        estimatedHours: 10,
        deadlineWindow: 'Week 4',
        dependencyType: 'recommended_prep',
        resources: [
          { title: 'Academic Readiness Diagnostic Suite', type: 'Assessment' },
        ],
      },
    ];
  } else if (titleLower.includes('language') || titleLower.includes('ielts') || titleLower.includes('jlpt')) {
    templates = [
      {
        title: 'Academic Reading & Listening Comprehension Drills',
        detailedInstructions: 'Complete 12 timed academic reading passages and 12 university lecture listening sets, logging every error by question type and building an active academic collocation deck.',
        whyItMatters: 'Reading and listening sub-bands provide the fastest, most reliable score boost toward an overall 7.0–7.5+ profile.',
        expectedResult: 'Consistent 85%+ accuracy on timed reading and listening sections.',
        completionCriteria: 'Achieve target sub-band threshold across 3 consecutive timed section tests.',
        estimatedHours: 36,
        deadlineWindow: 'Month 2',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Cambridge Academic Reading & Listening Corpus', type: 'Practice Bank' },
        ],
      },
      {
        title: 'Analytical Academic Writing Task 1 & Task 2 Mastery',
        detailedInstructions: `Write 15 timed academic essays and data synthesis reports, critique them against official rubric descriptors (Task Achievement, Coherence, Lexical Resource, Grammatical Range), and revise weak paragraphs.`,
        whyItMatters: `Strong academic writing directly transfers to your ${context.targetUniversityName} Statement of Purpose and research essays.`,
        expectedResult: 'Portfolio of 15 scored and revised essays meeting C1 academic standards.',
        completionCriteria: 'Minimum 7.0 equivalent writing rubric score on 3 evaluated essays.',
        estimatedHours: 32,
        deadlineWindow: 'Month 3',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Official Academic Writing Band Descriptors', type: 'Rubric Guide' },
        ],
      },
      {
        title: 'Structured Academic Speaking & Technical Vocabulary Simulation',
        detailedInstructions: 'Conduct 10 recorded 15-minute speaking simulations covering abstract academic topics, research interests, and spontaneous follow-up questioning.',
        whyItMatters: 'Fluency and lexical precision under pressure are evaluated in both language exams and university admission interviews.',
        expectedResult: '10 recorded speaking sessions with self-audit on pacing, pronunciation, and connectors.',
        completionCriteria: 'Zero long hesitations and clear structured arguments in mock evaluation.',
        estimatedHours: 24,
        deadlineWindow: 'Months 3–4',
        dependencyType: 'parallel_activity',
        resources: [
          { title: 'Academic Speaking Simulation Prompts', type: 'Audio Lab' },
        ],
      },
      {
        title: 'Full-Length Timed Mock Examinations & Official Test Registration',
        detailedInstructions: `Register for an official test date at an authorized test center and complete 5 full-length 3-hour proctored mock examinations under strict exam conditions.`,
        whyItMatters: 'Stamina and time management across all 4 sections determine whether practice scores hold on exam day.',
        expectedResult: 'Official test registration confirmation + 5 full mock score reports.',
        completionCriteria: 'Official score report meeting or exceeding target faculty requirement dispatched.',
        estimatedHours: 28,
        deadlineWindow: 'Month 5',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Official IELTS / TOEFL / JLPT Registration Portal', type: 'Exam Booking', url: 'https://www.ielts.org' },
        ],
      },
    ];
  } else if (
    titleLower.includes('math') ||
    titleLower.includes('aptitude') ||
    titleLower.includes('standardized') ||
    titleLower.includes('sat') ||
    titleLower.includes('eju')
  ) {
    templates = [
      {
        title: `Core Quantitative & ${context.targetDiscipline} Foundations`,
        detailedInstructions: `Master calculus, linear algebra, probability, and core ${context.targetDiscipline} problem sets required by ${context.targetUniversityName}'s entrance syllabus.`,
        whyItMatters: 'Top global universities test deep conceptual problem-solving rather than formula memorization.',
        expectedResult: 'Completed 250+ structured quantitative and subject problem sets with worked proofs.',
        completionCriteria: '85%+ accuracy on untimed advanced problem sets.',
        estimatedHours: 45,
        deadlineWindow: 'Month 4',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetDiscipline} Entrance Exam Syllabus`, type: 'Technical Guide' },
        ],
      },
      {
        title: 'Past Entrance Paper & Standardized Test Sprint',
        detailedInstructions: 'Solve 8 years of past university entrance papers or official SAT/EJU/GRE subject tests under strict time limits, categorizing every mistake into an error log.',
        whyItMatters: 'Past papers reveal recurring theorem patterns and pacing traps specific to the exam board.',
        expectedResult: 'Error analysis log + upward score trajectory across 8 full past papers.',
        completionCriteria: 'Score within the top 15th percentile of admitted international applicants.',
        estimatedHours: 40,
        deadlineWindow: 'Months 5–6',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Official Past Examination Archive', type: 'Exam Archive' },
        ],
      },
      {
        title: 'Official Standardized Score Verification & Dispatch',
        detailedInstructions: 'Sit for the official standardized exam and configure direct electronic score reporting to your shortlisted institutions.',
        whyItMatters: 'Universities only accept verified score reports sent directly by the testing agency.',
        expectedResult: 'Official score certificate and institutional delivery receipt.',
        completionCriteria: 'Official test score verified in target university applicant portal.',
        estimatedHours: 14,
        deadlineWindow: 'Month 6',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Official Testing Agency Score Portal', type: 'Verification' },
        ],
      },
    ];
  } else if (
    titleLower.includes('portfolio') ||
    titleLower.includes('research') ||
    titleLower.includes('proposal') ||
    titleLower.includes('dossier') ||
    titleLower.includes('credential')
  ) {
    templates = [
      {
        title: `Domain Project / Research Portfolio in ${context.targetDiscipline}`,
        detailedInstructions: `Complete and document 2 substantive projects, research papers, or technical case studies demonstrating applied competence in ${context.targetDiscipline}.`,
        whyItMatters: 'Concrete evidence of independent intellectual output distinguishes top scholarship and admission winners.',
        expectedResult: 'Published repository, technical report, or research abstract ready for faculty review.',
        completionCriteria: '2 documented projects with clear methodology, results, and verify links.',
        estimatedHours: 42,
        deadlineWindow: 'Months 5–7',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Academic Research & Portfolio Exemplars', type: 'Research Library' },
        ],
      },
      {
        title: 'Statement of Purpose & Study Plan Architecture',
        detailedInstructions: `Draft a 1,000-word Statement of Purpose and Research/Study Plan connecting your academic background in ${context.originCountry} to specific laboratories and professors at ${context.targetUniversityName}.`,
        whyItMatters: 'Generic motivation letters are rejected; committees look for precise alignment with faculty research.',
        expectedResult: '3 iteratively refined drafts reviewed for clarity, specificity, and academic tone.',
        completionCriteria: 'Final Statement of Purpose and Research Plan signed off after 3 revision cycles.',
        estimatedHours: 28,
        deadlineWindow: 'Month 7',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetUniversityName} Faculty & Lab Directory`, type: 'University Catalog' },
        ],
      },
      {
        title: 'Academic Recommendation Letters & Certified Translations',
        detailedInstructions: 'Brief 2–3 academic professors with your CV, transcript, and target program summary at least 6 weeks before the deadline, and obtain notarized translations of all official diplomas.',
        whyItMatters: 'Detailed, evidence-backed recommendation letters validate your analytical potential and character.',
        expectedResult: 'Sealed/uploaded faculty recommendation letters + apostilled/notarized transcript bundle.',
        completionCriteria: 'All recommenders registered and notarized PDFs verified.',
        estimatedHours: 16,
        deadlineWindow: 'Month 8',
        dependencyType: 'parallel_activity',
        resources: [
          { title: 'Faculty Recommendation Briefing Template', type: 'Document Kit' },
        ],
      },
    ];
  } else if (
    titleLower.includes('application') ||
    titleLower.includes('portal') ||
    titleLower.includes('embassy') ||
    titleLower.includes('screening')
  ) {
    templates = [
      {
        title: `${context.targetUniversityName} Online Portal Dossier Assembly`,
        detailedInstructions: 'Create your official applicant account, complete all biographical and academic history sections, and upload high-resolution PDFs of transcripts, test scores, and essays.',
        whyItMatters: 'Formatting errors or missing document pages cause automatic administrative rejection.',
        expectedResult: 'Complete, validated application dossier in the official portal.',
        completionCriteria: 'Every mandatory portal checklist item shows green/uploaded status.',
        estimatedHours: 16,
        deadlineWindow: 'Month 8',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetUniversityName} Admissions Portal`, type: 'Official Portal' },
        ],
      },
      {
        title: 'Pre-Submission Audit & Application Fee Remittance',
        detailedInstructions: 'Cross-check all entered grades, passport numbers, and essay uploads against original documents, pay the application fee, and submit at least 7 days prior to the deadline.',
        whyItMatters: 'Early submission avoids portal server congestion and allows time to fix document verification queries.',
        expectedResult: 'Official submission receipt and applicant reference number.',
        completionCriteria: 'Official confirmation email and payment receipt archived.',
        estimatedHours: 8,
        deadlineWindow: 'Month 9',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Final Application Verification Checklist', type: 'Audit Tool' },
        ],
      },
      {
        title: 'Parallel Backup & Scholarship Application Filing',
        detailedInstructions: `Submit 2 calibrated target/safety university applications and associated merit scholarship forms in ${context.targetCountry}.`,
        whyItMatters: 'A balanced application portfolio protects your timeline against single-institution selectivity risk.',
        expectedResult: '2 additional verified application confirmations.',
        completionCriteria: 'Primary and backup applications officially lodged.',
        estimatedHours: 18,
        deadlineWindow: 'Month 9',
        dependencyType: 'recommended_prep',
        resources: [
          { title: 'Global Scholarship & University Comparison Matrix', type: 'Platform Tool' },
        ],
      },
    ];
  } else if (titleLower.includes('interview') || titleLower.includes('exam') || titleLower.includes('selection')) {
    templates = [
      {
        title: 'Technical & Academic Oral Defense Preparation',
        detailedInstructions: `Prepare concise 2-minute and 5-minute responses covering your research proposal, core ${context.targetDiscipline} concepts, and motivation for studying in ${context.targetCountry}.`,
        whyItMatters: 'Admission and scholarship panels test whether you genuinely authored your study plan and can think on your feet.',
        expectedResult: 'Structured Q&A briefing doc covering 25 high-probability technical and motivational questions.',
        completionCriteria: 'All 25 core interview prompts rehearsed with clear, evidence-backed answers.',
        estimatedHours: 20,
        deadlineWindow: 'Month 10',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Academic Panel Interview Question Bank', type: 'Prep Guide' },
        ],
      },
      {
        title: 'Full Dress-Rehearsal Mock Panel Interviews',
        detailedInstructions: 'Complete 3 live recorded mock panel interviews under formal conditions, reviewing body language, technical clarity, and conciseness.',
        whyItMatters: 'Simulated pressure eliminates nervousness and sharpens delivery during the real 20-minute panel.',
        expectedResult: '3 recorded mock sessions with structured feedback.',
        completionCriteria: 'Confident, poised delivery verified across all 3 mock panels.',
        estimatedHours: 12,
        deadlineWindow: 'Month 10',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Interview Evaluation Rubric', type: 'Assessment' },
        ],
      },
      {
        title: 'Official Panel Interview & Written Screening Execution',
        detailedInstructions: 'Attend the scheduled university or embassy examination and interview session with all original identity and academic documents.',
        whyItMatters: 'This is the decisive selection gate for admission and scholarship award.',
        expectedResult: 'Completed official interview and post-session reflection log.',
        completionCriteria: 'Official interview completed and post-interview follow-up sent.',
        estimatedHours: 8,
        deadlineWindow: 'Month 11',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Official Interview Protocol', type: 'Official Notice' },
        ],
      },
    ];
  } else if (
    titleLower.includes('offer') ||
    titleLower.includes('visa') ||
    titleLower.includes('coe') ||
    titleLower.includes('funding') ||
    titleLower.includes('acceptance')
  ) {
    templates = [
      {
        title: 'Official Offer Acceptance & Enrollment Deposit',
        detailedInstructions: `Review the official admission and scholarship award terms from ${context.targetUniversityName}, sign the acceptance declaration, and remit any required enrollment deposit before the deadline.`,
        whyItMatters: 'Secures your formal seat in the incoming cohort and triggers immigration document issuance.',
        expectedResult: 'Countersigned Offer Acceptance & Official Enrollment Confirmation.',
        completionCriteria: 'Seat officially confirmed by university admissions office.',
        estimatedHours: 8,
        deadlineWindow: 'Month 11',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Offer & Financial Aid Acceptance Checklist', type: 'Guide' },
        ],
      },
      {
        title: 'Financial Guarantee & Certificate of Eligibility / Visa Dossier',
        detailedInstructions: `Assemble official bank solvency statements or scholarship award certificates, passport validity checks, and university-sponsored immigration forms (e.g. COE / I-20 / CAS / Blocked Account) for ${context.targetCountry}.`,
        whyItMatters: 'Consular officers require strict documentary proof of tuition and living cost coverage.',
        expectedResult: 'Complete, embassy-compliant student visa application packet.',
        completionCriteria: 'Immigration sponsorship certificate issued and financial proof verified.',
        estimatedHours: 16,
        deadlineWindow: 'Month 12',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetCountry} Embassy Student Visa Guidelines`, type: 'Official Consular Portal' },
        ],
      },
      {
        title: 'Consular Visa Filing & Biometrics Appointment',
        detailedInstructions: `Schedule and attend your student visa appointment at the ${context.targetCountry} Embassy/Consulate, submit biometrics, and verify visa stamp accuracy upon passport return.`,
        whyItMatters: 'A valid student entry visa is mandatory for international matriculation.',
        expectedResult: 'Issued Student Visa stamped in passport.',
        completionCriteria: 'Student visa received and entry dates verified.',
        estimatedHours: 10,
        deadlineWindow: 'Month 13',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: 'Consular Appointment Tracker', type: 'Checklist' },
        ],
      },
    ];
  } else {
    templates = [
      {
        title: 'Campus Dormitory & International Student Housing Booking',
        detailedInstructions: `Submit your housing application for ${context.targetUniversityName} international dormitories or verified student residences in ${context.targetCountry}.`,
        whyItMatters: 'Securing accommodation near campus before arrival prevents costly temporary housing and eases transition.',
        expectedResult: 'Signed student housing lease and move-in confirmation.',
        completionCriteria: 'Accommodation address and move-in date confirmed.',
        estimatedHours: 10,
        deadlineWindow: 'Month 13',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetUniversityName} International Housing Office`, type: 'Campus Service' },
        ],
      },
      {
        title: 'International Flight, Health Insurance & Arrival Logistics',
        detailedInstructions: 'Book student flight tickets aligned with campus orientation dates, arrange travel/national health insurance, and prepare initial local currency reserves.',
        whyItMatters: 'Mandatory health insurance and timely arrival are required to complete in-person matriculation.',
        expectedResult: 'Flight itinerary, insurance policy certificate, and arrival packet.',
        completionCriteria: 'Flight booked and arrival details registered with international office.',
        estimatedHours: 8,
        deadlineWindow: 'Month 14',
        dependencyType: 'parallel_activity',
        resources: [
          { title: 'Pre-Departure Logistics Planner', type: 'Financial Planner' },
        ],
      },
      {
        title: `In-Person Matriculation & First-Semester Course Registration`,
        detailedInstructions: `Complete original document verification on campus at ${context.targetUniversityName}, obtain your student ID and residence card, and register for first-semester ${context.targetDiscipline} courses.`,
        whyItMatters: 'Completes your transition from applicant to enrolled international scholar.',
        expectedResult: 'Official Student ID, residence registration, and active course schedule.',
        completionCriteria: 'Enrolled on campus and attending first-semester lectures.',
        estimatedHours: 12,
        deadlineWindow: 'Month 14',
        dependencyType: 'required_prerequisite',
        resources: [
          { title: `${context.targetUniversityName} Academic Orientation Portal`, type: 'Campus Portal' },
        ],
      },
    ];
  }

  // Ensure station requirements from custom/AI milestones are also reflected
  if (station.isCustom && station.requirements.length > 0) {
    templates = station.requirements.map((req, idx) => ({
      title: req.length > 68 ? `${req.slice(0, 65)}...` : req,
      detailedInstructions: `${req}. ${station.description}`,
      whyItMatters: `Essential step to fulfill custom milestone "${station.title}" (${station.timeframe}).`,
      expectedResult: station.completionCriteria || 'Verified completion of requirement.',
      completionCriteria: station.completionCriteria || 'Requirement completed and documented.',
      estimatedHours: 12,
      deadlineWindow: station.timeframe,
      dependencyType: idx === 0 ? 'required_prerequisite' : 'recommended_prep',
      resources: [{ title: 'User Milestone Workspace Note', type: 'Custom Resource' }],
    }));
  }

  return templates.map((tpl, idx) => {
    const starId = `${baseId}-star-${idx + 1}`;
    const prevStarId = idx > 0 ? `${baseId}-star-${idx}` : null;

    let starStatus: CosmicTaskStar['status'] = 'available';
    let verificationLevel: VerificationMasteryLevel = 'pending';

    if (isStationDone) {
      starStatus = 'completed';
      verificationLevel = 'milestone_verified';
    } else if (isStationCurrent) {
      if (idx === 0) {
        starStatus = 'completed';
        verificationLevel = 'knowledge_assessed';
      } else if (idx === 1) {
        starStatus = 'in_progress';
        verificationLevel = 'pending';
      } else {
        starStatus = tpl.dependencyType === 'parallel_activity' ? 'available' : 'locked';
        verificationLevel = 'pending';
      }
    } else {
      starStatus = idx === 0 ? 'available' : 'locked';
      verificationLevel = 'pending';
    }

    const total = templates.length;
    const angleStep = (Math.PI * 2) / Math.max(1, total);

    return {
      id: starId,
      stationId: station.id,
      order: idx + 1,
      title: tpl.title,
      detailedInstructions: tpl.detailedInstructions,
      whyItMatters: tpl.whyItMatters,
      expectedResult: tpl.expectedResult,
      completionCriteria: tpl.completionCriteria,
      estimatedHours: tpl.estimatedHours,
      deadlineWindow: tpl.deadlineWindow,
      dependencyType: tpl.dependencyType,
      prerequisiteStarIds:
        prevStarId && tpl.dependencyType === 'required_prerequisite' ? [prevStarId] : [],
      resources: tpl.resources,
      status: starStatus,
      verificationLevel,
      orbitRadius: 2.35 + idx * 0.62,
      orbitAngle: idx * angleStep + 0.45,
      orbitInclination: ((idx % 3) - 1) * 0.19,
      orbitSpeed: 0.36 - idx * 0.045,
    };
  });
}

export function createDefaultRoadmapState(params?: {
  originCountry?: string;
  originEducationLevel?: string;
  targetCountry?: string;
  targetUniversitySlug?: string;
  targetUniversityName?: string;
  targetDegree?: string;
  targetDiscipline?: string;
}): RoadmapWorkspaceState {
  const originCountry = params?.originCountry || 'Uzbekistan';
  const originEducationLevel = params?.originEducationLevel || 'High School / Bachelor Prep';
  const targetCountry = params?.targetCountry || 'Japan';
  const targetUniversitySlug = params?.targetUniversitySlug || 'university-of-tokyo';
  const targetUniversityName = params?.targetUniversityName || 'The University of Tokyo';
  const targetDegree = params?.targetDegree || 'Bachelor';
  const targetDiscipline = params?.targetDiscipline || 'Computer Science';

  const directCoords = layoutStationsOnArc(8, 'direct');
  const transferCoords = layoutStationsOnArc(7, 'transfer');
  const scholarshipCoords = layoutStationsOnArc(8, 'scholarship');

  const directRoute: RoadmapRoute = {
    mode: 'direct',
    name: 'Direct Admission Route',
    tagline: `Direct entry from ${originCountry} to ${targetUniversityName} (${targetDegree})`,
    accentHex: '#0EA5E9',
    estimatedDurationMonths: 14,
    estimatedTotalCostUsd: 1840,
    riskLevel: 'Competitive',
    stations: [
      {
        id: 'dir-1',
        order: 1,
        title: 'Academic Baseline & Transcript Audit',
        subtitle: `Origin: ${originCountry}`,
        phase: 'Foundation',
        status: 'completed',
        weight: 10,
        timeframe: 'Month 1',
        estimatedCostUsd: 50,
        evidenceCategory: 'user_provided',
        description:
          'Verify GPA equivalence, diploma recognition, and prerequisite subjects against target faculty requirements.',
        requirements: [
          'Official high school / university transcripts',
          'GPA conversion check',
          'Target major syllabus check',
        ],
        completionCriteria: 'Transcripts audited and core prerequisites confirmed.',
        planetArchetype: 'emerald_horizon',
        whyItMatters:
          'Establishes your verified quantitative eligibility and exposes any missing prerequisite credits before exam registration.',
        expectedOutcome: 'Audited GPA equivalence dossier & target curriculum match matrix.',
        ...directCoords[0],
      },
      {
        id: 'dir-2',
        order: 2,
        title: 'Language Proficiency Certification',
        subtitle: 'IELTS 7.0+ / TOEFL iBT 95+ / JLPT',
        phase: 'Exams & Docs',
        status: 'in_progress',
        weight: 16,
        timeframe: 'Months 2–4',
        estimatedCostUsd: 260,
        evidenceCategory: 'verified',
        description:
          'Achieve the official language score required for English-track or local-language instruction.',
        requirements: [
          'Register for official test date',
          'Score report valid within 24 months',
          'Direct institutional score dispatch',
        ],
        completionCriteria: 'Official score certificate meets or exceeds program cutoff.',
        officialCheckNote:
          'Confirm exact minimum sub-band scores on the target faculty admission brochure.',
        planetArchetype: 'sapphire_crown',
        hasRings: true,
        whyItMatters:
          'Language proficiency is a strict gatekeeper for international degree programs and merit scholarships.',
        expectedOutcome: 'Verified IELTS 7.0+ / TOEFL iBT 95+ / JLPT certificate dispatched.',
        ...directCoords[1],
      },
      {
        id: 'dir-3',
        order: 3,
        title: 'Quantitative & Science Foundation Mastery',
        subtitle: `Core ${targetDiscipline} Prerequisites`,
        phase: 'Foundation',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 3–5',
        estimatedCostUsd: 90,
        evidenceCategory: 'verified',
        description:
          'Strengthen advanced mathematics, analytical reasoning, and domain foundations tested in competitive admissions.',
        requirements: [
          'Calculus & linear algebra mastery',
          `Core ${targetDiscipline} problem sets`,
          'Timed analytical drills',
        ],
        completionCriteria: '85%+ score across core quantitative and subject benchmark assessments.',
        planetArchetype: 'oceanic_biosphere',
        whyItMatters:
          'Builds the mathematical and analytical rigor needed for both standardized tests and technical interviews.',
        expectedOutcome: 'Mastery of quantitative and domain prerequisite problem sets.',
        ...directCoords[2],
      },
      {
        id: 'dir-4',
        order: 4,
        title: 'Standardized Aptitude Examinations',
        subtitle: 'SAT / EJU / Subject Tests',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 5–7',
        estimatedCostUsd: 140,
        evidenceCategory: 'requires_verification',
        description:
          'Complete standardized admissions exams or subject tests required by the specific faculty.',
        requirements: [
          'SAT / ACT or EJU exam registration',
          '8 full-length timed past papers',
          'Official score dispatch to target faculty',
        ],
        completionCriteria: 'Required test scores officially reported above admitted median.',
        planetArchetype: 'ringed_gas_giant',
        hasRings: true,
        whyItMatters:
          'Provides an internationally standardized benchmark comparing your quantitative readiness against global peers.',
        expectedOutcome: 'Top-percentile standardized test score report.',
        ...directCoords[3],
      },
      {
        id: 'dir-5',
        order: 5,
        title: 'Academic Portfolio & Research Dossier',
        subtitle: 'SOP, Projects & Faculty Alignment',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 12,
        timeframe: 'Months 6–8',
        estimatedCostUsd: 100,
        evidenceCategory: 'ai_recommendation',
        description:
          'Develop an applied academic portfolio, Statement of Purpose, and secured faculty recommendation letters.',
        requirements: [
          `2 documented ${targetDiscipline} projects / papers`,
          'Tailored Statement of Purpose',
          '2–3 sealed academic recommendation letters',
        ],
        completionCriteria: 'Portfolio, essays, and recommendation letters finalized and peer-reviewed.',
        planetArchetype: 'ice_crystalline',
        whyItMatters:
          'Demonstrates original intellectual curiosity and fit with specific laboratories at the destination university.',
        expectedOutcome: 'Complete academic portfolio, SOP, and faculty endorsements.',
        ...directCoords[4],
      },
      {
        id: 'dir-6',
        order: 6,
        title: 'Direct University Application Portal',
        subtitle: `${targetUniversityName} Admissions`,
        phase: 'Application',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 8–10',
        estimatedCostUsd: 150,
        evidenceCategory: 'requires_verification',
        description:
          'Submit statement of purpose, certified translations, application fee, and formal dossier via the official portal.',
        requirements: [
          'Notarized English translations uploaded',
          'Portal application fee payment',
          'Pre-deadline verification receipt',
        ],
        completionCriteria:
          'Application submitted before official deadline with confirmation receipt.',
        planetArchetype: 'ringed_gas_giant',
        hasRings: true,
        whyItMatters:
          'Formalizes your candidacy with the university admissions committee ahead of the annual cutoff.',
        expectedOutcome: 'Verified application submission receipt & applicant ID.',
        ...directCoords[5],
      },
      {
        id: 'dir-7',
        order: 7,
        title: 'Entrance Screening & Panel Interview',
        subtitle: 'Technical & Motivational Defense',
        phase: 'Application',
        status: 'upcoming',
        weight: 10,
        timeframe: 'Months 10–11',
        estimatedCostUsd: 0,
        evidenceCategory: 'requires_verification',
        description:
          'Complete faculty-specific online or in-person technical interviews and oral defense of your study plan.',
        requirements: [
          'Technical Q&A preparation',
          '3 live mock panel simulations',
          'Official admissions interview completion',
        ],
        completionCriteria: 'Passed faculty admissions interview and received offer decision.',
        planetArchetype: 'volcanic_forge',
        whyItMatters:
          'Final evaluative gate where faculty verify your communication clarity, domain depth, and academic maturity.',
        expectedOutcome: 'Official Letter of Admission Offer.',
        ...directCoords[6],
      },
      {
        id: 'dir-8',
        order: 8,
        title: 'Offer Acceptance, COE/Visa & Matriculation',
        subtitle: `Destination: ${targetUniversityName}`,
        phase: 'Arrival',
        status: 'upcoming',
        weight: 10,
        timeframe: 'Months 12–14',
        estimatedCostUsd: 1050,
        evidenceCategory: 'estimated',
        description:
          'Complete enrollment deposit, Certificate of Eligibility / visa filing, student housing, and campus enrollment.',
        requirements: [
          'Official Offer Acceptance & deposit',
          'Student visa stamp & financial proof',
          'Dormitory booking & campus matriculation',
        ],
        completionCriteria: 'Student visa stamped, enrolled on campus, and classes commenced.',
        planetArchetype: 'amber_citadel',
        whyItMatters:
          'Completes legal immigration, housing, and on-campus registration to launch your university degree.',
        expectedOutcome: 'Enrolled international scholar at target university.',
        ...directCoords[7],
      },
    ],
  };

  const transferRoute: RoadmapRoute = {
    mode: 'transfer',
    name: 'Transfer & Foundation Bridge',
    tagline: `Structured bridge from ${originCountry} university / foundation year into ${targetCountry}`,
    accentHex: '#8B5CF6',
    estimatedDurationMonths: 18,
    estimatedTotalCostUsd: 2100,
    riskLevel: 'Moderate',
    stations: [
      {
        id: 'trf-1',
        order: 1,
        title: 'Home University Credit & Syllabus Mapping',
        subtitle: 'ECTS / Credit Audit',
        phase: 'Foundation',
        status: 'completed',
        weight: 14,
        timeframe: 'Months 1–2',
        estimatedCostUsd: 80,
        evidenceCategory: 'user_provided',
        description:
          'Collect course syllabi and credit descriptions to verify transferability or Studienkolleg/foundation equivalence.',
        requirements: [
          'Detailed English course descriptions',
          'Official GPA transcript (3.5+ recommended)',
          'Target department transfer policy',
        ],
        completionCriteria: 'Syllabi translated and credit transfer rules verified.',
        planetArchetype: 'terrestrial_rocky',
        ...transferCoords[0],
      },
      {
        id: 'trf-2',
        order: 2,
        title: 'Language & Preparatory Bridge Course',
        subtitle: 'Academic Language Track',
        phase: 'Exams & Docs',
        status: 'in_progress',
        weight: 18,
        timeframe: 'Months 3–7',
        estimatedCostUsd: 650,
        evidenceCategory: 'estimated',
        description:
          'Complete required language level (IELTS/TestDaF/JLPT) and any mandatory preparatory bridge coursework.',
        requirements: [
          'Official language exam certificate',
          'Preparatory curriculum modules',
          'Academic writing readiness',
        ],
        completionCriteria: 'Language and bridge certification completed.',
        planetArchetype: 'atmospheric_super_earth',
        ...transferCoords[1],
      },
      {
        id: 'trf-3',
        order: 3,
        title: 'Upper-Division Major Prerequisite Alignment',
        subtitle: `Core ${targetDiscipline} Credits`,
        phase: 'Foundation',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 6–9',
        estimatedCostUsd: 0,
        evidenceCategory: 'verified',
        description:
          'Complete mandatory Year 1/Year 2 quantitative and major-specific courses with A/A- grades to maximize credit transfer.',
        requirements: [
          'Maintain 3.5+ cumulative GPA',
          'Complete required lab & lecture hours',
          'Archive graded syllabi and exams',
        ],
        completionCriteria: 'All foundational major credits completed with high academic standing.',
        planetArchetype: 'oceanic_biosphere',
        ...transferCoords[2],
      },
      {
        id: 'trf-4',
        order: 4,
        title: 'Credential Evaluation & Equivalence',
        subtitle: 'Uni-Assist / WES / NACES',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 9–11',
        estimatedCostUsd: 220,
        evidenceCategory: 'requires_verification',
        description:
          'Submit official transcripts for formal international credential evaluation if required by the destination country.',
        requirements: [
          'Apostille / notarization',
          'Credential evaluation fee',
          'Equivalence report',
        ],
        completionCriteria: 'Verified credential equivalence report received.',
        planetArchetype: 'ice_crystalline',
        ...transferCoords[3],
      },
      {
        id: 'trf-5',
        order: 5,
        title: 'Transfer / Advanced Standing Application',
        subtitle: `${targetCountry} Partner Universities`,
        phase: 'Application',
        status: 'upcoming',
        weight: 16,
        timeframe: 'Months 11–13',
        estimatedCostUsd: 180,
        evidenceCategory: 'ai_recommendation',
        description:
          'Apply to 3–5 institutions accepting international transfers or foundation graduates in your discipline.',
        requirements: [
          'Transfer motivation essay',
          'Professor recommendation letters',
          'Course-by-course syllabus bundle',
        ],
        completionCriteria: 'Transfer applications submitted and credit evaluation requested.',
        planetArchetype: 'ringed_gas_giant',
        hasRings: true,
        ...transferCoords[4],
      },
      {
        id: 'trf-6',
        order: 6,
        title: 'Credit Recognition & Visa Filing',
        subtitle: 'Residence & Financial Proof',
        phase: 'Funding & Visa',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 14–16',
        estimatedCostUsd: 420,
        evidenceCategory: 'estimated',
        description:
          'Review recognized credits, secure blocked account or scholarship proof, and complete visa formalities.',
        requirements: [
          'Admission & credit notice',
          'Blocked account / financial guarantee',
          'Student visa approval',
        ],
        completionCriteria: 'Visa approved with confirmed semester placement.',
        planetArchetype: 'amber_citadel',
        ...transferCoords[5],
      },
      {
        id: 'trf-7',
        order: 7,
        title: 'Transition & Upper-Year Onboarding',
        subtitle: `${targetUniversityName} / Partner`,
        phase: 'Arrival',
        status: 'upcoming',
        weight: 10,
        timeframe: 'Months 17–18',
        estimatedCostUsd: 550,
        evidenceCategory: 'estimated',
        description:
          'Complete residence registration, academic advisor onboarding, and course enrollment.',
        requirements: [
          'Housing contract',
          'Academic advisor meeting',
          'Semester registration',
        ],
        completionCriteria: 'Successfully transitioned into target degree program.',
        planetArchetype: 'emerald_horizon',
        ...transferCoords[6],
      },
    ],
  };

  const scholarshipRoute: RoadmapRoute = {
    mode: 'scholarship',
    name: 'Scholarship-First Funded Track',
    tagline: 'Minimize out-of-pocket tuition via MEXT, DAAD, GKS, or Merit Grants',
    accentHex: '#10B981',
    estimatedDurationMonths: 16,
    estimatedTotalCostUsd: 680,
    riskLevel: 'Competitive',
    stations: [
      {
        id: 'sch-1',
        order: 1,
        title: 'Scholarship Eligibility & Competitiveness Audit',
        subtitle: 'MEXT / DAAD / GKS / Merit',
        phase: 'Foundation',
        status: 'completed',
        weight: 12,
        timeframe: 'Months 1–2',
        estimatedCostUsd: 0,
        evidenceCategory: 'verified',
        description:
          'Match citizenship, GPA, age limits, and degree track against verified government and university scholarship rules.',
        requirements: [
          'Check embassy vs university track rules',
          'Verify GPA minimums',
          'Confirm field-of-study eligibility',
        ],
        completionCriteria: 'Top 3 eligible full-funding scholarships shortlisted.',
        planetArchetype: 'terrestrial_rocky',
        ...scholarshipCoords[0],
      },
      {
        id: 'sch-2',
        order: 2,
        title: 'High-Impact Language & Research Proposal',
        subtitle: 'IELTS / Research Plan',
        phase: 'Exams & Docs',
        status: 'in_progress',
        weight: 16,
        timeframe: 'Months 2–5',
        estimatedCostUsd: 250,
        evidenceCategory: 'ai_recommendation',
        description:
          'Build a competitive language profile and clear study/research plan aligned with host country priorities.',
        requirements: [
          'Official language score above minimum',
          'Structured study/research proposal',
          'Leadership & impact evidence',
        ],
        completionCriteria: 'Research/study plan peer-reviewed and language score ready.',
        planetArchetype: 'atmospheric_super_earth',
        ...scholarshipCoords[1],
      },
      {
        id: 'sch-3',
        order: 3,
        title: 'Scholarship Written Subject Exam Prep',
        subtitle: 'Mathematics, Science & Language Papers',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 4–6',
        estimatedCostUsd: 0,
        evidenceCategory: 'verified',
        description:
          'Master past government scholarship written examination papers (Mathematics A/B, Science, and Advanced English/Japanese).',
        requirements: [
          'Solve 8 years of past scholarship exam papers',
          'Timed subject mock assessments',
          'Weak-topic remediation',
        ],
        completionCriteria: '80%+ average across timed past scholarship written exams.',
        planetArchetype: 'oceanic_biosphere',
        ...scholarshipCoords[2],
      },
      {
        id: 'sch-4',
        order: 4,
        title: 'Academic Endorsements & Certified Dossier',
        subtitle: 'Sealed Recommendations & Medical Check',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 12,
        timeframe: 'Months 6–7',
        estimatedCostUsd: 90,
        evidenceCategory: 'requires_verification',
        description:
          'Obtain sealed academic recommendation letters, official health certificate, and notarized academic transcripts.',
        requirements: [
          'Dean / professor sealed recommendation letters',
          'Official scholarship medical examination form',
          'Notarized transcripts & degree certificates',
        ],
        completionCriteria: 'Complete original + duplicate paper and digital dossier assembled.',
        planetArchetype: 'ice_crystalline',
        ...scholarshipCoords[3],
      },
      {
        id: 'sch-5',
        order: 5,
        title: 'Embassy / Primary Screening Submission',
        subtitle: 'Official Scholarship Window',
        phase: 'Application',
        status: 'upcoming',
        weight: 14,
        timeframe: 'Months 7–9',
        estimatedCostUsd: 30,
        evidenceCategory: 'requires_verification',
        description:
          'Submit certified application dossier to the embassy or central scholarship committee prior to the annual cutoff.',
        requirements: [
          'Application forms & placement preference form',
          'Research proposal & certified dossier delivery',
          'Official submission registration receipt',
        ],
        completionCriteria: 'Primary screening packet delivered before official deadline.',
        officialCheckNote:
          'Embassy deadlines in Uzbekistan vary yearly — check the official embassy announcement.',
        planetArchetype: 'ringed_gas_giant',
        hasRings: true,
        ...scholarshipCoords[4],
      },
      {
        id: 'sch-6',
        order: 6,
        title: 'Written Exam & Scholarship Panel Interview',
        subtitle: 'First Screening Selection Stage',
        phase: 'Application',
        status: 'upcoming',
        weight: 12,
        timeframe: 'Months 10–11',
        estimatedCostUsd: 60,
        evidenceCategory: 'ai_recommendation',
        description:
          'Complete subject exams and defend academic motivation, career impact, and return value in formal panel interviews.',
        requirements: [
          'Pass written subject screening exams',
          'Mock panel interview simulations',
          'First Screening Pass Certificate',
        ],
        completionCriteria: 'Passed screening exam and embassy/panel scholarship interview.',
        planetArchetype: 'volcanic_forge',
        ...scholarshipCoords[5],
      },
      {
        id: 'sch-7',
        order: 7,
        title: 'Letter of Provisional Acceptance & Final Award',
        subtitle: 'Host Faculty Confirmation',
        phase: 'Funding & Visa',
        status: 'upcoming',
        weight: 10,
        timeframe: 'Months 12–14',
        estimatedCostUsd: 100,
        evidenceCategory: 'requires_verification',
        description:
          'Secure faculty acceptance letters and receive official scholarship stipend & tuition-waiver confirmation.',
        requirements: [
          'Professor / faculty outreach & LoPA request',
          'Final scholarship award certificate',
          'Fee-waived student visa issuance',
        ],
        completionCriteria: 'Official funding confirmation and visa issued.',
        planetArchetype: 'amber_citadel',
        ...scholarshipCoords[6],
      },
      {
        id: 'sch-8',
        order: 8,
        title: 'Funded Departure & Stipend Activation',
        subtitle: `${targetCountry} Arrival`,
        phase: 'Arrival',
        status: 'upcoming',
        weight: 10,
        timeframe: 'Months 15–16',
        estimatedCostUsd: 150,
        evidenceCategory: 'estimated',
        description:
          'Arrive via scholarship flight allowance, open local bank account for stipend disbursements, and begin classes.',
        requirements: [
          'Local bank account setup',
          'University scholarship office check-in',
          'Dormitory move-in',
        ],
        completionCriteria: 'Active scholar status confirmed at host institution.',
        planetArchetype: 'emerald_horizon',
        ...scholarshipCoords[7],
      },
    ],
  };

  return {
    originCountry,
    originEducationLevel,
    targetCountry,
    targetUniversitySlug,
    targetUniversityName,
    targetDegree,
    targetDiscipline,
    activeMode: 'direct',
    routes: {
      direct: directRoute,
      transfer: transferRoute,
      scholarship: scholarshipRoute,
    },
    lastGeneratedAt: null,
    aiSummaryNote:
      'Starter academic navigation map initialized. Use the Academic Cartographer Agent to tailor all 3 routes to your exact profile and target university.',
    weeklyStudyHours: 14,
    targetDeadlineMonths: 14,
    currentSkillLevel: 'Intermediate',
  };
}

export function computeRouteMetrics(route: RoadmapRoute): RouteMetrics {
  const stations = route.stations;
  if (stations.length === 0) {
    return {
      progressPercent: 0,
      completedCount: 0,
      totalCount: 0,
      remainingMonths: 0,
      remainingCostUsd: 0,
      currentStation: null,
      nextStation: null,
    };
  }

  let totalWeight = 0;
  let completedWeight = 0;
  let completedCount = 0;
  let remainingCostUsd = 0;

  for (const s of stations) {
    const w = Math.max(1, s.weight || 10);
    totalWeight += w;
    if (s.status === 'completed') {
      completedWeight += w;
      completedCount += 1;
    } else if (s.status === 'in_progress') {
      // Incorporate subtask star progress if present, otherwise 0.4
      if (Array.isArray(s.taskStars) && s.taskStars.length > 0) {
        const doneStars = s.taskStars.filter((st) => st.status === 'completed').length;
        const ratio = Math.max(0.25, Math.min(0.9, doneStars / s.taskStars.length));
        completedWeight += w * ratio;
      } else {
        completedWeight += w * 0.4;
      }
      remainingCostUsd += Math.max(0, s.estimatedCostUsd || 0);
    } else {
      remainingCostUsd += Math.max(0, s.estimatedCostUsd || 0);
    }
  }

  const progressPercent = Math.min(100, Math.round((completedWeight / totalWeight) * 100));
  const remainingRatio = Math.max(0, 1 - progressPercent / 100);
  const remainingMonths = Math.max(
    0,
    Math.round(route.estimatedDurationMonths * remainingRatio)
  );

  const currentStation =
    stations.find((s) => s.status === 'in_progress') ||
    stations.find((s) => s.status === 'upcoming') ||
    stations[stations.length - 1];

  const currentIdx = currentStation ? stations.findIndex((s) => s.id === currentStation.id) : -1;
  const nextStation =
    currentIdx >= 0 && currentIdx + 1 < stations.length ? stations[currentIdx + 1] : null;

  return {
    progressPercent,
    completedCount,
    totalCount: stations.length,
    remainingMonths,
    remainingCostUsd,
    currentStation,
    nextStation,
  };
}

/**
 * Merges AI-generated route milestones while strictly preserving any completed or custom user milestones.
 */
export function mergeAiGeneratedRoute(
  existingRoute: RoadmapRoute,
  incoming: Array<
    Omit<RoadmapStation, 'id' | 'order' | 'x' | 'y' | 'status'> & { status?: StationStatus }
  >,
  meta?: { tagline?: string; estimatedDurationMonths?: number }
): RoadmapRoute {
  const preserved = existingRoute.stations.filter(
    (s) => s.status === 'completed' || s.isCustom
  );
  const preservedKeys = new Set(preserved.map((s) => s.title.trim().toLowerCase()));

  const newStations: RoadmapStation[] = incoming
    .filter((s) => s.title && !preservedKeys.has(s.title.trim().toLowerCase()))
    .map((s, idx) => ({
      ...s,
      id: `${existingRoute.mode}-ai-${Date.now()}-${idx}`,
      order: preserved.length + idx + 1,
      status: s.status || (preserved.length === 0 && idx === 0 ? 'in_progress' : 'upcoming'),
      weight: Math.max(5, Math.min(40, Math.round(Number(s.weight) || 15))),
      estimatedCostUsd: Math.max(0, Math.round(Number(s.estimatedCostUsd) || 0)),
      evidenceCategory: s.evidenceCategory || 'ai_recommendation',
      requirements:
        Array.isArray(s.requirements) && s.requirements.length > 0
          ? s.requirements
          : ['Verify current cycle admission guidelines'],
      x: 0,
      y: 0,
    }));

  const combined = [...preserved, ...newStations];
  // Ensure at least one station is in_progress if not all completed
  if (
    combined.length > 0 &&
    !combined.some((s) => s.status === 'in_progress') &&
    combined.some((s) => s.status !== 'completed')
  ) {
    const firstPending = combined.find((s) => s.status !== 'completed');
    if (firstPending) firstPending.status = 'in_progress';
  }

  const coords = layoutStationsOnArc(combined.length, existingRoute.mode);
  const positioned = combined.map((s, idx) => ({
    ...s,
    order: idx + 1,
    x: coords[idx].x,
    y: coords[idx].y,
  }));

  const estimatedTotalCostUsd = positioned.reduce(
    (sum, s) => sum + Math.max(0, s.estimatedCostUsd || 0),
    0
  );

  return {
    ...existingRoute,
    tagline: meta?.tagline || existingRoute.tagline,
    estimatedDurationMonths:
      meta?.estimatedDurationMonths || existingRoute.estimatedDurationMonths,
    estimatedTotalCostUsd,
    stations: positioned,
  };
}

/**
 * Evaluates whether the user's target deadline and weekly study availability are realistic
 * for the actual remaining task hours across the active cosmic roadmap.
 */
export function evaluateScheduleFeasibility(params: {
  totalEstimatedHours: number;
  completedHours: number;
  weeklyStudyHours: number;
  targetDeadlineMonths: number;
  targetUniversityName: string;
}): ScheduleFeasibilityAnalysis {
  const weeklyStudyHours = Math.max(2, Math.min(60, Math.round(params.weeklyStudyHours || 14)));
  const targetDeadlineMonths = Math.max(
    1,
    Math.min(48, Math.round(params.targetDeadlineMonths || 14))
  );
  const remainingHours = Math.max(0, params.totalEstimatedHours - params.completedHours);
  const weeksAvailable = Math.max(4, targetDeadlineMonths * 4.33);
  const requiredWeeklyHoursForTarget = Math.ceil(remainingHours / weeksAvailable);
  const realisticDurationMonths = Math.max(
    2,
    Math.ceil(remainingHours / (weeklyStudyHours * 4.33))
  );

  if (requiredWeeklyHoursForTarget <= weeklyStudyHours * 0.92) {
    return {
      totalEstimatedHours: params.totalEstimatedHours,
      completedHours: params.completedHours,
      remainingHours,
      weeklyStudyHours,
      targetDeadlineMonths,
      requiredWeeklyHoursForTarget,
      realisticDurationMonths,
      isFeasible: true,
      feasibilityStatus: 'optimal',
      explanation: `Feasible schedule: Your ${weeklyStudyHours} hrs/week study budget comfortably covers the ${remainingHours} remaining preparation hours within ${targetDeadlineMonths} months (requires ~${requiredWeeklyHoursForTarget} hrs/week).`,
      recommendedAlternative: `On track to complete all milestones for ${params.targetUniversityName} with a ${Math.max(1, targetDeadlineMonths - realisticDurationMonths)}-month safety buffer.`,
    };
  }

  if (requiredWeeklyHoursForTarget <= weeklyStudyHours * 1.18) {
    return {
      totalEstimatedHours: params.totalEstimatedHours,
      completedHours: params.completedHours,
      remainingHours,
      weeklyStudyHours,
      targetDeadlineMonths,
      requiredWeeklyHoursForTarget,
      realisticDurationMonths,
      isFeasible: true,
      feasibilityStatus: 'tight',
      explanation: `Tight schedule: Completing ${remainingHours} hrs of exam, portfolio, and application milestones in ${targetDeadlineMonths} months requires ~${requiredWeeklyHoursForTarget} hrs/week (your current setting is ${weeklyStudyHours} hrs/week).`,
      recommendedAlternative: `Increase weekly focus to ${requiredWeeklyHoursForTarget} hrs/week or extend target horizon to ${realisticDurationMonths} months to prevent exam-window compression.`,
    };
  }

  return {
    totalEstimatedHours: params.totalEstimatedHours,
    completedHours: params.completedHours,
    remainingHours,
    weeklyStudyHours,
    targetDeadlineMonths,
    requiredWeeklyHoursForTarget,
    realisticDurationMonths,
    isFeasible: false,
    feasibilityStatus: 'unrealistic',
    explanation: `Unrealistic deadline warning: ${remainingHours} remaining academic preparation hours cannot be reliably compressed into ${targetDeadlineMonths} months at ${weeklyStudyHours} hrs/week (would require ${requiredWeeklyHoursForTarget} hrs/week of sustained study plus fixed testing/consular lead times).`,
    recommendedAlternative: `Recommended realistic plan: Extend timeline to ${realisticDurationMonths} months at ${weeklyStudyHours} hrs/week, or increase weekly study allocation to ${Math.min(35, requiredWeeklyHoursForTarget)} hrs/week.`,
  };
}

/**
 * Builds the complete 3D Cosmic Solar System model from the active RoadmapWorkspaceState.
 * Outer planets represent initial foundation milestones; inner orbits spiral progressively toward the Sun (Ultimate Destination).
 */
export function buildCosmicSolarSystem(
  state: RoadmapWorkspaceState,
  overrides?: {
    weeklyStudyHours?: number;
    targetDeadlineMonths?: number;
  }
): CosmicSolarSystemModel {
  const activeRoute = state.routes[state.activeMode];
  const stations = activeRoute.stations;
  const totalStations = Math.max(1, stations.length);
  const metrics = computeRouteMetrics(activeRoute);

  const weeklyHours = overrides?.weeklyStudyHours ?? state.weeklyStudyHours ?? 14;
  const targetMonths =
    overrides?.targetDeadlineMonths ??
    state.targetDeadlineMonths ??
    activeRoute.estimatedDurationMonths;

  let totalEstimatedHours = 0;
  let completedHours = 0;
  let totalStarsCount = 0;
  let completedStarsCount = 0;
  let verifiedMilestonesCount = 0;

  // Build enriched planets ordered from outer orbit (Station 1: Foundation) inward toward the Sun (Station N -> Sun Destination)
  const planets = stations.map((st, idx) => {
    const archetype =
      st.planetArchetype ||
      PLANET_ARCHETYPE_SEQUENCE[idx % PLANET_ARCHETYPE_SEQUENCE.length];

    // Outer-to-inner concentric solar system progression toward the central Sun at (0,0,0)
    const reverseIdx = totalStations - 1 - idx;
    const orbitalRadius = st.orbitalRadius ?? Number((14.2 + reverseIdx * 5.2).toFixed(2));

    // Golden-angle cinematic distribution around the Sun so every planet sits cleanly visible in overview
    // with unobstructed space beneath the Sun for the floating holographic goal label
    const goldenStep = 2.18;
    const baseAngle = 2.65 + idx * goldenStep;
    const orbitalAngle =
      st.orbitalAngle ?? Number((baseAngle % (Math.PI * 2)).toFixed(4));
    const orbitalElevation =
      st.orbitalElevation ?? Number((Math.sin(idx * 1.15) * 1.1).toFixed(2));
    // Gentle Keplerian angular velocity: inner orbits move slightly faster than outer orbits
    const orbitalSpeed =
      st.orbitalSpeed ?? Number((0.018 + (idx / Math.max(1, totalStations)) * 0.022).toFixed(4));

    const planetScale =
      st.planetScale ??
      (archetype === 'ringed_gas_giant'
        ? 1.18
        : archetype === 'sapphire_crown' || archetype === 'emerald_horizon'
        ? 1.1
        : 1.0);

    const hasRings =
      st.hasRings ?? (archetype === 'ringed_gas_giant' || archetype === 'sapphire_crown');

    const taskStars = synthesizeActionableTaskStars(st, {
      originCountry: state.originCountry,
      targetCountry: state.targetCountry,
      targetUniversityName: state.targetUniversityName,
      targetDegree: state.targetDegree,
      targetDiscipline: state.targetDiscipline,
    });

    const starHours = taskStars.reduce((acc, star) => acc + star.estimatedHours, 0);
    const doneStarHours = taskStars
      .filter((star) => star.status === 'completed')
      .reduce((acc, star) => acc + star.estimatedHours, 0);

    totalEstimatedHours += starHours;
    completedHours += st.status === 'completed' ? starHours : doneStarHours;

    const doneStars = taskStars.filter((star) => star.status === 'completed').length;
    totalStarsCount += taskStars.length;
    completedStarsCount += st.status === 'completed' ? taskStars.length : doneStars;

    const planetProgressPercent =
      st.status === 'completed'
        ? 100
        : taskStars.length > 0
        ? Math.round((doneStars / taskStars.length) * 100)
        : st.status === 'in_progress'
        ? 40
        : 0;

    const verificationMastery: VerificationMasteryLevel =
      st.verificationMastery ||
      (st.status === 'completed'
        ? 'milestone_verified'
        : doneStars > 0
        ? 'knowledge_assessed'
        : 'pending');

    if (verificationMastery === 'milestone_verified' || st.status === 'completed') {
      verifiedMilestonesCount += 1;
    }

    const prerequisiteStationIds =
      st.prerequisiteStationIds || (idx > 0 ? [stations[idx - 1].id] : []);
    const parallelStationIds =
      st.parallelStationIds ||
      (idx > 1 && idx < totalStations - 2 && st.phase === stations[idx - 1]?.phase
        ? [stations[idx - 1].id]
        : []);

    const isPrerequisiteMet =
      prerequisiteStationIds.length === 0 ||
      prerequisiteStationIds.every((reqId) => {
        const reqStation = stations.find((s) => s.id === reqId);
        return !reqStation || reqStation.status === 'completed';
      });

    const startMonth = Math.max(1, Math.round((idx / totalStations) * targetMonths) + 1);
    const endMonth = Math.max(
      startMonth,
      Math.round(((idx + 1) / totalStations) * targetMonths)
    );

    return {
      ...st,
      planetArchetype: archetype,
      orbitalRadius,
      orbitalAngle,
      orbitalElevation,
      orbitalSpeed,
      planetScale,
      hasRings,
      whyItMatters:
        st.whyItMatters ||
        `Critical stage in ${activeRoute.name} ensuring readiness for ${state.targetUniversityName} (${state.targetDegree} in ${state.targetDiscipline}).`,
      expectedOutcome: st.expectedOutcome || st.completionCriteria,
      plannedStartDate: st.plannedStartDate || `Month ${startMonth}`,
      targetCompletionDate: st.targetCompletionDate || `Month ${endMonth}`,
      prerequisiteStationIds,
      parallelStationIds,
      verificationMastery,
      taskStars,
      planetProgressPercent,
      isPrerequisiteMet,
    };
  });

  // Build logical 3D route trajectories between sequential milestones, parallel branches, and the final Sun destination
  const connections: CosmicRouteConnection[] = [];
  for (let i = 0; i < planets.length - 1; i++) {
    const curr = planets[i];
    const next = planets[i + 1];
    let connState: CosmicRouteConnection['state'] = 'upcoming';
    if (curr.status === 'completed' && next.status === 'completed') {
      connState = 'completed';
    } else if (curr.status === 'completed' && next.status === 'in_progress') {
      connState = 'active';
    } else if (curr.status === 'in_progress') {
      connState = 'active';
    }
    connections.push({
      id: `route-${curr.id}-to-${next.id}`,
      fromStationId: curr.id,
      toStationId: next.id,
      type: 'primary_sequence',
      state: connState,
    });
  }

  // Add parallel preparation branch if stages share a phase window (e.g. Language + Quantitative/Standardized prep)
  if (planets.length >= 4) {
    const p1 = planets[1];
    const p3 = planets[3];
    connections.push({
      id: `route-parallel-${p1.id}-${p3.id}`,
      fromStationId: p1.id,
      toStationId: p3.id,
      type: 'parallel_branch',
      state:
        p1.status === 'completed' && p3.status === 'completed'
          ? 'completed'
          : p1.status === 'in_progress' || p3.status === 'in_progress'
          ? 'active'
          : 'parallel_optional',
    });
  }

  // Final ascent route from the innermost planet into the Sun (Ultimate Destination)
  if (planets.length > 0) {
    const lastPlanet = planets[planets.length - 1];
    connections.push({
      id: `route-${lastPlanet.id}-to-SUN`,
      fromStationId: lastPlanet.id,
      toStationId: 'SUN_DESTINATION',
      type: 'solar_ascent',
      state:
        lastPlanet.status === 'completed'
          ? 'completed'
          : lastPlanet.status === 'in_progress'
          ? 'active'
          : 'upcoming',
    });
  }

  const feasibility = evaluateScheduleFeasibility({
    totalEstimatedHours,
    completedHours,
    weeklyStudyHours: weeklyHours,
    targetDeadlineMonths: targetMonths,
    targetUniversityName: state.targetUniversityName,
  });

  // Compute Adaptive Schedule Proposal based on actual progress and feasibility
  const completedRatio = totalStations > 0 ? metrics.completedCount / totalStations : 0;
  let paceMode: AdaptiveScheduleProposal['paceMode'] = 'on_track';
  let summaryTitle = 'Journey Pace: Coherent & On Schedule';
  let summaryReason = `Completed ${metrics.completedCount} of ${totalStations} milestones (${completedStarsCount}/${totalStarsCount} task stars). Current trajectory aligns with your ${targetMonths}-month target window.`;

  if (!feasibility.isFeasible) {
    paceMode = 'recovery_needed';
    summaryTitle = 'Adaptive Schedule Recovery Recommended';
    summaryReason = feasibility.explanation;
  } else if (completedRatio >= 0.35 && feasibility.feasibilityStatus === 'optimal') {
    paceMode = 'ahead_of_schedule';
    summaryTitle = 'Accelerated Trajectory Available';
    summaryReason = `You have already completed ${completedHours} hrs of foundational preparation. Remaining milestones can be compressed into ${feasibility.realisticDurationMonths} months while preserving all completed work.`;
  }

  const adaptiveAdjustments = planets.map((p, idx) => {
    const adaptedTotalMonths =
      paceMode === 'recovery_needed'
        ? feasibility.realisticDurationMonths
        : paceMode === 'ahead_of_schedule'
        ? Math.max(6, feasibility.realisticDurationMonths)
        : targetMonths;

    const sM = Math.max(1, Math.round((idx / totalStations) * adaptedTotalMonths) + 1);
    const eM = Math.max(sM, Math.round(((idx + 1) / totalStations) * adaptedTotalMonths));
    return {
      stationId: p.id,
      stationTitle: p.title,
      previousTimeframe: p.timeframe,
      proposedTimeframe:
        p.status === 'completed'
          ? `${p.timeframe} (Preserved)`
          : sM === eM
          ? `Month ${sM}`
          : `Months ${sM}–${eM}`,
      preservedStatus: p.status,
    };
  });

  const adaptiveProposal: AdaptiveScheduleProposal = {
    paceMode,
    summaryTitle,
    summaryReason,
    proposedDurationMonths:
      paceMode === 'recovery_needed'
        ? feasibility.realisticDurationMonths
        : paceMode === 'ahead_of_schedule'
        ? Math.max(6, feasibility.realisticDurationMonths)
        : targetMonths,
    proposedWeeklyHours:
      paceMode === 'recovery_needed'
        ? Math.min(32, feasibility.requiredWeeklyHoursForTarget)
        : weeklyHours,
    prioritizedStationId: metrics.currentStation?.id || planets[0]?.id || null,
    adjustments: adaptiveAdjustments,
  };

  return {
    sunDestination: {
      title: state.targetUniversityName,
      subtitle: `${state.targetDegree} in ${state.targetDiscipline} · ${state.targetCountry}`,
      degreeAndDiscipline: `${state.targetDegree} · ${state.targetDiscipline}`,
      originToTargetLabel: `${state.originCountry} → ${state.targetUniversityName}`,
      routeBadge: activeRoute.name,
      overallProgressPercent: metrics.progressPercent,
      isGoalAchieved: metrics.progressPercent === 100 && metrics.completedCount === totalStations,
      verifiedMilestonesCount,
      totalMilestonesCount: totalStations,
      completedStarsCount,
      totalStarsCount,
    },
    planets,
    connections,
    feasibility,
    adaptiveProposal,
  };
}

/**
 * Updates an individual task star inside a station, recalculating dependent star availability
 * and parent milestone progress without losing any user edits.
 */
export function updateTaskStarInRoute(
  route: RoadmapRoute,
  stationId: string,
  starId: string,
  patch: Partial<CosmicTaskStar>,
  context: {
    originCountry: string;
    targetCountry: string;
    targetUniversityName: string;
    targetDegree: string;
    targetDiscipline: string;
  }
): RoadmapRoute {
  const updatedStations = route.stations.map((station) => {
    if (station.id !== stationId) return station;

    const currentStars = synthesizeActionableTaskStars(station, context);
    const patchedStars = currentStars.map((star) =>
      star.id === starId ? { ...star, ...patch } : star
    );

    // Unlock dependent stars whose required prerequisites are now completed
    const completedIds = new Set(
      patchedStars.filter((s) => s.status === 'completed').map((s) => s.id)
    );
    const dependencyResolvedStars = patchedStars.map((star) => {
      if (star.status === 'completed' || star.status === 'in_progress') return star;
      const prereqsMet =
        star.prerequisiteStarIds.length === 0 ||
        star.prerequisiteStarIds.every((id) => completedIds.has(id));
      return {
        ...star,
        status: prereqsMet ? ('available' as const) : ('locked' as const),
      };
    });

    const allCompleted =
      dependencyResolvedStars.length > 0 &&
      dependencyResolvedStars.every((s) => s.status === 'completed');
    const anyActiveOrDone = dependencyResolvedStars.some(
      (s) => s.status === 'completed' || s.status === 'in_progress'
    );

    let nextStationStatus: StationStatus = station.status;
    let nextVerification: VerificationMasteryLevel =
      station.verificationMastery || 'pending';

    if (allCompleted) {
      nextStationStatus = 'completed';
      nextVerification =
        station.verificationMastery === 'milestone_verified'
          ? 'milestone_verified'
          : 'task_completed';
    } else if (anyActiveOrDone && station.status === 'upcoming') {
      nextStationStatus = 'in_progress';
      nextVerification = 'knowledge_assessed';
    }

    return {
      ...station,
      status: nextStationStatus,
      verificationMastery: nextVerification,
      taskStars: dependencyResolvedStars,
    };
  });

  return {
    ...route,
    stations: updatedStations,
  };
}

/**
 * Applies a reviewable Adaptive Schedule Proposal to a route while strictly preserving completed milestones.
 */
export function applyAdaptiveScheduleToRoute(
  route: RoadmapRoute,
  proposal: AdaptiveScheduleProposal
): RoadmapRoute {
  const adjById = new Map(proposal.adjustments.map((a) => [a.stationId, a]));
  const updatedStations = route.stations.map((station) => {
    if (station.status === 'completed') return station;
    const adj = adjById.get(station.id);
    if (!adj) return station;
    return {
      ...station,
      timeframe: adj.proposedTimeframe,
      plannedStartDate: adj.proposedTimeframe.split('–')[0]?.trim() || station.plannedStartDate,
      targetCompletionDate:
        adj.proposedTimeframe.split('–')[1]?.trim() ||
        adj.proposedTimeframe ||
        station.targetCompletionDate,
    };
  });

  return {
    ...route,
    estimatedDurationMonths: proposal.proposedDurationMonths,
    stations: updatedStations,
  };
}

/**
 * Formats a 1-based milestone order into a 2-digit prefix ("01", "02", ...).
 */
export function formatMilestoneNumber(order: number): string {
  const safeOrder = Math.max(1, Math.floor(Number(order) || 1));
  return String(safeOrder).padStart(2, '0');
}

/**
 * Formats a 1-based task order within its parent milestone into a 2-digit number ("01", "02", ...).
 * Task numbering restarts at "01" within each milestone.
 */
export function formatTaskNumber(taskOrder: number): string {
  const safeOrder = Math.max(1, Math.floor(Number(taskOrder) || 1));
  return String(safeOrder).padStart(2, '0');
}

/**
 * Formats a hierarchical milestone + task identifier ("01.01", "01.02", "02.01", ...).
 */
export function formatHierarchicalTaskCode(milestoneOrder: number, taskOrder: number): string {
  return `${formatMilestoneNumber(milestoneOrder)}.${formatTaskNumber(taskOrder)}`;
}

/**
 * Formats a planet's contextual hover label using its actual milestone number and title:
 * e.g. "01 — Academic Baseline & Transcript Audit"
 */
export function formatMilestoneHoverTitle(order: number, title: string): string {
  return `${formatMilestoneNumber(order)} — ${title.trim()}`;
}

/**
 * Computes a 3D point on a Sun-centered tilted circular orbit.
 * Because this applies an exact 3D orthogonal plane rotation to (R cos θ, 0, R sin θ),
 * every point on the orbit is at exact distance `orbitRadius` from the Sun (0,0,0),
 * and the planet sits strictly on its rendered orbital ring at all times.
 */
export function computeSunCenteredOrbitPoint(
  orbitRadius: number,
  angleRad: number,
  inclinationXRad = 0,
  inclinationZRad = 0
): { x: number; y: number; z: number } {
  const x0 = orbitRadius * Math.cos(angleRad);
  const z0 = orbitRadius * Math.sin(angleRad);

  const cosX = Math.cos(inclinationXRad);
  const sinX = Math.sin(inclinationXRad);
  const x1 = x0;
  const y1 = -z0 * sinX;
  const z1 = z0 * cosX;

  const cosZ = Math.cos(inclinationZRad);
  const sinZ = Math.sin(inclinationZRad);
  const x2 = x1 * cosZ - y1 * sinZ;
  const y2 = x1 * sinZ + y1 * cosZ;
  const z2 = z1;

  return { x: x2, y: y2, z: z2 };
}

/**
 * Computes deterministic, subtle orbital inclination angles (in radians) for a milestone planet index
 * so each orbital ring has natural 3D depth separation without chaotic crossing.
 */
export function getPlanetOrbitalInclination(index: number): {
  inclinationX: number;
  inclinationZ: number;
} {
  const inclinationX = Math.sin(index * 1.15 + 0.4) * 0.085;
  const inclinationZ = Math.cos(index * 0.92 + 0.2) * 0.065;
  return { inclinationX, inclinationZ };
}

/**
 * Determines which milestone indices form the glowing inward progress path
 * from the outermost completed planet inward through the active in-progress milestone.
 */
export function computeInwardProgressChainIndices(
  statuses: Array<StationStatus | 'locked'>
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i] === 'completed' || statuses[i] === 'in_progress') {
      indices.push(i);
    }
  }
  return indices;
}

export interface FocusCameraFramingInput {
  focusKind: 'planet' | 'star' | 'sun';
  objectPos: { x: number; y: number; z: number };
  objectRadius: number;
  viewportWidth: number;
  viewportHeight: number;
  orbitYawOffset?: number;
  orbitPitchOffset?: number;
  zoomMultiplier?: number;
  parallaxX?: number;
  parallaxY?: number;
  referenceOrigin?: { x: number; y: number; z: number };
}

export interface FocusCameraFramingResult {
  camPos: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  viewDistance: number;
}

/**
 * Computes viewport-adaptive camera position and lookAt target for selected-object focus mode.
 * - On desktop & tablet (width >= 768), positions the selected celestial object on the RIGHT side
 *   of the cosmic viewport while reserving the LEFT side for the contextual glass dossier panel.
 * - On mobile (width < 768), positions the selected object in the upper-center viewport above
 *   the compact bottom contextual drawer.
 */
export function computeRightSideFocusFraming(
  input: FocusCameraFramingInput
): FocusCameraFramingResult {
  const width = Math.max(320, input.viewportWidth || 1280);
  const height = Math.max(320, input.viewportHeight || 740);
  const aspect = width / height;
  const isMobile = width < 768;

  const yawOffset = input.orbitYawOffset ?? 0;
  const pitchOffset = input.orbitPitchOffset ?? 0;
  const zoom = Math.max(0.55, Math.min(1.85, input.zoomMultiplier ?? 1.0));
  const px = input.parallaxX ?? 0;
  const py = input.parallaxY ?? 0;

  const obj = input.objectPos;
  const ref = input.referenceOrigin ?? { x: 0, y: 0, z: 0 };

  // Compute radial outward direction from referenceOrigin (e.g. Sun or parent planet) to object
  let dirX = obj.x - ref.x;
  let dirZ = obj.z - ref.z;
  const horizLen = Math.hypot(dirX, dirZ);
  if (horizLen < 0.0001) {
    dirX = 0;
    dirZ = 1;
  } else {
    dirX /= horizLen;
    dirZ /= horizLen;
  }

  // For planet focus, position the camera on the sunlit inner-tangential side looking outward/tangentially
  // across the planet toward deep space so the planet displays a 3/4 sunlit crescent and the Sun is never directly behind it.
  // For star focus, look from the outer-tangential side of the star's orbit so the star is in the foreground with its parent planet in context.
  const baseAngle =
    input.focusKind === 'sun'
      ? 0.18
      : input.focusKind === 'star'
      ? 0.48
      : Math.PI * 0.64; // ~115 deg from outward radial = sunlit inner-tangential vantage looking outward
  const totalYaw = baseAngle + yawOffset;
  const cosYaw = Math.cos(totalYaw);
  const sinYaw = Math.sin(totalYaw);

  const viewDirX = dirX * cosYaw - dirZ * sinYaw;
  const viewDirZ = dirX * sinYaw + dirZ * cosYaw;

  // Base distance scaled by object radius and aspect so the object + its immediate surroundings never clip
  const fovHalfTan = Math.tan((45 * Math.PI) / 360); // tan(22.5 deg) ≈ 0.41421356
  const minAspectScale = aspect < 1.1 ? 1.18 / Math.max(0.55, aspect) : 1.0;

  let baseDist: number;
  if (input.focusKind === 'sun') {
    baseDist = Math.max(25, input.objectRadius * 3.5);
  } else if (input.focusKind === 'star') {
    baseDist = Math.max(4.4, input.objectRadius * 11.5);
  } else {
    baseDist = Math.max(12.5, input.objectRadius * 5.2);
  }
  const viewDistance = baseDist * zoom * minAspectScale;

  const elevationFactor =
    (input.focusKind === 'sun' ? 0.16 : input.focusKind === 'star' ? 0.15 : 0.18) +
    pitchOffset * 0.65;

  const rawCamX = obj.x + viewDirX * viewDistance + px * 0.32;
  const rawCamY = obj.y + viewDistance * elevationFactor + py * 0.25;
  const rawCamZ = obj.z + viewDirZ * viewDistance;

  // Forward vector from camera to object
  let fwdX = obj.x - rawCamX;
  let fwdY = obj.y - rawCamY;
  let fwdZ = obj.z - rawCamZ;
  const fwdLen = Math.hypot(fwdX, fwdY, fwdZ) || 1;
  fwdX /= fwdLen;
  fwdY /= fwdLen;
  fwdZ /= fwdLen;

  // Camera right vector = normalize(cross(forward, worldUp(0,1,0))) = normalize((-fwdZ, 0, fwdX))
  let rightX = -fwdZ;
  let rightZ = fwdX;
  const rightLen = Math.hypot(rightX, rightZ) || 1;
  rightX /= rightLen;
  rightZ /= rightLen;

  // Visible half-height and half-width at the object's depth plane
  const halfHeight = viewDistance * fovHalfTan;
  const halfWidth = halfHeight * aspect;

  if (isMobile) {
    // On mobile, contextual panel is a compact bottom sheet; frame object in the upper-center viewport
    const verticalShift = -halfHeight * 0.22;
    return {
      camPos: { x: rawCamX, y: rawCamY, z: rawCamZ },
      lookAt: {
        x: obj.x,
        y: obj.y + verticalShift,
        z: obj.z,
      },
      viewDistance,
    };
  }

  // On desktop/tablet, left-side contextual panel occupies ~390px on the LEFT.
  // Shift lookAt toward -cameraRight so the selected object projects cleanly to the RIGHT side (ndc.x ≈ +0.30..+0.36).
  const panelRatio = Math.min(0.42, 390 / width);
  const ndcTargetRight = Math.max(0.28, Math.min(0.38, panelRatio * 1.15));
  const horizontalWorldShift = halfWidth * ndcTargetRight;

  return {
    camPos: {
      x: rawCamX - rightX * (horizontalWorldShift * 0.16),
      y: rawCamY,
      z: rawCamZ - rightZ * (horizontalWorldShift * 0.16),
    },
    lookAt: {
      x: obj.x - rightX * horizontalWorldShift,
      y: obj.y + halfHeight * 0.015,
      z: obj.z - rightZ * horizontalWorldShift,
    },
    viewDistance,
  };
}

