const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Node.js GLTFExporter
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
};

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

const outputDir = path.resolve(__dirname, '../public/3dModels/ductfaucet');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Common Materials
const matSteelDuct = new THREE.MeshStandardMaterial({
  color: 0x6e7682,
  metalness: 0.75,
  roughness: 0.35,
  name: 'IndustrialSteelDuct',
});

const matFlange = new THREE.MeshStandardMaterial({
  color: 0x4a525d,
  metalness: 0.8,
  roughness: 0.3,
  name: 'CastFlange',
});

const matBolts = new THREE.MeshStandardMaterial({
  color: 0xd4af37, // Zinc plated / golden dichromate
  metalness: 0.85,
  roughness: 0.25,
  name: 'PlatedBolts',
});

const matChrome = new THREE.MeshStandardMaterial({
  color: 0xe8eef2,
  metalness: 0.95,
  roughness: 0.15,
  name: 'PolishedStainlessSteel',
});

const matBrass = new THREE.MeshStandardMaterial({
  color: 0xd4a017,
  metalness: 0.8,
  roughness: 0.28,
  name: 'LechlerBrassFitting',
});

const matLechlerBlue = new THREE.MeshStandardMaterial({
  color: 0x005599, // Lechler corporate blue
  metalness: 0.3,
  roughness: 0.4,
  name: 'LechlerCorporateBlue',
});

const matActuatorYellow = new THREE.MeshStandardMaterial({
  color: 0xdd9900, // Industrial hazard / machinery yellow
  metalness: 0.4,
  roughness: 0.4,
  name: 'IndustrialSafetyYellow',
});

const matHoseBlack = new THREE.MeshStandardMaterial({
  color: 0x222224,
  roughness: 0.8,
  name: 'HighPressureHose',
});

const matHoseBlue = new THREE.MeshStandardMaterial({
  color: 0x0077cc,
  roughness: 0.6,
  name: 'WaterSupplyHose',
});

const matConcrete = new THREE.MeshStandardMaterial({
  color: 0x7c7c7c,
  roughness: 0.9,
  name: 'IndustrialConcreteFoundation',
});

const matGripGrating = new THREE.MeshStandardMaterial({
  color: 0x3d434a,
  metalness: 0.7,
  roughness: 0.5,
  wireframe: false,
  name: 'SteelWalkwayGrating',
});

// Helper: Create circular flange with bolts
function createFlange(innerR, outerR, thickness, boltCount = 12) {
  const flangeGroup = new THREE.Group();
  
  // Flange disc ring
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    curveSegments: 36,
  };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geom, matFlange);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  flangeGroup.add(mesh);

  // Bolts
  const boltR = innerR + (outerR - innerR) * 0.58;
  const boltGeom = new THREE.CylinderGeometry(outerR * 0.035, outerR * 0.035, thickness * 1.6, 6);
  boltGeom.rotateX(Math.PI / 2);
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bolt = new THREE.Mesh(boltGeom, matBolts);
    bolt.position.set(Math.cos(angle) * boltR, Math.sin(angle) * boltR, thickness * 0.5);
    flangeGroup.add(bolt);
  }

  return flangeGroup;
}

// Helper: Stiffening ring
function createStiffenerRing(radius, width = 0.05, height = 0.05) {
  const geom = new THREE.TorusGeometry(radius + height * 0.5, height * 0.5, 12, 36);
  const mesh = new THREE.Mesh(geom, matFlange);
  mesh.rotateX(Math.PI / 2);
  return mesh;
}

