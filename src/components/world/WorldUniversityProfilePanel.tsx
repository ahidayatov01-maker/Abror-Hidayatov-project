import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  Film,
  GraduationCap,
  Landmark,
  Loader2,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  VideoOff,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  AdmissionRequirementRecord,
  ProgramRecord,
} from '../../types/domain';
import {
  isTgfuPriorityUniversity,
  VERIFIED_UNIVERSITY_CAMPUS_META,
  type ExplorerVideoItem,
  type VideoCategory,
} from '../../utils/explorerLogic';
import type { GlobeUiStrings } from './globeStrings';
import type { UnifiedExplorerUniversity } from './UniversityCinemaExplorer';

interface WorldUniversityProfilePanelProps {
  university: UnifiedExplorerUniversity;
  countryUniversities: UnifiedExplorerUniversity[];
  gs: GlobeUiStrings;
  onClose: () => void;
  onSelectUniversity: (slug: string, flyToGlobe?: boolean) => void;
  onLocateCoordinates: (lat: number, lon: number, zoomDist?: number) => void;
}

type VideoFilterKey = 'all' | 'official' | 'walkthrough' | 'student_life' | 'aerial';

const sharedVideoCache = new Map<
  string,
  { videos: ExplorerVideoItem[]; availableCategories: VideoCategory[] }
>();

