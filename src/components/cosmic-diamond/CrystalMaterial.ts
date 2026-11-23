import * as THREE from 'three';

export interface WebGLCapabilities {
  supported: boolean;
  isSoftware: boolean;
}

/**
 * Safely probes WebGL availability and detects software renderers (SwiftShader/llvmpipe)
 * so animation loops can pace themselves responsibly without stalling headless browsers.
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftware: true };
  }
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      return { supported: false, isSoftware: true };
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftware = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftware };
  } catch {
    return { supported: false, isSoftware: true };
  }
}

const _envCubeCache = new Map<number, THREE.CubeTexture>();

/**
 * Generates (and caches) an HDR-like 6-face procedural jewelry studio CubeTexture
 * with sharp studio softboxes, icy cyan / electric violet / restrained magenta reflectors,
 * and deep dark negative-fill contrast bands so crystalline facets exhibit high-contrast specular brilliance.
 */
export function createStudioEnvironmentCubeTexture(size = 256): THREE.CubeTexture {
  const cached = _envCubeCache.get(size);
  if (cached) return cached;

  const canvases: HTMLCanvasElement[] = [];

  const faceConfigs = [
    { bg0: '#04010c', bg1: '#170632', spotColor: '#38bdf8', spot2: '#ffffff', sx: 0.58, sy: 0.32 },
    { bg0: '#040212', bg1: '#1d0940', spotColor: '#c084fc', spot2: '#e0f2fe', sx: 0.42, sy: 0.38 },
    { bg0: '#12062a', bg1: '#310759', spotColor: '#ffffff', spot2: '#e879f9', sx: 0.5, sy: 0.48 },
    { bg0: '#020108', bg1: '#0e0422', spotColor: '#7c3aed', spot2: '#38bdf8', sx: 0.5, sy: 0.52 },
    { bg0: '#060214', bg1: '#190736', spotColor: '#ffffff', spot2: '#c4b5fd', sx: 0.36, sy: 0.3 },
    { bg0: '#03010a', bg1: '#23074a', spotColor: '#a855f7', spot2: '#e0f2fe', sx: 0.64, sy: 0.36 },
  ];

  for (let f = 0; f < 6; f++) {
    const cfg = faceConfigs[f];
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, cfg.bg0);
      bgGrad.addColorStop(0.5, cfg.bg1);
      bgGrad.addColorStop(1, '#010006');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      const rad1 = ctx.createRadialGradient(
        size * cfg.sx,
        size * cfg.sy,
        1,
        size * cfg.sx,
        size * cfg.sy,
        size * 0.48
      );
      rad1.addColorStop(0, '#ffffff');
      rad1.addColorStop(0.15, cfg.spot2);
      rad1.addColorStop(0.38, cfg.spotColor);
      rad1.addColorStop(0.7, 'rgba(109, 40, 217, 0.24)');
      rad1.addColorStop(1, 'rgba(3, 1, 10, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, size, size);

      // Secondary cyan-violet caustic pool for internal multi-bounce dispersion
      const rad2 = ctx.createRadialGradient(
        size * (1 - cfg.sx),
        size * (1 - cfg.sy),
        1,
        size * (1 - cfg.sx),
        size * (1 - cfg.sy),
        size * 0.36
      );
      rad2.addColorStop(0, 'rgba(125, 211, 252, 0.92)');
      rad2.addColorStop(0.35, 'rgba(168, 85, 247, 0.48)');
      rad2.addColorStop(1, 'rgba(2, 1, 8, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size * 0.5, size * 0.5);
      ctx.rotate(f * 0.58 + 0.34);

      // Dark negative-fill contrast bands (essential for real diamond facet scintillation)
      ctx.fillStyle = 'rgba(2, 1, 9, 0.86)';
      ctx.fillRect(-size * 0.48, -26, size * 0.96, 12);
      ctx.fillRect(-size * 0.48, 16, size * 0.96, 14);

      const stripGrad = ctx.createLinearGradient(-size * 0.45, -14, size * 0.45, 14);
      stripGrad.addColorStop(0, 'rgba(255,255,255,0)');
      stripGrad.addColorStop(0.32, 'rgba(186, 230, 253, 0.92)');
      stripGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
      stripGrad.addColorStop(0.68, 'rgba(216, 180, 254, 0.88)');
      stripGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = stripGrad;
      ctx.fillRect(-size * 0.44, -8, size * 0.88, 16);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(-size * 0.3, 34, size * 0.6, 6);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.82)';
      ctx.fillRect(-size * 0.36, -42, size * 0.72, 7);
      ctx.restore();
    }
    canvases.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(canvases);
  cubeTexture.colorSpace = THREE.SRGBColorSpace;
  cubeTexture.needsUpdate = true;
  // Shared singleton cubemap across Dashboard and Cosmic views — prevent premature disposal
  cubeTexture.dispose = () => {};
  _envCubeCache.set(size, cubeTexture);
  return cubeTexture;
}

/* ============================================================================
 * 1. ADVANCED OPTICAL CRYSTAL SHADER ENGINE
 * - Real core point-light illumination + subsurface glow + shadow contrast
 * - Polished exterior facets vs. luminous frosted interior fracture cleavage faces
 * - Selective neon edge illumination (view & light responsive, never flat)
 * ========================================================================== */

