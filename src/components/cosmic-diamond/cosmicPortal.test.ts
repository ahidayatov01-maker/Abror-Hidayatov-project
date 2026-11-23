import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cosmicPortalReducer,
  FRACTURE_PHASE_A_END_RATIO,
  FRACTURE_PHASE_B_END_RATIO,
  FRACTURE_TOTAL_DURATION_MS,
  getAdjacentShardId,
  getNextUnexploredShardId,
  INITIAL_COSMIC_PORTAL_STATE,
  isTransitioningStage,
  isUniverseOverlayStage,
  REASSEMBLY_PHASE_A_END_RATIO,
  REASSEMBLY_PHASE_B_END_RATIO,
  REASSEMBLY_TOTAL_DURATION_MS,
  resolveCosmicLogicalPhase,
  SELECT_SHARD_DURATION_MS,
  SUPERNOVA_TOTAL_DURATION_MS,
} from './cosmicTypes';
import { COSMIC_SECTIONS } from './cosmicSections';
import {
  BLACK_HOLE_WORLD_POS_DESKTOP,
  BLACK_HOLE_WORLD_POS_MOBILE,
  buildDiamondCrackNetworkData,
  buildIntactDiamondGeometryData,
  buildUniqueCrystalShardsData,
  computeBlackHoleVortexPosition,
  computeReassemblyTrajectoryPosition,
  computeStage1OrbitalPosition,
  computeStage2OrbitalPosition,
  CONSTELLATION_EDGES,
  HERO_PLANET_WORLD_POS_DESKTOP,
  HERO_PLANET_WORLD_POS_MOBILE,
  STAGE3_FOCUS_WORLD_Z,
  STAGE3_VEIL_WORLD_Z,
} from './CrystalGeometry';

test('buildIntactDiamondGeometryData produces valid faceted diamond mesh', () => {
  const data = buildIntactDiamondGeometryData();
  assert.ok(data.triangleCount > 100, 'Expected rich faceted diamond triangle count');
  assert.equal(data.positions.length, data.normals.length);
  assert.ok(data.edgePositions.length > 0);
});

test('buildDiamondCrackNetworkData builds branching progressive 3D fracture segments and spark origins', () => {
  const crackData = buildDiamondCrackNetworkData();
  assert.ok(crackData.segmentCount >= 40, `Expected rich branching crack network, got ${crackData.segmentCount}`);
  assert.equal(crackData.positions.length, crackData.segmentCount * 2 * 3);
  assert.equal(crackData.propagationOrder.length, crackData.segmentCount * 2);
  assert.equal(crackData.intensity.length, crackData.segmentCount * 2);
  assert.ok(crackData.sparkOrigins.length >= 12, 'Expected spark emission origins along crack junctions');

  let minOrder = Infinity;
  let maxOrder = -Infinity;
  for (let i = 0; i < crackData.propagationOrder.length; i++) {
    const v = crackData.propagationOrder[i];
    if (v < minOrder) minOrder = v;
    if (v > maxOrder) maxOrder = v;
  }
  assert.ok(minOrder < 0.25, `Expected early nucleation order near core, got ${minOrder}`);
  assert.ok(maxOrder > 0.78, `Expected late surface propagation order, got ${maxOrder}`);
});

