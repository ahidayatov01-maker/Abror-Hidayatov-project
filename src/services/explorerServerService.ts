import {
  getCuratedUniversitiesForCountry,
  toDiscoveredCountryUniversity,
  type DiscoveredCountryUniversity,
  type LiveWeatherSnapshot,
} from '../data/worldwideUniversityRegistry';
import { normalizeSearchText } from '../utils/globalSearchEngine';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const countryUniCache = new Map<string, CacheEntry<DiscoveredCountryUniversity[]>>();
const weatherCache = new Map<string, CacheEntry<LiveWeatherSnapshot>>();

const UNI_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const WEATHER_CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

interface OpenAlexInstitution {
  id?: string;
  display_name?: string;
  country_code?: string;
  homepage_url?: string | null;
  works_count?: number;
  cited_by_count?: number;
  geo?: {
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  topics?: Array<{ display_name?: string }>;
  x_concepts?: Array<{ display_name?: string }>;
}

/**
 * Diversifies a list of universities across distinct cities so results
 * never cluster in a single capital city when multiple regional cities exist.
 */
export function diversifyUniversitiesByCity(
  items: DiscoveredCountryUniversity[],
  maxItems = 14
): DiscoveredCountryUniversity[] {
  if (items.length <= 1) return items;

  const byCity = new Map<string, DiscoveredCountryUniversity[]>();
  for (const item of items) {
    const cityKey = normalizeSearchText(item.city || 'Main Campus') || 'main';
    const bucket = byCity.get(cityKey) || [];
    bucket.push(item);
    byCity.set(cityKey, bucket);
  }

  // Round-robin across distinct cities first, ordered by top institution prestige in each city
  const cityBuckets = Array.from(byCity.values());
  const diversified: DiscoveredCountryUniversity[] = [];
  let round = 0;

  while (diversified.length < maxItems) {
    let addedInRound = false;
    for (const bucket of cityBuckets) {
      if (round < bucket.length && diversified.length < maxItems) {
        diversified.push(bucket[round]);
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  return diversified;
}

/**
 * Discovers geographically diverse universities in any country by ISO-2 code.
 * Combines the verified multi-city Worldwide Regional University Registry with
 * OpenAlex institution data, enforcing regional diversity and instant fallback.
 */
export async function discoverCountryUniversities(
  iso2: string,
  _countryName?: string
): Promise<DiscoveredCountryUniversity[]> {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return [];

  const now = Date.now();
  const cached = countryUniCache.get(code);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // 1. Start with verified multi-city regional universities for this country
  const curatedRecords = getCuratedUniversitiesForCountry(code).map(toDiscoveredCountryUniversity);
  const seenNames = new Set<string>(curatedRecords.map((u) => normalizeSearchText(u.name)));

  // 2. If curated registry already has rich multi-city coverage (>= 8 universities),
  // return diversified multi-city set immediately without blocking on external network latency.
  if (curatedRecords.length >= 8) {
    const diversified = diversifyUniversitiesByCity(curatedRecords, 15);
    countryUniCache.set(code, {
      data: diversified,
      expiresAt: now + UNI_CACHE_TTL_MS,
    });
    return diversified;
  }

  // 3. Otherwise, enrich with live OpenAlex institutions (with fast timeout & safe fallback)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3800);

  const liveDiscovered: DiscoveredCountryUniversity[] = [];

  try {
    const url = `https://api.openalex.org/institutions?filter=country_code:${code},type:education&sort=cited_by_count:desc&per-page=16`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GlobalUniversityIntelligence/1.0 (https://global-university.app)',
      },
    });

    if (res.ok) {
      const payload = (await res.json()) as { results?: OpenAlexInstitution[] };
      const rawResults = Array.isArray(payload.results) ? payload.results : [];

      for (const inst of rawResults) {
        const lat = inst.geo?.latitude;
        const lng = inst.geo?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') continue;
        if (!inst.display_name) continue;

        const normName = normalizeSearchText(inst.display_name);
        if (seenNames.has(normName)) continue;
        seenNames.add(normName);

        const topicsSource =
          Array.isArray(inst.topics) && inst.topics.length > 0
            ? inst.topics
            : Array.isArray(inst.x_concepts)
            ? inst.x_concepts
            : [];

        const topTopics = topicsSource
          .map((t) => t.display_name)
          .filter((name): name is string => Boolean(name))
          .slice(0, 4);

        const resolvedTopics =
          topTopics.length > 0
            ? topTopics
            : ['Higher Education', 'Academic Research', 'Science & Humanities'];
        const cityLabel = inst.geo?.city || 'Main Campus';
        const slugValue = normName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `${code.toLowerCase()}-uni`;
        const shortWords = inst.display_name
          .replace(/[^A-Za-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !['the', 'and', 'for'].includes(w.toLowerCase()));
        const derivedShortName =
          shortWords.length >= 2
            ? shortWords
                .slice(0, 4)
                .map((w) => w[0].toUpperCase())
                .join('')
            : inst.display_name.slice(0, 6).toUpperCase();

        liveDiscovered.push({
          id: inst.id || `${code}-${normName}`,
          slug: slugValue,
          name: inst.display_name,
          shortName: derivedShortName || 'UNI',
          city: cityLabel,
          countryCode: code,
          countryName: _countryName || code,
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          officialUrl: inst.homepage_url || null,
          officialWebsite: inst.homepage_url || '',
          imageUrl: null,
          worksCount: Number(inst.works_count || 0),
          citedByCount: Number(inst.cited_by_count || 0),
          topTopics: resolvedTopics,
          researchAreas: resolvedTopics,
          summary: `${inst.display_name} in ${cityLabel}, ${_countryName || code}.`,
          sourceOrg: 'OpenAlex Global Institution Registry',
          sourceUrl: inst.homepage_url || inst.id || 'https://openalex.org',
          isSeededCatalog: false,
        });
      }
    }
  } catch {
    // Graceful fallback to curated regional records
  } finally {
    clearTimeout(timer);
  }

  const combined = [...curatedRecords, ...liveDiscovered];
  const diversified = diversifyUniversitiesByCity(combined, 14);

  if (diversified.length > 0) {
    countryUniCache.set(code, {
      data: diversified,
      expiresAt: now + UNI_CACHE_TTL_MS,
    });
  }

  return diversified;
}

const WMO_WEATHER_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Moderate showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
};

/**
 * Fetches live local weather and current timezone time for any coordinate via Open-Meteo.
 */
export async function fetchLiveLocationWeather(
  lat: number,
  lng: number
): Promise<LiveWeatherSnapshot | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();
  const cached = weatherCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
      4
    )}&longitude=${lng.toFixed(
      4
    )}&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return cached?.data ?? null;

    const data = (await res.json()) as {
      timezone?: string;
      current?: {
        time?: string;
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        is_day?: number;
      };
    };

    if (!data.current || typeof data.current.temperature_2m !== 'number') {
      return cached?.data ?? null;
    }

    const code = Number(data.current.weather_code ?? 0);
    const snapshot: LiveWeatherSnapshot = {
      temperatureC: Math.round(data.current.temperature_2m * 10) / 10,
      windSpeedKmh: Math.round(Number(data.current.wind_speed_10m ?? 0)),
      weatherCode: code,
      conditionLabel: WMO_WEATHER_LABELS[code] || 'Fair conditions',
      isDay: data.current.is_day === 1,
      timezone: data.timezone || 'UTC',
      localTimeIso: data.current.time || new Date().toISOString(),
      sourceOrg: 'Open-Meteo Meteorological Network',
    };

    weatherCache.set(key, {
      data: snapshot,
      expiresAt: now + WEATHER_CACHE_TTL_MS,
    });
    return snapshot;
  } catch {
    return cached?.data ?? null;
  } finally {
    clearTimeout(timer);
  }
}

export interface ExplorerVideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  category: 'campus_tour' | 'aerial_drone' | 'student_life' | 'academic_overview';
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
  verifiedAt: string;
}

export async function discoverUniversityVideos(params: {
  universityName: string;
  shortName?: string;
  city?: string;
}): Promise<{
  universityName: string;
  videos: ExplorerVideoItem[];
  availableCategories: Array<'campus_tour' | 'aerial_drone' | 'student_life' | 'academic_overview'>;
}> {
  const { universityName } = params;
  return {
    universityName,
    videos: [],
    availableCategories: [],
  };
}
