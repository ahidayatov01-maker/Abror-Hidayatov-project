export type VerificationStatus =
  | 'verified'
  | 'estimated'
  | 'requires_verification'
  | 'unavailable';

export type AppearanceMode = 'light' | 'dark' | 'bw';

export type LanguageCode = 'en' | 'uz' | 'ru' | 'ja' | 'zh' | 'de';

export type SubscriptionTier = 'free' | 'standard' | 'premium';

export type NavSectionId =
  | 'dashboard'
  | 'world-explorer'
  | 'explore-by-city'
  | 'countries'
  | 'universities'
  | 'academic-programs'
  | 'scholarships'
  | 'global-rankings'
  | 'admission-intelligence'
  | 'university-comparison'
  | 'my-universities'
  | 'goals'
  | 'my-academic-journey'
  | 'financial-planner'
  | 'ai-advisor'
  | 'research-library'
  | 'account-settings'
  | 'subscriptions'
  | 'paper-journal'
  | 'routine'
  | 'todo-list'
  | 'about';

export interface CountryRecord {
  isoCode: string;
  isoNumeric: string;
  name: string;
  continent: string;
  capital: string;
  flagEmoji: string;
  educationSystem: string;
  admissionSystem: string;
  languageRequirements: string;
  internationalInfo: string;
  academicOpportunities: string;
  tuitionRangeMinUsd: number | null;
  tuitionRangeMaxUsd: number | null;
  livingCostMonthlyMinUsd: number | null;
  livingCostMonthlyMaxUsd: number | null;
  officialPortalUrl: string;
  sourceOrg: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  academicYear: string;
}

export interface CityRecord {
  slug: string;
  countryCode: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number | null;
  studentPopulation: number | null;
  monthlyLivingMinUsd: number;
  monthlyLivingMaxUsd: number;
  housingMonthlyUsd: number;
  foodMonthlyUsd: number;
  transportMonthlyUsd: number;
  insuranceAnnualUsd: number;
  currencyCode: string;
  academicProfile: string;
  architecturalMotif: string;
  officialTourismUrl: string;
  sourceOrg: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
}

export interface UniversityRecord {
  slug: string;
  name: string;
  shortName: string;
  citySlug: string;
  countryCode: string;
  foundedYear: number | null;
  institutionType: string;
  officialWebsite: string;
  officialMediaUrl: string;
  officialApplicationUrl: string;
  primaryLanguage: string;
  studentCount: number | null;
  internationalRatioPct: number | null;
  tuitionAnnualMinUsd: number | null;
  tuitionAnnualMaxUsd: number | null;
  tuitionCurrency: string;
  tuitionLocalDisplay: string;
  overview: string;
  facultiesJson: string[];
  departmentsJson: string[];
  researchAreasJson: string[];
  facilitiesJson: string[];
  academicStrengthsJson: string[];
  internationalInfo: string;
  monogram: string;
  accentHue: string;
  architecturalMotif: string;
  imageUrl?: string;
  sourceOrg: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  academicYear: string;
}

export interface ProgramRecord {
  slug: string;
  universitySlug: string;
  name: string;
  discipline: string;
  degreeLevel: 'Bachelor' | 'Master' | 'PhD';
  language: string;
  durationYears: number;
  tuitionAnnualUsd: number | null;
  overview: string;
  careerOutcomes: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  academicYear: string;
}

export interface RankingRecord {
  universitySlug: string;
  provider: 'QS World University Rankings' | 'Times Higher Education' | 'Academic Ranking of World Universities';
  publicationYear: number;
  worldRank: number;
  worldRankDisplay: string;
  subjectArea: string;
  subjectRank: number | null;
  historicalRanksJson: Array<{ year: number; rank: number }>;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
}

export type ScholarshipFundingType =
  | 'full'
  | 'partial'
  | 'tuition_waiver'
  | 'research'
  | 'merit';

export type ScholarshipApplicationStatus =
  | 'open'
  | 'upcoming'
  | 'closed'
  | 'recurring_unconfirmed'
  | 'requires_verification';

