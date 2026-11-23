import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Film,
  GitCompareArrows,
  GraduationCap,
  Loader2,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  VideoOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from '../../motion/tokens';
import type {
  AdmissionRequirementRecord,
  CityRecord,
  CountryRecord,
  ProgramRecord,
  RankingRecord,
  ScholarshipRecord,
  UniversityRecord,
} from '../../types/domain';
import type {
  DynamicUniversityItem,
  ExplorerVideoItem,
  VideoCategory,
} from '../../utils/explorerLogic';
import { getTerritoryMetaByIso2 } from '../../utils/isoCountries';
import { InstitutionalMediaPlate } from '../InstitutionalMediaPlate';
import type { GlobeUiStrings } from './globeStrings';

export interface UnifiedExplorerUniversity {
  slug: string;
  name: string;
  shortName: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  officialWebsite: string;
  officialMediaUrl: string;
  officialApplicationUrl: string;
  isSeededCatalog: boolean;
  seedRecord?: UniversityRecord;
  dynamicRecord?: DynamicUniversityItem;
}

interface UniversityCinemaExplorerProps {
  activeCountryCode: string;
  activeCountryName: string;
  activeCountryFlag: string;
  activeCountryRecord: CountryRecord | null;
  activeUniversity: UnifiedExplorerUniversity | null;
  countryUniversities: UnifiedExplorerUniversity[];
  methodologySummary: string;
  isLoadingCountryUnis: boolean;
  countryLoadError: string | null;
  dynamicRegistry: Record<string, DynamicUniversityItem>;
  gs: GlobeUiStrings;
  onSelectUniversity: (slug: string, flyToGlobe?: boolean) => void;
  onLocateCoordinates: (lat: number, lon: number, zoomDist?: number) => void;
  onJumpToCountryAndUniversity: (countryCode: string, uniSlug: string) => void;
}

interface VideoFetchState {
  loading: boolean;
  videos: ExplorerVideoItem[];
  availableCategories: VideoCategory[];
  error: string | null;
}

const CATEGORY_ORDER: VideoCategory[] = ['aerial', 'walkthrough', 'official', 'student_life'];

