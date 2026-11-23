import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  ListTodo,
  Edit3,
  BookOpen,
  Award,
  AlertTriangle,
  RotateCcw,
  Sun as SunIcon,
  Orbit,
  Star as StarIcon,
  Check,
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  CosmicSolarSystemModel,
  CosmicTaskStar,
  RoadmapRouteMode,
  RoadmapStation,
  StationStatus,
  VerificationMasteryLevel,
  computeInwardProgressChainIndices,
  computeRightSideFocusFraming,
  computeSunCenteredOrbitPoint,
  formatMilestoneHoverTitle,
  formatMilestoneNumber,
  getPlanetOrbitalInclination,
} from '../../utils/roadmapEngine';
import {
  createCosmicEnvironmentTexture,
  createDeepSpaceEnvironment,
  createMilestonePlanetAssembly,
  createSunAssembly,
  PLANET_ARCHETYPE_SPECS,
  PlanetAssemblyResult,
  SunAssemblyResult,
  DeepSpaceEnvironmentResult,
} from './cosmicCelestialMaterials';
import { useApp } from '../../context/AppContext';
import { formatCompactMilestoneLabel } from '../../utils/displayCopy';

export type CosmicExplorationLevel = 'system' | 'planet' | 'star' | 'sun';

export interface CosmicAcademicMapProps {
  cosmicSystem: CosmicSolarSystemModel;
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  onUpdateStationStatus: (stationId: string, status: StationStatus) => void;
  onUpdateTaskStar: (
    stationId: string,
    starId: string,
    updates: Partial<
      Pick<
        CosmicTaskStar,
        | 'status'
        | 'verificationLevel'
        | 'title'
        | 'detailedInstructions'
        | 'estimatedHours'
        | 'deadlineWindow'
        | 'evidenceNote'
      >
    >
  ) => void;
  onSyncStationToTodo: (station: RoadmapStation) => void;
  onSyncStarToTodo?: (station: RoadmapStation, star: CosmicTaskStar) => void;
  stationAddedToast?: string | null;
  activeRouteMode?: RoadmapRouteMode;
  onSwitchRouteMode?: (mode: RoadmapRouteMode) => void;
  targetCountry?: string;
  targetDegree?: string;
  targetDiscipline?: string;
  originCountry?: string;
}

interface HoveredEntityInfo {
  key: string;
  kind: 'sun' | 'planet' | 'star';
  stationId?: string;
  starId?: string;
  code?: string;
  title: string;
  subtitle: string;
  parentLabel?: string;
  statusLabel?: string;
  statusKey?: 'completed' | 'in_progress' | 'available' | 'upcoming' | 'locked';
  completedTasks?: number;
  totalTasks?: number;
  progressPercent?: number;
}

interface PlanetRuntimeRecord {
  stationId: string;
  order: number;
  title: string;
  status: StationStatus;
  orbitRadius: number;
  baseOrbitAngle: number;
  currentOrbitAngle: number;
  orbitSpeed: number;
  inclinationX: number;
  inclinationZ: number;
  worldPos: THREE.Vector3;
  assembly: PlanetAssemblyResult;
  hitProxyMesh: THREE.Mesh;
  orbitLine: THREE.LineLoop;
  orbitLineMaterial: THREE.LineBasicMaterial;
  orbitGlowLine?: THREE.Mesh;
  orbitGlowMaterial?: THREE.MeshBasicMaterial;
  baseOrbitOpacity: number;
  currentEmphasis: number;
  currentScale: number;
}

interface OrbitPulseRecord {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  orbitRadius: number;
  inclinationX: number;
  inclinationZ: number;
  angle: number;
  speed: number;
  stationId: string;
}

interface ArcPulseRecord {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  curve: THREE.CatmullRomCurve3;
  t: number;
  speed: number;
}

interface StarRuntimeRecord {
  starId: string;
  stationId: string;
  parentOrder: number;
  parentTitle: string;
  title: string;
  status: CosmicTaskStar['status'];
  estimatedHours: number;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  coreMaterial: THREE.MeshBasicMaterial;
  hitProxyMesh: THREE.Mesh;
  haloSprite: THREE.Sprite;
  haloMaterial: THREE.SpriteMaterial;
  localOrbitLine: THREE.LineLoop;
  localOrbitMaterial: THREE.LineBasicMaterial;
  orbitRadius: number;
  orbitAngle: number;
  orbitInclination: number;
  orbitSpeed: number;
  baseHaloOpacity: number;
}

interface SceneRuntimeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  deepSpace: DeepSpaceEnvironmentResult;
  sunAssembly: SunAssemblyResult;
  sunHitProxy: THREE.Mesh;
  orbitsGroup: THREE.Group;
  progressArcGroup: THREE.Group;
  planetsRootGroup: THREE.Group;
  planetRecords: Map<string, PlanetRuntimeRecord>;
  orbitPulses: OrbitPulseRecord[];
  arcPulses: ArcPulseRecord[];
  starRecords: StarRuntimeRecord[];
  interactiveMeshes: THREE.Object3D[];
  starTextures: {
    completed: THREE.CanvasTexture;
    active: THREE.CanvasTexture;
    available: THREE.CanvasTexture;
    locked: THREE.CanvasTexture;
  };
  cameraState: {
    currentCamPos: THREE.Vector3;
    targetCamPos: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    orbitYawOffset: number;
    orbitPitchOffset: number;
    zoomDistanceMultiplier: number;
    savedOverviewYaw: number;
    savedOverviewPitch: number;
    savedOverviewZoom: number;
    parallaxX: number;
    parallaxY: number;
    smoothParallaxX: number;
    smoothParallaxY: number;
  };
}

const ROUTE_MODE_OPTIONS: Array<{ id: RoadmapRouteMode; label: string; color: string }> = [
  { id: 'direct', label: 'Direct Admission', color: '#38bdf8' },
  { id: 'transfer', label: 'Transfer Bridge', color: '#a855f7' },
  { id: 'scholarship', label: 'Scholarship Track', color: '#34d399' },
];

