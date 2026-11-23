import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
  admissionRequirements,
  cities,
  countries,
  programs,
  rankings,
  scholarships,
  universities,
  universityAliases,
} from '../db/schema';
import { ensureCatalogSeeded } from '../db/seed';
import { getUniversityCampusImageUrl } from '../data/seedCatalog';
import { TOP_10_STUDENT_CITIES, type TopStudentCityRecord } from '../data/topStudentCities';
import { GLOBAL_CITIES_LIVING_CATALOG } from '../data/globalCitiesLivingCatalog';
import { WORLDWIDE_REGIONAL_UNIVERSITIES } from '../data/worldwideUniversityRegistry';
import { ALIASES_BY_SLUG } from '../data/universityAliases';
import {
  getAllWorldTerritories,
  getTerritoryMetaByIso2,
  iso2ToFlagEmoji,
} from '../utils/isoCountries';
import {
  classifyScholarshipStatus,
  correctQueryTokens,
  deduplicateUniversities,
  isSafeExternalUrl,
  normalizeSearchText,
  rankGlobalCountries,
  rankGlobalUniversities,
  stringSimilarity,
} from '../utils/globalSearchEngine';
import type {
  GlobalCityCluster,
  GlobalCountrySummary,
  GlobalUniversityDetail,
  GlobalUniversitySummary,
  ScholarshipRecord,
} from '../types/domain';

const USER_AGENT = 'GlobalUniversityIntelligence/2.0 (Academic Discovery Platform; mailto:info@globaluni.edu)';
const FETCH_TIMEOUT_MS = 6500;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class BoundedTtlCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  constructor(private readonly maxEntries: number) {}

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const countryCountsCache = new BoundedTtlCache<Record<string, number>>(4);
const openAlexSearchCache = new BoundedTtlCache<{ total: number; items: GlobalUniversitySummary[] }>(200);
const rorSearchCache = new BoundedTtlCache<GlobalUniversitySummary[]>(150);
const uniDetailCache = new BoundedTtlCache<GlobalUniversityDetail>(200);
const citySearchCache = new BoundedTtlCache<GlobalCityCluster[]>(150);
const cityUnisCache = new BoundedTtlCache<GlobalUniversitySummary[]>(150);

interface OpenAlexInstitution {
  id?: string;
  ror?: string;
  display_name?: string;
  country_code?: string;
  type?: string;
  homepage_url?: string;
  works_count?: number;
  cited_by_count?: number;
  display_name_acronyms?: string[];
  display_name_alternatives?: string[];
  geo?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  topics?: Array<{ display_name?: string }>;
  x_concepts?: Array<{ display_name?: string }>;
}

interface RorOrganizationV2 {
  id?: string;
  names?: Array<{ value?: string; types?: string[]; lang?: string | null }>;
  types?: string[];
  links?: Array<{ type?: string; value?: string }>;
  established?: number | null;
  locations?: Array<{
    geonames_details?: {
      name?: string;
      country_code?: string;
      country_name?: string;
      lat?: number;
      lng?: number;
    };
  }>;
}

