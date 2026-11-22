import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { PoolAudioService } from './pool-audio.service';
import {
  GameMode,
  AIDifficulty,
  BallType,
  TurnPlayer,
  SuitType,
  CameraMode,
  GameState,
  PoolBall,
  PocketDef,
  CueConfig,
  PlayerData,
  TABLE_WIDTH,
  TABLE_LENGTH,
  HALF_WIDTH,
  HALF_LENGTH,
  BALL_RADIUS,
  POCKET_RADIUS_CORNER,
  POCKET_RADIUS_SIDE,
  CUSHION_RESTITUTION,
  BALL_RESTITUTION,
  FRICTION_ROLLING,
  VELOCITY_EPSILON,
  TABLE_POCKETS,
  DEFAULT_CUES,
  BALLS_SPEC,
  BallConfigSpec,
} from './pool-types';

@Component({
  selector: 'app-threejspoolgame',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './threejspoolgame.html',
  styleUrl: './threejspoolgame.scss',
})
export class Threejspoolgame implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('poolCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animFrameId: number = 0;
  private clock = new THREE.Clock();

  // 3D Objects & Hierarchy
  private roomGroup!: THREE.Group;
  private tableGroup!: THREE.Group;
  private ballsGroup!: THREE.Group;
  private cueGroup!: THREE.Group;
  private cueStickMesh!: THREE.Mesh;
  private cueWrapMesh!: THREE.Mesh;
  private cueAccentMesh!: THREE.Mesh;
  private aimGuideLine!: THREE.Line;
  private ghostBallMesh!: THREE.Mesh;
  private targetGuideLine!: THREE.Line;
  private cueTangentLine!: THREE.Line;

  // Ball Collections & State
  balls: PoolBall[] = [];
  cueBall!: PoolBall;
  pottedBalls: PoolBall[] = [];

  // Table Geometry Limits (Interior Cushion Surface)
  readonly minX = -HALF_WIDTH + BALL_RADIUS;
  readonly maxX = HALF_WIDTH - BALL_RADIUS;
  readonly minZ = -HALF_LENGTH + BALL_RADIUS;
  readonly maxZ = HALF_LENGTH - BALL_RADIUS;
  readonly tableSurfaceY = 0.85; // Height of cloth in 3D world space
  readonly ballY = 0.85 + BALL_RADIUS;

  // Game Configuration & State
  gameMode: GameMode = 'ai';
  aiDifficulty: AIDifficulty = 'medium';
  turnPlayer: TurnPlayer = 'player';
  gameState: GameState = 'ready';
  playerSuit: SuitType = null;
  aiSuit: SuitType = null;
  cameraMode: CameraMode = 'aim';

  // Aiming & Shot Mechanics
  aimAngle: number = 0; // In radians (0 is pointing down +Z)
  shotPower: number = 45; // 0 to 100 percentage
  isPullingBack: number = 0; // Visual cue stick offset
  cueEnglish: { x: number; y: number } = { x: 0, y: 0 }; // Spin: -1 to +1

  // Shot Tracking & Turn Rules
  private ballsPottedThisShot: PoolBall[] = [];
  private firstBallHit: PoolBall | null = null;
  private isBreakShot: boolean = true;
  private consecutivePlayerPots: number = 0;

  // Player Economy & Cues Store
  playerData: PlayerData = {
    coins: 450,
    equippedCueId: 'cue_maple',
    unlockedCueIds: ['cue_maple'],
    winsVsAI: { easy: 0, medium: 0, hard: 0 },
    totalMatches: 0,
    totalBallsPotted: 0,
  };
  cuesCatalog: CueConfig[] = JSON.parse(JSON.stringify(DEFAULT_CUES));
  equippedCue: CueConfig = this.cuesCatalog[0];

  // Modals & UI Controls
  isShopOpen: boolean = false;
  isSettingsOpen: boolean = false;
  isGameOverOpen: boolean = false;
  gameOverTitle: string = '';
  gameOverMessage: string = '';
  gameOverCoinsEarned: number = 0;
  isVictory: boolean = false;
  statusNotification: string = 'Welcome to 3D Grand Billiards! Drag to aim, pull cue to shoot.';
  private notificationTimer: any = null;

  // Dragging / Touch Controls for Aiming
  private isPointerAiming: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartAngle: number = 0;

  // Lighting References for Dynamic Mood
  private mainSpot1!: THREE.SpotLight;
  private mainSpot2!: THREE.SpotLight;
  private mainSpot3!: THREE.SpotLight;

  constructor(
    public audio: PoolAudioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlayerData();
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.buildBilliardRoom();
    this.setupHdrEnvironment();
    this.setupLighting();
    this.buildPoolTable();
    this.buildCueStick();
    this.buildAimGuidelines();
    this.initBallMeshes();
    this.rackBalls();
    this.updateCueVisuals();
    this.setCameraMode('aim');

    // Start Simulation Loop
    this.animate();

    this.showNotification('🎱 Rack broken! Aim and pull back the cue to strike.');
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  // =========================================================================
  // PERSISTENCE (LOCAL STORAGE)
  // =========================================================================
  private loadPlayerData(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('pool_game_player_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.playerData = { ...this.playerData, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read player data from localStorage:', e);
    }

    // Sync unlocked status with catalog
    this.cuesCatalog.forEach((c) => {
      c.unlocked = this.playerData.unlockedCueIds.includes(c.id);
    });

    const activeCue = this.cuesCatalog.find((c) => c.id === this.playerData.equippedCueId);
    if (activeCue) {
      this.equippedCue = activeCue;
    }
  }

  private savePlayerData(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('pool_game_player_data', JSON.stringify(this.playerData));
    } catch (e) {
      console.warn('Could not write player data to localStorage:', e);
    }
  }

  // =========================================================================
  // THREE.JS INITIALIZATION
  // =========================================================================
  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c12);

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 80);
    this.camera.position.set(0, 3.2, 3.4);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 14.0;
    this.controls.target.set(0, this.tableSurfaceY, 0);

    // Groups
    this.roomGroup = new THREE.Group();
    this.tableGroup = new THREE.Group();
    this.ballsGroup = new THREE.Group();
    this.cueGroup = new THREE.Group();

    this.scene.add(this.roomGroup);
    this.scene.add(this.tableGroup);
    this.scene.add(this.ballsGroup);
    this.scene.add(this.cueGroup);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    if (!this.renderer || !this.camera) return;
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // =========================================================================
  // PROCEDURAL TEXTURE GENERATORS
  // =========================================================================
  private createFeltTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich tournament emerald green gradient
    const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 360);
    grad.addColorStop(0, '#0a633d');
    grad.addColorStop(0.7, '#07482c');
    grad.addColorStop(1, '#053520');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Microscopic woven cloth fibers noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 1.2));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    return texture;
  }

  private createWoodTexture(baseColor: string = '#2c1409', highlight: string = '#462414'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Wood rings & horizontal grains
    ctx.fillStyle = highlight;
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 8 + 2;
      ctx.globalAlpha = 0.15 + Math.random() * 0.15;
      ctx.fillRect(0, y, 512, h);
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  private createParquetFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich dark walnut hardwood parquet pattern
    ctx.fillStyle = '#17110c';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 32;
    const plankW = 128;
    for (let y = 0; y < 512; y += plankH) {
      const offset = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
      for (let x = -plankW; x < 512 + plankW; x += plankW) {
        const tone = Math.floor(Math.random() * 22);
        ctx.fillStyle = `rgb(${34 + tone}, ${24 + tone * 0.8}, ${18 + tone * 0.6})`;
        ctx.fillRect(x + offset + 1, y + 1, plankW - 2, plankH - 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  private createBallTexture(spec: BallConfigSpec): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    if (spec.type === 'cue') {
      // Pure White Cue Ball with 6 Red Measles dots for spin visualization
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      // Red measles dots
      ctx.fillStyle = '#dc2626';
      const dots = [
        [128, 128],
        [384, 128],
        [256, 64],
        [256, 192],
      ];
      dots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (spec.type === 'solid' || spec.type === 'eight') {
      // Solid Color Ball
      const hex = spec.colorHex.toString(16).padStart(6, '0');
      ctx.fillStyle = '#' + hex;
      ctx.fillRect(0, 0, 512, 256);

      // White Number Badges (Opposite sides)
      [128, 384].forEach((cx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, 128, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = 'bold 46px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spec.number.toString(), cx, 131);
      });
    } else if (spec.type === 'stripe') {
      // Striped Ball (White Body with Wide Color Band)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      const hex = (spec.stripeColorHex || spec.colorHex).toString(16).padStart(6, '0');
      ctx.fillStyle = '#' + hex;
      // Broad centered horizontal stripe band
      ctx.fillRect(0, 52, 512, 152);

      // White Number Badges (Centered inside color stripe)
      [128, 384].forEach((cx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, 128, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.font = 'bold 42px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spec.number.toString(), cx, 131);

        // Underline on 6 and 9 for tournament clarity
        if (spec.number === 9) {
          ctx.strokeStyle = '#0a0a0a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx - 16, 150);
          ctx.lineTo(cx + 16, 150);
          ctx.stroke();
        }
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // =========================================================================
  // 3D ENVIRONMENT: BILLIARD ROOM & LIGHTING RIG
  // =========================================================================
  private buildBilliardRoom(): void {
    // 1. Hardwood Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createParquetFloorTexture(),
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // 2. Wainscoting Paneled Room Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.createWoodTexture('#1b130e', '#291c14'),
      roughness: 0.75,
      metalness: 0.05,
    });
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    backWall.position.set(0, 3, -6.5);
    backWall.receiveShadow = true;
    this.roomGroup.add(backWall);

    // Front Wall (behind camera)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    frontWall.position.set(0, 3, 6.5);
    frontWall.rotation.y = Math.PI;
    this.roomGroup.add(frontWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    leftWall.position.set(-6.5, 3, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.roomGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    rightWall.position.set(6.5, 3, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.roomGroup.add(rightWall);

    // 3. Vintage Billiard Art & Chalkboard Posters
    this.addWallPoster(0, 3.2, -6.45, 2.2, 1.4, 'GRAND 8-BALL MASTERS');
    this.addWallPoster(-4, 3.2, -6.45, 1.5, 1.2, 'CHAMPIONSHIP TOUR 1928');
    this.addWallPoster(4, 3.2, -6.45, 1.5, 1.2, 'PRECISION & SPIN');

    // 4. Studio Lighting Rig: Classic 3-Cone Emerald Brass Billiard Pendant
    this.buildOverheadPendant();
  }

  private addWallPoster(x: number, y: number, z: number, w: number, h: number, title: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    // Vintage paper background
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 512, 340);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 488, 316);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 30px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 80);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('OFFICIAL TOURNAMENT SANCTIONED', 256, 125);

    // Draw pool balls decoration
    const colors = ['#facc15', '#2563eb', '#dc2626', '#111827'];
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(160 + i * 64, 210, 24, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 })
    );
    mesh.position.set(x, y, z);
    this.roomGroup.add(mesh);

    // Golden frame border
    const frameGeo = new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.6,
      roughness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(x, y, z - 0.02);
    this.roomGroup.add(frame);
  }

  private setupHdrEnvironment(): void {
    if (typeof window === 'undefined') return;
    const loader = new RGBELoader();
    loader.load(
      '/ChessAssets/historic_cloister_passage_2k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
        if ('environmentIntensity' in this.scene) {
          (this.scene as any).environmentIntensity = 0.85;
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load HDR environment, using fallback studio lighting:', err);
      }
    );
  }

  private setupLighting(): void {
    // 1. Natural Dual-Gradient Hemisphere Light (mimics sky & floor room bounce)
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x1e293b, 0.75);
    this.scene.add(hemiLight);

    // 2. High-Precision Primary Overhead Table Key Softbox (Single clean shadow caster)
    const tableKeySpot = new THREE.SpotLight(0xfff7ea, 3.6, 12.0, Math.PI / 3.1, 0.78, 1.2);
    tableKeySpot.position.set(0, 3.3, 0);
    tableKeySpot.target.position.set(0, this.tableSurfaceY, 0);
    tableKeySpot.castShadow = true;
    tableKeySpot.shadow.mapSize.width = 2048;
    tableKeySpot.shadow.mapSize.height = 2048;
    tableKeySpot.shadow.bias = -0.00015;
    tableKeySpot.shadow.radius = 2.6;
    this.scene.add(tableKeySpot);
    this.scene.add(tableKeySpot.target);

    // 3. Longitudinal Table Bed Fill Lights (Head & Foot ends for uniform tournament illumination)
    [-0.85, 0.85].forEach((z) => {
      const bedFill = new THREE.DirectionalLight(0xfffaf0, 0.95);
      bedFill.position.set(0, 2.9, z);
      bedFill.target.position.set(0, this.tableSurfaceY, z * 0.4);
      this.scene.add(bedFill);
      this.scene.add(bedFill.target);
    });

    // 4. Perimeter Edge Rim Light (Accentuates ball spheres, cue stick, and wood bevels)
    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
    rimLight.position.set(-3.5, 3.8, -3.5);
    this.scene.add(rimLight);

    // 5. Soft Warm Wall Sconces
    const sconce1 = new THREE.PointLight(0xf59e0b, 1.1, 9, 1.4);
    sconce1.position.set(-4.5, 3.0, -5.8);
    this.scene.add(sconce1);

    const sconce2 = new THREE.PointLight(0xf59e0b, 1.1, 9, 1.4);
    sconce2.position.set(4.5, 3.0, -5.8);
    this.scene.add(sconce2);
  }

  private buildOverheadPendant(): void {
    const pendantGroup = new THREE.Group();
    pendantGroup.position.set(0, 2.7, 0);

    // Horizontal Brass Hanging Bar
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.2,
    });
    const bar = new THREE.Mesh(barGeo, brassMat);
    bar.rotation.z = Math.PI / 2;
    pendantGroup.add(bar);

    // 2 Hanging Vertical Chains
    [-0.7, 0.7].forEach((x) => {
      const chainGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.8, 8);
      const chain = new THREE.Mesh(chainGeo, brassMat);
      chain.position.set(x, 0.4, 0);
      pendantGroup.add(chain);
    });

    // 3 Vintage Emerald Enamel Conical Shades with Gold Lip
    const shadeGeo = new THREE.ConeGeometry(0.24, 0.28, 24, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.3,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    // Light bulb material
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    const shadePositions = [-0.75, 0, 0.75]; // Along Z table length
    shadePositions.forEach((z) => {
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(0, -0.12, z);
      shade.rotation.x = Math.PI; // Opening facing down
      pendantGroup.add(shade);

      // Gold lip ring
      const lipGeo = new THREE.TorusGeometry(0.24, 0.012, 12, 24);
      const lip = new THREE.Mesh(lipGeo, brassMat);
      lip.position.set(0, -0.26, z);
      lip.rotation.x = Math.PI / 2;
      pendantGroup.add(lip);

      // Incandescent Glowing Bulb inside the shade
      const bulbGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.set(0, -0.06, z);
      pendantGroup.add(bulbMesh);

      // Warm Local Filament Light (No shadow casting to prevent multi-shadow conflicts)
      const bulbLight = new THREE.PointLight(0xfbbf24, 1.4, 3.2, 1.5);
      bulbLight.position.set(0, -0.08, z);
      pendantGroup.add(bulbLight);

      // Subtle atmospheric volumetric light cone beam
      const beamGeo = new THREE.ConeGeometry(0.48, 1.6, 24, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef3c7,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, -1.05, z);
      pendantGroup.add(beam);
    });

    this.scene.add(pendantGroup);
  }

  // =========================================================================
  // 3D POOL TABLE (SLATE BED, CUSHIONS, POCKETS, LEGS)
  // =========================================================================
  public isGlbLoaded: boolean = false;
  private proceduralTableGroup: THREE.Group = new THREE.Group();

  private buildPoolTable(): void {
    // 1. Build initial procedural table (instant zero-latency fallback)
    this.tableGroup.add(this.proceduralTableGroup);
    this.buildProceduralTable();

    // 2. Load the realistic 3D GLB Pool Table Model
    const loader = new GLTFLoader();
    loader.load(
      '/3dModels/PoolTable/pool_table.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        model.position.set(0, 0, 0);

        // Hide procedural fallback, display realistic GLB model
        this.proceduralTableGroup.visible = false;
        this.tableGroup.add(model);
        this.isGlbLoaded = true;
        this.showNotification('✨ Realistic 3D GLB Pool Table Loaded!');
        this.cdr.detectChanges();
      },
      undefined,
      (err) => {
        console.warn('Could not load pool_table.glb, active fallback in use:', err);
      }
    );
  }

  private buildProceduralTable(): void {
    const feltTexture = this.createFeltTexture();
    const bedGeo = new THREE.BoxGeometry(TABLE_WIDTH, 0.06, TABLE_LENGTH);
    const bedMat = new THREE.MeshStandardMaterial({
      map: feltTexture,
      roughness: 0.88,
      metalness: 0.05,
    });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0, this.tableSurfaceY - 0.03, 0);
    bed.receiveShadow = true;
    this.proceduralTableGroup.add(bed);

    this.addTableMarkings();

    const woodTexture = this.createWoodTexture('#2e180d', '#422415');
    const railMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.35,
      metalness: 0.15,
    });

    const railThickness = 0.14;
    const railHeight = 0.08;

    [-HALF_LENGTH - railThickness / 2, HALF_LENGTH + railThickness / 2].forEach((z) => {
      const railGeo = new THREE.BoxGeometry(TABLE_WIDTH + railThickness * 2, railHeight, railThickness);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, this.tableSurfaceY + 0.01, z);
      rail.castShadow = true;
      rail.receiveShadow = true;
      this.proceduralTableGroup.add(rail);
    });

    [-HALF_WIDTH - railThickness / 2, HALF_WIDTH + railThickness / 2].forEach((x) => {
      const railGeo = new THREE.BoxGeometry(railThickness, railHeight, TABLE_LENGTH);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, this.tableSurfaceY + 0.01, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      this.proceduralTableGroup.add(rail);
    });

    this.addDiamondSights(railThickness);

    const brassPocketMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
    });

    TABLE_POCKETS.forEach((pkt) => {
      const holeGeo = new THREE.CylinderGeometry(pkt.radius * 0.95, pkt.radius * 0.8, 0.12, 24);
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(pkt.pos.x, this.tableSurfaceY - 0.05, pkt.pos.y);
      this.proceduralTableGroup.add(hole);

      const bezelGeo = new THREE.TorusGeometry(pkt.radius * 0.96, 0.015, 12, 24);
      const bezel = new THREE.Mesh(bezelGeo, brassPocketMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(pkt.pos.x, this.tableSurfaceY + 0.005, pkt.pos.y);
      this.proceduralTableGroup.add(bezel);
    });

    const legPositions = [
      [-HALF_WIDTH + 0.15, -HALF_LENGTH + 0.25],
      [HALF_WIDTH - 0.15, -HALF_LENGTH + 0.25],
      [-HALF_WIDTH + 0.15, HALF_LENGTH - 0.25],
      [HALF_WIDTH - 0.15, HALF_LENGTH - 0.25],
    ];

    legPositions.forEach(([x, z]) => {
      const legGeo = new THREE.CylinderGeometry(0.09, 0.07, this.tableSurfaceY - 0.04, 16);
      const leg = new THREE.Mesh(legGeo, railMat);
      leg.position.set(x, (this.tableSurfaceY - 0.04) / 2, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.proceduralTableGroup.add(leg);

      const footGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16);
      const foot = new THREE.Mesh(footGeo, brassPocketMat);
      foot.position.set(x, 0.02, z);
      this.proceduralTableGroup.add(foot);

      const shadowDiscGeo = new THREE.CircleGeometry(0.24, 24);
      const shadowDiscMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.45,
      });
      const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.set(x, 0.002, z);
      this.proceduralTableGroup.add(shadowDisc);
    });

    const bigShadowGeo = new THREE.PlaneGeometry(TABLE_WIDTH + 0.4, TABLE_LENGTH + 0.4);
    const bigShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const bigShadow = new THREE.Mesh(bigShadowGeo, bigShadowMat);
    bigShadow.rotation.x = -Math.PI / 2;
    bigShadow.position.set(0, 0.001, 0);
    this.proceduralTableGroup.add(bigShadow);
  }

  private addTableMarkings(): void {
    // Head string (Kitchen line) at -Z (0.25 from head rail)
    const lineGeo = new THREE.PlaneGeometry(TABLE_WIDTH - 0.08, 0.003);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, this.tableSurfaceY + 0.001, -HALF_LENGTH * 0.5);
    this.tableGroup.add(line);

    // Foot Spot (Rack Apex) at +Z (0.5 from foot rail)
    const spotGeo = new THREE.CircleGeometry(0.008, 16);
    const spotMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, this.tableSurfaceY + 0.001, HALF_LENGTH * 0.5);
    this.tableGroup.add(spot);
  }

  private addDiamondSights(railThickness: number): void {
    const sightGeo = new THREE.CircleGeometry(0.006, 12);
    const sightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Mother of pearl inlay
      metalness: 0.3,
      roughness: 0.2,
    });

    // Diamond spots along long rails
    for (let i = 1; i <= 7; i++) {
      const z = -HALF_LENGTH + (TABLE_LENGTH / 8) * i;
      [-HALF_WIDTH - railThickness / 2, HALF_WIDTH + railThickness / 2].forEach((x) => {
        const sight = new THREE.Mesh(sightGeo, sightMat);
        sight.rotation.x = -Math.PI / 2;
        sight.position.set(x, this.tableSurfaceY + 0.051, z);
        this.tableGroup.add(sight);
      });
    }
  }

  // =========================================================================
  // 3D CUE STICK & INTERACTIVE AIM GUIDELINES
  // =========================================================================
  private buildCueStick(): void {
    const cueStickLength = 1.45; // ~57 inches standard cue stick

    // Shaft Mesh (Tapered Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.006, 0.013, cueStickLength * 0.65, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xeed9b3,
      roughness: 0.3,
    });
    this.cueStickMesh = new THREE.Mesh(shaftGeo, shaftMat);
    this.cueStickMesh.position.set(0, 0, -cueStickLength * 0.325);
    this.cueStickMesh.rotation.x = Math.PI / 2;
    this.cueStickMesh.castShadow = true;

    // Leather Tip + Chalk + Ferrule
    const ferruleGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.025, 16);
    const ferruleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
    ferrule.position.set(0, (cueStickLength * 0.65) / 2 + 0.0125, 0);
    this.cueStickMesh.add(ferrule);

    const tipGeo = new THREE.CylinderGeometry(0.006, 0.0065, 0.008, 16);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 }); // Blue Master chalk tip
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0, (cueStickLength * 0.65) / 2 + 0.029, 0);
    this.cueStickMesh.add(tip);

    // Butt & Grip Wrap
    const buttGeo = new THREE.CylinderGeometry(0.013, 0.018, cueStickLength * 0.35, 16);
    const buttMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
    });
    this.cueWrapMesh = new THREE.Mesh(buttGeo, buttMat);
    this.cueWrapMesh.position.set(0, -(cueStickLength * 0.65) / 2 - (cueStickLength * 0.35) / 2, 0);
    this.cueStickMesh.add(this.cueWrapMesh);

    // Decorative Accent Collar Rings
    const ringGeo = new THREE.CylinderGeometry(0.0132, 0.0132, 0.015, 16);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.2,
    });
    this.cueAccentMesh = new THREE.Mesh(ringGeo, ringMat);
    this.cueAccentMesh.position.set(0, (cueStickLength * 0.35) / 2 - 0.01, 0);
    this.cueWrapMesh.add(this.cueAccentMesh);

    this.cueGroup.add(this.cueStickMesh);
  }

  private updateCueVisuals(): void {
    if (!this.cueStickMesh || !this.cueWrapMesh || !this.cueAccentMesh) return;
    const c = this.equippedCue;

    (this.cueStickMesh.material as THREE.MeshStandardMaterial).color.set(c.shaftWoodColor);
    (this.cueWrapMesh.material as THREE.MeshStandardMaterial).color.set(c.buttWoodColor);

    const accentMat = this.cueAccentMesh.material as THREE.MeshStandardMaterial;
    accentMat.color.set(c.accentColor);
    if (c.glow) {
      accentMat.emissive.set(c.accentColor);
      accentMat.emissiveIntensity = 0.8;
    } else {
      accentMat.emissive.setHex(0x000000);
      accentMat.emissiveIntensity = 0;
    }
  }

  private buildAimGuidelines(): void {
    // 1. Primary Aim Ray (Dashed laser line from cue ball)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1.5),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.03,
      gapSize: 0.02,
      linewidth: 2,
    });
    this.aimGuideLine = new THREE.Line(lineGeo, lineMat);
    this.aimGuideLine.computeLineDistances();
    this.scene.add(this.aimGuideLine);

    // 2. Ghost Ball Sphere (shows exact contact point of cue ball)
    const ghostGeo = new THREE.SphereGeometry(BALL_RADIUS, 18, 18);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.ghostBallMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.scene.add(this.ghostBallMesh);

    // 3. Target Ball Deflection Guide Line
    const targetGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.8),
    ]);
    const targetMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 2,
    });
    this.targetGuideLine = new THREE.Line(targetGeo, targetMat);
    this.scene.add(this.targetGuideLine);

    // 4. Cue Ball Tangent Deflection Line (90° rule)
    const tangentGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.4),
    ]);
    const tangentMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.7,
    });
    this.cueTangentLine = new THREE.Line(tangentGeo, tangentMat);
    this.scene.add(this.cueTangentLine);
  }

  // =========================================================================
  // BALL CREATION & STANDARD 8-BALL TRIANGLE RACK
  // =========================================================================
  private initBallMeshes(): void {
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);

    BALLS_SPEC.forEach((spec) => {
      const texture = this.createBallTexture(spec);
      const ballMat = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.12,
        metalness: 0.04,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
      });

      const mesh = new THREE.Mesh(ballGeo, ballMat);
      mesh.castShadow = true;
      mesh.receiveShadow = false;

      // Contact shadow disc under each ball
      const shadowGeo = new THREE.CircleGeometry(BALL_RADIUS * 0.9, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = this.tableSurfaceY + 0.001;

      const ball: PoolBall = {
        id: spec.id,
        number: spec.number,
        type: spec.type,
        colorHex: spec.colorHex,
        stripeColorHex: spec.stripeColorHex,
        mesh,
        shadowMesh,
        pos: new THREE.Vector2(0, 0),
        vel: new THREE.Vector2(0, 0),
        spin: new THREE.Vector2(0, 0),
        isPotted: false,
        pottedOrder: -1,
        isDropping: false,
        dropProgress: 0,
      };

      this.ballsGroup.add(mesh);
      this.ballsGroup.add(shadowMesh);
      this.balls.push(ball);

      if (ball.id === 0) {
        this.cueBall = ball;
      }
    });
  }

  rackBalls(): void {
    this.pottedBalls = [];
    this.playerSuit = null;
    this.aiSuit = null;
    this.isBreakShot = true;
    this.firstBallHit = null;
    this.ballsPottedThisShot = [];
    this.gameState = 'aiming';
    this.turnPlayer = 'player';

    // 1. Position Cue Ball behind headstring (Kitchen line)
    this.cueBall.pos.set(0, -HALF_LENGTH * 0.5);
    this.cueBall.vel.set(0, 0);
    this.cueBall.spin.set(0, 0);
    this.cueBall.isPotted = false;
    this.cueBall.isDropping = false;
    this.cueBall.mesh.visible = true;
    if (this.cueBall.shadowMesh) this.cueBall.shadowMesh.visible = true;

    // 2. Standard 8-Ball Triangle Rack at Foot Spot (+Z)
    // Triangle rows: 1, 2, 3, 4, 5 balls
    // Apex at foot spot: Z = HALF_LENGTH * 0.5 = 0.635
    const apexZ = HALF_LENGTH * 0.5;
    const r = BALL_RADIUS;
    const rowSpacing = r * Math.sqrt(3) * 1.02; // Tight spacing

    // Specific 8-Ball Rack pattern:
    // Apex: Solid, 8-Ball in row 3 center, bottom corners: one solid & one stripe
    const rackOrder = [
      1, // Row 1 (Apex)
      9, 2, // Row 2
      3, 8, 10, // Row 3 (8-Ball in center)
      11, 4, 12, 5, // Row 4
      6, 13, 7, 14, 15, // Row 5 (Corners: 6 solid, 15 stripe)
    ];

    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
      const count = row + 1;
      const rowZ = apexZ + row * rowSpacing;
      const startX = -((count - 1) * r * 2.02) / 2;

      for (let col = 0; col < count; col++) {
        const ballId = rackOrder[ballIndex++];
        const ball = this.balls.find((b) => b.id === ballId);
        if (ball) {
          const ballX = startX + col * r * 2.02;
          ball.pos.set(ballX, rowZ);
          ball.vel.set(0, 0);
          ball.spin.set(0, 0);
          ball.isPotted = false;
          ball.isDropping = false;
          ball.mesh.visible = true;
          if (ball.shadowMesh) ball.shadowMesh.visible = true;
        }
      }
    }

    // Default aim angle pointing from cue ball directly at apex
    this.aimAngle = 0;
    this.shotPower = 55;
    this.cueEnglish = { x: 0, y: 0 };
    this.syncMeshPositions();
    this.updateAimGuide();
    this.updateCueTransform();
  }

  // =========================================================================
  // SIMULATION & PHYSICS LOOP
  // =========================================================================
  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate.bind(this));

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Physics Sub-stepping (10 steps per frame for high-speed stability & no tunneling)
    const substeps = 10;
    const subDt = dt / substeps;

    if (this.gameState === 'rolling' || this.gameState === 'shooting') {
      for (let s = 0; s < substeps; s++) {
        this.stepPhysics(subDt);
      }
      this.syncMeshPositions();
      this.checkRollingSettled();
    }

    // Controls & Camera
    this.controls.update();

    // Cue Group Aim Positioning
    if (this.gameState === 'aiming' || this.gameState === 'ai_thinking') {
      this.updateAimGuide();
      this.updateCueTransform();
    } else {
      this.aimGuideLine.visible = false;
      this.ghostBallMesh.visible = false;
      this.targetGuideLine.visible = false;
      this.cueTangentLine.visible = false;
      this.cueGroup.visible = false;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private stepPhysics(dt: number): void {
    const activeBalls = this.balls.filter((b) => !b.isPotted);

    // 1. Move balls & apply rolling friction
    activeBalls.forEach((b) => {
      if (b.isDropping) {
        // Falling into pocket
        b.dropProgress += dt * 3.5;
        b.vel.multiplyScalar(0.9);
        if (b.dropProgress >= 1.0) {
          b.isPotted = true;
          b.isDropping = false;
          b.mesh.visible = false;
          if (b.shadowMesh) b.shadowMesh.visible = false;
          this.handleBallPocketed(b);
        }
        return;
      }

      // Linear translation
      b.pos.addScaledVector(b.vel, dt);

      // Deceleration: rolling friction
      b.vel.multiplyScalar(Math.pow(FRICTION_ROLLING, dt * 60));

      // Velocity threshold clamp
      if (b.vel.lengthSq() < VELOCITY_EPSILON * VELOCITY_EPSILON) {
        b.vel.set(0, 0);
      }

      // Ball mesh rotation (rolling illusion)
      const speed = b.vel.length();
      if (speed > 0.01) {
        const rollAngle = (speed * dt) / BALL_RADIUS;
        const rollAxis = new THREE.Vector3(b.vel.y, 0, -b.vel.x).normalize();
        b.mesh.rotateOnWorldAxis(rollAxis, rollAngle);
      }
    });

    // 2. Ball-to-Ball Elastic Collisions
    for (let i = 0; i < activeBalls.length; i++) {
      const b1 = activeBalls[i];
      if (b1.isDropping) continue;

      for (let j = i + 1; j < activeBalls.length; j++) {
        const b2 = activeBalls[j];
        if (b2.isDropping) continue;

        const delta = new THREE.Vector2().subVectors(b2.pos, b1.pos);
        const dist = delta.length();
        const minDist = BALL_RADIUS * 2;

        if (dist < minDist && dist > 0.0001) {
          // Normal & Tangent vectors
          const normal = delta.clone().divideScalar(dist);
          const tangent = new THREE.Vector2(-normal.y, normal.x);

          // Positional De-penetration separation
          const overlap = (minDist - dist) * 0.505;
          b1.pos.addScaledVector(normal, -overlap);
          b2.pos.addScaledVector(normal, overlap);

          // Velocities in normal and tangent directions
          const v1n = b1.vel.dot(normal);
          const v1t = b1.vel.dot(tangent);
          const v2n = b2.vel.dot(normal);
          const v2t = b2.vel.dot(tangent);

          // Elastic collision exchange along normal
          if (v1n - v2n > 0) {
            const relVel = Math.abs(v1n - v2n);
            const newV1n = (v1n * (1 - BALL_RESTITUTION) + v2n * (1 + BALL_RESTITUTION)) * 0.5;
            const newV2n = (v1n * (1 + BALL_RESTITUTION) + v2n * (1 - BALL_RESTITUTION)) * 0.5;

            b1.vel = normal.clone().multiplyScalar(newV1n).add(tangent.clone().multiplyScalar(v1t));
            b2.vel = normal.clone().multiplyScalar(newV2n).add(tangent.clone().multiplyScalar(v2t));

            // Sound
            this.audio.playBallHit(relVel);

            // First ball hit tracking
            if (b1.id === 0 && !this.firstBallHit) {
              this.firstBallHit = b2;
            } else if (b2.id === 0 && !this.firstBallHit) {
              this.firstBallHit = b1;
            }
          }
        }
      }
    }

    // 3. Cushion / Rail Collisions
    activeBalls.forEach((b) => {
      if (b.isDropping) return;

      // Check if near any pocket mouth before bouncing off cushions
      const nearPocket = TABLE_POCKETS.some((p) => p.pos.distanceTo(b.pos) < p.radius * 1.05);

      if (!nearPocket) {
        // Left & Right cushions (X axis)
        if (b.pos.x < this.minX) {
          b.pos.x = this.minX;
          if (b.vel.x < 0) {
            b.vel.x = -b.vel.x * CUSHION_RESTITUTION;
            this.audio.playCushionHit(Math.abs(b.vel.x));
          }
        } else if (b.pos.x > this.maxX) {
          b.pos.x = this.maxX;
          if (b.vel.x > 0) {
            b.vel.x = -b.vel.x * CUSHION_RESTITUTION;
            this.audio.playCushionHit(Math.abs(b.vel.x));
          }
        }

        // Head & Foot cushions (Z axis)
        if (b.pos.y < this.minZ) {
          b.pos.y = this.minZ;
          if (b.vel.y < 0) {
            b.vel.y = -b.vel.y * CUSHION_RESTITUTION;
            this.audio.playCushionHit(Math.abs(b.vel.y));
          }
        } else if (b.pos.y > this.maxZ) {
          b.pos.y = this.maxZ;
          if (b.vel.y > 0) {
            b.vel.y = -b.vel.y * CUSHION_RESTITUTION;
            this.audio.playCushionHit(Math.abs(b.vel.y));
          }
        }
      }

      // 4. Pocket Drop Trigger
      TABLE_POCKETS.forEach((pkt) => {
        const d = pkt.pos.distanceTo(b.pos);
        if (d < pkt.radius * 0.75 && !b.isDropping) {
          b.isDropping = true;
          b.dropProgress = 0;
          this.audio.playPocketDrop();
        }
      });
    });
  }

  private syncMeshPositions(): void {
    this.balls.forEach((b) => {
      if (b.isPotted) {
        b.mesh.visible = false;
        if (b.shadowMesh) b.shadowMesh.visible = false;
        return;
      }

      let yPos = this.ballY;
      if (b.isDropping) {
        // Drop down into pocket cup
        yPos = this.ballY - b.dropProgress * 0.16;
        const scale = 1 - b.dropProgress * 0.25;
        b.mesh.scale.set(scale, scale, scale);
      } else {
        b.mesh.scale.set(1, 1, 1);
      }

      b.mesh.position.set(b.pos.x, yPos, b.pos.y);
      if (b.shadowMesh) {
        b.shadowMesh.position.set(b.pos.x, this.tableSurfaceY + 0.001, b.pos.y);
        b.shadowMesh.visible = !b.isDropping;
      }
    });
  }

  private handleBallPocketed(ball: PoolBall): void {
    this.pottedBalls.push(ball);
    this.ballsPottedThisShot.push(ball);
    this.playerData.totalBallsPotted++;

    // Add coins for potting
    if (this.turnPlayer === 'player' && ball.id !== 0) {
      this.earnCoins(15, `Potted Ball ${ball.number}!`);
    }

    this.cdr.detectChanges();
  }

  private checkRollingSettled(): void {
    // Check if all active balls have come to rest
    const isMoving = this.balls.some((b) => !b.isPotted && (b.vel.lengthSq() > 0 || b.isDropping));
    if (!isMoving) {
      this.onShotComplete();
    }
  }

  // =========================================================================
  // TURN LOGIC & 8-BALL RULES EVALUATION
  // =========================================================================
  private onShotComplete(): void {
    this.gameState = 'ready';

    const cuePotted = this.ballsPottedThisShot.some((b) => b.id === 0);
    const eightPotted = this.ballsPottedThisShot.some((b) => b.id === 8);
    const objectBallsPotted = this.ballsPottedThisShot.filter((b) => b.id !== 0 && b.id !== 8);

    // 1. Assign Suits if Open Table
    if (!this.playerSuit && objectBallsPotted.length > 0 && !this.isBreakShot) {
      const firstObj = objectBallsPotted[0];
      if (this.turnPlayer === 'player') {
        this.playerSuit = firstObj.type === 'solid' ? 'solids' : 'stripes';
        this.aiSuit = this.playerSuit === 'solids' ? 'stripes' : 'solids';
        this.showNotification(`🎱 You are assigned ${this.playerSuit.toUpperCase()}!`);
      } else {
        this.aiSuit = firstObj.type === 'solid' ? 'solids' : 'stripes';
        this.playerSuit = this.aiSuit === 'solids' ? 'stripes' : 'solids';
        this.showNotification(`🤖 AI is assigned ${this.aiSuit.toUpperCase()}!`);
      }
    }

    // 2. Evaluate 8-Ball Win / Loss
    if (eightPotted) {
      const shooterSuit = this.turnPlayer === 'player' ? this.playerSuit : this.aiSuit;
      const remainingSuitBalls = this.getRemainingBallsForSuit(shooterSuit);

      if (cuePotted || remainingSuitBalls.length > 0) {
        // Loss: Potted 8 early or scratched with 8
        const winner = this.turnPlayer === 'player' ? 'Computer' : 'Player';
        this.endGame(winner, '8-Ball was potted before clearing all assigned balls or on a scratch!');
      } else {
        // Legal Win!
        const winner = this.turnPlayer === 'player' ? 'Player' : 'Computer';
        this.endGame(winner, '8-Ball potted legally on the final shot!');
      }
      return;
    }

    // 3. Evaluate Scratch / Foul
    let isFoul = false;
    let foulReason = '';

    if (cuePotted) {
      isFoul = true;
      foulReason = 'Scratch! Cue ball was pocketed.';
      this.respawnCueBall();
    } else if (this.firstBallHit) {
      const shooterSuit = this.turnPlayer === 'player' ? this.playerSuit : this.aiSuit;
      if (shooterSuit) {
        const remaining = this.getRemainingBallsForSuit(shooterSuit);
        if (remaining.length > 0) {
          const hitType = this.firstBallHit.type === 'solid' ? 'solids' : this.firstBallHit.type === 'stripe' ? 'stripes' : 'eight';
          if (hitType !== shooterSuit) {
            isFoul = true;
            foulReason = `Foul! Failed to hit own ${shooterSuit} first.`;
          }
        } else if (this.firstBallHit.id !== 8) {
          isFoul = true;
          foulReason = 'Foul! Must hit 8-Ball when suit is cleared.';
        }
      }
    } else if (!this.isBreakShot) {
      isFoul = true;
      foulReason = 'Foul! Cue ball missed all object balls.';
    }

    if (isFoul) {
      this.audio.playFoul();
      this.showNotification(`⚠️ ${foulReason} Ball in Hand!`);
      this.switchTurn();
      return;
    }

    // 4. Determine if shooter continues turn
    const shooterSuit = this.turnPlayer === 'player' ? this.playerSuit : this.aiSuit;
    let pottedOwn = false;
    if (shooterSuit) {
      pottedOwn = objectBallsPotted.some((b) => (b.type === 'solid' && shooterSuit === 'solids') || (b.type === 'stripe' && shooterSuit === 'stripes'));
    } else {
      pottedOwn = objectBallsPotted.length > 0;
    }

    if (pottedOwn) {
      // Shooter continues!
      if (this.turnPlayer === 'player') {
        this.consecutivePlayerPots++;
        this.showNotification(`🎯 Clean pot! Continue your turn.`);
        this.gameState = 'aiming';
      } else {
        this.showNotification(`🤖 AI potted! AI continues shot.`);
        this.prepareAITurn();
      }
    } else {
      // Turn passes to opponent
      this.switchTurn();
    }

    this.isBreakShot = false;
    this.ballsPottedThisShot = [];
    this.firstBallHit = null;
    this.cdr.detectChanges();
  }

  private switchTurn(): void {
    this.turnPlayer = this.turnPlayer === 'player' ? 'computer' : 'player';

    if (this.turnPlayer === 'computer') {
      this.showNotification('🤖 AI is planning next shot...');
      this.prepareAITurn();
    } else {
      this.showNotification('🎱 Your turn! Choose your angle.');
      this.gameState = 'aiming';
    }
    this.cdr.detectChanges();
  }

  private respawnCueBall(): void {
    this.cueBall.isPotted = false;
    this.cueBall.isDropping = false;
    this.cueBall.mesh.visible = true;
    if (this.cueBall.shadowMesh) this.cueBall.shadowMesh.visible = true;
    this.cueBall.vel.set(0, 0);
    this.cueBall.spin.set(0, 0);

    // Place safely behind headstring
    this.cueBall.pos.set(0, -HALF_LENGTH * 0.45);
    this.syncMeshPositions();
  }

  getRemainingBallsForSuit(suit: SuitType): PoolBall[] {
    if (!suit) return [];
    return this.balls.filter(
      (b) =>
        !b.isPotted &&
        ((suit === 'solids' && b.type === 'solid') || (suit === 'stripes' && b.type === 'stripe'))
    );
  }

  // =========================================================================
  // COMPUTER AI OPPONENT (EASY, MEDIUM, HARD)
  // =========================================================================
  private prepareAITurn(): void {
    this.gameState = 'ai_thinking';

    // Think delay for realism
    const thinkTime = this.aiDifficulty === 'easy' ? 1200 : this.aiDifficulty === 'medium' ? 1600 : 2000;

    setTimeout(() => {
      this.executeAIShot();
    }, thinkTime);
  }

  private executeAIShot(): void {
    if (this.gameState !== 'ai_thinking' || this.turnPlayer !== 'computer') return;

    // 1. Identify valid targets for AI
    let candidateTargets: PoolBall[] = [];
    if (!this.aiSuit) {
      candidateTargets = this.balls.filter((b) => !b.isPotted && b.id !== 0 && b.id !== 8);
    } else {
      candidateTargets = this.getRemainingBallsForSuit(this.aiSuit);
      if (candidateTargets.length === 0) {
        // Can target 8-ball!
        const eight = this.balls.find((b) => b.id === 8 && !b.isPotted);
        if (eight) candidateTargets = [eight];
      }
    }

    if (candidateTargets.length === 0) {
      candidateTargets = this.balls.filter((b) => !b.isPotted && b.id !== 0);
    }

    // 2. Select best target and pocket based on difficulty
    let bestShot: { target: PoolBall; pocket: PocketDef; aimVec: THREE.Vector2; score: number } | null = null;

    for (const target of candidateTargets) {
      for (const pocket of TABLE_POCKETS) {
        // Vector from pocket to target
        const targetToPocket = new THREE.Vector2().subVectors(pocket.pos, target.pos).normalize();

        // Ghost ball contact point (radius * 2 behind target along targetToPocket)
        const ghostPos = target.pos.clone().sub(targetToPocket.clone().multiplyScalar(BALL_RADIUS * 2));

        // Vector from cue to ghost ball
        const cueToGhost = new THREE.Vector2().subVectors(ghostPos, this.cueBall.pos);
        const cueDist = cueToGhost.length();
        const pocketDist = target.pos.distanceTo(pocket.pos);

        // Cut angle alignment
        const cueDir = cueToGhost.clone().normalize();
        const cutCos = cueDir.dot(targetToPocket);

        // Score this shot: prefer high cut alignment and shorter distance
        const score = cutCos * 2.0 - pocketDist * 0.4 - cueDist * 0.2;

        if (!bestShot || score > (bestShot as any).score) {
          bestShot = { target, pocket, aimVec: cueDir, score };
        }
      }
    }

    // 3. Fallback to direct shot at apex or first ball
    let chosenAngle = 0;
    const shotCandidate: any = bestShot;
    if (shotCandidate && shotCandidate.aimVec) {
      chosenAngle = Math.atan2(shotCandidate.aimVec.x, shotCandidate.aimVec.y);
    } else {
      const fallbackTarget = candidateTargets[0] || this.balls[1];
      const dir = new THREE.Vector2().subVectors(fallbackTarget.pos, this.cueBall.pos).normalize();
      chosenAngle = Math.atan2(dir.x, dir.y);
    }

    // 4. Apply Difficulty Jitter / Error Margin
    let errorRad = 0;
    let power = 55;

    if (this.aiDifficulty === 'easy') {
      // Significant aiming error (+/- 5 to 7 degrees)
      errorRad = (Math.random() - 0.5) * (Math.PI / 15);
      power = 35 + Math.random() * 45;
    } else if (this.aiDifficulty === 'medium') {
      // Small aiming error (+/- 1.8 degrees)
      errorRad = (Math.random() - 0.5) * (Math.PI / 50);
      power = 50 + Math.random() * 25;
    } else {
      // Hard AI: Laser precision (+/- 0.35 degrees)
      errorRad = (Math.random() - 0.5) * (Math.PI / 250);
      power = 65 + Math.random() * 15;
    }

    this.aimAngle = chosenAngle + errorRad;
    this.shotPower = power;
    this.updateAimGuide();
    this.updateCueTransform();

    // 5. Visual Cue Stick Pull-back Animation before strike
    let pullStep = 0;
    const pullInterval = setInterval(() => {
      pullStep += 0.15;
      this.isPullingBack = Math.sin(pullStep) * 0.25;
      this.updateCueTransform();

      if (pullStep >= Math.PI) {
        clearInterval(pullInterval);
        this.isPullingBack = 0;
        this.shoot();
      }
    }, 40);
  }

  // =========================================================================
  // AIMING, POWER & SHOOTING CONTROLS
  // =========================================================================
  private updateAimGuide(): void {
    if (!this.cueBall || this.cueBall.isPotted) return;

    const maxGuideLength = 1.6 * this.equippedCue.aimGuide;
    const aimDir = new THREE.Vector2(Math.sin(this.aimAngle), Math.cos(this.aimAngle));

    // Raycast against all active balls to find closest contact
    let closestBall: PoolBall | null = null;
    let closestDist = maxGuideLength;
    let ghostCenter = this.cueBall.pos.clone().addScaledVector(aimDir, maxGuideLength);

    const activeBalls = this.balls.filter((b) => b.id !== 0 && !b.isPotted);

    activeBalls.forEach((b) => {
      const toBall = new THREE.Vector2().subVectors(b.pos, this.cueBall.pos);
      const proj = toBall.dot(aimDir);

      if (proj > 0 && proj < closestDist) {
        const perpDistSq = toBall.lengthSq() - proj * proj;
        const colRadius = BALL_RADIUS * 2;

        if (perpDistSq < colRadius * colRadius) {
          // Circle intersection distance
          const dContact = proj - Math.sqrt(colRadius * colRadius - perpDistSq);
          if (dContact < closestDist && dContact > 0) {
            closestDist = dContact;
            closestBall = b;
            ghostCenter = this.cueBall.pos.clone().addScaledVector(aimDir, dContact);
          }
        }
      }
    });

    // 1. Position Primary Aim Guide Line
    const cue3D = new THREE.Vector3(this.cueBall.pos.x, this.ballY, this.cueBall.pos.y);
    const ghost3D = new THREE.Vector3(ghostCenter.x, this.ballY, ghostCenter.y);

    const linePoints = [cue3D, ghost3D];
    this.aimGuideLine.geometry.setFromPoints(linePoints);
    this.aimGuideLine.computeLineDistances();
    this.aimGuideLine.visible = true;

    // 2. Ghost Ball
    if (closestBall) {
      this.ghostBallMesh.position.copy(ghost3D);
      this.ghostBallMesh.visible = true;

      // Target ball predicted path
      const targetDir = new THREE.Vector2().subVectors((closestBall as PoolBall).pos, ghostCenter).normalize();
      const targetEnd = (closestBall as PoolBall).pos.clone().addScaledVector(targetDir, 0.7);
      this.targetGuideLine.geometry.setFromPoints([
        new THREE.Vector3((closestBall as PoolBall).pos.x, this.ballY, (closestBall as PoolBall).pos.y),
        new THREE.Vector3(targetEnd.x, this.ballY, targetEnd.y),
      ]);
      this.targetGuideLine.visible = true;

      // Cue Ball 90° Tangent Path
      const tangentDir = new THREE.Vector2(-targetDir.y, targetDir.x);
      if (tangentDir.dot(aimDir) < 0) tangentDir.negate();
      const tangentEnd = ghostCenter.clone().addScaledVector(tangentDir, 0.45);
      this.cueTangentLine.geometry.setFromPoints([
        ghost3D,
        new THREE.Vector3(tangentEnd.x, this.ballY, tangentEnd.y),
      ]);
      this.cueTangentLine.visible = true;
    } else {
      this.ghostBallMesh.visible = false;
      this.targetGuideLine.visible = false;
      this.cueTangentLine.visible = false;
    }
  }

  private updateCueTransform(): void {
    if (!this.cueBall || this.cueBall.isPotted) {
      this.cueGroup.visible = false;
      return;
    }

    this.cueGroup.visible = true;

    // Place cue stick behind cue ball along opposite aim direction
    const pullOffset = this.isPullingBack + BALL_RADIUS + 0.04;
    const aimDir = new THREE.Vector2(Math.sin(this.aimAngle), Math.cos(this.aimAngle));

    const cueX = this.cueBall.pos.x - aimDir.x * pullOffset;
    const cueZ = this.cueBall.pos.y - aimDir.y * pullOffset;
    const cueY = this.ballY + 0.035; // Slight angle above table

    this.cueGroup.position.set(cueX, cueY, cueZ);
    this.cueGroup.rotation.y = this.aimAngle;
    this.cueStickMesh.rotation.x = Math.PI / 2 + 0.08; // 4.5 degree incline
  }

  shoot(): void {
    if (this.gameState !== 'aiming' && this.gameState !== 'ai_thinking') return;
    if (!this.cueBall || this.cueBall.isPotted) return;

    this.gameState = 'shooting';

    // Calculate shot impulse velocity
    const powerMultiplier = 0.075 * this.equippedCue.power;
    const totalPower = (this.shotPower / 100) * powerMultiplier * 105;

    const aimDir = new THREE.Vector2(Math.sin(this.aimAngle), Math.cos(this.aimAngle));
    this.cueBall.vel = aimDir.clone().multiplyScalar(totalPower);

    // Apply Spin / English
    const spinSens = this.equippedCue.spinControl * 0.4;
    this.cueBall.spin.set(this.cueEnglish.x * spinSens, this.cueEnglish.y * spinSens);

    // Audio cue impact
    this.audio.playCueHit(this.shotPower / 100);

    // Visual strike animation: Cue pops forward into ball
    this.isPullingBack = -0.06;
    this.updateCueTransform();

    setTimeout(() => {
      this.isPullingBack = 0;
      this.cueGroup.visible = false;
      this.gameState = 'rolling';
    }, 90);
  }

  // Pointer Aiming Event Listeners (Canvas Drag)
  onCanvasPointerDown(e: PointerEvent): void {
    if (this.gameState !== 'aiming' || this.turnPlayer !== 'player') return;
    this.isPointerAiming = true;
    this.pointerStartX = e.clientX;
    this.pointerStartAngle = this.aimAngle;
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    if (!this.isPointerAiming) return;
    const deltaX = e.clientX - this.pointerStartX;
    this.aimAngle = this.pointerStartAngle + deltaX * 0.0055;
    this.updateAimGuide();
    this.updateCueTransform();
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.isPointerAiming = false;
  }

  adjustAim(deltaDegrees: number): void {
    this.aimAngle += (deltaDegrees * Math.PI) / 180;
    this.updateAimGuide();
    this.updateCueTransform();
  }

  // =========================================================================
  // CAMERA VIEW MODES
  // =========================================================================
  setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    if (!this.cueBall) return;

    if (mode === 'aim') {
      // Behind cue ball aiming perspective
      const aimDir = new THREE.Vector2(Math.sin(this.aimAngle), Math.cos(this.aimAngle));
      this.camera.position.set(
        this.cueBall.pos.x - aimDir.x * 1.4,
        this.tableSurfaceY + 0.65,
        this.cueBall.pos.y - aimDir.y * 1.4
      );
      this.controls.target.set(
        this.cueBall.pos.x + aimDir.x * 0.8,
        this.tableSurfaceY,
        this.cueBall.pos.y + aimDir.y * 0.8
      );
    } else if (mode === 'top') {
      // 2D Overhead bird's-eye view
      this.camera.position.set(0, 4.4, 0.01);
      this.controls.target.set(0, this.tableSurfaceY, 0);
    } else if (mode === 'orbit') {
      // Isometric 3D showroom orbit
      this.camera.position.set(1.9, 2.5, 2.6);
      this.controls.target.set(0, this.tableSurfaceY, 0);
    }
  }

  // =========================================================================
  // CUE SHOP & COIN ECONOMY
  // =========================================================================
  openShop(): void {
    this.isShopOpen = true;
  }

  closeShop(): void {
    this.isShopOpen = false;
  }

  buyCue(cue: CueConfig): void {
    if (this.playerData.coins < cue.price) {
      this.audio.playFoul();
      this.showNotification('❌ Not enough coins! Win matches vs Computer to earn more.');
      return;
    }

    this.playerData.coins -= cue.price;
    cue.unlocked = true;
    if (!this.playerData.unlockedCueIds.includes(cue.id)) {
      this.playerData.unlockedCueIds.push(cue.id);
    }

    this.audio.playUpgradeSuccess();
    this.equipCue(cue);
    this.savePlayerData();
    this.showNotification(`🎉 Unlocked & Equipped: ${cue.name}!`);
  }

  equipCue(cue: CueConfig): void {
    this.equippedCue = cue;
    this.playerData.equippedCueId = cue.id;
    this.updateCueVisuals();
    this.savePlayerData();
    this.showNotification(`Equipped cue: ${cue.name}`);
  }

  earnCoins(amount: number, reason: string): void {
    this.playerData.coins += amount;
    this.savePlayerData();
    this.audio.playCoinChime();
    this.showNotification(`🪙 +${amount} Coins! ${reason}`);
  }

  // =========================================================================
  // GAME OVER & VICTORY
  // =========================================================================
  private endGame(winner: 'Player' | 'Computer', reason: string): void {
    this.gameState = 'game_over';
    this.isVictory = winner === 'Player';

    if (this.isVictory) {
      this.audio.playVictory();
      this.gameOverTitle = '🏆 VICTORY! YOU WON!';
      const reward =
        this.aiDifficulty === 'easy' ? 100 : this.aiDifficulty === 'medium' ? 250 : 600;
      this.earnCoins(reward, `Match Win vs ${this.aiDifficulty.toUpperCase()} AI`);
      this.gameOverCoinsEarned = reward;
      this.playerData.winsVsAI[this.aiDifficulty]++;
    } else {
      this.audio.playFoul();
      this.gameOverTitle = 'DEFEAT! COMPUTER WON';
      this.gameOverCoinsEarned = 25; // Consolation
      this.earnCoins(25, 'Match Consolation Prize');
    }

    this.playerData.totalMatches++;
    this.savePlayerData();

    this.gameOverMessage = reason;
    this.isGameOverOpen = true;
    this.cdr.detectChanges();
  }

  restartMatch(): void {
    this.isGameOverOpen = false;
    this.rackBalls();
  }

  setDifficulty(diff: AIDifficulty): void {
    this.aiDifficulty = diff;
    this.showNotification(`AI Difficulty set to: ${diff.toUpperCase()}`);
    this.restartMatch();
  }

  showNotification(msg: string): void {
    this.statusNotification = msg;
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.statusNotification = '';
      this.cdr.detectChanges();
    }, 4500);
    this.cdr.detectChanges();
  }
}