function createStarGlowTexture(hexColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(hexColor);
  const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;

  const grad = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.24, `rgba(${rgb}, 0.92)`);
  grad.addColorStop(0.58, `rgba(${rgb}, 0.34)`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const CosmicAcademicMap: React.FC<CosmicAcademicMapProps> = ({
  cosmicSystem,
  selectedStationId,
  onSelectStation,
  onUpdateStationStatus,
  onUpdateTaskStar,
  onSyncStationToTodo,
  onSyncStarToTodo,
  stationAddedToast,
  activeRouteMode = 'direct',
  onSwitchRouteMode,
  targetCountry,
  targetDegree,
  targetDiscipline,
  originCountry,
}) => {
  const { language } = useApp();
  const languageRef = useRef(language);
  languageRef.current = language;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const nebulaBackdropRef = useRef<HTMLDivElement | null>(null);
  const hoverLabelDomRef = useRef<HTMLDivElement | null>(null);
  const sunLabelDomRef = useRef<HTMLDivElement | null>(null);
  const sceneCtxRef = useRef<SceneRuntimeContext | null>(null);

  const [explorationLevel, setExplorationLevel] = useState<CosmicExplorationLevel>('system');
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<HoveredEntityInfo | null>(null);
  const [isObservatoryMode, setIsObservatoryMode] = useState(false);
  const [showAcademicDetails, setShowAcademicDetails] = useState(false);
  const [showStarSecondaryDetails, setShowStarSecondaryDetails] = useState(false);
  const [mobilePanelCollapsed, setMobilePanelCollapsed] = useState(false);
  const [isSoftwareGlMode, setIsSoftwareGlMode] = useState(false);

  // Inline Task Star editing state
  const [isEditingStar, setIsEditingStar] = useState(false);
  const [editStarTitle, setEditStarTitle] = useState('');
  const [editStarHours, setEditStarHours] = useState(8);
  const [editStarWindow, setEditStarWindow] = useState('');
  const [editStarInstructions, setEditStarInstructions] = useState('');

  const activePlanet = useMemo(() => {
    return (
      cosmicSystem.planets.find((p) => p.id === selectedStationId) ||
      cosmicSystem.planets[0] ||
      null
    );
  }, [cosmicSystem.planets, selectedStationId]);

  const activeTaskStars = useMemo(() => {
    return activePlanet?.taskStars || [];
  }, [activePlanet]);

  const activeStar = useMemo(() => {
    if (!activePlanet) return null;
    const stars = activePlanet.taskStars || [];
    if (selectedStarId) {
      const found = stars.find((s) => s.id === selectedStarId);
      if (found) return found;
    }
    return stars.find((s) => s.status === 'in_progress') || stars[0] || null;
  }, [activePlanet, selectedStarId]);

  // Keep inline edit fields synced when activeStar changes
  useEffect(() => {
    if (activeStar) {
      setEditStarTitle(activeStar.title);
      setEditStarHours(activeStar.estimatedHours);
      setEditStarWindow(activeStar.deadlineWindow);
      setEditStarInstructions(activeStar.detailedInstructions);
      setIsEditingStar(false);
    }
  }, [activeStar]);

  // Lock page scroll and elevate above ancestor transform stacking contexts while Immersive Cosmic Observatory mode is active
  useEffect(() => {
    if (!isObservatoryMode || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-cosmic-observatory', 'true');

    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-cosmic-observatory-style', 'true');
    styleEl.textContent = `
      body[data-cosmic-observatory="true"] aside:not([data-cosmic-focus-panel="true"]),
      body[data-cosmic-observatory="true"] header {
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    const modifiedAncestors: Array<{
      el: HTMLElement;
      transform: string;
      filter: string;
      backdropFilter: string;
      zIndex: string;
      overflow: string;
    }> = [];

    let curr = rootRef.current?.parentElement || null;
    while (curr && curr !== document.body) {
      modifiedAncestors.push({
        el: curr,
        transform: curr.style.transform,
        filter: curr.style.filter,
        backdropFilter: curr.style.backdropFilter,
        zIndex: curr.style.zIndex,
        overflow: curr.style.overflow,
      });
      curr.style.transform = 'none';
      curr.style.filter = 'none';
      curr.style.backdropFilter = 'none';
      curr.style.zIndex = '9999';
      curr.style.overflow = 'visible';
      curr = curr.parentElement;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.removeAttribute('data-cosmic-observatory');
      styleEl.remove();
      for (const item of modifiedAncestors) {
        item.el.style.transform = item.transform;
        item.el.style.filter = item.filter;
        item.el.style.backdropFilter = item.backdropFilter;
        item.el.style.zIndex = item.zIndex;
        item.el.style.overflow = item.overflow;
      }
    };
  }, [isObservatoryMode]);

  // Mutable refs for 60fps animation loop synchronization without tearing down WebGL
  const explorationLevelRef = useRef<CosmicExplorationLevel>(explorationLevel);
  explorationLevelRef.current = explorationLevel;

  const selectedStationIdRef = useRef<string>(activePlanet?.id || selectedStationId);
  selectedStationIdRef.current = activePlanet?.id || selectedStationId;

  const selectedStarIdRef = useRef<string | null>(activeStar?.id || null);
  selectedStarIdRef.current = activeStar?.id || null;

  const hoveredKeyRef = useRef<string | null>(null);
  const onSelectStationRef = useRef(onSelectStation);
  onSelectStationRef.current = onSelectStation;

  // Save/restore overview camera orientation when entering/exiting focus mode
  const saveOverviewCameraStateIfNeeded = useCallback(() => {
    const ctx = sceneCtxRef.current;
    if (!ctx) return;
    if (explorationLevelRef.current === 'system') {
      ctx.cameraState.savedOverviewYaw = ctx.cameraState.orbitYawOffset;
      ctx.cameraState.savedOverviewPitch = ctx.cameraState.orbitPitchOffset;
      ctx.cameraState.savedOverviewZoom = ctx.cameraState.zoomDistanceMultiplier;
    }
  }, []);

  // Navigation Handlers
  const handleEnterSystemOverview = useCallback(() => {
    const ctx = sceneCtxRef.current;
    if (ctx) {
      ctx.cameraState.orbitYawOffset = ctx.cameraState.savedOverviewYaw;
      ctx.cameraState.orbitPitchOffset = ctx.cameraState.savedOverviewPitch;
      ctx.cameraState.zoomDistanceMultiplier = ctx.cameraState.savedOverviewZoom;
    }
    setExplorationLevel('system');
    setSelectedStarId(null);
    setMobilePanelCollapsed(false);
  }, []);

  const handleResetCamera = useCallback(() => {
    const ctx = sceneCtxRef.current;
    if (ctx) {
      ctx.cameraState.orbitYawOffset = 0;
      ctx.cameraState.orbitPitchOffset = 0;
      ctx.cameraState.zoomDistanceMultiplier = 1.0;
      ctx.cameraState.savedOverviewYaw = 0;
      ctx.cameraState.savedOverviewPitch = 0;
      ctx.cameraState.savedOverviewZoom = 1.0;
    }
  }, []);

  const handleZoomStep = useCallback((delta: number) => {
    const ctx = sceneCtxRef.current;
    if (!ctx) return;
    ctx.cameraState.zoomDistanceMultiplier = Math.max(
      0.58,
      Math.min(1.7, Number((ctx.cameraState.zoomDistanceMultiplier + delta).toFixed(2)))
    );
  }, []);

  const handleEnterSunDestination = useCallback(() => {
    saveOverviewCameraStateIfNeeded();
    const ctx = sceneCtxRef.current;
    if (ctx) {
      ctx.cameraState.orbitYawOffset = 0;
      ctx.cameraState.orbitPitchOffset = 0;
      ctx.cameraState.zoomDistanceMultiplier = 1.0;
    }
    setExplorationLevel('sun');
    setSelectedStarId(null);
    setMobilePanelCollapsed(false);
  }, [saveOverviewCameraStateIfNeeded]);

  const handleEnterPlanetView = useCallback(
    (stationId: string) => {
      saveOverviewCameraStateIfNeeded();
      const ctx = sceneCtxRef.current;
      if (ctx) {
        ctx.cameraState.orbitYawOffset = 0;
        ctx.cameraState.orbitPitchOffset = 0;
        ctx.cameraState.zoomDistanceMultiplier = 1.0;
      }
      onSelectStationRef.current(stationId);
      setExplorationLevel('planet');
      setSelectedStarId(null);
      setMobilePanelCollapsed(false);
    },
    [saveOverviewCameraStateIfNeeded]
  );

  const handleEnterStarView = useCallback(
    (stationId: string, starId: string) => {
      saveOverviewCameraStateIfNeeded();
      const ctx = sceneCtxRef.current;
      if (ctx) {
        ctx.cameraState.orbitYawOffset = 0;
        ctx.cameraState.orbitPitchOffset = 0;
        ctx.cameraState.zoomDistanceMultiplier = 1.0;
      }
      if (stationId !== selectedStationIdRef.current) {
        onSelectStationRef.current(stationId);
      }
      setSelectedStarId(starId);
      setExplorationLevel('star');
      setMobilePanelCollapsed(false);
    },
    [saveOverviewCameraStateIfNeeded]
  );

  // Keyboard Escape support for closing focus mode or exiting observatory mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (explorationLevelRef.current === 'star' && selectedStationIdRef.current) {
          e.preventDefault();
          handleEnterPlanetView(selectedStationIdRef.current);
        } else if (
          explorationLevelRef.current === 'planet' ||
          explorationLevelRef.current === 'sun'
        ) {
          e.preventDefault();
          handleEnterSystemOverview();
        } else if (isObservatoryMode) {
          e.preventDefault();
          setIsObservatoryMode(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isObservatoryMode, handleEnterPlanetView, handleEnterSystemOverview]);

  // Save inline edits for a Task Star
  const handleSaveStarEdits = () => {
    if (!activePlanet || !activeStar) return;
    onUpdateTaskStar(activePlanet.id, activeStar.id, {
      title: editStarTitle.trim() || activeStar.title,
      estimatedHours: Math.max(1, Number(editStarHours) || activeStar.estimatedHours),
      deadlineWindow: editStarWindow.trim() || activeStar.deadlineWindow,
      detailedInstructions: editStarInstructions.trim() || activeStar.detailedInstructions,
    });
    setIsEditingStar(false);
  };

  // Cycle to the next available task star around the current planet
  const handleJumpToNextTask = () => {
    if (!activePlanet || activeTaskStars.length === 0) return;
    const currentIndex = activeTaskStars.findIndex((s) => s.id === activeStar?.id);
    const nextStar =
      activeTaskStars[(currentIndex + 1) % activeTaskStars.length] || activeTaskStars[0];
    if (nextStar) {
      handleEnterStarView(activePlanet.id, nextStar.id);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. Mount-Once Three.js WebGL Renderer, Camera, Lighting & Animation Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 720;

    const scene = new THREE.Scene();
    const envTexture = createCosmicEnvironmentTexture();
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1600);
    camera.position.set(0, 62, 140);

    // Probe software WebGL once before renderer init so antialiasing & pixel ratio adapt cleanly
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!probeGl) return true;
        const ext = probeGl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probeGl.RENDERER;
        const gpu = String(probeGl.getParameter(param) || '');
        probeGl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();
    setIsSoftwareGlMode(isSoftwareGl);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const gl = renderer.getContext();

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Transparent WebGL clear so the volumetric CSS nebula & Milky Way backdrop gleams smoothly behind the 3D observatory
    renderer.setClearColor(new THREE.Color('#000000'), 0);

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Deep Space 3-Layer Twinkling Starfield, Cross-Flare Stars, Milky Way Dust & Astronomical Astrolabe HUD Grid
    const deepSpace = createDeepSpaceEnvironment();
    scene.add(deepSpace.group);

    // Physically Plausible Solar Illumination Rig (Strong Sun PointLight + Low Ambient = Dramatic 3D Terminator Shadows)
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.24);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#4f46e5', '#050816', 0.26);
    scene.add(hemiLight);

    // Primary Solar Star Light radiating outward from (0,0,0) onto every planet's sunlit hemisphere
    const solarPointLight = new THREE.PointLight('#fff1cc', 9.2, 560, 0.34);
    solarPointLight.position.set(0, 0, 0);
    scene.add(solarPointLight);

    // Subtle cool deep-space rim fill so dark hemispheres keep crisp 3D silhouettes
    const nebulaFillLight = new THREE.DirectionalLight('#38bdf8', 0.26);
    nebulaFillLight.position.set(-130, 65, -140);
    scene.add(nebulaFillLight);

    // Radiant Multi-Layered Central Sun (Ultimate Academic Destination at origin)
    const sunAssembly = createSunAssembly(
      cosmicSystem.sunDestination.overallProgressPercent,
      cosmicSystem.sunDestination.isGoalAchieved
    );
    scene.add(sunAssembly.group);

    // Invisible slightly larger hit proxy for the Sun so clicking/hovering is effortless
    const sunHitGeo = new THREE.SphereGeometry(8.8, 24, 24);
    const sunHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const sunHitProxy = new THREE.Mesh(sunHitGeo, sunHitMat);
    sunAssembly.group.add(sunHitProxy);

    const orbitsGroup = new THREE.Group();
    scene.add(orbitsGroup);

    const progressArcGroup = new THREE.Group();
    scene.add(progressArcGroup);

    const planetsRootGroup = new THREE.Group();
    scene.add(planetsRootGroup);

    const starTextures = {
      completed: createStarGlowTexture('#34d399'),
      active: createStarGlowTexture('#38bdf8'),
      available: createStarGlowTexture('#fbbf24'),
      locked: createStarGlowTexture('#64748b'),
    };

    const runtimeCtx: SceneRuntimeContext = {
      scene,
      camera,
      renderer,
      isSoftwareGl,
      deepSpace,
      sunAssembly,
      sunHitProxy,
      orbitsGroup,
      progressArcGroup,
      planetsRootGroup,
      planetRecords: new Map(),
      orbitPulses: [],
      arcPulses: [],
      starRecords: [],
      interactiveMeshes: [sunHitProxy],
      starTextures,
      cameraState: {
        currentCamPos: new THREE.Vector3(0, 62, 140),
        targetCamPos: new THREE.Vector3(0, 62, 140),
        currentLookAt: new THREE.Vector3(0, -1.0, 0),
        targetLookAt: new THREE.Vector3(0, -1.0, 0),
        orbitYawOffset: 0,
        orbitPitchOffset: 0,
        zoomDistanceMultiplier: 1.0,
        savedOverviewYaw: 0,
        savedOverviewPitch: 0,
        savedOverviewZoom: 1.0,
        parallaxX: 0,
        parallaxY: 0,
        smoothParallaxX: 0,
        smoothParallaxY: 0,
      },
    };
    sceneCtxRef.current = runtimeCtx;

    // Raycaster & Pointer Interaction State
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDirty = false;
    let isPointerDown = false;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let dragMovedDistance = 0;
    let hoverClearTimer: number | null = null;
    let lastTappedKey: string | null = null;

    const domElem = renderer.domElement;

    const updateHoveredEntityState = (next: HoveredEntityInfo | null) => {
      if (hoverClearTimer !== null) {
        window.clearTimeout(hoverClearTimer);
        hoverClearTimer = null;
      }
      const nextKey = next?.key || null;
      if (nextKey === hoveredKeyRef.current) return;

      if (!next) {
        // Subtle 55ms debounce on clear to prevent boundary flicker during fast mouse movement
        hoverClearTimer = window.setTimeout(() => {
          hoveredKeyRef.current = null;
          setHoveredEntity(null);
        }, 55);
        return;
      }

      hoveredKeyRef.current = nextKey;
      setHoveredEntity(next);
    };

    const performRaycast = () => {
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(runtimeCtx.interactiveMeshes, false);
      if (hits.length > 0) {
        const hitData = hits[0].object.userData as HoveredEntityInfo | undefined;
        if (hitData && hitData.key) {
          domElem.style.cursor = 'pointer';
          updateHoveredEntityState(hitData);
          return hitData;
        }
      }
      domElem.style.cursor = isPointerDown ? 'grabbing' : 'grab';
      updateHoveredEntityState(null);
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      dragMovedDistance = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = domElem.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerNdc.set(nx, ny);

      // Subtle mouse parallax for depth richness
      runtimeCtx.cameraState.parallaxX = nx * 2.4;
      runtimeCtx.cameraState.parallaxY = ny * 1.5;

      if (isPointerDown) {
        const dx = e.clientX - pointerDownX;
        const dy = e.clientY - pointerDownY;
        dragMovedDistance += Math.hypot(dx, dy);
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;

        runtimeCtx.cameraState.orbitYawOffset -= dx * 0.0052;
        runtimeCtx.cameraState.orbitPitchOffset = Math.max(
          -0.46,
          Math.min(0.56, runtimeCtx.cameraState.orbitPitchOffset + dy * 0.0042)
        );
        return;
      }

      pointerDirty = true;
    };

    const handlePointerUp = (e: PointerEvent) => {
      const wasClick = isPointerDown && dragMovedDistance < 7;
      isPointerDown = false;
      domElem.style.cursor = 'grab';

      if (!wasClick) return;

      const rect = domElem.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerNdc.set(nx, ny);

      const hitData = performRaycast();
      const isTouch = e.pointerType === 'touch';

      if (hitData) {
        // On touch devices, first tap on an object in system overview identifies it with the floating label
        // AND smoothly focuses it so touch users get immediate identification without needing mouse hover.
        lastTappedKey = hitData.key;
        if (hitData.kind === 'sun') {
          if (explorationLevelRef.current === 'system') {
            runtimeCtx.cameraState.savedOverviewYaw = runtimeCtx.cameraState.orbitYawOffset;
            runtimeCtx.cameraState.savedOverviewPitch = runtimeCtx.cameraState.orbitPitchOffset;
            runtimeCtx.cameraState.savedOverviewZoom =
              runtimeCtx.cameraState.zoomDistanceMultiplier;
          }
          runtimeCtx.cameraState.orbitYawOffset = 0;
          runtimeCtx.cameraState.orbitPitchOffset = 0;
          runtimeCtx.cameraState.zoomDistanceMultiplier = 1.0;
          setExplorationLevel('sun');
          setSelectedStarId(null);
        } else if (hitData.kind === 'planet' && hitData.stationId) {
          if (explorationLevelRef.current === 'system') {
            runtimeCtx.cameraState.savedOverviewYaw = runtimeCtx.cameraState.orbitYawOffset;
            runtimeCtx.cameraState.savedOverviewPitch = runtimeCtx.cameraState.orbitPitchOffset;
            runtimeCtx.cameraState.savedOverviewZoom =
              runtimeCtx.cameraState.zoomDistanceMultiplier;
          }
          runtimeCtx.cameraState.orbitYawOffset = 0;
          runtimeCtx.cameraState.orbitPitchOffset = 0;
          runtimeCtx.cameraState.zoomDistanceMultiplier = 1.0;
          onSelectStationRef.current(hitData.stationId);
          setExplorationLevel('planet');
          setSelectedStarId(null);
        } else if (hitData.kind === 'star' && hitData.stationId && hitData.starId) {
          if (explorationLevelRef.current === 'system') {
            runtimeCtx.cameraState.savedOverviewYaw = runtimeCtx.cameraState.orbitYawOffset;
            runtimeCtx.cameraState.savedOverviewPitch = runtimeCtx.cameraState.orbitPitchOffset;
            runtimeCtx.cameraState.savedOverviewZoom =
              runtimeCtx.cameraState.zoomDistanceMultiplier;
          }
          runtimeCtx.cameraState.orbitYawOffset = 0;
          runtimeCtx.cameraState.orbitPitchOffset = 0;
          runtimeCtx.cameraState.zoomDistanceMultiplier = 1.0;
          onSelectStationRef.current(hitData.stationId);
          setSelectedStarId(hitData.starId);
          setExplorationLevel('star');
        }
        if (isTouch) {
          updateHoveredEntityState(hitData);
        }
      } else if (isTouch && lastTappedKey) {
        lastTappedKey = null;
        updateHoveredEntityState(null);
      }
    };

    const handlePointerLeave = () => {
      if (!isPointerDown) {
        updateHoveredEntityState(null);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      runtimeCtx.cameraState.zoomDistanceMultiplier = Math.max(
        0.58,
        Math.min(1.7, runtimeCtx.cameraState.zoomDistanceMultiplier + e.deltaY * 0.0008)
      );
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    // Pre-allocated math helpers for zero GC inside the 60fps animation loop
    const _projVec = new THREE.Vector3();
    const _starWorldPos = new THREE.Vector3();

    let disposed = false;
    let rafId = 0;
    let resizeRafId = 0;
    let lastObservedW = width;
    let lastObservedH = height;
    let prevTime = performance.now();

    const handleResize = () => {
      if (disposed || !container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 720;
      if (w <= 0 || h <= 0 || (w === lastObservedW && h === lastObservedH)) return;
      lastObservedW = w;
      lastObservedH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const scheduleResize = () => {
      if (disposed) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(handleResize);
    };
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);

    const afterDraw = isSoftwareGl
      ? (cb: () => void) => {
          if (
            typeof WebGL2RenderingContext !== 'undefined' &&
            gl instanceof WebGL2RenderingContext
          ) {
            const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            gl.flush();
            const poll = () => {
              if (disposed || !sync) return;
              const status = gl.clientWaitSync(sync, 0, 0);
              if (status === gl.TIMEOUT_EXPIRED) {
                setTimeout(poll, 4);
              } else {
                gl.deleteSync(sync);
                setTimeout(cb, 16);
              }
            };
            setTimeout(poll, 4);
          } else {
            gl.finish();
            setTimeout(cb, 16);
          }
        }
      : (cb: () => void) => {
          cb();
        };

    const animate = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.22);
      prevTime = now;
      const elapsedSeconds = now * 0.001;

      if (pointerDirty && !isPointerDown) {
        pointerDirty = false;
        performRaycast();
      }

      const activeStationId = selectedStationIdRef.current;
      const activeStarIdVal = selectedStarIdRef.current;
      const level = explorationLevelRef.current;
      const hoveredKey = hoveredKeyRef.current;
      const isFocusMode = level !== 'system';

      // Smooth damped 3D mouse-move parallax for multi-depth starfield & volumetric nebula backdrop
      const camState = runtimeCtx.cameraState;
      camState.smoothParallaxX = THREE.MathUtils.damp(
        camState.smoothParallaxX,
        camState.parallaxX,
        4.2,
        dt
      );
      camState.smoothParallaxY = THREE.MathUtils.damp(
        camState.smoothParallaxY,
        camState.parallaxY,
        4.2,
        dt
      );

      if (nebulaBackdropRef.current) {
        nebulaBackdropRef.current.style.transform = `translate3d(${(
          -camState.smoothParallaxX * 7.5
        ).toFixed(1)}px, ${(camState.smoothParallaxY * 5.5).toFixed(1)}px, 0) scale(1.08)`;
      }

      // Update Radiant Multi-Layered Sun Shaders & 2 Counter-Rotating Magnetic Flare Rings
      sunAssembly.coreMaterial.uniforms.uTime.value = elapsedSeconds;
      sunAssembly.innerCoronaMaterial.uniforms.uTime.value = elapsedSeconds;
      sunAssembly.magneticRingAMaterial.uniforms.uTime.value = elapsedSeconds;
      sunAssembly.magneticRingBMaterial.uniforms.uTime.value = elapsedSeconds;
      sunAssembly.coreMesh.rotation.y = elapsedSeconds * 0.06;
      sunAssembly.magneticRingA.rotation.z = elapsedSeconds * 0.22;
      sunAssembly.magneticRingB.rotation.z = -elapsedSeconds * 0.17;

      // Selective Focus De-Emphasis on the Sun when focusing a Planet or Task Star
      const sunTargetEmphasis = level === 'sun' || level === 'system' ? 1.0 : 0.56;
      const sunCoronaMat = sunAssembly.outerCoronaSprite.material as THREE.SpriteMaterial;
      const sunSecondaryMat = sunAssembly.secondaryBloomSprite.material as THREE.SpriteMaterial;
      sunCoronaMat.opacity = THREE.MathUtils.damp(
        sunCoronaMat.opacity,
        (0.86 + Math.sin(elapsedSeconds * 1.6) * 0.05) * sunTargetEmphasis,
        4.5,
        dt
      );
      sunSecondaryMat.opacity = THREE.MathUtils.damp(
        sunSecondaryMat.opacity,
        0.52 * sunTargetEmphasis,
        4.5,
        dt
      );
      sunAssembly.magneticRingAMaterial.uniforms.uOpacity.value = 0.62 * sunTargetEmphasis;
      sunAssembly.magneticRingBMaterial.uniforms.uOpacity.value = 0.5 * sunTargetEmphasis;

      // 3-Depth Twinkling Starfield Animation & Distinct Multi-Layer 3D Parallax
      deepSpace.farStarsMaterial.uniforms.uTime.value = elapsedSeconds;
      deepSpace.midStarsMaterial.uniforms.uTime.value = elapsedSeconds;
      deepSpace.flareStarsMaterial.uniforms.uTime.value = elapsedSeconds;

      deepSpace.farStars.rotation.y = elapsedSeconds * 0.0028 + camState.smoothParallaxX * 0.008;
      deepSpace.farStars.rotation.x = camState.smoothParallaxY * 0.006;

      deepSpace.midStars.rotation.y = elapsedSeconds * 0.0052 + camState.smoothParallaxX * 0.018;
      deepSpace.midStars.rotation.x = camState.smoothParallaxY * 0.014;

      deepSpace.flareStars.rotation.y = elapsedSeconds * 0.0078 + camState.smoothParallaxX * 0.032;
      deepSpace.flareStars.rotation.x = camState.smoothParallaxY * 0.024;

      deepSpace.nebulaGroup.position.x = -camState.smoothParallaxX * 4.2;
      deepSpace.nebulaGroup.position.y = camState.smoothParallaxY * 3.1;

      deepSpace.astrolabeGroup.rotation.y = elapsedSeconds * 0.0045;

      const targetSpaceOpacity = isFocusMode ? 0.52 : 0.88;
      deepSpace.farStarsMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
        deepSpace.farStarsMaterial.uniforms.uOpacity.value,
        targetSpaceOpacity * 0.92,
        4.0,
        dt
      );
      deepSpace.midStarsMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
        deepSpace.midStarsMaterial.uniforms.uOpacity.value,
        targetSpaceOpacity,
        4.0,
        dt
      );
      deepSpace.flareStarsMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
        deepSpace.flareStarsMaterial.uniforms.uOpacity.value,
        isFocusMode ? 0.45 : 0.96,
        4.0,
        dt
      );

      // Update Milestone Planets along their exact Sun-centered 3D orbital paths
      const orbitAdvanceFactor = level === 'system' ? 0.14 : level === 'sun' ? 0.07 : 0.0;

      runtimeCtx.planetRecords.forEach((rec, stationId) => {
        rec.currentOrbitAngle += dt * rec.orbitSpeed * orbitAdvanceFactor;
        const pt = computeSunCenteredOrbitPoint(
          rec.orbitRadius,
          rec.currentOrbitAngle,
          rec.inclinationX,
          rec.inclinationZ
        );
        rec.worldPos.set(pt.x, pt.y, pt.z);
        rec.assembly.group.position.copy(rec.worldPos);

        // Axial spin + independent atmospheric cloud drift
        rec.assembly.coreMesh.rotation.y += dt * 0.18;
        if (rec.assembly.cloudMesh) {
          rec.assembly.cloudMesh.rotation.y += dt * 0.25;
        }

        const isSelectedPlanet =
          stationId === activeStationId && (level === 'planet' || level === 'star');
        const isHoveredPlanet = hoveredKey === `planet:${stationId}`;

        // Smooth 1.2x planet hover scaling (never abrupt)
        const targetScale = isHoveredPlanet ? 1.2 : 1.0;
        rec.currentScale = THREE.MathUtils.damp(rec.currentScale, targetScale, 7.5, dt);
        rec.assembly.group.scale.setScalar(rec.currentScale);

        // Selective focus emphasis
        const targetEmphasis =
          level === 'system'
            ? isHoveredPlanet
              ? 1.22
              : 1.0
            : isSelectedPlanet
            ? level === 'planet'
              ? 1.12
              : 0.78
            : 0.28;

        rec.currentEmphasis = THREE.MathUtils.damp(rec.currentEmphasis, targetEmphasis, 5.2, dt);

        // Apply selective emphasis to planet surface, atmosphere, and glowing orbital ring
        const coreMat = rec.assembly.coreMesh.material as THREE.MeshPhysicalMaterial;
        const baseEmissive = rec.assembly.spec.emissiveIntensity;
        coreMat.emissiveIntensity =
          baseEmissive * (isHoveredPlanet ? 2.15 : isSelectedPlanet ? 1.55 : rec.currentEmphasis);
        coreMat.opacity = rec.currentEmphasis < 0.95 ? Math.max(0.32, rec.currentEmphasis) : 1.0;
        coreMat.transparent = rec.currentEmphasis < 0.95;

        const atmoMat = rec.assembly.atmosphereMesh.material as THREE.ShaderMaterial;
        if (atmoMat.uniforms?.uIntensity) {
          const targetAtmo =
            rec.assembly.spec.atmosphereIntensity *
            (isHoveredPlanet ? 1.75 : isSelectedPlanet ? 1.32 : rec.currentEmphasis * 0.95);
          atmoMat.uniforms.uIntensity.value = THREE.MathUtils.damp(
            atmoMat.uniforms.uIntensity.value,
            targetAtmo,
            6.5,
            dt
          );
        }

        // Illuminated orbital ring trajectory: brightens smoothly on hover or active status
        const targetOrbitOpacity =
          level === 'system'
            ? isHoveredPlanet
              ? 0.92
              : rec.baseOrbitOpacity
            : isSelectedPlanet
            ? 0.52
            : rec.baseOrbitOpacity * 0.22;
        rec.orbitLineMaterial.opacity = THREE.MathUtils.damp(
          rec.orbitLineMaterial.opacity,
          targetOrbitOpacity,
          6.0,
          dt
        );
        if (rec.orbitGlowMaterial) {
          const targetGlow =
            level === 'system'
              ? isHoveredPlanet
                ? 0.42
                : rec.status === 'in_progress'
                ? 0.24
                : rec.status === 'completed'
                ? 0.16
                : 0.04
              : isSelectedPlanet
              ? 0.22
              : 0.02;
          rec.orbitGlowMaterial.opacity = THREE.MathUtils.damp(
            rec.orbitGlowMaterial.opacity,
            targetGlow,
            6.0,
            dt
          );
        }

        // Equatorial selection & hover halo
        const haloMat = rec.assembly.selectionHaloMesh.material as THREE.MeshBasicMaterial;
        const targetHaloOpacity = isHoveredPlanet
          ? 0.9
          : isSelectedPlanet
          ? 0.72
          : level === 'system'
          ? rec.status === 'in_progress'
            ? 0.52
            : rec.status === 'completed'
            ? 0.28
            : 0.12
          : 0.05;
        haloMat.opacity = THREE.MathUtils.damp(haloMat.opacity, targetHaloOpacity, 6.2, dt);
        const haloScale =
          isSelectedPlanet || isHoveredPlanet
            ? 1.1 + Math.sin(elapsedSeconds * 3.0) * 0.035
            : 1.0;
        rec.assembly.selectionHaloMesh.scale.set(haloScale, haloScale, 1);
      });

      // Animate directional energy pulses gliding along the active orbital track
      runtimeCtx.orbitPulses.forEach((pulse) => {
        pulse.angle += dt * pulse.speed;
        const pt = computeSunCenteredOrbitPoint(
          pulse.orbitRadius,
          pulse.angle,
          pulse.inclinationX,
          pulse.inclinationZ
        );
        pulse.sprite.position.set(pt.x, pt.y, pt.z);
        pulse.material.opacity = THREE.MathUtils.damp(
          pulse.material.opacity,
          level === 'system' ? 0.92 : 0.22,
          5.0,
          dt
        );
      });

      // Animate luminous energy pulses flowing inward along the completed cyan/emerald progress arc
      runtimeCtx.arcPulses.forEach((ap) => {
        ap.t = (ap.t + dt * ap.speed) % 1;
        const p = ap.curve.getPoint(ap.t);
        ap.sprite.position.copy(p);
        ap.material.opacity = THREE.MathUtils.damp(
          ap.material.opacity,
          level === 'system' ? 0.95 : 0.16,
          5.0,
          dt
        );
      });

      // Orbit Task Stars around their parent planet
      const starSpeedFactor = level === 'star' ? 0.0 : level === 'planet' ? 0.22 : 0.55;
      runtimeCtx.starRecords.forEach((rec) => {
        rec.orbitAngle += dt * rec.orbitSpeed * starSpeedFactor;
        const sx = Math.cos(rec.orbitAngle) * rec.orbitRadius;
        const sz = Math.sin(rec.orbitAngle) * rec.orbitRadius;
        const sy = Math.sin(rec.orbitAngle) * rec.orbitRadius * rec.orbitInclination;
        rec.group.position.set(sx, sy, sz);

        const isParentSelected = rec.stationId === activeStationId;
        const isFocusedStar =
          level === 'star' && isParentSelected && rec.starId === activeStarIdVal;
        const isHoveredStar = hoveredKey === `star:${rec.stationId}:${rec.starId}`;

        const targetCoreScale =
          level === 'star'
            ? isFocusedStar
              ? 1.15 + Math.sin(elapsedSeconds * 4.2) * 0.1
              : isHoveredStar
              ? 0.85
              : 0.42
            : isFocusedStar || isHoveredStar
            ? 1.32 + Math.sin(elapsedSeconds * 4.2) * 0.12
            : 0.92;
        rec.coreMesh.scale.setScalar(targetCoreScale);

        let targetStarAlpha = rec.baseHaloOpacity;
        let targetCoreAlpha = 1.0;
        let targetLocalOrbitAlpha = 0.16;

        if (level === 'planet') {
          targetStarAlpha = isParentSelected ? (isHoveredStar ? 1.0 : 0.95) : 0.08;
          targetCoreAlpha = isParentSelected ? 1.0 : 0.15;
          targetLocalOrbitAlpha = isParentSelected ? 0.26 : 0.02;
        } else if (level === 'star') {
          targetStarAlpha = isFocusedStar
            ? 1.0
            : isParentSelected
            ? isHoveredStar
              ? 0.82
              : 0.24
            : 0.04;
          targetCoreAlpha = isFocusedStar ? 1.0 : isParentSelected ? 0.32 : 0.08;
          targetLocalOrbitAlpha = isFocusedStar ? 0.42 : isParentSelected ? 0.1 : 0.02;
        } else if (level === 'sun') {
          targetStarAlpha = 0.15;
          targetCoreAlpha = 0.22;
          targetLocalOrbitAlpha = 0.03;
        } else {
          targetStarAlpha = isHoveredStar ? 1.0 : rec.baseHaloOpacity * 0.78;
          targetCoreAlpha = 0.92;
          targetLocalOrbitAlpha = 0.1;
        }

        rec.coreMaterial.opacity = THREE.MathUtils.damp(
          rec.coreMaterial.opacity,
          targetCoreAlpha,
          5.5,
          dt
        );
        rec.haloMaterial.opacity = THREE.MathUtils.damp(
          rec.haloMaterial.opacity,
          targetStarAlpha,
          5.5,
          dt
        );
        rec.localOrbitMaterial.opacity = THREE.MathUtils.damp(
          rec.localOrbitMaterial.opacity,
          targetLocalOrbitAlpha,
          5.5,
          dt
        );
      });

      // Compute Target Camera Position & LookAt based on Exploration Level
      const vw = container.clientWidth || 1280;
      const vh = container.clientHeight || 740;

      if (level === 'system') {
        const baseRadius = 134 * camState.zoomDistanceMultiplier;
        const baseYaw = elapsedSeconds * 0.012 + camState.orbitYawOffset;
        const basePitch = 0.47 + camState.orbitPitchOffset;

        camState.targetLookAt.set(0, -1.2, 0);
        camState.targetCamPos.set(
          Math.sin(baseYaw) * Math.cos(basePitch) * baseRadius + camState.smoothParallaxX * 2.8,
          Math.sin(basePitch) * baseRadius + camState.smoothParallaxY * 2.0,
          Math.cos(baseYaw) * Math.cos(basePitch) * baseRadius
        );
      } else if (level === 'sun') {
        const framing = computeRightSideFocusFraming({
          focusKind: 'sun',
          objectPos: { x: 0, y: 0, z: 0 },
          objectRadius: 7.4,
          viewportWidth: vw,
          viewportHeight: vh,
          orbitYawOffset: camState.orbitYawOffset + elapsedSeconds * 0.03,
          orbitPitchOffset: camState.orbitPitchOffset,
          zoomMultiplier: camState.zoomDistanceMultiplier,
          parallaxX: camState.parallaxX,
          parallaxY: camState.parallaxY,
          referenceOrigin: { x: 0, y: 0, z: -1 },
        });
        camState.targetCamPos.set(framing.camPos.x, framing.camPos.y, framing.camPos.z);
        camState.targetLookAt.set(framing.lookAt.x, framing.lookAt.y, framing.lookAt.z);
      } else if (level === 'planet') {
        const pRec = runtimeCtx.planetRecords.get(activeStationId);
        const pPos = pRec ? pRec.worldPos : new THREE.Vector3(24, 0, 0);
        const rawRadius = pRec ? pRec.assembly.spec.baseRadius : 2.5;
        // Include planetary ring span & task star orbit envelope in framing radius so ringed planets never clip
        const effectiveFramingRadius = pRec?.assembly.spec.hasRings
          ? rawRadius * 1.48
          : rawRadius * 1.18;

        const framing = computeRightSideFocusFraming({
          focusKind: 'planet',
          objectPos: { x: pPos.x, y: pPos.y, z: pPos.z },
          objectRadius: effectiveFramingRadius,
          viewportWidth: vw,
          viewportHeight: vh,
          orbitYawOffset: camState.orbitYawOffset,
          orbitPitchOffset: camState.orbitPitchOffset,
          zoomMultiplier: camState.zoomDistanceMultiplier,
          parallaxX: camState.parallaxX,
          parallaxY: camState.parallaxY,
          referenceOrigin: { x: 0, y: 0, z: 0 },
        });
        camState.targetCamPos.set(framing.camPos.x, framing.camPos.y, framing.camPos.z);
        camState.targetLookAt.set(framing.lookAt.x, framing.lookAt.y, framing.lookAt.z);
      } else if (level === 'star') {
        const pRec = runtimeCtx.planetRecords.get(activeStationId);
        const pPos = pRec ? pRec.worldPos : new THREE.Vector3(24, 0, 0);
        const focusedRec =
          runtimeCtx.starRecords.find(
            (r) => r.stationId === activeStationId && r.starId === activeStarIdVal
          ) || runtimeCtx.starRecords.find((r) => r.stationId === activeStationId);

        if (focusedRec) {
          _starWorldPos.copy(pPos).add(focusedRec.group.position);
          const framing = computeRightSideFocusFraming({
            focusKind: 'star',
            objectPos: { x: _starWorldPos.x, y: _starWorldPos.y, z: _starWorldPos.z },
            objectRadius: 0.38,
            viewportWidth: vw,
            viewportHeight: vh,
            orbitYawOffset: camState.orbitYawOffset,
            orbitPitchOffset: camState.orbitPitchOffset,
            zoomMultiplier: camState.zoomDistanceMultiplier,
            parallaxX: camState.parallaxX,
            parallaxY: camState.parallaxY,
            referenceOrigin: { x: pPos.x, y: pPos.y, z: pPos.z },
          });
          camState.targetCamPos.set(framing.camPos.x, framing.camPos.y, framing.camPos.z);
          camState.targetLookAt.set(framing.lookAt.x, framing.lookAt.y, framing.lookAt.z);
        }
      }

      // Smooth frame-rate independent inertial damping (zero abrupt camera cuts)
      const dampLambda = isFocusMode ? 8.5 : 5.5;
      camState.currentCamPos.x = THREE.MathUtils.damp(
        camState.currentCamPos.x,
        camState.targetCamPos.x,
        dampLambda,
        dt
      );
      camState.currentCamPos.y = THREE.MathUtils.damp(
        camState.currentCamPos.y,
        camState.targetCamPos.y,
        dampLambda,
        dt
      );
      camState.currentCamPos.z = THREE.MathUtils.damp(
        camState.currentCamPos.z,
        camState.targetCamPos.z,
        dampLambda,
        dt
      );

      camState.currentLookAt.x = THREE.MathUtils.damp(
        camState.currentLookAt.x,
        camState.targetLookAt.x,
        dampLambda * 1.15,
        dt
      );
      camState.currentLookAt.y = THREE.MathUtils.damp(
        camState.currentLookAt.y,
        camState.targetLookAt.y,
        dampLambda * 1.15,
        dt
      );
      camState.currentLookAt.z = THREE.MathUtils.damp(
        camState.currentLookAt.z,
        camState.targetLookAt.z,
        dampLambda * 1.15,
        dt
      );

      camera.position.copy(camState.currentCamPos);
      camera.lookAt(camState.currentLookAt);

      // Update 3D-projected floating spatial hover label position directly via DOM ref (0 React re-renders)
      const labelEl = hoverLabelDomRef.current;
      if (labelEl && hoveredKey) {
        let foundPos = false;
        let yOffset = 2.4;
        if (hoveredKey === 'sun') {
          _projVec.set(0, 8.6, 0);
          foundPos = true;
        } else if (hoveredKey.startsWith('planet:')) {
          const stId = hoveredKey.slice('planet:'.length);
          const pRec = runtimeCtx.planetRecords.get(stId);
          if (pRec) {
            yOffset = pRec.assembly.spec.baseRadius * 1.45 + 0.6;
            _projVec.copy(pRec.worldPos);
            _projVec.y += yOffset;
            foundPos = true;
          }
        } else if (hoveredKey.startsWith('star:')) {
          const parts = hoveredKey.split(':');
          const stId = parts[1];
          const sId = parts[2];
          const pRec = runtimeCtx.planetRecords.get(stId);
          const sRec = runtimeCtx.starRecords.find(
            (r) => r.stationId === stId && r.starId === sId
          );
          if (pRec && sRec) {
            _projVec.copy(pRec.worldPos).add(sRec.group.position);
            _projVec.y += 0.85;
            foundPos = true;
          }
        }

        if (foundPos) {
          _projVec.project(camera);
          if (_projVec.z < 1.0) {
            const rawX = (_projVec.x * 0.5 + 0.5) * vw;
            const rawY = (-_projVec.y * 0.5 + 0.5) * vh;
            const clampedX = Math.max(155, Math.min(vw - 155, rawX));
            const clampedY = Math.max(76, Math.min(vh - 104, rawY - 14));
            labelEl.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(
              clampedY
            )}px, 0) translate(-50%, -100%)`;
            labelEl.style.opacity = '1';
          } else {
            labelEl.style.opacity = '0';
          }
        }
      }

      // Project Floating Holographic Sun Label directly beneath the radiant central Sun in Overview mode
      const sunLabelEl = sunLabelDomRef.current;
      if (sunLabelEl) {
        if (level === 'system') {
          _projVec.set(0, -7.2, 0);
          _projVec.project(camera);
          if (_projVec.z < 1.0) {
            const sx = (_projVec.x * 0.5 + 0.5) * vw;
            const sy = (-_projVec.y * 0.5 + 0.5) * vh;
            const clampedX = Math.max(160, Math.min(vw - 160, sx));
            const clampedY = Math.max(92, Math.min(vh - 108, sy + 10));
            sunLabelEl.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(
              clampedY
            )}px, 0) translate(-50%, 0)`;
            sunLabelEl.style.opacity = '1';
          } else {
            sunLabelEl.style.opacity = '0';
          }
        } else {
          sunLabelEl.style.opacity = '0';
        }
      }

      renderer.render(scene, camera);

      afterDraw(() => {
        if (!disposed) {
          rafId = requestAnimationFrame(animate);
        }
      });
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      if (hoverClearTimer !== null) {
        window.clearTimeout(hoverClearTimer);
      }
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      sceneCtxRef.current = null;
    };
    // Mount WebGLRenderer once; cosmicSystem updates are synchronized below without tearing down the canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Non-Destructive Scene Synchronization When `cosmicSystem` Updates
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const ctx = sceneCtxRef.current;
    if (!ctx) return;

    // Update Sun uniforms & metadata
    const progressNorm = Math.max(
      0,
      Math.min(1, cosmicSystem.sunDestination.overallProgressPercent / 100)
    );
    ctx.sunAssembly.coreMaterial.uniforms.uProgress.value = progressNorm;
    ctx.sunAssembly.coreMaterial.uniforms.uGoalAchieved.value = cosmicSystem.sunDestination
      .isGoalAchieved
      ? 1.0
      : 0.0;
    ctx.sunAssembly.innerCoronaMaterial.uniforms.uIntensity.value = 0.78 + progressNorm * 0.28;

    const sunUserData: HoveredEntityInfo = {
      key: 'sun',
      kind: 'sun',
      code: 'SUN',
      title: cosmicSystem.sunDestination.title,
      subtitle: `${cosmicSystem.sunDestination.degreeAndDiscipline} · ${cosmicSystem.sunDestination.overallProgressPercent}% Ready`,
      statusLabel: cosmicSystem.sunDestination.routeBadge,
    };
    ctx.sunAssembly.coreMesh.userData = sunUserData;
    ctx.sunHitProxy.userData = sunUserData;

    // Preserve existing orbital angles for planets that already exist so task updates never jump
    const previousAngles = new Map<string, number>();
    ctx.planetRecords.forEach((rec, id) => {
      previousAngles.set(id, rec.currentOrbitAngle);
    });

    // Clear previous orbital rings, inward progress arc, energy pulses, and planet groups
    while (ctx.orbitsGroup.children.length > 0) {
      ctx.orbitsGroup.remove(ctx.orbitsGroup.children[0]);
    }
    while (ctx.progressArcGroup.children.length > 0) {
      ctx.progressArcGroup.remove(ctx.progressArcGroup.children[0]);
    }
    while (ctx.planetsRootGroup.children.length > 0) {
      ctx.planetsRootGroup.remove(ctx.planetsRootGroup.children[0]);
    }
    ctx.planetRecords.clear();
    ctx.orbitPulses = [];
    ctx.arcPulses = [];
    ctx.starRecords = [];
    ctx.interactiveMeshes = [ctx.sunHitProxy];

    const ORBIT_SCALE = 1.38;
    const orderedPlanetPositions: THREE.Vector3[] = [];

    cosmicSystem.planets.forEach((planet, index) => {
      const archetype = planet.planetArchetype || 'atmospheric_super_earth';
      const orbitRadius = (planet.orbitalRadius || 16 + index * 5.2) * ORBIT_SCALE;
      const baseOrbitAngle =
        typeof planet.orbitalAngle === 'number' ? planet.orbitalAngle : index * 2.18;
      const currentOrbitAngle = previousAngles.get(planet.id) ?? baseOrbitAngle;
      const { inclinationX, inclinationZ } = getPlanetOrbitalInclination(index);

      // Build sleek illuminated Sun-centered 3D orbital vector track
      const orbitPts: THREE.Vector3[] = [];
      const segments = 160;
      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const pt = computeSunCenteredOrbitPoint(orbitRadius, theta, inclinationX, inclinationZ);
        orbitPts.push(new THREE.Vector3(pt.x, pt.y, pt.z));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitColor =
        planet.status === 'completed'
          ? '#34d399'
          : planet.status === 'in_progress'
          ? '#38bdf8'
          : '#6366f1';
      const baseOrbitOpacity =
        planet.status === 'in_progress' ? 0.62 : planet.status === 'completed' ? 0.46 : 0.22;

      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(orbitColor),
        transparent: true,
        opacity: baseOrbitOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      ctx.orbitsGroup.add(orbitLine);

      // Soft glowing orbital ribbon tube for illuminated depth (strongest on completed & active orbits)
      const orbitCurve = new THREE.CatmullRomCurve3(orbitPts, true);
      const glowTubeGeo = new THREE.TubeGeometry(
        orbitCurve,
        112,
        planet.status === 'in_progress' ? 0.22 : planet.status === 'completed' ? 0.16 : 0.1,
        6,
        true
      );
      const orbitGlowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(orbitColor),
        transparent: true,
        opacity:
          planet.status === 'in_progress' ? 0.24 : planet.status === 'completed' ? 0.16 : 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const orbitGlowLine = new THREE.Mesh(glowTubeGeo, orbitGlowMaterial);
      ctx.orbitsGroup.add(orbitGlowLine);

      // Add subtle directional energy pulses moving along the active & completed orbits
      if (planet.status === 'in_progress' || planet.status === 'completed') {
        const pulseCount = planet.status === 'in_progress' ? 3 : 2;
        const pulseTex =
          planet.status === 'completed' ? ctx.starTextures.completed : ctx.starTextures.active;
        for (let pIdx = 0; pIdx < pulseCount; pIdx++) {
          const pMat = new THREE.SpriteMaterial({
            map: pulseTex,
            color: new THREE.Color(orbitColor),
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const pSprite = new THREE.Sprite(pMat);
          const pScale = planet.status === 'in_progress' ? 2.6 : 1.9;
          pSprite.scale.set(pScale, pScale, 1);
          ctx.orbitsGroup.add(pSprite);
          ctx.orbitPulses.push({
            sprite: pSprite,
            material: pMat,
            orbitRadius,
            inclinationX,
            inclinationZ,
            angle: currentOrbitAngle + (pIdx * Math.PI * 2) / pulseCount,
            speed: planet.status === 'in_progress' ? 0.38 : 0.22,
            stationId: planet.id,
          });
        }
      }

      // Compute planet's exact 3D position on its Sun-centered orbital path
      const initialPt = computeSunCenteredOrbitPoint(
        orbitRadius,
        currentOrbitAngle,
        inclinationX,
        inclinationZ
      );
      const worldPos = new THREE.Vector3(initialPt.x, initialPt.y, initialPt.z);
      orderedPlanetPositions.push(worldPos.clone());

      // Build High-Detail 3D-Shaded Planet Assembly
      const assembly = createMilestonePlanetAssembly(
        archetype,
        planet.status === 'locked' ? 'upcoming' : planet.status
      );
      assembly.group.position.copy(worldPos);

      const stars = planet.taskStars || [];
      const doneStarsCount = stars.filter((s) => s.status === 'completed').length;
      const milestoneCode = formatMilestoneNumber(planet.order);
      const formattedMilestoneTitle = formatCompactMilestoneLabel(
        planet.order,
        planet.title,
        languageRef.current
      );
      const statusDisplay =
        planet.status === 'completed'
          ? 'Completed'
          : planet.status === 'in_progress'
          ? 'In Progress'
          : 'Upcoming';

      const planetUserData: HoveredEntityInfo = {
        key: `planet:${planet.id}`,
        kind: 'planet',
        stationId: planet.id,
        code: milestoneCode,
        title: formattedMilestoneTitle,
        subtitle: `${doneStarsCount}/${stars.length}`,
        statusLabel: statusDisplay,
        statusKey: planet.status,
        completedTasks: doneStarsCount,
        totalTasks: stars.length,
        progressPercent: planet.planetProgressPercent,
      };
      assembly.coreMesh.userData = planetUserData;

      // Invisible enlarged hit-proxy sphere so hovering/selecting planets at any zoom is reliable and flicker-free
      const hitProxyGeo = new THREE.SphereGeometry(assembly.spec.baseRadius * 1.42, 20, 20);
      const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitProxyMesh = new THREE.Mesh(hitProxyGeo, hitProxyMat);
      hitProxyMesh.userData = planetUserData;
      assembly.group.add(hitProxyMesh);

      ctx.interactiveMeshes.push(hitProxyMesh);
      ctx.planetsRootGroup.add(assembly.group);

      ctx.planetRecords.set(planet.id, {
        stationId: planet.id,
        order: planet.order,
        title: planet.title,
        status: planet.status,
        orbitRadius,
        baseOrbitAngle,
        currentOrbitAngle,
        orbitSpeed: planet.orbitalSpeed || 0.024,
        inclinationX,
        inclinationZ,
        worldPos,
        assembly,
        hitProxyMesh,
        orbitLine,
        orbitLineMaterial: orbitMat,
        orbitGlowLine,
        orbitGlowMaterial,
        baseOrbitOpacity,
        currentEmphasis: 1.0,
        currentScale: 1.0,
      });

      // Build Orbiting Actionable Task Stars around this Milestone Planet
      const basePlanetRadius = assembly.spec.baseRadius;

      stars.forEach((star, sIdx) => {
        const starGroup = new THREE.Group();
        const starOrbitRadius =
          basePlanetRadius * (assembly.spec.hasRings ? 2.48 : 1.72) + sIdx * 0.78;
        const starAngle =
          (sIdx / Math.max(1, stars.length)) * Math.PI * 2 + index * 0.72 + 0.35;
        const starInclination =
          typeof star.orbitInclination === 'number'
            ? star.orbitInclination
            : ((sIdx % 3) - 1) * 0.28;

        const isDone = star.status === 'completed';
        const isCurrent = star.status === 'in_progress';
        const isAvail = star.status === 'available';

        const starColorHex = isDone
          ? '#34d399'
          : isCurrent
          ? '#38bdf8'
          : isAvail
          ? '#fbbf24'
          : '#94a3b8';

        const starCoreGeo = new THREE.SphereGeometry(isCurrent ? 0.24 : 0.2, 18, 18);
        const starCoreMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#ffffff'),
          transparent: true,
          opacity: 1.0,
        });
        const starCoreMesh = new THREE.Mesh(starCoreGeo, starCoreMat);

        const starUserData: HoveredEntityInfo = {
          key: `star:${planet.id}:${star.id}`,
          kind: 'star',
          stationId: planet.id,
          starId: star.id,
          code: `${milestoneCode}.${sIdx + 1}`,
          title: star.title,
          parentLabel: formattedMilestoneTitle,
          subtitle: `${star.estimatedHours}h · ${star.status.replace('_', ' ')}`,
          statusLabel: star.status.replace('_', ' '),
        };
        starCoreMesh.userData = starUserData;
        starGroup.add(starCoreMesh);

        // Generous invisible hit-proxy sphere so small task stars are easy to hover and tap
        const starHitGeo = new THREE.SphereGeometry(0.84, 14, 14);
        const starHitMat = new THREE.MeshBasicMaterial({ visible: false });
        const starHitProxy = new THREE.Mesh(starHitGeo, starHitMat);
        starHitProxy.userData = starUserData;
        starGroup.add(starHitProxy);
        ctx.interactiveMeshes.push(starHitProxy);

        const glowTex = isDone
          ? ctx.starTextures.completed
          : isCurrent
          ? ctx.starTextures.active
          : isAvail
          ? ctx.starTextures.available
          : ctx.starTextures.locked;

        const baseHaloOpacity = isDone || isCurrent ? 0.95 : 0.74;
        const haloMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: new THREE.Color(starColorHex),
          transparent: true,
          opacity: baseHaloOpacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const haloSprite = new THREE.Sprite(haloMat);
        const haloScale = isCurrent ? 2.05 : isDone ? 1.78 : 1.48;
        haloSprite.scale.set(haloScale, haloScale, 1);
        starGroup.add(haloSprite);

        const sx = Math.cos(starAngle) * starOrbitRadius;
        const sz = Math.sin(starAngle) * starOrbitRadius;
        const sy = Math.sin(starAngle) * starOrbitRadius * starInclination;
        starGroup.position.set(sx, sy, sz);

        // Subtle local star orbital path around its parent planet
        const localOrbitPts: THREE.Vector3[] = [];
        for (let k = 0; k < 56; k++) {
          const a = (k / 56) * Math.PI * 2;
          localOrbitPts.push(
            new THREE.Vector3(
              Math.cos(a) * starOrbitRadius,
              Math.sin(a) * starOrbitRadius * starInclination,
              Math.sin(a) * starOrbitRadius
            )
          );
        }
        const localOrbitGeo = new THREE.BufferGeometry().setFromPoints(localOrbitPts);
        const localOrbitMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(starColorHex),
          transparent: true,
          opacity: 0.16,
        });
        const localOrbitLine = new THREE.LineLoop(localOrbitGeo, localOrbitMat);
        assembly.group.add(localOrbitLine);
        assembly.group.add(starGroup);

        ctx.starRecords.push({
          starId: star.id,
          stationId: planet.id,
          parentOrder: planet.order,
          parentTitle: planet.title,
          title: star.title,
          status: star.status,
          estimatedHours: star.estimatedHours,
          group: starGroup,
          coreMesh: starCoreMesh,
          coreMaterial: starCoreMat,
          hitProxyMesh: starHitProxy,
          haloSprite,
          haloMaterial: haloMat,
          localOrbitLine,
          localOrbitMaterial: localOrbitMat,
          orbitRadius: starOrbitRadius,
          orbitAngle: starAngle,
          orbitInclination: starInclination,
          orbitSpeed: star.orbitSpeed || 0.22 + (sIdx % 3) * 0.08,
          baseHaloOpacity,
        });
      });
    });

    // Build Bright Glowing Cyan/Emerald Inward Progress Arc tracing from outer completed planets inward
    const chainIndices = computeInwardProgressChainIndices(
      cosmicSystem.planets.map((p) => p.status)
    );
    if (chainIndices.length >= 2) {
      const arcPoints: THREE.Vector3[] = [];
      for (let i = 0; i < chainIndices.length; i++) {
        const pt = orderedPlanetPositions[chainIndices[i]];
        if (pt) arcPoints.push(pt.clone());
      }
      // If all milestones are completed, sweep the glowing arc all the way into the Sun
      if (cosmicSystem.sunDestination.isGoalAchieved) {
        arcPoints.push(new THREE.Vector3(0, 0, 0));
      }

      if (arcPoints.length >= 2) {
        // Insert an elevated mid-arc control point between consecutive planets for a graceful orbital transfer curve
        const curvedControlPts: THREE.Vector3[] = [arcPoints[0]];
        for (let i = 0; i < arcPoints.length - 1; i++) {
          const a = arcPoints[i];
          const b = arcPoints[i + 1];
          const mid = a.clone().add(b).multiplyScalar(0.5);
          const avgR = (a.length() + b.length()) * 0.52;
          if (mid.length() > 0.1) {
            mid.normalize().multiplyScalar(avgR);
          }
          mid.y += 1.6;
          curvedControlPts.push(mid, b);
        }

        const progressCurve = new THREE.CatmullRomCurve3(curvedControlPts);
        const coreTubeGeo = new THREE.TubeGeometry(progressCurve, 84, 0.14, 8, false);
        const coreTubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#22d3ee'),
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        ctx.progressArcGroup.add(new THREE.Mesh(coreTubeGeo, coreTubeMat));

        const haloTubeGeo = new THREE.TubeGeometry(progressCurve, 84, 0.42, 8, false);
        const haloTubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#34d399'),
          transparent: true,
          opacity: 0.24,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        ctx.progressArcGroup.add(new THREE.Mesh(haloTubeGeo, haloTubeMat));

        // Subtle directional energy pulses flowing inward along the completed progress trajectory
        for (let k = 0; k < 3; k++) {
          const apMat = new THREE.SpriteMaterial({
            map: ctx.starTextures.completed,
            color: new THREE.Color('#67e8f9'),
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const apSprite = new THREE.Sprite(apMat);
          apSprite.scale.set(2.8, 2.8, 1);
          ctx.progressArcGroup.add(apSprite);
          ctx.arcPulses.push({
            sprite: apSprite,
            material: apMat,
            curve: progressCurve,
            t: k / 3,
            speed: 0.18,
          });
        }
      }
    }
  }, [cosmicSystem]);

  // Trigger immediate renderer resize when entering or exiting Immersive Observatory Mode
  useEffect(() => {
    const ctx = sceneCtxRef.current;
    const container = mountRef.current;
    if (!ctx || !container) return;
    const syncSize = () => {
      const w = container.clientWidth || window.innerWidth || 1280;
      const h = container.clientHeight || window.innerHeight || 740;
      if (w > 0 && h > 0) {
        ctx.camera.aspect = w / h;
        ctx.camera.updateProjectionMatrix();
        ctx.renderer.setSize(w, h, false);
      }
    };
    syncSize();
    const raf = requestAnimationFrame(syncSize);
    return () => cancelAnimationFrame(raf);
  }, [isObservatoryMode]);

  const activePlanetIndex = useMemo(() => {
    if (!activePlanet) return 0;
    return Math.max(
      0,
      cosmicSystem.planets.findIndex((p) => p.id === activePlanet.id)
    );
  }, [cosmicSystem.planets, activePlanet]);

  const activeArchetypeSpec = useMemo(() => {
    const arch = activePlanet?.planetArchetype || 'atmospheric_super_earth';
    return PLANET_ARCHETYPE_SPECS[arch] || PLANET_ARCHETYPE_SPECS.atmospheric_super_earth;
  }, [activePlanet]);

  const activePlanetCompletedStarsCount = useMemo(() => {
    return activeTaskStars.filter((s) => s.status === 'completed').length;
  }, [activeTaskStars]);

  const verificationBadgeMeta = (level?: VerificationMasteryLevel) => {
    switch (level) {
      case 'milestone_verified':
        return {
          label: 'Milestone Verified',
          cls: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
        };
      case 'knowledge_assessed':
        return {
          label: 'Knowledge Assessed',
          cls: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
        };
      case 'task_completed':
        return {
          label: 'Task Completed',
          cls: 'border-blue-400/40 bg-blue-500/15 text-blue-200',
        };
      default:
        return {
          label: 'Pending Verification',
          cls: 'border-white/15 bg-white/[0.06] text-slate-300',
        };
    }
  };

  const statusBadgeMeta = (status?: StationStatus | CosmicTaskStar['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          cls: 'border-emerald-400/45 bg-emerald-500/20 text-emerald-200',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          cls: 'border-cyan-400/45 bg-cyan-500/20 text-cyan-100',
        };
      case 'available':
        return {
          label: 'Available',
          cls: 'border-amber-400/45 bg-amber-500/20 text-amber-100',
        };
      default:
        return {
          label: 'Upcoming',
          cls: 'border-white/20 bg-white/10 text-slate-300',
        };
    }
  };

  const isFocusMode = explorationLevel !== 'system';

  return (
    <div
      ref={rootRef}
      className={
        isObservatoryMode
          ? 'fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-[#030614] select-none'
          : 'relative h-[700px] xl:h-[750px] w-full overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[#030614] shadow-[0_30px_90px_rgba(0,0,0,0.82)] select-none'
      }
      data-testid="cosmic-academic-map-3d"
      data-exploration-level={explorationLevel}
      data-observatory-mode={isObservatoryMode ? 'true' : 'false'}
    >
      {/* =====================================================================
          VOLUMETRIC DEEP-SPACE NEBULA & MILKY WAY DUST BACKDROP (PARALLAX LAYER)
          Rich indigo, deep violet, and teal cosmic gas clouds + diagonal Milky Way band
         ===================================================================== */}
      <div
        ref={nebulaBackdropRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-6%] z-0 transition-transform duration-75 will-change-transform"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 48%, rgba(16, 26, 66, 0.72) 0%, rgba(6, 10, 28, 0.94) 55%, #02040c 100%)',
        }}
      >
        {/* Soft Indigo Cosmic Gas Cloud (Top-Left) */}
        <div className="absolute -top-[14%] -left-[8%] h-[62%] w-[56%] rounded-full bg-indigo-600/30 opacity-35 blur-3xl" />
        {/* Deep Violet Nebula Cloud (Top-Right) */}
        <div className="absolute top-[4%] right-[-10%] h-[58%] w-[52%] rounded-full bg-violet-700/35 opacity-30 blur-3xl" />
        {/* Cosmic Teal Gas Cloud (Bottom-Right) */}
        <div className="absolute -bottom-[16%] right-[8%] h-[56%] w-[52%] rounded-full bg-teal-600/30 opacity-25 blur-3xl" />
        {/* Subtle Cyan-Indigo Nebula Pocket (Bottom-Left) */}
        <div className="absolute bottom-[2%] -left-[6%] h-[48%] w-[44%] rounded-full bg-sky-700/25 opacity-25 blur-3xl" />
        {/* Faint Diagonal Milky Way Star-Dust Band */}
        <div
          className="absolute top-1/2 left-1/2 h-[32%] w-[150%] -translate-x-1/2 -translate-y-1/2 -rotate-[22deg] opacity-30 blur-2xl"
          style={{
            background:
              'linear-gradient(90deg, rgba(15,23,42,0) 0%, rgba(99,102,241,0.22) 22%, rgba(165,180,252,0.26) 46%, rgba(56,189,248,0.2) 68%, rgba(139,92,246,0.18) 84%, rgba(15,23,42,0) 100%)',
          }}
        />
      </div>

      {/* Three.js WebGL Solar System Canvas Container (Transparent Composite Over Volumetric Nebula) */}
      <div
        ref={mountRef}
        className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Cosmic Academic Solar System Observatory"
      />

      {/* =====================================================================
          FLOATING HOLOGRAPHIC LABEL DIRECTLY BENEATH THE RADIANT CENTRAL SUN
          ("☀ THE UNIVERSITY OF TOKYO • XX% READY")
         ===================================================================== */}
      <div
        ref={sunLabelDomRef}
        data-testid="cosmic-sun-holographic-label"
        className="pointer-events-none absolute top-0 left-0 z-20 transition-opacity duration-200"
        style={{
          transform: 'translate3d(-9999px, -9999px, 0)',
          opacity: 0,
        }}
      >
        <button
          type="button"
          onClick={handleEnterSunDestination}
          className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-300/35 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(255,248,220,0.35)] transition hover:border-amber-200/60 hover:bg-amber-400/20 ${
            !isSoftwareGlMode ? 'backdrop-blur-md' : ''
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(24, 18, 12, 0.78) 0%, rgba(10, 14, 30, 0.84) 100%)',
          }}
        >
          <SunIcon className="h-3.5 w-3.5 shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]" />
          <span className="whitespace-nowrap text-amber-50">
            {cosmicSystem.sunDestination.title}
          </span>
          <span className="text-amber-300/70" aria-hidden="true">
            •
          </span>
          <span className="whitespace-nowrap font-mono tabular-nums text-amber-300">
            {cosmicSystem.sunDestination.overallProgressPercent}% READY
          </span>
        </button>
      </div>

      {/* =====================================================================
          SPATIAL 3D-PROJECTED FLOATING TELEMETRY CARD (HOVER / TOUCH)
          Displays Milestone Name, Task Completion (e.g. 4/4), and Status right next to the planet.
         ===================================================================== */}
      <div
        ref={hoverLabelDomRef}
        data-testid="cosmic-spatial-hover-label"
        className={`pointer-events-none absolute top-0 left-0 z-30 transition-opacity duration-150 ${
          hoveredEntity ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: 'translate3d(-9999px, -9999px, 0)',
        }}
      >
        {hoveredEntity && (
          <div
            className={`min-w-[215px] max-w-[290px] rounded-2xl border border-cyan-300/30 px-3.5 py-2.5 text-xs text-white shadow-[0_18px_40px_rgba(2,6,23,0.86),inset_0_1px_0_rgba(255,255,255,0.28)] ${
              !isSoftwareGlMode ? 'backdrop-blur-xl' : ''
            }`}
            style={{
              background:
                'linear-gradient(150deg, rgba(12, 24, 54, 0.88) 0%, rgba(4, 9, 24, 0.84) 100%)',
            }}
          >
            {hoveredEntity.kind === 'star' && hoveredEntity.parentLabel && (
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90 truncate">
                {hoveredEntity.parentLabel}
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5">
              <div className="font-semibold tracking-tight text-white truncate">
                {hoveredEntity.title}
              </div>
              {hoveredEntity.statusLabel && (
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                    hoveredEntity.statusKey === 'completed'
                      ? 'text-emerald-300'
                      : hoveredEntity.statusKey === 'in_progress'
                      ? 'text-cyan-300'
                      : hoveredEntity.kind === 'sun'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {hoveredEntity.statusLabel}
                </span>
              )}
            </div>

            {hoveredEntity.kind === 'planet' &&
            typeof hoveredEntity.completedTasks === 'number' &&
            typeof hoveredEntity.totalTasks === 'number' ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Task Completion</span>
                  <span className="font-mono font-semibold tabular-nums text-cyan-200">
                    {hoveredEntity.completedTasks}/{hoveredEntity.totalTasks}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      hoveredEntity.statusKey === 'completed'
                        ? 'bg-emerald-400'
                        : hoveredEntity.statusKey === 'in_progress'
                        ? 'bg-cyan-400'
                        : 'bg-indigo-400/70'
                    }`}
                    style={{ width: `${hoveredEntity.progressPercent ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              hoveredEntity.subtitle && (
                <div className="mt-1 text-[11px] text-slate-300 whitespace-nowrap">
                  {hoveredEntity.subtitle}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          TOP NAVIGATION & SPACECRAFT GLASSMORPHISM HUD BAR
         ===================================================================== */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex flex-nowrap items-center justify-between gap-2">
        {/* Top-Left Breadcrumb & Active Academic Journey Identity */}
        <div
          className={`pointer-events-auto flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.18] px-3 py-1.5 shadow-[0_14px_40px_rgba(2,6,23,0.68),inset_0_1px_0_rgba(255,255,255,0.28)] ${
            !isSoftwareGlMode ? 'backdrop-blur-xl' : ''
          }`}
          style={{
            background:
              'linear-gradient(180deg, rgba(16, 28, 58, 0.78) 0%, rgba(6, 12, 28, 0.72) 100%)',
          }}
        >
          <button
            type="button"
            onClick={handleEnterSystemOverview}
            data-testid="cosmic-level-1-btn"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              explorationLevel === 'system'
                ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Orbit className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
            <span className="whitespace-nowrap">Solar System Overview</span>
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />

          <button
            type="button"
            onClick={handleEnterSunDestination}
            data-testid="cosmic-sun-goal-btn"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              explorationLevel === 'sun'
                ? 'bg-amber-400/25 text-amber-100 border border-amber-300/45'
                : 'text-amber-200/90 hover:bg-amber-400/15'
            }`}
          >
            <SunIcon className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span className="max-w-[165px] truncate">
              Sun: {cosmicSystem.sunDestination.title}
            </span>
          </button>

          {activePlanet && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <button
                type="button"
                onClick={() => handleEnterPlanetView(activePlanet.id)}
                data-testid="cosmic-level-2-btn"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                  explorationLevel === 'planet'
                    ? 'bg-blue-400/25 text-blue-100 border border-blue-300/40'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                <span className="max-w-[175px] truncate">
                  {formatMilestoneHoverTitle(activePlanet.order, activePlanet.title)}
                </span>
              </button>
            </>
          )}

          {explorationLevel === 'star' && activeStar && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300/40 bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-100"
                data-testid="cosmic-level-3-badge"
              >
                <StarIcon className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="max-w-[150px] truncate">{activeStar.title}</span>
              </span>
            </>
          )}
        </div>

        {/* Top-Right Route Mode Bar, Camera Controls & Observatory Toggle */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          {/* Sleek Route Switcher HUD (Direct Admission | Transfer Bridge | Scholarship Track) */}
          {onSwitchRouteMode && (
            <div
              className={`items-center gap-1 rounded-2xl border border-white/[0.18] p-1 text-xs shadow-[0_14px_38px_rgba(2,6,23,0.65),inset_0_1px_0_rgba(255,255,255,0.26)] ${
                isObservatoryMode ? 'hidden md:flex' : 'hidden xl:flex'
              } ${!isSoftwareGlMode ? 'backdrop-blur-xl' : ''}`}
              style={{
                background:
                  'linear-gradient(180deg, rgba(16, 28, 58, 0.78) 0%, rgba(6, 12, 28, 0.72) 100%)',
              }}
            >
              {ROUTE_MODE_OPTIONS.map((rm) => {
                const active = activeRouteMode === rm.id;
                return (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => onSwitchRouteMode(rm.id)}
                    data-testid={`observatory-route-${rm.id}`}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition ${
                      active
                        ? 'bg-cyan-400/22 text-white border border-cyan-300/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {rm.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Camera Zoom & Reset Controls */}
          <div
            className={`flex items-center gap-1 rounded-2xl border border-white/[0.18] p-1 text-white shadow-[0_14px_38px_rgba(2,6,23,0.65),inset_0_1px_0_rgba(255,255,255,0.26)] ${
              !isSoftwareGlMode ? 'backdrop-blur-xl' : ''
            }`}
            style={{
              background:
                'linear-gradient(180deg, rgba(16, 28, 58, 0.78) 0%, rgba(6, 12, 28, 0.72) 100%)',
            }}
          >
            {isFocusMode && (
              <button
                type="button"
                onClick={handleEnterSystemOverview}
                data-testid="cosmic-exit-focus-top-btn"
                className="inline-flex items-center gap-1 rounded-xl border border-cyan-300/35 bg-cyan-400/20 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/30"
                title="Exit Object Focus & Return to Solar System Overview"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleZoomStep(-0.16)}
              className="rounded-xl p-1.5 text-slate-200 transition hover:bg-white/15 hover:text-white"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomStep(0.16)}
              className="rounded-xl p-1.5 text-slate-200 transition hover:bg-white/15 hover:text-white"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              data-testid="cosmic-reset-camera-btn"
              className="rounded-xl p-1.5 text-slate-200 transition hover:bg-white/15 hover:text-white"
              title="Reset Camera Orientation"
              aria-label="Reset Camera Orientation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dedicated Immersive Cosmic Observatory Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsObservatoryMode((v) => !v)}
            data-testid="cosmic-observatory-toggle"
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-bold whitespace-nowrap shadow-[0_14px_38px_rgba(2,6,23,0.65),inset_0_1px_0_rgba(255,255,255,0.28)] transition ${
              !isSoftwareGlMode ? 'backdrop-blur-xl' : ''
            } ${
              isObservatoryMode
                ? 'border-amber-300/50 bg-amber-500/20 text-amber-100 hover:bg-amber-400/30'
                : 'border-cyan-300/40 bg-slate-900/75 text-cyan-100 hover:bg-cyan-500/25'
            }`}
          >
            {isObservatoryMode ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-amber-300" />
                <span>Exit Observatory</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-cyan-300" />
                <span>Observatory Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          LEFT-SIDE CONTEXTUAL INFORMATION PANEL (FOCUS MODE ONLY: PLANET / STAR / SUN)
          - Desktop & Tablet: Positioned on the LEFT (left-4 top-16 bottom-24)
            while the selected 3D object is framed on the RIGHT.
          - Mobile: Compact bottom contextual drawer with expand/collapse toggle.
         ===================================================================== */}

      {/* Mobile Scene / Info Switcher Pill when in Focus Mode */}
      {isFocusMode && (
        <div className="pointer-events-auto absolute top-16 left-4 z-30 flex md:hidden">
          <button
            type="button"
            onClick={() => setMobilePanelCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          >
            {mobilePanelCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-cyan-300" />
                <span>Show Details Panel</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-cyan-300" />
                <span>View Full 3D Object</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 1. SELECTED PLANET FOCUS PANEL (LEFT SIDE) */}
      {explorationLevel === 'planet' && activePlanet && !mobilePanelCollapsed && (
        <aside
          data-testid="cosmic-glass-panel-planet"
          data-cosmic-focus-panel="true"
          aria-label="Selected Milestone Planet Information"
          className="pointer-events-auto absolute left-3 right-3 bottom-20 max-h-[54%] md:left-4 md:right-auto md:top-[64px] md:bottom-24 md:max-h-none z-20 flex w-auto md:w-[390px] flex-col justify-between overflow-y-auto rounded-[24px] border border-white/20 p-5 text-white shadow-[0_24px_64px_rgba(2,8,23,0.68),inset_0_1px_1px_rgba(255,255,255,0.25)]"
          style={{
            background:
              'linear-gradient(155deg, rgba(10, 24, 52, 0.76) 0%, rgba(4, 11, 26, 0.66) 100%)',
          }}
        >
          <div className="space-y-4">
            {/* Top Bar: Exit Focus & Current Status */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleEnterSystemOverview}
                data-testid="cosmic-close-focus-btn"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Solar System Overview</span>
              </button>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  statusBadgeMeta(activePlanet.status).cls
                }`}
              >
                {statusBadgeMeta(activePlanet.status).label}
              </span>
            </div>

            {/* Primary Identity: Milestone Number & Actual Title */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                <span>Milestone {formatMilestoneNumber(activePlanet.order)}</span>
                <span>•</span>
                <span>{activePlanet.phase}</span>
              </div>
              <h2
                className="mt-1 text-xl font-bold tracking-tight text-white"
                data-testid="cosmic-focused-planet-title"
              >
                {formatMilestoneHoverTitle(activePlanet.order, activePlanet.title)}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200/90">
                {activePlanet.description}
              </p>
            </div>

            {/* Progress & Key Academic Metrics */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Milestone Completion</span>
                <span className="font-bold text-cyan-300">
                  {activePlanet.planetProgressPercent}% ({activePlanetCompletedStarsCount}/
                  {activeTaskStars.length} Tasks)
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/75">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${activePlanet.planetProgressPercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">Estimated Timeframe</span>
                    <span className="font-semibold text-white">{activePlanet.timeframe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">Estimated Cost</span>
                    <span className="font-semibold text-white">
                      ${activePlanet.estimatedCostUsd.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Orbiting Actionable Task Stars List (Click to Focus Task Star on RIGHT) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-200">
                  Orbiting Task Stars ({activePlanetCompletedStarsCount}/{activeTaskStars.length})
                </span>
                <span className="text-[11px] text-slate-300">Select a star to focus</span>
              </div>
              <div className="space-y-2">
                {activeTaskStars.map((star, sIdx) => {
                  const isDone = star.status === 'completed';
                  const isCurrent = star.status === 'in_progress';
                  return (
                    <div
                      key={star.id}
                      className={`group flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 text-xs transition ${
                        isDone
                          ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100'
                          : isCurrent
                          ? 'border-cyan-300/45 bg-cyan-500/15 text-white'
                          : 'border-white/15 bg-white/[0.05] text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        data-testid={`cosmic-planet-star-item-${sIdx + 1}`}
                        onClick={() => handleEnterStarView(activePlanet.id, star.id)}
                        className="flex flex-1 items-start gap-2.5 text-left"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-400 text-slate-950'
                              : isCurrent
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-white/15 text-amber-200'
                          }`}
                        >
                          ★
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-snug text-white group-hover:text-cyan-200">
                            {star.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                            <span>{star.estimatedHours}h effort</span>
                            <span>•</span>
                            <span>{star.deadlineWindow}</span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title={isDone ? 'Reopen task star' : 'Mark task star completed'}
                          onClick={() =>
                            onUpdateTaskStar(activePlanet.id, star.id, {
                              status: isDone ? 'in_progress' : 'completed',
                            })
                          }
                          className={`rounded-xl border px-2 py-1 text-[10px] font-bold transition ${
                            isDone
                              ? 'border-emerald-300/50 bg-emerald-400/25 text-emerald-100'
                              : 'border-white/20 bg-white/10 text-white hover:bg-emerald-400/25'
                          }`}
                        >
                          {isDone ? 'Done' : 'Complete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEnterStarView(activePlanet.id, star.id)}
                          className="rounded-xl border border-white/15 bg-white/10 p-1.5 text-slate-200 hover:bg-white/20"
                          title="Focus Task Star"
                          aria-label={`Focus Task Star ${star.title}`}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progressive Disclosure: Requirements, Completion Criteria & Strategic Context */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setShowAcademicDetails((v) => !v)}
                data-testid="cosmic-planet-details-toggle"
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-cyan-200 transition hover:bg-white/[0.05]"
              >
                <span>Requirements &amp; Completion Criteria</span>
                {showAcademicDetails ? (
                  <ChevronUp className="h-4 w-4 text-cyan-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-cyan-300" />
                )}
              </button>

              {showAcademicDetails && (
                <div className="space-y-3 border-t border-white/10 px-3.5 py-3 text-xs">
                  {activePlanet.requirements.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-200">Key Requirements</div>
                      <ul className="mt-1.5 space-y-1 text-slate-300">
                        {activePlanet.requirements.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <div className="font-bold text-emerald-200">Completion Criteria</div>
                    <p className="mt-1 leading-relaxed text-slate-200/90">
                      {activePlanet.completionCriteria}
                    </p>
                  </div>

                  {activePlanet.whyItMatters && (
                    <div>
                      <div className="font-bold text-cyan-200">Why This Milestone Matters</div>
                      <p className="mt-1 leading-relaxed text-slate-200/90">
                        {activePlanet.whyItMatters}
                      </p>
                    </div>
                  )}

                  <div className="pt-1">
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Milestone Status Override
                    </div>
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
                          onClick={() => onUpdateStationStatus(activePlanet.id, st.id)}
                          className={`rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition ${
                            activePlanet.status === st.id
                              ? 'border-cyan-300/60 bg-cyan-400/25 text-white'
                              : 'border-white/15 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Planet Level Actions Footer */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/15 pt-3.5">
            <button
              type="button"
              onClick={() =>
                onUpdateStationStatus(
                  activePlanet.id,
                  activePlanet.status === 'completed' ? 'in_progress' : 'completed'
                )
              }
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                activePlanet.status === 'completed'
                  ? 'border-emerald-300/50 bg-emerald-500/25 text-emerald-100'
                  : 'border-cyan-300/50 bg-cyan-400/25 text-white hover:bg-cyan-400/35'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {activePlanet.status === 'completed'
                  ? 'Milestone Verified (Reopen)'
                  : 'Verify Entire Milestone'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSyncStationToTodo(activePlanet)}
              data-testid="cosmic-planet-sync-todo-btn"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <ListTodo className="h-4 w-4 text-cyan-300" />
              <span>Add to To-Do</span>
            </button>
          </div>

          {stationAddedToast && (
            <div className="mt-2 rounded-xl border border-emerald-400/35 bg-emerald-500/20 px-3 py-1.5 text-center text-xs font-semibold text-emerald-100">
              {stationAddedToast}
            </div>
          )}
        </aside>
      )}

      {/* 2. SELECTED TASK-STAR FOCUS PANEL (LEFT SIDE) */}
      {explorationLevel === 'star' && activePlanet && activeStar && !mobilePanelCollapsed && (
        <aside
          data-testid="cosmic-glass-panel-star"
          data-cosmic-focus-panel="true"
          aria-label="Selected Task Star Information"
          className="pointer-events-auto absolute left-3 right-3 bottom-20 max-h-[54%] md:left-4 md:right-auto md:top-[64px] md:bottom-24 md:max-h-none z-20 flex w-auto md:w-[400px] flex-col justify-between overflow-y-auto rounded-[24px] border border-white/20 p-5 text-white shadow-[0_24px_64px_rgba(2,8,23,0.72),inset_0_1px_1px_rgba(255,255,255,0.28)]"
          style={{
            background:
              'linear-gradient(155deg, rgba(12, 26, 54, 0.78) 0%, rgba(5, 12, 28, 0.68) 100%)',
          }}
        >
          <div className="space-y-4">
            {/* Level 3 Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleEnterPlanetView(activePlanet.id)}
                  data-testid="cosmic-back-to-planet-btn"
                  className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Planet</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnterSystemOverview}
                  data-testid="cosmic-star-to-overview-btn"
                  className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/15"
                >
                  <Orbit className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Overview</span>
                </button>
              </div>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  statusBadgeMeta(activeStar.status).cls
                }`}
              >
                {statusBadgeMeta(activeStar.status).label}
              </span>
            </div>

            {/* Parent Milestone Identity Badge */}
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200">
              Parent Milestone: {formatMilestoneHoverTitle(activePlanet.order, activePlanet.title)}
            </div>

            {/* Star Header or Inline Editor */}
            {!isEditingStar ? (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                  <StarIcon className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  <span>
                    Task Star {formatMilestoneNumber(activePlanet.order)}.{activeStar.order} ·{' '}
                    {activeStar.dependencyType.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <h2
                    className="text-xl font-bold tracking-tight text-white"
                    data-testid="cosmic-focused-star-title"
                  >
                    {activeStar.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingStar(true)}
                    className="rounded-xl border border-white/15 bg-white/10 p-1.5 text-slate-200 hover:bg-white/20"
                    title="Edit Task Star"
                    aria-label="Edit Task Star"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-0.5">
                    <Clock className="h-3 w-3 text-cyan-300" />
                    {activeStar.estimatedHours}h Effort
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-0.5">
                    <Target className="h-3 w-3 text-amber-300" />
                    {activeStar.deadlineWindow}
                  </span>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${
                      verificationBadgeMeta(activeStar.verificationLevel).cls
                    }`}
                  >
                    {verificationBadgeMeta(activeStar.verificationLevel).label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 rounded-2xl border border-cyan-300/35 bg-slate-950/75 p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                  Edit Actionable Task Star
                </div>
                <input
                  type="text"
                  value={editStarTitle}
                  onChange={(e) => setEditStarTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  placeholder="Task title"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-300">Effort (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editStarHours}
                      onChange={(e) => setEditStarHours(Number(e.target.value))}
                      className="mt-0.5 w-full rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300">Deadline Window</label>
                    <input
                      type="text"
                      value={editStarWindow}
                      onChange={(e) => setEditStarWindow(e.target.value)}
                      className="mt-0.5 w-full rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-300">Detailed Instructions</label>
                  <textarea
                    rows={3}
                    value={editStarInstructions}
                    onChange={(e) => setEditStarInstructions(e.target.value)}
                    className="mt-0.5 w-full rounded-xl border border-white/20 bg-white/10 p-2 text-xs text-white focus:border-cyan-300 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingStar(false)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStarEdits}
                    className="inline-flex items-center gap-1 rounded-xl border border-cyan-300/50 bg-cyan-400/25 px-3 py-1 text-xs font-bold text-white"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Task Description & Completion Criteria */}
            <div className="space-y-2.5 text-xs">
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                <div className="font-bold text-cyan-200">Task Description &amp; Execution Plan</div>
                <p className="mt-1 leading-relaxed text-slate-100/95">
                  {activeStar.detailedInstructions}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3">
                <div className="flex items-center gap-1.5 font-bold text-emerald-200">
                  <Award className="h-3.5 w-3.5" />
                  <span>Completion Criteria</span>
                </div>
                <p className="mt-1 leading-relaxed text-slate-200/90">
                  {activeStar.completionCriteria}
                </p>
              </div>
            </div>

            {/* Progressive Disclosure for Secondary Task Details & Mastery Level */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setShowStarSecondaryDetails((v) => !v)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-amber-200 transition hover:bg-white/[0.05]"
              >
                <span>Expected Outcome, Resources &amp; Mastery Level</span>
                {showStarSecondaryDetails ? (
                  <ChevronUp className="h-4 w-4 text-amber-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-amber-300" />
                )}
              </button>

              {showStarSecondaryDetails && (
                <div className="space-y-3 border-t border-white/10 px-3.5 py-3 text-xs">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="font-bold text-amber-200">Why This Matters</div>
                      <p className="mt-0.5 leading-relaxed text-slate-200/90">
                        {activeStar.whyItMatters}
                      </p>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-200">Expected Deliverable</div>
                      <p className="mt-0.5 leading-relaxed text-slate-200/90">
                        {activeStar.expectedResult}
                      </p>
                    </div>
                  </div>

                  {activeStar.resources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
                        <span>Supporting Resources</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {activeStar.resources.map((res, rIdx) => (
                          <span
                            key={rIdx}
                            className="rounded-lg border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[11px] text-slate-200"
                          >
                            {res.title} ({res.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Mastery Verification Level
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
                      {(
                        [
                          { id: 'pending', label: '1. Pending' },
                          { id: 'task_completed', label: '2. Task Completed' },
                          { id: 'knowledge_assessed', label: '3. Assessed / Tested' },
                          { id: 'milestone_verified', label: '4. Verified Proof' },
                        ] as { id: VerificationMasteryLevel; label: string }[]
                      ).map((lvl) => {
                        const active = activeStar.verificationLevel === lvl.id;
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() =>
                              onUpdateTaskStar(activePlanet.id, activeStar.id, {
                                verificationLevel: lvl.id,
                                status: lvl.id === 'pending' ? 'in_progress' : 'completed',
                              })
                            }
                            className={`rounded-xl border px-2.5 py-1.5 text-left font-semibold transition ${
                              active
                                ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                                : 'border-white/15 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Star Action Controls Footer */}
          <div className="mt-4 space-y-2 border-t border-white/15 pt-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="cosmic-star-complete-btn"
                onClick={() =>
                  onUpdateTaskStar(activePlanet.id, activeStar.id, {
                    status: activeStar.status === 'completed' ? 'in_progress' : 'completed',
                    verificationLevel:
                      activeStar.status === 'completed' ? 'pending' : 'milestone_verified',
                  })
                }
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  activeStar.status === 'completed'
                    ? 'border-emerald-300/50 bg-emerald-500/25 text-emerald-100'
                    : 'border-amber-300/55 bg-amber-400/25 text-white hover:bg-amber-400/35'
                }`}
              >
                {activeStar.status === 'completed' ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Completed (Reopen Star)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Star Complete</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSyncStarToTodo) {
                    onSyncStarToTodo(activePlanet, activeStar);
                  } else {
                    onSyncStationToTodo(activePlanet);
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <ListTodo className="h-3.5 w-3.5 text-cyan-300" />
                <span>Add to To-Do</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToNextTask}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-white/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cycle to Next Orbiting Task Star</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* 3. SELECTED SUN FOCUS PANEL (LEFT SIDE — FINAL ACADEMIC DESTINATION) */}
      {explorationLevel === 'sun' && !mobilePanelCollapsed && (
        <aside
          data-testid="cosmic-glass-panel-sun"
          data-cosmic-focus-panel="true"
          aria-label="Final Academic Goal Information"
          className="pointer-events-auto absolute left-3 right-3 bottom-20 max-h-[54%] md:left-4 md:right-auto md:top-[64px] md:bottom-24 md:max-h-none z-20 flex w-auto md:w-[390px] flex-col justify-between overflow-y-auto rounded-[24px] border border-white/20 p-5 text-white shadow-[0_24px_64px_rgba(2,8,23,0.68),inset_0_1px_1px_rgba(255,255,255,0.26)]"
          style={{
            background:
              'linear-gradient(155deg, rgba(14, 26, 54, 0.76) 0%, rgba(5, 12, 28, 0.66) 100%)',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                <SunIcon className="h-3.5 w-3.5 text-amber-300" />
                <span>The Sun · Final Academic Goal</span>
              </div>
              <button
                type="button"
                onClick={handleEnterSystemOverview}
                data-testid="cosmic-sun-close-focus-btn"
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>
            </div>

            <div>
              <h2
                className="text-xl font-bold tracking-tight text-white"
                data-testid="cosmic-focused-sun-title"
              >
                {cosmicSystem.sunDestination.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-amber-200/95">
                {cosmicSystem.sunDestination.subtitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-200/90">
                Final Academic Objective: {cosmicSystem.sunDestination.originToTargetLabel} via{' '}
                <strong>{cosmicSystem.sunDestination.routeBadge}</strong>.
              </p>
            </div>

            {/* Destination Metadata Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {targetCountry && (
                <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Target Country
                  </div>
                  <div className="mt-0.5 font-semibold text-white">{targetCountry}</div>
                </div>
              )}
              {targetDegree && (
                <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Degree Track
                  </div>
                  <div className="mt-0.5 font-semibold text-white">{targetDegree}</div>
                </div>
              )}
              {targetDiscipline && (
                <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Discipline
                  </div>
                  <div className="mt-0.5 font-semibold text-white">{targetDiscipline}</div>
                </div>
              )}
              {originCountry && (
                <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Origin Base
                  </div>
                  <div className="mt-0.5 font-semibold text-white">{originCountry}</div>
                </div>
              )}
            </div>

            {/* Solar Readiness & Feasibility Telemetry */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  Overall Progress
                </div>
                <div className="mt-1 text-xl font-bold text-amber-300">
                  {cosmicSystem.sunDestination.overallProgressPercent}%
                </div>
                <div className="text-[11px] text-slate-300">
                  {cosmicSystem.sunDestination.verifiedMilestonesCount}/
                  {cosmicSystem.sunDestination.totalMilestonesCount} Milestones
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  Verified Task Stars
                </div>
                <div className="mt-1 text-xl font-bold text-cyan-200">
                  {cosmicSystem.sunDestination.completedStarsCount} /{' '}
                  {cosmicSystem.sunDestination.totalStarsCount}
                </div>
                <div className="text-[11px] text-slate-300">
                  {cosmicSystem.feasibility.completedHours}h /{' '}
                  {cosmicSystem.feasibility.totalEstimatedHours}h
                </div>
              </div>
            </div>

            {/* Schedule Feasibility Guidance */}
            <div
              className={`rounded-2xl border p-3.5 text-xs ${
                cosmicSystem.feasibility.feasibilityStatus === 'optimal'
                  ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-100'
                  : cosmicSystem.feasibility.feasibilityStatus === 'tight'
                  ? 'border-amber-400/35 bg-amber-500/12 text-amber-100'
                  : 'border-rose-400/40 bg-rose-500/15 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {cosmicSystem.feasibility.feasibilityStatus === 'unrealistic' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-300 shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                )}
                <span className="uppercase tracking-wider text-[11px]">
                  Academic GPS Schedule:{' '}
                  {cosmicSystem.feasibility.feasibilityStatus.toUpperCase()}
                </span>
              </div>
              <p className="mt-1.5 leading-relaxed opacity-95">
                {cosmicSystem.feasibility.explanation}
              </p>
            </div>

            {/* Active Milestone Planet Quick Launch */}
            {activePlanet && (
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-3.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  <span>Current Focus Milestone</span>
                  <span>{activePlanet.planetProgressPercent}% Complete</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  {formatMilestoneHoverTitle(activePlanet.order, activePlanet.title)}
                </div>
                <div className="mt-0.5 text-xs text-slate-200/85">
                  {activeArchetypeSpec.label} · {(activePlanet.taskStars || []).length} Orbiting
                  Task Stars
                </div>
                <button
                  type="button"
                  data-testid="cosmic-explore-planet-btn"
                  onClick={() => handleEnterPlanetView(activePlanet.id)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/45 bg-cyan-400/25 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-cyan-400/35"
                >
                  <Compass className="h-4 w-4" />
                  <span>Focus Milestone Planet</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* =====================================================================
          BOTTOM PLANETARY ORBIT SELECTOR DOCK (SPACECRAFT GLASSMORPHISM HUD)
          Provides instant numbered milestone identification (Sun Goal, 01, 02, ...) and touch access.
         ===================================================================== */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex items-end justify-center">
        <div
          className={`pointer-events-auto max-w-full overflow-x-auto rounded-2xl border border-white/[0.18] px-2.5 py-2 shadow-[0_18px_48px_rgba(2,6,23,0.78),inset_0_1px_0_rgba(255,255,255,0.28)] ${
            !isSoftwareGlMode ? 'backdrop-blur-xl' : ''
          }`}
          style={{
            background:
              'linear-gradient(180deg, rgba(14, 24, 52, 0.78) 0%, rgba(5, 10, 24, 0.74) 100%)',
          }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleEnterSunDestination}
              data-testid="cosmic-dock-sun-btn"
              className={`group flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-left text-[11px] transition ${
                explorationLevel === 'sun'
                  ? 'border-amber-300/65 bg-amber-400/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'border-amber-400/30 bg-amber-500/12 text-amber-100 hover:bg-amber-400/20'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-amber-400 to-orange-500 text-[10px] font-black text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.55)]">
                ☀
              </span>
              <div>
                <div className="font-bold leading-tight">Sun Goal</div>
                <div className="font-mono text-[10px] tabular-nums text-amber-200/85">
                  {cosmicSystem.sunDestination.overallProgressPercent}% Ready
                </div>
              </div>
            </button>

            {cosmicSystem.planets.map((planet, idx) => {
              const isSelected =
                planet.id === activePlanet?.id &&
                (explorationLevel === 'planet' || explorationLevel === 'star');
              const isCompleted = planet.status === 'completed';
              const isCurrent = planet.status === 'in_progress';
              const code = formatMilestoneNumber(planet.order);
              const compactName = formatCompactMilestoneLabel(
                planet.order,
                planet.title,
                language
              ).replace(/^\d+\.\s*/, '');

              return (
                <button
                  key={planet.id}
                  type="button"
                  title={planet.title}
                  data-testid={`cosmic-planet-dock-${idx + 1}`}
                  onClick={() => handleEnterPlanetView(planet.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left text-[11px] transition ${
                    isSelected
                      ? 'border-cyan-300/65 bg-cyan-400/22 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                      : isCompleted
                      ? 'border-emerald-400/35 bg-emerald-500/14 text-emerald-100 hover:bg-emerald-500/22'
                      : isCurrent
                      ? 'border-sky-400/40 bg-sky-500/16 text-sky-100 hover:bg-sky-500/25'
                      : 'border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold tabular-nums ${
                      isCompleted
                        ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-300/45'
                        : isCurrent
                        ? 'bg-cyan-400/25 text-cyan-200 border border-cyan-300/45'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {code}
                  </span>
                  <div className="max-w-[98px]">
                    <div className="truncate font-semibold leading-tight">{compactName}</div>
                    <div className="font-mono text-[10px] tabular-nums opacity-80">
                      {(planet.taskStars || []).filter((s) => s.status === 'completed').length}/
                      {(planet.taskStars || []).length}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
