import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnnualStudyCost,
  computeChecklistProgress,
  convertCurrencyAmount,
  filterAcademicPrograms,
  SUBSCRIPTION_TIERS,
} from './academicLogic';
import type { ProgramRecord, UniversityRecord } from '../types/domain';

test('calculateAnnualStudyCost sums components and caps scholarship deduction at gross cost', () => {
  const result = calculateAnnualStudyCost({
    tuitionAnnualUsd: 3600,
    housingMonthlyUsd: 800,
    foodMonthlyUsd: 400,
    transportMonthlyUsd: 80,
    insuranceAnnualUsd: 300,
    studyMaterialsAnnualUsd: 450,
    otherExpensesAnnualUsd: 600,
    scholarshipDeductionAnnualUsd: 5000,
    monthsPerAcademicYear: 12,
  });

  assert.equal(result.accommodationUsd, 9600);
  assert.equal(result.foodUsd, 4800);
  assert.equal(result.transportationUsd, 960);
  assert.equal(result.grossAnnualCostUsd, 3600 + 9600 + 4800 + 960 + 300 + 450 + 600);
  assert.equal(result.scholarshipDeductionUsd, 5000);
  assert.equal(result.netAnnualCostUsd, result.grossAnnualCostUsd - 5000);

  const fullScholarship = calculateAnnualStudyCost({
    tuitionAnnualUsd: 1000,
    housingMonthlyUsd: 500,
    foodMonthlyUsd: 200,
    transportMonthlyUsd: 50,
    insuranceAnnualUsd: 100,
    studyMaterialsAnnualUsd: 0,
    otherExpensesAnnualUsd: 0,
    scholarshipDeductionAnnualUsd: 999999,
    monthsPerAcademicYear: 10,
  });

  assert.equal(fullScholarship.netAnnualCostUsd, 0);
  assert.equal(fullScholarship.scholarshipDeductionUsd, fullScholarship.grossAnnualCostUsd);
});

test('convertCurrencyAmount converts cleanly with fallback for unknown currencies', () => {
  const rates = { USD: 1, EUR: 0.92, JPY: 152.4, UZS: 12800 };
  assert.equal(convertCurrencyAmount(1000, 'EUR', rates), 920);
  assert.equal(convertCurrencyAmount(100, 'JPY', rates), 15240);
  assert.equal(convertCurrencyAmount(500, 'UNKNOWN', rates), 500);
});

test('filterAcademicPrograms filters accurately by discipline, country, degree, and query', () => {
  const unis: Record<string, UniversityRecord> = {
    mit: {
      slug: 'mit',
      name: 'Massachusetts Institute of Technology',
      shortName: 'MIT',
      citySlug: 'boston-us',
      countryCode: 'US',
      foundedYear: 1861,
      institutionType: 'Private Research',
      officialWebsite: 'https://www.mit.edu/',
      officialMediaUrl: 'https://news.mit.edu/',
      officialApplicationUrl: 'https://mitadmissions.org/',
      primaryLanguage: 'English',
      studentCount: 11920,
      internationalRatioPct: 29,
      tuitionAnnualMinUsd: 61990,
      tuitionAnnualMaxUsd: 61990,
      tuitionCurrency: 'USD',
      tuitionLocalDisplay: '$61,990/yr',
      overview: 'Science and engineering research university.',
      facultiesJson: [],
      departmentsJson: [],
      researchAreasJson: [],
      facilitiesJson: [],
      academicStrengthsJson: [],
      internationalInfo: '',
      monogram: 'MIT',
      accentHue: '#9A3412',
      architecturalMotif: 'dome',
      sourceOrg: 'MIT',
      sourceUrl: 'https://www.mit.edu/',
      verificationStatus: 'verified',
      verifiedAt: '2026-01-15',
      academicYear: '2025-2026',
    },
    'tu-munich': {
      slug: 'tu-munich',
      name: 'Technical University of Munich',
      shortName: 'TUM',
      citySlug: 'munich-de',
      countryCode: 'DE',
      foundedYear: 1868,
      institutionType: 'Public Technical',
      officialWebsite: 'https://www.tum.de/en/',
      officialMediaUrl: 'https://www.tum.de/en/about-tum/our-university',
      officialApplicationUrl: 'https://www.tum.de/en/studies/application',
      primaryLanguage: 'German / English',
      studentCount: 52000,
      internationalRatioPct: 44,
      tuitionAnnualMinUsd: 0,
      tuitionAnnualMaxUsd: 6500,
      tuitionCurrency: 'EUR',
      tuitionLocalDisplay: '€0 (EU) / €4,000–€6,000/sem (Non-EU)',
      overview: 'Leading German technical university.',
      facultiesJson: [],
      departmentsJson: [],
      researchAreasJson: [],
      facilitiesJson: [],
      academicStrengthsJson: [],
      internationalInfo: '',
      monogram: 'TUM',
      accentHue: '#1E3A8A',
      architecturalMotif: 'bavaria',
      sourceOrg: 'TUM',
      sourceUrl: 'https://www.tum.de/en/',
      verificationStatus: 'verified',
      verifiedAt: '2026-01-15',
      academicYear: '2025-2026',
    },
  };

  const progs: ProgramRecord[] = [
    {
      slug: 'mit-ai',
      universitySlug: 'mit',
      name: 'AI & Decision Making',
      discipline: 'Artificial Intelligence',
      degreeLevel: 'Bachelor',
      language: 'English',
      durationYears: 4,
      tuitionAnnualUsd: 61990,
      overview: 'Core AI and machine learning curriculum.',
      careerOutcomes: 'Research scientist, ML engineer',
      sourceUrl: 'https://www.eecs.mit.edu/',
      verificationStatus: 'verified',
      academicYear: '2025-2026',
    },
    {
      slug: 'tum-cs',
      universitySlug: 'tu-munich',
      name: 'Informatics MSc',
      discipline: 'Computer Science',
      degreeLevel: 'Master',
      language: 'English',
      durationYears: 2,
      tuitionAnnualUsd: 4300,
      overview: 'Graduate informatics in Munich.',
      careerOutcomes: 'Software architect',
      sourceUrl: 'https://www.tum.de/',
      verificationStatus: 'verified',
      academicYear: '2025-2026',
    },
  ];

  assert.equal(
    filterAcademicPrograms(progs, unis, { countryCode: 'DE' }).length,
    1
  );
  assert.equal(
    filterAcademicPrograms(progs, unis, { discipline: 'Artificial Intelligence' })[0].slug,
    'mit-ai'
  );
  assert.equal(
    filterAcademicPrograms(progs, unis, { maxTuitionUsd: 10000 })[0].slug,
    'tum-cs'
  );
});

test('computeChecklistProgress calculates percentages safely', () => {
  assert.deepEqual(computeChecklistProgress([]), { completed: 0, total: 0, percent: 0 });
  assert.deepEqual(
    computeChecklistProgress([{ completed: true }, { completed: false }, { completed: true }]),
    { completed: 2, total: 3, percent: 67 }
  );
});

test('subscription tiers define strictly increasing limits', () => {
  assert.equal(SUBSCRIPTION_TIERS.length, 3);
  assert.ok(SUBSCRIPTION_TIERS[0].maxSavedUniversities < SUBSCRIPTION_TIERS[1].maxSavedUniversities);
  assert.ok(SUBSCRIPTION_TIERS[1].aiAdvisorDailyLimit < SUBSCRIPTION_TIERS[2].aiAdvisorDailyLimit);
});
