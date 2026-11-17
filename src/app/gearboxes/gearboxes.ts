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

export type GearboxType =
  | 'planetary'
  | 'worm'
  | 'conical'
  | 'spur'
  | 'turboprop'
  | 'transmission';

export type HousingMode = 'solid' | 'xray' | 'cutaway';

export type MetallicTheme = 'steel' | 'bronze' | 'gold' | 'dark';

export interface TransmissionGear {
  id: string;
  name: string;
  ratio: number;
}

export interface GearboxConfig {
  id: GearboxType;
  name: string;
  subtitle: string;
  file: string;
  icon: string;
  badge: string;
  ratioStr: string;
  baseRatio: number;
  efficiency: number;
  description: string;
  scale: number;
  centerOffset: [number, number, number];
  rotationOffset?: [number, number, number];
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

  // Available Gearbox Catalog
  gearboxes: GearboxConfig[] = [
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
      description:
        'Coaxial high-torque reduction gearbox featuring a central sun gear driving 3 satellite planet gears spaced at 120° that orbit inside a stationary internal ring gear.',
      scale: 16.5,
      centerOffset: [-0.04, 0, 0],
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
      description:
        'Compact high-ratio speed reducer where a single or multi-start worm screw rotates a perpendicular worm wheel gear with inherent mechanical self-locking braking capability.',
      scale: 19.5,
      centerOffset: [0.02, 0.0, -0.035],
    },
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
      description:
        'Intersecting shaft transmission transferring rotational drive at a 90-degree right angle through precision-machined conical bevel pinion and crown gears.',
      scale: 18.0,
      centerOffset: [0.025, 0.048, 0.001],
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
      description:
        'Classic parallel-shaft external spur gear speed reducer providing smooth, continuous power transmission with near-zero friction loss and high mechanical efficiency.',
      scale: 18.5,
      centerOffset: [0.03, -0.032, -0.003],
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
      description:
        'Aviation reduction gearbox reducing ultra-high-speed gas turbine shaft RPM down to propeller speed using balanced 4-branch compound idler gear torque splitters.',
      scale: 5.2,
      centerOffset: [-0.285, 0.0, -0.19],
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
      description:
        'Automotive constant-mesh manual transmission with synchronized layshaft gears providing 5 forward speeds plus reverse with real-time shift ratios and overdrive.',
      scale: 9.5,
      centerOffset: [0.09, 0.035, -0.05],
    },
  ];

  selectedGearbox: GearboxConfig = this.gearboxes[0];

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

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isDropdownOpen = false;
    this.cdr.detectChanges();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.detectChanges();
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.cdr.detectChanges();
  }

  onSelectFromDropdown(config: GearboxConfig): void {
    this.isDropdownOpen = false;
    this.selectGearbox(config);
    this.cdr.detectChanges();
  }

  onSelectGearboxById(id: string): void {
    const found = this.gearboxes.find((g) => g.id === id);
    if (found) {
      this.isDropdownOpen = false;
      this.selectGearbox(found);
      this.cdr.detectChanges();
    }
  }

  // =========================================================================
  // THREE.JS SCENE SETUP
  // =========================================================================
  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060b14);
    this.scene.fog = new THREE.FogExp2(0x060b14, 0.022);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.8, 3.8, 5.2);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 25.0;
    this.controls.target.set(0, 0, 0);

    // Studio Environment Lighting
    this.setupLighting();

    // Studio Platform & Grid
    this.setupStudioStage();

    // Start loop
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Main Key Spot Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.5);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Fill Light (Cool Teal Industrial Fill)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillLight.position.set(-8, 5, -6);
    this.scene.add(fillLight);

    // Warm Rim Light
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.6);
    rimLight.position.set(0, -6, -8);
    this.scene.add(rimLight);

    // Concentrated Shaft Focus Spot
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

    // Clean up previous model
    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }
    this.casingMeshes = [];

    const loader = new GLTFLoader();
    loader.load(
      config.file,
      (gltf) => {
        const root = gltf.scene;

        // Container to normalize size & center on pedestal
        this.currentModelGroup = new THREE.Group();
        this.currentModelGroup.position.set(0, 0, 0);

        // Apply scale & centering
        root.scale.set(config.scale, config.scale, config.scale);
        root.position.set(
          config.centerOffset[0] * config.scale,
          config.centerOffset[1] * config.scale,
          config.centerOffset[2] * config.scale
        );

        if (config.rotationOffset) {
          root.rotation.set(...config.rotationOffset);
        }

        this.currentModelGroup.add(root);
        this.scene.add(this.currentModelGroup);

        // Configure rotational kinematics specific to this gearbox (populates casingMeshes)
        this.setupKinematicsFor(config.id, root);

        // Enhance all components with high-grade metallic PBR materials
        this.enhanceMaterials(root);

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
    const isWorm = this.selectedGearbox.id === 'worm';

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
  private setupKinematicsFor(type: GearboxType, root: THREE.Group): void {
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

      case 'worm': {
        // Casing meshes: All stationary housing parts including Object_42 (motor bell), casing bodies, bolts
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

      case 'conical': {
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

      case 'spur': {
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

      case 'turboprop': {
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

      case 'transmission': {
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
  // MAIN ANIMATION & RENDER LOOP (STATIC ENGINEERING INSPECTION VIEW)
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
    const isTrans = this.selectedGearbox.id === 'transmission';
    const eff = this.selectedGearbox.efficiency / 100;

    let effRatio = this.selectedGearbox.baseRatio;
    let ratioLabel = this.selectedGearbox.ratioStr;

    if (isTrans) {
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
