import type {
  CityRecord,
  CountryRecord,
  RankingRecord,
  UniversityRecord,
} from '../types/domain';

export type VideoCategory = 'aerial' | 'walkthrough' | 'official' | 'student_life';

export interface ExplorerVideoItem {
  id: string;
  category: VideoCategory;
  title: string;
  publisher: string;
  publisherUrl: string;
  publishedAtText: string;
  durationText: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
  isOfficialChannel: boolean;
}

export interface DynamicUniversityItem {
  slug: string;
  name: string;
  shortName: string;
  countryCode: string;
  countryName: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  officialWebsite: string;
  imageUrl: string | null;
  worksCount: number;
  citedByCount: number;
  researchAreas: string[];
  summary: string;
  sourceOrg: string;
  sourceUrl: string;
  isSeededCatalog: boolean;
}

export interface YouTubeRawCandidate {
  id: string;
  title: string;
  channel: string;
  channelUrl?: string;
  published?: string;
  length?: string;
}

export interface VerifiedUniversityCampusMeta {
  latitude: number;
  longitude: number;
  campusAddress: string;
  logoUrl: string | null;
}

export const VERIFIED_UNIVERSITY_CAMPUS_META: Record<string, VerifiedUniversityCampusMeta> = {
  'tgfu-tashkent': {
    latitude: 41.2995,
    longitude: 69.2401,
    campusAddress: 'Tashkent City, Republic of Uzbekistan (State Accreditation License №222840)',
    logoUrl:
      'https://yt3.googleusercontent.com/BW5LM32ZoDnclRjgyjAo2U2_3cNX0y5Ya9rfSi-rtIi5L4wDAVdngFyEv8E7Rhe4VPiWChZ6NQ=s900-c-k-c0x00ffffff-no-rj',
  },
  'nuuz-tashkent': {
    latitude: 41.3514,
    longitude: 69.2045,
    campusAddress: '4 Universitet Street, Vuzgorodok, Almazar District, Tashkent 100174, Uzbekistan',
    logoUrl: null,
  },
  'tuit-tashkent': {
    latitude: 41.3408,
    longitude: 69.2868,
    campusAddress: '108 Amir Temur Avenue, Yunusabad District, Tashkent 100084, Uzbekistan',
    logoUrl: null,
  },
  'university-of-tokyo': {
    latitude: 35.7127,
    longitude: 139.762,
    campusAddress: '7-3-1 Hongo, Bunkyo-ku, Tokyo 113-8654, Japan',
    logoUrl: null,
  },
  'kyoto-university': {
    latitude: 35.0262,
    longitude: 135.7808,
    campusAddress: 'Yoshida-honmachi, Sakyo-ku, Kyoto 606-8501, Japan',
    logoUrl: null,
  },
  'science-tokyo': {
    latitude: 35.6048,
    longitude: 139.6836,
    campusAddress: '2-12-1 Ookayama, Meguro-ku, Tokyo 152-8550, Japan',
    logoUrl: null,
  },
  'university-of-oxford': {
    latitude: 51.7548,
    longitude: -1.2544,
    campusAddress: 'University Offices, Wellington Square, Oxford OX1 2JD, United Kingdom',
    logoUrl: null,
  },
  'university-of-cambridge': {
    latitude: 52.2043,
    longitude: 0.1149,
    campusAddress: 'The Old Schools, Trinity Lane, Cambridge CB2 1TN, United Kingdom',
    logoUrl: null,
  },
  'imperial-college-london': {
    latitude: 51.4988,
    longitude: -0.1749,
    campusAddress: 'Exhibition Road, South Kensington, London SW7 2AZ, United Kingdom',
    logoUrl: null,
  },
  ucl: {
    latitude: 51.5246,
    longitude: -0.134,
    campusAddress: 'Gower Street, Bloomsbury, London WC1E 6BT, United Kingdom',
    logoUrl: null,
  },
  mit: {
    latitude: 42.3601,
    longitude: -71.0942,
    campusAddress: '77 Massachusetts Avenue, Cambridge, MA 02139, United States',
    logoUrl: null,
  },
  'stanford-university': {
    latitude: 37.4275,
    longitude: -122.1697,
    campusAddress: '450 Jane Stanford Way, Stanford, CA 94305, United States',
    logoUrl: null,
  },
  'harvard-university': {
    latitude: 42.377,
    longitude: -71.1167,
    campusAddress: 'Massachusetts Hall, Cambridge, MA 02138, United States',
    logoUrl: null,
  },
  'eth-zurich': {
    latitude: 47.3763,
    longitude: 8.5477,
    campusAddress: 'Rämistrasse 101, 8092 Zürich, Switzerland',
    logoUrl: null,
  },
  'tu-munich': {
    latitude: 48.1497,
    longitude: 11.5679,
    campusAddress: 'Arcisstraße 21, 80333 München, Germany',
    logoUrl: null,
  },
  'lmu-munich': {
    latitude: 48.1508,
    longitude: 11.5802,
    campusAddress: 'Geschwister-Scholl-Platz 1, 80539 München, Germany',
    logoUrl: null,
  },
  'seoul-national-university': {
    latitude: 37.4599,
    longitude: 126.9519,
    campusAddress: '1 Gwanak-ro, Gwanak-gu, Seoul 08826, South Korea',
    logoUrl: null,
  },
  'korea-university': {
    latitude: 37.5894,
    longitude: 127.0323,
    campusAddress: '145 Anam-ro, Seongbuk-gu, Seoul 02841, South Korea',
    logoUrl: null,
  },
  'tsinghua-university': {
    latitude: 40.0023,
    longitude: 116.326,
    campusAddress: '30 Shuangqing Road, Haidian District, Beijing 100084, China',
    logoUrl: null,
  },
  'university-of-toronto': {
    latitude: 43.6629,
    longitude: -79.3957,
    campusAddress: '27 King’s College Circle, Toronto, ON M5S 1A1, Canada',
    logoUrl: null,
  },
  'university-of-melbourne': {
    latitude: -37.7983,
    longitude: 144.961,
    campusAddress: 'Grattan Street, Parkville VIC 3010, Australia',
    logoUrl: null,
  },
  'nus-singapore': {
    latitude: 1.2966,
    longitude: 103.7764,
    campusAddress: '21 Lower Kent Ridge Road, Singapore 119077',
    logoUrl: null,
  },
  'sorbonne-university': {
    latitude: 48.8486,
    longitude: 2.3433,
    campusAddress: '21 Rue de l’École de Médecine, 75006 Paris, France',
    logoUrl: null,
  },
};