// 1. STRAIGHT CIRCULAR DUCT
function buildStraightDuct() {
  const group = new THREE.Group();
  group.name = 'StraightCircularDuct';

  const radius = 1.0;
  const length = 5.0;
  const thickness = 0.05;

  // Outer tube
  const outerGeom = new THREE.CylinderGeometry(radius, radius, length, 48, 1, true);
  const outerMesh = new THREE.Mesh(outerGeom, matSteelDuct);
  group.add(outerMesh);

  // Inner tube (for double-sided thickness visual)
  const innerGeom = new THREE.CylinderGeometry(radius - thickness, radius - thickness, length, 48, 1, true);
  const innerMesh = new THREE.Mesh(innerGeom, matFlange);
  innerMesh.scale.x = -1; // inside normals
  group.add(innerMesh);

  // End Flanges
  const flangeA = createFlange(radius - thickness, radius + 0.22, 0.08, 16);
  flangeA.rotateX(Math.PI / 2);
  flangeA.position.y = length / 2;
  group.add(flangeA);

  const flangeB = createFlange(radius - thickness, radius + 0.22, 0.08, 16);
  flangeB.rotateX(-Math.PI / 2);
  flangeB.position.y = -length / 2;
  group.add(flangeB);

  // Stiffener ribs
  for (let y of [-1.5, 0, 1.5]) {
    const rib = createStiffenerRing(radius, 0.06, 0.06);
    rib.position.y = y;
    group.add(rib);
  }

  // Top Port for Lechler Lance Insertion
  const portGroup = new THREE.Group();
  portGroup.position.set(0, 0.8, radius);
  portGroup.rotateX(Math.PI / 2);

  const standPipeGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 24);
  const standPipe = new THREE.Mesh(standPipeGeom, matSteelDuct);
  standPipe.position.y = 0.175;
  portGroup.add(standPipe);

  const portFlange = createFlange(0.14, 0.28, 0.04, 8);
  portFlange.rotateX(Math.PI / 2);
  portFlange.position.y = 0.35;
  portGroup.add(portFlange);

  // Ball valve body on port
  const valveGeom = new THREE.BoxGeometry(0.24, 0.16, 0.24);
  const valve = new THREE.Mesh(valveGeom, matActuatorYellow);
  valve.position.y = 0.45;
  portGroup.add(valve);

  const handwheelStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12), matSteelDuct);
  handwheelStem.position.set(0.16, 0.45, 0);
  handwheelStem.rotateZ(Math.PI / 2);
  portGroup.add(handwheelStem);

  const handwheelGeom = new THREE.TorusGeometry(0.12, 0.02, 8, 20);
  const handwheel = new THREE.Mesh(handwheelGeom, matActuatorYellow);
  handwheel.position.set(0.25, 0.45, 0);
  handwheel.rotateY(Math.PI / 2);
  portGroup.add(handwheel);

  group.add(portGroup);

  return group;
}

// 2. L-SHAPED (90 DEGREE ELBOW) DUCT
function buildLShapedDuct() {
  const group = new THREE.Group();
  group.name = 'LShapedElbowDuct';

  const bendRadius = 2.2;
  const ductRadius = 1.0;
  const thickness = 0.05;
  const segments = 24;

  // Build curved elbow path: starts at (0, 0, 0) pointing in -Z, bends 90 deg into +X
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, bendRadius),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bendRadius, 0, 0)
  );

  const tubeGeom = new THREE.TubeGeometry(curve, 32, ductRadius, 32, false);
  const elbowMesh = new THREE.Mesh(tubeGeom, matSteelDuct);
  group.add(elbowMesh);

  // Inlet Flange at (0, 0, bendRadius)
  const flangeA = createFlange(ductRadius - thickness, ductRadius + 0.22, 0.08, 16);
  flangeA.position.set(0, 0, bendRadius);
  flangeA.rotateX(Math.PI);
  group.add(flangeA);

  // Outlet Flange at (bendRadius, 0, 0)
  const flangeB = createFlange(ductRadius - thickness, ductRadius + 0.22, 0.08, 16);
  flangeB.position.set(bendRadius, 0, 0);
  flangeB.rotateY(Math.PI / 2);
  group.add(flangeB);

  // Reinforcement gusset plates on the bend
  const gussetGeom = new THREE.BoxGeometry(0.04, 0.35, 0.35);
  for (let angle of [0.4, 0.8, 1.2]) {
    const gusset = new THREE.Mesh(gussetGeom, matFlange);
    gusset.position.set(
      Math.sin(angle) * (bendRadius * 0.5),
      0,
      Math.cos(angle) * (bendRadius * 0.5)
    );
    gusset.rotateY(angle);
    group.add(gusset);
  }

  // Inspection & Cleaning Port on outer elbow radius
  const portGroup = new THREE.Group();
  portGroup.position.set(bendRadius * 0.7 + ductRadius * 0.7, 0, bendRadius * 0.7 + ductRadius * 0.7);
  portGroup.lookAt(0, 0, 0);
  const standpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 20), matSteelDuct);
  standpipe.rotateX(Math.PI / 2);
  portGroup.add(standpipe);

  const portFlange = createFlange(0.14, 0.28, 0.04, 8);
  portFlange.position.z = 0.18;
  portGroup.add(portFlange);

  group.add(portGroup);

  return group;
}

