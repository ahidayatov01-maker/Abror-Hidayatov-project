import type {
  GlobalCountrySummary,
  GlobalUniversitySummary,
  ScholarshipApplicationStatus,
} from '../types/domain';

const TYPO_AND_TRANSLIT_MAP: Record<string, string> = {
  // Common academic typos
  univercity: 'university',
  univeristy: 'university',
  univresity: 'university',
  unversity: 'university',
  universtiy: 'university',
  universitiy: 'university',
  universitet: 'university',
  universiteti: 'university',
  universitat: 'university',
  universite: 'university',
  universida: 'university',
  universidad: 'university',
  technlogy: 'technology',
  techonology: 'technology',
  tecnology: 'technology',
  technolgy: 'technology',
  texnologiya: 'technology',
  institue: 'institute',
  instutute: 'institute',
  institite: 'institute',
  institut: 'institute',
  instituti: 'institute',
  colege: 'college',
  collage: 'college',
  scool: 'school',
  engeneering: 'engineering',
  enginering: 'engineering',
  scince: 'science',
  medecine: 'medicine',
  bussiness: 'business',
  // City & country transliterations / Uzbek / Russian / common typos
  tokio: 'tokyo',
  tokiyo: 'tokyo',
  toshkent: 'tashkent',
  tashkend: 'tashkent',
  samarqand: 'samarkand',
  buxoro: 'bukhara',
  fargona: 'fergana',
  myunxen: 'munich',
  munchen: 'munich',
  syurix: 'zurich',
  zurih: 'zurich',
  parij: 'paris',
  seul: 'seoul',
  pekin: 'beijing',
  shanxay: 'shanghai',
  kioto: 'kyoto',
  osaka: 'osaka',
  fukoka: 'fukuoka',
  kitakyusu: 'kitakyushu',
  yaponiya: 'japan',
  nippon: 'japan',
  nihon: 'japan',
  germaniya: 'germany',
  deutschland: 'germany',
  ozbekiston: 'uzbekistan',
  uzbekiston: 'uzbekistan',
  fransiya: 'france',
  xitoy: 'china',
  shveytsariya: 'switzerland',
  shveysariya: 'switzerland',
  kanada: 'canada',
  avstraliya: 'australia',
  turkiya: 'turkey',
  turkiye: 'turkey',
  italiya: 'italy',
  ispaniya: 'spain',
  niderlandiya: 'netherlands',
  gollandiya: 'netherlands',
  shvetsiya: 'sweden',
  vengriya: 'hungary',
  polsha: 'poland',
  rossiya: 'russia',
  qozogiston: 'kazakhstan',
  hindiston: 'india',
  braziliya: 'brazil',
  misr: 'egypt',
  marokash: 'morocco',
  singapur: 'singapore',
  malayziya: 'malaysia',
  aqsh: 'united states',
  usa: 'united states',
  uk: 'united kingdom',
  britaniya: 'united kingdom',
  angliya: 'united kingdom',
  koreya: 'south korea',
};

const MULTI_WORD_EXPANSIONS: Array<[string, string]> = [
  ['tokyo daigaku', 'the university of tokyo'],
  ['tokyo university', 'the university of tokyo'],
  ['todai', 'the university of tokyo'],
  ['utokyo', 'the university of tokyo'],
  ['kyoto daigaku', 'kyoto university'],
  ['kyodai', 'kyoto university'],
  ['osaka daigaku', 'osaka university'],
  ['handai', 'osaka university'],
  ['tohoku daigaku', 'tohoku university'],
  ['kyushu daigaku', 'kyushu university'],
  ['kyudai', 'kyushu university'],
  ['kyutech', 'kyushu institute of technology'],
  ['titech', 'institute of science tokyo'],
  ['tokyo tech', 'institute of science tokyo'],
  ['waseda daigaku', 'waseda university'],
  ['keio daigaku', 'keio university'],
  ['buyuk britaniya', 'united kingdom'],
  ['janubiy koreya', 'south korea'],
  ['janubiy afrika', 'south africa'],
  ['yangi zelandiya', 'new zealand'],
  ['ozmu', 'national university of uzbekistan'],
  ['nuuz', 'national university of uzbekistan'],
  ['tatu', 'tashkent university of information technologies'],
  ['tuit', 'tashkent university of information technologies'],
  ['wiut', 'westminster international university in tashkent'],
  ['samsu', 'samarkand state university'],
  ['samdu', 'samarkand state university'],
  ['beida', 'peking university'],
  ['snu', 'seoul national university'],
  ['nus', 'national university of singapore'],
  ['ntu', 'nanyang technological university'],
  ['tum', 'technical university of munich'],
  ['lmu', 'ludwig maximilians universitat munchen'],
  ['eth', 'eth zurich'],
  ['epfl', 'ecole polytechnique federale de lausanne'],
  ['mit', 'massachusetts institute of technology'],
  ['caltech', 'california institute of technology'],
  ['uoft', 'university of toronto'],
  ['ubc', 'university of british columbia'],
  ['anu', 'australian national university'],
  ['unimelb', 'university of melbourne'],
  ['usyd', 'university of sydney'],
  ['kaist', 'korea advanced institute of science and technology'],
  ['postech', 'pohang university of science and technology'],
  ['hkust', 'hong kong university of science and technology'],
  ['hku', 'university of hong kong'],
  ['lse', 'london school of economics'],
  ['ucl', 'university college london'],
  ['kcl', "king's college london"],
];

