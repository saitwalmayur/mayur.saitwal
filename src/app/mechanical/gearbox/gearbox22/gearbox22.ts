import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import {
  GEARBOXES_DATA,
  GearboxConfig,
  GearboxCategory,
} from '../gearbox-data';

export type HousingMode = 'solid' | 'xray' | 'cutaway';
export type MetallicTheme = 'steel' | 'dark';

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

export interface KinematicRotator {
  pivot: THREE.Group;
  axis: THREE.Vector3;
  speedMultiplier: number;
}

@Component({
  selector: 'app-gearbox22',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gearbox22.html',
  styleUrl: './gearbox22.scss',
})
export class Gearbox22 implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly allGearboxes: GearboxConfig[] = GEARBOXES_DATA;
  readonly currentIndex: number = 22;
  readonly prevIndex: number = 21;
  readonly nextIndex: number = 23;
  readonly selectedGearbox: GearboxConfig = GEARBOXES_DATA[21];

  // Dropdown list
  isDropdownOpen = false;
  dropdownSearch = '';

  // Manual Transmission Gear Table
  transmissionGears: TransmissionGear[] = [
    { id: '1', name: '1st Gear', ratio: 3.82 },
    { id: '2', name: '2nd Gear', ratio: 2.38 },
    { id: '3', name: '3rd Gear', ratio: 1.58 },
    { id: '4', name: '4th Gear', ratio: 1.12 },
    { id: '5', name: '5th Gear (OD)', ratio: 0.84 },
    { id: 'R', name: 'Reverse', ratio: -3.55 },
  ];
  selectedTransmissionGear: TransmissionGear = this.transmissionGears[1];

  // Operational State & Controls
  isPlaying = true;
  isReversed = false;
  rpm = 1200;
  housingMode: HousingMode = 'xray';
  metallicTheme: MetallicTheme = 'steel';
  isMuted = true;
  isLoading = false;
  loadingProgress = 0;
  activeCameraPreset = 'iso';
  showDetailsModal = false;

  // Animation System
  private mixer: THREE.AnimationMixer | null = null;
  hasEmbeddedAnimation = false;
  private kinematicRotators: KinematicRotator[] = [];
  private activeClipDuration = 1.0;

  // Telemetry Readout
  telemetry = {
    inputRpm: 1200,
    outputRpm: 300,
    inputOmega: 125.7,
    outputOmega: 31.4,
    ratio: '4.00 : 1',
    torqueMult: '4.00x',
    inputTorque: 25.0,
    outputTorque: 97.0,
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
  public isBrowser = false;

  // Active Gearbox Hierarchy
  private currentModelGroup: THREE.Group | null = null;
  private casingMeshes: THREE.Mesh[] = [];

  // Exploded View Disassembly
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
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.updateTelemetry();
  }

  get filteredDropdownGearboxes(): { item: GearboxConfig; idx: number }[] {
    const q = this.dropdownSearch.trim().toLowerCase();
    return this.allGearboxes
      .map((item, i) => ({ item, idx: i + 1 }))
      .filter(({ item }) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      });
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

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.dropdownSearch = '';
    }
  }

  navigateToGearbox(targetIndex: number): void {
    this.isDropdownOpen = false;
    this.router.navigate(['/gearbox' + targetIndex]);
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(4.8, 3.8, 5.2);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 24;
    this.controls.minDistance = 0.6;
    this.controls.target.set(0, 0, 0);

    this.setupLighting();
    this.setupStudioStage();

    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 3.4);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillLight.position.set(-8, 5, -6);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.6);
    rimLight.position.set(0, -6, -8);
    this.scene.add(rimLight);

    const spot = new THREE.SpotLight(0x67e8f9, 4.5, 18, Math.PI / 4, 0.4);
    spot.position.set(0, 8, 3);
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);

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

  private setupStudioStage(): void {
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

    const ringGeo = new THREE.RingGeometry(3.55, 3.75, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.79;
    this.scene.add(ring);

    const grid = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    grid.position.y = -1.98;
    this.scene.add(grid);
  }

  private loadGearbox(config: GearboxConfig): void {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.cdr.detectChanges();

    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.casingMeshes = [];
    this.kinematicRotators = [];
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

        this.currentModelGroup = new THREE.Group();
        this.currentModelGroup.position.set(0, 0, 0);

        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const maxDim = Math.max(size.x, size.y, size.z);

        const targetDisplayDim = 3.3;
        const scale = config.scale || (maxDim > 0 ? targetDisplayDim / maxDim : 1.0);

        root.scale.set(scale, scale, scale);

        if (config.centerOffset) {
          root.position.set(
            config.centerOffset[0] * scale,
            config.centerOffset[1] * scale,
            config.centerOffset[2] * scale
          );
        } else {
          root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        }

        if (config.rotationOffset) {
          root.rotation.set(...config.rotationOffset);
        }

        this.currentModelGroup.add(root);
        this.scene.add(this.currentModelGroup);

        if (gltf.animations && gltf.animations.length > 0) {
          this.hasEmbeddedAnimation = true;
          this.activeClipDuration = gltf.animations[0]?.duration || 1.0;
          this.mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            const action = this.mixer!.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          });
        } else {
          this.setupKinematicsFor(config.id, root);
        }
        this.enhanceMaterials(root);
        this.setupExplodeParts(root);
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
    const isWorm = this.selectedGearbox.id === 'worm' || this.selectedGearbox.id === 'warm_gear_box';

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const isCasing = this.casingMeshes.includes(mesh);
          let mat = mesh.material as THREE.MeshStandardMaterial;

          if (!mesh.userData['clonedMat']) {
            mat = mat.clone();
            mesh.material = mat;
            mesh.userData['clonedMat'] = true;
          }

          mat.envMapIntensity = 2.4;

          switch (this.metallicTheme) {
            case 'steel': {
              if (isCasing) {
                mat.color.setHex(0x334155);
                mat.metalness = 0.88;
                mat.roughness = 0.30;
              } else {
                mat.color.setHex(0xe2e8f0);
                mat.metalness = 0.96;
                mat.roughness = 0.16;
              }
              break;
            }
            case 'dark': {
              if (isCasing) {
                mat.color.setHex(0x18181b);
                mat.metalness = 0.82;
                mat.roughness = 0.40;
              } else {
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

  private createPivotAndAttach(
    root: THREE.Group,
    meshNamesOrObjects: (string | THREE.Mesh)[],
    preferredCenter?: THREE.Vector3,
    axis: THREE.Vector3 = new THREE.Vector3(0, 0, 1),
    speedMultiplier: number = 1.0
  ): KinematicRotator | null {
    const meshesToAttach: THREE.Mesh[] = [];

    if (meshNamesOrObjects.length > 0 && typeof meshNamesOrObjects[0] === 'string') {
      const nameSet = new Set(meshNamesOrObjects as string[]);
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && nameSet.has(child.name)) {
          meshesToAttach.push(child as THREE.Mesh);
        }
      });
    } else {
      meshesToAttach.push(...(meshNamesOrObjects as THREE.Mesh[]));
    }

    if (meshesToAttach.length === 0) return null;

    let localCenter: THREE.Vector3;
    if (preferredCenter) {
      localCenter = preferredCenter.clone();
    } else {
      const combinedBox = new THREE.Box3();
      meshesToAttach.forEach((m) => {
        m.updateMatrixWorld(true);
        combinedBox.expandByObject(m);
      });
      const worldCenter = new THREE.Vector3();
      combinedBox.getCenter(worldCenter);
      localCenter = root.worldToLocal(worldCenter);
    }

    const pivot = new THREE.Group();
    pivot.position.copy(localCenter);
    root.add(pivot);
    pivot.updateMatrixWorld(true);

    for (const mesh of meshesToAttach) {
      pivot.attach(mesh);
    }

    return { pivot, axis: axis.clone().normalize(), speedMultiplier };
  }

  private setupKinematicsFor(type: string, root: THREE.Group): void {
    if (this.hasEmbeddedAnimation) {
      return;
    }
    root.updateMatrixWorld(true);
    this.casingMeshes = [];
    this.kinematicRotators = [];

    const getMeshCenter = (name: string): THREE.Vector3 => {
      const m = root.getObjectByName(name) as THREE.Mesh;
      if (!m) return new THREE.Vector3();
      m.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(m);
      const wc = new THREE.Vector3();
      b.getCenter(wc);
      return root.worldToLocal(wc);
    };

    switch (type) {
      case 'gears_mechanism': {
        // Gearbox 29: Open Frame Reduction Gearset
        // Base plate and upright curved bracket stay static
        const casingNames = new Set(['pSphere20_M_Mechanismus_0', 'pCube1_M_Mechanismus_0']);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const zAxis = new THREE.Vector3(0, 0, 1);

        // Stage 1: Top crank + pinion gear (crank arm, knob, top gear, shaft)
        const topCenter = getMeshCenter('pCylinder10_M_Mechanismus_0');
        const topRot = this.createPivotAndAttach(
          root,
          [
            'polySurface5_M_Mechanismus_0',
            'pCylinder10_M_Mechanismus_0',
            'pCylinder8_M_Mechanismus_0',
            'pCylinder9_M_Mechanismus_0',
          ],
          topCenter,
          zAxis,
          1.0
        );
        if (topRot) this.kinematicRotators.push(topRot);

        // Stage 2: Middle intermediate gear + shaft
        const midCenter = getMeshCenter('pTorus2_M_Mechanismus_0');
        const midRot = this.createPivotAndAttach(
          root,
          ['pTorus2_M_Mechanismus_0', 'pCylinder11_M_Mechanismus_0'],
          midCenter,
          zAxis,
          -0.5
        );
        if (midRot) this.kinematicRotators.push(midRot);

        // Stage 3: Bottom output gear passing through slot in base
        const botCenter = getMeshCenter('pTorus4_M_Mechanismus_0');
        const botRot = this.createPivotAndAttach(
          root,
          ['pTorus4_M_Mechanismus_0'],
          botCenter,
          zAxis,
          0.5
        );
        if (botRot) this.kinematicRotators.push(botRot);
        break;
      }
      case 'planetary': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8',
          'Object_90', 'Object_91', 'Object_92', 'Object_93', 'Object_94', 'Object_95',
          'Object_100', 'Object_101', 'Object_102', 'Object_103', 'Object_104', 'Object_105',
          'Object_130', 'Object_139',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const rotatingMeshes: THREE.Mesh[] = [];
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !this.casingMeshes.includes(o as THREE.Mesh)) {
            rotatingMeshes.push(o as THREE.Mesh);
          }
        });
        const planetCenter = getMeshCenter('Object_9');
        const planetRot = this.createPivotAndAttach(
          root,
          rotatingMeshes,
          planetCenter,
          new THREE.Vector3(0, 0, 1),
          1.0
        );
        if (planetRot) this.kinematicRotators.push(planetRot);
        break;
      }
      case 'worm':
      case 'warm_gear_box': {
        const gearNames = new Set([
          'Object_2', 'Object_3', 'Object_5', 'Object_19', 'Object_21', 'Object_24', 'Object_38', 'Object_44',
          'Object_22', 'Object_36', 'Object_42', 'Object_45',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !gearNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const screwCenter = getMeshCenter('Object_36');
        const screwRot = this.createPivotAndAttach(
          root,
          ['Object_22', 'Object_36', 'Object_42', 'Object_45'],
          screwCenter,
          new THREE.Vector3(1, 0, 0),
          1.0
        );
        if (screwRot) this.kinematicRotators.push(screwRot);

        const wheelCenter = getMeshCenter('Object_3');
        const wheelRot = this.createPivotAndAttach(
          root,
          ['Object_2', 'Object_3', 'Object_5', 'Object_19', 'Object_21', 'Object_24', 'Object_38', 'Object_44'],
          wheelCenter,
          new THREE.Vector3(0, 0, 1),
          1.0 / 30.0
        );
        if (wheelRot) this.kinematicRotators.push(wheelRot);
        break;
      }
      case 'conical': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_5', 'Object_6', 'Object_71', 'Object_72', 'Object_73',
          'Object_82', 'Object_86', 'Object_87', 'Object_88', 'Object_90',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const pinionCenter = getMeshCenter('Object_85');
        const pinionRot = this.createPivotAndAttach(
          root,
          ['Object_75', 'Object_79', 'Object_80', 'Object_85'],
          pinionCenter,
          new THREE.Vector3(1, 0, 0),
          1.0
        );
        if (pinionRot) this.kinematicRotators.push(pinionRot);

        const crownCenter = getMeshCenter('Object_78');
        const crownRot = this.createPivotAndAttach(
          root,
          ['Object_78', 'Object_81'],
          crownCenter,
          new THREE.Vector3(0, 0, 1),
          -0.67
        );
        if (crownRot) this.kinematicRotators.push(crownRot);
        break;
      }
      case 'spur': {
        const casingNames = new Set([
          'Object_2', 'Object_3', 'Object_9', 'Object_10', 'Object_11', 'Object_12', 'Object_13',
          'Object_14', 'Object_17', 'Object_22', 'Object_25', 'Object_28', 'Object_29', 'Object_30',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const inputCenter = getMeshCenter('Object_4');
        const inputRot = this.createPivotAndAttach(
          root,
          ['Object_4', 'Object_5', 'Object_6', 'Object_7', 'Object_8'],
          inputCenter,
          new THREE.Vector3(1, 0, 0),
          1.0
        );
        if (inputRot) this.kinematicRotators.push(inputRot);

        const outputCenter = getMeshCenter('Object_26');
        const outputRot = this.createPivotAndAttach(
          root,
          ['Object_15', 'Object_16', 'Object_18', 'Object_19', 'Object_20', 'Object_21', 'Object_26'],
          outputCenter,
          new THREE.Vector3(1, 0, 0),
          -0.416
        );
        if (outputRot) this.kinematicRotators.push(outputRot);
        break;
      }
      case 'turboprop': {
        const casingNames = new Set([
          'Object_7', 'Object_11', 'Object_12', 'Object_13', 'Object_14', 'Object_21', 'Object_174',
          'Object_175', 'Object_178', 'Object_180', 'Object_182', 'Object_198', 'Object_201',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const rotorMeshes: THREE.Mesh[] = [];
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !this.casingMeshes.includes(o as THREE.Mesh)) {
            rotorMeshes.push(o as THREE.Mesh);
          }
        });
        const turbineCenter = getMeshCenter('Object_85');
        const rotorRot = this.createPivotAndAttach(
          root,
          rotorMeshes,
          turbineCenter,
          new THREE.Vector3(0, 0, 1),
          1.0
        );
        if (rotorRot) this.kinematicRotators.push(rotorRot);
        break;
      }
      case 'transmission':
      case 'manual_transmission_gear_box': {
        const casingNames = new Set([
          'Object_4', 'Object_6', 'Object_7', 'Object_8', 'Object_10', 'Object_11', 'Object_12',
          'Object_13', 'Object_16', 'Object_17', 'Object_18', 'Object_25', 'Object_48', 'Object_49',
          'Object_50', 'Object_51',
        ]);
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingNames.has(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const upperMeshes: THREE.Mesh[] = [];
        const lowerMeshes: THREE.Mesh[] = [];
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !this.casingMeshes.includes(o as THREE.Mesh)) {
            const b = new THREE.Box3().setFromObject(o);
            const c = new THREE.Vector3();
            b.getCenter(c);
            if (c.y > 1.0) {
              upperMeshes.push(o as THREE.Mesh);
            } else {
              lowerMeshes.push(o as THREE.Mesh);
            }
          }
        });

        if (upperMeshes.length > 0) {
          const upperRot = this.createPivotAndAttach(
            root,
            upperMeshes,
            undefined,
            new THREE.Vector3(1, 0, 0),
            1.0
          );
          if (upperRot) this.kinematicRotators.push(upperRot);
        }

        if (lowerMeshes.length > 0) {
          const lowerRot = this.createPivotAndAttach(
            root,
            lowerMeshes,
            undefined,
            new THREE.Vector3(1, 0, 0),
            -0.31
          );
          if (lowerRot) this.kinematicRotators.push(lowerRot);
        }
        break;
      }
      case 'gears_-_ingralarghi': {
        const meshes: THREE.Mesh[] = [];
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            meshes.push(o as THREE.Mesh);
          }
        });

        const firstMesh = meshes[0];
        let shaftCenter = new THREE.Vector3(0, 0, 0);
        let shaftAxis = new THREE.Vector3(0, 0, 1);
        if (firstMesh) {
          firstMesh.updateMatrixWorld(true);
          const pLocalCenter = new THREE.Vector3(0, 0, 1.6475);
          const pLocalAxis = new THREE.Vector3(0, 1, 1.6475);
          firstMesh.localToWorld(pLocalCenter);
          firstMesh.localToWorld(pLocalAxis);

          shaftCenter = root.worldToLocal(pLocalCenter);
          const pRootAxis = root.worldToLocal(pLocalAxis);
          shaftAxis = new THREE.Vector3().subVectors(pRootAxis, shaftCenter).normalize();
        }

        const rotator = this.createPivotAndAttach(
          root,
          meshes,
          shaftCenter,
          shaftAxis,
          1.0
        );
        if (rotator) this.kinematicRotators.push(rotator);
        break;
      }
      default: {
        const casingKeyword = /casing|housing|cover|body|frame|shell|enclosure|base|stand/i;
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && casingKeyword.test(o.name)) {
            this.casingMeshes.push(o as THREE.Mesh);
          }
        });

        const activeMeshes: THREE.Mesh[] = [];
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !this.casingMeshes.includes(o as THREE.Mesh)) {
            activeMeshes.push(o as THREE.Mesh);
          }
        });

        if (activeMeshes.length > 0) {
          const fallbackRot = this.createPivotAndAttach(
            root,
            activeMeshes,
            undefined,
            new THREE.Vector3(0, 0, 1),
            1.0
          );
          if (fallbackRot) this.kinematicRotators.push(fallbackRot);
        }
        break;
      }
    }
  }

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

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.mixer && this.isPlaying) {
      const targetCycleTime = 1.25 * (1200 / Math.max(50, this.rpm));
      this.mixer.timeScale = (this.activeClipDuration / targetCycleTime) * (this.isReversed ? -1 : 1);
      this.mixer.update(dt);
    } else if (this.isPlaying && this.kinematicRotators.length > 0) {
      const targetCycleTime = 1.25 * (1200 / Math.max(50, this.rpm));
      const deltaAngle = ((Math.PI * 2) / targetCycleTime) * dt * (this.isReversed ? -1 : 1);
      for (const rot of this.kinematicRotators) {
        rot.pivot.rotateOnAxis(rot.axis, deltaAngle * rot.speedMultiplier);
      }
    }

    if (Math.abs(this.explodeProgress - this.targetExplodeProgress) > 0.0005) {
      this.explodeProgress += (this.targetExplodeProgress - this.explodeProgress) * 0.1;
      this.applyExplodeProgress();
    } else if (this.explodeProgress !== this.targetExplodeProgress) {
      this.explodeProgress = this.targetExplodeProgress;
      this.applyExplodeProgress();
    }

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
    if (!this.selectedGearbox) return;
    const isTrans =
      this.selectedGearbox.id === 'transmission' ||
      this.selectedGearbox.id === 'manual_transmission_gear_box';
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

    const inTorque = 25.0;
    const outTorque = (inTorque * effRatio * eff).toFixed(1);

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

      const diff = new THREE.Vector3().subVectors(meshCenter, modelCenter);
      let dir: THREE.Vector3;

      if (diff.length() < 0.05) {
        const angle = (index / meshes.length) * Math.PI * 2;
        const elevation = ((index % 5) - 2) * 0.35;
        dir = new THREE.Vector3(Math.cos(angle), elevation, Math.sin(angle)).normalize();
      } else {
        dir = diff.clone().normalize();
      }

      const isCasing = this.casingMeshes.includes(mesh);
      let distFactor = isCasing ? 1.85 : 0.95;

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
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (!this.oscNode) {
        this.oscNode = this.audioCtx.createOscillator();
        this.oscNode.type = 'sawtooth';
        this.oscNode.frequency.setValueAtTime(
          45 + (this.rpm / 3000) * 190,
          this.audioCtx.currentTime
        );

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
    } catch {}
  }

  private stopAudio(): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
    }
  }
}