export interface ScholarshipRecord {
  slug: string;
  name: string;
  provider: string;
  countryCode: string;
  eligibleUniversitySlugsJson: string[];
  degreeLevelsJson: string[];
  deadlineText: string;
  coverageSummary: string;
  coverageAmountUsd: number | null;
  eligibilityCriteriaJson: string[];
  requiredDocumentsJson: string[];
  officialUrl: string;
  sourceUrl: string;
  fundingType?: ScholarshipFundingType | string;
  applicationStatus?: ScholarshipApplicationStatus | string;
  eligibleNationalitiesJson?: string[];
  eligibleFieldsJson?: string[];
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  academicYear: string;
}

export interface AdmissionRequirementRecord {
  universitySlug: string;
  degreeLevel: string;
  academicQualifications: string;
  languageTests: string;
  standardizedTests: string;
  requiredDocumentsJson: string[];
  applicationDeadline: string;
  entranceExamInfo: string;
  applicationProcess: string;
  portalUrl: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string;
  academicYear: string;
}

export interface SavedUniversityEntry {
  id?: number;
  universitySlug: string;
  collectionName: string;
  priority: 'Dream' | 'Target' | 'Safety';
  applicationStatus: 'Researching' | 'Preparing' | 'Submitted' | 'Decision';
  personalNotes: string;
}

export interface JourneyTaskEntry {
  id: number | string;
  title: string;
  category:
    | 'Milestone'
    | 'Document'
    | 'Exam'
    | 'Scholarship'
    | 'Admissions'
    | 'Exams'
    | 'Scholarships'
    | 'Documents'
    | 'Research'
    | 'Financial'
    | 'Personal';
  targetUniversitySlug?: string | null;
  dueDate?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
}

export interface ResearchResourceEntry {
  id: number | string;
  title: string;
  url: string;
  folder: string;
  tags: string[];
  universitySlug?: string | null;
  notes: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl: string;
  country?: string;
  city?: string;
  preferredLanguage: LanguageCode;
  appearanceMode: AppearanceMode;
  currentEducationLevel: string;
  targetDegree: string;
  targetDisciplines: string[];
  targetCountries: string[];
  subscriptionTier: SubscriptionTier;
  role?: 'owner' | 'user';
  isOwner?: boolean;
  billingExempt?: boolean;
  subscriptionStatus?: 'permanent_owner' | 'active';
  accountType?: 'authenticated' | 'guest';
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  notificationPrefs: {
    deadlines: boolean;
    scholarships: boolean;
    advisorDigest: boolean;
  };
}

export type MaterialType =
  | 'pdf'
  | 'word'
  | 'presentation'
  | 'image'
  | 'note'
  | 'link'
  | 'study_doc'
  | 'other';

export type MaterialStudyStatus =
  | 'not_reviewed'
  | 'analyzed'
  | 'ready_to_study'
  | 'studying'
  | 'completed';

export type MaterialContentAccess = 'accessible' | 'partial' | 'unreadable';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface MaterialAnalysisResult {
  analyzedAt: string;
  model: string;
  contentVerification: 'verified_content' | 'partial_metadata';
  analysisBasis: string;
  mainSubject: string;
  conciseSummary: string;
  keyTopics: string[];
  importantConcepts: string[];
  learningObjectives: string[];
  difficultyLevel: DifficultyLevel;
  estimatedMinutes: number;
  requiredPriorKnowledge: string[];
  relatedTopics: string[];
  recommendedLearningOrderHint: string;
  sectionsOrPages?: Array<{
    label: string;
    focus: string;
    estimatedMinutes: number;
  }>;
}

export interface CrossMaterialPrerequisiteLink {
  fromMaterialId: string;
  toMaterialId: string;
  reason: string;
}

export interface CrossMaterialOverlap {
  topic: string;
  materialIds: string[];
  note: string;
}

export interface CrossMaterialAnalysisResult {
  analyzedAt: string;
  model: string;
  studySequence: Array<{
    materialId: string;
    order: number;
    rationale: string;
  }>;
  prerequisiteLinks: CrossMaterialPrerequisiteLink[];
  overlappingTopics: CrossMaterialOverlap[];
  complementaryPairs: Array<{
    materialAId: string;
    materialBId: string;
    synergy: string;
  }>;
  knowledgeGaps: string[];
}

export interface StudySessionItem {
  id: string;
  materialId: string;
  folderId: string;
  dayKey: string; // YYYY-MM-DD
  dayLabel: string;
  slotType: 'today' | 'weekly' | 'upcoming';
  partLabel?: string; // e.g. "Part 1 of 2"
  pagesOrSections: string;
  estimatedMinutes: number;
  learningObjective: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: DifficultyLevel;
  whyScheduled: string;
  completed: boolean;
  isAiGenerated: boolean;
}

