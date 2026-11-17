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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

export type ViewLayoutMode = 'industry' | 'kit';
export type MaterialTheme = 'galvanized' | 'weathered' | 'stainless' | 'safety';
export type CasingVisibility = 'solid' | 'xray';

export interface DuctPieceMeta {
  name: string;
  category: 'Trunk' | 'Branch' | 'Round Spiral' | 'Transition' | 'Register' | 'Hanger' | 'Flexible';
  dimensions: string;
  spec: string;
  cfm: string;
}

interface PieceTransform {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  scale?: THREE.Vector3;
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

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId = 0;
  private lastTime = 0;
  private isBrowser = false;

  // Assembly & Models
  private gltfRoot: THREE.Group | null = null;
  private ductMeshes: THREE.Mesh[] = [];
  private modularNodes: Map<string, THREE.Object3D> = new Map();
  private originalKitTransforms: Map<string, PieceTransform> = new Map();
  private industrialTransforms: Map<string, PieceTransform> = new Map();

  // Particle Airflow Simulation
  private supplyParticleSystem: THREE.Points | null = null;
  private exhaustParticleSystem: THREE.Points | null = null;
  private supplyParticlesGeo!: THREE.BufferGeometry;
  private exhaustParticlesGeo!: THREE.BufferGeometry;
  private supplyPositions!: Float32Array;
  private exhaustPositions!: Float32Array;
  private supplyCurves: THREE.CatmullRomCurve3[] = [];
  private exhaustCurves: THREE.CatmullRomCurve3[] = [];
  private supplyProgress: Float32Array = new Float32Array(0);
  private exhaustProgress: Float32Array = new Float32Array(0);

  // Raycasting for Interactive Inspection
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  hoveredPiece: DuctPieceMeta | null = null;
  selectedPiece: DuctPieceMeta | null = null;

  // Application State & UI
  isLoading = true;
  loadingProgress = 0;
  layoutMode: ViewLayoutMode = 'industry';
  materialTheme: MaterialTheme = 'galvanized';
  casingVisibility: CasingVisibility = 'solid';
  airflowEnabled = true;
  airflowSpeed = 1.0;
  activeCameraPreset = 'iso';
  fps = 60;
  private frameCount = 0;
  private fpsTimer = 0;

  // Transition Animation between Kit and Industry
  private isTransitioning = false;
  private transitionProgress = 0;
  private transitionStartTime = 0;
  private readonly transitionDuration = 1200; // ms

  // Telemetry HUD data
  telemetry = {
    totalLength: '42.8 m',
    airflowRate: '14,500 CFM',
    staticPressure: '1.82 in. w.g.',
    faceVelocity: '880 FPM',
    airTemp: '21.5 °C',
    componentsCount: 38,
    activeRuns: 4,
    filtrationEff: '99.2%',
  };

