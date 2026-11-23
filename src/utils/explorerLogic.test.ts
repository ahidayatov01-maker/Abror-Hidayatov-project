import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildYouTubeSearchQueries,
  filterGlobalUniversities,
  isTgfuPriorityUniversity,
  parseDurationToSeconds,
  scoreYouTubeCandidate,
  selectFeaturedUniversity,
  sortCountryUniversitiesWithPriority,
  VERIFIED_UNIVERSITY_CAMPUS_META,
} from './explorerLogic';
import {
  getCuratedFallbackCampusImage,
  getUniversityCampusImageUrl,
  SEED_UNIVERSITIES,
} from '../data/seedCatalog';
import type { CityRecord, CountryRecord, RankingRecord, UniversityRecord } from '../types/domain';

const sampleUnis: UniversityRecord[] = [
  {
    slug: 'uni-alpha',
    name: 'Alpha Institute of Technology',
    shortName: 'AlphaTech',
    citySlug: 'city-a',
    countryCode: 'DE',
    foundedYear: 1868,
    institutionType: 'Public Research',
    officialWebsite: 'https://example.edu/alpha',
    officialMediaUrl: 'https://example.edu/alpha/media',
    officialApplicationUrl: 'https://example.edu/alpha/apply',
    primaryLanguage: 'English / German',
    studentCount: 42000,
    internationalRatioPct: 32,
    tuitionAnnualMinUsd: 0,
    tuitionAnnualMaxUsd: 4000,
    tuitionCurrency: 'EUR',
    tuitionLocalDisplay: '€0–€4,000/yr',
    overview: 'Engineering and AI research leader.',
    facultiesJson: ['Informatics'],
    departmentsJson: ['Computer Science'],
    researchAreasJson: ['Robotics', 'Autonomous Systems'],
    facilitiesJson: ['Main Robotics Hall'],
    academicStrengthsJson: ['Engineering', 'Artificial Intelligence'],
    internationalInfo: 'English MSc options available.',
    monogram: 'AIT',
    accentHue: '#0284c7',
    architecturalMotif: 'default',
    sourceOrg: 'Official',
    sourceUrl: 'https://example.edu/alpha',
    verificationStatus: 'verified',
    verifiedAt: '2026-02-01',
    academicYear: '2025-2026',
  },
  {
    slug: 'uni-beta',
    name: 'Beta Classical University',
    shortName: 'BetaU',
    citySlug: 'city-b',
    countryCode: 'DE',
    foundedYear: 1472,
    institutionType: 'Public Comprehensive',
    officialWebsite: 'https://example.edu/beta',
    officialMediaUrl: 'https://example.edu/beta/media',
    officialApplicationUrl: 'https://example.edu/beta/apply',
    primaryLanguage: 'German',
    studentCount: 51000,
    internationalRatioPct: 18,
    tuitionAnnualMinUsd: 0,
    tuitionAnnualMaxUsd: 300,
    tuitionCurrency: 'EUR',
    tuitionLocalDisplay: '€170/semester',
    overview: 'Comprehensive university.',
    facultiesJson: ['Medicine'],
    departmentsJson: ['Biomedicine'],
    researchAreasJson: ['Life Sciences'],
    facilitiesJson: ['Old Library'],
    academicStrengthsJson: ['Medicine', 'Humanities'],
    internationalInfo: 'Bologna Bachelor and Master.',
    monogram: 'BU',
    accentHue: '#0f766e',
    architecturalMotif: 'default',
    sourceOrg: 'Official',
    sourceUrl: 'https://example.edu/beta',
    verificationStatus: 'verified',
    verifiedAt: '2026-02-01',
    academicYear: '2025-2026',
  },
];

const sampleRankings: RankingRecord[] = [
  {
    universitySlug: 'uni-alpha',
    provider: 'QS World University Rankings',
    publicationYear: 2026,
    worldRank: 22,
    worldRankDisplay: '#22',
    subjectArea: 'Overall',
    subjectRank: null,
    historicalRanksJson: [{ year: 2026, rank: 22 }],
    sourceUrl: 'https://www.topuniversities.com/',
    verificationStatus: 'verified',
  },
  {
    universitySlug: 'uni-beta',
    provider: 'Times Higher Education',
    publicationYear: 2026,
    worldRank: 38,
    worldRankDisplay: '#38',
    subjectArea: 'Overall',
    subjectRank: null,
    historicalRanksJson: [{ year: 2026, rank: 38 }],
    sourceUrl: 'https://www.timeshighereducation.com/',
    verificationStatus: 'verified',
  },
];

