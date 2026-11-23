import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyScholarshipStatus,
  correctQueryTokens,
  deduplicateUniversities,
  isSafeExternalUrl,
  normalizeSearchText,
  rankGlobalCountries,
  rankGlobalUniversities,
  stringSimilarity,
} from './globalSearchEngine';
import type { GlobalCountrySummary, GlobalUniversitySummary } from '../types/domain';

function makeUni(overrides: Partial<GlobalUniversitySummary>): GlobalUniversitySummary {
  return {
    slug: 'test-uni',
    name: 'Test University',
    shortName: 'TestU',
    aliases: [],
    acronyms: [],
    countryCode: 'JP',
    countryName: 'Japan',
    countryFlag: '🇯🇵',
    continent: 'Asia',
    cityName: 'Tokyo',
    citySlug: 'tokyo-jp',
    latitude: 35.68,
    longitude: 139.76,
    institutionType: 'Public',
    officialWebsite: 'https://example.edu',
    rorId: null,
    openAlexId: null,
    worksCount: 1000,
    citedByCount: 10000,
    foundedYear: 1900,
    primaryLanguage: 'English',
    tuitionLocalDisplay: null,
    tuitionAnnualMinUsd: null,
    tuitionAnnualMaxUsd: null,
    qsRankDisplay: null,
    qsRankNumeric: null,
    theRankDisplay: null,
    theRankNumeric: null,
    topTopics: [],
    imageUrl: null,
    sourceName: 'Test',
    sourceUrl: null,
    verificationStatus: 'verified',
    isSeededCatalog: true,
    ...overrides,
  };
}

test('normalizeSearchText folds accents, punctuation, and whitespace', () => {
  assert.equal(normalizeSearchText('  München — Universität  '), 'munchen universitat');
  assert.equal(normalizeSearchText("O'zbekiston!"), 'ozbekiston');
});

test('correctQueryTokens handles typos, acronyms, and local transliterations', () => {
  const typo = correctQueryTokens('Univercity of Tokio');
  assert.equal(typo.corrected, 'university of tokyo');
  assert.equal(typo.hadCorrection, true);

  const kyutech = correctQueryTokens('Kyutech');
  assert.ok(
    kyutech.expandedCanonical?.toLowerCase().includes('kyushu institute of technology'),
    `Expected Kyutech to expand to Kyushu Institute of Technology, got ${kyutech.expandedCanonical}`
  );

  const daigaku = correctQueryTokens('Tokyo daigaku');
  assert.ok(
    daigaku.expandedCanonical?.toLowerCase().includes('university of tokyo'),
    `Expected Tokyo daigaku to expand to University of Tokyo, got ${daigaku.expandedCanonical}`
  );
});

test('rankGlobalUniversities handles exact, alias, typo, and geographic matching', () => {
  const pool: GlobalUniversitySummary[] = [
    makeUni({
      slug: 'university-of-tokyo',
      name: 'The University of Tokyo',
      shortName: 'UTokyo',
      aliases: ['Tokyo Daigaku', 'Todai', '東京大学'],
      acronyms: ['UTokyo', 'UT'],
      cityName: 'Tokyo',
      qsRankNumeric: 32,
      qsRankDisplay: '#32',
    }),
    makeUni({
      slug: 'kyushu-institute-of-technology',
      name: 'Kyushu Institute of Technology',
      shortName: 'Kyutech',
      aliases: ['Kyutech', 'Kyushu Kogyo Daigaku'],
      acronyms: ['KIT', 'Kyutech'],
      cityName: 'Kitakyushu',
      worksCount: 15000,
    }),
    makeUni({
      slug: 'kyushu-university',
      name: 'Kyushu University',
      shortName: 'Kyudai',
      aliases: ['Kyudai'],
      acronyms: ['KU'],
      cityName: 'Fukuoka',
      qsRankNumeric: 167,
      qsRankDisplay: '#167',
    }),
  ];

  // Exact / typo match: "Univercity of Tokyo"
  const typoRes = rankGlobalUniversities(pool, 'Univercity of Tokyo');
  assert.equal(typoRes.results[0]?.slug, 'university-of-tokyo');

  // Acronym / alias match: "Kyutech"
  const aliasRes = rankGlobalUniversities(pool, 'Kyutech');
  assert.equal(aliasRes.results[0]?.slug, 'kyushu-institute-of-technology');

  // Typo match: "Kyushu Institute of Technlogy"
  const techTypoRes = rankGlobalUniversities(pool, 'Kyushu Institute of Technlogy');
  assert.equal(techTypoRes.results[0]?.slug, 'kyushu-institute-of-technology');

  // Transliteration match: "Tokyo daigaku"
  const transRes = rankGlobalUniversities(pool, 'Tokyo daigaku');
  assert.equal(transRes.results[0]?.slug, 'university-of-tokyo');

  // City / geographic match: "Fukuoka"
  const cityRes = rankGlobalUniversities(pool, 'Fukuoka');
  assert.equal(cityRes.results[0]?.slug, 'kyushu-university');
});

