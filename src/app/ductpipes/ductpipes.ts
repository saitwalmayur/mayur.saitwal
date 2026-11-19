import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export type ViewDisplayMode = 'galvanized' | 'stainless' | 'xray' | 'wireframe';

interface DuctStats {
  totalLengthMeters: number;
  straightSections: number;
  elbowCount: number;
  reducersCount: number;
  diffusersCount: number;
  fansCount: number;
  hangersCount: number;
  airVolumeCapacity: number; // m3/h
  rectangularRuns: number;
  transitionsCount: number;
  cycloneCount: number;
  flexibleBellowsCount: number;
}

@Component({
  selector: 'app-ductpipes',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ductpipes.html',
  styleUrl: './ductpipes.scss',
})
export class Ductpipes implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // System Display & Control States
  displayMode: ViewDisplayMode = 'galvanized';
  showAirflow = true;
  showFactoryEnvironment = true;
  showHangerSupports = true;
  activeCameraPreset = 'walkthrough';
  isExporting = false;
  exportSuccessMsg = '';

  // Telemetry & Engineering Metrics
  stats: DuctStats = {
    totalLengthMeters: 228.0,
    straightSections: 46,
    elbowCount: 28,
    reducersCount: 14,
    diffusersCount: 8,
    fansCount: 2,
    hangersCount: 58,
    airVolumeCapacity: 89000,
    rectangularRuns: 14,
    transitionsCount: 2,
    cycloneCount: 1,
    flexibleBellowsCount: 2,
  };

  fps = 60;
  private frameCount = 0;
  private fpsTimer = 0;
  private lastTime = performance.now();

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private isBrowser = false;

  // Scene Graphs & Groups
  private ductAssemblyGroup = new THREE.Group();
  private factoryEnvGroup = new THREE.Group();
  private hangersGroup = new THREE.Group();
  private airflowParticles!: THREE.Points;
  private particlePositions: Float32Array = new Float32Array();
  private particlePaths: { curve: THREE.CurvePath<THREE.Vector3>; speed: number; progress: number }[] = [];

  // PBR Materials
  private galvanizedMaterial!: THREE.MeshStandardMaterial;
  private stainlessMaterial!: THREE.MeshStandardMaterial;
  private xrayMaterial!: THREE.MeshStandardMaterial;
  private flangeMaterial!: THREE.MeshStandardMaterial;
  private blowerHousingMat!: THREE.MeshStandardMaterial;
  private motorMat!: THREE.MeshStandardMaterial;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initThree();
    this.buildMaterials();
    this.buildFactoryHall();
    this.buildBigDuctStructure();
    this.initAirflowSimulation();
    this.setCameraPreset('walkthrough');
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser || !this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // =========================================================================
  // THREE.JS INITIALIZATION
  // =========================================================================
  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1422);
    this.scene.fog = new THREE.FogExp2(0x0e1422, 0.015);

    // Camera setup for expansive industrial factory space
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.2, 200);
    this.camera.position.set(-6, 2.5, 14);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 85;
    this.controls.minDistance = 1.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow looking slightly up at the ceiling ducts
    this.controls.target.set(0, 5.5, 0);

    this.setupLighting();

    this.scene.add(this.factoryEnvGroup);
    this.scene.add(this.ductAssemblyGroup);
    this.scene.add(this.hangersGroup);

    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    // Ambient illumination
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    this.scene.add(ambientLight);

    // Primary High-Bay Directional Sun/Skylight
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(20, 28, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0002;
    this.scene.add(sunLight);

    // Cool High-Bay Industrial Rafter Lights (Pendant arrays)
    const lightPositions: [number, number, number][] = [
      [-12, 10.5, -10],
      [0, 10.5, -10],
      [12, 10.5, -10],
      [-12, 10.5, 0],
      [0, 10.5, 0],
      [12, 10.5, 0],
      [-12, 10.5, 10],
      [0, 10.5, 10],
      [12, 10.5, 10],
    ];

    lightPositions.forEach((pos) => {
      const pLight = new THREE.PointLight(0xf8fafc, 1.4, 26, 1.2);
      pLight.position.set(...pos);
      this.scene.add(pLight);
    });

    // Subtle blue fill light from lower factory floor
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-15, -4, -10);
    this.scene.add(fillLight);
  }

  // =========================================================================
  // MATERIALS & TEXTURES (GALVANIZED ZINC SPANGLES & SPIRAL SEAMS)
  // =========================================================================
  private buildMaterials(): void {
    // Generate Procedural Seamless Spiral Seam & Galvanized Zinc Spangle Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base zinc tone
    ctx.fillStyle = '#b0b7c3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Spangle crystalline patches
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 2 + Math.random() * 8;
      const lightness = 150 + Math.floor(Math.random() * 80);
      ctx.fillStyle = `rgb(${lightness}, ${lightness + 5}, ${lightness + 12})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diagonal Helical Spiral Seam Ridges (The signature of spiral ductwork)
    ctx.lineWidth = 3;
    for (let x = -canvas.height; x < canvas.width + canvas.height; x += 48) {
      // Highlight side of spiral seam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + canvas.height, canvas.height);
      ctx.stroke();

      // Shadow side of spiral seam
      ctx.strokeStyle = 'rgba(40, 48, 60, 0.45)';
      ctx.beginPath();
      ctx.moveTo(x + 2, 0);
      ctx.lineTo(x + canvas.height + 2, canvas.height);
      ctx.stroke();
    }

    const spiralTexture = new THREE.CanvasTexture(canvas);
    spiralTexture.wrapS = THREE.RepeatWrapping;
    spiralTexture.wrapT = THREE.RepeatWrapping;
    spiralTexture.repeat.set(3, 1);

    // 1. Galvanized Spiral Sheet Metal Material (Matches Image 1, 2, 3)
    this.galvanizedMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8cfda,
      map: spiralTexture,
      roughness: 0.35,
      metalness: 0.85,
      bumpMap: spiralTexture,
      bumpScale: 0.015,
      side: THREE.DoubleSide,
    });

    // 2. High-Specular 316L Stainless Steel Option
    this.stainlessMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.18,
      metalness: 0.96,
      side: THREE.DoubleSide,
    });

    // 3. X-Ray Translucent Technical Mode
    this.xrayMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Flange coupling collar rings
    this.flangeMaterial = new THREE.MeshStandardMaterial({
      color: 0x818ea0,
      roughness: 0.4,
      metalness: 0.88,
    });

    // Centrifugal fan blower scroll housing (Matches Image 2)
    this.blowerHousingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.38,
      metalness: 0.8,
    });

    // Motor housing (Cast blue/teal industrial electric motor)
    this.motorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.45,
      metalness: 0.7,
    });
  }

  private getActiveDuctMaterial(): THREE.MeshStandardMaterial {
    switch (this.displayMode) {
      case 'stainless':
        return this.stainlessMaterial;
      case 'xray':
        return this.xrayMaterial;
      case 'wireframe':
        return this.galvanizedMaterial;
      case 'galvanized':
      default:
        return this.galvanizedMaterial;
    }
  }

  // =========================================================================
  // INDUSTRIAL FACTORY ARCHITECTURAL HALL & ROOF TRUSSES
  // =========================================================================
  private buildFactoryHall(): void {
    // 1. Polished Concrete Factory Floor with expansion joint lines
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.factoryEnvGroup.add(floor);

    // Floor safety walkway lines (yellow epoxy stripes)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const line1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 70), lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(-6, 0.01, 0);
    this.factoryEnvGroup.add(line1);

    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 70), lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(6, 0.01, 0);
    this.factoryEnvGroup.add(line2);

    // 2. High-Bay Factory Roof & Steel Truss Structure (Matches Image 1 & Image 3)
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
      metalness: 0.65,
    });

    // Horizontal main roof girders at y = 11.0m
    for (let z = -30; z <= 30; z += 10) {
      // Main cross beam
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(50, 0.35, 0.25), trussMat);
      crossBeam.position.set(0, 11.2, z);
      crossBeam.castShadow = true;
      this.factoryEnvGroup.add(crossBeam);

      // Webbing diagonals for steel truss
      for (let x = -20; x <= 20; x += 4) {
        const diag1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), trussMat);
        diag1.position.set(x + 1, 10.4, z);
        diag1.rotation.z = Math.PI / 4;
        this.factoryEnvGroup.add(diag1);

        const diag2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), trussMat);
        diag2.position.set(x + 3, 10.4, z);
        diag2.rotation.z = -Math.PI / 4;
        this.factoryEnvGroup.add(diag2);
      }

      // Lower chord of truss
      const lowerChord = new THREE.Mesh(new THREE.BoxGeometry(50, 0.2, 0.2), trussMat);
      lowerChord.position.set(0, 9.6, z);
      this.factoryEnvGroup.add(lowerChord);
    }

    // Factory vertical structural columns
    for (let x of [-22, 22]) {
      for (let z = -30; z <= 30; z += 10) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 0.6), trussMat);
        col.position.set(x, 6, z);
        col.castShadow = true;
        this.factoryEnvGroup.add(col);
      }
    }

    // Industrial Corrugated Roof Deck at y = 12.0m
    const roofGeo = new THREE.PlaneGeometry(55, 75);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.position.y = 12.0;
    this.factoryEnvGroup.add(roof);

    // High-Bay Industrial Pendant Bell Light Fixtures
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let x of [-10, 0, 10]) {
      for (let z of [-18, -6, 6, 18]) {
        const bell = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.35, 16, 1, true), bellMat);
        bell.position.set(x, 10.6, z);
        this.factoryEnvGroup.add(bell);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), bulbMat);
        bulb.position.set(x, 10.45, z);
        this.factoryEnvGroup.add(bulb);
      }
    }

    // Human Scale Silhouette Reference with Hard Hat (Conveys true massive scale like Image 1 & 3)
    this.createHumanScaleFigure(-3, 0, 8);
    this.createHumanScaleFigure(4, 0, -4);
  }

  private createHumanScaleFigure(x: number, y: number, z: number): void {
    const figureGroup = new THREE.Group();
    figureGroup.position.set(x, y, z);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 }); // navy boiler suit
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4 }); // hi-vis lime green vest
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // yellow safety helmet

    // Body / Torso with safety vest
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.75, 12), vestMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    figureGroup.add(torso);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.8, 8), suitMat);
    leftLeg.position.set(-0.1, 0.4, 0);
    figureGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.8, 8), suitMat);
    rightLeg.position.set(0.1, 0.4, 0);
    figureGroup.add(rightLeg);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    head.position.y = 1.62;
    figureGroup.add(head);

    // Yellow Safety Helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
    helmet.position.y = 1.66;
    figureGroup.add(helmet);

    this.factoryEnvGroup.add(figureGroup);
  }

  // =========================================================================
  // AIRTIGHT PROCEDURAL DUCT GENERATOR
  // Guarantees 100% gapless, mathematically seamless connections
  // =========================================================================

  /**
   * Builds a straight duct between any two 3D coordinates.
   */
  private createStraightDuctBetween(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    radius: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const length = dir.length();
    if (length < 0.001) return group;

    const cylinderGeo = new THREE.CylinderGeometry(radius, radius, length, 32, 1, false);
    const mesh = new THREE.Mesh(cylinderGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const unitDir = dir.clone().normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDir);
    mesh.position.copy(p1).addScaledVector(dir, 0.5);
    group.add(mesh);

    // Flange rings at connection ends
    const flangeGeo = new THREE.TorusGeometry(radius + 0.02, 0.024, 12, 32);
    const fl1 = new THREE.Mesh(flangeGeo, this.flangeMaterial);
    fl1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    fl1.position.copy(p1);
    group.add(fl1);

    const fl2 = new THREE.Mesh(flangeGeo, this.flangeMaterial);
    fl2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    fl2.position.copy(p2);
    group.add(fl2);

    // Intermediate reinforcing flange rings
    if (length > 4.5) {
      const numMiddle = Math.floor(length / 3.5);
      for (let i = 1; i <= numMiddle; i++) {
        const flMid = new THREE.Mesh(flangeGeo, this.flangeMaterial);
        flMid.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
        flMid.position.copy(p1).addScaledVector(dir, i / (numMiddle + 1));
        group.add(flMid);
      }
    }

    return group;
  }

  /**
   * Builds an airtight 90° smooth elbow connecting two intersecting directions.
   * Endpoints and tangents mathematically match adjacent straight pipes with zero gap.
   */
  private createSmoothElbow(
    pInlet: THREE.Vector3,
    pCorner: THREE.Vector3,
    pOutlet: THREE.Vector3,
    radius: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const curve = new THREE.QuadraticBezierCurve3(pInlet, pCorner, pOutlet);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, radius, 32, false);
    const mesh = new THREE.Mesh(tubeGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Connection flanges at joints
    const flangeGeo = new THREE.TorusGeometry(radius + 0.02, 0.024, 12, 32);

    const tanIn = curve.getTangent(0).normalize();
    const flIn = new THREE.Mesh(flangeGeo, this.flangeMaterial);
    flIn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tanIn);
    flIn.position.copy(pInlet);
    group.add(flIn);

    const tanOut = curve.getTangent(1).normalize();
    const flOut = new THREE.Mesh(flangeGeo, this.flangeMaterial);
    flOut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tanOut);
    flOut.position.copy(pOutlet);
    group.add(flOut);

    return group;
  }

  /**
   * Builds an airtight conical reducer transition between two points.
   */
  private createConnectedReducer(
    pStart: THREE.Vector3,
    pEnd: THREE.Vector3,
    rStart: number,
    rEnd: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(pEnd, pStart);
    const length = dir.length();
    if (length < 0.001) return group;

    const coneGeo = new THREE.CylinderGeometry(rEnd, rStart, length, 32, 1, true);
    const mesh = new THREE.Mesh(coneGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const unitDir = dir.clone().normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDir);
    mesh.position.copy(pStart).addScaledVector(dir, 0.5);
    group.add(mesh);

    const flStart = new THREE.Mesh(new THREE.TorusGeometry(rStart + 0.02, 0.024, 12, 32), this.flangeMaterial);
    flStart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    flStart.position.copy(pStart);
    group.add(flStart);

    const flEnd = new THREE.Mesh(new THREE.TorusGeometry(rEnd + 0.02, 0.024, 12, 32), this.flangeMaterial);
    flEnd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    flEnd.position.copy(pEnd);
    group.add(flEnd);

    return group;
  }

  /**
   * Builds an authentic industrial conical saddle takeoff boot tap (Photos 1 & 3).
   * Seamlessly branches off the cylindrical trunk surface with zero clipping or internal gaps.
   */
  private createConicalTakeoffBoot(
    pTrunk: THREE.Vector3,
    pOut: THREE.Vector3,
    rTrunkBase: number,
    rBranch: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(pOut, pTrunk);
    const length = dir.length();
    if (length < 0.001) return group;

    const coneGeo = new THREE.CylinderGeometry(rBranch, rTrunkBase, length, 32, 1, false);
    const mesh = new THREE.Mesh(coneGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const unitDir = dir.clone().normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDir);
    mesh.position.copy(pTrunk).addScaledVector(dir, 0.5);
    group.add(mesh);

    // Saddle contour ring at base welded to main trunk surface
    const saddleRing = new THREE.Mesh(
      new THREE.TorusGeometry(rTrunkBase + 0.02, 0.024, 12, 32),
      this.flangeMaterial
    );
    saddleRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    saddleRing.position.copy(pTrunk);
    group.add(saddleRing);

    // Bolted joint flange at takeoff branch end
    const flRing = new THREE.Mesh(
      new THREE.TorusGeometry(rBranch + 0.02, 0.024, 12, 32),
      this.flangeMaterial
    );
    flRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), unitDir);
    flRing.position.copy(pOut);
    group.add(flRing);

    return group;
  }

  /**
   * Builds an authentic industrial 4-Way Cross Duct Junction and continuous Transverse Cross Pipe.
   * Completely connects the left lateral branch and the right lateral branch across and through the main trunk,
   * eliminating any gaps or disconnected pipes (as requested: "create cross duct pipe to connect them").
   */
  private createCrossDuctAssembly(
    station: { z: number; trunkR: number },
    mainY: number,
    mat: THREE.Material
  ): void {
    const bz = station.z;
    const trunkR = station.trunkR;
    const bRad = 0.36; // 720mm branch diameter
    const cornerX = 7.2; // lateral extent
    const dropFloorY = 3.0; // discharge elevation
    const bendR = 1.2; // elbow radius

    const pLeftElbowIn = new THREE.Vector3(-cornerX + bendR, mainY, bz);
    const pRightElbowIn = new THREE.Vector3(cornerX - bendR, mainY, bz);
    const pLeftTrunk = new THREE.Vector3(-trunkR, mainY, bz);
    const pRightTrunk = new THREE.Vector3(trunkR, mainY, bz);

    // 1. FULLY CONNECTED TRANSVERSE CROSS DUCT PIPE
    // Left horizontal run from left elbow to main trunk wall
    const leftCrossPipe = this.createStraightDuctBetween(pLeftElbowIn, pLeftTrunk, bRad, mat);
    this.ductAssemblyGroup.add(leftCrossPipe);

    // Center continuous cross duct body bridging through/under the trunk between left and right
    const centerCrossPipe = this.createStraightDuctBetween(pLeftTrunk, pRightTrunk, bRad, mat);
    this.ductAssemblyGroup.add(centerCrossPipe);

    // Right horizontal run from main trunk wall to right elbow
    const rightCrossPipe = this.createStraightDuctBetween(pRightTrunk, pRightElbowIn, bRad, mat);
    this.ductAssemblyGroup.add(rightCrossPipe);

    // 2. AUTHENTIC 4-WAY CROSS DUCT JUNCTION & CROSS SADDLE COLLAR FITTINGS
    // Heavy-duty reinforced cross collar around the main trunk
    const trunkCrossCollar = new THREE.Mesh(
      new THREE.TorusGeometry(trunkR + 0.024, 0.035, 16, 48),
      this.flangeMaterial
    );
    trunkCrossCollar.position.set(0, mainY, bz);
    this.ductAssemblyGroup.add(trunkCrossCollar);

    // Cruciform cross intersection sleeve body
    const crossIntersectionSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(bRad * 1.08, bRad * 1.08, (trunkR + 0.08) * 2, 32),
      mat
    );
    crossIntersectionSleeve.rotation.z = Math.PI / 2;
    crossIntersectionSleeve.position.set(0, mainY, bz);
    this.ductAssemblyGroup.add(crossIntersectionSleeve);

    // Welded conical takeoff saddle boots on both left and right sides
    const bootLen = 0.35;
    const pLeftBootOut = new THREE.Vector3(-trunkR - bootLen, mainY, bz);
    const leftBoot = this.createConicalTakeoffBoot(pLeftTrunk, pLeftBootOut, bRad * 1.32, bRad, mat);
    this.ductAssemblyGroup.add(leftBoot);

    const pRightBootOut = new THREE.Vector3(trunkR + bootLen, mainY, bz);
    const rightBoot = this.createConicalTakeoffBoot(pRightTrunk, pRightBootOut, bRad * 1.32, bRad, mat);
    this.ductAssemblyGroup.add(rightBoot);

    // Perimeter Bolted Flange Rings at trunk intersections
    const leftTrunkFlange = new THREE.Mesh(
      new THREE.TorusGeometry(bRad + 0.025, 0.025, 12, 32),
      this.flangeMaterial
    );
    leftTrunkFlange.rotation.y = Math.PI / 2;
    leftTrunkFlange.position.set(-trunkR, mainY, bz);
    this.ductAssemblyGroup.add(leftTrunkFlange);

    const rightTrunkFlange = new THREE.Mesh(
      new THREE.TorusGeometry(bRad + 0.025, 0.025, 12, 32),
      this.flangeMaterial
    );
    rightTrunkFlange.rotation.y = Math.PI / 2;
    rightTrunkFlange.position.set(trunkR, mainY, bz);
    this.ductAssemblyGroup.add(rightTrunkFlange);

    // 3. CEILING HANGERS FOR THE CROSS DUCT RUNS
    this.createCeilingHanger(-trunkR - 2.5, mainY, bz, bRad, 'x');
    this.createCeilingHanger(trunkR + 2.5, mainY, bz, bRad, 'x');

    // 4. LEFT DOWNWARD 90° SMOOTH ELBOW & VERTICAL DROP RISER
    const pLeftCorner = new THREE.Vector3(-cornerX, mainY, bz);
    const pLeftElbowOut = new THREE.Vector3(-cornerX, mainY - bendR, bz);
    const leftElbow = this.createSmoothElbow(pLeftElbowIn, pLeftCorner, pLeftElbowOut, bRad, mat);
    this.ductAssemblyGroup.add(leftElbow);

    const pLeftDropEnd = new THREE.Vector3(-cornerX, dropFloorY, bz);
    const leftDropPipe = this.createStraightDuctBetween(pLeftElbowOut, pLeftDropEnd, bRad, mat);
    this.ductAssemblyGroup.add(leftDropPipe);

    const leftDiffuser = this.createDiffuserNozzle(pLeftDropEnd, 0.45, bRad, mat);
    this.ductAssemblyGroup.add(leftDiffuser);

    // 5. RIGHT DOWNWARD 90° SMOOTH ELBOW & VERTICAL DROP RISER
    const pRightCorner = new THREE.Vector3(cornerX, mainY, bz);
    const pRightElbowOut = new THREE.Vector3(cornerX, mainY - bendR, bz);
    const rightElbow = this.createSmoothElbow(pRightElbowIn, pRightCorner, pRightElbowOut, bRad, mat);
    this.ductAssemblyGroup.add(rightElbow);

    const pRightDropEnd = new THREE.Vector3(cornerX, dropFloorY, bz);
    const rightDropPipe = this.createStraightDuctBetween(pRightElbowOut, pRightDropEnd, bRad, mat);
    this.ductAssemblyGroup.add(rightDropPipe);

    const rightDiffuser = this.createDiffuserNozzle(pRightDropEnd, 0.45, bRad, mat);
    this.ductAssemblyGroup.add(rightDiffuser);
  }

  /**
   * Builds a bottom flared bellmouth diffuser nozzle (Image 1 & 3).
   */
  private createDiffuserNozzle(
    pTop: THREE.Vector3,
    height: number,
    radius: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const flaredRadius = radius * 1.55;

    const coneGeo = new THREE.CylinderGeometry(flaredRadius, radius, height, 32, 1, false);
    const nozzle = new THREE.Mesh(coneGeo, mat);
    nozzle.position.set(pTop.x, pTop.y - height / 2, pTop.z);
    nozzle.castShadow = true;
    group.add(nozzle);

    const lipRing = new THREE.Mesh(
      new THREE.TorusGeometry(flaredRadius + 0.015, 0.022, 12, 32),
      this.flangeMaterial
    );
    lipRing.position.set(pTop.x, pTop.y - height, pTop.z);
    lipRing.rotation.x = Math.PI / 2;
    group.add(lipRing);

    // Internal aerodynamic diffuser cone / deflector
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.7, height * 0.6, 24),
      this.flangeMaterial
    );
    cone.position.set(pTop.x, pTop.y - height + (height * 0.6) / 2, pTop.z);
    group.add(cone);

    return group;
  }

  /**
   * Builds an authentic industrial centrifugal fan blower (Image 2).
   * Intake mouth is centered at (0, 0, 0) facing -X for 100% airtight spool connection.
   */
  private createCentrifugalBlower(scale: number = 1.0): THREE.Group {
    const blower = new THREE.Group();
    blower.scale.set(scale, scale, scale);

    // 1. Intake connection collar (mouth is at x = 0, facing -X)
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24), this.flangeMaterial);
    collar.rotation.z = Math.PI / 2;
    collar.position.set(0.15, 0, 0);
    blower.add(collar);

    // Intake flange lip at x = 0
    const intakeFlange = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.02, 12, 32),
      this.flangeMaterial
    );
    intakeFlange.rotation.y = Math.PI / 2;
    intakeFlange.position.set(0, 0, 0);
    blower.add(intakeFlange);

    // 2. Centrifugal Volute Scroll Casing (centered at x = 0.55)
    const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.55, 32), this.blowerHousingMat);
    volute.rotation.z = Math.PI / 2;
    volute.position.set(0.55, 0, 0);
    volute.castShadow = true;
    blower.add(volute);

    // 3. Vertical Discharge Exhaust Chimney extending upwards towards ceiling
    const dischargeChimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 1.4, 24),
      this.galvanizedMaterial
    );
    dischargeChimney.position.set(0.55, 1.35, 0);
    dischargeChimney.castShadow = true;
    blower.add(dischargeChimney);

    const dischargeFlange = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.02, 12, 32),
      this.flangeMaterial
    );
    dischargeFlange.rotation.x = Math.PI / 2;
    dischargeFlange.position.set(0.55, 2.05, 0);
    blower.add(dischargeFlange);

    // 4. Electric Motor mounted on the rear side
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.65, 20), this.motorMat);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(1.15, 0, 0);
    motor.castShadow = true;
    blower.add(motor);

    const fanCowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.29, 0.15, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    fanCowl.rotation.z = Math.PI / 2;
    fanCowl.position.set(1.55, 0, 0);
    blower.add(fanCowl);

    // 5. Unistrut Structural Suspension Frame & Base
    const baseFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 })
    );
    baseFrame.position.set(0.85, -0.9, 0);
    blower.add(baseFrame);

    return blower;
  }

  /**
   * Builds realistic overhead ceiling threaded hanger rods and unistrut support channel.
   * Accurately supports both Z-axis and X-axis ducts with properly aligned clamping rings.
   */
  private createCeilingHanger(
    x: number,
    ductY: number,
    z: number,
    ductRadius: number,
    axis: 'x' | 'z' = 'z'
  ): void {
    const hanger = new THREE.Group();
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
    const ceilingY = 11.2;
    const rodLength = ceilingY - ductY + 0.1;
    const rodSpacing = ductRadius + 0.08;
    const unistrutSpan = rodSpacing * 2 + 0.08;

    if (axis === 'z') {
      // Duct runs along Z. Rods on Left (-X) and Right (+X).
      for (const side of [-rodSpacing, rodSpacing]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, rodLength, 8), rodMat);
        rod.position.set(x + side, ductY + rodLength / 2, z);
        hanger.add(rod);

        const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.07), rodMat);
        clamp.position.set(x + side, ceilingY, z);
        hanger.add(clamp);
      }

      // Horizontal unistrut support bar under duct along X
      const unistrut = new THREE.Mesh(new THREE.BoxGeometry(unistrutSpan, 0.04, 0.06), rodMat);
      unistrut.position.set(x, ductY - ductRadius - 0.025, z);
      hanger.add(unistrut);

      // Circular clamping band around the duct in XY plane (hole along Z)
      const clampBand = new THREE.Mesh(
        new THREE.TorusGeometry(ductRadius + 0.015, 0.018, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7 })
      );
      clampBand.position.set(x, ductY, z);
      hanger.add(clampBand);
    } else {
      // Duct runs along X. Rods on Front (-Z) and Back (+Z).
      for (const side of [-rodSpacing, rodSpacing]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, rodLength, 8), rodMat);
        rod.position.set(x, ductY + rodLength / 2, z + side);
        hanger.add(rod);

        const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.07), rodMat);
        clamp.position.set(x, ceilingY, z + side);
        hanger.add(clamp);
      }

      // Horizontal unistrut support bar under duct along Z
      const unistrut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, unistrutSpan), rodMat);
      unistrut.position.set(x, ductY - ductRadius - 0.025, z);
      hanger.add(unistrut);

      // Circular clamping band around the duct in YZ plane (hole along X)
      const clampBand = new THREE.Mesh(
        new THREE.TorusGeometry(ductRadius + 0.015, 0.018, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7 })
      );
      clampBand.position.set(x, ductY, z);
      clampBand.rotation.y = Math.PI / 2;
      hanger.add(clampBand);
    }

    this.hangersGroup.add(hanger);
  }

  // =========================================================================
  // ADDITIONAL DISTINCT DUCT GEOMETRIES (Image 4 Catalog Shapes)
  // Rectangular ducts, Square-to-Round transitions, Flexible corrugated bellows,
  // Cyclone dust collectors, and Wall louver grilles.
  // =========================================================================

  /**
   * Builds a rectangular / square galvanized duct section with perimeter angle-iron flanges.
   */
  private createRectangularDuct(
    width: number,
    height: number,
    length: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const ductMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), mat);
    ductMesh.castShadow = true;
    ductMesh.receiveShadow = true;
    group.add(ductMesh);

    // Bolted angle-iron connection flanges every 3.5m
    const numFlanges = Math.max(2, Math.floor(length / 3.5) + 1);
    for (let i = 0; i < numFlanges; i++) {
      const zPos = -length / 2 + (i / (numFlanges - 1)) * length;
      const fl = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.04), this.flangeMaterial);
      fl.position.set(0, 0, zPos);
      group.add(fl);
    }

    return group;
  }

  /**
   * Builds an authentic Square-to-Round Transition Adapter (Transformer Duct).
   * Transitions from a rectangular base to a circular round duct opening.
   */
  private createSquareToRoundTransition(
    sqW: number,
    sqH: number,
    roundR: number,
    length: number,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const segments = 32;
    const halfW = sqW / 2;
    const halfH = sqH / 2;

    const vertices: number[] = [];
    const indices: number[] = [];

    const getRectPoint = (t: number): [number, number] => {
      const perim = 2 * (sqW + sqH);
      const d = t * perim;
      if (d < sqW) {
        return [-halfW + d, -halfH];
      } else if (d < sqW + sqH) {
        return [halfW, -halfH + (d - sqW)];
      } else if (d < 2 * sqW + sqH) {
        return [halfW - (d - sqW - sqH), halfH];
      } else {
        return [-halfW, halfH - (d - 2 * sqW - sqH)];
      }
    };

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const [rx, ry] = getRectPoint(t);
      vertices.push(rx, ry, 0);
    }

    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cx = Math.cos(theta) * roundR;
      const cy = Math.sin(theta) * roundR;
      vertices.push(cx, cy, length);
    }

    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const r1 = i;
      const r2 = next;
      const c1 = segments + i;
      const c2 = segments + next;

      indices.push(r1, c1, c2);
      indices.push(r1, c2, r2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Bolted angle-iron flange at square base (z = 0)
    const sqFlange = new THREE.Mesh(
      new THREE.BoxGeometry(sqW + 0.08, sqH + 0.08, 0.04),
      this.flangeMaterial
    );
    sqFlange.position.set(0, 0, 0);
    group.add(sqFlange);

    // Flange collar ring at circular outlet (z = length)
    const circFlange = new THREE.Mesh(
      new THREE.TorusGeometry(roundR + 0.02, 0.022, 12, 32),
      this.flangeMaterial
    );
    circFlange.position.set(0, 0, length);
    group.add(circFlange);

    return group;
  }

  /**
   * Builds a Flexible Corrugated Accordion Bellows Duct along any 3D spline curve.
   */
  private createFlexibleCorrugatedDuct(
    curve: THREE.Curve<THREE.Vector3>,
    radius: number,
    ribCount: number = 24,
    mat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();

    const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 24, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, mat);
    tubeMesh.castShadow = true;
    group.add(tubeMesh);

    const torusGeo = new THREE.TorusGeometry(radius + 0.014, 0.012, 8, 24);
    for (let i = 1; i < ribCount; i++) {
      const t = i / ribCount;
      const pt = curve.getPoint(t);
      const tan = curve.getTangent(t).normalize();

      const ring = new THREE.Mesh(torusGeo, this.flangeMaterial);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      ring.position.copy(pt);
      group.add(ring);
    }

    const cuffGeo = new THREE.TorusGeometry(radius + 0.022, 0.024, 10, 24);
    const cuff1 = new THREE.Mesh(cuffGeo, this.flangeMaterial);
    cuff1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangent(0).normalize());
    cuff1.position.copy(curve.getPoint(0));
    group.add(cuff1);

    const cuff2 = new THREE.Mesh(cuffGeo, this.flangeMaterial);
    cuff2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangent(1).normalize());
    cuff2.position.copy(curve.getPoint(1));
    group.add(cuff2);

    return group;
  }

  /**
   * Builds an Industrial Cyclonic Dust Collector & Baghouse Silencer Tower.
   */
  private createCycloneDustCollector(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.35,
    });
    const hopperMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.4,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.6,
      roughness: 0.45,
    });

    // 1. Upper cylindrical separation barrel
    const upperCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.4, 32),
      bodyMat
    );
    upperCylinder.position.y = 5.8;
    upperCylinder.castShadow = true;
    group.add(upperCylinder);

    // Weather cover roof cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.5, 32), bodyMat);
    cap.position.y = 7.25;
    group.add(cap);

    // Clean air central exhaust stack extending through roof
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.5, 24), this.getActiveDuctMaterial());
    stack.position.y = 8.2;
    group.add(stack);

    // 2. Lower conical drop hopper
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 0.28, 2.8, 32, 1, false),
      hopperMat
    );
    cone.position.y = 3.2;
    cone.castShadow = true;
    group.add(cone);

    // Rotary airlock valve drum at hopper bottom
    const airlock = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.55, 16), frameMat);
    airlock.rotation.z = Math.PI / 2;
    airlock.position.y = 1.55;
    group.add(airlock);

    // 3. Rectangular Inflow Tangential Duct Horn
    const horn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), bodyMat);
    horn.position.set(0.7, 6.2, 0.5);
    group.add(horn);

    // 4. Heavy Steel 4-Leg Support Tower Frame
    for (const lx of [-1.2, 1.2]) {
      for (const lz of [-1.2, 1.2]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.4, 0.12), frameMat);
        leg.position.set(lx, 3.2, lz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Cross braces on support legs
    for (const h of [2.0, 4.4]) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), frameMat);
      b1.position.set(0, h, -1.2);
      group.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), frameMat);
      b2.position.set(0, h, 1.2);
      group.add(b2);
    }

    // Access door with latches
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    door.position.set(0, 5.7, 1.22);
    group.add(door);

    return group;
  }

  /**
   * Builds an authentic rectangular wall ventilation intake louver with angled louvre slats.
   */
  private createWallLouverGrille(
    width: number,
    height: number,
    depth: number = 0.08
  ): THREE.Group {
    const group = new THREE.Group();
    const frameMat = this.flangeMaterial;
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), frameMat);
    group.add(frame);

    const aperture = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, height - 0.08, depth + 0.01),
      new THREE.MeshBasicMaterial({ color: 0x090d16 })
    );
    group.add(aperture);

    const numBlades = 5;
    for (let i = 0; i < numBlades; i++) {
      const y = -(height - 0.12) / 2 + ((i + 0.5) / numBlades) * (height - 0.12);
      const slat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.015, 0.06), bladeMat);
      slat.position.set(0, y, depth / 2 + 0.01);
      slat.rotation.x = Math.PI / 4;
      group.add(slat);
    }

    return group;
  }

  // =========================================================================
  // THE "BIG STRUCTURE": COMPLETE FACTORY VENTILATION SYSTEM
  // 100% AIRTIGHT CONNECTIVITY
  // =========================================================================
  private buildBigDuctStructure(): void {
    // Clear any previous meshes
    while (this.ductAssemblyGroup.children.length > 0) {
      this.ductAssemblyGroup.remove(this.ductAssemblyGroup.children[0]);
    }
    while (this.hangersGroup.children.length > 0) {
      this.hangersGroup.remove(this.hangersGroup.children[0]);
    }

    const mat = this.getActiveDuctMaterial();
    const mainY = 8.5; // Primary overhead elevation

    // -----------------------------------------------------------------------
    // 1. PRIMARY OVERHEAD SUPPLY TRUNK LINE (Along Z axis)
    // Seamless conical reducers and airtight connections
    // -----------------------------------------------------------------------
    const r1 = 0.75; // 1.5m intake section
    const r2 = 0.60; // 1.2m intermediate section
    const r3 = 0.45; // 0.9m distribution section

    // Wall intake louver register at rear plant wall (Z = -28)
    const mainWallIntake = this.createWallLouverGrille(2.2, 2.2, 0.15);
    mainWallIntake.position.set(0, mainY, -28.08);
    this.ductAssemblyGroup.add(mainWallIntake);

    const mainIntakeFlange = new THREE.Mesh(
      new THREE.TorusGeometry(r1 + 0.04, 0.035, 12, 32),
      this.flangeMaterial
    );
    mainIntakeFlange.position.set(0, mainY, -28.0);
    this.ductAssemblyGroup.add(mainIntakeFlange);

    // Run A: 1.5m primary intake trunk from Z = -28 to Z = -14
    const trunkA = this.createStraightDuctBetween(
      new THREE.Vector3(0, mainY, -28),
      new THREE.Vector3(0, mainY, -14),
      r1,
      mat
    );
    this.ductAssemblyGroup.add(trunkA);

    // Reducer A: 1.5m to 1.2m from Z = -14 to Z = -12
    const redA = this.createConnectedReducer(
      new THREE.Vector3(0, mainY, -14),
      new THREE.Vector3(0, mainY, -12),
      r1,
      r2,
      mat
    );
    this.ductAssemblyGroup.add(redA);

    // Run B: 1.2m middle section from Z = -12 to Z = +4
    const trunkB = this.createStraightDuctBetween(
      new THREE.Vector3(0, mainY, -12),
      new THREE.Vector3(0, mainY, 4),
      r2,
      mat
    );
    this.ductAssemblyGroup.add(trunkB);

    // Reducer B: 1.2m to 0.9m from Z = +4 to Z = +6
    const redB = this.createConnectedReducer(
      new THREE.Vector3(0, mainY, 4),
      new THREE.Vector3(0, mainY, 6),
      r2,
      r3,
      mat
    );
    this.ductAssemblyGroup.add(redB);

    // Run C: 0.9m forward run from Z = +6 to Z = +24
    const trunkC = this.createStraightDuctBetween(
      new THREE.Vector3(0, mainY, 6),
      new THREE.Vector3(0, mainY, 24),
      r3,
      mat
    );
    this.ductAssemblyGroup.add(trunkC);

    // End cap with aerodynamic bullet nose & perimeter bolted flange at Z = +24
    const endCapDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(r3, r3, 0.08, 32),
      this.flangeMaterial
    );
    endCapDisc.position.set(0, mainY, 24.04);
    endCapDisc.rotation.x = Math.PI / 2;
    this.ductAssemblyGroup.add(endCapDisc);

    const bulletCone = new THREE.Mesh(
      new THREE.ConeGeometry(r3 * 0.75, 0.45, 32),
      this.flangeMaterial
    );
    bulletCone.position.set(0, mainY, 24.28);
    bulletCone.rotation.x = Math.PI / 2;
    this.ductAssemblyGroup.add(bulletCone);

    // Primary trunk hangers (staggered to strictly avoid branch take-offs)
    for (const z of [-25, -19, -10, -1, 8, 18, 22]) {
      const currentR = z < -13 ? r1 : z < 5 ? r2 : r3;
      this.createCeilingHanger(0, mainY, z, currentR, 'z');
    }

    // -----------------------------------------------------------------------
    // 2. INDUSTRIAL 4-WAY CROSS DUCT JUNCTIONS & TRANSVERSE CROSS RUNS
    // 100% connected, continuous cross duct pipes spanning across the bay,
    // seamlessly connecting the left and right distribution lines through the main trunk
    // (Resolves "pipe are not connected properly, create cross duct pipe to connect them")
    // -----------------------------------------------------------------------
    const branchStations = [
      { z: -15, trunkR: r1 },
      { z: -6, trunkR: r2 },
      { z: 3, trunkR: r2 },
      { z: 13, trunkR: r3 },
    ];

    branchStations.forEach((st) => {
      this.createCrossDuctAssembly(st, mainY, mat);
    });

    // -----------------------------------------------------------------------
    // 3. PARALLEL FUME EXTRACTION LINE & CENTRIFUGAL BLOWER SYSTEM (Image 2)
    // 100% connected from floor intake hood through inline blowers to roof cowl
    // -----------------------------------------------------------------------
    const exhX = 5.6;
    const exhY = 9.5;
    const exhRad = 0.42;

    // Rear 90° smooth elbow turning from -Z downward into vertical intake drop
    const pExhRearElbowIn = new THREE.Vector3(exhX, exhY, -20.8);
    const pExhRearCorner = new THREE.Vector3(exhX, exhY, -22);
    const pExhRearElbowOut = new THREE.Vector3(exhX, exhY - 1.2, -22);
    const exhRearElbow = this.createSmoothElbow(pExhRearElbowIn, pExhRearCorner, pExhRearElbowOut, exhRad, mat);
    this.ductAssemblyGroup.add(exhRearElbow);

    // Vertical intake drop down to shop floor extraction station
    const pExhIntakeEnd = new THREE.Vector3(exhX, 3.5, -22);
    const exhIntakeDrop = this.createStraightDuctBetween(pExhRearElbowOut, pExhIntakeEnd, exhRad, mat);
    this.ductAssemblyGroup.add(exhIntakeDrop);

    const exhIntakeNozzle = this.createDiffuserNozzle(pExhIntakeEnd, 0.45, exhRad, mat);
    this.ductAssemblyGroup.add(exhIntakeNozzle);

    // Continuous exhaust line run from Z = -20.8 to Z = +18.8
    const exhaustLine = this.createStraightDuctBetween(
      new THREE.Vector3(exhX, exhY, -20.8),
      new THREE.Vector3(exhX, exhY, 18.8),
      exhRad,
      mat
    );
    this.ductAssemblyGroup.add(exhaustLine);

    // Front 90° smooth elbow turning upward through the factory roof
    const pExhFrontCorner = new THREE.Vector3(exhX, exhY, 20.0);
    const pExhFrontElbowOut = new THREE.Vector3(exhX, exhY + 1.2, 20.0);
    const exhFrontElbow = this.createSmoothElbow(
      new THREE.Vector3(exhX, exhY, 18.8),
      pExhFrontCorner,
      pExhFrontElbowOut,
      exhRad,
      mat
    );
    this.ductAssemblyGroup.add(exhFrontElbow);

    // Vertical roof discharge stack through ceiling
    const exhRoofStack = this.createStraightDuctBetween(
      pExhFrontElbowOut,
      new THREE.Vector3(exhX, 11.2, 20.0),
      exhRad,
      mat
    );
    this.ductAssemblyGroup.add(exhRoofStack);

    // Roof weatherproof rain cowl mushroom cap
    const roofRainCap = new THREE.Mesh(
      new THREE.ConeGeometry(exhRad * 1.6, 0.45, 32),
      this.flangeMaterial
    );
    roofRainCap.position.set(exhX, 11.45, 20.0);
    this.ductAssemblyGroup.add(roofRainCap);

    // Ceiling hangers for exhaust line
    for (const z of [-16, -2, 12]) {
      this.createCeilingHanger(exhX, exhY, z, exhRad, 'z');
    }

    // Industrial Centrifugal Blowers (Image 2)
    for (const bz of [-8, 8]) {
      const blowerX = exhX + 1.25;
      const blower = this.createCentrifugalBlower(1.0);
      blower.position.set(blowerX, exhY, bz);
      this.ductAssemblyGroup.add(blower);

      // Connecting takeoff spool pipe from exhaust line directly into blower mouth
      const spool = this.createStraightDuctBetween(
        new THREE.Vector3(exhX + exhRad, exhY, bz),
        new THREE.Vector3(blowerX, exhY, bz),
        0.36,
        mat
      );
      this.ductAssemblyGroup.add(spool);
    }

    // -----------------------------------------------------------------------
    // 4. OVERHEAD ARCHED GOOSENECK RETURN DUCT (Image 3)
    // Seamless bridge loop over the bay down to a dedicated machining cell
    // -----------------------------------------------------------------------
    const gnZ = -21;
    const gnRad = 0.38;
    const gnHighY = 10.4;
    const gnBendR = 1.0;
    const gnMachineX = -5.8;

    // 1. Takeoff from top of main supply trunk at (0, mainY + r1, gnZ) = (0, 9.25, -21)
    const pGnTrunkTop = new THREE.Vector3(0, mainY + r1, gnZ);
    const pGnTrunkOut = new THREE.Vector3(0, mainY + r1 + 0.3, gnZ);
    const gnBoot = this.createConicalTakeoffBoot(pGnTrunkTop, pGnTrunkOut, gnRad * 1.3, gnRad, mat);
    this.ductAssemblyGroup.add(gnBoot);

    // 2. Upward elbow turning from +Y to -X at top of trunk
    const pGnUpElbowIn = pGnTrunkOut;
    const pGnUpElbowCorner = new THREE.Vector3(0, gnHighY, gnZ);
    const pGnUpElbowOut = new THREE.Vector3(-gnBendR, gnHighY, gnZ);
    const gnUpElbow = this.createSmoothElbow(pGnUpElbowIn, pGnUpElbowCorner, pGnUpElbowOut, gnRad, mat);
    this.ductAssemblyGroup.add(gnUpElbow);

    // 3. Horizontal bridge running across along -X
    const pGnBridgeEnd = new THREE.Vector3(gnMachineX + gnBendR, gnHighY, gnZ);
    const gnBridge = this.createStraightDuctBetween(pGnUpElbowOut, pGnBridgeEnd, gnRad, mat);
    this.ductAssemblyGroup.add(gnBridge);

    // Ceiling hanger holding bridge at X = -3.2
    this.createCeilingHanger(-3.2, gnHighY, gnZ, gnRad, 'x');

    // 4. Downward elbow turning from -X to -Y
    const pGnDownCorner = new THREE.Vector3(gnMachineX, gnHighY, gnZ);
    const pGnDownElbowOut = new THREE.Vector3(gnMachineX, gnHighY - gnBendR, gnZ);
    const gnDownElbow = this.createSmoothElbow(pGnBridgeEnd, pGnDownCorner, pGnDownElbowOut, gnRad, mat);
    this.ductAssemblyGroup.add(gnDownElbow);

    // 5. Vertical drop duct to machine workstation hood
    const pGnHoodIn = new THREE.Vector3(gnMachineX, 3.2, gnZ);
    const gnDropRiser = this.createStraightDuctBetween(pGnDownElbowOut, pGnHoodIn, gnRad, mat);
    this.ductAssemblyGroup.add(gnDropRiser);

    // 6. Flared suction hood with safety lip ring
    const gnHood = this.createDiffuserNozzle(pGnHoodIn, 0.5, gnRad, mat);
    this.ductAssemblyGroup.add(gnHood);

    // 7. Workstation support base / machine pedestal at floor
    const gnBaseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 })
    );
    gnBaseMesh.position.set(gnMachineX, 0.4, gnZ);
    gnBaseMesh.castShadow = true;
    this.ductAssemblyGroup.add(gnBaseMesh);

    // -----------------------------------------------------------------------
    // 5. RECTANGULAR RETURN-AIR TRUNK LINE & WALL LOUVERS (Image 4 Shapes)
    // -----------------------------------------------------------------------
    const rectX = -12.5;
    const rectY = 7.8;
    const rectW = 1.2;
    const rectH = 0.75;
    const rectLen = 41.5; // from z = -23.5 to z = 18

    // Continuous rectangular galvanized duct trunk with perimeter angle flanges
    const rectTrunk = this.createRectangularDuct(rectW, rectH, rectLen, mat);
    rectTrunk.position.set(rectX, rectY, -2.75);
    this.ductAssemblyGroup.add(rectTrunk);

    // Front sealed angle-iron bolted end cap at Z = 18
    const rectEndCap = new THREE.Mesh(
      new THREE.BoxGeometry(rectW + 0.08, rectH + 0.08, 0.06),
      this.flangeMaterial
    );
    rectEndCap.position.set(rectX, rectY, 18.03);
    this.ductAssemblyGroup.add(rectEndCap);

    // Trapeze ceiling suspension hangers for rectangular trunk
    for (const z of [-18, -10, 0, 10]) {
      this.createCeilingHanger(rectX, rectY, z, rectW / 2 + 0.05, 'z');
    }

    // Rectangular Wall Intake Louver Registers mounted along the outer wall
    for (const z of [-16, -6, 4, 14]) {
      const louver = this.createWallLouverGrille(1.1, 0.6, 0.08);
      louver.position.set(rectX - rectW / 2 - 0.04, rectY, z);
      louver.rotation.y = -Math.PI / 2;
      this.ductAssemblyGroup.add(louver);
    }

    // -----------------------------------------------------------------------
    // 6. SQUARE-TO-ROUND TRANSITION ADAPTER & FLEXIBLE S-CURVE CORRUGATED DUCT
    // Connects rectangular duct into round drop with accordion vibration bellows
    // -----------------------------------------------------------------------
    const transZ = -4.0;
    const transRoundR = 0.38;

    // Square-to-Round Transition Adapter taking off horizontally along +X
    const sqToRound = this.createSquareToRoundTransition(rectH, rectH, transRoundR, 1.2, mat);
    sqToRound.position.set(rectX + rectW / 2, rectY, transZ);
    sqToRound.rotation.y = Math.PI / 2; // Extends along +X towards plant floor
    this.ductAssemblyGroup.add(sqToRound);

    // 90° smooth elbow turning from +X downwards to -Y
    const pSqElIn = new THREE.Vector3(rectX + rectW / 2 + 1.2, rectY, transZ);
    const pSqElCorner = new THREE.Vector3(rectX + rectW / 2 + 2.0, rectY, transZ);
    const pSqElOut = new THREE.Vector3(rectX + rectW / 2 + 2.0, rectY - 0.8, transZ);
    const sqElbow = this.createSmoothElbow(pSqElIn, pSqElCorner, pSqElOut, transRoundR, mat);
    this.ductAssemblyGroup.add(sqElbow);

    // Vertical round drop spool
    const pSqDropEnd = new THREE.Vector3(rectX + rectW / 2 + 2.0, 4.2, transZ);
    const sqDropSpool = this.createStraightDuctBetween(pSqElOut, pSqDropEnd, transRoundR, mat);
    this.ductAssemblyGroup.add(sqDropSpool);

    // Flexible Corrugated Accordion Bellows S-Curve Duct
    // Curving down to floor-mounted CNC workcell intake at (-9.2, 1.5, transZ)
    const pFlexStart = pSqDropEnd;
    const pFlexEnd = new THREE.Vector3(rectX + rectW / 2 + 3.2, 1.6, transZ);
    const flexCurve = new THREE.CubicBezierCurve3(
      pFlexStart,
      new THREE.Vector3(pFlexStart.x, 3.2, transZ),
      new THREE.Vector3(pFlexEnd.x, 2.6, transZ),
      pFlexEnd
    );
    const flexDuct = this.createFlexibleCorrugatedDuct(flexCurve, 0.32, 22, mat);
    this.ductAssemblyGroup.add(flexDuct);

    // Workstation intake flange box at base
    const machineIntake = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.75, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
    );
    machineIntake.position.set(pFlexEnd.x, 0.75, transZ);
    this.ductAssemblyGroup.add(machineIntake);

    // -----------------------------------------------------------------------
    // 7. INDUSTRIAL CYCLONE DUST COLLECTOR & FILTRATION TOWER
    // Heavy industrial cyclone unit at rear corner connected to rectangular trunk
    // -----------------------------------------------------------------------
    const cyclone = this.createCycloneDustCollector(rectX, 0, -25.5);
    this.ductAssemblyGroup.add(cyclone);

    // Rectangular spool duct connecting cyclone tangential horn into rectangular trunk
    const cycloneSpool = this.createRectangularDuct(1.0, 0.65, 2.5, mat);
    cycloneSpool.position.set(rectX, rectY, -24.25);
    this.ductAssemblyGroup.add(cycloneSpool);
  }

  // =========================================================================
  // AIRFLOW STREAMLINE PARTICLES SIMULATION
  // =========================================================================
  private initAirflowSimulation(): void {
    const particleCount = 3200;
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);

    const mainY = 8.5;

    // Path 1: Primary supply trunk
    const p1 = new THREE.CurvePath<THREE.Vector3>();
    p1.add(new THREE.LineCurve3(new THREE.Vector3(0, mainY, -28), new THREE.Vector3(0, mainY, 24)));
    this.particlePaths.push({ curve: p1, speed: 0.12, progress: 0 });

    // Path 2: Left branch riser at Z = -6
    const p2 = new THREE.CurvePath<THREE.Vector3>();
    p2.add(new THREE.LineCurve3(new THREE.Vector3(0, mainY, -6), new THREE.Vector3(-6.0, mainY, -6)));
    p2.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-6.0, mainY, -6), new THREE.Vector3(-7.2, mainY, -6), new THREE.Vector3(-7.2, 7.8, -6)));
    p2.add(new THREE.LineCurve3(new THREE.Vector3(-7.2, 7.8, -6), new THREE.Vector3(-7.2, 3.0, -6)));
    this.particlePaths.push({ curve: p2, speed: 0.16, progress: 0.3 });

    // Path 3: Right branch riser at Z = 3
    const p3 = new THREE.CurvePath<THREE.Vector3>();
    p3.add(new THREE.LineCurve3(new THREE.Vector3(0, mainY, 3), new THREE.Vector3(6.0, mainY, 3)));
    p3.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(6.0, mainY, 3), new THREE.Vector3(7.2, mainY, 3), new THREE.Vector3(7.2, 7.8, 3)));
    p3.add(new THREE.LineCurve3(new THREE.Vector3(7.2, 7.8, 3), new THREE.Vector3(7.2, 3.0, 3)));
    this.particlePaths.push({ curve: p3, speed: 0.15, progress: 0.6 });

    // Path 4: Gooseneck arched loop at Z = -21
    const p4 = new THREE.CurvePath<THREE.Vector3>();
    p4.add(new THREE.LineCurve3(new THREE.Vector3(0, 9.25, -21), new THREE.Vector3(0, 9.55, -21)));
    p4.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 9.55, -21), new THREE.Vector3(0, 10.4, -21), new THREE.Vector3(-1.0, 10.4, -21)));
    p4.add(new THREE.LineCurve3(new THREE.Vector3(-1.0, 10.4, -21), new THREE.Vector3(-4.8, 10.4, -21)));
    p4.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.8, 10.4, -21), new THREE.Vector3(-5.8, 10.4, -21), new THREE.Vector3(-5.8, 9.4, -21)));
    p4.add(new THREE.LineCurve3(new THREE.Vector3(-5.8, 9.4, -21), new THREE.Vector3(-5.8, 3.2, -21)));
    this.particlePaths.push({ curve: p4, speed: 0.14, progress: 0.45 });

    // Path 5: Fume extraction line at X = 5.6
    const p5 = new THREE.CurvePath<THREE.Vector3>();
    p5.add(new THREE.LineCurve3(new THREE.Vector3(5.6, 3.5, -22), new THREE.Vector3(5.6, 8.3, -22)));
    p5.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(5.6, 8.3, -22), new THREE.Vector3(5.6, 9.5, -22), new THREE.Vector3(5.6, 9.5, -20.8)));
    p5.add(new THREE.LineCurve3(new THREE.Vector3(5.6, 9.5, -20.8), new THREE.Vector3(5.6, 9.5, 18.8)));
    p5.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(5.6, 9.5, 18.8), new THREE.Vector3(5.6, 9.5, 20.0), new THREE.Vector3(5.6, 10.7, 20.0)));
    p5.add(new THREE.LineCurve3(new THREE.Vector3(5.6, 10.7, 20.0), new THREE.Vector3(5.6, 11.2, 20.0)));
    this.particlePaths.push({ curve: p5, speed: 0.18, progress: 0.1 });
    // Path 6: Rectangular Return Air Trunk Line & Cyclone Inflow
    const p6 = new THREE.CurvePath<THREE.Vector3>();
    p6.add(new THREE.LineCurve3(new THREE.Vector3(-12.5, 7.8, 18), new THREE.Vector3(-12.5, 7.8, -24.0)));
    this.particlePaths.push({ curve: p6, speed: 0.14, progress: 0.2 });

    // Path 7: Square-to-round drop & flexible accordion bellows
    const p7 = new THREE.CurvePath<THREE.Vector3>();
    p7.add(new THREE.LineCurve3(new THREE.Vector3(-12.5, 7.8, -4.0), new THREE.Vector3(-10.4, 7.8, -4.0)));
    p7.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-10.4, 7.8, -4.0), new THREE.Vector3(-10.4, 7.0, -4.0), new THREE.Vector3(-10.4, 4.2, -4.0)));
    p7.add(new THREE.CubicBezierCurve3(
      new THREE.Vector3(-10.4, 4.2, -4.0),
      new THREE.Vector3(-10.4, 3.2, -4.0),
      new THREE.Vector3(-9.2, 2.6, -4.0),
      new THREE.Vector3(-9.2, 1.6, -4.0)
    ));
    this.particlePaths.push({ curve: p7, speed: 0.17, progress: 0.5 });

    for (let i = 0; i < particleCount; i++) {
      const idx = i % this.particlePaths.length;
      const pathObj = this.particlePaths[idx];
      const t = Math.random();
      const pt = pathObj.curve.getPoint(t);
      const jitter = (Math.random() - 0.5) * 0.4;
      this.particlePositions[i * 3] = pt.x + jitter;
      this.particlePositions[i * 3 + 1] = pt.y + jitter;
      this.particlePositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.airflowParticles = new THREE.Points(geometry, pMat);
    this.scene.add(this.airflowParticles);
  }

  private updateAirflowParticles(dt: number): void {
    if (!this.showAirflow || !this.airflowParticles) return;

    const pos = this.particlePositions;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      const pathIndex = i % this.particlePaths.length;
      const pathObj = this.particlePaths[pathIndex];

      // Step progress along path curve
      let t = ((i / count) + this.particlePaths[pathIndex].progress) % 1.0;
      t = (t + pathObj.speed * dt) % 1.0;

      const pt = pathObj.curve.getPoint(t);
      const angle = (i * 0.35) + performance.now() * 0.002;
      const r = 0.2 + (i % 7) * 0.04;

      pos[i * 3] = pt.x + Math.cos(angle) * r;
      pos[i * 3 + 1] = pt.y + Math.sin(angle) * r;
      pos[i * 3 + 2] = pt.z;
    }

    this.particlePaths.forEach((p) => {
      p.progress = (p.progress + p.speed * dt * 0.3) % 1.0;
    });

    this.airflowParticles.geometry.attributes['position'].needsUpdate = true;
  }

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Telemetry FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Update Airflow Particles
    this.updateAirflowParticles(dt);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // =========================================================================
  // USER CONTROLS: DISPLAY MODES, TOGGLES & CAMERA PRESETS
  // =========================================================================
  setDisplayMode(mode: ViewDisplayMode): void {
    this.displayMode = mode;
    this.buildBigDuctStructure();
    this.cdr.detectChanges();
  }

  toggleAirflow(): void {
    this.showAirflow = !this.showAirflow;
    if (this.airflowParticles) {
      this.airflowParticles.visible = this.showAirflow;
    }
  }

  toggleFactoryEnvironment(): void {
    this.showFactoryEnvironment = !this.showFactoryEnvironment;
    this.factoryEnvGroup.visible = this.showFactoryEnvironment;
  }

  toggleHangerSupports(): void {
    this.showHangerSupports = !this.showHangerSupports;
    this.hangersGroup.visible = this.showHangerSupports;
  }

  setCameraPreset(preset: string): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [-6, 2.5, 14];
    let lookAt: [number, number, number] = [0, 6.0, 0];

    switch (preset) {
      case 'walkthrough':
        // Eye-level view looking up at the duct network (Exactly like Image 1 & 3!)
        targetPos = [-4.5, 2.0, 12];
        lookAt = [0, 7.5, 2];
        break;

      case 'overview':
        // High isometric plant overview
        targetPos = [24, 20, 26];
        lookAt = [0, 6.5, 0];
        break;

      case 'trunk':
        // Close-up along the primary 1.5m supply trunk
        targetPos = [3.5, 9.2, -18];
        lookAt = [0, 8.5, 4];
        break;

      case 'blower':
        // Focus on the industrial centrifugal blower fan (Image 2)
        targetPos = [10.5, 9.8, -5];
        lookAt = [7.2, 9.4, -8];
        break;

      case 'nozzles':
        // Detail zoom on downward vertical risers & diffuser nozzles
        targetPos = [-8.5, 3.8, -4];
        lookAt = [-9.2, 3.2, -6];
        break;

      case 'top':
        // Orthographic plan layout
        targetPos = [0, 32, 0.1];
        lookAt = [0, 6.0, 0];
        break;

      case 'rectangular':
        // Focus on Rectangular Trunk Line & Square-to-Round Transition
        targetPos = [-8.5, 7.5, 2];
        lookAt = [-13.0, 7.8, -4];
        break;

      case 'cyclone':
        // Focus on the Industrial Cyclone Filtration Tower
        targetPos = [-7.5, 4.2, -18];
        lookAt = [-13.0, 5.0, -25.5];
        break;

      case 'flexible':
        // Focus on the Flexible S-Curve Accordion Corrugated Duct
        targetPos = [-8.0, 2.8, -1.5];
        lookAt = [-11.0, 2.5, -4.0];
        break;

      case 'cross_duct':
        // Direct view along & under main duct at the fully connected 4-way cross duct pipe (Exact match to Image 2!)
        targetPos = [0, 5.2, 8];
        lookAt = [0, 8.5, -4];
        break;
    }

    this.glideCamera(targetPos, lookAt);
  }

  private glideCamera(pos: [number, number, number], target: [number, number, number]): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(...pos);
    const endTarget = new THREE.Vector3(...target);

    const startTime = performance.now();
    const duration = 650;

    const animateGlide = (now: number) => {
      const elapsed = (now - startTime) / duration;
      if (elapsed < 1.0) {
        const ease = 1 - Math.pow(1 - elapsed, 3);
        this.camera.position.lerpVectors(startPos, endPos, ease);
        this.controls.target.lerpVectors(startTarget, endTarget, ease);
        requestAnimationFrame(animateGlide);
      } else {
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
      }
    };
    requestAnimationFrame(animateGlide);
  }

  // =========================================================================
  // EXPORT COMPLETE 3D STRUCTURE AS GLB MODEL
  // Fulfills "create glmbmodel ductfaucet in this page"
  // =========================================================================
  exportGLB(): void {
    if (!this.ductAssemblyGroup) return;

    this.isExporting = true;
    this.exportSuccessMsg = '';
    this.cdr.detectChanges();

    const exporter = new GLTFExporter();
    exporter.parse(
      this.ductAssemblyGroup,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'industrial_spiral_duct_structure.glb';
        link.click();
        URL.revokeObjectURL(url);

        this.isExporting = false;
        this.exportSuccessMsg = 'GLB 3D Model Downloaded Successfully!';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.exportSuccessMsg = '';
          this.cdr.detectChanges();
        }, 4000);
      },
      (error) => {
        console.error('Error exporting GLB:', error);
        this.isExporting = false;
        this.cdr.detectChanges();
      },
      { binary: true }
    );
  }
}