test('selectFeaturedUniversity picks leader deterministically with transparent methodology', () => {
  const result = selectFeaturedUniversity(sampleUnis, sampleRankings);
  assert.equal(result.university?.slug, 'uni-alpha');
  assert.equal(result.primaryRanking?.provider, 'QS World University Rankings');
  assert.ok(result.methodologySummary.includes('2026'));
  assert.ok(result.methodologySummary.includes('#22'));
});

test('filterGlobalUniversities searches across university name, city, country, and specialization', () => {
  const citiesBySlug = {
    'city-a': { slug: 'city-a', name: 'Munich' } as CityRecord,
    'city-b': { slug: 'city-b', name: 'Heidelberg' } as CityRecord,
  };
  const countriesByCode = {
    DE: { isoCode: 'DE', name: 'Germany' } as CountryRecord,
  };

  assert.equal(
    filterGlobalUniversities({
      universities: sampleUnis,
      citiesBySlug,
      countriesByCode,
      query: 'Robotics',
    }).length,
    1
  );
  assert.equal(
    filterGlobalUniversities({
      universities: sampleUnis,
      citiesBySlug,
      countriesByCode,
      query: 'Munich',
    })[0].slug,
    'uni-alpha'
  );
  assert.equal(
    filterGlobalUniversities({
      universities: sampleUnis,
      citiesBySlug,
      countriesByCode,
      query: '',
      discipline: 'Medicine',
    })[0].slug,
    'uni-beta'
  );
});

test('scoreYouTubeCandidate filters irrelevant videos and shorts while prioritizing authentic campus drone footage', () => {
  assert.equal(parseDurationToSeconds('0:35'), 35);
  assert.equal(parseDurationToSeconds('9:42'), 582);

  const droneScore = scoreYouTubeCandidate(
    {
      id: '0YbKlbrvBAw',
      title: 'Massachusetts Institute of Technology | MIT | 8K Campus Drone Tour',
      channel: 'CampusMania',
      length: '10:08',
    },
    {
      universityName: 'Massachusetts Institute of Technology',
      shortName: 'MIT',
      city: 'Cambridge',
      category: 'aerial',
    }
  );
  assert.ok(droneScore.score > 50);

  const shortScore = scoreYouTubeCandidate(
    {
      id: 'abc12345678',
      title: 'MIT campus #shorts',
      channel: 'RandomChannel',
      length: '0:28',
    },
    {
      universityName: 'Massachusetts Institute of Technology',
      shortName: 'MIT',
      category: 'aerial',
    }
  );
  assert.ok(shortScore.score < 0);

  const unrelatedScore = scoreYouTubeCandidate(
    {
      id: 'xyz12345678',
      title: 'Amazing tropical islands 4K drone footage',
      channel: 'NatureRelax',
      length: '8:15',
    },
    {
      universityName: 'University of Oxford',
      shortName: 'Oxford',
      category: 'aerial',
    }
  );
  assert.ok(unrelatedScore.score < 0);

  const roboticsDroneDemo = scoreYouTubeCandidate(
    {
      id: '4vdSUKNn0B0',
      title: 'University of Tokyo Researchers Create Transforming DRAGON Drone',
      channel: 'Car Curiosity',
      length: '4:13',
    },
    {
      universityName: 'The University of Tokyo',
      shortName: 'UTokyo',
      city: 'Tokyo',
      category: 'aerial',
    }
  );
  const realCampusTour = scoreYouTubeCandidate(
    {
      id: 'k1234567890',
      title: 'University of Tokyo Hongo Campus 4K Drone Aerial Tour',
      channel: 'UTokyo Official',
      length: '5:20',
    },
    {
      universityName: 'The University of Tokyo',
      shortName: 'UTokyo',
      city: 'Tokyo',
      category: 'aerial',
    }
  );
  assert.ok(realCampusTour.score > roboticsDroneDemo.score + 40);

  const queries = buildYouTubeSearchQueries({
    universityName: 'University of Oxford',
    shortName: 'Oxford',
    city: 'Oxford',
  });
  assert.equal(queries.length, 4);
});

