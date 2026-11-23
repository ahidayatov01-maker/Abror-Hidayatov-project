import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { RotateCcw, Sparkles } from 'lucide-react';
import type { CosmicStage } from './cosmicTypes';
import {
  FRACTURE_PHASE_A_END_RATIO,
  FRACTURE_PHASE_B_END_RATIO,
  FRACTURE_REDUCED_DURATION_MS,
  FRACTURE_TOTAL_DURATION_MS,
  REASSEMBLY_PHASE_B_END_RATIO,
  REASSEMBLY_REDUCED_DURATION_MS,
  REASSEMBLY_TOTAL_DURATION_MS,
  resolveCosmicLogicalPhase,
  SUPERNOVA_REDUCED_DURATION_MS,
  SUPERNOVA_TOTAL_DURATION_MS,
} from './cosmicTypes';
import {
  buildDiamondCrackNetworkData,
  buildIntactDiamondGeometryData,
  buildUniqueCrystalShardsData,
  computeReassemblyTrajectoryPosition,
  computeStage1OrbitalPosition,
} from './CrystalGeometry';
import {
  createEnergyCoreBundle,
  createFractureCrackNetworkMaterial,
  createOpticalCrystalMaterials,
  createStarfieldMaterial,
  createStudioEnvironmentCubeTexture,
  detectWebGLCapabilities,
  type CrystalMaterialSet,
} from './CrystalMaterial';
import { COSMIC_SECTIONS } from './cosmicSections';
import { useApp } from '../../context/AppContext';
import { getDiamondMicroCopy } from '../../utils/displayCopy';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (ev: ErrorEvent) => {
      if (
        typeof ev.message === 'string' &&
        (ev.message.includes('ResizeObserver loop completed with undelivered notifications') ||
          ev.message.includes('ResizeObserver loop limit exceeded'))
      ) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
    },
    true
  );
}

interface CrystalFractureSceneProps {
  stage: CosmicStage;
  reducedMotion: boolean;
  onFracture: () => void;
  onEnterUniverse: () => void;
  onReassembleFromStage1: () => void;
}

