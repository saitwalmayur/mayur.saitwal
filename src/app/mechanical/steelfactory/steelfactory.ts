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
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CameraPreset =
  | 'overview'
  | 'furnace'
  | 'descaler'
  | 'rougher'
  | 'finishing'
  | 'cooling'
  | 'coiler'
  | 'follow'
  | 'pulpit';

export type DisplayMode = 'standard' | 'thermal' | 'xray';

export interface TelemetryData {
  stageName: string;
  stageNum: number;
  temperatureC: number;
  thicknessMm: number;
  widthMm: number;
  lengthM: number;
  speedMpm: number; // meters per minute
  speedMps: number; // meters per second
  rollingForceMn: number;
  descalerPressureBar: number;
  waterFlowLpm: number;
  coilWeightTonnes: number;
  progressPercent: number;
  activeRollersCount?: number;
  activeStandRpm?: number;
}

export interface MillRoller {
  object: THREE.Object3D;
  name: string;
  type:
    | 'conveyor'
    | 'work_roll_bot'
    | 'work_roll_top'
    | 'backup_roll_bot'
    | 'backup_roll_top'
    | 'edger_left'
    | 'edger_right'
    | 'pinch_top'
    | 'pinch_bot'
    | 'mandrel'
    | 'wrapper';
  worldX: number;
  worldY: number;
  worldZ: number;
  radius: number;
  standIdx?: number;
  currentRadPerSec: number;
  targetRadPerSec: number;
  currentRpm: number;
}

