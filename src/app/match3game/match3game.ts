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
import {
  LevelConfig,
  generate100Levels,
  PlayerLevelProgress,
  LevelObjective,
} from './match3-levels.data';
import { Match3AudioService } from './match3-audio.service';

export type ScreenState = 'home' | 'map' | 'game';
export type SpecialType = 'none' | 'rocket_h' | 'rocket_v' | 'bomb' | 'rainbow';

export interface GemData {
  id: number;
  col: number;
  row: number;
  color: number; // 0 to 5
  special: SpecialType;
  mesh?: THREE.Group;
  isMatched?: boolean;
}

export interface BoardTile {
  col: number;
  row: number;
  hasIce: boolean;
  iceHealth: number;
  hasCrate: boolean;
  crateHealth: number;
  hasJelly: boolean;
  isHole: boolean;
  tileMesh?: THREE.Mesh;
  iceMesh?: THREE.Mesh;
  crateMesh?: THREE.Group;
  jellyMesh?: THREE.Mesh;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

@Component({
  selector: 'app-match3game',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './match3game.html',
  styleUrl: './match3game.scss',
})
export class Match3game implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false })
  gameCanvasRef!: ElementRef<HTMLCanvasElement>;

  public isBrowser = false;

  // Active Screen Navigation
  currentScreen: ScreenState = 'home';

  // 100 Levels Collection & Player Progress
  levels: LevelConfig[] = [];
  currentLevelIndex = 0;
  currentLevel!: LevelConfig;
  playerProgress: { [level: number]: PlayerLevelProgress } = {};

  // Limited Lives System (Max 5, 15-minute regen)
  readonly MAX_LIVES = 5;
  readonly REGEN_TIME_SECONDS = 15 * 60; // 15 mins
  lives = 5;
  lastLifeLossTime: number = 0;
  timeUntilNextLife = 'Full';
  private livesTimer: any = null;

  // Player Economy & Stats
  coins = 250;
  totalStarsEarned = 0;
  dailyRewardClaimed = false;

  // Game Settings State
  settings = {
    sfx: true,
    music: true,
    shake: true,
    particles: true,
  };
  showSettingsModal = false;
  showOutOfLivesModal = false;
  showPauseModal = false;
  showHelpModal = false;

  // Active Game State
  score = 0;
  movesLeft = 0;
  comboCount = 0;
  isAnimating = false;
  selectedGem: GemData | null = null;
  dragStartTile: { col: number; row: number } | null = null;
  objectivesStatus: { [idx: number]: number } = {};

  // Boosters Inventory
  hammerCount = 3;
  rowZapCount = 2;
  rainbowBombCount = 1;
  activeBooster: 'hammer' | 'rowZap' | 'rainbowBomb' | null = null;

  // Modals & Overlays
  showWinModal = false;
  showLoseModal = false;
  shuffleAlert = false;
  levelSelectPage = 0; // 0: 1-25, 1: 26-50, 2: 51-75, 3: 76-100

  // Floating UI Popups
  floatingTexts: FloatingText[] = [];
  private floatingTextIdSeq = 0;

  // Gem Colors & Visual Themes
  readonly gemPalette = [
    { name: 'Ruby', hex: 0xf43f5e, css: '#f43f5e', emissive: 0x881337 },
    { name: 'Sapphire', hex: 0x3b82f6, css: '#3b82f6', emissive: 0x1e3a8a },
    { name: 'Emerald', hex: 0x10b981, css: '#10b981', emissive: 0x064e3b },
    { name: 'Topaz', hex: 0xf59e0b, css: '#f59e0b', emissive: 0x78350f },
    { name: 'Amethyst', hex: 0xa855f7, css: '#a855f7', emissive: 0x581c87 },
    { name: 'Diamond', hex: 0x06b6d4, css: '#06b6d4', emissive: 0x164e63 },
  ];

  // Board Data Representation
  grid: (GemData | null)[][] = [];
  tiles: BoardTile[][] = [];

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private animationId: number | null = null;

  // Scene Object Groups
  private boardGroup = new THREE.Group();
  private gemsGroup = new THREE.Group();
  private fxGroup = new THREE.Group();
  private selectorMesh!: THREE.Group;

  // Particles & Animations
  private particles: Particle[] = [];
  private nextGemId = 1;
  private idleTime = 0;

  // Spacing & Layout
  readonly tileSize = 1.0;
  readonly tileSpacing = 1.08;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    public audio: Match3AudioService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.levels = generate100Levels();
    this.currentLevel = this.levels[0];
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.loadSavedProgress();
    this.loadLivesState();
    this.loadSettings();
    this.startLivesTimer();

    // Start background ambient music if enabled
    if (this.settings.music) {
      this.audio.startAmbientMusic();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.livesTimer) {
      clearInterval(this.livesTimer);
    }
    this.audio.stopAmbientMusic();
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  // =========================================================================
  // SCREEN NAVIGATION
  // =========================================================================
  setScreen(screen: ScreenState): void {
    this.audio.playClick();
    this.currentScreen = screen;

    if (screen === 'game') {
      setTimeout(() => {
        if (!this.renderer && this.gameCanvasRef) {
          this.initThree();
          this.animate();
        }
        this.onResize();
      }, 50);
    }
  }

  playCurrentLevel(): void {
    if (this.lives <= 0) {
      this.showOutOfLivesModal = true;
      return;
    }

    // Find highest unlocked uncompleted level, or highest unlocked
    let targetIndex = 0;
    for (let i = 0; i < this.levels.length; i++) {
      if (this.isLevelUnlocked(this.levels[i].level)) {
        targetIndex = i;
        if (!this.playerProgress[this.levels[i].level]?.completed) {
          break;
        }
      }
    }

    this.startLevel(targetIndex);
    this.setScreen('game');
  }

  selectLevelFromMap(lvlNumber: number): void {
    if (!this.isLevelUnlocked(lvlNumber)) return;
    if (this.lives <= 0) {
      this.showOutOfLivesModal = true;
      return;
    }

    this.startLevel(lvlNumber - 1);
    this.setScreen('game');
  }

  // =========================================================================
  // LIMITED LIVES & REGENERATION SYSTEM
  // =========================================================================
  private loadLivesState(): void {
    try {
      const data = localStorage.getItem('match3_lives_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.lives = Math.min(this.MAX_LIVES, parsed.lives ?? 5);
        this.lastLifeLossTime = parsed.lastLifeLossTime || 0;
      }
    } catch {}
    this.recalculateLivesRegen();
  }

  private saveLivesState(): void {
    try {
      localStorage.setItem(
        'match3_lives_data',
        JSON.stringify({
          lives: this.lives,
          lastLifeLossTime: this.lastLifeLossTime,
        })
      );
    } catch {}
  }

  private startLivesTimer(): void {
    this.livesTimer = setInterval(() => {
      this.recalculateLivesRegen();
      this.cdr.detectChanges();
    }, 1000);
  }

  private recalculateLivesRegen(): void {
    if (this.lives >= this.MAX_LIVES) {
      this.timeUntilNextLife = 'Full';
      return;
    }

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.lastLifeLossTime) / 1000);

    if (elapsedSeconds >= this.REGEN_TIME_SECONDS) {
      const livesToRestore = Math.floor(elapsedSeconds / this.REGEN_TIME_SECONDS);
      this.lives = Math.min(this.MAX_LIVES, this.lives + livesToRestore);
      this.lastLifeLossTime = now - ((elapsedSeconds % this.REGEN_TIME_SECONDS) * 1000);
      this.saveLivesState();

      if (this.lives >= this.MAX_LIVES) {
        this.timeUntilNextLife = 'Full';
        return;
      }
    }

    const remainingSeconds = this.REGEN_TIME_SECONDS - (elapsedSeconds % this.REGEN_TIME_SECONDS);
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    this.timeUntilNextLife = `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  deductLife(): void {
    if (this.lives > 0) {
      if (this.lives === this.MAX_LIVES) {
        this.lastLifeLossTime = Date.now();
      }
      this.lives--;
      this.saveLivesState();
      this.recalculateLivesRegen();
    }
  }

  refillLivesFree(): void {
    this.audio.playWin();
    this.lives = this.MAX_LIVES;
    this.lastLifeLossTime = 0;
    this.saveLivesState();
    this.recalculateLivesRegen();
    this.showOutOfLivesModal = false;
  }

  buyLivesWithCoins(): void {
    if (this.coins >= 100) {
      this.coins -= 100;
      this.refillLivesFree();
      this.saveProgress();
    }
  }

  claimDailyReward(): void {
    if (this.dailyRewardClaimed) return;
    this.audio.playWin();
    this.dailyRewardClaimed = true;
    this.coins += 150;
    this.lives = this.MAX_LIVES;
    this.saveLivesState();
    this.saveProgress();
  }

  // =========================================================================
  // PERSISTENCE & SETTINGS
  // =========================================================================
  private loadSavedProgress(): void {
    try {
      const data = localStorage.getItem('match3_100_progress');
      if (data) {
        this.playerProgress = JSON.parse(data);
      } else {
        this.playerProgress[1] = {
          unlocked: true,
          completed: false,
          stars: 0,
          highScore: 0,
        };
      }

      const economy = localStorage.getItem('match3_economy');
      if (economy) {
        const parsed = JSON.parse(economy);
        this.coins = parsed.coins ?? 250;
        this.hammerCount = parsed.hammerCount ?? 3;
        this.rowZapCount = parsed.rowZapCount ?? 2;
        this.rainbowBombCount = parsed.rainbowBombCount ?? 1;
      }
    } catch {
      this.playerProgress[1] = {
        unlocked: true,
        completed: false,
        stars: 0,
        highScore: 0,
      };
    }
    this.recalculateTotalStars();
  }

  private saveProgress(): void {
    try {
      localStorage.setItem('match3_100_progress', JSON.stringify(this.playerProgress));
      localStorage.setItem(
        'match3_economy',
        JSON.stringify({
          coins: this.coins,
          hammerCount: this.hammerCount,
          rowZapCount: this.rowZapCount,
          rainbowBombCount: this.rainbowBombCount,
        })
      );
    } catch {}
    this.recalculateTotalStars();
  }

  private recalculateTotalStars(): void {
    let count = 0;
    Object.values(this.playerProgress).forEach((p) => {
      count += p.stars || 0;
    });
    this.totalStarsEarned = count;
  }

  loadSettings(): void {
    try {
      const data = localStorage.getItem('match3_settings');
      if (data) {
        this.settings = { ...this.settings, ...JSON.parse(data) };
        this.audio.isMuted = !this.settings.sfx;
        this.audio.isMusicEnabled = this.settings.music;
      }
    } catch {}
  }

  saveSettings(): void {
    try {
      localStorage.setItem('match3_settings', JSON.stringify(this.settings));
      this.audio.isMuted = !this.settings.sfx;
      this.audio.isMusicEnabled = this.settings.music;
      if (this.settings.music) {
        this.audio.startAmbientMusic();
      } else {
        this.audio.stopAmbientMusic();
      }
    } catch {}
  }

  toggleSetting(key: 'sfx' | 'music' | 'shake' | 'particles'): void {
    this.settings[key] = !this.settings[key];
    this.saveSettings();
  }

  resetAllProgress(): void {
    if (confirm('Are you sure you want to reset all game progress, stars, and levels?')) {
      localStorage.removeItem('match3_100_progress');
      localStorage.removeItem('match3_lives_data');
      localStorage.removeItem('match3_economy');
      this.playerProgress = { 1: { unlocked: true, completed: false, stars: 0, highScore: 0 } };
      this.lives = this.MAX_LIVES;
      this.coins = 250;
      this.hammerCount = 3;
      this.rowZapCount = 2;
      this.rainbowBombCount = 1;
      this.currentLevelIndex = 0;
      this.currentLevel = this.levels[0];
      this.saveProgress();
      this.saveLivesState();
      this.showSettingsModal = false;
      this.setScreen('home');
    }
  }

  isLevelUnlocked(lvl: number): boolean {
    return !!this.playerProgress[lvl]?.unlocked;
  }

  getLevelStars(lvl: number): number {
    return this.playerProgress[lvl]?.stars || 0;
  }

  // =========================================================================
  // THREE.JS SCENE SETUP
  // =========================================================================
  private initThree(): void {
    if (!this.gameCanvasRef) return;
    const canvas = this.gameCanvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
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
    this.scene.background = new THREE.Color(0x060913);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 14.5);
    this.camera.lookAt(0, 0, 0);

    // Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff7ed, 2.0);
    dirLight1.position.set(5, 8, 10);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0005;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-6, -6, 6);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xa855f7, 2.5, 15);
    pointLight.position.set(0, 0, 4);
    this.scene.add(pointLight);

    this.scene.add(this.boardGroup);
    this.scene.add(this.gemsGroup);
    this.scene.add(this.fxGroup);

    this.createSelectorMesh();
    this.onResize();
  }

  private createSelectorMesh(): void {
    this.selectorMesh = new THREE.Group();

    const ringGeo = new THREE.RingGeometry(0.48, 0.54, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.selectorMesh.add(ring);

    const bracketMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 4; i++) {
      const bGeo = new THREE.BoxGeometry(0.15, 0.04, 0.04);
      const bMesh = new THREE.Mesh(bGeo, bracketMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      bMesh.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0.05);
      bMesh.rotation.z = angle;
      this.selectorMesh.add(bMesh);
    }

    this.selectorMesh.visible = false;
    this.scene.add(this.selectorMesh);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser || !this.camera || !this.renderer || !this.gameCanvasRef) return;
    const canvas = this.gameCanvasRef.nativeElement;
    const parent = canvas.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (width < 600) {
      this.camera.position.z = 18.5;
    } else if (width < 960) {
      this.camera.position.z = 15.8;
    } else {
      this.camera.position.z = 14.2;
    }
  }

  // =========================================================================
  // LEVEL INITIALIZATION & BOARD GENERATION
  // =========================================================================
  startLevel(index: number): void {
    this.currentLevelIndex = index;
    this.currentLevel = this.levels[index];
    this.movesLeft = this.currentLevel.moves;
    this.score = 0;
    this.comboCount = 0;
    this.isAnimating = false;
    this.selectedGem = null;
    this.showWinModal = false;
    this.showLoseModal = false;
    this.showPauseModal = false;
    this.activeBooster = null;
    this.floatingTexts = [];
    this.idleTime = 0;

    if (this.selectorMesh) {
      this.selectorMesh.visible = false;
    }

    this.objectivesStatus = {};
    this.currentLevel.objectives.forEach((obj, idx) => {
      this.objectivesStatus[idx] = 0;
    });

    if (!this.renderer && this.gameCanvasRef) {
      this.initThree();
      this.animate();
    }

    this.clearBoardScene();
    this.buildBoardTiles();
    this.populateInitialGems();
    this.cdr.detectChanges();
  }

  private clearBoardScene(): void {
    while (this.boardGroup.children.length > 0) {
      this.boardGroup.remove(this.boardGroup.children[0]);
    }
    while (this.gemsGroup.children.length > 0) {
      this.gemsGroup.remove(this.gemsGroup.children[0]);
    }
    while (this.fxGroup.children.length > 0) {
      this.fxGroup.remove(this.fxGroup.children[0]);
    }
    this.particles = [];
  }

  private getBoardOffset(cols: number, rows: number): { x: number; y: number } {
    const totalW = (cols - 1) * this.tileSpacing;
    const totalH = (rows - 1) * this.tileSpacing;
    return {
      x: -totalW / 2,
      y: -totalH / 2,
    };
  }

  private gridToWorld(col: number, row: number): THREE.Vector3 {
    const offset = this.getBoardOffset(this.currentLevel.cols, this.currentLevel.rows);
    return new THREE.Vector3(
      offset.x + col * this.tileSpacing,
      offset.y + (this.currentLevel.rows - 1 - row) * this.tileSpacing,
      0
    );
  }

  private buildBoardTiles(): void {
    const cols = this.currentLevel.cols;
    const rows = this.currentLevel.rows;

    this.tiles = [];
    this.grid = [];

    // Outer Board Backing Plate with Dark Metallic Trim
    const boardW = cols * this.tileSpacing + 0.5;
    const boardH = rows * this.tileSpacing + 0.5;
    const backGeo = new THREE.BoxGeometry(boardW, boardH, 0.4);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.7,
      metalness: 0.35,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, 0, -0.28);
    backMesh.receiveShadow = true;
    this.boardGroup.add(backMesh);

    // Glowing Board Border Frame
    const frameGeo = new THREE.BoxGeometry(boardW + 0.15, boardH + 0.15, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 0, -0.38);
    this.boardGroup.add(frameMesh);

    for (let r = 0; r < rows; r++) {
      this.tiles[r] = [];
      this.grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const isHole = this.currentLevel.holePositions?.some(([hc, hr]) => hc === c && hr === r) || false;
        const hasIce = this.currentLevel.icePositions?.some(([ic, ir]) => ic === c && ir === r) || false;
        const hasCrate = this.currentLevel.cratePositions?.some(([cc, cr]) => cc === c && cr === r) || false;
        const hasJelly = this.currentLevel.jellyPositions?.some(([jc, jr]) => jc === c && jr === r) || false;

        const tile: BoardTile = {
          col: c,
          row: r,
          hasIce,
          iceHealth: hasIce ? 1 : 0,
          hasCrate,
          crateHealth: hasCrate ? 2 : 0,
          hasJelly,
          isHole,
        };

        if (!isHole) {
          const worldPos = this.gridToWorld(c, r);

          const tileGeo = new THREE.BoxGeometry(this.tileSize * 0.94, this.tileSize * 0.94, 0.12);
          const isCheckered = (c + r) % 2 === 0;
          const tileMat = new THREE.MeshStandardMaterial({
            color: isCheckered ? 0x0f172a : 0x141f36,
            roughness: 0.8,
            metalness: 0.2,
          });
          const tileMesh = new THREE.Mesh(tileGeo, tileMat);
          tileMesh.position.set(worldPos.x, worldPos.y, -0.06);
          tileMesh.receiveShadow = true;
          this.boardGroup.add(tileMesh);
          tile.tileMesh = tileMesh;

          if (hasJelly) {
            const jellyGeo = new THREE.PlaneGeometry(this.tileSize * 0.9, this.tileSize * 0.9);
            const jellyMat = new THREE.MeshStandardMaterial({
              color: 0xd946ef,
              transparent: true,
              opacity: 0.6,
              roughness: 0.2,
              metalness: 0.1,
              emissive: 0xa21caf,
              emissiveIntensity: 0.4,
            });
            const jellyMesh = new THREE.Mesh(jellyGeo, jellyMat);
            jellyMesh.position.set(worldPos.x, worldPos.y, 0.01);
            this.boardGroup.add(jellyMesh);
            tile.jellyMesh = jellyMesh;
          }

          if (hasCrate) {
            const crateGroup = new THREE.Group();
            const crateBox = new THREE.BoxGeometry(0.92, 0.92, 0.5);
            const crateMat = new THREE.MeshStandardMaterial({
              color: 0x78350f,
              roughness: 0.7,
              metalness: 0.2,
            });
            const boxMesh = new THREE.Mesh(crateBox, crateMat);
            boxMesh.castShadow = true;
            crateGroup.add(boxMesh);

            const strapMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
            const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.12, 0.51), strapMat);
            const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.93, 0.51), strapMat);
            crateGroup.add(s1, s2);

            crateGroup.position.set(worldPos.x, worldPos.y, 0.25);
            this.boardGroup.add(crateGroup);
            tile.crateMesh = crateGroup;
          }

          if (hasIce) {
            const iceGeo = new THREE.BoxGeometry(0.96, 0.96, 0.4);
            const iceMat = new THREE.MeshPhysicalMaterial({
              color: 0xbae6fd,
              transmission: 0.75,
              opacity: 0.85,
              transparent: true,
              roughness: 0.15,
              ior: 1.33,
              reflectivity: 0.9,
            });
            const iceMesh = new THREE.Mesh(iceGeo, iceMat);
            iceMesh.position.set(worldPos.x, worldPos.y, 0.3);
            this.boardGroup.add(iceMesh);
            tile.iceMesh = iceMesh;
          }
        }

        this.tiles[r][c] = tile;
        this.grid[r][c] = null;
      }
    }
  }

  private createGemMesh(color: number, special: SpecialType = 'none'): THREE.Group {
    const group = new THREE.Group();
    const pal = this.gemPalette[color % this.gemPalette.length];

    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    switch (color % 6) {
      case 0:
        geo = new THREE.OctahedronGeometry(0.38, 0);
        break;
      case 1:
        geo = new THREE.IcosahedronGeometry(0.38, 0);
        break;
      case 2:
        geo = new THREE.CylinderGeometry(0.36, 0.36, 0.48, 6);
        break;
      case 3:
        geo = new THREE.DodecahedronGeometry(0.36, 0);
        break;
      case 4:
        geo = new THREE.ConeGeometry(0.38, 0.52, 6);
        break;
      case 5:
      default:
        geo = new THREE.OctahedronGeometry(0.38, 1);
        break;
    }

    if (special === 'rainbow') {
      geo = new THREE.IcosahedronGeometry(0.42, 2);
      mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xec4899,
        emissiveIntensity: 0.6,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: pal.hex,
        roughness: 0.18,
        metalness: 0.12,
        emissive: pal.emissive,
        emissiveIntensity: 0.32,
      });
    }

    const mainMesh = new THREE.Mesh(geo, mat);
    mainMesh.castShadow = true;
    group.add(mainMesh);

    if (special === 'rocket_h' || special === 'rocket_v') {
      const ringGeo = new THREE.TorusGeometry(0.46, 0.04, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      if (special === 'rocket_h') ring.rotation.y = Math.PI / 2;
      group.add(ring);
    } else if (special === 'bomb') {
      const spikeGeo = new THREE.TetrahedronGeometry(0.48, 0);
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, wireframe: true });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      group.add(spike);
    } else if (special === 'rainbow') {
      const haloGeo = new THREE.RingGeometry(0.48, 0.56, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      group.add(halo);
    }

    return group;
  }

  private populateInitialGems(): void {
    const rows = this.currentLevel.rows;
    const cols = this.currentLevel.cols;
    const numColors = this.currentLevel.colors;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.tiles[r][c].isHole || this.tiles[r][c].hasCrate) {
          continue;
        }

        let color: number;
        let attempts = 0;
        do {
          color = Math.floor(Math.random() * numColors);
          attempts++;
        } while (
          attempts < 30 &&
          ((c >= 2 && this.grid[r][c - 1]?.color === color && this.grid[r][c - 2]?.color === color) ||
            (r >= 2 && this.grid[r - 1][c]?.color === color && this.grid[r - 2][c]?.color === color))
        );

        const gem: GemData = {
          id: this.nextGemId++,
          col: c,
          row: r,
          color,
          special: 'none',
        };

        const mesh = this.createGemMesh(color, 'none');
        const pos = this.gridToWorld(c, r);
        mesh.position.set(pos.x, pos.y, 0.25);
        this.gemsGroup.add(mesh);
        gem.mesh = mesh;

        this.grid[r][c] = gem;
      }
    }
  }

  // =========================================================================
  // USER INTERACTION (POINTER / CLICK / DRAG SWAPPING)
  // =========================================================================
  onPointerDown(event: MouseEvent | TouchEvent): void {
    if (this.isAnimating || this.movesLeft <= 0) return;

    const tile = this.getTileFromPointer(event);
    if (!tile || tile.isHole || tile.hasCrate) return;

    if (this.activeBooster) {
      this.applyBoosterToTile(tile);
      return;
    }

    const clickedGem = this.grid[tile.row][tile.col];
    this.dragStartTile = { col: tile.col, row: tile.row };

    if (!this.selectedGem) {
      if (clickedGem) {
        this.selectGem(clickedGem);
      }
    } else {
      if (this.isAdjacent(this.selectedGem.col, this.selectedGem.row, tile.col, tile.row)) {
        this.trySwap(this.selectedGem, clickedGem || { id: 0, col: tile.col, row: tile.row, color: -1, special: 'none' });
      } else {
        if (clickedGem) {
          this.selectGem(clickedGem);
        } else {
          this.deselectGem();
        }
      }
    }
  }

  onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragStartTile || this.isAnimating || this.activeBooster) return;

    const tile = this.getTileFromPointer(event);
    if (!tile || tile.isHole || tile.hasCrate) return;

    if (this.isAdjacent(this.dragStartTile.col, this.dragStartTile.row, tile.col, tile.row)) {
      const g1 = this.grid[this.dragStartTile.row][this.dragStartTile.col];
      const g2 = this.grid[tile.row][tile.col];
      if (g1) {
        this.dragStartTile = null;
        this.trySwap(g1, g2 || { id: 0, col: tile.col, row: tile.row, color: -1, special: 'none' });
      }
    }
  }

  onPointerUp(): void {
    this.dragStartTile = null;
  }

  private getTileFromPointer(event: MouseEvent | TouchEvent): BoardTile | null {
    if (!this.gameCanvasRef) return null;
    const canvas = this.gameCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.boardGroup.children, true);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const offset = this.getBoardOffset(this.currentLevel.cols, this.currentLevel.rows);

      const col = Math.round((hitPoint.x - offset.x) / this.tileSpacing);
      const row = this.currentLevel.rows - 1 - Math.round((hitPoint.y - offset.y) / this.tileSpacing);

      if (row >= 0 && row < this.currentLevel.rows && col >= 0 && col < this.currentLevel.cols) {
        return this.tiles[row][col];
      }
    }

    return null;
  }

  private isAdjacent(c1: number, r1: number, c2: number, r2: number): boolean {
    return Math.abs(c1 - c2) + Math.abs(r1 - r2) === 1;
  }

  private selectGem(gem: GemData): void {
    this.selectedGem = gem;
    this.idleTime = 0;

    const pos = this.gridToWorld(gem.col, gem.row);
    if (this.selectorMesh) {
      this.selectorMesh.position.set(pos.x, pos.y, 0.45);
      this.selectorMesh.visible = true;
    }
    this.audio.playSwap();
  }

  private deselectGem(): void {
    this.selectedGem = null;
    if (this.selectorMesh) {
      this.selectorMesh.visible = false;
    }
  }

  // =========================================================================
  // SWAP & MATCH CASULATION ENGINE
  // =========================================================================
  private trySwap(gem1: GemData, gem2: GemData): void {
    this.deselectGem();
    this.isAnimating = true;
    this.audio.playSwap();

    const r1 = gem1.row, c1 = gem1.col;
    const r2 = gem2.row, c2 = gem2.col;

    this.grid[r1][c1] = gem2.color >= 0 ? gem2 : null;
    this.grid[r2][c2] = gem1;

    gem1.row = r2;
    gem1.col = c2;
    if (gem2.color >= 0) {
      gem2.row = r1;
      gem2.col = c1;
    }

    const pos1 = this.gridToWorld(c1, r1);
    const pos2 = this.gridToWorld(c2, r2);

    this.animateSwap(gem1, gem2, pos1, pos2, () => {
      if (gem1.special === 'rainbow' || gem2.special === 'rainbow') {
        const rainbowGem = gem1.special === 'rainbow' ? gem1 : gem2;
        const otherGem = gem1.special === 'rainbow' ? gem2 : gem1;
        this.executeRainbowColorClear(rainbowGem, otherGem.color);
        this.movesLeft--;
        return;
      }

      const matches = this.findMatches();
      if (matches.length > 0) {
        this.movesLeft--;
        this.comboCount = 1;
        this.processMatches(matches);
      } else {
        this.grid[r1][c1] = gem1;
        this.grid[r2][c2] = gem2.color >= 0 ? gem2 : null;
        gem1.row = r1;
        gem1.col = c1;
        if (gem2.color >= 0) {
          gem2.row = r2;
          gem2.col = c2;
        }

        this.animateSwap(gem1, gem2, pos2, pos1, () => {
          this.isAnimating = false;
        });
      }
    });
  }

  private animateSwap(
    gem1: GemData,
    gem2: GemData,
    target1: THREE.Vector3,
    target2: THREE.Vector3,
    onComplete: () => void
  ): void {
    const startTime = performance.now();
    const duration = 180;

    const startPos1 = gem1.mesh ? gem1.mesh.position.clone() : target1;
    const startPos2 = gem2.mesh ? gem2.mesh.position.clone() : target2;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / duration;
      const t = Math.min(1.0, elapsed);
      const ease = 1 - Math.pow(1 - t, 2);

      if (gem1.mesh) {
        gem1.mesh.position.lerpVectors(startPos1, target2, ease);
        gem1.mesh.position.z = 0.25 + Math.sin(t * Math.PI) * 0.35;
      }
      if (gem2.mesh) {
        gem2.mesh.position.lerpVectors(startPos2, target1, ease);
      }

      if (t < 1.0) {
        requestAnimationFrame(tick);
      } else {
        if (gem1.mesh) gem1.mesh.position.set(target2.x, target2.y, 0.25);
        if (gem2.mesh) gem2.mesh.position.set(target1.x, target1.y, 0.25);
        onComplete();
      }
    };
    requestAnimationFrame(tick);
  }

  private findMatches(): { gems: GemData[]; createdSpecial?: { col: number; row: number; type: SpecialType; color: number } }[] {
    const rows = this.currentLevel.rows;
    const cols = this.currentLevel.cols;
    const matchedSets: { gems: GemData[]; createdSpecial?: { col: number; row: number; type: SpecialType; color: number } }[] = [];

    // Horizontal runs
    for (let r = 0; r < rows; r++) {
      let runStart = 0;
      for (let c = 1; c <= cols; c++) {
        const prev = this.grid[r][c - 1];
        const curr = c < cols ? this.grid[r][c] : null;

        if (curr && prev && curr.color === prev.color && curr.color >= 0) {
        } else {
          const runLength = c - runStart;
          if (runLength >= 3) {
            const runGems: GemData[] = [];
            for (let i = runStart; i < c; i++) {
              if (this.grid[r][i]) runGems.push(this.grid[r][i]!);
            }

            let special: SpecialType = 'none';
            if (runLength === 4) special = 'rocket_h';
            else if (runLength >= 5) special = 'rainbow';

            matchedSets.push({
              gems: runGems,
              createdSpecial: special !== 'none' ? { col: runStart + 1, row: r, type: special, color: runGems[0].color } : undefined,
            });
          }
          runStart = c;
        }
      }
    }

    // Vertical runs
    for (let c = 0; c < cols; c++) {
      let runStart = 0;
      for (let r = 1; r <= rows; r++) {
        const prev = this.grid[r - 1][c];
        const curr = r < rows ? this.grid[r][c] : null;

        if (curr && prev && curr.color === prev.color && curr.color >= 0) {
        } else {
          const runLength = r - runStart;
          if (runLength >= 3) {
            const runGems: GemData[] = [];
            for (let i = runStart; i < r; i++) {
              if (this.grid[i][c]) runGems.push(this.grid[i][c]!);
            }

            let special: SpecialType = 'none';
            if (runLength === 4) special = 'rocket_v';
            else if (runLength >= 5) special = 'rainbow';

            matchedSets.push({
              gems: runGems,
              createdSpecial: special !== 'none' ? { col: c, row: runStart + 1, type: special, color: runGems[0].color } : undefined,
            });
          }
          runStart = r;
        }
      }
    }

    return matchedSets;
  }

  private processMatches(
    matchedSets: { gems: GemData[]; createdSpecial?: { col: number; row: number; type: SpecialType; color: number } }[]
  ): void {
    const allGemsToClear = new Set<GemData>();
    const specialsToCreate: { col: number; row: number; type: SpecialType; color: number }[] = [];

    matchedSets.forEach((set) => {
      set.gems.forEach((g) => allGemsToClear.add(g));
      if (set.createdSpecial) {
        specialsToCreate.push(set.createdSpecial);
      }
    });

    allGemsToClear.forEach((gem) => {
      if (gem.special === 'rocket_h') {
        this.collectRowGems(gem.row, allGemsToClear);
        this.audio.playRocket();
      } else if (gem.special === 'rocket_v') {
        this.collectColGems(gem.col, allGemsToClear);
        this.audio.playRocket();
      } else if (gem.special === 'bomb') {
        this.collectBombRadius(gem.col, gem.row, allGemsToClear);
        this.audio.playBomb();
      }
    });

    allGemsToClear.forEach((gem) => {
      this.damageObstaclesAround(gem.col, gem.row);
      this.clearJellyAt(gem.col, gem.row);

      this.currentLevel.objectives.forEach((obj, idx) => {
        if (obj.type === 'collect' && obj.gemColor === gem.color) {
          this.objectivesStatus[idx] = (this.objectivesStatus[idx] || 0) + 1;
        }
      });
    });

    const count = allGemsToClear.size;
    const earned = count * 60 * this.comboCount;
    this.score += earned;
    this.audio.playMatch(this.comboCount);

    if (count > 0) {
      const firstGem = Array.from(allGemsToClear)[0];
      const pos = this.gridToWorld(firstGem.col, firstGem.row);
      const text = this.comboCount > 1 ? `+${earned} (x${this.comboCount})` : `+${earned}`;
      this.addFloatingText(text, pos.x, pos.y, '#facc15');
    }

    if (this.settings.particles) {
      allGemsToClear.forEach((gem) => {
        if (gem.mesh) {
          this.spawnGemExplosion(gem.mesh.position, gem.color);
        }
      });
    }

    allGemsToClear.forEach((gem) => {
      if (gem.mesh) {
        this.gemsGroup.remove(gem.mesh);
      }
      this.grid[gem.row][gem.col] = null;
    });

    specialsToCreate.forEach((spec) => {
      const newGem: GemData = {
        id: this.nextGemId++,
        col: spec.col,
        row: spec.row,
        color: spec.color,
        special: spec.type,
      };
      const mesh = this.createGemMesh(spec.color, spec.type);
      const pos = this.gridToWorld(spec.col, spec.row);
      mesh.position.set(pos.x, pos.y, 0.25);
      this.gemsGroup.add(mesh);
      newGem.mesh = mesh;
      this.grid[spec.row][spec.col] = newGem;
    });

    setTimeout(() => {
      this.cascadeGems(() => {
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
          this.comboCount++;
          this.processMatches(newMatches);
        } else {
          this.isAnimating = false;
          this.checkGameCompletion();

          if (!this.hasAvailableMoves()) {
            this.shuffleBoard();
          }
        }
      });
    }, 140);
  }

  private collectRowGems(row: number, set: Set<GemData>): void {
    for (let c = 0; c < this.currentLevel.cols; c++) {
      const g = this.grid[row][c];
      if (g) set.add(g);
    }
  }

  private collectColGems(col: number, set: Set<GemData>): void {
    for (let r = 0; r < this.currentLevel.rows; r++) {
      const g = this.grid[r][col];
      if (g) set.add(g);
    }
  }

  private collectBombRadius(col: number, row: number, set: Set<GemData>): void {
    for (let r = Math.max(0, row - 1); r <= Math.min(this.currentLevel.rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.currentLevel.cols - 1, col + 1); c++) {
        const g = this.grid[r][c];
        if (g) set.add(g);
      }
    }
  }

  private executeRainbowColorClear(rainbowGem: GemData, targetColor: number): void {
    this.audio.playRainbow();
    const toClear = new Set<GemData>();
    toClear.add(rainbowGem);

    for (let r = 0; r < this.currentLevel.rows; r++) {
      for (let c = 0; c < this.currentLevel.cols; c++) {
        const g = this.grid[r][c];
        if (g && (g.color === targetColor || targetColor === -1)) {
          toClear.add(g);
        }
      }
    }

    this.comboCount = 2;
    this.processMatches([{ gems: Array.from(toClear) }]);
  }

  private damageObstaclesAround(col: number, row: number): void {
    const coords = [
      [col, row],
      [col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]
    ];

    coords.forEach(([c, r]) => {
      if (r >= 0 && r < this.currentLevel.rows && c >= 0 && c < this.currentLevel.cols) {
        const tile = this.tiles[r][c];

        if (tile.hasIce) {
          tile.iceHealth--;
          if (tile.iceHealth <= 0) {
            tile.hasIce = false;
            if (tile.iceMesh) {
              this.boardGroup.remove(tile.iceMesh);
            }
            this.audio.playIceBreak();
            this.currentLevel.objectives.forEach((obj, idx) => {
              if (obj.type === 'ice') {
                this.objectivesStatus[idx] = (this.objectivesStatus[idx] || 0) + 1;
              }
            });
          }
        }

        if (tile.hasCrate) {
          tile.crateHealth--;
          if (tile.crateHealth <= 0) {
            tile.hasCrate = false;
            if (tile.crateMesh) {
              this.boardGroup.remove(tile.crateMesh);
            }
            this.audio.playBomb();
            this.currentLevel.objectives.forEach((obj, idx) => {
              if (obj.type === 'crates') {
                this.objectivesStatus[idx] = (this.objectivesStatus[idx] || 0) + 1;
              }
            });
          }
        }
      }
    });
  }

  private clearJellyAt(col: number, row: number): void {
    const tile = this.tiles[row][col];
    if (tile.hasJelly) {
      tile.hasJelly = false;
      if (tile.jellyMesh) {
        this.boardGroup.remove(tile.jellyMesh);
      }
      this.currentLevel.objectives.forEach((obj, idx) => {
        if (obj.type === 'jelly') {
          this.objectivesStatus[idx] = (this.objectivesStatus[idx] || 0) + 1;
        }
      });
    }
  }

  private cascadeGems(onComplete: () => void): void {
    const rows = this.currentLevel.rows;
    const cols = this.currentLevel.cols;
    const numColors = this.currentLevel.colors;

    for (let c = 0; c < cols; c++) {
      let emptyRow = -1;
      for (let r = rows - 1; r >= 0; r--) {
        if (this.tiles[r][c].isHole || this.tiles[r][c].hasCrate) {
          emptyRow = -1;
          continue;
        }

        if (this.grid[r][c] === null) {
          if (emptyRow === -1) emptyRow = r;
        } else if (emptyRow !== -1) {
          const gem = this.grid[r][c]!;
          this.grid[emptyRow][c] = gem;
          this.grid[r][c] = null;
          gem.row = emptyRow;
          emptyRow--;
        }
      }

      for (let r = 0; r < rows; r++) {
        if (this.tiles[r][c].isHole || this.tiles[r][c].hasCrate) continue;
        if (this.grid[r][c] === null) {
          const color = Math.floor(Math.random() * numColors);
          const newGem: GemData = {
            id: this.nextGemId++,
            col: c,
            row: r,
            color,
            special: 'none',
          };
          const mesh = this.createGemMesh(color, 'none');
          const spawnPos = this.gridToWorld(c, -1);
          mesh.position.set(spawnPos.x, spawnPos.y + 0.6 * (r + 1), 0.25);
          this.gemsGroup.add(mesh);
          newGem.mesh = mesh;
          this.grid[r][c] = newGem;
        }
      }
    }

    const startTime = performance.now();
    const duration = 240;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / duration;
      const t = Math.min(1.0, elapsed);
      const ease = 1 - Math.pow(1 - t, 3);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gem = this.grid[r][c];
          if (gem && gem.mesh) {
            const target = this.gridToWorld(c, r);
            gem.mesh.position.x = target.x;
            gem.mesh.position.y = THREE.MathUtils.lerp(gem.mesh.position.y, target.y, ease);
          }
        }
      }

      if (t < 1.0) {
        requestAnimationFrame(tick);
      } else {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const gem = this.grid[r][c];
            if (gem && gem.mesh) {
              const target = this.gridToWorld(c, r);
              gem.mesh.position.set(target.x, target.y, 0.25);
            }
          }
        }
        onComplete();
      }
    };
    requestAnimationFrame(tick);
  }

  // =========================================================================
  // WIN / LOSE & LIMITED LIVES HANDLING
  // =========================================================================
  private checkGameCompletion(): void {
    let allMet = true;

    this.currentLevel.objectives.forEach((obj, idx) => {
      const currentVal =
        obj.type === 'score'
          ? this.score
          : this.objectivesStatus[idx] || 0;

      if (currentVal < obj.target) {
        allMet = false;
      }
    });

    if (allMet) {
      // LEVEL COMPLETED!
      this.isAnimating = true;
      this.audio.playWin();

      let stars = 1;
      if (this.score >= this.currentLevel.starThresholds[2]) stars = 3;
      else if (this.score >= this.currentLevel.starThresholds[1]) stars = 2;

      // Earn reward coins (+50 for 1 star, +80 for 2, +120 for 3)
      const earnedCoins = stars === 3 ? 120 : (stars === 2 ? 80 : 50);
      this.coins += earnedCoins;

      const lvlNum = this.currentLevel.level;
      const prevStars = this.playerProgress[lvlNum]?.stars || 0;
      const prevHigh = this.playerProgress[lvlNum]?.highScore || 0;

      this.playerProgress[lvlNum] = {
        unlocked: true,
        completed: true,
        stars: Math.max(prevStars, stars),
        highScore: Math.max(prevHigh, this.score),
      };

      if (lvlNum < 100) {
        if (!this.playerProgress[lvlNum + 1]) {
          this.playerProgress[lvlNum + 1] = {
            unlocked: true,
            completed: false,
            stars: 0,
            highScore: 0,
          };
        } else {
          this.playerProgress[lvlNum + 1].unlocked = true;
        }
      }

      this.saveProgress();
      this.showWinModal = true;
      this.cdr.detectChanges();
    } else if (this.movesLeft <= 0) {
      // OUT OF MOVES -> DEDUCT 1 LIFE!
      this.deductLife();
      this.audio.playLose();
      this.showLoseModal = true;
      this.cdr.detectChanges();
    }
  }

  nextLevel(): void {
    if (this.lives <= 0) {
      this.showWinModal = false;
      this.showOutOfLivesModal = true;
      return;
    }
    if (this.currentLevelIndex < 99) {
      this.startLevel(this.currentLevelIndex + 1);
    }
  }

  restartLevel(): void {
    if (this.lives <= 0) {
      this.showLoseModal = false;
      this.showOutOfLivesModal = true;
      return;
    }
    this.startLevel(this.currentLevelIndex);
  }

  quitToHome(): void {
    this.showPauseModal = false;
    this.showLoseModal = false;
    this.showWinModal = false;
    this.setScreen('home');
  }

  quitToMap(): void {
    this.showPauseModal = false;
    this.showLoseModal = false;
    this.showWinModal = false;
    this.setScreen('map');
  }

  // =========================================================================
  // BOOSTERS
  // =========================================================================
  toggleBooster(type: 'hammer' | 'rowZap' | 'rainbowBomb'): void {
    if (this.activeBooster === type) {
      this.activeBooster = null;
    } else {
      this.activeBooster = type;
    }
  }

  private applyBoosterToTile(tile: BoardTile): void {
    if (!this.activeBooster) return;

    if (this.activeBooster === 'hammer' && this.hammerCount > 0) {
      this.hammerCount--;
      this.activeBooster = null;
      this.saveProgress();
      this.damageObstaclesAround(tile.col, tile.row);
      const gem = this.grid[tile.row][tile.col];
      if (gem) {
        this.processMatches([{ gems: [gem] }]);
      }
    } else if (this.activeBooster === 'rowZap' && this.rowZapCount > 0) {
      this.rowZapCount--;
      this.activeBooster = null;
      this.saveProgress();
      const toClear = new Set<GemData>();
      this.collectRowGems(tile.row, toClear);
      this.audio.playRocket();
      this.processMatches([{ gems: Array.from(toClear) }]);
    } else if (this.activeBooster === 'rainbowBomb' && this.rainbowBombCount > 0) {
      this.rainbowBombCount--;
      this.activeBooster = null;
      this.saveProgress();
      const gem = this.grid[tile.row][tile.col];
      if (gem && gem.mesh) {
        this.gemsGroup.remove(gem.mesh);
        gem.special = 'rainbow';
        gem.mesh = this.createGemMesh(0, 'rainbow');
        const pos = this.gridToWorld(gem.col, gem.row);
        gem.mesh.position.set(pos.x, pos.y, 0.25);
        this.gemsGroup.add(gem.mesh);
        this.audio.playRainbow();
      }
    }
  }

  shuffleBoard(): void {
    this.shuffleAlert = true;
    this.audio.playSwap();

    const allColors: { color: number; special: SpecialType }[] = [];
    for (let r = 0; r < this.currentLevel.rows; r++) {
      for (let c = 0; c < this.currentLevel.cols; c++) {
        const gem = this.grid[r][c];
        if (gem) {
          allColors.push({ color: gem.color, special: gem.special });
        }
      }
    }

    for (let i = allColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.currentLevel.rows; r++) {
      for (let c = 0; c < this.currentLevel.cols; c++) {
        const gem = this.grid[r][c];
        if (gem && gem.mesh) {
          const item = allColors[idx++];
          gem.color = item.color;
          gem.special = item.special;

          this.gemsGroup.remove(gem.mesh);
          gem.mesh = this.createGemMesh(gem.color, gem.special);
          const pos = this.gridToWorld(c, r);
          gem.mesh.position.set(pos.x, pos.y, 0.25);
          this.gemsGroup.add(gem.mesh);
        }
      }
    }

    setTimeout(() => {
      this.shuffleAlert = false;
      this.cdr.detectChanges();
    }, 1200);
  }

  private hasAvailableMoves(): boolean {
    const rows = this.currentLevel.rows;
    const cols = this.currentLevel.cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const g1 = this.grid[r][c];
        if (!g1) continue;

        if (c + 1 < cols && this.grid[r][c + 1]) {
          const g2 = this.grid[r][c + 1]!;
          this.grid[r][c] = g2;
          this.grid[r][c + 1] = g1;
          const match = this.findMatches().length > 0;
          this.grid[r][c] = g1;
          this.grid[r][c + 1] = g2;
          if (match) return true;
        }

        if (r + 1 < rows && this.grid[r + 1][c]) {
          const g2 = this.grid[r + 1][c]!;
          this.grid[r][c] = g2;
          this.grid[r + 1][c] = g1;
          const match = this.findMatches().length > 0;
          this.grid[r][c] = g1;
          this.grid[r + 1][c] = g2;
          if (match) return true;
        }
      }
    }

    return false;
  }

  // =========================================================================
  // PARTICLES & FX
  // =========================================================================
  private spawnGemExplosion(pos: THREE.Vector3, color: number): void {
    const pal = this.gemPalette[color % this.gemPalette.length];
    const pCount = 18;

    for (let i = 0; i < pCount; i++) {
      const pGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const pMat = new THREE.MeshBasicMaterial({ color: pal.hex });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      this.fxGroup.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;

      this.particles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 2.0,
        life: 0,
        maxLife: 35 + Math.random() * 20,
      });
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string): void {
    const id = this.floatingTextIdSeq++;
    this.floatingTexts.push({ id, text, x, y, color, opacity: 1 });
  }

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.currentScreen !== 'game') return;

    const time = performance.now() * 0.0015;
    for (let r = 0; r < this.currentLevel.rows; r++) {
      for (let c = 0; c < this.currentLevel.cols; c++) {
        const gem = this.grid[r][c];
        if (gem && gem.mesh) {
          gem.mesh.rotation.z = Math.sin(time + c * 0.5 + r * 0.3) * 0.08;
          gem.mesh.rotation.y = Math.cos(time + c * 0.4) * 0.08;
        }
      }
    }

    if (this.selectorMesh && this.selectorMesh.visible) {
      this.selectorMesh.rotation.z += 0.02;
      const scale = 1.0 + Math.sin(time * 6) * 0.06;
      this.selectorMesh.scale.set(scale, scale, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.mesh.position.x += p.vx * 0.016;
      p.mesh.position.y += p.vy * 0.016;
      p.mesh.position.z += p.vz * 0.016;
      p.vy -= 4.2 * 0.016;
      p.mesh.scale.multiplyScalar(0.96);

      if (p.life >= p.maxLife) {
        this.fxGroup.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += 0.015;
      ft.opacity -= 0.018;
      if (ft.opacity <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  // UI Helpers
  getObjectiveProgress(idx: number): number {
    return this.objectivesStatus[idx] || 0;
  }

  getStarWidth(): number {
    const maxThreshold = this.currentLevel.starThresholds[2];
    return Math.min(100, (this.score / maxThreshold) * 100);
  }

  getLevelPageLevels(): LevelConfig[] {
    const start = this.levelSelectPage * 25;
    return this.levels.slice(start, start + 25);
  }
}
