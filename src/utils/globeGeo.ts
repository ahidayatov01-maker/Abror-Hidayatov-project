import { geoCentroid, geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import type { CountryRecord } from '../types/domain';

export type GlobeVisualMode =
  | 'digital'
  | 'high-contrast'
  | 'minimal'
  | 'scanline'
  | 'atmosphere'
  | 'realistic'
  | 'satellite'
  | 'terrain'
  | 'night';

export const VISUAL_MODE_IDS: GlobeVisualMode[] = [
  'digital',
  'high-contrast',
  'minimal',
  'scanline',
  'atmosphere',
  'realistic',
  'satellite',
  'terrain',
  'night',
];

export interface GlobeVisualPreset {
  id: GlobeVisualMode;
  label: string;
  /** 0 = Digital holographic family, 1 = Realistic Earth, 2 = Satellite Imagery, 3 = Geographic Terrain, 4 = Night-side Earth */
  modeType: 0 | 1 | 2 | 3 | 4;
  showDots: boolean;
  defaultTerrainScale: number;
  defaultClouds: boolean;
  oceanDeep: string;
  oceanMid: string;
  landBase: string;
  dotBaseHex: string;
  dotSecondaryHex: string;
  destHighlightHex: string;
  selectedHex: string;
  hoverHex: string;
  borderHex: string;
  borderOpacity: number;
  scanlineIntensity: number;
  atmosphereHex: string;
  atmosphereAccentHex: string;
  atmosphereIntensity: number;
  pointSizeScale: number;
}

export const GLOBE_VISUAL_PRESETS: Record<GlobeVisualMode, GlobeVisualPreset> = {
  digital: {
    id: 'digital',
    label: 'Digital Earth',
    modeType: 0,
    showDots: true,
    defaultTerrainScale: 0.0,
    defaultClouds: false,
    oceanDeep: '#020611',
    oceanMid: '#071730',
    landBase: '#07223d',
    dotBaseHex: '#2bd4ff',
    dotSecondaryHex: '#8ae8ff',
    destHighlightHex: '#38f2af',
    selectedHex: '#6bffb8',
    hoverHex: '#b8f7ff',
    borderHex: '#1d6ca8',
    borderOpacity: 0.38,
    scanlineIntensity: 0.42,
    atmosphereHex: '#0ea5e9',
    atmosphereAccentHex: '#2dd4bf',
    atmosphereIntensity: 0.78,
    pointSizeScale: 1.0,
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'High Contrast',
    modeType: 0,
    showDots: true,
    defaultTerrainScale: 0.0,
    defaultClouds: false,
    oceanDeep: '#010308',
    oceanMid: '#040b18',
    landBase: '#081b33',
    dotBaseHex: '#7ef3ff',
    dotSecondaryHex: '#e6fbff',
    destHighlightHex: '#4ade80',
    selectedHex: '#86efac',
    hoverHex: '#ffffff',
    borderHex: '#38bdf8',
    borderOpacity: 0.56,
    scanlineIntensity: 0.25,
    atmosphereHex: '#38bdf8',
    atmosphereAccentHex: '#4ade80',
    atmosphereIntensity: 0.85,
    pointSizeScale: 1.12,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal Dotted',
    modeType: 0,
    showDots: true,
    defaultTerrainScale: 0.0,
    defaultClouds: false,
    oceanDeep: '#02050c',
    oceanMid: '#040c1a',
    landBase: '#030d1a',
    dotBaseHex: '#3ecbff',
    dotSecondaryHex: '#7fe3ff',
    destHighlightHex: '#34d399',
    selectedHex: '#6ee7b7',
    hoverHex: '#bae6fd',
    borderHex: '#154d7a',
    borderOpacity: 0.16,
    scanlineIntensity: 0.16,
    atmosphereHex: '#0284c7',
    atmosphereAccentHex: '#14b8a6',
    atmosphereIntensity: 0.52,
    pointSizeScale: 0.94,
  },
  scanline: {
    id: 'scanline',
    label: 'Enhanced Scanline',
    modeType: 0,
    showDots: true,
    defaultTerrainScale: 0.0,
    defaultClouds: false,
    oceanDeep: '#020714',
    oceanMid: '#071b38',
    landBase: '#0a2a4d',
    dotBaseHex: '#1cd0ff',
    dotSecondaryHex: '#67e8f9',
    destHighlightHex: '#22c55e',
    selectedHex: '#4ade80',
    hoverHex: '#a5f3fc',
    borderHex: '#0ea5e9',
    borderOpacity: 0.44,
    scanlineIntensity: 0.86,
    atmosphereHex: '#06b6d4',
    atmosphereAccentHex: '#22c55e',
    atmosphereIntensity: 0.82,
    pointSizeScale: 1.0,
  },
  atmosphere: {
    id: 'atmosphere',
    label: 'Atmospheric Glow',
    modeType: 0,
    showDots: true,
    defaultTerrainScale: 0.0,
    defaultClouds: false,
    oceanDeep: '#030917',
    oceanMid: '#0a2346',
    landBase: '#0b2f52',
    dotBaseHex: '#4fe0ff',
    dotSecondaryHex: '#a5f3fc',
    destHighlightHex: '#4ade80',
    selectedHex: '#86efac',
    hoverHex: '#e0f2fe',
    borderHex: '#2d82c4',
    borderOpacity: 0.36,
    scanlineIntensity: 0.34,
    atmosphereHex: '#22d3ee',
    atmosphereAccentHex: '#34d399',
    atmosphereIntensity: 1.05,
    pointSizeScale: 1.04,
  },
  realistic: {
    id: 'realistic',
    label: 'Realistic Earth',
    modeType: 1,
    showDots: false,
    defaultTerrainScale: 0.014,
    defaultClouds: true,
    oceanDeep: '#041b3d',
    oceanMid: '#0b3b75',
    landBase: '#2d6338',
    dotBaseHex: '#38bdf8',
    dotSecondaryHex: '#7dd3fc',
    destHighlightHex: '#34d399',
    selectedHex: '#6ee7b7',
    hoverHex: '#bae6fd',
    borderHex: '#e2e8f0',
    borderOpacity: 0.28,
    scanlineIntensity: 0.0,
    atmosphereHex: '#38bdf8',
    atmosphereAccentHex: '#60a5fa',
    atmosphereIntensity: 0.92,
    pointSizeScale: 0.85,
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite Imagery',
    modeType: 2,
    showDots: false,
    defaultTerrainScale: 0.011,
    defaultClouds: false,
    oceanDeep: '#021028',
    oceanMid: '#072a57',
    landBase: '#254f34',
    dotBaseHex: '#22d3ee',
    dotSecondaryHex: '#a5f3fc',
    destHighlightHex: '#22c55e',
    selectedHex: '#4ade80',
    hoverHex: '#e0f2fe',
    borderHex: '#38bdf8',
    borderOpacity: 0.44,
    scanlineIntensity: 0.0,
    atmosphereHex: '#0ea5e9',
    atmosphereAccentHex: '#38bdf8',
    atmosphereIntensity: 0.78,
    pointSizeScale: 0.85,
  },
  terrain: {
    id: 'terrain',
    label: 'Geographic Terrain',
    modeType: 3,
    showDots: false,
    defaultTerrainScale: 0.036,
    defaultClouds: false,
    oceanDeep: '#062038',
    oceanMid: '#0f3d5e',
    landBase: '#3a6b41',
    dotBaseHex: '#f59e0b',
    dotSecondaryHex: '#fde047',
    destHighlightHex: '#4ade80',
    selectedHex: '#86efac',
    hoverHex: '#fef08a',
    borderHex: '#fef3c7',
    borderOpacity: 0.34,
    scanlineIntensity: 0.0,
    atmosphereHex: '#7dd3fc',
    atmosphereAccentHex: '#34d399',
    atmosphereIntensity: 0.68,
    pointSizeScale: 0.85,
  },
  night: {
    id: 'night',
    label: 'Night-side Earth',
    modeType: 4,
    showDots: false,
    defaultTerrainScale: 0.008,
    defaultClouds: false,
    oceanDeep: '#01030b',
    oceanMid: '#040a1a',
    landBase: '#081022',
    dotBaseHex: '#fbbf24',
    dotSecondaryHex: '#fef3c7',
    destHighlightHex: '#38df81',
    selectedHex: '#6ee7b7',
    hoverHex: '#fde68a',
    borderHex: '#475569',
    borderOpacity: 0.32,
    scanlineIntensity: 0.0,
    atmosphereHex: '#3b82f6',
    atmosphereAccentHex: '#818cf8',
    atmosphereIntensity: 0.76,
    pointSizeScale: 0.9,
  },
};

export interface WorldCountryFeature {
  type: 'Feature';
  id?: string | number;
  numericId: string;
  properties: { name?: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  centroid: [number, number]; // [lon, lat]
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Converts geographic (lat, lon) in degrees to Three.js SphereGeometry-compatible
 * right-handed 3D Cartesian coordinates.
 * Matches SphereGeometry UV mapping: u = (lon + 180)/360, v = (lat + 90)/180.
 */
export function latLonToVector3Tuple(
  latDeg: number,
  lonDeg: number,
  radius = 1
): [number, number, number] {
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;
  const cosLat = Math.cos(lat);
  return [
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * cosLat * Math.sin(lon),
  ];
}

/**
 * Converts a 3D point on/near a sphere back into [lat, lon] in degrees.
 */
export function vector3ToLatLon(x: number, y: number, z: number): [number, number] {
  const len = Math.hypot(x, y, z) || 1;
  const ny = Math.max(-1, Math.min(1, y / len));
  const lat = Math.asin(ny) * RAD2DEG;
  const lon = Math.atan2(-z / len, x / len) * RAD2DEG;
  return [lat, lon];
}

/**
 * Deterministic golden-spiral Fibonacci point on the unit sphere, returning [x, y, z, lat, lon].
 */
export function fibonacciSpherePoint(
  index: number,
  total: number
): { x: number; y: number; z: number; lat: number; lon: number } {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(1, total - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;
  const [lat, lon] = vector3ToLatLon(x, y, z);
  return { x, y, z, lat, lon };
}

let cachedFeatures: WorldCountryFeature[] | null = null;

export function getWorldCountryFeatures(): WorldCountryFeature[] {
  if (cachedFeatures) return cachedFeatures;
  const topology = worldAtlas as unknown as {
    type: 'Topology';
    objects: { countries: unknown };
  };
  const geo = feature(topology as never, topology.objects.countries as never) as unknown as {
    features: Array<{
      type: 'Feature';
      id?: string | number;
      properties?: { name?: string };
      geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
      };
    }>;
  };

  cachedFeatures = (geo.features || []).map((f, idx) => {
    const rawId = f.id !== undefined && f.id !== null ? String(f.id) : String(idx);
    const numericId = rawId.padStart(3, '0');
    const c = geoCentroid(f as never);
    const centroid: [number, number] =
      Number.isFinite(c[0]) && Number.isFinite(c[1]) ? [c[0], c[1]] : [0, 20];
    return {
      type: 'Feature',
      id: f.id,
      numericId,
      properties: { name: f.properties?.name },
      geometry: f.geometry,
      centroid,
    };
  });

  return cachedFeatures;
}

export function buildNumericCountryLookup(
  countries: CountryRecord[]
): Record<string, CountryRecord> {
  const map: Record<string, CountryRecord> = {};
  for (const c of countries) {
    const padded = String(c.isoNumeric).padStart(3, '0');
    const unpadded = String(Number(c.isoNumeric));
    map[padded] = c;
    map[unpadded] = c;
  }
  return map;
}

/**
 * Builds spherical line segment vertex arrays for all country borders,
 * plus per-feature segment ranges for instant selected/hovered country outlines.
 */
export function buildCountryBorderSegments(
  features: WorldCountryFeature[],
  radius = 1.003
): {
  positions: Float32Array;
  featureRanges: Array<{ startVertex: number; vertexCount: number }>;
} {
  const coords: number[] = [];
  const featureRanges: Array<{ startVertex: number; vertexCount: number }> = [];

  const pushRing = (ring: number[][]) => {
    if (!ring || ring.length < 2) return;
    for (let i = 0; i < ring.length - 1; i++) {
      const [lonA, latA] = ring[i];
      const [lonB, latB] = ring[i + 1];
      // Skip giant antimeridian wrap artifacts (> 180 deg jump)
      if (Math.abs(lonB - lonA) > 170) continue;
      const [ax, ay, az] = latLonToVector3Tuple(latA, lonA, radius);
      const [bx, by, bz] = latLonToVector3Tuple(latB, lonB, radius);
      coords.push(ax, ay, az, bx, by, bz);
    }
  };

  for (const feat of features) {
    const startVertex = coords.length / 3;
    if (feat.geometry.type === 'Polygon') {
      for (const ring of feat.geometry.coordinates as number[][][]) {
        pushRing(ring);
      }
    } else if (feat.geometry.type === 'MultiPolygon') {
      for (const poly of feat.geometry.coordinates as number[][][][]) {
        for (const ring of poly) {
          pushRing(ring);
        }
      }
    }
    const endVertex = coords.length / 3;
    featureRanges.push({
      startVertex,
      vertexCount: endVertex - startVertex,
    });
  }

  return {
    positions: new Float32Array(coords),
    featureRanges,
  };
}

/**
 * Builds thin latitude/longitude graticule segments and distinct equator + prime meridian segments.
 */
export function buildGraticuleSegments(radius = 1.0015): {
  gridPositions: Float32Array;
  referencePositions: Float32Array;
} {
  const grid: number[] = [];
  const reference: number[] = [];

  const pushCircleLat = (latDeg: number, target: number[], step = 4) => {
    for (let lon = -180; lon < 180; lon += step) {
      const [ax, ay, az] = latLonToVector3Tuple(latDeg, lon, radius);
      const [bx, by, bz] = latLonToVector3Tuple(latDeg, lon + step, radius);
      target.push(ax, ay, az, bx, by, bz);
    }
  };

  const pushMeridianLon = (lonDeg: number, target: number[], step = 4) => {
    for (let lat = -88; lat < 88; lat += step) {
      const [ax, ay, az] = latLonToVector3Tuple(lat, lonDeg, radius);
      const [bx, by, bz] = latLonToVector3Tuple(lat + step, lonDeg, radius);
      target.push(ax, ay, az, bx, by, bz);
    }
  };

  for (let lat = -75; lat <= 75; lat += 15) {
    if (lat === 0) pushCircleLat(0, reference, 3);
    else pushCircleLat(lat, grid, 5);
  }
  for (let lon = -180; lon < 180; lon += 15) {
    if (lon === 0) pushMeridianLon(0, reference, 3);
    else pushMeridianLon(lon, grid, 5);
  }

  return {
    gridPositions: new Float32Array(grid),
    referencePositions: new Float32Array(reference),
  };
}

export interface EquirectLookupGrid {
  width: number;
  height: number;
  /** Value 0 = ocean; value > 0 = featureIndex + 1 */
  cellFeatureIndexPlusOne: Uint16Array;
}

/**
 * Rasterizes all world country polygons once into an Equirectangular lookup grid
 * for instant O(1) Fibonacci land-point filtering and O(1) raycast country picking.
 */
export function buildEquirectLookupGrid(
  features: WorldCountryFeature[],
  width = 1024,
  height = 512
): EquirectLookupGrid {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cellFeatureIndexPlusOne = new Uint16Array(width * height);
  if (!ctx) return { width, height, cellFeatureIndexPlusOne };

  // Equirectangular projection aligned identically to SphereGeometry UV
  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const pathGen = geoPath(projection, ctx);

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < features.length; i++) {
    const idVal = i + 1;
    // Encode 16-bit feature ID cleanly in R & G channels (R high bits or low byte, B=255 land flag)
    const r = idVal & 0xff;
    const g = (idVal >> 8) & 0xff;
    ctx.fillStyle = `rgb(${r}, ${g}, 255)`;
    ctx.beginPath();
    pathGen(features[i] as never);
    ctx.fill();
  }

  const img = ctx.getImageData(0, 0, width, height).data;
  for (let p = 0; p < width * height; p++) {
    const b = img[p * 4 + 2];
    const a = img[p * 4 + 3];
    if (a > 128 && b > 128) {
      const r = img[p * 4];
      const g = img[p * 4 + 1];
      const idVal = r + (g << 8);
      if (idVal > 0 && idVal <= features.length) {
        cellFeatureIndexPlusOne[p] = idVal;
      }
    }
  }

  return { width, height, cellFeatureIndexPlusOne };
}

export function lookupFeatureIndexAtLatLon(
  grid: EquirectLookupGrid,
  latDeg: number,
  lonDeg: number
): number {
  const u = (((lonDeg + 180) / 360) % 1 + 1) % 1;
  const v = Math.max(0, Math.min(0.9999, (90 - latDeg) / 180));
  const px = Math.min(grid.width - 1, Math.floor(u * grid.width));
  const py = Math.min(grid.height - 1, Math.floor(v * grid.height));
  const val = grid.cellFeatureIndexPlusOne[py * grid.width + px];
  return val > 0 ? val - 1 : -1;
}

/**
 * Generates geographically accurate dotted continent point cloud buffers using
 * Fibonacci sphere distribution + real land polygon lookup.
 */
export function buildDottedContinentCloud(
  grid: EquirectLookupGrid,
  totalSamples: number,
  radius = 1.0045
): {
  positions: Float32Array;
  featureIndices: Int16Array;
  seeds: Float32Array;
  lats: Float32Array;
  count: number;
} {
  const posList: number[] = [];
  const featList: number[] = [];
  const seedList: number[] = [];
  const latList: number[] = [];

  for (let i = 0; i < totalSamples; i++) {
    const pt = fibonacciSpherePoint(i, totalSamples);
    // Exclude barren polar ice extremes below -60 deg Antarctica interior edge only slightly?
    // Keep full continents including Antarctica coastline for complete geographic truth!
    const featIdx = lookupFeatureIndexAtLatLon(grid, pt.lat, pt.lon);
    if (featIdx >= 0) {
      posList.push(pt.x * radius, pt.y * radius, pt.z * radius);
      featList.push(featIdx);
      // Deterministic hash for subtle luminous variance
      const s = Math.abs(Math.sin(i * 12.9898 + pt.lat * 0.47) * 43758.5453) % 1;
      seedList.push(0.48 + s * 0.52);
      latList.push(pt.lat / 90);
    }
  }

  return {
    positions: new Float32Array(posList),
    featureIndices: new Int16Array(featList),
    seeds: new Float32Array(seedList),
    lats: new Float32Array(latList),
    count: featList.length,
  };
}

interface MountainSpinePoint {
  lat: number;
  lon: number;
  radiusDeg: number;
  height: number;
}

// Multi-node tectonic mountain chains for organic, non-capsule 3D mountain topography
const TECTONIC_MOUNTAIN_NODES: MountainSpinePoint[] = [
  // Himalayas arc (west to east curved spine)
  { lat: 34.5, lon: 74.5, radiusDeg: 3.4, height: 0.92 },
  { lat: 32.0, lon: 77.5, radiusDeg: 3.2, height: 0.94 },
  { lat: 29.8, lon: 81.0, radiusDeg: 3.1, height: 0.96 },
  { lat: 28.2, lon: 85.5, radiusDeg: 3.2, height: 1.0 },
  { lat: 27.8, lon: 89.5, radiusDeg: 3.0, height: 0.95 },
  { lat: 28.5, lon: 94.0, radiusDeg: 3.2, height: 0.88 },
  { lat: 26.5, lon: 98.5, radiusDeg: 3.5, height: 0.76 },
  // Tibetan Plateau & Kunlun / Qilian
  { lat: 33.5, lon: 82.0, radiusDeg: 5.2, height: 0.76 },
  { lat: 34.2, lon: 88.5, radiusDeg: 5.5, height: 0.78 },
  { lat: 35.0, lon: 94.5, radiusDeg: 5.0, height: 0.74 },
  { lat: 37.5, lon: 98.0, radiusDeg: 4.2, height: 0.68 },
  // Pamir Knot & Tian Shan & Altai (Central Asia)
  { lat: 38.5, lon: 72.5, radiusDeg: 3.4, height: 0.88 },
  { lat: 41.2, lon: 76.5, radiusDeg: 3.2, height: 0.84 },
  { lat: 42.5, lon: 81.5, radiusDeg: 3.2, height: 0.78 },
  { lat: 43.5, lon: 86.5, radiusDeg: 3.0, height: 0.72 },
  { lat: 48.0, lon: 88.5, radiusDeg: 3.8, height: 0.66 },
  // Hindu Kush, Zagros, Caucasus & Anatolian Plateau
  { lat: 35.5, lon: 69.0, radiusDeg: 3.4, height: 0.78 },
  { lat: 33.5, lon: 49.0, radiusDeg: 3.6, height: 0.68 },
  { lat: 36.5, lon: 45.0, radiusDeg: 3.5, height: 0.72 },
  { lat: 42.2, lon: 44.5, radiusDeg: 2.8, height: 0.82 },
  { lat: 39.5, lon: 38.5, radiusDeg: 3.8, height: 0.62 },
  // European Alps, Pyrenees, Carpathians & Scandinavian Mountains
  { lat: 45.8, lon: 7.2, radiusDeg: 2.2, height: 0.82 },
  { lat: 46.8, lon: 10.8, radiusDeg: 2.4, height: 0.84 },
  { lat: 47.2, lon: 13.8, radiusDeg: 2.2, height: 0.74 },
  { lat: 42.6, lon: 0.5, radiusDeg: 1.9, height: 0.64 },
  { lat: 46.5, lon: 25.0, radiusDeg: 2.6, height: 0.58 },
  { lat: 62.0, lon: 8.5, radiusDeg: 3.2, height: 0.56 },
  // Andes Cordillera spine
  { lat: 4.5, lon: -75.5, radiusDeg: 2.8, height: 0.78 },
  { lat: -2.0, lon: -78.5, radiusDeg: 2.8, height: 0.84 },
  { lat: -9.5, lon: -77.0, radiusDeg: 3.0, height: 0.88 },
  { lat: -16.5, lon: -68.5, radiusDeg: 3.6, height: 0.92 },
  { lat: -23.5, lon: -67.5, radiusDeg: 3.5, height: 0.90 },
  { lat: -32.6, lon: -70.0, radiusDeg: 2.8, height: 0.94 },
  { lat: -41.0, lon: -72.0, radiusDeg: 2.8, height: 0.76 },
  { lat: -49.0, lon: -73.0, radiusDeg: 2.6, height: 0.72 },
  // North American Rockies, Sierra Nevada & Cascades
  { lat: 61.5, lon: -141.0, radiusDeg: 4.2, height: 0.86 },
  { lat: 52.0, lon: -117.5, radiusDeg: 3.8, height: 0.80 },
  { lat: 44.5, lon: -110.5, radiusDeg: 4.2, height: 0.78 },
  { lat: 39.2, lon: -106.5, radiusDeg: 4.0, height: 0.82 },
  { lat: 37.5, lon: -119.2, radiusDeg: 2.8, height: 0.76 },
  { lat: 25.5, lon: -106.0, radiusDeg: 3.8, height: 0.66 },
  { lat: 19.2, lon: -98.8, radiusDeg: 3.2, height: 0.68 },
  // Ethiopian Highlands & East African Rift
  { lat: 9.5, lon: 39.0, radiusDeg: 3.8, height: 0.74 },
  { lat: -1.5, lon: 36.8, radiusDeg: 3.4, height: 0.72 },
  { lat: -3.1, lon: 37.3, radiusDeg: 2.6, height: 0.82 },
  // Japanese Alps, Taiwan Central Range & New Zealand Southern Alps
  { lat: 36.2, lon: 137.8, radiusDeg: 2.1, height: 0.72 },
  { lat: 23.8, lon: 121.0, radiusDeg: 1.6, height: 0.74 },
  { lat: -43.6, lon: 170.1, radiusDeg: 2.2, height: 0.76 },
];

// Global metropolitan & urban hubs with realistic pinpoint radii for NASA Black Marble night-side look
const GLOBAL_METRO_HUBS: Array<[number, number, number]> = [
  // North America
  [40.71, -74.0, 1.0], // New York
  [42.36, -71.06, 0.88], // Boston
  [39.95, -75.16, 0.86], // Philadelphia
  [38.9, -77.04, 0.88], // Washington DC
  [41.88, -87.63, 0.94], // Chicago
  [43.65, -79.38, 0.9], // Toronto
  [45.5, -73.57, 0.84], // Montreal
  [33.75, -84.39, 0.86], // Atlanta
  [25.76, -80.19, 0.86], // Miami
  [29.76, -95.37, 0.9], // Houston
  [32.78, -96.8, 0.9], // Dallas
  [34.05, -118.24, 0.98], // Los Angeles
  [37.77, -122.42, 0.92], // San Francisco
  [47.61, -122.33, 0.85], // Seattle
  [19.43, -99.13, 0.96], // Mexico City
  // South America
  [-23.55, -46.63, 0.98], // Sao Paulo
  [-22.91, -43.17, 0.92], // Rio de Janeiro
  [-34.6, -58.38, 0.92], // Buenos Aires
  [-33.45, -70.67, 0.86], // Santiago
  [4.71, -74.07, 0.88], // Bogota
  [-12.05, -77.04, 0.86], // Lima
  // Europe
  [51.51, -0.13, 1.0], // London
  [53.48, -2.24, 0.88], // Manchester
  [48.86, 2.35, 0.98], // Paris
  [50.85, 4.35, 0.96], // Brussels / Antwerp
  [52.37, 4.9, 0.94], // Amsterdam / Randstad
  [51.23, 6.78, 0.95], // Rhine-Ruhr
  [50.11, 8.68, 0.88], // Frankfurt
  [48.14, 11.58, 0.88], // Munich
  [52.52, 13.4, 0.92], // Berlin
  [47.37, 8.54, 0.86], // Zurich
  [45.46, 9.19, 0.94], // Milan
  [41.9, 12.5, 0.88], // Rome
  [40.42, -3.7, 0.9], // Madrid
  [41.39, 2.17, 0.88], // Barcelona
  [48.21, 16.37, 0.88], // Vienna
  [50.08, 14.44, 0.85], // Prague
  [52.23, 21.01, 0.88], // Warsaw
  [59.33, 18.07, 0.84], // Stockholm
  [55.76, 37.62, 0.98], // Moscow
  [59.93, 30.34, 0.88], // St Petersburg
  [41.01, 28.98, 0.96], // Istanbul
  // Middle East, Central Asia & Africa
  [30.04, 31.24, 0.98], // Cairo / Nile Delta
  [32.09, 34.78, 0.86], // Tel Aviv
  [25.2, 55.27, 0.94], // Dubai
  [24.71, 46.68, 0.88], // Riyadh
  [35.69, 51.39, 0.92], // Tehran
  [41.3, 69.24, 0.96], // Tashkent
  [39.65, 66.96, 0.85], // Samarkand
  [40.78, 72.34, 0.84], // Fergana / Andijan
  [43.22, 76.85, 0.86], // Almaty
  [51.17, 71.45, 0.82], // Astana
  [6.52, 3.38, 0.9], // Lagos
  [-26.2, 28.05, 0.88], // Johannesburg
  // South, East & Southeast Asia & Oceania
  [28.61, 77.21, 1.0], // Delhi
  [19.08, 72.88, 0.96], // Mumbai
  [12.97, 77.59, 0.9], // Bengaluru
  [13.08, 80.27, 0.86], // Chennai
  [17.39, 78.49, 0.86], // Hyderabad
  [22.57, 88.36, 0.92], // Kolkata
  [31.52, 74.36, 0.88], // Lahore
  [23.81, 90.41, 0.9], // Dhaka
  [39.9, 116.4, 1.0], // Beijing
  [39.12, 117.2, 0.92], // Tianjin
  [31.23, 121.47, 1.0], // Shanghai
  [32.06, 118.8, 0.9], // Nanjing
  [30.27, 120.15, 0.9], // Hangzhou
  [23.13, 113.26, 0.98], // Guangzhou / Shenzhen
  [22.32, 114.17, 0.96], // Hong Kong
  [30.57, 104.07, 0.9], // Chengdu
  [29.56, 106.55, 0.88], // Chongqing
  [30.59, 114.31, 0.9], // Wuhan
  [34.34, 108.94, 0.86], // Xi'an
  [25.03, 121.57, 0.92], // Taipei
  [37.57, 126.98, 1.0], // Seoul
  [35.18, 129.08, 0.88], // Busan
  [35.68, 139.65, 1.0], // Tokyo
  [34.69, 135.5, 0.95], // Osaka / Kyoto
  [35.18, 136.91, 0.9], // Nagoya
  [13.76, 100.5, 0.92], // Bangkok
  [1.35, 103.82, 0.96], // Singapore
  [3.14, 101.69, 0.88], // Kuala Lumpur
  [-6.21, 106.85, 0.94], // Jakarta
  [14.6, 120.98, 0.9], // Manila
  [21.03, 105.85, 0.86], // Hanoi
  [10.82, 106.63, 0.88], // Ho Chi Minh City
  [-33.87, 151.21, 0.88], // Sydney
  [-37.81, 144.96, 0.86], // Melbourne
];

function pseudoNoise3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function fbmSpherical(latDeg: number, lonDeg: number): number {
  const [x, y, z] = latLonToVector3Tuple(latDeg, lonDeg, 1);
  // Deterministic 5-octave trigonometric FBM on unit sphere (seam-free across antimeridian)
  const o1 =
    Math.sin(x * 5.3 + y * 3.7) * Math.cos(z * 4.9 - x * 2.8) +
    Math.sin(y * 6.1 + z * 5.2) * 0.5;
  const o2 =
    Math.sin(x * 11.7 - z * 9.4 + 1.3) * Math.cos(y * 12.3 + x * 8.1) * 0.5;
  const o3 =
    Math.sin(z * 24.5 + x * 19.8 - y * 21.1) * Math.cos(x * 23.2 + y * 18.7) * 0.25;
  const o4 =
    Math.sin(x * 48.0 + y * 44.0 + z * 51.0) * 0.14 +
    Math.cos(z * 85.0 - x * 72.0 + y * 68.0) * 0.08 +
    (pseudoNoise3D(Math.round(x * 48), Math.round(y * 48), Math.round(z * 48)) - 0.5) * 0.07;
  return Math.max(0, Math.min(1, 0.5 + 0.27 * (o1 + o2 + o3 + o4)));
}

function smoothGaussianBasin(
  lat: number,
  lon: number,
  cLat: number,
  cLon: number,
  rLat: number,
  rLon: number,
  strength: number
): number {
  const dLat = (lat - cLat) / rLat;
  const dLon = (lon - cLon) / rLon;
  const d2 = dLat * dLat + dLon * dLon;
  if (d2 > 3.2) return 0;
  return Math.exp(-d2 * 1.45) * strength;
}

/**
 * Computes deterministic physical geography attributes at a given (lat, lon):
 * - elevation [0..1]: mountain ranges + continental interior topography
 * - biome [0..1]: 0 = arid desert, 0.5 = savanna/steppe, 1.0 = lush forest
 * - nightLight [0..1]: urban metropolitan & population belt luminosity
 */
export function sampleEarthGeography(
  latDeg: number,
  lonDeg: number,
  isLand: boolean,
  extraCityCoords?: Array<[number, number]>
): {
  elevation: number;
  biome: number;
  nightLight: number;
} {
  const fbm = fbmSpherical(latDeg, lonDeg);
  const [sx, sy, sz] = latLonToVector3Tuple(latDeg, lonDeg, 1);

  if (!isLand) {
    // Ocean floor bathymetric ridges (Mid-Atlantic, East Pacific Rise) encoded subtly
    return {
      elevation: fbm * 0.12,
      biome: 0,
      nightLight: 0,
    };
  }

  // Domain-warp coordinates with spherical noise so mountain ranges have organic fractal ridges & valleys
  const warpLat = latDeg + (fbm - 0.5) * 3.4 + Math.sin(sx * 28.0 + sz * 26.0) * 0.85;
  const warpLon = lonDeg + (fbm - 0.5) * 4.2 + Math.cos(sy * 31.0 - sx * 24.0) * 1.1;

  // 1. Continental elevation + fractal tectonic mountain chains
  let mountainBoost = 0;
  for (let i = 0; i < TECTONIC_MOUNTAIN_NODES.length; i++) {
    const node = TECTONIC_MOUNTAIN_NODES[i];
    const dLat = warpLat - node.lat;
    const dLon = (warpLon - node.lon) * Math.cos(node.lat * DEG2RAD);
    const d2 = (dLat * dLat + dLon * dLon) / (node.radiusDeg * node.radiusDeg);
    if (d2 < 3.6) {
      const influence = Math.exp(-d2 * 1.35) * node.height;
      mountainBoost = Math.max(mountainBoost, influence);
    }
  }

  // Sharp fractal ridge crest modulation (produces realistic branching valleys inside mountain chains)
  const ridgeCrest =
    1.0 -
    Math.abs(
      Math.sin(sx * 36.0 + sy * 29.0 - sz * 34.0 + fbm * 3.2) *
        Math.cos(sz * 42.0 - sx * 38.0 + fbm * 2.5)
    );
  const ridgedFbm = 0.35 + 0.65 * Math.pow(ridgeCrest, 1.35);
  const rawElevation =
    0.11 +
    0.22 * fbm +
    mountainBoost * (0.42 + 0.64 * ridgedFbm);
  const elevation = Math.max(0.06, Math.min(1.0, rawElevation));

  // 2. Smooth organic biome vegetation / aridity index (zero hard rectangular boundaries)
  const absLat = Math.abs(warpLat);
  let aridity = Math.exp(-Math.pow((absLat - 25.5) / 10.5, 2)) * 0.38;

  // Smooth elliptical desert basins warped by FBM
  aridity = Math.max(
    aridity,
    smoothGaussianBasin(warpLat, warpLon, 23.5, 13.0, 8.5, 24.0, 0.95), // Sahara
    smoothGaussianBasin(warpLat, warpLon, 24.0, 45.0, 7.5, 11.5, 0.9), // Arabian Peninsula
    smoothGaussianBasin(warpLat, warpLon, 41.5, 63.5, 5.2, 8.5, 0.78), // Kyzylkum / Karakum
    smoothGaussianBasin(warpLat, warpLon, 40.5, 84.0, 4.5, 9.5, 0.84), // Taklamakan
    smoothGaussianBasin(warpLat, warpLon, 42.8, 103.5, 4.8, 10.5, 0.78), // Gobi Desert
    smoothGaussianBasin(warpLat, warpLon, -25.0, 131.0, 6.5, 13.0, 0.84), // Australian Outback
    smoothGaussianBasin(warpLat, warpLon, 32.0, -112.5, 5.5, 7.5, 0.72), // Sonoran / Mojave
    smoothGaussianBasin(warpLat, warpLon, -23.5, -69.2, 6.0, 2.8, 0.82), // Atacama
    smoothGaussianBasin(warpLat, warpLon, -24.5, 18.0, 6.0, 5.0, 0.74) // Namib / Kalahari
  );

  // Lush equatorial rainforest boost (Amazon, Congo, Southeast Asia) & temperate/boreal forest belts
  const equatorialLush = Math.exp(-Math.pow(absLat / 14.0, 2)) * 0.88;
  const monsoonAsia = smoothGaussianBasin(warpLat, warpLon, 23.0, 106.0, 12.0, 16.0, 0.58);
  const temperateForest = Math.exp(-Math.pow((absLat - 49.0) / 13.5, 2)) * 0.62;
  const biome = Math.max(
    0,
    Math.min(
      1,
      0.42 +
        equatorialLush +
        monsoonAsia +
        temperateForest -
        aridity * 0.92 +
        (fbm - 0.5) * 0.28
    )
  );

  // 3. Pinpoint night-side urban city lights & fine spiderweb highway filaments
  let nightLight = 0;
  const filamentNoise = Math.pow(
    0.5 + 0.5 * Math.sin(sx * 95.0 + cosLatLonHash(sy, sz)),
    2.2
  );

  for (let i = 0; i < GLOBAL_METRO_HUBS.length; i++) {
    const [hLat, hLon, w] = GLOBAL_METRO_HUBS[i];
    const dLat = latDeg - hLat;
    const dLon = (lonDeg - hLon) * Math.cos(latDeg * DEG2RAD);
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < 24) {
      // Pinpoint intense metropolitan core + delicate noisy regional corridors
      const core = Math.exp(-d2 * 1.95) * w;
      const corridors = Math.exp(-d2 * 0.28) * w * (0.14 + 0.36 * filamentNoise);
      const total = core + corridors;
      if (total > nightLight) nightLight = total;
    }
  }

  if (extraCityCoords) {
    for (let i = 0; i < extraCityCoords.length; i++) {
      const [cLat, cLon] = extraCityCoords[i];
      const dLat = latDeg - cLat;
      const dLon = (lonDeg - cLon) * Math.cos(latDeg * DEG2RAD);
      const d2 = dLat * dLat + dLon * dLon;
      if (d2 < 18) {
        const glow = Math.exp(-d2 * 2.2) * 0.96 + Math.exp(-d2 * 0.35) * 0.24 * filamentNoise;
        if (glow > nightLight) nightLight = glow;
      }
    }
  }

  // Fine interconnected town/highway web in populated lowland regions
  const popDensity =
    smoothGaussianBasin(latDeg, lonDeg, 48.5, 10.0, 8.5, 16.0, 0.42) + // Europe
    smoothGaussianBasin(latDeg, lonDeg, 38.0, -80.0, 7.5, 12.0, 0.38) + // Eastern US
    smoothGaussianBasin(latDeg, lonDeg, 25.5, 80.5, 6.5, 10.0, 0.46) + // Northern India
    smoothGaussianBasin(latDeg, lonDeg, 33.5, 117.5, 8.5, 8.0, 0.48) + // Eastern China plain
    smoothGaussianBasin(latDeg, lonDeg, 36.0, 138.0, 4.5, 4.5, 0.45); // Japan
  if (popDensity > 0.04 && elevation < 0.52) {
    nightLight = Math.min(1.0, nightLight + popDensity * filamentNoise * 0.65);
  }

  return {
    elevation,
    biome,
    nightLight: Math.max(0, Math.min(1, nightLight)),
  };
}

function cosLatLonHash(y: number, z: number): number {
  return Math.cos(y * 112.0 - z * 88.0) * 2.4;
}

/**
 * Generates an equirectangular RGBA Uint8Array buffer for `THREE.DataTexture`:
 * - R (0..255): Terrain Elevation heightfield (for 3D vertex displacement & surface normal relief)
 * - G (0..255): Biome vegetation index (0 = desert gold/ochre, 128 = grassland, 255 = deep forest)
 * - B (0..255): Night-side urban city light cluster & highway density
 * - A (0..255): Coastal shelf & shallow turquoise bathymetry factor
 */
export function buildEarthGeoDataBuffer(
  grid: EquirectLookupGrid,
  cityCoords: Array<[number, number]>,
  width = 512,
  height = 256
): Uint8Array {
  const data = new Uint8Array(width * height * 4);

  for (let py = 0; py < height; py++) {
    // Match Three.js DataTexture UV: v=0 at bottom (-90 deg), v=1 at top (+90 deg)
    const v = py / Math.max(1, height - 1);
    const latDeg = -90 + v * 180;

    for (let px = 0; px < width; px++) {
      const u = px / Math.max(1, width - 1);
      const lonDeg = -180 + u * 360;

      const isLand = lookupFeatureIndexAtLatLon(grid, latDeg, lonDeg) >= 0;

      // Check 4 neighbors at ~2.0 degrees to detect coastal shelf / shoreline proximity
      const n1 = lookupFeatureIndexAtLatLon(grid, Math.min(89, latDeg + 2.0), lonDeg) >= 0;
      const n2 = lookupFeatureIndexAtLatLon(grid, Math.max(-89, latDeg - 2.0), lonDeg) >= 0;
      const n3 = lookupFeatureIndexAtLatLon(grid, latDeg, lonDeg + 2.2) >= 0;
      const n4 = lookupFeatureIndexAtLatLon(grid, latDeg, lonDeg - 2.2) >= 0;
      const landNeighbors = (n1 ? 1 : 0) + (n2 ? 1 : 0) + (n3 ? 1 : 0) + (n4 ? 1 : 0);

      const sample = sampleEarthGeography(latDeg, lonDeg, isLand, cityCoords);

      // Coastal shelf factor: high near coastlines for realistic turquoise continental shelves
      const coastalShelf = isLand
        ? landNeighbors < 4
          ? 0.82
          : 0.32
        : landNeighbors > 0
        ? 0.92
        : sample.elevation * 2.2;

      const boostNight =
        isLand && landNeighbors < 4
          ? Math.min(1, sample.nightLight * 1.18 + 0.04)
          : sample.nightLight;

      const idx = (py * width + px) * 4;
      data[idx] = Math.round(Math.max(0, Math.min(1, sample.elevation)) * 255);
      data[idx + 1] = Math.round(Math.max(0, Math.min(1, sample.biome)) * 255);
      data[idx + 2] = Math.round(Math.max(0, Math.min(1, boostNight)) * 255);
      data[idx + 3] = Math.round(Math.max(0, Math.min(1, coastalShelf)) * 255);
    }
  }

  return data;
}

