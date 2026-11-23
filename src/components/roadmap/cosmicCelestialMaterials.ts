import * as THREE from 'three';
import { PlanetArchetype } from '../../utils/roadmapEngine';

// -----------------------------------------------------------------------------
// Deterministic 3D Value Noise & fBm Helpers (Seamless Spherical Wrapping)
// -----------------------------------------------------------------------------

function hash2D(x: number, y: number, seed = 1337): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function hash3D(x: number, y: number, z: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function valueNoise3D(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const fz = smoothstep(z - iz);

  const c000 = hash3D(ix, iy, iz, seed);
  const c100 = hash3D(ix + 1, iy, iz, seed);
  const c010 = hash3D(ix, iy + 1, iz, seed);
  const c110 = hash3D(ix + 1, iy + 1, iz, seed);
  const c001 = hash3D(ix, iy, iz + 1, seed);
  const c101 = hash3D(ix + 1, iy, iz + 1, seed);
  const c011 = hash3D(ix, iy + 1, iz + 1, seed);
  const c111 = hash3D(ix + 1, iy + 1, iz + 1, seed);

  const x00 = lerp(c000, c100, fx);
  const x10 = lerp(c010, c110, fx);
  const x01 = lerp(c001, c101, fx);
  const x11 = lerp(c011, c111, fx);

  const y0 = lerp(x00, x10, fy);
  const y1 = lerp(x01, x11, fy);

  return lerp(y0, y1, fz);
}

function fbm3D(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise3D(x * frequency, y * frequency, z * frequency, seed + i * 31);
    frequency *= 2.04;
    amplitude *= 0.5;
  }
  return value;
}

// -----------------------------------------------------------------------------
// Planetary Archetype Visual Specs (3D-Shaded Celestial Worlds)
// -----------------------------------------------------------------------------

export interface ArchetypeVisualSpec {
  label: string;
  subtitle: string;
  baseRadius: number;
  atmosphereColor: string;
  atmosphereIntensity: number;
  hasClouds: boolean;
  hasRings: boolean;
  ringStyle: 'none' | 'sapphire_ice' | 'saturn_gold';
  roughnessBase: number;
  metalnessBase: number;
  clearcoat: number;
  emissiveColor: string;
  emissiveIntensity: number;
  seed: number;
}

export const PLANET_ARCHETYPE_SPECS: Record<PlanetArchetype, ArchetypeVisualSpec> = {
  emerald_horizon: {
    label: 'Emerald Ocean World',
    subtitle: 'Emerald Seas & Swirling Cloud Deck',
    baseRadius: 2.75,
    atmosphereColor: '#34d399',
    atmosphereIntensity: 0.92,
    hasClouds: true,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.42,
    metalnessBase: 0.08,
    clearcoat: 0.45,
    emissiveColor: '#064e3b',
    emissiveIntensity: 0.14,
    seed: 101,
  },
  sapphire_crown: {
    label: 'Sapphire Ice Giant',
    subtitle: 'Banded Sapphire Atmosphere & Ice Rings',
    baseRadius: 2.85,
    atmosphereColor: '#38bdf8',
    atmosphereIntensity: 1.05,
    hasClouds: false,
    hasRings: true,
    ringStyle: 'sapphire_ice',
    roughnessBase: 0.36,
    metalnessBase: 0.12,
    clearcoat: 0.6,
    emissiveColor: '#0c4a6e',
    emissiveIntensity: 0.18,
    seed: 217,
  },
  oceanic_biosphere: {
    label: 'Azure Biosphere',
    subtitle: 'Cobalt Oceans & Atmospheric Swirls',
    baseRadius: 2.55,
    atmosphereColor: '#22d3ee',
    atmosphereIntensity: 0.88,
    hasClouds: true,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.38,
    metalnessBase: 0.08,
    clearcoat: 0.5,
    emissiveColor: '#083344',
    emissiveIntensity: 0.14,
    seed: 319,
  },
  ringed_gas_giant: {
    label: 'Ringed Gas Giant',
    subtitle: 'Golden-Ochre Bands & Cassini Rings',
    baseRadius: 3.1,
    atmosphereColor: '#fbbf24',
    atmosphereIntensity: 0.86,
    hasClouds: false,
    hasRings: true,
    ringStyle: 'saturn_gold',
    roughnessBase: 0.56,
    metalnessBase: 0.05,
    clearcoat: 0.18,
    emissiveColor: '#451a03',
    emissiveIntensity: 0.12,
    seed: 673,
  },
  ice_crystalline: {
    label: 'Glacier Crystalline World',
    subtitle: 'Violet-Silver Frost Ridges & Ice Plains',
    baseRadius: 2.45,
    atmosphereColor: '#818cf8',
    atmosphereIntensity: 0.85,
    hasClouds: false,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.28,
    metalnessBase: 0.18,
    clearcoat: 0.72,
    emissiveColor: '#1e1b4b',
    emissiveIntensity: 0.16,
    seed: 557,
  },
  volcanic_forge: {
    label: 'Volcanic Forge',
    subtitle: 'Obsidian Crust & Molten Magma Veins',
    baseRadius: 2.5,
    atmosphereColor: '#fb923c',
    atmosphereIntensity: 0.84,
    hasClouds: false,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.72,
    metalnessBase: 0.12,
    clearcoat: 0.1,
    emissiveColor: '#ea580c',
    emissiveIntensity: 0.42,
    seed: 443,
  },
  amber_citadel: {
    label: 'Amber Citadel World',
    subtitle: 'Sunlit Sandstone Canyons & Golden Haze',
    baseRadius: 2.4,
    atmosphereColor: '#fcd34d',
    atmosphereIntensity: 0.82,
    hasClouds: false,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.64,
    metalnessBase: 0.06,
    clearcoat: 0.14,
    emissiveColor: '#78350f',
    emissiveIntensity: 0.16,
    seed: 787,
  },
  terrestrial_rocky: {
    label: 'Terrestrial Frontier',
    subtitle: 'Highland Continents & Thin Haze',
    baseRadius: 2.45,
    atmosphereColor: '#60a5fa',
    atmosphereIntensity: 0.78,
    hasClouds: true,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.62,
    metalnessBase: 0.06,
    clearcoat: 0.2,
    emissiveColor: '#0f172a',
    emissiveIntensity: 0.1,
    seed: 149,
  },
  atmospheric_super_earth: {
    label: 'Super-Earth Sanctuary',
    subtitle: 'Teal-Indigo Atmosphere & Cloud Bands',
    baseRadius: 2.6,
    atmosphereColor: '#38bdf8',
    atmosphereIntensity: 0.9,
    hasClouds: true,
    hasRings: false,
    ringStyle: 'none',
    roughnessBase: 0.45,
    metalnessBase: 0.08,
    clearcoat: 0.42,
    emissiveColor: '#0c4a6e',
    emissiveIntensity: 0.15,
    seed: 263,
  },
};