export function normalizeSearchText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`ʻ‘]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\u3040-\u30ff\u4e00-\u9fff\u0400-\u04ff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDomain(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

export function correctQueryTokens(rawQuery: string): {
  normalized: string;
  corrected: string;
  expandedCanonical: string | null;
  hadCorrection: boolean;
} {
  const normalized = normalizeSearchText(rawQuery);
  if (!normalized) {
    return { normalized: '', corrected: '', expandedCanonical: null, hadCorrection: false };
  }

  let hadCorrection = false;
  const tokens = normalized.split(' ').map((tok) => {
    const mapped = TYPO_AND_TRANSLIT_MAP[tok];
    if (mapped && mapped !== tok) {
      hadCorrection = true;
      return mapped;
    }
    return tok;
  });

  const corrected = tokens.join(' ').replace(/\s+/g, ' ').trim();

  let expandedCanonical: string | null = null;
  for (const [alias, canonical] of MULTI_WORD_EXPANSIONS) {
    if (normalized === alias || corrected === alias) {
      expandedCanonical = canonical;
      break;
    }
  }

  return { normalized, corrected, expandedCanonical, hadCorrection };
}

export function damerauLevenshtein(a: string, b: string): number {
  const alen = a.length;
  const blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  if (a === b) return 0;

  const d: number[][] = Array.from({ length: alen + 1 }, () => new Array<number>(blen + 1).fill(0));
  for (let i = 0; i <= alen; i++) d[i][0] = i;
  for (let j = 0; j <= blen; j++) d[0][j] = j;

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, d[i - 2][j - 2] + 1);
      }
      d[i][j] = best;
    }
  }
  return d[alen][blen];
}

export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = damerauLevenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

const STOP_WORDS = new Set(['of', 'the', 'in', 'at', 'and', 'for', 'de', 'la', 'des', 'du']);

function significantTokens(text: string): string[] {
  const tokens = text.split(' ').filter(Boolean);
  const filtered = tokens.filter((t) => !STOP_WORDS.has(t) && t.length > 1);
  return filtered.length > 0 ? filtered : tokens;
}

export function fuzzyTokenCoverageScore(queryNorm: string, targetNorm: string): number {
  if (!queryNorm || !targetNorm) return 0;
  if (queryNorm === targetNorm) return 1;

  const qTokens = significantTokens(queryNorm);
  const tTokens = significantTokens(targetNorm);
  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  let totalScore = 0;
  for (const qt of qTokens) {
    let bestToken = 0;
    for (const tt of tTokens) {
      if (tt === qt) {
        bestToken = 1;
        break;
      }
      if (tt.startsWith(qt) && qt.length >= 3) {
        bestToken = Math.max(bestToken, 0.92);
      } else if (qt.length >= 4 && tt.length >= 4) {
        const sim = stringSimilarity(qt, tt);
        if (sim >= 0.72) {
          bestToken = Math.max(bestToken, sim * 0.9);
        }
      }
    }
    totalScore += bestToken;
  }

  return totalScore / qTokens.length;
}

export interface RankedUniversityResult {
  item: GlobalUniversitySummary;
  score: number;
  layer: 1 | 2 | 3 | 4 | 5 | 6;
  reason: string;
  usedFuzzy: boolean;
}

export interface UniversityRankingOutput {
  results: GlobalUniversitySummary[];
  didYouMean: string | null;
}

export function rankGlobalUniversities(
  candidates: GlobalUniversitySummary[],
  rawQuery: string
): UniversityRankingOutput {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return { results: candidates, didYouMean: null };
  }

  const { normalized, corrected, expandedCanonical, hadCorrection } = correctQueryTokens(trimmed);
  const queryVariants = Array.from(
    new Set([normalized, corrected, expandedCanonical].filter((v): v is string => Boolean(v)))
  );

  const scored: RankedUniversityResult[] = [];

  for (const uni of candidates) {
    const nameNorm = normalizeSearchText(uni.name);
    const nameNoThe = nameNorm.replace(/^the\s+/, '');
    const shortNorm = normalizeSearchText(uni.shortName);
    const aliasNorms = Array.from(
      new Set(
        [
          ...(uni.aliases || []),
          ...(uni.acronyms || []),
          uni.shortName,
        ]
          .map(normalizeSearchText)
          .filter(Boolean)
      )
    );
    const cityNorm = normalizeSearchText(uni.cityName || '');
    const countryNorm = normalizeSearchText(uni.countryName || '');
    const countryCodeNorm = (uni.countryCode || '').toLowerCase();
    const topicsNorm = normalizeSearchText((uni.topTopics || []).join(' '));

    let bestScore = 0;
    let bestLayer: 1 | 2 | 3 | 4 | 5 | 6 = 6;
    let bestReason = 'Related match';
    let usedFuzzy = false;

    const normNoThe = normalized.replace(/^the\s+/, '');
    const corrNoThe = corrected.replace(/^the\s+/, '');
    const expNoThe = expandedCanonical ? expandedCanonical.replace(/^the\s+/, '') : null;

    // Layer 1: Exact official name match (article-insensitive for leading "The ")
    if (nameNorm === normalized || nameNoThe === normNoThe) {
      bestScore = 1000;
      bestLayer = 1;
      bestReason = 'Exact official name';
    } else if (
      nameNorm === corrected ||
      nameNoThe === corrNoThe ||
      (expandedCanonical && (nameNorm === expandedCanonical || nameNoThe === expNoThe))
    ) {
      bestScore = 965;
      bestLayer = hadCorrection ? 4 : 2;
      bestReason = hadCorrection ? 'Typo-corrected official match' : 'Canonical alias match';
      usedFuzzy = hadCorrection;
    }

    // Layer 2: Exact alias / acronym / local name match
    if (bestScore < 920) {
      if (shortNorm === normalized || aliasNorms.includes(normalized)) {
        bestScore = 930;
        bestLayer = 2;
        bestReason = 'Official acronym / alias match';
      } else if (aliasNorms.includes(corrected) || (expandedCanonical && aliasNorms.includes(expandedCanonical))) {
        bestScore = 905;
        bestLayer = hadCorrection ? 4 : 2;
        bestReason = hadCorrection ? 'Typo-corrected alias match' : 'Alternative name match';
        usedFuzzy = hadCorrection;
      }
    }

    // Layer 3: Prefix & strong partial match on name or aliases
    if (bestScore < 850) {
      for (const qv of queryVariants) {
        if (nameNorm.startsWith(qv)) {
          const isCorrectedVariant = qv !== normalized && hadCorrection;
          const s = isCorrectedVariant ? 830 : 860;
          if (s > bestScore) {
            bestScore = s;
            bestLayer = isCorrectedVariant ? 4 : 3;
            bestReason = isCorrectedVariant ? 'Typo-corrected prefix match' : 'Prefix match';
            usedFuzzy = isCorrectedVariant;
          }
        } else if (nameNorm.includes(qv) && qv.length >= 3) {
          const isCorrectedVariant = qv !== normalized && hadCorrection;
          const s = isCorrectedVariant ? 785 : 815;
          if (s > bestScore) {
            bestScore = s;
            bestLayer = isCorrectedVariant ? 4 : 3;
            bestReason = isCorrectedVariant ? 'Typo-corrected name match' : 'Partial name match';
            usedFuzzy = isCorrectedVariant;
          }
        } else if (aliasNorms.some((al) => al.startsWith(qv) || (qv.length >= 3 && al.includes(qv)))) {
          const s = 770;
          if (s > bestScore) {
            bestScore = s;
            bestLayer = 3;
            bestReason = 'Alternative / local name match';
            usedFuzzy = qv !== normalized && hadCorrection;
          }
        }
      }
    }

    // Layer 4: Token coverage + Damerau-Levenshtein fuzzy typo tolerance
    if (bestScore < 740) {
      let bestFuzzySim = 0;
      for (const qv of queryVariants) {
        const directSim = stringSimilarity(qv, nameNorm);
        const tokenCov = fuzzyTokenCoverageScore(qv, nameNorm);
        let aliasCov = 0;
        for (const al of aliasNorms) {
          aliasCov = Math.max(aliasCov, stringSimilarity(qv, al), fuzzyTokenCoverageScore(qv, al));
        }
        bestFuzzySim = Math.max(bestFuzzySim, directSim, tokenCov, aliasCov);
      }
      if (bestFuzzySim >= 0.62) {
        const s = Math.round(520 + bestFuzzySim * 210);
        if (s > bestScore) {
          bestScore = s;
          bestLayer = 4;
          bestReason = 'Fuzzy typo-tolerant match';
          usedFuzzy = true;
        }
      }
    }

    // Layer 5: Geographic city / country match
    if (bestScore < 490) {
      for (const qv of queryVariants) {
        if (
          (cityNorm && (cityNorm === qv || cityNorm.includes(qv) || stringSimilarity(qv, cityNorm) >= 0.8)) ||
          (countryNorm && (countryNorm === qv || countryNorm.includes(qv))) ||
          countryCodeNorm === qv
        ) {
          bestScore = 475;
          bestLayer = 5;
          bestReason = 'Geographic city / country match';
          usedFuzzy = cityNorm !== qv && countryNorm !== qv && hadCorrection;
          break;
        }
      }
    }

    // Layer 6: Topic / research field match
    if (bestScore < 390 && topicsNorm) {
      for (const qv of queryVariants) {
        if (topicsNorm.includes(qv) || fuzzyTokenCoverageScore(qv, topicsNorm) >= 0.7) {
          bestScore = 360;
          bestLayer = 6;
          bestReason = 'Research field / discipline match';
          break;
        }
      }
    }

    if (bestScore > 0) {
      // Tie-breaker prestige boost (bounded so it never overrides stronger match layers)
      let prominenceBoost = 0;
      if (uni.isSeededCatalog) prominenceBoost += 14;
      if (uni.qsRankNumeric && uni.qsRankNumeric <= 500) {
        prominenceBoost += Math.max(2, 18 - Math.log2(uni.qsRankNumeric + 1) * 2);
      }
      if (uni.citedByCount && uni.citedByCount > 0) {
        prominenceBoost += Math.min(12, Math.log10(uni.citedByCount + 1) * 1.6);
      }

      scored.push({
        item: {
          ...uni,
          matchLayer: bestLayer,
          matchReason: bestReason,
        },
        score: bestScore + prominenceBoost,
        layer: bestLayer,
        reason: bestReason,
        usedFuzzy,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  let didYouMean: string | null = null;
  if (scored.length > 0) {
    const top = scored[0];
    const topNameNorm = normalizeSearchText(top.item.name);
    const hasDirectExact =
      top.layer === 1 ||
      (top.layer === 2 && !top.usedFuzzy) ||
      (topNameNorm.includes(normalized) && !hadCorrection);

    if (!hasDirectExact && (top.usedFuzzy || hadCorrection || top.layer === 4)) {
      didYouMean = top.item.name;
    }
  }

  return {
    results: scored.map((s) => s.item),
    didYouMean,
  };
}

export function deduplicateUniversities(items: GlobalUniversitySummary[]): GlobalUniversitySummary[] {
  const byKey = new Map<string, GlobalUniversitySummary>();
  const rorIndex = new Map<string, string>();
  const domainIndex = new Map<string, string>();

  for (const item of items) {
    const normName = normalizeSearchText(item.name);
    const country = (item.countryCode || '').toUpperCase();
    const canonicalKey = `${country}::${normName}`;
    const rorKey = item.rorId ? item.rorId.toLowerCase().trim() : '';
    const domKey = normalizeDomain(item.officialWebsite);

    const existingKey =
      (rorKey && rorIndex.get(rorKey)) ||
      (domKey && !domKey.endsWith('.gov') && !domKey.endsWith('wikipedia.org') && domainIndex.get(domKey)) ||
      (byKey.has(canonicalKey) ? canonicalKey : undefined);

    if (!existingKey) {
      byKey.set(canonicalKey, item);
      if (rorKey) rorIndex.set(rorKey, canonicalKey);
      if (domKey) domainIndex.set(domKey, canonicalKey);
      continue;
    }

    const existing = byKey.get(existingKey)!;
    // Prefer seeded catalog record as primary, enriching it with OpenAlex/ROR metadata & aliases
    const primary = existing.isSeededCatalog
      ? existing
      : item.isSeededCatalog
      ? item
      : (existing.citedByCount || 0) >= (item.citedByCount || 0)
      ? existing
      : item;
    const secondary = primary === existing ? item : existing;

    const mergedAliases = Array.from(
      new Set([...(primary.aliases || []), ...(secondary.aliases || []), secondary.name])
    ).filter((a) => a && normalizeSearchText(a) !== normalizeSearchText(primary.name));

    const mergedAcronyms = Array.from(
      new Set([...(primary.acronyms || []), ...(secondary.acronyms || [])])
    ).filter(Boolean);

    const mergedTopics = Array.from(
      new Set([...(primary.topTopics || []), ...(secondary.topTopics || [])])
    ).slice(0, 8);

    byKey.set(existingKey, {
      ...primary,
      aliases: mergedAliases.slice(0, 12),
      acronyms: mergedAcronyms.slice(0, 6),
      topTopics: mergedTopics,
      rorId: primary.rorId || secondary.rorId,
      openAlexId: primary.openAlexId || secondary.openAlexId,
      worksCount:
        primary.worksCount != null && secondary.worksCount != null
          ? Math.max(primary.worksCount, secondary.worksCount)
          : primary.worksCount ?? secondary.worksCount,
      citedByCount:
        primary.citedByCount != null && secondary.citedByCount != null
          ? Math.max(primary.citedByCount, secondary.citedByCount)
          : primary.citedByCount ?? secondary.citedByCount,
      latitude: primary.latitude ?? secondary.latitude,
      longitude: primary.longitude ?? secondary.longitude,
      officialWebsite: primary.officialWebsite || secondary.officialWebsite,
      cityName: primary.cityName && primary.cityName !== 'Main Campus' ? primary.cityName : secondary.cityName,
    });
  }

  return Array.from(byKey.values());
}

export function rankGlobalCountries(
  countries: GlobalCountrySummary[],
  rawQuery: string
): GlobalCountrySummary[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return countries;

  const { normalized, corrected, expandedCanonical } = correctQueryTokens(trimmed);
  const variants = Array.from(
    new Set([normalized, corrected, expandedCanonical].filter((v): v is string => Boolean(v)))
  );

  const scored: Array<{ country: GlobalCountrySummary; score: number }> = [];

  for (const c of countries) {
    const nameNorm = normalizeSearchText(c.name);
    const codeNorm = c.isoCode.toLowerCase();
    const capNorm = normalizeSearchText(c.capital || '');
    const contNorm = normalizeSearchText(c.continent);

    let score = 0;
    for (const qv of variants) {
      if (nameNorm === qv || codeNorm === qv) {
        score = Math.max(score, 1000);
      } else if (nameNorm.startsWith(qv)) {
        score = Math.max(score, 880);
      } else if (nameNorm.includes(qv) || (capNorm && capNorm.includes(qv))) {
        score = Math.max(score, 760);
      } else if (contNorm === qv) {
        score = Math.max(score, 620);
      } else {
        const sim = Math.max(stringSimilarity(qv, nameNorm), fuzzyTokenCoverageScore(qv, nameNorm));
        if (sim >= 0.7) {
          score = Math.max(score, Math.round(500 + sim * 220));
        }
      }
    }

    if (score > 0) {
      scored.push({ country: c, score: score + (c.isSeededDossier ? 10 : 0) });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.country.totalVerifiedUniversities - a.country.totalVerifiedUniversities);
  return scored.map((s) => s.country);
}

export function classifyScholarshipStatus(
  rawStatus: string | undefined,
  deadlineText: string,
  referenceDate: Date = new Date()
): {
  status: ScholarshipApplicationStatus;
  label: string;
  isExpired: boolean;
} {
  const lowerDeadline = (deadlineText || '').toLowerCase();
  const explicitYearMatch = lowerDeadline.match(/\b(20\d{2})\b/);
  const currentYear = referenceDate.getUTCFullYear();

  if (explicitYearMatch) {
    const mentionedYear = Number(explicitYearMatch[1]);
    if (mentionedYear < currentYear) {
      return {
        status: 'closed',
        label: 'Cycle Closed — Check Next Intake',
        isExpired: true,
      };
    }
  }

  const normalizedStatus = (rawStatus || 'recurring_unconfirmed').toLowerCase();
  if (normalizedStatus === 'open') {
    return { status: 'open', label: 'Open for Applications', isExpired: false };
  }
  if (normalizedStatus === 'upcoming') {
    return { status: 'upcoming', label: 'Upcoming Cycle', isExpired: false };
  }
  if (normalizedStatus === 'closed') {
    return { status: 'closed', label: 'Closed', isExpired: true };
  }
  if (normalizedStatus === 'requires_verification') {
    return {
      status: 'requires_verification',
      label: 'Verify Official Dates',
      isExpired: false,
    };
  }
  return {
    status: 'recurring_unconfirmed',
    label: 'Annual Cycle — Verify Portal',
    isExpired: false,
  };
}

export function isSafeExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
