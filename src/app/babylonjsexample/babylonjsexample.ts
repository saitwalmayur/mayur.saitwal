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
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  ShadowGenerator,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
} from '@babylonjs/core';

export type BabylonTheme = 'cyan' | 'gold' | 'magenta';

@Component({
  selector: 'app-babylonjsexample',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './babylonjsexample.html',
  styleUrl: './babylonjsexample.scss',
})
export class Babylonjsexample implements AfterViewInit, OnDestroy {
  @ViewChild('babylonCanvas', { static: false })
  babylonCanvas!: ElementRef<HTMLCanvasElement>;

  // Interactive UI State
  public currentTheme: BabylonTheme = 'cyan';
  public isAutoRotating: boolean = true;
  public isWireframe: boolean = false;
  public animationSpeed: number = 1.0;
  public fps: number = 60;
  public activeMeshCount: number = 0;

  // Babylon.js Engine & Scene
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera!: ArcRotateCamera;
  private coreMesh!: Mesh;
  private ringInner!: Mesh;
  private ringOuter!: Mesh;
  private orbitingSatellites: Mesh[] = [];
  private coreLight!: PointLight;

  // Materials
  private coreMaterial!: StandardMaterial;
  private ringMaterial!: StandardMaterial;
  private satelliteMaterial!: StandardMaterial;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initBabylonScene();
  }

  ngOnDestroy(): void {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.engine) {
      this.engine.resize();
    }
  }

  // ==========================================
  // BABYLON.JS INITIALIZATION
  // ==========================================

  private initBabylonScene(): void {
    const canvas = this.babylonCanvas.nativeElement;

    // 1. Create Engine
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      powerPreference: 'high-performance',
    });

    // 2. Create Scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.04, 0.06, 0.12, 1.0);

    // 3. ArcRotate Camera
    this.camera = new ArcRotateCamera(
      'mainCamera',
      -Math.PI / 2.5,
      Math.PI / 3,
      14,
      new Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 6;
    this.camera.upperRadiusLimit = 35;
    this.camera.wheelPrecision = 30;

    // 4. Lighting & Shadows
    this.setupLighting();

    // 5. Build 3D Quantum Reactor Demo
    this.buildQuantumCore();

    // 6. Start Render Loop
    let lastFpsUpdate = performance.now();
    let frameCount = 0;

    this.engine.runRenderLoop(() => {
      if (!this.scene) return;

      // Update Mesh Animations
      this.updateAnimations();

      // Render Scene
      this.scene.render();

      // FPS calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 800) {
        this.fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        this.activeMeshCount = this.scene.meshes.length;
        frameCount = 0;
        lastFpsUpdate = now;
        this.cdr.detectChanges();
      }
    });

    // Resize after initial render to avoid layout delay
    setTimeout(() => {
      if (this.engine) this.engine.resize();
    }, 60);
  }

  private setupLighting(): void {
    if (!this.scene) return;

    // Ambient Hemisphere Light
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.55;
    hemiLight.diffuse = new Color3(0.9, 0.95, 1.0);
    hemiLight.groundColor = new Color3(0.08, 0.1, 0.18);

    // Directional Key Light with Shadows
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene);
    dirLight.position = new Vector3(12, 20, 12);
    dirLight.intensity = 1.2;

    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 16;

    // Center Core Point Light
    this.coreLight = new PointLight('coreLight', new Vector3(0, 0, 0), this.scene);
    this.coreLight.intensity = 2.0;
    this.coreLight.range = 15;
    this.updateThemeColors();
  }

  private buildQuantumCore(): void {
    if (!this.scene) return;

    // 1. Central Plasma Core Sphere
    this.coreMesh = MeshBuilder.CreateSphere('quantumCore', { diameter: 2.2, segments: 32 }, this.scene);
    this.coreMaterial = new StandardMaterial('coreMat', this.scene);
    this.coreMesh.material = this.coreMaterial;

    // 2. Inner Gimbal Ring
    this.ringInner = MeshBuilder.CreateTorus(
      'ringInner',
      { diameter: 4.6, thickness: 0.16, tessellation: 48 },
      this.scene
    );
    this.ringMaterial = new StandardMaterial('ringMat', this.scene);
    this.ringInner.material = this.ringMaterial;

    // 3. Outer Gimbal Ring
    this.ringOuter = MeshBuilder.CreateTorus(
      'ringOuter',
      { diameter: 6.8, thickness: 0.22, tessellation: 64 },
      this.scene
    );
    this.ringOuter.material = this.ringMaterial;

    // 4. 8 Orbiting Quantum Satellites
    this.orbitingSatellites = [];
    this.satelliteMaterial = new StandardMaterial('satelliteMat', this.scene);

    for (let i = 0; i < 8; i++) {
      const satellite = MeshBuilder.CreatePolyhedron(
        `satellite_${i}`,
        { type: 1, size: 0.32 },
        this.scene
      );
      satellite.material = this.satelliteMaterial;
      this.orbitingSatellites.push(satellite);
    }

    // 5. Hexagonal Pedestal Base
    const pedestal = MeshBuilder.CreateCylinder(
      'pedestal',
      { diameter: 10, height: 0.4, tessellation: 6 },
      this.scene
    );
    pedestal.position.y = -3.8;
    const pedestalMat = new StandardMaterial('pedestalMat', this.scene);
    pedestalMat.diffuseColor = new Color3(0.08, 0.12, 0.2);
    pedestalMat.specularColor = new Color3(0.3, 0.5, 0.8);
    pedestal.material = pedestalMat;
    pedestal.receiveShadows = true;

    // Base Neon Ring
    const baseGlowRing = MeshBuilder.CreateTorus(
      'baseGlowRing',
      { diameter: 8.6, thickness: 0.12, tessellation: 48 },
      this.scene
    );
    baseGlowRing.position.y = -3.58;
    baseGlowRing.material = this.ringMaterial;

    this.updateThemeColors();
  }

  // ==========================================
  // ANIMATION LOOP LOGIC
  // ==========================================

  private updateAnimations(): void {
    if (!this.coreMesh) return;

    const delta = this.engine?.getDeltaTime() ? this.engine.getDeltaTime() * 0.001 : 0.016;
    const speed = this.animationSpeed;

    if (this.isAutoRotating) {
      // Rotate core
      this.coreMesh.rotation.y += 0.8 * delta * speed;
      this.coreMesh.rotation.x += 0.4 * delta * speed;

      // Counter-rotating rings
      this.ringInner.rotation.x += 1.2 * delta * speed;
      this.ringInner.rotation.y += 0.6 * delta * speed;

      this.ringOuter.rotation.y -= 0.9 * delta * speed;
      this.ringOuter.rotation.z += 0.5 * delta * speed;

      // Orbit satellites in 3D wave path
      const time = performance.now() * 0.0015 * speed;
      this.orbitingSatellites.forEach((sat, idx) => {
        const offset = (idx * (Math.PI * 2)) / this.orbitingSatellites.length;
        const radius = 4.2 + Math.sin(time + idx) * 0.4;
        sat.position.x = Math.cos(time + offset) * radius;
        sat.position.z = Math.sin(time + offset) * radius;
        sat.position.y = Math.sin(time * 2 + offset) * 1.4;

        sat.rotation.x += 2.0 * delta * speed;
        sat.rotation.y += 1.5 * delta * speed;
      });

      // Pulse core light
      if (this.coreLight) {
        this.coreLight.intensity = 1.8 + Math.sin(time * 3) * 0.6;
      }
    }
  }

  // ==========================================
  // THEMES & INTERACTIVE CONTROLS
  // ==========================================

  public setTheme(theme: BabylonTheme): void {
    this.currentTheme = theme;
    this.updateThemeColors();
  }

  private updateThemeColors(): void {
    if (!this.coreMaterial) return;

    if (this.currentTheme === 'cyan') {
      // Cyberpunk Cyan
      this.coreMaterial.diffuseColor = new Color3(0.0, 0.8, 1.0);
      this.coreMaterial.emissiveColor = new Color3(0.0, 0.45, 0.75);
      this.ringMaterial.emissiveColor = new Color3(0.0, 0.6, 0.9);
      this.satelliteMaterial.emissiveColor = new Color3(0.2, 0.85, 1.0);
      this.coreLight.diffuse = new Color3(0.0, 0.8, 1.0);
    } else if (this.currentTheme === 'gold') {
      // Solar Gold
      this.coreMaterial.diffuseColor = new Color3(1.0, 0.7, 0.1);
      this.coreMaterial.emissiveColor = new Color3(0.8, 0.45, 0.05);
      this.ringMaterial.emissiveColor = new Color3(0.9, 0.6, 0.1);
      this.satelliteMaterial.emissiveColor = new Color3(1.0, 0.8, 0.2);
      this.coreLight.diffuse = new Color3(1.0, 0.75, 0.15);
    } else {
      // Plasma Magenta
      this.coreMaterial.diffuseColor = new Color3(0.95, 0.15, 0.6);
      this.coreMaterial.emissiveColor = new Color3(0.65, 0.08, 0.4);
      this.ringMaterial.emissiveColor = new Color3(0.85, 0.2, 0.65);
      this.satelliteMaterial.emissiveColor = new Color3(1.0, 0.3, 0.75);
      this.coreLight.diffuse = new Color3(0.95, 0.2, 0.6);
    }

    this.coreMaterial.wireframe = this.isWireframe;
    this.ringMaterial.wireframe = this.isWireframe;
    this.satelliteMaterial.wireframe = this.isWireframe;
  }

  public toggleAutoRotate(): void {
    this.isAutoRotating = !this.isAutoRotating;
  }

  public toggleWireframe(): void {
    this.isWireframe = !this.isWireframe;
    if (this.coreMaterial) {
      this.coreMaterial.wireframe = this.isWireframe;
      this.ringMaterial.wireframe = this.isWireframe;
      this.satelliteMaterial.wireframe = this.isWireframe;
    }
  }

  public setSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  public resetCamera(): void {
    if (!this.camera) return;
    this.camera.alpha = -Math.PI / 2.5;
    this.camera.beta = Math.PI / 3;
    this.camera.radius = 14;
    this.camera.target = new Vector3(0, 0, 0);
  }
}
