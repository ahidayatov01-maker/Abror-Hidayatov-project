import type {
  GlobalCityCluster,
  GlobalCountrySummary,
  GlobalUniversityDetail,
  GlobalUniversitySummary,
  ScholarshipApplicationStatus,
  ScholarshipRecord,
} from '../types/domain';
import type { TopStudentCityRecord } from '../data/topStudentCities';

export interface GlobalCountriesResponse {
  countries: GlobalCountrySummary[];
  totalCountries: number;
  totalVerifiedUniversitiesGlobal: number;
  continentCounts: Record<string, number>;
}

export interface GlobalCountryUniversitiesResponse {
  iso2: string;
  countryName: string;
  countryFlag: string;
  continent: string;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: GlobalUniversitySummary[];
  cities: Array<{
    name: string;
    count: number;
    latitude: number | null;
    longitude: number | null;
  }>;
  didYouMean: string | null;
  sources: string[];
}

export interface GlobalUniversitiesSearchResponse {
  items: GlobalUniversitySummary[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  didYouMean: string | null;
  sources: string[];
}

export interface GlobalCitiesResponse {
  topStudentCities: TopStudentCityRecord[];
  matchedCities: GlobalCityCluster[];
  rankingMeta: {
    source: string;
    year: number;
    url: string;
  };
}

export interface GlobalCityUniversitiesResponse {
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
}

export interface ComputedScholarshipStatus {
  status: ScholarshipApplicationStatus;
  label: string;
  isExpired: boolean;
}

export interface EnrichedScholarshipItem extends ScholarshipRecord {
  computedStatus: ComputedScholarshipStatus;
  countryName: string;
  countryFlag: string;
}

export interface GlobalScholarshipsResponse {
  items: EnrichedScholarshipItem[];
  totalCount: number;
  countriesAvailable: Array<{
    isoCode: string;
    name: string;
    flagEmoji: string;
    count: number;
  }>;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) message = errBody.error;
    } catch {
      // ignore non-json error bodies
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function fetchGlobalCountries(
  params: { q?: string; continent?: string } = {},
  signal?: AbortSignal
): Promise<GlobalCountriesResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.continent && params.continent !== 'All') qs.set('continent', params.continent);
  const queryStr = qs.toString();
  return fetchJson<GlobalCountriesResponse>(
    `/api/global/countries${queryStr ? `?${queryStr}` : ''}`,
    signal
  );
}

export function fetchCountryUniversities(
  iso2: string,
  params: {
    q?: string;
    city?: string;
    sort?: 'prominence' | 'name' | 'citations';
    page?: number;
    limit?: number;
  } = {},
  signal?: AbortSignal
): Promise<GlobalCountryUniversitiesResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.city?.trim()) qs.set('city', params.city.trim());
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const queryStr = qs.toString();
  return fetchJson<GlobalCountryUniversitiesResponse>(
    `/api/global/countries/${encodeURIComponent(iso2.toUpperCase())}/universities${
      queryStr ? `?${queryStr}` : ''
    }`,
    signal
  );
}

export function fetchGlobalUniversities(
  params: {
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
  } = {},
  signal?: AbortSignal
): Promise<GlobalUniversitiesSearchResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.country && params.country !== 'all') qs.set('country', params.country);
  if (params.city?.trim()) qs.set('city', params.city.trim());
  if (params.continent && params.continent !== 'All') qs.set('continent', params.continent);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  if (params.field && params.field !== 'all') qs.set('field', params.field);
  if (params.hasRanking) qs.set('hasRanking', 'true');
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const queryStr = qs.toString();
  return fetchJson<GlobalUniversitiesSearchResponse>(
    `/api/global/universities${queryStr ? `?${queryStr}` : ''}`,
    signal
  );
}

export function fetchGlobalUniversityDetail(
  slug: string,
  signal?: AbortSignal
): Promise<GlobalUniversityDetail> {
  return fetchJson<GlobalUniversityDetail>(
    `/api/global/universities/${encodeURIComponent(slug)}`,
    signal
  );
}

export function fetchGlobalCities(
  params: { q?: string; country?: string } = {},
  signal?: AbortSignal
): Promise<GlobalCitiesResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.country && params.country !== 'all') qs.set('country', params.country);
  const queryStr = qs.toString();
  return fetchJson<GlobalCitiesResponse>(
    `/api/global/cities${queryStr ? `?${queryStr}` : ''}`,
    signal
  );
}

export function fetchCityUniversities(
  params: {
    city: string;
    country?: string;
    q?: string;
    sort?: 'prominence' | 'name' | 'citations';
    page?: number;
    limit?: number;
  },
  signal?: AbortSignal
): Promise<GlobalCityUniversitiesResponse> {
  const qs = new URLSearchParams({ city: params.city });
  if (params.country && params.country !== 'all') qs.set('country', params.country);
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return fetchJson<GlobalCityUniversitiesResponse>(
    `/api/global/cities/universities?${qs.toString()}`,
    signal
  );
}

export function fetchGlobalScholarships(
  params: {
    q?: string;
    country?: string;
    degree?: string;
    fundingType?: string;
    status?: string;
    field?: string;
    nationality?: string;
  } = {},
  signal?: AbortSignal
): Promise<GlobalScholarshipsResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.country && params.country !== 'all') qs.set('country', params.country);
  if (params.degree && params.degree !== 'all') qs.set('degree', params.degree);
  if (params.fundingType && params.fundingType !== 'all') qs.set('fundingType', params.fundingType);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.field && params.field !== 'all') qs.set('field', params.field);
  if (params.nationality && params.nationality !== 'all') qs.set('nationality', params.nationality);
  const queryStr = qs.toString();
  return fetchJson<GlobalScholarshipsResponse>(
    `/api/global/scholarships${queryStr ? `?${queryStr}` : ''}`,
    signal
  );
}
