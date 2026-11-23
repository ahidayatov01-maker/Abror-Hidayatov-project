import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { CosmicStage } from './cosmicTypes';
import { COSMIC_SECTIONS, COSMIC_SECTIONS_BY_ID } from './cosmicSections';
import {
  BLACK_HOLE_WORLD_POS_DESKTOP,
  BLACK_HOLE_WORLD_POS_MOBILE,
  buildUniqueCrystalShardsData,
  computeBlackHoleVortexPosition,
  computeStage2OrbitalPosition,
  HERO_PLANET_WORLD_POS_DESKTOP,
  HERO_PLANET_WORLD_POS_MOBILE,
  STAGE3_FOCUS_WORLD_Z,
  STAGE3_VEIL_WORLD_Z,
  type CrystalShardGeometryData,
  type Vec3Tuple,
} from './CrystalGeometry';
import {
  createBlackHoleBundle,
  createCosmicPlanetsGroup,
  createDistantGalaxiesGroup,
  createEnergyCoreBundle,
  createNebulaBackdropGroup,
  createOpticalCrystalMaterials,
  createStarfieldMaterial,
  createStudioEnvironmentCubeTexture,
  detectWebGLCapabilities,
  type CrystalMaterialSet,
} from './CrystalMaterial';

interface CosmicUniverseCanvasProps {
  stage: CosmicStage;
  activeShardId: string | null;
  hoveredShardId: string | null;
  exploredShardIds: string[];
  corePulseNonce: number;
  isBlackHoleHovered: boolean;
  reducedMotion: boolean;
  onHoverShard: (shardId: string | null) => void;
  onHoverBlackHole: (hovered: boolean) => void;
  onSelectShard: (shardId: string) => void;
  onPulseCosmicCore: () => void;
  onStartBlackHoleExit: () => void;
  onBackdropReturn?: () => void;
}