test('buildUniqueCrystalShardsData produces exactly 12 volumetric diamond-sector shards with cleavage faces and restrained spin', () => {
  const shards = buildUniqueCrystalShardsData();
  assert.equal(shards.length, 12);

  const archetypes = new Set(shards.map((s) => s.archetype));
  assert.equal(archetypes.size, 12, 'All 12 shards must have unique archetypes');

  const radii = new Set(shards.map((s) => s.boundingRadius.toFixed(4)));
  assert.equal(radii.size, 12, 'All 12 shards must have distinct geometric proportions');

  const orbitRadii = new Set(shards.map((s) => s.universeOrbitRadius.toFixed(3)));
  assert.equal(orbitRadii.size, 12, 'All 12 shards must have distinct orbital radii');

  for (const shard of shards) {
    assert.ok(shard.triangleCount >= 16, `Shard ${shard.archetype} must have faceted volume`);
    assert.equal(shard.positions.length, shard.normals.length);
    assert.equal(shard.facetMeta.length, (shard.positions.length / 3) * 4);
    assert.ok(shard.edgePositions.length > 0);

    // Restrained spin discipline (elegant poise, no chaotic spinning)
    for (const rate of shard.spinRate) {
      assert.ok(
        Math.abs(rate) <= 0.08,
        `Shard ${shard.archetype} spinRate ${rate} exceeds restrained threshold 0.08 rad/s`
      );
    }

    // Must contain BOTH polished outer diamond facets (facetKind < 9.5) and rough inner cleavage faces (facetKind >= 9.5)
    let outerVerts = 0;
    let cleavageVerts = 0;
    for (let i = 0; i < shard.facetMeta.length; i += 4) {
      const kind = shard.facetMeta[i];
      if (kind >= 9.5) cleavageVerts++;
      else outerVerts++;
    }
    assert.ok(outerVerts > 0, `Shard ${shard.archetype} must include outer diamond facets`);
    assert.ok(cleavageVerts > 0, `Shard ${shard.archetype} must include fractured interior cleavage faces`);

    for (let i = 0; i < shard.normals.length; i += 3) {
      const len = Math.hypot(shard.normals[i], shard.normals[i + 1], shard.normals[i + 2]);
      assert.ok(Math.abs(len - 1) < 1e-4, `Expected unit normal, got ${len}`);
    }
  }
});

test('computeStage1OrbitalPosition keeps all 12 fragments strictly inside frustum bounds without rectangular clipping', () => {
  const shards = buildUniqueCrystalShardsData();
  const timestamps = [0, 3.5, 11, 29];
  for (const t of timestamps) {
    for (const shard of shards) {
      const [x, y, z] = computeStage1OrbitalPosition(shard, t, 1);
      const planarRadius = Math.hypot(x, y);
      assert.ok(
        planarRadius <= 1.65,
        `Stage 1 shard ${shard.shardIndex} planar radius ${planarRadius.toFixed(3)} risks clipping`
      );
      assert.ok(
        Math.abs(z) <= 0.95,
        `Stage 1 shard ${shard.shardIndex} Z excursion ${z.toFixed(3)} is too extreme`
      );
    }
  }
});

test('CONSTELLATION_EDGES connects all 12 valid shard indices without self-loops', () => {
  assert.ok(CONSTELLATION_EDGES.length >= 12);
  const touched = new Set<number>();
  for (const edge of CONSTELLATION_EDGES) {
    assert.ok(edge.from >= 0 && edge.from < 12);
    assert.ok(edge.to >= 0 && edge.to < 12);
    assert.notEqual(edge.from, edge.to);
    touched.add(edge.from);
    touched.add(edge.to);
  }
  assert.equal(touched.size, 12, 'Every shard index 0..11 should participate in constellation');
});

test('computeStage2OrbitalPosition enforces YADRO radial clearance and Stage 6 veil Z-safety for all 12 shards', () => {
  const shards = buildUniqueCrystalShardsData();
  const timestamps = [0, 5, 20, 60];

  assert.ok(
    STAGE3_FOCUS_WORLD_Z > STAGE3_VEIL_WORLD_Z + 0.8,
    'Focused crystal Z must sit clearly in front of the dimming veil'
  );

  for (const isMobile of [false, true]) {
    const minClearance = isMobile ? 1.85 : 2.45;
    for (const t of timestamps) {
      for (const shard of shards) {
        const [x, y, z] = computeStage2OrbitalPosition(shard, t, 1, isMobile);
        const xyDist = Math.hypot(x, y);
        assert.ok(
          xyDist >= minClearance - 1e-4,
          `Shard ${shard.shardIndex} at t=${t} (mobile=${isMobile}) overlapped YADRO core: xyDist=${xyDist}`
        );
        assert.ok(
          z <= STAGE3_VEIL_WORLD_Z - 0.84,
          `Shard ${shard.shardIndex} at t=${t} poked too close to dimming veil: z=${z}, veil=${STAGE3_VEIL_WORLD_Z}`
        );
      }
    }
  }
});