  // Modular Component Metadata Catalog
  readonly piecesCatalog: Record<string, DuctPieceMeta> = {
    SM_Duct_L_2m_Amo: {
      name: '2000mm Large Rectangular Supply Trunk',
      category: 'Trunk',
      dimensions: '2.00m × 1.08m × 1.08m',
      spec: '16-Gauge Galvanized Sheet Steel, Flanged Joint',
      cfm: '14,500 CFM @ 950 FPM',
    },
    SM_Duct_L_Connectormo: {
      name: 'Large Flanged Collar Joint Connector',
      category: 'Trunk',
      dimensions: '0.11m × 1.11m × 1.11m',
      spec: 'EPDM Sealed Compression Flange',
      cfm: 'Zero-Leakage Rating Class 3',
    },
    SM_Duct_L_Skew_1mmo: {
      name: 'Large-to-Medium Reducer Transition',
      category: 'Transition',
      dimensions: '1.56m × 1.11m × 2.11m',
      spec: 'Aerodynamic Expansion Bellmouth Reducer',
      cfm: 'Transition Static Regain: +0.22 in.',
    },
    SM_Duct_L_Support_2mmo: {
      name: '2.0m Overhead Structural C-Channel Hanger',
      category: 'Hanger',
      dimensions: '0.07m × 2.06m × 1.14m',
      spec: 'M12 Threaded Suspension Drop Rod with Vibration Damper',
      cfm: 'Max Load: 650 kg',
    },
    SM_Duct_L_Support_1mmo: {
      name: '1.0m Structural Intermediate Hanger',
      category: 'Hanger',
      dimensions: '0.07m × 1.06m × 1.14m',
      spec: 'Seismic Restrained Trapeze Hanger',
      cfm: 'Max Load: 450 kg',
    },
    SM_Duct_L_Support_05mmo: {
      name: '0.5m Low-Clearance Support Bracket',
      category: 'Hanger',
      dimensions: '0.07m × 0.56m × 1.14m',
      spec: 'Ceiling Slab Direct Mounting Clamp',
      cfm: 'Max Load: 350 kg',
    },
    SM_Duct_M_4waymo: {
      name: 'Medium 4-Way Cross Distribution Junction',
      category: 'Branch',
      dimensions: '1.10m × 0.61m × 1.10m',
      spec: 'Quad-Port Radial Equalizer with Splitter Vanes',
      cfm: 'Balanced 4-Zone Split (3,625 CFM / port)',
    },
    SM_Duct_M_3waymo: {
      name: 'Medium 3-Way T-Branch Diverter',
      category: 'Branch',
      dimensions: '1.11m × 0.61m × 1.10m',
      spec: 'Internal Curved Turning Baffle',
      cfm: '50/50 Flow Splitter @ 1.2 in. w.g.',
    },
    SM_Duct_M_1m_Amo: {
      name: '1000mm Medium Distribution Duct (Type A)',
      category: 'Branch',
      dimensions: '1.00m × 0.58m × 1.04m',
      spec: '18-Gauge Longitudinal Lock-Seam Galvanized',
      cfm: '7,250 CFM @ 800 FPM',
    },
    SM_Duct_M_1m_Bmo: {
      name: '1000mm Medium Distribution Duct (Type B)',
      category: 'Branch',
      dimensions: '1.00m × 0.50m × 1.00m',
      spec: 'Reinforced Ribbed Exterior Casing',
      cfm: '7,250 CFM @ 800 FPM',
    },
    SM_Duct_M_05m_Amo: {
      name: '500mm Medium Branch Spacer Duct (Type A)',
      category: 'Branch',
      dimensions: '0.50m × 0.54m × 1.03m',
      spec: 'Modular Slip-Fit C-Cleat Joint',
      cfm: '3,800 CFM @ 750 FPM',
    },
    SM_Duct_M_05m_Bmo: {
      name: '500mm Medium Branch Spacer Duct (Type B)',
      category: 'Branch',
      dimensions: '0.50m × 0.50m × 1.00m',
      spec: 'Short Riser Offset Duct',
      cfm: '3,800 CFM @ 750 FPM',
    },
    SM_Duct_M_Corner_Amo: {
      name: '90° Short-Radius Rectangular Elbow',
      category: 'Branch',
      dimensions: '0.61m × 0.61m × 1.11m',
      spec: 'Internal Aerodynamic Turning Vanes',
      cfm: 'Dynamic Pressure Loss Coeff: 0.18',
    },
    SM_Duct_M_Corner_Bmo: {
      name: '90° Long-Radius Full Radius Elbow',
      category: 'Branch',
      dimensions: '1.11m × 0.61m × 1.11m',
      spec: 'Low-Turbulence Full Radius Swept Curve',
      cfm: 'Dynamic Pressure Loss Coeff: 0.11',
    },
    SM_Duct_M_Corner45_Bmo: {
      name: '45° Angle Offset Transition Elbow',
      category: 'Branch',
      dimensions: '0.82m × 0.61m × 1.09m',
      spec: 'Structural Column Bypass Elbow',
      cfm: 'Low Resistance Dogleg Run',
    },
    SM_Duct_M_Skew_150m_Amo: {
      name: '1500mm Vertical Riser Transition (Type A)',
      category: 'Transition',
      dimensions: '1.06m × 1.11m × 1.11m',
      spec: 'Inter-Floor Elevation Step Down',
      cfm: 'Vertical Drop Velocity: 920 FPM',
    },
    SM_Duct_M_Skew_150m_Bmo: {
      name: '1500mm Angled Elevation Riser (Type B)',
      category: 'Transition',
      dimensions: '2.05m × 0.61m × 2.61m',
      spec: 'Compound S-Curve Level Transition',
      cfm: 'Grade Shift: 1.2m Delta-Z',
    },
    SM_Duct_M_Skew_1m_Amo: {
      name: '1000mm Vertical Step Riser (Type A)',
      category: 'Transition',
      dimensions: '1.56m × 1.61m × 1.11m',
      spec: 'Bay Clearance Offset Riser',
      cfm: 'Delta Height: 0.8m',
    },
    SM_Duct_M_Skew_1m_Bmo: {
      name: '1000mm Lateral Offset Riser (Type B)',
      category: 'Transition',
      dimensions: '1.55m × 0.61m × 2.11m',
      spec: 'Lateral Axis Dogleg Offset',
      cfm: 'Horizontal Shift: 1.0m',
    },
    SM_Duct_M_Vent_Amo: {
      name: 'Medium Overhead Linear Slot Supply Register',
      category: 'Register',
      dimensions: '1.00m × 0.65m × 1.04m',
      spec: 'Double-Deflection Adjustable Louver Blades',
      cfm: 'Throw: 8.5m @ 550 FPM terminal',
    },
    SM_Duct_M_Vent_Bmo: {
      name: 'Medium Workcell Downward Supply Diffuser',
      category: 'Register',
      dimensions: '1.00m × 0.67m × 1.04m',
      spec: 'Perforated Face Plate with Volume Damper',
      cfm: '2,200 CFM Laminar Clean Wash',
    },
    SM_Duct_M_Vent_Cmo: {
      name: 'High-Volume Louvered Supply Grille (Type C)',
      category: 'Register',
      dimensions: '1.00m × 0.58m × 1.13m',
      spec: 'Anti-Backdraft Gravity Air Louver',
      cfm: '2,800 CFM @ 620 FPM',
    },
    SM_Duct_M_Vent_Dmo: {
      name: 'Industrial Machining Bay Air Register (Type D)',
      category: 'Register',
      dimensions: '1.00m × 0.58m × 1.23m',
      spec: 'Opposed Blade Damper with Adjustment Lever',
      cfm: '2,400 CFM Concentrated Throw',
    },
    SM_Duct_M_End_Bmo: {
      name: 'Medium Duct Aerodynamic Terminal End Cap',
      category: 'Branch',
      dimensions: '0.18m × 0.61m × 1.11m',
      spec: 'Removable Cleanout Inspection End Cap',
      cfm: 'Positive Pressure Static End Point',
    },
    SM_DuctRound_2mmo: {
      name: '2000mm Spiral Wound Round Exhaust Duct',
      category: 'Round Spiral',
      dimensions: '2.00m × 0.42m × 0.42m',
      spec: 'Continuous Lock-Seam Galvanized Steel 400mm Pipe',
      cfm: '3,200 CFM Exhaust Fume Velocity @ 1,450 FPM',
    },
    SM_DuctRound_1mmo: {
      name: '1000mm Spiral Wound Round Exhaust Duct',
      category: 'Round Spiral',
      dimensions: '1.00m × 0.42m × 0.42m',
      spec: '400mm Diameter Spiral Lock Duct',
      cfm: '3,200 CFM Fume Transport',
    },
    SM_DuctRound_05mmo: {
      name: '500mm Spiral Round Coupling Section',
      category: 'Round Spiral',
      dimensions: '0.25m × 0.42m × 0.42m',
      spec: 'Quick-Clamp Beaded End Sleeve',
      cfm: 'Hermetic Gasket Sealed',
    },
    SM_DuctRound_Cross_Amo: {
      name: 'Round 4-Way Exhaust Cross Collector',
      category: 'Round Spiral',
      dimensions: '0.80m × 0.80m × 0.41m',
      spec: 'Smooth Welded Quad Intersection 400mm',
      cfm: 'Multi-Workstation Fume Header',
    },
    SM_DuctRound_Tmo: {
      name: 'Round 90° T-Branch Collector',
      category: 'Round Spiral',
      dimensions: '0.80m × 0.61m × 0.42m',
      spec: 'Radius Bullhead Tee Junction',
      cfm: 'Branch Extraction: 1,600 CFM',
    },
    SM_DuctRound_Corner_Amo: {
      name: '90° Round Segmented Elbow (Type A)',
      category: 'Round Spiral',
      dimensions: '0.99m × 0.99m × 0.41m',
      spec: '5-Piece Segmented Die-Stamped Bend',
      cfm: 'R/D = 1.5 Low Resistance Bend',
    },
    SM_DuctRound_Corner_Bmo: {
      name: '90° Round Swept Elbow (Type B)',
      category: 'Round Spiral',
      dimensions: '1.00m × 1.00m × 0.42m',
      spec: 'Full Radius Deep Throat Elbow',
      cfm: 'Smooth Exhaust Return Flow',
    },
    SM_DuctRound_Corner_Cmo: {
      name: '45° Round Segmented Offset Elbow (Type C)',
      category: 'Round Spiral',
      dimensions: '0.49m × 0.50m × 0.43m',
      spec: '3-Piece 45° Directional Bend',
      cfm: 'Truss Bypass Bend',
    },
    SM_DuctRound_Corner_Dmo: {
      name: '60° Round Directional Elbow (Type D)',
      category: 'Round Spiral',
      dimensions: '0.79m × 0.49m × 0.41m',
      spec: 'Compound Angle Fume Diverter',
      cfm: 'Direct Drop to Machine Canopy',
    },
    SM_DuctRound_Bentmo: {
      name: 'Flexible Corrugated Heavy-Duty Accordion Pipe',
      category: 'Flexible',
      dimensions: '2.41m × 0.92m × 0.43m',
      spec: 'Multi-Ply Aluminum/PVC Flexible Duct with Wire Helix',
      cfm: 'Vibration Isolating Flexible Drop (0-90° Articulation)',
    },
    SM_DuctRoundSet_Bentmo: {
      name: 'Large Double-Curved S-Bend Corrugated Duct Set',
      category: 'Flexible',
      dimensions: '5.22m × 1.44m × 0.89m',
      spec: 'Reinforced Industrial Machine Extraction Snorkel Assembly',
      cfm: 'High-Temperature Fume Snorkel @ 1,600 CFM',
    },
    SM_DuctRound_Supportmo: {
      name: 'Round Pipe Ceiling Suspension Bracket',
      category: 'Hanger',
      dimensions: '0.07m × 0.80m × 0.42m',
      spec: 'Neoprene Lined 400mm Pipe Clamping Saddle',
      cfm: 'Acoustic & Vibration De-Coupler',
    },
    SM_DuctRound_Ventmo: {
      name: 'Round Radial Cone Ceiling Exhaust Diffuser',
      category: 'Register',
      dimensions: '0.40m × 0.04m × 0.40m',
      spec: '360° Circular Air Pattern with Insect Screen',
      cfm: '1,400 CFM Exhaust Return',
    },
    SM_DuctRound_Vent_Bmo: {
      name: 'Round High-Velocity Exhaust Discharge Bell',
      category: 'Register',
      dimensions: '0.40m × 0.04m × 0.40m',
      spec: 'Terminal Exhaust Nozzle with Protective Grate',
      cfm: '1,800 CFM High-Velocity Jet Discharge',
    },
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initThree();
    this.loadDuctsModel();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  // =========================================================================
  // THREE.JS INITIALIZATION & SCENE SETUP
  // =========================================================================
  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.022);

