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

export type GearboxCategory = 'all' | 'industrial' | 'bevel' | 'kinematic' | 'specialty';

export type HousingMode = 'solid' | 'xray' | 'cutaway';

export type MetallicTheme = 'steel' | 'bronze' | 'gold' | 'dark';

export interface TransmissionGear {
  id: string;
  name: string;
  ratio: number;
}

export interface ExplodePart {
  mesh: THREE.Mesh;
  origPos: THREE.Vector3;
  delta: THREE.Vector3;
}

export interface GearboxConfig {
  id: string;
  name: string;
  subtitle: string;
  file: string;
  icon: string;
  badge: string;
  ratioStr: string;
  baseRatio: number;
  efficiency: number;
  category: GearboxCategory;
  description: string;
  scale?: number;
  centerOffset?: [number, number, number];
  rotationOffset?: [number, number, number];
  hasEmbeddedAnimation?: boolean;
}

@Component({
  selector: 'app-gearboxes',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gearboxes.html',
  styleUrl: './gearboxes.scss',
})
export class Gearboxes implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Complete Catalog of 29 Industrial Gearboxes & Mechanical Kinematics
  gearboxes: GearboxConfig[] = [
    // ---------------- INDUSTRIAL GEARBOXES ----------------
    {
      id: 'planetary',
      name: 'Epicyclic Planetary Gearbox',
      subtitle: 'Sun gear, 3 orbiting planet gears, carrier & stationary ring',
      file: '/3dModels/Gearboxes/gearbox_planetary.glb',
      icon: '🪐',
      badge: 'Epicyclic / 4:1',
      ratioStr: '4.00 : 1',
      baseRatio: 4.0,
      efficiency: 97,
      category: 'industrial',
      description:
        'Coaxial high-torque reduction gearbox featuring a central sun gear driving 3 satellite planet gears spaced at 120° that orbit inside a stationary internal ring gear.',
    },
    {
      id: 'worm',
      name: 'Industrial Worm Reduction Gearbox',
      subtitle: '90° skew axis with high-reduction self-locking worm screw drive',
      file: '/3dModels/Gearboxes/warm_gearbox.glb',
      icon: '🪱',
      badge: 'Worm Drive / 30:1',
      ratioStr: '30.00 : 1',
      baseRatio: 30.0,
      efficiency: 78,
      category: 'industrial',
      description:
        'Compact high-ratio speed reducer where a single or multi-start worm screw rotates a perpendicular worm wheel gear with inherent mechanical self-locking braking capability.',
    },
    {
      id: 'warm_gear_box',
      name: 'Heavy Cast Enclosed Worm Drive Unit',
      subtitle: 'Right-angle worm speed reducer in finned heavy cast iron housing',
      file: '/3dModels/Gearboxes/warm_gear_box.glb',
      icon: '🔩',
      badge: 'Enclosed Worm / 40:1',
      ratioStr: '40.00 : 1',
      baseRatio: 40.0,
      efficiency: 76,
      category: 'industrial',
      description:
        'Heavy industrial worm gearbox housed in a ribbed cooling enclosure, engineered for severe conveyor and crane hoist reduction drives.',
    },
    {
      id: 'spur',
      name: 'Dual-Stage Spur Reduction Gearbox',
      subtitle: 'Parallel counter-rotating spur gear train for 3D printed drivetrains',
      file: '/3dModels/Gearboxes/gearbox_for_3d_print.glb',
      icon: '⚙️',
      badge: 'Spur / 2.4:1',
      ratioStr: '2.40 : 1',
      baseRatio: 2.4,
      efficiency: 98,
      category: 'industrial',
      description:
        'Classic parallel-shaft external spur gear speed reducer providing smooth, continuous power transmission with near-zero friction loss and high mechanical efficiency.',
    },
    {
      id: 'turboprop',
      name: 'Turboprop Aviation Reduction Gearbox',
      subtitle: 'High-RPM gas turbine shaft stepped down to propeller with torque splitters',
      file: '/3dModels/Gearboxes/gearbox_propeller_turbine.glb',
      icon: '✈️',
      badge: 'Turboprop / 8:1',
      ratioStr: '8.00 : 1',
      baseRatio: 8.0,
      efficiency: 95,
      category: 'industrial',
      description:
        'Aviation reduction gearbox reducing ultra-high-speed gas turbine shaft RPM down to propeller speed using balanced 4-branch compound idler gear torque splitters.',
    },
    {
      id: 'transmission',
      name: '5-Speed Manual Automotive Transmission',
      subtitle: 'Constant-mesh countershaft gearbox with selectable forward & reverse gears',
      file: '/3dModels/Gearboxes/transmission_model_for_3d_printing.glb',
      icon: '🏎️',
      badge: 'Manual 5-Speed',
      ratioStr: 'Variable',
      baseRatio: 2.4,
      efficiency: 94,
      category: 'industrial',
      description:
        'Automotive constant-mesh manual transmission with synchronized layshaft gears providing 5 forward speeds plus reverse with real-time shift ratios and overdrive.',
    },
    {
      id: 'manual_transmission_gear_box',
      name: 'Industrial Synchromesh Transmission',
      subtitle: 'Enclosed multi-ratio automotive transmission with selector forks and shafts',
      file: '/3dModels/Gearboxes/manual_transmission_gear_box.glb',
      icon: '🕹️',
      badge: 'Synchromesh',
      ratioStr: 'Multi-Ratio',
      baseRatio: 3.2,
      efficiency: 93,
      category: 'industrial',
      description:
        'Detailed heavy-duty manual synchromesh transmission displaying input shaft, intermediate countershaft, output shaft gears, and shifting linkage mechanisms.',
    },
    {
      id: 'planetary_gear',
      name: 'High-Precision Industrial Planetary Reducer',
      subtitle: 'Servo planetary gearhead with helical planet gears and carrier',
      file: '/3dModels/Gearboxes/planetary_gear.glb',
      icon: '🎯',
      badge: 'Servo / 5:1',
      ratioStr: '5.00 : 1',
      baseRatio: 5.0,
      efficiency: 97,
      category: 'industrial',
      description:
        'Zero-backlash precision planetary reducer engineered for CNC robotics, high-dynamic servomotors, and precise motion control automation systems.',
      hasEmbeddedAnimation: true,
    },

    // ---------------- BEVEL, CONICAL & SKEW SYSTEMS ----------------
    {
      id: 'conical',
      name: '90° Bevel (Conical) Gearbox',
      subtitle: 'Right-angle intersecting transmission with helical conical teeth',
      file: '/3dModels/Gearboxes/gearbox_conical.glb',
      icon: '📐',
      badge: 'Bevel / 1.5:1',
      ratioStr: '1.50 : 1',
      baseRatio: 1.5,
      efficiency: 96,
      category: 'bevel',
      description:
        'Intersecting shaft transmission transferring rotational drive at a 90-degree right angle through precision-machined conical bevel pinion and crown gears.',
    },
    {
      id: 'bevel_gears',
      name: 'Precision 90° Bevel Gearset',
      subtitle: 'Dual intersecting conical gears with 1:1 right-angle drive transfer',
      file: '/3dModels/Gearboxes/bevel_gears.glb',
      icon: '⚡',
      badge: 'Right-Angle / 1:1',
      ratioStr: '1.00 : 1',
      baseRatio: 1.0,
      efficiency: 97,
      category: 'bevel',
      description:
        'Clean right-angle intersecting shaft gear pair with precision conical pitch surfaces and tooth profile mesh for direct directional torque diversion.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'triple_speed_bevel_gears',
      name: 'Triple-Speed Bevel Gear Transmission',
      subtitle: 'Three-ratio selectable bevel gear cluster with shifting crown clutches',
      file: '/3dModels/Gearboxes/triple_speed_bevel_gears.glb',
      icon: '🔱',
      badge: 'Triple-Speed',
      ratioStr: '3 Selectable',
      baseRatio: 1.8,
      efficiency: 95,
      category: 'bevel',
      description:
        'Multi-speed right-angle gearbox equipped with 3 stepped bevel gear stages that provide selectable speed ratios and directional drive reversal.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'hypoid_gear',
      name: 'Automotive Offset Hypoid Gearset',
      subtitle: 'Non-intersecting offset spiral bevel drive for rear differential axles',
      file: '/3dModels/Gearboxes/hypoid_gear.glb',
      icon: '🚙',
      badge: 'Hypoid / 3.73:1',
      ratioStr: '3.73 : 1',
      baseRatio: 3.73,
      efficiency: 92,
      category: 'bevel',
      description:
        'Hyperbolic spiral bevel gear pair with an offset pinion shaft, widely utilized in automotive rear-wheel-drive differentials to lower the vehicle center of gravity.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'herringbone_gears',
      name: 'Double-Helical Herringbone Gears',
      subtitle: 'Self-balancing zero-axial-thrust chevron herringbone gear pair',
      file: '/3dModels/Gearboxes/herringbone_gears.glb',
      icon: '〰️',
      badge: 'Herringbone / 1:1',
      ratioStr: '1.00 : 1',
      baseRatio: 1.0,
      efficiency: 98,
      category: 'bevel',
      description:
        'Opposed double-helical herringbone teeth cancel out all axial thrust loads, allowing extremely high torque capacity, quiet operation, and prolonged service life.',
      hasEmbeddedAnimation: true,
    },

    // ---------------- KINEMATIC & INDEXING MECHANISMS ----------------
    {
      id: 'beaver-tail_indexing_mechanism',
      name: 'Beaver-Tail Geneva Indexing Drive',
      subtitle: 'Intermittent indexing rotary motion mechanism with locking dwell arc',
      file: '/3dModels/Gearboxes/beaver-tail_indexing_mechanism.glb',
      icon: '🦫',
      badge: 'Indexing Dwell',
      ratioStr: 'Intermittent 4:1',
      baseRatio: 4.0,
      efficiency: 89,
      category: 'kinematic',
      description:
        'High-precision mechanical indexing drive converting continuous uniform input rotation into stepped intermittent rotary index steps with rigid mechanical locking dwell periods.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'hypociclic_scotch_yoke_mechanism',
      name: 'Hypocycloid Scotch Yoke Mechanism',
      subtitle: 'Rotary-to-linear conversion with perfect sinusoidal reciprocating slide',
      file: '/3dModels/Gearboxes/hypociclic_scotch_yoke_mechanism.glb',
      icon: '↔️',
      badge: 'Scotch Yoke',
      ratioStr: 'Harmonic 1:1',
      baseRatio: 1.0,
      efficiency: 91,
      category: 'kinematic',
      description:
        'Precision mechanical conversion mechanism converting uniform rotational input into purely sinusoidal linear reciprocating sliding motion with zero side-thrust on the rod.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'gears_pump_mechanism',
      name: 'External Positive Displacement Gear Pump',
      subtitle: 'Intermeshing hydraulic pump gears in fluid-tight chamber',
      file: '/3dModels/Gearboxes/gears_pump_mechanism.glb',
      icon: '💧',
      badge: 'Hydraulic Pump',
      ratioStr: '1.00 : 1',
      baseRatio: 1.0,
      efficiency: 88,
      category: 'kinematic',
      description:
        'Hydraulic positive-displacement external gear pump. The intermeshing teeth create an expanding volume at the suction inlet and force fluid through the discharge outlet.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'gear_wheel_train_for_superposition_of_2',
      name: 'Differential Superposition Gear Train',
      subtitle: 'Two-input differential gear mechanism for mathematical motion summation',
      file: '/3dModels/Gearboxes/gear_wheel_train_for_superposition_of_2....glb',
      icon: '🎛️',
      badge: 'Differential Sum',
      ratioStr: 'Dual Input',
      baseRatio: 2.0,
      efficiency: 94,
      category: 'kinematic',
      description:
        'Epicyclic differential gear train capable of superimposing two independent rotational inputs into a single mathematically summed output shaft rotation.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'reciprocating_eccentric_gears_mechanism',
      name: 'Eccentric Reciprocating Gear Train',
      subtitle: 'Cam-driven non-concentric gears producing variable dwell stroke motion',
      file: '/3dModels/Gearboxes/reciprocating_eccentric_gears_mechanism.glb',
      icon: '🔄',
      badge: 'Eccentric Dwell',
      ratioStr: 'Oscillating',
      baseRatio: 1.0,
      efficiency: 90,
      category: 'kinematic',
      description:
        'Eccentrically mounted gear linkage generating continuous cyclic variable speed and oscillating mechanical stroke acceleration curves.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'reciprocating_gears_mechanism',
      name: 'Oscillating Sector Gear Mechanism',
      subtitle: 'Continuous rotation to reciprocating rocking oscillation drive',
      file: '/3dModels/Gearboxes/reciprocating_gears_mechanism.glb',
      icon: '🔃',
      badge: 'Reciprocating',
      ratioStr: 'Oscillating',
      baseRatio: 1.0,
      efficiency: 91,
      category: 'kinematic',
      description:
        'Mechanical linkage utilizing a rotating crank and swinging sector gear to produce smooth periodic angular back-and-forth oscillation.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'worm_gears_xy_table',
      name: 'Dual Worm Gear Precision XY Table',
      subtitle: 'Orthogonal dual-axis lead screw and worm gear positioning stage',
      file: '/3dModels/Gearboxes/worm_gears_xy_table.glb',
      icon: '📐',
      badge: 'XY Positioning',
      ratioStr: 'Dual Axis',
      baseRatio: 20.0,
      efficiency: 82,
      category: 'kinematic',
      description:
        'High-precision dual-axis industrial positioning table driven by perpendicular worm gear sets and precision lead screws for micrometer-accurate automated motion.',
      hasEmbeddedAnimation: true,
    },

    // ---------------- SPECIALTY & MATHEMATICAL GEAR SYSTEMS ----------------
    {
      id: 'animated_nautilus_gears',
      name: 'Nautilus Logarithmic Spiral Gears',
      subtitle: 'Continuous variable ratio non-circular logarithmic gear mesh',
      file: '/3dModels/Gearboxes/animated_nautilus_gears.glb',
      icon: '🐚',
      badge: 'Variable Ratio',
      ratioStr: '0.50 - 2.00 : 1',
      baseRatio: 1.0,
      efficiency: 92,
      category: 'specialty',
      description:
        'Non-circular logarithmic spiral gear pair that delivers continuously modulating non-linear output velocity and cyclic torque variation throughout each 360° revolution.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'cube_gears',
      name: '3D Interlocking Cube Gears',
      subtitle: 'Symmetrical 8-node isometric omnidirectional kinematic cube',
      file: '/3dModels/Gearboxes/cube_gears.glb',
      icon: '🎲',
      badge: 'Omni 3D Mesh',
      ratioStr: '1.00 : 1',
      baseRatio: 1.0,
      efficiency: 91,
      category: 'specialty',
      description:
        'Complex 3D interlocking gear assemblage arranged along the vertices of a cube, where all corner gears mesh simultaneously in synchronized three-dimensional harmony.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'fun_with_gears_xxi',
      name: 'Harmonic Epicyclic Train XXI',
      subtitle: 'Multi-rotor compound planetary gear cluster with orbiting satellites',
      file: '/3dModels/Gearboxes/fun_with_gears_xxi.glb',
      icon: '🔮',
      badge: 'Compound / 12:1',
      ratioStr: '12.00 : 1',
      baseRatio: 12.0,
      efficiency: 93,
      category: 'specialty',
      description:
        'Intricate compound epicyclic gear mechanism with cascading planetary satellite stages, demonstrating high-reduction compact gear train physics.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'fun_with_gears_xxxii',
      name: 'High-Density Planetary Array XXXII',
      subtitle: 'Massive multi-stage concentric reduction gear train with 1200+ mesh teeth',
      file: '/3dModels/Gearboxes/fun_with_gears_xxxii.glb',
      icon: '🌌',
      badge: 'Multi-Stage / 64:1',
      ratioStr: '64.00 : 1',
      baseRatio: 64.0,
      efficiency: 88,
      category: 'specialty',
      description:
        'Monumental high-density multi-stage planetary cluster featuring interlocking concentric gear rings and satellite clusters for ultra-high torque multiplication.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'fun_with_gears_xxxxi',
      name: 'Kinematic Gear Assemblage XXXXI',
      subtitle: 'Synchronized compound gear mechanism with nested revolving rotors',
      file: '/3dModels/Gearboxes/fun_with_gears_xxxxi.glb',
      icon: '🌀',
      badge: 'Nested / 16:1',
      ratioStr: '16.00 : 1',
      baseRatio: 16.0,
      efficiency: 92,
      category: 'specialty',
      description:
        'Precision mechanical apparatus showcasing complex multi-axis gear mesh kinematics with synchronized counter-rotating gear clusters.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'gears',
      name: 'Classic Spur Gearmesh Pair',
      subtitle: 'Fundamental external involute spur gears on parallel drive shafts',
      file: '/3dModels/Gearboxes/gears.glb',
      icon: '⚙️',
      badge: 'Spur / 1:1',
      ratioStr: '1.00 : 1',
      baseRatio: 1.0,
      efficiency: 98,
      category: 'specialty',
      description:
        'Textbook involute profile external spur gear pair demonstrating fundamental mechanical gear mesh contact, line of action, and pressure angles.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'gears_-_ingralarghi',
      name: 'Heavy Industrial Cast Spur Gears',
      subtitle: 'Wide-face heavy-duty cast steel spur gears for heavy mining equipment',
      file: '/3dModels/Gearboxes/gears_-_ingralarghi.glb',
      icon: '🏗️',
      badge: 'Heavy Cast / 2:1',
      ratioStr: '2.00 : 1',
      baseRatio: 2.0,
      efficiency: 96,
      category: 'specialty',
      description:
        'Substantial wide-face heavy industrial cast steel spur gear assembly designed for high-shock loads and sustained industrial duty cycles.',
    },
    {
      id: 'gears_animation',
      name: 'Synchronized Multi-Shaft Gear Train',
      subtitle: 'Continuous compound gear cascade with animated gear interlocks',
      file: '/3dModels/Gearboxes/gears_animation.glb',
      icon: '⏱️',
      badge: 'Cascade / 6:1',
      ratioStr: '6.00 : 1',
      baseRatio: 6.0,
      efficiency: 95,
      category: 'specialty',
      description:
        'Multi-shaft compound speed reduction gear train demonstrating synchronized motion transfer across parallel stepped shafts.',
      hasEmbeddedAnimation: true,
    },
    {
      id: 'gears_mechanism',
      name: 'Open Frame Reduction Gearset',
      subtitle: 'Dual-stage reduction spur gear train mounted on structural chassis',
      file: '/3dModels/Gearboxes/gears_mechanism.glb',
      icon: '🔧',
      badge: 'Open Frame / 5:1',
      ratioStr: '5.00 : 1',
      baseRatio: 5.0,
      efficiency: 97,
      category: 'specialty',
      description:
        'Open-architecture mechanical chassis revealing bearing supports, idler shafts, and dual reduction spur gear mesh stages.',
    },
  ];

  selectedGearbox: GearboxConfig = this.gearboxes[0];

  // Filtering & Search
  selectedCategory: GearboxCategory = 'all';
  searchQuery: string = '';

  get filteredGearboxes(): GearboxConfig[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.gearboxes.filter((g) => {
      const matchCat = this.selectedCategory === 'all' || g.category === this.selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.badge.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    });
  }

  // Manual Transmission Gear Table
  transmissionGears: TransmissionGear[] = [
    { id: '1', name: '1st Gear', ratio: 3.82 },
    { id: '2', name: '2nd Gear', ratio: 2.38 },
    { id: '3', name: '3rd Gear', ratio: 1.58 },
    { id: '4', name: '4th Gear', ratio: 1.12 },
    { id: '5', name: '5th Gear (OD)', ratio: 0.84 },
    { id: 'R', name: 'Reverse', ratio: -3.55 },
  ];
  selectedTransmissionGear: TransmissionGear = this.transmissionGears[1]; // default 2nd

  // Operational State & Controls
  isDropdownOpen = false;
  isPlaying = false;
  isReversed = false;
  rpm = 1200; // Motor Input RPM (10 to 3000)
  housingMode: HousingMode = 'xray';
  metallicTheme: MetallicTheme = 'steel';
  isMuted = true;
  isLoading = false;
  loadingProgress = 0;
  activeCameraPreset = 'iso';

  // Animation System
  private mixer: THREE.AnimationMixer | null = null;
  hasEmbeddedAnimation = false;

  // Live Telemetry Readout
  telemetry = {
    inputRpm: 1200,
    outputRpm: 300,
    inputOmega: 125.7, // rad/s
    outputOmega: 31.4, // rad/s
    ratio: '4.00 : 1',
    torqueMult: '4.00x',
    inputTorque: 25.0, // Nm
    outputTorque: 97.0, // Nm
    mechanicalPower: '3.14 kW',
    temperature: '48.5 °C',
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

  // Active Gearbox Hierarchy
  private currentModelGroup: THREE.Group | null = null;
  private casingMeshes: THREE.Mesh[] = [];

  // Exploded View Disassembly State
  explodeProgress: number = 0;
  targetExplodeProgress: number = 0;
  isExploded: boolean = false;
  private explodeParts: ExplodePart[] = [];

  // Audio Engine
  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initThree();
    this.loadGearbox(this.selectedGearbox);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.stopAudio();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.gearbox-dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
  }

  // =========================================================================
  // INITIALIZATION & ENVIRONMENT SETUP
  // =========================================================================
  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // WebGL Renderer with High Precision & Physically Correct Color Space
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene & Dark High-Tech Technical Studio Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(4.8, 3.8, 5.2);

    // Smooth Orbit Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 24;
    this.controls.minDistance = 0.6;
    this.controls.target.set(0, 0, 0);

    // Cinematic Industrial Lighting & HDRI Environment
    this.setupLighting();

    // Studio Pedestal Stage & Grid
    this.setupStudioStage();

    // Start loop
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    // Cool Key Light
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 3.4);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // Cyan Industrial Rim Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillLight.position.set(-8, 5, -6);
    this.scene.add(fillLight);

    // Warm Accent Rim Light
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.6);
    rimLight.position.set(0, -6, -8);
    this.scene.add(rimLight);

    // Shaft Focus Spotlight
    const spot = new THREE.SpotLight(0x67e8f9, 4.5, 18, Math.PI / 4, 0.4);
    spot.position.set(0, 8, 3);
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);

    // High-Contrast Studio Environment Map for Realistic Metallic Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    const topLight = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    topLight.position.set(0, 8, 0);
    topLight.rotation.x = Math.PI / 2;
    envScene.add(topLight);

    const sideLight1 = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    sideLight1.position.set(-8, 3, 0);
    sideLight1.rotation.y = Math.PI / 2;
    envScene.add(sideLight1);

    const sideLight2 = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    sideLight2.position.set(8, 3, 0);
    sideLight2.rotation.y = -Math.PI / 2;
    envScene.add(sideLight2);

    const envTex = pmrem.fromScene(envScene).texture;
    this.scene.environment = envTex;

    // Load High-Dynamic-Range Cloister Studio Environment
    const hdrLoader = new HDRLoader();
    hdrLoader.load(
      '/ChessAssets/historic_cloister_passage_2k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
      },
      undefined,
      () => {
        // Fallback procedural environment is already active
      }
    );
  }

  private setupStudioStage(): void {
    // Pedestal stage top
    const stageGeo = new THREE.CylinderGeometry(3.2, 3.5, 0.35, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -1.8;
    stage.receiveShadow = true;
    this.scene.add(stage);

    // Outer Illuminated Accent Ring
    const ringGeo = new THREE.RingGeometry(3.55, 3.75, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.79;
    this.scene.add(ring);

    // Engineering grid on floor
    const grid = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    grid.position.y = -1.98;
    this.scene.add(grid);
  }

  // =========================================================================
  // LOAD & ARRANGE INDIVIDUAL GEARBOX
  // =========================================================================
  selectGearbox(config: GearboxConfig): void {
    if (this.selectedGearbox.id === config.id && !this.isLoading) return;
    this.selectedGearbox = config;
    this.loadGearbox(config);
  }

  private loadGearbox(config: GearboxConfig): void {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.cdr.detectChanges();

    // Clean up previous model and animation mixer
    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.casingMeshes = [];
    this.hasEmbeddedAnimation = false;
    this.explodeParts = [];
    this.explodeProgress = 0;
    this.targetExplodeProgress = 0;
    this.isExploded = false;

    const loader = new GLTFLoader();
    loader.load(
      config.file,
      (gltf) => {
        const root = gltf.scene;

        // Container to normalize size & center on pedestal
        this.currentModelGroup = new THREE.Group();
        this.currentModelGroup.position.set(0, 0, 0);

        // Ensure all matrices are updated before measuring bounding box
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const maxDim = Math.max(size.x, size.y, size.z);

        // Target display size on the 3.2m pedestal
        const targetDisplayDim = 3.3;
        const scale = config.scale || (maxDim > 0 ? targetDisplayDim / maxDim : 1.0);

        root.scale.set(scale, scale, scale);

        // Precise centering
        if (config.centerOffset) {
          root.position.set(
            config.centerOffset[0] * scale,
            config.centerOffset[1] * scale,
            config.centerOffset[2] * scale
          );
        } else {
          // Automatic center offset
          root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        }

        if (config.rotationOffset) {
          root.rotation.set(...config.rotationOffset);
        }

        this.currentModelGroup.add(root);
        this.scene.add(this.currentModelGroup);

        // Check if model contains embedded kinematic gear animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.hasEmbeddedAnimation = true;
          this.mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            const action = this.mixer!.clipAction(clip);
            action.play();
          });
        }

        // Configure casing meshes for solid / xray / cutaway modes
        this.setupKinematicsFor(config.id, root);

        // Enhance all components with high-grade metallic PBR materials
        this.enhanceMaterials(root);

        // Setup explode disassembly parts & vectors
        this.setupExplodeParts(root);

        // Apply selected housing visibility mode
        this.applyHousingMode();

        this.isLoading = false;
        this.updateTelemetry();
        this.cdr.detectChanges();
      },
      (xhr) => {
        if (xhr.total > 0) {
          this.loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
          this.cdr.detectChanges();
        }
      },
      (err) => {
        console.error('Failed to load gearbox GLB:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  setMetallicTheme(theme: MetallicTheme): void {
    this.metallicTheme = theme;
    if (this.currentModelGroup) {
      this.enhanceMaterials(this.currentModelGroup);
      this.applyHousingMode();
    }
  }

  private enhanceMaterials(root: THREE.Group): void {
    const isWorm = this.selectedGearbox.id === 'worm' || this.selectedGearbox.id === 'warm_gearbox';

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const isCasing = this.casingMeshes.includes(mesh);
          let mat = mesh.material as THREE.MeshStandardMaterial;

          // Clone material once so individual meshes can be styled independently
          if (!mesh.userData['clonedMat']) {
            mat = mat.clone();
            mesh.material = mat;
            mesh.userData['clonedMat'] = true;
          }

          mat.envMapIntensity = 2.4;

          // Colors & PBR properties based on Metallic Theme
          switch (this.metallicTheme) {
            case 'steel': {
              if (isCasing) {
                mat.color.setHex(0x334155); // Slate cast gunmetal
                mat.metalness = 0.88;
                mat.roughness = 0.30;
              } else if (isWorm && (mesh.name === 'Object_3' || mesh.name === 'Object_38')) {
                // Phosphor bronze worm wheel gear
                mat.color.setHex(0xf59e0b);
                mat.metalness = 0.94;
                mat.roughness = 0.16;
              } else {
                // Precision alloy gear steel
                mat.color.setHex(0xe2e8f0);
                mat.metalness = 0.96;
                mat.roughness = 0.16;
              }
              break;
            }

            case 'bronze': {
              if (isCasing) {
                mat.color.setHex(0x1e293b); // Deep titanium graphite
                mat.metalness = 0.92;
                mat.roughness = 0.26;
              } else {
                // Industrial golden bronze / brass gears
                mat.color.setHex(0xd97706);
                mat.metalness = 0.95;
                mat.roughness = 0.15;
              }
              break;
            }

            case 'gold': {
              if (isCasing) {
                mat.color.setHex(0x0f172a); // Midnight black billet aluminum
                mat.metalness = 0.94;
                mat.roughness = 0.22;
              } else {
                // Anodized motorsport racing gold
                mat.color.setHex(0xfbbf24);
                mat.metalness = 0.96;
                mat.roughness = 0.13;
              }
              break;
            }

            case 'dark': {
              if (isCasing) {
                mat.color.setHex(0x18181b); // Stealth carbon steel
                mat.metalness = 0.82;
                mat.roughness = 0.40;
              } else {
                // High-specular mirror chrome gear teeth
                mat.color.setHex(0xffffff);
                mat.metalness = 1.0;
                mat.roughness = 0.08;
              }
              break;
            }
          }

          mat.needsUpdate = true;
        }
      }
    });
  }

  // =========================================================================
  // CASING MESH IDENTIFICATION (SOLID / X-RAY / CUTAWAY)
  // Preserves original CAD assembly without moving or detaching any parts
  // =========================================================================
  private setupKinematicsFor(type: string, root: THREE.Group): void {
    root.updateMatrixWorld(true);
    this.casingMeshes = [];

    switch (type) {
      case 'planetary': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8',
          'Object_90', 'Object_91', 'Object_92', 'Object_93', 'Object_94', 'Object_95',
          'Object_100', 'Object_101', 'Object_102', 'Object_103', 'Object_104', 'Object_105',
          'Object_130', 'Object_139'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      case 'worm':
      case 'warm_gearbox': {
        const gearNames = new Set([
          'Object_36', 'Object_2', 'Object_3', 'Object_5', 'Object_19', 'Object_21', 'Object_24', 'Object_38', 'Object_44'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !gearNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      case 'conical':
      case 'gearbox_conical': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_5', 'Object_6', 'Object_71', 'Object_72', 'Object_73',
          'Object_82', 'Object_86', 'Object_87', 'Object_88', 'Object_90'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      case 'spur':
      case 'gearbox_for_3d_print': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_9', 'Object_10', 'Object_11', 'Object_12', 'Object_13',
          'Object_14', 'Object_17', 'Object_22', 'Object_25', 'Object_28', 'Object_29', 'Object_30'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      case 'turboprop':
      case 'gearbox_propeller_turbine': {
        const casingNames = new Set([
          'Object_7', 'Object_11', 'Object_12', 'Object_13', 'Object_14', 'Object_21', 'Object_174',
          'Object_175', 'Object_178', 'Object_180', 'Object_182', 'Object_198', 'Object_201'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      case 'transmission':
      case 'transmission_model_for_3d_printing': {
        const casingNames = new Set([
          'Object_4', 'Object_6', 'Object_7', 'Object_8', 'Object_10', 'Object_11', 'Object_12',
          'Object_13', 'Object_16', 'Object_17', 'Object_18', 'Object_25', 'Object_48', 'Object_49',
          'Object_50', 'Object_51'
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }

      default: {
        // General heuristic: meshes with casing/housing/cover/body keywords
        const casingKeyword = /casing|housing|cover|body|frame|shell|enclosure/i;
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingKeyword.test(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });
        break;
      }
    }
  }

  // =========================================================================
  // HOUSING CASING DISPLAY MODES
  // =========================================================================
  setHousingMode(mode: HousingMode): void {
    this.housingMode = mode;
    this.applyHousingMode();
  }

  private applyHousingMode(): void {
    this.casingMeshes.forEach((mesh) => {
      if (!mesh.material) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (this.housingMode === 'solid') {
        mesh.visible = true;
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthWrite = true;
        mat.roughness = 0.30;
        mat.metalness = 0.88;
      } else if (this.housingMode === 'xray') {
        mesh.visible = true;
        mat.transparent = true;
        mat.opacity = 0.24;
        mat.depthWrite = false;
        mat.roughness = 0.14;
        mat.metalness = 0.85;
      } else if (this.housingMode === 'cutaway') {
        mesh.visible = false;
      }
      mat.needsUpdate = true;
    });
  }

  // =========================================================================
  // MAIN ANIMATION & RENDER LOOP
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Kinematic gear train animation mixer
    if (this.mixer && this.isPlaying) {
      const speedFactor = (this.rpm / 1200) * (this.isReversed ? -1 : 1);
      this.mixer.timeScale = speedFactor;
      this.mixer.update(dt);
    }

    // Smooth Exploded View Disassembly Transition
    if (Math.abs(this.explodeProgress - this.targetExplodeProgress) > 0.0005) {
      this.explodeProgress += (this.targetExplodeProgress - this.explodeProgress) * 0.1;
      this.applyExplodeProgress();
    } else if (this.explodeProgress !== this.targetExplodeProgress) {
      this.explodeProgress = this.targetExplodeProgress;
      this.applyExplodeProgress();
    }

    // Telemetry FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // =========================================================================
  // TELEMETRY & CONTROLS UPDATE
  // =========================================================================
  setRpm(val: number): void {
    this.rpm = Number(val);
    this.updateTelemetry();
  }

  setTransmissionGear(gear: TransmissionGear): void {
    this.selectedTransmissionGear = gear;
    this.updateTelemetry();
  }

  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(
        this.isPlaying && !this.isMuted ? 0.045 : 0,
        this.audioCtx.currentTime,
        0.05
      );
    }
  }

  toggleDirection(): void {
    this.isReversed = !this.isReversed;
    this.updateTelemetry();
  }

  private updateTelemetry(): void {
    const isTrans = this.selectedGearbox.id === 'transmission' || this.selectedGearbox.id === 'manual_transmission_gear_box';
    const eff = this.selectedGearbox.efficiency / 100;

    let effRatio = this.selectedGearbox.baseRatio;
    let ratioLabel = this.selectedGearbox.ratioStr;

    if (isTrans && this.selectedTransmissionGear) {
      effRatio = Math.abs(this.selectedTransmissionGear.ratio);
      ratioLabel = `${effRatio.toFixed(2)} : 1`;
    }

    const outRpm = Math.round(this.rpm / effRatio);
    const inOmega = ((this.rpm / 60) * 2 * Math.PI).toFixed(1);
    const outOmega = ((outRpm / 60) * 2 * Math.PI).toFixed(1);

    const inTorque = 25.0; // standard input test torque (Nm)
    const outTorque = (inTorque * effRatio * eff).toFixed(1);

    // Mechanical output power: P = T * omega (kW)
    const powerKw = ((Number(outTorque) * Number(outOmega)) / 1000).toFixed(2);

    this.telemetry = {
      inputRpm: this.rpm,
      outputRpm: outRpm,
      inputOmega: Number(inOmega),
      outputOmega: Number(outOmega),
      ratio: ratioLabel,
      torqueMult: `${(effRatio * eff).toFixed(2)}x`,
      inputTorque: inTorque,
      outputTorque: Number(outTorque),
      mechanicalPower: `${powerKw} kW`,
      temperature: `${(42 + (this.rpm / 3000) * 28).toFixed(1)} °C`,
    };
  }

  // =========================================================================
  // EXPLODED VIEW (DISASSEMBLY) CONTROLS & COMPUTATION
  // Works across all 29 gearboxes: smooth radial & axial disassembly
  // =========================================================================
  toggleExplode(): void {
    this.isExploded = !this.isExploded;
    this.targetExplodeProgress = this.isExploded ? 1.0 : 0.0;
  }

  setExplodeProgress(val: number): void {
    this.targetExplodeProgress = Math.max(0, Math.min(1, Number(val) / 100));
    this.isExploded = this.targetExplodeProgress > 0.05;
  }

  setExplodePreset(presetRatio: number): void {
    this.targetExplodeProgress = presetRatio;
    this.isExploded = presetRatio > 0.05;
  }

  private setupExplodeParts(root: THREE.Group): void {
    this.explodeParts = [];
    root.updateMatrixWorld(true);

    const modelBox = new THREE.Box3().setFromObject(root);
    const modelCenter = new THREE.Vector3();
    modelBox.getCenter(modelCenter);
    const modelSize = new THREE.Vector3();
    modelBox.getSize(modelSize);
    const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z, 1.0);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        meshes.push(o as THREE.Mesh);
      }
    });

    if (meshes.length === 0) return;

    meshes.forEach((mesh, index) => {
      mesh.updateMatrixWorld(true);
      const meshBox = new THREE.Box3().setFromObject(mesh);
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);

      // Displacement direction in world space relative to gearbox bounding center
      const diff = new THREE.Vector3().subVectors(meshCenter, modelCenter);
      let dir: THREE.Vector3;

      if (diff.length() < 0.05) {
        // Part is right near the assembly center; assign radial explosion vector based on index
        const angle = (index / meshes.length) * Math.PI * 2;
        const elevation = ((index % 5) - 2) * 0.35;
        dir = new THREE.Vector3(Math.cos(angle), elevation, Math.sin(angle)).normalize();
      } else {
        dir = diff.clone().normalize();
      }

      // Categorize distance: Outer casings move furthest, internal gears stay closer
      const isCasing = this.casingMeshes.includes(mesh);
      let distFactor = isCasing ? 1.85 : 0.95;

      // Check for shaft or fastener names
      const lowerName = mesh.name.toLowerCase();
      if (
        lowerName.includes('bolt') ||
        lowerName.includes('screw') ||
        lowerName.includes('pin') ||
        lowerName.includes('nut') ||
        lowerName.includes('fastener')
      ) {
        distFactor = 2.3;
      } else if (lowerName.includes('shaft') || lowerName.includes('axle')) {
        distFactor = 1.45;
      }

      const worldExplodeOffset = dir.multiplyScalar(distFactor * maxDim * 0.48);
      const targetWorldPos = meshCenter.clone().add(worldExplodeOffset);

      // Convert target into mesh's parent local coordinate space
      const parent = mesh.parent || root;
      const targetLocalPos = parent.worldToLocal(targetWorldPos.clone());
      const origLocalPos = mesh.position.clone();
      const localDelta = new THREE.Vector3().subVectors(targetLocalPos, origLocalPos);

      this.explodeParts.push({
        mesh,
        origPos: origLocalPos,
        delta: localDelta,
      });
    });
  }

  private applyExplodeProgress(): void {
    for (const part of this.explodeParts) {
      part.mesh.position.copy(part.origPos).addScaledVector(part.delta, this.explodeProgress);
    }
  }

  // =========================================================================
  // DROPDOWN & CATEGORY CONTROLS
  // =========================================================================
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  onSelectFromDropdown(gearbox: GearboxConfig): void {
    this.selectGearbox(gearbox);
    this.isDropdownOpen = false;
  }

  setCategoryFilter(cat: GearboxCategory): void {
    this.selectedCategory = cat;
  }

  // =========================================================================
  // CAMERA PRESETS
  // =========================================================================
  setCameraPreset(preset: string): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [4.8, 3.8, 5.2];
    let lookAt: [number, number, number] = [0, 0, 0];

    switch (preset) {
      case 'iso':
        targetPos = [4.8, 3.8, 5.2];
        lookAt = [0, 0, 0];
        break;
      case 'input':
        targetPos = [4.5, 0.5, 0.2];
        lookAt = [0, 0, 0];
        break;
      case 'mesh':
        targetPos = [1.2, 1.8, 1.8];
        lookAt = [0, 0, 0];
        break;
      case 'output':
        targetPos = [-4.5, 0.8, 2.5];
        lookAt = [0, 0, 0];
        break;
      case 'top':
        targetPos = [0, 8.5, 0.05];
        lookAt = [0, 0, 0];
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
    const duration = 600;

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
  // AUDIO SYNTHESIZER FOR MECHANICAL GEAR HUM
  // =========================================================================
  toggleAudio(): void {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.startAudio();
    } else {
      this.stopAudio();
    }
  }

  private startAudio(): void {
    if (!this.isBrowser) return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (!this.oscNode) {
        this.oscNode = this.audioCtx.createOscillator();
        this.oscNode.type = 'sawtooth';
        this.oscNode.frequency.setValueAtTime(45 + (this.rpm / 3000) * 190, this.audioCtx.currentTime);

        // Lowpass filter for muffled gearbox interior hum
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, this.audioCtx.currentTime);

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.setValueAtTime(this.isPlaying ? 0.045 : 0, this.audioCtx.currentTime);

        this.oscNode.connect(filter);
        filter.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscNode.start();
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private stopAudio(): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
    }
  }
}