async function fetchAllowedJson<T>(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T | null> {
  try {
    const parsed = new URL(url);
    const allowedHosts = new Set(['api.openalex.org', 'api.ror.org', 'en.wikipedia.org']);
    if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) {
      return null;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function extractOpenAlexShortId(fullId: string | undefined): string | null {
  if (!fullId) return null;
  const match = fullId.match(/(I\d+)$/i);
  return match ? match[1].toUpperCase() : null;
}

function extractRorShortId(rorUrl: string | undefined): string | null {
  if (!rorUrl) return null;
  const match = rorUrl.match(/ror\.org\/([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

function mapOpenAlexToSummary(inst: OpenAlexInstitution): GlobalUniversitySummary | null {
  const name = inst.display_name?.trim();
  const oaId = extractOpenAlexShortId(inst.id);
  if (!name || !oaId) return null;

  const countryCode = (inst.country_code || '').toUpperCase();
  const territory = countryCode ? getTerritoryMetaByIso2(countryCode) : null;
  const cityName = inst.geo?.city?.trim() || inst.geo?.region?.trim() || 'Main Campus';
  const website = isSafeExternalUrl(inst.homepage_url) ? inst.homepage_url! : null;
  const acronyms = (inst.display_name_acronyms || []).filter(Boolean).slice(0, 6);
  const aliases = (inst.display_name_alternatives || [])
    .filter((a) => Boolean(a) && normalizeSearchText(a) !== normalizeSearchText(name))
    .slice(0, 10);
  const topTopics = (inst.topics || inst.x_concepts || [])
    .map((t) => t.display_name?.trim())
    .filter((v): v is string => Boolean(v))
    .slice(0, 6);

  return {
    slug: `oa-${oaId}`,
    name,
    shortName: acronyms[0] || (name.length > 36 ? `${name.slice(0, 33)}…` : name),
    aliases,
    acronyms,
    countryCode: countryCode || 'XX',
    countryName: territory?.name || inst.geo?.country || countryCode || 'International',
    countryFlag: territory?.flagEmoji || (countryCode ? iso2ToFlagEmoji(countryCode) : '🌐'),
    continent: territory?.continent || 'Global',
    cityName,
    citySlug: null,
    latitude: typeof inst.geo?.latitude === 'number' ? inst.geo.latitude : null,
    longitude: typeof inst.geo?.longitude === 'number' ? inst.geo.longitude : null,
    institutionType: inst.type === 'education' ? 'Higher Education Institution' : inst.type || 'Institution',
    officialWebsite: website,
    rorId: inst.ror || null,
    openAlexId: oaId,
    worksCount: typeof inst.works_count === 'number' ? inst.works_count : null,
    citedByCount: typeof inst.cited_by_count === 'number' ? inst.cited_by_count : null,
    foundedYear: null,
    primaryLanguage: null,
    tuitionLocalDisplay: null,
    tuitionAnnualMinUsd: null,
    tuitionAnnualMaxUsd: null,
    qsRankDisplay: null,
    qsRankNumeric: null,
    theRankDisplay: null,
    theRankNumeric: null,
    topTopics,
    imageUrl: null,
    sourceName: 'OpenAlex Institutional Registry',
    sourceUrl: inst.ror || inst.id || null,
    verificationStatus: 'verified',
    isSeededCatalog: false,
  };
}

function mapRorToSummary(org: RorOrganizationV2): GlobalUniversitySummary | null {
  const rorShort = extractRorShortId(org.id);
  if (!rorShort) return null;

  const displayObj =
    org.names?.find((n) => n.types?.includes('ror_display')) ||
    org.names?.find((n) => n.types?.includes('label')) ||
    org.names?.[0];
  const name = displayObj?.value?.trim();
  if (!name) return null;

  const acronyms = (org.names || [])
    .filter((n) => n.types?.includes('acronym') && n.value)
    .map((n) => n.value!.trim())
    .slice(0, 6);
  const aliases = (org.names || [])
    .filter((n) => n.value && normalizeSearchText(n.value) !== normalizeSearchText(name))
    .map((n) => n.value!.trim())
    .slice(0, 10);

  const loc = org.locations?.[0]?.geonames_details;
  const countryCode = (loc?.country_code || '').toUpperCase();
  const territory = countryCode ? getTerritoryMetaByIso2(countryCode) : null;
  const websiteObj = org.links?.find((l) => l.type === 'website' && isSafeExternalUrl(l.value));

  return {
    slug: `ror-${rorShort}`,
    name,
    shortName: acronyms[0] || (name.length > 36 ? `${name.slice(0, 33)}…` : name),
    aliases,
    acronyms,
    countryCode: countryCode || 'XX',
    countryName: territory?.name || loc?.country_name || countryCode || 'International',
    countryFlag: territory?.flagEmoji || (countryCode ? iso2ToFlagEmoji(countryCode) : '🌐'),
    continent: territory?.continent || 'Global',
    cityName: loc?.name?.trim() || 'Main Campus',
    citySlug: null,
    latitude: typeof loc?.lat === 'number' ? loc.lat : null,
    longitude: typeof loc?.lng === 'number' ? loc.lng : null,
    institutionType: 'Higher Education Institution',
    officialWebsite: websiteObj?.value || null,
    rorId: org.id || null,
    openAlexId: null,
    worksCount: null,
    citedByCount: null,
    foundedYear: typeof org.established === 'number' ? org.established : null,
    primaryLanguage: null,
    tuitionLocalDisplay: null,
    tuitionAnnualMinUsd: null,
    tuitionAnnualMaxUsd: null,
    qsRankDisplay: null,
    qsRankNumeric: null,
    theRankDisplay: null,
    theRankNumeric: null,
    topTopics: [],
    imageUrl: null,
    sourceName: 'ROR (Research Organization Registry)',
    sourceUrl: org.id || null,
    verificationStatus: 'verified',
    isSeededCatalog: false,
  };
}

async function fetchSeededUniversitySummaries(): Promise<GlobalUniversitySummary[]> {
  await ensureCatalogSeeded();
  const [uniRows, cityRows, countryRows, rankingRows, aliasRows] = await Promise.all([
    db.select().from(universities),
    db.select().from(cities),
    db.select().from(countries),
    db.select().from(rankings),
    db.select().from(universityAliases),
  ]);

  const cityMap = new Map(cityRows.map((c) => [c.slug, c]));
  const countryMap = new Map(countryRows.map((c) => [c.isoCode, c]));
  const aliasMap = new Map<string, string[]>();
  const acronymMap = new Map<string, string[]>();

  for (const row of aliasRows) {
    const list = aliasMap.get(row.universitySlug) || [];
    list.push(row.alias);
    aliasMap.set(row.universitySlug, list);
    if (row.aliasType === 'acronym') {
      const acList = acronymMap.get(row.universitySlug) || [];
      acList.push(row.alias);
      acronymMap.set(row.universitySlug, acList);
    }
  }

  const rankBySlug = new Map<string, { qs?: { display: string; num: number }; the?: { display: string; num: number } }>();
  for (const r of rankingRows) {
    const cur = rankBySlug.get(r.universitySlug) || {};
    if (r.provider === 'QS World University Rankings') {
      if (!cur.qs || r.worldRank < cur.qs.num) {
        cur.qs = { display: r.worldRankDisplay, num: r.worldRank };
      }
    } else if (r.provider === 'Times Higher Education') {
      if (!cur.the || r.worldRank < cur.the.num) {
        cur.the = { display: r.worldRankDisplay, num: r.worldRank };
      }
    }
    rankBySlug.set(r.universitySlug, cur);
  }

  const dbSummaries: GlobalUniversitySummary[] = uniRows.map((u) => {
    const city = cityMap.get(u.citySlug);
    const country = countryMap.get(u.countryCode);
    const territory = getTerritoryMetaByIso2(u.countryCode);
    const ranks = rankBySlug.get(u.slug);
    const aliases = Array.from(
      new Set([...(aliasMap.get(u.slug) || []), ...(ALIASES_BY_SLUG[u.slug] || [])])
    );
    const acronyms = Array.from(new Set([...(acronymMap.get(u.slug) || []), u.shortName]));

    return {
      slug: u.slug,
      name: u.name,
      shortName: u.shortName,
      aliases,
      acronyms,
      countryCode: u.countryCode,
      countryName: country?.name || territory?.name || u.countryCode,
      countryFlag: country?.flagEmoji || territory?.flagEmoji || iso2ToFlagEmoji(u.countryCode),
      continent: country?.continent || territory?.continent || 'Global',
      cityName: city?.name || 'Main Campus',
      citySlug: u.citySlug,
      latitude: city?.latitude ?? null,
      longitude: city?.longitude ?? null,
      institutionType: u.institutionType,
      officialWebsite: isSafeExternalUrl(u.officialWebsite) ? u.officialWebsite : null,
      rorId: null,
      openAlexId: null,
      worksCount: null,
      citedByCount: null,
      foundedYear: u.foundedYear,
      primaryLanguage: u.primaryLanguage,
      tuitionLocalDisplay: u.tuitionLocalDisplay,
      tuitionAnnualMinUsd: u.tuitionAnnualMinUsd,
      tuitionAnnualMaxUsd: u.tuitionAnnualMaxUsd,
      qsRankDisplay: ranks?.qs?.display || null,
      qsRankNumeric: ranks?.qs?.num || null,
      theRankDisplay: ranks?.the?.display || null,
      theRankNumeric: ranks?.the?.num || null,
      topTopics: (u.academicStrengthsJson || []).slice(0, 6),
      imageUrl: getUniversityCampusImageUrl(u.slug),
      sourceName: u.sourceOrg,
      sourceUrl: isSafeExternalUrl(u.sourceUrl) ? u.sourceUrl : null,
      verificationStatus: (u.verificationStatus as GlobalUniversitySummary['verificationStatus']) || 'verified',
      isSeededCatalog: true,
    };
  });

  const dbSlugs = new Set(dbSummaries.map((s) => s.slug));
  const regionalSummaries: GlobalUniversitySummary[] = WORLDWIDE_REGIONAL_UNIVERSITIES.map((reg) => {
    const country = countryMap.get(reg.countryCode);
    const territory = getTerritoryMetaByIso2(reg.countryCode);
    const ranks = rankBySlug.get(reg.slug);
    const isInDb = dbSlugs.has(reg.slug);

    return {
      slug: reg.slug,
      name: reg.name,
      shortName: reg.shortName,
      aliases: Array.from(new Set([...(reg.aliases || []), ...(ALIASES_BY_SLUG[reg.slug] || [])])),
      acronyms: Array.from(new Set([...(reg.acronyms || []), reg.shortName])),
      countryCode: reg.countryCode,
      countryName: country?.name || territory?.name || reg.countryName,
      countryFlag: country?.flagEmoji || territory?.flagEmoji || iso2ToFlagEmoji(reg.countryCode),
      continent: country?.continent || territory?.continent || 'Global',
      cityName: reg.cityName,
      citySlug: `${normalizeSearchText(reg.cityName).replace(/\s+/g, '-')}-${reg.countryCode.toLowerCase()}`,
      latitude: reg.lat,
      longitude: reg.lng,
      institutionType: reg.institutionType,
      officialWebsite: isSafeExternalUrl(reg.officialWebsite) ? reg.officialWebsite : null,
      rorId: null,
      openAlexId: null,
      worksCount: reg.worksCount ?? null,
      citedByCount: reg.citedByCount ?? null,
      foundedYear: reg.foundedYear ?? null,
      primaryLanguage: 'English & National Language',
      tuitionLocalDisplay: reg.tuitionAnnualUsd != null ? `~$${reg.tuitionAnnualUsd.toLocaleString()}/yr` : null,
      tuitionAnnualMinUsd: reg.tuitionAnnualUsd ?? null,
      tuitionAnnualMaxUsd: reg.tuitionAnnualUsd ?? null,
      qsRankDisplay: ranks?.qs?.display || reg.worldRankDisplay || (reg.qsRankNumeric ? `#${reg.qsRankNumeric}` : null),
      qsRankNumeric: ranks?.qs?.num || reg.qsRankNumeric || null,
      theRankDisplay: ranks?.the?.display || null,
      theRankNumeric: ranks?.the?.num || null,
      topTopics: reg.topTopics.slice(0, 6),
      imageUrl: getUniversityCampusImageUrl(reg.slug),
      sourceName: 'Global University Intelligence Verified Regional Registry',
      sourceUrl: isSafeExternalUrl(reg.officialWebsite) ? reg.officialWebsite : null,
      verificationStatus: 'verified',
      isSeededCatalog: isInDb,
    };
  });

  return deduplicateUniversities([...dbSummaries, ...regionalSummaries]);
}

async function queryOpenAlexInstitutions(params: {
  search?: string;
  countryCode?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}): Promise<{ total: number; items: GlobalUniversitySummary[] }> {
  const page = Math.max(1, Math.min(100, params.page || 1));
  const perPage = Math.max(1, Math.min(50, params.perPage || 25));
  const filterParts = ['type:education'];
  if (params.countryCode && /^[A-Z]{2}$/.test(params.countryCode)) {
    filterParts.push(`country_code:${params.countryCode}`);
  }

  const qs = new URLSearchParams({
    filter: filterParts.join(','),
    page: String(page),
    'per-page': String(perPage),
    select:
      'id,ror,display_name,country_code,type,homepage_url,works_count,cited_by_count,display_name_acronyms,display_name_alternatives,geo,topics',
  });
  if (params.search && params.search.trim()) {
    qs.set('search', params.search.trim().slice(0, 120));
  }
  if (params.sort) {
    qs.set('sort', params.sort);
  }

  const cacheKey = qs.toString();
  const cached = openAlexSearchCache.get(cacheKey);
  if (cached) return cached;

  const payload = await fetchAllowedJson<{
    meta?: { count?: number };
    results?: OpenAlexInstitution[];
  }>(`https://api.openalex.org/institutions?${qs.toString()}`);

  const mapped = (payload?.results || [])
    .map(mapOpenAlexToSummary)
    .filter((x): x is GlobalUniversitySummary => x !== null);
  const result = {
    total: typeof payload?.meta?.count === 'number' ? payload.meta.count : mapped.length,
    items: mapped,
  };
  openAlexSearchCache.set(cacheKey, result, 20 * 60 * 1000);
  return result;
}

async function queryRorOrganizations(query: string): Promise<GlobalUniversitySummary[]> {
  const cleaned = query.trim().slice(0, 120);
  if (!cleaned) return [];

  const cacheKey = `ror:${cleaned.toLowerCase()}`;
  const cached = rorSearchCache.get(cacheKey);
  if (cached) return cached;

  const qs = new URLSearchParams({
    query: cleaned,
    filter: 'types:education',
  });
  const payload = await fetchAllowedJson<{ items?: RorOrganizationV2[] }>(
    `https://api.ror.org/v2/organizations?${qs.toString()}`
  );

  const mapped = (payload?.items || [])
    .map(mapRorToSummary)
    .filter((x): x is GlobalUniversitySummary => x !== null);
  rorSearchCache.set(cacheKey, mapped, 25 * 60 * 1000);
  return mapped;
}

async function queryRorByCity(cityName: string, countryCode?: string): Promise<GlobalUniversitySummary[]> {
  const cleaned = cityName.replace(/["\\]/g, '').trim().slice(0, 80);
  if (!cleaned) return [];
  const cc = countryCode ? countryCode.trim().toUpperCase() : '';
  const cacheKey = `ror-city:${cleaned.toLowerCase()}::${cc}`;
  const cached = rorSearchCache.get(cacheKey);
  if (cached) return cached;

  const filterParts = ['types:education'];
  if (cc && /^[A-Z]{2}$/.test(cc)) {
    filterParts.push(`locations.geonames_details.country_code:${cc}`);
  }
  const qs = new URLSearchParams({
    'query.advanced': `locations.geonames_details.name:"${cleaned}"`,
    filter: filterParts.join(','),
  });
  const payload = await fetchAllowedJson<{ items?: RorOrganizationV2[] }>(
    `https://api.ror.org/v2/organizations?${qs.toString()}`
  );
  const mapped = (payload?.items || [])
    .map(mapRorToSummary)
    .filter((x): x is GlobalUniversitySummary => x !== null);
  rorSearchCache.set(cacheKey, mapped, 25 * 60 * 1000);
  return mapped;
}

export async function getGlobalCountryUniversityCounts(): Promise<Record<string, number>> {
  const cached = countryCountsCache.get('all');
  if (cached) return cached;

  const payload = await fetchAllowedJson<{
    group_by?: Array<{ key?: string; count?: number }>;
  }>('https://api.openalex.org/institutions?filter=type:education&group_by=country_code&per-page=200');

  const counts: Record<string, number> = {};
  for (const row of payload?.group_by || []) {
    const rawKey = (row.key || '').trim();
    const match = rawKey.match(/^(?:https?:\/\/.*countries\/)?([A-Z]{2})$/i);
    if (match && typeof row.count === 'number') {
      counts[match[1].toUpperCase()] = row.count;
    }
  }

  if (Object.keys(counts).length > 0) {
    countryCountsCache.set('all', counts, 6 * 60 * 60 * 1000);
  }
  return counts;
}

export async function listGlobalCountries(params: {
  q?: string;
  continent?: string;
}): Promise<{
  countries: GlobalCountrySummary[];
  totalCountries: number;
  totalVerifiedUniversitiesGlobal: number;
  continentCounts: Record<string, number>;
}> {
  await ensureCatalogSeeded();
  const [seededCountries, allVerifiedUnis, openAlexCounts] = await Promise.all([
    db.select().from(countries),
    fetchSeededUniversitySummaries(),
    getGlobalCountryUniversityCounts(),
  ]);

  const seededCountryMap = new Map(seededCountries.map((c) => [c.isoCode.toUpperCase(), c]));
  const seededUniCountByCountry: Record<string, number> = {};
  for (const u of allVerifiedUnis) {
    const cc = u.countryCode.toUpperCase();
    seededUniCountByCountry[cc] = (seededUniCountByCountry[cc] || 0) + 1;
  }

  const allTerritories = getAllWorldTerritories().filter((t) => t.continent !== 'Antarctica');
  const merged: GlobalCountrySummary[] = allTerritories.map((territory) => {
    const cc = territory.iso2.toUpperCase();
    const dossier = seededCountryMap.get(cc);
    const oaCount = openAlexCounts[cc] || 0;
    const seededCount = seededUniCountByCountry[cc] || 0;
    const totalVerified = Math.max(oaCount, seededCount);

    return {
      isoCode: cc,
      isoNumeric: territory.isoNumeric,
      name: dossier?.name || territory.name,
      continent: dossier?.continent || territory.continent,
      flagEmoji: dossier?.flagEmoji || territory.flagEmoji,
      capital: dossier?.capital || null,
      totalVerifiedUniversities: totalVerified,
      seededUniversityCount: seededCount,
      isSeededDossier: Boolean(dossier),
      tuitionRangeMinUsd: dossier?.tuitionRangeMinUsd ?? null,
      tuitionRangeMaxUsd: dossier?.tuitionRangeMaxUsd ?? null,
      livingCostMonthlyMinUsd: dossier?.livingCostMonthlyMinUsd ?? null,
      livingCostMonthlyMaxUsd: dossier?.livingCostMonthlyMaxUsd ?? null,
      educationSystem: dossier?.educationSystem || null,
      admissionSystem: dossier?.admissionSystem || null,
      languageRequirements: dossier?.languageRequirements || null,
      internationalInfo: dossier?.internationalInfo || null,
      academicOpportunities: dossier?.academicOpportunities || null,
      officialPortalUrl: dossier?.officialPortalUrl || null,
      sourceOrg: dossier?.sourceOrg || 'OpenAlex Global Institutional Registry & ISO 3166',
      verifiedAt: dossier?.verifiedAt || new Date().toISOString().slice(0, 10),
    };
  });

  const continentCounts: Record<string, number> = { All: merged.length };
  let totalVerifiedUniversitiesGlobal = 0;
  for (const c of merged) {
    continentCounts[c.continent] = (continentCounts[c.continent] || 0) + 1;
    totalVerifiedUniversitiesGlobal += c.totalVerifiedUniversities;
  }

  const query = (params.q || '').trim();
  const continent = (params.continent || 'All').trim();

  // If user enters a search query, search across ALL countries regardless of selected continent
  let filtered = merged;
  if (query) {
    filtered = rankGlobalCountries(merged, query);
  } else {
    if (continent && continent !== 'All') {
      filtered = merged.filter((c) => c.continent.toLowerCase() === continent.toLowerCase());
    }
    filtered = [...filtered].sort((a, b) => {
      if (a.isSeededDossier !== b.isSeededDossier) return a.isSeededDossier ? -1 : 1;
      return b.totalVerifiedUniversities - a.totalVerifiedUniversities || a.name.localeCompare(b.name);
    });
  }

  return {
    countries: filtered,
    totalCountries: filtered.length,
    totalVerifiedUniversitiesGlobal,
    continentCounts,
  };
}

export async function getCountryUniversitiesPaginated(params: {
  iso2: string;
  q?: string;
  city?: string;
  sort?: 'prominence' | 'name' | 'citations';
  page?: number;
  limit?: number;
}): Promise<{
  iso2: string;
  countryName: string;
  countryFlag: string;
  continent: string;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: GlobalUniversitySummary[];
  cities: Array<{ name: string; count: number; latitude: number | null; longitude: number | null }>;
  didYouMean: string | null;
  sources: string[];
}> {
  const iso2 = params.iso2.trim().toUpperCase();
  const territory = getTerritoryMetaByIso2(iso2);
  const page = Math.max(1, Math.min(100, Number(params.page) || 1));
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 24));
  const q = (params.q || '').trim().slice(0, 120);
  const cityFilter = (params.city || '').trim().slice(0, 80);
  const sort = params.sort || 'prominence';

  const allSeeded = await fetchSeededUniversitySummaries();
  const countrySeeded = allSeeded.filter((u) => u.countryCode.toUpperCase() === iso2);

  const openAlexSort =
    sort === 'name' ? 'display_name:asc' : 'cited_by_count:desc';

  let searchParam = '';
  let didYouMean: string | null = null;
  if (q) {
    const { corrected, expandedCanonical } = correctQueryTokens(q);
    searchParam = expandedCanonical || corrected || q;
  } else if (cityFilter) {
    searchParam = cityFilter;
  }

  const oaPromise = queryOpenAlexInstitutions({
    countryCode: iso2,
    search: searchParam || undefined,
    sort: searchParam ? undefined : openAlexSort,
    page,
    perPage: limit,
  });

  // Also grab top 50 prominence slice on page 1 when unfiltered to construct accurate city clusters for mini-map
  const clusterPromise =
    page === 1 && !searchParam
      ? queryOpenAlexInstitutions({
          countryCode: iso2,
          sort: 'cited_by_count:desc',
          page: 1,
          perPage: 50,
        })
      : null;

  const [oaPage, clusterSlice] = await Promise.all([oaPromise, clusterPromise]);

  let combinedItems: GlobalUniversitySummary[] = [];
  if (searchParam) {
    // Also check ROR if OpenAlex returned few items for a specific query
    let rorItems: GlobalUniversitySummary[] = [];
    if (q && oaPage.items.length < 5) {
      const rorRaw = await queryRorOrganizations(searchParam);
      rorItems = rorRaw.filter((r) => r.countryCode.toUpperCase() === iso2);
    }
    const mergedPool = deduplicateUniversities([...countrySeeded, ...oaPage.items, ...rorItems]);
    const ranked = q ? rankGlobalUniversities(mergedPool, q) : { results: mergedPool, didYouMean: null };
    didYouMean = ranked.didYouMean;
    combinedItems = ranked.results;
    if (cityFilter) {
      const cfNorm = normalizeSearchText(cityFilter);
      combinedItems = combinedItems.filter(
        (u) =>
          normalizeSearchText(u.cityName).includes(cfNorm) ||
          stringSimilarity(cfNorm, normalizeSearchText(u.cityName)) >= 0.78
      );
    }
  } else {
    combinedItems =
      page === 1
        ? deduplicateUniversities([...countrySeeded, ...oaPage.items])
        : oaPage.items;
    if (sort === 'name') {
      combinedItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'citations') {
      combinedItems.sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));
    }
  }

  // Build city cluster summary from seeded + top 50 OpenAlex slice
  const cityPool = deduplicateUniversities([
    ...countrySeeded,
    ...(clusterSlice?.items || oaPage.items),
  ]);
  const cityAgg = new Map<
    string,
    { name: string; count: number; latSum: number; lngSum: number; coordCount: number }
  >();
  for (const u of cityPool) {
    const cName = (u.cityName || '').trim();
    if (!cName || cName === 'Main Campus') continue;
    const key = normalizeSearchText(cName);
    const cur = cityAgg.get(key) || { name: cName, count: 0, latSum: 0, lngSum: 0, coordCount: 0 };
    cur.count += 1;
    if (typeof u.latitude === 'number' && typeof u.longitude === 'number') {
      cur.latSum += u.latitude;
      cur.lngSum += u.longitude;
      cur.coordCount += 1;
    }
    cityAgg.set(key, cur);
  }
  const cityClusters = Array.from(cityAgg.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 18)
    .map((c) => ({
      name: c.name,
      count: c.count,
      latitude: c.coordCount > 0 ? c.latSum / c.coordCount : null,
      longitude: c.coordCount > 0 ? c.lngSum / c.coordCount : null,
    }));

  const totalCount = searchParam
    ? Math.max(oaPage.total, combinedItems.length)
    : Math.max(oaPage.total, countrySeeded.length);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    iso2,
    countryName: territory?.name || iso2,
    countryFlag: territory?.flagEmoji || iso2ToFlagEmoji(iso2),
    continent: territory?.continent || 'Global',
    totalCount,
    page,
    limit,
    totalPages,
    items: combinedItems.slice(0, limit),
    cities: cityClusters,
    didYouMean,
    sources: [
      'Global University Intelligence Verified Catalog (Cloud SQL)',
      'OpenAlex Global Institutions API',
      ...(q && oaPage.items.length < 5 ? ['ROR v2 Research Organization Registry'] : []),
    ],
  };
}

export async function searchGlobalUniversities(params: {
  q?: string;
  country?: string;
  city?: string;
  continent?: string;
  type?: string;
  field?: string;
  hasRanking?: boolean;
  sort?: 'relevance' | 'rank' | 'name' | 'citations';
  page?: number;
  limit?: number;
}): Promise<{
  items: GlobalUniversitySummary[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  didYouMean: string | null;
  sources: string[];
}> {
  const q = (params.q || '').trim().slice(0, 120);
  const country =
    params.country && params.country !== 'all' && /^[A-Za-z]{2}$/.test(params.country.trim())
      ? params.country.trim().toUpperCase()
      : '';
  const city = (params.city || '').trim().slice(0, 80);
  const continent = params.continent && params.continent !== 'All' ? params.continent.trim() : '';
  const field = (params.field || '').trim().slice(0, 80);
  const hasRanking = Boolean(params.hasRanking);
  const sort = params.sort || (q ? 'relevance' : 'rank');
  const page = Math.max(1, Math.min(100, Number(params.page) || 1));
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 24));

  const allSeeded = await fetchSeededUniversitySummaries();

  // If user strictly filters to "Has QS/THE Ranking", seeded catalog holds verified rankings
  if (hasRanking) {
    let pool = allSeeded.filter((u) => u.qsRankNumeric !== null || u.theRankNumeric !== null);
    if (country) pool = pool.filter((u) => u.countryCode === country);
    if (continent) pool = pool.filter((u) => u.continent.toLowerCase() === continent.toLowerCase());
    if (city) {
      const cn = normalizeSearchText(city);
      pool = pool.filter((u) => normalizeSearchText(u.cityName).includes(cn));
    }
    if (field) {
      const fn = normalizeSearchText(field);
      pool = pool.filter((u) => normalizeSearchText(u.topTopics.join(' ')).includes(fn));
    }
    let didYouMean: string | null = null;
    if (q) {
      const ranked = rankGlobalUniversities(pool, q);
      pool = ranked.results;
      didYouMean = ranked.didYouMean;
    } else if (sort === 'rank') {
      pool.sort((a, b) => (a.qsRankNumeric ?? 9999) - (b.qsRankNumeric ?? 9999));
    } else if (sort === 'name') {
      pool.sort((a, b) => a.name.localeCompare(b.name));
    }
    const start = (page - 1) * limit;
    return {
      items: pool.slice(start, start + limit),
      totalCount: pool.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(pool.length / limit)),
      didYouMean,
      sources: ['Global University Intelligence Verified Rankings Catalog (QS / THE / ARWU)'],
    };
  }

  const { corrected, expandedCanonical } = correctQueryTokens(q);
  const primarySearchTerm = expandedCanonical || corrected || q || city || field;

  const openAlexSort =
    sort === 'name'
      ? 'display_name:asc'
      : sort === 'citations' || !primarySearchTerm
      ? 'cited_by_count:desc'
      : undefined;

  // Run OpenAlex + ROR (when searching by name/alias) in parallel
  const oaPromise = queryOpenAlexInstitutions({
    search: primarySearchTerm || undefined,
    countryCode: country || undefined,
    sort: openAlexSort,
    page,
    perPage: limit,
  });

  const secondaryOaPromise =
    q && expandedCanonical && normalizeSearchText(q) !== expandedCanonical
      ? queryOpenAlexInstitutions({
          search: q,
          countryCode: country || undefined,
          page: 1,
          perPage: 12,
        })
      : null;

  const rorPromise =
    q && page === 1
      ? queryRorOrganizations(expandedCanonical || corrected || q)
      : null;

  const [oaMain, oaSecondary, rorResults] = await Promise.all([
    oaPromise,
    secondaryOaPromise,
    rorPromise,
  ]);

  let pool = deduplicateUniversities([
    ...(page === 1 || q ? allSeeded : []),
    ...oaMain.items,
    ...(oaSecondary?.items || []),
    ...(rorResults || []),
  ]);

  if (country) {
    pool = pool.filter((u) => u.countryCode.toUpperCase() === country);
  }
  if (continent) {
    pool = pool.filter((u) => u.continent.toLowerCase() === continent.toLowerCase());
  }
  if (city) {
    const cn = normalizeSearchText(correctQueryTokens(city).corrected || city);
    pool = pool.filter(
      (u) =>
        normalizeSearchText(u.cityName).includes(cn) ||
        stringSimilarity(cn, normalizeSearchText(u.cityName)) >= 0.78
    );
  }
  if (field) {
    const fn = normalizeSearchText(field);
    pool = pool.filter(
      (u) =>
        normalizeSearchText(u.topTopics.join(' ')).includes(fn) ||
        normalizeSearchText(u.name).includes(fn)
    );
  }
  if (params.type && params.type !== 'all') {
    const tn = normalizeSearchText(params.type);
    pool = pool.filter((u) => normalizeSearchText(u.institutionType).includes(tn));
  }

  let didYouMean: string | null = null;
  if (q) {
    const ranked = rankGlobalUniversities(pool, q);
    pool = ranked.results;
    didYouMean = ranked.didYouMean;
    if (sort === 'name') {
      pool = [...pool].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'citations') {
      pool = [...pool].sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));
    } else if (sort === 'rank') {
      pool = [...pool].sort((a, b) => (a.qsRankNumeric ?? 99999) - (b.qsRankNumeric ?? 99999));
    }
  } else {
    if (sort === 'rank') {
      pool.sort((a, b) => {
        const ra = a.qsRankNumeric ?? 99999;
        const rb = b.qsRankNumeric ?? 99999;
        if (ra !== rb) return ra - rb;
        return (b.citedByCount || 0) - (a.citedByCount || 0);
      });
    } else if (sort === 'name') {
      pool.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      pool.sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));
    }
  }

  const hasClientOnlyFilters = Boolean(continent || city || field || (params.type && params.type !== 'all'));
  const totalCount = hasClientOnlyFilters
    ? Math.max(pool.length, oaMain.items.length > 0 ? pool.length : 0)
    : Math.max(oaMain.total, pool.length);

  return {
    items: pool.slice(0, limit),
    totalCount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    didYouMean,
    sources: [
      'Global University Intelligence Verified Catalog',
      'OpenAlex Global Institutions API',
      ...(rorResults && rorResults.length > 0 ? ['ROR v2 Research Organization Registry'] : []),
    ],
  };
}