// 3. T-SHAPED (TEE JUNCTION) DUCT
function buildTShapedDuct() {
  const group = new THREE.Group();
  group.name = 'TShapedJunctionDuct';

  const mainRadius = 1.0;
  const mainLength = 5.0;
  const branchRadius = 0.8;
  const branchLength = 2.2;
  const thickness = 0.05;

  // Main run tube
  const mainGeom = new THREE.CylinderGeometry(mainRadius, mainRadius, mainLength, 40, 1, true);
  const mainMesh = new THREE.Mesh(mainGeom, matSteelDuct);
  mainMesh.rotateZ(Math.PI / 2);
  group.add(mainMesh);

  // Main run flanges
  const flangeLeft = createFlange(mainRadius - thickness, mainRadius + 0.22, 0.08, 16);
  flangeLeft.rotateY(Math.PI / 2);
  flangeLeft.position.x = -mainLength / 2;
  group.add(flangeLeft);

  const flangeRight = createFlange(mainRadius - thickness, mainRadius + 0.22, 0.08, 16);
  flangeRight.rotateY(-Math.PI / 2);
  flangeRight.position.x = mainLength / 2;
  group.add(flangeRight);

  // Branch takeoff tube (extends in +Y direction)
  const branchGeom = new THREE.CylinderGeometry(branchRadius, branchRadius, branchLength, 32, 1, true);
  const branchMesh = new THREE.Mesh(branchGeom, matSteelDuct);
  branchMesh.position.y = branchLength / 2 + mainRadius * 0.7;
  group.add(branchMesh);

  // Saddle reinforcement collar at tee intersection
  const saddleGeom = new THREE.TorusGeometry(mainRadius + 0.03, 0.08, 12, 32);
  const saddle = new THREE.Mesh(saddleGeom, matFlange);
  saddle.position.y = mainRadius * 0.7;
  group.add(saddle);

  // Branch flange
  const branchFlange = createFlange(branchRadius - thickness, branchRadius + 0.2, 0.08, 12);
  branchFlange.rotateX(Math.PI / 2);
  branchFlange.position.y = branchMesh.position.y + branchLength / 2;
  group.add(branchFlange);

  // Cleaning Port on opposing bottom side
  const portGroup = new THREE.Group();
  portGroup.position.set(0, -mainRadius, 0);
  const standpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 20), matSteelDuct);
  portGroup.add(standpipe);
  const portFlange = createFlange(0.14, 0.28, 0.04, 8);
  portFlange.position.y = -0.18;
  portFlange.rotateX(-Math.PI / 2);
  portGroup.add(portFlange);
  group.add(portGroup);

  return group;
}

// 4. REDUCER / TRANSITION DUCT
function buildReducerDuct() {
  const group = new THREE.Group();
  group.name = 'ReducerTransitionDuct';

  const r1 = 1.35; // Large end radius
  const r2 = 0.85; // Small end radius
  const length = 3.2;
  const thickness = 0.05;

  // Conical cone body
  const coneGeom = new THREE.CylinderGeometry(r2, r1, length, 40, 1, true);
  const coneMesh = new THREE.Mesh(coneGeom, matSteelDuct);
  group.add(coneMesh);

  // Large Flange at bottom (-Y)
  const flangeLarge = createFlange(r1 - thickness, r1 + 0.22, 0.08, 16);
  flangeLarge.rotateX(-Math.PI / 2);
  flangeLarge.position.y = -length / 2;
  group.add(flangeLarge);

  // Small Flange at top (+Y)
  const flangeSmall = createFlange(r2 - thickness, r2 + 0.2, 0.08, 12);
  flangeSmall.rotateX(Math.PI / 2);
  flangeSmall.position.y = length / 2;
  group.add(flangeSmall);

  // Stiffener ribs along taper
  const rib1 = createStiffenerRing(r1 * 0.85 + r2 * 0.15, 0.05, 0.05);
  rib1.position.y = -length * 0.25;
  group.add(rib1);

  const rib2 = createStiffenerRing(r1 * 0.35 + r2 * 0.65, 0.05, 0.05);
  rib2.position.y = length * 0.25;
  group.add(rib2);

  return group;
}

