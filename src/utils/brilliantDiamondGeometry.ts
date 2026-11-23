export interface BrilliantDiamondVertexData {
  /** Flat non-indexed triangle vertices (x, y, z per vertex; 3 vertices per triangle) */
  positions: Float32Array;
  /** Flat per-facet normals (nx, ny, nz per vertex; identical across each triangle face) */
  normals: Float32Array;
  /** Per-vertex facet metadata: [facetType (0=table,1=star,2=bezel,3=upperGirdle,4=girdle,5=lowerGirdle,6=pavilionMain,7=culet), facetIndexNormalized, radialDist, rimWeight] */
  facetMeta: Float32Array;
  /** Sharp facet boundary line segments (x1,y1,z1, x2,y2,z2) for crisp optical edge highlights */
  edgePositions: Float32Array;
  /** Number of triangles */
  triangleCount: number;
  /** Number of distinct planar facets */
  facetCount: number;
}

export interface BrilliantDiamondOptions {
  /** Number of main symmetry sectors around the brilliant cut (standard brilliant = 8, high-luxury oval = 12) */
  sectors?: number;
  /** Horizontal X semi-axis radius (oval width) */
  radiusX?: number;
  /** Horizontal Z semi-axis radius (oval depth) */
  radiusZ?: number;
  /** Crown height above girdle */
  crownHeight?: number;
  /** Pavilion depth below girdle */
  pavilionDepth?: number;
  /** Girdle vertical thickness */
  girdleThickness?: number;
  /** Table ratio relative to girdle radius (0.52 - 0.60 for brilliant cut) */
  tableRatio?: number;
}

type Vec3 = [number, number, number];

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Generates an authentic, closed, non-indexed multi-faceted Oval Brilliant-Cut Gemstone mesh.
 *
 * Facet Architecture (for N=12 sectors -> 122 distinct planar facets):
 * - 1 Central Octagonal/Dodecagonal Table Facet
 * - N Star Facets (upper crown triangles adjacent to table)
 * - N Bezel / Kite Crown Main Facets ( split into 2 coplanar or sharply creased triangles)
 * - 2N Upper Girdle Facets (paired triangular facets meeting the girdle)
 * - 2N Girdle Bevel Facets (continuous crystalline girdle band connecting crown and pavilion)
 * - 2N Lower Girdle Facets (long triangular pavilion facets rising to the girdle)
 * - N Pavilion Main Facets (deep kite facets extending to the culet)
 * - N Culet Bottom Facets meeting at the polished bottom culet apex
 *
 * Every triangle is emitted non-indexed with its exact flat geometric face normal,
 * ensuring razor-sharp facet boundaries and zero smooth-shaded blobbing.
 */