    // Camera
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 80);
    this.camera.position.set(10.5, 7.5, 11.0);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 45.0;
    this.controls.target.set(0, 2.8, 0);

    // Studio Environment & Lighting
    this.setupLighting();
    this.setupFactoryEnvironment();
    this.setupAirflowParticles();

    // Start Animation Loop
    this.lastTime = performance.now();
    this.animate();
  }

  // =========================================================================
  // LIGHTING & ENVIRONMENT
  // =========================================================================
  private setupLighting(): void {
    // Ambient soft industrial fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    // High-bay Warm Factory Pendant Key Light
    const keyLight = new THREE.DirectionalLight(0xffedd5, 3.8);
    keyLight.position.set(12, 16, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -15;
    keyLight.shadow.camera.right = 15;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    // Cool Cyan Skylight / Floor Reflection Fill
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillLight.position.set(-14, 10, -12);
    this.scene.add(fillLight);

    // Amber Machine Workstation Rim Light
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.6);
    rimLight.position.set(0, -4, -14);
    this.scene.add(rimLight);

    // Overhead Concentrated Bay Spotlights
    const spot1 = new THREE.SpotLight(0x0ea5e9, 4.0, 24, Math.PI / 4, 0.4);
    spot1.position.set(-3, 8.5, 0);
    spot1.target.position.set(-3, 2, 0);
    this.scene.add(spot1);
    this.scene.add(spot1.target);

    const spot2 = new THREE.SpotLight(0xf59e0b, 3.5, 24, Math.PI / 4, 0.4);
    spot2.position.set(3, 8.5, -2.5);
    spot2.target.position.set(3, 2, -2.5);
    this.scene.add(spot2);
    this.scene.add(spot2.target);

    // Procedural Studio Environment for metallic sheet reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();

    const topPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    topPanel.position.set(0, 12, 0);
    topPanel.rotation.x = Math.PI / 2;
    envScene.add(topPanel);

    const sidePanel1 = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    sidePanel1.position.set(-12, 5, 0);
    sidePanel1.rotation.y = Math.PI / 2;
    envScene.add(sidePanel1);

    const sidePanel2 = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    sidePanel2.position.set(12, 5, 0);
    sidePanel2.rotation.y = -Math.PI / 2;
    envScene.add(sidePanel2);

    this.scene.environment = pmrem.fromScene(envScene).texture;

    // Load High-Dynamic-Range Cloister Studio Environment
    const hdrLoader = new HDRLoader();
    hdrLoader.load(
      '/ChessAssets/historic_cloister_passage_2k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
      },
      undefined,
      () => {}
    );
  }

  private setupFactoryEnvironment(): void {
    // 1. Polished Concrete Factory Floor Slab
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.38,
      metalness: 0.65,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Industrial Engineering Grid on Floor
    const grid = new THREE.GridHelper(36, 36, 0x0ea5e9, 0x1e293b);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // 3. Factory Yellow/Black Hazard Striped Workstation Markings
    const zoneGeo = new THREE.RingGeometry(4.5, 4.8, 48);
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      side: THREE.DoubleSide,
    });
    const zone1 = new THREE.Mesh(zoneGeo, zoneMat);
    zone1.rotation.x = -Math.PI / 2;
    zone1.position.set(-2, 0.015, 0);
    this.scene.add(zone1);

    const zone2 = new THREE.Mesh(zoneGeo, zoneMat);
    zone2.rotation.x = -Math.PI / 2;
    zone2.position.set(3.5, 0.015, -2.5);
    this.scene.add(zone2);

    // 4. Overhead Industrial Steel Roof Truss Structure (Holding Hanger Rods)
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.85,
    });

    // Longitudinal Main I-Beams (at ceiling height Y = 6.2m)
    for (let z = -6; z <= 6; z += 4) {
      const beamGeo = new THREE.BoxGeometry(28, 0.35, 0.22);
      const beam = new THREE.Mesh(beamGeo, trussMat);
      beam.position.set(0, 6.2, z);
      beam.castShadow = true;
      this.scene.add(beam);
    }

    // Transverse Ceiling Cross Girders
    for (let x = -12; x <= 12; x += 6) {
      const crossGeo = new THREE.BoxGeometry(0.25, 0.45, 18);
      const cross = new THREE.Mesh(crossGeo, trussMat);
      cross.position.set(x, 6.4, 0);
      cross.castShadow = true;
      this.scene.add(cross);
    }

    // 5. Factory Perimeter Structural Pillars
    const colGeo = new THREE.BoxGeometry(0.7, 6.5, 0.7);
    const pillarPositions: [number, number][] = [
      [-13, -7],
      [-13, 7],
      [13, -7],
      [13, 7],
    ];
    pillarPositions.forEach(([px, pz]) => {
      const col = new THREE.Mesh(colGeo, trussMat);
      col.position.set(px, 3.25, pz);
      col.castShadow = true;
      this.scene.add(col);
    });
  }

  // =========================================================================
  // ANIMATED AIRFLOW STREAMLINE PARTICLES
  // =========================================================================
  private setupAirflowParticles(): void {
    const supplyCount = 280;
    const exhaustCount = 200;

    // Supply Air Curves (Fresh Cool Air through rectangular main and branches)
    this.supplyCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6.2, 4.0, 0),
        new THREE.Vector3(-3.0, 4.0, 0),
        new THREE.Vector3(-0.9, 3.4, 0),
        new THREE.Vector3(1.2, 3.4, 0),
        new THREE.Vector3(2.8, 3.4, 0),
        new THREE.Vector3(2.8, 2.4, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.9, 3.4, 0),
        new THREE.Vector3(-0.9, 3.4, 1.8),
        new THREE.Vector3(1.5, 3.4, 1.8),
        new THREE.Vector3(2.2, 2.4, 1.8),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.9, 3.4, 0),
        new THREE.Vector3(-0.9, 3.4, -1.8),
        new THREE.Vector3(1.0, 3.4, -1.8),
        new THREE.Vector3(1.8, 2.5, -1.8),
      ]),
    ];

    // Exhaust Air Curves (Warm Return Air through round spiral network)
    this.exhaustCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(3.2, 1.8, -3.2),
        new THREE.Vector3(3.2, 3.5, -3.2),
        new THREE.Vector3(2.0, 4.4, -2.8),
        new THREE.Vector3(-1.0, 4.4, -2.8),
        new THREE.Vector3(-4.5, 4.4, -2.8),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(5.0, 2.0, -1.5),
        new THREE.Vector3(4.2, 3.8, -2.2),
        new THREE.Vector3(2.0, 4.4, -2.8),
        new THREE.Vector3(-1.0, 4.4, -2.8),
        new THREE.Vector3(-4.5, 4.4, -2.8),
      ]),
    ];

    // Build Supply Points
    this.supplyPositions = new Float32Array(supplyCount * 3);
    this.supplyProgress = new Float32Array(supplyCount);
    for (let i = 0; i < supplyCount; i++) {
      this.supplyProgress[i] = Math.random();
    }
    this.supplyParticlesGeo = new THREE.BufferGeometry();
    this.supplyParticlesGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.supplyPositions, 3)
    );

    const supplyMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.supplyParticleSystem = new THREE.Points(this.supplyParticlesGeo, supplyMat);
    this.scene.add(this.supplyParticleSystem);

    // Build Exhaust Points
    this.exhaustPositions = new Float32Array(exhaustCount * 3);
    this.exhaustProgress = new Float32Array(exhaustCount);
    for (let i = 0; i < exhaustCount; i++) {
      this.exhaustProgress[i] = Math.random();
    }
    this.exhaustParticlesGeo = new THREE.BufferGeometry();
    this.exhaustParticlesGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.exhaustPositions, 3)
    );

    const exhaustMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.exhaustParticleSystem = new THREE.Points(this.exhaustParticlesGeo, exhaustMat);
    this.scene.add(this.exhaustParticleSystem);
  }

  private updateAirflowParticles(dt: number): void {
    if (!this.airflowEnabled || this.layoutMode !== 'industry') {
      if (this.supplyParticleSystem) this.supplyParticleSystem.visible = false;
      if (this.exhaustParticleSystem) this.exhaustParticleSystem.visible = false;
      return;
    }

    if (this.supplyParticleSystem) this.supplyParticleSystem.visible = true;
    if (this.exhaustParticleSystem) this.exhaustParticleSystem.visible = true;

    const speed = 0.22 * this.airflowSpeed;

    // Update Supply Stream
    const pos = this.supplyPositions;
    const sLen = this.supplyProgress.length;
    for (let i = 0; i < sLen; i++) {
      this.supplyProgress[i] = (this.supplyProgress[i] + dt * speed) % 1.0;
      const curveIdx = i % this.supplyCurves.length;
      const pt = this.supplyCurves[curveIdx].getPoint(this.supplyProgress[i]);

      // Add slight jitter for turbulent air dispersion
      const jitterX = (Math.sin(i * 13.5 + this.lastTime * 0.003) * 0.04);
      const jitterY = (Math.cos(i * 17.2 + this.lastTime * 0.003) * 0.04);
      const jitterZ = (Math.sin(i * 21.8 + this.lastTime * 0.003) * 0.04);

      pos[i * 3] = pt.x + jitterX;
      pos[i * 3 + 1] = pt.y + jitterY;
      pos[i * 3 + 2] = pt.z + jitterZ;
    }
    this.supplyParticlesGeo.attributes['position'].needsUpdate = true;

    // Update Exhaust Stream
    const ePos = this.exhaustPositions;
    const eLen = this.exhaustProgress.length;
    for (let i = 0; i < eLen; i++) {
      this.exhaustProgress[i] = (this.exhaustProgress[i] + dt * speed * 1.15) % 1.0;
      const curveIdx = i % this.exhaustCurves.length;
      const pt = this.exhaustCurves[curveIdx].getPoint(this.exhaustProgress[i]);

      const jitterX = (Math.sin(i * 11.2 + this.lastTime * 0.004) * 0.035);
      const jitterY = (Math.cos(i * 15.7 + this.lastTime * 0.004) * 0.035);
      const jitterZ = (Math.sin(i * 19.3 + this.lastTime * 0.004) * 0.035);

      ePos[i * 3] = pt.x + jitterX;
      ePos[i * 3 + 1] = pt.y + jitterY;
      ePos[i * 3 + 2] = pt.z + jitterZ;
    }
    this.exhaustParticlesGeo.attributes['position'].needsUpdate = true;
  }

  // =========================================================================
  // GLB MODEL LOADING & DUAL-LAYOUT MAPPING
  // =========================================================================
  private loadDuctsModel(): void {
    const loader = new GLTFLoader();
    const modelPath = '/3dModels/ductpipes1/poppy_playtime_chapter_3__duct_pipes.glb';

    loader.load(
      modelPath,
      (gltf) => {
        this.gltfRoot = gltf.scene;

        // Traverse and register all 38 modular kit pieces
        this.gltfRoot.updateMatrixWorld(true);
        this.ductMeshes = [];
        this.modularNodes.clear();
        this.originalKitTransforms.clear();

        this.gltfRoot.traverse((obj) => {
          if (obj.children && obj.children.some((c) => (c as THREE.Mesh).isMesh)) {
            const mesh = obj.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.ductMeshes.push(mesh);
            this.modularNodes.set(obj.name, obj);

            // Store original Kit Palette transform (as in user's image)
            this.originalKitTransforms.set(obj.name, {
              pos: obj.position.clone(),
              rot: obj.rotation.clone(),
              scale: obj.scale.clone(),
            });

            // Attach metadata to mesh userData for raycasting inspection
            const meta = this.piecesCatalog[obj.name] || {
              name: obj.name,
              category: 'Branch',
              dimensions: 'Standard Duct',
              spec: 'Galvanized Sheet Steel',
              cfm: 'Factory Standard',
            };
            mesh.userData['meta'] = meta;
            mesh.userData['nodeName'] = obj.name;
          }
        });

        // Compute the Industrial Plant Assembly positions in meters
        this.buildIndustrialLayoutTransforms();

        // Apply initial layout (Industrial Assembly by default)
        this.applyLayout(this.layoutMode, false);

        // Enhance metallic galvanized PBR materials
        this.enhanceMaterials();
        this.applyCasingVisibility();

        this.scene.add(this.gltfRoot);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (xhr) => {
        if (xhr.total > 0) {
          this.loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
          this.cdr.detectChanges();
        }
      },
      (err) => {
        console.error('Failed to load duct pipes GLB:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // =========================================================================
  // INDUSTRIAL VENTILATION ASSEMBLY LAYOUT CALCULATION
  // Maps all 38 components into an interconnected factory HVAC network
  // =========================================================================
  private buildIndustrialLayoutTransforms(): void {
    // Note: Node positions inside RootNode are in cm (scale 0.01 in Sketchfab_model)
    // Here we define realistic local transforms inside RootNode for each piece:

    const map = this.industrialTransforms;
    const PI = Math.PI;

    // Helper to register node
    const set = (
      name: string,
      x: number,
      y: number,
      z: number,
      rx = -PI / 2,
      ry = 0,
      rz = 0
    ) => {
      map.set(name, {
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(rx, ry, rz),
      });
    };

    // -----------------------------------------------------------------------
    // SECTION 1: MAIN OVERHEAD SUPPLY TRUNK (Large 1.08m x 1.08m)
    // Runs along ceiling at Y = 400cm, Z = 0cm
    // -----------------------------------------------------------------------
    // Intake Connection Wall Flange
    set('SM_Duct_L_Connectormo', 0, 400, -520, -PI / 2, 0, 0);

    // Large 2m Main Supply Trunk
    set('SM_Duct_L_2m_Amo', 0, 400, -400, -PI / 2, 0, 0);

    // Structural Ceiling Hangers for Large Trunk
    set('SM_Duct_L_Support_2mmo', 0, 400, -500, -PI / 2, 0, 0);
    set('SM_Duct_L_Support_1mmo', 0, 400, -320, -PI / 2, 0, 0);
    set('SM_Duct_L_Support_05mmo', 0, 400, -220, -PI / 2, 0, 0);

    // Aerodynamic Transition Reducer (Large 1.08m to Medium 0.60m)
    set('SM_Duct_L_Skew_1mmo', 0, 360, -220, -PI / 2, 0, 0);

    // -----------------------------------------------------------------------
    // SECTION 2: PRIMARY DISTRIBUTION NETWORK (Medium 1.00m x 0.60m)
    // Height Y = 340cm
    // -----------------------------------------------------------------------
    // 4-Way Cross Junction Distributor
    set('SM_Duct_M_4waymo', 0, 340, -100, -PI / 2, 0, 0);

    // Central Forward Trunk
    set('SM_Duct_M_1m_Amo', 0, 340, 20, -PI / 2, 0, 0);
    set('SM_Duct_M_3waymo', 0, 340, 140, -PI / 2, 0, 0);
    set('SM_Duct_M_05m_Amo', 0, 340, 220, -PI / 2, 0, 0);
    set('SM_Duct_M_Vent_Amo', 0, 340, 300, -PI / 2, 0, 0); // Downward Main Louver
    set('SM_Duct_M_End_Bmo', 0, 340, 360, -PI / 2, 0, 0); // Terminal End Cap

    // South Branch Wing (+X direction from 4-way cross at Z = -100)
    set('SM_Duct_M_Corner_Bmo', 60, 340, -100, -PI / 2, 0, PI / 2);
    set('SM_Duct_M_1m_Bmo', 160, 340, -100, -PI / 2, 0, PI / 2);
    set('SM_Duct_M_Skew_150m_Amo', 240, 300, -100, -PI / 2, 0, PI / 2); // Riser down to bay
    set('SM_Duct_M_Vent_Bmo', 320, 260, -100, -PI / 2, 0, PI / 2); // Workstation Diffuser
    set('SM_Duct_M_05m_Bmo', 380, 260, -100, -PI / 2, 0, PI / 2);
    set('SM_Duct_M_Corner45_Bmo', 430, 260, -70, -PI / 2, 0, PI / 4);
    set('SM_Duct_M_Skew_1m_Bmo', 480, 260, -30, -PI / 2, 0, 0);

    // North Branch Wing (-X direction from 4-way cross at Z = -100)
    set('SM_Duct_M_Corner_Amo', -60, 340, -100, -PI / 2, 0, -PI / 2);
    set('SM_Duct_M_Skew_1m_Amo', -160, 300, -100, -PI / 2, 0, -PI / 2);
    set('SM_Duct_M_Vent_Cmo', -240, 260, -100, -PI / 2, 0, -PI / 2);
    set('SM_Duct_M_Skew_150m_Bmo', -320, 260, -100, -PI / 2, 0, -PI / 2);
    set('SM_Duct_M_Vent_Dmo', -400, 260, -100, -PI / 2, 0, -PI / 2);

    // -----------------------------------------------------------------------
    // SECTION 3: SPIRAL ROUND EXHAUST & FUME EXTRACTION (400mm Diameter)
    // Runs parallel at Y = 440cm, X = -280cm
    // -----------------------------------------------------------------------
    set('SM_DuctRound_2mmo', -280, 440, -380, -PI / 2, 0, 0);
    set('SM_DuctRound_Supportmo', -280, 440, -340, -PI / 2, 0, 0);
    set('SM_DuctRound_1mmo', -280, 440, -220, -PI / 2, 0, 0);
    set('SM_DuctRound_Tmo', -280, 440, -120, -PI / 2, 0, 0);
    set('SM_DuctRound_05mmo', -280, 440, -40, -PI / 2, 0, 0);
    set('SM_DuctRound_Cross_Amo', -280, 440, 40, -PI / 2, 0, 0);

    // Round Elbows Dropping to Machine Extraction Canopy
    set('SM_DuctRound_Corner_Amo', -280, 440, 120, -PI / 2, 0, 0);
    set('SM_DuctRound_Corner_Bmo', -280, 380, 180, 0, 0, 0);
    set('SM_DuctRound_Corner_Cmo', -280, 320, 220, -PI / 4, 0, 0);
    set('SM_DuctRound_Corner_Dmo', -280, 270, 250, -PI / 3, 0, 0);

    // Flexible Corrugated Accordion Extraction Snorkels
    set('SM_DuctRound_Bentmo', -280, 220, 270, -PI / 2, 0, PI / 6);
    set('SM_DuctRoundSet_Bentmo', -280, 160, 300, -PI / 2, 0, PI / 4);

    // Terminal Round Exhaust Diffusers & Discharges
    set('SM_DuctRound_Ventmo', -280, 440, 200, -PI / 2, 0, 0);
    set('SM_DuctRound_Vent_Bmo', -280, 110, 330, 0, 0, 0);
  }

  // =========================================================================
  // VIEW MODE SWITCHER & SMOOTH INTERPOLATION
  // =========================================================================
  setLayoutMode(mode: ViewLayoutMode): void {
    if (this.layoutMode === mode || this.isTransitioning) return;
    this.layoutMode = mode;
    this.startTransition();
    this.cdr.detectChanges();
  }

  private startTransition(): void {
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
  }

  private applyLayout(mode: ViewLayoutMode, animate = true): void {
    if (!animate) {
      this.modularNodes.forEach((node, name) => {
        const target =
          mode === 'industry'
            ? this.industrialTransforms.get(name)
            : this.originalKitTransforms.get(name);

        if (target) {
          node.position.copy(target.pos);
          node.rotation.copy(target.rot);
        }
      });
      return;
    }
  }

  private updateTransition(now: number): void {
    if (!this.isTransitioning) return;

    const elapsed = now - this.transitionStartTime;
    const t = Math.min(elapsed / this.transitionDuration, 1.0);

    // Smooth cubic easeInOut
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.modularNodes.forEach((node, name) => {
      const kit = this.originalKitTransforms.get(name);
      const ind = this.industrialTransforms.get(name);

      if (kit && ind) {
        const start = this.layoutMode === 'industry' ? kit : ind;
        const end = this.layoutMode === 'industry' ? ind : kit;

        node.position.lerpVectors(start.pos, end.pos, ease);

        // Quaternion slerp for ultra-smooth 3D rotational blend
        const qStart = new THREE.Quaternion().setFromEuler(start.rot);
        const qEnd = new THREE.Quaternion().setFromEuler(end.rot);
        qStart.slerp(qEnd, ease);
        node.rotation.setFromQuaternion(qStart);
      }
    });

    if (t >= 1.0) {
      this.isTransitioning = false;
      this.applyLayout(this.layoutMode, false);
    }
  }

  // =========================================================================
  // MATERIAL ENHANCEMENTS & PBR THEMES
  // =========================================================================
  setMaterialTheme(theme: MaterialTheme): void {
    this.materialTheme = theme;
    this.enhanceMaterials();
    this.applyCasingVisibility();
  }

  private enhanceMaterials(): void {
    this.ductMeshes.forEach((mesh) => {
      if (!mesh.material) return;

      let mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mesh.userData['clonedMat']) {
        mat = mat.clone();
        mesh.material = mat;
        mesh.userData['clonedMat'] = true;
      }

      mat.envMapIntensity = 2.2;

      switch (this.materialTheme) {
        case 'galvanized': {
          // Standard Industrial Galvanized Zinc Spangle
          mat.color.setHex(0xd1d5db); // light zinc grey
          mat.metalness = 0.88;
          mat.roughness = 0.28;
          break;
        }
        case 'weathered': {
          // Aged Industrial Grunge with Iron Oxide Tone
          mat.color.setHex(0x92400e); // weathered rust tone
          mat.metalness = 0.72;
          mat.roughness = 0.45;
          break;
        }
        case 'stainless': {
          // Cleanroom Specular Mirror Stainless Steel
          mat.color.setHex(0xf8fafc);
          mat.metalness = 0.98;
          mat.roughness = 0.12;
          break;
        }
        case 'safety': {
          // Factory Safety High-Visibility Amber/Black Accents
          const isRound = mesh.name.includes('Round');
          mat.color.setHex(isRound ? 0xeab308 : 0x1e293b);
          mat.metalness = 0.85;
          mat.roughness = 0.24;
          break;
        }
      }

      mat.needsUpdate = true;
    });
  }

  setCasingVisibility(mode: CasingVisibility): void {
    this.casingVisibility = mode;
    this.applyCasingVisibility();
  }

  private applyCasingVisibility(): void {
    this.ductMeshes.forEach((mesh) => {
      if (!mesh.material) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (this.casingVisibility === 'solid') {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthWrite = true;
      } else if (this.casingVisibility === 'xray') {
        mat.transparent = true;
        mat.opacity = 0.32;
        mat.depthWrite = false;
      }
      mat.needsUpdate = true;
    });
  }

  toggleAirflow(): void {
    this.airflowEnabled = !this.airflowEnabled;
  }

  setAirflowSpeed(val: number): void {
    this.airflowSpeed = Number(val);
  }

  // =========================================================================
  // CAMERA PRESETS & SMOOTH GLIDE
  // =========================================================================
  setCameraPreset(preset: string): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [10.5, 7.5, 11.0];
    let lookAt: [number, number, number] = [0, 2.8, 0];

    switch (preset) {
      case 'iso':
        targetPos = [10.5, 7.5, 11.0];
        lookAt = [0, 2.8, 0];
        break;
      case 'supply':
        targetPos = [-4.5, 5.0, 3.5];
        lookAt = [-1.5, 3.6, 0];
        break;
      case 'branches':
        targetPos = [1.5, 3.5, 5.8];
        lookAt = [1.2, 2.8, 0];
        break;
      case 'spiral':
        targetPos = [-5.5, 5.2, -4.5];
        lookAt = [-2.8, 3.8, 0];
        break;
      case 'ground':
        targetPos = [0, 1.2, 6.2];
        lookAt = [0, 3.2, 0];
        break;
      case 'kit':
        targetPos = [0, 1.5, 9.5];
        lookAt = [0, 0.5, 0];
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
  // INTERACTIVE RAYCASTING COMPONENT INSPECTOR
  // =========================================================================
  onPointerMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.ductMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      this.hoveredPiece = hit.userData['meta'] || null;
    } else {
      this.hoveredPiece = null;
    }
  }

  onCanvasClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.ductMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      this.selectedPiece = hit.userData['meta'] || null;
      this.cdr.detectChanges();
    }
  }

  closeInspector(): void {
    this.selectedPiece = null;
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

    // Smooth transition between Kit and Assembly
    this.updateTransition(now);

    // Update Airflow Particles
    this.updateAirflowParticles(dt);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
