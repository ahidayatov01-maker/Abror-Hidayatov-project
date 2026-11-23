import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { WelcomeGiftModal } from './WelcomeGiftModal';
import { buildOvalBrilliantDiamondData } from '../../utils/brilliantDiamondGeometry';

/**
 * Generates an HDR-like 6-face procedural jewelry studio CubeTexture
 * with sharp studio softboxes, purple/magenta rim reflectors, and dark contrast panels.
 * Because this is an authentic THREE.CubeTexture, GLSL reflect() and refract() rays
 * produce razor-sharp facet-by-facet crystalline contrast on both hardware GPUs and software WebGL.
 */
function createStudioEnvironmentCubeTexture(): THREE.CubeTexture {
  const size = 256;
  const canvases: HTMLCanvasElement[] = [];

  const faceConfigs = [
    // +X: Right purple/pink studio softbox
    { bg0: '#070210', bg1: '#1c0736', spotColor: '#f472b6', spot2: '#ffffff', sx: 0.55, sy: 0.35 },
    // -X: Left amethyst key reflector
    { bg0: '#080314', bg1: '#230a44', spotColor: '#c084fc', spot2: '#f5d0fe', sx: 0.45, sy: 0.4 },
    // +Y: Top overhead high-intensity white/lavender jewelry softbox
    { bg0: '#17082e', bg1: '#3b0764', spotColor: '#ffffff', spot2: '#e879f9', sx: 0.5, sy: 0.5 },
    // -Y: Bottom deep violet velvet bounce pad
    { bg0: '#040109', bg1: '#120424', spotColor: '#9333ea', spot2: '#ec4899', sx: 0.5, sy: 0.5 },
    // +Z: Front studio key light + crisp diagonal light bars
    { bg0: '#090314', bg1: '#1e083a', spotColor: '#ffffff', spot2: '#f0abfc', sx: 0.38, sy: 0.32 },
    // -Z: Back deep purple/magenta rim light
    { bg0: '#05010c', bg1: '#2e0854', spotColor: '#e879f9', spot2: '#ffffff', sx: 0.62, sy: 0.38 },
  ];

  for (let f = 0; f < 6; f++) {
    const cfg = faceConfigs[f];
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base studio dark backdrop gradient
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, cfg.bg0);
      bgGrad.addColorStop(0.55, cfg.bg1);
      bgGrad.addColorStop(1, '#04010a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Primary softbox bloom
      const rad1 = ctx.createRadialGradient(
        size * cfg.sx,
        size * cfg.sy,
        2,
        size * cfg.sx,
        size * cfg.sy,
        size * 0.48
      );
      rad1.addColorStop(0, cfg.spot2);
      rad1.addColorStop(0.25, cfg.spotColor);
      rad1.addColorStop(0.65, 'rgba(147, 51, 234, 0.28)');
      rad1.addColorStop(1, 'rgba(5, 1, 12, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, size, size);

      // Sharp studio reflector strip bars (essential for distinct geometric facet flashes!)
      ctx.save();
      ctx.translate(size * 0.5, size * 0.5);
      ctx.rotate((f * 0.55) + 0.35);
      const stripGrad = ctx.createLinearGradient(-size * 0.45, -18, size * 0.45, 18);
      stripGrad.addColorStop(0, 'rgba(255,255,255,0)');
      stripGrad.addColorStop(0.35, 'rgba(245, 208, 254, 0.85)');
      stripGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.98)');
      stripGrad.addColorStop(0.65, 'rgba(232, 121, 249, 0.8)');
      stripGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = stripGrad;
      ctx.fillRect(-size * 0.42, -11, size * 0.84, 22);

      // Secondary crisp specular strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-size * 0.3, 34, size * 0.6, 8);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.75)';
      ctx.fillRect(-size * 0.35, -44, size * 0.7, 10);
      ctx.restore();
    }
    canvases.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(canvases);
  cubeTexture.colorSpace = THREE.SRGBColorSpace;
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}

