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
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ENV1_ALL_ASSETS, Env1AssetItem } from './env1-assets.data';

export type ViewMode = 'game' | 'exhibition' | 'freecam';
export type TimeOfDay = 'noon' | 'sunset' | 'night' | 'dawn';
export type ExhibitionRow =
  | 'all'
  | 'tiles'
  | 'rivers'
  | 'hex'
  | 'trees'
  | 'cacti'
  | 'rocks'
  | 'bones'
  | 'foliage'
  | 'minerals';

@Component({
  selector: 'app-environment1',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './environment1.html',
  styleUrl: './environment1.scss',
  host: {
    ngSkipHydration: 'true',
  },
})
export class Environment1 implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportContainer') containerRef!: ElementRef<HTMLDivElement>;

  // Complete Catalog of all 732 assets
  readonly allAssets: Env1AssetItem[] = ENV1_ALL_ASSETS;

  // UI State
  viewMode: ViewMode = 'exhibition';
  timeOfDay: TimeOfDay = 'noon';
  isAudioEnabled = false;
  isCatalogOpen = false;
  selectedCategory = 'all';
  searchQuery = '';
  selectedAsset: Env1AssetItem | null = null;
  selectedExhibitionAsset: Env1AssetItem | null = null;
  exhibitionRowFocus: ExhibitionRow = 'all';
  loadingStatus = 'Streaming 700+ Low-Poly Assets...';
  loadingProgress = 0;
  isLoading = true;

  // Catalog Pagination for High Performance
  catalogDisplayLimit = 60;

  // Game Stats
  gemsCollected = 0;
  totalGems = 8;
  fps = 60;
  playerPos = { x: 0, y: 0, z: 0 };
  activeBiome = 'Lush Meadow';

  // Category counts
  readonly categoryCounts = {
    all: ENV1_ALL_ASSETS.length,
    tiles: ENV1_ALL_ASSETS.filter((a) => a.category === 'tiles').length,
    trees: ENV1_ALL_ASSETS.filter((a) => a.category === 'trees').length,
    cacti: ENV1_ALL_ASSETS.filter((a) => a.category === 'cacti').length,
    rocks: ENV1_ALL_ASSETS.filter((a) => a.category === 'rocks').length,
    bones: ENV1_ALL_ASSETS.filter((a) => a.category === 'bones').length,
    foliage: ENV1_ALL_ASSETS.filter((a) => a.category === 'foliage').length,
    minerals: ENV1_ALL_ASSETS.filter((a) => a.category === 'minerals').length,
  };

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private isBrowser = false;

  // Lighting & Environment
  private dirLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private animatedCrystals: THREE.Mesh[] = [];
  private collectibleGems: { mesh: THREE.Group; collected: boolean; baseY: number }[] = [];
  private fireflyParticles: THREE.Points | null = null;

  // Player & Gameplay
  private playerGroup: THREE.Group | null = null;
  private playerParts: {
    body?: THREE.Mesh;
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
  } = {};
  private moveInput = { forward: 0, right: 0, sprint: false };
  private walkTime = 0;

  // Touch Virtual Joystick
  touchStartPos: { x: number; y: number } | null = null;
  joystickVector = { x: 0, y: 0 };

  // Asset Management
  private fbxLoader = new FBXLoader();
  private paletteTexture: THREE.Texture | null = null;
  private assetCache = new Map<string, THREE.Group>();
  private worldRoot = new THREE.Group();
  private exhibitionRoot = new THREE.Group();
  private exhibitionInteractiveObjects: THREE.Object3D[] = [];

  // Raycaster for clicking items in Exhibition
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Audio Synth
  private audioCtx: AudioContext | null = null;

  get filteredCatalog(): Env1AssetItem[] {
    const list = this.allAssets.filter((item) => {
      const matchesCat = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesQuery =
        !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.file.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
    return list.slice(0, this.catalogDisplayLimit);
  }

  get totalFilteredCount(): number {
    return this.allAssets.filter((item) => {
      const matchesCat = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesQuery =
        !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.file.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    }).length;
  }

  loadMoreCatalog() {
    this.catalogDisplayLimit += 60;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initThree();
    }
  }

  private async initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x32363c); // Neutral studio dark charcoal background matching reference
    this.scene.fog = new THREE.FogExp2(0x32363c, 0.006);

    // Camera initial framing for exhibition showcase
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 400);
    this.camera.position.set(0, 32, 45);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 120;
    this.controls.minDistance = 3;
    this.controls.target.set(0, 0, -2);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;

    // Scene Roots
    this.scene.add(this.worldRoot);
    this.scene.add(this.exhibitionRoot);
    this.worldRoot.visible = false;
    this.exhibitionRoot.visible = true;

    // Lighting
    this.setupLighting();

    // Texture & Scene Generation
    await this.loadPaletteTexture();
    await this.buildExhibitionHall();
    await this.buildHandcraftedWorld();
    this.createPlayerCharacter();
    this.setupFireflies();

    this.isLoading = false;
    this.cdr.detectChanges();

    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Three-point studio lighting setup calibrated directly from the reference renders:
   * 1. Key Light (Top-Right / Back-Right Sunlight casting soft diagonal shadows to front-left)
   * 2. Fill Light (Soft cool sky fill from front-left counterbalancing harsh shadows)
   * 3. Rim / Accent Light (Top-Back rim defining low-poly silhouettes and facets)
   * 4. Hemisphere & Ambient Light (Natural gradient fill preventing pitch-black shadows)
   */
  private setupLighting() {
    // 1. Hemisphere Light (Sky White / Slate Ground ambient gradient)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x384152, 0.7);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light (Soft base fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);

    // 3. Primary Key Light (Upper/Back-Right, casting shadows to front-left)
    this.dirLight = new THREE.DirectionalLight(0xfff8ee, 1.85);
    this.dirLight.position.set(50, 75, -20);
    this.dirLight.castShadow = true;
    this.dirLight.target.position.set(10, 0, -12);
    this.scene.add(this.dirLight.target);

    // High quality soft shadow configuration covering the entire exhibition
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 260;
    const dX = 80;
    const dZ = 70;
    this.dirLight.shadow.camera.left = -dX;
    this.dirLight.shadow.camera.right = dX;
    this.dirLight.shadow.camera.top = dZ;
    this.dirLight.shadow.camera.bottom = -dZ;
    this.dirLight.shadow.bias = -0.0002;
    this.dirLight.shadow.normalBias = 0.025;
    this.dirLight.shadow.radius = 2.0;
    this.scene.add(this.dirLight);

    // 4. Studio Fill Light (Cool sky fill from front-left counterbalancing harsh shadows)
    this.fillLight = new THREE.DirectionalLight(0xdbeafe, 0.75);
    this.fillLight.position.set(-45, 40, 35);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);

    // 5. Studio Rim / Accent Light (Highlights top facets and low-poly silhouette edges)
    this.rimLight = new THREE.DirectionalLight(0xfef3c7, 0.45);
    this.rimLight.position.set(0, 50, -60);
    this.rimLight.castShadow = false;
    this.scene.add(this.rimLight);
  }

  private async loadPaletteTexture(): Promise<void> {
    const texLoader = new THREE.TextureLoader();
    try {
      this.paletteTexture = await texLoader.loadAsync('/Enviornment/Env1/PandaMat.png');
      this.paletteTexture.magFilter = THREE.NearestFilter;
      this.paletteTexture.minFilter = THREE.NearestFilter;
      this.paletteTexture.colorSpace = THREE.SRGBColorSpace;
    } catch (e) {
      console.warn('Could not load PandaMat.png palette texture', e);
    }
  }

  private async loadFbx(file: string): Promise<THREE.Group> {
    if (this.assetCache.has(file)) {
      return this.assetCache.get(file)!.clone(true);
    }

    try {
      const fbx = await this.fbxLoader.loadAsync(`/Enviornment/Env1/${file}`);
      fbx.scale.setScalar(0.01);

      fbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const isWater = file.toLowerCase().includes('water');
          const isCrystal = file.toLowerCase().includes('mineral') || file.toLowerCase().includes('jem');

          const newMat = new THREE.MeshStandardMaterial({
            map: this.paletteTexture,
            flatShading: true,
            roughness: isWater ? 0.15 : isCrystal ? 0.2 : 0.82,
            metalness: isWater ? 0.2 : isCrystal ? 0.7 : 0.05,
            transparent: isWater,
            opacity: isWater ? 0.85 : 1.0,
          });

          if (isCrystal) {
            newMat.emissive = new THREE.Color(0x9d4edd);
            newMat.emissiveIntensity = 0.45;
            this.animatedCrystals.push(mesh);
          }

          mesh.material = newMat;
        }
      });

      this.assetCache.set(file, fbx);
      return fbx.clone(true);
    } catch (err) {
      console.warn(`Failed loading FBX ${file}`, err);
      return new THREE.Group();
    }
  }

  /**
   * Builds the comprehensive Asset Exhibition Hall displaying models in categorized rows,
   * with the Modular Terrain and River Canal System assembled into an authentic, multi-tiered
   * landscape diorama directly matching the user's uploaded reference picture!
   */
  private async buildExhibitionHall() {
    this.loadingStatus = 'Setting up Exhibition Studio & Modular Landscape...';
    this.loadingProgress = 15;
    this.cdr.detectChanges();

    // Large studio floor plane seamlessly blending with background
    const floorGeom = new THREE.PlaneGeometry(220, 150);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x32363c,
      roughness: 0.94,
      metalness: 0.04,
      flatShading: true,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(10, -0.05, -10);
    floor.receiveShadow = true;
    this.exhibitionRoot.add(floor);

    // Subtle reference studio floor grid
    const gridHelper = new THREE.GridHelper(220, 44, 0x475569, 0x262a30);
    gridHelper.position.set(10, 0.01, -10);
    this.exhibitionRoot.add(gridHelper);

    // =========================================================================
    // 1. ASSEMBLE MODULAR TERRAIN & RIVER CANAL SYSTEM (Matches Reference Image)
    // =========================================================================
    // Grid: 14 Columns x 5 Rows (70 tiles) from X = -32.5 to +32.5, Z = -24 to -44
    // Snaps edge-to-edge at 5.0m intervals with waterfalls, ramps, cliffs, and continuous canals.
    interface TerrainTileSpec {
      file: string;
      col: number; // 0 to 13 -> posX = (col - 6.5) * 5.0
      row: number; // 0 to 4  -> posZ = -24 - row * 5.0
      rotY?: number;
      elevY?: number;
    }

    const terrainGridSpecs: TerrainTileSpec[] = [
      // ROW 0 (Z = -24): Lower Green & Earth Ground Terrace (14 tiles edge-to-edge)
      { file: 'TileGround_01.fbx', col: 0, row: 0 },
      { file: 'TileGround_02.fbx', col: 1, row: 0 },
      { file: 'TileGround_03.fbx', col: 2, row: 0 },
      { file: 'TileGround_04.fbx', col: 3, row: 0 },
      { file: 'TileGround_05.fbx', col: 4, row: 0 },
      { file: 'TileGround_06.fbx', col: 5, row: 0 },
      { file: 'TileGround_07.fbx', col: 6, row: 0 },
      { file: 'TileGround_08.fbx', col: 7, row: 0 },
      { file: 'TileGround_09.fbx', col: 8, row: 0 },
      { file: 'TileGround_10.fbx', col: 9, row: 0 },
      { file: 'TileGround_11.fbx', col: 10, row: 0 },
      { file: 'TileGround_12.fbx', col: 11, row: 0 },
      { file: 'TileGround_13.fbx', col: 12, row: 0 },
      { file: 'TileGround_14.fbx', col: 13, row: 0 },

      // ROW 1 (Z = -29): CONTINUOUS RIVER CANAL SYSTEM (Flowing West to East with Waterfalls & Banks)
      { file: 'TileWater_01.fbx', col: 0, row: 1 }, // Western Lake Basin
      { file: 'TileWater_02.fbx', col: 1, row: 1 }, // Lake Water Pool
      { file: 'TileWater_17.fbx', col: 2, row: 1, rotY: Math.PI * 0.5 }, // Western Canal Bank
      { file: 'TileWater_19.fbx', col: 3, row: 1, rotY: Math.PI * 0.5 }, // Straight River Canal (runs E-W)
      { file: 'TileWater_22.fbx', col: 4, row: 1, rotY: Math.PI * 0.5 }, // Embankment River Canal
      { file: 'TileWater_23.fbx', col: 5, row: 1, rotY: Math.PI * 0.5 }, // Stepped River Canal
      { file: 'TileWater_20.fbx', col: 6, row: 1, rotY: Math.PI },        // Canal Corner Bend from Upper Tier
      { file: 'TileWater_08.fbx', col: 7, row: 1, rotY: 0 },              // Stepped Waterfall Cascade
      { file: 'TileWater_19.fbx', col: 8, row: 1, rotY: Math.PI * 0.5 }, // Continuing East River Canal
      { file: 'TileWater_22.fbx', col: 9, row: 1, rotY: Math.PI * 0.5 }, // Continuing East River Canal
      { file: 'TileWater_14.fbx', col: 10, row: 1, rotY: Math.PI * 0.5 },// River Canal Mouth
      { file: 'TileWater_10.fbx', col: 11, row: 1, rotY: Math.PI * 0.5 },// Delta Shoreline
      { file: 'TileWater_18.fbx', col: 12, row: 1 },                     // Estuary Water Tile
      { file: 'TileWater_03.fbx', col: 13, row: 1 },                     // Eastern Lake Basin

      // ROW 2 (Z = -34): Middle Terrace, River Crossing & Canal Banks
      { file: 'TileGround_15.fbx', col: 0, row: 2 },
      { file: 'TileGround_16.fbx', col: 1, row: 2 },
      { file: 'TileGround_17.fbx', col: 2, row: 2 },
      { file: 'TileGround_18.fbx', col: 3, row: 2 },
      { file: 'TileGround_41.fbx', col: 4, row: 2, elevY: 0.2 },         // Stone Crossing Ramp / Bridge
      { file: 'TileWater_19.fbx', col: 5, row: 2, rotY: 0 },             // North-South Feeding River Canal
      { file: 'TileWater_08.fbx', col: 6, row: 2, rotY: 0 },             // Upper Waterfall Drop
      { file: 'TileGround_30.fbx', col: 7, row: 2 },                     // Stepped Base Block
      { file: 'TileGround_19.fbx', col: 8, row: 2 },
      { file: 'TileGround_20.fbx', col: 9, row: 2 },
      { file: 'TileGround_21.fbx', col: 10, row: 2 },
      { file: 'TileGround_22.fbx', col: 11, row: 2 },
      { file: 'TileGround_23.fbx', col: 12, row: 2 },
      { file: 'TileGround_24.fbx', col: 13, row: 2 },

      // ROW 3 (Z = -39): Elevated High Plateau Tier 1 (Elevation Y = 1.0 to 1.5)
      { file: 'TileGround_31.fbx', col: 0, row: 3, elevY: 1.0 }, // Medium Cliff Wall Block
      { file: 'TileGround_32.fbx', col: 1, row: 3, elevY: 1.0 }, // Medium Cliff Wall Block
      { file: 'TileGround_33.fbx', col: 2, row: 3, elevY: 1.0 }, // Medium Cliff Wall Block
      { file: 'TileGround_34.fbx', col: 3, row: 3, elevY: 1.0 }, // Medium Cliff Wall Block
      { file: 'TileGround_35.fbx', col: 4, row: 3, elevY: 1.0 }, // Medium Cliff Wall Block
      { file: 'TileWater_06.fbx', col: 5, row: 3, elevY: 1.0 },  // Mountain Spring Pool
      { file: 'TileWater_07.fbx', col: 6, row: 3, elevY: 1.0 },  // Mountain Spring Basin
      { file: 'TileGround_42.fbx', col: 7, row: 3, elevY: 0.8 }, // Stepped Terrace Stairs
      { file: 'TileGround_43.fbx', col: 8, row: 3, elevY: 0.6 }, // Stepped Terrace Ramp
      { file: 'TileGround_44.fbx', col: 9, row: 3, elevY: 0.5 },
      { file: 'TileGround_45.fbx', col: 10, row: 3, elevY: 1.0 },
      { file: 'TileGround_46.fbx', col: 11, row: 3, elevY: 1.0 },
      { file: 'TileGround_47.fbx', col: 12, row: 3, elevY: 1.0 },
      { file: 'TileGround_48.fbx', col: 13, row: 3, elevY: 1.0 },

      // ROW 4 (Z = -44): High Mountain Ridge & Peaks (Elevation Y = 2.0)
      { file: 'TileGround_36.fbx', col: 0, row: 4, elevY: 2.0 }, // Highest Cliff Tower Block
      { file: 'TileGround_37.fbx', col: 1, row: 4, elevY: 2.0 }, // Highest Cliff Tower Block
      { file: 'TileGround_38.fbx', col: 2, row: 4, elevY: 2.0 },
      { file: 'TileGround_39.fbx', col: 3, row: 4, elevY: 2.0 },
      { file: 'TileGround_40.fbx', col: 4, row: 4, elevY: 2.0 },
      { file: 'TileWater_11.fbx', col: 5, row: 4, elevY: 2.0 },  // Glacier Headwaters
      { file: 'TileWater_12.fbx', col: 6, row: 4, elevY: 2.0 },  // Glacier Headwaters
      { file: 'TileGround_25.fbx', col: 7, row: 4, elevY: 1.5 },
      { file: 'TileGround_26.fbx', col: 8, row: 4, elevY: 1.5 },
      { file: 'TileGround_27.fbx', col: 9, row: 4, elevY: 1.5 },
      { file: 'TileGround_28.fbx', col: 10, row: 4, elevY: 1.5 },
      { file: 'TileGround_29.fbx', col: 11, row: 4, elevY: 1.5 },
      { file: 'TileWater_13.fbx', col: 12, row: 4, elevY: 1.5 },
      { file: 'TileWater_15.fbx', col: 13, row: 4, elevY: 1.5 },
    ];

    let tilesLoaded = 0;
    for (const spec of terrainGridSpecs) {
      const posX = (spec.col - 6.5) * 5.0;
      const posZ = -24.0 - spec.row * 5.0;
      const posY = spec.elevY || 0;

      const obj = await this.loadFbx(spec.file);
      obj.position.set(posX, posY, posZ);
      if (spec.rotY) obj.rotation.y = spec.rotY;

      const assetItem = this.allAssets.find((a) => a.file === spec.file);
      if (assetItem) {
        obj.userData['assetItem'] = assetItem;
      }

      this.exhibitionRoot.add(obj);
      this.exhibitionInteractiveObjects.push(obj);

      tilesLoaded++;
      if (tilesLoaded % 14 === 0) {
        this.loadingProgress = Math.round(15 + (tilesLoaded / terrainGridSpecs.length) * 20);
        this.loadingStatus = `Constructing Modular Terrain & River (${tilesLoaded}/${terrainGridSpecs.length})...`;
        this.cdr.detectChanges();
      }
    }

    // =========================================================================
    // 2. MODULAR HEXAGONAL GARDEN (Interlocking Honeycomb Showcase at X = 44..62)
    // =========================================================================
    const hexFiles = this.allAssets
      .filter((a) => a.file.startsWith('TileHex_'))
      .slice(0, 31);

    const hexCols = 5;
    for (let i = 0; i < hexFiles.length; i++) {
      const hCol = i % hexCols;
      const hRow = Math.floor(i / hexCols);
      const hX = 42.0 + hCol * 3.8;
      const hZ = -24.0 - hRow * 4.4 - (hCol % 2) * 2.2;

      const hObj = await this.loadFbx(hexFiles[i].file);
      hObj.position.set(hX, 0, hZ);
      hObj.userData['assetItem'] = hexFiles[i];

      this.exhibitionRoot.add(hObj);
      this.exhibitionInteractiveObjects.push(hObj);
    }

    // =========================================================================
    // 3. ASSET SHOWCASE ROWS IN FRONT (Trees, Foliage, Rocks, Cacti, Skeletons)
    // =========================================================================
    const treesAssets = this.allAssets.filter((a) => a.category === 'trees').slice(0, 40);
    const foliageAssets = this.allAssets.filter((a) => a.category === 'foliage' || a.category === 'minerals').slice(0, 44);
    const rocksAssets = this.allAssets.filter((a) => a.category === 'rocks').slice(0, 42);
    const cactiAssets = this.allAssets.filter((a) => a.category === 'cacti').slice(0, 45);
    const bonesAssets = this.allAssets.filter((a) => a.category === 'bones'); // all 11 bones & skulls

    const rowDefs: { items: Env1AssetItem[]; z: number; spacing: number; label: string }[] = [
      { items: treesAssets, z: -14, spacing: 3.2, label: 'Trees, Palms & Trunks' },
      { items: foliageAssets, z: -5, spacing: 2.6, label: 'Bushes, Mushrooms & Flora' },
      { items: rocksAssets, z: 4, spacing: 2.7, label: 'Boulders & Natural Stone' },
      { items: cactiAssets, z: 13, spacing: 2.4, label: 'Desert Cacti & Blooms' },
      { items: bonesAssets, z: 22, spacing: 4.8, label: 'Animal Skeletons, Ribs & Skulls' },
    ];

    let totalLoaded = 0;
    const totalToLoad = rowDefs.reduce((acc, r) => acc + r.items.length, 0);

    for (const row of rowDefs) {
      const startX = -((row.items.length - 1) * row.spacing) / 2;

      for (let i = 0; i < row.items.length; i++) {
        const item = row.items[i];
        const posX = startX + i * row.spacing;

        const obj = await this.loadFbx(item.file);
        obj.position.set(posX, 0, row.z);
        obj.userData['assetItem'] = item;

        // Subtle pedestal ring under individual props
        const ringGeom = new THREE.RingGeometry(1.0, 1.12, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(posX, 0.02, row.z);
        this.exhibitionRoot.add(ring);

        this.exhibitionRoot.add(obj);
        this.exhibitionInteractiveObjects.push(obj);

        totalLoaded++;
        if (totalLoaded % 15 === 0) {
          this.loadingProgress = Math.round(35 + (totalLoaded / totalToLoad) * 45);
          this.loadingStatus = `Lining up Exhibition: ${item.name} (${totalLoaded}/${totalToLoad})...`;
          this.cdr.detectChanges();
        }
      }
    }
  }

  /**
   * Constructs the crafted limited world (40m x 40m diorama)
   * with authentic modular river canal, waterfall spring, crossing bridge, and terraced biomes!
   */
  private async buildHandcraftedWorld() {
    this.loadingStatus = 'Terraforming Island Diorama World...';
    this.loadingProgress = 85;
    this.cdr.detectChanges();

    // 8x8 Tile Blueprint with River, Plateau, Bridge and Shore
    interface IslandTileDef {
      file: string;
      rotY?: number;
      y?: number;
      base?: string;
    }

    const WORLD_TILES: IslandTileDef[][] = [
      // Row 0 (North): Mountain Plateau & High Forest
      [
        { file: 'TileGround_36.fbx', y: 1.0 },
        { file: 'TileGround_31.fbx', y: 1.0 },
        { file: 'TileGround_32.fbx', y: 1.0 },
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_02.fbx' },
        { file: 'TileGround_06.fbx' },
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_10.fbx' },
      ],
      // Row 1: Mountain Spring Pond & Forest
      [
        { file: 'TileGround_31.fbx', y: 1.0 },
        { file: 'TileWater_07.fbx', y: 1.0 },
        { file: 'TileGround_41.fbx', y: 0.5, rotY: Math.PI * 0.5 }, // Ramp up to plateau
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_06.fbx' },
        { file: 'TileGround_02.fbx' },
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_01.fbx' },
      ],
      // Row 2: Upper Canal & Waterfall Cascade
      [
        { file: 'TileGround_32.fbx', y: 1.0 },
        { file: 'TileWater_19.fbx', y: 1.0, rotY: 0 },              // Mountain canal
        { file: 'TileWater_08.fbx', y: 0.5, rotY: 0 },              // Waterfall drop
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_02.fbx' },
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_06.fbx' },
        { file: 'TileGround_02.fbx' },
      ],
      // Row 3: Central River Canal with Walkable Stone Bridge
      [
        { file: 'TileGround_03.fbx' },
        { file: 'TileWater_19.fbx', rotY: Math.PI * 0.5 },          // Straight canal
        { file: 'TileWater_22.fbx', rotY: Math.PI * 0.5 },          // Straight canal
        { file: 'TileGround_41.fbx', y: 0.3, rotY: 0 },             // Walkable Bridge Ramp across canal
        { file: 'TileWater_19.fbx', rotY: Math.PI * 0.5 },          // Straight canal
        { file: 'TileWater_20.fbx', rotY: Math.PI },                // River bend turning South
        { file: 'TileGround_01.fbx' },
        { file: 'TileGround_02.fbx' },
      ],
      // Row 4: Desert Edge, South Canal, & Crystal Delta
      [
        { file: 'TileGround_04.fbx' },
        { file: 'TileGround_05.fbx' },
        { file: 'TileGround_08.fbx' },
        { file: 'TileGround_03.fbx' },
        { file: 'TileGround_09.fbx' },
        { file: 'TileWater_19.fbx', rotY: 0 },                      // Canal running South
        { file: 'TileGround_07.fbx' },
        { file: 'TileGround_12.fbx' },
      ],
      // Row 5: Arid Dunes & Scenic Delta Lake
      [
        { file: 'TileGround_04.fbx' },
        { file: 'TileGround_05.fbx' },
        { file: 'TileGround_08.fbx' },
        { file: 'TileGround_03.fbx' },
        { file: 'TileGround_09.fbx' },
        { file: 'TileWater_22.fbx', rotY: 0 },                      // Canal into lake
        { file: 'TileWater_01.fbx' },                               // Delta Lake Basin
        { file: 'TileGround_07.fbx' },
      ],
      // Row 6: Desert Ribs, Skeletons & Crystal Lake
      [
        { file: 'TileGround_05.fbx' },
        { file: 'TileGround_08.fbx' },
        { file: 'TileGround_04.fbx' },
        { file: 'TileGround_03.fbx' },
        { file: 'TileWater_17.fbx', rotY: Math.PI * 0.5 },
        { file: 'TileWater_02.fbx' },                               // Lake Water Pool
        { file: 'TileWater_03.fbx' },                               // Lake Shore
        { file: 'TileGround_13.fbx' },
      ],
      // Row 7 (South): Desert Border & Mystic Crystal Shore
      [
        { file: 'TileGround_04.fbx' },
        { file: 'TileGround_05.fbx' },
        { file: 'TileGround_08.fbx' },
        { file: 'TileGround_09.fbx' },
        { file: 'TileGround_03.fbx' },
        { file: 'TileWater_18.fbx' },
        { file: 'TileGround_07.fbx' },
        { file: 'TileGround_12.fbx' },
      ],
    ];

    const originOffset = 17.5;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const spec = WORLD_TILES[r][c];
        const wx = c * 5.0 - originOffset;
        const wz = r * 5.0 - originOffset;
        const wy = spec.y || 0;

        const tileObj = await this.loadFbx(spec.file);
        tileObj.position.set(wx, wy, wz);
        if (spec.rotY) tileObj.rotation.y = spec.rotY;

        this.worldRoot.add(tileObj);
      }
    }

    // World Props
    const worldProps = [
      // Forest
      { f: 'Tree_01_Spring.fbx', x: -12, y: 1, z: -12, s: 1.2, r: 0.5 },
      { f: 'Tree_02_Spring.fbx', x: -6, y: 1, z: -14, s: 1.1, r: 1.2 },
      { f: 'Tree_06_Spring.fbx', x: 10, y: 1, z: -12, s: 1.3, r: 2.1 },
      { f: 'Tree_13_Spring.fbx', x: 14, y: 1, z: -8, s: 1.0, r: 0.8 },
      { f: 'Tree_01_Fall.fbx', x: 8, y: 1, z: -5, s: 1.15, r: 1.7 },
      { f: 'Tree_04_Fall.fbx', x: 12, y: 1, z: 2, s: 1.2, r: 3.1 },
      { f: 'Bush_01.fbx', x: -10, y: 1, z: -8, s: 1.0, r: 0.4 },
      { f: 'Bush_03.fbx', x: 13, y: 1, z: -4, s: 1.1, r: 1.5 },
      { f: 'Bush_08.fbx', x: -4, y: 1, z: -11, s: 0.9, r: 2.2 },
      { f: 'Flower_01.fbx', x: -8, y: 1, z: -6, s: 1.0, r: 0 },
      { f: 'Mashroom_01.fbx', x: -11, y: 1, z: -10, s: 1.2, r: 0.3 },
      { f: 'Log_01.fbx', x: -5, y: 1, z: -4, s: 1.0, r: 0.6 },

      // Desert & Bones
      { f: 'Cactus_01_A.fbx', x: 8, y: 1, z: 10, s: 1.2, r: 0.3 },
      { f: 'Cactus_02_A.fbx', x: 12, y: 1, z: 8, s: 1.1, r: 1.1 },
      { f: 'Cactus_05_A.fbx', x: 5, y: 1, z: 14, s: 1.3, r: 2.4 },
      { f: 'Cactus_08_A.fbx', x: 11, y: 1, z: 13, s: 1.4, r: 0.8 },
      { f: 'Cactus_20_A.fbx', x: 2, y: 1, z: 12, s: 1.0, r: 1.9 },
      { f: 'CactusFlower_1.fbx', x: 7, y: 1, z: 11, s: 1.1, r: 0.5 },
      { f: 'Bones_01.fbx', x: 6, y: 1, z: 6, s: 1.2, r: 0.9 },
      { f: 'Bones_04.fbx', x: 9, y: 1, z: 15, s: 1.3, r: 1.4 },
      { f: 'Skull_01.fbx', x: 5, y: 1, z: 7, s: 1.0, r: 2.1 },
      { f: 'SoftRock_01.fbx', x: 14, y: 1, z: 11, s: 1.2, r: 0.4 },
      { f: 'SoftRock_05.fbx', x: 4, y: 1, z: 10, s: 1.1, r: 1.8 },
      { f: 'Tree_03_Winter.fbx', x: 13, y: 1, z: 15, s: 1.0, r: 0.5 },

      // Plateau Crystals & Monoliths
      { f: 'HardRock_01.fbx', x: -10, y: 2.2, z: 0, s: 1.4, r: 0.8 },
      { f: 'HardRock_05.fbx', x: -6, y: 2.2, z: 4, s: 1.3, r: 1.7 },
      { f: 'HardRock_12.fbx', x: -12, y: 2.2, z: 4, s: 1.5, r: 0.2 },
      { f: 'MineralNode_01.fbx', x: -8, y: 2.2, z: 2, s: 1.3, r: 0.4 },
      { f: 'MineralNode_05.fbx', x: -11, y: 2.2, z: 6, s: 1.2, r: 2.0 },
      { f: 'TreeTrunk_01.fbx', x: -4, y: 2.2, z: 1, s: 1.1, r: 1.1 },
    ];

    for (const p of worldProps) {
      const obj = await this.loadFbx(p.f);
      obj.position.set(p.x, p.y, p.z);
      obj.scale.setScalar(0.01 * p.s);
      obj.rotation.y = p.r;
      this.worldRoot.add(obj);
    }

    this.spawnCollectibleGems();
  }

  private spawnCollectibleGems() {
    const gemPositions = [
      { x: -12, y: 1.8, z: -8 },
      { x: 10, y: 1.8, z: -10 },
      { x: -7, y: 3.2, z: 2 },
      { x: -10, y: 3.2, z: 5 },
      { x: 7, y: 1.8, z: 12 },
      { x: 12, y: 1.8, z: 14 },
      { x: -2, y: 1.8, z: 3 },
      { x: 2, y: 1.8, z: -2 },
    ];

    for (const pos of gemPositions) {
      const group = new THREE.Group();
      const geom = new THREE.OctahedronGeometry(0.35, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
        flatShading: true,
      });
      const gem = new THREE.Mesh(geom, mat);
      gem.castShadow = true;
      group.add(gem);

      const point = new THREE.PointLight(0x00f2fe, 0.8, 4);
      group.add(point);

      group.position.set(pos.x, pos.y, pos.z);
      this.worldRoot.add(group);
      this.collectibleGems.push({ mesh: group, collected: false, baseY: pos.y });
    }
  }

  private createPlayerCharacter() {
    this.playerGroup = new THREE.Group();

    const bodyGeom = new THREE.CapsuleGeometry(0.35, 0.6, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, flatShading: true, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.playerGroup.add(body);
    this.playerParts.body = body;

    const headGeom = new THREE.SphereGeometry(0.28, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, flatShading: true, roughness: 0.6 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.playerGroup.add(head);

    const packGeom = new THREE.BoxGeometry(0.32, 0.4, 0.2);
    const packMat = new THREE.MeshStandardMaterial({ color: 0xb45309, flatShading: true });
    const pack = new THREE.Mesh(packGeom, packMat);
    pack.position.set(0, 0.95, -0.25);
    this.playerGroup.add(pack);

    const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, flatShading: true });

    const leftLeg = new THREE.Mesh(legGeom, legMat);
    leftLeg.position.set(-0.16, 0.28, 0);
    this.playerGroup.add(leftLeg);
    this.playerParts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeom, legMat);
    rightLeg.position.set(0.16, 0.28, 0);
    this.playerGroup.add(rightLeg);
    this.playerParts.rightLeg = rightLeg;

    this.playerGroup.position.set(0, 1.0, 0);
    this.worldRoot.add(this.playerGroup);
  }

  private setupFireflies() {
    const count = 75;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = Math.random() * 8 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xfff59d,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.fireflyParticles = new THREE.Points(geom, mat);
    this.worldRoot.add(this.fireflyParticles);
  }

  // =========================================================================
  // RAYCASTING: CLICK MODEL IN EXHIBITION TO INSPECT
  // =========================================================================
  onCanvasPointerUp(event: MouseEvent) {
    if (this.viewMode !== 'exhibition' || !this.canvasRef) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.exhibitionInteractiveObjects, true);

    if (intersects.length > 0) {
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr && !curr.userData['assetItem'] && curr.parent !== this.exhibitionRoot) {
        curr = curr.parent;
      }
      if (curr && curr.userData['assetItem']) {
        this.selectedExhibitionAsset = curr.userData['assetItem'];
        this.focusCameraOnObject(curr);
        this.cdr.detectChanges();
      }
    }
  }

  private focusCameraOnObject(obj: THREE.Object3D) {
    const targetPos = obj.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const camPos = targetPos.clone().add(new THREE.Vector3(0, 3.5, 6));

    const startTime = performance.now();
    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const glide = (t: number) => {
      const elapsed = (t - startTime) / 600;
      if (elapsed < 1) {
        const ease = 1 - Math.pow(1 - elapsed, 3);
        this.camera.position.lerpVectors(startCam, camPos, ease);
        this.controls.target.lerpVectors(startTarget, targetPos, ease);
        requestAnimationFrame(glide);
      } else {
        this.camera.position.copy(camPos);
        this.controls.target.copy(targetPos);
      }
    };
    requestAnimationFrame(glide);
  }

  // =========================================================================
  // EXHIBITION ROW CAMERA GLIDE
  // =========================================================================
  setExhibitionRow(row: ExhibitionRow) {
    this.exhibitionRowFocus = row;
    if (this.viewMode !== 'exhibition') return;

    let targetX = 0;
    let targetY = 1.5;
    let targetZ = -2;
    let camX = 0;
    let camY = 32;
    let camZ = 43;

    switch (row) {
      case 'tiles':
        // Focus on the assembled terraced terrain diorama
        targetX = 0;
        targetY = 2.5;
        targetZ = -34;
        camX = 0;
        camY = 22;
        camZ = -6;
        break;
      case 'rivers':
        // Close-up cinematic focus on the flowing river canal and waterfalls
        targetX = 0;
        targetY = 1.5;
        targetZ = -29;
        camX = 0;
        camY = 12;
        camZ = -13;
        break;
      case 'hex':
        // Focus on the hexagonal honeycomb garden
        targetX = 50;
        targetY = 1.5;
        targetZ = -34;
        camX = 50;
        camY = 16;
        camZ = -16;
        break;
      case 'trees':
        targetX = 0;
        targetY = 1.5;
        targetZ = -14;
        camX = 0;
        camY = 16;
        camZ = 14;
        break;
      case 'foliage':
        targetX = 0;
        targetY = 1.2;
        targetZ = -5;
        camX = 0;
        camY = 12;
        camZ = 17;
        break;
      case 'rocks':
        targetX = 0;
        targetY = 1.2;
        targetZ = 4;
        camX = 0;
        camY = 12;
        camZ = 26;
        break;
      case 'cacti':
        targetX = 0;
        targetY = 1.2;
        targetZ = 13;
        camX = 0;
        camY = 12;
        camZ = 35;
        break;
      case 'bones':
        targetX = 0;
        targetY = 1.0;
        targetZ = 22;
        camX = 0;
        camY = 9;
        camZ = 41;
        break;
      case 'all':
      default:
        targetX = 10;
        targetY = 2.0;
        targetZ = -8;
        camX = 10;
        camY = 38;
        camZ = 46;
        break;
    }

    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
    const camPos = new THREE.Vector3(camX, camY, camZ);

    const startTime = performance.now();
    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const glide = (t: number) => {
      const elapsed = (t - startTime) / 600;
      if (elapsed < 1) {
        const ease = 1 - Math.pow(1 - elapsed, 3);
        this.camera.position.lerpVectors(startCam, camPos, ease);
        this.controls.target.lerpVectors(startTarget, targetPos, ease);
        requestAnimationFrame(glide);
      } else {
        this.camera.position.copy(camPos);
        this.controls.target.copy(targetPos);
      }
    };
    requestAnimationFrame(glide);
  }

  // =========================================================================
  // GAMEPLAY & INTERACTION LOOP
  // =========================================================================
  private lastTime = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS Meter
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.viewMode === 'game' && this.playerGroup) {
      this.updatePlayerMovement(dt);
    }

    for (const gem of this.collectibleGems) {
      if (!gem.collected) {
        gem.mesh.rotation.y += dt * 2.0;
        gem.mesh.position.y = gem.baseY + Math.sin(now * 0.003 + gem.baseY) * 0.15;

        if (this.playerGroup) {
          const dist = this.playerGroup.position.distanceTo(gem.mesh.position);
          if (dist < 1.3) {
            this.collectGem(gem);
          }
        }
      }
    }

    const pulse = (Math.sin(now * 0.002) + 1) * 0.5;
    for (const c of this.animatedCrystals) {
      if ((c.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
        (c.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 0.5;
      }
    }

    if (this.fireflyParticles) {
      this.fireflyParticles.rotation.y += dt * 0.04;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private updatePlayerMovement(dt: number) {
    if (!this.playerGroup) return;

    let moveZ = this.moveInput.forward;
    let moveX = this.moveInput.right;

    if (Math.abs(this.joystickVector.y) > 0.1) moveZ = -this.joystickVector.y;
    if (Math.abs(this.joystickVector.x) > 0.1) moveX = this.joystickVector.x;

    const isMoving = Math.abs(moveZ) > 0.05 || Math.abs(moveX) > 0.05;
    const speed = (this.moveInput.sprint ? 9.0 : 5.0) * (isMoving ? 1 : 0);

    const camEuler = new THREE.Euler(0, this.camera.rotation.y, 0);
    const moveDir = new THREE.Vector3(moveX, 0, -moveZ).normalize();
    moveDir.applyEuler(camEuler);

    if (isMoving) {
      this.playerGroup.position.addScaledVector(moveDir, speed * dt);

      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(this.playerGroup.rotation.y, targetAngle, 0.2);

      this.walkTime += dt * (this.moveInput.sprint ? 14 : 9);
      const legAngle = Math.sin(this.walkTime) * 0.45;
      if (this.playerParts.leftLeg) this.playerParts.leftLeg.rotation.x = legAngle;
      if (this.playerParts.rightLeg) this.playerParts.rightLeg.rotation.x = -legAngle;

      this.playFootstepSound();
    } else {
      if (this.playerParts.leftLeg) this.playerParts.leftLeg.rotation.x = 0;
      if (this.playerParts.rightLeg) this.playerParts.rightLeg.rotation.x = 0;
    }

    this.playerGroup.position.x = THREE.MathUtils.clamp(this.playerGroup.position.x, -18.5, 18.5);
    this.playerGroup.position.z = THREE.MathUtils.clamp(this.playerGroup.position.z, -18.5, 18.5);

    const px = this.playerGroup.position.x;
    const pz = this.playerGroup.position.z;
    let targetGroundY = 1.0;

    // Thematic height adaptation and Biome detection
    if (px < -4 && pz < -4) {
      // High Mountain Plateau & Waterfall Spring
      targetGroundY = 2.0;
      this.activeBiome = '🏔️ Mountain Plateau';
    } else if (px >= -5 && px <= 0 && pz >= -9 && pz <= -5) {
      // Mountain Ramp Path
      targetGroundY = 1.5;
      this.activeBiome = '🌿 Mountain Trail';
    } else if (px >= -4 && px <= 2 && pz >= -4 && pz <= 0) {
      // Stone Bridge crossing over river canal
      targetGroundY = 1.3;
      this.activeBiome = '🌉 River Bridge Crossing';
    } else if (pz >= -4 && pz <= 0 && px > 2) {
      // Wading in the River Canal
      targetGroundY = 0.5;
      this.activeBiome = '🌊 River Canal';
    } else if (pz > 5 && px > 4) {
      // Delta Lake Basin Shoreline
      targetGroundY = 0.6;
      this.activeBiome = '✨ Delta Lake Shore';
    } else if (px < 4 && pz > 0) {
      // Arid Bone Desert
      targetGroundY = 1.0;
      this.activeBiome = '🦴 Bone Desert';
    } else {
      // Lush Spring Forest
      targetGroundY = 1.0;
      this.activeBiome = '🌲 Lush Forest Meadow';
    }

    this.playerGroup.position.y = THREE.MathUtils.lerp(this.playerGroup.position.y, targetGroundY, 0.15);

    this.playerPos = {
      x: Math.round(this.playerGroup.position.x),
      y: parseFloat(this.playerGroup.position.y.toFixed(1)),
      z: Math.round(this.playerGroup.position.z),
    };

    const camTarget = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const camOffset = new THREE.Vector3(0, 3.8, 7.5);
    camOffset.applyEuler(new THREE.Euler(0, this.playerGroup.rotation.y, 0));
    const desiredCamPos = this.playerGroup.position.clone().add(camOffset);

    this.camera.position.lerp(desiredCamPos, 0.1);
    this.controls.target.lerp(camTarget, 0.15);
  }

  private collectGem(gem: { mesh: THREE.Group; collected: boolean }) {
    gem.collected = true;
    this.gemsCollected++;
    this.playCollectSound();

    let scale = 1.0;
    const shrink = () => {
      scale -= 0.1;
      if (scale > 0) {
        gem.mesh.scale.setScalar(scale);
        requestAnimationFrame(shrink);
      } else {
        this.worldRoot.remove(gem.mesh);
      }
    };
    shrink();
  }

  // =========================================================================
  // VIEW MODES & ATMOSPHERE
  // =========================================================================
  setViewMode(mode: ViewMode) {
    this.viewMode = mode;

    if (mode === 'exhibition') {
      this.worldRoot.visible = false;
      this.exhibitionRoot.visible = true;
      this.scene.background = new THREE.Color(0x32363c);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x32363c);
      this.camera.position.set(0, 32, 45);
      this.controls.target.set(0, 0, -2);
      this.setTimeOfDay('noon');
    } else if (mode === 'game') {
      this.worldRoot.visible = true;
      this.exhibitionRoot.visible = false;
      this.setTimeOfDay(this.timeOfDay);
      if (this.playerGroup) {
        this.camera.position.set(0, 8, 12);
        this.controls.target.copy(this.playerGroup.position);
      }
    } else {
      this.worldRoot.visible = true;
      this.exhibitionRoot.visible = false;
      this.setTimeOfDay(this.timeOfDay);
      this.camera.position.set(0, 22, 32);
      this.controls.target.set(0, 2, 0);
    }
  }

  setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    if (!this.dirLight || !this.hemiLight || !this.scene) return;

    if (this.viewMode === 'exhibition') {
      // Pristine studio lighting matching user reference renders
      this.scene.background = new THREE.Color(0x32363c);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x32363c);
      this.dirLight.color.setHex(0xfff8ee);
      this.dirLight.intensity = 1.85;
      this.dirLight.position.set(50, 75, -20);
      if (this.fillLight) {
        this.fillLight.color.setHex(0xdbeafe);
        this.fillLight.intensity = 0.75;
        this.fillLight.position.set(-45, 40, 35);
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0xfef3c7);
        this.rimLight.intensity = 0.45;
        this.rimLight.position.set(0, 50, -60);
      }
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x384152);
      this.ambientLight.intensity = 0.35;
      return;
    }

    switch (time) {
      case 'sunset':
        this.scene.background = new THREE.Color(0xfd7e14);
        (this.scene.fog as THREE.FogExp2).color.setHex(0xfd7e14);
        this.dirLight.color.setHex(0xff8833);
        this.dirLight.intensity = 1.8;
        this.dirLight.position.set(40, 15, 15);
        if (this.fillLight) {
          this.fillLight.color.setHex(0xf472b6);
          this.fillLight.intensity = 0.6;
        }
        if (this.rimLight) {
          this.rimLight.color.setHex(0xfbbf24);
          this.rimLight.intensity = 0.5;
        }
        this.hemiLight.color.setHex(0xff9e7d);
        this.hemiLight.groundColor.setHex(0x553322);
        break;

      case 'night':
        this.scene.background = new THREE.Color(0x0a0e1a);
        (this.scene.fog as THREE.FogExp2).color.setHex(0x0a0e1a);
        this.dirLight.color.setHex(0x7dd3fc);
        this.dirLight.intensity = 0.65;
        this.dirLight.position.set(-20, 40, -20);
        if (this.fillLight) {
          this.fillLight.color.setHex(0x1e3a8a);
          this.fillLight.intensity = 0.35;
        }
        if (this.rimLight) {
          this.rimLight.color.setHex(0x38bdf8);
          this.rimLight.intensity = 0.3;
        }
        this.hemiLight.color.setHex(0x38bdf8);
        this.hemiLight.groundColor.setHex(0x020617);
        break;

      case 'dawn':
        this.scene.background = new THREE.Color(0xb589d6);
        (this.scene.fog as THREE.FogExp2).color.setHex(0xb589d6);
        this.dirLight.color.setHex(0xfbcfe8);
        this.dirLight.intensity = 1.35;
        this.dirLight.position.set(25, 25, 30);
        if (this.fillLight) {
          this.fillLight.color.setHex(0xd8b4fe);
          this.fillLight.intensity = 0.6;
        }
        if (this.rimLight) {
          this.rimLight.color.setHex(0xfcd34d);
          this.rimLight.intensity = 0.4;
        }
        this.hemiLight.color.setHex(0xd8b4fe);
        this.hemiLight.groundColor.setHex(0x3b0764);
        break;

      case 'noon':
      default:
        this.scene.background = new THREE.Color(0xa0d8ef);
        (this.scene.fog as THREE.FogExp2).color.setHex(0xa0d8ef);
        this.dirLight.color.setHex(0xfff8ee);
        this.dirLight.intensity = 1.75;
        this.dirLight.position.set(30, 55, 25);
        if (this.fillLight) {
          this.fillLight.color.setHex(0xbae6fd);
          this.fillLight.intensity = 0.7;
          this.fillLight.position.set(-35, 35, -25);
        }
        if (this.rimLight) {
          this.rimLight.color.setHex(0xfef3c7);
          this.rimLight.intensity = 0.45;
        }
        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0x445533);
        break;
    }
  }

  // =========================================================================
  // AUDIO SYNTHESIS
  // =========================================================================
  toggleAudio() {
    this.isAudioEnabled = !this.isAudioEnabled;
    if (this.isAudioEnabled && !this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  private playFootstepSound() {
    if (!this.isAudioEnabled || !this.audioCtx) return;
    if (Math.random() > 0.08) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  }

  private playCollectSound() {
    if (!this.isAudioEnabled || !this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime);
    osc.frequency.setValueAtTime(880.0, this.audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1174.66, this.audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.45);
  }

  // =========================================================================
  // SPAWN ASSET IN GAME WORLD
  // =========================================================================
  async spawnAssetInWorld(item: Env1AssetItem) {
    if (this.viewMode !== 'game') {
      this.setViewMode('game');
    }

    if (!this.playerGroup) return;

    const spawnPos = this.playerGroup.position.clone();
    const forward = new THREE.Vector3(0, 0, -2.5).applyEuler(new THREE.Euler(0, this.playerGroup.rotation.y, 0));
    spawnPos.add(forward);

    const obj = await this.loadFbx(item.file);
    obj.position.copy(spawnPos);
    obj.rotation.y = Math.random() * Math.PI * 2;
    this.worldRoot.add(obj);

    // Quick pop-in animation
    obj.scale.setScalar(0.001);
    let s = 0.001;
    const anim = () => {
      s += 0.0015;
      if (s < 0.01) {
        obj.scale.setScalar(s);
        requestAnimationFrame(anim);
      } else {
        obj.scale.setScalar(0.01);
      }
    };
    anim();

    this.selectedAsset = item;
    this.isCatalogOpen = false;
  }

  // =========================================================================
  // KEYBOARD & TOUCH CONTROLS
  // =========================================================================
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveInput.forward = 1;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveInput.forward = -1;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveInput.right = -1;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveInput.right = 1;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveInput.sprint = true;
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
      case 'KeyS':
      case 'ArrowDown':
        this.moveInput.forward = 0;
        break;
      case 'KeyA':
      case 'ArrowLeft':
      case 'KeyD':
      case 'ArrowRight':
        this.moveInput.right = 0;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveInput.sprint = false;
        break;
    }
  }

  onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    this.touchStartPos = { x: t.clientX, y: t.clientY };
  }

  onTouchMove(e: TouchEvent) {
    if (!this.touchStartPos) return;
    const t = e.touches[0];
    const dx = t.clientX - this.touchStartPos.x;
    const dy = t.clientY - this.touchStartPos.y;
    const max = 50;

    this.joystickVector = {
      x: Math.max(-1, Math.min(1, dx / max)),
      y: Math.max(-1, Math.min(1, dy / max)),
    };
  }

  onTouchEnd() {
    this.touchStartPos = null;
    this.joystickVector = { x: 0, y: 0 };
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.containerRef || !this.renderer || !this.camera) return;
    const width = this.containerRef.nativeElement.clientWidth || window.innerWidth;
    const height = this.containerRef.nativeElement.clientHeight || window.innerHeight;

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  ngOnDestroy() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    if (this.controls) this.controls.dispose();
    if (this.audioCtx) this.audioCtx.close();
    if (this.renderer) this.renderer.dispose();
  }
}