export const UniversityCinemaExplorer: React.FC<UniversityCinemaExplorerProps> = ({
  activeCountryCode,
  activeCountryName,
  activeCountryFlag,
  activeUniversity,
  countryUniversities,
  methodologySummary,
  isLoadingCountryUnis,
  countryLoadError,
  dynamicRegistry,
  gs,
  onSelectUniversity,
  onLocateCoordinates,
  onJumpToCountryAndUniversity,
}) => {
  const {
    catalog,
    countriesByCode,
    citiesBySlug,
    universitiesBySlug,
    savedUniversities,
    saveUniversity,
    removeSavedUniversity,
    compareSlugs,
    toggleCompareSlug,
    recentlyViewedSlugs,
    openUniversityProfile,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'campus'>('overview');
  const [watchlistTab, setWatchlistTab] = useState<'favorites' | 'recent' | 'compare'>('compare');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('aerial');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [imageFailedSlug, setImageFailedSlug] = useState<string | null>(null);

  // Personal notes editor state
  const [noteDraft, setNoteDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState<'Dream' | 'Target' | 'Safety'>('Target');
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  // Client-side cache & live fetch for authentic verified campus videos
  const videoCacheRef = useRef<
    Map<string, { videos: ExplorerVideoItem[]; availableCategories: VideoCategory[] }>
  >(new Map());
  const [videoState, setVideoState] = useState<VideoFetchState>({
    loading: false,
    videos: [],
    availableCategories: [],
    error: null,
  });

  // Sync note draft when activeUniversity or savedUniversities changes
  const activeSavedEntry = useMemo(
    () =>
      activeUniversity
        ? savedUniversities.find((s) => s.universitySlug === activeUniversity.slug) || null
        : null,
    [activeUniversity, savedUniversities]
  );

  useEffect(() => {
    setNoteDraft(activeSavedEntry?.personalNotes || '');
    setPriorityDraft(activeSavedEntry?.priority || 'Target');
    setNotesSavedToast(false);
  }, [activeUniversity?.slug, activeSavedEntry?.personalNotes, activeSavedEntry?.priority]);

  // Lazy-load verified campus videos ONLY for the currently active university
  useEffect(() => {
    if (!activeUniversity) {
      setVideoState({ loading: false, videos: [], availableCategories: [], error: null });
      setSelectedVideoId(null);
      return;
    }

    const cacheKey = `${activeUniversity.name}|${activeUniversity.cityName}`.toLowerCase();
    const cached = videoCacheRef.current.get(cacheKey);
    if (cached) {
      setVideoState({
        loading: false,
        videos: cached.videos,
        availableCategories: cached.availableCategories,
        error: null,
      });
      const firstCat =
        CATEGORY_ORDER.find((c) => cached.availableCategories.includes(c)) ||
        cached.availableCategories[0] ||
        'aerial';
      setSelectedCategory(firstCat);
      const firstVideo = cached.videos.find((v) => v.category === firstCat) || cached.videos[0];
      setSelectedVideoId(firstVideo?.id || null);
      return;
    }

    const controller = new AbortController();
    setVideoState({ loading: true, videos: [], availableCategories: [], error: null });
    setSelectedVideoId(null);

    const qs = new URLSearchParams({
      name: activeUniversity.name,
      shortName: activeUniversity.shortName || '',
      city: activeUniversity.cityName || '',
    });

    fetch(`/api/explorer/videos?${qs.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to verify campus videos');
        return (await res.json()) as {
          videos?: ExplorerVideoItem[];
          availableCategories?: VideoCategory[];
        };
      })
      .then((data) => {
        const videos = Array.isArray(data.videos) ? data.videos : [];
        const availableCategories = Array.isArray(data.availableCategories)
          ? data.availableCategories
          : [];
        videoCacheRef.current.set(cacheKey, { videos, availableCategories });
        setVideoState({
          loading: false,
          videos,
          availableCategories,
          error: null,
        });
        const firstCat =
          CATEGORY_ORDER.find((c) => availableCategories.includes(c)) ||
          availableCategories[0] ||
          'aerial';
        setSelectedCategory(firstCat);
        const firstVideo = videos.find((v) => v.category === firstCat) || videos[0];
        setSelectedVideoId(firstVideo?.id || null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setVideoState({
          loading: false,
          videos: [],
          availableCategories: [],
          error: err instanceof Error ? err.message : 'Unable to fetch campus media',
        });
      });

    return () => controller.abort();
  }, [activeUniversity?.slug, activeUniversity?.name, activeUniversity?.cityName, activeUniversity?.shortName]);

  const categoryLabels: Record<VideoCategory, string> = useMemo(
    () => ({
      aerial: gs.aerialDrone,
      walkthrough: gs.campusWalkthrough,
      official: gs.officialIntro,
      student_life: gs.studentLife,
    }),
    [gs]
  );

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => videoState.availableCategories.includes(cat)),
    [videoState.availableCategories]
  );

  const activeVideo: ExplorerVideoItem | null = useMemo(() => {
    if (videoState.videos.length === 0) return null;
    if (selectedVideoId) {
      const exact = videoState.videos.find((v) => v.id === selectedVideoId);
      if (exact) return exact;
    }
    return (
      videoState.videos.find((v) => v.category === selectedCategory) || videoState.videos[0] || null
    );
  }, [videoState.videos, selectedVideoId, selectedCategory]);

  const activeVideoIndex = activeVideo
    ? videoState.videos.findIndex((v) => v.id === activeVideo.id)
    : -1;

  const handleSelectCategory = (cat: VideoCategory) => {
    setSelectedCategory(cat);
    const match = videoState.videos.find((v) => v.category === cat);
    if (match) setSelectedVideoId(match.id);
  };

  const handlePlaylistStep = (delta: number) => {
    if (videoState.videos.length <= 1 || activeVideoIndex < 0) return;
    const nextIdx = (activeVideoIndex + delta + videoState.videos.length) % videoState.videos.length;
    const nextVid = videoState.videos[nextIdx];
    setSelectedCategory(nextVid.category);
    setSelectedVideoId(nextVid.id);
  };

  // Seeded academic details for active university
  const activeRankings: RankingRecord[] = useMemo(() => {
    if (!activeUniversity?.isSeededCatalog) return [];
    return catalog.rankings
      .filter((r) => r.universitySlug === activeUniversity.slug)
      .sort((a, b) => a.worldRank - b.worldRank);
  }, [activeUniversity, catalog.rankings]);

  const activePrograms: ProgramRecord[] = useMemo(() => {
    if (!activeUniversity?.isSeededCatalog) return [];
    return catalog.programs.filter((p) => p.universitySlug === activeUniversity.slug);
  }, [activeUniversity, catalog.programs]);

  const activeScholarships: ScholarshipRecord[] = useMemo(() => {
    if (!activeUniversity?.isSeededCatalog) return [];
    return catalog.scholarships.filter(
      (s) =>
        s.countryCode === activeUniversity.countryCode ||
        s.eligibleUniversitySlugsJson.includes(activeUniversity.slug)
    );
  }, [activeUniversity, catalog.scholarships]);

  const activeAdmissions: AdmissionRequirementRecord[] = useMemo(() => {
    if (!activeUniversity?.isSeededCatalog) return [];
    return catalog.admissions.filter((a) => a.universitySlug === activeUniversity.slug);
  }, [activeUniversity, catalog.admissions]);

  const otherCountryUnis = useMemo(
    () =>
      activeUniversity
        ? countryUniversities.filter((u) => u.slug !== activeUniversity.slug)
        : countryUniversities,
    [countryUniversities, activeUniversity]
  );

  // Resolve any slug (seeded OR dynamically discovered) for Watchlist / Compare / Recent
  const resolveUniversitySummary = (slug: string): UnifiedExplorerUniversity | null => {
    const seed = universitiesBySlug[slug];
    if (seed) {
      const country = countriesByCode[seed.countryCode];
      const city = citiesBySlug[seed.citySlug];
      return {
        slug: seed.slug,
        name: seed.name,
        shortName: seed.shortName,
        countryCode: seed.countryCode,
        countryName: country?.name || seed.countryCode,
        countryFlag: country?.flagEmoji || '',
        cityName: city?.name || seed.citySlug,
        latitude: city?.latitude ?? null,
        longitude: city?.longitude ?? null,
        officialWebsite: seed.officialWebsite,
        officialMediaUrl: seed.officialMediaUrl,
        officialApplicationUrl: seed.officialApplicationUrl,
        isSeededCatalog: true,
        seedRecord: seed,
      };
    }

    const dyn = dynamicRegistry[slug];
    if (dyn) {
      const meta = getTerritoryMetaByIso2(dyn.countryCode);
      return {
        slug: dyn.slug,
        name: dyn.name,
        shortName: dyn.shortName,
        countryCode: dyn.countryCode,
        countryName: dyn.countryName || meta?.name || dyn.countryCode,
        countryFlag: meta?.flagEmoji || '',
        cityName: dyn.city || dyn.countryName,
        latitude: dyn.latitude,
        longitude: dyn.longitude,
        officialWebsite: dyn.officialWebsite,
        officialMediaUrl: dyn.officialWebsite || dyn.sourceUrl,
        officialApplicationUrl: dyn.officialWebsite,
        isSeededCatalog: false,
        dynamicRecord: dyn,
      };
    }
    return null;
  };

  const compareItems = useMemo(
    () =>
      compareSlugs
        .slice(0, 3)
        .map((slug) => resolveUniversitySummary(slug))
        .filter((item): item is UnifiedExplorerUniversity => Boolean(item)),
    [compareSlugs, universitiesBySlug, dynamicRegistry]
  );

  const favoriteItems = useMemo(
    () =>
      savedUniversities
        .map((entry) => ({
          entry,
          uni: resolveUniversitySummary(entry.universitySlug),
        }))
        .filter((x): x is { entry: (typeof savedUniversities)[number]; uni: UnifiedExplorerUniversity } =>
          Boolean(x.uni)
        ),
    [savedUniversities, universitiesBySlug, dynamicRegistry]
  );

  const recentItems = useMemo(
    () =>
      recentlyViewedSlugs
        .map((slug) => resolveUniversitySummary(slug))
        .filter((item): item is UnifiedExplorerUniversity => Boolean(item)),
    [recentlyViewedSlugs, universitiesBySlug, dynamicRegistry]
  );

  const handleToggleFavorite = async (uni: UnifiedExplorerUniversity) => {
    const exists = savedUniversities.some((s) => s.universitySlug === uni.slug);
    if (exists) {
      await removeSavedUniversity(uni.slug);
    } else {
      await saveUniversity({
        universitySlug: uni.slug,
        collectionName: 'Shortlist',
        priority: priorityDraft,
        applicationStatus: 'Researching',
        personalNotes: noteDraft,
      });
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUniversity) return;
    await saveUniversity({
      universitySlug: activeUniversity.slug,
      collectionName: activeSavedEntry?.collectionName || 'Shortlist',
      priority: priorityDraft,
      applicationStatus: activeSavedEntry?.applicationStatus || 'Researching',
      personalNotes: noteDraft,
    });
    setNotesSavedToast(true);
    setTimeout(() => setNotesSavedToast(false), 2200);
  };

  const getPrimaryRankDisplay = (uni: UnifiedExplorerUniversity): string => {
    if (uni.isSeededCatalog) {
      const qs =
        catalog.rankings.find(
          (r) =>
            r.universitySlug === uni.slug && r.provider === 'QS World University Rankings'
        ) || catalog.rankings.find((r) => r.universitySlug === uni.slug);
      if (qs) {
        const shortProv =
          qs.provider === 'QS World University Rankings'
            ? 'QS'
            : qs.provider === 'Times Higher Education'
            ? 'THE'
            : 'ARWU';
        return `${shortProv} ${qs.worldRankDisplay} (${qs.publicationYear})`;
      }
      return gs.dataNotPublished;
    }
    if (uni.dynamicRecord) {
      return `${uni.dynamicRecord.worksCount.toLocaleString()} ${gs.researchWorks}`;
    }
    return gs.dataNotPublished;
  };

  const isSaved = activeUniversity
    ? savedUniversities.some((s) => s.universitySlug === activeUniversity.slug)
    : false;
  const isCompared = activeUniversity ? compareSlugs.includes(activeUniversity.slug) : false;

  return (
    <section
      id="world-cinema-explorer"
      className="space-y-6 pt-2"
      data-testid="university-cinema-explorer"
    >
      {/* Loading / Error Banner for Dynamic Country Discovery */}
      {isLoadingCountryUnis && (
        <div className="surface-card rounded-2xl p-5 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-500 shrink-0" />
          <span>{gs.loadingCountryUniversities}</span>
        </div>
      )}

      {!isLoadingCountryUnis && countryLoadError && !activeUniversity && (
        <div className="surface-card rounded-2xl p-6 text-sm text-[var(--text-secondary)]">
          {countryLoadError}
        </div>
      )}

      {/* Main Active University Spotlight + Real Campus Cinema + Structured Profile */}
      {activeUniversity && (
        <div className="surface-card rounded-3xl overflow-hidden">
          {/* University Header Bar */}
          <div className="p-5 sm:p-6 border-b border-[var(--border-hairline)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <span>
                  {activeUniversity.countryFlag} {activeUniversity.countryName}
                </span>
                <span>·</span>
                <span>{activeUniversity.cityName}</span>
                <span>·</span>
                <span className="font-mono-tabular text-[var(--accent-primary)] font-semibold">
                  {getPrimaryRankDisplay(activeUniversity)}
                </span>
                {!activeUniversity.isSeededCatalog && (
                  <>
                    <span>·</span>
                    <span>{gs.liveRegistryLabel}</span>
                  </>
                )}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] leading-tight">
                {activeUniversity.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">{methodologySummary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeUniversity.latitude !== null && activeUniversity.longitude !== null && (
                <button
                  type="button"
                  onClick={() =>
                    onLocateCoordinates(
                      activeUniversity.latitude!,
                      activeUniversity.longitude!,
                      1.86
                    )
                  }
                  className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{gs.locateOnGlobe}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleFavorite(activeUniversity)}
                data-testid="cinema-save-favorite-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  isSaved
                    ? 'glass-pill-active text-emerald-500 dark:text-emerald-300 font-semibold'
                    : 'btn-glass'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? gs.savedInFavorites : gs.saveFavorite}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCompareSlug(activeUniversity.slug)}
                data-testid="cinema-compare-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  isCompared
                    ? 'glass-pill-active text-[var(--accent-primary)] font-semibold'
                    : 'btn-glass'
                }`}
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span>{isCompared ? gs.inCompare : gs.addToCompare}</span>
              </button>

              {activeUniversity.isSeededCatalog && (
                <button
                  type="button"
                  onClick={() => openUniversityProfile(activeUniversity.slug)}
                  className="btn-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{gs.openFullDossier}</span>
                </button>
              )}

              {activeUniversity.officialWebsite && (
                <a
                  href={activeUniversity.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  <span>{gs.officialWebsite}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Cinematic Campus Video Theater Section */}
          <div className="p-5 sm:p-6 bg-[#030916] text-slate-100 border-b border-cyan-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                  {gs.cinemaSectionTitle}
                </h3>
              </div>

              {/* Dynamic Video Category Switcher (ONLY available verified categories shown) */}
              {visibleCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5" role="tablist">
                  {visibleCategories.map((cat) => {
                    const active = activeVideo?.category === cat || selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => handleSelectCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/55'
                            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {categoryLabels[cat]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {videoState.loading ? (
              <div className="aspect-video w-full rounded-xl border border-cyan-500/20 bg-[#061226] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                <p className="text-sm text-cyan-100/90">{gs.loadingVideos}</p>
              </div>
            ) : activeVideo ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Main Playable Video Frame */}
                <div className="xl:col-span-8 space-y-3">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-black shadow-xl">
                    <iframe
                      key={activeVideo.id}
                      src={activeVideo.embedUrl}
                      title={activeVideo.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>

                  {/* Verified Source & Publisher Attribution Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="min-w-0 space-y-1">
                      <h4
                        className="text-sm sm:text-base font-semibold text-white leading-snug line-clamp-2"
                        data-testid="cinema-active-video-title"
                      >
                        {activeVideo.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
                        <a
                          href={activeVideo.publisherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-medium"
                        >
                          {activeVideo.isOfficialChannel && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{activeVideo.publisher}</span>
                        </a>
                        {activeVideo.isOfficialChannel && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-300">{gs.officialChannel}</span>
                          </>
                        )}
                        <span className="text-slate-600">·</span>
                        <span>{categoryLabels[activeVideo.category]}</span>
                        {activeVideo.durationText && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono-tabular">{activeVideo.durationText}</span>
                          </>
                        )}
                        {activeVideo.publishedAtText && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{activeVideo.publishedAtText}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {videoState.videos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePlaylistStep(-1)}
                            aria-label={gs.prevVideo}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>{gs.prevVideo}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePlaylistStep(1)}
                            aria-label={gs.nextVideo}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10 cursor-pointer"
                          >
                            <span>{gs.nextVideo}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <a
                        href={activeVideo.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25"
                      >
                        <span>{gs.watchOnYoutube}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Campus Playlist Rail */}
                <div className="xl:col-span-4 rounded-xl border border-cyan-500/20 bg-[#061022] p-3.5 space-y-2.5 max-h-[420px] overflow-y-auto">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-cyan-300/80 font-semibold px-1">
                    <span>{gs.campusPlaylist}</span>
                    <span className="font-mono-tabular text-slate-400">
                      {activeVideoIndex + 1} / {videoState.videos.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {videoState.videos.map((vid) => {
                      const isCurrent = vid.id === activeVideo.id;
                      return (
                        <button
                          key={vid.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(vid.category);
                            setSelectedVideoId(vid.id);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer border ${
                            isCurrent
                              ? 'bg-cyan-500/18 border-cyan-400/50'
                              : 'bg-white/[0.03] border-transparent hover:bg-white/[0.07]'
                          }`}
                        >
                          <div className="relative w-24 h-14 rounded-md overflow-hidden shrink-0 bg-slate-900">
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {isCurrent && (
                              <span className="absolute inset-0 bg-cyan-500/25 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-[11px] font-medium text-cyan-300 truncate">
                              {categoryLabels[vid.category]}
                              {vid.durationText ? ` · ${vid.durationText}` : ''}
                            </p>
                            <p className="text-xs font-medium text-white line-clamp-2 leading-snug">
                              {vid.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{vid.publisher}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Honest Unavailable State with Institutional Plate & Official Link */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center rounded-xl border border-white/10 bg-[#061124] p-5">
                <div className="md:col-span-7 space-y-2">
                  <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                    <VideoOff className="w-4 h-4" />
                    <span>{gs.noVerifiedVideosTitle}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {gs.noVerifiedVideosDesc}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    {(activeUniversity.officialMediaUrl || activeUniversity.officialWebsite) && (
                      <a
                        href={activeUniversity.officialMediaUrl || activeUniversity.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/45 px-3.5 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/30"
                      >
                        <span>{gs.openOfficialMedia}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="md:col-span-5">
                  <InstitutionalMediaPlate
                    title={activeUniversity.name}
                    subtitle={activeUniversity.cityName}
                    monogram={(activeUniversity.shortName || activeUniversity.name || 'UNI').slice(0, 4)}
                    motif={activeUniversity.seedRecord?.architecturalMotif || 'default'}
                    accentHue={activeUniversity.seedRecord?.accentHue || '#0EA5E9'}
                    imageUrl={
                      activeUniversity.seedRecord?.imageUrl ||
                      activeUniversity.dynamicRecord?.imageUrl
                    }
                    universitySlug={activeUniversity.slug}
                    officialMediaUrl={
                      activeUniversity.officialMediaUrl || activeUniversity.officialWebsite
                    }
                    officialLabel={gs.openOfficialMedia}
                    aspectClass="h-44"
                    compact
                  />
                </div>
              </div>
            )}
          </div>

          {/* Structured University Information Tabs */}
          <div className="border-b border-[var(--border-hairline)] px-5 sm:px-6 flex items-center gap-6 overflow-x-auto">
            {(
              [
                { id: 'overview', label: gs.tabOverview },
                { id: 'academics', label: gs.tabAcademics },
                { id: 'campus', label: gs.tabCampus },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <motion.span
                      layoutId="cinema-tab-underline"
                      transition={MOTION_SPRING.liquid}
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--accent-primary)] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Panel Content */}
          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: MOTION_DURATION.cardReveal, ease: MOTION_EASE },
                }}
                exit={{ opacity: 0, transition: { duration: MOTION_DURATION.micro } }}
              >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-5">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {activeUniversity.seedRecord?.overview ||
                      activeUniversity.dynamicRecord?.summary ||
                      `${activeUniversity.name} (${activeUniversity.cityName}, ${activeUniversity.countryName}) indexed via ${gs.liveRegistryLabel}.`}
                  </p>

                  {/* Key Metrics Grid (Tabular, unboxed clean hierarchy) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-[var(--border-hairline)]">
                    {activeUniversity.isSeededCatalog && activeUniversity.seedRecord ? (
                      <>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.foundedLabel}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.foundedYear || gs.dataNotPublished}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.institutionTypeLabel}
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.institutionType}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.languageLabel}
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.primaryLanguage}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.tuitionLabel}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.tuitionLocalDisplay}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.studentsLabel}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.studentCount?.toLocaleString() ||
                              gs.dataNotPublished}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.internationalRatioLabel}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.seedRecord.internationalRatioPct !== null
                              ? `${activeUniversity.seedRecord.internationalRatioPct}%`
                              : gs.dataNotPublished}
                          </p>
                        </div>
                      </>
                    ) : activeUniversity.dynamicRecord ? (
                      <>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.researchWorks}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.dynamicRecord.worksCount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.citations}
                          </p>
                          <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                            {activeUniversity.dynamicRecord.citedByCount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {gs.locationLabel}
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {activeUniversity.cityName}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Published Rankings Table */}
                <div className="lg:col-span-5 surface-subtle rounded-2xl p-4 space-y-3">
                  <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                    {gs.worldRankings}
                  </p>
                  {activeRankings.length > 0 ? (
                    <div className="divide-y divide-[var(--border-hairline)]">
                      {activeRankings.map((rank) => (
                        <div
                          key={`${rank.universitySlug}-${rank.provider}-${rank.publicationYear}`}
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {rank.provider}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {rank.publicationYear} · {rank.subjectArea}
                            </p>
                          </div>
                          <a
                            href={rank.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 font-mono-tabular text-sm font-bold text-[var(--accent-primary)] hover:underline"
                          >
                            <span>{rank.worldRankDisplay}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {gs.dataNotPublished}.{' '}
                      {activeUniversity.dynamicRecord?.sourceUrl && (
                        <a
                          href={activeUniversity.dynamicRecord.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent-primary)] underline ml-1"
                        >
                          {activeUniversity.dynamicRecord.sourceOrg}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'academics' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      {gs.researchAreas} & {gs.strengthsLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        activeUniversity.seedRecord?.academicStrengthsJson ||
                        activeUniversity.dynamicRecord?.researchAreas ||
                        []
                      ).map((item) => (
                        <span
                          key={item}
                          className="btn-glass rounded-xl px-2.5 py-1 text-xs font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeUniversity.seedRecord?.facultiesJson &&
                    activeUniversity.seedRecord.facultiesJson.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border-hairline)]">
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                          {t.universitiesView.faculties}
                        </p>
                        <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                          {activeUniversity.seedRecord.facultiesJson.map((fac) => (
                            <li key={fac}>· {fac}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {activePrograms.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                        {gs.degreePrograms} ({activePrograms.length})
                      </p>
                      <div className="space-y-2">
                        {activePrograms.map((prog) => (
                          <div
                            key={prog.slug}
                            className="surface-subtle rounded-2xl p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {prog.name}
                              </span>
                              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                                {prog.degreeLevel} · {prog.durationYears}y
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {prog.overview}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="surface-subtle rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                        {gs.admissionRequirements}
                      </p>
                      {activeUniversity.officialApplicationUrl && (
                        <a
                          href={activeUniversity.officialApplicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                        >
                          <span>{gs.officialAdmissions}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {activeAdmissions.length > 0 ? (
                      <div className="space-y-3 text-xs">
                        {activeAdmissions.map((adm, idx) => (
                          <div
                            key={`${adm.universitySlug}-${adm.degreeLevel}-${idx}`}
                            className="space-y-1 pt-2 first:pt-0 border-t first:border-t-0 border-[var(--border-hairline)]"
                          >
                            <p className="font-semibold text-[var(--text-primary)]">
                              {adm.degreeLevel} · {adm.applicationDeadline}
                            </p>
                            <p className="text-[var(--text-secondary)]">
                              {adm.academicQualifications}
                            </p>
                            <p className="text-[var(--text-muted)]">
                              {adm.languageTests} · {adm.standardizedTests}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {activeUniversity.seedRecord?.internationalInfo || gs.dataNotPublished}
                      </p>
                    )}
                  </div>

                  {activeScholarships.length > 0 && (
                    <div className="surface-subtle rounded-2xl p-4 space-y-2">
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                        {gs.eligibleScholarships} ({activeScholarships.length})
                      </p>
                      <div className="space-y-2">
                        {activeScholarships.slice(0, 3).map((sch) => (
                          <div key={sch.slug} className="text-xs space-y-0.5">
                            <a
                              href={sch.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                            >
                              <span>{sch.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <p className="text-[var(--text-secondary)]">
                              {sch.coverageSummary} · {sch.deadlineText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'campus' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-4">
                  {activeUniversity.dynamicRecord?.imageUrl &&
                  imageFailedSlug !== activeUniversity.slug ? (
                    <div className="rounded-xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                      <img
                        src={activeUniversity.dynamicRecord.imageUrl}
                        alt={activeUniversity.name}
                        referrerPolicy="no-referrer"
                        onError={() => setImageFailedSlug(activeUniversity.slug)}
                        className="w-full h-52 object-cover"
                      />
                    </div>
                  ) : (
                    <InstitutionalMediaPlate
                      title={activeUniversity.name}
                      subtitle={activeUniversity.cityName}
                      monogram={(activeUniversity.shortName || activeUniversity.name || 'UNI').slice(0, 4)}
                      motif={activeUniversity.seedRecord?.architecturalMotif || 'default'}
                      accentHue={activeUniversity.seedRecord?.accentHue || '#0EA5E9'}
                      imageUrl={
                        activeUniversity.seedRecord?.imageUrl ||
                        activeUniversity.dynamicRecord?.imageUrl
                      }
                      universitySlug={activeUniversity.slug}
                      officialMediaUrl={
                        activeUniversity.officialMediaUrl || activeUniversity.officialWebsite
                      }
                      officialLabel={gs.openOfficialMedia}
                      aspectClass="h-52"
                      coordinatesLabel={
                        activeUniversity.latitude !== null && activeUniversity.longitude !== null
                          ? `${activeUniversity.latitude.toFixed(2)}°, ${activeUniversity.longitude.toFixed(2)}°`
                          : undefined
                      }
                    />
                  )}

                  {activeUniversity.seedRecord?.facilitiesJson &&
                    activeUniversity.seedRecord.facilitiesJson.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                          {gs.facilitiesLabel}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--text-secondary)]">
                          {activeUniversity.seedRecord.facilitiesJson.map((fac) => (
                            <li key={fac}>· {fac}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Persistent Personal Notes & Priority Form */}
                <form
                  onSubmit={handleSaveNotes}
                  className="lg:col-span-6 surface-subtle rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="explorer-personal-notes"
                      className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]"
                    >
                      {gs.personalNotesLabel}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--text-muted)]">{gs.priorityLabel}:</span>
                      {(['Dream', 'Target', 'Safety'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPriorityDraft(tier)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            priorityDraft === tier
                              ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                              : 'btn-glass text-[var(--text-secondary)]'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    id="explorer-personal-notes"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={4}
                    placeholder={gs.personalNotesPlaceholder}
                    className="glass-input w-full rounded-xl p-3 text-sm text-[var(--text-primary)] resize-y"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      data-testid="cinema-save-notes-btn"
                      className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      {notesSavedToast ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{notesSavedToast ? gs.notesSaved : gs.saveNotes}</span>
                    </button>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {isSaved ? gs.savedInFavorites : ''}
                    </span>
                  </div>
                </form>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* OTHER LEADING UNIVERSITIES IN THE ACTIVE COUNTRY */}
      {otherCountryUnis.length > 0 && (
        <div
          className="surface-card rounded-3xl p-5 sm:p-6 space-y-4"
          data-testid="other-leading-universities"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold">
              {gs.otherLeadingUniversities} — {activeCountryFlag} {activeCountryName}
            </h3>
            <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
              {otherCountryUnis.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {otherCountryUnis.map((uni) => {
              const saved = savedUniversities.some((s) => s.universitySlug === uni.slug);
              const compared = compareSlugs.includes(uni.slug);
              return (
                <div
                  key={uni.slug}
                  className="surface-subtle motion-interactive-card rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onSelectUniversity(uni.slug, true)}
                    className="text-left space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{uni.cityName}</span>
                      </span>
                      <span className="font-mono-tabular font-semibold text-[var(--accent-primary)] shrink-0">
                        {getPrimaryRankDisplay(uni)}
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug">
                      {uni.name}
                    </h4>
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[var(--border-hairline)]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(uni)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                          saved
                            ? 'glass-pill-active text-emerald-500 dark:text-emerald-300 font-semibold'
                            : 'btn-glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {saved ? gs.savedInFavorites : gs.saveFavorite}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompareSlug(uni.slug)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                          compared
                            ? 'glass-pill-active text-[var(--accent-primary)] font-semibold'
                            : 'btn-glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {compared ? gs.inCompare : gs.addToCompare}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectUniversity(uni.slug, true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline whitespace-nowrap cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{gs.exploreCampusMedia}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Watchlist, Recently Viewed & Inline 2-3 University Comparison */}
      <div
        className="surface-card rounded-3xl p-5 sm:p-6 space-y-4"
        data-testid="explorer-watchlist-compare"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">{gs.watchlistAndCompare}</h3>

          <div className="glass-segmented flex items-center gap-1 rounded-xl p-1">
            {(
              [
                { id: 'compare', label: `${gs.compareTab} (${compareItems.length})` },
                { id: 'favorites', label: `${gs.favoritesTab} (${favoriteItems.length})` },
                { id: 'recent', label: `${gs.recentTab} (${recentItems.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWatchlistTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-[transform,opacity,border-color,color] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  watchlistTab === tab.id
                    ? 'glass-pill-active text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {watchlistTab === 'compare' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{gs.compareLimitHint}</span>
              {compareItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => compareItems.forEach((item) => toggleCompareSlug(item.slug))}
                  className="inline-flex items-center gap-1 text-rose-500 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{gs.clearCompare}</span>
                </button>
              )}
            </div>

            {compareItems.length < 2 ? (
              <p className="text-sm text-[var(--text-secondary)] py-4">{gs.noCompareSelected}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-hairline)]">
                      <th className="py-2.5 pr-4 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold w-44">
                        {gs.metricColumn}
                      </th>
                      {compareItems.map((u) => (
                        <th key={u.slug} className="py-2.5 px-3 font-display text-base font-semibold">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onJumpToCountryAndUniversity(u.countryCode, u.slug)}
                              className="text-left hover:text-[var(--accent-primary)] hover:underline cursor-pointer"
                            >
                              {u.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCompareSlug(u.slug)}
                              aria-label={gs.clearCompare}
                              className="text-xs text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    <tr>
                      <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)]">{gs.locationLabel}</td>
                      {compareItems.map((u) => (
                        <td key={u.slug} className="py-2.5 px-3 text-xs">
                          {u.countryFlag} {u.cityName}, {u.countryName}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)]">{gs.worldRankings}</td>
                      {compareItems.map((u) => (
                        <td key={u.slug} className="py-2.5 px-3 text-xs font-mono-tabular font-semibold">
                          {getPrimaryRankDisplay(u)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)]">{gs.tuitionLabel}</td>
                      {compareItems.map((u) => (
                        <td key={u.slug} className="py-2.5 px-3 text-xs font-mono-tabular">
                          {u.seedRecord?.tuitionLocalDisplay || gs.dataNotPublished}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)]">{gs.strengthsLabel}</td>
                      {compareItems.map((u) => (
                        <td key={u.slug} className="py-2.5 px-3 text-xs text-[var(--text-secondary)]">
                          {(
                            u.seedRecord?.academicStrengthsJson ||
                            u.dynamicRecord?.researchAreas ||
                            []
                          )
                            .slice(0, 3)
                            .join(', ') || gs.dataNotPublished}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)]">{gs.officialWebsite}</td>
                      {compareItems.map((u) => (
                        <td key={u.slug} className="py-2.5 px-3 text-xs">
                          {u.officialWebsite ? (
                            <a
                              href={u.officialWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                            >
                              <span>{u.shortName}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            gs.dataNotPublished
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {watchlistTab === 'favorites' && (
          <div>
            {favoriteItems.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-3">{gs.noFavoritesYet}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteItems.map(({ entry, uni }) => (
                  <div
                    key={entry.universitySlug}
                    className="surface-subtle rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => onJumpToCountryAndUniversity(uni.countryCode, uni.slug)}
                      className="text-left space-y-1 cursor-pointer"
                    >
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {uni.countryFlag} {uni.cityName} · {entry.priority}
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]">
                        {uni.name}
                      </p>
                      {entry.personalNotes && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                          {entry.personalNotes}
                        </p>
                      )}
                    </button>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)] text-xs">
                      <button
                        type="button"
                        onClick={() => toggleCompareSlug(uni.slug)}
                        className="text-cyan-500 hover:underline cursor-pointer"
                      >
                        {compareSlugs.includes(uni.slug) ? gs.inCompare : gs.addToCompare}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedUniversity(uni.slug)}
                        className="text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {watchlistTab === 'recent' && (
          <div>
            {recentItems.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-3">{gs.noRecentYet}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentItems.map((uni) => (
                  <button
                    key={uni.slug}
                    type="button"
                    onClick={() => onJumpToCountryAndUniversity(uni.countryCode, uni.slug)}
                    className="btn-glass rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer"
                  >
                    {uni.countryFlag} {uni.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
