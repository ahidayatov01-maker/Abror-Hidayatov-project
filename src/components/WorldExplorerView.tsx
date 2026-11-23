import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ArrowRight,
  ExternalLink,
  Pause,
  Play,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  X,
  Globe2,
  Film,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWorkspaceIntelligence } from '../context/WorkspaceIntelligenceContext';
import { MotionDropdown } from '../motion/MotionPrimitives';
import {
  DigitalEarthCanvas,
  type DigitalEarthHandle,
  type GlobeUniversityMarker,
} from './world/DigitalEarthCanvas';
import {
  UniversityCinemaExplorer,
  type UnifiedExplorerUniversity,
} from './world/UniversityCinemaExplorer';
import { WorldUniversityProfilePanel } from './world/WorldUniversityProfilePanel';
import { GLOBE_VISUAL_PRESETS, VISUAL_MODE_IDS, type GlobeVisualMode } from '../utils/globeGeo';
import { getGlobeStrings } from './world/globeStrings';
import {
  filterGlobalUniversities,
  isTgfuPriorityUniversity,
  selectFeaturedUniversity,
  sortCountryUniversitiesWithPriority,
  VERIFIED_UNIVERSITY_CAMPUS_META,
  type DynamicUniversityItem,
} from '../utils/explorerLogic';
import { normalizeSearchText } from '../utils/globalSearchEngine';
import { getCuratedUniversitiesForCountry } from '../data/worldwideUniversityRegistry';
import {
  getAllWorldTerritories,
  getTerritoryMetaByIso2,
  type WorldTerritoryMeta,
} from '../utils/isoCountries';
import {
  fetchCountryUniversities,
  fetchGlobalCountries,
  fetchGlobalUniversities,
  type GlobalCountryUniversitiesResponse,
} from '../services/globalApi';
import type { GlobalUniversitySummary } from '../types/domain';

const CONTINENTS = [
  'All',
  'Asia',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Oceania',
] as const;

const DISCIPLINES = [
  'All',
  'Computer Science',
  'Artificial Intelligence',
  'Engineering',
  'Economics',
  'Physics',
  'Medicine',
  'Law',
] as const;