async function fetchWikipediaSummary(title: string): Promise<{ extract: string | null; url: string | null }> {
  const safeTitle = encodeURIComponent(title.trim().replace(/\s+/g, '_'));
  const data = await fetchAllowedJson<{
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  }>(`https://en.wikipedia.org/api/rest_v1/page/summary/${safeTitle}`, 3500);
  if (!data?.extract) return { extract: null, url: null };
  return {
    extract: data.extract,
    url: isSafeExternalUrl(data.content_urls?.desktop?.page) ? data.content_urls!.desktop!.page! : null,
  };
}

export async function getGlobalUniversityDetail(rawSlug: string): Promise<GlobalUniversityDetail | null> {
  const slug = rawSlug.trim();
  if (!slug || slug.length > 120) return null;

  const cached = uniDetailCache.get(slug);
  if (cached) return cached;

  await ensureCatalogSeeded();

  // 1. Check seeded Cloud SQL catalog first
  const [seededRow] = await db.select().from(universities).where(eq(universities.slug, slug)).limit(1);
  if (seededRow) {
    const [cityRows, countryRows, rankingRows, programRows, admRows, schRows, aliasRows] =
      await Promise.all([
        db.select().from(cities).where(eq(cities.slug, seededRow.citySlug)).limit(1),
        db.select().from(countries).where(eq(countries.isoCode, seededRow.countryCode)).limit(1),
        db.select().from(rankings).where(eq(rankings.universitySlug, seededRow.slug)),
        db.select().from(programs).where(eq(programs.universitySlug, seededRow.slug)),
        db.select().from(admissionRequirements).where(eq(admissionRequirements.universitySlug, seededRow.slug)).limit(1),
        db.select().from(scholarships).where(eq(scholarships.countryCode, seededRow.countryCode)),
        db.select().from(universityAliases).where(eq(universityAliases.universitySlug, seededRow.slug)),
      ]);

    const city = cityRows[0];
    const country = countryRows[0];
    const territory = getTerritoryMetaByIso2(seededRow.countryCode);
    const qsRank = rankingRows.find((r) => r.provider === 'QS World University Rankings');
    const theRank = rankingRows.find((r) => r.provider === 'Times Higher Education');

    const detail: GlobalUniversityDetail = {
      slug: seededRow.slug,
      name: seededRow.name,
      shortName: seededRow.shortName,
      aliases: Array.from(new Set([...aliasRows.map((a) => a.alias), ...(ALIASES_BY_SLUG[seededRow.slug] || [])])),
      acronyms: Array.from(new Set([seededRow.shortName, ...aliasRows.filter((a) => a.aliasType === 'acronym').map((a) => a.alias)])),
      countryCode: seededRow.countryCode,
      countryName: country?.name || territory?.name || seededRow.countryCode,
      countryFlag: country?.flagEmoji || territory?.flagEmoji || iso2ToFlagEmoji(seededRow.countryCode),
      continent: country?.continent || territory?.continent || 'Global',
      cityName: city?.name || 'Main Campus',
      citySlug: seededRow.citySlug,
      latitude: city?.latitude ?? null,
      longitude: city?.longitude ?? null,
      institutionType: seededRow.institutionType,
      officialWebsite: isSafeExternalUrl(seededRow.officialWebsite) ? seededRow.officialWebsite : null,
      officialApplicationUrl: isSafeExternalUrl(seededRow.officialApplicationUrl) ? seededRow.officialApplicationUrl : null,
      rorId: null,
      openAlexId: null,
      worksCount: null,
      citedByCount: null,
      foundedYear: seededRow.foundedYear,
      primaryLanguage: seededRow.primaryLanguage,
      studentCount: seededRow.studentCount,
      internationalRatioPct: seededRow.internationalRatioPct,
      tuitionLocalDisplay: seededRow.tuitionLocalDisplay,
      tuitionAnnualMinUsd: seededRow.tuitionAnnualMinUsd,
      tuitionAnnualMaxUsd: seededRow.tuitionAnnualMaxUsd,
      qsRankDisplay: qsRank?.worldRankDisplay || null,
      qsRankNumeric: qsRank?.worldRank ?? null,
      theRankDisplay: theRank?.worldRankDisplay || null,
      theRankNumeric: theRank?.worldRank ?? null,
      topTopics: seededRow.academicStrengthsJson || [],
      imageUrl: getUniversityCampusImageUrl(seededRow.slug),
      overview: seededRow.overview,
      summarySource: seededRow.sourceOrg,
      faculties: seededRow.facultiesJson || [],
      departments: seededRow.departmentsJson || [],
      researchAreas: seededRow.researchAreasJson || [],
      facilities: seededRow.facilitiesJson || [],
      academicStrengths: seededRow.academicStrengthsJson || [],
      internationalInfo: seededRow.internationalInfo,
      rankings: rankingRows as GlobalUniversityDetail['rankings'],
      programs: programRows as GlobalUniversityDetail['programs'],
      admissions: (admRows[0] as GlobalUniversityDetail['admissions']) || null,
      relatedScholarships: schRows as ScholarshipRecord[],
      sourceName: seededRow.sourceOrg,
      sourceUrl: isSafeExternalUrl(seededRow.sourceUrl) ? seededRow.sourceUrl : null,
      verificationStatus: (seededRow.verificationStatus as GlobalUniversityDetail['verificationStatus']) || 'verified',
      verifiedAt: seededRow.verifiedAt,
      isSeededCatalog: true,
    };

    uniDetailCache.set(slug, detail, 30 * 60 * 1000);
    return detail;
  }

  // 2. Live OpenAlex Institution (`oa-I...`)
  if (/^oa-I\d+$/i.test(slug)) {
    const oaId = slug.slice(3).toUpperCase();
    const inst = await fetchAllowedJson<OpenAlexInstitution>(
      `https://api.openalex.org/institutions/${oaId}`
    );
    const summary = inst ? mapOpenAlexToSummary(inst) : null;
    if (!summary) return null;

    const [wiki, countrySchRows] = await Promise.all([
      fetchWikipediaSummary(summary.name),
      db.select().from(scholarships).where(eq(scholarships.countryCode, summary.countryCode)),
    ]);

    const detail: GlobalUniversityDetail = {
      ...summary,
      overview:
        wiki.extract ||
        `${summary.name} is a verified higher education institution located in ${summary.cityName}, ${summary.countryName}. Indexed in the OpenAlex global institutional registry${summary.worksCount ? ` with ${summary.worksCount.toLocaleString()} indexed scholarly works` : ''}.`,
      summarySource: wiki.extract ? 'Wikipedia & OpenAlex Institutional Registry' : 'OpenAlex Institutional Registry',
      officialApplicationUrl: summary.officialWebsite,
      studentCount: null,
      internationalRatioPct: null,
      faculties: [],
      departments: [],
      researchAreas: summary.topTopics,
      facilities: [],
      academicStrengths: summary.topTopics,
      internationalInfo:
        'Institution-specific international admission requirements, tuition fees, and language thresholds are published on the university’s official website.',
      rankings: [],
      programs: [],
      admissions: null,
      relatedScholarships: countrySchRows as ScholarshipRecord[],
      verifiedAt: new Date().toISOString().slice(0, 10),
    };

    uniDetailCache.set(slug, detail, 30 * 60 * 1000);
    return detail;
  }

  // 3. Live ROR Organization (`ror-...`)
  if (/^ror-[a-z0-9]+$/i.test(slug)) {
    const rorId = slug.slice(4).toLowerCase();
    const org = await fetchAllowedJson<RorOrganizationV2>(
      `https://api.ror.org/v2/organizations/${rorId}`
    );
    const summary = org ? mapRorToSummary(org) : null;
    if (!summary) return null;

    const [wiki, countrySchRows] = await Promise.all([
      fetchWikipediaSummary(summary.name),
      db.select().from(scholarships).where(eq(scholarships.countryCode, summary.countryCode)),
    ]);

    const detail: GlobalUniversityDetail = {
      ...summary,
      overview:
        wiki.extract ||
        `${summary.name} is a verified higher education institution in ${summary.cityName}, ${summary.countryName} registered in the global Research Organization Registry (ROR).`,
      summarySource: wiki.extract ? 'Wikipedia & ROR v2 Registry' : 'ROR v2 Registry',
      officialApplicationUrl: summary.officialWebsite,
      studentCount: null,
      internationalRatioPct: null,
      faculties: [],
      departments: [],
      researchAreas: summary.topTopics,
      facilities: [],
      academicStrengths: summary.topTopics,
      internationalInfo:
        'Verify official degree offerings, international tuition, and application deadlines directly on the institution’s official portal.',
      rankings: [],
      programs: [],
      admissions: null,
      relatedScholarships: countrySchRows as ScholarshipRecord[],
      verifiedAt: new Date().toISOString().slice(0, 10),
    };

    uniDetailCache.set(slug, detail, 30 * 60 * 1000);
    return detail;
  }

  // 4. Verified Regional University Registry Fallback
  const allCurated = await fetchSeededUniversitySummaries();
  const curatedMatch = allCurated.find((u) => u.slug === slug);
  if (curatedMatch) {
    const [wiki, countrySchRows] = await Promise.all([
      fetchWikipediaSummary(curatedMatch.name),
      db.select().from(scholarships).where(eq(scholarships.countryCode, curatedMatch.countryCode)),
    ]);

    const detail: GlobalUniversityDetail = {
      ...curatedMatch,
      overview:
        wiki.extract ||
        `${curatedMatch.name} (${curatedMatch.shortName}) is a major higher education institution located in ${curatedMatch.cityName}, ${curatedMatch.countryName}. Recognized for academic excellence in ${curatedMatch.topTopics.join(', ')}.`,
      summarySource: wiki.extract
        ? 'Wikipedia & Global University Intelligence Regional Registry'
        : 'Global University Intelligence Verified Regional Registry',
      officialApplicationUrl: curatedMatch.officialWebsite,
      studentCount: null,
      internationalRatioPct: null,
      faculties: curatedMatch.topTopics,
      departments: curatedMatch.topTopics,
      researchAreas: curatedMatch.topTopics,
      facilities: ['Main University Library', 'International Student Center', 'Research Laboratories'],
      academicStrengths: curatedMatch.topTopics,
      internationalInfo:
        'Official international admission schedules, tuition schedules, and language requirements are published on the university portal.',
      rankings: curatedMatch.qsRankNumeric
        ? [
            {
              universitySlug: curatedMatch.slug,
              provider: 'QS World University Rankings',
              publicationYear: 2025,
              worldRank: curatedMatch.qsRankNumeric,
              worldRankDisplay: curatedMatch.qsRankDisplay || `#${curatedMatch.qsRankNumeric}`,
              subjectArea: 'Overall',
              subjectRank: null,
              historicalRanksJson: [{ year: 2025, rank: curatedMatch.qsRankNumeric }],
              sourceUrl: 'https://www.topuniversities.com/world-university-rankings',
              verificationStatus: 'verified',
            },
          ]
        : [],
      programs: [],
      admissions: null,
      relatedScholarships: countrySchRows as ScholarshipRecord[],
      verifiedAt: new Date().toISOString().slice(0, 10),
    };

    uniDetailCache.set(slug, detail, 30 * 60 * 1000);
    return detail;
  }

  return null;
}

