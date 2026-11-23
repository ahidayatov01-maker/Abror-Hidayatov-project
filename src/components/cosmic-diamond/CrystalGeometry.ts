import {
  buildOvalBrilliantDiamondData,
  type BrilliantDiamondVertexData,
} from '../../utils/brilliantDiamondGeometry';

export type Vec3Tuple = [number, number, number];

export interface CrystalShardGeometryData {
  shardIndex: number;
  positions: Float32Array;
  normals: Float32Array;
  /**
   * Per-vertex facet metadata:
   * x = facetKind (0..7 = outer polished diamond facet, 10 = interior fractured cleavage face)
   * y = facetNormId (deterministic hash per facet for pleochroism & roughness variation)
   * z = radialDist (0..1 from shard centroid)
   * w = edgeFactor (0..1 proximity to sharp crystalline ridge)
   */
  facetMeta: Float32Array;
  edgePositions: Float32Array;
  triangleCount: number;
  facetCount: number;
  boundingRadius: number;
  /** Exact centroid inside the assembled intact diamond (for physical separation & reassembly) */
  homeOffset: Vec3Tuple;
  /** Outward physical fracture direction unit vector away from diamond center */
  fractureDir: Vec3Tuple;
  /** Initial home orientation inside the assembled diamond (0,0,0 aligns seamlessly with intact diamond) */
  homeRotation: Vec3Tuple;
  /** Restrained initial rotational impulse on separation (radians) */
  separationImpulseRot: Vec3Tuple;
  /** Stage 1 in-place hero orbital parameters (calibrated strictly inside visible frustum) */
  stage1OrbitRadius: number;
  stage1OrbitAngle: number;
  stage1OrbitY: number;
  stage1OrbitSpeed: number;
  stage1Scale: number;
  /** Stage 2 full-screen cosmic universe orbit parameters */
  universeOrbitRadius: number;
  universeOrbitEccentricity: number;
  universeOrbitAngle: number;
  universeOrbitTiltX: number;
  universeOrbitTiltZ: number;
  universeOrbitY: number;
  universeOrbitSpeed: number;
  universeScale: number;
  /** Very restrained, elegant crystal drift spin rates (rad/s) */
  spinRate: Vec3Tuple;
  /** Unique silhouette archetype label for clarity & unit testing */
  archetype: string;
}

export interface DiamondCrackNetworkData {
  /** Line segment pairs (x1,y1,z1, x2,y2,z2) across and inside the intact diamond */
  positions: Float32Array;
  /** Propagation threshold (0..1) per vertex so cracks spread progressively from nucleation points */
  propagationOrder: Float32Array;
  /** Branch intensity weight (1.0 = primary deep fissure, 0.55 = secondary hairline fracture) */
  intensity: Float32Array;
  /** 3D nucleation / spark emission points along major fracture seams */
  sparkOrigins: Vec3Tuple[];
  segmentCount: number;
}

export interface ConstellationEdge {
  from: number;
  to: number;
}

