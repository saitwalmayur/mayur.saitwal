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

export type OperationState =
  | 'WAITING_PART'
  | 'APPROACHING_PICK'
  | 'GRASPING'
  | 'LIFTING'
  | 'TRANSPORTING'
  | 'ALIGNING_PLACE'
  | 'RELEASING'
  | 'RETURNING';

export interface PartType {
  id: string;
  name: string;
  colorHex: number;
  glowColor: string;
  weight: string;
  shape: 'cylinder' | 'box' | 'hex';
}

@Component({
  selector: 'app-roboticarm',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './roboticarm.html',
  styleUrl: './roboticarm.scss',
  host: {
    ngSkipHydration: 'true',
  },
})
export class Roboticarm implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportContainer') containerRef!: ElementRef<HTMLDivElement>;

  // Simulation & Mode State
  isAutoMode = true;
  isPlaying = true;
  isMuted = false;
  cycleSpeed = 1.0;
  activeCameraPreset = 'overview';
  isLoading = true;
  loadingProgress = 0;
  currentState: OperationState = 'APPROACHING_PICK';

  // Production Metrics
  partsProcessed = 0;
  cycleTimer = 0;
  cycleDuration = 8.0;
  fps = 60;

  // Selected Part Type
  readonly partTypes: PartType[] = [
    {
      id: 'cyber-battery',
      name: 'Cyber Battery Cell',
      colorHex: 0x06b6d4,
      glowColor: '#06b6d4',
      weight: '1.85 kg',
      shape: 'cylinder',
    },
    {
      id: 'gold-ingot',
      name: 'Titanium Gold Ingot',
      colorHex: 0xf59e0b,
      glowColor: '#f59e0b',
      weight: '3.40 kg',
      shape: 'box',
    },
    {
      id: 'plasma-core',
      name: 'Plasma Fuel Core',
      colorHex: 0xa855f7,
      glowColor: '#a855f7',
      weight: '2.10 kg',
      shape: 'cylinder',
    },
    {
      id: 'quantum-chip',
      name: 'Quantum Micro-Unit',
      colorHex: 0x10b981,
      glowColor: '#10b981',
      weight: '0.95 kg',
      shape: 'hex',
    },
  ];
  selectedPartType: PartType = this.partTypes[0];

  // Manual Joint Sliders (Degrees)
  manualJoints = {
    j1Base: 31, // -180 to 180
    j3Elbow: 0, // -70 to 70
    j4Wrist: 0, // -85 to 85
    j5Gripper: 60, // 0 (closed) to 100 (open)
  };

  // Live Telemetry Readout
  telemetry = {
    j1Angle: 31,
    j2Angle: 25,
    j3Angle: 15,
    j4Angle: 5,
    gripperWidth: 60,
    eeX: '-2.50',
    eeY: '2.53',
    eeZ: '4.92',
    gripForce: '0.0 N',
    motorTemp: '41.8 °C',
    safetyStatus: 'NORMAL / ACTIVE',
  };

  // Payload Tracking
  isHoldingPayload = false;
  private currentPayload: THREE.Group | null = null;
  private incomingPart: THREE.Group | null = null;
  private deliveredParts: THREE.Group[] = [];

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private isBrowser = false;

  // Robotic Arm Elements
  private robotContainer: THREE.Group | null = null;
  private turntableGroup: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private loopAction: THREE.AnimationAction | null = null;

  // Cached Joint Nodes
  private elbowNode: THREE.Object3D | null = null;
  private wristNode: THREE.Object3D | null = null;
  private gripperPalmNode: THREE.Object3D | null = null;
  private fingerUNode: THREE.Object3D | null = null;
  private fingerDNode: THREE.Object3D | null = null;

  // Factory Workcell Stations (Calibrated to match arm reach)
  private stationAPos = new THREE.Vector3(-2.52, 1.8, 5.12); // Station A (Pick)
  private stationBPos = new THREE.Vector3(2.45, 1.8, 5.15); // Station B (Place)
  private stationAAngle = 0.55; // +31.5 deg
  private stationBAngle = 1.45; // +83.1 deg

  // Visual FX & Sensors
  private laserBeamA: THREE.Mesh | null = null;
  private laserBeamB: THREE.Mesh | null = null;
  private laserLightA: THREE.PointLight | null = null;
  private laserLightB: THREE.PointLight | null = null;
  private clampSparksGroup = new THREE.Group();

  // Web Audio Context
  private audioCtx: AudioContext | null = null;

  // Performance telemetry
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      this.initThreeScene();
    }, 60);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.disposeThreeResources();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser || !this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // =========================================================================
  // INITIALIZE THREE.JS SCENE
  // =========================================================================
  private initThreeScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const width = window.innerWidth || 1400;
    const height = window.innerHeight || 900;

    // 1. WebGL Renderer with High-Performance Shadows & Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. High-Tech Industrial Cyber / Clean Workcell Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f141c); // Cyber factory dark background
    this.scene.fog = new THREE.FogExp2(0x0f141c, 0.015);

    // 3. Perspective Camera (Clean overview of base and conveyors)
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.2, 200);
    this.camera.position.set(0, 7.2, 12.0);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going below ground plane
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 50;
    this.controls.target.set(0, 2.2, 3.2);

    // 5. Lighting Setup
    this.setupWorkcellLighting();

    // 6. Environment: Floor, Hazard Perimeters, Conveyor Stations & Sensors
    this.createFactoryEnvironment();

    // 7. Load GLB Model & Textures (With absolute centering above ground)
    this.loadRoboticArmModel();

    // 8. Start Loop
    this.lastTime = performance.now();
    this.animate();
  }

  // =========================================================================
  // WORKCELL LIGHTING (STUDIO KEY + SPOTLIGHTS + ACCENT GLOWS)
  // =========================================================================
  private setupWorkcellLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.75);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.65);
    this.scene.add(hemiLight);

    // Key directional light casting soft floor shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(12, 18, 14);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 40;
    const d = 12;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 2;
    this.scene.add(keyLight);

    // Cool front-left fill
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    fillLight.position.set(-14, 10, 10);
    this.scene.add(fillLight);

    // Warm orange rear rim light
    const rimLight = new THREE.DirectionalLight(0xf97316, 0.95);
    rimLight.position.set(0, 12, -14);
    this.scene.add(rimLight);

    // Spotlights over Station A (Pick) and Station B (Place)
    const spotA = new THREE.SpotLight(0x06b6d4, 3.2, 16, Math.PI / 5, 0.35, 1);
    spotA.position.set(this.stationAPos.x, 7.0, this.stationAPos.z);
    spotA.target.position.copy(this.stationAPos);
    this.scene.add(spotA);
    this.scene.add(spotA.target);

    const spotB = new THREE.SpotLight(0x10b981, 3.2, 16, Math.PI / 5, 0.35, 1);
    spotB.position.set(this.stationBPos.x, 7.0, this.stationBPos.z);
    spotB.target.position.copy(this.stationBPos);
    this.scene.add(spotB);
    this.scene.add(spotB.target);
  }

  // =========================================================================
  // FACTORY WORKCELL ENVIRONMENT
  // =========================================================================
  private createFactoryEnvironment(): void {
    // 1. Heavy Industrial Floor with Grid Lines (Y = 0)
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      roughness: 0.65,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper overlay
    const grid = new THREE.GridHelper(40, 40, 0x0284c7, 0x1e293b);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // 2. Heavy Mounting Pedestal for Robot Base (Height 0.45)
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.85, 0.45, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e2530,
      metalness: 0.75,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 0.225, 0); // Sits on floor at y=0, top at y=0.45
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Top Chrome Mounting Plate
    const mountRingGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.05, 32);
    const mountRingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const mountRing = new THREE.Mesh(mountRingGeo, mountRingMat);
    mountRing.position.set(0, 0.45, 0);
    mountRing.receiveShadow = true;
    this.scene.add(mountRing);

    // Safety Hazard Yellow/Black Striped Ring around Pedestal Base
    const hazardRingGeo = new THREE.RingGeometry(2.1, 2.55, 32);
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 256;
    hazardCanvas.height = 32;
    const hctx = hazardCanvas.getContext('2d')!;
    hctx.fillStyle = '#eab308';
    hctx.fillRect(0, 0, 256, 32);
    hctx.fillStyle = '#0f172a';
    for (let x = -32; x < 288; x += 32) {
      hctx.beginPath();
      hctx.moveTo(x, 0);
      hctx.lineTo(x + 18, 0);
      hctx.lineTo(x + 2, 32);
      hctx.lineTo(x - 16, 32);
      hctx.closePath();
      hctx.fill();
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.repeat.set(8, 1);
    const hazardMat = new THREE.MeshBasicMaterial({
      map: hazardTex,
      side: THREE.DoubleSide,
    });
    const hazardRing = new THREE.Mesh(hazardRingGeo, hazardMat);
    hazardRing.rotation.x = -Math.PI / 2;
    hazardRing.position.y = 0.02;
    this.scene.add(hazardRing);

    // 3. Station A (Infeed Conveyor Table - Pick Location)
    this.createConveyorStation(this.stationAPos, -0.45, true);

    // 4. Station B (Outfeed Conveyor Table - Place Location)
    this.createConveyorStation(this.stationBPos, 0.45, false);

    // 5. Optical Laser Sensor Beams
    this.createLaserSensors();

    // 6. Particle Spark Group
    this.scene.add(this.clampSparksGroup);

    // 7. Safety Glass Walls & Stanchions in Background
    this.createSafetyPerimeter();
  }

  // =========================================================================
  // BUILD CONVEYOR STATION TABLE
  // =========================================================================
  private createConveyorStation(pos: THREE.Vector3, angle: number, isInfeed: boolean): void {
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(pos);
    stationGroup.rotation.y = angle;

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.82,
      roughness: 0.25,
    });
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
    });
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.4,
      roughness: 0.35,
    });

    // Conveyor Bed (Length 3.4, Width 1.1, Height 0.22)
    // Shifted by +0.4 along Z so the inner end has plenty of safety clearance from pedestal hazard ring
    const bedGeo = new THREE.BoxGeometry(1.1, 0.22, 3.4);
    const bed = new THREE.Mesh(bedGeo, steelMat);
    bed.position.set(0, 0, 0.4);
    bed.castShadow = true;
    bed.receiveShadow = true;
    stationGroup.add(bed);

    // Moving Rubber Belt Top
    const beltGeo = new THREE.BoxGeometry(0.92, 0.04, 3.3);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.12, 0.4);
    stationGroup.add(belt);

    // Rollers on sides
    for (let rz = -1.1; rz <= 1.9; rz += 0.35) {
      const rollerGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.98, 16);
      rollerGeo.rotateZ(Math.PI / 2);
      const roller = new THREE.Mesh(rollerGeo, steelMat);
      roller.position.set(0, 0.12, rz);
      stationGroup.add(roller);
    }

    // Support Legs down to ground
    for (const lx of [-0.46, 0.46]) {
      for (const lz of [-1.0, 1.8]) {
        const legGeo = new THREE.CylinderGeometry(0.06, 0.06, pos.y, 12);
        const leg = new THREE.Mesh(legGeo, steelMat);
        leg.position.set(lx, -pos.y * 0.5, lz);
        leg.castShadow = true;
        stationGroup.add(leg);
      }
    }

    // Side Guard Rails
    for (const sx of [-0.52, 0.52]) {
      const railGeo = new THREE.BoxGeometry(0.05, 0.18, 3.4);
      const rail = new THREE.Mesh(railGeo, orangeMat);
      rail.position.set(sx, 0.16, 0.4);
      stationGroup.add(rail);
    }

    // Pick / Place Circular Target Plate (exactly at pos / center of grip)
    const targetRingGeo = new THREE.RingGeometry(0.24, 0.38, 24);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: isInfeed ? 0x06b6d4 : 0x10b981,
      side: THREE.DoubleSide,
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(0, 0.15, 0);
    stationGroup.add(targetRing);

    // Destination Crate on Outfeed End
    if (!isInfeed) {
      const crateGeo = new THREE.BoxGeometry(1.2, 0.55, 0.85);
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.5,
        roughness: 0.4,
      });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(0, 0.1, 2.0);
      stationGroup.add(crate);
    }

    this.scene.add(stationGroup);
  }

  // =========================================================================
  // OPTICAL LASER SENSORS OVER PICK & DROP STATIONS
  // =========================================================================
  private createLaserSensors(): void {
    const laserMatA = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.55,
    });
    const laserMatB = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
    });

    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8);

    // Laser A (Over Pick Station)
    this.laserBeamA = new THREE.Mesh(beamGeo, laserMatA);
    this.laserBeamA.position.set(this.stationAPos.x, this.stationAPos.y + 1.2, this.stationAPos.z);
    this.scene.add(this.laserBeamA);

    this.laserLightA = new THREE.PointLight(0x06b6d4, 1.8, 4.0);
    this.laserLightA.position.set(this.stationAPos.x, this.stationAPos.y + 0.3, this.stationAPos.z);
    this.scene.add(this.laserLightA);

    // Laser B (Over Place Station)
    this.laserBeamB = new THREE.Mesh(beamGeo, laserMatB);
    this.laserBeamB.position.set(this.stationBPos.x, this.stationBPos.y + 1.2, this.stationBPos.z);
    this.scene.add(this.laserBeamB);

    this.laserLightB = new THREE.PointLight(0x10b981, 1.8, 4.0);
    this.laserLightB.position.set(this.stationBPos.x, this.stationBPos.y + 0.3, this.stationBPos.z);
    this.scene.add(this.laserLightB);
  }

  // =========================================================================
  // SAFETY PERIMETER FENCE & PILLARS
  // =========================================================================
  private createSafetyPerimeter(): void {
    const fenceGroup = new THREE.Group();
    const stanchionMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.7,
      roughness: 0.25,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.75,
      transparent: true,
      opacity: 0.6,
    });

    const glassGeo = new THREE.BoxGeometry(16, 2.6, 0.08);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.3, -4.5);
    fenceGroup.add(glass);

    for (let x = -8; x <= 8; x += 4.0) {
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 12);
      const post = new THREE.Mesh(postGeo, stanchionMat);
      post.position.set(x, 1.35, -4.5);
      fenceGroup.add(post);
    }

    this.scene.add(fenceGroup);
  }

  // =========================================================================
  // LOAD ROBOTIC ARM GLTF MODEL & APPLY TEXTURES (100% GROUND SAFE)
  // =========================================================================
  private loadRoboticArmModel(): void {
    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();

    // High-resolution PBR textures
    const diffuseMap = texLoader.load('/3dModels/robotic_arm/Material.001_diffuse_0.jpeg');
    diffuseMap.colorSpace = THREE.SRGBColorSpace;
    diffuseMap.flipY = false;

    const normalMap = texLoader.load('/3dModels/robotic_arm/Material.001_normal_2.jpeg');
    normalMap.flipY = false;

    const roughMap = texLoader.load(
      '/3dModels/robotic_arm/Material.001_specularGlossiness_3@channels=G.jpeg'
    );
    roughMap.flipY = false;

    const metalMap = texLoader.load(
      '/3dModels/robotic_arm/Material.001_specularGlossiness_3@channels=B.jpeg'
    );
    metalMap.flipY = false;

    loader.load(
      '/3dModels/robotic_arm/robotic_arm.glb',
      (gltf) => {
        // 1. Container sits exactly on top of pedestal (Y = 0.45)
        this.robotContainer = new THREE.Group();
        this.robotContainer.position.set(0, 0.45, 0);
        const s = 0.55;
        this.robotContainer.scale.set(s, s, s);
        this.scene.add(this.robotContainer);

        // 2. Center gltf.scene so base bottom is at Y=0 and centered at (0,0)
        // In the original GLB, Robot_Base Min Y is -4.75204, Center X is 2.56393528, Center Z is -1.45784521
        gltf.scene.position.set(-2.56393528, 4.75204039, 1.45784521);
        this.robotContainer.add(gltf.scene);

        // 3. CO-AXIAL TURNTABLE GROUP:
        // The true vertical rotation axis in gltf.scene is exactly at (2.56393528, 0, -1.45784521).
        // Attaching the rotating turret (Base_Column, Base_Yoke_L, Base_Yoke_R) AND the arm (Robot_Frame)
        // ensures the shoulder and column stay 100% co-axial and concentric with 0 horizontal offset.
        // Meanwhile, Base_Plate (with anchor bolts) remains stationary on the mounting pedestal!
        this.turntableGroup = new THREE.Group();
        this.turntableGroup.name = 'Turntable_Group';
        this.turntableGroup.position.set(2.56393528, 0, -1.45784521);
        gltf.scene.add(this.turntableGroup);

        this.scene.updateMatrixWorld(true);

        const frameNode = gltf.scene.getObjectByName('Robot_Frame');
        const baseCol = gltf.scene.getObjectByName('Base_Column');
        const yokeL = gltf.scene.getObjectByName('Base_Yoke_L');
        const yokeR = gltf.scene.getObjectByName('Base_Yoke_R');

        if (frameNode) this.turntableGroup.attach(frameNode);
        if (baseCol) this.turntableGroup.attach(baseCol);
        if (yokeL) this.turntableGroup.attach(yokeL);
        if (yokeR) this.turntableGroup.attach(yokeR);

        // 4. Apply advanced PBR materials to components
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;

              if (mat.name === 'Material.001') {
                mat.map = diffuseMap;
                mat.normalMap = normalMap;
                mat.roughnessMap = roughMap;
                mat.metalnessMap = metalMap;
                mat.roughness = 0.4;
                mat.metalness = 0.75;
                mat.needsUpdate = true;
              } else if (mat.name === 'Robot_Orange') {
                mat.color.setHex(0xf97316);
                mat.metalness = 0.35;
                mat.roughness = 0.28;
              } else if (mat.name === 'Robot_Chrome') {
                mat.color.setHex(0xf8fafc);
                mat.metalness = 0.98;
                mat.roughness = 0.12;
              } else if (mat.name === 'Robot_Gunmetal') {
                mat.color.setHex(0x1e293b);
                mat.metalness = 0.85;
                mat.roughness = 0.35;
              } else if (mat.name === 'Robot_Rubber') {
                mat.color.setHex(0x0f172a);
                mat.roughness = 0.85;
                mat.metalness = 0.05;
              }
            }
          }

          // Cache references to animated hierarchy joints
          if (child.name === 'Elbow') {
            this.elbowNode = child;
          } else if (child.name === 'Wrist') {
            this.wristNode = child;
          } else if (child.name === 'Gripper_Palm') {
            this.gripperPalmNode = child;
          } else if (child.name === 'Finger_Pivot_U') {
            this.fingerUNode = child;
          } else if (child.name === 'Finger_Pivot_D') {
            this.fingerDNode = child;
          }
        });

        // 5. Initialize Animation Mixer with embedded 8-second RobotArm_Loop
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          const clip = gltf.animations[0];
          this.cycleDuration = clip.duration || 8.0;
          this.loopAction = this.mixer.clipAction(clip);
          this.loopAction.setLoop(THREE.LoopRepeat, Infinity);
          this.loopAction.play();
        }

        this.scene.add(this.robotContainer);

        // Spawn initial incoming part
        this.spawnIncomingPart();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (xhr) => {
        if (xhr.total > 0) {
          this.loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
          this.cdr.detectChanges();
        }
      },
      (error) => {
        console.error('Error loading robotic arm model:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // =========================================================================
  // SPAWN PAYLOAD ITEMS (CYBER BATTERY / MACHINED COMPONENTS)
  // =========================================================================
  private spawnIncomingPart(): void {
    if (this.incomingPart) {
      this.scene.remove(this.incomingPart);
    }

    const partGroup = new THREE.Group();
    const type = this.selectedPartType;

    const metalMat = new THREE.MeshStandardMaterial({
      color: type.colorHex,
      metalness: 0.88,
      roughness: 0.22,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: type.colorHex,
    });

    if (type.shape === 'cylinder') {
      const cylGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 24);
      const cyl = new THREE.Mesh(cylGeo, metalMat);
      cyl.castShadow = true;
      partGroup.add(cyl);

      // Glowing LED Ring
      const ringGeo = new THREE.TorusGeometry(0.185, 0.02, 8, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, glowMat);
      partGroup.add(ring);
    } else if (type.shape === 'box') {
      const boxGeo = new THREE.BoxGeometry(0.32, 0.38, 0.32);
      const box = new THREE.Mesh(boxGeo, metalMat);
      box.castShadow = true;
      partGroup.add(box);

      const bandGeo = new THREE.BoxGeometry(0.34, 0.05, 0.34);
      const band = new THREE.Mesh(bandGeo, glowMat);
      partGroup.add(band);
    } else {
      const hexGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.38, 6);
      const hex = new THREE.Mesh(hexGeo, metalMat);
      hex.castShadow = true;
      partGroup.add(hex);
    }

    // Position at Pick Station A on conveyor belt
    partGroup.position.set(this.stationAPos.x, this.stationAPos.y + 0.38, this.stationAPos.z);
    this.scene.add(partGroup);
    this.incomingPart = partGroup;
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

    if (this.isPlaying) {
      const scaledDt = dt * this.cycleSpeed;

      if (this.isAutoMode) {
        this.updateAutoPickAndPlace(scaledDt);
      } else {
        this.updateManualJoints(scaledDt);
      }
    }

    this.updateLaserSensorEffects();
    this.updateTelemetryHUD();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // =========================================================================
  // AUTOMATED CONTINUOUS PICK & PLACE WORKCELL LOGIC
  // =========================================================================
  private updateAutoPickAndPlace(dt: number): void {
    if (!this.mixer) return;

    this.mixer.update(dt);
    this.cycleTimer = (this.cycleTimer + dt) % this.cycleDuration;
    const t = this.cycleTimer;

    // Timeline synchronized with the GLB animation:
    // [0.0 - 0.9]: Approach Pick Target on Conveyor A (Gripper open)
    // [0.9 - 1.2]: Grip closed onto part -> PICK EVENT
    // [1.2 - 5.0]: Lift & Rotate base from Station A (-37.2 deg) to Station B (+37.2 deg)
    // [5.0 - 6.6]: Lower to Station B target
    // [6.6 - 7.0]: Gripper opens -> PLACE EVENT (releasing part onto Conveyor B)
    // [7.0 - 8.0]: Lift & Return base from Station B (+37.2 deg) back to Station A (-37.2 deg)

    if (t < 0.9) {
      this.currentState = 'APPROACHING_PICK';
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = this.stationAAngle;
      }
    } else if (t >= 0.9 && t < 1.2) {
      this.currentState = 'GRASPING';
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = this.stationAAngle;
      }

      // Trigger Pick Event
      if (!this.isHoldingPayload && this.incomingPart && this.gripperPalmNode) {
        this.attachPayloadToGripper();
        this.playAudioPneumaticClamp();
        this.emitClampSparks(this.incomingPart.position);
      }
    } else if (t >= 1.2 && t < 5.0) {
      this.currentState = 'TRANSPORTING';
      // Smooth sinusoidal swing from Station A to Station B
      const progress = (t - 1.2) / (5.0 - 1.2);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      const currentYaw = THREE.MathUtils.lerp(this.stationAAngle, this.stationBAngle, ease);
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = currentYaw;
      }
    } else if (t >= 5.0 && t < 6.6) {
      this.currentState = 'ALIGNING_PLACE';
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = this.stationBAngle;
      }
    } else if (t >= 6.6 && t < 7.0) {
      this.currentState = 'RELEASING';
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = this.stationBAngle;
      }

      // Trigger Place Event
      if (this.isHoldingPayload && this.currentPayload) {
        this.detachPayloadAtStationB();
        this.playAudioPartDelivered();
        this.partsProcessed++;
        this.cdr.detectChanges();
      }
    } else {
      this.currentState = 'RETURNING';
      // Smooth sinusoidal return from Station B to Station A
      const progress = (t - 7.0) / (8.0 - 7.0);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      const currentYaw = THREE.MathUtils.lerp(this.stationBAngle, this.stationAAngle, ease);
      if (this.turntableGroup) {
        this.turntableGroup.rotation.y = currentYaw;
      }

      // Spawn next part at Pick Station when ready
      if (!this.incomingPart && !this.isHoldingPayload) {
        this.spawnIncomingPart();
      }
    }

    // Move delivered parts down Conveyor B
    this.updateDeliveredParts(dt);
  }

  // =========================================================================
  // PAYLOAD ATTACH / DETACH KINEMATICS
  // =========================================================================
  private attachPayloadToGripper(): void {
    if (!this.incomingPart || !this.gripperPalmNode) return;

    this.scene.remove(this.incomingPart);
    this.gripperPalmNode.add(this.incomingPart);

    // Center payload right inside the gripper jaws
    this.incomingPart.position.set(0.42, 0, 0);
    this.incomingPart.rotation.set(0, 0, Math.PI / 2);

    this.currentPayload = this.incomingPart;
    this.incomingPart = null;
    this.isHoldingPayload = true;
    this.telemetry.gripForce = '145.2 N';
  }

  private detachPayloadAtStationB(): void {
    if (!this.currentPayload || !this.gripperPalmNode) return;

    this.gripperPalmNode.remove(this.currentPayload);
    this.scene.add(this.currentPayload);

    // Place securely on Conveyor B table
    this.currentPayload.position.set(this.stationBPos.x, this.stationBPos.y + 0.38, this.stationBPos.z);
    this.currentPayload.rotation.set(0, 0.45, 0);

    this.deliveredParts.push(this.currentPayload);
    this.currentPayload = null;
    this.isHoldingPayload = false;
    this.telemetry.gripForce = '0.0 N';
  }

  private updateDeliveredParts(dt: number): void {
    for (let i = this.deliveredParts.length - 1; i >= 0; i--) {
      const part = this.deliveredParts[i];
      // Travel forward along Conveyor B toward collection bin
      const forwardDir = new THREE.Vector3(0, 0, 1.2 * dt).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        0.45
      );
      part.position.add(forwardDir);

      // Clean up after it reaches the crate
      if (part.position.distanceTo(this.stationBPos) > 2.2) {
        this.scene.remove(part);
        this.deliveredParts.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // MANUAL JOINT SLIDERS UPDATE
  // =========================================================================
  private updateManualJoints(dt: number): void {
    if (this.turntableGroup) {
      const targetRad = THREE.MathUtils.degToRad(this.manualJoints.j1Base);
      this.turntableGroup.rotation.y = THREE.MathUtils.lerp(
        this.turntableGroup.rotation.y,
        targetRad,
        0.15
      );
    }

    if (this.elbowNode) {
      const targetRad = THREE.MathUtils.degToRad(this.manualJoints.j3Elbow);
      this.elbowNode.rotation.y = THREE.MathUtils.lerp(
        this.elbowNode.rotation.y,
        targetRad,
        0.15
      );
    }

    if (this.wristNode) {
      const targetRad = THREE.MathUtils.degToRad(this.manualJoints.j4Wrist);
      this.wristNode.rotation.y = THREE.MathUtils.lerp(
        this.wristNode.rotation.y,
        targetRad,
        0.15
      );
    }

    // Gripper fingers open / close
    const clampFactor = this.manualJoints.j5Gripper / 100;
    if (this.fingerUNode) {
      this.fingerUNode.rotation.y = THREE.MathUtils.lerp(-0.02, 0.22, clampFactor);
    }
    if (this.fingerDNode) {
      this.fingerDNode.rotation.y = THREE.MathUtils.lerp(0.02, -0.22, clampFactor);
    }
  }

  // =========================================================================
  // LASER SENSOR INDICATOR PULSES
  // =========================================================================
  private updateLaserSensorEffects(): void {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);

    if (this.laserLightA) {
      this.laserLightA.intensity = this.incomingPart ? 2.5 + pulse * 1.5 : 0.8;
    }
    if (this.laserLightB) {
      this.laserLightB.intensity = this.currentState === 'RELEASING' ? 3.5 : 1.0;
    }
  }

  // =========================================================================
  // TELEMETRY HUD UPDATE
  // =========================================================================
  private updateTelemetryHUD(): void {
    if (this.turntableGroup) {
      this.telemetry.j1Angle = Math.round(
        THREE.MathUtils.radToDeg(this.turntableGroup.rotation.y)
      );
    }
    if (this.elbowNode) {
      this.telemetry.j3Angle = Math.round(
        THREE.MathUtils.radToDeg(this.elbowNode.rotation.y)
      );
    }
    if (this.wristNode) {
      this.telemetry.j4Angle = Math.round(
        THREE.MathUtils.radToDeg(this.wristNode.rotation.y)
      );
    }

    // Gripper End-Effector World Position
    if (this.gripperPalmNode) {
      const v = new THREE.Vector3();
      this.gripperPalmNode.getWorldPosition(v);
      this.telemetry.eeX = v.x.toFixed(2);
      this.telemetry.eeY = v.y.toFixed(2);
      this.telemetry.eeZ = v.z.toFixed(2);
    }
  }

  // =========================================================================
  // VISUAL FX: CLAMP SPARKS / PUFF
  // =========================================================================
  private emitClampSparks(pos: THREE.Vector3): void {
    const sparkCount = 14;
    const sparkGeo = new THREE.SphereGeometry(0.025, 4, 4);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    for (let i = 0; i < sparkCount; i++) {
      const p = new THREE.Mesh(sparkGeo, sparkMat);
      p.position.copy(pos);
      this.clampSparksGroup.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        Math.random() * 2.0 + 0.5,
        (Math.random() - 0.5) * 2.5
      );

      const startTime = performance.now();
      const animateSpark = () => {
        const elapsed = (performance.now() - startTime) / 500;
        if (elapsed < 1.0) {
          p.position.addScaledVector(vel, 0.016);
          p.scale.setScalar(1.0 - elapsed);
          requestAnimationFrame(animateSpark);
        } else {
          this.clampSparksGroup.remove(p);
        }
      };
      animateSpark();
    }
  }

  // =========================================================================
  // WEB AUDIO SYNTHESIZED SOUND EFFECTS
  // =========================================================================
  private getAudioContext(): AudioContext | null {
    if (!this.isBrowser || this.isMuted) return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playAudioPneumaticClamp(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  private playAudioPartDelivered(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // =========================================================================
  // CAMERA PRESETS BAR
  // =========================================================================
  setCameraPreset(preset: string): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [0, 7.2, 12.0];
    let lookAt: [number, number, number] = [0, 2.2, 3.2];

    switch (preset) {
      case 'overview':
        targetPos = [0, 7.2, 12.0];
        lookAt = [0, 2.2, 3.2];
        break;
      case 'gripper':
        targetPos = [0, 4.0, 7.5];
        lookAt = [0, 2.8, 4.5];
        break;
      case 'pick':
        targetPos = [-5.2, 4.5, 7.5];
        lookAt = [this.stationAPos.x, this.stationAPos.y + 0.4, this.stationAPos.z];
        break;
      case 'place':
        targetPos = [5.2, 4.5, 7.5];
        lookAt = [this.stationBPos.x, this.stationBPos.y + 0.4, this.stationBPos.z];
        break;
      case 'top':
        targetPos = [0, 15.0, 3.0];
        lookAt = [0, 0, 3.0];
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
  // USER ACTIONS & UI TOGGLES
  // =========================================================================
  toggleMode(auto: boolean): void {
    this.isAutoMode = auto;
    if (this.isAutoMode) {
      if (this.loopAction) {
        this.loopAction.paused = false;
      }
    } else {
      if (this.loopAction) {
        this.loopAction.paused = true;
      }
      this.manualJoints.j1Base = this.telemetry.j1Angle;
      this.manualJoints.j3Elbow = this.telemetry.j3Angle;
      this.manualJoints.j4Wrist = this.telemetry.j4Angle;
    }
  }

  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
    if (this.loopAction) {
      this.loopAction.paused = !this.isPlaying;
    }
  }

  toggleAudio(): void {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.getAudioContext();
    }
  }

  setSpeed(speed: number): void {
    this.cycleSpeed = speed;
  }

  selectPartType(type: PartType): void {
    this.selectedPartType = type;
    if (!this.isHoldingPayload) {
      this.spawnIncomingPart();
    }
  }

  triggerManualGripToggle(): void {
    if (this.isHoldingPayload) {
      this.detachPayloadAtStationB();
    } else {
      this.attachPayloadToGripper();
    }
  }

  resetCycle(): void {
    this.cycleTimer = 0;
    if (this.mixer) {
      this.mixer.setTime(0);
    }
    if (this.currentPayload) {
      this.scene.remove(this.currentPayload);
      this.currentPayload = null;
      this.isHoldingPayload = false;
    }
    this.spawnIncomingPart();
  }

  // =========================================================================
  // RESOURCE DISPOSAL
  // =========================================================================
  private disposeThreeResources(): void {
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }
}
