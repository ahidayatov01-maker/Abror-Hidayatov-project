import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  applyAdaptiveScheduleToRoute,
  buildCosmicSolarSystem,
  computeInwardProgressChainIndices,
  computeRightSideFocusFraming,
  computeSunCenteredOrbitPoint,
  createDefaultRoadmapState,
  evaluateScheduleFeasibility,
  formatMilestoneHoverTitle,
  formatMilestoneNumber,
  getPlanetOrbitalInclination,
  synthesizeActionableTaskStars,
  updateTaskStarInRoute,
} from '../roadmapEngine';

test('Cosmic Academic GPS — buildCosmicSolarSystem constructs Sun, 8 milestone planets, orbiting task stars, and 3D route trajectories', () => {
  const state = createDefaultRoadmapState({
    originCountry: 'Uzbekistan',
    targetCountry: 'Japan',
    targetUniversitySlug: 'university-of-tokyo',
    targetUniversityName: 'The University of Tokyo',
    targetDegree: 'Bachelor',
    targetDiscipline: 'Computer Science',
  });

  const system = buildCosmicSolarSystem(state);

  // 1. Sun Destination represents the ultimate academic goal
  assert.equal(system.sunDestination.title, 'The University of Tokyo');
  assert.ok(system.sunDestination.overallProgressPercent > 0);
  assert.equal(system.sunDestination.totalMilestonesCount, 8);
  assert.ok(system.sunDestination.totalStarsCount >= 24);

  // 2. Milestone Planets have distinct archetypes, non-overlapping orbital radii, and task stars
  assert.equal(system.planets.length, 8);
  const radii = system.planets.map((p) => p.orbitalRadius);
  for (let i = 0; i < radii.length - 1; i++) {
    assert.ok(
      Math.abs(radii[i] - radii[i + 1]) >= 4.5,
      `Expected distinct orbital radii between planet ${i} (${radii[i]}) and ${i + 1} (${radii[i + 1]})`
    );
  }

  for (const planet of system.planets) {
    assert.ok(planet.planetArchetype, 'Planet must have an assigned celestial archetype');
    assert.ok(planet.whyItMatters.length > 15, 'Planet must explain why it matters');
    assert.ok(planet.expectedOutcome.length > 10, 'Planet must specify expected outcome');
    assert.ok(planet.taskStars.length >= 3, 'Each milestone planet must have at least 3 orbiting task stars');
  }
});

test('Cosmic Academic GPS — formatMilestoneNumber and formatMilestoneHoverTitle format real milestone identity clearly', () => {
  assert.equal(formatMilestoneNumber(1), '01');
  assert.equal(formatMilestoneNumber(8), '08');
  assert.equal(
    formatMilestoneHoverTitle(1, 'Academic Baseline & Transcript Audit'),
    '01 — Academic Baseline & Transcript Audit'
  );
  assert.equal(
    formatMilestoneHoverTitle(2, 'Language Proficiency Certification'),
    '02 — Language Proficiency Certification'
  );
});

test('Cosmic Academic GPS — computeSunCenteredOrbitPoint places every planet and orbital ring point at exact radial distance from the Sun', () => {
  for (let idx = 0; idx < 8; idx++) {
    const orbitRadius = 22 + idx * 7.1;
    const { inclinationX, inclinationZ } = getPlanetOrbitalInclination(idx);

    for (let step = 0; step < 16; step++) {
      const angle = (step / 16) * Math.PI * 2;
      const pt = computeSunCenteredOrbitPoint(orbitRadius, angle, inclinationX, inclinationZ);
      const distFromSun = Math.hypot(pt.x, pt.y, pt.z);
      assert.ok(
        Math.abs(distFromSun - orbitRadius) < 1e-6,
        `Expected point on tilted orbit ${idx} to be at distance ${orbitRadius} from Sun (0,0,0), got ${distFromSun}`
      );
    }
  }
});

test('Cosmic Academic GPS — computeRightSideFocusFraming positions selected planet/star/Sun on the RIGHT on desktop and upper-center on mobile', () => {
  const planetPos = { x: 32, y: 1.5, z: -24 };

  // 1. Desktop (1440x900): selected planet must project to the RIGHT side of the viewport (ndc.x > 0.2)
  const desktopFraming = computeRightSideFocusFraming({
    focusKind: 'planet',
    objectPos: planetPos,
    objectRadius: 1.9,
    viewportWidth: 1440,
    viewportHeight: 900,
    referenceOrigin: { x: 0, y: 0, z: 0 },
  });

  const desktopCam = new THREE.PerspectiveCamera(45, 1440 / 900, 0.5, 1500);
  desktopCam.position.set(
    desktopFraming.camPos.x,
    desktopFraming.camPos.y,
    desktopFraming.camPos.z
  );
  desktopCam.lookAt(desktopFraming.lookAt.x, desktopFraming.lookAt.y, desktopFraming.lookAt.z);
  desktopCam.updateMatrixWorld();
  desktopCam.updateProjectionMatrix();

  const projectedDesktop = new THREE.Vector3(planetPos.x, planetPos.y, planetPos.z).project(
    desktopCam
  );
  assert.ok(
    projectedDesktop.x > 0.18 && projectedDesktop.x < 0.65,
    `Expected desktop focused planet to project to RIGHT side of viewport (0.18 < ndc.x < 0.65), got ${projectedDesktop.x}`
  );

  // 2. Mobile (390x844): selected planet projects horizontally centered and in upper half (ndc.y > 0.1)
  const mobileFraming = computeRightSideFocusFraming({
    focusKind: 'planet',
    objectPos: planetPos,
    objectRadius: 1.9,
    viewportWidth: 390,
    viewportHeight: 844,
    referenceOrigin: { x: 0, y: 0, z: 0 },
  });

  const mobileCam = new THREE.PerspectiveCamera(45, 390 / 844, 0.5, 1500);
  mobileCam.position.set(mobileFraming.camPos.x, mobileFraming.camPos.y, mobileFraming.camPos.z);
  mobileCam.lookAt(mobileFraming.lookAt.x, mobileFraming.lookAt.y, mobileFraming.lookAt.z);
  mobileCam.updateMatrixWorld();
  mobileCam.updateProjectionMatrix();

  const projectedMobile = new THREE.Vector3(planetPos.x, planetPos.y, planetPos.z).project(
    mobileCam
  );
  assert.ok(
    Math.abs(projectedMobile.x) < 0.1,
    `Expected mobile focused planet to be horizontally centered, got ${projectedMobile.x}`
  );
  assert.ok(
    projectedMobile.y > 0.1,
    `Expected mobile focused planet to sit in upper half of viewport above bottom drawer, got ${projectedMobile.y}`
  );
});

