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
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export type RoomId = 'furniture_set' | 'room1' | 'room2';
export type CameraPreset = 'overview' | 'armchair' | 'loveseat' | 'topdown';
export type LightingMood = 'daylight' | 'sunset' | 'noir';

export interface ColorSwatch {
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
}

export interface WoodFinish {
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
}

@Component({
  selector: 'app-threejsfurniturehome',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './threejsfurniturehome.html',
  styleUrl: './threejsfurniturehome.scss',
})
export class Threejsfurniturehome implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  public isBrowser = false;
  isLoading = true;
  loadingProgress = 0;

  // Active Showroom State
  activeRoom: RoomId = 'furniture_set';
  activeCameraPreset: CameraPreset = 'overview';
  activeMood: LightingMood = 'daylight';
  isAutoRotating = true;

  // Color & Material Options
  readonly upholsterySwatches: ColorSwatch[] = [
    { name: 'Pure White', hex: '#ffffff', roughness: 0.35, metalness: 0.0 },
    { name: 'Ivory Linen', hex: '#f8fafc', roughness: 0.75, metalness: 0.0 },
    { name: 'Amber Leather', hex: '#d97706', roughness: 0.35, metalness: 0.1 },
    { name: 'Royal Velvet', hex: '#1d4ed8', roughness: 0.65, metalness: 0.05 },
    { name: 'Forest Emerald', hex: '#047857', roughness: 0.6, metalness: 0.05 },
    { name: 'Charcoal Slate', hex: '#334155', roughness: 0.5, metalness: 0.1 },
    { name: 'Terracotta', hex: '#b45309', roughness: 0.45, metalness: 0.08 },
    { name: 'Dusty Rose', hex: '#be185d', roughness: 0.55, metalness: 0.05 },
  ];

  readonly woodFinishes: WoodFinish[] = [
    { name: 'Dark Walnut', hex: '#3e2723', roughness: 0.55, metalness: 0.05 },
    { name: 'Nordic Oak', hex: '#8d6e63', roughness: 0.5, metalness: 0.05 },
    { name: 'Matte Ebony', hex: '#18181b', roughness: 0.7, metalness: 0.05 },
    { name: 'Brushed Brass', hex: '#ca8a04', roughness: 0.28, metalness: 0.85 },
    { name: 'Alpine White', hex: '#f8fafc', roughness: 0.45, metalness: 0.05 },
  ];

  selectedSwatch: ColorSwatch = this.upholsterySwatches[0]; // Pure White default
  selectedWood: WoodFinish = this.woodFinishes[0];

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private currentModelGroup: THREE.Group | null = null;
  private studioFloorGroup: THREE.Group | null = null;

  // Cached Meshes for Dynamic Theming
  private upholsteryMeshes: THREE.Mesh[] = [];
  private woodMeshes: THREE.Mesh[] = [];

  // Lighting References
  private dirSunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private overheadSoftbox!: THREE.SpotLight;
  private rimLight!: THREE.DirectionalLight;
  private accentPointLight!: THREE.PointLight;
  private windowFillLight!: THREE.DirectionalLight;
  private envMapTexture: THREE.Texture | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initThree();
    this.setupLighting();
    this.setupStudioFloor();
    this.loadRoomModel(this.activeRoom);
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
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
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(2.8, 2.0, 2.8);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 25.0;
    this.controls.target.set(0, 0.65, 0);
  }

  private setupLighting(): void {
    // 1. Natural Dual-Gradient Hemisphere Light (mimics sky & floor room bounce)
    this.hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 0.75);
    this.scene.add(this.hemiLight);

    // 2. High-Precision Key Sunlight with PCF Soft Contact Shadows
    this.dirSunLight = new THREE.DirectionalLight(0xfffbf0, 2.6);
    this.dirSunLight.position.set(3.5, 6.0, 3.5);
    this.dirSunLight.castShadow = true;
    this.dirSunLight.shadow.mapSize.width = 2048;
    this.dirSunLight.shadow.mapSize.height = 2048;
    this.dirSunLight.shadow.bias = -0.00015;
    this.dirSunLight.shadow.radius = 2.4;
    this.dirSunLight.shadow.camera.near = 1.0;
    this.dirSunLight.shadow.camera.far = 18;
    this.dirSunLight.shadow.camera.left = -2.8;
    this.dirSunLight.shadow.camera.right = 2.8;
    this.dirSunLight.shadow.camera.top = 2.8;
    this.dirSunLight.shadow.camera.bottom = -2.8;
    this.scene.add(this.dirSunLight);

    // 3. Overhead Diffused Studio Softbox Panel
    this.overheadSoftbox = new THREE.SpotLight(0xffffff, 2.4, 12, Math.PI / 4.2, 0.85, 1.2);
    this.overheadSoftbox.position.set(0, 4.8, 0);
    this.overheadSoftbox.target.position.set(0, 0.4, 0);
    this.overheadSoftbox.castShadow = true;
    this.overheadSoftbox.shadow.mapSize.width = 1024;
    this.overheadSoftbox.shadow.mapSize.height = 1024;
    this.overheadSoftbox.shadow.bias = -0.0002;
    this.overheadSoftbox.shadow.radius = 3.5;
    this.scene.add(this.overheadSoftbox);
    this.scene.add(this.overheadSoftbox.target);

    // 4. Large Cool Window Skylight Fill
    this.windowFillLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    this.windowFillLight.position.set(-4.5, 3.5, -2.5);
    this.scene.add(this.windowFillLight);

    // 5. Contour Rim / Silhouette Kicker Light
    this.rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.3);
    this.rimLight.position.set(-3.0, 3.8, -4.5);
    this.scene.add(this.rimLight);

    // 6. Warm Interior Floor Lamp Accent
    this.accentPointLight = new THREE.PointLight(0xf59e0b, 1.6, 8, 1.5);
    this.accentPointLight.position.set(2.0, 1.5, -1.6);
    this.scene.add(this.accentPointLight);

    // 7. Load HDR Environment Map for Realistic PBR Specular Reflections & Fresnel Sheen
    this.setupHdrEnvironment();
  }

  private setupHdrEnvironment(): void {
    const loader = new RGBELoader();
    loader.load(
      '/ChessAssets/historic_cloister_passage_2k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.envMapTexture = texture;
        this.scene.environment = texture;
        this.updateEnvIntensity();
      },
      undefined,
      (err) => {
        console.warn('Could not load HDR environment, using fallback studio lighting:', err);
      }
    );
  }

  private updateEnvIntensity(): void {
    if (!this.scene) return;
    let intensity = 0.85;
    if (this.activeMood === 'sunset') intensity = 0.95;
    else if (this.activeMood === 'noir') intensity = 0.45;
    this.scene.environmentIntensity = intensity;
  }

  private setupStudioFloor(): void {
    this.studioFloorGroup = new THREE.Group();

    // 1. Sleek Semi-Gloss Showroom Slate Podium
    const floorGeo = new THREE.CircleGeometry(4.2, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.38,
      metalness: 0.12,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.002;
    floor.receiveShadow = true;
    this.studioFloorGroup.add(floor);

    // 2. Soft Contact Shadow Occlusion Disc under furniture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.0005;
    this.studioFloorGroup.add(shadowMesh);

    // 3. Elegant Thin Cyan Studio Accent Ring
    const ringGeo = new THREE.RingGeometry(2.1, 2.12, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    this.studioFloorGroup.add(ring);

    this.scene.add(this.studioFloorGroup);
  }

  // =========================================================================
  // MODEL LOADING & MATERIAL MAPPING
  // =========================================================================
  loadRoomModel(roomId: RoomId): void {
    this.activeRoom = roomId;
    this.isLoading = true;
    this.loadingProgress = 0;
    this.cdr.detectChanges();

    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }

    this.upholsteryMeshes = [];
    this.woodMeshes = [];

    // Toggle studio circular floor visibility (room1 and room2 have their own floors)
    if (this.studioFloorGroup) {
      this.studioFloorGroup.visible = roomId === 'furniture_set';
    }

    let file = '/3dModels/Infrastructure/Furniture/A23DMOD_GLTF.gltf';
    if (roomId === 'room1') {
      file = '/room/room1.glb';
    } else if (roomId === 'room2') {
      file = '/room/room2.glb';
    }

    const loader = new GLTFLoader();

    loader.load(
      file,
      (gltf) => {
        const root = gltf.scene;
        this.currentModelGroup = root;
        this.scene.add(root);

        // Normalize and center model
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());

        if (roomId === 'furniture_set') {
          root.position.x -= center.x;
          root.position.z -= center.z;
          root.position.y -= box.min.y;
        }

        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const name = mesh.name.toLowerCase();
            let matName = '';

            // Clone materials so we can customize colors individually
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map((m) => m.clone());
                matName = mesh.material.map((m) => m.name.toLowerCase()).join(' ');
              } else {
                mesh.material = (mesh.material as THREE.Material).clone();
                matName = (mesh.material as THREE.Material).name.toLowerCase();
              }
            }

            // Identify Upholstery (Seats, Back Cushions, Arms, Pillows, A23DMAT_001)
            if (
              name.includes('seat') ||
              name.includes('cushion') ||
              name.includes('pillow') ||
              name.includes('armchair') ||
              name.includes('loveseat') ||
              matName.includes('mat_001') ||
              name.includes('obj_007') ||
              name.includes('obj_008') ||
              name.includes('obj_009') ||
              name.includes('obj_010')
            ) {
              this.upholsteryMeshes.push(mesh);
            }
            // Identify Wood Frame, Legs & Table Pedestal (A23DMAT_002, A23DMAT_004)
            else if (
              name.includes('leg') ||
              name.includes('base') ||
              name.includes('frame') ||
              name.includes('table') ||
              matName.includes('mat_002') ||
              matName.includes('mat_004') ||
              name.includes('obj_001') ||
              name.includes('obj_002')
            ) {
              this.woodMeshes.push(mesh);
            }
          }
        });

        // Apply selected initial swatches
        this.applyUpholsteryColor(this.selectedSwatch);
        this.applyWoodFinish(this.selectedWood);

        // Adjust camera preset to fit model scale
        this.setCameraPreset(this.activeCameraPreset);

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
        console.error('Error loading furniture model:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // =========================================================================
  // MATERIAL THEME CUSTOMIZER
  // =========================================================================
  applyUpholsteryColor(swatch: ColorSwatch): void {
    this.selectedSwatch = swatch;
    const col = new THREE.Color(swatch.hex);

    this.upholsteryMeshes.forEach((mesh) => {
      const applyToMat = (mat: THREE.Material) => {
        const stdMat = mat as THREE.MeshStandardMaterial;
        const name = (stdMat.name || '').toLowerCase();
        if (
          Array.isArray(mesh.material) &&
          name &&
          !name.includes('001') &&
          !name.includes('upholstery') &&
          !name.includes('seat') &&
          !name.includes('cushion')
        ) {
          return;
        }
        if (stdMat && stdMat.color) {
          stdMat.color.copy(col);
          stdMat.roughness = swatch.roughness;
          stdMat.metalness = swatch.metalness;
          stdMat.needsUpdate = true;
        }
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyToMat);
      } else if (mesh.material) {
        applyToMat(mesh.material);
      }
    });
  }

  applyWoodFinish(finish: WoodFinish): void {
    this.selectedWood = finish;
    const col = new THREE.Color(finish.hex);

    this.woodMeshes.forEach((mesh) => {
      const applyToMat = (mat: THREE.Material) => {
        const stdMat = mat as THREE.MeshStandardMaterial;
        const name = (stdMat.name || '').toLowerCase();
        if (
          Array.isArray(mesh.material) &&
          name &&
          (name.includes('001') || name.includes('upholstery') || name.includes('seat') || name.includes('cushion'))
        ) {
          return;
        }
        if (stdMat && stdMat.color) {
          stdMat.color.copy(col);
          stdMat.roughness = finish.roughness;
          stdMat.metalness = finish.metalness;
          stdMat.needsUpdate = true;
        }
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyToMat);
      } else if (mesh.material) {
        applyToMat(mesh.material);
      }
    });
  }

  // =========================================================================
  // LIGHTING MOOD SWITCHER
  // =========================================================================
  setLightingMood(mood: LightingMood): void {
    this.activeMood = mood;
    this.updateEnvIntensity();

    if (mood === 'daylight') {
      this.scene.background = new THREE.Color(0x0a0f1d);
      this.hemiLight.color.setHex(0xf8fafc);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.75;
      this.dirSunLight.color.setHex(0xfffbf0);
      this.dirSunLight.intensity = 2.6;
      this.overheadSoftbox.color.setHex(0xffffff);
      this.overheadSoftbox.intensity = 2.4;
      this.windowFillLight.color.setHex(0xdbeafe);
      this.windowFillLight.intensity = 1.1;
      this.rimLight.color.setHex(0xe0f2fe);
      this.rimLight.intensity = 1.3;
      this.accentPointLight.color.setHex(0xf59e0b);
      this.accentPointLight.intensity = 1.6;
      this.renderer.toneMappingExposure = 1.15;
    } else if (mood === 'sunset') {
      this.scene.background = new THREE.Color(0x1a0f14);
      this.hemiLight.color.setHex(0xfed7aa);
      this.hemiLight.groundColor.setHex(0x451a03);
      this.hemiLight.intensity = 0.7;
      this.dirSunLight.color.setHex(0xf97316);
      this.dirSunLight.intensity = 3.2;
      this.overheadSoftbox.color.setHex(0xfde047);
      this.overheadSoftbox.intensity = 1.8;
      this.windowFillLight.color.setHex(0x818cf8);
      this.windowFillLight.intensity = 1.3;
      this.rimLight.color.setHex(0xfb923c);
      this.rimLight.intensity = 1.6;
      this.accentPointLight.color.setHex(0xf59e0b);
      this.accentPointLight.intensity = 3.0;
      this.renderer.toneMappingExposure = 1.25;
    } else if (mood === 'noir') {
      this.scene.background = new THREE.Color(0x030712);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.35;
      this.dirSunLight.color.setHex(0x38bdf8);
      this.dirSunLight.intensity = 1.6;
      this.overheadSoftbox.color.setHex(0xe0f2fe);
      this.overheadSoftbox.intensity = 2.8;
      this.windowFillLight.color.setHex(0x6366f1);
      this.windowFillLight.intensity = 0.8;
      this.rimLight.color.setHex(0x38bdf8);
      this.rimLight.intensity = 1.8;
      this.accentPointLight.color.setHex(0xfbbf24);
      this.accentPointLight.intensity = 3.6;
      this.renderer.toneMappingExposure = 1.05;
    }
  }

  // =========================================================================
  // CAMERA PRESETS & SMOOTH GLIDE
  // =========================================================================
  setCameraPreset(preset: CameraPreset): void {
    this.activeCameraPreset = preset;

    let targetPos: [number, number, number] = [2.8, 2.0, 2.8];
    let lookAt: [number, number, number] = [0, 0.65, 0];

    if (this.activeRoom === 'furniture_set') {
      switch (preset) {
        case 'overview':
          targetPos = [2.6, 1.9, 2.6];
          lookAt = [0, 0.65, 0];
          break;
        case 'armchair':
          targetPos = [1.25, 0.95, 1.25];
          lookAt = [0.45, 0.62, 0.45];
          break;
        case 'loveseat':
          targetPos = [0.0, 1.7, 1.45];
          lookAt = [0, 0.72, 0];
          break;
        case 'topdown':
          targetPos = [0, 3.4, 0.01];
          lookAt = [0, 0, 0];
          break;
      }
    } else {
      switch (preset) {
        case 'overview':
          targetPos = [4.8, 3.6, 4.8];
          lookAt = [0.3, 0.8, -0.7];
          break;
        case 'armchair':
          targetPos = [3.8, 1.6, 0.5];
          lookAt = [2.35, 0.6, -0.62];
          break;
        case 'loveseat':
          targetPos = [1.4, 1.8, -0.4];
          lookAt = [0.62, 0.6, -2.05];
          break;
        case 'topdown':
          targetPos = [0.3, 7.8, -0.6];
          lookAt = [0.3, 0.0, -0.7];
          break;
      }
    }

    this.glideCamera(targetPos, lookAt);
  }

  private glideCamera(pos: [number, number, number], target: [number, number, number]): void {
    if (!this.camera || !this.controls) return;

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(...pos);
    const endTarget = new THREE.Vector3(...target);

    const startTime = performance.now();
    const duration = 750;

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

  toggleAutoRotate(): void {
    this.isAutoRotating = !this.isAutoRotating;
    this.controls.autoRotate = this.isAutoRotating;
  }

  resetView(): void {
    this.setCameraPreset('overview');
  }

  getActiveModelTitle(): string {
    if (this.activeRoom === 'furniture_set') return 'Executive Suite (Table & 4 Chairs)';
    if (this.activeRoom === 'room1') return 'Classic Lounge Diorama';
    return 'Modern Living Suite';
  }

  getPerspectiveLabel1(): string {
    return this.activeRoom === 'furniture_set' ? '🪑 Executive Chair' : '🪑 Armchair';
  }

  getPerspectiveLabel2(): string {
    return this.activeRoom === 'furniture_set' ? '🍽️ Central Table' : '🛋️ Loveseat';
  }

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.isAutoRotating) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.8;
    } else {
      this.controls.autoRotate = false;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
