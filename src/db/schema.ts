import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  firstName: text('first_name').default(''),
  lastName: text('last_name').default(''),
  displayName: text('display_name').default(''),
  avatarUrl: text('avatar_url').default(''),
  country: text('country').default(''),
  city: text('city').default(''),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  appearanceMode: text('appearance_mode').notNull().default('light'),
  currentEducationLevel: text('current_education_level').default('High School Senior'),
  targetDegree: text('target_degree').default('Bachelor'),
  targetDisciplines: jsonb('target_disciplines').$type<string[]>().default([]),
  targetCountries: jsonb('target_countries').$type<string[]>().default([]),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  accountType: text('account_type').notNull().default('authenticated'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  notificationPrefs: jsonb('notification_prefs')
    .$type<{ deadlines: boolean; scholarships: boolean; advisorDigest: boolean }>()
    .default({ deadlines: true, scholarships: true, advisorDigest: false }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  isoCode: text('iso_code').notNull().unique(),
  isoNumeric: text('iso_numeric').notNull(),
  name: text('name').notNull(),
  continent: text('continent').notNull(),
  capital: text('capital').notNull(),
  flagEmoji: text('flag_emoji').notNull(),
  educationSystem: text('education_system').notNull(),
  admissionSystem: text('admission_system').notNull(),
  languageRequirements: text('language_requirements').notNull(),
  internationalInfo: text('international_info').notNull(),
  academicOpportunities: text('academic_opportunities').notNull(),
  tuitionRangeMinUsd: integer('tuition_range_min_usd'),
  tuitionRangeMaxUsd: integer('tuition_range_max_usd'),
  livingCostMonthlyMinUsd: integer('living_cost_monthly_min_usd'),
  livingCostMonthlyMaxUsd: integer('living_cost_monthly_max_usd'),
  officialPortalUrl: text('official_portal_url').notNull(),
  sourceOrg: text('source_org').notNull(),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  verifiedAt: text('verified_at').notNull(),
  academicYear: text('academic_year').notNull(),
});

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  countryCode: text('country_code')
    .notNull()
    .references(() => countries.isoCode),
  name: text('name').notNull(),
  region: text('region').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  population: integer('population'),
  studentPopulation: integer('student_population'),
  monthlyLivingMinUsd: integer('monthly_living_min_usd').notNull(),
  monthlyLivingMaxUsd: integer('monthly_living_max_usd').notNull(),
  housingMonthlyUsd: integer('housing_monthly_usd').notNull(),
  foodMonthlyUsd: integer('food_monthly_usd').notNull(),
  transportMonthlyUsd: integer('transport_monthly_usd').notNull(),
  insuranceAnnualUsd: integer('insurance_annual_usd').notNull(),
  currencyCode: text('currency_code').notNull(),
  academicProfile: text('academic_profile').notNull(),
  architecturalMotif: text('architectural_motif').notNull(),
  officialTourismUrl: text('official_tourism_url').notNull(),
  sourceOrg: text('source_org').notNull(),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  verifiedAt: text('verified_at').notNull(),
});

export const universities = pgTable('universities', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  citySlug: text('city_slug')
    .notNull()
    .references(() => cities.slug),
  countryCode: text('country_code')
    .notNull()
    .references(() => countries.isoCode),
  foundedYear: integer('founded_year'),
  institutionType: text('institution_type').notNull(),
  officialWebsite: text('official_website').notNull(),
  officialMediaUrl: text('official_media_url').notNull(),
  officialApplicationUrl: text('official_application_url').notNull(),
  primaryLanguage: text('primary_language').notNull(),
  studentCount: integer('student_count'),
  internationalRatioPct: real('international_ratio_pct'),
  tuitionAnnualMinUsd: integer('tuition_annual_min_usd'),
  tuitionAnnualMaxUsd: integer('tuition_annual_max_usd'),
  tuitionCurrency: text('tuition_currency').notNull(),
  tuitionLocalDisplay: text('tuition_local_display').notNull(),
  overview: text('overview').notNull(),
  facultiesJson: jsonb('faculties_json').$type<string[]>().notNull().default([]),
  departmentsJson: jsonb('departments_json').$type<string[]>().notNull().default([]),
  researchAreasJson: jsonb('research_areas_json').$type<string[]>().notNull().default([]),
  facilitiesJson: jsonb('facilities_json').$type<string[]>().notNull().default([]),
  academicStrengthsJson: jsonb('academic_strengths_json').$type<string[]>().notNull().default([]),
  internationalInfo: text('international_info').notNull(),
  monogram: text('monogram').notNull(),
  accentHue: text('accent_hue').notNull(),
  architecturalMotif: text('architectural_motif').notNull(),
  sourceOrg: text('source_org').notNull(),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  verifiedAt: text('verified_at').notNull(),
  academicYear: text('academic_year').notNull(),
});