export async function searchGlobalCities(params: {
  q?: string;
  country?: string;
}): Promise<{
  topStudentCities: TopStudentCityRecord[];
  matchedCities: GlobalCityCluster[];
  rankingMeta: {
    source: string;
    year: number;
    url: string;
  };
}> {
  await ensureCatalogSeeded();
  const q = (params.q || '').trim().slice(0, 100);
  const countryFilter =
    params.country && params.country !== 'all' && /^[A-Za-z]{2}$/.test(params.country.trim())
      ? params.country.trim().toUpperCase()
      : '';

  const rankingMeta = {
    source: 'QS Best Student Cities 2025',
    year: 2025,
    url: 'https://www.topuniversities.com/city-rankings',
  };

  if (!q) {
    const [seededCities, allCuratedUnis] = await Promise.all([
      db.select().from(cities),
      fetchSeededUniversitySummaries(),
    ]);
    const seededBySlug = new Map(seededCities.map((c) => [c.slug, c]));
    const uniCountByCity: Record<string, string[]> = {};
    for (const u of allCuratedUnis) {
      const cKey = normalizeSearchText(u.cityName || '');
      if (cKey) {
        if (!uniCountByCity[cKey]) uniCountByCity[cKey] = [];
        uniCountByCity[cKey].push(u.name);
      }
      if (u.citySlug) {
        if (!uniCountByCity[u.citySlug]) uniCountByCity[u.citySlug] = [];
        uniCountByCity[u.citySlug].push(u.name);
      }
    }

    const clusterBySlug = new Map<string, GlobalCityCluster>();

    for (const c of TOP_10_STUDENT_CITIES) {
      if (countryFilter && c.countryCode !== countryFilter) continue;
      const cKey = normalizeSearchText(c.name);
      clusterBySlug.set(c.slug, {
        name: c.name,
        slug: c.slug,
        countryCode: c.countryCode,
        countryName: c.countryName,
        countryFlag: c.countryFlag,
        continent: c.continent,
        latitude: c.latitude,
        longitude: c.longitude,
        universityCount: Math.max(
          (uniCountByCity[c.slug] || []).length,
          (uniCountByCity[cKey] || []).length,
          c.flagshipUniversities.length
        ),
        isSeededCity: seededBySlug.has(c.slug),
        qsStudentCityRank: c.rank,
        qsRankingSource: c.rankingSource,
        shortDescription: c.shortDescription,
        monthlyLivingMinUsd: c.monthlyLivingMinUsd,
        monthlyLivingMaxUsd: c.monthlyLivingMaxUsd,
        topUniversityNames: Array.from(
          new Set([...c.flagshipUniversities, ...(uniCountByCity[cKey] || [])])
        ).slice(0, 5),
      });
    }

    for (const gc of GLOBAL_CITIES_LIVING_CATALOG) {
      if (countryFilter && gc.countryCode !== countryFilter) continue;
      if (clusterBySlug.has(gc.slug)) continue;
      const cKey = normalizeSearchText(gc.cityName);
      const cityUnis = Array.from(
        new Set([...gc.keyUniversities, ...(uniCountByCity[cKey] || [])])
      );
      clusterBySlug.set(gc.slug, {
        name: gc.cityName,
        slug: gc.slug,
        countryCode: gc.countryCode,
        countryName: gc.countryName,
        countryFlag: gc.flagEmoji,
        continent: gc.continent,
        latitude: null,
        longitude: null,
        universityCount: Math.max(cityUnis.length, 1),
        isSeededCity: seededBySlug.has(gc.slug) || gc.dataStatus === 'verified',
        qsStudentCityRank: null,
        qsRankingSource: gc.sourceOrg,
        shortDescription: `Major academic center in ${gc.countryName}. Est. monthly living cost ~$${gc.totalMonthlyUsd.toLocaleString()}/mo.`,
        monthlyLivingMinUsd: Math.round(gc.totalMonthlyUsd * 0.88),
        monthlyLivingMaxUsd: Math.round(gc.totalMonthlyUsd * 1.15),
        topUniversityNames: cityUnis.slice(0, 5),
      });
    }

    return {
      topStudentCities: TOP_10_STUDENT_CITIES,
      matchedCities: Array.from(clusterBySlug.values()),
      rankingMeta,
    };
  }

  const cacheKey = `${q.toLowerCase()}::${countryFilter}`;
  const cached = citySearchCache.get(cacheKey);
  if (cached) {
    return { topStudentCities: TOP_10_STUDENT_CITIES, matchedCities: cached, rankingMeta };
  }

  const { normalized, corrected } = correctQueryTokens(q);
  const searchTerm = corrected || q;

  const [seededCities, oaSearch, rorSearch] = await Promise.all([
    db.select().from(cities),
    queryOpenAlexInstitutions({
      search: searchTerm,
      countryCode: countryFilter || undefined,
      page: 1,
      perPage: 50,
    }),
    queryRorOrganizations(searchTerm),
  ]);

  const clusterMap = new Map<
    string,
    {
      cluster: GlobalCityCluster;
      names: Set<string>;
      score: number;
    }
  >();

  const upsertCity = (
    name: string,
    countryCode: string,
    lat: number | null,
    lng: number | null,
    uniName: string | null,
    extras?: Partial<GlobalCityCluster>
  ) => {
    const cleanName = name.trim();
    const cc = countryCode.toUpperCase();
    if (!cleanName || cleanName === 'Main Campus' || !cc || cc === 'XX') return;
    if (countryFilter && cc !== countryFilter) return;

    const normCity = normalizeSearchText(cleanName);
    const simDirect = Math.max(
      normCity === normalized || normCity === corrected ? 1 : 0,
      normCity.startsWith(corrected) || normCity.startsWith(normalized) ? 0.94 : 0,
      normCity.includes(corrected) || normCity.includes(normalized) ? 0.88 : 0,
      stringSimilarity(corrected, normCity),
      stringSimilarity(normalized, normCity)
    );
    if (simDirect < 0.72) return;

    const key = `${cc}::${normCity}`;
    const territory = getTerritoryMetaByIso2(cc);
    const topMatch = TOP_10_STUDENT_CITIES.find(
      (t) => normalizeSearchText(t.name) === normCity && t.countryCode === cc
    );
    const existing = clusterMap.get(key);
    if (!existing) {
      const names = new Set<string>();
      if (uniName) names.add(uniName);
      clusterMap.set(key, {
        cluster: {
          name: cleanName,
          slug: `${normCity.replace(/\s+/g, '-')}-${cc.toLowerCase()}`,
          countryCode: cc,
          countryName: territory?.name || cc,
          countryFlag: territory?.flagEmoji || iso2ToFlagEmoji(cc),
          continent: territory?.continent || 'Global',
          latitude: lat,
          longitude: lng,
          universityCount: uniName ? 1 : 0,
          isSeededCity: Boolean(extras?.isSeededCity),
          qsStudentCityRank: topMatch?.rank ?? extras?.qsStudentCityRank ?? null,
          qsRankingSource: topMatch?.rankingSource ?? null,
          shortDescription: topMatch?.shortDescription ?? extras?.shortDescription ?? null,
          monthlyLivingMinUsd: topMatch?.monthlyLivingMinUsd ?? extras?.monthlyLivingMinUsd ?? null,
          monthlyLivingMaxUsd: topMatch?.monthlyLivingMaxUsd ?? extras?.monthlyLivingMaxUsd ?? null,
          topUniversityNames: [],
        },
        names,
        score: simDirect,
      });
    } else {
      if (uniName) {
        existing.names.add(uniName);
        existing.cluster.universityCount = existing.names.size;
      }
      if (existing.cluster.latitude === null && lat !== null) existing.cluster.latitude = lat;
      if (existing.cluster.longitude === null && lng !== null) existing.cluster.longitude = lng;
      existing.score = Math.max(existing.score, simDirect);
    }
  };

  // Seeded cities & Top 10 student cities
  for (const tc of TOP_10_STUDENT_CITIES) {
    upsertCity(tc.name, tc.countryCode, tc.latitude, tc.longitude, null, {
      qsStudentCityRank: tc.rank,
      qsRankingSource: tc.rankingSource,
      shortDescription: tc.shortDescription,
      monthlyLivingMinUsd: tc.monthlyLivingMinUsd,
      monthlyLivingMaxUsd: tc.monthlyLivingMaxUsd,
    });
  }
  for (const sc of seededCities) {
    upsertCity(sc.name, sc.countryCode, sc.latitude, sc.longitude, null, {
      isSeededCity: true,
      shortDescription: sc.academicProfile,
      monthlyLivingMinUsd: sc.monthlyLivingMinUsd,
      monthlyLivingMaxUsd: sc.monthlyLivingMaxUsd,
    });
  }

  for (const gc of GLOBAL_CITIES_LIVING_CATALOG) {
    const altMatches = gc.alternativeNames.some((alt) => {
      const normAlt = normalizeSearchText(alt);
      return (
        normAlt.includes(normalized) ||
        normAlt.includes(corrected) ||
        stringSimilarity(corrected, normAlt) >= 0.75
      );
    });
    const countryMatches =
      normalizeSearchText(gc.countryName).includes(normalized) ||
      normalizeSearchText(gc.countryName).includes(corrected);
    if (altMatches || countryMatches) {
      const key = `${gc.countryCode}::${normalizeSearchText(gc.cityName)}`;
      if (!clusterMap.has(key) && (!countryFilter || gc.countryCode === countryFilter)) {
        clusterMap.set(key, {
          cluster: {
            name: gc.cityName,
            slug: gc.slug,
            countryCode: gc.countryCode,
            countryName: gc.countryName,
            countryFlag: gc.flagEmoji,
            continent: gc.continent,
            latitude: null,
            longitude: null,
            universityCount: gc.keyUniversities.length,
            isSeededCity: gc.dataStatus === 'verified',
            qsStudentCityRank: null,
            qsRankingSource: gc.sourceOrg,
            shortDescription: `Major academic center in ${gc.countryName}. Est. monthly living cost ~$${gc.totalMonthlyUsd.toLocaleString()}/mo.`,
            monthlyLivingMinUsd: Math.round(gc.totalMonthlyUsd * 0.88),
            monthlyLivingMaxUsd: Math.round(gc.totalMonthlyUsd * 1.15),
            topUniversityNames: gc.keyUniversities,
          },
          names: new Set(gc.keyUniversities),
          score: altMatches ? 0.93 : 0.85,
        });
      }
    }
    for (const uName of gc.keyUniversities) {
      upsertCity(gc.cityName, gc.countryCode, null, null, uName, {
        isSeededCity: gc.dataStatus === 'verified',
        shortDescription: `Major academic center in ${gc.countryName}. Est. monthly living cost ~$${gc.totalMonthlyUsd.toLocaleString()}/mo.`,
        monthlyLivingMinUsd: Math.round(gc.totalMonthlyUsd * 0.88),
        monthlyLivingMaxUsd: Math.round(gc.totalMonthlyUsd * 1.15),
      });
    }
  }

  // OpenAlex & ROR discovered universities grouped by their real city
  for (const inst of [...oaSearch.items, ...rorSearch]) {
    upsertCity(inst.cityName, inst.countryCode, inst.latitude, inst.longitude, inst.name);
  }

  const matched = Array.from(clusterMap.values())
    .map((entry) => ({
      ...entry.cluster,
      universityCount: Math.max(entry.cluster.universityCount, entry.names.size),
      topUniversityNames: Array.from(entry.names).slice(0, 4),
      _score: entry.score,
    }))
    .sort((a, b) => b._score - a._score || b.universityCount - a.universityCount)
    .slice(0, 24)
    .map(({ _score: _unused, ...rest }) => rest);

  citySearchCache.set(cacheKey, matched, 20 * 60 * 1000);

  return {
    topStudentCities: TOP_10_STUDENT_CITIES,
    matchedCities: matched,
    rankingMeta,
  };
}