test('Black Hole and Hero Ringed Planet are positioned diagonally far apart across vast cosmic scale', () => {
  const distDesktop = Math.hypot(
    BLACK_HOLE_WORLD_POS_DESKTOP[0] - HERO_PLANET_WORLD_POS_DESKTOP[0],
    BLACK_HOLE_WORLD_POS_DESKTOP[1] - HERO_PLANET_WORLD_POS_DESKTOP[1],
    BLACK_HOLE_WORLD_POS_DESKTOP[2] - HERO_PLANET_WORLD_POS_DESKTOP[2]
  );
  const distMobile = Math.hypot(
    BLACK_HOLE_WORLD_POS_MOBILE[0] - HERO_PLANET_WORLD_POS_MOBILE[0],
    BLACK_HOLE_WORLD_POS_MOBILE[1] - HERO_PLANET_WORLD_POS_MOBILE[1],
    BLACK_HOLE_WORLD_POS_MOBILE[2] - HERO_PLANET_WORLD_POS_MOBILE[2]
  );

  assert.ok(distDesktop > 22, `Expected wide cosmic desktop separation (>22), got ${distDesktop.toFixed(2)}`);
  assert.ok(distMobile > 12, `Expected clear mobile separation (>12), got ${distMobile.toFixed(2)}`);
  // Opposite X and Y quadrants for diagonal composition
  assert.ok(BLACK_HOLE_WORLD_POS_DESKTOP[0] > 0 && HERO_PLANET_WORLD_POS_DESKTOP[0] < 0);
  assert.ok(BLACK_HOLE_WORLD_POS_DESKTOP[1] > 0 && HERO_PLANET_WORLD_POS_DESKTOP[1] < 0);
});

test('computeBlackHoleVortexPosition spirals objects smoothly from origin toward Black Hole', () => {
  const origin: [number, number, number] = [-3.5, -1.8, 0.9];
  const bh = BLACK_HOLE_WORLD_POS_DESKTOP;
  const start = computeBlackHoleVortexPosition(origin, bh, 0, 2);
  const mid = computeBlackHoleVortexPosition(origin, bh, 0.5, 2);
  const end = computeBlackHoleVortexPosition(origin, bh, 1, 2);

  const dist = (a: [number, number, number], b: [number, number, number]) =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  assert.ok(dist(start, origin) < 1e-4, 'At progress=0 object must remain at origin');
  assert.ok(dist(mid, bh) < dist(start, bh), 'At progress=0.5 object must pull closer to Black Hole');
  assert.ok(dist(end, bh) < 0.65, 'At progress=1 object must converge into Black Hole event horizon');
  assert.ok(BLACK_HOLE_WORLD_POS_MOBILE[2] < -2, 'Mobile Black Hole sits behind shard orbits');
});

test('COSMIC_SECTIONS has 12 valid real application sections with complete Uzbek copy', () => {
  assert.equal(COSMIC_SECTIONS.length, 12);
  const ids = new Set(COSMIC_SECTIONS.map((s) => s.id));
  assert.equal(ids.size, 12);

  for (let i = 0; i < COSMIC_SECTIONS.length; i++) {
    const sec = COSMIC_SECTIONS[i];
    assert.equal(sec.shardIndex, i);
    assert.equal(sec.order, String(i + 1).padStart(2, '0'));
    assert.ok(sec.title.length > 2);
    assert.ok(sec.shortDescription.length > 20);
    assert.ok(sec.purpose.length > 15);
    assert.ok(sec.solvesProblem.length > 15);
    assert.ok(sec.capabilities.length >= 3);
    assert.ok(sec.targetSection.length > 0);
  }
});

