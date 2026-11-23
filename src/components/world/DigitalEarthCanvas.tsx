import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { geoEquirectangular, geoPath } from 'd3-geo';
import type { CityRecord, CountryRecord } from '../../types/domain';
import {
  buildCountryBorderSegments,
  buildDottedContinentCloud,
  buildEarthGeoDataBuffer,
  buildEquirectLookupGrid,
  buildGraticuleSegments,
  buildNumericCountryLookup,
  getWorldCountryFeatures,
  GLOBE_VISUAL_PRESETS,
  latLonToVector3Tuple,
  lookupFeatureIndexAtLatLon,
  vector3ToLatLon,
  type GlobeVisualMode,
  type WorldCountryFeature,
} from '../../utils/globeGeo';

import {
  getTerritoryMetaByIso2,
  resolveTerritoryMeta,
  type WorldTerritoryMeta,
} from '../../utils/isoCountries';

export interface GlobeUniversityMarker {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  countryName?: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  isPriority?: boolean;
}

export interface DigitalEarthHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusCountry: (isoCode: string) => void;
  focusCoordinates: (lat: number, lon: number, zoomDist?: number) => void;
}

export interface HoveredGlobeInfo {
  badge?: string;
  title: string;
  subtitle?: string;
  isCity?: boolean;
  isUniversity?: boolean;
  isCatalogCountry?: boolean;
  screenX: number;
  screenY: number;
}

interface ProjectedCityLabel {
  slug: string;
  name: string;
  countryCode: string;
  x: number;
  y: number;
  isSelectedCountry: boolean;
}

interface ProjectedUniversityMarker {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  countryName: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  isSelected: boolean;
  isPriority: boolean;
}

interface DigitalEarthCanvasProps {
  countries: CountryRecord[];
  filteredCountryCodes: Set<string>;
  cities: CityRecord[];
  universityMarkers?: GlobeUniversityMarker[];
  universityCountByCountry: Record<string, number>;
  universityCountByCity: Record<string, number>;
  selectedCountryCode: string | null;
  autoRotate: boolean;
  visualMode: GlobeVisualMode;
  showGrid: boolean;
  showEquatorMeridian: boolean;
  showCityMarkers: boolean;
  showCountryLabels: boolean;
  showClouds?: boolean;
  showAtmosphere?: boolean;
  showTerrainRelief?: boolean;
  showUniversityMarkers?: boolean;
  onSelectCountry: (isoCode: string) => void;
  onSelectWorldCountry?: (meta: WorldTerritoryMeta) => void;
  onSelectCity: (city: CityRecord) => void;
  onSelectUniversityMarker?: (slug: string) => void;
  onClearSelection?: () => void;
  onZoomChange?: (zoomPct: number) => void;
  onOrientationChange?: (coords: { lat: number; lon: number }) => void;
  uiStrings?: {
    verifiedUnisSingular: string;
    verifiedUnisPlural: string;
    exploreCountryHint?: string;
    webglUnavailableTitle: string;
    webglUnavailableDesc: string;
  };
}

const DEFAULT_CAMERA_DIST = 2.84;
const MIN_CAMERA_DIST = 1.52;
const MAX_CAMERA_DIST = 4.6;
const INITIAL_LAT = 24;
const INITIAL_LON = 42;