export function isTgfuPriorityUniversity(uni: {
  slug?: string;
  shortName?: string;
  name?: string;
  countryCode?: string;
}): boolean {
  if (uni.countryCode && uni.countryCode.toUpperCase() !== 'UZ') return false;
  const slugLower = (uni.slug || '').toLowerCase();
  const shortLower = (uni.shortName || '').toLowerCase();
  const nameLower = (uni.name || '').toLowerCase();
  return (
    slugLower === 'tgfu-tashkent' ||
    slugLower.includes('tgfu') ||
    shortLower === 'tgfu' ||
    nameLower.includes('toshkent gumanitar fanlar universiteti') ||
    nameLower.includes('tgfu')
  );
}

export function sortCountryUniversitiesWithPriority<
  T extends { slug: string; shortName: string; name: string; countryCode: string }
>(universities: T[], countryCode?: string): T[] {
  const iso = (countryCode || universities[0]?.countryCode || '').trim().toUpperCase();
  const filtered = countryCode
    ? universities.filter((u) => (u.countryCode || '').toUpperCase() === iso)
    : [...universities];
  if (iso !== 'UZ') return filtered;
  return [...filtered].sort((a, b) => {
    const aPriority = isTgfuPriorityUniversity(a);
    const bPriority = isTgfuPriorityUniversity(b);
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return 0;
  });
}