test('cosmicPortalReducer enforces 7-stage lifecycle, Stage 4 core pulse, Stage 5 Black Hole exit, and Stage 6 isolation', () => {
  let state = INITIAL_COSMIC_PORTAL_STATE;
  assert.equal(state.stage, 'idle');
  assert.equal(isUniverseOverlayStage(state.stage), false);

  // Stage 1: idle -> fracturing -> orbital
  state = cosmicPortalReducer(state, { type: 'START_FRACTURE' });
  assert.equal(state.stage, 'fracturing');
  state = cosmicPortalReducer(state, { type: 'COMPLETE_FRACTURE' });
  assert.equal(state.stage, 'orbital');

  // Stage 2: orbital -> entering-universe -> universe
  state = cosmicPortalReducer(state, { type: 'ENTER_UNIVERSE' });
  assert.equal(state.stage, 'entering-universe');
  assert.equal(isUniverseOverlayStage(state.stage), true);
  state = cosmicPortalReducer(state, { type: 'COMPLETE_ENTER_UNIVERSE' });
  assert.equal(state.stage, 'universe');

  // Stage 4: Cosmic Center Core radial pulse + Koinot Tahlili panel
  state = cosmicPortalReducer(state, { type: 'PULSE_COSMIC_CORE' });
  assert.equal(state.stage, 'universe');
  assert.equal(state.corePulseNonce, 1);
  assert.equal(state.coreInsightsOpen, true);

  state = cosmicPortalReducer(state, { type: 'CLOSE_CORE_INSIGHTS' });
  assert.equal(state.coreInsightsOpen, false);

  // Stage 6: Selecting a shard closes insights & strictly isolates core/black-hole triggers
  state = cosmicPortalReducer(state, { type: 'PULSE_COSMIC_CORE' });
  assert.equal(state.coreInsightsOpen, true);
  state = cosmicPortalReducer(state, { type: 'SELECT_SHARD', shardId: 'ai-ecosystem' });
  assert.equal(state.stage, 'selecting-shard');
  assert.equal(state.coreInsightsOpen, false);
  assert.deepEqual(state.exploredShardIds, ['ai-ecosystem']);

  // Core pulse and Black Hole exit MUST be ignored while selecting or viewing a shard
  const ignoredPulseWhileSelecting = cosmicPortalReducer(state, { type: 'PULSE_COSMIC_CORE' });
  assert.equal(ignoredPulseWhileSelecting.corePulseNonce, state.corePulseNonce);
  const ignoredBhWhileSelecting = cosmicPortalReducer(state, { type: 'START_BLACK_HOLE_EXIT' });
  assert.equal(ignoredBhWhileSelecting.stage, 'selecting-shard');

  state = cosmicPortalReducer(state, { type: 'COMPLETE_SELECT_SHARD' });
  assert.equal(state.stage, 'shard-detail');

  const ignoredPulseWhileDetail = cosmicPortalReducer(state, { type: 'PULSE_COSMIC_CORE' });
  assert.equal(ignoredPulseWhileDetail.corePulseNonce, state.corePulseNonce);
  const ignoredBhWhileDetail = cosmicPortalReducer(state, { type: 'START_BLACK_HOLE_EXIT' });
  assert.equal(ignoredBhWhileDetail.stage, 'shard-detail');

  // Step to shard 12 (university-comparison) and return cleanly to universe
  state = cosmicPortalReducer(state, { type: 'SELECT_SHARD', shardId: 'university-comparison' });
  assert.deepEqual(state.exploredShardIds, ['ai-ecosystem', 'university-comparison']);
  state = cosmicPortalReducer(state, { type: 'COMPLETE_SELECT_SHARD' });
  state = cosmicPortalReducer(state, { type: 'RETURN_TO_UNIVERSE' });
  state = cosmicPortalReducer(state, { type: 'COMPLETE_RETURN_TO_UNIVERSE' });
  assert.equal(state.stage, 'universe');
  assert.equal(state.activeShardId, null);

  // Stage 5 & 7: Black Hole Exit -> black-hole-exit -> reassembling-hero -> idle
  state = cosmicPortalReducer(state, { type: 'START_BLACK_HOLE_EXIT' });
  assert.equal(state.stage, 'black-hole-exit');
  assert.equal(isUniverseOverlayStage(state.stage), true);
  assert.equal(isTransitioningStage(state.stage), true);

  state = cosmicPortalReducer(state, { type: 'COMPLETE_BLACK_HOLE_EXIT' });
  assert.equal(state.stage, 'reassembling-hero');
  assert.equal(isUniverseOverlayStage(state.stage), false);
  assert.equal(isTransitioningStage(state.stage), true);

  state = cosmicPortalReducer(state, { type: 'COMPLETE_REASSEMBLE' });
  assert.equal(state.stage, 'idle');
  assert.equal(isTransitioningStage(state.stage), false);
});