const CRYSTAL_VERTEX_SHADER = `
  attribute vec4 aFacetMeta;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  varying vec4 vFacetMeta;

  void main() {
    vFacetMeta = aFacetMeta;
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const CRYSTAL_FRAGMENT_SHADER = `
  uniform samplerCube uEnvMap;
  uniform float uTime;
  uniform float uHover;
  uniform float uHighlight;
  uniform float uExplored;
  uniform float uDim;
  uniform float uFractureFlash;
  uniform float uInternalEnergy;
  uniform float uOpacity;
  uniform float uIsBackFace;
  uniform vec2 uPointer;
  uniform vec3 uAccentColor;
  uniform vec3 uCoreLightPos;
  uniform vec3 uCoreLightColor;
  uniform float uCoreLightIntensity;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  varying vec4 vFacetMeta;

  vec3 getInternalBounce(vec3 rayDir, vec3 localPos, float facetSeed) {
    float angle = atan(localPos.z, localPos.x);
    float sector = floor((angle + 3.14159265) / (6.2831853 / 12.0));
    float sectorAngle = (sector + 0.5) * (6.2831853 / 12.0);
    // First pavilion total-internal-reflection bounce
    vec3 pavNormal1 = normalize(vec3(cos(sectorAngle) * 0.77, 0.64, sin(sectorAngle) * 0.77));
    vec3 b1 = reflect(rayDir, pavNormal1);
    // Second cross-pavilion reflection bounce
    float oppAngle = sectorAngle + 3.14159265 + (facetSeed - 0.5) * 0.62;
    vec3 pavNormal2 = normalize(vec3(cos(oppAngle) * 0.79, 0.61, sin(oppAngle) * 0.79));
    vec3 b2 = reflect(b1, pavNormal2);
    // Third internal crown-table dispersion bounce
    vec3 crownNormal = normalize(vec3(sin(facetSeed * 19.1) * 0.28, -0.92, cos(facetSeed * 13.7) * 0.28));
    return normalize(mix(b2, reflect(b2, crownNormal), 0.42));
  }

  void main() {
    float facetType = vFacetMeta.x;
    float facetId = vFacetMeta.y;
    float radialPos = vFacetMeta.z;
    float rimWeight = vFacetMeta.w;
    // facetType >= 9.5 marks interior fractured crystalline cleavage planes
    float isCleavage = step(9.5, facetType);

    // Subtle per-facet normal micro-differentiation so adjacent facets catch distinct light angles
    float facetHash = fract(sin(facetId * 91.7 + facetType * 17.3) * 43758.5453);
    float facetHash2 = fract(cos(facetId * 53.1 - facetType * 29.7) * 28411.321);
    vec3 facetMicroTilt = vec3(
      (facetHash - 0.5) * 0.11,
      (facetHash2 - 0.5) * 0.08,
      (fract(facetHash + facetHash2) - 0.5) * 0.11
    );
    vec3 N = normalize(vWorldNormal * (1.0 - 2.0 * uIsBackFace) + facetMicroTilt);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 I = -V;

    vec3 keyLight1 = normalize(vec3(0.56 + uPointer.x * 0.24, 0.80 + uPointer.y * 0.20, 0.64));
    vec3 keyLight2 = normalize(vec3(-0.70, 0.34, 0.58));
    vec3 topLightDir = normalize(vec3(0.10, 0.97, 0.22));
    vec3 rimLightDir = normalize(vec3(-0.25, -0.68, -0.68));

    // Real dynamic lighting from the central plasma core
    vec3 toCore = uCoreLightPos - vWorldPos;
    float coreDist = length(toCore);
    vec3 Lcore = toCore / max(coreDist, 0.001);
    float coreAtten = uCoreLightIntensity / (1.0 + coreDist * coreDist * 0.15);
    float coreDiff = max(0.0, dot(N, Lcore));
    // Subsurface transmission when viewing a crystal backlit by the core
    float coreBackscatter = pow(max(0.0, dot(V, -Lcore)), 2.4) * (0.52 + isCleavage * 0.58);

    // Physically based diamond Fresnel (diamond n = 2.417 -> F0 = ((n-1)/(n+1))^2 = 0.172)
    float cosTheta = clamp(dot(N, V), 0.0, 1.0);
    float F0 = mix(0.19, 0.14, isCleavage);
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, mix(3.6, 2.7, isCleavage));

    // Authentic 3-channel RGB chromatic dispersion (diamond IOR 2.417 with spectral spread)
    float etaR = 1.0 / 2.365;
    float etaG = 1.0 / 2.417;
    float etaB = 1.0 / 2.478;

    vec3 refractR = refract(I, N, etaR);
    vec3 refractG = refract(I, N, etaG);
    vec3 refractB = refract(I, N, etaB);

    vec3 tirR = getInternalBounce(refractR, vLocalPos, facetId);
    vec3 tirG = getInternalBounce(refractG, vLocalPos, facetId + 0.17);
    vec3 tirB = getInternalBounce(refractB, vLocalPos, facetId + 0.34);

    vec3 directRefraction = vec3(
      textureCube(uEnvMap, refractR).r,
      textureCube(uEnvMap, refractG).g,
      textureCube(uEnvMap, refractB).b
    );

    vec3 envTirR = textureCube(uEnvMap, tirR).rgb;
    vec3 envTirG = textureCube(uEnvMap, tirG).rgb;
    vec3 envTirB = textureCube(uEnvMap, tirB).rgb;
    vec3 internalFire = vec3(envTirR.r, envTirG.g, envTirB.b);

    vec3 refractedLight = mix(directRefraction, internalFire, 0.78);

    // High-contrast gemstone color architecture:
    // Deep obsidian-indigo contrast pockets -> royal violet body -> electric cyan internal transmission
    vec3 deepObsidian = vec3(0.035, 0.012, 0.11);
    vec3 deepAmethyst = vec3(0.19, 0.045, 0.46);
    vec3 royalViolet = vec3(0.48, 0.16, 0.92);
    vec3 electricCyan = vec3(0.22, 0.86, 1.0);
    vec3 magentaFire = mix(vec3(0.84, 0.28, 0.82), uAccentColor, 0.42);
    vec3 diamondIce = vec3(0.94, 0.97, 1.0);

    // Volumetric Beer-Lambert optical absorption & internal light transmission
    float opticalDepth = clamp(0.32 + 0.68 * (1.0 - cosTheta) + (vLocalPos.y < 0.0 ? 0.26 : 0.0), 0.18, 1.5);
    vec3 beerAbsorption = exp(-vec3(1.18, 1.52, 0.42) * opticalDepth * 0.72);
    vec3 transmissionTint = mix(diamondIce, royalViolet, clamp(opticalDepth * 0.76, 0.0, 1.0));
    transmissionTint = mix(transmissionTint, deepAmethyst, clamp((opticalDepth - 0.46) * 0.92, 0.0, 0.84));
    transmissionTint *= mix(vec3(1.0), beerAbsorption * 1.45, 0.55);

    // Strong facet-to-facet tonal differentiation (some facets transmit icy cyan, others deep violet or magenta fire)
    vec3 facetTone = mix(deepAmethyst, royalViolet, facetHash);
    facetTone = mix(facetTone, electricCyan, pow(facetHash2, 1.6) * 0.58);
    facetTone = mix(facetTone, magentaFire, step(0.74, facetHash) * 0.48);
    // Internal fractured cleavage planes transmit cooler cyan-violet core light
    facetTone = mix(facetTone, mix(royalViolet, electricCyan, 0.62), isCleavage * 0.72);

    vec3 crystalInterior = refractedLight * mix(transmissionTint, facetTone, 0.54) * (1.44 + isCleavage * 0.36);

    // Volumetric internal caustic core glow (emanates from deep inside the crystal volume, not the surface)
    float coreRadiusSq = dot(vLocalPos, vLocalPos);
    float internalDepth = exp(-coreRadiusSq * 2.1);
    float causticWave = 0.5 + 0.5 * sin(vLocalPos.x * 6.4 - vLocalPos.y * 5.2 + vLocalPos.z * 4.8 + uTime * 1.35 + facetId * 6.28);
    float causticFocus = pow(causticWave, 2.2) * exp(-coreRadiusSq * 1.45);
    vec3 internalGlow =
      mix(royalViolet, electricCyan, 0.44 + causticWave * 0.38 + isCleavage * 0.25) *
      (internalDepth * 0.75 + causticFocus * 0.85) *
      (0.38 + uInternalEnergy * 0.92);

    // High-contrast directional facet shading (preserves deep jewel shadows alongside bright lit planes)
    float facetDiff1 = max(0.0, dot(N, keyLight1));
    float facetDiff2 = max(0.0, dot(N, keyLight2));
    float facetTop = max(0.0, dot(N, topLightDir));
    float facetUnder = max(0.0, dot(N, rimLightDir));

    // Per-facet contrast multiplier so adjacent facets never blend into a flat uniform surface
    float facetContrast = 0.68 + 0.64 * smoothstep(0.15, 0.88, facetHash);

    vec3 facetShading =
      deepObsidian * 0.38 +
      royalViolet * (0.62 * pow(facetDiff1, 1.65) * facetContrast) +
      electricCyan * (0.34 * pow(facetDiff2, 1.55) * (1.35 - facetContrast * 0.5)) +
      magentaFire * (0.28 * pow(facetUnder, 1.8)) +
      diamondIce * (0.32 * pow(facetTop, 2.8)) +
      uCoreLightColor * (coreDiff * 0.98 + coreBackscatter * 0.72) * coreAtten;

    vec3 R = reflect(I, N);
    vec3 envReflection = textureCube(uEnvMap, R).rgb;

    // Razor-sharp diamond specular glints on exterior facets; micro-crystalline sheen on cleavage faces
    float specPow1 = mix(210.0, 46.0, isCleavage);
    float specPow2 = mix(115.0, 32.0, isCleavage);
    vec3 H1 = normalize(keyLight1 + V);
    vec3 H2 = normalize(keyLight2 + V);
    vec3 Hcore = normalize(Lcore + V);

    float spec1 = pow(max(0.0, dot(N, H1)), specPow1) * mix(1.95, 0.78, isCleavage);
    float spec2 = pow(max(0.0, dot(N, H2)), specPow2) * mix(1.05, 0.48, isCleavage);
    float specCore = pow(max(0.0, dot(N, Hcore)), mix(125.0, 36.0, isCleavage)) * 1.42 * coreAtten;

    float activeEnergy = max(uHover, uHighlight);
    float flashAngle = max(0.0, dot(reflect(-keyLight1, N), V));
    float facetFlash = pow(flashAngle, 220.0) * (2.1 + activeEnergy * 1.35) * (1.0 - isCleavage * 0.55);

    vec3 tintedRefl = envReflection * mix(vec3(0.76, 0.82, 1.0), diamondIce, 0.55);
    vec3 baseCrystal = mix(
      crystalInterior + facetShading * 0.58 + internalGlow,
      tintedRefl,
      fresnel * mix(0.54, 0.30, isCleavage)
    );

    // Chromatic dispersion fire on high-angle internal bounces
    vec3 fireHighlight = vec3(
      pow(max(0.0, envTirR.r), 2.4) * 1.02,
      pow(max(0.0, envTirG.g), 2.3) * 0.74,
      pow(max(0.0, envTirB.b), 2.0) * 1.48
    );

    vec3 finalColor = (baseCrystal + fireHighlight * 0.52) * (1.0 + activeEnergy * 0.34);
    finalColor += vec3(0.97, 0.99, 1.0) * (spec1 + facetFlash);
    finalColor += uCoreLightColor * specCore;
    finalColor += mix(vec3(0.82, 0.92, 1.0), uAccentColor, 0.38) * spec2;

    // Restrained, physically grounded Fresnel edge glint (only where key or core light grazes facet ridges)
    float lightRimMask = clamp(0.18 + facetDiff1 * 0.58 + coreDiff * coreAtten * 0.82 + activeEnergy * 0.48, 0.14, 1.25);
    vec3 rimTint = mix(
      vec3(0.62, 0.34, 0.98),
      electricCyan,
      clamp(0.38 + coreDiff * coreAtten * 0.5 + uExplored * 0.55 + uHighlight * 0.38 + uFractureFlash * 0.55, 0.0, 1.0)
    );
    finalColor += rimTint * pow(1.0 - cosTheta, 3.1) * lightRimMask * (0.44 + rimWeight * 0.22 + radialPos * 0.12 + uExplored * 0.32 + activeEnergy * 0.52);

    // Internal luminous fracture glow & subsurface light scattering on adjacent facets during Phase A/B & Phase C healing
    if (uFractureFlash > 0.001) {
      float internalPulse = 0.5 + 0.5 * sin(vLocalPos.x * 7.5 + vLocalPos.y * 8.2 - uTime * 5.2 + facetId * 6.28);
      float veinScatter = pow(0.5 + 0.5 * cos(vLocalPos.x * 11.0 - vLocalPos.z * 9.5 + facetId * 12.0), 3.0);
      vec3 electricCyanGlow = vec3(0.22, 0.90, 1.0);
      vec3 intenseVioletGlow = vec3(0.62, 0.24, 1.0);
      vec3 selectiveMagenta = vec3(0.94, 0.32, 0.86);
      vec3 fractureCol = mix(intenseVioletGlow, electricCyanGlow, 0.42 + 0.48 * internalPulse);
      fractureCol = mix(fractureCol, selectiveMagenta, veinScatter * 0.38);
      finalColor += fractureCol * (uFractureFlash * (0.72 + internalDepth * 1.25 + veinScatter * 0.55 + isCleavage * 0.85));
    }

    // Filmic soft highlight roll-off preserves deep jewel contrast
    finalColor = finalColor / (vec3(1.0) + finalColor * 0.15);

    // Preserve natural cosmic luminosity on non-selected crystals (no dark blackout)
    finalColor *= mix(1.0, 0.86, uDim);

    float baseAlpha = uIsBackFace > 0.5
      ? 0.86
      : clamp(0.76 + fresnel * 0.22 + clamp(spec1 + specCore + facetFlash, 0.0, 0.22), 0.76, 0.98);
    float finalAlpha = baseAlpha * uOpacity * mix(1.0, 0.92, uDim);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// Software-WebGL streamlined optical crystal shader (2 cubemap lookups, full facet contrast + internal depth)