export const FloatingPurpleDiamond3D: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store interactive state in ref so WebGL canvas never tears down or resets rotation on hover
  const interactionRef = useRef({
    hovered: false,
    pointerX: 0,
    pointerY: 0,
  });

  useEffect(() => {
    interactionRef.current.hovered = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.95, 5.25);
    camera.lookAt(0, -0.22, 0);

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

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);

    const envCube = createStudioEnvironmentCubeTexture();

    // Build authentic non-indexed Oval Brilliant-Cut Gemstone Geometry (122 distinct planar facets)
    const diamondData = buildOvalBrilliantDiamondData({
      sectors: 12,
      radiusX: 1.48,
      radiusZ: 1.24,
      crownHeight: 0.48,
      pavilionDepth: 1.32,
      girdleThickness: 0.048,
      tableRatio: 0.56,
    });

    const diamondGeo = new THREE.BufferGeometry();
    diamondGeo.setAttribute('position', new THREE.BufferAttribute(diamondData.positions, 3));
    diamondGeo.setAttribute('normal', new THREE.BufferAttribute(diamondData.normals, 3));
    diamondGeo.setAttribute('aFacetMeta', new THREE.BufferAttribute(diamondData.facetMeta, 4));
    diamondGeo.computeBoundingSphere();

    // Custom Optical Dispersion & Multi-Bounce Internal Reflection Shader
    const vertexShader = `
      attribute vec4 aFacetMeta;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec4 vFacetMeta;

      void main() {
        vFacetMeta = aFacetMeta;
        vLocalPos = position;
        vLocalNormal = normalize(normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform samplerCube uEnvMap;
      uniform float uTime;
      uniform float uHover;
      uniform float uIsBackFace;
      uniform vec2 uPointer;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec4 vFacetMeta;

      // Analytical multi-faceted internal geometry normal simulator for deep pavilion total internal reflection
      vec3 getInternalPavilionBounce(vec3 rayDir, vec3 localPos, float facetSeed) {
        float angle = atan(localPos.z, localPos.x);
        float sector = floor((angle + 3.14159265) / (6.2831853 / 12.0));
        float sectorAngle = (sector + 0.5) * (6.2831853 / 12.0);
        vec3 pavNormal = normalize(vec3(cos(sectorAngle) * 0.76, 0.65, sin(sectorAngle) * 0.76));
        vec3 bounced = reflect(rayDir, pavNormal);
        // Second opposite pavilion facet bounce (Total Internal Reflection inside diamond)
        float oppAngle = sectorAngle + 3.14159265 + (facetSeed - 0.5) * 0.52;
        vec3 pavNormal2 = normalize(vec3(cos(oppAngle) * 0.78, 0.62, sin(oppAngle) * 0.78));
        return reflect(bounced, pavNormal2);
      }

      void main() {
        vec3 N = normalize(vWorldNormal) * (1.0 - 2.0 * uIsBackFace);
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 I = -V;

        float facetType = vFacetMeta.x;
        float facetId = vFacetMeta.y;
        float radial = vFacetMeta.z;
        float rimWeight = vFacetMeta.w;

        // Per-facet crisp orientation signature so adjacent facets ALWAYS have distinct tonal contrast
        vec3 keyLight1 = normalize(vec3(0.55 + uPointer.x * 0.25, 0.78 + uPointer.y * 0.2, 0.65));
        vec3 keyLight2 = normalize(vec3(-0.68, 0.42, 0.58));
        vec3 rimLightDir = normalize(vec3(0.0, -0.75, -0.65));
        vec3 topLightDir = normalize(vec3(0.1, 0.96, 0.25));

        // Fresnel reflection (Schlick approximation with diamond IOR = 2.42 -> F0 = 0.172)
        float cosTheta = clamp(dot(N, V), 0.0, 1.0);
        float F0 = 0.18;
        float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, 3.4);

        // Chromatic dispersion IORs (Red, Green, Blue channels split through crystal)
        float etaR = 1.0 / 2.38;
        float etaG = 1.0 / 2.42;
        float etaB = 1.0 / 2.47;

        vec3 refractR = refract(I, N, etaR);
        vec3 refractG = refract(I, N, etaG);
        vec3 refractB = refract(I, N, etaB);

        // Internal Total Internal Reflection (TIR) bounce off pavilion facets
        vec3 tirR = getInternalPavilionBounce(refractR, vLocalPos, facetId);
        vec3 tirG = getInternalPavilionBounce(refractG, vLocalPos, facetId + 0.13);
        vec3 tirB = getInternalPavilionBounce(refractB, vLocalPos, facetId + 0.27);

        // Sample studio environment along refracted & internally reflected rays
        vec3 envRefrR = textureCube(uEnvMap, refractR).rgb;
        vec3 envRefrG = textureCube(uEnvMap, refractG).rgb;
        vec3 envRefrB = textureCube(uEnvMap, refractB).rgb;
        vec3 directRefraction = vec3(envRefrR.r, envRefrG.g, envRefrB.b);

        vec3 envTirR = textureCube(uEnvMap, tirR).rgb;
        vec3 envTirG = textureCube(uEnvMap, tirG).rgb;
        vec3 envTirB = textureCube(uEnvMap, tirB).rgb;
        vec3 internalFire = vec3(envTirR.r, envTirG.g, envTirB.b);

        // Combine direct refraction with multi-bounce internal fire
        vec3 refractedLight = mix(directRefraction, internalFire, 0.68);

        // Luxury Amethyst / Purple Diamond Beer-Lambert optical absorption & transmission palette
        vec3 deepObsidianViolet = vec3(0.11, 0.02, 0.26);
        vec3 deepAmethyst = vec3(0.28, 0.05, 0.56);
        vec3 royalViolet = vec3(0.54, 0.15, 0.88);
        vec3 orchidPink = vec3(0.92, 0.34, 0.80);
        vec3 lavenderIce = vec3(0.92, 0.80, 1.0);

        // Optical path depth varies by facet type & angle
        float pathLength = clamp(0.42 + 0.58 * (1.0 - cosTheta) + (vLocalPos.y < 0.0 ? 0.28 : 0.0), 0.2, 1.45);
        vec3 absorptionTint = mix(lavenderIce, royalViolet, clamp(pathLength * 0.88, 0.0, 1.0));
        absorptionTint = mix(absorptionTint, deepAmethyst, clamp((pathLength - 0.45) * 0.95, 0.0, 0.82));

        // Facet-specific angular color shift (simulates birefringence / pleochroism in purple diamond)
        float facetAngleHash = fract(sin(facetId * 91.7 + facetType * 17.3) * 43758.5453);
        vec3 pleochroicTint = mix(deepObsidianViolet, orchidPink, facetAngleHash * 0.78);

        vec3 crystalInterior = refractedLight * mix(absorptionTint, pleochroicTint, 0.44) * 1.48;

        // Sharp planar facet diffuse/transmitted Differentiation so every single facet plane is distinct
        float facetDiff1 = max(0.0, dot(N, keyLight1));
        float facetDiff2 = max(0.0, dot(N, keyLight2));
        float facetRim = max(0.0, dot(N, rimLightDir));
        float facetTop = max(0.0, dot(N, topLightDir));

        // High-contrast discrete per-facet luminance step based on exact flat normal orientation
        vec3 facetShading =
          deepObsidianViolet * 0.35 +
          royalViolet * (0.62 * pow(facetDiff1, 1.35)) +
          orchidPink * (0.42 * pow(facetDiff2, 1.25)) +
          lavenderIce * (0.35 * pow(facetTop, 2.2)) +
          vec3(0.75, 0.25, 0.96) * (0.36 * facetRim);

        // External mirror reflection off polished diamond facet
        vec3 R = reflect(I, N);
        vec3 envReflection = textureCube(uEnvMap, R).rgb;

        // Razor-sharp specular highlights on individual flat facets
        vec3 H1 = normalize(keyLight1 + V);
        vec3 H2 = normalize(keyLight2 + V);
        vec3 H3 = normalize(topLightDir + V);

        float spec1 = pow(max(0.0, dot(N, H1)), 110.0) * 2.5;
        float spec2 = pow(max(0.0, dot(N, H2)), 72.0) * 1.4;
        float spec3 = pow(max(0.0, dot(N, H3)), 130.0) * 1.9;

        // Dynamic crystalline flash when a facet rotates through the studio key angle
        float flashAngle = max(0.0, dot(reflect(-keyLight1, N), V));
        float facetFlash = pow(flashAngle, 150.0) * (3.4 + uHover * 1.5);

        // Interactive light sweep across facets on hover
        float sweepWave = sin(vLocalPos.x * 2.4 - vLocalPos.y * 1.8 + uTime * 2.2) * 0.5 + 0.5;
        float hoverBoost = 1.0 + uHover * (0.24 + 0.22 * pow(sweepWave, 3.0));

        // Compose final crystal color
        vec3 baseCrystal = mix(crystalInterior + facetShading * 0.58, envReflection * lavenderIce, fresnel * 0.72);

        // Add chromatic fire flashes inside pavilion and crown bezels
        vec3 fireHighlight = vec3(
          pow(max(0.0, envTirR.r), 2.3) * 1.15,
          pow(max(0.0, envTirG.g), 2.5) * 0.5,
          pow(max(0.0, envTirB.b), 2.1) * 1.35
        );

        vec3 finalColor = (baseCrystal + fireHighlight * 0.48) * hoverBoost;

        // Add crisp white & pale-pink diamond specular reflections
        finalColor += vec3(1.0, 0.97, 1.0) * (spec1 + spec3 + facetFlash);
        finalColor += vec3(0.98, 0.68, 0.94) * spec2;

        // Subtle rim glow at outer girdle and crown edges
        finalColor += vec3(0.85, 0.42, 0.98) * pow(1.0 - cosTheta, 3.4) * 0.42;

        // Transparent crystalline alpha: back faces provide deep refractive base, front faces transmit & reflect
        float alpha = uIsBackFace > 0.5
          ? 0.90
          : clamp(0.62 + fresnel * 0.32 + clamp(spec1 + spec2 + facetFlash, 0.0, 0.35), 0.62, 0.98);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // Two-pass back-face + front-face rendering guarantees true volumetric see-through transparency
    // where rear pavilion facets are visibly refracted through the clear crown and table
    const backFaceMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uEnvMap: { value: envCube },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uIsBackFace: { value: 1.0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const frontFaceMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uEnvMap: { value: envCube },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uIsBackFace: { value: 0.0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
    });

    const diamondGroup = new THREE.Group();
    // Slight initial studio presentation tilt so the central table, crown bezels, girdle, and deep pointed pavilion are all visible
    diamondGroup.rotation.x = 0.14;
    scene.add(diamondGroup);

    const backMesh = new THREE.Mesh(diamondGeo, backFaceMat);
    backMesh.renderOrder = 1;
    diamondGroup.add(backMesh);

    const frontMesh = new THREE.Mesh(diamondGeo, frontFaceMat);
    frontMesh.renderOrder = 2;
    diamondGroup.add(frontMesh);

    // Crisp optical facet ridge highlights (subtle specular edge lines along physical facet junctions)
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(diamondData.edgePositions, 3));

    const edgeBackMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#a855f7'),
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edgeBackLines = new THREE.LineSegments(edgeGeo, edgeBackMat);
    edgeBackLines.renderOrder = 1;
    diamondGroup.add(edgeBackLines);

    const edgeFrontMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#f5d0fe'),
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edgeFrontLines = new THREE.LineSegments(edgeGeo, edgeFrontMat);
    edgeFrontLines.renderOrder = 3;
    diamondGroup.add(edgeFrontLines);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Smooth 60 FPS Animation Loop with Software-WebGL Pacing Support
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;
    let rotationAngle = 0.35;
    let currentHover = 0;
    let smoothPtrX = 0;
    let smoothPtrY = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
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
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Pause updates when tab is hidden
      if (!document.hidden) {
        elapsedTime += dt;

        const targetHover = interactionRef.current.hovered ? 1.0 : 0.0;
        currentHover = THREE.MathUtils.damp(currentHover, targetHover, 6.0, dt);
        smoothPtrX = THREE.MathUtils.damp(
          smoothPtrX,
          interactionRef.current.pointerX,
          6.0,
          dt
        );
        smoothPtrY = THREE.MathUtils.damp(
          smoothPtrY,
          interactionRef.current.pointerY,
          6.0,
          dt
        );

        // Full 360 rotation in ~20 seconds (2*PI / 20 = 0.314 rad/s)
        const baseAngularSpeed = prefersReducedMotion ? 0.05 : 0.314;
        const speedMultiplier = 1.0 - currentHover * 0.45;
        rotationAngle += dt * baseAngularSpeed * speedMultiplier;

        diamondGroup.rotation.y = rotationAngle + smoothPtrX * 0.22;
        diamondGroup.rotation.x =
          0.14 + Math.sin(elapsedTime * 0.65) * 0.045 - smoothPtrY * 0.14;
        diamondGroup.rotation.z =
          Math.cos(elapsedTime * 0.5) * 0.035 + smoothPtrX * 0.06;
        diamondGroup.position.y =
          Math.sin(elapsedTime * 1.15) * 0.06 + 0.12;

        backFaceMat.uniforms.uTime.value = elapsedTime;
        backFaceMat.uniforms.uHover.value = currentHover;
        backFaceMat.uniforms.uPointer.value.set(smoothPtrX, smoothPtrY);

        frontFaceMat.uniforms.uTime.value = elapsedTime;
        frontFaceMat.uniforms.uHover.value = currentHover;
        frontFaceMat.uniforms.uPointer.value.set(smoothPtrX, smoothPtrY);

        edgeFrontMat.opacity = 0.24 + currentHover * 0.18;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      diamondGeo.dispose();
      edgeGeo.dispose();
      backFaceMat.dispose();
      frontFaceMat.dispose();
      edgeBackMat.dispose();
      edgeFrontMat.dispose();
      envCube.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    interactionRef.current.pointerX = Math.max(-1, Math.min(1, nx));
    interactionRef.current.pointerY = Math.max(-1, Math.min(1, ny));
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 420);
    setModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <div className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center overflow-visible select-none">
        {/* Studio Optical Light Rays & Controlled Crystalline Atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Deep purple studio ambient backlight */}
          <div
            className="w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl transition-opacity duration-500"
            style={{
              opacity: isHovered ? 0.92 : 0.72,
              background:
                'radial-gradient(circle, rgba(168,85,247,0.42) 0%, rgba(217,70,239,0.22) 42%, rgba(88,28,135,0.08) 68%, transparent 80%)',
            }}
          />

          {/* Delicate optical light rays emerging from facets (matching reference image) */}
          <div
            className="absolute w-80 h-80 sm:w-96 sm:h-96 transition-transform duration-700"
            style={{
              opacity: isHovered ? 0.75 : 0.48,
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              background:
                'conic-gradient(from 18deg at 50% 48%, transparent 0deg, rgba(232,121,249,0.18) 14deg, transparent 32deg, transparent 74deg, rgba(192,132,252,0.22) 92deg, transparent 112deg, transparent 156deg, rgba(244,114,182,0.16) 176deg, transparent 198deg, transparent 245deg, rgba(216,180,254,0.2) 264deg, transparent 286deg, transparent 325deg, rgba(232,121,249,0.15) 342deg, transparent 360deg)',
              filter: 'blur(12px)',
              maskImage: 'radial-gradient(circle, black 25%, transparent 72%)',
              WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 72%)',
            }}
          />

          {/* Soft grounded studio shadow beneath the floating gemstone */}
          <div
            className="absolute bottom-3 w-36 sm:w-44 h-5 rounded-full blur-xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(15, 3, 28, 0.78) 0%, rgba(88, 28, 135, 0.25) 55%, transparent 80%)',
            }}
          />
        </div>

        {/* Pure 3D Oval Brilliant-Cut Purple Diamond Interactive Container */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Open Premium Membership & Welcome Gift"
          title="Open Premium Membership & Welcome Gift"
          animate={{
            scale: isClicked ? [1, 1.06, 1] : isHovered ? 1.035 : 1,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 rounded-full"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            interactionRef.current.pointerX = 0;
            interactionRef.current.pointerY = 0;
          }}
        >
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
          />
        </motion.div>
      </div>

      {/* Premium Subscription Welcome Modal */}
      <WelcomeGiftModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