test('orbital and universe reassembly both route through reassembling-hero to visibly reassemble the Dashboard diamond', () => {
  let state = INITIAL_COSMIC_PORTAL_STATE;
  state = cosmicPortalReducer(state, { type: 'START_FRACTURE' });
  state = cosmicPortalReducer(state, { type: 'COMPLETE_FRACTURE' });
  assert.equal(state.stage, 'orbital');

  const heroReassemble = cosmicPortalReducer(state, { type: 'START_HERO_REASSEMBLE' });
  assert.equal(heroReassemble.stage, 'reassembling-hero');
  assert.equal(isUniverseOverlayStage(heroReassemble.stage), false);

  const genericReassemble = cosmicPortalReducer(state, { type: 'START_REASSEMBLE' });
  assert.equal(genericReassemble.stage, 'reassembling-hero');

  // From inside the Cosmic Universe: START_REASSEMBLE -> reassembling -> COMPLETE_UNIVERSE_REASSEMBLE_EXIT -> reassembling-hero -> idle
  let uniState = cosmicPortalReducer(state, { type: 'ENTER_UNIVERSE' });
  uniState = cosmicPortalReducer(uniState, { type: 'COMPLETE_ENTER_UNIVERSE' });
  assert.equal(uniState.stage, 'universe');
  uniState = cosmicPortalReducer(uniState, { type: 'START_REASSEMBLE' });
  assert.equal(uniState.stage, 'reassembling');
  assert.equal(isUniverseOverlayStage(uniState.stage), true);
  uniState = cosmicPortalReducer(uniState, { type: 'COMPLETE_UNIVERSE_REASSEMBLE_EXIT' });
  assert.equal(uniState.stage, 'reassembling-hero');
  assert.equal(isUniverseOverlayStage(uniState.stage), false);
  uniState = cosmicPortalReducer(uniState, { type: 'COMPLETE_REASSEMBLE' });
  assert.equal(uniState.stage, 'idle');
});

test('resolveCosmicLogicalPhase maps all 10 required logical phases across fracture, supernova, exploration, and reassembly', () => {
  assert.equal(FRACTURE_TOTAL_DURATION_MS, 4500);
  assert.equal(SUPERNOVA_TOTAL_DURATION_MS, 2100);
  assert.equal(SELECT_SHARD_DURATION_MS, 560);
  assert.equal(REASSEMBLY_TOTAL_DURATION_MS, 3600);

  const shards = buildUniqueCrystalShardsData();
  for (const s of shards) {
    assert.ok(
      s.stage1Scale >= 0.68 && s.stage1Scale <= 0.87,
      `Expected refined stage1Scale (5-8% reduction), got ${s.stage1Scale}`
    );
    assert.ok(
      s.universeScale >= 0.85 && s.universeScale <= 1.09,
      `Expected refined universeScale (5-8% reduction), got ${s.universeScale}`
    );
  }

  assert.equal(resolveCosmicLogicalPhase('idle'), 'DASHBOARD_IDLE');
  assert.equal(resolveCosmicLogicalPhase('fracturing', 0.1), 'DIAMOND_FRACTURING');
  assert.equal(resolveCosmicLogicalPhase('fracturing', FRACTURE_PHASE_A_END_RATIO - 0.01), 'DIAMOND_FRACTURING');
  assert.equal(resolveCosmicLogicalPhase('fracturing', FRACTURE_PHASE_A_END_RATIO + 0.05), 'SHARDS_SEPARATING');
  assert.equal(resolveCosmicLogicalPhase('fracturing', FRACTURE_PHASE_B_END_RATIO + 0.05), 'SHARDS_ORBITING');
  assert.equal(resolveCosmicLogicalPhase('orbital'), 'SHARDS_ORBITING');
  assert.equal(resolveCosmicLogicalPhase('entering-universe', 0.15), 'CORE_ACTIVATING');
  assert.equal(resolveCosmicLogicalPhase('entering-universe', 0.72), 'COSMIC_TRANSITION');
  assert.equal(resolveCosmicLogicalPhase('universe'), 'COSMIC_EXPLORATION');
  assert.equal(resolveCosmicLogicalPhase('selecting-shard'), 'COSMIC_EXPLORATION');
  assert.equal(resolveCosmicLogicalPhase('shard-detail'), 'COSMIC_EXPLORATION');
  assert.equal(resolveCosmicLogicalPhase('returning-to-universe'), 'COSMIC_EXPLORATION');
  assert.equal(resolveCosmicLogicalPhase('black-hole-exit'), 'REASSEMBLY_ATTRACTION');
  assert.equal(resolveCosmicLogicalPhase('reassembling'), 'REASSEMBLY_ATTRACTION');
  assert.equal(resolveCosmicLogicalPhase('reassembling-hero', 0.12), 'REASSEMBLY_ATTRACTION');
  assert.equal(resolveCosmicLogicalPhase('reassembling-hero', REASSEMBLY_PHASE_A_END_RATIO + 0.08), 'REASSEMBLY_ALIGNMENT');
  assert.equal(resolveCosmicLogicalPhase('reassembling-hero', REASSEMBLY_PHASE_B_END_RATIO + 0.04), 'REASSEMBLY_HEALING');
});