// -----------------------------------------------------------------------------
// Deep-Space Studio Reflection Environment Texture
// -----------------------------------------------------------------------------

export function createCosmicEnvironmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#04081a');
  grad.addColorStop(0.32, '#0e1738');
  grad.addColorStop(0.5, '#192952');
  grad.addColorStop(0.7, '#0b1530');
  grad.addColorStop(1, '#030612');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle indigo/teal nebula bounce + warm solar rim in env reflection
  const coolBounce = ctx.createRadialGradient(140, 95, 10, 140, 95, 140);
  coolBounce.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
  coolBounce.addColorStop(0.45, 'rgba(99, 102, 241, 0.18)');
  coolBounce.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coolBounce;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const warmSolar = ctx.createRadialGradient(380, 128, 8, 380, 128, 125);
  warmSolar.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
  warmSolar.addColorStop(0.4, 'rgba(245, 158, 11, 0.24)');
  warmSolar.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = warmSolar;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// -----------------------------------------------------------------------------
// Procedural Seamless Planetary Surface, Bump, Roughness, Emissive & Cloud Maps
// -----------------------------------------------------------------------------

interface PlanetTextureBundle {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap?: THREE.CanvasTexture;
  cloudMap?: THREE.CanvasTexture;
}

const planetTextureCache = new Map<PlanetArchetype, PlanetTextureBundle>();

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
  ];
}