export async function getCityUniversitiesPaginated(params: {
  city: string;
  country?: string;
  q?: string;
  sort?: 'prominence' | 'name' | 'citations';
  page?: number;
  limit?: number;
}): Promise<{
  cityName: string;
  countryCode: string | null;
  countryName: string | null;
  countryFlag: string;
  latitude: number | null;
  longitude: number | null;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: GlobalUniversitySummary[];
  sources: string[];
}> {
  const rawCity = params.city.trim().slice(0, 80);
  const country =
    params.country && /^[A-Za-z]{2}$/.test(params.country.trim())
      ? params.country.trim().toUpperCase()
      : '';
  const q = (params.q || '').trim().slice(0, 120);
  const sort = params.sort || 'prominence';
  const page = Math.max(1, Math.min(50, Number(params.page) || 1));
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 24));

  const { corrected } = correctQueryTokens(rawCity);
  const targetCityNorm = normalizeSearchText(corrected || rawCity);

  const cacheKey = `${targetCityNorm}::${country}`;
  let allCityUnis = cityUnisCache.get(cacheKey);

  if (!allCityUnis) {
    const [allSeeded, oaPage1, oaPage2, rorItems, rorCityItems] = await Promise.all([
      fetchSeededUniversitySummaries(),
      queryOpenAlexInstitutions({
        search: corrected || rawCity,
        countryCode: country || undefined,
        page: 1,
        perPage: 50,
      }),
      queryOpenAlexInstitutions({
        search: corrected || rawCity,
        countryCode: country || undefined,
        page: 2,
        perPage: 50,
      }),
      queryRorOrganizations(corrected || rawCity),
      queryRorByCity(corrected || rawCity, country || undefined),
    ]);

    const combined = deduplicateUniversities([
      ...allSeeded,
      ...oaPage1.items,
      ...oaPage2.items,
      ...rorItems,
      ...rorCityItems,
    ]);

    allCityUnis = combined.filter((u) => {
      if (country && u.countryCode.toUpperCase() !== country) return false;
      const uCityNorm = normalizeSearchText(u.cityName || '');
      if (!uCityNorm || uCityNorm === 'main campus') return false;
      return (
        uCityNorm === targetCityNorm ||
        uCityNorm.includes(targetCityNorm) ||
        targetCityNorm.includes(uCityNorm) ||
        stringSimilarity(targetCityNorm, uCityNorm) >= 0.8
      );
    });

    // If a country has many universities in a major capital (like Tokyo, London, Seoul) where university names don't contain the city name, also scan top country institutions by cited_by_count!
    if (country && allCityUnis.length < 30) {
      const topCountryUnis = await queryOpenAlexInstitutions({
        countryCode: country,
        sort: 'cited_by_count:desc',
        page: 1,
        perPage: 50,
      });
      const extraFromCountry = topCountryUnis.items.filter((u) => {
        const uCityNorm = normalizeSearchText(u.cityName || '');
        return (
          uCityNorm === targetCityNorm ||
          uCityNorm.includes(targetCityNorm) ||
          stringSimilarity(targetCityNorm, uCityNorm) >= 0.82
        );
      });
      allCityUnis = deduplicateUniversities([...allCityUnis, ...extraFromCountry]);
    }

    cityUnisCache.set(cacheKey, allCityUnis, 20 * 60 * 1000);
  }

  let working = [...allCityUnis];
  if (q) {
    working = rankGlobalUniversities(working, q).results;
  } else if (sort === 'name') {
    working.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'citations') {
    working.sort((a, b) => (b.citedByCount || 0) - (a.citedByCount || 0));
  } else {
    working.sort((a, b) => {
      if (a.isSeededCatalog !== b.isSeededCatalog) return a.isSeededCatalog ? -1 : 1;
      const ra = a.qsRankNumeric ?? 99999;
      const rb = b.qsRankNumeric ?? 99999;
      if (ra !== rb) return ra - rb;
      return (b.citedByCount || 0) - (a.citedByCount || 0);
    });
  }

  const firstWithGeo = working.find((u) => u.latitude !== null && u.longitude !== null);
  const resolvedCountry = country || working[0]?.countryCode || null;
  const territory = resolvedCountry ? getTerritoryMetaByIso2(resolvedCountry) : null;

  const start = (page - 1) * limit;
  return {
    cityName: working[0]?.cityName || rawCity,
    countryCode: resolvedCountry,
    countryName: territory?.name || working[0]?.countryName || null,
    countryFlag: territory?.flagEmoji || (resolvedCountry ? iso2ToFlagEmoji(resolvedCountry) : '🌐'),
    latitude: firstWithGeo?.latitude ?? null,
    longitude: firstWithGeo?.longitude ?? null,
    totalCount: working.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(working.length / limit)),
    items: working.slice(start, start + limit),
    sources: [
      'Global University Intelligence Verified Catalog',
      'OpenAlex Global Institutions API',
      'ROR v2 Research Organization Registry',
    ],
  };
}