test('computeReassemblyTrajectoryPosition moves each shard along an individual curved 3D trajectory back to its exact homePos', () => {
  const shards = buildUniqueCrystalShardsData();
  for (let i = 0; i < shards.length; i++) {
    const d = shards[i];
    const startPos = computeStage1OrbitalPosition(d, 2.5, 1.0);
    const homePos: [number, number, number] = [d.homeOffset[0], d.homeOffset[1] + 0.06, d.homeOffset[2]];

    const p0 = computeReassemblyTrajectoryPosition(startPos, homePos, 0, i);
    const pMid = computeReassemblyTrajectoryPosition(startPos, homePos, 0.45, i);
    const p1 = computeReassemblyTrajectoryPosition(startPos, homePos, 1, i);

    assert.ok(Math.hypot(p0[0] - startPos[0], p0[1] - startPos[1], p0[2] - startPos[2]) < 1e-6);
    assert.ok(
      Math.hypot(p1[0] - homePos[0], p1[1] - homePos[1], p1[2] - homePos[2]) < 1e-6,
      `Shard ${i} must return to exact homePos at progress=1`
    );

    // Midpoint must deviate from a straight collinear lerp (proving curved gravitational trajectory)
    const linearMid: [number, number, number] = [
      startPos[0] + (homePos[0] - startPos[0]) * 0.45,
      startPos[1] + (homePos[1] - startPos[1]) * 0.45,
      startPos[2] + (homePos[2] - startPos[2]) * 0.45,
    ];
    const curveDeviation = Math.hypot(
      pMid[0] - linearMid[0],
      pMid[1] - linearMid[1],
      pMid[2] - linearMid[2]
    );
    assert.ok(
      curveDeviation > 0.02,
      `Shard ${i} trajectory should follow a curved 3D path, got deviation ${curveDeviation}`
    );
  }
});

test('getAdjacentShardId and getNextUnexploredShardId step and wrap deterministically across all 12 shards', () => {
  const ordered = COSMIC_SECTIONS.map((s) => s.id);
  assert.equal(ordered.length, 12);
  assert.equal(getAdjacentShardId(ordered[0], 1, ordered), ordered[1]);
  assert.equal(getAdjacentShardId(ordered[0], -1, ordered), ordered[11]);
  assert.equal(getAdjacentShardId(ordered[11], 1, ordered), ordered[0]);
  assert.equal(getAdjacentShardId(null, 1, ordered), ordered[0]);
  assert.equal(getAdjacentShardId('missing-id', -1, ordered), ordered[0]);
  assert.equal(getAdjacentShardId('any', 1, []), null);

  assert.equal(getNextUnexploredShardId([], ordered), ordered[0]);
  assert.equal(getNextUnexploredShardId([ordered[0], ordered[2]], ordered), ordered[1]);
  assert.equal(getNextUnexploredShardId(ordered, ordered), ordered[0]);
  assert.equal(getNextUnexploredShardId([], []), null);
});