export function buildOvalBrilliantDiamondData(
  options: BrilliantDiamondOptions = {}
): BrilliantDiamondVertexData {
  const N = options.sectors ?? 12;
  const rx = options.radiusX ?? 1.44;
  const rz = options.radiusZ ?? 1.24;
  const crownH = options.crownHeight ?? 0.54;
  const pavD = options.pavilionDepth ?? 1.26;
  const girdleH = options.girdleThickness ?? 0.055;
  const tableRatio = options.tableRatio ?? 0.56;

  const yTable = crownH + girdleH * 0.5;
  const yStarMid = crownH * 0.62 + girdleH * 0.5;
  const yBezelLow = crownH * 0.34 + girdleH * 0.5;
  const yGirdleTop = girdleH * 0.5;
  const yGirdleBot = -girdleH * 0.5;
  const yPavMid = -girdleH * 0.5 - pavD * 0.44;
  const yPavLow = -girdleH * 0.5 - pavD * 0.78;
  const yCulet = -girdleH * 0.5 - pavD;

  // Helper to get point on oval ring at angle theta and radial scale rScale
  const ptOnRing = (theta: number, rScale: number, y: number): Vec3 => [
    Math.cos(theta) * rx * rScale,
    y,
    Math.sin(theta) * rz * rScale,
  ];

  // Rings of vertices around the gemstone
  // 1. Table vertices (N vertices at main sector angles: i * 2pi / N)
  const tableRing: Vec3[] = [];
  // 2. Star / Bezel mid-crown ring (N vertices at half-sector angles: (i + 0.5) * 2pi / N)
  const starMidRing: Vec3[] = [];
  // 3. Bezel lower-crown ring (2N vertices at quarter/half steps)
  const crownLowRing: Vec3[] = [];
  // 4. Upper girdle ring (2N vertices at i * pi / N)
  const girdleTopRing: Vec3[] = [];
  // 5. Lower girdle ring (2N vertices at i * pi / N)
  const girdleBotRing: Vec3[] = [];
  // 6. Pavilion upper-mid ring (2N vertices)
  const pavMidRing: Vec3[] = [];
  // 7. Pavilion lower main ring (N vertices at half-sector angles)
  const pavLowRing: Vec3[] = [];

  for (let i = 0; i < N; i++) {
    const thetaMain = (i / N) * Math.PI * 2;
    const thetaHalf = ((i + 0.5) / N) * Math.PI * 2;

    tableRing.push(ptOnRing(thetaMain, tableRatio, yTable));
    starMidRing.push(ptOnRing(thetaHalf, 0.77, yStarMid));
    // Taper linearly toward the culet point (0.22 at 78% depth) for a crisp V-shaped brilliant pavilion
    pavLowRing.push(ptOnRing(thetaHalf, 0.22, yPavLow));
  }

  const M = N * 2;
  for (let j = 0; j < M; j++) {
    const theta = (j / M) * Math.PI * 2;
    // Slight faceted scallop so even the 2N ring has distinct angular planes
    const isMain = j % 2 === 0;
    const lowCrownScale = isMain ? 0.905 : 0.885;
    const girdleScale = isMain ? 1.0 : 0.992;
    // Taper linearly at 44% pavilion depth (0.56 / 0.53) so lower girdle facets form a true sharp pavilion cone
    const pavMidScale = isMain ? 0.56 : 0.53;

    crownLowRing.push(ptOnRing(theta, lowCrownScale, yBezelLow));
    girdleTopRing.push(ptOnRing(theta, girdleScale, yGirdleTop));
    girdleBotRing.push(ptOnRing(theta, girdleScale, yGirdleBot));
    pavMidRing.push(ptOnRing(theta, pavMidScale, yPavMid));
  }

  const tableCenter: Vec3 = [0, yTable, 0];
  const culetApex: Vec3 = [0, yCulet, 0];

  const posList: number[] = [];
  const normList: number[] = [];
  const metaList: number[] = [];
  const edgeSet = new Set<string>();
  const edgeList: number[] = [];

  let facetCounter = 0;

  const addEdge = (a: Vec3, b: Vec3) => {
    const ka = `${a[0].toFixed(4)},${a[1].toFixed(4)},${a[2].toFixed(4)}`;
    const kb = `${b[0].toFixed(4)},${b[1].toFixed(4)},${b[2].toFixed(4)}`;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edgeList.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  };

  /**
   * Emits a single planar triangle with outward-facing flat normal.
   * Automatically checks winding against outward direction from gemstone center.
   */
  const emitTriangle = (
    a: Vec3,
    b: Vec3,
    c: Vec3,
    facetType: number,
    facetId: number,
    includeEdges = true,
    forcedNormal?: Vec3
  ) => {
    const ab = sub(b, a);
    const ac = sub(c, a);
    let n = forcedNormal ? forcedNormal : normalize(cross(ab, ac));

    // Verify outward normal orientation relative to gemstone center (0, 0, 0)
    const centroid: Vec3 = [
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ];
    const dotOut = n[0] * centroid[0] + n[1] * centroid[1] + n[2] * centroid[2];
    let v1 = a;
    let v2 = b;
    let v3 = c;
    if (dotOut < 0) {
      v2 = c;
      v3 = b;
      if (!forcedNormal) {
        n = [-n[0], -n[1], -n[2]];
      }
    }

    const facetNormId = (facetId % 37) / 37;

    for (const v of [v1, v2, v3]) {
      posList.push(v[0], v[1], v[2]);
      normList.push(n[0], n[1], n[2]);
      const radial = Math.hypot(v[0] / rx, v[2] / rz);
      const rim = Math.min(1, Math.max(0, (radial - tableRatio) / (1 - tableRatio)));
      metaList.push(facetType, facetNormId, radial, rim);
    }

    if (includeEdges) {
      addEdge(v1, v2);
      addEdge(v2, v3);
      addEdge(v3, v1);
    }
  };

  // 1. CENTRAL TABLE FACET (1 flat horizontal polygon divided into N coplanar triangles)
  const tableFacetId = facetCounter++;
  const tableNormal: Vec3 = [0, 1, 0];
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    emitTriangle(
      tableCenter,
      tableRing[next],
      tableRing[i],
      0,
      tableFacetId,
      false,
      tableNormal
    );
    // Only add the outer table perimeter edge so the table interior is pure crystal glass
    addEdge(tableRing[i], tableRing[next]);
  }

  // 2. STAR FACETS (N triangular facets adjoining the table perimeter)
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const fId = facetCounter++;
    emitTriangle(tableRing[i], tableRing[next], starMidRing[i], 1, fId, true);
  }

  // 3. UPPER BEZEL / CROWN MAIN KITE FACETS
  // Between tableRing[i], starMidRing[prev], crownLowRing[2*i], starMidRing[i]
  for (let i = 0; i < N; i++) {
    const prev = (i - 1 + N) % N;
    const mIdx = (2 * i) % M;
    // Left half of bezel kite
    const fIdLeft = facetCounter++;
    emitTriangle(tableRing[i], starMidRing[i], crownLowRing[mIdx], 2, fIdLeft, true);
    // Right half of bezel kite
    const fIdRight = facetCounter++;
    emitTriangle(tableRing[i], crownLowRing[mIdx], starMidRing[prev], 2, fIdRight, true);
  }

  // 4. LOWER CROWN / STAR-TO-LOW-CROWN FACETS
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const m0 = (2 * i) % M;
    const m1 = (2 * i + 1) % M;
    const m2 = (2 * next) % M;

    const fId1 = facetCounter++;
    emitTriangle(starMidRing[i], crownLowRing[m1], crownLowRing[m0], 2, fId1, true);

    const fId2 = facetCounter++;
    emitTriangle(starMidRing[i], crownLowRing[m2], crownLowRing[m1], 2, fId2, true);
  }

  // 5. UPPER GIRDLE FACETS (connecting crownLowRing to girdleTopRing)
  for (let j = 0; j < M; j++) {
    const nextJ = (j + 1) % M;
    const fIdA = facetCounter++;
    emitTriangle(crownLowRing[j], girdleTopRing[nextJ], girdleTopRing[j], 3, fIdA, true);

    const fIdB = facetCounter++;
    emitTriangle(crownLowRing[j], crownLowRing[nextJ], girdleTopRing[nextJ], 3, fIdB, true);
  }

  // 6. CONTINUOUS GIRDLE FACET BAND (connecting girdleTopRing and girdleBotRing with zero gap)
  for (let j = 0; j < M; j++) {
    const nextJ = (j + 1) % M;
    const fId = facetCounter++;
    // Two coplanar triangles forming each rectangular girdle facet
    const ab = sub(girdleTopRing[nextJ], girdleTopRing[j]);
    const ac = sub(girdleBotRing[j], girdleTopRing[j]);
    const girdleNormal = normalize(cross(ac, ab));
    emitTriangle(
      girdleTopRing[j],
      girdleTopRing[nextJ],
      girdleBotRing[j],
      4,
      fId,
      false,
      girdleNormal
    );
    emitTriangle(
      girdleTopRing[nextJ],
      girdleBotRing[nextJ],
      girdleBotRing[j],
      4,
      fId,
      false,
      girdleNormal
    );
    addEdge(girdleTopRing[j], girdleTopRing[nextJ]);
    addEdge(girdleBotRing[j], girdleBotRing[nextJ]);
    addEdge(girdleTopRing[j], girdleBotRing[j]);
  }

  // 7. LOWER GIRDLE PAVILION FACETS (connecting girdleBotRing to pavMidRing)
  for (let j = 0; j < M; j++) {
    const nextJ = (j + 1) % M;
    const fIdA = facetCounter++;
    emitTriangle(girdleBotRing[j], girdleBotRing[nextJ], pavMidRing[j], 5, fIdA, true);

    const fIdB = facetCounter++;
    emitTriangle(girdleBotRing[nextJ], pavMidRing[nextJ], pavMidRing[j], 5, fIdB, true);
  }

  // 8. PAVILION MAIN KITE FACETS (connecting pavMidRing to pavLowRing)
  for (let i = 0; i < N; i++) {
    const prev = (i - 1 + N) % N;
    const next = (i + 1) % N;
    const m0 = (2 * i) % M;
    const m1 = (2 * i + 1) % M;
    const m2 = (2 * next) % M;

    const fId1 = facetCounter++;
    emitTriangle(pavMidRing[m0], pavMidRing[m1], pavLowRing[i], 6, fId1, true);

    const fId2 = facetCounter++;
    emitTriangle(pavMidRing[m1], pavMidRing[m2], pavLowRing[i], 6, fId2, true);

    const fId3 = facetCounter++;
    emitTriangle(pavMidRing[m0], pavLowRing[i], pavLowRing[prev], 6, fId3, true);
  }

  // 9. CULET PAVILION APEX FACETS (connecting pavLowRing to culetApex)
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const fId = facetCounter++;
    emitTriangle(pavLowRing[i], pavLowRing[next], culetApex, 7, fId, true);
  }

  return {
    positions: new Float32Array(posList),
    normals: new Float32Array(normList),
    facetMeta: new Float32Array(metaList),
    edgePositions: new Float32Array(edgeList),
    triangleCount: posList.length / 9,
    facetCount: facetCounter,
  };
}