test('Uzbekistan university sorting and featured selection strictly prioritize TGFU first with Tashkent coordinates', () => {
  const uzbekList: UniversityRecord[] = [
    {
      ...sampleUnis[0],
      slug: 'nuuz-tashkent',
      name: 'National University of Uzbekistan (NUUz)',
      shortName: 'NUUz',
      citySlug: 'tashkent-uz',
      countryCode: 'UZ',
    },
    {
      ...sampleUnis[1],
      slug: 'tgfu-tashkent',
      name: 'Toshkent Gumanitar Fanlar Universiteti (TGFU)',
      shortName: 'TGFU',
      citySlug: 'tashkent-uz',
      countryCode: 'UZ',
    },
    {
      ...sampleUnis[0],
      slug: 'university-of-tokyo',
      name: 'The University of Tokyo',
      shortName: 'UTokyo',
      citySlug: 'tokyo-jp',
      countryCode: 'JP',
    },
  ];

  const sortedUz = sortCountryUniversitiesWithPriority(uzbekList, 'UZ');
  assert.equal(sortedUz.length, 2);
  assert.equal(sortedUz[0].slug, 'tgfu-tashkent');
  assert.equal(sortedUz[0].shortName, 'TGFU');
  assert.equal(sortedUz[1].slug, 'nuuz-tashkent');
  assert.equal(isTgfuPriorityUniversity(sortedUz[0]), true);

  const featuredUz = selectFeaturedUniversity(sortedUz, []);
  assert.equal(featuredUz.university?.slug, 'tgfu-tashkent');

  const tgfuMeta = VERIFIED_UNIVERSITY_CAMPUS_META['tgfu-tashkent'];
  assert.ok(tgfuMeta);
  assert.ok(Math.abs(tgfuMeta.latitude - 41.2995) < 0.05);
  assert.ok(Math.abs(tgfuMeta.longitude - 69.2401) < 0.05);
  assert.ok(tgfuMeta.logoUrl && tgfuMeta.logoUrl.startsWith('https://'));

  // Official @tgfu_rasmiy video scores high while TGfU SIG conference is rejected
  const officialTgfuVid = scoreYouTubeCandidate(
    {
      id: 'FXxUh1ELE4Y',
      title: 'TGFU haqida bilasizmi?',
      channel: 'Toshkent Gumanitar Fanlar Universiteti',
      channelUrl: 'https://www.youtube.com/@tgfu_rasmiy',
      length: '3:02',
    },
    {
      universityName: 'Toshkent Gumanitar Fanlar Universiteti (TGFU)',
      shortName: 'TGFU',
      city: 'Tashkent',
      category: 'official',
    }
  );
  assert.equal(officialTgfuVid.isOfficialChannel, true);
  assert.ok(officialTgfuVid.score >= 50);

  const unrelatedConference = scoreYouTubeCandidate(
    {
      id: 'h2dA19M9zlU',
      title: 'TGfU SIG 40th Anniversary Conference- SueSee & Pill',
      channel: 'TGfU SIG',
      length: '13:40',
    },
    {
      universityName: 'Toshkent Gumanitar Fanlar Universiteti (TGFU)',
      shortName: 'TGFU',
      city: 'Tashkent',
      category: 'official',
    }
  );
  assert.ok(unrelatedConference.score < 0);
});

test('every university in SEED_UNIVERSITIES has a verified campus imageUrl and fallback image resolver', () => {
  assert.ok(SEED_UNIVERSITIES.length >= 23);
  for (const uni of SEED_UNIVERSITIES) {
    assert.ok(
      uni.imageUrl && uni.imageUrl.startsWith('https://'),
      `Missing or invalid imageUrl for ${uni.slug}`
    );
    const resolved = getUniversityCampusImageUrl(uni.slug, uni.imageUrl);
    assert.equal(resolved, uni.imageUrl);
    const fallback = getCuratedFallbackCampusImage(uni.slug);
    assert.ok(fallback.startsWith('/src/assets/images/'));
  }
});