const RANK_PROVIDER_ORDER: Array<RankingRecord['provider']> = [
  'QS World University Rankings',
  'Times Higher Education',
  'Academic Ranking of World Universities',
];

export function selectFeaturedUniversity(
  universities: UniversityRecord[],
  rankings: RankingRecord[]
): {
  university: UniversityRecord | null;
  primaryRanking: RankingRecord | null;
  methodologySummary: string;
} {
  if (universities.length === 0) {
    return {
      university: null,
      primaryRanking: null,
      methodologySummary: 'No universities stored for this country yet.',
    };
  }

  // Special priority rule for Uzbekistan: TGFU must always be the #1 priority featured university
  const tgfuMatch = universities.find((u) => isTgfuPriorityUniversity(u));
  if (tgfuMatch) {
    return {
      university: tgfuMatch,
      primaryRanking: null,
      methodologySummary:
        'Priority Featured University in Uzbekistan: Toshkent Gumanitar Fanlar Universiteti (TGFU) · Tashkent (State Accreditation License №222840).',
    };
  }

  let bestUni = universities[0];
  let bestRankRecord: RankingRecord | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const uni of universities) {
    const uniRanks = rankings.filter((r) => r.universitySlug === uni.slug);
    if (uniRanks.length === 0) continue;

    // Prefer QS primary, then THE, then ARWU for deterministic ordering
    for (let pIdx = 0; pIdx < RANK_PROVIDER_ORDER.length; pIdx++) {
      const match = uniRanks.find((r) => r.provider === RANK_PROVIDER_ORDER[pIdx]);
      if (match) {
        const compositeScore = match.worldRank * 10 + pIdx;
        if (compositeScore < bestScore) {
          bestScore = compositeScore;
          bestUni = uni;
          bestRankRecord = match;
        }
        break;
      }
    }
  }

  if (!bestRankRecord) {
    return {
      university: bestUni,
      primaryRanking: null,
      methodologySummary:
        'Selected from curated catalog entries; verify latest QS, THE, or ARWU standings directly on official ranking portals.',
    };
  }

  const alternativeLeaders = rankings
    .filter(
      (r) =>
        universities.some((u) => u.slug === r.universitySlug) &&
        r.provider !== bestRankRecord!.provider &&
        r.universitySlug !== bestUni.slug
    )
    .sort((a, b) => a.worldRank - b.worldRank);

  const differsNote =
    alternativeLeaders.length > 0 && alternativeLeaders[0].worldRank <= bestRankRecord.worldRank
      ? ' Other ranking methodologies may highlight different national leaders.'
      : '';

  return {
    university: bestUni,
    primaryRanking: bestRankRecord,
    methodologySummary: `Featured by ${bestRankRecord.provider} (${bestRankRecord.publicationYear} edition: ${bestRankRecord.worldRankDisplay}).${differsNote}`,
  };
}

export function filterGlobalUniversities(params: {
  universities: UniversityRecord[];
  citiesBySlug: Record<string, CityRecord>;
  countriesByCode: Record<string, CountryRecord>;
  query: string;
  discipline?: string;
}): UniversityRecord[] {
  const { universities, citiesBySlug, countriesByCode, query, discipline } = params;
  const q = query.trim().toLowerCase();
  const disc = (discipline || 'All').trim().toLowerCase();

  return universities.filter((u) => {
    if (disc !== 'all' && disc !== '') {
      const matchesDisc =
        u.academicStrengthsJson.some((s) => s.toLowerCase().includes(disc)) ||
        u.researchAreasJson.some((r) => r.toLowerCase().includes(disc)) ||
        u.departmentsJson.some((d) => d.toLowerCase().includes(disc));
      if (!matchesDisc) return false;
    }

    if (!q) return true;
    const city = citiesBySlug[u.citySlug];
    const country = countriesByCode[u.countryCode];
    return (
      u.name.toLowerCase().includes(q) ||
      u.shortName.toLowerCase().includes(q) ||
      u.countryCode.toLowerCase() === q ||
      (country?.name || '').toLowerCase().includes(q) ||
      (city?.name || '').toLowerCase().includes(q) ||
      u.academicStrengthsJson.some((s) => s.toLowerCase().includes(q)) ||
      u.researchAreasJson.some((r) => r.toLowerCase().includes(q))
    );
  });
}