test('Cosmic Academic GPS — evaluateScheduleFeasibility flags unrealistic deadlines and suggests realistic alternatives', () => {
  const optimal = evaluateScheduleFeasibility({
    totalEstimatedHours: 320,
    completedHours: 80,
    weeklyStudyHours: 16,
    targetDeadlineMonths: 14,
    targetUniversityName: 'The University of Tokyo',
  });
  assert.equal(optimal.feasibilityStatus, 'optimal');
  assert.equal(optimal.isFeasible, true);

  const unrealistic = evaluateScheduleFeasibility({
    totalEstimatedHours: 420,
    completedHours: 40,
    weeklyStudyHours: 6,
    targetDeadlineMonths: 3,
    targetUniversityName: 'ETH Zurich',
  });
  assert.equal(unrealistic.feasibilityStatus, 'unrealistic');
  assert.equal(unrealistic.isFeasible, false);
  assert.ok(unrealistic.explanation.toLowerCase().includes('unrealistic'));
  assert.ok(unrealistic.recommendedAlternative.toLowerCase().includes('months'));
});

test('Cosmic Academic GPS — updateTaskStarInRoute unlocks dependent stars and updates parent milestone when all stars complete', () => {
  const state = createDefaultRoadmapState();
  const directRoute = state.routes.direct;
  const activeStation = directRoute.stations[1]; // dir-2 (in_progress)

  const initialStars = synthesizeActionableTaskStars(activeStation, {
    originCountry: state.originCountry,
    targetCountry: state.targetCountry,
    targetUniversityName: state.targetUniversityName,
    targetDegree: state.targetDegree,
    targetDiscipline: state.targetDiscipline,
  });

  assert.ok(initialStars.length >= 3);

  // Complete all task stars on dir-2 sequentially
  let updatedRoute = directRoute;
  for (const star of initialStars) {
    updatedRoute = updateTaskStarInRoute(
      updatedRoute,
      activeStation.id,
      star.id,
      { status: 'completed', verificationLevel: 'milestone_verified' },
      {
        originCountry: state.originCountry,
        targetCountry: state.targetCountry,
        targetUniversityName: state.targetUniversityName,
        targetDegree: state.targetDegree,
        targetDiscipline: state.targetDiscipline,
      }
    );
  }

  const updatedStation = updatedRoute.stations.find((s) => s.id === activeStation.id);
  assert.ok(updatedStation);
  assert.equal(updatedStation.status, 'completed');
  assert.ok(updatedStation.taskStars?.every((s) => s.status === 'completed'));
});

test('Cosmic Academic GPS — applyAdaptiveScheduleToRoute recalculates upcoming timeframes while strictly preserving completed milestones', () => {
  const state = createDefaultRoadmapState({
    targetUniversityName: 'MIT',
  });
  state.weeklyStudyHours = 6;
  state.targetDeadlineMonths = 4;

  const system = buildCosmicSolarSystem(state);
  assert.equal(system.adaptiveProposal.paceMode, 'recovery_needed');

  const completedBefore = state.routes.direct.stations.find((s) => s.id === 'dir-1');
  assert.ok(completedBefore);
  assert.equal(completedBefore.status, 'completed');

  const adapted = applyAdaptiveScheduleToRoute(state.routes.direct, system.adaptiveProposal);
  const completedAfter = adapted.stations.find((s) => s.id === 'dir-1');
  assert.ok(completedAfter);
  assert.equal(completedAfter.status, 'completed');
  assert.equal(completedAfter.timeframe, completedBefore.timeframe);
  assert.equal(adapted.estimatedDurationMonths, system.adaptiveProposal.proposedDurationMonths);
});

test('Cosmic Academic GPS — assigns distinct celestial archetypes, Saturn/Sapphire rings, Keplerian orbital motion, and inward progress chain', () => {
  const state = createDefaultRoadmapState();
  const system = buildCosmicSolarSystem(state);

  assert.equal(system.planets[0].planetArchetype, 'emerald_horizon');
  assert.equal(system.planets[1].planetArchetype, 'sapphire_crown');
  assert.equal(system.planets[1].hasRings, true);
  assert.equal(system.planets[3].planetArchetype, 'ringed_gas_giant');
  assert.equal(system.planets[3].hasRings, true);
  assert.equal(system.planets[5].planetArchetype, 'ringed_gas_giant');
  assert.equal(system.planets[5].hasRings, true);

  for (const p of system.planets) {
    assert.ok(p.orbitalSpeed > 0, `Expected positive Keplerian orbital speed for ${p.id}`);
  }

  const chain = computeInwardProgressChainIndices(system.planets.map((p) => p.status));
  assert.deepEqual(chain, [0, 1]);
});