// 5. LECHLER RETRACTABLE LANCE & SPRAY NOZZLE ASSEMBLY
function buildLechlerLance() {
  const group = new THREE.Group();
  group.name = 'LechlerRetractableSprayLance';

  // Base Mounting Flange DN150 (connects to duct port)
  const baseFlange = createFlange(0.08, 0.22, 0.04, 8);
  baseFlange.rotateX(Math.PI / 2);
  group.add(baseFlange);

  // Gland packing / stuffing box seal
  const glandGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.25, 20);
  const gland = new THREE.Mesh(glandGeom, matFlange);
  gland.position.y = 0.14;
  group.add(gland);

  // Actuator support frame / twin guide columns
  const columnGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.8, 16);
  const colA = new THREE.Mesh(columnGeom, matChrome);
  colA.position.set(0.18, 1.05, 0);
  group.add(colA);

  const colB = new THREE.Mesh(columnGeom, matChrome);
  colB.position.set(-0.18, 1.05, 0);
  group.add(colB);

  // Top actuator mounting crossbar
  const crossbarGeom = new THREE.BoxGeometry(0.48, 0.06, 0.16);
  const crossbar = new THREE.Mesh(crossbarGeom, matLechlerBlue);
  crossbar.position.y = 1.95;
  group.add(crossbar);

  // Linear Actuator Drive (Pneumatic / Electric linear cylinder)
  const cylinderGeom = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 24);
  const cylinder = new THREE.Mesh(cylinderGeom, matLechlerBlue);
  cylinder.position.set(0, 1.1, 0);
  group.add(cylinder);

  // Stroke indicator ruler plate
  const rulerGeom = new THREE.BoxGeometry(0.04, 1.3, 0.01);
  const ruler = new THREE.Mesh(rulerGeom, matBrass);
  ruler.position.set(0.09, 1.1, 0.07);
  group.add(ruler);

  // Traveling Carriage (moves up and down with lance stroke)
  const carriageGroup = new THREE.Group();
  carriageGroup.name = 'TravelingCarriage';
  carriageGroup.position.y = 0.75; // intermediate stroke position

  const carriageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.2), matActuatorYellow);
  carriageGroup.add(carriageBlock);

  // Stainless Steel Lance Tube (passes down through center)
  // Outside diameter 48mm, high-grade polished 316L stainless steel
  const lanceTubeGeom = new THREE.CylinderGeometry(0.032, 0.032, 2.8, 24);
  const lanceTube = new THREE.Mesh(lanceTubeGeom, matChrome);
  lanceTube.position.y = -0.6; // extends downwards
  carriageGroup.add(lanceTube);

  // LECHLER MULTI-ORIFICE SPRAY NOZZLE TIP (at lowest tip of lance tube)
  const nozzleTipGroup = new THREE.Group();
  nozzleTipGroup.name = 'LechlerVarioJetNozzleHead';
  nozzleTipGroup.position.y = -2.0;

  // Nozzle body (hex collar + conical tip)
  const nozzleHex = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.08, 6), matBrass);
  nozzleTipGroup.add(nozzleHex);

  const nozzleCone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 24), matBrass);
  nozzleCone.position.y = -0.07;
  nozzleCone.rotateX(Math.PI);
  nozzleTipGroup.add(nozzleCone);

  // Central high-pressure orifice hole
  const centralHole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 16), matSteelDuct);
  centralHole.position.y = -0.12;
  nozzleTipGroup.add(centralHole);

  // 6 radial satellite atomization jets
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12), matChrome);
    jet.position.set(Math.cos(angle) * 0.025, -0.09, Math.sin(angle) * 0.025);
    jet.lookAt(Math.cos(angle) * 0.08, -0.16, Math.sin(angle) * 0.08);
    nozzleTipGroup.add(jet);
  }

  carriageGroup.add(nozzleTipGroup);

  // Supply Manifold & Feed Piping on Carriage
  // High pressure water intake + atomizing air intake
  const manifoldGeom = new THREE.BoxGeometry(0.2, 0.1, 0.14);
  const manifold = new THREE.Mesh(manifoldGeom, matFlange);
  manifold.position.set(0, 0.12, 0);
  carriageGroup.add(manifold);

  // Pressure Gauge (Lechler Bar Indicator)
  const gaugeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 24), matChrome);
  gaugeRing.rotateX(Math.PI / 2);
  gaugeRing.position.set(0, 0.24, 0.09);
  carriageGroup.add(gaugeRing);

  const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  gaugeFace.position.set(0, 0.24, 0.106);
  carriageGroup.add(gaugeFace);

  const gaugeNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.045, 0.005), new THREE.MeshBasicMaterial({ color: 0xcc0000 }));
  gaugeNeedle.position.set(0.01, 0.245, 0.11);
  gaugeNeedle.rotateZ(0.6);
  carriageGroup.add(gaugeNeedle);

  // Flexible Supply Hoses (Curved paths from fixed plant feed to moving carriage)
  const waterCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.5, 2.2, 0),
    new THREE.Vector3(0.4, 1.4, 0.3),
    new THREE.Vector3(0.1, 0.85, 0)
  );
  const waterHose = new THREE.Mesh(new THREE.TubeGeometry(waterCurve, 20, 0.022, 12, false), matHoseBlue);
  group.add(waterHose);

  const airCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.5, 2.2, 0),
    new THREE.Vector3(-0.4, 1.4, 0.3),
    new THREE.Vector3(-0.1, 0.85, 0)
  );
  const airHose = new THREE.Mesh(new THREE.TubeGeometry(airCurve, 20, 0.022, 12, false), matHoseBlack);
  group.add(airHose);

  group.add(carriageGroup);

  return group;
}