export function parseDurationToSeconds(lengthText?: string): number | null {
  if (!lengthText) return null;
  const parts = lengthText
    .trim()
    .split(':')
    .map((n) => Number(n));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

const STOP_WORDS = new Set([
  'the',
  'of',
  'and',
  'in',
  'at',
  'for',
  'university',
  'institute',
  'college',
  'technology',
  'national',
  'technical',
]);

function extractUniversityTokens(universityName: string, shortName?: string): string[] {
  const tokens = universityName
    .toLowerCase()
    .replace(/[()[\],.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  if (shortName && shortName.trim().length >= 2) {
    tokens.push(shortName.trim().toLowerCase());
  }
  return Array.from(new Set(tokens));
}

export function scoreYouTubeCandidate(
  candidate: YouTubeRawCandidate,
  context: {
    universityName: string;
    shortName?: string;
    city?: string;
    category: VideoCategory;
  }
): { score: number; isOfficialChannel: boolean } {
  if (!candidate.id || !/^[a-zA-Z0-9_-]{11}$/.test(candidate.id)) {
    return { score: -100, isOfficialChannel: false };
  }

  const titleLower = (candidate.title || '').toLowerCase();
  const channelLower = (candidate.channel || '').toLowerCase();
  const channelUrlLower = (candidate.channelUrl || '').toLowerCase();
  const combined = `${titleLower} ${channelLower} ${channelUrlLower}`;

  // Reject unrelated TGfU SIG (Teaching Games for Understanding) sports pedagogy conferences
  if (/\b(tgfu sig|teaching games for understanding)\b/i.test(combined)) {
    return { score: -100, isOfficialChannel: false };
  }

  // Reject explicit #shorts or micro clips (< 35s)
  if (titleLower.includes('#short') || titleLower.includes('shorts')) {
    return { score: -50, isOfficialChannel: false };
  }
  const durationSec = parseDurationToSeconds(candidate.length);
  if (durationSec !== null && durationSec < 35) {
    return { score: -50, isOfficialChannel: false };
  }

  // Verify the video actually relates to the requested university
  const uniNameClean = context.universityName.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
  const shortLower = (context.shortName || '').toLowerCase().trim();
  const tokens = extractUniversityTokens(uniNameClean, shortLower);

  const exactPhraseMatch = combined.includes(uniNameClean);
  const shortExactMatch =
    shortLower.length >= 3 &&
    new RegExp(`\\b${shortLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(combined);
  const tokenHits = tokens.filter((t) => combined.includes(t)).length;

  if (!exactPhraseMatch && !shortExactMatch && tokenHits === 0) {
    return { score: -40, isOfficialChannel: false };
  }

  const hasUniChannelWord =
    channelLower.includes('university') ||
    channelLower.includes('universitet') ||
    channelLower.includes('universität') ||
    channelLower.includes('université') ||
    channelLower.includes('college') ||
    channelLower.includes('institute') ||
    channelUrlLower.includes('tgfu_rasmiy');

  const isOfficialChannel =
    channelLower.includes(uniNameClean) ||
    channelUrlLower.includes('tgfu_rasmiy') ||
    (shortLower.length >= 3 &&
      channelLower.includes(shortLower) &&
      (hasUniChannelWord || channelLower === shortLower)) ||
    (tokens.length > 0 &&
      tokens.some((t) => channelLower.includes(t)) &&
      (hasUniChannelWord ||
        channelLower.includes('eth') ||
        channelLower.includes('mit')));

  let score = 0;
  if (exactPhraseMatch) score += 35;
  if (shortExactMatch) score += 22;
  score += Math.min(tokenHits * 10, 30);
  if (isOfficialChannel) score += 32;
  if (context.city && combined.includes(context.city.toLowerCase())) score += 8;

  // Reject pure lectures/news/reaction/robotics-hardware videos that aren't campus media
  if (
    /\b(lecture \d+|full course|reaction|vlog unboxing|ranking tier list|researchers create|robot|prototype|dragon drone|swarm)\b/i.test(
      titleLower
    )
  ) {
    score -= 38;
  }

  // Category-specific scoring (English + Uzbek/International keywords)
  if (context.category === 'aerial') {
    const hasAerialWord =
      /\b(drone|aerial|flyover|from above|skyview|birds eye|bird's eye|uav|yangi campus|overview)\b/i.test(
        titleLower
      );
    const hasCampusTourContext =
      /\b(campus|tour|4k|8k|cinematic|footage|view|over|scenic|university|universitet|kampus)\b/i.test(
        titleLower
      );
    if (hasAerialWord && hasCampusTourContext) {
      score += 38;
    } else if (hasAerialWord) {
      score += 18;
    } else if (/\b(4k|8k|campus tour|cinematic|campus|overview)\b/i.test(titleLower)) {
      score += 12;
    } else {
      score -= 12;
    }
  } else if (context.category === 'walkthrough') {
    if (
      /\b(campus tour|walkthrough|walking tour|virtual tour|explore campus|yangi campus|overview|samarqandda|kampus)\b/i.test(
        titleLower
      )
    ) {
      score += 32;
    } else if (/\b(campus|tour|buildings|library|haqida|choice)\b/i.test(titleLower)) {
      score += 14;
    }
  } else if (context.category === 'official') {
    if (isOfficialChannel) score += 22;
    if (
      /\b(welcome|introduction|about|overview|discover|this is|official|haqida|bilasizmi|best choice|rasmiy|imkoniyatlar|universitetimiz)\b/i.test(
        titleLower
      )
    ) {
      score += 24;
    }
  } else if (context.category === 'student_life') {
    if (
      /\b(student life|day in the life|campus life|students|living at|dorm|ochiq eshiklar|tgfu life|talaba|talabalari|haqiqatlar)\b/i.test(
        titleLower
      )
    ) {
      score += 30;
    }
  }

  return { score, isOfficialChannel };
}

export function buildYouTubeSearchQueries(params: {
  universityName: string;
  shortName?: string;
  city?: string;
}): Array<{ category: VideoCategory; query: string }> {
  const cleanName = params.universityName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const shortUpper = (params.shortName || '').trim().toUpperCase();

  // Dedicated authentic search queries for TGFU (Toshkent Gumanitar Fanlar Universiteti)
  if (
    shortUpper === 'TGFU' ||
    cleanName.toLowerCase().includes('toshkent gumanitar fanlar')
  ) {
    return [
      { category: 'official', query: 'Toshkent Gumanitar Fanlar Universiteti TGFU' },
      { category: 'walkthrough', query: 'Toshkent Gumanitar Fanlar Universiteti TGFU campus' },
      { category: 'student_life', query: 'TGFU rasmiy universitet Toshkent' },
      { category: 'aerial', query: 'TGFU YANGI CAMPUS Toshkent Gumanitar Fanlar Universiteti' },
    ];
  }

  return [
    { category: 'aerial', query: `"${cleanName}" campus aerial drone tour` },
    { category: 'walkthrough', query: `"${cleanName}" campus walking tour` },
    { category: 'official', query: `"${cleanName}" official university campus introduction` },
    { category: 'student_life', query: `"${cleanName}" student life campus tour` },
  ];
}

