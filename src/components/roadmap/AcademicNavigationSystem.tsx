import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Flag,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  Orbit,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceIntelligence } from '../../context/WorkspaceIntelligenceContext';
import {
  applyAdaptiveScheduleToRoute,
  buildCosmicSolarSystem,
  computeCurvedPathD,
  computeRouteMetrics,
  EVIDENCE_LABELS,
  layoutStationsOnArc,
  mergeAiGeneratedRoute,
  updateTaskStarInRoute,
  type CosmicTaskStar,
  type EvidenceCategory,
  type RoadmapRouteMode,
  type RoadmapStation,
  type StationStatus,
} from '../../utils/roadmapEngine';
import { isDuplicateTask } from '../../utils/productivityEngine';
import { CosmicAcademicMap } from './CosmicAcademicMap';

const ROUTE_MODES: Array<{ id: RoadmapRouteMode; label: string; color: string }> = [
  { id: 'direct', label: 'Route A · Direct Admission', color: '#0EA5E9' },
  { id: 'transfer', label: 'Route B · Transfer / Bridge', color: '#8B5CF6' },
  { id: 'scholarship', label: 'Route C · Scholarship Track', color: '#10B981' },
];

export const AcademicNavigationSystem: React.FC = () => {
  const {
    catalog,
    countriesByCode,
    language,
    journeyTasks,
    addJourneyTask,
    setActiveSection,
  } = useApp();

  const {
    roadmapState,
    setRoadmapState,
    getAuthHeaders,
    refreshEntitlementStatus,
    showToast,
  } = useWorkspaceIntelligence();

  const activeMode = roadmapState.activeMode;
  const activeRoute = roadmapState.routes[activeMode];

  const [selectedStationId, setSelectedStationId] = useState<string>(
    activeRoute.stations.find((s) => s.status === 'in_progress')?.id ||
      activeRoute.stations[0]?.id ||
      ''
  );
  const [mapViewMode, setMapViewMode] = useState<'cosmic_3d' | 'cartographic_2d'>('cosmic_3d');
  const [compareRoutesOpen, setCompareRoutesOpen] = useState(false);
  const [adaptiveReviewOpen, setAdaptiveReviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [stationAddedToast, setStationAddedToast] = useState<string | null>(null);

  // Add custom milestone state
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTimeframe, setCustomTimeframe] = useState('Month 6');
  const [customCost, setCustomCost] = useState(100);
  const [customDesc, setCustomDesc] = useState('');

  // Interactive SVG zoom & pan state (for 2D Cartographic Fallback view)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const metrics = useMemo(() => computeRouteMetrics(activeRoute), [activeRoute]);

  const cosmicSystem = useMemo(() => {
    return buildCosmicSolarSystem(roadmapState);
  }, [roadmapState]);

  const selectedStation: RoadmapStation | null = useMemo(() => {
    return (
      cosmicSystem.planets.find((s) => s.id === selectedStationId) ||
      activeRoute.stations.find((s) => s.id === selectedStationId) ||
      metrics.currentStation ||
      activeRoute.stations[0] ||
      null
    );
  }, [cosmicSystem.planets, activeRoute.stations, selectedStationId, metrics.currentStation]);

  const handleModeSwitch = (mode: RoadmapRouteMode) => {
    setRoadmapState((prev) => ({ ...prev, activeMode: mode }));
    const nextRoute = roadmapState.routes[mode];
    const focusStation =
      nextRoute.stations.find((s) => s.status === 'in_progress') || nextRoute.stations[0];
    if (focusStation) setSelectedStationId(focusStation.id);
  };

  const handleTargetUniversityChange = (slug: string) => {
    const uni = catalog.universities.find((u) => u.slug === slug);
    if (!uni) return;
    const countryName = countriesByCode[uni.countryCode]?.name || uni.countryCode;
    setRoadmapState((prev) => ({
      ...prev,
      targetUniversitySlug: uni.slug,
      targetUniversityName: uni.name,
      targetCountry: countryName,
    }));
  };

  const updateStationStatus = (stationId: string, nextStatus: StationStatus) => {
    setRoadmapState((prev) => {
      const route = prev.routes[prev.activeMode];
      const updatedStations = route.stations.map((s) => {
        if (s.id !== stationId) return s;
        // Also synchronize child task stars when the parent milestone is marked completed
        const updatedStars = Array.isArray(s.taskStars)
          ? s.taskStars.map((star) => ({
              ...star,
              status:
                nextStatus === 'completed'
                  ? ('completed' as const)
                  : star.status === 'completed'
                  ? ('in_progress' as const)
                  : star.status,
              verificationLevel:
                nextStatus === 'completed'
                  ? ('milestone_verified' as const)
                  : star.verificationLevel,
            }))
          : undefined;
        return {
          ...s,
          status: nextStatus,
          verificationMastery:
            nextStatus === 'completed' ? ('milestone_verified' as const) : ('pending' as const),
          taskStars: updatedStars,
        };
      });
      return {
        ...prev,
        routes: {
          ...prev.routes,
          [prev.activeMode]: {
            ...route,
            stations: updatedStations,
          },
        },
      };
    });
    showToast(`Milestone status updated to ${nextStatus.replace('_', ' ')}.`, 'success');
  };

  const handleUpdateTaskStar = (
    stationId: string,
    starId: string,
    patch: Partial<CosmicTaskStar>
  ) => {
    setRoadmapState((prev) => {
      const currentRoute = prev.routes[prev.activeMode];
      const updatedRoute = updateTaskStarInRoute(currentRoute, stationId, starId, patch, {
        originCountry: prev.originCountry,
        targetCountry: prev.targetCountry,
        targetUniversityName: prev.targetUniversityName,
        targetDegree: prev.targetDegree,
        targetDiscipline: prev.targetDiscipline,
      });
      return {
        ...prev,
        routes: {
          ...prev.routes,
          [prev.activeMode]: updatedRoute,
        },
      };
    });
    showToast('Orbiting task star progress updated in Cosmic GPS.', 'success');
  };

  const handleApplyAdaptiveSchedule = () => {
    setRoadmapState((prev) => {
      const currentRoute = prev.routes[prev.activeMode];
      const adaptedRoute = applyAdaptiveScheduleToRoute(
        currentRoute,
        cosmicSystem.adaptiveProposal
      );
      return {
        ...prev,
        targetDeadlineMonths: cosmicSystem.adaptiveProposal.proposedDurationMonths,
        weeklyStudyHours: cosmicSystem.adaptiveProposal.proposedWeeklyHours,
        routes: {
          ...prev.routes,
          [prev.activeMode]: adaptedRoute,
        },
      };
    });
    setAdaptiveReviewOpen(false);
    showToast(
      'Adaptive schedule applied while strictly preserving all completed milestones.',
      'success'
    );
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originCountry: roadmapState.originCountry,
          originEducationLevel: roadmapState.originEducationLevel,
          targetCountry: roadmapState.targetCountry,
          targetUniversityName: roadmapState.targetUniversityName,
          targetDegree: roadmapState.targetDegree,
          targetDiscipline: roadmapState.targetDiscipline,
          mode: activeMode,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Academic Cartographer failed to generate route.');
      }

      setRoadmapState((prev) => {
        const current = prev.routes[activeMode];
        const merged = mergeAiGeneratedRoute(current, data.stations || [], {
          tagline: data.tagline,
          estimatedDurationMonths: data.estimatedDurationMonths,
        });
        return {
          ...prev,
          lastGeneratedAt: new Date().toISOString(),
          aiSummaryNote: data.summaryNote || prev.aiSummaryNote,
          routes: {
            ...prev.routes,
            [activeMode]: merged,
          },
        };
      });
      await refreshEntitlementStatus();
      showToast(
        `Academic Cartographer updated ${activeRoute.name} while preserving completed milestones.`,
        'success'
      );
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Unable to generate roadmap.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setRoadmapState((prev) => {
      const route = prev.routes[prev.activeMode];
      const nextCount = route.stations.length + 1;
      const coords = layoutStationsOnArc(nextCount, prev.activeMode);
      const newStation: RoadmapStation = {
        id: `custom-${Date.now()}`,
        order: nextCount,
        title: customTitle.trim(),
        subtitle: 'Custom Milestone',
        phase: 'Exams & Docs',
        status: 'upcoming',
        weight: 12,
        timeframe: customTimeframe.trim() || 'Flexible',
        estimatedCostUsd: Math.max(0, Number(customCost) || 0),
        evidenceCategory: 'user_provided',
        description: customDesc.trim() || 'User-defined academic preparation milestone.',
        requirements: ['Defined by student'],
        completionCriteria: 'Marked complete by student.',
        isCustom: true,
        x: 0,
        y: 0,
      };
      const combined = [...route.stations, newStation].map((st, idx) => ({
        ...st,
        order: idx + 1,
        x: coords[idx].x,
        y: coords[idx].y,
      }));
      return {
        ...prev,
        routes: {
          ...prev.routes,
          [prev.activeMode]: {
            ...route,
            stations: combined,
            estimatedTotalCostUsd: combined.reduce((sum, s) => sum + s.estimatedCostUsd, 0),
          },
        },
      };
    });

    setCustomTitle('');
    setCustomDesc('');
    setAddingMilestone(false);
    showToast('Custom milestone planet added to your cosmic navigation route.', 'success');
  };

  const handleSyncStationToTodo = async (station: RoadmapStation) => {
    if (isDuplicateTask(journeyTasks, station.title)) {
      showToast(`"${station.title}" is already in your active To-Do List.`, 'info');
      setStationAddedToast(`"${station.title}" is already in your To-Do List.`);
      setTimeout(() => setStationAddedToast(null), 3200);
      return;
    }
    await addJourneyTask({
      title: station.title,
      category: 'Milestone',
      targetUniversitySlug: roadmapState.targetUniversitySlug || null,
      dueDate: null,
      status: station.status === 'completed' ? 'completed' : 'pending',
      notes: `${activeRoute.name} (${station.timeframe}) · ${station.completionCriteria}`,
    });
    showToast(`Added "${station.title}" to your To-Do List.`, 'success');
    setStationAddedToast(`Added "${station.title}" to your To-Do List.`);
    setTimeout(() => setStationAddedToast(null), 3200);
  };

  const handleSyncStarToTodo = async (station: RoadmapStation, star: CosmicTaskStar) => {
    const taskTitle = `${star.title} (${station.title})`;
    if (isDuplicateTask(journeyTasks, taskTitle)) {
      showToast(`"${star.title}" is already in your active To-Do List.`, 'info');
      return;
    }
    await addJourneyTask({
      title: taskTitle,
      category: 'Milestone',
      targetUniversitySlug: roadmapState.targetUniversitySlug || null,
      dueDate: null,
      status: star.status === 'completed' ? 'completed' : 'pending',
      notes: `${star.deadlineWindow} · ${star.estimatedHours}h · ${star.completionCriteria}`,
    });
    showToast(`Added task star "${star.title}" to your To-Do List.`, 'success');
  };

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('[data-station-node="true"]')) return;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div className="space-y-6" data-testid="academic-roadmap-view">
      {/* Top Navigation Control Bar */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              <Compass className="w-4 h-4" />
              <span>
                Akademik yo&apos;lim · Cosmic Academic GPS &amp; 3D Solar System Navigation
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
              {roadmapState.originCountry} &rarr; {roadmapState.targetUniversityName}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {roadmapState.aiSummaryNote}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3D Cosmic Universe vs 2D Cartographic View Toggle */}
            <div className="inline-flex items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1">
              <button
                type="button"
                onClick={() => setMapViewMode('cosmic_3d')}
                data-testid="roadmap-view-cosmic-3d"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mapViewMode === 'cosmic_3d'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>3D Cosmic Solar System</span>
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('cartographic_2d')}
                data-testid="roadmap-view-carto-2d"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mapViewMode === 'cartographic_2d'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>2D Cartographic Map</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompareRoutesOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors ${
                compareRoutesOpen
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
              }`}
              data-testid="roadmap-compare-toggle"
            >
              <Layers className="w-4 h-4" />
              Compare 3 Routes
            </button>
            <button
              type="button"
              onClick={() => setAddingMilestone((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95 disabled:opacity-50"
              data-testid="roadmap-ai-generate-btn"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Tailor Route with AI
            </button>
          </div>
        </div>

        {/* Route Parameters Selector + Realistic Scheduling Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-[var(--border-hairline)]">
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Starting Origin
            </label>
            <input
              type="text"
              value={roadmapState.originCountry}
              onChange={(e) =>
                setRoadmapState((prev) => ({ ...prev, originCountry: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Destination University (The Sun)
            </label>
            <select
              value={roadmapState.targetUniversitySlug}
              onChange={(e) => handleTargetUniversityChange(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            >
              {catalog.universities.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.name} ({u.countryCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Target Degree
            </label>
            <select
              value={roadmapState.targetDegree}
              onChange={(e) =>
                setRoadmapState((prev) => ({ ...prev, targetDegree: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            >
              <option value="Bachelor">Bachelor&apos;s Degree</option>
              <option value="Master">Master&apos;s Degree</option>
              <option value="PhD">PhD / Doctoral</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Field of Study
            </label>
            <input
              type="text"
              value={roadmapState.targetDiscipline}
              onChange={(e) =>
                setRoadmapState((prev) => ({ ...prev, targetDiscipline: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Weekly Study Pace (Hrs/Wk)
            </label>
            <input
              type="number"
              min={2}
              max={50}
              value={roadmapState.weeklyStudyHours ?? 14}
              onChange={(e) =>
                setRoadmapState((prev) => ({
                  ...prev,
                  weeklyStudyHours: Math.max(2, Math.min(50, Number(e.target.value) || 14)),
                }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-mono-tabular text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              Target Horizon (Months)
            </label>
            <input
              type="number"
              min={2}
              max={48}
              value={roadmapState.targetDeadlineMonths ?? activeRoute.estimatedDurationMonths}
              onChange={(e) =>
                setRoadmapState((prev) => ({
                  ...prev,
                  targetDeadlineMonths: Math.max(2, Math.min(48, Number(e.target.value) || 14)),
                }))
              }
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-mono-tabular text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Route Mode Tabs + Live KPI & Schedule Feasibility Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {ROUTE_MODES.map((m) => {
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeSwitch(m.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  style={isSelected ? { backgroundColor: m.color } : undefined}
                  data-testid={`roadmap-mode-${m.id}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : m.color }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tabular">
            <div>
              <span className="text-[var(--text-muted)]">Progress:</span>{' '}
              <strong className="text-[var(--text-primary)]">{metrics.progressPercent}%</strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Verified Stars:</span>{' '}
              <strong className="text-[var(--text-primary)]">
                {cosmicSystem.sunDestination.completedStarsCount}/
                {cosmicSystem.sunDestination.totalStarsCount}
              </strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Est. Remaining:</span>{' '}
              <strong className="text-[var(--text-primary)]">{metrics.remainingMonths} mo</strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Prep Fees Est.:</span>{' '}
              <strong className="text-[var(--text-primary)]">
                ${metrics.remainingCostUsd.toLocaleString()}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setAdaptiveReviewOpen((v) => !v)}
              data-testid="roadmap-adaptive-schedule-btn"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-sans font-semibold transition ${
                cosmicSystem.feasibility.feasibilityStatus === 'unrealistic'
                  ? 'border-rose-500/45 bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  : cosmicSystem.feasibility.feasibilityStatus === 'tight'
                  ? 'border-amber-500/45 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  : 'border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {cosmicSystem.feasibility.feasibilityStatus === 'unrealistic' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>
                Schedule: {cosmicSystem.feasibility.feasibilityStatus.toUpperCase()} · Review
                Adaptive GPS
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviewable Adaptive Schedule Recalculation Drawer (Never Destroys Completed Work) */}
      {adaptiveReviewOpen && (
        <div
          className="rounded-2xl border border-[var(--accent-primary)]/40 bg-[var(--bg-elevated)] p-5 space-y-4"
          data-testid="roadmap-adaptive-review-drawer"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                <CalendarClock className="w-4 h-4" />
                <span>Intelligent Academic GPS · Reviewable Adaptive Schedule Proposal</span>
              </div>
              <h2 className="text-base font-semibold mt-1">
                {cosmicSystem.adaptiveProposal.summaryTitle}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {cosmicSystem.adaptiveProposal.summaryReason}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdaptiveReviewOpen(false)}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleApplyAdaptiveSchedule}
                className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-contrast)]"
              >
                Apply Realistic Schedule ({cosmicSystem.adaptiveProposal.proposedDurationMonths}m ·{' '}
                {cosmicSystem.adaptiveProposal.proposedWeeklyHours}h/wk)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {cosmicSystem.adaptiveProposal.adjustments.map((adj) => (
              <div
                key={adj.stationId}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3"
              >
                <div className="font-semibold text-[var(--text-primary)] truncate">
                  {adj.stationTitle}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Current: {adj.previousTimeframe}</span>
                  <span>&rarr;</span>
                  <span className="font-semibold text-[var(--accent-primary)]">
                    {adj.proposedTimeframe}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {genError && (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
          {genError}
        </div>
      )}

      {/* Optional 3-Route Side-by-Side Comparison Matrix */}
      {compareRoutesOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="roadmap-compare-matrix">
          {ROUTE_MODES.map((m) => {
            const r = roadmapState.routes[m.id];
            const rm = computeRouteMetrics(r);
            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 space-y-2.5 cursor-pointer transition-colors ${
                  activeMode === m.id
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                }`}
                onClick={() => handleModeSwitch(m.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: m.color }}>
                    {r.name}
                  </span>
                  <span className="text-[11px] font-mono-tabular text-[var(--text-muted)]">
                    {rm.progressPercent}% done
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{r.tagline}</p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-hairline)] text-[11px]">
                  <div>
                    <p className="text-[var(--text-muted)]">Duration</p>
                    <p className="font-mono-tabular font-semibold">{r.estimatedDurationMonths}m</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Est. Fees</p>
                    <p className="font-mono-tabular font-semibold">${r.estimatedTotalCostUsd}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Selectivity</p>
                    <p className="font-semibold">{r.riskLevel}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Optional Custom Milestone Form */}
      {addingMilestone && (
        <form
          onSubmit={handleAddCustomMilestone}
          className="rounded-2xl border border-[var(--accent-primary)]/40 bg-[var(--bg-elevated)] p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Add Custom Milestone to {activeRoute.name}</h2>
            <button
              type="button"
              onClick={() => setAddingMilestone(false)}
              className="text-xs text-[var(--text-muted)]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Milestone title (e.g. Portfolio GitHub Review)"
              className="sm:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={customTimeframe}
              onChange={(e) => setCustomTimeframe(e.target.value)}
              placeholder="Timeframe (e.g. Month 6)"
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
            <input
              type="number"
              min={0}
              value={customCost}
              onChange={(e) => setCustomCost(Number(e.target.value) || 0)}
              placeholder="Estimated Cost USD"
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs font-mono-tabular text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Description / requirements"
              className="sm:col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
            >
              Add Milestone
            </button>
          </div>
        </form>
      )}

      {/* Main Split: 3D Cosmic Solar System Map (or 2D Cartographic Fallback) + Station Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className={mapViewMode === 'cosmic_3d' ? 'xl:col-span-12' : 'xl:col-span-8'}>
          {mapViewMode === 'cosmic_3d' ? (
            <CosmicAcademicMap
              cosmicSystem={cosmicSystem}
              selectedStationId={selectedStation?.id || selectedStationId}
              onSelectStation={(stationId) => setSelectedStationId(stationId)}
              onUpdateStationStatus={updateStationStatus}
              onUpdateTaskStar={handleUpdateTaskStar}
              onSyncStationToTodo={(st) => void handleSyncStationToTodo(st)}
              onSyncStarToTodo={(st, star) => void handleSyncStarToTodo(st, star)}
              stationAddedToast={stationAddedToast}
              activeRouteMode={activeMode}
              onSwitchRouteMode={handleModeSwitch}
              targetCountry={roadmapState.targetCountry}
              targetDegree={roadmapState.targetDegree}
              targetDiscipline={roadmapState.targetDiscipline}
              originCountry={roadmapState.originCountry}
            />
          ) : (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Navigation className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>{activeRoute.name}</span>
                  <span className="text-[var(--text-muted)]">
                    · Click any station node to inspect · Drag to pan
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetViewport}
                    className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Center & Reset Map View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative w-full h-[430px] sm:h-[460px] select-none overflow-hidden bg-slate-50 dark:bg-[#0B1324]">
                <svg
                  viewBox="0 0 1000 440"
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  role="img"
                  aria-label="Interactive Academic Roadmap Navigation Map"
                >
                  <defs>
                    <pattern
                      id="carto-grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.07"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>

                  <rect
                    width="1000"
                    height="440"
                    fill="url(#carto-grid)"
                    className="text-slate-600 dark:text-sky-200"
                  />

                  <g
                    className="text-slate-400 dark:text-sky-400"
                    opacity="0.12"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="95" cy="220" r="120" strokeDasharray="4 6" />
                    <circle cx="905" cy="220" r="135" strokeDasharray="4 6" />
                  </g>

                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {ROUTE_MODES.map((m) => {
                      const route = roadmapState.routes[m.id];
                      const isActive = m.id === activeMode;
                      const pathD = computeCurvedPathD(route.stations);
                      return (
                        <g key={m.id}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={m.color}
                            strokeWidth={isActive ? 6 : 3}
                            strokeOpacity={isActive ? 0.92 : 0.25}
                            strokeDasharray={isActive ? undefined : '6 6'}
                            strokeLinecap="round"
                            className="cursor-pointer transition-opacity"
                            onClick={() => handleModeSwitch(m.id)}
                          />
                        </g>
                      );
                    })}

                    {activeRoute.stations.map((station) => {
                      const isSelected = selectedStation?.id === station.id;
                      const isCompleted = station.status === 'completed';
                      const isCurrent = station.status === 'in_progress';

                      return (
                        <g
                          key={station.id}
                          data-station-node="true"
                          className="cursor-pointer"
                          onClick={() => setSelectedStationId(station.id)}
                        >
                          {(isSelected || isCurrent) && (
                            <circle
                              cx={station.x}
                              cy={station.y}
                              r={isSelected ? 22 : 18}
                              fill={activeRoute.accentHex}
                              fillOpacity={isSelected ? 0.2 : 0.12}
                              stroke={activeRoute.accentHex}
                              strokeWidth={isSelected ? 2 : 1.2}
                            />
                          )}

                          <circle
                            cx={station.x}
                            cy={station.y}
                            r={13}
                            fill={
                              isCompleted
                                ? '#10B981'
                                : isCurrent
                                ? activeRoute.accentHex
                                : 'var(--bg-solid-surface)'
                            }
                            stroke={isCompleted ? '#059669' : activeRoute.accentHex}
                            strokeWidth={2.5}
                          />

                          <text
                            x={station.x}
                            y={station.y + 4}
                            textAnchor="middle"
                            fontSize="10.5"
                            fontWeight="700"
                            fill={isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-primary)'}
                          >
                            {station.order}
                          </text>

                          <g
                            transform={`translate(${station.x}, ${
                              station.order % 2 === 1 ? station.y - 44 : station.y + 44
                            })`}
                          >
                            <rect
                              x="-82"
                              y="-16"
                              width="164"
                              height="32"
                              rx="8"
                              fill="var(--bg-solid-surface)"
                              fillOpacity="0.96"
                              stroke={isSelected ? activeRoute.accentHex : 'var(--border-hairline)'}
                              strokeWidth={isSelected ? 1.5 : 1}
                            />
                            <text
                              x="0"
                              y="-2"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                              fill="var(--text-primary)"
                            >
                              {station.title.length > 24
                                ? `${station.title.slice(0, 22)}…`
                                : station.title}
                            </text>
                            <text
                              x="0"
                              y="10"
                              textAnchor="middle"
                              fontSize="8.8"
                              fill="var(--text-muted)"
                            >
                              {station.timeframe}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-solid-surface)]/92 px-3 py-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Origin: <strong>{roadmapState.originCountry}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      Destination: <strong>{roadmapState.targetUniversityName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: activeRoute.accentHex }}
                      />
                      In Progress
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400" />{' '}
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Station Inspector Drawer (Displayed in 2D Cartographic Mode; 3D Cosmic Mode uses the unified Left Focus Panel) */}
        <div
          className={`${
            mapViewMode === 'cosmic_3d' ? 'hidden' : 'xl:col-span-4'
          } rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 space-y-4`}
          data-testid="roadmap-station-inspector"
        >
          {selectedStation ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                    Milestone Planet #{selectedStation.order} · {selectedStation.phase}
                  </p>
                  <h2 className="text-lg font-semibold mt-0.5 leading-snug">
                    {selectedStation.title}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {selectedStation.subtitle}
                  </p>
                </div>
              </div>

              {/* Evidence Classification Notice */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>
                    {EVIDENCE_LABELS[selectedStation.evidenceCategory as EvidenceCategory]?.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {EVIDENCE_LABELS[selectedStation.evidenceCategory as EvidenceCategory]?.shortNote}
                </p>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {selectedStation.description}
              </p>

              {/* Time & Estimated Cost */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[11px] text-[var(--text-muted)]">Target Window</p>
                  <p className="font-semibold font-mono-tabular mt-0.5">
                    {selectedStation.timeframe}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[11px] text-[var(--text-muted)]">Est. Prep Cost</p>
                  <p className="font-semibold font-mono-tabular mt-0.5">
                    ${selectedStation.estimatedCostUsd.toLocaleString()} USD
                  </p>
                </div>
              </div>

              {/* Orbiting Actionable Task Stars Quick Checklist */}
              {Array.isArray(selectedStation.taskStars) && selectedStation.taskStars.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      Orbiting Task Stars ({selectedStation.taskStars.length})
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {
                        selectedStation.taskStars.filter((star) => star.status === 'completed')
                          .length
                      }{' '}
                      completed
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedStation.taskStars.map((star) => {
                      const isDone = star.status === 'completed';
                      return (
                        <div
                          key={star.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-medium truncate ${
                                isDone
                                  ? 'line-through text-[var(--text-muted)]'
                                  : 'text-[var(--text-primary)]'
                              }`}
                            >
                              ★ {star.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {star.estimatedHours}h
                              </span>
                              <span>•</span>
                              <span>{star.deadlineWindow}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTaskStar(selectedStation.id, star.id, {
                                status: isDone ? 'in_progress' : 'completed',
                                verificationLevel: isDone ? 'pending' : 'milestone_verified',
                              })
                            }
                            className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                              isDone
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                            }`}
                          >
                            {isDone ? 'Verified' : 'Complete'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Key Requirements</p>
                <ul className="space-y-1.5">
                  {selectedStation.requirements.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-xs">
                <p className="font-semibold text-[var(--text-primary)]">Completion Criteria</p>
                <p className="text-[var(--text-secondary)] mt-0.5">
                  {selectedStation.completionCriteria}
                </p>
                {selectedStation.officialCheckNote && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1.5">
                    Note: {selectedStation.officialCheckNote}
                  </p>
                )}
              </div>

              {/* Status Controls */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold">Update Station Status</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'completed', label: 'Completed' },
                      { id: 'in_progress', label: 'In Progress' },
                      { id: 'upcoming', label: 'Upcoming' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateStationStatus(selectedStation.id, st.id)}
                      className={`rounded-xl px-2 py-2 text-xs font-semibold border transition-colors ${
                        selectedStation.status === st.id
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cross-Module Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => void handleSyncStationToTodo(selectedStation)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95"
                  data-testid="roadmap-sync-todo-btn"
                >
                  Add Station to To-Do List
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('financial-planner')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Model Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('routine')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Schedule Study
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Select a station on the map to inspect its requirements and milestones.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