// 6. CEMENT PLANT COMPLETE GAS CONDITIONING & DUCT CLEANING SYSTEM
function buildCementPlantSystem() {
  const root = new THREE.Group();
  root.name = 'CementPlantGasConditioningDuctSystem';

  // Concrete Foundation Base
  const baseGeom = new THREE.BoxGeometry(10.0, 0.5, 10.0);
  const baseMesh = new THREE.Mesh(baseGeom, matConcrete);
  baseMesh.position.y = -0.25;
  root.add(baseMesh);

  // Hazard border stripes on base
  const stripeGeom = new THREE.BoxGeometry(9.6, 0.02, 0.4);
  const stripeMesh = new THREE.Mesh(stripeGeom, matActuatorYellow);
  stripeMesh.position.set(0, 0.01, 4.6);
  root.add(stripeMesh);

  // Structural Steel Framework (Columns & Beams for Gas Conditioning Tower Catwalk)
  const columnGeom = new THREE.BoxGeometry(0.25, 6.0, 0.25);
  const colPositions = [
    [-3.2, 3.0, -3.2],
    [3.2, 3.0, -3.2],
    [-3.2, 3.0, 3.2],
    [3.2, 3.0, 3.2],
  ];

  colPositions.forEach(([x, y, z]) => {
    const col = new THREE.Mesh(columnGeom, matFlange);
    col.position.set(x, y, z);
    root.add(col);
  });

  // Cross Beams at platform level (y = 5.0)
  const beamXGeom = new THREE.BoxGeometry(6.6, 0.25, 0.2);
  const beamZGeom = new THREE.BoxGeometry(0.2, 0.25, 6.6);

  const beamA = new THREE.Mesh(beamXGeom, matFlange);
  beamA.position.set(0, 4.9, -3.2);
  root.add(beamA);

  const beamB = new THREE.Mesh(beamXGeom, matFlange);
  beamB.position.set(0, 4.9, 3.2);
  root.add(beamB);

  const beamC = new THREE.Mesh(beamZGeom, matFlange);
  beamC.position.set(-3.2, 4.9, 0);
  root.add(beamC);

  const beamD = new THREE.Mesh(beamZGeom, matFlange);
  beamD.position.set(3.2, 4.9, 0);
  root.add(beamD);

  // Platform Steel Floor Grating
  const floorGeom = new THREE.BoxGeometry(6.4, 0.05, 6.4);
  const floorMesh = new THREE.Mesh(floorGeom, matGripGrating);
  floorMesh.position.y = 5.0;
  root.add(floorMesh);

  // Safety Handrails (Yellow)
  const railGeom = new THREE.CylinderGeometry(0.025, 0.025, 6.4, 16);
  railGeom.rotateZ(Math.PI / 2);

  const railNorth = new THREE.Mesh(railGeom, matActuatorYellow);
  railNorth.position.set(0, 6.1, -3.2);
  root.add(railNorth);

  const railSouth = new THREE.Mesh(railGeom, matActuatorYellow);
  railSouth.position.set(0, 6.1, 3.2);
  root.add(railSouth);

  // Process Duct Line running through tower
  // Horizontal straight duct passing through at y = 3.2
  const ductStraight = buildStraightDuct();
  ductStraight.rotateZ(Math.PI / 2);
  ductStraight.position.set(0, 3.2, 0);
  root.add(ductStraight);

  // Lechler Retractable Lance installed on the duct port
  const lance = buildLechlerLance();
  lance.position.set(0, 4.2, 0);
  root.add(lance);

  // Industrial Control Skid / Electrical Enclosure Cabinet on platform
  const skidCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), matLechlerBlue);
  skidCabinet.position.set(-2.2, 5.6, -2.2);
  root.add(skidCabinet);

  // Skid warning label / beacon light
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), new THREE.MeshBasicMaterial({ color: 0x00ff44 }));
  beacon.position.set(-2.2, 6.26, -2.2);
  root.add(beacon);

  // Access ladder attached to tower
  const ladderRailGeom = new THREE.CylinderGeometry(0.02, 0.02, 5.2, 12);
  const ladA = new THREE.Mesh(ladderRailGeom, matActuatorYellow);
  ladA.position.set(3.35, 2.6, 1.8);
  root.add(ladA);

  const ladB = new THREE.Mesh(ladderRailGeom, matActuatorYellow);
  ladB.position.set(3.35, 2.6, 2.3);
  root.add(ladB);

  const rungGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8);
  rungGeom.rotateX(Math.PI / 2);
  for (let y = 0.4; y < 5.0; y += 0.35) {
    const rung = new THREE.Mesh(rungGeom, matActuatorYellow);
    rung.position.set(3.35, y, 2.05);
    root.add(rung);
  }

  return root;
}

// Export Function
function exportGLB(object, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (gltf) => {
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, Buffer.from(gltf));
        const stats = fs.statSync(filePath);
        console.log(`Generated: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
        resolve(filePath);
      },
      (error) => {
        console.error(`Error exporting ${filename}:`, error);
        reject(error);
      },
      { binary: true }
    );
  });
}

// Main execution
async function main() {
  console.log('Generating GLB models for Duct Faucet Project...');

  await exportGLB(buildStraightDuct(), 'straight_circular_duct.glb');
  await exportGLB(buildLShapedDuct(), 'l_shape_elbow_duct.glb');
  await exportGLB(buildTShapedDuct(), 't_shape_junction_duct.glb');
  await exportGLB(buildReducerDuct(), 'reducer_transition_duct.glb');
  await exportGLB(buildLechlerLance(), 'lechler_retractable_lance.glb');
  await exportGLB(buildCementPlantSystem(), 'cement_plant_duct_cleaning_system.glb');

  console.log('All GLB models successfully exported into public/3dModels/ductfaucet!');
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
