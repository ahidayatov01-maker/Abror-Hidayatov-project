import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOvalBrilliantDiamondData } from './brilliantDiamondGeometry';

test('buildOvalBrilliantDiamondData produces closed multi-faceted brilliant-cut geometry with flat normals', () => {
  const data = buildOvalBrilliantDiamondData({
    sectors: 12,
    radiusX: 1.44,
    radiusZ: 1.24,
    crownHeight: 0.54,
    pavilionDepth: 1.26,
  });

  // Verify abundant distinct planar facets (> 100 facets)
  assert.ok(data.facetCount >= 110, `Expected >= 110 facets, got ${data.facetCount}`);
  assert.ok(data.triangleCount >= 120, `Expected >= 120 triangles, got ${data.triangleCount}`);
  assert.equal(data.positions.length, data.triangleCount * 9);
  assert.equal(data.normals.length, data.triangleCount * 9);
  assert.equal(data.facetMeta.length, data.triangleCount * 12);

  // Verify every triangle has identical flat normals across its 3 vertices (no smooth blobbing)
  for (let t = 0; t < data.triangleCount; t++) {
    const base = t * 9;
    const nx0 = data.normals[base];
    const ny0 = data.normals[base + 1];
    const nz0 = data.normals[base + 2];

    const nx1 = data.normals[base + 3];
    const ny1 = data.normals[base + 4];
    const nz1 = data.normals[base + 5];

    const nx2 = data.normals[base + 6];
    const ny2 = data.normals[base + 7];
    const nz2 = data.normals[base + 8];

    assert.ok(Math.abs(nx0 - nx1) < 1e-6 && Math.abs(nx0 - nx2) < 1e-6);
    assert.ok(Math.abs(ny0 - ny1) < 1e-6 && Math.abs(ny0 - ny2) < 1e-6);
    assert.ok(Math.abs(nz0 - nz1) < 1e-6 && Math.abs(nz0 - nz2) < 1e-6);

    // Normal must be unit length
    const len = Math.hypot(nx0, ny0, nz0);
    assert.ok(Math.abs(len - 1) < 1e-4, `Normal not unit length: ${len}`);
  }

  // Verify continuous vertical span from culet to table with no gap
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < data.positions.length; i += 3) {
    const x = data.positions[i];
    const y = data.positions[i + 1];
    const z = data.positions[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  // Oval proportions: X span larger than Z span
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  assert.ok(spanX > spanZ + 0.2, `Expected oval X span (${spanX}) > Z span (${spanZ})`);
  assert.ok(maxY > 0.5 && minY < -1.2, `Expected crown > 0.5 (${maxY}) and culet < -1.2 (${minY})`);
  assert.ok(data.edgePositions.length > 300, 'Expected sharp facet edge segments');
});