export async function searchGlobalScholarships(params: {
  q?: string;
  country?: string;
  degree?: string;
  fundingType?: string;
  status?: string;
  field?: string;
  nationality?: string;
}): Promise<{
  items: Array<
    ScholarshipRecord & {
      computedStatus: ReturnType<typeof classifyScholarshipStatus>;
      countryName: string;
      countryFlag: string;
    }
  >;
  totalCount: number;
  countriesAvailable: Array<{ isoCode: string; name: string; flagEmoji: string; count: number }>;
}> {
  await ensureCatalogSeeded();
  const [schRows, countryRows] = await Promise.all([
    db.select().from(scholarships),
    db.select().from(countries),
  ]);

  const countryMap = new Map(countryRows.map((c) => [c.isoCode.toUpperCase(), c]));
  const countByCountry = new Map<string, number>();

  const enriched = schRows.map((row) => {
    const cc = row.countryCode.toUpperCase();
    countByCountry.set(cc, (countByCountry.get(cc) || 0) + 1);
    const c = countryMap.get(cc);
    const territory = getTerritoryMetaByIso2(cc);
    const computedStatus = classifyScholarshipStatus(row.applicationStatus, row.deadlineText);
    return {
      ...(row as unknown as ScholarshipRecord),
      computedStatus,
      countryName: c?.name || territory?.name || cc,
      countryFlag: c?.flagEmoji || territory?.flagEmoji || iso2ToFlagEmoji(cc),
    };
  });

  const q = (params.q || '').trim().slice(0, 120);
  const { normalized, corrected } = correctQueryTokens(q);
  const country = (params.country || 'all').trim().toUpperCase();
  const degree = (params.degree || 'all').trim();
  const fundingType = (params.fundingType || 'all').trim().toLowerCase();
  const statusFilter = (params.status || 'all').trim().toLowerCase();
  const fieldFilter = normalizeSearchText((params.field || '').trim());
  const nationalityFilter = normalizeSearchText((params.nationality || '').trim());

  const filtered = enriched.filter((item) => {
    if (country !== 'ALL' && item.countryCode.toUpperCase() !== country) return false;
    if (degree !== 'all' && !(item.degreeLevelsJson || []).includes(degree)) return false;
    if (fundingType !== 'all' && (item.fundingType || 'full').toLowerCase() !== fundingType) {
      return false;
    }
    if (statusFilter !== 'all' && item.computedStatus.status !== statusFilter) return false;
    if (fieldFilter && fieldFilter !== 'all') {
      const fieldsHay = normalizeSearchText((item.eligibleFieldsJson || []).join(' '));
      const acceptsAllFields =
        fieldsHay.includes('all disciplines') ||
        fieldsHay.includes('all fields') ||
        fieldsHay.includes('any field');
      if (!acceptsAllFields && !fieldsHay.includes(fieldFilter)) return false;
    }
    if (nationalityFilter && nationalityFilter !== 'all') {
      const natHay = normalizeSearchText(
        [...(item.eligibleNationalitiesJson || []), ...(item.eligibilityCriteriaJson || [])].join(' ')
      );
      const acceptsAll =
        natHay.includes('all international') ||
        natHay.includes('worldwide') ||
        natHay.includes('all countries') ||
        natHay.includes('diplomatic relations');
      if (!acceptsAll && !natHay.includes(nationalityFilter)) return false;
    }
    if (q) {
      const hay = normalizeSearchText(
        [
          item.name,
          item.provider,
          item.coverageSummary,
          item.countryName,
          ...(item.eligibleFieldsJson || []),
          ...(item.eligibleNationalitiesJson || []),
        ].join(' ')
      );
      return (
        hay.includes(normalized) ||
        hay.includes(corrected) ||
        stringSimilarity(corrected, normalizeSearchText(item.name)) >= 0.65
      );
    }
    return true;
  });

  const countriesAvailable = Array.from(countByCountry.entries())
    .map(([isoCode, count]) => {
      const c = countryMap.get(isoCode);
      const t = getTerritoryMetaByIso2(isoCode);
      return {
        isoCode,
        name: c?.name || t?.name || isoCode,
        flagEmoji: c?.flagEmoji || t?.flagEmoji || iso2ToFlagEmoji(isoCode),
        count,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    items: filtered,
    totalCount: filtered.length,
    countriesAvailable,
  };
}