function getOrCreatePlanetTextures(archetype: PlanetArchetype): PlanetTextureBundle {
  const cached = planetTextureCache.get(archetype);
  if (cached) return cached;

  const spec = PLANET_ARCHETYPE_SPECS[archetype] || PLANET_ARCHETYPE_SPECS.oceanic_biosphere;
  const width = 320;
  const height = 160;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const albedoCtx = albedoCanvas.getContext('2d')!;
  const albedoImg = albedoCtx.createImageData(width, height);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  const bumpImg = bumpCtx.createImageData(width, height);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(width, height);

  const needsEmissive = archetype === 'volcanic_forge' || archetype === 'ice_crystalline';
  let emissiveCanvas: HTMLCanvasElement | undefined;
  let emissiveCtx: CanvasRenderingContext2D | undefined;
  let emissiveImg: ImageData | undefined;
  if (needsEmissive) {
    emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = width;
    emissiveCanvas.height = height;
    emissiveCtx = emissiveCanvas.getContext('2d')!;
    emissiveImg = emissiveCtx.createImageData(width, height);
  }

  const seed = spec.seed;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const lat = (v - 0.5) * Math.PI; // -pi/2 to pi/2
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.abs(sinLat);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const lon = u * Math.PI * 2;
      const sx = Math.cos(lon) * cosLat;
      const sy = sinLat;
      const sz = Math.sin(lon) * cosLat;

      const idx = (y * width + x) * 4;
      let rgb: [number, number, number] = [90, 150, 210];
      let bumpVal = 128;
      let roughVal = 140;
      let emRgb: [number, number, number] = [0, 0, 0];

      if (archetype === 'emerald_horizon') {
        // Rich emerald oceans, turquoise shallows, luminous jade/golden continents & polar frost
        const n = fbm3D(sx * 2.4, sy * 2.4, sz * 2.4, seed, 4);
        const detail = fbm3D(sx * 6.5 + n, sy * 6.5, sz * 6.5 - n, seed + 55, 3);
        const elevation = n * 0.72 + detail * 0.28;

        if (absLat > 0.86 - detail * 0.08) {
          rgb = mixRgb([210, 245, 240], [248, 252, 255], detail);
          bumpVal = 150;
          roughVal = 160;
        } else if (elevation < 0.49) {
          const depthT = Math.max(0, Math.min(1, elevation / 0.49));
          rgb = mixRgb([6, 48, 56], [16, 165, 132], Math.pow(depthT, 1.5));
          bumpVal = 92;
          roughVal = 58; // Glossy ocean specular
        } else if (elevation < 0.55) {
          rgb = mixRgb([20, 184, 148], [110, 231, 183], (elevation - 0.49) / 0.06);
          bumpVal = 128;
          roughVal = 115;
        } else {
          const landT = Math.min(1, (elevation - 0.55) / 0.34);
          rgb = mixRgb([22, 130, 88], [186, 216, 132], landT);
          bumpVal = Math.round(145 + landT * 95);
          roughVal = Math.round(175 + landT * 50);
        }
      } else if (archetype === 'sapphire_crown') {
        // Banded sapphire ice-giant with swirling turquoise storm jets & icy polar hood
        const swirl = fbm3D(sx * 3.1, sy * 5.2, sz * 3.1, seed, 4);
        const bandCoord = sy * 7.8 + (swirl - 0.5) * 1.45;
        const bandWave = 0.5 + 0.5 * Math.sin(bandCoord * Math.PI);
        const storm = fbm3D(sx * 5.4 + swirl, sy * 4.2, sz * 5.4, seed + 88, 3);

        const deepSapphire: [number, number, number] = [14, 48, 128];
        const royalBlue: [number, number, number] = [29, 114, 224];
        const iceCyan: [number, number, number] = [104, 216, 252];
        const frostWhite: [number, number, number] = [212, 242, 255];

        rgb = mixRgb(deepSapphire, royalBlue, bandWave);
        rgb = mixRgb(rgb, iceCyan, Math.max(0, (storm - 0.46) * 1.75));
        if (absLat > 0.78) {
          rgb = mixRgb(rgb, frostWhite, (absLat - 0.78) / 0.22);
        }
        bumpVal = Math.round(115 + bandWave * 30 + storm * 25);
        roughVal = Math.round(85 + (1 - bandWave) * 55);
      } else if (archetype === 'ringed_gas_giant') {
        // Saturn-like banded golden-ochre, cream, burnt sienna & storm-eddy gas giant
        const turb = fbm3D(sx * 2.8, sy * 5.8, sz * 2.8, seed, 4);
        const fine = fbm3D(sx * 6.0, sy * 9.5, sz * 6.0, seed + 41, 3);
        const yBand = sy * 10.5 + (turb - 0.5) * 1.35 + (fine - 0.5) * 0.45;
        const b1 = 0.5 + 0.5 * Math.sin(yBand * 1.15);
        const b2 = 0.5 + 0.5 * Math.cos(yBand * 2.4 + 0.8);

        const creamGold: [number, number, number] = [245, 224, 178];
        const warmOchre: [number, number, number] = [218, 166, 98];
        const siennaBand: [number, number, number] = [154, 96, 56];
        const paleHaze: [number, number, number] = [252, 240, 208];

        rgb = mixRgb(siennaBand, warmOchre, b1);
        rgb = mixRgb(rgb, creamGold, b2 * 0.72);
        if (fine > 0.62) {
          rgb = mixRgb(rgb, paleHaze, (fine - 0.62) * 1.5);
        }
        if (absLat > 0.8) {
          rgb = mixRgb(rgb, [146, 134, 118], (absLat - 0.8) * 2.5);
        }
        bumpVal = Math.round(118 + b1 * 24 + fine * 18);
        roughVal = Math.round(135 + b2 * 38);
      } else if (archetype === 'oceanic_biosphere' || archetype === 'atmospheric_super_earth') {
        const n = fbm3D(sx * 2.5, sy * 2.5, sz * 2.5, seed, 4);
        const d = fbm3D(sx * 6.2, sy * 6.2, sz * 6.2, seed + 77, 3);
        const elev = n * 0.7 + d * 0.3;
        if (absLat > 0.84 - d * 0.08) {
          rgb = [232, 246, 255];
          bumpVal = 152;
          roughVal = 155;
        } else if (elev < 0.52) {
          rgb = mixRgb([9, 38, 86], [20, 148, 214], Math.pow(elev / 0.52, 1.4));
          bumpVal = 90;
          roughVal = 52;
        } else {
          const lt = Math.min(1, (elev - 0.52) / 0.34);
          rgb = mixRgb([34, 142, 126], [198, 186, 136], lt);
          bumpVal = Math.round(148 + lt * 92);
          roughVal = Math.round(182 + lt * 48);
        }
      } else if (archetype === 'ice_crystalline') {
        const n = fbm3D(sx * 3.0, sy * 3.0, sz * 3.0, seed, 4);
        const ridge = Math.abs(fbm3D(sx * 6.4, sy * 6.4, sz * 6.4, seed + 19, 3) - 0.5) * 2.0;
        const crack = Math.pow(1.0 - ridge, 4.0);
        rgb = mixRgb([76, 98, 168], [206, 228, 255], n);
        rgb = mixRgb(rgb, [148, 198, 255], crack * 0.75);
        bumpVal = Math.round(120 + n * 75 - crack * 50);
        roughVal = Math.round(70 + (1 - n) * 65);
        emRgb = [Math.round(56 * crack), Math.round(140 * crack), Math.round(240 * crack)];
      } else if (archetype === 'volcanic_forge') {
        const n = fbm3D(sx * 3.2, sy * 3.2, sz * 3.2, seed, 4);
        const ridge = Math.abs(fbm3D(sx * 5.8, sy * 5.8, sz * 5.8, seed + 33, 3) - 0.5) * 2.0;
        const lava = Math.pow(Math.max(0, 1.0 - ridge * 1.45), 3.2);
        rgb = mixRgb([28, 24, 30], [82, 54, 48], n);
        rgb = mixRgb(rgb, [255, 132, 36], lava);
        bumpVal = Math.round(135 + n * 85 - lava * 70);
        roughVal = Math.round(195 - lava * 110);
        emRgb = [Math.round(255 * lava), Math.round(115 * lava), Math.round(22 * lava)];
      } else if (archetype === 'amber_citadel') {
        const n = fbm3D(sx * 2.9, sy * 2.9, sz * 2.9, seed, 4);
        const canyon = fbm3D(sx * 7.0, sy * 4.5, sz * 7.0, seed + 61, 3);
        const h = n * 0.65 + canyon * 0.35;
        rgb = mixRgb([124, 68, 36], [244, 194, 118], h);
        bumpVal = Math.round(110 + h * 120);
        roughVal = Math.round(168 + (1 - h) * 55);
      } else {
        // terrestrial_rocky
        const n = fbm3D(sx * 3.4, sy * 3.4, sz * 3.4, seed, 4);
        const d = fbm3D(sx * 7.2, sy * 7.2, sz * 7.2, seed + 29, 3);
        const h = n * 0.7 + d * 0.3;
        rgb = mixRgb([44, 58, 86], [156, 178, 206], h);
        bumpVal = Math.round(100 + h * 135);
        roughVal = Math.round(170 + d * 60);
      }

      albedoImg.data[idx] = rgb[0];
      albedoImg.data[idx + 1] = rgb[1];
      albedoImg.data[idx + 2] = rgb[2];
      albedoImg.data[idx + 3] = 255;

      bumpImg.data[idx] = bumpVal;
      bumpImg.data[idx + 1] = bumpVal;
      bumpImg.data[idx + 2] = bumpVal;
      bumpImg.data[idx + 3] = 255;

      roughImg.data[idx] = roughVal;
      roughImg.data[idx + 1] = roughVal;
      roughImg.data[idx + 2] = roughVal;
      roughImg.data[idx + 3] = 255;

      if (emissiveImg) {
        emissiveImg.data[idx] = emRgb[0];
        emissiveImg.data[idx + 1] = emRgb[1];
        emissiveImg.data[idx + 2] = emRgb[2];
        emissiveImg.data[idx + 3] = 255;
      }
    }
  }

  albedoCtx.putImageData(albedoImg, 0, 0);
  bumpCtx.putImageData(bumpImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.ClampToEdgeWrapping;
  albedoMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.needsUpdate = true;

  let emissiveMap: THREE.CanvasTexture | undefined;
  if (emissiveCanvas && emissiveCtx && emissiveImg) {
    emissiveCtx.putImageData(emissiveImg, 0, 0);
    emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.wrapS = THREE.RepeatWrapping;
    emissiveMap.needsUpdate = true;
  }

  let cloudMap: THREE.CanvasTexture | undefined;
  if (spec.hasClouds) {
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 256;
    cloudCanvas.height = 128;
    const cCtx = cloudCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(256, 128);

    for (let y = 0; y < 128; y++) {
      const lat = (y / 127 - 0.5) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      for (let x = 0; x < 256; x++) {
        const lon = (x / 256) * Math.PI * 2;
        const sx = Math.cos(lon) * cosLat;
        const sy = sinLat;
        const sz = Math.sin(lon) * cosLat;

        const swirl = fbm3D(sx * 2.2, sy * 3.8, sz * 2.2, seed + 501, 3);
        const wisp = fbm3D(sx * 4.4 + swirl * 1.2, sy * 4.4, sz * 4.4 - swirl, seed + 613, 4);
        const alpha = Math.max(0, Math.min(1, (wisp - 0.49) * 2.9));
        const idx = (y * 256 + x) * 4;
        cImg.data[idx] = 244;
        cImg.data[idx + 1] = 250;
        cImg.data[idx + 2] = 255;
        cImg.data[idx + 3] = Math.round(alpha * 215);
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    cloudMap = new THREE.CanvasTexture(cloudCanvas);
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.wrapS = THREE.RepeatWrapping;
    cloudMap.needsUpdate = true;
  }

  const bundle: PlanetTextureBundle = {
    albedoMap,
    bumpMap,
    roughnessMap,
    emissiveMap,
    cloudMap,
  };
  planetTextureCache.set(archetype, bundle);
  return bundle;
}

// -----------------------------------------------------------------------------
// Procedural Multi-Band Translucent Planetary Ring Texture (Saturn & Sapphire)
// -----------------------------------------------------------------------------

const ringTextureCache = new Map<string, THREE.CanvasTexture>();

function createPlanetaryRingTexture(style: 'sapphire_ice' | 'saturn_gold'): THREE.CanvasTexture {
  const existing = ringTextureCache.get(style);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(512, 32);

  for (let x = 0; x < 512; x++) {
    const r = x / 511; // 0 = inner edge, 1 = outer edge
    // Smooth fade at inner and outer edges
    const edgeMask = smoothstep(Math.min(1, r * 9)) * smoothstep(Math.min(1, (1 - r) * 8));
    // Cassini division & delicate ringlets
    const cassiniGap = style === 'saturn_gold' ? (r > 0.58 && r < 0.65 ? 0.12 : 1.0) : r > 0.48 && r < 0.53 ? 0.25 : 1.0;
    const ringlets =
      0.62 +
      0.22 * Math.sin(r * 68) +
      0.16 * Math.cos(r * 145) +
      0.1 * Math.sin(r * 240);

    let rgb: [number, number, number];
    let alpha: number;

    if (style === 'saturn_gold') {
      rgb = mixRgb([238, 206, 152], [176, 134, 86], r * 0.7 + 0.15 * Math.sin(r * 36));
      if (r > 0.65 && r < 0.85) {
        rgb = mixRgb(rgb, [248, 232, 198], 0.45);
      }
      alpha = Math.max(0, Math.min(0.88, edgeMask * cassiniGap * ringlets * 0.88));
    } else {
      rgb = mixRgb([125, 211, 252], [56, 136, 248], r * 0.8);
      if (r > 0.25 && r < 0.45) {
        rgb = mixRgb(rgb, [216, 244, 255], 0.55);
      }
      alpha = Math.max(0, Math.min(0.76, edgeMask * cassiniGap * ringlets * 0.72));
    }

    for (let y = 0; y < 32; y++) {
      const idx = (y * 512 + x) * 4;
      img.data[idx] = rgb[0];
      img.data[idx + 1] = rgb[1];
      img.data[idx + 2] = rgb[2];
      img.data[idx + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  ringTextureCache.set(style, tex);
  return tex;
}

// -----------------------------------------------------------------------------
// Sun-Aware Atmospheric Rim-Glow Shader (Bright Sunlit Crescent + Subtle Dark Edge)
// -----------------------------------------------------------------------------

export function createAtmosphereRimMaterial(
  colorHex: string,
  intensity = 0.85
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(vNormalWorld, viewDir), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 2.55);

        // Sun sits at origin (0,0,0): illuminate atmospheric scattering strongest on the sunlit side
        vec3 sunDir = normalize(-vWorldPos + vec3(0.0001));
        float sunFacing = clamp(dot(vNormalWorld, sunDir) * 0.65 + 0.55, 0.16, 1.15);

        float alpha = clamp(rim * uIntensity * sunFacing, 0.0, 0.92);
        vec3 litColor = mix(uColor, vec3(0.95, 0.99, 1.0), clamp(rim * sunFacing * 0.42, 0.0, 0.65));
        gl_FragColor = vec4(litColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

// -----------------------------------------------------------------------------
// Major Milestone — High-Detail 3D-Shaded Celestial Planet Assembly
// -----------------------------------------------------------------------------

export interface PlanetAssemblyResult {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  cloudMesh?: THREE.Mesh;
  atmosphereMesh: THREE.Mesh;
  ringMesh?: THREE.Mesh;
  selectionHaloMesh: THREE.Mesh;
  spec: ArchetypeVisualSpec;
}

export function createMilestonePlanetAssembly(
  archetype: PlanetArchetype,
  status: 'completed' | 'in_progress' | 'upcoming'
): PlanetAssemblyResult {
  const baseSpec = PLANET_ARCHETYPE_SPECS[archetype] || PLANET_ARCHETYPE_SPECS.oceanic_biosphere;
  const radius = baseSpec.baseRadius;
  const textures = getOrCreatePlanetTextures(archetype);

  const spec: ArchetypeVisualSpec = {
    ...baseSpec,
    atmosphereIntensity:
      status === 'in_progress'
        ? baseSpec.atmosphereIntensity * 1.18
        : status === 'completed'
        ? baseSpec.atmosphereIntensity * 1.06
        : baseSpec.atmosphereIntensity * 0.92,
  };

  const group = new THREE.Group();

  // 1. High-Detail 3D-Shaded Planetary Core with Realistic Sun Terminator Shadows
  const coreGeo = new THREE.SphereGeometry(radius, 48, 48);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    map: textures.albedoMap,
    bumpMap: textures.bumpMap,
    bumpScale: archetype === 'ringed_gas_giant' || archetype === 'sapphire_crown' ? 0.04 : 0.14,
    roughnessMap: textures.roughnessMap,
    roughness: spec.roughnessBase,
    metalness: spec.metalnessBase,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: 0.22,
    emissive: new THREE.Color(spec.emissiveColor),
    emissiveMap: textures.emissiveMap || null,
    emissiveIntensity: textures.emissiveMap ? spec.emissiveIntensity * 1.6 : spec.emissiveIntensity,
    envMapIntensity: 0.55,
  });

  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.rotation.z = 0.18;
  group.add(coreMesh);

  // 2. Optional Independent Rotating Cloud Layer (for Oceanic / Emerald / Super-Earth worlds)
  let cloudMesh: THREE.Mesh | undefined;
  if (spec.hasClouds && textures.cloudMap) {
    const cloudGeo = new THREE.SphereGeometry(radius * 1.022, 40, 40);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      map: textures.cloudMap,
      transparent: true,
      opacity: 0.72,
      roughness: 0.85,
      metalness: 0.0,
      depthWrite: false,
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    group.add(cloudMesh);
  }

  // 3. Sun-Aware Atmospheric Rim-Glow Shell
  const atmoGeo = new THREE.SphereGeometry(radius * 1.085, 40, 40);
  const atmoMat = createAtmosphereRimMaterial(spec.atmosphereColor, spec.atmosphereIntensity);
  const atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
  group.add(atmosphereMesh);

  // 4. Optional Multi-Band Translucent Planetary Rings (Saturn-like Gas Giant & Sapphire Ice Giant)
  let ringMesh: THREE.Mesh | undefined;
  if (spec.hasRings && spec.ringStyle !== 'none') {
    const innerR = spec.ringStyle === 'saturn_gold' ? radius * 1.32 : radius * 1.3;
    const outerR = spec.ringStyle === 'saturn_gold' ? radius * 2.28 : radius * 1.98;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 96, 1);

    // Remap ring UVs radially from inner edge (u=0) to outer edge (u=1)
    const posAttr = ringGeo.attributes.position;
    const uvAttr = ringGeo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const dist = Math.hypot(vx, vy);
      const uVal = Math.max(0, Math.min(1, (dist - innerR) / (outerR - innerR)));
      uvAttr.setXY(i, uVal, 0.5);
    }
    uvAttr.needsUpdate = true;

    const ringTex = createPlanetaryRingTexture(spec.ringStyle);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTex,
      color: new THREE.Color('#ffffff'),
      transparent: true,
      opacity: spec.ringStyle === 'saturn_gold' ? 0.92 : 0.78,
      roughness: 0.65,
      metalness: 0.08,
      emissive: new THREE.Color(spec.ringStyle === 'saturn_gold' ? '#78350f' : '#0369a1'),
      emissiveIntensity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2 - (spec.ringStyle === 'saturn_gold' ? 0.36 : 0.44);
    ringMesh.rotation.y = spec.ringStyle === 'saturn_gold' ? 0.24 : -0.28;
    group.add(ringMesh);
  }

  // 5. Crisp Equatorial Status / Hover Selection Halo Ring
  const statusRingColor =
    status === 'completed'
      ? '#34d399'
      : status === 'in_progress'
      ? '#38bdf8'
      : spec.atmosphereColor;
  const haloInner = spec.hasRings ? radius * 2.38 : radius * 1.28;
  const haloOuter = haloInner + 0.09;
  const haloGeo = new THREE.RingGeometry(haloInner, haloOuter, 72);
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(statusRingColor),
    transparent: true,
    opacity: status === 'in_progress' ? 0.52 : status === 'completed' ? 0.3 : 0.14,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const selectionHaloMesh = new THREE.Mesh(haloGeo, haloMat);
  selectionHaloMesh.rotation.x = Math.PI / 2;
  group.add(selectionHaloMesh);

  return {
    group,
    coreMesh,
    cloudMesh,
    atmosphereMesh,
    ringMesh,
    selectionHaloMesh,
    spec,
  };
}

// -----------------------------------------------------------------------------
// Radiant Central Sun — Multi-Layered Luminous Stellar Core + Corona + Magnetic Rings
// -----------------------------------------------------------------------------

export interface SunAssemblyResult {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  innerCoronaMesh: THREE.Mesh;
  outerCoronaSprite: THREE.Sprite;
  secondaryBloomSprite: THREE.Sprite;
  magneticRingA: THREE.Mesh;
  magneticRingB: THREE.Mesh;
  coreMaterial: THREE.ShaderMaterial;
  innerCoronaMaterial: THREE.ShaderMaterial;
  magneticRingAMaterial: THREE.ShaderMaterial;
  magneticRingBMaterial: THREE.ShaderMaterial;
}

function createSolarCoronaBloomTexture(innerAlpha: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  grad.addColorStop(0, `rgba(255, 251, 224, ${innerAlpha})`);
  grad.addColorStop(0.22, `rgba(253, 212, 86, ${innerAlpha * 0.85})`);
  grad.addColorStop(0.48, `rgba(245, 158, 11, ${innerAlpha * 0.42})`);
  grad.addColorStop(0.75, `rgba(217, 92, 16, ${innerAlpha * 0.14})`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createSolarMagneticRingMaterial(colorHex: string, phaseOffset: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uPhase: { value: phaseOffset },
      uOpacity: { value: 0.62 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uPhase;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        float angle = vUv.x * 6.2831853;
        float flare1 = 0.5 + 0.5 * sin(angle * 2.0 - uTime * 1.4 + uPhase);
        float flare2 = 0.5 + 0.5 * cos(angle * 3.0 + uTime * 0.9 - uPhase);
        float pulse = pow(flare1, 2.2) * 0.72 + pow(flare2, 3.0) * 0.48;
        float edge = sin(vUv.y * 3.14159265);
        float alpha = clamp((0.18 + pulse * 0.82) * edge * uOpacity, 0.0, 0.95);
        vec3 col = mix(uColor, vec3(1.0, 0.98, 0.88), clamp(pulse * 0.65, 0.0, 0.85));
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function createSunAssembly(
  overallProgressPercent: number,
  isGoalAchieved: boolean
): SunAssemblyResult {
  const group = new THREE.Group();
  const sunRadius = 5.5;
  const progressNormalized = Math.max(0, Math.min(1, overallProgressPercent / 100));

  // 1. Intense Golden-Amber Solar Surface with Animated Plasma Granulation Shader
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: progressNormalized },
      uGoalAchieved: { value: isGoalAchieved ? 1.0 : 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalDir;

      void main() {
        vLocalDir = normalize(position);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uProgress;
      uniform float uGoalAchieved;

      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalDir;

      float hash3(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise3(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
            mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x),
            f.y
          ),
          mix(
            mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
            mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise3(p);
          p = p * 2.08 + vec3(1.7, 3.1, 2.3);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 p = vLocalDir * 3.8;
        float t = uTime * 0.16;
        float q = fbm(p + vec3(t, -t * 0.6, t * 0.4));
        float plasma = fbm(p * 1.45 + vec3(q * 2.2, -t * 0.9, q * 1.6));
        float filaments = pow(clamp(plasma * 1.25, 0.0, 1.0), 2.1);

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(vNormalWorld, viewDir), 0.0, 1.0);
        float limb = pow(1.0 - ndotv, 1.85);

        vec3 deepAmber = vec3(0.84, 0.31, 0.04);
        vec3 solarGold = vec3(1.0, 0.68, 0.12);
        vec3 radiantCream = vec3(1.0, 0.96, 0.78);
        vec3 whiteHot = vec3(1.0, 0.99, 0.92);

        vec3 col = mix(deepAmber, solarGold, clamp(plasma * 1.35, 0.0, 1.0));
        col = mix(col, radiantCream, clamp(filaments * 0.95 + (1.0 - limb) * 0.25, 0.0, 1.0));
        col = mix(col, whiteHot, clamp(pow(filaments, 3.0) * 0.85 + uProgress * 0.15 + uGoalAchieved * 0.18, 0.0, 0.85));

        // Subtle glowing orange-gold solar limb rim
        col += vec3(1.0, 0.56, 0.14) * limb * 0.55;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.FrontSide,
  });

  const coreGeo = new THREE.SphereGeometry(sunRadius, 56, 56);
  const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
  group.add(coreMesh);

  // 2. Volumetric Chromosphere Plasma Corona Shell
  const innerCoronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorInner: { value: new THREE.Color('#fef08a') },
      uColorOuter: { value: new THREE.Color('#f97316') },
      uIntensity: { value: 0.92 + progressNormalized * 0.22 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalDir;
      void main() {
        vLocalDir = normalize(position);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorInner;
      uniform vec3 uColorOuter;
      uniform float uIntensity;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPos;
      varying vec3 vLocalDir;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(vNormalWorld, viewDir), 0.0, 1.0);
        // Bell-curve volumetric limb glow: peaks softly right around the photosphere edge (ndotv ≈ 0.6)
        // and fades cleanly to 0.0 at both the outer silhouette (ndotv = 0) and core center (ndotv = 1).
        float softChromosphere = pow(ndotv, 2.5) * pow(1.0 - ndotv, 1.45) * 9.6;
        float shimmer = 0.88 + 0.12 * sin(vLocalDir.x * 11.0 + uTime * 2.1) * cos(vLocalDir.y * 10.0 - uTime * 1.7);
        vec3 col = mix(uColorOuter, uColorInner, smoothstep(0.18, 0.72, ndotv));
        gl_FragColor = vec4(col, clamp(softChromosphere * uIntensity * shimmer, 0.0, 0.88));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  const innerCoronaGeo = new THREE.SphereGeometry(sunRadius * 1.26, 48, 48);
  const innerCoronaMesh = new THREE.Mesh(innerCoronaGeo, innerCoronaMaterial);
  group.add(innerCoronaMesh);

  // 3. Soft Wide Volumetric Corona Bloom (Inner Radiant Bloom + Wide Atmospheric Solar Halo)
  const coronaSpriteMat = new THREE.SpriteMaterial({
    map: createSolarCoronaBloomTexture(0.95),
    color: new THREE.Color(isGoalAchieved ? '#fef08a' : '#fbbf24'),
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerCoronaSprite = new THREE.Sprite(coronaSpriteMat);
  outerCoronaSprite.scale.set(sunRadius * 4.8, sunRadius * 4.8, 1);
  group.add(outerCoronaSprite);

  const secondaryBloomMat = new THREE.SpriteMaterial({
    map: createSolarCoronaBloomTexture(0.48),
    color: new THREE.Color('#f97316'),
    transparent: true,
    opacity: 0.56,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const secondaryBloomSprite = new THREE.Sprite(secondaryBloomMat);
  secondaryBloomSprite.scale.set(sunRadius * 7.8, sunRadius * 7.8, 1);
  group.add(secondaryBloomSprite);

  // 4. Two Delicate Rotating Solar Flare / Magnetic Field Rings
  const magneticRingAMaterial = createSolarMagneticRingMaterial('#fcd34d', 0.0);
  const magneticRingAGeo = new THREE.TorusGeometry(sunRadius * 1.48, 0.075, 16, 128);
  const magneticRingA = new THREE.Mesh(magneticRingAGeo, magneticRingAMaterial);
  magneticRingA.rotation.x = Math.PI * 0.42;
  magneticRingA.rotation.y = 0.25;
  group.add(magneticRingA);

  const magneticRingBMaterial = createSolarMagneticRingMaterial('#fb923c', 2.4);
  const magneticRingBGeo = new THREE.TorusGeometry(sunRadius * 1.72, 0.06, 16, 128);
  const magneticRingB = new THREE.Mesh(magneticRingBGeo, magneticRingBMaterial);
  magneticRingB.rotation.x = Math.PI * 0.58;
  magneticRingB.rotation.z = -0.38;
  group.add(magneticRingB);

  return {
    group,
    coreMesh,
    innerCoronaMesh,
    outerCoronaSprite,
    secondaryBloomSprite,
    magneticRingA,
    magneticRingB,
    coreMaterial,
    innerCoronaMaterial,
    magneticRingAMaterial,
    magneticRingBMaterial,
  };
}

// -----------------------------------------------------------------------------
// Multi-Depth Twinkling Starfield (3 Layers), Milky Way Dust & Astrolabe Grid
// -----------------------------------------------------------------------------

export interface DeepSpaceEnvironmentResult {
  group: THREE.Group;
  farStars: THREE.Points;
  midStars: THREE.Points;
  flareStars: THREE.Points;
  farStarsMaterial: THREE.ShaderMaterial;
  midStarsMaterial: THREE.ShaderMaterial;
  flareStarsMaterial: THREE.ShaderMaterial;
  nebulaGroup: THREE.Group;
  astrolabeGroup: THREE.Group;
}

function createSoftRadialSpriteTexture(
  innerRgba: string,
  midRgba: string,
  outerRgba = 'rgba(0,0,0,0)'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, innerRgba);
  grad.addColorStop(0.45, midRgba);
  grad.addColorStop(1, outerRgba);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createCrossFlareStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Soft radiant center
  const core = ctx.createRadialGradient(64, 64, 1, 64, 64, 34);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.25, 'rgba(224, 242, 254, 0.85)');
  core.addColorStop(0.6, 'rgba(125, 211, 252, 0.22)');
  core.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 128, 128);

  // Horizontal diffraction spike
  const hGrad = ctx.createLinearGradient(4, 64, 124, 64);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.5, 'rgba(255,255,255,0.92)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(4, 62.5, 120, 3);

  // Vertical diffraction spike
  const vGrad = ctx.createLinearGradient(64, 4, 64, 124);
  vGrad.addColorStop(0, 'rgba(255,255,255,0)');
  vGrad.addColorStop(0.5, 'rgba(255,255,255,0.92)');
  vGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(62.5, 4, 3, 120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTwinklingStarMaterial(
  spriteTex: THREE.CanvasTexture,
  baseOpacity: number,
  twinkleAmp: number,
  sizeScale: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: spriteTex },
      uOpacity: { value: baseOpacity },
      uTwinkleAmp: { value: twinkleAmp },
      uSizeScale: { value: sizeScale },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uTwinkleAmp;
      uniform float uSizeScale;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = aColor;
        float tw = 0.5 + 0.5 * sin(uTime * (1.25 + fract(aPhase) * 2.1) + aPhase * 12.566);
        vTwinkle = mix(1.0 - uTwinkleAmp, 1.0, tw);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp((aSize * uSizeScale * (300.0 / max(10.0, -mvPosition.z))), 1.5, 42.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        if (tex.a < 0.02) discard;
        gl_FragColor = vec4(vColor * tex.rgb, tex.a * uOpacity * vTwinkle);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function buildStarLayerGeometry(
  count: number,
  minRadius: number,
  maxRadius: number,
  minSize: number,
  maxSize: number,
  palette: THREE.Color[],
  seedOffset: number,
  milkyWayBias = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const u = hash2D(i, 1, 701 + seedOffset);
    const v = hash2D(i, 2, 709 + seedOffset);
    const theta = u * Math.PI * 2;
    let phi = Math.acos(2 * v - 1);

    // Optional diagonal Milky Way star-dust clustering
    if (milkyWayBias > 0 && hash2D(i, 9, 919 + seedOffset) < milkyWayBias) {
      const bandSpread = (hash2D(i, 10, 929 + seedOffset) - 0.5) * 0.42;
      phi = Math.PI * 0.5 + bandSpread;
    }

    const r = minRadius + hash2D(i, 3, 719 + seedOffset) * (maxRadius - minRadius);
    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.cos(phi);
    let z = r * Math.sin(phi) * Math.sin(theta);

    // Tilt Milky Way plane diagonally (~26 degrees)
    if (milkyWayBias > 0) {
      const tilt = 0.46;
      const ny = y * Math.cos(tilt) - x * Math.sin(tilt);
      const nx = y * Math.sin(tilt) + x * Math.cos(tilt);
      x = nx;
      y = ny;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = palette[i % palette.length];
    const brightness = 0.65 + hash2D(i, 4, 727 + seedOffset) * 0.35;
    colors[i * 3] = c.r * brightness;
    colors[i * 3 + 1] = c.g * brightness;
    colors[i * 3 + 2] = c.b * brightness;

    sizes[i] = minSize + hash2D(i, 5, 733 + seedOffset) * (maxSize - minSize);
    phases[i] = hash2D(i, 6, 739 + seedOffset);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  return geo;
}

/**
 * Builds the ultra-faint Astronomical HUD Grid: outer radial astrolabe ring,
 * celestial coordinate arcs, degree ticks (every 5° and 15°), and cardinal spokes.
 */
function createAstronomicalAstrolabeGrid(outerRadius = 78): THREE.Group {
  const astrolabeGroup = new THREE.Group();
  astrolabeGroup.position.y = -0.35;

  const primaryLineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#7dd3fc'),
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });

  const secondaryLineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#818cf8'),
    transparent: true,
    opacity: 0.085,
    depthWrite: false,
  });

  // 1. Outer Astrolabe Double Ring
  [outerRadius, outerRadius + 3.4, outerRadius * 0.54].forEach((r, idx) => {
    const pts: THREE.Vector3[] = [];
    const segs = 180;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const loop = new THREE.LineLoop(geo, idx === 0 ? primaryLineMat : secondaryLineMat);
    astrolabeGroup.add(loop);
  });

  // 2. Degree Ticks Every 5° (longer major ticks every 15° and 45°)
  const tickPositions: number[] = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isCardinal = deg % 90 === 0;
    const isMajor = deg % 15 === 0;
    const innerR = outerRadius;
    const tickLen = isCardinal ? 5.2 : isMajor ? 3.2 : 1.45;
    const outerR = innerR + tickLen;

    tickPositions.push(
      Math.cos(rad) * innerR,
      0,
      Math.sin(rad) * innerR,
      Math.cos(rad) * outerR,
      0,
      Math.sin(rad) * outerR
    );
  }
  const tickGeo = new THREE.BufferGeometry();
  tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
  const ticks = new THREE.LineSegments(tickGeo, primaryLineMat);
  astrolabeGroup.add(ticks);

  // 3. Delicate Radial Celestial Coordinate Spokes (8 subtle observatory axes)
  const spokePositions: number[] = [];
  for (let i = 0; i < 8; i++) {
    const rad = (i * Math.PI) / 4;
    const innerStart = 12.5;
    const outerEnd = outerRadius;
    spokePositions.push(
      Math.cos(rad) * innerStart,
      0,
      Math.sin(rad) * innerStart,
      Math.cos(rad) * outerEnd,
      0,
      Math.sin(rad) * outerEnd
    );
  }
  const spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokePositions, 3));
  const spokes = new THREE.LineSegments(spokeGeo, secondaryLineMat);
  astrolabeGroup.add(spokes);

  // 4. Faint Tilted Celestial Coordinate Arcs (meridian / ecliptic reference arcs)
  const arcConfigs = [
    { radius: outerRadius + 6, rotX: 0.36, rotZ: 0.14 },
    { radius: outerRadius + 6, rotX: -0.28, rotZ: -0.24 },
  ];
  arcConfigs.forEach((cfg) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = -0.85 + (i / 72) * 1.7;
      pts.push(new THREE.Vector3(Math.cos(a) * cfg.radius, 0, Math.sin(a) * cfg.radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const arc = new THREE.Line(geo, secondaryLineMat);
    arc.rotation.x = cfg.rotX;
    arc.rotation.z = cfg.rotZ;
    astrolabeGroup.add(arc);
  });

  return astrolabeGroup;
}

export function createDeepSpaceEnvironment(): DeepSpaceEnvironmentResult {
  const group = new THREE.Group();

  const starPointTex = createSoftRadialSpriteTexture(
    'rgba(255,255,255,1)',
    'rgba(186,230,253,0.45)',
    'rgba(0,0,0,0)'
  );
  const crossFlareTex = createCrossFlareStarTexture();

  const farPalette = [
    new THREE.Color('#e2e8f0'),
    new THREE.Color('#bae6fd'),
    new THREE.Color('#c7d2fe'),
    new THREE.Color('#fef3c7'),
    new THREE.Color('#99f6e4'),
  ];

  // Layer 1: Tiny distant dust stars + faint diagonal Milky Way band
  const farGeo = buildStarLayerGeometry(1450, 290, 490, 2.2, 4.2, farPalette, 0, 0.36);
  const farStarsMaterial = createTwinklingStarMaterial(starPointTex, 0.82, 0.36, 1.0);
  const farStars = new THREE.Points(farGeo, farStarsMaterial);
  group.add(farStars);

  // Layer 2: Medium soft-glowing depth stars
  const midGeo = buildStarLayerGeometry(380, 165, 290, 4.4, 7.6, farPalette, 200, 0.2);
  const midStarsMaterial = createTwinklingStarMaterial(starPointTex, 0.88, 0.42, 1.12);
  const midStars = new THREE.Points(midGeo, midStarsMaterial);
  group.add(midStars);

  // Layer 3: Rare bright cross-flare diffraction stars
  const flarePalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#bae6fd'),
    new THREE.Color('#fde68a'),
    new THREE.Color('#ddd6fe'),
  ];
  const flareGeo = buildStarLayerGeometry(48, 125, 225, 11.5, 19.5, flarePalette, 500, 0.15);
  const flareStarsMaterial = createTwinklingStarMaterial(crossFlareTex, 0.94, 0.48, 1.25);
  const flareStars = new THREE.Points(flareGeo, flareStarsMaterial);
  group.add(flareStars);

  // Volumetric 3D Nebula & Diagonal Milky Way Star-Dust Clouds (Indigo, Violet, Teal)
  const nebulaGroup = new THREE.Group();
  const nebulaSpecs = [
    {
      pos: [-165, 55, -240],
      scale: 280,
      inner: 'rgba(99, 102, 241, 0.18)',
      mid: 'rgba(49, 46, 129, 0.08)',
    },
    {
      pos: [155, -30, -230],
      scale: 265,
      inner: 'rgba(20, 184, 166, 0.16)',
      mid: 'rgba(15, 118, 110, 0.06)',
    },
    {
      pos: [35, 85, -260],
      scale: 245,
      inner: 'rgba(139, 92, 246, 0.17)',
      mid: 'rgba(76, 29, 149, 0.07)',
    },
    {
      pos: [-70, -55, -245],
      scale: 220,
      inner: 'rgba(56, 189, 248, 0.12)',
      mid: 'rgba(30, 58, 138, 0.05)',
    },
    // Diagonal Milky Way dust stream puffs
    {
      pos: [-200, -70, -270],
      scale: 240,
      inner: 'rgba(165, 180, 252, 0.11)',
      mid: 'rgba(79, 70, 229, 0.04)',
    },
    {
      pos: [190, 95, -275],
      scale: 250,
      inner: 'rgba(125, 211, 252, 0.11)',
      mid: 'rgba(49, 46, 129, 0.04)',
    },
  ];

  nebulaSpecs.forEach((n) => {
    const tex = createSoftRadialSpriteTexture(n.inner, n.mid);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(n.pos[0], n.pos[1], n.pos[2]);
    sprite.scale.set(n.scale, n.scale * 0.68, 1);
    nebulaGroup.add(sprite);
  });
  group.add(nebulaGroup);

  // Subtle Astronomical HUD Grid / Astrolabe Ring around outer orbit
  const astrolabeGroup = createAstronomicalAstrolabeGrid(76);
  group.add(astrolabeGroup);

  return {
    group,
    farStars,
    midStars,
    flareStars,
    farStarsMaterial,
    midStarsMaterial,
    flareStarsMaterial,
    nebulaGroup,
    astrolabeGroup,
  };
}