@Component({
  selector: 'app-steelfactory',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './steelfactory.html',
  styleUrl: './steelfactory.scss',
})
export class SteelFactory implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  public isBrowser = false;
  isLoading = true;
  loadingProgress = 0;

  // Simulation State
  isPlaying = true;
  simSpeed = 1.0; // 0.2x to 3.0x
  progress = 0; // 0 to 100%
  activeCameraPreset: CameraPreset = 'overview';
  displayMode: DisplayMode = 'standard';
  particlesEnabled = true;
  isMuted = true;
  showHelpModal = false;

  // Live Metallurgical Telemetry
  telemetry: TelemetryData = {
    stageName: 'Reheating Furnace Discharge',
    stageNum: 1,
    temperatureC: 1250,
    thicknessMm: 280,
    widthMm: 1800,
    lengthM: 4.5,
    speedMpm: 12,
    speedMps: 0.2,
    rollingForceMn: 0,
    descalerPressureBar: 0,
    waterFlowLpm: 0,
    coilWeightTonnes: 24.8,
    progressPercent: 0,
    activeRollersCount: 0,
    activeStandRpm: 0,
  };

  fps = 60;
  private frameCount = 0;
  private fpsTimer = 0;
  private lastTime = performance.now();
  private animationId: number | null = null;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;

  // 3D Plant Model & Kinematic Machine Nodes
  private plantModelGroup: THREE.Group | null = null;
  private furnaceDoor: THREE.Object3D | null = null;
  private allMillRollers: MillRoller[] = [];
  private coilCar: THREE.Object3D | null = null;
  private sampleFinishedCoil: THREE.Object3D | null = null;

  // Dynamic Steel Workpiece Meshes
  private slabMesh!: THREE.Mesh;
  private stripMesh!: THREE.Mesh;
  private dynamicCoilMesh!: THREE.Mesh;
  private steelMaterial!: THREE.MeshStandardMaterial;

  // Particle Systems
  private descalerParticles!: THREE.Points;
  private laminarParticles!: THREE.Points;
  private steamParticles!: THREE.Points;
  private sparkParticles!: THREE.Points;

  private descalerGeo!: THREE.BufferGeometry;
  private laminarGeo!: THREE.BufferGeometry;
  private steamGeo!: THREE.BufferGeometry;
  private sparkGeo!: THREE.BufferGeometry;

  private steamLifetimes: Float32Array = new Float32Array(0);
  private sparkVelocities: Float32Array = new Float32Array(0);

  // Audio Engine (Web Audio API)
  private audioCtx: AudioContext | null = null;
  private motorOsc: OscillatorNode | null = null;
  private waterNoiseNode: AudioNode | null = null;
  private masterGain: GainNode | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Initial setup
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.initThree();
    this.setupLighting();
    this.setupWorkpiece();
    this.setupParticleSystems();
    this.loadPlantModel();

    this.lastTime = performance.now();
    this.animate();
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

  // =========================================================================
  // THREE.JS SCENE SETUP
  // =========================================================================
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
    this.scene.background = new THREE.Color(0x070b14); // Dark industrial ambient
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.0075);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 300);
    this.camera.position.set(20, 24, 45);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 150;
    this.controls.minDistance = 2.0;
    this.controls.target.set(20, 2.0, 0);
  }

  private setupLighting(): void {
    // Ambient fill with industrial slate tint
    const ambient = new THREE.AmbientLight(0x94a3b8, 0.7);
    this.scene.add(ambient);

    // Primary High-Bay Directional Sun
    const sunLight = new THREE.DirectionalLight(0xf8fafc, 2.8);
    sunLight.position.set(25, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    this.scene.add(sunLight);

    // Reheat Furnace Internal Fiery Orange Glow
    const furnaceGlow = new THREE.PointLight(0xff5500, 5.0, 22, 1.2);
    furnaceGlow.position.set(-24, 3.5, 0);
    this.scene.add(furnaceGlow);

    // Laminar Quenching Blue Overhead Spotlights
    const quenchLight = new THREE.SpotLight(0x38bdf8, 3.5, 30, Math.PI / 4, 0.5);
    quenchLight.position.set(40, 15, 0);
    quenchLight.target.position.set(40, 1.2, 0);
    this.scene.add(quenchLight);
    this.scene.add(quenchLight.target);

    // Dynamic Hot Steel Point Light (travels with the glowing steel)
    const hotSteelLight = new THREE.PointLight(0xff7700, 3.0, 16, 1.5);
    hotSteelLight.name = 'HotSteelMovingLight';
    hotSteelLight.position.set(-20, 2.0, 0);
    this.scene.add(hotSteelLight);
  }

  // =========================================================================
  // DYNAMIC STEEL WORKPIECE GENERATION
  // =========================================================================
  private setupWorkpiece(): void {
    // Hot Steel PBR Material with thermal glow
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff4400,
      emissiveIntensity: 2.8,
      metalness: 0.35,
      roughness: 0.32,
    });

    // 1. Initial Thick Hot Slab (Reheat & Descaler phase)
    // Real dimensions: ~4.2m length, 1.8m width, 0.28m thickness
    const slabGeo = new THREE.BoxGeometry(4.2, 0.28, 1.8);
    this.slabMesh = new THREE.Mesh(slabGeo, this.steelMaterial);
    this.slabMesh.castShadow = true;
    this.slabMesh.receiveShadow = true;
    this.slabMesh.position.set(-24, 1.48, 0);
    this.scene.add(this.slabMesh);

    // 2. High-Speed Elongated Strip (Finishing & Cooling Runout phase)
    // Continuous dynamic ribbon that stretches and thins down to 3mm
    const stripGeo = new THREE.BoxGeometry(1.0, 0.05, 1.8);
    this.stripMesh = new THREE.Mesh(stripGeo, this.steelMaterial.clone());
    this.stripMesh.castShadow = true;
    this.stripMesh.receiveShadow = true;
    this.stripMesh.position.set(10, 1.25, 0);
    this.stripMesh.visible = false;
    this.scene.add(this.stripMesh);

    // 3. Dynamic Winding Steel Coil (Downcoiler phase)
    const coilGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.8, 36);
    this.dynamicCoilMesh = new THREE.Mesh(
      coilGeo,
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        emissive: 0xaa2200,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.3,
      })
    );
    this.dynamicCoilMesh.rotation.x = Math.PI / 2;
    this.dynamicCoilMesh.position.set(60.6, 1.1, 0);
    this.dynamicCoilMesh.visible = false;
    this.scene.add(this.dynamicCoilMesh);
  }

  // =========================================================================
  // INDUSTRIAL PARTICLE SYSTEMS (STEAM, WATER SPRAY, SPARKS)
  // =========================================================================
  private setupParticleSystems(): void {
    // 1. Descaler High-Pressure Water Spray (High velocity cone nozzles)
    const descalerCount = 350;
    this.descalerGeo = new THREE.BufferGeometry();
    const descalerPos = new Float32Array(descalerCount * 3);
    for (let i = 0; i < descalerCount; i++) {
      descalerPos[i * 3 + 0] = -14 + (Math.random() - 0.5) * 0.4;
      descalerPos[i * 3 + 1] = 1.3 + Math.random() * 1.1;
      descalerPos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    this.descalerGeo.setAttribute('position', new THREE.BufferAttribute(descalerPos, 3));
    const descalerMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });
    this.descalerParticles = new THREE.Points(this.descalerGeo, descalerMat);
    this.scene.add(this.descalerParticles);

    // 2. Laminar Cooling Cascades (Curtains of falling water drops)
    const laminarCount = 900;
    this.laminarGeo = new THREE.BufferGeometry();
    const laminarPos = new Float32Array(laminarCount * 3);
    for (let i = 0; i < laminarCount; i++) {
      laminarPos[i * 3 + 0] = 32 + Math.random() * 18;
      laminarPos[i * 3 + 1] = 1.25 + Math.random() * 2.2;
      laminarPos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    this.laminarGeo.setAttribute('position', new THREE.BufferAttribute(laminarPos, 3));
    const laminarMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.14,
      transparent: true,
      opacity: 0.8,
    });
    this.laminarParticles = new THREE.Points(this.laminarGeo, laminarMat);
    this.scene.add(this.laminarParticles);

    // 3. Volumetric Steam Plumes (Expanding, rising, fading vapor)
    const steamCount = 700;
    this.steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    this.steamLifetimes = new Float32Array(steamCount);
    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3 + 0] = 30 + Math.random() * 22;
      steamPos[i * 3 + 1] = 1.3 + Math.random() * 4.5;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      this.steamLifetimes[i] = Math.random();
    }
    this.steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.65,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.steamParticles = new THREE.Points(this.steamGeo, steamMat);
    this.scene.add(this.steamParticles);

    // 4. Rolling Sparks (Biting work roll friction bursts)
    const sparkCount = 180;
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    this.sparkVelocities = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3 + 0] = -7;
      sparkPos[i * 3 + 1] = 1.4;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      this.sparkVelocities[i * 3 + 0] = (Math.random() - 0.2) * 4.0;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 3.0;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
    });
    this.sparkParticles = new THREE.Points(this.sparkGeo, sparkMat);
    this.scene.add(this.sparkParticles);
  }

  // =========================================================================
  // LOAD PLANT MODEL & RIG KINEMATICS
  // =========================================================================
  private loadPlantModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/3dModels/SteelFactory/hot_strip_mill_complex.glb',
      (gltf) => {
        const root = gltf.scene;
        this.plantModelGroup = root;
        this.scene.add(root);
        root.updateMatrixWorld(true);

        this.allMillRollers = [];

        // Traverse and identify kinematic machine nodes and each individual roller
        root.traverse((obj) => {
          if (obj.name === 'FurnaceDoor') {
            this.furnaceDoor = obj;
          } else if (obj.name === 'CoilCar') {
            this.coilCar = obj;
          } else if (obj.name === 'SampleFinishedCoil') {
            this.sampleFinishedCoil = obj;
            obj.visible = false; // Hide until end of cycle
          }

          // Identify individual roller mesh components
          if ((obj as THREE.Mesh).isMesh && obj.name) {
            const name = obj.name;
            const worldPos = new THREE.Vector3();
            obj.getWorldPosition(worldPos);

            let type: MillRoller['type'] | null = null;
            let radius = 0.22;
            let standIdx: number | undefined = undefined;

            if (name.startsWith('FurnaceRoller')) {
              type = 'conveyor';
              radius = 0.22;
            } else if (name.startsWith('DescalerRoller')) {
              type = 'conveyor';
              radius = 0.20;
            } else if (name === 'RougherTopWorkRoll') {
              type = 'work_roll_top';
              radius = 0.38;
            } else if (name === 'RougherBotWorkRoll') {
              type = 'work_roll_bot';
              radius = 0.38;
            } else if (name === 'RougherTopBackupRoll') {
              type = 'backup_roll_top';
              radius = 0.72;
            } else if (name === 'RougherBotBackupRoll') {
              type = 'backup_roll_bot';
              radius = 0.72;
            } else if (name === 'RougherEdgerLeft') {
              type = 'edger_left';
              radius = 0.42;
            } else if (name === 'RougherEdgerRight') {
              type = 'edger_right';
              radius = 0.42;
            } else if (name.includes('_TopWorkRoll')) {
              type = 'work_roll_top';
              radius = 0.24;
              const match = name.match(/F(\d)_TopWorkRoll/);
              if (match) standIdx = parseInt(match[1], 10);
            } else if (name.includes('_BotWorkRoll')) {
              type = 'work_roll_bot';
              radius = 0.24;
              const match = name.match(/F(\d)_BotWorkRoll/);
              if (match) standIdx = parseInt(match[1], 10);
            } else if (name.includes('_TopBackupRoll')) {
              type = 'backup_roll_top';
              radius = 0.55;
              const match = name.match(/F(\d)_TopBackupRoll/);
              if (match) standIdx = parseInt(match[1], 10);
            } else if (name.includes('_BotBackupRoll')) {
              type = 'backup_roll_bot';
              radius = 0.55;
              const match = name.match(/F(\d)_BotBackupRoll/);
              if (match) standIdx = parseInt(match[1], 10);
            } else if (name.startsWith('RunoutRoller')) {
              type = 'conveyor';
              radius = 0.18;
            } else if (name === 'TopPinchRoll') {
              type = 'pinch_top';
              radius = 0.30;
            } else if (name === 'BotPinchRoll') {
              type = 'pinch_bot';
              radius = 0.30;
            } else if (name === 'CoilerMandrel') {
              type = 'mandrel';
              radius = 0.38;
            } else if (name.startsWith('WrapperRoll')) {
              type = 'wrapper';
              radius = 0.16;
            }

            if (type) {
              this.allMillRollers.push({
                object: obj,
                name,
                worldX: Number(worldPos.x.toFixed(2)),
                worldY: Number(worldPos.y.toFixed(2)),
                worldZ: Number(worldPos.z.toFixed(2)),
                radius,
                type,
                standIdx,
                currentRadPerSec: 0,
                targetRadPerSec: 0,
                currentRpm: 0,
              });
            }
          }
        });

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
        console.error('Error loading hot strip mill GLB:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // =========================================================================
  // ANIMATION LOOP & METALLURGICAL PROCESS SIMULATION
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.isPlaying) {
      // Advance simulation progress: continuous cycle from 0 to 100%
      // At 1.0x speed, 1 full manufacturing cycle takes ~45 seconds
      const cycleDuration = 45.0 / Math.max(0.1, this.simSpeed);
      this.progress += (dt / cycleDuration) * 100;
      if (this.progress > 100) {
        this.progress = 0; // Loop next slab
      }
      this.updateSimulationState(dt);
    }

    if (this.particlesEnabled) {
      this.updateParticles(dt);
    }

    // Camera follow mode
    if (this.activeCameraPreset === 'follow') {
      this.updateFollowCamera();
    }

    // FPS Meter
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

  private updateSimulationState(dt: number): void {
    const p = this.progress;
    this.telemetry.progressPercent = Math.round(p);

    const movingLight = this.scene.getObjectByName('HotSteelMovingLight') as THREE.PointLight;

    // Kinematic update of all individual rollers based on dynamic workpiece contact & local mill speed
    this.updateIndividualRollers(dt, p);

    // =======================================================================
    // STAGE 1: REHEATING FURNACE DISCHARGE (p: 0% to 15%)
    // =======================================================================
    if (p < 15) {
      const t = p / 15; // 0 to 1
      const startX = -25.0;
      const endX = -18.0;
      const currentX = startX + t * (endX - startX);

      // Lift furnace door as slab pushes forward
      if (this.furnaceDoor) {
        this.furnaceDoor.position.y = 3.1 + Math.sin(t * Math.PI) * 1.2;
      }

      this.slabMesh.visible = true;
      this.stripMesh.visible = false;
      this.dynamicCoilMesh.visible = false;
      if (this.sampleFinishedCoil) this.sampleFinishedCoil.visible = false;

      // Slab: 4.2m x 0.28m x 1.8m
      this.slabMesh.scale.set(1.0, 1.0, 1.0);
      this.slabMesh.position.set(currentX, 1.48, 0);

      // Temperature: Incandescent 1250°C
      this.setSteelVisualTemperature(1250);

      if (movingLight) movingLight.position.set(currentX, 2.2, 0);

      this.telemetry.stageName = 'Slab Reheating & Furnace Discharge';
      this.telemetry.stageNum = 1;
      this.telemetry.temperatureC = 1250;
      this.telemetry.thicknessMm = 280;
      this.telemetry.lengthM = 4.2;
      this.telemetry.speedMpm = 18;
      this.telemetry.speedMps = 0.3;
      this.telemetry.rollingForceMn = 0;
      this.telemetry.descalerPressureBar = 0;
      this.telemetry.waterFlowLpm = 0;
    }
    // =======================================================================
    // STAGE 2: PRIMARY HIGH-PRESSURE DESCALING (p: 15% to 28%)
    // =======================================================================
    else if (p < 28) {
      const t = (p - 15) / 13;
      const startX = -18.0;
      const endX = -11.0;
      const currentX = startX + t * (endX - startX);

      if (this.furnaceDoor) this.furnaceDoor.position.y = 3.1;

      this.slabMesh.visible = true;
      this.stripMesh.visible = false;
      this.dynamicCoilMesh.visible = false;

      this.slabMesh.position.set(currentX, 1.48, 0);

      // Water descaling blasts scale: temp drops from 1250°C to 1180°C
      const temp = 1250 - t * 70;
      this.setSteelVisualTemperature(temp);

      if (movingLight) movingLight.position.set(currentX, 2.2, 0);

      this.telemetry.stageName = 'Primary High-Pressure Water Descaling';
      this.telemetry.stageNum = 2;
      this.telemetry.temperatureC = Math.round(temp);
      this.telemetry.thicknessMm = 280;
      this.telemetry.lengthM = 4.2;
      this.telemetry.speedMpm = 45;
      this.telemetry.speedMps = 0.75;
      this.telemetry.rollingForceMn = 0;
      this.telemetry.descalerPressureBar = 320;
      this.telemetry.waterFlowLpm = 8500;
    }
    // =======================================================================
    // STAGE 3: ROUGHING MILL BREAKDOWN & EDGING (p: 28% to 45%)
    // =======================================================================
    else if (p < 45) {
      const t = (p - 28) / 17;
      const startX = -11.0;
      const endX = -2.0;
      const currentX = startX + t * (endX - startX);

      this.slabMesh.visible = true;
      this.stripMesh.visible = false;
      this.dynamicCoilMesh.visible = false;

      // Thickness reduces from 280mm to 45mm, length elongates from 4.2m to 16.5m
      const thickScale = THREE.MathUtils.lerp(1.0, 0.22, t);
      const lenScale = THREE.MathUtils.lerp(1.0, 3.8, t);

      this.slabMesh.scale.set(lenScale, thickScale, 1.0);
      this.slabMesh.position.set(currentX, 1.25 + (0.28 * thickScale) / 2, 0);

      const temp = 1180 - t * 120; // cools to ~1060°C
      this.setSteelVisualTemperature(temp);

      if (movingLight) movingLight.position.set(currentX, 2.2, 0);

      this.telemetry.stageName = '4-High Reversing Roughing Mill & Edger';
      this.telemetry.stageNum = 3;
      this.telemetry.temperatureC = Math.round(temp);
      this.telemetry.thicknessMm = Math.round(THREE.MathUtils.lerp(280, 45, t));
      this.telemetry.lengthM = Number((4.2 * lenScale).toFixed(1));
      this.telemetry.speedMpm = Math.round(THREE.MathUtils.lerp(45, 120, t));
      this.telemetry.speedMps = Number((this.telemetry.speedMpm / 60).toFixed(2));
      this.telemetry.rollingForceMn = 28.4;
      this.telemetry.descalerPressureBar = 0;
      this.telemetry.waterFlowLpm = 3200;
    }
    // =======================================================================
    // STAGE 4: TANDEM FINISHING MILLS F1-F6 (p: 45% to 68%)
    // =======================================================================
    else if (p < 68) {
      const t = (p - 45) / 23;

      this.slabMesh.visible = false;
      this.stripMesh.visible = true;
      this.dynamicCoilMesh.visible = false;

      // Ribbon extends from entry of F1 (X = -2) through F6 (X = 22)
      // High-speed ribbon length stretches to 38 meters
      const headX = -2.0 + t * 26.0;
      const currentLen = Math.min(36.0, 6.0 + t * 30.0);
      const centerX = headX - currentLen / 2;

      this.stripMesh.scale.set(currentLen, 0.08, 1.0);
      this.stripMesh.position.set(centerX, 1.22, 0);

      const temp = 1060 - t * 160; // cools to ~900°C (cherry red)
      this.setSteelVisualTemperature(temp);

      if (movingLight) movingLight.position.set(headX, 2.0, 0);

      this.telemetry.stageName = 'Tandem Finishing Mill Train (Stands F1–F6)';
      this.telemetry.stageNum = 4;
      this.telemetry.temperatureC = Math.round(temp);
      this.telemetry.thicknessMm = Number(THREE.MathUtils.lerp(45, 3.2, t).toFixed(1));
      this.telemetry.lengthM = Number(THREE.MathUtils.lerp(16.5, 95.0, t).toFixed(1));
      this.telemetry.speedMpm = Math.round(THREE.MathUtils.lerp(120, 780, t));
      this.telemetry.speedMps = Number((this.telemetry.speedMpm / 60).toFixed(1));
      this.telemetry.rollingForceMn = 38.6;
      this.telemetry.descalerPressureBar = 0;
      this.telemetry.waterFlowLpm = 6800;
    }
    // =======================================================================
    // STAGE 5: LAMINAR COOLING QUENCHING BANK (p: 68% to 86%)
    // =======================================================================
    else if (p < 86) {
      const t = (p - 68) / 18;

      this.slabMesh.visible = false;
      this.stripMesh.visible = true;
      this.dynamicCoilMesh.visible = false;

      // High-speed strip zips across the 32m runout table
      const headX = 22.0 + t * 36.0;
      const currentLen = 38.0;
      const centerX = headX - currentLen / 2;

      this.stripMesh.scale.set(currentLen, 0.06, 1.0);
      this.stripMesh.position.set(centerX, 1.2, 0);

      // Quenching: dramatic temperature drop from 900°C to 550°C
      // Color shifts from cherry red to dark oxidized gunmetal steel
      const temp = 900 - t * 350;
      this.setSteelVisualTemperature(temp);

      if (movingLight) {
        movingLight.position.set(headX, 2.0, 0);
        movingLight.intensity = (temp / 1250) * 2.5;
      }

      this.telemetry.stageName = 'Run-Out Table & Laminar Water Quenching';
      this.telemetry.stageNum = 5;
      this.telemetry.temperatureC = Math.round(temp);
      this.telemetry.thicknessMm = 3.0;
      this.telemetry.lengthM = 115.0;
      this.telemetry.speedMpm = 860;
      this.telemetry.speedMps = 14.3;
      this.telemetry.rollingForceMn = 0;
      this.telemetry.descalerPressureBar = 0;
      this.telemetry.waterFlowLpm = 14600;
    }
    // =======================================================================
    // STAGE 6: DOWNCOILER & COIL DISCHARGE (p: 86% to 100%)
    // =======================================================================
    else {
      const t = (p - 86) / 14;

      this.slabMesh.visible = false;
      this.dynamicCoilMesh.visible = true;

      // Strip ribbon feeds into mandrel throat and shrinks away
      const remainingLen = Math.max(0.1, (1.0 - t) * 35.0);
      this.stripMesh.scale.set(remainingLen, 0.05, 1.0);
      this.stripMesh.position.set(58.0 - remainingLen / 2, 1.2, 0);
      this.stripMesh.visible = remainingLen > 0.5;

      // Dynamic coil expands from inner core radius 0.38m to outer radius 0.95m
      const coilRadius = THREE.MathUtils.lerp(0.42, 0.95, Math.min(1.0, t * 1.4));
      this.dynamicCoilMesh.scale.set(coilRadius / 0.38, 1.0, coilRadius / 0.38);

      // In the final 30% of this stage, coil car lifts and transports coil forward
      if (t > 0.7) {
        const carT = (t - 0.7) / 0.3;
        const carX = 60.6 + carT * 3.2;
        this.dynamicCoilMesh.position.x = carX;
        if (this.coilCar) this.coilCar.position.x = carX;
      } else {
        this.dynamicCoilMesh.position.set(60.6, 1.1 + (coilRadius - 0.38) * 0.3, 0);
        if (this.coilCar) this.coilCar.position.x = 60.6;
      }

      this.setSteelVisualTemperature(550 - t * 40);

      this.telemetry.stageName = 'Downcoiler Mandrel & Coil Car Discharge';
      this.telemetry.stageNum = 6;
      this.telemetry.temperatureC = Math.round(550 - t * 40);
      this.telemetry.thicknessMm = 3.0;
      this.telemetry.lengthM = 120.0;
      this.telemetry.speedMpm = Math.round((1.0 - t) * 860);
      this.telemetry.speedMps = Number((this.telemetry.speedMpm / 60).toFixed(1));
      this.telemetry.rollingForceMn = 0;
      this.telemetry.descalerPressureBar = 0;
      this.telemetry.waterFlowLpm = 0;
      this.telemetry.coilWeightTonnes = 24.8;
    }
  }

  // =========================================================================
  // INDIVIDUAL ROLLER KINEMATICS & ENGAGEMENT ENGINE
  // =========================================================================
  private getStripVelocityAtX(worldX: number, p: number): number {
    // 1. Reheating furnace discharge: slow crawl
    if (worldX < -15.5) {
      return 0.35; // 21 m/min
    }

    // 2. Primary descaling table
    if (worldX < -9.5) {
      return 0.75; // 45 m/min
    }

    // 3. Roughing mill stand (X ≈ -7)
    if (worldX < -1.0) {
      const t = THREE.MathUtils.clamp((worldX - (-9.5)) / 8.5, 0, 1);
      return THREE.MathUtils.lerp(0.8, 2.0, t);
    }

    // 4. Tandem finishing mill stands F1 to F6 (X = 1.0, 4.6, 8.2, 11.8, 15.4, 19.0)
    // Speed increases progressively due to continuous volume conservation (gauge reduction: 45mm down to 3mm)
    if (worldX < 2.8) {
      return 2.5; // F1: 150 m/min
    }
    if (worldX < 6.4) {
      return 4.2; // F2: 252 m/min
    }
    if (worldX < 10.0) {
      return 6.5; // F3: 390 m/min
    }
    if (worldX < 13.6) {
      return 9.0; // F4: 540 m/min
    }
    if (worldX < 17.2) {
      return 12.0; // F5: 720 m/min
    }
    if (worldX < 21.0) {
      return 14.5; // F6: 870 m/min
    }

    // 5 & 6. Runout cooling table & Downcoiler (X >= 21)
    if (p >= 86) {
      const t = (p - 86) / 14;
      return 14.5 * (1.0 - 0.4 * t);
    }
    return 14.5; // High-speed runout: 870 m/min
  }

  private updateIndividualRollers(dt: number, p: number): void {
    if (this.allMillRollers.length === 0) return;

    // 1. Determine active workpiece span [steelTailX, steelHeadX]
    let steelTailX = -999;
    let steelHeadX = -999;

    if (p < 15) {
      const t = p / 15;
      const curX = -25.0 + t * 7.0; // -25 to -18
      steelTailX = curX - 2.1;
      steelHeadX = curX + 2.1;
    } else if (p < 28) {
      const t = (p - 15) / 13;
      const curX = -18.0 + t * 7.0; // -18 to -11
      steelTailX = curX - 2.1;
      steelHeadX = curX + 2.1;
    } else if (p < 45) {
      const t = (p - 28) / 17;
      const curX = -11.0 + t * 9.0; // -11 to -2
      const lenScale = 1.0 + t * 2.8;
      const len = 4.2 * lenScale;
      steelTailX = curX - len / 2;
      steelHeadX = curX + len / 2;
    } else if (p < 68) {
      const t = (p - 45) / 23;
      const headX = -2.0 + t * 26.0; // -2 to 24
      const len = Math.min(36.0, 6.0 + t * 30.0);
      steelHeadX = headX;
      steelTailX = headX - len;
    } else if (p < 86) {
      const t = (p - 68) / 18;
      const headX = 22.0 + t * 36.0; // 22 to 58
      const len = 38.0;
      steelHeadX = headX;
      steelTailX = headX - len;
    } else {
      const t = (p - 86) / 14;
      const remainingLen = Math.max(0.1, (1.0 - t) * 35.0);
      steelHeadX = 58.0;
      steelTailX = 58.0 - remainingLen;
    }

    const visualScale = 0.35;
    let activeCount = 0;
    let maxRpm = 0;

    // 2. Compute individual contact, target velocity & rotation for each roller
    for (let i = 0; i < this.allMillRollers.length; i++) {
      const roller = this.allMillRollers[i];
      let inContact = false;

      if (roller.type === 'mandrel' || roller.type === 'wrapper') {
        if (p >= 86) {
          const t = (p - 86) / 14;
          inContact = t < 0.75;
        } else if (steelHeadX >= 56.5) {
          inContact = true;
        }
      } else if (roller.type === 'pinch_top' || roller.type === 'pinch_bot') {
        inContact = roller.worldX >= steelTailX - 0.6 && roller.worldX <= steelHeadX + 0.6;
      } else {
        // Contact window with 0.45m lead/trail tolerance so each roller engages exactly when touched
        inContact = roller.worldX >= steelTailX - 0.45 && roller.worldX <= steelHeadX + 0.45;
      }

      if (inContact) {
        const vLinear = this.getStripVelocityAtX(roller.worldX, p);

        if (roller.type === 'mandrel') {
          let coilRadius = 0.38;
          if (p >= 86) {
            const t = (p - 86) / 14;
            coilRadius = THREE.MathUtils.lerp(0.42, 0.95, Math.min(1.0, t * 1.4));
          }
          roller.targetRadPerSec = (vLinear / coilRadius) * visualScale;
        } else {
          roller.targetRadPerSec = (vLinear / roller.radius) * visualScale;
        }
      } else {
        // Seamless deceleration to 0 when steel leaves the roller
        roller.targetRadPerSec = 0.0;
      }

      // Smooth mechanical acceleration / deceleration inertia
      const accelFactor = inContact ? 0.22 : 0.04;
      roller.currentRadPerSec = THREE.MathUtils.lerp(
        roller.currentRadPerSec,
        roller.targetRadPerSec,
        accelFactor
      );

      // Track active state and RPM for live telemetry
      if (roller.currentRadPerSec > 0.08) {
        activeCount++;
        roller.currentRpm = Math.round(
          (roller.currentRadPerSec / visualScale) * (60 / (2 * Math.PI))
        );
        if (roller.currentRpm > maxRpm) {
          maxRpm = roller.currentRpm;
        }
      } else {
        roller.currentRpm = 0;
      }

      // 3. Apply angular rotation based on roller kinematics
      const dAngle = roller.currentRadPerSec * dt * this.simSpeed;
      if (dAngle > 0.00005) {
        switch (roller.type) {
          case 'conveyor':
          case 'work_roll_bot':
          case 'pinch_bot':
            roller.object.rotateY(-dAngle);
            break;

          case 'work_roll_top':
          case 'pinch_top':
            roller.object.rotateY(dAngle);
            break;

          case 'backup_roll_bot':
            roller.object.rotateY(dAngle);
            break;

          case 'backup_roll_top':
            roller.object.rotateY(-dAngle);
            break;

          case 'edger_left':
            roller.object.rotateY(dAngle);
            break;

          case 'edger_right':
            roller.object.rotateY(-dAngle);
            break;

          case 'mandrel':
            roller.object.rotateY(-dAngle);
            break;

          case 'wrapper':
            roller.object.rotateY(dAngle);
            break;
        }
      }
    }

    this.telemetry.activeRollersCount = activeCount;
    this.telemetry.activeStandRpm = maxRpm;
  }

  // =========================================================================
  // THERMAL MATERIAL SHADER SIMULATION
  // =========================================================================
  private setSteelVisualTemperature(tempC: number): void {
    // Map temperature in Celsius to blackbody emission & diffuse color:
    // 1250°C -> Incandescent fiery yellow-orange
    // 1050°C -> Bright cherry red
    // 900°C  -> Deep cherry / crimson
    // 700°C  -> Dull burgundy
    // 550°C  -> Dark metallic slate / gunmetal
    const tNorm = Math.max(0, Math.min(1, (tempC - 500) / 750));

    let colHex: number;
    let emissiveHex: number;
    let emissiveIntensity: number;

    if (tNorm > 0.75) {
      // 1060°C to 1250°C
      colHex = 0xffba08;
      emissiveHex = 0xff5400;
      emissiveIntensity = 2.4 + (tNorm - 0.75) * 2.0;
    } else if (tNorm > 0.45) {
      // 840°C to 1060°C
      colHex = 0xe85d04;
      emissiveHex = 0xd00000;
      emissiveIntensity = 1.4 + (tNorm - 0.45) * 3.0;
    } else if (tNorm > 0.2) {
      // 650°C to 840°C
      colHex = 0x9d0208;
      emissiveHex = 0x6a040f;
      emissiveIntensity = 0.5 + (tNorm - 0.2) * 2.5;
    } else {
      // 500°C to 650°C (Cooled steel)
      colHex = 0x334155;
      emissiveHex = 0x370617;
      emissiveIntensity = tNorm * 1.5;
    }

    this.steelMaterial.color.setHex(colHex);
    this.steelMaterial.emissive.setHex(emissiveHex);
    this.steelMaterial.emissiveIntensity = emissiveIntensity;
    this.steelMaterial.needsUpdate = true;

    if (this.stripMesh && (this.stripMesh.material as THREE.MeshStandardMaterial)) {
      const sm = this.stripMesh.material as THREE.MeshStandardMaterial;
      sm.color.setHex(colHex);
      sm.emissive.setHex(emissiveHex);
      sm.emissiveIntensity = emissiveIntensity;
      sm.needsUpdate = true;
    }
  }

  // =========================================================================
  // PARTICLE PHYSICS UPDATES
  // =========================================================================
  private updateParticles(dt: number): void {
    // 1. Descaler high-pressure spray (only active when slab is passing: p in [15, 28])
    const descalerActive = this.progress >= 15 && this.progress <= 28;
    this.descalerParticles.visible = descalerActive;
    if (descalerActive) {
      const pos = this.descalerGeo.attributes['position'] as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 18.0; // blast downward
        if (arr[i + 1] < 1.1) {
          arr[i + 1] = 2.4; // recycle top
          arr[i + 0] = -14 + (Math.random() - 0.5) * 0.4;
        }
      }
      pos.needsUpdate = true;
    }

    // 2. Laminar Quenching Water Cascades (active when strip in cooling: p in [68, 86])
    const laminarActive = this.progress >= 65 && this.progress <= 88;
    this.laminarParticles.visible = laminarActive;
    if (laminarActive) {
      const pos = this.laminarGeo.attributes['position'] as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 12.0; // fall smoothly
        if (arr[i + 1] < 1.2) {
          arr[i + 1] = 3.6; // recycle at header
        }
      }
      pos.needsUpdate = true;
    }

    // 3. Volumetric Steam Plumes (rise, expand, drift)
    const steamActive = (this.progress >= 15 && this.progress <= 28) || (this.progress >= 65 && this.progress <= 88);
    this.steamParticles.visible = steamActive;
    if (steamActive) {
      const pos = this.steamGeo.attributes['position'] as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] += dt * 3.5; // rise upwards
        arr[i * 3 + 0] += dt * (Math.random() - 0.45) * 1.5; // slight horizontal draft
        arr[i * 3 + 2] += dt * (Math.random() - 0.5) * 1.2;

        if (arr[i * 3 + 1] > 7.5) {
          // Recycle at strip surface
          const baseX = this.progress >= 65 ? 30 + Math.random() * 22 : -14 + (Math.random() - 0.5) * 1.5;
          arr[i * 3 + 0] = baseX;
          arr[i * 3 + 1] = 1.35;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
        }
      }
      pos.needsUpdate = true;
    }

    // 4. Roll Bite Sparks
    const sparksActive = (this.progress >= 28 && this.progress <= 45) || (this.progress >= 45 && this.progress <= 68);
    this.sparkParticles.visible = sparksActive;
    if (sparksActive) {
      const pos = this.sparkGeo.attributes['position'] as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 0] += this.sparkVelocities[i * 3 + 0] * dt;
        arr[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        arr[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;
        this.sparkVelocities[i * 3 + 1] -= dt * 9.8; // gravity

        if (arr[i * 3 + 1] < 0.2) {
          // Reset spark at roll bite
          const biteX = this.progress >= 45 ? 8 + Math.random() * 12 : -7;
          arr[i * 3 + 0] = biteX;
          arr[i * 3 + 1] = 1.4;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
          this.sparkVelocities[i * 3 + 0] = (Math.random() - 0.2) * 5.0;
          this.sparkVelocities[i * 3 + 1] = 1.5 + Math.random() * 3.0;
          this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
        }
      }
      pos.needsUpdate = true;
    }
  }

  // =========================================================================
  // CAMERA CONTROLS & CINEMATIC PRESETS
  // =========================================================================
  setCameraPreset(preset: CameraPreset): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [20, 24, 45];
    let lookAt: [number, number, number] = [20, 2.0, 0];

    switch (preset) {
      case 'overview':
        targetPos = [20, 24, 45];
        lookAt = [20, 2.0, 0];
        break;
      case 'furnace':
        targetPos = [-22, 6, 12];
        lookAt = [-22, 2.5, 0];
        break;
      case 'descaler':
        targetPos = [-14, 4.5, 8];
        lookAt = [-14, 2.0, 0];
        break;
      case 'rougher':
        targetPos = [-7, 6, 10];
        lookAt = [-7, 3.0, 0];
        break;
      case 'finishing':
        targetPos = [10, 7.5, 14];
        lookAt = [10, 2.5, 0];
        break;
      case 'cooling':
        targetPos = [40, 8, 16];
        lookAt = [40, 2.0, 0];
        break;
      case 'coiler':
        targetPos = [60, 5.5, 11];
        lookAt = [60, 2.0, 0];
        break;
      case 'pulpit':
        targetPos = [8, 5.2, 5.5];
        lookAt = [16, 2.0, 0];
        break;
      case 'follow':
        return; // Handled dynamically in updateFollowCamera()
    }

    this.glideCamera(targetPos, lookAt);
  }

  private updateFollowCamera(): void {
    // Smoothly track current active steel location
    let targetX = 0;
    if (this.progress < 28) targetX = this.slabMesh.position.x;
    else if (this.progress < 86) targetX = this.stripMesh.position.x + 8.0;
    else targetX = this.dynamicCoilMesh.position.x;

    const desiredPos = new THREE.Vector3(targetX - 8, 5.5, 11);
    const desiredTarget = new THREE.Vector3(targetX + 3, 2.0, 0);

    this.camera.position.lerp(desiredPos, 0.04);
    this.controls.target.lerp(desiredTarget, 0.04);
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
  // DISPLAY MODES (THERMAL HEATMAP, X-RAY)
  // =========================================================================
  setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    if (!this.plantModelGroup) return;

    this.plantModelGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        if (!m.material) return;
        const mat = m.material as THREE.MeshStandardMaterial;

        if (mode === 'xray') {
          mat.transparent = true;
          mat.opacity = 0.28;
          mat.depthWrite = false;
        } else if (mode === 'thermal') {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
          mat.roughness = 0.8;
          mat.metalness = 0.2;
        } else {
          // Standard
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      }
    });
  }

  // =========================================================================
  // PLAYBACK & USER CONTROLS
  // =========================================================================
  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
  }

  resetSimulation(): void {
    this.progress = 0;
  }

  jumpToStage(pct: number): void {
    this.progress = pct;
  }

  toggleParticles(): void {
    this.particlesEnabled = !this.particlesEnabled;
    this.descalerParticles.visible = this.particlesEnabled;
    this.laminarParticles.visible = this.particlesEnabled;
    this.steamParticles.visible = this.particlesEnabled;
    this.sparkParticles.visible = this.particlesEnabled;
  }

  // =========================================================================
  // AUDIO SYNTHESIS
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
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (!this.motorOsc) {
        // Motor rumble
        this.motorOsc = this.audioCtx.createOscillator();
        this.motorOsc.type = 'sawtooth';
        this.motorOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.audioCtx.currentTime);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

        this.motorOsc.connect(filter);
        filter.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);
        this.motorOsc.start();
      }
    } catch {}
  }

  private stopAudio(): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
    }
  }
}
