import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js GLTFExporter
global.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const outputDir = './public/3dModels/PoolTable';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, 'pool_table.glb');

// =============================================================================
// DIMENSIONS & COORDINATES (Standard 9-foot tournament table)
// Table surface height = 0.85m, width = 1.27m (X: -0.635 to +0.635), length = 2.54m (Z: -1.27 to +1.27)
// =============================================================================
const TABLE_W = 1.27;
const TABLE_L = 2.54;
const HALF_W = TABLE_W / 2; // 0.635
const HALF_L = TABLE_L / 2; // 1.27
const TABLE_H = 0.85;

const rootGroup = new THREE.Group();
rootGroup.name = 'PoolTable_Root';

// -----------------------------------------------------------------------------
// PBR MATERIALS
// -----------------------------------------------------------------------------
// 1. Tournament Emerald Green Cloth
const feltMat = new THREE.MeshStandardMaterial({
  color: 0x095231,
  roughness: 0.88,
  metalness: 0.04,
  name: 'Mat_TournamentFelt',
});

// 2. Deep Victorian Walnut / Mahogany Hardwood
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x241208,
  roughness: 0.32,
  metalness: 0.12,
  name: 'Mat_WalnutHardwood',
});

// 3. Carved Apron Trim
const trimWoodMat = new THREE.MeshStandardMaterial({
  color: 0x361a0b,
  roughness: 0.38,
  metalness: 0.08,
  name: 'Mat_ApronTrimWood',
});

// 4. Polished Mirror Brass / Bronze Castings
const brassMat = new THREE.MeshStandardMaterial({
  color: 0xd97706,
  metalness: 0.95,
  roughness: 0.18,
  name: 'Mat_PolishedBrass',
});

// 5. Heavy Embossed Pocket Leather
const leatherMat = new THREE.MeshStandardMaterial({
  color: 0x14100d,
  roughness: 0.85,
  metalness: 0.05,
  name: 'Mat_PocketLeather',
});

// 6. Inlaid Mother-of-Pearl Diamond Sights
const pearlMat = new THREE.MeshStandardMaterial({
  color: 0xfef08a,
  roughness: 0.22,
  metalness: 0.45,
  name: 'Mat_PearlInlay',
});

// 7. Brushed Steel Ball Return Rails
const steelMat = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  metalness: 0.88,
  roughness: 0.28,
  name: 'Mat_BrushedSteel',
});

// =============================================================================
// 1. SLATE BED & TABLE SURFACE
// =============================================================================
const slateGroup = new THREE.Group();
slateGroup.name = 'Bed_Slate_Group';

// Main Slate Slab with Green Felt
const bedGeo = new THREE.BoxGeometry(TABLE_W, 0.06, TABLE_L);
const bedMesh = new THREE.Mesh(bedGeo, feltMat);
bedMesh.position.set(0, TABLE_H - 0.03, 0);
bedMesh.name = 'Bed_Slate_Cloth';
slateGroup.add(bedMesh);

// Kitchen / Headstring Line Inlay
const kitchenGeo = new THREE.PlaneGeometry(TABLE_W - 0.06, 0.003);
const kitchenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
const kitchenLine = new THREE.Mesh(kitchenGeo, kitchenMat);
kitchenLine.rotation.x = -Math.PI / 2;
kitchenLine.position.set(0, TABLE_H + 0.001, -HALF_L * 0.5);
kitchenLine.name = 'Marking_Headstring';
slateGroup.add(kitchenLine);

// Foot Spot (Apex marker)
const footSpotGeo = new THREE.CircleGeometry(0.008, 16);
const footSpotMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
const footSpot = new THREE.Mesh(footSpotGeo, footSpotMat);
footSpot.rotation.x = -Math.PI / 2;
footSpot.position.set(0, TABLE_H + 0.001, HALF_L * 0.5);
footSpot.name = 'Marking_FootSpot';
slateGroup.add(footSpot);

rootGroup.add(slateGroup);

// =============================================================================
// 2. HARDWOOD RAILS & CUSHIONS
// =============================================================================
const railsGroup = new THREE.Group();
railsGroup.name = 'Rails_And_Cushions_Group';

const railThickness = 0.14;
const railHeight = 0.085;