export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  universitySlug: text('university_slug')
    .notNull()
    .references(() => universities.slug),
  name: text('name').notNull(),
  discipline: text('discipline').notNull(),
  degreeLevel: text('degree_level').notNull(),
  language: text('language').notNull(),
  durationYears: real('duration_years').notNull(),
  tuitionAnnualUsd: integer('tuition_annual_usd'),
  overview: text('overview').notNull(),
  careerOutcomes: text('career_outcomes').notNull(),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  academicYear: text('academic_year').notNull(),
});

export const rankings = pgTable('rankings', {
  id: serial('id').primaryKey(),
  universitySlug: text('university_slug')
    .notNull()
    .references(() => universities.slug),
  provider: text('provider').notNull(),
  publicationYear: integer('publication_year').notNull(),
  worldRank: integer('world_rank').notNull(),
  worldRankDisplay: text('world_rank_display').notNull(),
  subjectArea: text('subject_area').notNull().default('Overall'),
  subjectRank: integer('subject_rank'),
  historicalRanksJson: jsonb('historical_ranks_json')
    .$type<Array<{ year: number; rank: number }>>()
    .notNull()
    .default([]),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
});

export const scholarships = pgTable('scholarships', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  countryCode: text('country_code')
    .notNull()
    .references(() => countries.isoCode),
  eligibleUniversitySlugsJson: jsonb('eligible_university_slugs_json')
    .$type<string[]>()
    .notNull()
    .default([]),
  degreeLevelsJson: jsonb('degree_levels_json').$type<string[]>().notNull().default([]),
  deadlineText: text('deadline_text').notNull(),
  coverageSummary: text('coverage_summary').notNull(),
  coverageAmountUsd: integer('coverage_amount_usd'),
  eligibilityCriteriaJson: jsonb('eligibility_criteria_json')
    .$type<string[]>()
    .notNull()
    .default([]),
  requiredDocumentsJson: jsonb('required_documents_json')
    .$type<string[]>()
    .notNull()
    .default([]),
  officialUrl: text('official_url').notNull(),
  sourceUrl: text('source_url').notNull(),
  fundingType: text('funding_type').notNull().default('full'),
  applicationStatus: text('application_status').notNull().default('recurring_unconfirmed'),
  eligibleNationalitiesJson: jsonb('eligible_nationalities_json')
    .$type<string[]>()
    .notNull()
    .default(['All international applicants']),
  eligibleFieldsJson: jsonb('eligible_fields_json')
    .$type<string[]>()
    .notNull()
    .default(['All disciplines']),
  verificationStatus: text('verification_status').notNull().default('verified'),
  verifiedAt: text('verified_at').notNull(),
  academicYear: text('academic_year').notNull(),
});

export const admissionRequirements = pgTable('admission_requirements', {
  id: serial('id').primaryKey(),
  universitySlug: text('university_slug')
    .notNull()
    .references(() => universities.slug),
  degreeLevel: text('degree_level').notNull(),
  academicQualifications: text('academic_qualifications').notNull(),
  languageTests: text('language_tests').notNull(),
  standardizedTests: text('standardized_tests').notNull(),
  requiredDocumentsJson: jsonb('required_documents_json')
    .$type<string[]>()
    .notNull()
    .default([]),
  applicationDeadline: text('application_deadline').notNull(),
  entranceExamInfo: text('entrance_exam_info').notNull(),
  applicationProcess: text('application_process').notNull(),
  portalUrl: text('portal_url').notNull(),
  sourceUrl: text('source_url').notNull(),
  verificationStatus: text('verification_status').notNull().default('verified'),
  verifiedAt: text('verified_at').notNull(),
  academicYear: text('academic_year').notNull(),
});

export const savedUniversities = pgTable(
  'saved_universities',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    universitySlug: text('university_slug')
      .notNull()
      .references(() => universities.slug),
    collectionName: text('collection_name').notNull().default('Shortlist'),
    priority: text('priority').notNull().default('Target'),
    applicationStatus: text('application_status').notNull().default('Researching'),
    personalNotes: text('personal_notes').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('saved_universities_user_uni_idx').on(table.userUid, table.universitySlug),
  ]
);