const CRYSTAL_FRAGMENT_SHADER_FAST = `
  uniform samplerCube uEnvMap;
  uniform float uTime;
  uniform float uHover;
  uniform float uHighlight;
  uniform float uExplored;
  uniform float uDim;
  uniform float uFractureFlash;
  uniform float uInternalEnergy;
  uniform float uOpacity;
  uniform float uIsBackFace;
  uniform vec2 uPointer;
  uniform vec3 uAccentColor;
  uniform vec3 uCoreLightPos;
  uniform vec3 uCoreLightColor;
  uniform float uCoreLightIntensity;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  varying vec4 vFacetMeta;

  void main() {
    float facetType = vFacetMeta.x;
    float facetId = vFacetMeta.y;
    float rimWeight = vFacetMeta.w;
    float isCleavage = step(9.5, facetType);

    float facetHash = fract(sin(facetId * 91.7 + facetType * 17.3) * 43758.5453);
    float facetHash2 = fract(cos(facetId * 53.1 - facetType * 29.7) * 28411.321);
    vec3 facetMicroTilt = vec3(
      (facetHash - 0.5) * 0.11,
      (facetHash2 - 0.5) * 0.08,
      (fract(facetHash + facetHash2) - 0.5) * 0.11
    );
    vec3 N = normalize(vWorldNormal * (1.0 - 2.0 * uIsBackFace) + facetMicroTilt);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 I = -V;

    vec3 keyLight1 = normalize(vec3(0.56 + uPointer.x * 0.24, 0.80 + uPointer.y * 0.20, 0.64));
    vec3 keyLight2 = normalize(vec3(-0.70, 0.34, 0.58));
    vec3 topLightDir = normalize(vec3(0.10, 0.97, 0.22));

    vec3 toCore = uCoreLightPos - vWorldPos;
    float coreDist = length(toCore);
    vec3 Lcore = toCore / max(coreDist, 0.001);
    float coreAtten = uCoreLightIntensity / (1.0 + coreDist * coreDist * 0.15);
    float coreDiff = max(0.0, dot(N, Lcore));
    float coreBackscatter = pow(max(0.0, dot(V, -Lcore)), 2.4) * (0.52 + isCleavage * 0.55);

    float cosTheta = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = 0.19 + 0.81 * pow(1.0 - cosTheta, mix(3.5, 2.6, isCleavage));

    vec3 refractG = refract(I, N, 1.0 / 2.417);
    vec3 R = reflect(I, N);
    vec3 refractedEnv = textureCube(uEnvMap, refractG).rgb;
    vec3 reflectedEnv = textureCube(uEnvMap, R).rgb;

    vec3 deepObsidian = vec3(0.035, 0.012, 0.11);
    vec3 royalViolet = vec3(0.48, 0.16, 0.92);
    vec3 electricCyan = vec3(0.22, 0.86, 1.0);
    vec3 magentaAccent = mix(vec3(0.84, 0.28, 0.82), uAccentColor, 0.42);
    vec3 diamondIce = vec3(0.94, 0.97, 1.0);

    vec3 pleochroic = mix(deepObsidian * 2.8, royalViolet, facetHash);
    pleochroic = mix(pleochroic, electricCyan, pow(facetHash2, 1.5) * 0.56);
    pleochroic = mix(pleochroic, mix(royalViolet, electricCyan, 0.58), isCleavage * 0.65);
    vec3 interior = refractedEnv * mix(royalViolet, pleochroic, 0.56) * (1.44 + isCleavage * 0.34);

    float internalDepth = exp(-dot(vLocalPos, vLocalPos) * 2.0);
    float causticWave = 0.5 + 0.5 * sin(vLocalPos.x * 6.0 - vLocalPos.y * 4.8 + uTime * 1.3 + facetId * 6.28);
    vec3 internalGlow =
      mix(royalViolet, electricCyan, 0.46 + causticWave * 0.34 + isCleavage * 0.28) *
      internalDepth *
      (0.38 + uInternalEnergy * 0.9);

    float d1 = max(0.0, dot(N, keyLight1));
    float d2 = max(0.0, dot(N, keyLight2));
    float dTop = max(0.0, dot(N, topLightDir));
    float facetContrast = 0.68 + 0.64 * smoothstep(0.15, 0.88, facetHash);
    vec3 shading =
      deepObsidian * 0.38 +
      royalViolet * (0.62 * d1 * facetContrast) +
      electricCyan * (0.34 * d2 * (1.3 - facetContrast * 0.45)) +
      magentaAccent * (0.24 * d2) +
      diamondIce * (0.32 * dTop * dTop) +
      uCoreLightColor * (coreDiff * 0.98 + coreBackscatter * 0.7) * coreAtten;

    vec3 H1 = normalize(keyLight1 + V);
    vec3 Hcore = normalize(Lcore + V);
    float spec1 = pow(max(0.0, dot(N, H1)), mix(165.0, 42.0, isCleavage)) * mix(1.75, 0.72, isCleavage);
    float specCore = pow(max(0.0, dot(N, Hcore)), mix(105.0, 34.0, isCleavage)) * 1.32 * coreAtten;

    float activeEnergy = max(uHover, uHighlight);
    vec3 tintedRefl = reflectedEnv * mix(vec3(0.76, 0.82, 1.0), diamondIce, 0.52);
    vec3 baseCrystal = mix(interior + shading * 0.60 + internalGlow, tintedRefl, fresnel * mix(0.52, 0.28, isCleavage));
    vec3 finalColor = baseCrystal * (1.0 + activeEnergy * 0.34);
    finalColor += vec3(0.97, 0.99, 1.0) * spec1;
    finalColor += uCoreLightColor * specCore;

    float lightRimMask = clamp(0.18 + d1 * 0.58 + coreDiff * coreAtten * 0.82 + activeEnergy * 0.48, 0.14, 1.25);
    vec3 rimTint = mix(vec3(0.62, 0.34, 0.98), electricCyan, clamp(0.38 + coreDiff * coreAtten * 0.5 + uExplored * 0.55 + uHighlight * 0.38 + uFractureFlash * 0.55, 0.0, 1.0));
    finalColor += rimTint * pow(1.0 - cosTheta, 3.0) * lightRimMask * (0.44 + rimWeight * 0.22 + uExplored * 0.32 + activeEnergy * 0.52);

    if (uFractureFlash > 0.001) {
      vec3 fractureCol = mix(vec3(0.54, 0.26, 1.0), vec3(0.32, 0.92, 1.0), 0.68);
      finalColor += fractureCol * (uFractureFlash * (0.72 + internalDepth * 1.1 + isCleavage * 0.75));
    }

    finalColor = finalColor / (vec3(1.0) + finalColor * 0.15);
    finalColor *= mix(1.0, 0.86, uDim);

    float baseAlpha = uIsBackFace > 0.5 ? 0.86 : clamp(0.78 + fresnel * 0.20, 0.78, 0.98);
    float finalAlpha = baseAlpha * uOpacity * mix(1.0, 0.92, uDim);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// Selective luminous crystal edge shader: highlights only facet ridges catching light or core energy (never cartoon outlines)
const SELECTIVE_EDGE_VERTEX = `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SELECTIVE_EDGE_FRAGMENT = `
  uniform vec3 uColor;
  uniform vec3 uCoreLightPos;
  uniform vec3 uCoreLightColor;
  uniform float uOpacity;
  uniform float uCoreInfluence;
  varying vec3 vWorldPos;

  void main() {
    vec3 toCore = uCoreLightPos - vWorldPos;
    float d = length(toCore);
    float coreBoost = uCoreInfluence / (1.0 + d * d * 0.24);
    // High-frequency specular ridge mask so only selective illuminated ridges catch light
    float ridgeGlint = pow(0.5 + 0.5 * sin(vWorldPos.x * 5.2 + vWorldPos.y * 6.4 - vWorldPos.z * 4.5), 2.2);
    vec3 col = mix(uColor, uCoreLightColor, clamp(0.25 + coreBoost * 0.68, 0.0, 0.88));
    float alpha = clamp(uOpacity * (0.22 + ridgeGlint * 0.68 + coreBoost * 0.52), 0.0, 0.82);
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface CrystalMaterialSet {
  backMat: THREE.ShaderMaterial;
  frontMat: THREE.ShaderMaterial;
  edgeBackMat: THREE.LineBasicMaterial;
  edgeFrontMat: THREE.ShaderMaterial;
  setCoreLight: (pos: THREE.Vector3, intensity: number, colorHex?: string) => void;
  dispose: () => void;
}

const _tmpCoreCol = new THREE.Color();

/**
 * Creates the upgraded optical dispersion crystal material set + selective luminous edge shader.
 */
export function createOpticalCrystalMaterials(
  envCube: THREE.CubeTexture,
  accentHex = '#c084fc',
  fastMode = false
): CrystalMaterialSet {
  const accentColor = new THREE.Color(accentHex);
  const fragShader = fastMode ? CRYSTAL_FRAGMENT_SHADER_FAST : CRYSTAL_FRAGMENT_SHADER;
  const defaultCoreCol = new THREE.Color('#67e8f9');

  const makeUniforms = (isBackFace: number) => ({
    uEnvMap: { value: envCube },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uHighlight: { value: 0 },
    uExplored: { value: 0 },
    uDim: { value: 0 },
    uFractureFlash: { value: 0 },
    uInternalEnergy: { value: 0.25 },
    uOpacity: { value: 1 },
    uIsBackFace: { value: isBackFace },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uAccentColor: { value: accentColor.clone() },
    uCoreLightPos: { value: new THREE.Vector3(0, 0, 0) },
    uCoreLightColor: { value: defaultCoreCol.clone() },
    uCoreLightIntensity: { value: 1.65 },
  });

  const backMat = new THREE.ShaderMaterial({
    vertexShader: CRYSTAL_VERTEX_SHADER,
    fragmentShader: fragShader,
    uniforms: makeUniforms(1.0),
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });

  const frontMat = new THREE.ShaderMaterial({
    vertexShader: CRYSTAL_VERTEX_SHADER,
    fragmentShader: fragShader,
    uniforms: makeUniforms(0.0),
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: true,
  });

  const edgeBackMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#8b5cf6'),
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const edgeFrontMat = new THREE.ShaderMaterial({
    vertexShader: SELECTIVE_EDGE_VERTEX,
    fragmentShader: SELECTIVE_EDGE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color('#c4b5fd').lerp(accentColor, 0.38) },
      uCoreLightPos: { value: new THREE.Vector3(0, 0, 0) },
      uCoreLightColor: { value: new THREE.Color('#7dd3fc') },
      uOpacity: { value: 0.24 },
      uCoreInfluence: { value: 0.95 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return {
    backMat,
    frontMat,
    edgeBackMat,
    edgeFrontMat,
    setCoreLight: (pos, intensity, colorHex) => {
      backMat.uniforms.uCoreLightPos.value.copy(pos);
      backMat.uniforms.uCoreLightIntensity.value = intensity;
      frontMat.uniforms.uCoreLightPos.value.copy(pos);
      frontMat.uniforms.uCoreLightIntensity.value = intensity;
      edgeFrontMat.uniforms.uCoreLightPos.value.copy(pos);
      edgeFrontMat.uniforms.uCoreInfluence.value = intensity * 0.72;
      if (colorHex) {
        _tmpCoreCol.set(colorHex);
        backMat.uniforms.uCoreLightColor.value.copy(_tmpCoreCol);
        frontMat.uniforms.uCoreLightColor.value.copy(_tmpCoreCol);
        edgeFrontMat.uniforms.uCoreLightColor.value.copy(_tmpCoreCol);
      }
    },
    dispose: () => {
      backMat.dispose();
      frontMat.dispose();
      edgeBackMat.dispose();
      edgeFrontMat.dispose();
    },
  };
}

/* ============================================================================
 * 2. PROGRESSIVE 3D FRACTURE CRACK VEIN MATERIAL (Phase A & Phase B)
 * ========================================================================== */

const CRACK_VEIN_VERTEX = `
  attribute float aPropagationOrder;
  attribute float aCrackIntensity;
  varying float vOrder;
  varying float vIntensity;
  varying vec3 vLocalPos;

  void main() {
    vOrder = aPropagationOrder;
    vIntensity = aCrackIntensity;
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CRACK_VEIN_FRAGMENT = `
  uniform float uProgress;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uHealingWave;
  varying float vOrder;
  varying float vIntensity;
  varying vec3 vLocalPos;

  void main() {
    // Only reveal crack segments as propagation wavefront passes them
    float reveal = smoothstep(vOrder + 0.035, vOrder - 0.055, uProgress);
    if (reveal < 0.01) discard;

    // Hot white-cyan advancing crack tip transitioning into electric cyan, intense violet & selective magenta
    float tipDist = abs(uProgress - vOrder);
    float hotTip = exp(-pow(tipDist / 0.095, 2.0));

    float internalPulse = 0.5 + 0.5 * sin(vOrder * 20.0 - uTime * 5.4 + vLocalPos.y * 7.0);
    float magentaMask = pow(0.5 + 0.5 * sin(vOrder * 31.0 + vLocalPos.x * 9.0), 3.0);

    vec3 intenseViolet = vec3(0.62, 0.25, 1.0);
    vec3 electricCyan = vec3(0.24, 0.92, 1.0);
    vec3 selectiveMagenta = vec3(0.95, 0.34, 0.88);
    vec3 incandescentCore = vec3(0.96, 0.99, 1.0);

    vec3 col = mix(intenseViolet, electricCyan, clamp(0.36 + internalPulse * 0.44 + uGlow * 0.25, 0.0, 1.0));
    col = mix(col, selectiveMagenta, magentaMask * 0.42);
    col = mix(col, incandescentCore, clamp(hotTip * 0.88 + uGlow * 0.32, 0.0, 1.0));

    // Stage 3 Phase C Crystalline Healing wave: soft cyan-violet wave sweeps through crystal,
    // briefly intensifying crack brightness before sealing and dissolving the fracture network
    float healBoost = 0.0;
    float healFade = 1.0;
    if (uHealingWave > 0.001) {
      float normY = clamp((vLocalPos.y + 0.95) / 1.75, 0.0, 1.0);
      float waveFront = uHealingWave * 1.25 - 0.1;
      float waveDist = abs(normY - waveFront);
      healBoost = exp(-pow(waveDist / 0.18, 2.0)) * 1.15;
      healFade = smoothstep(waveFront - 0.18, waveFront + 0.06, normY);
      col = mix(col, mix(electricCyan, incandescentCore, 0.55), clamp(healBoost, 0.0, 1.0));
    }

    float pulseAlpha = 0.78 + 0.22 * internalPulse;
    float alpha = clamp(reveal * vIntensity * pulseAlpha * (0.68 + uGlow * 0.55 + healBoost * 0.5) * healFade * uOpacity, 0.0, 1.0);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col * (1.25 + uGlow * 0.95 + healBoost * 0.85), alpha);
  }
`;

export function createFractureCrackNetworkMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: CRACK_VEIN_VERTEX,
    fragmentShader: CRACK_VEIN_FRAGMENT,
    uniforms: {
      uProgress: { value: 0 },
      uGlow: { value: 0 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uHealingWave: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
}

/* ============================================================================
 * 3. ENERGY CORE BUNDLE (Dashboard Core + Multi-Layered Cosmic Center Core)
 * ========================================================================== */

const PLASMA_CORE_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PLASMA_CORE_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uHover;
  uniform float uRipple;
  uniform float uSupernova;
  uniform float uOpacity;
  uniform float uDim;
  uniform float uIsCosmic;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  float plasmaField(vec3 p, float t) {
    float v1 = sin(p.x * 5.2 + t * 1.45) * cos(p.y * 4.8 - t * 1.15);
    float v2 = sin(p.z * 5.8 + t * 1.25 + v1 * 1.4) * cos(p.x * 3.9 + p.y * 4.2 - t * 0.9);
    float v3 = sin((p.x + p.y - p.z) * 6.8 - t * 1.9);
    float v4 = cos((p.y * 8.2 - p.x * 7.4) + t * 2.1 + v2);
    return (v1 + v2 + v3 + v4 * 0.6) * 0.278 * 0.5 + 0.5;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 2.15);

    float timeBoost = 1.0 + uSupernova * 2.4;
    vec3 dir = normalize(vLocalPos);
    float flow1 = plasmaField(dir * 1.45, uTime * timeBoost);
    float flow2 = plasmaField(dir * 2.75 + vec3(flow1 * 0.85), -uTime * 1.25 * timeBoost);
    float filaments = pow(clamp(abs(flow1 - flow2) * 2.4, 0.0, 1.0), 1.4);
    float plasma = clamp(flow1 * 0.55 + flow2 * 0.45, 0.0, 1.0);

    vec3 deepIndigo = vec3(0.14, 0.08, 0.54);
    vec3 luminousViolet = vec3(0.56, 0.22, 0.98);
    vec3 electricCyan = vec3(0.20, 0.84, 1.0);
    vec3 starCore = vec3(0.96, 0.98, 1.0);

    vec3 col = mix(deepIndigo, luminousViolet, smoothstep(0.15, 0.72, plasma));
    col = mix(col, electricCyan, smoothstep(0.48, 0.9, plasma) * (0.78 + uIsCosmic * 0.2));
    // Fine internal luminous filaments
    col += mix(electricCyan, starCore, 0.5) * filaments * (0.45 + uIsCosmic * 0.35 + uSupernova * 0.85);

    // Bright central heart + crisp Fresnel corona
    float heart = pow(ndv, 2.3) * (0.8 + 0.2 * sin(uTime * 2.4));
    col = mix(col, starCore, clamp(heart * 0.76 + uSupernova * 0.65, 0.0, 1.0));
    col += mix(luminousViolet, electricCyan, 0.6) * fresnel * (1.2 + uHover * 0.65 + uSupernova * 1.4);

    if (uRipple > 0.001) {
      float ringWave = sin(ndv * 14.0 - uRipple * 10.0) * 0.5 + 0.5;
      col += vec3(0.65, 0.94, 1.0) * ringWave * (1.0 - uRipple) * 1.25;
    }

    float boost = 1.0 + uHover * 0.32 + uSupernova * 1.15;
    col *= boost * mix(1.0, 0.28, uDim);

    float alpha = clamp(0.88 + fresnel * 0.12, 0.0, 1.0) * uOpacity * mix(1.0, 0.32, uDim);
    gl_FragColor = vec4(col, alpha);
  }
`;

// Translucent faceted containment shell exclusive to the Cosmic Center Core
const COSMIC_SHELL_FRAGMENT = `
  uniform float uTime;
  uniform float uHover;
  uniform float uOpacity;
  uniform float uDim;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 2.8);

    vec3 p = normalize(vLocalPos);
    float band = sin(p.y * 12.0 + uTime * 1.2 + sin(p.x * 7.0) * 1.4) * 0.5 + 0.5;
    float lattice = smoothstep(0.76, 0.96, band);

    vec3 col = mix(vec3(0.45, 0.24, 0.96), vec3(0.32, 0.88, 1.0), fresnel * 0.7 + lattice * 0.4);
    col *= (0.85 + uHover * 0.45) * mix(1.0, 0.22, uDim);

    float alpha = (fresnel * 0.42 + lattice * 0.16) * uOpacity * mix(1.0, 0.25, uDim);
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