// Pre-allocated scratch helpers outside render loops to prevent GC churn
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _normal = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const DigitalEarthCanvas = React.forwardRef<DigitalEarthHandle, DigitalEarthCanvasProps>(
  (
    {
      countries,
      filteredCountryCodes,
      cities,
      universityMarkers = [],
      universityCountByCountry,
      universityCountByCity,
      selectedCountryCode,
      autoRotate,
      visualMode,
      showGrid,
      showEquatorMeridian,
      showCityMarkers,
      showCountryLabels,
      showClouds = false,
      showAtmosphere = true,
      showTerrainRelief = false,
      showUniversityMarkers = true,
      onSelectCountry,
      onSelectWorldCountry,
      onSelectCity,
      onSelectUniversityMarker,
      onClearSelection,
      onZoomChange,
      onOrientationChange,
      uiStrings,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const containerWidthRef = useRef<number>(720);
    const containerHeightRef = useRef<number>(480);
    const [webglUnavailable, setWebglUnavailable] = useState(false);
    const [hoveredInfo, setHoveredInfo] = useState<HoveredGlobeInfo | null>(null);
    const [cityLabels, setCityLabels] = useState<ProjectedCityLabel[]>([]);
    const [projectedUniMarkers, setProjectedUniMarkers] = useState<ProjectedUniversityMarker[]>([]);
    const [selectedCountryLabel, setSelectedCountryLabel] = useState<{
      name: string;
      x: number;
      y: number;
    } | null>(null);

    // Refs to keep mutable latest callbacks/state accessible inside WebGL loop without re-initializing WebGL
    const propsRef = useRef({
      countries,
      filteredCountryCodes,
      cities,
      universityMarkers,
      universityCountByCountry,
      universityCountByCity,
      selectedCountryCode,
      autoRotate,
      visualMode,
      showGrid,
      showEquatorMeridian,
      showCityMarkers,
      showCountryLabels,
      showClouds,
      showAtmosphere,
      showTerrainRelief,
      showUniversityMarkers,
      onSelectCountry,
      onSelectWorldCountry,
      onSelectCity,
      onSelectUniversityMarker,
      onClearSelection,
      onZoomChange,
      onOrientationChange,
      uiStrings,
    });
    propsRef.current = {
      countries,
      filteredCountryCodes,
      cities,
      universityMarkers,
      universityCountByCountry,
      universityCountByCity,
      selectedCountryCode,
      autoRotate,
      visualMode,
      showGrid,
      showEquatorMeridian,
      showCityMarkers,
      showCountryLabels,
      showClouds,
      showAtmosphere,
      showTerrainRelief,
      showUniversityMarkers,
      onSelectCountry,
      onSelectWorldCountry,
      onSelectCity,
      onSelectUniversityMarker,
      onClearSelection,
      onZoomChange,
      onOrientationChange,
      uiStrings,
    };

    const worldFeatures = useMemo(() => getWorldCountryFeatures(), []);
    const numericLookup = useMemo(() => buildNumericCountryLookup(countries), [countries]);
    const numericLookupRef = useRef(numericLookup);
    numericLookupRef.current = numericLookup;

    const featureIndexByIso = useMemo(() => {
      const map: Record<string, number> = {};
      for (let i = 0; i < worldFeatures.length; i++) {
        const feat = worldFeatures[i];
        const matched = numericLookup[feat.numericId];
        if (matched && map[matched.isoCode] === undefined) {
          map[matched.isoCode] = i;
        }
        const meta = resolveTerritoryMeta(feat.numericId, feat.properties?.name);
        if (meta && map[meta.iso2] === undefined) {
          map[meta.iso2] = i;
        }
      }
      return map;
    }, [worldFeatures, numericLookup]);
    const featureIndexByIsoRef = useRef(featureIndexByIso);
    featureIndexByIsoRef.current = featureIndexByIso;

    // Scene imperative controller refs
    const sceneControlRef = useRef<{
      setDistanceDelta: (factor: number) => void;
      resetCamera: () => void;
      flyToFeature: (featIdx: number, zoomDist?: number) => void;
      flyToCoords: (lat: number, lon: number, zoomDist?: number) => void;
      refreshHighlights: () => void;
      refreshVisualMode: () => void;
      refreshLayers: () => void;
      syncCities: () => void;
      syncUniversityMarkers: () => void;
    } | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => sceneControlRef.current?.setDistanceDelta(0.8),
        zoomOut: () => sceneControlRef.current?.setDistanceDelta(1.25),
        resetView: () => sceneControlRef.current?.resetCamera(),
        focusCountry: (isoCode: string) => {
          const idx = featureIndexByIsoRef.current[isoCode];
          if (idx !== undefined && idx >= 0) {
            sceneControlRef.current?.flyToFeature(idx, 2.08);
          }
        },
        focusCoordinates: (lat: number, lon: number, zoomDist = 1.92) => {
          sceneControlRef.current?.flyToCoords(lat, lon, zoomDist);
        },
      }),
      []
    );

    // Synchronize highlights, visual mode, layers, cities, and university beacons when props change
    useEffect(() => {
      sceneControlRef.current?.refreshHighlights();
    }, [selectedCountryCode, filteredCountryCodes, countries]);

    useEffect(() => {
      sceneControlRef.current?.refreshVisualMode();
      sceneControlRef.current?.refreshLayers();
    }, [visualMode]);

    useEffect(() => {
      sceneControlRef.current?.refreshLayers();
    }, [
      showGrid,
      showEquatorMeridian,
      showCityMarkers,
      showCountryLabels,
      showClouds,
      showAtmosphere,
      showTerrainRelief,
      showUniversityMarkers,
    ]);

    useEffect(() => {
      sceneControlRef.current?.syncCities();
    }, [cities, selectedCountryCode, filteredCountryCodes]);

    useEffect(() => {
      sceneControlRef.current?.syncUniversityMarkers();
      const selectedSlugs = new Set(
        universityMarkers.filter((u) => u.isSelected).map((u) => u.slug)
      );
      setProjectedUniMarkers((prev) =>
        prev.map((m) => ({
          ...m,
          isSelected: selectedSlugs.has(m.slug),
        }))
      );
    }, [universityMarkers]);

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          alpha: false,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglUnavailable(true);
        return;
      }

      const initWidth = Math.max(280, container.clientWidth || 720);
      const initHeight = Math.max(320, container.clientHeight || 480);
      containerWidthRef.current = initWidth;
      const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(initWidth, initHeight, false);
      renderer.setClearColor(0x01040a, 1);

      const canvas = renderer.domElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.touchAction = 'none';
      container.innerHTML = '';
      container.appendChild(canvas);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglUnavailable(true);
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x01040b);

      const initAspect = initWidth / initHeight;
      const camera = new THREE.PerspectiveCamera(
        initAspect < 0.95 ? 48 : 41,
        initAspect,
        0.1,
        100
      );
      const initCode = propsRef.current.selectedCountryCode;
      const initFeatIdx = initCode ? featureIndexByIsoRef.current[initCode] : undefined;
      const initFeat = initFeatIdx !== undefined ? worldFeatures[initFeatIdx] : undefined;
      const startLat = initFeat ? THREE.MathUtils.clamp(initFeat.centroid[1] * 0.72 + 8, -45, 58) : INITIAL_LAT;
      const startLon = initFeat ? initFeat.centroid[0] - 12 : INITIAL_LON;
      const [ix, iy, iz] = latLonToVector3Tuple(startLat, startLon, DEFAULT_CAMERA_DIST);
      camera.position.set(ix, iy, iz);
      camera.lookAt(0, 0, 0);

      const controls = new OrbitControls(camera, canvas);
      controls.enablePan = false;
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.055;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.85;
      controls.minDistance = MIN_CAMERA_DIST;
      controls.maxDistance = MAX_CAMERA_DIST;
      controls.autoRotate = false; // managed via smooth delta rotation with idle pause

      // Globe root group (tilted slightly on axial aesthetic? Keep un-tilted or axis-aligned so lat/lon math is 100% pure!)
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // Build geospatial data once
      const lookupGrid = buildEquirectLookupGrid(worldFeatures, 1024, 512);
      const isCompact = initWidth < 640 || isSoftwareGl;
      const totalCloudSamples = isCompact ? 34000 : 54000;
      const cloudData = buildDottedContinentCloud(lookupGrid, totalCloudSamples, 1.0045);
      const borderData = buildCountryBorderSegments(worldFeatures, 1.0028);
      const graticuleData = buildGraticuleSegments(1.0016);

      // 1. Subtle deep-space background stars
      const starCount = isCompact ? 280 : 480;
      const starPos = new Float32Array(starCount * 3);
      const starCol = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.acos(2 * (((i * 0.6180339887) % 1)) - 1);
        const phi = i * 2.3999632;
        const r = 14 + (i % 9);
        starPos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        starPos[i * 3 + 1] = r * Math.cos(theta);
        starPos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
        const tint = 0.45 + (i % 5) * 0.1;
        starCol[i * 3] = tint * 0.65;
        starCol[i * 3 + 1] = tint * 0.88;
        starCol[i * 3 + 2] = tint;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
      const starMat = new THREE.PointsMaterial({
        size: 0.055,
        vertexColors: true,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // 2. Dynamic Mask CanvasTexture (R=land, G=filteredDestination, B=selectedCountry, A=hoveredCountry)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = 1024;
      maskCanvas.height = 512;
      const maskCtx = maskCanvas.getContext('2d')!;
      const maskProjection = geoEquirectangular()
        .scale(1024 / (2 * Math.PI))
        .translate([1024 / 2, 512 / 2]);
      const maskPath = geoPath(maskProjection, maskCtx);

      // Pre-bake static land layer onto a base canvas for rapid mask updates
      const landBaseCanvas = document.createElement('canvas');
      landBaseCanvas.width = 1024;
      landBaseCanvas.height = 512;
      const landBaseCtx = landBaseCanvas.getContext('2d')!;
      const landPath = geoPath(maskProjection, landBaseCtx);
      landBaseCtx.fillStyle = '#000000';
      landBaseCtx.fillRect(0, 0, 1024, 512);
      landBaseCtx.fillStyle = 'rgb(255, 0, 0)';
      for (const feat of worldFeatures) {
        landBaseCtx.beginPath();
        landPath(feat as never);
        landBaseCtx.fill();
      }

      const maskTexture = new THREE.CanvasTexture(maskCanvas);
      maskTexture.colorSpace = THREE.NoColorSpace;
      maskTexture.minFilter = THREE.LinearFilter;
      maskTexture.magFilter = THREE.LinearFilter;
      maskTexture.wrapS = THREE.RepeatWrapping;
      maskTexture.wrapT = THREE.ClampToEdgeWrapping;

      // 2b. Physical Geography DataTexture (R=Elevation, G=Biome, B=NightCityLights, A=CoastalShelf)
      const cityCoordList: Array<[number, number]> = (propsRef.current.cities || []).map((c) => [
        c.latitude,
        c.longitude,
      ]);
      const geoDataBuffer = buildEarthGeoDataBuffer(lookupGrid, cityCoordList, 512, 256);
      const geoTexture = new THREE.DataTexture(
        geoDataBuffer,
        512,
        256,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
      );
      geoTexture.colorSpace = THREE.NoColorSpace;
      geoTexture.minFilter = THREE.LinearFilter;
      geoTexture.magFilter = THREE.LinearFilter;
      geoTexture.wrapS = THREE.RepeatWrapping;
      geoTexture.wrapT = THREE.ClampToEdgeWrapping;
      geoTexture.needsUpdate = true;

      // 3. Multi-Mode 3D Earth Core Sphere with Custom GLSL Shader (Supports all 9 modes + 3D terrain relief)
      const initialPreset = GLOBE_VISUAL_PRESETS[propsRef.current.visualMode];
      const computeTerrainScale = (
        preset: (typeof GLOBE_VISUAL_PRESETS)[GlobeVisualMode],
        reliefLayerEnabled: boolean
      ) => {
        if (reliefLayerEnabled) {
          return preset.modeType === 3 ? 0.045 : 0.028;
        }
        return preset.defaultTerrainScale;
      };
      const computeReliefStrength = (
        preset: (typeof GLOBE_VISUAL_PRESETS)[GlobeVisualMode],
        reliefLayerEnabled: boolean
      ) => {
        if (reliefLayerEnabled) {
          return preset.modeType === 3 ? 2.6 : 1.55;
        }
        return preset.modeType === 3 ? 1.85 : preset.modeType > 0 ? 0.95 : 0.0;
      };

      const coreGeo = new THREE.SphereGeometry(1.0, 128, 96);
      const coreMat = new THREE.ShaderMaterial({
        uniforms: {
          uMaskTex: { value: maskTexture },
          uGeoTex: { value: geoTexture },
          uTime: { value: 0 },
          uModeType: { value: initialPreset.modeType },
          uTerrainScale: {
            value: computeTerrainScale(initialPreset, Boolean(propsRef.current.showTerrainRelief)),
          },
          uReliefStrength: {
            value: computeReliefStrength(initialPreset, Boolean(propsRef.current.showTerrainRelief)),
          },
          uShowAtmosphere: { value: propsRef.current.showAtmosphere ? 1.0 : 0.0 },
          uShowClouds: { value: propsRef.current.showClouds ? 1.0 : 0.0 },
          uOceanDeep: { value: new THREE.Color(initialPreset.oceanDeep) },
          uOceanMid: { value: new THREE.Color(initialPreset.oceanMid) },
          uLandBase: { value: new THREE.Color(initialPreset.landBase) },
          uDestGlow: { value: new THREE.Color(initialPreset.destHighlightHex) },
          uSelectedColor: { value: new THREE.Color(initialPreset.selectedHex) },
          uHoverColor: { value: new THREE.Color(initialPreset.hoverHex) },
          uAtmosColor: { value: new THREE.Color(initialPreset.atmosphereHex) },
          uScanIntensity: { value: initialPreset.scanlineIntensity },
        },
        vertexShader: `
          uniform sampler2D uMaskTex;
          uniform sampler2D uGeoTex;
          uniform float uTerrainScale;

          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          varying vec3 vWorldPos;
          varying float vLat;
          varying float vElev;

          void main() {
            vUv = uv;
            vLat = position.y;
            float landMask = texture2D(uMaskTex, uv).r;
            float elev = texture2D(uGeoTex, uv).r;
            vElev = elev;

            // Genuine 3D vertex displacement along surface normal for mountain ranges & elevation relief
            float disp = landMask > 0.15 ? pow(elev, 1.25) * uTerrainScale : 0.0;
            vec3 displacedPos = position + normal * disp;
            vWorldPos = displacedPos;

            vNormalView = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(displacedPos, 1.0);
            vViewPos = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMaskTex;
          uniform sampler2D uGeoTex;
          uniform float uTime;
          uniform float uModeType;
          uniform float uReliefStrength;
          uniform float uShowAtmosphere;
          uniform float uShowClouds;
          uniform vec3 uOceanDeep;
          uniform vec3 uOceanMid;
          uniform vec3 uLandBase;
          uniform vec3 uDestGlow;
          uniform vec3 uSelectedColor;
          uniform vec3 uHoverColor;
          uniform vec3 uAtmosColor;
          uniform float uScanIntensity;

          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          varying vec3 vWorldPos;
          varying float vLat;
          varying float vElev;

          // Procedural high-frequency 3D spherical detail for crisp satellite & terrain micro-relief
          float surfaceMicroDetail(vec3 p) {
            float n1 = sin(p.x * 38.0 + p.y * 29.0) * cos(p.z * 35.0 - p.x * 24.0);
            float n2 = sin(p.y * 84.0 - p.z * 76.0) * cos(p.x * 79.0 + p.z * 68.0) * 0.5;
            float n3 = sin(p.z * 165.0 + p.x * 150.0 - p.y * 142.0) * 0.25;
            return 0.5 + 0.28 * (n1 + n2 + n3);
          }

          // Cloud shadow pattern matching the outer volumetric cloud layer
          float sampleCloudShadow(vec3 p, float t) {
            vec3 q = p * 3.2 + vec3(t * 0.012, 0.0, -t * 0.009);
            float c1 = sin(q.x * 2.4 + cos(q.z * 2.7)) * cos(q.y * 3.1 + sin(q.x * 2.2));
            float c2 = sin(q.z * 5.3 - q.x * 4.8) * cos(q.y * 5.7 + q.z * 4.1) * 0.5;
            return smoothstep(0.18, 0.72, 0.5 + 0.35 * (c1 + c2));
          }

          void main() {
            vec4 mask = texture2D(uMaskTex, vUv);
            float land = mask.r;
            float dest = mask.g;
            float selected = mask.b;
            float hovered = smoothstep(0.05, 0.9, 1.0 - mask.a);

            vec4 geo = texture2D(uGeoTex, vUv);
            float elev = geo.r;
            float biome = geo.g;
            float nightLights = geo.b;
            float coastalShelf = geo.a;

            vec3 viewDir = normalize(vViewPos);
            vec3 baseNormal = normalize(vNormalView);
            float ndotv = clamp(dot(baseNormal, viewDir), 0.0, 1.0);
            float fresnel = pow(1.0 - ndotv, 2.8);

            // Finite-difference elevation normal perturbation for 3D mountain ridges & valleys
            vec2 texel = vec2(1.0 / 512.0, 1.0 / 256.0);
            float eR = texture2D(uGeoTex, vUv + vec2(texel.x, 0.0)).r;
            float eL = texture2D(uGeoTex, vUv - vec2(texel.x, 0.0)).r;
            float eU = texture2D(uGeoTex, vUv + vec2(0.0, texel.y)).r;
            float eD = texture2D(uGeoTex, vUv - vec2(0.0, texel.y)).r;
            float micro = surfaceMicroDetail(vWorldPos);
            vec3 grad = vec3((eL - eR) * 6.5, (eD - eU) * 6.5, 0.0);
            vec3 reliefNormal = normalize(baseNormal + grad * uReliefStrength * (0.25 + 0.75 * land));

            vec3 sunDir = normalize(vec3(0.52, 0.48, 0.71));
            float sunDiff = clamp(dot(baseNormal, sunDir), 0.0, 1.0);
            float reliefLight = clamp(dot(reliefNormal, sunDir), 0.0, 1.0);
            float specWater = pow(max(dot(reflect(-sunDir, baseNormal), viewDir), 0.0), 38.0);

            vec3 surface = vec3(0.0);

            if (uModeType < 0.5) {
              // MODE 0: Original 5 Digital Earth Holographic Modes
              float light = clamp(dot(reliefNormal, normalize(vec3(0.45, 0.55, 0.72))), 0.0, 1.0);
              vec3 ocean = mix(uOceanDeep, uOceanMid, light * 0.75 + 0.15);
              vec3 landCol = uLandBase * (0.85 + 0.42 * reliefLight * clamp(uReliefStrength, 0.3, 1.6));
              surface = mix(ocean, landCol, land * 0.88);
              surface = mix(surface, uDestGlow * 0.16, dest * 0.45);
              surface = mix(surface, uSelectedColor * 0.34, selected * 0.85);
              surface = mix(surface, uHoverColor * 0.22, hovered * 0.7);

              float scanPrimary = 0.5 + 0.5 * sin(vLat * 280.0 + uTime * 0.55);
              float scanBand = 0.5 + 0.5 * sin(vLat * 26.0 - uTime * 0.25);
              float scanFactor = mix(1.0, 0.72 + 0.28 * scanPrimary * (0.75 + 0.25 * scanBand), uScanIntensity);
              surface *= scanFactor;
              surface += uAtmosColor * (0.045 * uScanIntensity * scanPrimary * (0.35 + 0.65 * land));
              surface += uAtmosColor * fresnel * 0.52 * uShowAtmosphere;
            } else if (uModeType < 1.5) {
              // MODE 1: REALISTIC EARTH (Realistik Yer) — Photorealistic physical planet
              vec3 deepSea = vec3(0.016, 0.082, 0.215);
              vec3 midOcean = vec3(0.043, 0.225, 0.455);
              vec3 shelfTurquoise = vec3(0.075, 0.435, 0.585);
              vec3 oceanCol = mix(deepSea, midOcean, 0.3 + 0.7 * sunDiff);
              oceanCol = mix(oceanCol, shelfTurquoise, coastalShelf * 0.46);
              oceanCol += vec3(0.55, 0.76, 0.98) * specWater * 0.38;

              // Natural continental biomes: desert sand -> savanna -> lush emerald forest -> alpine rock -> snow
              vec3 desertSand = vec3(0.76, 0.63, 0.43);
              vec3 warmSavanna = vec3(0.46, 0.54, 0.27);
              vec3 lushForest = vec3(0.12, 0.35, 0.18);
              vec3 borealForest = vec3(0.14, 0.29, 0.21);
              vec3 alpineRock = vec3(0.42, 0.37, 0.33);
              vec3 snowPeak = vec3(0.95, 0.97, 1.0);

              vec3 vegCol = mix(desertSand, warmSavanna, smoothstep(0.08, 0.48, biome));
              vegCol = mix(vegCol, lushForest, smoothstep(0.45, 0.85, biome));
              vegCol = mix(vegCol, borealForest, smoothstep(0.45, 0.75, abs(vLat)));
              vegCol *= 0.86 + 0.28 * micro;

              // Mountain elevation transition
              float rockMask = smoothstep(0.42, 0.68, elev);
              float snowMask = smoothstep(0.68, 0.86, elev + abs(vLat) * 0.38);
              vec3 landCol = mix(vegCol, alpineRock, rockMask);
              landCol = mix(landCol, snowPeak, snowMask);

              // Directional sunlight + 3D relief hillshading
              float dayIllum = 0.22 + 0.86 * (0.45 * sunDiff + 0.55 * reliefLight);
              landCol *= dayIllum;

              // Subtle cloud shadow on surface when clouds layer is active
              if (uShowClouds > 0.5) {
                float cShadow = sampleCloudShadow(vWorldPos, uTime);
                landCol *= 1.0 - cShadow * 0.18;
                oceanCol *= 1.0 - cShadow * 0.14;
              }

              surface = mix(oceanCol, landCol, smoothstep(0.1, 0.75, land));

              // Refined interactive country selection & hover overlays
              surface = mix(surface, uDestGlow * 0.65, dest * 0.12);
              surface = mix(surface, uSelectedColor, selected * 0.32);
              surface = mix(surface, uHoverColor, hovered * 0.24);

              // Natural Rayleigh blue atmospheric scattering at planetary limb
              vec3 rayleighRim = vec3(0.24, 0.62, 0.98) * fresnel * (0.35 + 0.65 * sunDiff);
              surface += rayleighRim * 0.72 * uShowAtmosphere;
            } else if (uModeType < 2.5) {
              // MODE 2: SATELLITE IMAGERY (Sun'iy yo'ldosh) — Crisp orbital true-color satellite earth
              vec3 abyssNavy = vec3(0.008, 0.042, 0.125);
              vec3 satelliteSea = vec3(0.024, 0.145, 0.315);
              vec3 coralShelf = vec3(0.055, 0.525, 0.665);
              vec3 oceanCol = mix(abyssNavy, satelliteSea, 0.25 + 0.75 * sunDiff);
              oceanCol = mix(oceanCol, coralShelf, pow(coastalShelf, 1.3) * 0.62);
              oceanCol += vec3(0.65, 0.85, 1.0) * specWater * 0.25;

              // High-contrast orbital geological strata & canopy textures
              vec3 aridBasin = vec3(0.71, 0.54, 0.35);
              vec3 alluvialPlain = vec3(0.32, 0.44, 0.24);
              vec3 deepCanopy = vec3(0.07, 0.23, 0.13);
              vec3 strataRock = vec3(0.36, 0.31, 0.26);
              vec3 glacierIce = vec3(0.92, 0.96, 0.99);

              float strataPattern = 0.5 + 0.5 * sin(elev * 42.0 + micro * 6.2);
              vec3 landCol = mix(aridBasin, alluvialPlain, smoothstep(0.12, 0.52, biome));
              landCol = mix(landCol, deepCanopy, smoothstep(0.5, 0.88, biome));
              landCol = mix(landCol, strataRock, smoothstep(0.38, 0.66, elev));
              landCol *= 0.78 + 0.44 * mix(micro, strataPattern, 0.45);
              landCol = mix(landCol, glacierIce, smoothstep(0.72, 0.89, elev + abs(vLat) * 0.32));

              // High-definition orbital contrast & crisp relief shadow
              float satLight = 0.26 + 0.88 * reliefLight;
              landCol *= satLight;

              surface = mix(oceanCol, landCol, smoothstep(0.1, 0.8, land));
              surface = mix(surface, uDestGlow * 0.75, dest * 0.14);
              surface = mix(surface, uSelectedColor, selected * 0.36);
              surface = mix(surface, uHoverColor, hovered * 0.26);

              surface += vec3(0.12, 0.58, 0.92) * fresnel * 0.48 * uShowAtmosphere;
            } else if (uModeType < 3.5) {
              // MODE 3: GEOGRAPHIC TERRAIN (Relyefli Yer) — 3D Hypsometric Elevation & Bathymetric Relief
              vec3 trenchBlue = vec3(0.025, 0.115, 0.215);
              vec3 abyssalPlain = vec3(0.058, 0.235, 0.385);
              vec3 continentalSlope = vec3(0.145, 0.445, 0.575);
              float bathyContour = 0.5 + 0.5 * sin((coastalShelf + elev) * 36.0);
              vec3 oceanCol = mix(trenchBlue, abyssalPlain, smoothstep(0.0, 0.12, elev));
              oceanCol = mix(oceanCol, continentalSlope, coastalShelf * 0.72);
              oceanCol *= 0.82 + 0.18 * bathyContour;
              oceanCol *= 0.45 + 0.65 * reliefLight;

              // Hypsometric elevation tinting (Lowland Emerald -> Upland Olive -> Ochre Plateau -> Umber Ridge -> Snow Summit)
              vec3 lowlandGreen = vec3(0.16, 0.46, 0.28);
              vec3 uplandOlive = vec3(0.48, 0.58, 0.26);
              vec3 plateauOchre = vec3(0.76, 0.59, 0.32);
              vec3 mountainUmber = vec3(0.54, 0.31, 0.18);
              vec3 alpineSummit = vec3(0.94, 0.95, 0.97);

              vec3 hypso = mix(lowlandGreen, uplandOlive, smoothstep(0.14, 0.34, elev));
              hypso = mix(hypso, plateauOchre, smoothstep(0.34, 0.54, elev));
              hypso = mix(hypso, mountainUmber, smoothstep(0.54, 0.76, elev));
              hypso = mix(hypso, alpineSummit, smoothstep(0.76, 0.91, elev));

              // Topographic elevation contour lines + strong 3D hillshade
              float topoContour = smoothstep(0.82, 0.96, abs(sin(elev * 56.0)));
              hypso = mix(hypso, hypso * 0.72, topoContour * 0.45);
              float hillshade = 0.24 + 0.95 * pow(reliefLight, 0.92);
              vec3 landCol = hypso * hillshade * (0.88 + 0.24 * micro);

              surface = mix(oceanCol, landCol, smoothstep(0.1, 0.75, land));
              surface = mix(surface, uSelectedColor, selected * 0.35);
              surface = mix(surface, uHoverColor, hovered * 0.25);

              surface += uAtmosColor * fresnel * 0.36 * uShowAtmosphere;
            } else {
              // MODE 4: NIGHT-SIDE EARTH (Tungi Yer) — Nocturnal planet with glowing golden city light clusters
              vec3 nightOceanDeep = vec3(0.005, 0.014, 0.042);
              vec3 nightOceanMid = vec3(0.016, 0.038, 0.095);
              vec3 nightLandBase = vec3(0.028, 0.056, 0.125);
              vec3 nightMountain = vec3(0.048, 0.086, 0.175);

              float moonLight = 0.25 + 0.75 * reliefLight;
              vec3 oceanCol = mix(nightOceanDeep, nightOceanMid, moonLight * 0.65 + coastalShelf * 0.2);
              oceanCol += vec3(0.15, 0.28, 0.55) * specWater * 0.14;

              vec3 landCol = mix(nightLandBase, nightMountain, smoothstep(0.3, 0.8, elev)) * (0.65 + 0.55 * moonLight);

              // High-resolution urban street grid & metropolitan highway filaments
              float cityGrid1 = 0.5 + 0.5 * sin(vWorldPos.x * 210.0 + cos(vWorldPos.z * 195.0));
              float cityGrid2 = 0.5 + 0.5 * cos(vWorldPos.y * 230.0 + sin(vWorldPos.x * 180.0));
              float urbanSparkle = pow(cityGrid1 * cityGrid2, 1.35);

              float cityMask = land * smoothstep(0.04, 0.88, nightLights);
              float metroCore = land * pow(nightLights, 2.2);
              float highwayNet = land * smoothstep(0.12, 0.55, nightLights) * smoothstep(0.28, 0.78, micro);

              vec3 amberOuter = vec3(0.96, 0.52, 0.08);
              vec3 goldMid = vec3(1.0, 0.76, 0.22);
              vec3 whiteHotCore = vec3(1.0, 0.96, 0.84);

              vec3 cityGlow =
                amberOuter * (cityMask * (0.55 + 0.65 * urbanSparkle) + highwayNet * 0.45) +
                goldMid * (cityMask * urbanSparkle * 1.15) +
                whiteHotCore * (metroCore * 1.35);

              landCol += cityGlow;

              surface = mix(oceanCol, landCol, smoothstep(0.1, 0.75, land));
              surface = mix(surface, uDestGlow * 0.45, dest * 0.16);
              surface = mix(surface, uSelectedColor * 0.65, selected * 0.38);
              surface = mix(surface, uHoverColor * 0.55, hovered * 0.28);

              // Nocturnal indigo-blue atmospheric limb glow
              vec3 nightAtmos = mix(vec3(0.18, 0.38, 0.88), vec3(0.38, 0.62, 1.0), fresnel);
              surface += nightAtmos * fresnel * 0.64 * uShowAtmosphere;
            }

            gl_FragColor = vec4(surface, 1.0);
          }
        `,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      globeGroup.add(coreMesh);

      // 3b. Volumetric 3D Cloud Sphere Layer (`cloudSphereMesh` at radius 1.0145)
      const cloudSphereGeo = new THREE.SphereGeometry(1.0145, 72, 48);
      const cloudSphereMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uModeType: { value: initialPreset.modeType },
        },
        vertexShader: `
          varying vec3 vPos;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            vPos = position;
            vNormalView = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uModeType;
          varying vec3 vPos;
          varying vec3 vNormalView;
          varying vec3 vViewPos;

          float cloudFbm(vec3 p) {
            vec3 q = p * 3.2 + vec3(uTime * 0.012, 0.0, -uTime * 0.009);
            float c1 = sin(q.x * 2.4 + cos(q.z * 2.7)) * cos(q.y * 3.1 + sin(q.x * 2.2));
            float c2 = sin(q.z * 5.3 - q.x * 4.8) * cos(q.y * 5.7 + q.z * 4.1) * 0.52;
            float c3 = sin(q.x * 11.2 + q.y * 9.8 - q.z * 10.4) * 0.26;
            float c4 = cos(q.z * 21.0 - q.y * 19.5 + q.x * 18.0) * 0.13;
            return 0.5 + 0.32 * (c1 + c2 + c3 + c4);
          }

          void main() {
            vec3 viewDir = normalize(vViewPos);
            vec3 n = normalize(vNormalView);
            float ndotv = clamp(dot(n, viewDir), 0.0, 1.0);

            float rawCloud = cloudFbm(normalize(vPos));
            // Equatorial & mid-latitude cyclone weather bands
            float latBand = 0.85 + 0.25 * cos(vPos.y * 5.5);
            float density = smoothstep(0.47, 0.78, rawCloud * latBand);
            if (density < 0.01) discard;

            vec3 sunDir = normalize(vec3(0.52, 0.48, 0.71));
            float sunLight = clamp(dot(n, sunDir), 0.0, 1.0);

            vec3 dayCloud = mix(vec3(0.72, 0.81, 0.92), vec3(0.98, 0.99, 1.0), 0.35 + 0.65 * sunLight);
            vec3 nightCloud = mix(vec3(0.12, 0.18, 0.32), vec3(0.32, 0.42, 0.62), sunLight);
            vec3 cloudCol = uModeType > 3.5 ? nightCloud : dayCloud;

            float limbFade = smoothstep(0.02, 0.28, ndotv);
            float alpha = density * limbFade * (uModeType > 3.5 ? 0.38 : 0.64);
            gl_FragColor = vec4(cloudCol, alpha);
          }
        `,
      });
      const cloudSphereMesh = new THREE.Mesh(cloudSphereGeo, cloudSphereMat);
      cloudSphereMesh.visible = Boolean(propsRef.current.showClouds);
      globeGroup.add(cloudSphereMesh);

      // 4. Dotted Continents Point Cloud (`THREE.Points`)
      const regionAttr = new Float32Array(cloudData.count);
      const cloudGeo = new THREE.BufferGeometry();
      cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudData.positions, 3));
      cloudGeo.setAttribute('aSeed', new THREE.BufferAttribute(cloudData.seeds, 1));
      cloudGeo.setAttribute('aLat', new THREE.BufferAttribute(cloudData.lats, 1));
      const regionBufferAttr = new THREE.BufferAttribute(regionAttr, 1);
      cloudGeo.setAttribute('aRegion', regionBufferAttr);

      const cloudMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uPointScale: { value: initialPreset.pointSizeScale },
          uScanIntensity: { value: initialPreset.scanlineIntensity },
          uDotBase: { value: new THREE.Color(initialPreset.dotBaseHex) },
          uDotSecondary: { value: new THREE.Color(initialPreset.dotSecondaryHex) },
          uDestColor: { value: new THREE.Color(initialPreset.destHighlightHex) },
          uSelectedColor: { value: new THREE.Color(initialPreset.selectedHex) },
          uHoverColor: { value: new THREE.Color(initialPreset.hoverHex) },
        },
        vertexShader: `
          attribute float aSeed;
          attribute float aLat;
          attribute float aRegion;

          uniform float uPixelRatio;
          uniform float uPointScale;

          varying float vSeed;
          varying float vLat;
          varying float vRegion;
          varying float vFacing;

          void main() {
            vSeed = aSeed;
            vLat = aLat;
            vRegion = aRegion;

            vec3 nView = normalize(normalMatrix * normalize(position));
            vFacing = nView.z;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float regionBoost = aRegion >= 1.5 ? 1.42 : (aRegion >= 0.5 ? 1.22 : 1.0);
            float size = 7.4 * uPointScale * regionBoost * uPixelRatio * (1.0 / max(0.8, -mvPosition.z));
            gl_PointSize = clamp(size, 1.35, 8.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uScanIntensity;
          uniform vec3 uDotBase;
          uniform vec3 uDotSecondary;
          uniform vec3 uDestColor;
          uniform vec3 uSelectedColor;
          uniform vec3 uHoverColor;

          varying float vSeed;
          varying float vLat;
          varying float vRegion;
          varying float vFacing;

          void main() {
            if (vFacing < -0.05) discard;
            vec2 c = gl_PointCoord - vec2(0.5);
            float dist = length(c);
            if (dist > 0.5) discard;

            float alpha = smoothstep(0.5, 0.14, dist);

            // Base luminous cyan-to-ice-blue gradient
            vec3 col = mix(uDotBase, uDotSecondary, vSeed);

            // Selective highlights for catalog destinations & selected country (preserve cyan Digital Earth look)
            if (vRegion > 2.5) {
              col = uHoverColor;
            } else if (vRegion > 1.5) {
              col = uSelectedColor;
            } else if (vRegion > 0.5) {
              col = mix(uDotSecondary, uDestColor, 0.28);
            }

            // Smooth horizontal scanline wave modulation
            float scanWave = 0.5 + 0.5 * sin(vLat * 185.0 + uTime * 0.65);
            float scanBoost = mix(1.0, 0.68 + 0.36 * scanWave, uScanIntensity);
            float rimFade = smoothstep(-0.05, 0.35, vFacing);

            gl_FragColor = vec4(col * (0.78 + 0.32 * vSeed) * scanBoost, alpha * rimFade * 0.94);
          }
        `,
      });
      const dotCloud = new THREE.Points(cloudGeo, cloudMat);
      dotCloud.visible = initialPreset.showDots;
      globeGroup.add(dotCloud);

      // 5. Country Border Lines (`THREE.LineSegments`)
      const borderGeo = new THREE.BufferGeometry();
      borderGeo.setAttribute('position', new THREE.BufferAttribute(borderData.positions, 3));
      const borderMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(initialPreset.borderHex),
        transparent: true,
        opacity: initialPreset.borderOpacity,
      });
      const borderLines = new THREE.LineSegments(borderGeo, borderMat);
      globeGroup.add(borderLines);

      // Selected Country Luminous Outline
      const selectedBorderGeo = new THREE.BufferGeometry();
      selectedBorderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      const selectedBorderMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(initialPreset.selectedHex),
        transparent: true,
        opacity: 0.95,
      });
      const selectedBorderLines = new THREE.LineSegments(selectedBorderGeo, selectedBorderMat);
      selectedBorderLines.scale.setScalar(1.0028);
      globeGroup.add(selectedBorderLines);

      // Hovered Country Luminous Outline
      const hoverBorderGeo = new THREE.BufferGeometry();
      hoverBorderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      const hoverBorderMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(initialPreset.hoverHex),
        transparent: true,
        opacity: 0.85,
      });
      const hoverBorderLines = new THREE.LineSegments(hoverBorderGeo, hoverBorderMat);
      hoverBorderLines.scale.setScalar(1.0022);
      globeGroup.add(hoverBorderLines);

      // 6. Graticule Coordinate Grid + Equator & Prime Meridian
      const gridGeo = new THREE.BufferGeometry();
      gridGeo.setAttribute('position', new THREE.BufferAttribute(graticuleData.gridPositions, 3));
      const gridMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#0f426e'),
        transparent: true,
        opacity: 0.28,
      });
      const gridLines = new THREE.LineSegments(gridGeo, gridMat);
      gridLines.visible = propsRef.current.showGrid;
      globeGroup.add(gridLines);

      const refGeo = new THREE.BufferGeometry();
      refGeo.setAttribute(
        'position',
        new THREE.BufferAttribute(graticuleData.referencePositions, 3)
      );
      const refMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#22d3ee'),
        transparent: true,
        opacity: 0.36,
      });
      const referenceLines = new THREE.LineSegments(refGeo, refMat);
      referenceLines.visible = propsRef.current.showEquatorMeridian;
      globeGroup.add(referenceLines);

      // 7. Outer Atmospheric Fresnel Rim Halo (`BackSide`)
      const atmosGeo = new THREE.SphereGeometry(1.135, 64, 48);
      const atmosMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uAtmosColor: { value: new THREE.Color(initialPreset.atmosphereHex) },
          uAtmosAccent: { value: new THREE.Color(initialPreset.atmosphereAccentHex) },
          uIntensity: { value: initialPreset.atmosphereIntensity },
        },
        vertexShader: `
          varying vec3 vNormalView;
          void main() {
            vNormalView = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uAtmosColor;
          uniform vec3 uAtmosAccent;
          uniform float uIntensity;
          varying vec3 vNormalView;
          void main() {
            float rim = pow(clamp(0.64 - vNormalView.z, 0.0, 1.0), 3.4);
            vec3 glow = mix(uAtmosColor, uAtmosAccent, rim * 0.28);
            gl_FragColor = vec4(glow, rim * 0.62 * uIntensity);
          }
        `,
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      globeGroup.add(atmosMesh);

      // 8. Spherical City Markers Group
      const markersGroup = new THREE.Group();
      globeGroup.add(markersGroup);
      const markerHitTargets: THREE.Mesh[] = [];
      const markerEntries: Array<{
        city: CityRecord;
        worldPos: THREE.Vector3;
        normal: THREE.Vector3;
        coreMat: THREE.MeshBasicMaterial;
        ringMat: THREE.MeshBasicMaterial;
        ringMesh: THREE.Mesh;
      }> = [];

      const cityCoreGeo = new THREE.SphereGeometry(0.011, 12, 12);
      const cityRingGeo = new THREE.RingGeometry(0.016, 0.024, 24);
      const cityHitGeo = new THREE.SphereGeometry(0.036, 8, 8);
      const hitHiddenMat = new THREE.MeshBasicMaterial({ visible: false });

      const buildCityMarkers = () => {
        // Dispose old marker materials/meshes
        for (const item of markerEntries) {
          item.coreMat.dispose();
          item.ringMat.dispose();
        }
        markerEntries.length = 0;
        markerHitTargets.length = 0;
        markersGroup.clear();

        const { cities: curCities, selectedCountryCode: selCode, filteredCountryCodes: filt } =
          propsRef.current;

        for (const city of curCities) {
          const [cx, cy, cz] = latLonToVector3Tuple(city.latitude, city.longitude, 1.011);
          const pos = new THREE.Vector3(cx, cy, cz);
          const normal = pos.clone().normalize();

          const isSelectedCountry = city.countryCode === selCode;
          const isMatch = filt.has(city.countryCode);

          const baseColor = isSelectedCountry
            ? '#4ade80'
            : isMatch
            ? '#38bdf8'
            : '#1e4e6e';

          const cMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(baseColor),
            transparent: true,
            opacity: isMatch || isSelectedCountry ? 0.96 : 0.4,
          });
          const cMesh = new THREE.Mesh(cityCoreGeo, cMat);
          cMesh.position.copy(pos);
          if (isSelectedCountry) cMesh.scale.setScalar(1.25);

          const rMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(isSelectedCountry ? '#86efac' : '#7dd3fc'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isSelectedCountry ? 0.78 : isMatch ? 0.45 : 0.16,
            depthWrite: false,
          });
          const rMesh = new THREE.Mesh(cityRingGeo, rMat);
          rMesh.position.copy(pos).multiplyScalar(1.001);
          rMesh.lookAt(normal.clone().multiplyScalar(2.0));

          const hitMesh = new THREE.Mesh(cityHitGeo, hitHiddenMat);
          hitMesh.position.copy(pos);
          hitMesh.userData = { city };
          markerHitTargets.push(hitMesh);

          markersGroup.add(cMesh, rMesh, hitMesh);
          markerEntries.push({
            city,
            worldPos: pos,
            normal,
            coreMat: cMat,
            ringMat: rMat,
            ringMesh: rMesh,
          });
        }
      };

      buildCityMarkers();

      // 8b. Spherical University Campus Location Markers
      const uniMarkersGroup = new THREE.Group();
      globeGroup.add(uniMarkersGroup);
      const uniMarkerHitTargets: THREE.Mesh[] = [];
      const uniMarkerMats: THREE.Material[] = [];
      const uniMarkerEntries: Array<{
        item: GlobeUniversityMarker;
        worldPos: THREE.Vector3;
        normal: THREE.Vector3;
        beaconMesh: THREE.Mesh;
        ringMesh: THREE.Mesh;
      }> = [];
      const uniBeaconGeo = new THREE.SphereGeometry(0.0075, 12, 12);
      const uniBeaconRingGeo = new THREE.RingGeometry(0.011, 0.015, 24);
      const uniHitGeo = new THREE.SphereGeometry(0.038, 8, 8);

      const buildUniversityMarkers = () => {
        for (const m of uniMarkerMats) m.dispose();
        uniMarkerMats.length = 0;
        uniMarkerHitTargets.length = 0;
        uniMarkerEntries.length = 0;
        uniMarkersGroup.clear();

        const list = propsRef.current.universityMarkers || [];
        for (const item of list) {
          const [ux, uy, uz] = latLonToVector3Tuple(item.latitude, item.longitude, 1.015);
          const pos = new THREE.Vector3(ux, uy, uz);
          const normal = pos.clone().normalize();

          const isSelected = Boolean(item.isSelected);
          const bMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(isSelected ? '#67e8f9' : '#38bdf8'),
            transparent: true,
            opacity: isSelected ? 1.0 : 0.9,
          });
          const bMesh = new THREE.Mesh(uniBeaconGeo, bMat);
          bMesh.position.copy(pos);
          if (isSelected) bMesh.scale.setScalar(1.25);

          const rMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#67e8f9'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isSelected ? 0.65 : 0.0,
            depthWrite: false,
          });
          const rMesh = new THREE.Mesh(uniBeaconRingGeo, rMat);
          rMesh.position.copy(pos);
          rMesh.lookAt(normal.clone().multiplyScalar(2.0));
          rMesh.visible = isSelected;

          const hitMesh = new THREE.Mesh(uniHitGeo, hitHiddenMat);
          hitMesh.position.copy(pos);
          hitMesh.userData = { uniMarker: item };
          uniMarkerHitTargets.push(hitMesh);

          uniMarkerMats.push(bMat, rMat);
          uniMarkersGroup.add(bMesh, rMesh, hitMesh);
          uniMarkerEntries.push({
            item,
            worldPos: pos,
            normal,
            beaconMesh: bMesh,
            ringMesh: rMesh,
          });
        }
      };

      buildUniversityMarkers();

      // Hover state & highlight updating
      let hoveredFeatureIdx = -1;

      const copyFeatureBorderInto = (
        targetGeo: THREE.BufferGeometry,
        featIdx: number
      ) => {
        if (featIdx < 0 || featIdx >= borderData.featureRanges.length) {
          targetGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
          return;
        }
        const range = borderData.featureRanges[featIdx];
        const slice = borderData.positions.subarray(
          range.startVertex * 3,
          (range.startVertex + range.vertexCount) * 3
        );
        targetGeo.setAttribute('position', new THREE.BufferAttribute(slice, 3));
        targetGeo.computeBoundingSphere();
      };

      const refreshHighlights = () => {
        const { selectedCountryCode: selIso, filteredCountryCodes: filt } = propsRef.current;
        const selectedFeatIdx =
          selIso && featureIndexByIsoRef.current[selIso] !== undefined
            ? featureIndexByIsoRef.current[selIso]
            : -1;

        // 1) Update offscreen RGBA mask canvas (R=land, G=dest, B=selected)
        maskCtx.clearRect(0, 0, 1024, 512);
        maskCtx.drawImage(landBaseCanvas, 0, 0);

        // Paint filtered study destination features & selected world country in Green/Blue channels
        maskCtx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < worldFeatures.length; i++) {
          const matched = numericLookupRef.current[worldFeatures[i].numericId];
          const isMatch = matched && filt.has(matched.isoCode);
          const isSelected = i === selectedFeatIdx || (matched && matched.isoCode === selIso);
          const isHovered = i === hoveredFeatureIdx;

          if (!isMatch && !isSelected && !isHovered) continue;

          const r = 255;
          const g = isMatch ? 255 : 0;
          const b = isSelected ? 255 : 0;
          maskCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
          maskCtx.beginPath();
          maskPath(worldFeatures[i] as never);
          maskCtx.fill();
        }
        maskTexture.needsUpdate = true;

        // 2) Update dotted cloud region attribute
        const attrArr = regionBufferAttr.array as Float32Array;
        for (let i = 0; i < cloudData.count; i++) {
          const fIdx = cloudData.featureIndices[i];
          const matched = numericLookupRef.current[worldFeatures[fIdx]?.numericId];
          if (fIdx === hoveredFeatureIdx) {
            attrArr[i] = 3.0;
          } else if (fIdx === selectedFeatIdx || (matched && matched.isoCode === selIso)) {
            attrArr[i] = 2.0;
          } else if (matched && filt.has(matched.isoCode)) {
            attrArr[i] = 1.0;
          } else {
            attrArr[i] = 0.0;
          }
        }
        regionBufferAttr.needsUpdate = true;

        // 3) Update selected & hovered border outlines
        copyFeatureBorderInto(selectedBorderGeo, selectedFeatIdx);
        copyFeatureBorderInto(
          hoverBorderGeo,
          hoveredFeatureIdx !== selectedFeatIdx ? hoveredFeatureIdx : -1
        );
      };

      const refreshVisualMode = () => {
        const p = GLOBE_VISUAL_PRESETS[propsRef.current.visualMode];
        const reliefEnabled = Boolean(propsRef.current.showTerrainRelief);
        coreMat.uniforms.uModeType.value = p.modeType;
        coreMat.uniforms.uTerrainScale.value = computeTerrainScale(p, reliefEnabled);
        coreMat.uniforms.uReliefStrength.value = computeReliefStrength(p, reliefEnabled);
        coreMat.uniforms.uOceanDeep.value.set(p.oceanDeep);
        coreMat.uniforms.uOceanMid.value.set(p.oceanMid);
        coreMat.uniforms.uLandBase.value.set(p.landBase);
        coreMat.uniforms.uDestGlow.value.set(p.destHighlightHex);
        coreMat.uniforms.uSelectedColor.value.set(p.selectedHex);
        coreMat.uniforms.uHoverColor.value.set(p.hoverHex);
        coreMat.uniforms.uAtmosColor.value.set(p.atmosphereHex);
        coreMat.uniforms.uScanIntensity.value = p.scanlineIntensity;

        cloudSphereMat.uniforms.uModeType.value = p.modeType;

        dotCloud.visible = p.showDots;
        cloudMat.uniforms.uPointScale.value = p.pointSizeScale;
        cloudMat.uniforms.uScanIntensity.value = p.scanlineIntensity;
        cloudMat.uniforms.uDotBase.value.set(p.dotBaseHex);
        cloudMat.uniforms.uDotSecondary.value.set(p.dotSecondaryHex);
        cloudMat.uniforms.uDestColor.value.set(p.destHighlightHex);
        cloudMat.uniforms.uSelectedColor.value.set(p.selectedHex);
        cloudMat.uniforms.uHoverColor.value.set(p.hoverHex);

        borderMat.color.set(p.borderHex);
        borderMat.opacity = p.borderOpacity;
        selectedBorderMat.color.set(p.selectedHex);
        hoverBorderMat.color.set(p.hoverHex);

        atmosMat.uniforms.uAtmosColor.value.set(p.atmosphereHex);
        atmosMat.uniforms.uAtmosAccent.value.set(p.atmosphereAccentHex);
        atmosMat.uniforms.uIntensity.value = p.atmosphereIntensity;
        renderer.render(scene, camera);
      };

      const refreshLayers = () => {
        const p = GLOBE_VISUAL_PRESETS[propsRef.current.visualMode];
        const reliefEnabled = Boolean(propsRef.current.showTerrainRelief);

        gridLines.visible = Boolean(propsRef.current.showGrid);
        referenceLines.visible = Boolean(propsRef.current.showEquatorMeridian);
        markersGroup.visible = Boolean(propsRef.current.showCityMarkers);
        uniMarkersGroup.visible = Boolean(propsRef.current.showUniversityMarkers);

        // Country borders visibility responds to Country Borders layer toggle (while selected/hover outlines stay active)
        borderLines.visible = Boolean(propsRef.current.showCountryLabels);

        // Clouds layer visibility
        const cloudsActive = Boolean(propsRef.current.showClouds);
        cloudSphereMesh.visible = cloudsActive;
        coreMat.uniforms.uShowClouds.value = cloudsActive ? 1.0 : 0.0;

        // Atmosphere layer visibility
        const atmosActive = Boolean(propsRef.current.showAtmosphere);
        atmosMesh.visible = atmosActive;
        coreMat.uniforms.uShowAtmosphere.value = atmosActive ? 1.0 : 0.0;

        // 3D Terrain Elevation displacement & relief normal strength
        const tScale = computeTerrainScale(p, reliefEnabled);
        coreMat.uniforms.uTerrainScale.value = tScale;
        coreMat.uniforms.uReliefStrength.value = computeReliefStrength(p, reliefEnabled);

        // Lift borders slightly when 3D terrain relief is active so mountain ridges don't clip border lines
        const borderLift = 1.0 + tScale * 0.65;
        borderLines.scale.setScalar(borderLift);
        selectedBorderLines.scale.setScalar(borderLift + 0.0028);
        hoverBorderLines.scale.setScalar(borderLift + 0.0022);
        renderer.render(scene, camera);
      };

      // Smooth Fly-To & Camera Zoom state
      let flyTargetDir: THREE.Vector3 | null = null;
      let flyTargetDist: number | null = null;
      let lastUserInteractionAt = 0;

      const flyToLatLon = (lat: number, lon: number, targetDist?: number) => {
        const [tx, ty, tz] = latLonToVector3Tuple(lat, lon, 1);
        flyTargetDir = new THREE.Vector3(tx, ty, tz).normalize();
        flyTargetDist =
          targetDist !== undefined
            ? THREE.MathUtils.clamp(targetDist, MIN_CAMERA_DIST, MAX_CAMERA_DIST)
            : THREE.MathUtils.clamp(camera.position.length(), 1.65, 2.35);
      };

      controls.addEventListener('start', () => {
        lastUserInteractionAt = performance.now();
        flyTargetDir = null;
        flyTargetDist = null;
      });

      sceneControlRef.current = {
        setDistanceDelta: (factor: number) => {
          lastUserInteractionAt = performance.now();
          const currentDist = flyTargetDist ?? camera.position.length();
          if (!flyTargetDir) {
            flyTargetDir = _vecA.copy(camera.position).normalize().clone();
          }
          flyTargetDist = THREE.MathUtils.clamp(
            currentDist * factor,
            MIN_CAMERA_DIST,
            MAX_CAMERA_DIST
          );
        },
        resetCamera: () => {
          flyToLatLon(INITIAL_LAT, INITIAL_LON, DEFAULT_CAMERA_DIST);
        },
        flyToFeature: (featIdx: number, zoomDist?: number) => {
          const feat = worldFeatures[featIdx];
          if (!feat) return;
          flyToLatLon(feat.centroid[1], feat.centroid[0], zoomDist ?? 2.3);
        },
        flyToCoords: (lat: number, lon: number, zoomDist?: number) => {
          flyToLatLon(lat, lon, zoomDist ?? 1.92);
        },
        refreshHighlights,
        refreshVisualMode,
        refreshLayers,
        syncCities: () => {
          buildCityMarkers();
          lastHudSignature = '';
        },
        syncUniversityMarkers: () => {
          buildUniversityMarkers();
          lastHudSignature = '';
          renderer.render(scene, camera);
        },
      };

      refreshHighlights();
      refreshVisualMode();
      refreshLayers();

      // Raycasting for country hover/click + city hover/click
      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();
      let pointerDownPos: { x: number; y: number } | null = null;
      let lastHoverRaycastAt = 0;

      const updatePointerNDC = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        pointerNDC.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointerNDC.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
        return {
          localX: clientX - rect.left,
          localY: clientY - rect.top,
        };
      };

      const onPointerDown = (e: PointerEvent) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
        lastUserInteractionAt = performance.now();
      };

      const onPointerMove = (e: PointerEvent) => {
        const now = performance.now();
        if (now - lastHoverRaycastAt < 40) return;
        lastHoverRaycastAt = now;

        const { localX, localY } = updatePointerNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNDC, camera);

        // 1. Check visible university location beacons first (click-to-reveal only; no hover name tooltip)
        if (propsRef.current.showUniversityMarkers && uniMarkerHitTargets.length > 0) {
          const uniHits = raycaster.intersectObjects(uniMarkerHitTargets, false);
          if (uniHits.length > 0) {
            const hitUni = uniHits[0].object.userData?.uniMarker as GlobeUniversityMarker | undefined;
            if (hitUni) {
              _normal.copy(uniHits[0].object.position).normalize();
              if (_normal.dot(_vecA.copy(camera.position).normalize()) > 0.05) {
                canvas.style.cursor = 'pointer';
                setHoveredInfo(null);
                return;
              }
            }
          }
        }

        // 2. Check visible city markers
        if (propsRef.current.showCityMarkers && markerHitTargets.length > 0) {
          const cityHits = raycaster.intersectObjects(markerHitTargets, false);
          if (cityHits.length > 0) {
            const hitCity = cityHits[0].object.userData?.city as CityRecord | undefined;
            if (hitCity) {
              // Ensure city is on front hemisphere relative to camera
              _normal.copy(cityHits[0].object.position).normalize();
              if (_normal.dot(_vecA.copy(camera.position).normalize()) > 0.05) {
                const count = propsRef.current.universityCountByCity[hitCity.slug] || 0;
                const country = propsRef.current.countries.find(
                  (c) => c.isoCode === hitCity.countryCode
                );
                const unitLabel =
                  count === 1
                    ? propsRef.current.uiStrings?.verifiedUnisSingular || 'verified university'
                    : propsRef.current.uiStrings?.verifiedUnisPlural || 'verified universities';
                canvas.style.cursor = 'pointer';
                setHoveredInfo({
                  title: `${hitCity.name}${country ? `, ${country.name}` : ''}`,
                  subtitle: `${count} ${unitLabel}`,
                  isCity: true,
                  screenX: localX,
                  screenY: localY,
                });
                if (hoveredFeatureIdx !== -1) {
                  hoveredFeatureIdx = -1;
                  refreshHighlights();
                }
                return;
              }
            }
          }
        }

        // 3. Check globe sphere for country lookup (all 177 territories supported!)
        const sphereHits = raycaster.intersectObject(coreMesh, false);
        if (sphereHits.length > 0) {
          const pt = sphereHits[0].point;
          const [lat, lon] = vector3ToLatLon(pt.x, pt.y, pt.z);
          const fIdx = lookupFeatureIndexAtLatLon(lookupGrid, lat, lon);

          if (fIdx >= 0) {
            const feat = worldFeatures[fIdx] as WorldCountryFeature;
            const matched = numericLookupRef.current[feat.numericId];
            const worldMeta = resolveTerritoryMeta(feat.numericId, feat.properties?.name);
            if (fIdx !== hoveredFeatureIdx) {
              hoveredFeatureIdx = fIdx;
              refreshHighlights();
            }
            if (matched) {
              const uniCount = propsRef.current.universityCountByCountry[matched.isoCode] || 0;
              const unitLabel =
                uniCount === 1
                  ? propsRef.current.uiStrings?.verifiedUnisSingular || 'verified university'
                  : propsRef.current.uiStrings?.verifiedUnisPlural || 'verified universities';
              canvas.style.cursor = 'pointer';
              setHoveredInfo({
                title: `${matched.flagEmoji} ${matched.name}`,
                subtitle: `${uniCount} ${unitLabel}`,
                isCatalogCountry: true,
                screenX: localX,
                screenY: localY,
              });
            } else if (worldMeta) {
              canvas.style.cursor = 'pointer';
              setHoveredInfo({
                title: `${worldMeta.flagEmoji} ${worldMeta.name}`,
                subtitle:
                  propsRef.current.uiStrings?.exploreCountryHint ||
                  'Click to discover leading universities',
                isCatalogCountry: false,
                screenX: localX,
                screenY: localY,
              });
            } else {
              canvas.style.cursor = 'grab';
              setHoveredInfo({
                title: feat.properties?.name || 'Territory',
                isCatalogCountry: false,
                screenX: localX,
                screenY: localY,
              });
            }
            return;
          }
        }

        // Empty ocean or space
        canvas.style.cursor = 'grab';
        setHoveredInfo(null);
        if (hoveredFeatureIdx !== -1) {
          hoveredFeatureIdx = -1;
          refreshHighlights();
        }
      };

      const onPointerLeave = () => {
        setHoveredInfo(null);
        if (hoveredFeatureIdx !== -1) {
          hoveredFeatureIdx = -1;
          refreshHighlights();
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!pointerDownPos) return;
        const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        pointerDownPos = null;
        if (moved >= 6) return; // user was dragging/rotating globe

        updatePointerNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNDC, camera);

        // 1. University location marker click
        if (propsRef.current.showUniversityMarkers && uniMarkerHitTargets.length > 0) {
          const uniHits = raycaster.intersectObjects(uniMarkerHitTargets, false);
          if (uniHits.length > 0) {
            const hitUni = uniHits[0].object.userData?.uniMarker as GlobeUniversityMarker | undefined;
            if (hitUni) {
              _normal.copy(uniHits[0].object.position).normalize();
              if (_normal.dot(_vecA.copy(camera.position).normalize()) > 0.05) {
                propsRef.current.onSelectUniversityMarker?.(hitUni.slug);
                flyToLatLon(hitUni.latitude, hitUni.longitude, 1.92);
                return;
              }
            }
          }
        }

        // 2. City marker click
        if (propsRef.current.showCityMarkers && markerHitTargets.length > 0) {
          const cityHits = raycaster.intersectObjects(markerHitTargets, false);
          if (cityHits.length > 0) {
            const hitCity = cityHits[0].object.userData?.city as CityRecord | undefined;
            if (hitCity) {
              _normal.copy(cityHits[0].object.position).normalize();
              if (_normal.dot(_vecA.copy(camera.position).normalize()) > 0.05) {
                propsRef.current.onSelectCity(hitCity);
                return;
              }
            }
          }
        }

        // 3. Globe country click (catalog OR any world country)
        const sphereHits = raycaster.intersectObject(coreMesh, false);
        if (sphereHits.length > 0) {
          const pt = sphereHits[0].point;
          const [lat, lon] = vector3ToLatLon(pt.x, pt.y, pt.z);
          const fIdx = lookupFeatureIndexAtLatLon(lookupGrid, lat, lon);
          if (fIdx >= 0) {
            const feat = worldFeatures[fIdx];
            const matched = numericLookupRef.current[feat.numericId];
            if (matched) {
              propsRef.current.onSelectCountry(matched.isoCode);
              flyToLatLon(feat.centroid[1], feat.centroid[0], 2.08);
            } else {
              const worldMeta = resolveTerritoryMeta(feat.numericId, feat.properties?.name);
              if (worldMeta) {
                propsRef.current.onSelectWorldCountry?.(worldMeta);
                flyToLatLon(feat.centroid[1], feat.centroid[0], 2.12);
              }
            }
            return;
          }
        }

        // Empty ocean or space click clears active university label selection
        propsRef.current.onClearSelection?.();
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('pointerup', onPointerUp);

      // Render loop with software-WebGL pacing guard
      let disposed = false;
      let lastHudSignature = '';
      let lastObservedW = initWidth;
      let lastObservedH = initHeight;
      let resizeRafId = 0;

      const applyResize = () => {
        if (disposed || !container) return;
        const w = Math.max(280, container.clientWidth);
        const h = Math.max(320, container.clientHeight);
        if (w === lastObservedW && h === lastObservedH) return;
        lastObservedW = w;
        lastObservedH = h;
        containerWidthRef.current = w;
        const aspect = w / h;
        camera.fov = aspect < 0.95 ? 48 : 41;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        renderer.render(scene, camera);
        lastHudSignature = '';
      };

      const scheduleResize = () => {
        if (disposed) return;
        cancelAnimationFrame(resizeRafId);
        resizeRafId = requestAnimationFrame(applyResize);
      };

      const resizeObserver = new ResizeObserver(scheduleResize);
      resizeObserver.observe(container);

      let frameId = 0;
      let lastTime = performance.now();
      let lastHudUpdate = 0;
      let lastReportedZoom = -1;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.06, (now - lastTime) / 1000);
        lastTime = now;
        const elapsed = now * 0.001;

        coreMat.uniforms.uTime.value = elapsed;
        cloudMat.uniforms.uTime.value = elapsed;
        cloudSphereMat.uniforms.uTime.value = elapsed;

        // Subtle marker ring pulse on active country city markers
        for (let i = 0; i < markerEntries.length; i++) {
          const entry = markerEntries[i];
          const isActive = entry.city.countryCode === propsRef.current.selectedCountryCode;
          if (isActive) {
            const pulse = 1.0 + 0.35 * Math.sin(elapsed * 2.6 + i);
            entry.ringMesh.scale.setScalar(pulse);
          } else {
            entry.ringMesh.scale.setScalar(1.0);
          }
        }

        // Subtle selection ring pulse ONLY on the currently selected 3D university marker
        for (let i = 0; i < uniMarkerEntries.length; i++) {
          const uEntry = uniMarkerEntries[i];
          if (uEntry.item.isSelected) {
            const pulse = 1.08 + 0.18 * Math.sin(elapsed * 2.8);
            uEntry.ringMesh.scale.setScalar(pulse);
          } else {
            uEntry.ringMesh.scale.setScalar(1.0);
          }
        }

        // Smooth camera fly-to transition
        if (flyTargetDir && flyTargetDist !== null) {
          const curDist = camera.position.length();
          const curDir = _vecA.copy(camera.position).normalize();
          const alpha = 1 - Math.exp(-5.2 * dt);
          curDir.lerp(flyTargetDir, alpha).normalize();
          const nextDist = THREE.MathUtils.damp(curDist, flyTargetDist, 5.2, dt);
          camera.position.copy(curDir).multiplyScalar(nextDist);
          camera.lookAt(0, 0, 0);

          if (curDir.distanceTo(flyTargetDir) < 0.004 && Math.abs(nextDist - flyTargetDist) < 0.006) {
            flyTargetDir = null;
            flyTargetDist = null;
          }
        } else if (
          propsRef.current.autoRotate &&
          now - lastUserInteractionAt > 2600 &&
          !isSoftwareGl
        ) {
          // Gentle slow continuous orbit around Y axis (earth spin sensation)
          const rotAngle = dt * 0.085;
          const x = camera.position.x;
          const z = camera.position.z;
          const cos = Math.cos(rotAngle);
          const sin = Math.sin(rotAngle);
          camera.position.x = x * cos - z * sin;
          camera.position.z = x * sin + z * cos;
        }

        controls.update();
        renderer.render(scene, camera);

        // Throttled 2D projected labels, zoom readout, and orientation readout (<= 10 Hz, change-guarded)
        if (now - lastHudUpdate > 95 || lastHudSignature === '') {
          lastHudUpdate = now;
          const camDist = camera.position.length();
          const zoomPct = Math.round((DEFAULT_CAMERA_DIST / camDist) * 100);
          if (zoomPct !== lastReportedZoom) {
            lastReportedZoom = zoomPct;
            propsRef.current.onZoomChange?.(zoomPct);
          }

          const w = container.clientWidth || initWidth;
          const h = container.clientHeight || initHeight;
          containerWidthRef.current = w;
          containerHeightRef.current = h;
          const uniSig = (propsRef.current.universityMarkers || [])
            .map((u) => `${u.slug}:${u.isSelected ? 1 : 0}:${u.isPriority ? 1 : 0}`)
            .join(',');
          const hudSignature = [
            Math.round(camera.position.x * 200),
            Math.round(camera.position.y * 200),
            Math.round(camera.position.z * 200),
            w,
            h,
            propsRef.current.selectedCountryCode || '',
            propsRef.current.showCityMarkers ? 1 : 0,
            propsRef.current.showCountryLabels ? 1 : 0,
            propsRef.current.showUniversityMarkers ? 1 : 0,
            propsRef.current.filteredCountryCodes.size,
            uniSig,
          ].join('|');

          if (hudSignature !== lastHudSignature) {
            lastHudSignature = hudSignature;

            const [centerLat, centerLon] = vector3ToLatLon(
              camera.position.x,
              camera.position.y,
              camera.position.z
            );
            propsRef.current.onOrientationChange?.({
              lat: Math.round(centerLat),
              lon: Math.round(centerLon),
            });

            const camDir = _vecB.copy(camera.position).normalize();
            const placedBoxes: Array<{ x: number; y: number }> = [];

            // 1. Project 3D University Markers attached to geographical coordinates on the Earth
            if (propsRef.current.showUniversityMarkers && uniMarkerEntries.length > 0) {
              const nextUniMarkers: ProjectedUniversityMarker[] = [];

              for (let idx = 0; idx < uniMarkerEntries.length; idx++) {
                const uEntry = uniMarkerEntries[idx];
                const facing = uEntry.normal.dot(camDir);
                if (facing < 0.12) continue; // occluded on back hemisphere of globe
                _vecC.copy(uEntry.worldPos).project(camera);
                const sx = ((_vecC.x + 1) / 2) * w;
                const sy = ((-_vecC.y + 1) / 2) * h;
                if (sx < 18 || sx > w - 18 || sy < 18 || sy > h - 18) continue;

                const openToLeft = sx > w - 230;
                const offX = openToLeft ? -84 : 84;
                const offY = 0;

                if (uEntry.item.isSelected) {
                  placedBoxes.push({ x: sx + offX, y: sy + offY });
                  placedBoxes.push({ x: sx, y: sy });
                }

                const countryObj = propsRef.current.countries.find(
                  (c) => c.isoCode === propsRef.current.selectedCountryCode
                );
                const worldMeta =
                  !countryObj && propsRef.current.selectedCountryCode
                    ? getTerritoryMetaByIso2(propsRef.current.selectedCountryCode)
                    : null;
                const resolvedCountryName =
                  uEntry.item.countryName ||
                  countryObj?.name ||
                  worldMeta?.name ||
                  propsRef.current.selectedCountryCode ||
                  '';

                nextUniMarkers.push({
                  slug: uEntry.item.slug,
                  name: uEntry.item.name,
                  shortName: uEntry.item.shortName,
                  city: uEntry.item.city,
                  countryName: resolvedCountryName,
                  latitude: uEntry.item.latitude,
                  longitude: uEntry.item.longitude,
                  x: sx,
                  y: sy,
                  labelOffsetX: offX,
                  labelOffsetY: offY,
                  isSelected: uEntry.item.isSelected,
                  isPriority: Boolean(uEntry.item.isPriority),
                });
              }
              setProjectedUniMarkers(nextUniMarkers);
            } else {
              setProjectedUniMarkers([]);
            }

            // 2. Project depth-aware city labels with screen-space de-overlap
            if (propsRef.current.showCityMarkers) {
              const nextLabels: ProjectedCityLabel[] = [];
              const isZoomedIn = camDist < 2.35;
              const sortedEntries = [...markerEntries].sort((a, b) => {
                const aSel = a.city.countryCode === propsRef.current.selectedCountryCode ? 1 : 0;
                const bSel = b.city.countryCode === propsRef.current.selectedCountryCode ? 1 : 0;
                return bSel - aSel;
              });
              for (const entry of sortedEntries) {
                const isSel = entry.city.countryCode === propsRef.current.selectedCountryCode;
                if (!isSel && (!isZoomedIn || !propsRef.current.filteredCountryCodes.has(entry.city.countryCode))) {
                  continue;
                }
                const facing = entry.normal.dot(camDir);
                if (facing < 0.24) continue; // occluded behind globe
                _vecC.copy(entry.worldPos).project(camera);
                const sx = ((_vecC.x + 1) / 2) * w;
                let sy = ((-_vecC.y + 1) / 2) * h;
                if (sx < 24 || sx > w - 24 || sy < 24 || sy > h - 24) continue;

                // De-overlap nearby city labels and university markers
                const collides = (tx: number, ty: number) =>
                  placedBoxes.some((b) => Math.abs(b.x - tx) < 62 && Math.abs(b.y - ty) < 22);
                if (collides(sx, sy)) {
                  if (!collides(sx, sy + 24)) {
                    sy += 24;
                  } else if (!collides(sx, sy - 24)) {
                    sy -= 24;
                  } else {
                    continue;
                  }
                }
                placedBoxes.push({ x: sx, y: sy });
                nextLabels.push({
                  slug: entry.city.slug,
                  name: entry.city.name,
                  countryCode: entry.city.countryCode,
                  x: sx,
                  y: sy,
                  isSelectedCountry: isSel,
                });
              }
              setCityLabels(nextLabels);
            } else {
              setCityLabels([]);
            }

            // 3. Optional projected label for selected country centroid
            const selCode = propsRef.current.selectedCountryCode;
            if (propsRef.current.showCountryLabels && selCode) {
              const featIdx = featureIndexByIsoRef.current[selCode];
              const feat = featIdx !== undefined ? worldFeatures[featIdx] : undefined;
              const countryObj = propsRef.current.countries.find((c) => c.isoCode === selCode);
              const worldMeta = !countryObj ? getTerritoryMetaByIso2(selCode) : null;
              const labelText = countryObj
                ? `${countryObj.flagEmoji} ${countryObj.name}`
                : worldMeta
                ? `${worldMeta.flagEmoji} ${worldMeta.name}`
                : '';
              if (feat && labelText) {
                const [sx3, sy3, sz3] = latLonToVector3Tuple(
                  feat.centroid[1],
                  feat.centroid[0],
                  1.02
                );
                _vecA.set(sx3, sy3, sz3);
                _normal.copy(_vecA).normalize();
                if (_normal.dot(camDir) > 0.2) {
                  _vecA.project(camera);
                  const px = ((_vecA.x + 1) / 2) * w;
                  let py = ((-_vecA.y + 1) / 2) * h;
                  if (
                    placedBoxes.some((b) => Math.abs(b.x - px) < 70 && Math.abs(b.y - py) < 28)
                  ) {
                    py -= 34;
                  }
                  if (px > 20 && px < w - 20 && py > 20 && py < h - 20) {
                    setSelectedCountryLabel({
                      name: labelText,
                      x: px,
                      y: py,
                    });
                  } else {
                    setSelectedCountryLabel(null);
                  }
                } else {
                  setSelectedCountryLabel(null);
                }
              } else {
                setSelectedCountryLabel(null);
              }
            } else {
              setSelectedCountryLabel(null);
            }
          }
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      if (isSoftwareGl) {
        frameId = requestAnimationFrame(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        cancelAnimationFrame(resizeRafId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('pointerup', onPointerUp);
        controls.dispose();

        coreGeo.dispose();
        coreMat.dispose();
        maskTexture.dispose();
        geoTexture.dispose();
        cloudSphereGeo.dispose();
        cloudSphereMat.dispose();
        cloudGeo.dispose();
        cloudMat.dispose();
        borderGeo.dispose();
        borderMat.dispose();
        selectedBorderGeo.dispose();
        selectedBorderMat.dispose();
        hoverBorderGeo.dispose();
        hoverBorderMat.dispose();
        gridGeo.dispose();
        gridMat.dispose();
        refGeo.dispose();
        refMat.dispose();
        atmosGeo.dispose();
        atmosMat.dispose();
        starGeo.dispose();
        starMat.dispose();
        cityCoreGeo.dispose();
        cityRingGeo.dispose();
        cityHitGeo.dispose();
        uniBeaconGeo.dispose();
        uniBeaconRingGeo.dispose();
        uniHitGeo.dispose();
        hitHiddenMat.dispose();
        for (const entry of markerEntries) {
          entry.coreMat.dispose();
          entry.ringMat.dispose();
        }
        for (const m of uniMarkerMats) {
          m.dispose();
        }
        renderer.dispose();
      };
    }, [worldFeatures]);

    if (webglUnavailable) {
      // Graceful non-blank fallback when WebGL is unavailable
      return (
        <div className="w-full h-full min-h-[380px] bg-[#020611] text-cyan-100 flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="font-display text-xl text-cyan-200">
            {uiStrings?.webglUnavailableTitle || 'WebGL 3D rendering unavailable in this browser context'}
          </p>
          <p className="text-xs text-cyan-300/75 max-w-md">
            {uiStrings?.webglUnavailableDesc ||
              'Use the quick destination strip below to explore all verified destinations, cities, and universities.'}
          </p>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full min-h-[380px] select-none bg-[#01040b] overflow-hidden">
        {/* Isolated WebGL Mount */}
        <div
          ref={mountRef}
          className="w-full h-full min-h-[380px]"
          aria-label="Interactive 3D Digital Earth globe"
          role="img"
        />

        {/* Selected Country Subtle Floating Label (Depth-Occluded) */}
        {selectedCountryLabel && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full px-2 py-0.5 rounded bg-[#030b18]/85 border border-emerald-400/45 text-[11px] font-medium text-emerald-200 whitespace-nowrap shadow-md"
            style={{
              left: `${selectedCountryLabel.x}px`,
              top: `${selectedCountryLabel.y - 8}px`,
            }}
          >
            {selectedCountryLabel.name}
          </div>
        )}

        {/* 3D Geographically Projected Interactive University Markers (Clean Cyan/Blue Dots + On-Demand Selected Label) */}
        {projectedUniMarkers.map((marker) => {
          const liveItem = universityMarkers.find((u) => u.slug === marker.slug);
          const isSelected = liveItem ? Boolean(liveItem.isSelected) : Boolean(marker.isSelected);
          const containerW = containerWidthRef.current || 720;
          const containerH = containerHeightRef.current || 480;
          const openToLeft = marker.x > containerW - 230;
          const nearTop = marker.y < 36;
          const nearBottom = marker.y > containerH - 36;

          return (
            <div
              key={marker.slug}
              className={`pointer-events-none absolute ${isSelected ? 'z-30' : 'z-20'}`}
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
              }}
            >
              {/* Clean, minimal circular cyan/blue glowing dot at exact (marker.x, marker.y) */}
              <button
                type="button"
                data-testid={`globe-uni-marker-${marker.slug}`}
                data-uni-short={marker.shortName}
                data-selected={isSelected ? 'true' : 'false'}
                aria-label={`${marker.name} (${marker.city}${
                  marker.countryName ? `, ${marker.countryName}` : ''
                })`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectUniversityMarker?.(marker.slug);
                }}
                className="pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
              >
                <span
                  className={`inline-block rounded-full transition-transform duration-150 ${
                    isSelected
                      ? 'w-2.5 h-2.5 bg-cyan-200 ring-2 ring-cyan-300/65 shadow-[0_0_10px_rgba(34,211,238,0.95)] scale-110'
                      : 'w-2 h-2 bg-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.72)] group-hover:scale-125 group-hover:bg-cyan-200'
                  }`}
                />
              </button>

              {/* On-Demand Selected University Name Label (Rendered ONLY for the currently selected university) */}
              {isSelected && (
                <button
                  type="button"
                  data-testid="globe-selected-uni-label"
                  data-uni-slug={marker.slug}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUniversityMarker?.(marker.slug);
                  }}
                  className={`pointer-events-auto absolute inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap bg-[#03152c]/95 border border-cyan-300/85 text-cyan-50 shadow-[0_6px_18px_rgba(2,8,23,0.75),0_0_12px_rgba(34,211,238,0.35)] hover:border-cyan-200 transition-colors cursor-pointer ${
                    openToLeft ? 'right-2.5' : 'left-2.5'
                  } ${
                    nearTop
                      ? 'top-0'
                      : nearBottom
                      ? 'bottom-0'
                      : 'top-1/2 -translate-y-1/2'
                  }`}
                >
                  <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                  <span className="max-w-[230px] sm:max-w-[280px] truncate">{marker.name}</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Depth-Aware Interactive City Marker Labels */}
        {cityLabels.map((lbl) => (
          <button
            key={lbl.slug}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const city = cities.find((c) => c.slug === lbl.slug);
              if (city) onSelectCity(city);
            }}
            style={{
              left: `${lbl.x}px`,
              top: `${lbl.y + 10}px`,
            }}
            className={`absolute z-10 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              lbl.isSelectedCountry
                ? 'bg-[#041222]/90 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-950/90'
                : 'bg-[#030b17]/80 border border-cyan-400/30 text-cyan-200 hover:border-cyan-300'
            }`}
          >
            {lbl.name}
          </button>
        ))}

        {/* Contextual Hover Tooltip (Premium Glass Style, No backdrop-blur over WebGL) */}
        {hoveredInfo && (
          <div
            data-testid="globe-hover-tooltip"
            className="pointer-events-none absolute z-30 rounded-xl px-3 py-2 text-xs shadow-xl border border-cyan-300/50 bg-[#030d1f]/95 text-cyan-50 whitespace-nowrap"
            style={{
              left: `${Math.min(
                Math.max(12, hoveredInfo.screenX + 16),
                Math.max(160, containerWidthRef.current - 260)
              )}px`,
              top: `${Math.max(12, hoveredInfo.screenY - 52)}px`,
            }}
          >
            {hoveredInfo.badge && (
              <p className="text-[10px] font-mono-tabular uppercase tracking-wider font-bold text-cyan-300">
                {hoveredInfo.badge}
              </p>
            )}
            <p className="font-semibold leading-tight text-white">{hoveredInfo.title}</p>
            {hoveredInfo.subtitle && (
              <p className="text-[11px] text-cyan-200/85 mt-0.5">{hoveredInfo.subtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

DigitalEarthCanvas.displayName = 'DigitalEarthCanvas';