test('deduplicateUniversities merges duplicate institutions across OpenAlex/ROR/Catalog', () => {
  const seeded = makeUni({
    slug: 'university-of-tokyo',
    name: 'The University of Tokyo',
    officialWebsite: 'https://www.u-tokyo.ac.jp/en/',
    isSeededCatalog: true,
    qsRankNumeric: 32,
    qsRankDisplay: '#32',
  });
  const openAlexDup = makeUni({
    slug: 'oa-i74801974',
    name: 'University of Tokyo',
    officialWebsite: 'https://www.u-tokyo.ac.jp',
    isSeededCatalog: false,
    openAlexId: 'https://openalex.org/I74801974',
    worksCount: 250000,
    citedByCount: 6000000,
  });

  const merged = deduplicateUniversities([seeded, openAlexDup]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].slug, 'university-of-tokyo');
  assert.equal(merged[0].qsRankNumeric, 32);
  assert.equal(merged[0].openAlexId, 'https://openalex.org/I74801974');
  assert.equal(merged[0].worksCount, 250000);
});

test('rankGlobalCountries finds countries by ISO code, local name, and typo', () => {
  const countries: GlobalCountrySummary[] = [
    {
      isoCode: 'JP',
      isoNumeric: '392',
      name: 'Japan',
      continent: 'Asia',
      flagEmoji: '🇯🇵',
      capital: 'Tokyo',
      totalVerifiedUniversities: 920,
      seededUniversityCount: 4,
      isSeededDossier: true,
      tuitionRangeMinUsd: 3500,
      tuitionRangeMaxUsd: 12000,
      livingCostMonthlyMinUsd: 900,
      livingCostMonthlyMaxUsd: 1600,
      educationSystem: null,
      admissionSystem: null,
      languageRequirements: null,
      internationalInfo: null,
      academicOpportunities: null,
      officialPortalUrl: null,
      sourceOrg: 'MEXT',
      verifiedAt: '2025-01-01',
    },
    {
      isoCode: 'UZ',
      isoNumeric: '860',
      name: 'Uzbekistan',
      continent: 'Asia',
      flagEmoji: '🇺🇿',
      capital: 'Tashkent',
      totalVerifiedUniversities: 145,
      seededUniversityCount: 1,
      isSeededDossier: true,
      tuitionRangeMinUsd: 1500,
      tuitionRangeMaxUsd: 6000,
      livingCostMonthlyMinUsd: 400,
      livingCostMonthlyMaxUsd: 800,
      educationSystem: null,
      admissionSystem: null,
      languageRequirements: null,
      internationalInfo: null,
      academicOpportunities: null,
      officialPortalUrl: null,
      sourceOrg: 'Edu.uz',
      verifiedAt: '2025-01-01',
    },
  ];

  assert.equal(rankGlobalCountries(countries, 'JP')[0]?.isoCode, 'JP');
  assert.equal(rankGlobalCountries(countries, 'Uzbekstan')[0]?.isoCode, 'UZ');
  assert.equal(rankGlobalCountries(countries, 'Tashkent')[0]?.isoCode, 'UZ');
});

test('classifyScholarshipStatus never marks closed or expired scholarships as open', () => {
  const closed = classifyScholarshipStatus('closed', 'Closed for 2024 intake');
  assert.equal(closed.status, 'closed');
  assert.equal(closed.isExpired, true);

  const recurring = classifyScholarshipStatus('recurring_unconfirmed', 'Annual May–June embassy cycle');
  assert.equal(recurring.status, 'recurring_unconfirmed');
  assert.equal(recurring.isExpired, false);

  const expiredByDate = classifyScholarshipStatus('open', 'Deadline: 2023-05-15');
  assert.equal(expiredByDate.status, 'closed');
  assert.equal(expiredByDate.isExpired, true);

  const validOpen = classifyScholarshipStatus('open', 'Rolling applications open for 2027/2028');
  assert.equal(validOpen.status, 'open');
  assert.equal(validOpen.isExpired, false);
});

test('isSafeExternalUrl rejects javascript/data schemes and allows https', () => {
  assert.equal(isSafeExternalUrl('https://www.u-tokyo.ac.jp/'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('data:text/html,hi'), false);
  assert.equal(isSafeExternalUrl(''), false);
});

test('stringSimilarity ranks closer spellings higher', () => {
  const s1 = stringSimilarity('kyushu institute of technlogy', 'kyushu institute of technology');
  const s2 = stringSimilarity('kyushu institute of technlogy', 'harvard university');
  assert.ok(s1 > 0.9, `Expected >0.9 similarity, got ${s1}`);
  assert.ok(s1 > s2);
});