export const CosmicUniverseCanvas: React.FC<CosmicUniverseCanvasProps> = ({
  stage,
  activeShardId,
  hoveredShardId,
  exploredShardIds,
  corePulseNonce,
  isBlackHoleHovered,
  reducedMotion,
  onHoverShard,
  onHoverBlackHole,
  onSelectShard,
  onPulseCosmicCore,
  onStartBlackHoleExit,
  onBackdropReturn,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const bgBlurLayerRef = useRef<HTMLDivElement>(null);
  const hoverLabelRef = useRef<HTMLDivElement>(null);
  const coreOverlayBtnRef = useRef<HTMLButtonElement>(null);
  const blackHoleOverlayBtnRef = useRef<HTMLButtonElement>(null);
  const [webglFallback, setWebglFallback] = useState(false);
  const [isCoreHoveredLocal, setIsCoreHoveredLocal] = useState(false);

  const wakeLoopRef = useRef<(() => void) | null>(null);

  const liveRef = useRef({
    stage,
    activeShardId,
    hoveredShardId,
    exploredSet: new Set<string>(exploredShardIds),
    reducedMotion,
    pointerNdcX: 0,
    pointerNdcY: 0,
    coreHovered: false,
    blackHoleHovered: isBlackHoleHovered,
    reassembleStartMs: 0,
    blackHoleExitStartMs: 0,
    enterStartMs: typeof performance !== 'undefined' ? performance.now() : 0,
    focusStartMs: 0,
    corePulseStartMs: 0,
    prevStage: stage,
    prevActiveShardId: activeShardId,
    prevCorePulseNonce: corePulseNonce,
    onHoverShard,
    onHoverBlackHole,
    onSelectShard,
    onPulseCosmicCore,
    onStartBlackHoleExit,
    onBackdropReturn,
    // Interactive Stage 6 crystal drag inspection state (zero React re-renders)
    isDraggingCrystal: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragVelX: 0,
    dragVelY: 0,
  });

  useEffect(() => {
    const prev = liveRef.current.stage;
    const prevShard = liveRef.current.activeShardId;
    const prevPulse = liveRef.current.prevCorePulseNonce;

    liveRef.current.stage = stage;
    liveRef.current.activeShardId = activeShardId;
    liveRef.current.hoveredShardId = hoveredShardId;
    liveRef.current.exploredSet = new Set(exploredShardIds);
    liveRef.current.reducedMotion = reducedMotion;
    liveRef.current.blackHoleHovered = isBlackHoleHovered;
    liveRef.current.onHoverShard = onHoverShard;
    liveRef.current.onHoverBlackHole = onHoverBlackHole;
    liveRef.current.onSelectShard = onSelectShard;
    liveRef.current.onPulseCosmicCore = onPulseCosmicCore;
    liveRef.current.onStartBlackHoleExit = onStartBlackHoleExit;
    liveRef.current.onBackdropReturn = onBackdropReturn;

    const now = performance.now();
    if (stage === 'reassembling' && prev !== 'reassembling') {
      liveRef.current.reassembleStartMs = now;
    }
    if (stage === 'black-hole-exit' && prev !== 'black-hole-exit') {
      liveRef.current.blackHoleExitStartMs = now;
    }
    if (stage === 'entering-universe' && prev !== 'entering-universe') {
      liveRef.current.enterStartMs = now;
    }
    if (corePulseNonce !== prevPulse) {
      liveRef.current.corePulseStartMs = now;
      liveRef.current.prevCorePulseNonce = corePulseNonce;
    }
    if (
      (stage === 'selecting-shard' && prev !== 'selecting-shard') ||
      (activeShardId && activeShardId !== prevShard)
    ) {
      liveRef.current.focusStartMs = now;
      liveRef.current.dragOffsetX = 0;
      liveRef.current.dragOffsetY = 0;
      liveRef.current.dragVelX = 0;
      liveRef.current.dragVelY = 0;
    }
    if (stage !== 'universe') {
      liveRef.current.coreHovered = false;
      setIsCoreHoveredLocal(false);
    }
    liveRef.current.prevStage = stage;
    liveRef.current.prevActiveShardId = activeShardId;

    if (stage !== prev || activeShardId !== prevShard || corePulseNonce !== prevPulse) {
      wakeLoopRef.current?.();
    }
  }, [
    stage,
    activeShardId,
    hoveredShardId,
    exploredShardIds,
    corePulseNonce,
    isBlackHoleHovered,
    reducedMotion,
    onHoverShard,
    onHoverBlackHole,
    onSelectShard,
    onPulseCosmicCore,
    onStartBlackHoleExit,
    onBackdropReturn,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const caps = detectWebGLCapabilities();
    if (!caps.supported) {
      setWebglFallback(true);
      return;
    }

    const isSoftwareGl = caps.isSoftware;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 220);
    camera.position.set(0, 0.4, 12.2);

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

    const pixelRatio = isSoftwareGl ? 0.78 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    const envCube = createStudioEnvironmentCubeTexture(isSoftwareGl ? 128 : 256);

    // =========================================================================
    // SCIENTIFIC 4-LAYER DEPTH PARALLAX HIERARCHY:
    //   farSpaceGroup  -> Deepest stars, distant galaxies, FBM nebulae (minimal parallax ~0.12x)
    //   midSpaceGroup  -> Intermediate stars, Hero Ringed Exoplanet, Astrophysically Lensed Black Hole (~0.45x)
    //   nearSpaceGroup -> Distinctive Multi-Layered Cosmic Center Core + 12 Floating Crystal Shards (~1.0x)
    //   dustGroup      -> Sparse Foreground Interstellar Dust Motes (~1.45x)
    // =========================================================================
    const farSpaceGroup = new THREE.Group();
    const midSpaceGroup = new THREE.Group();
    const nearSpaceGroup = new THREE.Group();
    const dustGroup = new THREE.Group();
    scene.add(farSpaceGroup, midSpaceGroup, nearSpaceGroup, dustGroup);

    // Deterministic seeded PRNG for reproducible astronomical star distributions
    let rngState = 88172645;
    const rand = () => {
      rngState = (rngState + 0x6d2b79f5) | 0;
      let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const starPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#dbeafe'),
      new THREE.Color('#e0e7ff'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#f5e8ff'),
      new THREE.Color('#fef3c7'),
    ];

    // 1A. FAR SPACE: Deep Atmospheric FBM Nebulae + 3 Distant Spiral Galaxies + Pinpoint Distant Starfield
    const nebulaBackdrop = createNebulaBackdropGroup();
    farSpaceGroup.add(nebulaBackdrop.group);

    const distantGalaxies = createDistantGalaxiesGroup();
    farSpaceGroup.add(distantGalaxies.group);

    const farStarCount = isSoftwareGl ? 360 : 880;
    const farStarPos = new Float32Array(farStarCount * 3);
    const farStarCol = new Float32Array(farStarCount * 3);
    const farStarSize = new Float32Array(farStarCount);
    const farStarPhase = new Float32Array(farStarCount);

    // 2 subtle distant star cluster centers for natural astronomical clumping
    const clusterCenters = [
      [-22, 12, -62],
      [18, -11, -68],
    ];
    for (let i = 0; i < farStarCount; i++) {
      if (i < farStarCount * 0.14) {
        // Subtle distant star cluster member
        const cl = clusterCenters[i % clusterCenters.length];
        const spread = 7.5 + rand() * 5.0;
        farStarPos[i * 3] = cl[0] + (rand() - 0.5) * spread * 1.4;
        farStarPos[i * 3 + 1] = cl[1] + (rand() - 0.5) * spread;
        farStarPos[i * 3 + 2] = cl[2] + (rand() - 0.5) * 10;
      } else {
        // Wide celestial vault distribution across huge dark expanse
        farStarPos[i * 3] = (rand() - 0.5) * 145;
        farStarPos[i * 3 + 1] = (rand() - 0.5) * 86;
        farStarPos[i * 3 + 2] = -46 - rand() * 52;
      }
      const col = starPalette[i % starPalette.length];
      // Natural astronomical magnitude distribution (most stars faint, rare bright points)
      const mag = Math.pow(rand(), 2.2);
      const bright = 0.28 + mag * 0.72;
      farStarCol[i * 3] = col.r * bright;
      farStarCol[i * 3 + 1] = col.g * bright;
      farStarCol[i * 3 + 2] = col.b * bright;
      farStarSize[i] = 1.0 + mag * 1.65;
      farStarPhase[i] = rand();
    }

    const farStarsGeo = new THREE.BufferGeometry();
    farStarsGeo.setAttribute('position', new THREE.BufferAttribute(farStarPos, 3));
    farStarsGeo.setAttribute('color', new THREE.BufferAttribute(farStarCol, 3));
    farStarsGeo.setAttribute('aSize', new THREE.BufferAttribute(farStarSize, 1));
    farStarsGeo.setAttribute('aPhase', new THREE.BufferAttribute(farStarPhase, 1));
    const farStarsMat = createStarfieldMaterial(pixelRatio, 0.88, 0.0);
    const farStarsPoints = new THREE.Points(farStarsGeo, farStarsMat);
    farSpaceGroup.add(farStarsPoints);

    // 1B. MID SPACE: Intermediate Stars + Hero Ringed Exoplanet (far left) + Lensed Black Hole (upper-right)
    const midStarCount = isSoftwareGl ? 130 : 280;
    const midStarPos = new Float32Array(midStarCount * 3);
    const midStarCol = new Float32Array(midStarCount * 3);
    const midStarSize = new Float32Array(midStarCount);
    const midStarPhase = new Float32Array(midStarCount);

    for (let i = 0; i < midStarCount; i++) {
      midStarPos[i * 3] = (rand() - 0.5) * 64;
      midStarPos[i * 3 + 1] = (rand() - 0.5) * 38;
      midStarPos[i * 3 + 2] = -15 - rand() * 24;
      const col = starPalette[(i + 2) % starPalette.length];
      const mag = Math.pow(rand(), 1.8);
      const bright = 0.42 + mag * 0.58;
      midStarCol[i * 3] = col.r * bright;
      midStarCol[i * 3 + 1] = col.g * bright;
      midStarCol[i * 3 + 2] = col.b * bright;
      midStarSize[i] = 0.9 + mag * 1.45;
      midStarPhase[i] = rand();
    }

    const midStarsGeo = new THREE.BufferGeometry();
    midStarsGeo.setAttribute('position', new THREE.BufferAttribute(midStarPos, 3));
    midStarsGeo.setAttribute('color', new THREE.BufferAttribute(midStarCol, 3));
    midStarsGeo.setAttribute('aSize', new THREE.BufferAttribute(midStarSize, 1));
    midStarsGeo.setAttribute('aPhase', new THREE.BufferAttribute(midStarPhase, 1));
    const midStarsMat = createStarfieldMaterial(pixelRatio, 0.82, 0.08);
    const midStarsPoints = new THREE.Points(midStarsGeo, midStarsMat);
    midSpaceGroup.add(midStarsPoints);

    // Single Hero Distant Ringed Exoplanet (far opposite diagonal from the Black Hole)
    const isInitialMobile = width < 1024;
    const initPlanetPos = isInitialMobile
      ? HERO_PLANET_WORLD_POS_MOBILE
      : HERO_PLANET_WORLD_POS_DESKTOP;
    const heroPlanet = createCosmicPlanetsGroup(
      [initPlanetPos[0], initPlanetPos[1], initPlanetPos[2]],
      isSoftwareGl
    );
    midSpaceGroup.add(heroPlanet.group);

    // Astrophysically Inspired Black Hole (Stage 5 Primary Cinematic Exit, generous dark negative space)
    const blackHole = createBlackHoleBundle(isSoftwareGl);
    const initBhPos = isInitialMobile ? BLACK_HOLE_WORLD_POS_MOBILE : BLACK_HOLE_WORLD_POS_DESKTOP;
    blackHole.group.position.set(initBhPos[0], initBhPos[1], initBhPos[2]);
    midSpaceGroup.add(blackHole.group);

    // 1C. FOREGROUND INTERSTELLAR DUST MOTES (Sparse, gentle independent drift, subtle near parallax)
    const dustCount = isSoftwareGl ? 36 : 68;
    const dustBasePos = new Float32Array(dustCount * 3);
    const dustCurrPos = new Float32Array(dustCount * 3);
    const dustVel = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    const dustSize = new Float32Array(dustCount);
    const dustPhase = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const x = (rand() - 0.5) * 18;
      const y = (rand() - 0.5) * 11;
      const z = 0.8 + rand() * 6.2;
      dustBasePos[i * 3] = x;
      dustBasePos[i * 3 + 1] = y;
      dustBasePos[i * 3 + 2] = z;
      dustCurrPos[i * 3] = x;
      dustCurrPos[i * 3 + 1] = y;
      dustCurrPos[i * 3 + 2] = z;

      // Distinct gentle drift velocities so particles never march uniformly in one direction
      dustVel[i * 3] = (rand() - 0.5) * 0.08;
      dustVel[i * 3 + 1] = (rand() - 0.5) * 0.06;
      dustVel[i * 3 + 2] = (rand() - 0.5) * 0.05;

      const c = i % 3 === 0 ? starPalette[3] : starPalette[4];
      const b = 0.25 + rand() * 0.35;
      dustCol[i * 3] = c.r * b;
      dustCol[i * 3 + 1] = c.g * b;
      dustCol[i * 3 + 2] = c.b * b;
      dustSize[i] = 0.85 + rand() * 1.1;
      dustPhase[i] = rand();
    }

    const dustGeo = new THREE.BufferGeometry();
    const dustPosAttr = new THREE.BufferAttribute(dustCurrPos, 3);
    dustPosAttr.setUsage(THREE.DynamicDrawUsage);
    dustGeo.setAttribute('position', dustPosAttr);
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
    dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1));
    const dustMat = createStarfieldMaterial(pixelRatio, 0.42, 0.88);
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    dustPoints.renderOrder = 6;
    dustGroup.add(dustPoints);

    // 2. NEAR SPACE: Distinctive Multi-Layered Cosmic Center Core + 12 Floating Volumetric Shards
    const energyCore = createEnergyCoreBundle(0.66, isSoftwareGl, 'cosmic');
    nearSpaceGroup.add(energyCore.group);

    // Stage 6 Subtle Depth Dimming Veil Plane (strictly between orbital shards z<=2.1 and focused crystal z=4.25)
    const veilGeo = new THREE.PlaneGeometry(54, 34);
    const veilMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#04020e'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const veilMesh = new THREE.Mesh(veilGeo, veilMat);
    veilMesh.position.set(0, 0, STAGE3_VEIL_WORLD_Z);
    veilMesh.renderOrder = 8;
    veilMesh.visible = false;
    scene.add(veilMesh);

    // 3. The 12 Persistent Volumetric Diamond-Sector Crystal Shards (freely suspended — NO unnatural constellation web)
    const shardsData = buildUniqueCrystalShardsData();
    const shardHitTargets: THREE.Object3D[] = [];
    const specialHitTargets: THREE.Object3D[] = [energyCore.hitSphere, blackHole.hitSphere];

    interface UniverseShardRuntime {
      id: string;
      index: number;
      group: THREE.Group;
      backMesh: THREE.Mesh;
      frontMesh: THREE.Mesh;
      edgeMesh: THREE.LineSegments;
      hitMesh: THREE.Mesh;
      geo: THREE.BufferGeometry;
      edgeGeo: THREE.BufferGeometry;
      hitGeo: THREE.BufferGeometry;
      hitMat: THREE.MeshBasicMaterial;
      mats: CrystalMaterialSet;
      baseEdgeColor: THREE.Color;
      exploredEdgeColor: THREE.Color;
      data: CrystalShardGeometryData;
      currentPos: THREE.Vector3;
      focusOriginPos: THREE.Vector3;
      focusOriginScale: number;
      vortexOrigin: Vec3Tuple;
      currentScale: number;
      currentHighlight: number;
      currentExplored: number;
      currentDim: number;
      orbitPos: THREE.Vector3;
    }

    const shardRuntimes: UniverseShardRuntime[] = shardsData.map((data, idx) => {
      const section = COSMIC_SECTIONS[idx];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
      geo.setAttribute('aFacetMeta', new THREE.BufferAttribute(data.facetMeta, 4));
      geo.computeBoundingSphere();

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.BufferAttribute(data.edgePositions, 3));

      const mats = createOpticalCrystalMaterials(envCube, section.accentHex, isSoftwareGl);
      const group = new THREE.Group();

      const backMesh = new THREE.Mesh(geo, mats.backMat);
      backMesh.renderOrder = 6;
      backMesh.visible = !isSoftwareGl;
      const frontMesh = new THREE.Mesh(geo, mats.frontMat);
      frontMesh.renderOrder = 7;
      const edgeMesh = new THREE.LineSegments(edgeGeo, mats.edgeFrontMat);
      edgeMesh.scale.setScalar(1.002);
      edgeMesh.renderOrder = 8;

      // Generous invisible raycast proxy on Layer 2 (never rasterized by camera Layer 0)
      const hitGeo = new THREE.SphereGeometry(Math.max(0.76, data.boundingRadius * 1.46), 10, 10);
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false,
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.layers.set(2);
      hitMesh.userData = { shardId: section.id, shardIndex: idx };
      shardHitTargets.push(hitMesh);

      group.add(backMesh, frontMesh, edgeMesh, hitMesh);
      nearSpaceGroup.add(group);

      const [initX, initY, initZ] = computeStage2OrbitalPosition(data, 0, 1, isInitialMobile);
      const initialPos = new THREE.Vector3(initX, initY, initZ);
      group.position.copy(initialPos);

      return {
        id: section.id,
        index: idx,
        group,
        backMesh,
        frontMesh,
        edgeMesh,
        hitMesh,
        geo,
        edgeGeo,
        hitGeo,
        hitMat,
        mats,
        baseEdgeColor: (mats.edgeFrontMat.uniforms.uColor.value as THREE.Color).clone(),
        exploredEdgeColor: new THREE.Color('#67e8f9'),
        data,
        currentPos: initialPos.clone(),
        focusOriginPos: initialPos.clone(),
        focusOriginScale: data.universeScale,
        vortexOrigin: [initX, initY, initZ],
        currentScale: data.universeScale,
        currentHighlight: 0,
        currentExplored: 0,
        currentDim: 0,
        orbitPos: initialPos.clone(),
      };
    });

    // Keep veilMesh permanently disabled (we use subtle background blur instead of black darkening)
    veilMesh.visible = false;

    // Raycasting on Layer 2 only (invisible hit proxies) & reusable scratch math helpers
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(2);
    const pointerVec = new THREE.Vector2();
    const targetPosVec = new THREE.Vector3();
    const projectVec = new THREE.Vector3();
    const bhWorldVec = new THREE.Vector3();
    const coreWorldVec = new THREE.Vector3();
    const camLookTarget = new THREE.Vector3(0, 0, 0);
    const tempEdgeColor = new THREE.Color();

    let localHoveredId: string | null = null;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastDragX = 0;
    let lastDragY = 0;
    let pointerDownHitShardId: string | null = null;
    let pointerDownWasCore = false;
    let pointerDownWasBlackHole = false;
    let capturedVortexOrigins = false;
    let capturedFocusShardId: string | null = null;

    interface RaycastResult {
      shardId: string | null;
      isCore: boolean;
      isBlackHole: boolean;
    }

    const performRaycast = (clientX: number, clientY: number): RaycastResult => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return { shardId: null, isCore: false, isBlackHole: false };
      }
      pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerVec, camera);

      // Strict Stage 6 priority: test the 12 crystal shards FIRST so a shard click NEVER triggers core or black hole
      const shardHits = raycaster.intersectObjects(shardHitTargets, false);
      if (shardHits.length > 0 && shardHits[0].object.userData?.shardId) {
        return {
          shardId: shardHits[0].object.userData.shardId as string,
          isCore: false,
          isBlackHole: false,
        };
      }

      if (liveRef.current.stage === 'universe') {
        const specialHits = raycaster.intersectObjects(specialHitTargets, false);
        if (specialHits.length > 0) {
          const ud = specialHits[0].object.userData;
          if (ud?.isEnergyCore) {
            return { shardId: null, isCore: true, isBlackHole: false };
          }
          if (ud?.isBlackHole) {
            return { shardId: null, isCore: false, isBlackHole: true };
          }
        }
      }

      return { shardId: null, isCore: false, isBlackHole: false };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      liveRef.current.pointerNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      liveRef.current.pointerNdcY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      if (liveRef.current.isDraggingCrystal && liveRef.current.stage === 'shard-detail') {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        liveRef.current.dragOffsetY += dx * 0.01;
        liveRef.current.dragOffsetX = Math.max(
          -1.15,
          Math.min(1.15, liveRef.current.dragOffsetX + dy * 0.008)
        );
        liveRef.current.dragVelY = dx * 0.012;
        liveRef.current.dragVelX = dy * 0.01;
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (liveRef.current.stage === 'shard-detail') {
        const hit = performRaycast(e.clientX, e.clientY);
        const onFocused = hit.shardId === liveRef.current.activeShardId;
        renderer.domElement.style.cursor = onFocused ? 'grab' : 'pointer';
        return;
      }

      if (liveRef.current.stage !== 'universe') {
        if (localHoveredId !== null) {
          localHoveredId = null;
          liveRef.current.onHoverShard(null);
        }
        if (liveRef.current.coreHovered) {
          liveRef.current.coreHovered = false;
          setIsCoreHoveredLocal(false);
        }
        if (liveRef.current.blackHoleHovered) {
          liveRef.current.onHoverBlackHole(false);
        }
        renderer.domElement.style.cursor = 'default';
        return;
      }

      const hit = performRaycast(e.clientX, e.clientY);
      if (hit.shardId !== localHoveredId) {
        localHoveredId = hit.shardId;
        liveRef.current.onHoverShard(hit.shardId);
      }
      const nextCoreHover = hit.isCore && !hit.shardId;
      if (nextCoreHover !== liveRef.current.coreHovered) {
        liveRef.current.coreHovered = nextCoreHover;
        setIsCoreHoveredLocal(nextCoreHover);
      }
      const nextBhHover = hit.isBlackHole && !hit.shardId && !hit.isCore;
      if (nextBhHover !== liveRef.current.blackHoleHovered) {
        liveRef.current.onHoverBlackHole(nextBhHover);
      }
      renderer.domElement.style.cursor =
        hit.shardId || nextCoreHover || nextBhHover ? 'pointer' : 'default';
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      lastDragX = e.clientX;
      lastDragY = e.clientY;

      const hit = performRaycast(e.clientX, e.clientY);
      pointerDownHitShardId = hit.shardId;
      pointerDownWasCore = hit.isCore;
      pointerDownWasBlackHole = hit.isBlackHole;

      if (
        liveRef.current.stage === 'shard-detail' &&
        hit.shardId === liveRef.current.activeShardId
      ) {
        liveRef.current.isDraggingCrystal = true;
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const wasDragging = liveRef.current.isDraggingCrystal;
      liveRef.current.isDraggingCrystal = false;

      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);

      if (liveRef.current.stage === 'shard-detail') {
        renderer.domElement.style.cursor = 'default';
        if (!wasDragging && dist <= 12 && !pointerDownHitShardId) {
          liveRef.current.onBackdropReturn?.();
        }
        return;
      }

      if (liveRef.current.stage !== 'universe') return;
      if (dist > 14) return;
      const hit = performRaycast(e.clientX, e.clientY);
      if (hit.shardId) {
        liveRef.current.onSelectShard(hit.shardId);
      } else if (hit.isCore && pointerDownWasCore) {
        liveRef.current.onPulseCosmicCore();
      } else if (hit.isBlackHole && pointerDownWasBlackHole) {
        liveRef.current.onStartBlackHoleExit();
      }
    };

    const handlePointerCancel = () => {
      liveRef.current.isDraggingCrystal = false;
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerCancel);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;
    let smoothParallaxX = 0;
    let smoothParallaxY = 0;
    let smoothFocusDim = 0;
    let smoothCoreHover = 0;
    let smoothBlackHoleHover = 0;

    const getSoftwareCooldownMs = () => {
      const st = liveRef.current.stage;
      if (
        st === 'entering-universe' ||
        st === 'selecting-shard' ||
        st === 'returning-to-universe' ||
        st === 'black-hole-exit' ||
        st === 'reassembling'
      ) {
        return 18;
      }
      return 48;
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
          if (status === gl.UNSIGNALED && performance.now() - pollStart < 150) {
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

      if (document.hidden) {
        frameId = window.setTimeout(tick, 180);
        return;
      }

      const s = liveRef.current;
      const motionScale = s.reducedMotion ? 0.16 : 1.0;
      elapsedTime += dt;

      const isFocused = s.stage === 'selecting-shard' || s.stage === 'shard-detail';
      const isReassembling = s.stage === 'reassembling';
      const isBlackHoleExit = s.stage === 'black-hole-exit';
      const isEntering = s.stage === 'entering-universe';

      const reDurMs = s.reducedMotion ? 260 : 540;
      const exitDurMs = s.reducedMotion ? 500 : 1650;
      const entDurMs = s.reducedMotion ? 650 : 2100;
      // Fast, responsive crystal selection: 0.56s (560ms) main approach + 0.18s gentle settling
      const focusDurMs = s.reducedMotion ? 180 : 560;
      const pulseDurMs = s.reducedMotion ? 450 : 1250;

      const reassembleT = isReassembling
        ? Math.min(1, Math.max(0, (now - s.reassembleStartMs) / reDurMs))
        : 0;
      const easeReassemble = reassembleT * reassembleT * (3 - 2 * reassembleT);

      const blackHoleExitT = isBlackHoleExit
        ? Math.min(1, Math.max(0, (now - s.blackHoleExitStartMs) / exitDurMs))
        : 0;
      const easeBlackHoleExit = blackHoleExitT * blackHoleExitT * (3 - 2 * blackHoleExitT);

      if (isBlackHoleExit && !capturedVortexOrigins) {
        for (let i = 0; i < shardRuntimes.length; i++) {
          const cp = shardRuntimes[i].currentPos;
          shardRuntimes[i].vortexOrigin = [cp.x, cp.y, cp.z];
        }
        capturedVortexOrigins = true;
      } else if (!isBlackHoleExit) {
        capturedVortexOrigins = false;
      }

      // Snapshot exact shard starting positions at the moment selection begins so the 0.56s approach trajectory is immediate & direct
      if (isFocused && s.activeShardId !== capturedFocusShardId) {
        for (let i = 0; i < shardRuntimes.length; i++) {
          shardRuntimes[i].focusOriginPos.copy(shardRuntimes[i].currentPos);
          shardRuntimes[i].focusOriginScale = shardRuntimes[i].currentScale;
        }
        capturedFocusShardId = s.activeShardId;
      } else if (!isFocused && capturedFocusShardId !== null) {
        capturedFocusShardId = null;
      }

      // Synchronized arrival glide inside the cosmic universe across the 2.10s transition
      const enterRaw = isEntering
        ? Math.min(1, Math.max(0, (now - s.enterStartMs) / entDurMs))
        : 1;
      const arrivalT = isEntering
        ? Math.min(1, Math.max(0, (enterRaw - 0.36) / 0.64))
        : 1;
      const easeArrival = 1 - Math.pow(1 - arrivalT, 3);

      const focusT = isFocused
        ? Math.min(1, Math.max(0, (now - s.focusStartMs) / focusDurMs))
        : 0;
      // Smooth quartic acceleration + critically damped arrival without sluggish lag or overshoot
      const easeFocus = 1 - Math.pow(1 - focusT, 3.8);
      // Gentle 0.18s post-approach micro-settling envelope
      const settleElapsedSec = isFocused
        ? Math.max(0, (now - s.focusStartMs - focusDurMs * 0.82) / 1000)
        : 0;
      const settleDamper =
        settleElapsedSec > 0 && settleElapsedSec < 0.25
          ? Math.sin((settleElapsedSec / 0.22) * Math.PI) * Math.exp(-settleElapsedSec * 12) * 0.018
          : 0;

      // Stage 4 Radial Energy Pulse wave expanding from the Cosmic Center Core
      let radialPulseProgress = 0;
      if (s.corePulseStartMs > 0) {
        const rawPulse = (now - s.corePulseStartMs) / pulseDurMs;
        if (rawPulse >= 0 && rawPulse < 1) {
          radialPulseProgress = rawPulse;
        } else {
          s.corePulseStartMs = 0;
        }
      }
      const pulseWaveRadius = radialPulseProgress * 10.2;

      // Smooth inertial camera & depth-proportional multi-layer parallax
      const isMobile = width < 1024;
      const parallaxStrength =
        isFocused || isReassembling || isBlackHoleExit ? 0.08 : isMobile ? 0.25 : 1.0;
      smoothParallaxX = THREE.MathUtils.damp(
        smoothParallaxX,
        s.pointerNdcX * parallaxStrength,
        3.2,
        dt
      );
      smoothParallaxY = THREE.MathUtils.damp(
        smoothParallaxY,
        -s.pointerNdcY * parallaxStrength,
        3.2,
        dt
      );

      // True depth-ordered parallax speeds:
      // Distant celestial vault barely shifts; mid planets/black hole shift moderately; near shards & foreground dust shift clearly!
      farSpaceGroup.position.set(smoothParallaxX * -0.14, smoothParallaxY * -0.09, 0);
      midSpaceGroup.position.set(smoothParallaxX * -0.52, smoothParallaxY * -0.32, 0);
      nearSpaceGroup.position.set(smoothParallaxX * 0.22, smoothParallaxY * 0.14, 0);
      dustGroup.position.set(smoothParallaxX * 0.92, smoothParallaxY * 0.56, 0);

      smoothCoreHover = THREE.MathUtils.damp(
        smoothCoreHover,
        s.stage === 'universe' && s.coreHovered ? 1 : 0,
        7.0,
        dt
      );
      smoothBlackHoleHover = THREE.MathUtils.damp(
        smoothBlackHoleHover,
        s.stage === 'universe' && s.blackHoleHovered ? 1 : 0,
        7.0,
        dt
      );

      // Decay drag inspection inertia smoothly when released
      if (!s.isDraggingCrystal) {
        s.dragOffsetY += s.dragVelY;
        s.dragOffsetX = Math.max(-1.15, Math.min(1.15, s.dragOffsetX + s.dragVelX));
        const damping = Math.exp(-5.5 * dt);
        s.dragVelX *= damping;
        s.dragVelY *= damping;
        s.dragOffsetX = THREE.MathUtils.damp(s.dragOffsetX, 0, 1.4, dt);
      }

      smoothFocusDim = isFocused
        ? Math.max(easeFocus, THREE.MathUtils.damp(smoothFocusDim, 1.0, 9.0, dt))
        : THREE.MathUtils.damp(smoothFocusDim, 0.0, 9.0, dt);

      // Responsive placement for well-separated Hero Exoplanet & Black Hole
      const bhTargetTuple = isMobile ? BLACK_HOLE_WORLD_POS_MOBILE : BLACK_HOLE_WORLD_POS_DESKTOP;
      blackHole.group.position.set(bhTargetTuple[0], bhTargetTuple[1], bhTargetTuple[2]);
      blackHole.group.getWorldPosition(bhWorldVec);

      const planetTuple = isMobile ? HERO_PLANET_WORLD_POS_MOBILE : HERO_PLANET_WORLD_POS_DESKTOP;
      const planetChild = heroPlanet.group.children[0];
      if (planetChild) {
        planetChild.position.set(planetTuple[0], planetTuple[1], planetTuple[2]);
      }

      const baseCamZ = isMobile ? 14.8 : 12.2;
      const enterZBoost = isEntering ? (1 - easeArrival) * 6.8 : 0;

      if (isBlackHoleExit) {
        // Stage 5: Cinematic camera acceleration toward & into the Black Hole event horizon
        const camDive = easeBlackHoleExit * easeBlackHoleExit * 0.35 + easeBlackHoleExit * 0.65;
        const targetFov = 46 + camDive * 28;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = targetFov;
          camera.updateProjectionMatrix();
        }
        camera.position.set(
          THREE.MathUtils.lerp(smoothParallaxX * 0.48, bhWorldVec.x, camDive),
          THREE.MathUtils.lerp(0.38 + smoothParallaxY * 0.28, bhWorldVec.y, camDive),
          THREE.MathUtils.lerp(baseCamZ, bhWorldVec.z + 0.65, camDive)
        );
        camLookTarget.set(
          THREE.MathUtils.lerp(0, bhWorldVec.x, Math.min(1, camDive * 1.35)),
          THREE.MathUtils.lerp(0, bhWorldVec.y, Math.min(1, camDive * 1.35)),
          THREE.MathUtils.lerp(0, bhWorldVec.z, Math.min(1, camDive * 1.35))
        );
        camera.lookAt(camLookTarget);
      } else {
        if (Math.abs(camera.fov - 46) > 0.05) {
          camera.fov = 46;
          camera.updateProjectionMatrix();
        }
        camera.position.set(
          smoothParallaxX * 0.48,
          0.38 + smoothParallaxY * 0.28,
          baseCamZ + enterZBoost
        );
        camLookTarget.set(smoothParallaxX * 0.12, smoothParallaxY * 0.08, 0);
        camera.lookAt(camLookTarget);
      }

      const sceneExitFade = 1 - Math.max(0, (easeBlackHoleExit - 0.72) / 0.28);

      // Update Deep Space Layers — CRITICAL: preserve 100% of original cosmic brightness when a crystal is selected!
      // Separation is achieved via subtle depth-of-field background blur (3-6px), NEVER by darkening or black overlays.
      nebulaBackdrop.update(
        elapsedTime,
        0,
        (1 - easeReassemble * 0.72) * sceneExitFade,
        s.reducedMotion
      );
      distantGalaxies.update(0, (1 - easeReassemble * 0.75) * sceneExitFade);

      farStarsMat.uniforms.uTime.value = elapsedTime * motionScale;
      farStarsMat.uniforms.uOpacity.value =
        0.88 * (1 - easeReassemble * 0.75) * sceneExitFade;
      // Distant celestial sphere stays nearly stationary (tiny 0.002 rad/s drift for scale realism)
      farStarsPoints.rotation.y = elapsedTime * 0.002 * motionScale;

      midStarsMat.uniforms.uTime.value = elapsedTime * motionScale;
      midStarsMat.uniforms.uOpacity.value =
        0.82 * (1 - easeReassemble * 0.78) * sceneExitFade;
      midStarsPoints.rotation.y = elapsedTime * 0.005 * motionScale;

      // Update independent drifting foreground interstellar dust motes (pulled gently into Black Hole on exit)
      dustMat.uniforms.uTime.value = elapsedTime * motionScale;
      dustMat.uniforms.uOpacity.value =
        0.42 * (1 - easeReassemble * 0.85) * sceneExitFade;
      for (let i = 0; i < dustCount; i++) {
        const bx = dustBasePos[i * 3];
        const by = dustBasePos[i * 3 + 1];
        const bz = dustBasePos[i * 3 + 2];
        const dx = bx + Math.sin(elapsedTime * 0.25 * motionScale + i) * 0.45 + dustVel[i * 3] * elapsedTime * motionScale;
        const dy = by + Math.cos(elapsedTime * 0.22 * motionScale + i * 1.3) * 0.35 + dustVel[i * 3 + 1] * elapsedTime * motionScale;
        const dz = bz + Math.sin(elapsedTime * 0.18 * motionScale + i * 0.7) * 0.3;
        if (isBlackHoleExit) {
          const v = computeBlackHoleVortexPosition([dx, dy, dz], bhTargetTuple, easeBlackHoleExit, i);
          dustCurrPos[i * 3] = v[0];
          dustCurrPos[i * 3 + 1] = v[1];
          dustCurrPos[i * 3 + 2] = v[2];
        } else {
          dustCurrPos[i * 3] = ((dx + 10) % 20 + 20) % 20 - 10;
          dustCurrPos[i * 3 + 1] = ((dy + 6) % 12 + 12) % 12 - 6;
          dustCurrPos[i * 3 + 2] = dz;
        }
      }
      dustPosAttr.needsUpdate = true;

      // Update Hero Ringed Exoplanet & Astrophysically Lensed Black Hole (preserve full illumination!)
      heroPlanet.update(
        elapsedTime,
        0,
        (1 - easeReassemble * 0.82) * (1 - easeBlackHoleExit * 0.55),
        s.reducedMotion
      );

      blackHole.update({
        elapsed: elapsedTime,
        hover: smoothBlackHoleHover,
        exitProgress: easeBlackHoleExit,
        dim: 0,
        opacity: 1 - easeReassemble * 0.85,
        cameraQuaternion: camera.quaternion,
        reducedMotion: s.reducedMotion,
      });

      // Keep the dark 3D veil permanently hidden — never darken the cosmic background!
      veilMat.opacity = 0;
      veilMesh.visible = false;

      // Update Distinctive Cosmic Center Core (pulls into Black Hole during Stage 5 exit)
      if (isBlackHoleExit) {
        const coreVortex = computeBlackHoleVortexPosition([0, 0, 0], bhTargetTuple, easeBlackHoleExit, 0);
        energyCore.group.position.set(coreVortex[0], coreVortex[1], coreVortex[2]);
      } else {
        energyCore.group.position.set(0, 0, 0);
      }
      energyCore.group.getWorldPosition(coreWorldVec);

      const coreOpacity = (1 - easeReassemble * 0.65) * (1 - easeBlackHoleExit * 0.9);
      energyCore.group.scale.setScalar(
        (isMobile ? 0.84 : 1.0) *
          (1.0 + easeReassemble * 0.35) *
          Math.max(0.14, 1 - easeBlackHoleExit * 0.84)
      );
      energyCore.update({
        elapsed: elapsedTime,
        hover: smoothCoreHover,
        opacity: coreOpacity,
        dim: 0,
        rippleProgress: radialPulseProgress,
        radialPulseProgress,
        cameraQuaternion: camera.quaternion,
        reducedMotion: s.reducedMotion,
      });

      // Frustum-exact Stage 6 focused crystal target coordinates
      const focusWorldZ = STAGE3_FOCUS_WORLD_Z;
      const focusDist = Math.max(2, camera.position.z - focusWorldZ);
      const focusHalfH = focusDist * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const focusHalfW = focusHalfH * (width / Math.max(1, height));

      const focusWorldX = isMobile ? 0.0 : -focusHalfW * 0.54;
      const focusWorldY = isMobile ? focusHalfH * 0.52 : focusHalfH * 0.14;

      // Update the subtle 4.5px background depth-of-field blur overlay mask so the focused crystal stays 100% sharp
      if (bgBlurLayerRef.current) {
        if (isFocused || smoothFocusDim > 0.01) {
          projectVec.set(focusWorldX, focusWorldY, focusWorldZ).project(camera);
          const pctX = ((projectVec.x * 0.5 + 0.5) * 100).toFixed(1);
          const pctY = ((-projectVec.y * 0.5 + 0.5) * 100).toFixed(1);
          const clearRadiusPx = isMobile ? 132 : 205;
          const featherRadiusPx = isMobile ? 185 : 285;
          const maskStr = `radial-gradient(circle ${featherRadiusPx}px at ${pctX}% ${pctY}%, transparent 0px, transparent ${clearRadiusPx}px, rgba(0,0,0,0.55) ${Math.round((clearRadiusPx + featherRadiusPx) * 0.5)}px, black ${featherRadiusPx}px)`;
          const blurOpacity = isFocused ? Math.max(0.92, smoothFocusDim) : smoothFocusDim;
          bgBlurLayerRef.current.style.opacity = blurOpacity.toFixed(3);
          bgBlurLayerRef.current.style.maskImage = maskStr;
          bgBlurLayerRef.current.style.webkitMaskImage = maskStr;
        } else {
          bgBlurLayerRef.current.style.opacity = '0';
        }
      }

      let hoveredRuntime: UniverseShardRuntime | null = null;

      // Dynamic core point-light intensity illuminating all 12 crystal fragments (preserved during focus)
      const coreLightIntensity =
        2.1 +
        smoothCoreHover * 0.65 +
        (radialPulseProgress > 0.001 ? 1.8 * Math.sin(radialPulseProgress * Math.PI) : 0);

      for (let i = 0; i < shardRuntimes.length; i++) {
        const item = shardRuntimes[i];
        const d = item.data;

        const [ox, oy, oz] = computeStage2OrbitalPosition(d, elapsedTime, motionScale, isMobile);
        item.orbitPos.set(ox, oy, oz);

        const isSelected = isFocused && s.activeShardId === item.id;
        const isExplored = s.exploredSet.has(item.id);
        const isHovered =
          s.stage === 'universe' &&
          (s.hoveredShardId === item.id || localHoveredId === item.id);
        if (isHovered) {
          hoveredRuntime = item;
        }

        if (isBlackHoleExit) {
          const [vx, vy, vz] = computeBlackHoleVortexPosition(
            item.vortexOrigin,
            bhTargetTuple,
            easeBlackHoleExit,
            i
          );
          item.currentPos.set(vx, vy, vz);
          item.currentScale = THREE.MathUtils.lerp(d.universeScale, 0.08, easeBlackHoleExit);
        } else if (isReassembling) {
          targetPosVec.set(d.homeOffset[0] * 0.9, d.homeOffset[1] * 0.9, d.homeOffset[2] * 0.9);
          item.currentPos.lerpVectors(item.orbitPos, targetPosVec, easeReassemble);
          item.currentScale = THREE.MathUtils.lerp(d.universeScale, 0.72, easeReassemble);
        } else if (isSelected) {
          targetPosVec.set(
            focusWorldX - nearSpaceGroup.position.x,
            focusWorldY - nearSpaceGroup.position.y + settleDamper,
            focusWorldZ
          );
          item.currentPos.lerpVectors(item.focusOriginPos, targetPosVec, easeFocus);
          const targetFocusScale = (isMobile ? 1.22 : 1.96) + settleDamper * 0.4;
          item.currentScale = THREE.MathUtils.lerp(
            item.focusOriginScale,
            targetFocusScale,
            easeFocus
          );
        } else {
          const hoverScaleBoost = isHovered ? 1.15 : 1.0;
          const mobileShardScale = isMobile ? 0.78 : 1.0;
          const targetOrbitalScale = d.universeScale * hoverScaleBoost * mobileShardScale;
          if (isFocused) {
            item.currentPos.lerpVectors(item.focusOriginPos, item.orbitPos, easeFocus);
            item.currentScale = THREE.MathUtils.lerp(
              item.focusOriginScale,
              targetOrbitalScale,
              easeFocus
            );
          } else {
            item.currentPos.lerp(item.orbitPos, 1 - Math.exp(-8.5 * dt));
            item.currentScale = THREE.MathUtils.damp(
              item.currentScale,
              targetOrbitalScale,
              8.5,
              dt
            );
          }
        }

        item.group.position.copy(item.currentPos);
        item.group.scale.setScalar(item.currentScale);

        if (isSelected) {
          item.backMesh.visible = !isSoftwareGl;
          item.backMesh.renderOrder = 10;
          item.frontMesh.renderOrder = 11;
          item.edgeMesh.renderOrder = 12;
        } else {
          item.backMesh.visible = !isSoftwareGl;
          item.backMesh.renderOrder = 6;
          item.frontMesh.renderOrder = 7;
          item.edgeMesh.renderOrder = 8;
        }

        // Restrained, serene suspended poise; when selected, smoothly orient best facets toward camera
        const spinMult = isBlackHoleExit ? 4.2 : isReassembling ? -2.0 : 1.0;
        const orbitalRx =
          d.separationImpulseRot[0] * 0.65 +
          Math.sin(elapsedTime * 0.32 * motionScale + i * 1.1) * 0.12 +
          elapsedTime * d.spinRate[0] * motionScale * spinMult;
        const orbitalRy =
          d.separationImpulseRot[1] * 0.75 +
          elapsedTime * d.spinRate[1] * motionScale * spinMult;
        const orbitalRz =
          d.separationImpulseRot[2] * 0.65 +
          Math.cos(elapsedTime * 0.28 * motionScale + i * 0.9) * 0.1 +
          elapsedTime * d.spinRate[2] * motionScale * spinMult;

        if (isSelected) {
          const presentRx =
            0.16 + Math.sin(elapsedTime * 0.45 * motionScale) * 0.05 + s.dragOffsetX;
          const presentRy =
            d.universeOrbitAngle * 0.24 +
            elapsedTime * 0.045 * motionScale +
            s.dragOffsetY;
          const presentRz = Math.cos(elapsedTime * 0.38 * motionScale) * 0.04;

          item.group.rotation.x = THREE.MathUtils.lerp(orbitalRx, presentRx, easeFocus);
          item.group.rotation.y = THREE.MathUtils.lerp(orbitalRy, presentRy, easeFocus);
          item.group.rotation.z = THREE.MathUtils.lerp(orbitalRz, presentRz, easeFocus);
        } else {
          item.group.rotation.set(orbitalRx, orbitalRy, orbitalRz);
        }

        // Stage 4 Radial Energy Wave Illumination as the Cosmic Center Core pulse sweeps past each crystal
        let pulseIllum = 0;
        if (radialPulseProgress > 0.001 && !isFocused) {
          const shardDistFromCore = item.currentPos.length();
          const delta = Math.abs(shardDistFromCore - pulseWaveRadius);
          pulseIllum = Math.exp(-(delta * delta) / 2.2) * (1 - radialPulseProgress * 0.42);
        }

        const targetHighlight = isSelected ? 1.0 : isHovered ? 0.85 : pulseIllum;
        const targetDim = isFocused && !isSelected ? 0.15 : 0.0;
        item.currentHighlight = isSelected
          ? Math.max(easeFocus, item.currentHighlight)
          : Math.max(pulseIllum, THREE.MathUtils.damp(item.currentHighlight, targetHighlight, 9, dt));
        item.currentDim = THREE.MathUtils.damp(item.currentDim, targetDim, 9, dt);
        item.currentExplored = THREE.MathUtils.damp(
          item.currentExplored,
          isExplored ? 1.0 : 0.0,
          6,
          dt
        );

        const flashAmount = Math.min(
          1,
          (isReassembling ? Math.sin(easeReassemble * Math.PI) * 0.85 : 0) +
            pulseIllum * 0.9 +
            (isBlackHoleExit ? easeBlackHoleExit * 0.82 : 0)
        );
        const shardOpacity = isBlackHoleExit ? Math.max(0, 1 - Math.pow(easeBlackHoleExit, 2.2)) : 1;

        item.mats.setCoreLight(
          coreWorldVec,
          isSelected ? 1.85 : coreLightIntensity + pulseIllum * 2.4
        );
        item.mats.backMat.uniforms.uTime.value = elapsedTime;
        item.mats.backMat.uniforms.uHighlight.value = item.currentHighlight;
        item.mats.backMat.uniforms.uExplored.value = item.currentExplored;
        item.mats.backMat.uniforms.uDim.value = item.currentDim;
        item.mats.backMat.uniforms.uInternalEnergy.value = 0.36 + pulseIllum * 0.75 + item.currentHighlight * 0.34;
        item.mats.backMat.uniforms.uFractureFlash.value = flashAmount;
        item.mats.backMat.uniforms.uOpacity.value = shardOpacity;
        item.mats.backMat.uniforms.uPointer.value.set(s.pointerNdcX, s.pointerNdcY);

        item.mats.frontMat.uniforms.uTime.value = elapsedTime;
        item.mats.frontMat.uniforms.uHighlight.value = item.currentHighlight;
        item.mats.frontMat.uniforms.uExplored.value = item.currentExplored;
        item.mats.frontMat.uniforms.uDim.value = item.currentDim;
        item.mats.frontMat.uniforms.uInternalEnergy.value = 0.36 + pulseIllum * 0.75 + item.currentHighlight * 0.34;
        item.mats.frontMat.uniforms.uFractureFlash.value = flashAmount;
        item.mats.frontMat.uniforms.uOpacity.value = shardOpacity;
        item.mats.frontMat.uniforms.uPointer.value.set(s.pointerNdcX, s.pointerNdcY);

        tempEdgeColor
          .copy(item.baseEdgeColor)
          .lerp(item.exploredEdgeColor, Math.min(1, item.currentExplored * 0.5 + pulseIllum * 0.65));
        (item.mats.edgeFrontMat.uniforms.uColor.value as THREE.Color).copy(tempEdgeColor);
        item.mats.edgeFrontMat.uniforms.uOpacity.value =
          (0.22 + item.currentExplored * 0.12 + item.currentHighlight * 0.24 + flashAmount * 0.32) *
          (1 - item.currentDim * 0.15) *
          shardOpacity;
      }

      // Project hovered shard position to screen coordinates
      if (hoverLabelRef.current) {
        if (hoveredRuntime && s.stage === 'universe') {
          hoveredRuntime.group.getWorldPosition(projectVec);
          projectVec.project(camera);
          const sx = (projectVec.x * 0.5 + 0.5) * width;
          const sy = (-projectVec.y * 0.5 + 0.5) * height - 48;
          const clampedX = Math.max(96, Math.min(width - 96, sx));
          const clampedY = Math.max(76, Math.min(height - 110, sy));
          hoverLabelRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0) translate(-50%, -100%)`;
          hoverLabelRef.current.style.opacity = '1';
        } else {
          hoverLabelRef.current.style.opacity = '0';
        }
      }

      // Sync accessible DOM buttons for Cosmic Center Core & Distant Black Hole
      const interactiveUniverse = s.stage === 'universe';
      if (coreOverlayBtnRef.current) {
        if (interactiveUniverse) {
          projectVec.copy(coreWorldVec).project(camera);
          const cx = (projectVec.x * 0.5 + 0.5) * width;
          const cy = (-projectVec.y * 0.5 + 0.5) * height;
          coreOverlayBtnRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
          coreOverlayBtnRef.current.style.opacity = '1';
          coreOverlayBtnRef.current.style.pointerEvents = 'auto';
        } else {
          coreOverlayBtnRef.current.style.opacity = '0';
          coreOverlayBtnRef.current.style.pointerEvents = 'none';
        }
      }

      if (blackHoleOverlayBtnRef.current) {
        if (interactiveUniverse) {
          projectVec.copy(bhWorldVec).project(camera);
          const bx = (projectVec.x * 0.5 + 0.5) * width;
          const by = (-projectVec.y * 0.5 + 0.5) * height;
          const clampedBx = Math.max(68, Math.min(width - 68, bx));
          const clampedBy = Math.max(78, Math.min(height - 115, by));
          blackHoleOverlayBtnRef.current.style.transform = `translate3d(${clampedBx}px, ${clampedBy}px, 0) translate(-50%, -50%)`;
          blackHoleOverlayBtnRef.current.style.opacity = '1';
          blackHoleOverlayBtnRef.current.style.pointerEvents = 'auto';
        } else {
          blackHoleOverlayBtnRef.current.style.opacity = '0';
          blackHoleOverlayBtnRef.current.style.pointerEvents = 'none';
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

    let resizeRafId = 0;

    const handleResize = () => {
      if (!container || disposed) return;
      const nextW = container.clientWidth || window.innerWidth;
      const nextH = container.clientHeight || window.innerHeight;
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (isSoftwareGl) {
        wakeLoopRef.current?.();
      } else {
        renderer.render(scene, camera);
      }
    };

    const scheduleResize = () => {
      if (disposed) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(handleResize);
    };

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
      window.removeEventListener('resize', scheduleResize);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeRafId);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerCancel);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      nebulaBackdrop.dispose();
      distantGalaxies.dispose();
      farStarsGeo.dispose();
      farStarsMat.dispose();
      midStarsGeo.dispose();
      midStarsMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      heroPlanet.dispose();
      blackHole.dispose();
      veilGeo.dispose();
      veilMat.dispose();
      energyCore.dispose();
      shardRuntimes.forEach((r) => {
        r.geo.dispose();
        r.edgeGeo.dispose();
        r.hitGeo.dispose();
        r.hitMat.dispose();
        r.mats.dispose();
      });
      envCube.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const hoveredSection = hoveredShardId ? COSMIC_SECTIONS_BY_ID[hoveredShardId] : null;
  const isHoveredExplored = hoveredSection ? exploredShardIds.includes(hoveredSection.id) : false;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden">
      {/* Deep Abyssal Space Void (True Darkness & Scale with Subtle Center Atmospheric Gradient) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 76% 62% at 50% 48%, #0b0720 0%, #050311 48%, #020107 100%)',
        }}
      />

      {/* Full-Screen 3D WebGL Canvas Mount */}
      {!webglFallback ? (
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full"
          data-testid="cosmic-universe-canvas"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          data-testid="cosmic-universe-fallback"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-300 via-violet-500 to-indigo-800 shadow-[0_0_70px_rgba(139,92,246,0.9)]" />
        </div>
      )}

      {/* Subtle 4.5px Depth-of-Field Background Blur Layer (Zero Darkening, radially masked so the selected crystal stays 100% sharp) */}
      <div
        ref={bgBlurLayerRef}
        data-testid="cosmic-background-blur-layer"
        data-blur-active={stage === 'selecting-shard' || stage === 'shard-detail' ? 'true' : 'false'}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
        style={{
          opacity: stage === 'selecting-shard' || stage === 'shard-detail' ? 1 : 0,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          backdropFilter: 'blur(4.5px)',
          WebkitBackdropFilter: 'blur(4.5px)',
        }}
      />

      {/* Stage 4: Accessible 3D-Synced Cosmic Center Core Trigger (restrained hover-revealed label) */}
      <button
        ref={coreOverlayBtnRef}
        type="button"
        onClick={onPulseCosmicCore}
        onMouseEnter={() => {
          liveRef.current.coreHovered = true;
          setIsCoreHoveredLocal(true);
        }}
        onMouseLeave={() => {
          liveRef.current.coreHovered = false;
          setIsCoreHoveredLocal(false);
        }}
        onFocus={() => {
          liveRef.current.coreHovered = true;
          setIsCoreHoveredLocal(true);
        }}
        onBlur={() => {
          liveRef.current.coreHovered = false;
          setIsCoreHoveredLocal(false);
        }}
        aria-label="Koinot Markaziy Yadro — Koinot Tahlili va energiya impulsini ishga tushirish"
        data-testid="cosmic-center-core-btn"
        style={{
          pointerEvents: stage === 'universe' ? 'auto' : 'none',
          opacity: stage === 'universe' ? 1 : 0,
        }}
        className="fixed top-0 left-0 z-30 w-24 h-24 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 transition-opacity duration-200 flex items-end justify-center pb-0"
      >
        <span
          className={`translate-y-7 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide transition-all duration-200 ${
            isCoreHoveredLocal
              ? 'border-cyan-300/55 bg-[#07051a]/92 text-cyan-100 opacity-100 shadow-[0_8px_22px_rgba(3,2,14,0.75)]'
              : 'border-violet-300/18 bg-[#07051a]/55 text-violet-200/75 opacity-60'
          }`}
        >
          Koinot Tahlili
        </span>
      </button>

      {/* Stage 5: Accessible 3D-Synced Distant Black Hole Exit Trigger */}
      <button
        ref={blackHoleOverlayBtnRef}
        type="button"
        onClick={onStartBlackHoleExit}
        onMouseEnter={() => onHoverBlackHole(true)}
        onMouseLeave={() => onHoverBlackHole(false)}
        onFocus={() => onHoverBlackHole(true)}
        onBlur={() => onHoverBlackHole(false)}
        aria-label="Qora Teshik — Boshqaruv paneliga qaytish portali"
        data-testid="cosmic-black-hole-btn"
        style={{
          pointerEvents: stage === 'universe' ? 'auto' : 'none',
          opacity: stage === 'universe' ? 1 : 0,
        }}
        className="fixed top-0 left-0 z-30 w-28 h-28 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 transition-opacity duration-200 flex items-end justify-center"
      >
        <span
          className={`translate-y-7 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide transition-all duration-200 ${
            isBlackHoleHovered
              ? 'border-cyan-300/55 bg-[#070518]/94 text-cyan-100 opacity-100 shadow-[0_8px_24px_rgba(3,2,14,0.8)]'
              : 'border-violet-300/18 bg-[#070518]/55 text-violet-200/70 opacity-60'
          }`}
        >
          Qora Teshik · Chiqish
        </span>
      </button>

      {/* Floating Screen-Projected Hover Tooltip over Orbiting Shard */}
      <div
        ref={hoverLabelRef}
        className="pointer-events-none fixed top-0 left-0 z-20 transition-opacity duration-150 opacity-0"
      >
        {hoveredSection && (
          <div className="rounded-xl border border-violet-300/35 bg-[#0a0720]/92 px-3 py-1.5 shadow-[0_10px_28px_rgba(4,2,16,0.78)] whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-cyan-300">{hoveredSection.order}</span>
              <span className="text-xs font-semibold text-white">{hoveredSection.title}</span>
              {isHoveredExplored && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
              )}
            </div>
            <p className="text-[10px] text-violet-200/75 mt-0.5">{hoveredSection.category}</p>
          </div>
        )}
      </div>
    </div>
  );
};