export const WorldExplorerView: React.FC = () => {
  const {
    catalog,
    countriesByCode,
    citiesBySlug,
    universitiesBySlug,
    selectedCountryCode,
    setSelectedCountryCode,
    openCountryProfile,
    openCityInExplorer,
    openUniversityProfile,
    recordRecentlyViewedUniversity,
    language,
    t,
  } = useApp();

  const gs = useMemo(() => getGlobeStrings(language), [language]);

  const globeRef = useRef<DigitalEarthHandle | null>(null);
  const mapStageRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const [continentFilter, setContinentFilter] = useState<string>('All');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDeselected, setIsDeselected] = useState(false);

  // Active university spotlight inside World Explorer (switches cleanly without leaving World Explorer)
  const [selectedExplorerUniSlug, setSelectedExplorerUniSlug] = useState<string | null>(null);
  const [isUniProfileOpen, setIsUniProfileOpen] = useState<boolean>(false);

  // Dynamic non-catalog country state (any of 177 world territories clicked on globe or searched)
  const [dynamicCountryMeta, setDynamicCountryMeta] = useState<WorldTerritoryMeta | null>(null);
  const [dynamicRegistry, setDynamicRegistry] = useState<Record<string, DynamicUniversityItem>>({});
  const [dynamicByCountry, setDynamicByCountry] = useState<Record<string, DynamicUniversityItem[]>>({});
  const [isLoadingDynamicCountry, setIsLoadingDynamicCountry] = useState(false);
  const [dynamicCountryError, setDynamicCountryError] = useState<string | null>(null);

  // Full verified global directory data for the selected country (works for ALL countries, seeded + global)
  const [globalCountsByCountry, setGlobalCountsByCountry] = useState<Record<string, number>>({});
  const [countryDirectoryData, setCountryDirectoryData] =
    useState<GlobalCountryUniversitiesResponse | null>(null);
  const [countryDirectoryItems, setCountryDirectoryItems] = useState<GlobalUniversitySummary[]>([]);
  const [countryUniSearch, setCountryUniSearch] = useState('');
  const [countryUniCityFilter, setCountryUniCityFilter] = useState('');
  const [countryUniSort, setCountryUniSort] = useState<'prominence' | 'name' | 'citations'>('prominence');
  const [countryUniPage, setCountryUniPage] = useState(1);
  const [isLoadingCountryDirectory, setIsLoadingCountryDirectory] = useState(false);
  const [countryDirectoryError, setCountryDirectoryError] = useState<string | null>(null);
  const [countryDirectoryRetryTick, setCountryDirectoryRetryTick] = useState(0);

  // Live global search dropdown suggestions (OpenAlex + ROR + Cloud SQL aliases)
  const [remoteSearchUnis, setRemoteSearchUnis] = useState<GlobalUniversitySummary[]>([]);
  const [isSearchingRemoteUnis, setIsSearchingRemoteUnis] = useState(false);

  // 3D Globe Visual & Telemetry Controls
  const [zoomPct, setZoomPct] = useState<number>(100);
  const [orientation, setOrientation] = useState<{ lat: number; lon: number }>({
    lat: 26,
    lon: 42,
  });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [visualMode, setVisualMode] = useState<GlobeVisualMode>('digital');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showEquatorMeridian, setShowEquatorMeridian] = useState<boolean>(true);
  const [showCityMarkers, setShowCityMarkers] = useState<boolean>(true);
  const [showCountryLabels, setShowCountryLabels] = useState<boolean>(true);
  const [showClouds, setShowClouds] = useState<boolean>(false);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showTerrainRelief, setShowTerrainRelief] = useState<boolean>(false);
  const [showUniversityMarkers, setShowUniversityMarkers] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleSelectVisualMode = (modeId: GlobeVisualMode) => {
    setVisualMode(modeId);
    if (modeId === 'realistic') {
      setShowClouds(true);
    } else if (modeId === 'terrain') {
      setShowTerrainRelief(true);
    }
  };

  const allWorldTerritories = useMemo(() => getAllWorldTerritories(), []);

  // Sync external country selection (e.g. from Countries or City Explorer)
  useEffect(() => {
    if (selectedCountryCode && countriesByCode[selectedCountryCode]) {
      setIsDeselected(false);
      setDynamicCountryMeta(null);
    }
  }, [selectedCountryCode, countriesByCode]);

  // Listen to native fullscreen exit (Esc key)
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Active Country resolution (Seeded Flagship Country OR Dynamic World Territory)
  const activeSeedCountry = isDeselected
    ? null
    : dynamicCountryMeta
    ? null
    : countriesByCode[selectedCountryCode] || catalog.countries[0] || null;

  const activeCountryCode = isDeselected
    ? ''
    : dynamicCountryMeta?.iso2 || activeSeedCountry?.isoCode || '';
  const activeCountryName = isDeselected
    ? ''
    : dynamicCountryMeta?.name || activeSeedCountry?.name || '';
  const activeCountryFlag = isDeselected
    ? ''
    : dynamicCountryMeta?.flagEmoji || activeSeedCountry?.flagEmoji || '';
  const activeContinent = isDeselected
    ? ''
    : dynamicCountryMeta?.continent || activeSeedCountry?.continent || '';

  // Fetch dynamic universities lazily when a non-catalog world country is selected
  useEffect(() => {
    if (!dynamicCountryMeta) {
      setIsLoadingDynamicCountry(false);
      setDynamicCountryError(null);
      return;
    }

    const iso2 = dynamicCountryMeta.iso2;
    if (dynamicByCountry[iso2]) {
      setIsLoadingDynamicCountry(false);
      setDynamicCountryError(
        dynamicByCountry[iso2].length === 0 ? gs.discoveryUnavailable : null
      );
      return;
    }

    const controller = new AbortController();
    setIsLoadingDynamicCountry(true);
    setDynamicCountryError(null);

    const qs = new URLSearchParams({ iso2, name: dynamicCountryMeta.name });
    fetch(`/api/explorer/country?${qs.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(gs.discoveryUnavailable);
        return (await res.json()) as { universities?: DynamicUniversityItem[] };
      })
      .then((data) => {
        const list = Array.isArray(data.universities) ? data.universities : [];
        setDynamicByCountry((prev) => ({ ...prev, [iso2]: list }));
        if (list.length > 0) {
          setDynamicRegistry((prev) => {
            const next = { ...prev };
            for (const item of list) next[item.slug] = item;
            return next;
          });
        } else {
          setDynamicCountryError(gs.discoveryUnavailable);
        }
        setIsLoadingDynamicCountry(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setIsLoadingDynamicCountry(false);
        setDynamicCountryError(err instanceof Error ? err.message : gs.discoveryUnavailable);
      });

    return () => controller.abort();
  }, [dynamicCountryMeta, dynamicByCountry, gs.discoveryUnavailable]);

  // Load real global verified university counts per country once for accurate strip badges
  useEffect(() => {
    const controller = new AbortController();
    fetchGlobalCountries({}, controller.signal)
      .then((res) => {
        const counts: Record<string, number> = {};
        for (const c of res.countries) {
          counts[c.isoCode] = c.totalVerifiedUniversities;
        }
        setGlobalCountsByCountry(counts);
      })
      .catch(() => {
        // Fallback smoothly to catalog counts if unavailable
      });
    return () => controller.abort();
  }, []);

  // Reset in-country filters when active country changes
  useEffect(() => {
    setCountryUniSearch('');
    setCountryUniCityFilter('');
    setCountryUniSort('prominence');
    setCountryUniPage(1);
    setCountryDirectoryItems([]);
    setCountryDirectoryData(null);
    setCountryDirectoryError(null);
  }, [activeCountryCode]);

  // Reset to page 1 when in-country query, city filter, or sort changes
  useEffect(() => {
    setCountryUniPage(1);
  }, [countryUniSearch, countryUniCityFilter, countryUniSort]);

  // Fetch complete paginated verified university directory for ANY selected country
  useEffect(() => {
    if (!activeCountryCode || isDeselected) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoadingCountryDirectory(true);
      setCountryDirectoryError(null);
      fetchCountryUniversities(
        activeCountryCode,
        {
          q: countryUniSearch,
          city: countryUniCityFilter,
          sort: countryUniSort,
          page: countryUniPage,
          limit: 24,
        },
        controller.signal
      )
        .then((res) => {
          setCountryDirectoryData(res);
          setCountryDirectoryItems((prev) => {
            if (countryUniPage === 1) return res.items;
            const seen = new Set(prev.map((i) => i.slug));
            const merged = [...prev];
            for (const item of res.items) {
              if (!seen.has(item.slug)) {
                seen.add(item.slug);
                merged.push(item);
              }
            }
            return merged;
          });
          setIsLoadingCountryDirectory(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setIsLoadingCountryDirectory(false);
          setCountryDirectoryError(
            err instanceof Error ? err.message : 'Unable to load country universities right now.'
          );
        });
    }, countryUniSearch ? 220 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    activeCountryCode,
    isDeselected,
    countryUniSearch,
    countryUniCityFilter,
    countryUniSort,
    countryUniPage,
    countryDirectoryRetryTick,
  ]);

  // Live debounced global university search for top search bar (supports aliases, typos, global institutions)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setRemoteSearchUnis([]);
      setIsSearchingRemoteUnis(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearchingRemoteUnis(true);
      fetchGlobalUniversities({ q, limit: 8 }, controller.signal)
        .then((res) => {
          setRemoteSearchUnis(res.items);
          setIsSearchingRemoteUnis(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setIsSearchingRemoteUnis(false);
        });
    }, 240);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Global search results (World Territories + Seeded Universities)
  const matchingGlobalUnis = useMemo(
    () =>
      filterGlobalUniversities({
        universities: catalog.universities,
        citiesBySlug,
        countriesByCode,
        query: searchQuery,
        discipline: disciplineFilter,
      }),
    [catalog.universities, citiesBySlug, countriesByCode, searchQuery, disciplineFilter]
  );

  const matchingWorldTerritories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allWorldTerritories
      .filter(
        (tItem) =>
          tItem.name.toLowerCase().includes(q) || tItem.iso2.toLowerCase() === q
      )
      .slice(0, 6);
  }, [allWorldTerritories, searchQuery]);

  const filteredCountries = useMemo(() => {
    const matchingUniCountryCodes = new Set(matchingGlobalUnis.map((u) => u.countryCode));
    return catalog.countries.filter((c) => {
      if (continentFilter !== 'All' && c.continent !== continentFilter) return false;
      if (disciplineFilter !== 'All' && !matchingUniCountryCodes.has(c.isoCode)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.capital.toLowerCase().includes(q) ||
          c.isoCode.toLowerCase() === q ||
          matchingUniCountryCodes.has(c.isoCode)
        );
      }
      return true;
    });
  }, [catalog.countries, continentFilter, disciplineFilter, searchQuery, matchingGlobalUnis]);

  const filteredCountryCodes = useMemo(
    () => new Set(filteredCountries.map((c) => c.isoCode)),
    [filteredCountries]
  );

  const universityCountByCountry = useMemo(() => {
    const counts: Record<string, number> = { ...globalCountsByCountry };
    for (const u of catalog.universities) {
      counts[u.countryCode] = Math.max(counts[u.countryCode] || 0, 1);
    }
    return counts;
  }, [catalog.universities, globalCountsByCountry]);

  const universityCountByCity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of catalog.universities) {
      counts[u.citySlug] = (counts[u.citySlug] || 0) + 1;
    }
    return counts;
  }, [catalog.universities]);

  const activeCountryCities = useMemo(
    () =>
      activeSeedCountry
        ? catalog.cities.filter((c) => c.countryCode === activeSeedCountry.isoCode)
        : [],
    [catalog.cities, activeSeedCountry]
  );

  // Unified list of geographically diverse universities for the currently active country (seeded + curated regional + dynamic OpenAlex)
  const activeCountryUnifiedUnis: UnifiedExplorerUniversity[] = useMemo(() => {
    if (isDeselected || !activeCountryCode) return [];

    const countryName = activeCountryName || activeCountryCode;
    const countryFlag = activeCountryFlag || '🌐';
    const seenNames = new Set<string>();
    const seenSlugs = new Set<string>();
    const results: UnifiedExplorerUniversity[] = [];

    // 1. Seeded catalog universities for this country
    const seededUnis = sortCountryUniversitiesWithPriority(
      catalog.universities,
      activeCountryCode
    );
    const cityCountSeen: Record<string, number> = {};
    for (const u of seededUnis) {
      const city = citiesBySlug[u.citySlug];
      const campusMeta = VERIFIED_UNIVERSITY_CAMPUS_META[u.slug];
      const idxInCity = cityCountSeen[u.citySlug] || 0;
      cityCountSeen[u.citySlug] = idxInCity + 1;
      const latOffset = idxInCity === 0 ? 0 : Math.sin(idxInCity * 2.1) * 0.22;
      const lonOffset = idxInCity === 0 ? 0 : Math.cos(idxInCity * 2.1) * 0.26;
      const normName = normalizeSearchText(u.name);
      seenNames.add(normName);
      seenSlugs.add(u.slug);

      results.push({
        slug: u.slug,
        name: u.name,
        shortName: u.shortName,
        countryCode: u.countryCode,
        countryName,
        countryFlag,
        cityName: city?.name || u.citySlug,
        latitude: campusMeta ? campusMeta.latitude : city ? city.latitude + latOffset : null,
        longitude: campusMeta ? campusMeta.longitude : city ? city.longitude + lonOffset : null,
        officialWebsite: u.officialWebsite,
        officialMediaUrl: u.officialMediaUrl,
        officialApplicationUrl: u.officialApplicationUrl,
        isSeededCatalog: true,
        seedRecord: u,
      });
    }

    // 2. Curated Worldwide Multi-City Regional Registry universities for this country
    const curatedRegional = getCuratedUniversitiesForCountry(activeCountryCode);
    for (const reg of curatedRegional) {
      const normName = normalizeSearchText(reg.name);
      if (seenSlugs.has(reg.slug) || seenNames.has(normName)) continue;
      seenSlugs.add(reg.slug);
      seenNames.add(normName);

      const dynRecord: DynamicUniversityItem = {
        slug: reg.slug,
        name: reg.name,
        shortName: reg.shortName,
        countryCode: reg.countryCode,
        countryName,
        city: reg.cityName,
        latitude: reg.lat,
        longitude: reg.lng,
        officialWebsite: reg.officialWebsite,
        imageUrl: null,
        worksCount: reg.worksCount ?? 28000,
        citedByCount: reg.citedByCount ?? 520000,
        researchAreas: reg.topTopics,
        summary: `${reg.name} (${reg.shortName}) in ${reg.cityName}, ${countryName}.`,
        sourceOrg: 'Verified Global University Registry',
        sourceUrl: reg.officialWebsite,
        isSeededCatalog: false,
      };

      results.push({
        slug: reg.slug,
        name: reg.name,
        shortName: reg.shortName,
        countryCode: reg.countryCode,
        countryName,
        countryFlag,
        cityName: reg.cityName,
        latitude: reg.lat,
        longitude: reg.lng,
        officialWebsite: reg.officialWebsite,
        officialMediaUrl: reg.officialWebsite,
        officialApplicationUrl: reg.officialWebsite,
        isSeededCatalog: false,
        dynamicRecord: dynRecord,
      });
    }

    // 3. Dynamic OpenAlex / Explorer endpoint items
    const dynList = sortCountryUniversitiesWithPriority(
      (dynamicByCountry[activeCountryCode] || []).map((raw) => {
        const fallbackSlug =
          raw.slug ||
          normalizeSearchText(raw.name || 'uni')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') ||
          'uni';
        const fallbackShort =
          raw.shortName ||
          (raw.name || 'UNI')
            .replace(/[^A-Za-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 4)
            .map((w) => w[0]?.toUpperCase() || '')
            .join('') ||
          'UNI';
        return {
          ...raw,
          slug: fallbackSlug,
          shortName: fallbackShort,
          countryCode: raw.countryCode || activeCountryCode,
          countryName: raw.countryName || countryName,
          city: raw.city || countryName,
          latitude: raw.latitude ?? (raw as unknown as { lat?: number }).lat ?? null,
          longitude: raw.longitude ?? (raw as unknown as { lng?: number }).lng ?? null,
          officialWebsite:
            raw.officialWebsite ||
            (raw as unknown as { officialUrl?: string }).officialUrl ||
            '',
          researchAreas:
            raw.researchAreas ||
            (raw as unknown as { topTopics?: string[] }).topTopics ||
            ['Higher Education'],
          worksCount: raw.worksCount ?? 0,
          citedByCount: raw.citedByCount ?? 0,
        };
      }),
      activeCountryCode
    );
    for (const d of dynList) {
      const normName = normalizeSearchText(d.name);
      if (seenSlugs.has(d.slug) || seenNames.has(normName)) continue;
      seenSlugs.add(d.slug);
      seenNames.add(normName);

      results.push({
        slug: d.slug,
        name: d.name,
        shortName: d.shortName,
        countryCode: d.countryCode,
        countryName,
        countryFlag,
        cityName: d.city || countryName,
        latitude: d.latitude,
        longitude: d.longitude,
        officialWebsite: d.officialWebsite || '',
        officialMediaUrl: d.officialWebsite || d.sourceUrl || '',
        officialApplicationUrl: d.officialWebsite || '',
        isSeededCatalog: false,
        dynamicRecord: d,
      });
    }

    // 4. Country Directory API items (with coordinates)
    for (const dirItem of countryDirectoryItems) {
      if (dirItem.countryCode.toUpperCase() !== activeCountryCode) continue;
      const normName = normalizeSearchText(dirItem.name);
      if (seenSlugs.has(dirItem.slug) || seenNames.has(normName)) continue;
      seenSlugs.add(dirItem.slug);
      seenNames.add(normName);

      const dynRecord: DynamicUniversityItem = {
        slug: dirItem.slug,
        name: dirItem.name,
        shortName: dirItem.shortName,
        countryCode: dirItem.countryCode,
        countryName,
        city: dirItem.cityName || countryName,
        latitude: dirItem.latitude ?? 0,
        longitude: dirItem.longitude ?? 0,
        officialWebsite: dirItem.officialWebsite || '',
        imageUrl: dirItem.imageUrl ?? null,
        worksCount: dirItem.worksCount ?? 15000,
        citedByCount: dirItem.citedByCount ?? 240000,
        researchAreas: dirItem.topTopics || ['Higher Education', 'Research'],
        summary: `${dirItem.name} in ${dirItem.cityName || countryName}.`,
        sourceOrg: dirItem.sourceName || 'Verified Global Directory',
        sourceUrl: dirItem.officialWebsite || 'https://openalex.org',
        isSeededCatalog: false,
      };

      results.push({
        slug: dirItem.slug,
        name: dirItem.name,
        shortName: dirItem.shortName,
        countryCode: dirItem.countryCode,
        countryName,
        countryFlag,
        cityName: dirItem.cityName || countryName,
        latitude: dirItem.latitude,
        longitude: dirItem.longitude,
        officialWebsite: dirItem.officialWebsite || '',
        officialMediaUrl: dirItem.officialWebsite || '',
        officialApplicationUrl: dirItem.officialWebsite || '',
        isSeededCatalog: Boolean(universitiesBySlug[dirItem.slug]),
        seedRecord: universitiesBySlug[dirItem.slug],
        dynamicRecord: universitiesBySlug[dirItem.slug] ? undefined : dynRecord,
      });
    }

    return results;
  }, [
    isDeselected,
    activeCountryCode,
    activeCountryName,
    activeCountryFlag,
    dynamicByCountry,
    countryDirectoryItems,
    catalog.universities,
    citiesBySlug,
    universitiesBySlug,
  ]);

  // Featured leading university selection (QS -> THE -> ARWU methodology for seeded; citations leader for dynamic)
  const featuredMeta = useMemo(() => {
    if (activeSeedCountry) {
      const seededUnis = activeCountryUnifiedUnis
        .map((u) => u.seedRecord)
        .filter((u): u is NonNullable<typeof u> => Boolean(u));
      return selectFeaturedUniversity(seededUnis, catalog.rankings);
    }
    return {
      university: null,
      primaryRanking: null,
      methodologySummary:
        activeCountryUnifiedUnis.length > 0
          ? `${gs.liveRegistryLabel}: ${activeCountryUnifiedUnis[0].dynamicRecord?.citedByCount.toLocaleString() || 0} ${gs.citations.toLowerCase()}.`
          : '',
    };
  }, [activeSeedCountry, activeCountryUnifiedUnis, catalog.rankings, gs.liveRegistryLabel, gs.citations]);

  // Active university spotlight resolution: uses explicit click or falls back to featured country leader
  const activeUniversity: UnifiedExplorerUniversity | null = useMemo(() => {
    if (isDeselected || activeCountryUnifiedUnis.length === 0) return null;
    if (selectedExplorerUniSlug) {
      const found = activeCountryUnifiedUnis.find((u) => u.slug === selectedExplorerUniSlug);
      if (found) return found;
    }
    if (featuredMeta.university) {
      const lead = activeCountryUnifiedUnis.find((u) => u.slug === featuredMeta.university!.slug);
      if (lead) return lead;
    }
    return activeCountryUnifiedUnis[0] || null;
  }, [isDeselected, activeCountryUnifiedUnis, selectedExplorerUniSlug, featuredMeta.university]);

  // University Campus Beacons on the 3D Digital Earth (isSelected is true ONLY when explicitly selected by the user)
  const universityMarkers: GlobeUniversityMarker[] = useMemo(
    () =>
      activeCountryUnifiedUnis
        .filter((u) => u.latitude !== null && u.longitude !== null)
        .map((u) => ({
          slug: u.slug,
          name: u.name,
          shortName: u.shortName,
          city: u.cityName,
          countryName: u.countryName,
          latitude: u.latitude!,
          longitude: u.longitude!,
          isSelected: selectedExplorerUniSlug !== null && selectedExplorerUniSlug === u.slug,
          isPriority: isTgfuPriorityUniversity(u),
        })),
    [activeCountryUnifiedUnis, selectedExplorerUniSlug]
  );

  // Handlers
  const handleSelectSeedCountry = (isoCode: string, flyTo = true, preferredUniSlug?: string | null) => {
    setIsDeselected(false);
    setDynamicCountryMeta(null);
    setSelectedCountryCode(isoCode);
    setSelectedExplorerUniSlug(preferredUniSlug || null);
    if (preferredUniSlug) {
      recordRecentlyViewedUniversity(preferredUniSlug);
    }
    if (flyTo) {
      globeRef.current?.focusCountry(isoCode);
    }
  };

  const handleSelectWorldTerritory = (meta: WorldTerritoryMeta, flyTo = true) => {
    if (countriesByCode[meta.iso2]) {
      handleSelectSeedCountry(meta.iso2, flyTo);
      return;
    }
    setIsDeselected(false);
    setDynamicCountryMeta(meta);
    setSelectedExplorerUniSlug(null);
    if (flyTo) {
      globeRef.current?.focusCountry(meta.iso2);
    }
  };

  const handleSelectUniversityInExplorer = (
    slug: string,
    flyToGlobe = true,
    openProfilePanel = false
  ) => {
    setSelectedExplorerUniSlug(slug);
    recordRecentlyViewedUniversity(slug);
    if (openProfilePanel) {
      setIsUniProfileOpen(true);
    }
    const match = activeCountryUnifiedUnis.find((u) => u.slug === slug);
    if (flyToGlobe && match && match.latitude !== null && match.longitude !== null) {
      globeRef.current?.focusCoordinates(match.latitude, match.longitude, 1.88);
    }
  };

  const handleJumpToCountryAndUniversity = (countryCode: string, uniSlug: string) => {
    setSearchFocused(false);
    if (countriesByCode[countryCode]) {
      handleSelectSeedCountry(countryCode, true, uniSlug);
      const uni = universitiesBySlug[uniSlug];
      const city = uni ? citiesBySlug[uni.citySlug] : null;
      if (city) {
        globeRef.current?.focusCoordinates(city.latitude, city.longitude, 1.9);
      }
      return;
    }
    const meta = getTerritoryMetaByIso2(countryCode);
    if (meta) {
      setIsDeselected(false);
      setDynamicCountryMeta(meta);
      setSelectedExplorerUniSlug(uniSlug);
      recordRecentlyViewedUniversity(uniSlug);
      globeRef.current?.focusCountry(countryCode);
    }
  };

  // React to semantic map navigation commands from Audio Guide or AI Maslahatchi
  const { mapFocusRequest, clearMapFocus } = useWorkspaceIntelligence();
  useEffect(() => {
    if (!mapFocusRequest) return;
    const { countryCode, universitySlug } = mapFocusRequest;
    const timer = window.setTimeout(() => {
      if (universitySlug && countryCode) {
        handleJumpToCountryAndUniversity(countryCode, universitySlug);
      } else if (countryCode) {
        if (countriesByCode[countryCode]) {
          handleSelectSeedCountry(countryCode, true);
        } else {
          const meta = getTerritoryMetaByIso2(countryCode);
          if (meta) {
            handleSelectWorldTerritory(meta, true);
          } else {
            globeRef.current?.focusCountry(countryCode);
          }
        }
      }
      clearMapFocus();
    }, 180);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFocusRequest]);

  const handleContinentChange = (cont: string) => {
    setContinentFilter(cont);
    const matching = catalog.countries.filter((c) => {
      if (cont !== 'All' && c.continent !== cont) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q);
      }
      return true;
    });
    if (
      matching.length > 0 &&
      (!activeSeedCountry || !matching.some((m) => m.isoCode === activeSeedCountry.isoCode))
    ) {
      handleSelectSeedCountry(matching[0].isoCode, true);
    }
  };

  const handleDisciplineChange = (disc: string) => {
    setDisciplineFilter(disc);
    const unis = filterGlobalUniversities({
      universities: catalog.universities,
      citiesBySlug,
      countriesByCode,
      query: searchQuery,
      discipline: disc,
    });
    if (unis.length > 0) {
      handleJumpToCountryAndUniversity(unis[0].countryCode, unis[0].slug);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    setSearchFocused(false);
    if (matchingGlobalUnis.length > 0 && searchQuery.trim()) {
      handleJumpToCountryAndUniversity(
        matchingGlobalUnis[0].countryCode,
        matchingGlobalUnis[0].slug
      );
      return;
    }
    if (matchingWorldTerritories.length > 0) {
      handleSelectWorldTerritory(matchingWorldTerritories[0], true);
      return;
    }
    if (filteredCountries.length > 0) {
      handleSelectSeedCountry(filteredCountries[0].isoCode, true);
    }
  };

  const toggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    try {
      if (nextState && mapStageRef.current?.requestFullscreen) {
        await mapStageRef.current.requestFullscreen();
      } else if (!nextState && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Embedded iframe fallback already handled cleanly via fixed CSS inset-0 state
    }
  };

  const formatCoord = (val: number, posHem: string, negHem: string) =>
    `${Math.abs(val)}°${val >= 0 ? posHem : negHem}`;

  const showSearchDropdown = searchFocused && searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Global Search / Filters Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t.worldExplorer.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t.worldExplorer.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Country / University / Research Field Search with Live Dropdown */}
          <div ref={searchBoxRef} className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={gs.globalSearchPlaceholder}
              aria-label={gs.globalSearchPlaceholder}
              data-testid="world-global-search-input"
              className="glass-input pl-9 pr-3 py-1.5 rounded-xl text-sm w-64 sm:w-72"
            />

            <AnimatePresence>
              {showSearchDropdown && (
                <MotionDropdown
                  className="glass-panel absolute left-0 right-0 sm:w-96 mt-1.5 rounded-2xl z-40 max-h-80 overflow-y-auto p-2 space-y-2"
                  data-testid="world-search-dropdown"
                >
                {matchingWorldTerritories.length === 0 &&
                matchingGlobalUnis.length === 0 &&
                remoteSearchUnis.length === 0 &&
                !isSearchingRemoteUnis ? (
                  <p className="text-xs text-[var(--text-muted)] px-2.5 py-2">
                    {gs.noSearchResults}
                  </p>
                ) : (
                  <>
                    {matchingWorldTerritories.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] px-2">
                          {gs.searchGroupCountries}
                        </p>
                        {matchingWorldTerritories.map((territory) => (
                          <button
                            key={territory.iso2}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              handleSelectWorldTerritory(territory, true);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-left cursor-pointer"
                          >
                            <span className="font-medium">
                              {territory.flagEmoji} {territory.name}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono-tabular">
                              {globalCountsByCountry[territory.iso2]
                                ? `${globalCountsByCountry[territory.iso2].toLocaleString()} unis`
                                : territory.continent}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(remoteSearchUnis.length > 0 || matchingGlobalUnis.length > 0 || isSearchingRemoteUnis) && (
                      <div className="space-y-1 pt-1 border-t border-[var(--border-hairline)] first:border-t-0 first:pt-0">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                            {gs.searchGroupUniversities}
                          </p>
                          {isSearchingRemoteUnis && (
                            <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                          )}
                        </div>
                        {(remoteSearchUnis.length > 0
                          ? remoteSearchUnis
                          : matchingGlobalUnis.slice(0, 7).map((u) => ({
                              slug: u.slug,
                              name: u.name,
                              countryCode: u.countryCode,
                              countryName: countriesByCode[u.countryCode]?.name || u.countryCode,
                              countryFlag: countriesByCode[u.countryCode]?.flagEmoji || '',
                              cityName: citiesBySlug[u.citySlug]?.name || u.citySlug,
                              isSeededCatalog: true,
                              qsRankDisplay: null,
                            }))
                        ).map((uni) => (
                          <button
                            key={uni.slug}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              if (uni.isSeededCatalog) {
                                handleJumpToCountryAndUniversity(uni.countryCode, uni.slug);
                              } else {
                                openUniversityProfile(uni.slug);
                              }
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-left cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {uni.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {uni.countryFlag} {uni.cityName}, {uni.countryName}
                                {uni.qsRankDisplay ? ` · QS ${uni.qsRankDisplay}` : ''}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                </MotionDropdown>
              )}
            </AnimatePresence>
          </div>

          {/* Academic Discipline Filter */}
          <select
            value={disciplineFilter}
            onChange={(e) => handleDisciplineChange(e.target.value)}
            aria-label={gs.allDisciplines}
            className="glass-input px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? gs.allDisciplines : d}
              </option>
            ))}
          </select>

          {/* Continent Filter Strip */}
          <div className="glass-segmented flex flex-wrap items-center rounded-xl p-1 max-w-full">
            {CONTINENTS.map((cont) => (
              <button
                key={cont}
                type="button"
                onClick={() => handleContinentChange(cont)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap cursor-pointer ${
                  continentFilter === cont
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cont}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3D Digital Earth Viewport + Country & Leading University Intelligence Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Interactive 3D Digital Earth Viewport */}
        <div
          ref={mapStageRef}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-[#01040b] flex flex-col justify-between overflow-hidden'
              : 'xl:col-span-8 min-w-0 rounded-2xl overflow-hidden relative min-h-[420px] sm:min-h-[520px] flex flex-col justify-between border border-cyan-500/20 bg-[#01040b] shadow-lg'
          }
          data-testid="world-map-container"
          data-selected-country={activeCountryCode}
          data-visual-mode={visualMode}
        >
          {/* Globe Canvas & Floating HUD Controls */}
          <div
            className={
              isFullscreen
                ? 'relative flex-1 min-h-[380px]'
                : 'relative h-[380px] sm:h-[470px] xl:h-auto xl:flex-1 xl:min-h-[490px]'
            }
          >
            <DigitalEarthCanvas
              ref={globeRef}
              countries={catalog.countries}
              filteredCountryCodes={filteredCountryCodes}
              cities={catalog.cities}
              universityMarkers={universityMarkers}
              universityCountByCountry={universityCountByCountry}
              universityCountByCity={universityCountByCity}
              selectedCountryCode={activeCountryCode || null}
              autoRotate={autoRotate}
              visualMode={visualMode}
              showGrid={showGrid}
              showEquatorMeridian={showEquatorMeridian}
              showCityMarkers={showCityMarkers}
              showCountryLabels={showCountryLabels}
              showClouds={showClouds}
              showAtmosphere={showAtmosphere}
              showTerrainRelief={showTerrainRelief}
              showUniversityMarkers={showUniversityMarkers}
              onSelectCountry={(code) => handleSelectSeedCountry(code, false)}
              onSelectWorldCountry={(meta) => handleSelectWorldTerritory(meta, false)}
              onSelectCity={(city) => openCityInExplorer(city.countryCode, city.slug)}
              onSelectUniversityMarker={(slug) =>
                handleSelectUniversityInExplorer(slug, true, true)
              }
              onClearSelection={() => setSelectedExplorerUniSlug(null)}
              onZoomChange={setZoomPct}
              onOrientationChange={setOrientation}
              uiStrings={{
                verifiedUnisSingular: gs.verifiedUnisSingular,
                verifiedUnisPlural: gs.verifiedUnisPlural,
                exploreCountryHint: gs.exploreCountryHint,
                webglUnavailableTitle: gs.webglUnavailableTitle,
                webglUnavailableDesc: gs.webglUnavailableDesc,
              }}
            />

            {/* Floating Top-Left Navigation & Zoom Controls (No backdrop-blur over WebGL) */}
            <div className="glass-hud-solid absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-1 rounded-xl px-1.5 py-1 text-cyan-100">
              <button
                type="button"
                onClick={() => globeRef.current?.zoomIn()}
                aria-label="Zoom in map"
                title={gs.zoomIn}
                className="p-1.5 rounded-lg hover:bg-cyan-500/15 text-cyan-100 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => globeRef.current?.zoomOut()}
                aria-label="Zoom out map"
                title={gs.zoomOut}
                className="p-1.5 rounded-lg hover:bg-cyan-500/15 text-cyan-100 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => globeRef.current?.resetView()}
                aria-label="Reset map view"
                title={gs.resetView}
                className="p-1.5 rounded-lg hover:bg-cyan-500/15 text-cyan-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono-tabular text-xs text-cyan-300/90 border-r border-cyan-500/20">
                {zoomPct}%
              </span>
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                aria-pressed={autoRotate}
                aria-label={gs.autoRotate}
                title={autoRotate ? gs.autoRotate : gs.autoRotatePause}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  autoRotate
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/35'
                    : 'text-cyan-300/75 hover:bg-cyan-500/10'
                }`}
              >
                {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="hidden sm:inline">{gs.autoRotate}</span>
              </button>
              {activeCountryCode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeselected(true);
                    setDynamicCountryMeta(null);
                    setSelectedExplorerUniSlug(null);
                  }}
                  aria-label={gs.clearSelection}
                  title={gs.clearSelection}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-cyan-200/85 hover:bg-cyan-500/15 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span className="hidden sm:inline">{gs.clearSelection}</span>
                </button>
              )}
            </div>

            {/* Floating Top-Right Telemetry, Visual Modes & Fullscreen */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
              <div className="glass-hud-solid hidden md:flex items-center gap-2 rounded-xl px-2.5 py-1.5 font-mono-tabular text-[11px] text-cyan-300/90">
                <span>{formatCoord(orientation.lat, 'N', 'S')}</span>
                <span className="text-cyan-500/40">/</span>
                <span>{formatCoord(orientation.lon, 'E', 'W')}</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((o) => !o)}
                  aria-expanded={settingsOpen}
                  aria-label={gs.visualSettings}
                  data-testid="globe-appearance-settings-btn"
                  className={`glass-hud-solid inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    settingsOpen
                      ? 'border-cyan-300/65 text-cyan-50'
                      : 'text-cyan-100 hover:border-cyan-300/50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">{gs.visualSettings}</span>
                </button>

                <AnimatePresence>
                  {settingsOpen && (
                    <MotionDropdown
                      className="glass-hud-solid absolute right-0 mt-2 w-64 max-h-[520px] overflow-y-auto rounded-2xl p-3 text-cyan-50 space-y-2.5 z-30"
                      data-testid="globe-appearance-panel"
                    >
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-cyan-300/75 font-semibold mb-1">
                        {gs.visualModeLabel}
                      </p>
                      <div className="grid grid-cols-1 gap-0.5 pr-0.5">
                        {VISUAL_MODE_IDS.map((modeId) => {
                          const active = visualMode === modeId;
                          return (
                            <button
                              key={modeId}
                              type="button"
                              data-testid={`visual-mode-${modeId}`}
                              onClick={() => handleSelectVisualMode(modeId)}
                              className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400/45'
                                  : 'text-cyan-200/80 hover:bg-cyan-500/10 border border-transparent'
                              }`}
                            >
                              <span>
                                {gs.modeLabels[modeId] || GLOBE_VISUAL_PRESETS[modeId].label}
                              </span>
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/25"
                                style={{ backgroundColor: GLOBE_VISUAL_PRESETS[modeId].dotBaseHex }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-cyan-500/20 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-cyan-300/75 font-semibold mb-1">
                        {gs.layersLabel}
                      </p>
                      {[
                        {
                          id: 'grid',
                          label: gs.coordinateGrid,
                          checked: showGrid,
                          toggle: () => setShowGrid((v) => !v),
                        },
                        {
                          id: 'equator',
                          label: gs.equatorMeridian,
                          checked: showEquatorMeridian,
                          toggle: () => setShowEquatorMeridian((v) => !v),
                        },
                        {
                          id: 'cities',
                          label: gs.cityMarkers,
                          checked: showCityMarkers,
                          toggle: () => setShowCityMarkers((v) => !v),
                        },
                        {
                          id: 'borders',
                          label: gs.countryLabels,
                          checked: showCountryLabels,
                          toggle: () => setShowCountryLabels((v) => !v),
                        },
                        {
                          id: 'clouds',
                          label: gs.cloudsLayer,
                          checked: showClouds,
                          toggle: () => setShowClouds((v) => !v),
                        },
                        {
                          id: 'atmosphere',
                          label: gs.atmosphereLayer,
                          checked: showAtmosphere,
                          toggle: () => setShowAtmosphere((v) => !v),
                        },
                        {
                          id: 'terrain-relief',
                          label: gs.terrainReliefLayer,
                          checked: showTerrainRelief,
                          toggle: () => setShowTerrainRelief((v) => !v),
                        },
                        {
                          id: 'universities',
                          label: gs.universityMarkersLayer,
                          checked: showUniversityMarkers,
                          toggle: () => setShowUniversityMarkers((v) => !v),
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          data-testid={`globe-layer-${item.id}`}
                          className="flex items-center justify-between text-xs text-cyan-100/90 py-0.5 cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={item.toggle}
                            className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                    </MotionDropdown>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? gs.exitFullscreen : gs.fullscreen}
                title={isFullscreen ? gs.exitFullscreen : gs.fullscreen}
                className="glass-hud-solid p-1.5 rounded-xl text-cyan-100 hover:border-cyan-300/50 transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-cyan-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-cyan-300" />
                )}
              </button>
            </div>
          </div>

          {/* Study Destination Quick Strip */}
          <div className="p-3 border-t border-cyan-500/20 bg-[#040d1d] flex items-center gap-2 overflow-x-auto">
            {dynamicCountryMeta && (
              <span className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-400/20 text-emerald-200 border-emerald-400/60 whitespace-nowrap">
                {dynamicCountryMeta.flagEmoji} {dynamicCountryMeta.name}
              </span>
            )}
            {filteredCountries.map((c) => {
              const count = universityCountByCountry[c.isoCode] || 0;
              const selected = !dynamicCountryMeta && activeSeedCountry?.isoCode === c.isoCode;
              return (
                <button
                  key={c.isoCode}
                  type="button"
                  onClick={() => handleSelectSeedCountry(c.isoCode, true)}
                  className={`motion-interactive-card shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    selected
                      ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/60'
                      : 'border-cyan-500/25 bg-[#07152b] text-cyan-100 hover:border-cyan-300/60'
                  }`}
                >
                  {c.flagEmoji} {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Country & Featured University Intelligence Panel */}
        {activeCountryCode ? (
          <aside
            className="xl:col-span-4 min-w-0 surface-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4"
            data-testid="country-intelligence-panel"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  {activeContinent}
                  {activeSeedCountry ? ` · ${activeSeedCountry.capital}` : ` · ${activeCountryCode}`}
                </p>
                <h2 className="font-display text-3xl font-semibold mt-1">
                  {activeCountryFlag} {activeCountryName}
                </h2>
              </div>

              {activeSeedCountry ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {activeSeedCountry.educationSystem}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-hairline)]">
                    <div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {t.countriesView.tuitionRange}
                      </p>
                      <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                        ${activeSeedCountry.tuitionRangeMinUsd?.toLocaleString()} – $
                        {activeSeedCountry.tuitionRangeMaxUsd?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {t.countriesView.livingCost}
                      </p>
                      <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                        ${activeSeedCountry.livingCostMonthlyMinUsd?.toLocaleString()} – $
                        {activeSeedCountry.livingCostMonthlyMaxUsd?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : isLoadingDynamicCountry ? (
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                  <span>{gs.loadingCountryUniversities}</span>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {activeUniversity?.dynamicRecord?.summary ||
                    `${activeCountryName} (${activeContinent}) · ${gs.liveRegistryLabel}`}
                </p>
              )}

              {/* Featured Leading University Quick Card */}
              {activeUniversity && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
                    <span>{gs.featuredLeader}</span>
                    {featuredMeta.primaryRanking && (
                      <span className="font-mono-tabular">
                        {featuredMeta.primaryRanking.worldRankDisplay} (
                        {featuredMeta.primaryRanking.publicationYear})
                      </span>
                    )}
                  </div>
                  <p className="font-display text-lg font-semibold leading-snug">
                    {activeUniversity.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{activeUniversity.cityName}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      data-testid="open-active-uni-profile-btn"
                      onClick={() =>
                        handleSelectUniversityInExplorer(activeUniversity.slug, true, true)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Open University Profile & Videos</span>
                    </button>
                    <a
                      href="#world-cinema-explorer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>{gs.exploreCampusMedia}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Cities in Country (Flagship Catalog) */}
              {activeSeedCountry && activeCountryCities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {t.common.city} ({activeCountryCities.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeCountryCities.map((city) => (
                      <button
                        key={city.slug}
                        type="button"
                        onClick={() => openCityInExplorer(activeSeedCountry.isoCode, city.slug)}
                        className="btn-glass rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Verified Universities Directory for Selected Country (Search + Filter + Pagination) */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]" data-testid="world-country-directory">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {t.nav.universities}{' '}
                    <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
                      ({(countryDirectoryData?.totalCount ?? activeCountryUnifiedUnis.length).toLocaleString()})
                    </span>
                  </p>
                  {countryDirectoryItems.length > 0 && countryDirectoryData && (
                    <span className="text-[11px] font-mono-tabular text-[var(--text-muted)]">
                      {countryDirectoryItems.length} / {countryDirectoryData.totalCount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* In-country search & sort */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={countryUniSearch}
                      onChange={(e) => setCountryUniSearch(e.target.value)}
                      placeholder={`Search in ${activeCountryName} (name, alias, city)...`}
                      aria-label={`Search universities in ${activeCountryName}`}
                      data-testid="world-country-uni-search"
                      className="glass-input w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    value={countryUniSort}
                    onChange={(e) =>
                      setCountryUniSort(e.target.value as 'prominence' | 'name' | 'citations')
                    }
                    aria-label="Sort country universities"
                    className="glass-input px-2 py-1.5 rounded-lg text-[11px] shrink-0 cursor-pointer"
                  >
                    <option value="prominence">Top</option>
                    <option value="citations">Impact</option>
                    <option value="name">A–Z</option>
                  </select>
                </div>

                {/* Verified city quick filter pills */}
                {countryDirectoryData && countryDirectoryData.cities.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setCountryUniCityFilter('')}
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] cursor-pointer ${
                        !countryUniCityFilter
                          ? 'glass-pill-active font-semibold text-[var(--text-primary)]'
                          : 'btn-glass text-[var(--text-muted)]'
                      }`}
                    >
                      All cities
                    </button>
                    {countryDirectoryData.cities.slice(0, 8).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() =>
                          setCountryUniCityFilter((prev) => (prev === c.name ? '' : c.name))
                        }
                        className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] cursor-pointer whitespace-nowrap ${
                          countryUniCityFilter === c.name
                            ? 'glass-pill-active font-semibold text-[var(--text-primary)]'
                            : 'btn-glass text-[var(--text-secondary)]'
                        }`}
                      >
                        {c.name} ({c.count})
                      </button>
                    ))}
                  </div>
                )}

                {countryDirectoryData?.didYouMean && (
                  <p className="text-[11px] text-cyan-600 dark:text-cyan-400">
                    Siz quyidagini nazarda tutdingizmi?{' '}
                    <button
                      type="button"
                      onClick={() => setCountryUniSearch(countryDirectoryData.didYouMean || '')}
                      className="font-semibold underline cursor-pointer"
                    >
                      {countryDirectoryData.didYouMean}
                    </button>
                  </p>
                )}

                {countryDirectoryError ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-2">
                    <p className="text-[var(--text-secondary)]">{countryDirectoryError}</p>
                    <button
                      type="button"
                      onClick={() => setCountryDirectoryRetryTick((n) => n + 1)}
                      className="btn-glass px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      Retry loading universities
                    </button>
                  </div>
                ) : isLoadingCountryDirectory && countryDirectoryItems.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                    <span>Loading verified universities in {activeCountryName}...</span>
                  </div>
                ) : countryDirectoryItems.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-2">
                    No matching verified universities found for this filter in {activeCountryName}.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {countryDirectoryItems.map((u) => {
                        const isActiveUni = activeUniversity?.slug === u.slug;
                        return (
                          <div
                            key={u.slug}
                            className={`flex items-center justify-between gap-1.5 rounded-xl px-2.5 py-1.5 transition-[transform,opacity,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              isActiveUni
                                ? 'glass-pill-active'
                                : 'hover:bg-[var(--bg-surface)] border border-transparent'
                            }`}
                          >
                            <button
                              type="button"
                              data-testid={`country-panel-uni-${u.slug}`}
                              onClick={() => {
                                if (activeCountryUnifiedUnis.some((x) => x.slug === u.slug)) {
                                  handleSelectUniversityInExplorer(u.slug, true, true);
                                } else {
                                  if (u.latitude !== null && u.longitude !== null) {
                                    globeRef.current?.focusCoordinates(u.latitude, u.longitude, 1.88);
                                  }
                                  openUniversityProfile(u.slug);
                                }
                              }}
                              className="flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <p className="text-xs font-medium truncate">{u.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                {u.cityName}
                                {u.qsRankDisplay ? ` · QS ${u.qsRankDisplay}` : ''}
                                {u.institutionType ? ` · ${u.institutionType}` : ''}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => openUniversityProfile(u.slug)}
                              title={gs.openFullDossier}
                              aria-label={`${gs.openFullDossier}: ${u.name}`}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] cursor-pointer shrink-0"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {countryDirectoryData &&
                      countryDirectoryItems.length < countryDirectoryData.totalCount && (
                        <button
                          type="button"
                          disabled={isLoadingCountryDirectory}
                          onClick={() => setCountryUniPage((p) => p + 1)}
                          data-testid="world-country-load-more"
                          className="btn-glass w-full rounded-xl py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {isLoadingCountryDirectory ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : null}
                          <span>
                            Load more ({countryDirectoryItems.length} of{' '}
                            {countryDirectoryData.totalCount.toLocaleString()})
                          </span>
                        </button>
                      )}
                  </>
                )}
              </div>
            </div>

            {activeSeedCountry && (
              <div className="space-y-2 pt-3 border-t border-[var(--border-hairline)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCityInExplorer(activeSeedCountry.isoCode)}
                    className="btn-primary flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    {t.worldExplorer.viewCities}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCountryProfile(activeSeedCountry.isoCode)}
                    className="btn-glass rounded-xl px-4 py-2.5 text-xs font-medium cursor-pointer"
                  >
                    {t.worldExplorer.countryDossier}
                  </button>
                </div>
                <a
                  href={activeSeedCountry.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:underline"
                >
                  <span>
                    {activeSeedCountry.sourceOrg} ({activeSeedCountry.verifiedAt})
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </aside>
        ) : (
          <aside className="xl:col-span-4 min-w-0 surface-card rounded-2xl p-6 flex flex-col items-start justify-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <Globe2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-semibold">{gs.selectCountryPrompt}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {gs.selectCountryHint}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredCountries.slice(0, 4).map((c) => (
                <button
                  key={c.isoCode}
                  type="button"
                  onClick={() => handleSelectSeedCountry(c.isoCode, true)}
                  className="btn-glass rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer"
                >
                  {c.flagEmoji} {c.name}
                </button>
              ))}
            </div>
            {catalog.countries[0] && (
              <button
                type="button"
                onClick={() => handleSelectSeedCountry(catalog.countries[0].isoCode, true)}
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                {gs.showTopDestination}
              </button>
            )}
          </aside>
        )}
      </div>

      {/* Interactive University Information Panel (Opens directly inside World Map on marker click) */}
      <AnimatePresence>
        {isUniProfileOpen && activeUniversity && (
          <WorldUniversityProfilePanel
            university={activeUniversity}
            countryUniversities={activeCountryUnifiedUnis}
            gs={gs}
            onClose={() => setIsUniProfileOpen(false)}
            onSelectUniversity={(slug) => handleSelectUniversityInExplorer(slug, true, true)}
            onLocateCoordinates={(lat, lon, zoomDist) =>
              globeRef.current?.focusCoordinates(lat, lon, zoomDist)
            }
          />
        )}
      </AnimatePresence>

      {/* Integrated University Cinema, Structured Profile, Other Leading Universities & Compare */}
      {activeCountryCode && (
        <UniversityCinemaExplorer
          activeCountryCode={activeCountryCode}
          activeCountryName={activeCountryName}
          activeCountryFlag={activeCountryFlag}
          activeCountryRecord={activeSeedCountry}
          activeUniversity={activeUniversity}
          countryUniversities={activeCountryUnifiedUnis}
          methodologySummary={featuredMeta.methodologySummary}
          isLoadingCountryUnis={isLoadingDynamicCountry}
          countryLoadError={dynamicCountryError}
          dynamicRegistry={dynamicRegistry}
          gs={gs}
          onSelectUniversity={(slug, fly) => handleSelectUniversityInExplorer(slug, fly)}
          onLocateCoordinates={(lat, lon, zoomDist) =>
            globeRef.current?.focusCoordinates(lat, lon, zoomDist)
          }
          onJumpToCountryAndUniversity={handleJumpToCountryAndUniversity}
        />
      )}
    </div>
  );
};
