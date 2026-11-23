import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VISUAL_MODE_IDS,
  GLOBE_VISUAL_PRESETS,
  sampleEarthGeography,
  buildEarthGeoDataBuffer,
  type EquirectLookupGrid,
} from './globeGeo';
import { getGlobeStrings } from '../components/world/globeStrings';

test('GLOBE_VISUAL_PRESETS defines all 9 modes with distinct modeType and rendering config', () => {
  assert.equal(VISUAL_MODE_IDS.length, 9);
  const expectedModes = [
    'digital',
    'high-contrast',
    'minimal',
    'scanline',
    'atmosphere',
    'realistic',
    'satellite',
    'terrain',
    'night',
  ] as const;
  assert.deepEqual(VISUAL_MODE_IDS, expectedModes);

  // Digital family (0..4) have modeType 0 and showDots true
  for (const id of ['digital', 'high-contrast', 'minimal', 'scanline', 'atmosphere'] as const) {
    assert.equal(GLOBE_VISUAL_PRESETS[id].modeType, 0);
    assert.equal(GLOBE_VISUAL_PRESETS[id].showDots, true);
  }

  // Physical Earth modes have distinct modeType 1, 2, 3, 4
  assert.equal(GLOBE_VISUAL_PRESETS.realistic.modeType, 1);
  assert.equal(GLOBE_VISUAL_PRESETS.realistic.defaultClouds, true);
  assert.equal(GLOBE_VISUAL_PRESETS.satellite.modeType, 2);
  assert.equal(GLOBE_VISUAL_PRESETS.terrain.modeType, 3);
  assert.ok(GLOBE_VISUAL_PRESETS.terrain.defaultTerrainScale > 0.03);
  assert.equal(GLOBE_VISUAL_PRESETS.night.modeType, 4);
});

test('getGlobeStrings provides localized names for all 9 visual modes and 8 layers in uz, en, ru, ja, zh, de', () => {
  const uz = getGlobeStrings('uz');
  assert.equal(uz.modeLabels.digital, 'Raqamli Yer');
  assert.equal(uz.modeLabels['high-contrast'], 'Yuqori kontrast');
  assert.equal(uz.modeLabels.minimal, 'Minimal nuqtali');
  assert.equal(uz.modeLabels.scanline, 'Kuchli skan chiziqlar');
  assert.equal(uz.modeLabels.atmosphere, 'Atmosfera nuri');
  assert.equal(uz.modeLabels.realistic, 'Realistik Yer');
  assert.equal(uz.modeLabels.satellite, "Sun'iy yo'ldosh");
  assert.equal(uz.modeLabels.terrain, 'Relyefli Yer');
  assert.equal(uz.modeLabels.night, 'Tungi Yer');

  // Verify all 8 Uzbek layer labels match specification
  assert.equal(uz.coordinateGrid, 'Koordinata to‘ri (15°)');
  assert.equal(uz.equatorMeridian, 'Ekvator va Bosh meridian');
  assert.equal(uz.cityMarkers, 'Shahar belgilari');
  assert.equal(uz.countryLabels, 'Mamlakat chegaralari');
  assert.equal(uz.cloudsLayer, 'Bulutlar');
  assert.equal(uz.atmosphereLayer, 'Atmosfera');
  assert.equal(uz.terrainReliefLayer, 'Relyef balandligi');
  assert.equal(uz.universityMarkersLayer, 'Universitet belgilari');

  for (const lang of ['en', 'uz', 'ru', 'ja', 'zh', 'de'] as const) {
    const s = getGlobeStrings(lang);
    for (const modeId of VISUAL_MODE_IDS) {
      assert.ok(s.modeLabels[modeId] && s.modeLabels[modeId].length > 0);
    }
    assert.ok(s.cloudsLayer.length > 0);
    assert.ok(s.atmosphereLayer.length > 0);
    assert.ok(s.terrainReliefLayer.length > 0);
    assert.ok(s.universityMarkersLayer.length > 0);
  }
});

test('sampleEarthGeography and buildEarthGeoDataBuffer compute realistic mountains, biomes, and city lights', () => {
  const himalaya = sampleEarthGeography(30.5, 84.0, true);
  const lowland = sampleEarthGeography(52.0, 20.0, true);
  assert.ok(
    himalaya.elevation > lowland.elevation + 0.35,
    `Expected Himalaya elevation (${himalaya.elevation}) > lowland (${lowland.elevation})`
  );

  const amazon = sampleEarthGeography(-3.0, -62.0, true);
  const sahara = sampleEarthGeography(23.5, 12.0, true);
  assert.ok(
    amazon.biome > sahara.biome + 0.4,
    `Expected Amazon biome (${amazon.biome}) > Sahara biome (${sahara.biome})`
  );

  const tokyoNight = sampleEarthGeography(35.68, 139.65, true);
  const oceanNight = sampleEarthGeography(0.0, -140.0, false);
  assert.ok(tokyoNight.nightLight > 0.85);
  assert.equal(oceanNight.nightLight, 0);

  // Test buffer generation with mock lookup grid
  const width = 64;
  const height = 32;
  const cellFeatureIndexPlusOne = new Uint16Array(width * height);
  cellFeatureIndexPlusOne.fill(1);
  const mockGrid: EquirectLookupGrid = { width, height, cellFeatureIndexPlusOne };
  const buf = buildEarthGeoDataBuffer(mockGrid, [[41.3, 69.24]], width, height);
  assert.equal(buf.length, width * height * 4);
  assert.ok(buf.some((v) => v > 180));
});