export const WorldUniversityProfilePanel: React.FC<WorldUniversityProfilePanelProps> = ({
  university,
  countryUniversities,
  gs,
  onClose,
  onSelectUniversity,
  onLocateCoordinates,
}) => {
  const { catalog } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  const [logoErrorSlug, setLogoErrorSlug] = useState<string | null>(null);
  const [videoFilter, setVideoFilter] = useState<VideoFilterKey>('all');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<{
    loading: boolean;
    videos: ExplorerVideoItem[];
    availableCategories: VideoCategory[];
    error: string | null;
  }>({
    loading: true,
    videos: [],
    availableCategories: [],
    error: null,
  });

  const campusMeta = VERIFIED_UNIVERSITY_CAMPUS_META[university.slug] || null;
  const logoUrl =
    logoErrorSlug === university.slug
      ? null
      : campusMeta?.logoUrl || university.dynamicRecord?.imageUrl || null;
  const campusAddress =
    campusMeta?.campusAddress ||
    `${university.cityName}, ${university.countryName}`;
  const safeShortName =
    university.shortName ||
    (university.name || 'UNI')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() ||
    'UNI';

  const isPriorityTgfu = isTgfuPriorityUniversity({
    slug: university.slug,
    shortName: safeShortName,
    name: university.name,
    countryCode: university.countryCode,
  });

  // Academic programs & admission requirements from catalog
  const universityPrograms: ProgramRecord[] = useMemo(
    () => catalog.programs.filter((p) => p.universitySlug === university.slug),
    [catalog.programs, university.slug]
  );

  const universityAdmissions: AdmissionRequirementRecord[] = useMemo(
    () => catalog.admissions.filter((a) => a.universitySlug === university.slug),
    [catalog.admissions, university.slug]
  );

  // Fetch verified YouTube videos for the selected university
  useEffect(() => {
    setVideoFilter('all');
    setVideoSearchQuery('');

    const cacheKey = `${university.name}|${university.cityName}`.toLowerCase();
    const cached = sharedVideoCache.get(cacheKey);
    if (cached) {
      setVideoState({
        loading: false,
        videos: cached.videos,
        availableCategories: cached.availableCategories,
        error: null,
      });
      setSelectedVideoId(cached.videos[0]?.id || null);
      return;
    }

    const controller = new AbortController();
    setVideoState({ loading: true, videos: [], availableCategories: [], error: null });
    setSelectedVideoId(null);

    const qs = new URLSearchParams({
      name: university.name,
      shortName: university.shortName || '',
      city: university.cityName || '',
    });

    fetch(`/api/explorer/videos?${qs.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to verify university videos');
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
        sharedVideoCache.set(cacheKey, { videos, availableCategories });
        setVideoState({
          loading: false,
          videos,
          availableCategories,
          error: null,
        });
        setSelectedVideoId(videos[0]?.id || null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setVideoState({
          loading: false,
          videos: [],
          availableCategories: [],
          error: err instanceof Error ? err.message : 'Unable to load university videos',
        });
      });

    return () => controller.abort();
  }, [university.slug, university.name, university.shortName, university.cityName]);

  const categoryLabels: Record<VideoCategory, string> = useMemo(
    () => ({
      official: gs.officialIntro,
      walkthrough: gs.campusWalkthrough,
      student_life: gs.studentLife,
      aerial: gs.aerialDrone,
    }),
    [gs]
  );

  const filteredVideos = useMemo(() => {
    return videoState.videos.filter((vid) => {
      if (videoFilter !== 'all' && vid.category !== videoFilter) {
        return false;
      }
      if (videoSearchQuery.trim()) {
        const q = videoSearchQuery.trim().toLowerCase();
        return (
          vid.title.toLowerCase().includes(q) ||
          vid.publisher.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [videoState.videos, videoFilter, videoSearchQuery]);

  const activeVideo: ExplorerVideoItem | null = useMemo(() => {
    if (videoState.videos.length === 0) return null;
    if (selectedVideoId) {
      const found = videoState.videos.find((v) => v.id === selectedVideoId);
      if (found) return found;
    }
    return filteredVideos[0] || videoState.videos[0] || null;
  }, [videoState.videos, filteredVideos, selectedVideoId]);

  const handlePlayVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const panelRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    panelRootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [university.slug]);

  const faculties = university.seedRecord?.facultiesJson || [];
  const academicDirections =
    university.seedRecord?.departmentsJson ||
    university.seedRecord?.academicStrengthsJson ||
    university.dynamicRecord?.researchAreas ||
    [];
  const facilities = university.seedRecord?.facilitiesJson || [];

  return (
    <div
      ref={panelRootRef}
      data-testid="world-university-profile-panel"
      data-university-slug={university.slug}
      className="surface-card rounded-3xl border border-cyan-400/35 bg-[#040d1e]/95 text-slate-100 shadow-2xl overflow-hidden"
    >
      {/* Country University Switcher Bar (TGFU strictly first for Uzbekistan) */}
      {countryUniversities.length > 1 && (
        <div className="px-5 py-2.5 bg-[#020813] border-b border-cyan-500/20 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-300/80">
              {university.countryFlag} {university.countryName} · Universities ({countryUniversities.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {countryUniversities.map((u, idx) => {
              const isCurrent = u.slug === university.slug;
              const isTgf = isTgfuPriorityUniversity(u);
              return (
                <button
                  key={u.slug}
                  type="button"
                  data-testid={`profile-switcher-uni-${u.slug}`}
                  onClick={() => onSelectUniversity(u.slug, true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-cyan-500/25 border border-cyan-300/80 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isTgf && idx === 0 && (
                    <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {u.shortName || (u.name || 'UNI').slice(0, 6)}
                  </span>
                  <span className="hidden md:inline text-[11px] opacity-80 truncate max-w-[160px]">
                    {(u.name || '').replace(/\s*\(.*?\)\s*/g, '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TOP: UNIVERSITY LOGO, NAME & LOCATION (PINNED HEADER) ==================== */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#041024] via-[#061733] to-[#041024] border-b border-cyan-500/20">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Official University Logo or Verified Monogram Crest */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-cyan-400/45 bg-[#071c38] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.22)]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${university.shortName} official logo`}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoErrorSlug(university.slug)}
                  className="w-full h-full object-cover"
                  data-testid="university-profile-logo"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-cyan-100 font-display font-bold text-lg tracking-wider"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${
                      university.seedRecord?.accentHue || '#06b6d4'
                    }55, #041022)`,
                  }}
                  data-testid="university-profile-monogram"
                >
                  <GraduationCap className="w-5 h-5 text-cyan-300 mb-0.5" />
                  <span>{safeShortName.slice(0, 5)}</span>
                </div>
              )}
            </div>

            {/* University Identity, Country, City & Verified Campus Address */}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-cyan-500/25 border border-cyan-300/60 text-cyan-100">
                  {safeShortName}
                </span>
                {isPriorityTgfu && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/50 text-emerald-200">
                    <Sparkles className="w-3 h-3" />
                    <span>#1 Priority University · Uzbekistan</span>
                  </span>
                )}
                <span className="text-xs text-cyan-200/90 font-medium">
                  {university.countryFlag} {university.countryName} · {university.cityName}
                </span>
              </div>

              <h2
                className="font-display text-2xl sm:text-3xl font-semibold text-white leading-tight"
                data-testid="university-profile-name"
              >
                {university.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span data-testid="university-profile-address">{campusAddress}</span>
                </span>
                {university.latitude !== null && university.longitude !== null && (
                  <span className="font-mono-tabular text-cyan-300/85">
                    {university.latitude.toFixed(4)}°N, {university.longitude.toFixed(4)}°E
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top-Right Actions: Official Website, Locate on Globe, Close Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {university.latitude !== null && university.longitude !== null && (
              <button
                type="button"
                onClick={() =>
                  onLocateCoordinates(university.latitude!, university.longitude!, 1.84)
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-300" />
                <span>{gs.locateOnGlobe}</span>
              </button>
            )}

            {university.officialWebsite && (
              <a
                href={university.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="university-profile-website"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/25 border border-cyan-300/60 px-3.5 py-2 text-xs font-semibold text-cyan-50 hover:bg-cyan-500/35 transition-colors"
              >
                <span>{gs.officialWebsite}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              data-testid="close-university-profile-panel"
              aria-label="Close university profile panel"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body: MIDDLE (Overview, Faculties, Admissions) -> BOTTOM (YouTube Video Gallery) */}
      <div
        ref={scrollContainerRef}
        className="max-h-[75vh] overflow-y-auto divide-y divide-cyan-500/20"
      >

        {/* ==================== MIDDLE: UNIVERSITY OVERVIEW, ACADEMIC DIRECTIONS & ADMISSIONS ==================== */}
        <div className="p-5 sm:p-6 bg-[#040d1d] space-y-6">
          {/* University Description & Key Institutional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>University Overview</span>
                </h3>
                <p
                  className="text-sm text-slate-200 leading-relaxed"
                  data-testid="university-profile-description"
                >
                  {university.seedRecord?.overview ||
                    university.dynamicRecord?.summary ||
                    `${university.name} is an accredited higher education institution located in ${university.cityName}, ${university.countryName}.`}
                </p>
              </div>

              {university.seedRecord?.internationalInfo && (
                <div className="rounded-xl border border-cyan-500/20 bg-[#07162c] p-3.5 text-xs text-cyan-100/90 leading-relaxed">
                  <span className="font-semibold text-cyan-300">International Cooperation: </span>
                  {university.seedRecord.internationalInfo}
                </div>
              )}
            </div>

            {/* Key Institutional Facts */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 rounded-2xl border border-cyan-500/20 bg-[#061326] p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Country & City</p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {university.countryName} · {university.cityName}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  {gs.institutionTypeLabel}
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {university.seedRecord?.institutionType || 'Accredited University'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  {gs.languageLabel}
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {university.seedRecord?.primaryLanguage || 'National & International Tracks'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  {gs.tuitionLabel}
                </p>
                <p className="font-mono-tabular text-xs font-semibold text-cyan-300 mt-0.5">
                  {university.seedRecord?.tuitionLocalDisplay ||
                    (university.dynamicRecord
                      ? `${(university.dynamicRecord.worksCount ?? 0).toLocaleString()} ${gs.researchWorks}`
                      : gs.dataNotPublished)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  {gs.foundedLabel}
                </p>
                <p className="font-mono-tabular text-xs font-semibold text-white mt-0.5">
                  {university.seedRecord?.foundedYear || 'Accredited'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  {gs.studentsLabel}
                </p>
                <p className="font-mono-tabular text-xs font-semibold text-white mt-0.5">
                  {university.seedRecord?.studentCount
                    ? `${university.seedRecord.studentCount.toLocaleString()}+`
                    : university.dynamicRecord
                    ? `${(university.dynamicRecord.citedByCount ?? 0).toLocaleString()} citations`
                    : 'Active'}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Directions, Faculties & Admissions Information */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-cyan-500/15">
            {/* Academic Directions & Faculties */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-cyan-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Academic Directions & Faculties</span>
              </h3>

              {faculties.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Faculties</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {faculties.map((fac) => (
                      <div
                        key={fac}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{fac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {academicDirections.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">
                    Key Academic Directions & Specializations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {academicDirections.map((dir) => (
                      <span
                        key={dir}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 border border-cyan-400/30 text-cyan-100"
                      >
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {universityPrograms.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">
                    Featured Degree Programs
                  </p>
                  <div className="space-y-2">
                    {universityPrograms.map((prog) => (
                      <div
                        key={prog.slug}
                        className="rounded-xl border border-cyan-500/20 bg-[#061326] p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{prog.name}</p>
                          <span className="text-[11px] font-mono-tabular text-cyan-300 shrink-0">
                            {prog.degreeLevel} · {prog.durationYears} yrs
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {prog.overview}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Available Admission Information & Campus Facilities */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-cyan-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{gs.admissionRequirements}</span>
              </h3>

              {universityAdmissions.length > 0 ? (
                <div className="space-y-3">
                  {universityAdmissions.map((adm) => (
                    <div
                      key={`${adm.universitySlug}-${adm.degreeLevel}`}
                      className="rounded-2xl border border-cyan-500/25 bg-[#061428] p-4 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-cyan-200">{adm.degreeLevel}</span>
                        <span className="text-[11px] text-emerald-300 font-medium">
                          {adm.applicationDeadline}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-white">Qualifications: </strong>
                        {adm.academicQualifications}
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-white">Languages & Exams: </strong>
                        {adm.languageTests} · {adm.entranceExamInfo}
                      </p>
                      {adm.requiredDocumentsJson.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400">
                            Required Documents
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {adm.requiredDocumentsJson.map((doc) => (
                              <li
                                key={doc}
                                className="flex items-center gap-1.5 text-[11px] text-slate-200"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {adm.portalUrl && (
                        <div className="pt-1">
                          <a
                            href={adm.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
                          >
                            <span>{gs.officialAdmissions}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-cyan-500/20 bg-[#061428] p-4 space-y-2 text-xs text-slate-300">
                  <p className="leading-relaxed">
                    Admission cycles, entrance examinations, and language track requirements are
                    managed through the official university admissions portal.
                  </p>
                  {facilities.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">
                        {gs.facilitiesLabel}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {facilities.map((f) => (
                          <span
                            key={f}
                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-[11px]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(university.officialApplicationUrl || university.officialWebsite) && (
                    <div className="pt-2">
                      <a
                        href={university.officialApplicationUrl || university.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30"
                      >
                        <span>{gs.officialAdmissions}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== BOTTOM: YOUTUBE VIDEO GALLERY & EMBEDDED PLAYER ==================== */}
        <div
          ref={playerSectionRef}
          className="p-5 sm:p-6 bg-[#020814] space-y-5"
          data-testid="university-profile-videos-section"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
                  {university.shortName} — Official & Campus YouTube Videos
                </h3>
                {!videoState.loading && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono-tabular bg-cyan-500/20 border border-cyan-400/40 text-cyan-200">
                    {videoState.videos.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Verified YouTube videos from official university channels, campus tours, student life, and academic presentations.
              </p>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="Filter videos..."
                  aria-label="Filter university videos"
                  className="pl-8 pr-2.5 py-1 rounded-lg text-xs bg-white/5 border border-white/15 text-white placeholder:text-slate-400 w-40 sm:w-48"
                />
              </div>

              {(
                [
                  { id: 'all', label: 'All Videos' },
                  { id: 'official', label: gs.officialIntro },
                  { id: 'walkthrough', label: gs.campusWalkthrough },
                  { id: 'student_life', label: gs.studentLife },
                  { id: 'aerial', label: gs.aerialDrone },
                ] as const
              ).map((tab) => {
                const active = videoFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVideoFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/25 border border-cyan-300/70 text-cyan-100'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {videoState.loading ? (
            <div className="rounded-2xl border border-cyan-500/20 bg-[#051124] py-14 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <p className="text-sm text-cyan-100">{gs.loadingVideos}</p>
            </div>
          ) : videoState.videos.length > 0 ? (
            <div className="space-y-6">
              {/* Active Embedded YouTube Player Inside the Panel */}
              {activeVideo && (
                <div
                  className="rounded-2xl border border-cyan-400/35 bg-[#051124] p-4 space-y-3 shadow-xl"
                  data-testid="profile-panel-video-player"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-cyan-500/30">
                    <iframe
                      key={activeVideo.id}
                      src={activeVideo.embedUrl}
                      title={activeVideo.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="min-w-0 space-y-1">
                      <h4
                        className="text-base font-semibold text-white leading-snug"
                        data-testid="profile-active-video-title"
                      >
                        {activeVideo.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
                        <a
                          href={activeVideo.publisherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-300 font-medium hover:underline"
                        >
                          {activeVideo.isOfficialChannel && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{activeVideo.publisher}</span>
                        </a>
                        {activeVideo.isOfficialChannel && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-300 font-medium">
                              {gs.officialChannel}
                            </span>
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

                    <a
                      href={activeVideo.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
                    >
                      <span>{gs.watchOnYoutube}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Visually Prominent Video Thumbnail Gallery */}
              <div className="space-y-2.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-cyan-300/85">
                  Available University Videos ({filteredVideos.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map((vid) => {
                    const isPlaying = activeVideo?.id === vid.id;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        data-testid={`profile-video-card-${vid.id}`}
                        onClick={() => handlePlayVideo(vid.id)}
                        className={`group rounded-2xl overflow-hidden border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-500/20 border-cyan-300/80 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                            : 'bg-[#061226] border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#081832]'
                        }`}
                      >
                        <div className="w-full">
                          {/* Video Thumbnail with Play Button & Duration Overlay */}
                          <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex items-center justify-center">
                              <span
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                                  isPlaying
                                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_16px_#22d3ee]'
                                    : 'bg-black/65 border border-white/40 text-white'
                                }`}
                              >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </span>
                            </div>
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/75 border border-white/15 text-cyan-200">
                              {categoryLabels[vid.category]}
                            </span>
                            {vid.durationText && (
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-semibold bg-black/80 text-white">
                                {vid.durationText}
                              </span>
                            )}
                          </div>

                          {/* Video Title */}
                          <div className="p-3.5 space-y-1.5">
                            <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
                              {vid.title}
                            </p>
                          </div>
                        </div>

                        {/* Channel & Publication Date Footer */}
                        <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between gap-2 text-[11px] text-slate-300 border-t border-white/5">
                          <span className="inline-flex items-center gap-1 truncate font-medium text-cyan-200/90">
                            {vid.isOfficialChannel && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{vid.publisher}</span>
                          </span>
                          {vid.publishedAtText && (
                            <span className="text-slate-400 shrink-0">{vid.publishedAtText}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#051124] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                  <VideoOff className="w-4 h-4" />
                  <span>{gs.noVerifiedVideosTitle}</span>
                </div>
                <p className="text-xs text-slate-300">{gs.noVerifiedVideosDesc}</p>
              </div>
              {(university.officialMediaUrl || university.officialWebsite) && (
                <a
                  href={university.officialMediaUrl || university.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/45 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                >
                  <span>{gs.openOfficialMedia}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