// Head Rail (-Z) & Foot Rail (+Z)
[-HALF_L - railThickness / 2, HALF_L + railThickness / 2].forEach((z, idx) => {
  const railGeo = new THREE.BoxGeometry(TABLE_W + railThickness * 2, railHeight, railThickness);
  const rail = new THREE.Mesh(railGeo, woodMat);
  rail.position.set(0, TABLE_H + 0.012, z);
  rail.name = idx === 0 ? 'Rail_Head' : 'Rail_Foot';
  railsGroup.add(rail);

  // Beveled Cushion Profile facing table interior
  const cushionGeo = new THREE.BoxGeometry(TABLE_W - 0.16, 0.045, 0.03);
  const cushion = new THREE.Mesh(cushionGeo, feltMat);
  const cushionZ = idx === 0 ? z + railThickness / 2 - 0.015 : z - railThickness / 2 + 0.015;
  cushion.position.set(0, TABLE_H + 0.018, cushionZ);
  cushion.name = idx === 0 ? 'Cushion_Head' : 'Cushion_Foot';
  railsGroup.add(cushion);
});

// Left & Right Long Rails
[-HALF_W - railThickness / 2, HALF_W + railThickness / 2].forEach((x, idx) => {
  const halfRailLength = (TABLE_L - 0.2) / 2;

  // Upper segment (-Z)
  const railUpperGeo = new THREE.BoxGeometry(railThickness, railHeight, halfRailLength);
  const railUpper = new THREE.Mesh(railUpperGeo, woodMat);
  railUpper.position.set(x, TABLE_H + 0.012, -halfRailLength / 2 - 0.08);
  railUpper.name = idx === 0 ? 'Rail_Left_Upper' : 'Rail_Right_Upper';
  railsGroup.add(railUpper);

  const cushionUpperGeo = new THREE.BoxGeometry(0.03, 0.045, halfRailLength - 0.04);
  const cushionUpper = new THREE.Mesh(cushionUpperGeo, feltMat);
  const cushionX = idx === 0 ? x + railThickness / 2 - 0.015 : x - railThickness / 2 + 0.015;
  cushionUpper.position.set(cushionX, TABLE_H + 0.018, -halfRailLength / 2 - 0.08);
  railsGroup.add(cushionUpper);

  // Lower segment (+Z)
  const railLowerGeo = new THREE.BoxGeometry(railThickness, railHeight, halfRailLength);
  const railLower = new THREE.Mesh(railLowerGeo, woodMat);
  railLower.position.set(x, TABLE_H + 0.012, halfRailLength / 2 + 0.08);
  railLower.name = idx === 0 ? 'Rail_Left_Lower' : 'Rail_Right_Lower';
  railsGroup.add(railLower);

  const cushionLowerGeo = new THREE.BoxGeometry(0.03, 0.045, halfRailLength - 0.04);
  const cushionLower = new THREE.Mesh(cushionLowerGeo, feltMat);
  cushionLower.position.set(cushionX, TABLE_H + 0.018, halfRailLength / 2 + 0.08);
  railsGroup.add(cushionLower);
});

// Mother-of-Pearl Diamond Sights along the rail tops
for (let i = 1; i <= 7; i++) {
  const z = -HALF_L + (TABLE_L / 8) * i;
  [-HALF_W - railThickness / 2, HALF_W + railThickness / 2].forEach((x) => {
    const sightGeo = new THREE.CircleGeometry(0.007, 16);
    const sight = new THREE.Mesh(sightGeo, pearlMat);
    sight.rotation.x = -Math.PI / 2;
    sight.position.set(x, TABLE_H + railHeight / 2 + 0.013, z);
    sight.name = `Diamond_Sight_${i}`;
    railsGroup.add(sight);
  });
}

// Diamond Sights on Head & Foot rails
for (let i = 1; i <= 3; i++) {
  const x = -HALF_W + (TABLE_W / 4) * i;
  [-HALF_L - railThickness / 2, HALF_L + railThickness / 2].forEach((z) => {
    const sightGeo = new THREE.CircleGeometry(0.007, 16);
    const sight = new THREE.Mesh(sightGeo, pearlMat);
    sight.rotation.x = -Math.PI / 2;
    sight.position.set(x, TABLE_H + railHeight / 2 + 0.013, z);
    railsGroup.add(sight);
  });
}

rootGroup.add(railsGroup);

// =============================================================================
// 3. BRASS POCKET CASTINGS & LEATHER DROP NETS
// =============================================================================
const pocketsGroup = new THREE.Group();
pocketsGroup.name = 'Pockets_Group';

const cornerCoords = [
  [-HALF_W + 0.02, -HALF_L + 0.02],
  [HALF_W - 0.02, -HALF_L + 0.02],
  [-HALF_W + 0.02, HALF_L - 0.02],
  [HALF_W - 0.02, HALF_L - 0.02],
];

