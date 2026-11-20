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

export type GearboxCategory = 'all' | 'industrial' | 'bevel' | 'kinematic' | 'specialty';

export interface FeaturedGearbox {
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
}

@Component({
  selector: 'app-gearboxhome',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gearboxhome.html',
  styleUrl: './gearboxhome.scss',
})
export class Gearboxhome implements AfterViewInit, OnDestroy {
  @ViewChild('heroCanvas', { static: false })
  heroCanvasRef!: ElementRef<HTMLCanvasElement>;

  public isBrowser = false;
  selectedCategory: GearboxCategory = 'all';
  searchQuery = '';
  isRotating = true;
  isLoadingPreview = false;

  // Three.js Hero Preview
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private currentPreviewGroup: THREE.Group = new THREE.Group();
  private gearsGroup: THREE.Group = new THREE.Group();

  readonly categories: { id: GearboxCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Gears (29)', icon: '⚙️' },
    { id: 'industrial', label: 'Industrial & Planetary (8)', icon: '🪐' },
    { id: 'bevel', label: 'Bevel & Angle Drives (5)', icon: '📐' },
    { id: 'kinematic', label: 'Kinematic & Indexing (7)', icon: '⏱️' },
    { id: 'specialty', label: 'Specialty & Compound (9)', icon: '🌀' },
  ];

  // Full Catalog of 29 Distinct Gear Mechanisms
  readonly gearboxes: FeaturedGearbox[] = [
    // ---------------- INDUSTRIAL GEARBOXES (8) ----------------
    {
      id: 'planetary',
      name: 'Epicyclic Planetary Gearbox',
      subtitle: 'Sun gear, 3 orbiting satellite planet gears & stationary ring',
      file: '/3dModels/Gearboxes/gearbox_planetary.glb',
      icon: '🪐',
      badge: 'Epicyclic / 4:1',
      ratioStr: '4.00 : 1',
      baseRatio: 4.0,
      efficiency: 97,
      category: 'industrial',
      description:
        'Coaxial high-torque reduction gearbox featuring a central sun gear driving 3 satellite planet gears spaced at 120° orbiting inside a stationary internal ring gear.',
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
    },

    // ---------------- BEVEL, CONICAL & SKEW SYSTEMS (5) ----------------
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
    },

    // ---------------- KINEMATIC & INDEXING MECHANISMS (7) ----------------
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
    },

    // ---------------- SPECIALTY & COMPOUND SYSTEMS (9) ----------------
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

  activePreview: FeaturedGearbox =
    this.gearboxes.find((g) => g.id === 'bevel_gears') || this.gearboxes[0];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get filteredGearboxes(): FeaturedGearbox[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.gearboxes.filter((gb) => {
      const matchCat = this.selectedCategory === 'all' || gb.category === this.selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        gb.name.toLowerCase().includes(q) ||
        gb.subtitle.toLowerCase().includes(q) ||
        gb.badge.toLowerCase().includes(q) ||
        gb.description.toLowerCase().includes(q) ||
        gb.ratioStr.toLowerCase().includes(q)
      );
    });
  }

  selectCategory(catId: GearboxCategory): void {
    this.selectedCategory = catId;
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initHeroThree();
    this.loadModelPreview(this.activePreview);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  // =========================================================================
  // INTERACTIVE THREE.JS HERO PREVIEW CANVAS
  // =========================================================================
  private initHeroThree(): void {
    if (!this.heroCanvasRef) return;
    const canvas = this.heroCanvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || 480;
    const height = canvas.parentElement?.clientHeight || 420;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(3.2, 2.4, 4.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 14;
    this.controls.minDistance = 1.2;
    this.controls.target.set(0, 0, 0);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(amb);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 8, 5);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rim.position.set(-5, 4, -5);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xf59e0b, 1.2);
    fill.position.set(0, -5, 4);
    this.scene.add(fill);

    this.scene.add(this.currentPreviewGroup);
    this.currentPreviewGroup.add(this.gearsGroup);

    this.animate();
  }

  loadModelPreview(gb: FeaturedGearbox): void {
    this.activePreview = gb;
    if (!this.isBrowser || !this.gearsGroup) return;

    this.isLoadingPreview = true;
    this.cdr.detectChanges();

    const loader = new GLTFLoader();
    loader.load(
      gb.file,
      (gltf) => {
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0.001) {
          const targetScale = 2.4 / maxDim;
          root.scale.setScalar(targetScale);
        }
        const center = box.getCenter(new THREE.Vector3());
        root.position.sub(center.multiplyScalar(root.scale.x));

        this.gearsGroup.clear();
        this.gearsGroup.add(root);
        this.isLoadingPreview = false;
        this.cdr.detectChanges();
      },
      undefined,
      (err) => {
        console.warn('Could not load GLB preview:', gb.file, err);
        this.buildProceduralFallback();
        this.isLoadingPreview = false;
        this.cdr.detectChanges();
      }
    );
  }

  private buildProceduralFallback(): void {
    this.gearsGroup.clear();
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.22,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.28,
    });

    const sunGear = this.createSpurGearMesh(0.48, 0.22, 14, steelMat);
    this.gearsGroup.add(sunGear);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const planet = this.createSpurGearMesh(0.38, 0.22, 11, brassMat);
      planet.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * 1.15, 0);
      this.gearsGroup.add(planet);
    }
  }

  private createSpurGearMesh(radius: number, thickness: number, teeth: number, mat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, thickness, 32), mat);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);

    const toothW = (Math.PI * 2 * radius) / (teeth * 2.2);
    const toothH = radius * 0.22;
    const toothGeo = new THREE.BoxGeometry(toothW, toothH, thickness);

    for (let i = 0; i < teeth; i++) {
      const a = (i * Math.PI * 2) / teeth;
      const tooth = new THREE.Mesh(toothGeo, mat);
      tooth.position.set(Math.cos(a) * (radius + toothH * 0.35), Math.sin(a) * (radius + toothH * 0.35), 0);
      tooth.rotation.z = a;
      group.add(tooth);
    }

    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, thickness + 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    bore.rotation.x = Math.PI / 2;
    group.add(bore);

    return group;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.isRotating && this.gearsGroup) {
      this.gearsGroup.rotation.y += 0.008;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  toggleRotation(): void {
    this.isRotating = !this.isRotating;
  }

  resetCamera(): void {
    this.camera.position.set(3.2, 2.4, 4.2);
    this.controls.target.set(0, 0, 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser || !this.renderer || !this.camera || !this.heroCanvasRef) return;
    const canvas = this.heroCanvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || 480;
    const height = canvas.parentElement?.clientHeight || 420;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