export interface StudySchedulePreferences {
  dailyStudyMinutes: number;
  studyDaysPerWeek: number;
  maxHardSessionsPerDay: number;
  targetDeadline?: string;
}

export type FolderAccentVariant = 'emerald' | 'jade' | 'mint' | 'teal' | 'forest' | 'sage';

export interface LibraryFolderRecord {
  id: string;
  name: string;
  description: string;
  accentVariant: FolderAccentVariant;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryMaterialRecord {
  id: string;
  legacyResourceId?: number | string;
  folderId: string;
  title: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  materialType: MaterialType;
  url?: string;
  universitySlug?: string | null;
  tags: string[];
  notes: string;
  extractedText?: string;
  slideTexts?: string[];
  pageCount?: number | null;
  hasLocalBlob: boolean;
  contentAccess: MaterialContentAccess;
  unreadableReason?: string;
  studyStatus: MaterialStudyStatus;
  analysis?: MaterialAnalysisResult | null;
  analysisError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchLibraryWorkspaceState {
  version: number;
  folders: LibraryFolderRecord[];
  materials: LibraryMaterialRecord[];
  crossAnalysis: CrossMaterialAnalysisResult | null;
  scheduleSessions: StudySessionItem[];
  schedulePreferences: StudySchedulePreferences;
  scheduleSummaryNote?: string;
  updatedAt: string;
}

export interface GlobalUniversitySummary {
  slug: string;
  name: string;
  shortName: string;
  aliases: string[];
  acronyms: string[];
  countryCode: string;
  countryName: string;
  countryFlag: string;
  continent: string;
  cityName: string;
  citySlug?: string | null;
  latitude: number | null;
  longitude: number | null;
  institutionType: string;
  officialWebsite: string | null;
  rorId: string | null;
  openAlexId: string | null;
  worksCount: number | null;
  citedByCount: number | null;
  foundedYear: number | null;
  primaryLanguage: string | null;
  tuitionLocalDisplay: string | null;
  tuitionAnnualMinUsd: number | null;
  tuitionAnnualMaxUsd: number | null;
  qsRankDisplay: string | null;
  qsRankNumeric: number | null;
  theRankDisplay: string | null;
  theRankNumeric: number | null;
  topTopics: string[];
  imageUrl?: string | null;
  sourceName: string;
  sourceUrl: string | null;
  verificationStatus: VerificationStatus;
  isSeededCatalog: boolean;
  matchLayer?: number;
  matchReason?: string;
}

export interface GlobalUniversityDetail extends GlobalUniversitySummary {
  overview: string;
  summarySource: string;
  officialApplicationUrl: string | null;
  studentCount: number | null;
  internationalRatioPct: number | null;
  faculties: string[];
  departments: string[];
  researchAreas: string[];
  facilities: string[];
  academicStrengths: string[];
  internationalInfo: string | null;
  rankings: RankingRecord[];
  programs: ProgramRecord[];
  admissions: AdmissionRequirementRecord | null;
  relatedScholarships: ScholarshipRecord[];
  verifiedAt: string;
}

export interface GlobalCountrySummary {
  isoCode: string;
  isoNumeric: string;
  name: string;
  continent: string;
  flagEmoji: string;
  capital: string | null;
  totalVerifiedUniversities: number;
  seededUniversityCount: number;
  isSeededDossier: boolean;
  tuitionRangeMinUsd: number | null;
  tuitionRangeMaxUsd: number | null;
  livingCostMonthlyMinUsd: number | null;
  livingCostMonthlyMaxUsd: number | null;
  educationSystem: string | null;
  admissionSystem: string | null;
  languageRequirements: string | null;
  internationalInfo: string | null;
  academicOpportunities: string | null;
  officialPortalUrl: string | null;
  sourceOrg: string;
  verifiedAt: string;
}

export interface GlobalCityCluster {
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  continent: string;
  latitude: number | null;
  longitude: number | null;
  universityCount: number;
  isSeededCity: boolean;
  qsStudentCityRank?: number | null;
  qsRankingSource?: string | null;
  shortDescription?: string | null;
  monthlyLivingMinUsd?: number | null;
  monthlyLivingMaxUsd?: number | null;
  topUniversityNames?: string[];
}