function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sub3(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add3(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale3(a: Vec3Tuple, s: number): Vec3Tuple {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function cross3(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize3(v: Vec3Tuple): Vec3Tuple {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function lerp3(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Shared canonical Oval Brilliant Diamond dimensions (matches intact diamond 1:1)
export const DIAMOND_PARAMS = {
  sectors: 12,
  radiusX: 1.48,
  radiusZ: 1.24,
  crownHeight: 0.48,
  pavilionDepth: 1.32,
  girdleThickness: 0.048,
  tableRatio: 0.56,
} as const;

/**
 * Builds the exact intact purple diamond geometry matching the Dashboard hero diamond.
 */
export function buildIntactDiamondGeometryData(): BrilliantDiamondVertexData {
  return buildOvalBrilliantDiamondData({ ...DIAMOND_PARAMS });
}

/**
 * Evaluates a point on the canonical Oval Brilliant Diamond outer shell for angle theta & normalized tier.
 */
function diamondShellPoint(theta: number, rScale: number, y: number): Vec3Tuple {
  return [
    Math.cos(theta) * DIAMOND_PARAMS.radiusX * rScale,
    y,
    Math.sin(theta) * DIAMOND_PARAMS.radiusZ * rScale,
  ];
}

interface FractureSectorSpec {
  archetype: string;
  seed: number;
  /** Angular wedge around the diamond (in radians) */
  thetaStart: number;
  thetaEnd: number;
  /** Vertical tier: 'crown' (upper wedge), 'girdle' (mid-body prism), 'pavilion' (deep lower shard) */
  tier: 'crown' | 'girdle' | 'pavilion';
  /** Radial depth inset toward core (0.08..0.32) giving varied thickness */
  innerDepth: number;
  /** Stage 1 hero orbital parameters — carefully bounded inside visible viewport (no clipping!) */
  stage1OrbitRadius: number;
  stage1OrbitAngle: number;
  stage1OrbitY: number;
  stage1OrbitSpeed: number;
  stage1Scale: number;
  /** Stage 2 cosmic universe orbital parameters */
  universeOrbitRadius: number;
  universeOrbitEccentricity: number;
  universeOrbitAngle: number;
  universeOrbitTiltX: number;
  universeOrbitTiltZ: number;
  universeOrbitY: number;
  universeOrbitSpeed: number;
  universeScale: number;
  /** Restrained, graceful spin rates (rad/s) — never frantic or dizzying */
  spinRate: Vec3Tuple;
  /** Controlled post-separation angular impulse */
  separationImpulseRot: Vec3Tuple;
}

/**
 * 12 non-overlapping asymmetrical 3D fracture sectors partitioning the real Oval Brilliant Diamond:
 * - 4 upper Crown-Girdle wedges (asymmetric angular spans summing to 2*PI)
 * - 4 mid Girdle-Pavilion prisms (offset angular seams for organic Voronoi-like fracture)
 * - 4 lower Pavilion-Culet daggers/splinters (deep asymmetric cuts meeting toward the culet)
 * Every shard retains real thickness, outer polished diamond facets, and rough interior cleavage planes.
 */
const FRACTURE_SECTOR_SPECS: FractureSectorSpec[] = [
  // --- UPPER CROWN-GIRDLE FRAGMENTS (0..3) ---
  {
    archetype: 'crown-spire',
    seed: 1011,
    thetaStart: 0.0,
    thetaEnd: 1.56,
    tier: 'crown',
    innerDepth: 0.14,
    stage1OrbitRadius: 1.38,
    stage1OrbitAngle: 0.22,
    stage1OrbitY: 0.72,
    stage1OrbitSpeed: 0.088,
    stage1Scale: 0.71,
    universeOrbitRadius: 3.55,
    universeOrbitEccentricity: 1.15,
    universeOrbitAngle: 0.24,
    universeOrbitTiltX: 0.15,
    universeOrbitTiltZ: -0.08,
    universeOrbitY: 1.48,
    universeOrbitSpeed: 0.032,
    universeScale: 0.88,
    spinRate: [0.036, 0.062, 0.024],
    separationImpulseRot: [0.22, 0.34, -0.18],
  },
  {
    archetype: 'bezel-wedge',
    seed: 2027,
    thetaStart: 1.56,
    thetaEnd: 3.08,
    tier: 'crown',
    innerDepth: 0.18,
    stage1OrbitRadius: 1.4,
    stage1OrbitAngle: 1.28,
    stage1OrbitY: 0.62,
    stage1OrbitSpeed: 0.084,
    stage1Scale: 0.73,
    universeOrbitRadius: 4.24,
    universeOrbitEccentricity: 1.18,
    universeOrbitAngle: 1.05,
    universeOrbitTiltX: -0.14,
    universeOrbitTiltZ: 0.12,
    universeOrbitY: 0.92,
    universeOrbitSpeed: 0.036,
    universeScale: 0.86,
    spinRate: [-0.032, 0.056, -0.028],
    separationImpulseRot: [-0.26, 0.28, 0.22],
  },
  {
    archetype: 'table-chevron',
    seed: 3049,
    thetaStart: 3.08,
    thetaEnd: 4.72,
    tier: 'crown',
    innerDepth: 0.12,
    stage1OrbitRadius: 1.35,
    stage1OrbitAngle: 2.34,
    stage1OrbitY: 0.78,
    stage1OrbitSpeed: 0.09,
    stage1Scale: 0.69,
    universeOrbitRadius: 4.44,
    universeOrbitEccentricity: 1.16,
    universeOrbitAngle: 3.22,
    universeOrbitTiltX: -0.16,
    universeOrbitTiltZ: 0.1,
    universeOrbitY: -1.32,
    universeOrbitSpeed: 0.035,
    universeScale: 0.87,
    spinRate: [0.034, -0.052, 0.026],
    separationImpulseRot: [0.28, -0.32, 0.19],
  },
  {
    archetype: 'prism-diadem',
    seed: 4073,
    thetaStart: 4.72,
    thetaEnd: Math.PI * 2,
    tier: 'crown',
    innerDepth: 0.2,
    stage1OrbitRadius: 1.42,
    stage1OrbitAngle: 3.42,
    stage1OrbitY: 0.56,
    stage1OrbitSpeed: 0.082,
    stage1Scale: 0.72,
    universeOrbitRadius: 4.68,
    universeOrbitEccentricity: 1.16,
    universeOrbitAngle: 5.74,
    universeOrbitTiltX: -0.15,
    universeOrbitTiltZ: 0.13,
    universeOrbitY: -0.88,
    universeOrbitSpeed: 0.033,
    universeScale: 0.88,
    spinRate: [-0.038, -0.054, 0.022],
    separationImpulseRot: [-0.24, -0.28, -0.21],
  },

  // --- MID GIRDLE-UPPER-PAVILION FRAGMENTS (4..7) ---
  {
    archetype: 'girdle-prism',
    seed: 5099,
    thetaStart: 0.42,
    thetaEnd: 1.94,
    tier: 'girdle',
    innerDepth: 0.16,
    stage1OrbitRadius: 1.44,
    stage1OrbitAngle: 0.76,
    stage1OrbitY: 0.22,
    stage1OrbitSpeed: 0.082,
    stage1Scale: 0.74,
    universeOrbitRadius: 4.6,
    universeOrbitEccentricity: 1.18,
    universeOrbitAngle: 2.16,
    universeOrbitTiltX: -0.17,
    universeOrbitTiltZ: -0.11,
    universeOrbitY: 1.44,
    universeOrbitSpeed: 0.034,
    universeScale: 0.9,
    spinRate: [0.028, -0.058, 0.032],
    separationImpulseRot: [0.19, 0.36, 0.24],
  },
  {
    archetype: 'star-rhomboid',
    seed: 6131,
    thetaStart: 1.94,
    thetaEnd: 3.52,
    tier: 'girdle',
    innerDepth: 0.15,
    stage1OrbitRadius: 1.38,
    stage1OrbitAngle: 1.82,
    stage1OrbitY: -0.24,
    stage1OrbitSpeed: 0.088,
    stage1Scale: 0.73,
    universeOrbitRadius: 4.8,
    universeOrbitEccentricity: 1.14,
    universeOrbitAngle: 4.52,
    universeOrbitTiltX: -0.12,
    universeOrbitTiltZ: -0.16,
    universeOrbitY: -0.78,
    universeOrbitSpeed: 0.031,
    universeScale: 0.9,
    spinRate: [-0.036, 0.048, -0.026],
    separationImpulseRot: [-0.31, -0.22, 0.27],
  },
  {
    archetype: 'obsidian-facet',
    seed: 7177,
    thetaStart: 3.52,
    thetaEnd: 5.06,
    tier: 'girdle',
    innerDepth: 0.21,
    stage1OrbitRadius: 1.43,
    stage1OrbitAngle: 2.9,
    stage1OrbitY: 0.16,
    stage1OrbitSpeed: 0.085,
    stage1Scale: 0.74,
    universeOrbitRadius: 4.52,
    universeOrbitEccentricity: 1.15,
    universeOrbitAngle: 4.86,
    universeOrbitTiltX: -0.19,
    universeOrbitTiltZ: 0.14,
    universeOrbitY: -0.18,
    universeOrbitSpeed: 0.036,
    universeScale: 0.87,
    spinRate: [0.032, 0.054, -0.03],
    separationImpulseRot: [0.25, -0.34, -0.18],
  },
  {
    archetype: 'horizon-obelisk',
    seed: 8219,
    thetaStart: 5.06,
    thetaEnd: Math.PI * 2 + 0.42,
    tier: 'girdle',
    innerDepth: 0.17,
    stage1OrbitRadius: 1.37,
    stage1OrbitAngle: 3.98,
    stage1OrbitY: -0.18,
    stage1OrbitSpeed: 0.086,
    stage1Scale: 0.75,
    universeOrbitRadius: 4.34,
    universeOrbitEccentricity: 1.15,
    universeOrbitAngle: 5.26,
    universeOrbitTiltX: 0.14,
    universeOrbitTiltZ: -0.11,
    universeOrbitY: 1.08,
    universeOrbitSpeed: 0.033,
    universeScale: 0.89,
    spinRate: [-0.03, -0.056, 0.028],
    separationImpulseRot: [-0.22, 0.31, -0.25],
  },

  // --- LOWER PAVILION-CULET FRAGMENTS (8..11) ---
  {
    archetype: 'pavilion-dagger',
    seed: 9257,
    thetaStart: 0.88,
    thetaEnd: 2.44,
    tier: 'pavilion',
    innerDepth: 0.11,
    stage1OrbitRadius: 1.32,
    stage1OrbitAngle: 4.56,
    stage1OrbitY: -0.74,
    stage1OrbitSpeed: 0.092,
    stage1Scale: 0.77,
    universeOrbitRadius: 3.8,
    universeOrbitEccentricity: 1.14,
    universeOrbitAngle: 1.54,
    universeOrbitTiltX: 0.2,
    universeOrbitTiltZ: 0.11,
    universeOrbitY: -1.14,
    universeOrbitSpeed: 0.038,
    universeScale: 0.9,
    spinRate: [0.042, -0.048, 0.028],
    separationImpulseRot: [0.34, 0.24, -0.26],
  },
  {
    archetype: 'amethyst-blade',
    seed: 10301,
    thetaStart: 2.44,
    thetaEnd: 4.02,
    tier: 'pavilion',
    innerDepth: 0.14,
    stage1OrbitRadius: 1.38,
    stage1OrbitAngle: 5.14,
    stage1OrbitY: -0.62,
    stage1OrbitSpeed: 0.088,
    stage1Scale: 0.76,
    universeOrbitRadius: 4.14,
    universeOrbitEccentricity: 1.13,
    universeOrbitAngle: 2.68,
    universeOrbitTiltX: 0.12,
    universeOrbitTiltZ: 0.17,
    universeOrbitY: -0.46,
    universeOrbitSpeed: 0.034,
    universeScale: 0.88,
    spinRate: [-0.038, 0.052, -0.032],
    separationImpulseRot: [-0.29, 0.33, 0.21],
  },
  {
    archetype: 'culet-fang',
    seed: 11353,
    thetaStart: 4.02,
    thetaEnd: 5.62,
    tier: 'pavilion',
    innerDepth: 0.1,
    stage1OrbitRadius: 1.3,
    stage1OrbitAngle: 5.7,
    stage1OrbitY: -0.78,
    stage1OrbitSpeed: 0.092,
    stage1Scale: 0.77,
    universeOrbitRadius: 3.94,
    universeOrbitEccentricity: 1.16,
    universeOrbitAngle: 3.92,
    universeOrbitTiltX: 0.19,
    universeOrbitTiltZ: -0.14,
    universeOrbitY: 0.84,
    universeOrbitSpeed: 0.037,
    universeScale: 0.89,
    spinRate: [0.034, -0.06, -0.024],
    separationImpulseRot: [0.27, -0.29, 0.24],
  },
  {
    archetype: 'nebula-splinter',
    seed: 12409,
    thetaStart: 5.62,
    thetaEnd: Math.PI * 2 + 0.88,
    tier: 'pavilion',
    innerDepth: 0.16,
    stage1OrbitRadius: 1.4,
    stage1OrbitAngle: 6.12,
    stage1OrbitY: -0.54,
    stage1OrbitSpeed: 0.086,
    stage1Scale: 0.75,
    universeOrbitRadius: 3.88,
    universeOrbitEccentricity: 1.18,
    universeOrbitAngle: 5.36,
    universeOrbitTiltX: 0.17,
    universeOrbitTiltZ: 0.12,
    universeOrbitY: 1.48,
    universeOrbitSpeed: 0.035,
    universeScale: 0.88,
    spinRate: [-0.032, 0.058, -0.026],
    separationImpulseRot: [-0.25, -0.35, -0.19],
  },
];

/**
 * Retained strictly for graph/unit-test compatibility; the permanent 3D constellation web
 * is disabled in the upgraded cosmic view so shards float naturally in deep space.
 */
export const CONSTELLATION_EDGES: ConstellationEdge[] = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 9, to: 10 },
  { from: 10, to: 11 },
  { from: 11, to: 0 },
];

export const STAGE3_VEIL_WORLD_Z = 2.95;
export const STAGE3_FOCUS_WORLD_Z = 4.25;

// Wide diagonal separation between the Black Hole (upper-right) and Hero Planet (far lower-left)
export const BLACK_HOLE_WORLD_POS_DESKTOP: Vec3Tuple = [9.2, 3.85, -10.8];
export const BLACK_HOLE_WORLD_POS_MOBILE: Vec3Tuple = [2.45, 4.15, -9.2];

export const HERO_PLANET_WORLD_POS_DESKTOP: Vec3Tuple = [-15.2, -4.4, -22.4];
export const HERO_PLANET_WORLD_POS_MOBILE: Vec3Tuple = [-5.8, -5.2, -19.5];

/**
 * Computes a controlled gravitational vortex spiral trajectory pulling an object
 * smoothly from its current position toward the Black Hole event horizon as progress goes 0 -> 1.
 */
export function computeBlackHoleVortexPosition(
  origin: Vec3Tuple,
  blackHolePos: Vec3Tuple,
  progress: number,
  shardIndex: number
): Vec3Tuple {
  const t = Math.max(0, Math.min(1, progress));
  const easeIn = t * t * (1.35 - 0.35 * t);
  const dx = origin[0] - blackHolePos[0];
  const dy = origin[1] - blackHolePos[1];
  const dz = origin[2] - blackHolePos[2];

  const radialShrink = Math.max(0.008, 1 - easeIn * 0.992);
  const swirlAngle = easeIn * (2.8 + (shardIndex % 4) * 0.32);
  const cosA = Math.cos(swirlAngle);
  const sinA = Math.sin(swirlAngle);

  const rx = (dx * cosA - dy * sinA) * radialShrink;
  const ry = (dx * sinA + dy * cosA) * radialShrink;
  const rz = dz * Math.max(0.01, 1 - easeIn * 0.99);

  return [blackHolePos[0] + rx, blackHolePos[1] + ry, blackHolePos[2] + rz];
}

/**
 * Computes a fragment's organic gravitational reassembly trajectory from its orbital
 * starting position back to its exact original `homePos` inside the diamond:
 * - Follows an individual 3D curved arc (quadratic Bézier with tangential & vertical lift)
 * - Accelerates smoothly under gravitational pull in Phase A, then damps cleanly into
 *   exact alignment in Phase B (never robotic straight-line motion or teleportation).
 */
export function computeReassemblyTrajectoryPosition(
  startPos: Vec3Tuple,
  homePos: Vec3Tuple,
  progress: number,
  shardIndex: number
): Vec3Tuple {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= 0) return [startPos[0], startPos[1], startPos[2]];
  if (t >= 1) return [homePos[0], homePos[1], homePos[2]];

  // Smooth gravitational acceleration (first half) -> critically damped magnetic lock-in (second half)
  const easeT =
    t < 0.44
      ? 2.2727 * t * t * (0.82 + 0.18 * t)
      : 1 - Math.pow((1 - t) / 0.56, 2.85) * 0.59;
  const s = Math.max(0, Math.min(1, easeT));

  // Individual tangential & vertical curvature orthogonal to the radial pull vector
  const dx = homePos[0] - startPos[0];
  const dy = homePos[1] - startPos[1];
  const dz = homePos[2] - startPos[2];
  const dist = Math.hypot(dx, dy, dz);

  const sideSign = shardIndex % 2 === 0 ? 1 : -1;
  const tierBias = shardIndex < 4 ? 0.22 : shardIndex >= 8 ? -0.22 : 0.06 * sideSign;
  const arcAmp = Math.min(0.42, dist * 0.24);

  // Tangent in XZ plane + vertical lift
  const horizLen = Math.hypot(startPos[0], startPos[2]) || 1;
  const tanX = (-startPos[2] / horizLen) * sideSign * arcAmp;
  const tanZ = (startPos[0] / horizLen) * sideSign * arcAmp * 0.72;
  const liftY = tierBias * arcAmp * 1.15;

  // Bell-shaped curvature envelope that vanishes smoothly to 0 as s -> 1
  const curveEnv = Math.sin(Math.PI * s) * Math.pow(1 - s, 0.85);

  return [
    startPos[0] + dx * s + tanX * curveEnv,
    startPos[1] + dy * s + liftY * curveEnv,
    startPos[2] + dz * s + tanZ * curveEnv,
  ];
}

/**
 * Computes a shard's Stage 2 orbital position with:
 * - Graceful, unhurried orbital motion with distinct phase & inclination per shard
 * - Guaranteed XY radial clearance around the central Cosmic Core
 * - Bounded Z depth strictly behind Stage 6's dimming veil (STAGE3_VEIL_WORLD_Z)
 */
export function computeStage2OrbitalPosition(
  data: CrystalShardGeometryData,
  elapsedTime: number,
  motionScale: number,
  isMobile: boolean
): Vec3Tuple {
  const mobileOrbitXScale = isMobile ? 0.54 : 1.0;
  const mobileOrbitYScale = isMobile ? 1.28 : 1.0;

  // Restrained, serene orbital velocity with subtle harmonic libration
  const sharedDrift = elapsedTime * data.universeOrbitSpeed * motionScale;
  const libration =
    Math.sin(elapsedTime * (0.14 + data.shardIndex * 0.012) * motionScale + data.shardIndex * 1.1) *
    0.055;
  const angle = data.universeOrbitAngle + sharedDrift + libration;

  let ox =
    Math.cos(angle) *
    data.universeOrbitRadius *
    data.universeOrbitEccentricity *
    mobileOrbitXScale;

  const ringHeight =
    Math.sin(angle) *
    (isMobile ? 2.15 : 2.38) *
    (0.74 + 0.26 * Math.cos(data.universeOrbitTiltX * 3));
  let oy =
    (ringHeight * 0.72 +
      data.universeOrbitY * 0.44 +
      Math.cos(elapsedTime * 0.42 * motionScale + data.shardIndex * 1.3) * 0.1) *
    mobileOrbitYScale;

  // Enforce clean radial clearance around central Cosmic Core so no shard overlaps it
  const minClearance = isMobile ? 1.9 : 2.55;
  const xyDist = Math.hypot(ox, oy);
  if (xyDist < minClearance) {
    const safeDist = xyDist > 0.001 ? xyDist : 1;
    const scale = minClearance / safeDist;
    ox *= scale;
    oy *= scale;
  }

  // Keep all background orbital shards strictly behind STAGE3_VEIL_WORLD_Z (2.95)
  const rawZ =
    Math.sin(angle + data.universeOrbitTiltZ * 2.2) * data.universeOrbitRadius * 0.36 - 0.6;
  const oz = Math.min(STAGE3_VEIL_WORLD_Z - 0.85, Math.max(-3.4, rawZ));

  return [ox, oy, oz];
}

/**
 * Evaluates Stage 1 hero orbital position with guaranteed frustum-safe bounds
 * so NO crystal shard ever gets clipped against the container edge.
 */
export function computeStage1OrbitalPosition(
  data: CrystalShardGeometryData,
  elapsedTime: number,
  motionScale: number,
  corePull = 1.0,
  extraAngle = 0
): Vec3Tuple {
  const orbitAngle =
    data.stage1OrbitAngle + elapsedTime * data.stage1OrbitSpeed * motionScale + extraAngle;
  let ox = Math.cos(orbitAngle) * data.stage1OrbitRadius * corePull;
  const oz = Math.sin(orbitAngle) * data.stage1OrbitRadius * 0.45 * corePull;
  let oy =
    data.stage1OrbitY * corePull +
    Math.sin(elapsedTime * 0.58 * motionScale + data.shardIndex * 1.15) * 0.065;

  // Keep a clean sculptural halo around the glowing YADRO core (never clumping over it)
  // while strictly staying inside the camera frustum (<= 1.56) so zero clipping occurs.
  const minClear = 0.94 * corePull;
  const maxPlanar = 1.56;
  const xyDist = Math.hypot(ox, oy);
  if (xyDist < minClear && xyDist > 1e-4) {
    const push = minClear / xyDist;
    ox *= push;
    oy *= push;
  } else if (xyDist > maxPlanar) {
    const clampScale = maxPlanar / xyDist;
    ox *= clampScale;
    oy *= clampScale;
  }

  return [ox, oy, oz];
}

/**
 * Builds a genuine closed volumetric 3D crystal shard directly sliced from the
 * canonical Oval Brilliant Diamond silhouette:
 * - Outer facets match the real diamond crown, bezel, girdle, and pavilion angles (facetKind = 1..6)
 * - Interior fractured cleavage faces taper jaggedly into the diamond core (facetKind = 10)
 * - Recentered around its physical center of mass, storing exact `homeOffset` so when all
 *   12 shards sit at their `homeOffset`, they reconstruct the real diamond volume!
 */
function buildVolumetricDiamondSectorShard(
  spec: FractureSectorSpec,
  shardIndex: number
): CrystalShardGeometryData {
  const rand = createSeededRandom(spec.seed);

  const crownH = DIAMOND_PARAMS.crownHeight;
  const pavD = DIAMOND_PARAMS.pavilionDepth;
  const girdleH = DIAMOND_PARAMS.girdleThickness;
  const tableR = DIAMOND_PARAMS.tableRatio;

  const yTable = crownH + girdleH * 0.5;
  const yCrownMid = crownH * 0.52 + girdleH * 0.5;
  const yGirdleTop = girdleH * 0.5;
  const yGirdleBot = -girdleH * 0.5;
  const yPavMid = -girdleH * 0.5 - pavD * 0.46;
  const yPavLow = -girdleH * 0.5 - pavD * 0.8;
  const yCulet = -girdleH * 0.5 - pavD;

  // Sculptural angular span per shard (compact, solid gem chunk carved from its diamond sector)
  const rawSpan = spec.thetaEnd - spec.thetaStart;
  const tCenter = (spec.thetaStart + spec.thetaEnd) * 0.5;
  const sculptSpan = Math.min(rawSpan * 0.72, 1.08);
  const t0 = tCenter - sculptSpan * 0.5;
  const t1 = tCenter + (rand() - 0.5) * sculptSpan * 0.14;
  const t2 = tCenter + sculptSpan * 0.5;

  // Build 100% WATERTIGHT, closed solid 3D faceted gem chunk:
  // - 3 outer columns (t0, t1, t2) x 3 rows (outerTop, outerMid, outerBot) = polished diamond exterior
  // - 3 inner columns (t0, t1, t2) x 2 rows (innerTop, innerBot) = thick crystalline cleavage interior
  let outerTop: Vec3Tuple[];
  let outerBot: Vec3Tuple[];
  let innerTop: Vec3Tuple[];
  let innerBot: Vec3Tuple[];
  let outerFacetKindTop = 2;
  let outerFacetKindBot = 3;

  const jitter = (amp: number) => (rand() - 0.5) * amp;

  if (spec.tier === 'crown') {
    outerTop = [
      diamondShellPoint(t0, tableR * (0.94 + jitter(0.08)), yTable),
      diamondShellPoint(t1, tableR * (0.98 + jitter(0.06)), yTable + 0.03),
      diamondShellPoint(t2, tableR * (0.92 + jitter(0.08)), yTable),
    ];
    outerBot = [
      diamondShellPoint(t0, 0.98 + jitter(0.03), yGirdleTop + jitter(0.04)),
      diamondShellPoint(t1, 1.02 + jitter(0.02), yGirdleBot + jitter(0.03)),
      diamondShellPoint(t2, 0.97 + jitter(0.03), yGirdleTop + jitter(0.04)),
    ];
    innerTop = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.12 + jitter(0.04), yTable - 0.06),
      diamondShellPoint(t1, spec.innerDepth + 0.04 + jitter(0.04), yCrownMid * 0.72 + jitter(0.05)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.12 + jitter(0.04), yTable - 0.06),
    ];
    innerBot = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.14 + jitter(0.04), yGirdleBot - 0.12),
      diamondShellPoint(t1, spec.innerDepth + 0.06 + jitter(0.04), yGirdleBot - 0.18 + jitter(0.05)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.14 + jitter(0.04), yGirdleBot - 0.12),
    ];
    outerFacetKindTop = 1;
    outerFacetKindBot = 3;
  } else if (spec.tier === 'girdle') {
    outerTop = [
      diamondShellPoint(t0, 0.94 + jitter(0.04), yCrownMid * 0.62 + jitter(0.05)),
      diamondShellPoint(t1, 1.01 + jitter(0.02), yGirdleTop + 0.06 + jitter(0.04)),
      diamondShellPoint(t2, 0.93 + jitter(0.04), yCrownMid * 0.58 + jitter(0.05)),
    ];
    outerBot = [
      diamondShellPoint(t0, 0.58 + jitter(0.04), yPavMid + jitter(0.06)),
      diamondShellPoint(t1, 0.54 + jitter(0.04), yPavMid - 0.1 + jitter(0.06)),
      diamondShellPoint(t2, 0.59 + jitter(0.04), yPavMid + jitter(0.06)),
    ];
    innerTop = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.16 + jitter(0.04), yGirdleTop - 0.02),
      diamondShellPoint(t1, spec.innerDepth + 0.06 + jitter(0.04), yGirdleBot - 0.04 + jitter(0.05)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.16 + jitter(0.04), yGirdleTop - 0.02),
    ];
    innerBot = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.12 + jitter(0.04), yPavMid * 0.78),
      diamondShellPoint(t1, spec.innerDepth + 0.04 + jitter(0.04), yPavMid * 0.9 + jitter(0.05)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.12 + jitter(0.04), yPavMid * 0.78),
    ];
    outerFacetKindTop = 4;
    outerFacetKindBot = 5;
  } else {
    // Pavilion-culet elongated crystalline gem daggers
    outerTop = [
      diamondShellPoint(t0, 0.64 + jitter(0.04), yPavMid * 0.8 + jitter(0.05)),
      diamondShellPoint(t1, 0.68 + jitter(0.04), yPavMid * 0.72 + jitter(0.05)),
      diamondShellPoint(t2, 0.65 + jitter(0.04), yPavMid * 0.82 + jitter(0.05)),
    ];
    outerBot = [
      diamondShellPoint(t0, 0.28 + jitter(0.03), yPavLow + jitter(0.04)),
      diamondShellPoint(t1, 0.14 + jitter(0.03), yCulet + 0.04 + jitter(0.03)),
      diamondShellPoint(t2, 0.28 + jitter(0.03), yPavLow + jitter(0.04)),
    ];
    innerTop = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.14 + jitter(0.04), yPavMid * 0.72),
      diamondShellPoint(t1, spec.innerDepth + 0.06 + jitter(0.04), yPavMid * 0.64 + jitter(0.04)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.14 + jitter(0.04), yPavMid * 0.72),
    ];
    innerBot = [
      diamondShellPoint(t0 + sculptSpan * 0.14, spec.innerDepth + 0.08 + jitter(0.03), yPavLow * 0.88),
      diamondShellPoint(t1, spec.innerDepth + 0.02 + jitter(0.03), yCulet + 0.12 + jitter(0.04)),
      diamondShellPoint(t2 - sculptSpan * 0.14, spec.innerDepth + 0.08 + jitter(0.03), yPavLow * 0.88),
    ];
    outerFacetKindTop = 5;
    outerFacetKindBot = 6;
  }

  // Faceted bevel ridge along mid-outer strip so each chunk has crisp jewel-like convexity
  const outerMid: Vec3Tuple[] = outerTop.map((pTop, idx) => {
    const pBot = outerBot[idx];
    const m = lerp3(pTop, pBot, 0.48 + jitter(0.06));
    const radScale = idx === 1 ? 1.14 : 1.07;
    return [m[0] * radScale, m[1], m[2] * radScale];
  });

  // Compute physical centroid inside the intact diamond -> exact homeOffset
  const allWorldPts: Vec3Tuple[] = [...outerTop, ...outerMid, ...outerBot, ...innerTop, ...innerBot];
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const p of allWorldPts) {
    cx += p[0];
    cy += p[1];
    cz += p[2];
  }
  cx /= allWorldPts.length;
  cy /= allWorldPts.length;
  cz /= allWorldPts.length;

  const homeOffset: Vec3Tuple = [cx, cy, cz];
  const fractureDir = normalize3([cx, cy + (spec.tier === 'crown' ? 0.22 : spec.tier === 'pavilion' ? -0.25 : 0.02), cz]);

  const recenter = (p: Vec3Tuple): Vec3Tuple => [p[0] - cx, p[1] - cy, p[2] - cz];
  const cTop = outerTop.map(recenter);
  const cMid = outerMid.map(recenter);
  const cBot = outerBot.map(recenter);
  const cInTop = innerTop.map(recenter);
  const cInBot = innerBot.map(recenter);

  let maxRadius = 0;
  for (const p of [...cTop, ...cMid, ...cBot, ...cInTop, ...cInBot]) {
    maxRadius = Math.max(maxRadius, Math.hypot(p[0], p[1], p[2]));
  }
  const safeMaxR = maxRadius || 0.5;

  const posList: number[] = [];
  const normList: number[] = [];
  const metaList: number[] = [];
  const edgeSet = new Set<string>();
  const edgeList: number[] = [];
  let facetCounter = 0;

  const addCreaseEdge = (a: Vec3Tuple, b: Vec3Tuple) => {
    const ka = `${a[0].toFixed(4)},${a[1].toFixed(4)},${a[2].toFixed(4)}`;
    const kb = `${b[0].toFixed(4)},${b[1].toFixed(4)},${b[2].toFixed(4)}`;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edgeList.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  };

  const emitTriangle = (a: Vec3Tuple, b: Vec3Tuple, c: Vec3Tuple, facetKind: number) => {
    const facetId = facetCounter++;
    const ab = sub3(b, a);
    const ac = sub3(c, a);
    const cross = cross3(ab, ac);
    if (Math.hypot(cross[0], cross[1], cross[2]) < 1e-6) return;
    let n = normalize3(cross);
    const centroid: Vec3Tuple = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ];
    // Centroid of closed convex-like polyhedron sits strictly inside at (0,0,0),
    // so dot(n, centroid) > 0 guarantees consistent outward normals on all 6 faces!
    const dotOut = n[0] * centroid[0] + n[1] * centroid[1] + n[2] * centroid[2];
    let v1 = a;
    let v2 = b;
    let v3 = c;
    if (dotOut < 0) {
      v2 = c;
      v3 = b;
      n = [-n[0], -n[1], -n[2]];
    }

    const facetNormId = ((facetId + shardIndex * 11) % 37) / 37;
    for (const v of [v1, v2, v3]) {
      posList.push(v[0], v[1], v[2]);
      normList.push(n[0], n[1], n[2]);
      const radial = Math.min(1, Math.hypot(v[0], v[2]) / safeMaxR);
      const rim = Math.min(1, Math.hypot(v[0], v[1], v[2]) / safeMaxR);
      metaList.push(facetKind, facetNormId, radial, rim);
    }
  };

  // Helper to emit a watertight faceted quad WITHOUT adding its internal diagonal to crease edges
  const emitQuad = (
    p00: Vec3Tuple,
    p10: Vec3Tuple,
    p11: Vec3Tuple,
    p01: Vec3Tuple,
    facetKind: number
  ) => {
    emitTriangle(p00, p10, p11, facetKind);
    emitTriangle(p00, p11, p01, facetKind);
    addCreaseEdge(p00, p10);
    addCreaseEdge(p10, p11);
    addCreaseEdge(p11, p01);
    addCreaseEdge(p01, p00);
  };

  // 1. Polished exterior diamond facets (2 cols x 2 rows = 4 crisp beveled gem quads = 8 triangles)
  for (let i = 0; i < 2; i++) {
    emitQuad(cTop[i], cTop[i + 1], cMid[i + 1], cMid[i], outerFacetKindTop);
    emitQuad(cMid[i], cMid[i + 1], cBot[i + 1], cBot[i], outerFacetKindBot);
  }

  // 2. Watertight interior fractured crystalline cleavage faces (facetKind = 10)
  // Top cleavage cap (2 quads)
  for (let i = 0; i < 2; i++) {
    emitQuad(cInTop[i], cInTop[i + 1], cTop[i + 1], cTop[i], 10);
  }
  // Bottom cleavage cap (2 quads)
  for (let i = 0; i < 2; i++) {
    emitQuad(cBot[i], cBot[i + 1], cInBot[i + 1], cInBot[i], 10);
  }
  // Back interior cleavage spine (2 quads closing the entire back solid volume!)
  for (let i = 0; i < 2; i++) {
    emitQuad(cInBot[i], cInBot[i + 1], cInTop[i + 1], cInTop[i], 10);
  }
  // Left cleavage end-cap (pentagon split cleanly into 3 watertight triangles)
  emitTriangle(cTop[0], cMid[0], cInTop[0], 10);
  emitTriangle(cMid[0], cBot[0], cInBot[0], 10);
  emitTriangle(cMid[0], cInBot[0], cInTop[0], 10);
  addCreaseEdge(cTop[0], cInTop[0]);
  addCreaseEdge(cBot[0], cInBot[0]);
  addCreaseEdge(cInTop[0], cInBot[0]);

  // Right cleavage end-cap (pentagon split cleanly into 3 watertight triangles)
  emitTriangle(cTop[2], cInTop[2], cMid[2], 10);
  emitTriangle(cMid[2], cInBot[2], cBot[2], 10);
  emitTriangle(cMid[2], cInTop[2], cInBot[2], 10);
  addCreaseEdge(cTop[2], cInTop[2]);
  addCreaseEdge(cBot[2], cInBot[2]);
  addCreaseEdge(cInTop[2], cInBot[2]);

  return {
    shardIndex,
    positions: new Float32Array(posList),
    normals: new Float32Array(normList),
    facetMeta: new Float32Array(metaList),
    edgePositions: new Float32Array(edgeList),
    triangleCount: posList.length / 9,
    facetCount: facetCounter,
    boundingRadius: safeMaxR,
    homeOffset,
    fractureDir,
    homeRotation: [0, 0, 0],
    separationImpulseRot: spec.separationImpulseRot,
    stage1OrbitRadius: spec.stage1OrbitRadius,
    stage1OrbitAngle: spec.stage1OrbitAngle,
    stage1OrbitY: spec.stage1OrbitY,
    stage1OrbitSpeed: spec.stage1OrbitSpeed,
    stage1Scale: spec.stage1Scale,
    universeOrbitRadius: spec.universeOrbitRadius,
    universeOrbitEccentricity: spec.universeOrbitEccentricity,
    universeOrbitAngle: spec.universeOrbitAngle,
    universeOrbitTiltX: spec.universeOrbitTiltX,
    universeOrbitTiltZ: spec.universeOrbitTiltZ,
    universeOrbitY: spec.universeOrbitY,
    universeOrbitSpeed: spec.universeOrbitSpeed,
    universeScale: spec.universeScale,
    spinRate: spec.spinRate,
    archetype: spec.archetype,
  };
}