cornerCoords.forEach(([x, z], idx) => {
  // Heavy Polished Brass Corner Cap Collar
  const capGeo = new THREE.TorusGeometry(0.082, 0.016, 16, 32);
  const cap = new THREE.Mesh(capGeo, brassMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(x, TABLE_H + 0.01, z);
  cap.name = `Corner_Brass_Cap_${idx}`;
  pocketsGroup.add(cap);

  // Outer corner brass shell wrapping the rail corners
  const outerCornerGeo = new THREE.BoxGeometry(0.18, 0.09, 0.18);
  const outerCorner = new THREE.Mesh(outerCornerGeo, brassMat);
  const cornerSignX = x > 0 ? 1 : -1;
  const cornerSignZ = z > 0 ? 1 : -1;
  outerCorner.position.set(
    (HALF_W + railThickness / 2 + 0.01) * cornerSignX,
    TABLE_H + 0.012,
    (HALF_L + railThickness / 2 + 0.01) * cornerSignZ
  );
  pocketsGroup.add(outerCorner);

  // Leather Drop Funnel & Cup
  const cupGeo = new THREE.CylinderGeometry(0.078, 0.055, 0.14, 24);
  const cup = new THREE.Mesh(cupGeo, leatherMat);
  cup.position.set(x, TABLE_H - 0.065, z);
  cup.name = `Corner_Leather_Cup_${idx}`;
  pocketsGroup.add(cup);
});

// 2 Side Pockets (Center Left and Center Right)
[
  [-HALF_W - 0.015, 0],
  [HALF_W + 0.015, 0],
].forEach(([x, z], idx) => {
  const bezelGeo = new THREE.TorusGeometry(0.088, 0.016, 16, 32);
  const bezel = new THREE.Mesh(bezelGeo, brassMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(x, TABLE_H + 0.01, z);
  bezel.name = `Side_Brass_Bezel_${idx}`;
  pocketsGroup.add(bezel);

  const cupGeo = new THREE.CylinderGeometry(0.084, 0.058, 0.14, 24);
  const cup = new THREE.Mesh(cupGeo, leatherMat);
  cup.position.set(x, TABLE_H - 0.065, z);
  pocketsGroup.add(cup);
});

rootGroup.add(pocketsGroup);

// =============================================================================
// 4. CABINET APRON, RECESSED PANELS & BALL RETURN
// =============================================================================
const cabinetGroup = new THREE.Group();
cabinetGroup.name = 'Cabinet_Apron_Group';

const apronHeight = 0.28;
const apronThickness = 0.05;
const apronCenterY = TABLE_H - 0.18;

// Long Apron Sides (Left & Right)
[-HALF_W - railThickness + apronThickness / 2, HALF_W + railThickness - apronThickness / 2].forEach((x, idx) => {
  const apronGeo = new THREE.BoxGeometry(apronThickness, apronHeight, TABLE_L + 0.15);
  const apron = new THREE.Mesh(apronGeo, woodMat);
  apron.position.set(x, apronCenterY, 0);
  cabinetGroup.add(apron);

  // Recessed Carved Accent Panels
  [-0.65, 0.65].forEach((panelZ) => {
    const panelGeo = new THREE.BoxGeometry(0.01, apronHeight - 0.08, 0.95);
    const panel = new THREE.Mesh(panelGeo, trimWoodMat);
    const panelX = idx === 0 ? x - 0.026 : x + 0.026;
    panel.position.set(panelX, apronCenterY, panelZ);
    cabinetGroup.add(panel);

    // Decorative Brass Studs on Apron
    [-0.42, 0, 0.42].forEach((studZ) => {
      const studGeo = new THREE.SphereGeometry(0.009, 12, 12);
      const stud = new THREE.Mesh(studGeo, brassMat);
      const studX = idx === 0 ? x - 0.032 : x + 0.032;
      stud.position.set(studX, apronCenterY, panelZ + studZ);
      cabinetGroup.add(stud);
    });
  });
});

// Short Apron Ends (Head & Foot)
[-HALF_L - railThickness + apronThickness / 2, HALF_L + railThickness - apronThickness / 2].forEach((z, idx) => {
  const apronGeo = new THREE.BoxGeometry(TABLE_W + 0.15, apronHeight, apronThickness);
  const apron = new THREE.Mesh(apronGeo, woodMat);
  apron.position.set(0, apronCenterY, z);
  cabinetGroup.add(apron);

  // Head End: Automatic Ball Return Collection Box Door
  if (idx === 0) {
    const doorGeo = new THREE.BoxGeometry(0.36, 0.16, 0.02);
    const door = new THREE.Mesh(doorGeo, trimWoodMat);
    door.position.set(0, apronCenterY - 0.02, z - 0.026);
    cabinetGroup.add(door);

    const handleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 12);
    const handle = new THREE.Mesh(handleGeo, brassMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, apronCenterY - 0.02, z - 0.04);
    cabinetGroup.add(handle);
  }
});

// Under-table Internal Ball Return Rail Channels
const gutterLeftGeo = new THREE.CylinderGeometry(0.012, 0.012, TABLE_L - 0.4, 12);
const gutterLeft = new THREE.Mesh(gutterLeftGeo, steelMat);
gutterLeft.rotation.x = Math.PI / 2;
gutterLeft.position.set(-HALF_W + 0.18, TABLE_H - 0.22, 0);
cabinetGroup.add(gutterLeft);

const gutterRightGeo = new THREE.CylinderGeometry(0.012, 0.012, TABLE_L - 0.4, 12);
const gutterRight = new THREE.Mesh(gutterRightGeo, steelMat);
gutterRight.rotation.x = Math.PI / 2;
gutterRight.position.set(HALF_W - 0.18, TABLE_H - 0.22, 0);
cabinetGroup.add(gutterRight);

rootGroup.add(cabinetGroup);

// =============================================================================
// 5. CARVED VICTORIAN / TOURNAMENT PEDESTAL LEGS & LEVELERS
// =============================================================================
const legsGroup = new THREE.Group();
legsGroup.name = 'Pedestal_Legs_Group';

const legLocations = [
  [-HALF_W + 0.16, -HALF_L + 0.28],
  [HALF_W - 0.16, -HALF_L + 0.28],
  [-HALF_W + 0.16, HALF_L - 0.28],
  [HALF_W - 0.16, HALF_L - 0.28],
];

legLocations.forEach(([lx, lz], idx) => {
  const singleLegGroup = new THREE.Group();
  singleLegGroup.name = `Leg_${idx}`;
  singleLegGroup.position.set(lx, 0, lz);

  // Upper Fluted Block
  const upperBlockGeo = new THREE.BoxGeometry(0.18, 0.15, 0.18);
  const upperBlock = new THREE.Mesh(upperBlockGeo, woodMat);
  upperBlock.position.set(0, TABLE_H - 0.38, 0);
  singleLegGroup.add(upperBlock);

  // Turned Pedestal Main Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.088, 0.07, TABLE_H - 0.46, 24);
  const shaft = new THREE.Mesh(shaftGeo, woodMat);
  shaft.position.set(0, (TABLE_H - 0.46) / 2 + 0.06, 0);
  singleLegGroup.add(shaft);

  // Turned Acanthus Ring Toruses
  [0.18, 0.34].forEach((ringY) => {
    const ringGeo = new THREE.TorusGeometry(0.092, 0.018, 16, 24);
    const ring = new THREE.Mesh(ringGeo, trimWoodMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, ringY, 0);
    singleLegGroup.add(ring);
  });

  // Solid Cast Brass Base Collar
  const baseCollarGeo = new THREE.CylinderGeometry(0.085, 0.11, 0.06, 24);
  const baseCollar = new THREE.Mesh(baseCollarGeo, brassMat);
  baseCollar.position.set(0, 0.05, 0);
  singleLegGroup.add(baseCollar);

  // Adjustable Solid Brass Leveler Foot
  const levelerFootGeo = new THREE.CylinderGeometry(0.11, 0.125, 0.025, 24);
  const levelerFoot = new THREE.Mesh(levelerFootGeo, brassMat);
  levelerFoot.position.set(0, 0.0125, 0);
  singleLegGroup.add(levelerFoot);

  legsGroup.add(singleLegGroup);
});

// Heavy-Duty Stretcher Beams
[-HALF_W + 0.16, HALF_W - 0.16].forEach((bx) => {
  const beamGeo = new THREE.BoxGeometry(0.08, 0.08, TABLE_L - 0.56);
  const beam = new THREE.Mesh(beamGeo, woodMat);
  beam.position.set(bx, 0.18, 0);
  legsGroup.add(beam);
});

const crossBeamGeo = new THREE.BoxGeometry(TABLE_W - 0.32, 0.08, 0.08);
const crossBeam = new THREE.Mesh(crossBeamGeo, woodMat);
crossBeam.position.set(0, 0.18, 0);
legsGroup.add(crossBeam);

rootGroup.add(legsGroup);

// =============================================================================
// EXPORT TO GLB
// =============================================================================
const exporter = new GLTFExporter();
console.log('Generating realistic 3D pool table GLB model...');

exporter.parse(
  rootGroup,
  (glbBuffer) => {
    const buffer = Buffer.from(glbBuffer);
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n======================================================`);
    console.log(`SUCCESS! 3D Pool Table GLB Generated Successfully!`);
    console.log(`Output Path: ${outputPath}`);
    console.log(`File Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`======================================================\n`);
  },
  (err) => {
    console.error('Error exporting GLB:', err);
    process.exit(1);
  },
  { binary: true }
);