export const CrystalFractureScene: React.FC<CrystalFractureSceneProps> = ({
  stage,
  reducedMotion,
  onFracture,
  onEnterUniverse,
  onReassembleFromStage1,
}) => {
  const { language } = useApp();
  const copy = getDiamondMicroCopy(language);
  const slotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDiamondHovered, setIsDiamondHovered] = useState(false);
  const [isCoreHovered, setIsCoreHovered] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);
  const [webglFallback, setWebglFallback] = useState(false);
  const lastTapRef = useRef<number>(0);
  const hintTimerRef = useRef<number | undefined>(undefined);
  const wakeLoopRef = useRef<(() => void) | null>(null);

  // Live refs consumed by the WebGL loop without recreating the Three.js scene
  const stateRef = useRef({
    stage,
    reducedMotion,
    diamondHovered: false,
    coreHovered: false,
    pointerX: 0,
    pointerY: 0,
    fractureStartMs: 0,
    orbitalStartMs: 0,
    enterStartMs: 0,
    heroReassembleStartMs: 0,
    clickPulseStartMs: 0,
    prevStage: stage,
  });

  useEffect(() => {
    const prev = stateRef.current.stage;
    stateRef.current.stage = stage;
    stateRef.current.reducedMotion = reducedMotion;
    const now = performance.now();
    if (stage === 'fracturing' && prev !== 'fracturing') {
      stateRef.current.fractureStartMs = now;
      setShowClickHint(false);
    }
    if (stage === 'orbital' && prev !== 'orbital') {
      stateRef.current.orbitalStartMs = now;
    }
    if (stage === 'entering-universe' && prev !== 'entering-universe') {
      stateRef.current.enterStartMs = now;
    }
    if (stage === 'reassembling-hero' && prev !== 'reassembling-hero') {
      stateRef.current.heroReassembleStartMs = now;
      setIsCoreHovered(false);
    }
    if (stage === 'idle') {
      stateRef.current.fractureStartMs = 0;
      stateRef.current.orbitalStartMs = 0;
      stateRef.current.enterStartMs = 0;
      stateRef.current.heroReassembleStartMs = 0;
      setIsCoreHovered(false);
    }
    stateRef.current.prevStage = stage;
    if (slotRef.current) {
      slotRef.current.setAttribute(
        'data-cosmic-logical-phase',
        resolveCosmicLogicalPhase(stage, 0)
      );
    }
    if (stage !== prev) {
      wakeLoopRef.current?.();
    }
  }, [stage, reducedMotion]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== undefined) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current.diamondHovered = isDiamondHovered;
  }, [isDiamondHovered]);

  useEffect(() => {
    stateRef.current.coreHovered = isCoreHovered;
  }, [isCoreHovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const caps = detectWebGLCapabilities();
    if (!caps.supported) {
      setWebglFallback(true);
      return;
    }

    const isSoftwareGl = caps.isSoftware;
    const width = container.clientWidth || 440;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    // Generous FOV & distance calibrated so all 12 orbiting fragments stay 100% inside the canvas with zero rectangular clipping
    const BASE_FOV = 38;
    const BASE_CAM_Z = 6.25;
    const camera = new THREE.PerspectiveCamera(BASE_FOV, width / height, 0.1, 100);
    camera.position.set(0, 0.72, BASE_CAM_Z);
    camera.lookAt(0, -0.1, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFallback(true);
      return;
    }

    const pixelRatio = isSoftwareGl ? 0.85 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const envCube = createStudioEnvironmentCubeTexture(isSoftwareGl ? 128 : 256);

    // 1. Intact Solid Oval Brilliant-Cut Purple Diamond (zero visible cut lines at idle)
    const diamondData = buildIntactDiamondGeometryData();
    const diamondGeo = new THREE.BufferGeometry();
    diamondGeo.setAttribute('position', new THREE.BufferAttribute(diamondData.positions, 3));
    diamondGeo.setAttribute('normal', new THREE.BufferAttribute(diamondData.normals, 3));
    diamondGeo.setAttribute('aFacetMeta', new THREE.BufferAttribute(diamondData.facetMeta, 4));
    diamondGeo.computeBoundingSphere();

    const diamondEdgeGeo = new THREE.BufferGeometry();
    diamondEdgeGeo.setAttribute('position', new THREE.BufferAttribute(diamondData.edgePositions, 3));

    const intactMatSet = createOpticalCrystalMaterials(envCube, '#c084fc', isSoftwareGl);
    const diamondGroup = new THREE.Group();
    diamondGroup.rotation.x = 0.14;
    scene.add(diamondGroup);

    const dBackMesh = new THREE.Mesh(diamondGeo, intactMatSet.backMat);
    dBackMesh.renderOrder = 6;
    dBackMesh.visible = !isSoftwareGl;
    diamondGroup.add(dBackMesh);

    const dFrontMesh = new THREE.Mesh(diamondGeo, intactMatSet.frontMat);
    dFrontMesh.renderOrder = 7;
    diamondGroup.add(dFrontMesh);

    const dEdgeFront = new THREE.LineSegments(diamondEdgeGeo, intactMatSet.edgeFrontMat);
    dEdgeFront.scale.setScalar(1.002);
    dEdgeFront.renderOrder = 8;
    diamondGroup.add(dEdgeFront);

    // 1B. Progressive 3D Branching Fracture Vein Network (mounted inside diamondGroup so cracks track exact crystal rotation)
    const crackData = buildDiamondCrackNetworkData();
    const crackGeo = new THREE.BufferGeometry();
    crackGeo.setAttribute('position', new THREE.BufferAttribute(crackData.positions, 3));
    crackGeo.setAttribute('aPropagationOrder', new THREE.BufferAttribute(crackData.propagationOrder, 1));
    crackGeo.setAttribute('aCrackIntensity', new THREE.BufferAttribute(crackData.intensity, 1));
    const crackMat = createFractureCrackNetworkMaterial();
    const crackLines = new THREE.LineSegments(crackGeo, crackMat);
    crackLines.scale.setScalar(1.008);
    crackLines.renderOrder = 9;
    crackLines.visible = false;
    diamondGroup.add(crackLines);

    // Subtle outer aura pass along the same 3D fracture network so glowing fissures slice visibly through dark purple crystal
    const crackAuraLines = new THREE.LineSegments(crackGeo, crackMat);
    crackAuraLines.scale.setScalar(1.022);
    crackAuraLines.renderOrder = 9;
    crackAuraLines.visible = false;
    diamondGroup.add(crackAuraLines);

    // 1C. Luminous Micro-Sparks & Supernova Plasma Particles (reused for Phase B fracture micro-dust + Supernova energy accumulation/shockwave)
    const sparkCount = isSoftwareGl ? 36 : 72;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkColors = new Float32Array(sparkCount * 3);
    const sparkSizes = new Float32Array(sparkCount);
    const sparkPhases = new Float32Array(sparkCount);
    const sparkOrigins: THREE.Vector3[] = [];
    const sparkDirs: THREE.Vector3[] = [];

    const sparkPalette = [
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#e879f9'),
    ];
    for (let i = 0; i < sparkCount; i++) {
      const originTuple = crackData.sparkOrigins[i % crackData.sparkOrigins.length];
      const oVec = new THREE.Vector3(originTuple[0], originTuple[1], originTuple[2]);
      sparkOrigins.push(oVec);
      const dir = oVec.clone().normalize();
      if (dir.lengthSq() < 0.01) dir.set(Math.cos(i), Math.sin(i * 1.3), Math.sin(i * 0.7)).normalize();
      dir.x += Math.sin(i * 17.3) * 0.35;
      dir.y += Math.cos(i * 11.7) * 0.35;
      dir.z += Math.sin(i * 23.1) * 0.35;
      dir.normalize();
      sparkDirs.push(dir);

      const c = sparkPalette[i % sparkPalette.length];
      sparkColors[i * 3] = c.r;
      sparkColors[i * 3 + 1] = c.g;
      sparkColors[i * 3 + 2] = c.b;
      sparkSizes[i] = 1.5 + (i % 5) * 0.42;
      sparkPhases[i] = (i * 0.137) % 1;
    }

    const sparkGeo = new THREE.BufferGeometry();
    const sparkPosAttr = new THREE.BufferAttribute(sparkPositions, 3);
    sparkPosAttr.setUsage(THREE.DynamicDrawUsage);
    sparkGeo.setAttribute('position', sparkPosAttr);
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));
    sparkGeo.setAttribute('aSize', new THREE.BufferAttribute(sparkSizes, 1));
    sparkGeo.setAttribute('aPhase', new THREE.BufferAttribute(sparkPhases, 1));
    const sparkMat = createStarfieldMaterial(pixelRatio, 0, 0.25);
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    sparkPoints.renderOrder = 6;
    sparkPoints.visible = false;
    scene.add(sparkPoints);

    // 1D. Decorative Non-Interactive Secondary 3D Crystalline Micro-Splinters (Phase B separation -> Phase C gentle fade)
    const microSplinterCount = isSoftwareGl ? 12 : 18;
    const microSplinterGeo = new THREE.OctahedronGeometry(0.036, 0);
    const microSplinterMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#d8b4fe'),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const microSplintersRoot = new THREE.Group();
    microSplintersRoot.visible = false;
    scene.add(microSplintersRoot);

    interface MicroSplinterRuntime {
      mesh: THREE.Mesh;
      origin: THREE.Vector3;
      dir: THREE.Vector3;
      spin: [number, number, number];
      scaleTuple: [number, number, number];
      stagger: number;
    }
    const microSplinters: MicroSplinterRuntime[] = [];
    for (let i = 0; i < microSplinterCount; i++) {
      const mesh = new THREE.Mesh(microSplinterGeo, microSplinterMat);
      mesh.renderOrder = 5;
      const originTuple = crackData.sparkOrigins[(i * 3) % crackData.sparkOrigins.length];
      const origin = new THREE.Vector3(originTuple[0], originTuple[1], originTuple[2]);
      const dir = origin.clone().normalize();
      if (dir.lengthSq() < 0.01) dir.set(Math.cos(i * 1.9), Math.sin(i * 1.1), Math.cos(i * 0.7)).normalize();
      dir.x += Math.sin(i * 9.7) * 0.28;
      dir.y += Math.cos(i * 13.1) * 0.24;
      dir.z += Math.sin(i * 7.3) * 0.28;
      dir.normalize();
      const scaleTuple: [number, number, number] = [
        0.55 + (i % 3) * 0.28,
        1.15 + (i % 4) * 0.35,
        0.48 + ((i + 1) % 3) * 0.22,
      ];
      mesh.scale.set(scaleTuple[0], scaleTuple[1], scaleTuple[2]);
      microSplintersRoot.add(mesh);
      microSplinters.push({
        mesh,
        origin,
        dir,
        spin: [
          (i % 2 === 0 ? 1 : -1) * (0.45 + (i % 4) * 0.18),
          (i % 3 === 0 ? -1 : 1) * (0.52 + (i % 5) * 0.16),
          0.35 + (i % 3) * 0.15,
        ],
        scaleTuple,
        stagger: (i % 6) * 0.035,
      });
    }

    // 1E. Subtle Luminous Orbital Energy Strands (Phase C & Orbital Stage — thin filaments connecting orbiting shards & core)
    const orbitalStrandCount = 12;
    const orbitalStrandPositions = new Float32Array(orbitalStrandCount * 4 * 3); // 2 line segments per shard (shard->core, shard->nextShard)
    const orbitalStrandsGeo = new THREE.BufferGeometry();
    const orbitalStrandsPosAttr = new THREE.BufferAttribute(orbitalStrandPositions, 3);
    orbitalStrandsPosAttr.setUsage(THREE.DynamicDrawUsage);
    orbitalStrandsGeo.setAttribute('position', orbitalStrandsPosAttr);
    const orbitalStrandsMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#7dd3fc'),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const orbitalStrandsLines = new THREE.LineSegments(orbitalStrandsGeo, orbitalStrandsMat);
    orbitalStrandsLines.renderOrder = 2;
    orbitalStrandsLines.visible = false;
    scene.add(orbitalStrandsLines);

    // 1F. Luminous Magnetic Connection Threads (Stage 3 Reassembly Phase A & B — curved 3-segment thread per shard to homeOffset)
    const magneticSegmentsPerShard = 3;
    const magneticThreadPositions = new Float32Array(12 * magneticSegmentsPerShard * 2 * 3);
    const magneticThreadsGeo = new THREE.BufferGeometry();
    const magneticThreadsPosAttr = new THREE.BufferAttribute(magneticThreadPositions, 3);
    magneticThreadsPosAttr.setUsage(THREE.DynamicDrawUsage);
    magneticThreadsGeo.setAttribute('position', magneticThreadsPosAttr);
    const magneticThreadsMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const magneticThreadsLines = new THREE.LineSegments(magneticThreadsGeo, magneticThreadsMat);
    magneticThreadsLines.renderOrder = 4;
    magneticThreadsLines.visible = false;
    scene.add(magneticThreadsLines);

    // 2. Central 3D Plasma YADRO (Dashboard Core) revealed on physical separation
    const energyCore = createEnergyCoreBundle(0.42, isSoftwareGl, 'dashboard');
    energyCore.group.visible = false;
    scene.add(energyCore.group);

    // 3. The 12 Solid Volumetric Diamond-Sector Fragments (hidden during Phase A incipient fracturing)
    const shardsData = buildUniqueCrystalShardsData();
    const shardsRoot = new THREE.Group();
    shardsRoot.visible = false;
    scene.add(shardsRoot);

    interface Stage1ShardRuntime {
      group: THREE.Group;
      geo: THREE.BufferGeometry;
      edgeGeo: THREE.BufferGeometry;
      mats: CrystalMaterialSet;
      data: (typeof shardsData)[number];
      currentPos: THREE.Vector3;
      currentRot: THREE.Euler;
      reassembleOrigin: [number, number, number];
    }

    const shardRuntimes: Stage1ShardRuntime[] = shardsData.map((data, idx) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
      geo.setAttribute('aFacetMeta', new THREE.BufferAttribute(data.facetMeta, 4));
      geo.computeBoundingSphere();

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.BufferAttribute(data.edgePositions, 3));

      const section = COSMIC_SECTIONS[idx];
      const mats = createOpticalCrystalMaterials(
        envCube,
        section?.accentHex || '#c084fc',
        isSoftwareGl
      );

      const group = new THREE.Group();
      const back = new THREE.Mesh(geo, mats.backMat);
      back.renderOrder = 6;
      back.visible = !isSoftwareGl;
      const front = new THREE.Mesh(geo, mats.frontMat);
      front.renderOrder = 7;
      const edge = new THREE.LineSegments(edgeGeo, mats.edgeFrontMat);
      edge.scale.setScalar(1.002);
      edge.renderOrder = 8;

      group.add(back, front, edge);
      shardsRoot.add(group);

      return {
        group,
        geo,
        edgeGeo,
        mats,
        data,
        currentPos: new THREE.Vector3(...data.homeOffset),
        currentRot: new THREE.Euler(0, 0, 0),
        reassembleOrigin: computeStage1OrbitalPosition(data, 0, 1),
      };
    });

    // Pre-compile all shader programs once on mount
    if (!isSoftwareGl) {
      shardsRoot.visible = true;
      energyCore.group.visible = true;
      crackLines.visible = true;
      sparkPoints.visible = true;
      renderer.compile(scene, camera);
      shardsRoot.visible = false;
      energyCore.group.visible = false;
      crackLines.visible = false;
      sparkPoints.visible = false;
    }

    // Reusable scratch vectors (zero per-frame GC)
    const camTarget = new THREE.Vector3(0, -0.08, 0);
    const coreLightPos = new THREE.Vector3(0, 0, 0);
    const tmpHomeVec = new THREE.Vector3();
    const tmpEuler = new THREE.Euler();
    const tmpQuat = new THREE.Quaternion();

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;
    let rotationAngle = 0.32;
    let lockedFractureAngle = 0.32;
    let currentDiamondHover = 0;
    let currentCoreHover = 0;
    let smoothPtrX = 0;
    let smoothPtrY = 0;
    let capturedReassembleOrigins = false;
    let lastLogicalPhase = '';

    const updateLogicalPhaseAttr = (stageVal: CosmicStage, progressVal: number) => {
      const nextPhase = resolveCosmicLogicalPhase(stageVal, progressVal);
      if (nextPhase !== lastLogicalPhase) {
        lastLogicalPhase = nextPhase;
        slotRef.current?.setAttribute('data-cosmic-logical-phase', nextPhase);
      }
    };

    const getSoftwareCooldownMs = () => {
      const st = stateRef.current.stage;
      if (
        st === 'fracturing' ||
        st === 'orbital' ||
        st === 'reassembling-hero' ||
        st === 'entering-universe'
      ) {
        return 18;
      }
      return 75;
    };

    let activeSync: WebGLSync | null = null;
    const clearActiveSync = () => {
      if (activeSync) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        gl?.deleteSync?.(activeSync);
        activeSync = null;
      }
    };

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        clearActiveSync();
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        activeSync = sync;
        gl.flush();
        const pollStart = performance.now();
        const poll = () => {
          if (disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED && performance.now() - pollStart < 140) {
            frameId = window.setTimeout(poll, 8);
          } else {
            clearActiveSync();
            frameId = window.setTimeout(cb, getSoftwareCooldownMs());
          }
        };
        frameId = window.setTimeout(poll, 8);
      } else {
        frameId = window.setTimeout(cb, getSoftwareCooldownMs());
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      const overlayOpaque =
        s.stage === 'universe' ||
        s.stage === 'selecting-shard' ||
        s.stage === 'shard-detail' ||
        s.stage === 'returning-to-universe' ||
        s.stage === 'black-hole-exit' ||
        s.stage === 'reassembling';

      if (document.hidden || overlayOpaque) {
        frameId = window.setTimeout(tick, 180);
        return;
      }

      elapsedTime += dt;
      const motionScale = s.reducedMotion ? 0.18 : 1.0;

      currentDiamondHover = THREE.MathUtils.damp(
        currentDiamondHover,
        s.diamondHovered && s.stage === 'idle' ? 1 : 0,
        6,
        dt
      );
      currentCoreHover = THREE.MathUtils.damp(
        currentCoreHover,
        s.coreHovered && s.stage === 'orbital' ? 1 : 0,
        7,
        dt
      );
      smoothPtrX = THREE.MathUtils.damp(smoothPtrX, s.pointerX, 5.5, dt);
      smoothPtrY = THREE.MathUtils.damp(smoothPtrY, s.pointerY, 5.5, dt);

      if (s.stage !== 'reassembling-hero') {
        capturedReassembleOrigins = false;
      }

      if (s.stage === 'idle') {
        updateLogicalPhaseAttr('idle', 0);
        diamondGroup.visible = true;
        crackLines.visible = false;
        crackAuraLines.visible = false;
        sparkPoints.visible = false;
        microSplintersRoot.visible = false;
        orbitalStrandsLines.visible = false;
        magneticThreadsLines.visible = false;
        shardsRoot.visible = false;
        energyCore.group.visible = false;

        if (Math.abs(camera.fov - BASE_FOV) > 0.05) {
          camera.fov = BASE_FOV;
          camera.updateProjectionMatrix();
        }
        camera.position.set(0, 0.72, BASE_CAM_Z);
        camera.lookAt(camTarget);

        let clickPulse = 0;
        if (s.clickPulseStartMs > 0) {
          const pT = (now - s.clickPulseStartMs) / 550;
          if (pT < 1) {
            clickPulse = Math.sin(pT * Math.PI) * 0.42;
          } else {
            s.clickPulseStartMs = 0;
          }
        }

        // Restrained, regal rotation of the intact solid crystal
        const baseSpeed = s.reducedMotion ? 0.04 : 0.24;
        rotationAngle += dt * baseSpeed * (1.0 - currentDiamondHover * 0.45);
        lockedFractureAngle = rotationAngle;

        diamondGroup.rotation.y = rotationAngle + smoothPtrX * 0.2;
        diamondGroup.rotation.x =
          0.14 + Math.sin(elapsedTime * 0.55) * 0.04 - smoothPtrY * 0.12;
        diamondGroup.rotation.z =
          Math.cos(elapsedTime * 0.45) * 0.03 + smoothPtrX * 0.05;
        diamondGroup.position.set(0, Math.sin(elapsedTime * 0.95) * 0.05 + 0.06, 0);
        diamondGroup.scale.setScalar(1.0 + currentDiamondHover * 0.038 + clickPulse * 0.045);

        intactMatSet.setCoreLight(coreLightPos, 0.75 + currentDiamondHover * 0.35 + clickPulse * 0.6);
        intactMatSet.backMat.uniforms.uTime.value = elapsedTime;
        intactMatSet.backMat.uniforms.uHover.value = Math.min(1, currentDiamondHover + clickPulse);
        intactMatSet.backMat.uniforms.uInternalEnergy.value = 0.22 + currentDiamondHover * 0.2 + clickPulse * 0.35;
        intactMatSet.backMat.uniforms.uFractureFlash.value = clickPulse * 0.3;
        intactMatSet.backMat.uniforms.uOpacity.value = 1;
        intactMatSet.backMat.uniforms.uPointer.value.set(smoothPtrX, smoothPtrY);

        intactMatSet.frontMat.uniforms.uTime.value = elapsedTime;
        intactMatSet.frontMat.uniforms.uHover.value = Math.min(1, currentDiamondHover + clickPulse);
        intactMatSet.frontMat.uniforms.uInternalEnergy.value = 0.22 + currentDiamondHover * 0.2 + clickPulse * 0.35;
        intactMatSet.frontMat.uniforms.uFractureFlash.value = clickPulse * 0.3;
        intactMatSet.frontMat.uniforms.uOpacity.value = 1;
        intactMatSet.frontMat.uniforms.uPointer.value.set(smoothPtrX, smoothPtrY);

        intactMatSet.edgeFrontMat.uniforms.uOpacity.value =
          0.18 + currentDiamondHover * 0.14 + clickPulse * 0.22;
      } else if (s.stage === 'reassembling-hero') {
        // =====================================================================
        // STAGE THREE — ORGANIC GRAVITATIONAL REASSEMBLY (3.6 seconds = 3600ms):
        //   Phase A (0.0–1.5s, 0.00..0.4167): Gravitational Attraction along curved 3D trajectories
        //   Phase B (1.5–3.1s, 0.4167..0.8611): Visible Fragment Convergence + Magnetic Connection Threads
        //                                       (All 12 fragments remain 100% opaque until interlocking at 3.1s!)
        //   Phase C (3.1–3.6s, 0.8611..1.0000): Final 0.5s Crystalline Healing Wave & Crack Disappearance
        // =====================================================================
        const reDurMs = s.reducedMotion
          ? REASSEMBLY_REDUCED_DURATION_MS
          : REASSEMBLY_TOTAL_DURATION_MS;
        const rawReT = Math.min(1, Math.max(0, (now - s.heroReassembleStartMs) / reDurMs));
        updateLogicalPhaseAttr('reassembling-hero', rawReT);

        // Capture each fragment's orbital starting position at the beginning of reassembly
        if (!capturedReassembleOrigins) {
          for (let i = 0; i < shardRuntimes.length; i++) {
            const item = shardRuntimes[i];
            const [ox, oy, oz] = computeStage1OrbitalPosition(
              item.data,
              elapsedTime,
              motionScale
            );
            item.reassembleOrigin = [ox, oy, oz];
          }
          capturedReassembleOrigins = true;
        }

        // Normalized convergence progress across Phase A + Phase B (0.0 -> 3.1s)
        const convT = Math.min(1, rawReT / REASSEMBLY_PHASE_B_END_RATIO);
        const easeConv = convT * convT * (3 - 2 * convT);
        // Normalized healing progress across Phase C (final 0.5s: 3.1 -> 3.6s)
        const isHealingPhase = rawReT >= REASSEMBLY_PHASE_B_END_RATIO;
        const healT = isHealingPhase
          ? Math.min(1, Math.max(0, (rawReT - REASSEMBLY_PHASE_B_END_RATIO) / (1 - REASSEMBLY_PHASE_B_END_RATIO)))
          : 0;

        sparkPoints.visible = false;
        microSplintersRoot.visible = false;
        orbitalStrandsLines.visible = false;

        if (Math.abs(camera.fov - BASE_FOV) > 0.05) {
          camera.fov = BASE_FOV;
          camera.updateProjectionMatrix();
        }
        camera.position.set(0, THREE.MathUtils.lerp(0.46, 0.72, easeConv), BASE_CAM_Z);
        camera.lookAt(camTarget);

        // Central YADRO core draws the fragments home and folds into the crystal heart as they interlock
        const coreOpacity = Math.max(0, 1 - Math.pow(convT, 1.45));
        energyCore.group.visible = coreOpacity > 0.01;
        energyCore.group.scale.setScalar(1.0 - easeConv * 0.58);
        energyCore.update({
          elapsed: elapsedTime,
          hover: 0,
          opacity: coreOpacity,
          dim: 0,
          rippleProgress: isHealingPhase ? healT : 0,
          cameraQuaternion: camera.quaternion,
          reducedMotion: s.reducedMotion,
        });

        // CRITICAL: All 12 fragments remain 100% visible (shardOpacity = 1.0) until they physically connect in Phase C!
        const shardOpacity = !isHealingPhase
          ? 1.0
          : Math.max(0, 1 - Math.max(0, (healT - 0.08) / 0.48));

        tmpEuler.set(0.14, lockedFractureAngle, 0);
        tmpQuat.setFromEuler(tmpEuler);

        // Fine luminous magnetic connection threads during Phase A & Phase B (0.0–3.1s)
        const threadAlpha =
          !isHealingPhase && convT > 0.03 && convT < 0.98
            ? Math.sin(convT * Math.PI) * (convT > 0.35 ? 0.52 : 0.34)
            : 0;
        magneticThreadsLines.visible = threadAlpha > 0.01;
        if (magneticThreadsLines.visible) {
          magneticThreadsMat.opacity = threadAlpha;
        }

        shardsRoot.visible = shardOpacity > 0.01;
        if (shardsRoot.visible || magneticThreadsLines.visible) {
          const healPulse = isHealingPhase ? Math.sin(healT * Math.PI) : 0;
          const alignFlash = Math.pow(convT, 2.2) * 0.55 + healPulse * 0.85;

          for (let i = 0; i < shardRuntimes.length; i++) {
            const item = shardRuntimes[i];
            const d = item.data;

            tmpHomeVec.set(d.homeOffset[0], d.homeOffset[1], d.homeOffset[2]).applyQuaternion(tmpQuat);
            tmpHomeVec.y += 0.06;
            const homeTuple: [number, number, number] = [
              tmpHomeVec.x,
              tmpHomeVec.y,
              tmpHomeVec.z,
            ];

            const [px, py, pz] = computeReassemblyTrajectoryPosition(
              item.reassembleOrigin,
              homeTuple,
              convT,
              i
            );
            item.group.position.set(px, py, pz);
            item.currentPos.set(px, py, pz);

            // Smooth rotational alignment back to exact original diamond orientation (0.14, lockedFractureAngle, 0)
            const rotAlign = Math.pow(convT, 1.35);
            const startRx = 0.14 + d.separationImpulseRot[0] * 0.7;
            const startRy = lockedFractureAngle + d.separationImpulseRot[1] * 0.7;
            const startRz = d.separationImpulseRot[2] * 0.7;
            item.group.rotation.set(
              THREE.MathUtils.lerp(startRx, 0.14, rotAlign),
              THREE.MathUtils.lerp(startRy, lockedFractureAngle, rotAlign),
              THREE.MathUtils.lerp(startRz, 0, rotAlign)
            );
            item.group.scale.setScalar(THREE.MathUtils.lerp(d.stage1Scale, 1.0, easeConv));

            item.mats.setCoreLight(coreLightPos, 1.65 * (1 - easeConv * 0.35) + healPulse * 1.1);
            item.mats.backMat.uniforms.uTime.value = elapsedTime;
            item.mats.backMat.uniforms.uOpacity.value = shardOpacity;
            item.mats.backMat.uniforms.uInternalEnergy.value = 0.28 + alignFlash * 0.55;
            item.mats.backMat.uniforms.uFractureFlash.value = alignFlash * 0.68;

            item.mats.frontMat.uniforms.uTime.value = elapsedTime;
            item.mats.frontMat.uniforms.uOpacity.value = shardOpacity;
            item.mats.frontMat.uniforms.uInternalEnergy.value = 0.28 + alignFlash * 0.55;
            item.mats.frontMat.uniforms.uFractureFlash.value = alignFlash * 0.68;

            item.mats.edgeFrontMat.uniforms.uOpacity.value =
              (0.32 + alignFlash * 0.48) * shardOpacity;

            // Update curved magnetic connection thread from current shard position -> exact homeOffset
            if (magneticThreadsLines.visible) {
              const baseIdx = i * magneticSegmentsPerShard * 6;
              for (let seg = 0; seg < magneticSegmentsPerShard; seg++) {
                const s0 = seg / magneticSegmentsPerShard;
                const s1 = (seg + 1) / magneticSegmentsPerShard;
                const p0 = computeReassemblyTrajectoryPosition(
                  [px, py, pz],
                  homeTuple,
                  s0,
                  i
                );
                const p1 = computeReassemblyTrajectoryPosition(
                  [px, py, pz],
                  homeTuple,
                  s1,
                  i
                );
                const offset = baseIdx + seg * 6;
                magneticThreadPositions[offset] = p0[0];
                magneticThreadPositions[offset + 1] = p0[1];
                magneticThreadPositions[offset + 2] = p0[2];
                magneticThreadPositions[offset + 3] = p1[0];
                magneticThreadPositions[offset + 4] = p1[1];
                magneticThreadPositions[offset + 5] = p1[2];
              }
            }
          }

          if (magneticThreadsLines.visible) {
            magneticThreadsPosAttr.needsUpdate = true;
          }
        }

        // Phase C (3.1–3.6s, final 0.5s): Crystalline Healing Wave & Crack Sealing across the unified diamond
        const intactOpacity = !isHealingPhase
          ? 0
          : Math.min(1, healT / 0.45);
        diamondGroup.visible = intactOpacity > 0.01;
        if (diamondGroup.visible) {
          const healWaveGlow = Math.sin(healT * Math.PI);
          diamondGroup.position.set(0, 0.06, 0);
          diamondGroup.rotation.set(0.14, lockedFractureAngle, 0);
          diamondGroup.scale.setScalar(1.0 + healWaveGlow * 0.018);

          intactMatSet.setCoreLight(coreLightPos, 0.75 + healWaveGlow * 1.15);
          intactMatSet.backMat.uniforms.uTime.value = elapsedTime;
          intactMatSet.backMat.uniforms.uOpacity.value = intactOpacity;
          intactMatSet.backMat.uniforms.uInternalEnergy.value = 0.22 + healWaveGlow * 0.55;
          intactMatSet.backMat.uniforms.uFractureFlash.value = healWaveGlow * 0.62 * (1 - healT * 0.5);

          intactMatSet.frontMat.uniforms.uTime.value = elapsedTime;
          intactMatSet.frontMat.uniforms.uOpacity.value = intactOpacity;
          intactMatSet.frontMat.uniforms.uInternalEnergy.value = 0.22 + healWaveGlow * 0.55;
          intactMatSet.frontMat.uniforms.uFractureFlash.value = healWaveGlow * 0.62 * (1 - healT * 0.5);

          intactMatSet.edgeFrontMat.uniforms.uOpacity.value =
            (0.26 + healWaveGlow * 0.36) * intactOpacity;

          // Visible fracture seams briefly intensify as the healing wave travels through and seals them
          const healCracksOpacity =
            Math.sin(healT * Math.PI) * 1.18 * (1 - Math.pow(healT, 2.2));
          const showHealCracks = healCracksOpacity > 0.015;
          crackLines.visible = showHealCracks;
          crackAuraLines.visible = showHealCracks;
          if (showHealCracks) {
            crackMat.uniforms.uProgress.value = 1.0;
            crackMat.uniforms.uTime.value = elapsedTime;
            crackMat.uniforms.uHealingWave.value = healT;
            crackMat.uniforms.uGlow.value = 0.85 + healWaveGlow * 0.65;
            crackMat.uniforms.uOpacity.value = healCracksOpacity;
          }
        } else {
          crackLines.visible = false;
          crackAuraLines.visible = false;
        }
      } else if (
        s.stage === 'fracturing' ||
        s.stage === 'orbital' ||
        s.stage === 'entering-universe'
      ) {
        // =====================================================================
        // STAGE ONE — EXTENDED CINEMATIC DIAMOND FRACTURE (6.0 seconds = 6000ms):
        //   Phase A (0.0–2.5s, 0.00..0.4167): Incipient Fracturing — single solid diamond, zero scattering,
        //                                      progressive 3D luminous cyan/violet/magenta crack network growth
        //   Phase B (2.5–5.0s, 0.4167..0.8333): Progressive Crystalline Separation — breaks apart along fracture
        //                                       seams into 12 primary shards + 18 decorative 3D micro-splinters
        //   Phase C (5.0–6.0s, 0.8333..1.0000): Orbital Formation — 12 primary fragments settle into stable
        //                                       zero-gravity orbit with subtle luminous energy strands
        // =====================================================================
        const fractureDurMs = s.reducedMotion
          ? FRACTURE_REDUCED_DURATION_MS
          : FRACTURE_TOTAL_DURATION_MS;
        const rawT =
          s.stage === 'fracturing'
            ? Math.min(1, Math.max(0, (now - s.fractureStartMs) / fractureDurMs))
            : 1.0;

        magneticThreadsLines.visible = false;

        // Phase A crack propagation progress (0 -> 1 across 0.0..2.5s)
        const crackProgress = Math.min(1, rawT / FRACTURE_PHASE_A_END_RATIO);
        // Internal luminous crack energy builds steadily through Phase A and peaks right at the 2.5s separation threshold
        const internalPulse = 0.5 + 0.5 * Math.sin(elapsedTime * 7.5);
        const phaseACrackGlow =
          rawT < FRACTURE_PHASE_A_END_RATIO
            ? Math.pow(crackProgress, 1.15) * (0.88 + internalPulse * 0.16)
            : Math.max(0, 1 - (rawT - FRACTURE_PHASE_A_END_RATIO) / 0.085);
        const separationThresholdFlash =
          rawT > FRACTURE_PHASE_A_END_RATIO - 0.08 && rawT < FRACTURE_PHASE_A_END_RATIO + 0.12
            ? Math.sin(
                ((rawT - (FRACTURE_PHASE_A_END_RATIO - 0.08)) / 0.2) * Math.PI
              )
            : 0;

        // Intact crystal stays 100% solid throughout Phase A (0.0–2.5s), then hands off at the start of Phase B
        const intactOpacity =
          s.stage === 'orbital' || s.stage === 'entering-universe'
            ? 0
            : rawT < FRACTURE_PHASE_A_END_RATIO
            ? 1.0
            : Math.max(0, 1 - (rawT - FRACTURE_PHASE_A_END_RATIO) / 0.065);

        diamondGroup.visible = intactOpacity > 0.01;
        if (diamondGroup.visible) {
          // Restrained structural tension vibration during Phase A incipient fracturing
          const tremorAmp =
            !s.reducedMotion && rawT < FRACTURE_PHASE_A_END_RATIO + 0.04
              ? 0.003 + Math.pow(crackProgress, 2.2) * 0.018
              : 0;
          const vibX = Math.sin(elapsedTime * 54) * tremorAmp;
          const vibY = Math.cos(elapsedTime * 63) * tremorAmp * 0.72;

          diamondGroup.position.set(vibX, 0.06 + vibY, 0);
          diamondGroup.rotation.set(0.14, lockedFractureAngle, 0);
          diamondGroup.scale.setScalar(1.0 + Math.pow(crackProgress, 2.0) * 0.036);

          // Luminous internal crack reflections on adjacent crystal facets
          intactMatSet.setCoreLight(coreLightPos, 0.7 + phaseACrackGlow * 1.25);
          intactMatSet.backMat.uniforms.uTime.value = elapsedTime;
          intactMatSet.backMat.uniforms.uInternalEnergy.value =
            0.22 + phaseACrackGlow * 0.68;
          intactMatSet.backMat.uniforms.uFractureFlash.value =
            phaseACrackGlow * 0.42 + separationThresholdFlash * 0.45;
          intactMatSet.backMat.uniforms.uOpacity.value = intactOpacity;

          intactMatSet.frontMat.uniforms.uTime.value = elapsedTime;
          intactMatSet.frontMat.uniforms.uInternalEnergy.value =
            0.22 + phaseACrackGlow * 0.68;
          intactMatSet.frontMat.uniforms.uFractureFlash.value =
            phaseACrackGlow * 0.42 + separationThresholdFlash * 0.45;
          intactMatSet.frontMat.uniforms.uOpacity.value = intactOpacity;

          intactMatSet.edgeFrontMat.uniforms.uOpacity.value =
            (0.24 + phaseACrackGlow * 0.22) * intactOpacity;

          // Progressive 3D fracture crack veins growing across the crystal interior & exterior
          const cracksActive = rawT > 0.015 && intactOpacity > 0.02;
          crackLines.visible = cracksActive;
          crackAuraLines.visible = cracksActive;
          if (cracksActive) {
            crackMat.uniforms.uProgress.value = crackProgress;
            crackMat.uniforms.uTime.value = elapsedTime;
            crackMat.uniforms.uHealingWave.value = 0.0;
            crackMat.uniforms.uGlow.value = Math.min(1.4, 0.38 + phaseACrackGlow * 1.15);
            crackMat.uniforms.uOpacity.value = intactOpacity;
          }
        } else {
          crackLines.visible = false;
          crackAuraLines.visible = false;
        }

        // =====================================================================
        // STAGE TWO — FOUR-PHASE DASHBOARD CORE SUPERNOVA TRANSITION (2.85s):
        //   Phase A (0.00..0.32): Core Implosion (inward compression, accelerating light, subtle inward shard draw)
        //   Phase B (0.30..0.64): Supernova Radial Shockwave (radial energy wave + shard illumination & outward push)
        //   Phase C (0.52..0.90): Supernova Burst (luminous expansion + camera acceleration)
        //   Phase D (0.56..1.00): Smooth Camera Dive into Core -> Cosmic Universe emergence
        // =====================================================================
        let enterProgress = 0;
        let supernovaAccum = 0;
        let supernovaShock = 0;
        let supernovaBurst = 0;
        let cameraDive = 0;
        let rippleProgress = 0;
        let radialPulseProgress = 0;

        if (s.stage === 'entering-universe') {
          const enterDurMs = s.reducedMotion
            ? SUPERNOVA_REDUCED_DURATION_MS
            : SUPERNOVA_TOTAL_DURATION_MS;
          enterProgress = Math.min(1, Math.max(0, (now - s.enterStartMs) / enterDurMs));
          updateLogicalPhaseAttr('entering-universe', enterProgress);

          // Phase A: Core Implosion & Energy Compression (0.00..0.32)
          if (enterProgress < 0.32) {
            const pA = enterProgress / 0.32;
            supernovaAccum = pA * pA * (3 - 2 * pA);
          } else {
            const decayA = Math.min(1, (enterProgress - 0.32) / 0.28);
            supernovaAccum = Math.max(0, 1 - decayA * 1.15);
          }

          // Phase B: Supernova Radial Shockwave (0.30..0.64)
          if (enterProgress >= 0.30) {
            const pB = Math.min(1, (enterProgress - 0.30) / 0.34);
            supernovaShock = 1 - Math.pow(1 - pB, 3);
            rippleProgress = Math.min(1, pB * 1.12);
            radialPulseProgress = Math.min(1, (enterProgress - 0.30) / 0.44);
          }

          // Phase C: Supernova Burst & Luminous Expansion (0.52..0.90)
          if (enterProgress >= 0.52) {
            const pC = Math.min(1, (enterProgress - 0.52) / 0.38);
            supernovaBurst = pC * pC * (3 - 2 * pC);
          }

          // Phase D: Camera Acceleration & Dive into the Core (0.56..1.00)
          if (enterProgress >= 0.56) {
            const pD = Math.min(1, (enterProgress - 0.56) / 0.44);
            cameraDive = pD * pD * pD;
          }
        } else if (s.stage === 'fracturing') {
          updateLogicalPhaseAttr('fracturing', rawT);
          if (rawT >= FRACTURE_PHASE_A_END_RATIO && rawT < FRACTURE_PHASE_B_END_RATIO) {
            rippleProgress =
              (rawT - FRACTURE_PHASE_A_END_RATIO) /
              (FRACTURE_PHASE_B_END_RATIO - FRACTURE_PHASE_A_END_RATIO);
          }
        } else {
          updateLogicalPhaseAttr('orbital', 1);
        }

        // Dynamic Micro-Particles: Phase B fine crystalline micro-dust OR Supernova implosion/burst plasma particles
        const showFractureMicroDust =
          s.stage === 'fracturing' &&
          rawT >= FRACTURE_PHASE_A_END_RATIO &&
          rawT < 0.98;
        const showSupernovaParticles = s.stage === 'entering-universe' && enterProgress < 0.92;
        sparkPoints.visible = showFractureMicroDust || showSupernovaParticles;
        if (sparkPoints.visible) {
          sparkMat.uniforms.uTime.value = elapsedTime;
          if (showFractureMicroDust) {
            // Phase B (2.5–5.0s) micro-dust detaches from fracture seams and gently fades during Phase C (5.0–6.0s)
            const dustWindowT =
              (rawT - FRACTURE_PHASE_A_END_RATIO) / (1 - FRACTURE_PHASE_A_END_RATIO);
            const dustFade =
              rawT < FRACTURE_PHASE_B_END_RATIO
                ? Math.min(1, (rawT - FRACTURE_PHASE_A_END_RATIO) / 0.14)
                : Math.max(
                    0,
                    1 -
                      (rawT - FRACTURE_PHASE_B_END_RATIO) /
                        (1 - FRACTURE_PHASE_B_END_RATIO)
                  );
            sparkMat.uniforms.uOpacity.value = dustFade * 0.78;
            tmpEuler.set(0.14, lockedFractureAngle, 0);
            tmpQuat.setFromEuler(tmpEuler);
            for (let i = 0; i < sparkCount; i++) {
              const localAge = Math.max(0, dustWindowT - (i % 7) * 0.035);
              const easedDrift = 1 - Math.pow(1 - Math.min(1, localAge), 2.4);
              tmpHomeVec.copy(sparkOrigins[i]).applyQuaternion(tmpQuat);
              const drift = easedDrift * (0.58 + (i % 5) * 0.18);
              sparkPositions[i * 3] = tmpHomeVec.x + sparkDirs[i].x * drift;
              sparkPositions[i * 3 + 1] = tmpHomeVec.y + 0.06 + sparkDirs[i].y * drift;
              sparkPositions[i * 3 + 2] = tmpHomeVec.z + sparkDirs[i].z * drift;
            }
          } else {
            // Supernova Phase A pulls particles IN toward core; Phase B/C erupts them OUTWARD
            const pOpacity =
              enterProgress < 0.78
                ? Math.min(1, enterProgress * 4.5) * 0.95
                : Math.max(0, 1 - (enterProgress - 0.78) / 0.16);
            sparkMat.uniforms.uOpacity.value = pOpacity;
            for (let i = 0; i < sparkCount; i++) {
              const baseR = 1.6 + (i % 7) * 0.24;
              const swirl = elapsedTime * 1.4 + i * 0.55;
              const radius =
                enterProgress < 0.32
                  ? baseR * (1.0 - supernovaAccum * 0.78)
                  : 0.35 + supernovaShock * (2.4 + (i % 5) * 0.45) + supernovaBurst * 1.6;
              sparkPositions[i * 3] = sparkDirs[i].x * radius + Math.cos(swirl) * 0.12;
              sparkPositions[i * 3 + 1] = sparkDirs[i].y * radius + Math.sin(swirl) * 0.12;
              sparkPositions[i * 3 + 2] = sparkDirs[i].z * radius * 0.7;
            }
          }
          sparkPosAttr.needsUpdate = true;
        }

        // Decorative Non-Interactive 3D Crystalline Micro-Splinters (active only during Phase B separation & Phase C fade)
        const showMicroSplinters =
          s.stage === 'fracturing' &&
          rawT >= FRACTURE_PHASE_A_END_RATIO &&
          rawT < 0.99;
        microSplintersRoot.visible = showMicroSplinters;
        if (showMicroSplinters) {
          const splinterLifeT =
            (rawT - FRACTURE_PHASE_A_END_RATIO) / (1 - FRACTURE_PHASE_A_END_RATIO);
          const splinterOpacity =
            rawT < FRACTURE_PHASE_B_END_RATIO
              ? Math.min(1, (rawT - FRACTURE_PHASE_A_END_RATIO) / 0.12) * 0.72
              : Math.max(
                  0,
                  1 -
                    (rawT - FRACTURE_PHASE_B_END_RATIO) /
                      (1 - FRACTURE_PHASE_B_END_RATIO)
                ) * 0.72;
          microSplinterMat.opacity = splinterOpacity;

          tmpEuler.set(0.14, lockedFractureAngle, 0);
          tmpQuat.setFromEuler(tmpEuler);

          for (let i = 0; i < microSplinters.length; i++) {
            const sp = microSplinters[i];
            const localT = Math.max(0, Math.min(1, (splinterLifeT - sp.stagger) / 0.9));
            const easeDrift = 1 - Math.pow(1 - localT, 2.6);
            tmpHomeVec.copy(sp.origin).applyQuaternion(tmpQuat);
            const dist = easeDrift * (0.72 + (i % 4) * 0.22);
            sp.mesh.position.set(
              tmpHomeVec.x + sp.dir.x * dist,
              tmpHomeVec.y + 0.06 + sp.dir.y * dist,
              tmpHomeVec.z + sp.dir.z * dist
            );
            sp.mesh.rotation.set(
              0.14 + localT * sp.spin[0] * 2.2,
              lockedFractureAngle + localT * sp.spin[1] * 2.2,
              localT * sp.spin[2] * 2.2
            );
          }
        }

        // Camera framing: smooth forward glide into the core while staying strictly outside the near clipping plane (>= 2.35)
        const targetFov = BASE_FOV + cameraDive * 28;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = targetFov;
          camera.updateProjectionMatrix();
        }

        const camZ = BASE_CAM_Z + supernovaAccum * 0.28 - cameraDive * (BASE_CAM_Z - 2.35);
        camera.position.set(
          smoothPtrX * 0.14 * (1 - cameraDive),
          THREE.MathUtils.lerp(0.5, 0.0, cameraDive) - smoothPtrY * 0.1 * (1 - cameraDive),
          camZ
        );
        camera.lookAt(0, 0, 0);

        // Energy Core (YADRO) emerges right as the 12 physical fragments begin separating in Phase B (rawT >= 1.8s)
        const coreOpacity =
          s.stage === 'fracturing'
            ? Math.min(
                1,
                Math.max(0, (rawT - FRACTURE_PHASE_A_END_RATIO) / 0.22)
              )
            : 1.0;
        energyCore.group.visible = coreOpacity > 0.01;
        energyCore.group.position.set(0, 0, 0);
        const coreScale =
          (0.35 + 0.65 * coreOpacity) *
          (1.0 - supernovaAccum * 0.24 + supernovaShock * 0.38 + supernovaBurst * 1.15 + cameraDive * 0.85);
        energyCore.group.scale.setScalar(Math.max(0.28, coreScale));
        energyCore.update({
          elapsed: elapsedTime,
          hover: currentCoreHover,
          opacity: coreOpacity,
          dim: 0,
          rippleProgress,
          radialPulseProgress,
          supernovaCompression: supernovaAccum,
          supernovaBurst,
          cameraQuaternion: camera.quaternion,
          reducedMotion: s.reducedMotion,
        });

        // 12 Primary Volumetric Diamond-Sector Fragments physically separate starting at Phase B (rawT >= 2.5s)
        shardsRoot.visible = rawT >= FRACTURE_PHASE_A_END_RATIO;
        if (shardsRoot.visible) {
          // Normalized progress from start of Phase B (2.5s) to end of Phase C (6.0s)
          const postPhaseAT =
            s.stage === 'fracturing'
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (rawT - FRACTURE_PHASE_A_END_RATIO) /
                      (1 - FRACTURE_PHASE_A_END_RATIO)
                  )
                )
              : 1.0;
          const baseShardOpacity = Math.min(1, postPhaseAT / 0.08);

          // Restrained core lighting intensity that radiates dynamically onto exposed inner cleavage surfaces
          const coreLightIntensity =
            1.65 +
            currentCoreHover * 0.65 +
            supernovaAccum * 1.8 +
            supernovaShock * 2.4 +
            supernovaBurst * 2.2;

          // Subtle pull-in during Supernova Phase A implosion, dramatic shockwave recoil during Phase B/C
          const corePull =
            (1.0 - currentCoreHover * 0.05) *
            (1.0 - supernovaAccum * 0.28 + supernovaShock * 0.72 + supernovaBurst * 1.35);

          // Smooth post-separation settling time for decaying angular impulse
          const postSepSec =
            s.stage === 'fracturing'
              ? postPhaseAT * 3.5
              : 3.5 + (s.orbitalStartMs > 0 ? Math.max(0, (now - s.orbitalStartMs) / 1000) : 0);
          const impulseDecay = 1 - Math.exp(-postSepSec * 1.15);

          tmpEuler.set(0.14, lockedFractureAngle, 0);
          tmpQuat.setFromEuler(tmpEuler);

          // Subtle luminous orbital energy strands fade in during Phase C (5.0–6.0s) and persist gently in orbital stage
          const strandFade =
            s.stage === 'orbital'
              ? 0.14 + currentCoreHover * 0.06
              : s.stage === 'fracturing' && rawT >= FRACTURE_PHASE_B_END_RATIO
              ? ((rawT - FRACTURE_PHASE_B_END_RATIO) /
                  (1 - FRACTURE_PHASE_B_END_RATIO)) *
                0.14
              : s.stage === 'entering-universe'
              ? Math.max(0, (1 - enterProgress * 1.8) * 0.18)
              : 0;
          orbitalStrandsLines.visible = strandFade > 0.008;
          if (orbitalStrandsLines.visible) {
            orbitalStrandsMat.opacity = strandFade;
          }

          for (let i = 0; i < shardRuntimes.length; i++) {
            const item = shardRuntimes[i];
            const d = item.data;

            // Natural individual stagger across the 12 primary fragments during Phase B separation
            const localSplit =
              s.stage === 'fracturing'
                ? Math.max(0, Math.min(1, (postPhaseAT - (i % 4) * 0.028) / 0.88))
                : 1.0;
            // Smooth quintic-like zero-gravity release and damped orbital settling
            const easeOut = 1 - Math.pow(1 - localSplit, 2.85);

            // Start at exact assembled position inside the intact diamond silhouette!
            tmpHomeVec.set(d.homeOffset[0], d.homeOffset[1], d.homeOffset[2]).applyQuaternion(tmpQuat);
            tmpHomeVec.y += 0.06;

            const [orbX, orbY, orbZ] = computeStage1OrbitalPosition(
              d,
              elapsedTime,
              motionScale,
              corePull,
              supernovaAccum * 0.28
            );

            // Expand radially in XY during core supernova dive while keeping Z strictly behind the camera near plane
            const radialPortalSpread = 1.0 + supernovaBurst * 0.38 + cameraDive * 0.55;
            const px = THREE.MathUtils.lerp(tmpHomeVec.x, orbX * radialPortalSpread, easeOut);
            const py = THREE.MathUtils.lerp(tmpHomeVec.y, orbY * radialPortalSpread, easeOut);
            const pz = THREE.MathUtils.lerp(tmpHomeVec.z, orbZ * (1.0 - cameraDive * 0.4), easeOut);
            item.group.position.set(px, py, pz);
            item.currentPos.set(px, py, pz);

            // Restrained, graceful orientation: starts aligned to diamond -> gentle impulse -> calm zero-gravity orbit
            const rx =
              0.14 +
              d.separationImpulseRot[0] * impulseDecay +
              Math.sin(elapsedTime * 0.42 * motionScale + i) * 0.14 * easeOut +
              elapsedTime * d.spinRate[0] * motionScale * easeOut;
            const ry =
              lockedFractureAngle +
              d.separationImpulseRot[1] * impulseDecay +
              elapsedTime * d.spinRate[1] * motionScale * easeOut;
            const rz =
              d.separationImpulseRot[2] * impulseDecay +
              Math.cos(elapsedTime * 0.36 * motionScale + i * 1.2) * 0.11 * easeOut +
              elapsedTime * d.spinRate[2] * motionScale * easeOut;

            item.group.rotation.set(rx, ry, rz);
            item.currentRot.set(rx, ry, rz);

            const scale = THREE.MathUtils.lerp(1.0, d.stage1Scale, easeOut);
            item.group.scale.setScalar(scale);

            // Exposed inner cleavage glow as fragments separate from the core in Phase B, or Supernova shockwave flash
            const shockFlash =
              s.stage === 'entering-universe'
                ? Math.max(
                    supernovaAccum * 0.55,
                    Math.sin(Math.min(1, supernovaShock) * Math.PI) * 0.95
                  )
                : Math.max(0, (1 - postPhaseAT) * 0.88);
            const shardAlpha = baseShardOpacity * Math.max(0, 1 - cameraDive * 0.92);

            item.mats.setCoreLight(coreLightPos, coreLightIntensity);
            item.mats.backMat.uniforms.uTime.value = elapsedTime;
            item.mats.backMat.uniforms.uOpacity.value = shardAlpha;
            item.mats.backMat.uniforms.uInternalEnergy.value = 0.34 + shockFlash * 0.65;
            item.mats.backMat.uniforms.uFractureFlash.value = shockFlash;
            item.mats.backMat.uniforms.uHighlight.value = Math.max(
              currentCoreHover * 0.28,
              supernovaAccum * 0.72 + supernovaShock * 0.5
            );

            item.mats.frontMat.uniforms.uTime.value = elapsedTime;
            item.mats.frontMat.uniforms.uOpacity.value = shardAlpha;
            item.mats.frontMat.uniforms.uInternalEnergy.value = 0.34 + shockFlash * 0.65;
            item.mats.frontMat.uniforms.uFractureFlash.value = shockFlash;
            item.mats.frontMat.uniforms.uHighlight.value = Math.max(
              currentCoreHover * 0.28,
              supernovaAccum * 0.72 + supernovaShock * 0.5
            );

            item.mats.edgeFrontMat.uniforms.uOpacity.value =
              (0.36 + shockFlash * 0.45 + currentCoreHover * 0.18) * shardAlpha;
          }

          // Update subtle orbital energy strand vertices connecting each fragment to the core and its neighbor
          if (orbitalStrandsLines.visible) {
            for (let i = 0; i < shardRuntimes.length; i++) {
              const curr = shardRuntimes[i].currentPos;
              const next = shardRuntimes[(i + 1) % shardRuntimes.length].currentPos;
              const base = i * 12;
              // Segment 1: Fragment -> Core boundary
              orbitalStrandPositions[base] = curr.x * 0.88;
              orbitalStrandPositions[base + 1] = curr.y * 0.88;
              orbitalStrandPositions[base + 2] = curr.z * 0.88;
              orbitalStrandPositions[base + 3] = curr.x * 0.24;
              orbitalStrandPositions[base + 4] = curr.y * 0.24;
              orbitalStrandPositions[base + 5] = curr.z * 0.24;
              // Segment 2: Fragment -> Adjacent Orbital Fragment
              orbitalStrandPositions[base + 6] = curr.x;
              orbitalStrandPositions[base + 7] = curr.y;
              orbitalStrandPositions[base + 8] = curr.z;
              orbitalStrandPositions[base + 9] = next.x;
              orbitalStrandPositions[base + 10] = next.y;
              orbitalStrandPositions[base + 11] = next.z;
            }
            orbitalStrandsPosAttr.needsUpdate = true;
          }
        } else {
          orbitalStrandsLines.visible = false;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    wakeLoopRef.current = () => {
      if (disposed || !isSoftwareGl) return;
      clearTimeout(frameId);
      clearActiveSync();
      tick();
    };

    tick();

    let lastW = width;
    let lastH = height;
    let resizeRafId = 0;

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 400;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    const scheduleResize = () => {
      if (disposed) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(handleResize);
    };

    const handleResizeObserverError = (ev: ErrorEvent) => {
      if (
        typeof ev.message === 'string' &&
        (ev.message.includes('ResizeObserver loop completed with undelivered notifications') ||
          ev.message.includes('ResizeObserver loop limit exceeded'))
      ) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      }
    };

    window.addEventListener('error', handleResizeObserverError, true);
    window.addEventListener('resize', scheduleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleResize);
      resizeObserver.observe(container);
    }

    return () => {
      disposed = true;
      wakeLoopRef.current = null;
      clearActiveSync();
      window.removeEventListener('error', handleResizeObserverError, true);
      window.removeEventListener('resize', scheduleResize);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeRafId);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      diamondGeo.dispose();
      diamondEdgeGeo.dispose();
      crackGeo.dispose();
      crackMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      microSplinterGeo.dispose();
      microSplinterMat.dispose();
      orbitalStrandsGeo.dispose();
      orbitalStrandsMat.dispose();
      magneticThreadsGeo.dispose();
      magneticThreadsMat.dispose();
      intactMatSet.dispose();
      energyCore.dispose();
      shardRuntimes.forEach((r) => {
        r.geo.dispose();
        r.edgeGeo.dispose();
        r.mats.dispose();
      });
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
    stateRef.current.pointerX = Math.max(-1, Math.min(1, nx));
    stateRef.current.pointerY = Math.max(-1, Math.min(1, ny));
  };

  const handleIdleSingleClick = () => {
    if (stage !== 'idle') return;
    stateRef.current.clickPulseStartMs = performance.now();
    setShowClickHint(true);
    if (hintTimerRef.current !== undefined) {
      window.clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = window.setTimeout(() => {
      setShowClickHint(false);
    }, 2400);
  };

  const handleIdleDoubleClick = () => {
    if (stage === 'idle') {
      setShowClickHint(false);
      onFracture();
    }
  };

  const handleIdleTouchTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stage !== 'idle' || e.pointerType !== 'touch') return;
    const now = Date.now();
    if (now - lastTapRef.current < 420) {
      lastTapRef.current = 0;
      setShowClickHint(false);
      onFracture();
    } else {
      lastTapRef.current = now;
      handleIdleSingleClick();
    }
  };

  const handleIdleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (stage === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onFracture();
    }
  };

  const showIdleTooltip = stage === 'idle' && (isDiamondHovered || showClickHint);
  const isOrbitalStage = stage === 'orbital';
  const isSupernovaActive = stage === 'entering-universe';

  return (
    <div
      ref={slotRef}
      className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center overflow-visible select-none"
      data-testid="cosmic-diamond-hero-slot"
      data-cosmic-stage={stage}
      data-cosmic-logical-phase={resolveCosmicLogicalPhase(stage, 0)}
    >
      {/* Atmospheric Luminous Backlight (Preserving Existing Hero Aura — never occludes 3D canvas) */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
        aria-hidden="true"
      >
        <div
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl transition-all duration-500"
          style={{
            opacity: isSupernovaActive ? 1 : isOrbitalStage ? 0.92 : isDiamondHovered ? 0.88 : 0.68,
            transform: isSupernovaActive ? 'scale(1.38)' : 'scale(1)',
            background:
              isOrbitalStage || isSupernovaActive
                ? 'radial-gradient(circle, rgba(56,189,248,0.34) 0%, rgba(139,92,246,0.36) 40%, rgba(88,28,135,0.10) 70%, transparent 84%)'
                : 'radial-gradient(circle, rgba(168,85,247,0.38) 0%, rgba(217,70,239,0.20) 42%, rgba(88,28,135,0.08) 68%, transparent 80%)',
          }}
        />
        <div
          className="absolute w-80 h-80 sm:w-96 sm:h-96 transition-transform duration-700"
          style={{
            opacity: isDiamondHovered || isOrbitalStage ? 0.68 : 0.44,
            transform: isDiamondHovered || isOrbitalStage ? 'scale(1.06)' : 'scale(1)',
            background:
              'conic-gradient(from 18deg at 50% 48%, transparent 0deg, rgba(232,121,249,0.16) 14deg, transparent 32deg, transparent 74deg, rgba(192,132,252,0.20) 92deg, transparent 112deg, transparent 156deg, rgba(56,189,248,0.16) 176deg, transparent 198deg, transparent 245deg, rgba(216,180,254,0.18) 264deg, transparent 286deg, transparent 325deg, rgba(232,121,249,0.14) 342deg, transparent 360deg)',
            filter: 'blur(12px)',
            maskImage: 'radial-gradient(circle, black 25%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 72%)',
          }}
        />
        <div
          className="absolute bottom-3 w-36 sm:w-44 h-5 rounded-full blur-xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(15, 3, 28, 0.72) 0%, rgba(88, 28, 135, 0.22) 55%, transparent 80%)',
          }}
        />
      </div>

      {/* Expanded Full-Bleed WebGL Canvas Layer (Eliminates Rectangular Canvas Edge Clipping!) */}
      {!webglFallback && (
        <div
          ref={containerRef}
          data-testid="cosmic-hero-webgl-canvas"
          className="pointer-events-none absolute -inset-x-6 -inset-y-6 sm:-inset-x-12 sm:-inset-y-8 z-10 overflow-visible"
        />
      )}

      {/* Interactive Hit Zone Centered on the Diamond / Energy Core */}
      <div
        role={stage === 'idle' ? 'button' : undefined}
        tabIndex={stage === 'idle' ? 0 : -1}
        aria-label={
          stage === 'idle'
            ? 'Parchalash uchun ikki marta bosing — Cosmic Diamond Portal'
            : 'Cosmic Diamond Energy Core'
        }
        data-testid="cosmic-diamond-trigger"
        className={`relative z-20 w-80 h-80 sm:w-[350px] sm:h-[350px] flex items-center justify-center outline-none rounded-full ${
          stage === 'idle'
            ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400/70'
            : ''
        }`}
        onClick={handleIdleSingleClick}
        onDoubleClick={handleIdleDoubleClick}
        onPointerUp={handleIdleTouchTap}
        onKeyDown={handleIdleKeyDown}
        onPointerMove={handlePointerMove}
        onMouseEnter={() => setIsDiamondHovered(true)}
        onMouseLeave={() => {
          setIsDiamondHovered(false);
          stateRef.current.pointerX = 0;
          stateRef.current.pointerY = 0;
        }}
      >
        {/* High-craft SVG Fallback only if WebGL context is unavailable */}
        {webglFallback && (
          <div className="relative w-56 h-56 flex items-center justify-center">
            {stage === 'idle' ? (
              <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-[0_0_28px_rgba(168,85,247,0.7)]">
                <defs>
                  <linearGradient id="fallbackGem" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5d0fe" />
                    <stop offset="45%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#4c1d95" />
                  </linearGradient>
                </defs>
                <polygon
                  points="100,18 168,66 100,186 32,66"
                  fill="url(#fallbackGem)"
                  stroke="#f5d0fe"
                  strokeOpacity="0.65"
                  strokeWidth="1.5"
                />
                <polygon points="100,18 134,66 66,66" fill="#fae8ff" fillOpacity="0.32" />
                <line x1="32" y1="66" x2="168" y2="66" stroke="#f5d0fe" strokeOpacity="0.55" />
                <line x1="66" y1="66" x2="100" y2="186" stroke="#e879f9" strokeOpacity="0.45" />
                <line x1="134" y1="66" x2="100" y2="186" stroke="#e879f9" strokeOpacity="0.45" />
              </svg>
            ) : (
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300 via-violet-500 to-indigo-700 shadow-[0_0_38px_rgba(139,92,246,0.9)]" />
                {COSMIC_SECTIONS.map((sec, idx) => {
                  const angle = (idx / COSMIC_SECTIONS.length) * Math.PI * 2;
                  const rx = Math.cos(angle) * 86;
                  const ry = Math.sin(angle) * 74;
                  return (
                    <span
                      key={sec.id}
                      className="absolute w-5 h-7 rounded-sm bg-gradient-to-br from-fuchsia-300 via-purple-500 to-indigo-900 border border-purple-200/50 shadow-[0_0_12px_rgba(192,132,252,0.75)]"
                      style={{
                        transform: `translate(${rx}px, ${ry}px) rotate(${Math.round((idx / COSMIC_SECTIONS.length) * 360)}deg)`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stage 1 Orbital Center: Interactive YADRO (Energy Core) Target */}
        <AnimatePresence>
          {isOrbitalStage && (
            <motion.button
              type="button"
              key="yadro-core-button"
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: isCoreHovered ? 1.12 : 1 }}
              exit={{ opacity: 0, scale: 1.45 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={(e) => {
                e.stopPropagation();
                onEnterUniverse();
              }}
              onMouseEnter={() => setIsCoreHovered(true)}
              onMouseLeave={() => setIsCoreHovered(false)}
              onFocus={() => setIsCoreHovered(true)}
              onBlur={() => setIsCoreHovered(false)}
              data-testid="cosmic-yadro-core-btn"
              aria-label={copy.coreHint}
              className="relative z-20 w-24 h-24 rounded-full cursor-pointer flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 group"
            >
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 border ${
                  isCoreHovered
                    ? 'bg-indigo-950/88 border-cyan-300/65 text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.55)]'
                    : 'bg-indigo-950/60 border-violet-300/35 text-violet-100/90'
                }`}
              >
                {copy.coreLabel}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Stage 1 Idle Unobtrusive Hover Tooltip */}
      <AnimatePresence>
        {showIdleTooltip && (
          <motion.div
            key="idle-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            data-testid="cosmic-idle-tooltip"
            className="pointer-events-none absolute bottom-2 z-30 flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-[#100a24]/88 px-3.5 py-1.5 text-xs font-medium text-violet-100 shadow-[0_8px_28px_rgba(76,29,149,0.45)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            <span>{copy.idleTooltip}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 1 Orbital Subtle Core Instruction + Quick Reset */}
      <AnimatePresence>
        {isOrbitalStage && (
          <motion.div
            key="orbital-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-1 z-30 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={onEnterUniverse}
              data-testid="cosmic-yadro-hint"
              className="flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-[#0c0a24]/90 px-3.5 py-1.5 text-xs font-medium text-cyan-100 hover:border-cyan-300/70 hover:bg-[#151138]/95 transition-colors shadow-[0_8px_24px_rgba(30,27,75,0.6)] cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
              <span>{copy.coreHint}</span>
            </button>
            <button
              type="button"
              onClick={onReassembleFromStage1}
              title={copy.reassemble}
              aria-label={copy.reassemble}
              data-testid="cosmic-stage1-reset-btn"
              className="p-1.5 rounded-full border border-violet-300/25 bg-[#0c0a24]/88 text-violet-200 hover:text-white hover:border-violet-300/60 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