let cachedShards: CrystalShardGeometryData[] | null = null;

/**
 * Deterministically builds and caches the exact 12 volumetric asymmetric 3D diamond fragments.
 */
export function buildUniqueCrystalShardsData(): CrystalShardGeometryData[] {
  if (!cachedShards) {
    cachedShards = FRACTURE_SECTOR_SPECS.map((spec, idx) =>
      buildVolumetricDiamondSectorShard(spec, idx)
    );
  }
  return cachedShards;
}

let cachedCrackNetwork: DiamondCrackNetworkData | null = null;

/**
 * Builds a genuine branching 3D fracture crack network propagating INSIDE and ACROSS
 * the Oval Brilliant Diamond volume from 5 staggered stress nucleation origins.
 * Each vertex carries an exact `propagationOrder` (0..1) so Phase A & Phase B shaders
 * visibly grow fractures organically over time instead of popping all lines at once.
 */
export function buildDiamondCrackNetworkData(): DiamondCrackNetworkData {
  if (cachedCrackNetwork) return cachedCrackNetwork;

  const rand = createSeededRandom(44091);
  const posList: number[] = [];
  const orderList: number[] = [];
  const intensityList: number[] = [];
  const sparkOrigins: Vec3Tuple[] = [];

  const crownH = DIAMOND_PARAMS.crownHeight;
  const pavD = DIAMOND_PARAMS.pavilionDepth;
  const girdleH = DIAMOND_PARAMS.girdleThickness;
  const yTable = crownH + girdleH * 0.5;
  const yGirdle = 0;
  const yPavMid = -pavD * 0.52;
  const yCulet = -pavD * 0.94;

  // 5 staggered nucleation sites on real diamond ridges & internal heart
  const seeds: { pos: Vec3Tuple; startOrder: number; dirTheta: number }[] = [
    { pos: diamondShellPoint(0.45, 0.62, yTable * 0.94), startOrder: 0.02, dirTheta: 0.45 },
    { pos: diamondShellPoint(2.15, 0.96, yGirdle + 0.04), startOrder: 0.14, dirTheta: 2.15 },
    { pos: diamondShellPoint(3.95, 0.74, yPavMid * 0.72), startOrder: 0.24, dirTheta: 3.95 },
    { pos: diamondShellPoint(5.25, 0.94, yGirdle - 0.03), startOrder: 0.32, dirTheta: 5.25 },
    { pos: [0.04, -0.18, -0.05], startOrder: 0.18, dirTheta: 1.2 },
  ];

  const emitCrackSegment = (
    a: Vec3Tuple,
    b: Vec3Tuple,
    ordA: number,
    ordB: number,
    weight: number
  ) => {
    posList.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    orderList.push(ordA, ordB);
    intensityList.push(weight, weight);
  };

  // Generate branching jagged primary & secondary fracture lines connecting nucleation sites
  // across the diamond surface & interior cleavage seams
  for (let sIdx = 0; sIdx < seeds.length; sIdx++) {
    const seed = seeds[sIdx];
    sparkOrigins.push(seed.pos);

    const branchCount = sIdx === 4 ? 5 : 3;
    for (let b = 0; b < branchCount; b++) {
      let curr = seed.pos;
      let currOrder = seed.startOrder + b * 0.055;
      const targetTheta =
        seed.dirTheta + (b - (branchCount - 1) * 0.5) * 1.15 + (rand() - 0.5) * 0.45;
      const targetTier = (sIdx + b) % 3;
      const targetY =
        targetTier === 0 ? yTable * 0.85 : targetTier === 1 ? yGirdle : targetTier === 2 ? yPavMid : yCulet;
      const targetR = targetTier === 0 ? 0.58 : targetTier === 1 ? 0.99 : 0.48;
      const endPt = diamondShellPoint(targetTheta, targetR, targetY);

      const steps = 5;
      for (let step = 1; step <= steps; step++) {
        const frac = step / steps;
        const basePt = lerp3(seed.pos, endPt, frac);
        // Jagged crystal cleavage kink
        const kink = step < steps ? 0.11 : 0.02;
        const nextPt: Vec3Tuple = [
          basePt[0] + (rand() - 0.5) * kink,
          basePt[1] + (rand() - 0.5) * kink,
          basePt[2] + (rand() - 0.5) * kink,
        ];
        const nextOrder = Math.min(0.98, currOrder + 0.11 + rand() * 0.04);
        emitCrackSegment(curr, nextPt, currOrder, nextOrder, 1.0);

        if (step === 2 || step === 4) {
          sparkOrigins.push(nextPt);
          // Secondary fine crystalline hairline splinter branching off the main fissure
          const spurDir = normalize3([
            (rand() - 0.5) * 1.4,
            (rand() - 0.5) * 1.2,
            (rand() - 0.5) * 1.4,
          ]);
          const spurMid = add3(nextPt, scale3(spurDir, 0.22 + rand() * 0.12));
          const spurEnd = add3(
            spurMid,
            scale3(normalize3(add3(spurDir, [(rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6])), 0.18)
          );
          const spurOrderMid = Math.min(0.98, nextOrder + 0.09);
          const spurOrderEnd = Math.min(1.0, spurOrderMid + 0.09);
          emitCrackSegment(nextPt, spurMid, nextOrder, spurOrderMid, 0.62);
          emitCrackSegment(spurMid, spurEnd, spurOrderMid, spurOrderEnd, 0.45);
        }

        curr = nextPt;
        currOrder = nextOrder;
      }
    }
  }

  // Deep internal core-to-seam cleavage veins radiating out along the 12 real shard centroids
  const builtShards = buildUniqueCrystalShardsData();
  for (let i = 0; i < builtShards.length; i++) {
    const shard = builtShards[i];
    const startOrd = 0.26 + (i / builtShards.length) * 0.34;
    const innerPt = scale3(shard.homeOffset, 0.22);
    const midPt = add3(scale3(shard.homeOffset, 0.72), [
      (rand() - 0.5) * 0.09,
      (rand() - 0.5) * 0.09,
      (rand() - 0.5) * 0.09,
    ]);
    const outerPt = scale3(shard.homeOffset, 1.24);
    emitCrackSegment(innerPt, midPt, startOrd, Math.min(0.95, startOrd + 0.16), 0.92);
    emitCrackSegment(midPt, outerPt, Math.min(0.95, startOrd + 0.16), Math.min(1.0, startOrd + 0.3), 0.85);
  }

  cachedCrackNetwork = {
    positions: new Float32Array(posList),
    propagationOrder: new Float32Array(orderList),
    intensity: new Float32Array(intensityList),
    sparkOrigins,
    segmentCount: posList.length / 6,
  };
  return cachedCrackNetwork;
}