// Animated shader-driven orbital light filament rings (traveling luminous pulses instead of flat tori)
const ORBITAL_FILAMENT_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ORBITAL_FILAMENT_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float phase = vUv.x * 6.2831853;
    float pulse1 = pow(0.5 + 0.5 * sin(phase * 2.0 - uTime * uSpeed), 4.0);
    float pulse2 = pow(0.5 + 0.5 * sin(phase * 3.0 + uTime * uSpeed * 0.7), 6.0);
    float intensity = 0.24 + pulse1 * 0.85 + pulse2 * 0.55;
    vec3 col = mix(uColor, vec3(0.92, 0.98, 1.0), pulse1 * 0.52);
    float alpha = clamp(intensity * uOpacity, 0.0, 0.95);
    gl_FragColor = vec4(col, alpha);
  }
`;

const HALO_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uHover;
  uniform float uSupernova;
  uniform float uBurst;
  uniform float uOpacity;
  uniform float uDim;

  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float d = length(centered) * 2.0;
    float radialFade = smoothstep(1.0, 0.16, d);
    float pulse = 0.94 + 0.06 * sin(uTime * 2.1);

    float angle = atan(centered.y, centered.x);
    // Subtle volumetric radial light scattering rays during Supernova burst
    float rays = 0.5 + 0.5 * sin(angle * 8.0 + uTime * 2.4) * cos(angle * 5.0 - uTime * 1.7);
    float rayBurst = uBurst * exp(-d * 1.75) * (0.45 + 0.55 * rays) * 1.45;

    float innerGlow = exp(-d * d * 5.4) * (0.82 + uSupernova * 0.8 + uBurst * 1.2);
    float outerAura = exp(-d * d * 2.2) * (0.32 + uSupernova * 0.36 + uBurst * 0.72);
    float strength = (innerGlow + outerAura + rayBurst) * radialFade * pulse * (1.0 + uHover * 0.35);

    vec3 col = mix(vec3(0.32, 0.78, 1.0), vec3(0.60, 0.28, 0.98), smoothstep(0.14, 0.78, d));
    col = mix(col, vec3(0.92, 0.97, 1.0), clamp((uSupernova * 0.45 + uBurst * 0.75) * exp(-d * d * 3.2), 0.0, 1.0));
    col *= mix(1.0, 0.22, uDim);

    float alpha = clamp(strength, 0.0, 1.0) * uOpacity * mix(1.0, 0.24, uDim);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const SHOCKWAVE_RING_FRAGMENT_SHADER = `
  uniform float uProgress;
  uniform float uOpacity;
  uniform vec3 uInnerColor;
  uniform vec3 uOuterColor;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);
    if (d > 1.0) discard;

    float ringPos = mix(0.12, 0.93, uProgress);
    float distToRing = d - ringPos;
    float coreLine = exp(-pow(distToRing / 0.024, 2.0));
    float innerTrail = distToRing < 0.0 ? exp(-pow(distToRing / 0.14, 2.0)) * 0.34 : 0.0;
    float outerHalo = exp(-pow(distToRing / 0.08, 2.0)) * 0.26;

    float intensity = (coreLine * 0.96 + innerTrail + outerHalo);
    float edgeFade = smoothstep(1.0, 0.84, d);
    float lifeFade = sin(clamp(uProgress, 0.0, 1.0) * 3.14159265) * (1.0 - uProgress * 0.42);

    vec3 col = mix(uOuterColor, uInnerColor, clamp(coreLine + 0.25, 0.0, 1.0));
    float alpha = clamp(intensity * edgeFade * lifeFade * uOpacity, 0.0, 0.88);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface EnergyCoreBundle {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  hitSphere: THREE.Mesh;
  coreMaterial: THREE.ShaderMaterial;
  haloMesh: THREE.Mesh;
  haloMaterial: THREE.ShaderMaterial;
  rings: THREE.Mesh[];
  rippleRing: THREE.Mesh;
  pulseWaveRing: THREE.Mesh;
  update: (opts: {
    elapsed: number;
    hover: number;
    opacity: number;
    dim: number;
    rippleProgress: number;
    radialPulseProgress?: number;
    supernovaCompression?: number;
    supernovaBurst?: number;
    cameraQuaternion: THREE.Quaternion;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

/**
 * Builds the 3D Energy Core.
 * - variant = 'dashboard': focused Dashboard diamond core tuned for the 4-phase Supernova sequence
 * - variant = 'cosmic': distinctive multi-layered Cosmic Center Core with translucent geodesic
 *   containment membrane and shader-animated orbital plasma filaments
 */
export function createEnergyCoreBundle(
  radius = 0.42,
  isSoftwareGl = false,
  variant: 'dashboard' | 'cosmic' = 'dashboard'
): EnergyCoreBundle {
  const group = new THREE.Group();
  const isCosmic = variant === 'cosmic';

  const sphereSegs = isSoftwareGl ? 20 : 36;
  const coreGeo = new THREE.SphereGeometry(radius, sphereSegs, sphereSegs);
  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: PLASMA_CORE_VERTEX_SHADER,
    fragmentShader: PLASMA_CORE_FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uRipple: { value: 0 },
      uSupernova: { value: 0 },
      uOpacity: { value: 1 },
      uDim: { value: 0 },
      uIsCosmic: { value: isCosmic ? 1.0 : 0.0 },
    },
    transparent: true,
    // CRITICAL: depthWrite must remain false on the transparent energy core so it NEVER writes
    // an invisible spherical depth wall that clips orbiting crystal shards behind or near (0,0,0).
    depthWrite: false,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
  coreMesh.renderOrder = 2;
  group.add(coreMesh);

  // Distinctive translucent geodesic containment membrane for the Cosmic Center Core
  let shellGeo: THREE.BufferGeometry | null = null;
  let shellMat: THREE.ShaderMaterial | null = null;
  let shellMesh: THREE.Mesh | null = null;
  if (isCosmic) {
    shellGeo = new THREE.IcosahedronGeometry(radius * 1.38, isSoftwareGl ? 1 : 2);
    shellMat = new THREE.ShaderMaterial({
      vertexShader: PLASMA_CORE_VERTEX_SHADER,
      fragmentShader: COSMIC_SHELL_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
        uOpacity: { value: 1 },
        uDim: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.renderOrder = 4;
    group.add(shellMesh);
  }

  // Invisible Layer-2 raycast proxy
  const hitGeo = new THREE.SphereGeometry(radius * 1.95, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false,
  });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.layers.set(2);
  hitSphere.userData = { isEnergyCore: true };
  group.add(hitSphere);

  // Volumetric atmospheric halo + supernova burst scattering plane
  const haloGeo = new THREE.PlaneGeometry(radius * 7.6, radius * 7.6);
  const haloMaterial = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX_SHADER,
    fragmentShader: HALO_FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uSupernova: { value: 0 },
      uBurst: { value: 0 },
      uOpacity: { value: 1 },
      uDim: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMaterial);
  haloMesh.renderOrder = 2;
  group.add(haloMesh);

  // 3 sculpted shader-animated orbital light filaments
  const ringConfigs = [
    { r: radius * 1.54, tube: radius * 0.017, color: '#38bdf8', rx: 1.12, ry: 0.3, rz: 0.1, speed: 1.8 },
    { r: radius * 1.92, tube: radius * 0.014, color: '#a855f7', rx: 0.65, ry: -0.5, rz: 0.85, speed: -1.4 },
    { r: radius * 2.32, tube: radius * 0.011, color: '#818cf8', rx: -0.88, ry: 0.42, rz: -0.35, speed: 1.1 },
  ];

  const rings: THREE.Mesh[] = [];
  const ringMaterials: THREE.ShaderMaterial[] = [];
  const ringGeometries: THREE.BufferGeometry[] = [];

  for (const cfg of ringConfigs) {
    const rGeo = new THREE.TorusGeometry(
      cfg.r,
      cfg.tube,
      isSoftwareGl ? 6 : 10,
      isSoftwareGl ? 36 : 72
    );
    const rMat = new THREE.ShaderMaterial({
      vertexShader: ORBITAL_FILAMENT_VERTEX,
      fragmentShader: ORBITAL_FILAMENT_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(cfg.color) },
        uSpeed: { value: cfg.speed },
        uOpacity: { value: 0.5 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    rMesh.renderOrder = 3;
    group.add(rMesh);
    rings.push(rMesh);
    ringMaterials.push(rMat);
    ringGeometries.push(rGeo);
  }

  // Soft-feathered cyan inner shockwave ring
  const rippleGeo = new THREE.PlaneGeometry(radius * 12, radius * 12);
  const rippleMaterial = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX_SHADER,
    fragmentShader: SHOCKWAVE_RING_FRAGMENT_SHADER,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uInnerColor: { value: new THREE.Color('#e0f2fe') },
      uOuterColor: { value: new THREE.Color('#38bdf8') },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rippleRing = new THREE.Mesh(rippleGeo, rippleMaterial);
  rippleRing.renderOrder = 5;
  rippleRing.visible = false;
  group.add(rippleRing);

  // Wide feathered radial energy pulse wave (Stage 2 Supernova shockwave + Stage 4 Cosmic Core radial pulse)
  const pulseWaveGeo = new THREE.PlaneGeometry(radius * 28, radius * 28);
  const pulseWaveMaterial = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX_SHADER,
    fragmentShader: SHOCKWAVE_RING_FRAGMENT_SHADER,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uInnerColor: { value: new THREE.Color('#7dd3fc') },
      uOuterColor: { value: new THREE.Color('#a855f7') },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pulseWaveRing = new THREE.Mesh(pulseWaveGeo, pulseWaveMaterial);
  pulseWaveRing.renderOrder = 6;
  pulseWaveRing.visible = false;
  group.add(pulseWaveRing);

  return {
    group,
    coreMesh,
    hitSphere,
    coreMaterial,
    haloMesh,
    haloMaterial,
    rings,
    rippleRing,
    pulseWaveRing,
    update: ({
      elapsed,
      hover,
      opacity,
      dim,
      rippleProgress,
      radialPulseProgress = 0,
      supernovaCompression = 0,
      supernovaBurst = 0,
      cameraQuaternion,
      reducedMotion,
    }) => {
      const motionMult = reducedMotion ? 0.18 : 1.0;

      coreMaterial.uniforms.uTime.value = elapsed * motionMult;
      coreMaterial.uniforms.uHover.value = hover;
      coreMaterial.uniforms.uOpacity.value = opacity;
      coreMaterial.uniforms.uDim.value = dim;
      coreMaterial.uniforms.uRipple.value = rippleProgress;
      coreMaterial.uniforms.uSupernova.value = Math.max(supernovaCompression, supernovaBurst);

      haloMaterial.uniforms.uTime.value = elapsed * motionMult;
      haloMaterial.uniforms.uHover.value = hover;
      haloMaterial.uniforms.uSupernova.value = supernovaCompression;
      haloMaterial.uniforms.uBurst.value = supernovaBurst;
      haloMaterial.uniforms.uOpacity.value = opacity;
      haloMaterial.uniforms.uDim.value = dim;

      if (shellMesh && shellMat) {
        shellMat.uniforms.uTime.value = elapsed * motionMult;
        shellMat.uniforms.uHover.value = hover;
        shellMat.uniforms.uOpacity.value = opacity;
        shellMat.uniforms.uDim.value = dim;
        shellMesh.rotation.y = -elapsed * 0.18 * motionMult;
        shellMesh.rotation.x = Math.sin(elapsed * 0.22 * motionMult) * 0.35;
      }

      haloMesh.quaternion.copy(cameraQuaternion);
      rippleRing.quaternion.copy(cameraQuaternion);
      pulseWaveRing.quaternion.copy(cameraQuaternion);

      const breath = 1.0 + Math.sin(elapsed * 1.9 * motionMult) * 0.038;
      const compressionScale = 1.0 - supernovaCompression * 0.32 + supernovaBurst * 0.9;
      const coreScale = breath * (1.0 + hover * 0.14) * compressionScale;
      coreMesh.scale.setScalar(Math.max(0.36, coreScale));

      const ringPinch = 1.0 - supernovaCompression * 0.44 + supernovaBurst * 0.85;
      const spinBoost = 1.0 + supernovaCompression * 2.8 + supernovaBurst * 1.8;

      rings[0].scale.setScalar(ringPinch);
      rings[1].scale.setScalar(ringPinch);
      rings[2].scale.setScalar(ringPinch);
      rings[0].rotation.z = elapsed * 0.34 * motionMult * spinBoost;
      rings[0].rotation.x = 1.12 + Math.sin(elapsed * 0.28 * motionMult) * 0.1;
      rings[1].rotation.y = -elapsed * 0.26 * motionMult * spinBoost;
      rings[1].rotation.z = 0.85 + Math.cos(elapsed * 0.24 * motionMult) * 0.08;
      rings[2].rotation.x = -0.88 + elapsed * 0.2 * motionMult * spinBoost;
      rings[2].rotation.y = elapsed * 0.16 * motionMult * spinBoost;

      const dimFactor = 1.0 - dim * 0.8;
      for (let i = 0; i < ringMaterials.length; i++) {
        ringMaterials[i].uniforms.uTime.value = elapsed * motionMult * spinBoost;
        const baseOp = i === 0 ? 0.62 : i === 1 ? 0.46 : 0.36;
        ringMaterials[i].uniforms.uOpacity.value =
          (baseOp + hover * 0.28 + supernovaCompression * 0.35) * opacity * dimFactor;
      }

      if (rippleProgress > 0.001 && rippleProgress < 1.0) {
        rippleRing.visible = true;
        rippleMaterial.uniforms.uProgress.value = rippleProgress;
        rippleMaterial.uniforms.uOpacity.value = 0.78 * opacity * (1 - dim * 0.72);
      } else {
        rippleRing.visible = false;
        rippleMaterial.uniforms.uOpacity.value = 0;
      }

      if (radialPulseProgress > 0.001 && radialPulseProgress < 1.0) {
        pulseWaveRing.visible = true;
        pulseWaveMaterial.uniforms.uProgress.value = radialPulseProgress;
        pulseWaveMaterial.uniforms.uOpacity.value = 0.84 * opacity * (1 - dim * 0.76);
      } else {
        pulseWaveRing.visible = false;
        pulseWaveMaterial.uniforms.uOpacity.value = 0;
      }
    },
    dispose: () => {
      coreGeo.dispose();
      coreMaterial.dispose();
      shellGeo?.dispose();
      shellMat?.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      haloGeo.dispose();
      haloMaterial.dispose();
      ringGeometries.forEach((g) => g.dispose());
      ringMaterials.forEach((m) => m.dispose());
      rippleGeo.dispose();
      rippleMaterial.dispose();
      pulseWaveGeo.dispose();
      pulseWaveMaterial.dispose();
    },
  };
}

/* ============================================================================
 * 4. ASTROPHYSICALLY INSPIRED BLACK HOLE WITH GRAVITATIONAL LENSING (Section 9)
 * - Pure black event horizon + Doppler-asymmetric relativistic photon ring
 * - Warped upper & lower lensed far-side accretion arches + Einstein ring distortion
 * - Layered FBM turbulent swirling accretion disk with relativistic Doppler beaming
 * ========================================================================== */

const BLACK_HOLE_HORIZON_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const BLACK_HOLE_HORIZON_FRAGMENT = `
  uniform float uHover;
  uniform float uExit;
  uniform float uDim;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float ndv = clamp(dot(N, V), 0.0, 1.0);

    // Pure pitch-black singularity shadow core; razor-sharp photon ring ONLY at grazing rim
    float photonRing = pow(1.0 - ndv, 9.5);
    float innerShadow = smoothstep(0.24, 0.04, ndv);
    // Asymmetric relativistic Doppler beaming (approaching left limb brighter & icier)
    float doppler = clamp(0.68 - N.x * 0.45, 0.35, 1.25);

    vec3 rimViolet = vec3(0.56, 0.28, 0.96);
    vec3 rimCyan = vec3(0.52, 0.90, 1.0);
    vec3 rimWhite = vec3(0.96, 0.98, 1.0);

    vec3 rimCol = mix(rimViolet, rimCyan, clamp(0.45 + doppler * 0.35, 0.0, 1.0));
    rimCol = mix(rimCol, rimWhite, clamp(photonRing * 0.85 + uExit * 0.45, 0.0, 1.0));

    vec3 col = rimCol * photonRing * doppler * (1.55 + uHover * 0.85 + uExit * 1.9);
    // Keep center truly pitch black
    col *= innerShadow * mix(1.0, 0.2, uDim);

    gl_FragColor = vec4(col, uOpacity * mix(1.0, 0.28, uDim));
  }
`;

// Camera-facing relativistic gravitational lensing halo:
// Bends the far side of the accretion disk UP over the north pole and DOWN under the south pole
// + renders a delicate Einstein ring / warped space-time light envelope around the black shadow
const LENSED_HALO_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LENSED_HALO_FRAGMENT = `
  uniform float uTime;
  uniform float uHover;
  uniform float uExit;
  uniform float uDim;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    // Slight tilt matching accretion disk plane
    float cs = cos(0.24);
    float sn = sin(0.24);
    vec2 tp = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);

    float r = length(tp);
    if (r < 0.28 || r > 1.0) discard;

    float angle = atan(tp.y, tp.x);
    float speed = 1.0 + uHover * 0.75 + uExit * 3.4;

    // Relativistic Doppler beaming: brighter & cooler on approaching side (tp.x < 0)
    float doppler = clamp(0.85 - tp.x * 0.78, 0.32, 1.48);

    // 1. Razor-thin Einstein Photon Ring right around the event horizon (r ~ 0.34)
    float photonRing = exp(-pow((r - 0.335) / 0.018, 2.0)) * 1.15;

    // 2. Warped Upper & Lower Lensed Arches of the far-side accretion disk (Interstellar optical signature)
    float verticalArchMask = smoothstep(0.04, 0.65, abs(tp.y / max(r, 0.001)));
    float upperBias = tp.y > 0.0 ? 1.0 : 0.68;
    float lensedBandRadius = 0.42 + 0.045 * cos(angle * 2.0);
    float lensedArch = exp(-pow((r - lensedBandRadius) / 0.068, 2.0)) * verticalArchMask * upperBias;

    // Turbulent plasma streaks flowing along the lensed arch
    float flowNoise = vnoise(vec2(angle * 3.5 + uTime * 0.65 * speed, r * 14.0 - uTime * 0.35));
    float flowNoise2 = vnoise(vec2(angle * 7.0 - uTime * 0.9 * speed, r * 22.0));
    float streaks = 0.55 + 0.45 * mix(flowNoise, flowNoise2, 0.45);

    // 3. Outer subtle bent-starlight gravitational distortion halo
    float einsteinAura = exp(-pow((r - 0.48) / 0.24, 2.0)) * 0.24;
    float outerFade = smoothstep(1.0, 0.68, r);
    float innerCut = smoothstep(0.295, 0.325, r);

    vec3 outerDeepViolet = vec3(0.30, 0.12, 0.68);
    vec3 midElectricViolet = vec3(0.64, 0.34, 0.98);
    vec3 hotCyan = vec3(0.46, 0.88, 1.0);
    vec3 incandescent = vec3(0.95, 0.97, 1.0);

    vec3 archCol = mix(outerDeepViolet, midElectricViolet, streaks);
    archCol = mix(archCol, hotCyan, clamp(doppler * 0.55 - (r - 0.34) * 1.6, 0.0, 1.0));

    vec3 col =
      archCol * lensedArch * streaks * doppler * 1.35 +
      mix(hotCyan, incandescent, 0.65) * photonRing * doppler +
      mix(outerDeepViolet, hotCyan, 0.35) * einsteinAura * (0.8 + streaks * 0.4);

    float boost = 1.0 + uHover * 0.55 + uExit * 1.45;
    col *= boost * innerCut * outerFade * mix(1.0, 0.18, uDim);

    float lum = max(col.r, max(col.g, col.b));
    float alpha = clamp(lum * 0.95, 0.0, 0.96) * uOpacity * mix(1.0, 0.22, uDim);
    if (alpha < 0.006) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const ACCRETION_DISK_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ACCRETION_DISK_FRAGMENT = `
  uniform float uTime;
  uniform float uHover;
  uniform float uExit;
  uniform float uDim;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r < 0.27 || r > 1.0) discard;

    float angle = atan(p.y, p.x);
    float speed = 1.0 + uHover * 0.8 + uExit * 3.8;

    // Differential Keplerian angular velocity (inner orbits spin faster than outer dust)
    float omega = (1.35 / pow(r, 0.85)) * uTime * 0.42 * speed;
    float theta = angle + omega;

    // Multi-octave swirling relativistic plasma filaments
    float f1 = vnoise(vec2(cos(theta) * 2.5 + r * 6.0, sin(theta) * 2.5 + r * 6.0));
    float f2 = vnoise(vec2(angle * 4.0 - r * 14.0 + uTime * 0.9 * speed, r * 18.0));
    float spiral = sin(angle * 3.0 - r * 17.0 + uTime * 1.15 * speed) * 0.5 + 0.5;
    float filament = clamp(f1 * 0.42 + f2 * 0.34 + spiral * 0.24, 0.0, 1.0);

    // Relativistic Doppler beaming: approaching left side glows hotter & bluer
    float doppler = clamp(0.88 - p.x * 0.72, 0.32, 1.52);

    float innerEdge = smoothstep(0.27, 0.35, r);
    float outerFade = smoothstep(1.0, 0.46, r);
    float iscoRing = exp(-pow((r - 0.34) / 0.045, 2.0));

    vec3 outerCrimsonIndigo = vec3(0.24, 0.08, 0.52);
    vec3 midOrchid = vec3(0.62, 0.28, 0.95);
    vec3 innerCyan = vec3(0.36, 0.86, 1.0);
    vec3 whiteHot = vec3(0.96, 0.98, 1.0);

    vec3 col = mix(outerCrimsonIndigo, midOrchid, smoothstep(0.92, 0.44, r) * (0.52 + 0.48 * filament));
    col = mix(col, innerCyan, smoothstep(0.58, 0.33, r) * (0.55 + 0.45 * filament));
    col += whiteHot * iscoRing * (0.65 + uHover * 0.42 + uExit * 0.95);

    float density = (0.38 + filament * 0.62) * innerEdge * outerFade * doppler;
    density *= 1.0 + uHover * 0.55 + uExit * 1.35;
    col *= density * mix(1.0, 0.16, uDim);

    float alpha = clamp(density * 0.92, 0.0, 0.96) * uOpacity * mix(1.0, 0.2, uDim);
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface BlackHoleBundle {
  group: THREE.Group;
  hitSphere: THREE.Mesh;
  update: (opts: {
    elapsed: number;
    hover: number;
    exitProgress: number;
    dim: number;
    opacity: number;
    cameraQuaternion: THREE.Quaternion;
    reducedMotion: boolean;
  }) => void;
  dispose: () => void;
}

/**
 * Builds the astrophysically inspired distant 3D Black Hole:
 * - Pure pitch-black event horizon with Doppler-beamed photon ring
 * - Warped relativistic gravitational lensing halo (bent upper/lower far-side disk arches + Einstein ring)
 * - Dual-layer tilted swirling FBM accretion disk
 * - Layer-2 raycast hit proxy for Stage 5 exit
 */
export function createBlackHoleBundle(isSoftwareGl = false): BlackHoleBundle {
  const group = new THREE.Group();

  // 1. Pitch-black Event Horizon Sphere
  const horizonGeo = new THREE.SphereGeometry(0.88, isSoftwareGl ? 22 : 40, isSoftwareGl ? 22 : 40);
  const horizonMat = new THREE.ShaderMaterial({
    vertexShader: BLACK_HOLE_HORIZON_VERTEX,
    fragmentShader: BLACK_HOLE_HORIZON_FRAGMENT,
    uniforms: {
      uHover: { value: 0 },
      uExit: { value: 0 },
      uDim: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: true,
  });
  const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
  horizonMesh.renderOrder = 3;
  group.add(horizonMesh);

  // 2. Relativistic Gravitational Lensing Halo (billboarded, renders bent far-side arches + Einstein ring)
  const lensGeo = new THREE.PlaneGeometry(5.6, 5.6);
  const lensMat = new THREE.ShaderMaterial({
    vertexShader: LENSED_HALO_VERTEX,
    fragmentShader: LENSED_HALO_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uExit: { value: 0 },
      uDim: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lensMesh = new THREE.Mesh(lensGeo, lensMat);
  lensMesh.renderOrder = 2;
  group.add(lensMesh);

  // 3. Primary Tilted Relativistic Accretion Disk
  const diskGeo = new THREE.PlaneGeometry(6.4, 6.4);
  const diskMat = new THREE.ShaderMaterial({
    vertexShader: ACCRETION_DISK_VERTEX,
    fragmentShader: ACCRETION_DISK_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uExit: { value: 0 },
      uDim: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const diskMesh = new THREE.Mesh(diskGeo, diskMat);
  diskMesh.rotation.set(1.26, -0.22, 0.24);
  diskMesh.renderOrder = 4;
  group.add(diskMesh);

  // 4. Secondary Subtle Dust Corona Layer slightly offset in pitch for volumetric disk thickness
  const outerDiskGeo = new THREE.PlaneGeometry(7.2, 7.2);
  const outerDiskMat = diskMat.clone();
  const outerDiskMesh = new THREE.Mesh(outerDiskGeo, outerDiskMat);
  outerDiskMesh.rotation.set(1.31, -0.2, 0.24);
  outerDiskMesh.renderOrder = 3;
  group.add(outerDiskMesh);

  // 5. Generous invisible Layer-2 raycast sphere
  const hitGeo = new THREE.SphereGeometry(2.15, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false,
  });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.layers.set(2);
  hitSphere.userData = { isBlackHole: true };
  group.add(hitSphere);

  return {
    group,
    hitSphere,
    update: ({ elapsed, hover, exitProgress, dim, opacity, cameraQuaternion, reducedMotion }) => {
      const m = reducedMotion ? 0.18 : 1.0;
      horizonMat.uniforms.uHover.value = hover;
      horizonMat.uniforms.uExit.value = exitProgress;
      horizonMat.uniforms.uDim.value = dim;
      horizonMat.uniforms.uOpacity.value = opacity;

      lensMat.uniforms.uTime.value = elapsed * m;
      lensMat.uniforms.uHover.value = hover;
      lensMat.uniforms.uExit.value = exitProgress;
      lensMat.uniforms.uDim.value = dim;
      lensMat.uniforms.uOpacity.value = opacity;
      lensMesh.quaternion.copy(cameraQuaternion);

      diskMat.uniforms.uTime.value = elapsed * m;
      diskMat.uniforms.uHover.value = hover;
      diskMat.uniforms.uExit.value = exitProgress;
      diskMat.uniforms.uDim.value = dim;
      diskMat.uniforms.uOpacity.value = opacity;

      outerDiskMat.uniforms.uTime.value = elapsed * m * 0.72 + 4.1;
      outerDiskMat.uniforms.uHover.value = hover;
      outerDiskMat.uniforms.uExit.value = exitProgress;
      outerDiskMat.uniforms.uDim.value = dim;
      outerDiskMat.uniforms.uOpacity.value = opacity * 0.42;

      const scale = 1.0 + hover * 0.06 + exitProgress * 0.65;
      group.scale.setScalar(scale);
      diskMesh.rotation.z = 0.24 + Math.sin(elapsed * 0.22 * m) * 0.03;
      outerDiskMesh.rotation.z = 0.24 - Math.sin(elapsed * 0.18 * m) * 0.03;
    },
    dispose: () => {
      horizonGeo.dispose();
      horizonMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      outerDiskGeo.dispose();
      outerDiskMat.dispose();
      hitGeo.dispose();
      hitMat.dispose();
    },
  };
}

/* ============================================================================
 * 5. PHOTOREALISTIC-INSPIRED DISTANT RINGED EXOPLANET (Section 10)
 * - Multi-octave FBM planetary atmosphere & cloud bands + surface micro-variation
 * - Crisp sunlit hemisphere, deep shadowed night hemisphere, natural twilight terminator
 * - Separate Fresnel atmospheric scattering limb shell
 * - Realistic tilted ring system with Cassini divisions & real analytical planet shadow
 * ========================================================================== */

const PLANET_VERTEX_SHADER = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const PLANET_FRAGMENT_SHADER = `
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uDim;
  uniform float uOpacity;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31(i);
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm3(vec3 p) {
    float sum = 0.0;
    float amp = 0.52;
    for (int i = 0; i < 4; i++) {
      sum += amp * noise3(p);
      p = p * 2.12 + vec3(3.1, 1.7, 2.4);
      amp *= 0.48;
    }
    return sum;
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    vec3 sp = normalize(vLocalPos);
    // Turbulent gas-giant / ice-giant zonal bands with cyclonic storm swirls
    float warp = fbm3(sp * 3.4 + vec3(uTime * 0.015, 0.0, 0.0));
    float bandCoord = sp.y * 6.5 + (warp - 0.5) * 2.6;
    float bands = 0.5 + 0.5 * sin(bandCoord * 2.2);
    float detail = fbm3(sp * 8.5 + vec3(warp * 2.0));
    float storm = smoothstep(0.64, 0.84, fbm3(sp * 5.2 + vec3(1.7, -0.9, 2.1)));

    // Sophisticated cold slate-indigo / dusty violet / pale ice-cloud astronomical palette
    vec3 deepSlate = vec3(0.09, 0.08, 0.22);
    vec3 midIndigo = vec3(0.24, 0.19, 0.46);
    vec3 mutedViolet = vec3(0.42, 0.31, 0.64);
    vec3 cloudIce = vec3(0.66, 0.78, 0.92);

    vec3 albedo = mix(deepSlate, midIndigo, smoothstep(0.18, 0.82, bands));
    albedo = mix(albedo, mutedViolet, detail * 0.58);
    albedo = mix(albedo, cloudIce, storm * 0.42);

    // High-contrast realistic day-night hemisphere & twilight terminator scattering
    float ndl = dot(N, L);
    float dayLight = smoothstep(-0.08, 0.78, ndl);
    float terminatorBand = exp(-pow((ndl + 0.02) / 0.18, 2.0));
    vec3 twilightTint = vec3(0.32, 0.46, 0.88) * terminatorBand * 0.22;

    // Restrained surface roughness specular highlight on icy upper cloud deck
    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), 26.0) * (0.08 + storm * 0.14) * smoothstep(0.0, 0.45, ndl);

    // Subtle atmospheric Rayleigh limb scatter strongest on sunlit rim
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 3.6);
    vec3 atmoLimb = vec3(0.38, 0.72, 0.98) * fresnel * (0.12 + smoothstep(-0.22, 0.65, ndl) * 0.78);

    // Preserve true deep shadow on the night hemisphere (only ~3.5% ambient galactic bounce)
    vec3 col = albedo * (0.035 + dayLight * 0.98) + twilightTint + vec3(0.75, 0.86, 1.0) * spec + atmoLimb;
    col *= mix(1.0, 0.18, uDim);

    gl_FragColor = vec4(col, uOpacity * mix(1.0, 0.22, uDim));
  }
`;

const PLANET_ATMO_FRAGMENT = `
  uniform vec3 uSunDir;
  uniform float uDim;
  uniform float uOpacity;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float limb = pow(1.0 - ndv, 4.2) * smoothstep(0.0, 0.28, 1.0 - ndv);
    float sunSide = smoothstep(-0.28, 0.62, dot(N, L));

    vec3 col = mix(vec3(0.36, 0.30, 0.78), vec3(0.42, 0.82, 1.0), sunSide);
    float alpha = limb * (0.08 + sunSide * 0.56) * uOpacity * mix(1.0, 0.2, uDim);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const PLANET_RING_VERTEX = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const PLANET_RING_FRAGMENT = `
  uniform vec3 uPlanetCenter;
  uniform float uPlanetRadius;
  uniform vec3 uSunDir;
  uniform float uDim;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r < 0.48 || r > 1.0) discard;

    // Fine concentric planetary ring structure with realistic Cassini gap
    float band1 = 0.5 + 0.5 * sin(r * 68.0);
    float band2 = 0.5 + 0.5 * sin(r * 145.0 + 1.4);
    float cassiniGap = 1.0 - 0.82 * exp(-pow((r - 0.77) / 0.024, 2.0));
    float innerGap = 1.0 - 0.55 * exp(-pow((r - 0.61) / 0.015, 2.0));
    float edgeSoft = smoothstep(0.48, 0.55, r) * smoothstep(1.0, 0.90, r);

    // Analytical ray-sphere shadow cast by the planet onto the back side of its rings!
    vec3 rel = vWorldPos - uPlanetCenter;
    vec3 L = normalize(uSunDir);
    float proj = dot(rel, L);
    float shadow = 1.0;
    if (proj < 0.0) {
      vec3 closest = rel - L * proj;
      float perpDist = length(closest);
      shadow = smoothstep(uPlanetRadius * 0.94, uPlanetRadius * 1.08, perpDist);
    }

    vec3 dustCol = mix(vec3(0.42, 0.36, 0.64), vec3(0.76, 0.82, 0.96), band1 * 0.65 + band2 * 0.35);
    float density = (0.34 + band1 * 0.42 + band2 * 0.24) * cassiniGap * innerGap * edgeSoft;
    vec3 col = dustCol * (0.06 + shadow * 0.94) * mix(1.0, 0.18, uDim);

    float alpha = clamp(density * 0.52 * uOpacity * mix(1.0, 0.22, uDim), 0.0, 0.72);
    if (alpha < 0.006) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface CosmicPlanetsBundle {
  group: THREE.Group;
  update: (elapsed: number, dim: number, opacity: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Builds a single heroic, photorealistic-inspired distant ringed exoplanet positioned
 * cleanly across the cosmos from the Black Hole to communicate authentic astronomical scale.
 */
export function createCosmicPlanetsGroup(
  planetPosition: [number, number, number],
  isSoftwareGl = false
): CosmicPlanetsBundle {
  const group = new THREE.Group();
  const planetGroup = new THREE.Group();
  planetGroup.position.set(planetPosition[0], planetPosition[1], planetPosition[2]);
  group.add(planetGroup);

  const radius = 2.45;
  const segs = isSoftwareGl ? 24 : 44;
  // Consistent directional cosmic sunlight coming from upper-right (toward the luminous cosmos center)
  const sunDir = new THREE.Vector3(0.74, 0.42, 0.52).normalize();

  const planetGeo = new THREE.SphereGeometry(radius, segs, segs);
  const planetMat = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_FRAGMENT_SHADER,
    uniforms: {
      uSunDir: { value: sunDir },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uOpacity: { value: 0.98 },
    },
    transparent: true,
    depthWrite: true,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.rotation.z = 0.28;
  planetMesh.renderOrder = 1;
  planetGroup.add(planetMesh);

  // Delicate outer atmospheric limb shell
  const atmoGeo = new THREE.SphereGeometry(radius * 1.065, segs, segs);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_ATMO_FRAGMENT,
    uniforms: {
      uSunDir: { value: sunDir },
      uDim: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  atmoMesh.renderOrder = 2;
  planetGroup.add(atmoMesh);

  // Realistic tilted planetary rings with Cassini divisions & real analytical planet shadow
  const ringGeo = new THREE.PlaneGeometry(radius * 5.2, radius * 5.2);
  const ringMat = new THREE.ShaderMaterial({
    vertexShader: PLANET_RING_VERTEX,
    fragmentShader: PLANET_RING_FRAGMENT,
    uniforms: {
      uPlanetCenter: { value: new THREE.Vector3(...planetPosition) },
      uPlanetRadius: { value: radius },
      uSunDir: { value: sunDir },
      uDim: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.set(1.24, 0.24, -0.32);
  ringMesh.renderOrder = 2;
  planetGroup.add(ringMesh);

  const worldCenterVec = new THREE.Vector3();

  return {
    group,
    update: (elapsed, dim, opacity, reducedMotion) => {
      const m = reducedMotion ? 0.12 : 1.0;
      planetGroup.getWorldPosition(worldCenterVec);

      planetMat.uniforms.uTime.value = elapsed * m;
      planetMat.uniforms.uDim.value = dim;
      planetMat.uniforms.uOpacity.value = 0.98 * opacity;
      planetMesh.rotation.y = elapsed * 0.022 * m;

      atmoMat.uniforms.uDim.value = dim;
      atmoMat.uniforms.uOpacity.value = opacity;

      ringMat.uniforms.uPlanetCenter.value.copy(worldCenterVec);
      ringMat.uniforms.uDim.value = dim;
      ringMat.uniforms.uOpacity.value = opacity;
    },
    dispose: () => {
      planetGeo.dispose();
      planetMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    },
  };
}

/* ============================================================================
 * 6. DEEP SPACE ENVIRONMENT: CIRCULAR STAR SHADER, DISTANT GALAXIES & FBM NEBULAE
 * ========================================================================== */

const STAR_POINT_VERTEX = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uPixelRatio;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = color;
    vTwinkle = 0.82 + 0.18 * sin(uTime * (0.9 + fract(aPhase) * 1.4) + aPhase * 6.2831);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float dist = max(1.0, -mvPos.z);
    gl_PointSize = clamp((aSize * uPixelRatio * 94.0) / dist, 2.1, 14.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const STAR_POINT_FRAGMENT = `
  uniform float uOpacity;
  uniform float uSoftness;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;

    // Crisp airy-disc pinpoint core for distant stars vs. softer bokeh for foreground dust
    float core = exp(-d * d * mix(5.8, 2.8, uSoftness));
    float halo = exp(-d * d * mix(2.2, 1.4, uSoftness)) * 0.46;
    float alpha = clamp((core + halo) * vTwinkle * uOpacity, 0.0, 1.0);
    if (alpha < 0.008) discard;

    vec3 col = mix(vColor, vec3(1.0), core * (0.58 - uSoftness * 0.35));
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createStarfieldMaterial(
  pixelRatio: number,
  baseOpacity = 0.85,
  softness = 0.0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: STAR_POINT_VERTEX,
    fragmentShader: STAR_POINT_FRAGMENT,
    uniforms: {
      uPixelRatio: { value: pixelRatio },
      uTime: { value: 0 },
      uOpacity: { value: baseOpacity },
      uSoftness: { value: softness },
    },
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// Distant procedural spiral galaxies embedded subtly in the deep universe background
const GALAXY_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GALAXY_FRAGMENT = `
  uniform vec3 uCoreColor;
  uniform vec3 uArmColor;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    float angle = atan(p.y, p.x);
    // Logarithmic two-arm spiral galaxy profile
    float spiralPhase = angle * 2.0 - log(r + 0.08) * 5.2 + uSeed;
    float arms = pow(0.5 + 0.5 * cos(spiralPhase), 2.8);
    float armDetail = 0.65 + 0.35 * sin(angle * 5.0 - r * 14.0 + uSeed * 2.0);

    float core = exp(-r * r * 18.0);
    float disk = exp(-r * 3.2) * (0.28 + 0.72 * arms * armDetail);
    float edgeFade = smoothstep(1.0, 0.58, r);

    vec3 col = mix(uArmColor, uCoreColor, clamp(core * 1.4, 0.0, 1.0));
    float alpha = clamp((core * 0.82 + disk * 0.55) * edgeFade * uOpacity, 0.0, 0.72);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface DistantGalaxiesBundle {
  group: THREE.Group;
  update: (dim: number, opacity: number) => void;
  dispose: () => void;
}

/**
 * Places 3 subtle, deeply distant inclined spiral galaxies across far space
 * to convey immense astronomical scale without looking decorative or noisy.
 */
export function createDistantGalaxiesGroup(): DistantGalaxiesBundle {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.ShaderMaterial[] = [];

  const configs = [
    {
      pos: [-26, 15.5, -62] as const,
      size: [14, 7.2] as const,
      rotZ: 0.42,
      core: '#e0f2fe',
      arm: '#7c3aed',
      seed: 1.1,
      baseOp: 0.34,
    },
    {
      pos: [24, -14.5, -70] as const,
      size: [11, 5.4] as const,
      rotZ: -0.58,
      core: '#f5d0fe',
      arm: '#4f46e5',
      seed: 3.8,
      baseOp: 0.28,
    },
    {
      pos: [4.5, 19.5, -78] as const,
      size: [9.5, 4.6] as const,
      rotZ: 0.18,
      core: '#bae6fd',
      arm: '#6366f1',
      seed: 6.2,
      baseOp: 0.24,
    },
  ];

  for (const cfg of configs) {
    const geo = new THREE.PlaneGeometry(cfg.size[0], cfg.size[1]);
    const mat = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERTEX,
      fragmentShader: GALAXY_FRAGMENT,
      uniforms: {
        uCoreColor: { value: new THREE.Color(cfg.core) },
        uArmColor: { value: new THREE.Color(cfg.arm) },
        uSeed: { value: cfg.seed },
        uOpacity: { value: cfg.baseOp },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    mesh.rotation.z = cfg.rotZ;
    mesh.renderOrder = 0;
    group.add(mesh);
    geometries.push(geo);
    materials.push(mat);
  }

  return {
    group,
    update: (dim, opacity) => {
      for (let i = 0; i < materials.length; i++) {
        materials[i].uniforms.uOpacity.value = configs[i].baseOp * opacity * (1 - dim * 0.65);
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

// Deep atmospheric FBM nebula shader (wispy cosmic structures with restrained contrast and dark voids)
const NEBULA_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 41.7);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p = p * 2.08 + vec2(2.7, 1.9);
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float dist = length(p) * 2.0;
    float radial = smoothstep(1.0, 0.12, dist);

    vec2 uvFlow = p * 3.4 + vec2(uSeed, uTime * 0.012);
    float q = fbm(uvFlow);
    float cloud = fbm(uvFlow + vec2(q * 1.4, -q * 1.1));
    // Carve natural dark cosmic rifts so nebula never looks like flat solid fog
    float wisps = smoothstep(0.32, 0.86, cloud);

    vec3 col = mix(uColorA, uColorB, smoothstep(0.25, 0.82, q));
    float alpha = radial * radial * wisps * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface NebulaBackdropBundle {
  group: THREE.Group;
  update: (elapsed: number, dim: number, opacity: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Builds 3 restrained multi-octave FBM deep-space nebula layers positioned far in deep space,
 * leaving generous dark negative space so stars, crystals, and celestial bodies command depth.
 */
export function createNebulaBackdropGroup(): NebulaBackdropBundle {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.ShaderMaterial[] = [];

  const layers = [
    { pos: [-16, 8.5, -54], size: [54, 34], colorA: '#1e0b48', colorB: '#5b21b6', seed: 1.4, baseOpacity: 0.2 },
    { pos: [18, -8.0, -58], size: [56, 36], colorA: '#08122e', colorB: '#0369a1', seed: 4.7, baseOpacity: 0.16 },
    { pos: [-2.0, 2.5, -66], size: [66, 40], colorA: '#180a36', colorB: '#86198f', seed: 8.2, baseOpacity: 0.12 },
  ];

  for (const layer of layers) {
    const geo = new THREE.PlaneGeometry(layer.size[0], layer.size[1]);
    const mat = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(layer.colorA) },
        uColorB: { value: new THREE.Color(layer.colorB) },
        uSeed: { value: layer.seed },
        uOpacity: { value: layer.baseOpacity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(layer.pos[0], layer.pos[1], layer.pos[2]);
    mesh.renderOrder = 0;
    group.add(mesh);
    geometries.push(geo);
    materials.push(mat);
  }

  return {
    group,
    update: (elapsed, dim, opacity, reducedMotion) => {
      const m = reducedMotion ? 0.15 : 1.0;
      for (let i = 0; i < materials.length; i++) {
        materials[i].uniforms.uTime.value = elapsed * m;
        materials[i].uniforms.uOpacity.value =
          layers[i].baseOpacity * opacity * (1 - dim * 0.68);
      }
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