export const userJourneyTasks = pgTable('user_journey_tasks', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default('Milestone'),
  targetUniversitySlug: text('target_university_slug'),
  dueDate: text('due_date'),
  status: text('status').notNull().default('pending'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userAdmissionChecklists = pgTable(
  'user_admission_checklists',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    universitySlug: text('university_slug')
      .notNull()
      .references(() => universities.slug),
    requirementKey: text('requirement_key').notNull(),
    label: text('label').notNull(),
    completed: boolean('completed').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('user_checklist_unique_idx').on(
      table.userUid,
      table.universitySlug,
      table.requirementKey
    ),
  ]
);

export const userScholarships = pgTable(
  'user_scholarships',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    scholarshipSlug: text('scholarship_slug')
      .notNull()
      .references(() => scholarships.slug),
    status: text('status').notNull().default('Saved'),
    notes: text('notes').notNull().default(''),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('user_scholarships_unique_idx').on(table.userUid, table.scholarshipSlug),
  ]
);

export const researchResources = pgTable('research_resources', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull().default(''),
  folder: text('folder').notNull().default('General Research'),
  tagsJson: jsonb('tags_json').$type<string[]>().notNull().default([]),
  universitySlug: text('university_slug'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userNotifications = pgTable('user_notifications', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull().default('System'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptionRecords = pgTable('subscription_records', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .unique()
    .references(() => users.uid, { onDelete: 'cascade' }),
  tier: text('tier').notNull().default('free'),
  status: text('status').notNull().default('active'),
  provider: text('provider').notNull().default('none'),
  billingCycle: text('billing_cycle').notNull().default('monthly'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const paperJournalStates = pgTable('paper_journal_states', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .unique()
    .references(() => users.uid, { onDelete: 'cascade' }),
  stateJson: jsonb('state_json').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const researchLibraryWorkspaces = pgTable('research_library_workspaces', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .unique()
    .references(() => users.uid, { onDelete: 'cascade' }),
  stateJson: jsonb('state_json').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userWorkspaceExtensions = pgTable('user_workspace_extensions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .unique()
    .references(() => users.uid, { onDelete: 'cascade' }),
  stateJson: jsonb('state_json').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const universityAliases = pgTable(
  'university_aliases',
  {
    id: serial('id').primaryKey(),
    universitySlug: text('university_slug').notNull(),
    alias: text('alias').notNull(),
    normalizedAlias: text('normalized_alias').notNull(),
    aliasType: text('alias_type').notNull().default('common'),
    language: text('language').notNull().default('en'),
  },
  (table) => [
    uniqueIndex('uni_aliases_slug_norm_idx').on(table.universitySlug, table.normalizedAlias),
    index('uni_aliases_norm_idx').on(table.normalizedAlias),
  ]
);

export const globalSyncLogs = pgTable(
  'global_sync_logs',
  {
    id: serial('id').primaryKey(),
    sourceName: text('source_name').notNull(),
    scopeKey: text('scope_key').notNull(),
    status: text('status').notNull().default('success'),
    recordsProcessed: integer('records_processed').notNull().default(0),
    errorMessage: text('error_message').notNull().default(''),
    syncedAt: timestamp('synced_at').defaultNow().notNull(),
  },
  (table) => [index('global_sync_logs_source_idx').on(table.sourceName, table.syncedAt)]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  savedUniversities: many(savedUniversities),
  journeyTasks: many(userJourneyTasks),
  admissionChecklists: many(userAdmissionChecklists),
  savedScholarships: many(userScholarships),
  researchResources: many(researchResources),
  notifications: many(userNotifications),
  subscription: one(subscriptionRecords, {
    fields: [users.uid],
    references: [subscriptionRecords.userUid],
  }),
  paperJournal: one(paperJournalStates, {
    fields: [users.uid],
    references: [paperJournalStates.userUid],
  }),
  researchLibraryWorkspace: one(researchLibraryWorkspaces, {
    fields: [users.uid],
    references: [researchLibraryWorkspaces.userUid],
  }),
  workspaceExtensions: one(userWorkspaceExtensions, {
    fields: [users.uid],
    references: [userWorkspaceExtensions.userUid],
  }),
  payments: many(paymentTransactions),
}));
