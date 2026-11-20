import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { defaults, presets } from './lib/demo/presets/index.js';
import { World, type Diagnostics, type CameraState } from './lib/demo/runtime/world.js';
import {
  PARTICLE_LEVELS,
  particleCount,
  type ParticleLevel,
  type Preset,
  type Values,
  type Control,
} from './lib/demo/types.js';

@Component({
  selector: 'app-fluidsexample1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fluidsexample1.html',
  styleUrl: './fluidsexample1.scss',
})
export class Fluidsexample1 implements AfterViewInit, OnDestroy {
  @ViewChild('canvasHost', { static: false })
  canvasHostRef!: ElementRef<HTMLDivElement>;

  readonly presets = presets;
  readonly particleLevels = PARTICLE_LEVELS;
  readonly groups: string[] = ['Liquids', 'Viscoelastic', 'Soft Body', 'Cloth', 'Gases'];

  selected: Preset = presets.find((p) => p.id === 'dam-break') ?? presets[0]!;
  values: Values = defaults(this.selected);
  particleLevel: ParticleLevel = 'medium';
  particleView = false;
  substepSelection: 'auto' | number = 'auto';
  ambientOcclusion = true;
  reflections = true;
  looping = false;

  playing = true;
  loading = true;
  hasError = false;
  errorMessage = '';
  controlsOpen = false;

  toastVisible = false;
  toastMessage = '';
  private toastTimer: any = null;

  diagnostics: Diagnostics = {
    fps: 60,
    frameMs: 16.6,
    particles: 10000,
    time: 0,
    substeps: 4,
    iterations: 2,
    limited: false,
  };

  simStateText = 'INITIALIZING';
  solverInfoText = 'GPU COMPUTE';
  interactionHint = 'Drag to orbit · Scroll to zoom';
  parameterNote = 'Changes apply in real time.';

  private isBrowser: boolean;
  private world: World | undefined;
  private generation = 0;
  private memory = new Map<string, Values>();
  private structuralTimer: any = null;
  private queue = Promise.resolve();

  // WebGL Fallback Simulation Engine (when WebGPU is not supported by client browser)
  private isWebGLFallback = false;
  private fallbackRenderer!: THREE.WebGLRenderer;
  private fallbackScene!: THREE.Scene;
  private fallbackCamera!: THREE.PerspectiveCamera;
  private fallbackControls!: OrbitControls;
  private fallbackAnimId: number | null = null;
  private fallbackMesh!: THREE.InstancedMesh;
  private fallbackDummy = new THREE.Object3D();
  private fallbackParticlesCount = 0;
  private fallbackPositions!: Float32Array;
  private fallbackVelocities!: Float32Array;
  private fallbackPrevPositions!: Float32Array;
  private fallbackLambdas!: Float32Array;
  private fallbackColors!: Float32Array;
  private fallbackGridHead = new Int32Array(32768);
  private fallbackGridNext = new Int32Array(50000);
  private fallbackSimTime = 0;
  private fallbackLastFrame = performance.now();

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Initialize groups dynamically from presets
    const uniqueGroups = [...new Set(presets.map((p) => p.group))];
    if (uniqueGroups.length > 0) {
      this.groups = uniqueGroups;
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Check URL search params for preset selection
    try {
      const urlParams = new URL(window.location.href).searchParams;
      const paramPreset = urlParams.get('preset');
      if (paramPreset) {
        const found = presets.find((p) => p.id === paramPreset);
        if (found) this.selected = found;
      }
    } catch { }

    this.selectPreset(this.selected, false);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    clearTimeout(this.structuralTimer);
    clearTimeout(this.toastTimer);
    this.disposeWorld();
    this.disposeFallback();
  }

  getPresetsByGroup(group: string): Preset[] {
    return presets.filter((p) => p.group === group);
  }

  getParticleCountForLevel(preset: Preset, levelId: string): number {
    return particleCount(preset, levelId as ParticleLevel);
  }

  get currentSubsteps(): number {
    if (this.substepSelection !== 'auto') {
      return Number(this.substepSelection);
    }
    return this.world?.experiment?.substeps ?? this.diagnostics.substeps ?? 4;
  }

  formatValue(value: number | undefined, step: number): string {
    if (value === undefined) return '0';
    const decimals = step.toString().split('.')[1]?.length ?? 0;
    return value.toFixed(decimals);
  }

  getFillPercent(control: Control): string {
    const val = this.values[control.key] ?? control.value;
    const pct = ((val - control.min) / (control.max - control.min)) * 100;
    return `${Math.max(0, Math.min(100, pct))}%`;
  }

  selectPreset(preset: Preset, updateUrl = true): void {
    clearTimeout(this.structuralTimer);
    this.memory.set(this.selected.id, { ...this.values });
    this.selected = preset;
    this.values = { ...(this.memory.get(preset.id) ?? defaults(preset)) };

    // Update document accent and title
    document.documentElement.style.setProperty('--accent', preset.accent);
    document.title = `${preset.name} — Three.js Particle Fluids`;

    this.parameterNote = preset.controls.some((c) => c.restart)
      ? 'Live controls · ↻ restarts the experiment'
      : 'Changes apply in real time.';

    if (updateUrl && typeof history !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('preset', preset.id);
        history.replaceState(null, '', url);
      } catch { }
    }

    this.rebuild(false);
  }

  rebuild(preserveCamera = true): void {
    if (!this.isBrowser) return;
    const token = ++this.generation;
    const preset = this.selected;
    const config = { ...this.values };
    const count = particleCount(preset, this.particleLevel);
    const host = this.canvasHostRef?.nativeElement;
    if (!host) return;

    this.loading = true;
    this.hasError = false;
    this.simStateText = 'INITIALIZING';
    this.cdr.detectChanges();

    this.queue = this.queue.then(async () => {
      if (token !== this.generation) return;

      const previousWorld = this.world;
      this.world = undefined;
      await previousWorld?.dispose();
      this.disposeFallback();

      const cameraState: CameraState | undefined = preserveCamera
        ? previousWorld?.cameraState()
        : undefined;

      // Check if WebGPU is available in this environment
      const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator && !!(navigator as any).gpu;

      if (hasWebGpu) {
        try {
          const next = new World(
            preset,
            (data) => {
              if (token === this.generation) {
                this.ngZone.run(() => {
                  this.diagnostics = data;
                  this.simStateText = this.playing
                    ? data.limited
                      ? 'RUNNING · GPU LIMITED'
                      : 'RUNNING'
                    : 'PAUSED';
                  this.solverInfoText = `${data.substeps} SUBSTEPS · ${data.iterations} ITERATIONS`;
                  this.cdr.detectChanges();
                });
              }
            },
            () => this.rebuild(),
            (error) => {
              if (token === this.generation) {
                console.warn('WebGPU encountered an error, activating WebGL fallback:', error);
                this.activateWebGLFallback(host, preset, config, count);
              }
            },
            () => {
              if (token === this.generation) {
                this.playing = true;
                this.cdr.detectChanges();
              }
            }
          );

          await next.init(host, config, count, cameraState);
          if (token !== this.generation) {
            await next.dispose();
            return;
          }

          this.world = next;
          for (const control of preset.controls) {
            if (!control.restart) next.experiment.setParameter(control.key, this.values[control.key]!);
          }
          next.playing = this.playing;
          next.looping = this.looping;
          next.ambientOcclusion = this.ambientOcclusion;
          if (this.substepSelection !== 'auto') {
            next.experiment.loop.substeps = Number(this.substepSelection);
          }
          next.experiment.setParticleView?.(this.particleView);
          next.experiment.setReflections?.(this.reflections);

          host.replaceChildren(next.canvas);
          this.interactionHint = next.experiment.interact
            ? 'Click the liquid to splash · Drag to orbit · Scroll to zoom'
            : 'Drag to orbit · Scroll to zoom';

          this.loading = false;
          this.simStateText = this.playing ? 'RUNNING' : 'PAUSED';
          this.isWebGLFallback = false;
          next.start();
          this.cdr.detectChanges();
          return;
        } catch (err) {
          console.warn('WebGPU initialization failed, falling back to WebGL:', err);
        }
      }

      // Fallback to high-performance WebGL simulation
      this.activateWebGLFallback(host, preset, config, count);
    });
  }

  // =========================================================================
  // HIGH-PERFORMANCE WEBGL FALLBACK (Guaranteeing 100% device compatibility)
  // =========================================================================

  private activateWebGLFallback(
    host: HTMLElement,
    preset: Preset,
    config: Values,
    count: number
  ): void {
    this.isWebGLFallback = true;
    const width = host.clientWidth || window.innerWidth || 800;
    const height = host.clientHeight || window.innerHeight || 600;

    this.fallbackScene = new THREE.Scene();
    this.fallbackScene.background = new THREE.Color('#10161e');
    this.fallbackScene.fog = new THREE.Fog('#10161e', 3, 10);

    this.fallbackCamera = new THREE.PerspectiveCamera(38, width / height, 0.05, 50);
    this.fallbackCamera.position.fromArray(preset.camera);

    this.fallbackRenderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.fallbackRenderer.setSize(width, height);
    this.fallbackRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.fallbackRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.fallbackRenderer.toneMappingExposure = 1.0;
    this.fallbackRenderer.shadowMap.enabled = true;

    this.fallbackControls = new OrbitControls(this.fallbackCamera, this.fallbackRenderer.domElement);
    this.fallbackControls.target.fromArray(preset.target);
    this.fallbackControls.enableDamping = true;
    this.fallbackControls.dampingFactor = 0.08;
    this.fallbackControls.update();

    // Studio Stage Floor & Lights
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#151d27',
      roughness: 0.4,
      metalness: 0.6,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.001;
    floorMesh.receiveShadow = true;
    this.fallbackScene.add(floorMesh);

    const hemiLight = new THREE.HemisphereLight(0xd7e6ff, 0x111721, 0.7);
    this.fallbackScene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf8f1e5, 2.2);
    keyLight.position.set(2, 4, 2.5);
    keyLight.castShadow = true;
    this.fallbackScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x74c9df, 1.2);
    rimLight.position.set(-2, 2.5, -2);
    this.fallbackScene.add(rimLight);

    // Initialize Fallback Particles
    const targetCount = Math.min(count, 15000);
    this.fallbackParticlesCount = targetCount;
    this.fallbackPositions = new Float32Array(targetCount * 3);
    this.fallbackPrevPositions = new Float32Array(targetCount * 3);
    this.fallbackVelocities = new Float32Array(targetCount * 3);
    this.fallbackLambdas = new Float32Array(targetCount);
    this.fallbackColors = new Float32Array(targetCount * 3);

    const spacing = 0.042;
    const accentCol = new THREE.Color(preset.accent || '#74c9df');
    const deepCol = new THREE.Color('#0284c7');
    const foamCol = new THREE.Color('#ffffff');

    let pIdx = 0;
    for (let y = 0.08; y < 0.9 && pIdx < targetCount; y += spacing) {
      for (let x = -0.85; x <= 0.85 && pIdx < targetCount; x += spacing) {
        for (let z = -0.4; z <= 0.4 && pIdx < targetCount; z += spacing) {
          const i3 = pIdx * 3;
          this.fallbackPositions[i3] = x + (Math.random() - 0.5) * spacing * 0.1;
          this.fallbackPositions[i3 + 1] = y + (Math.random() - 0.5) * spacing * 0.1;
          this.fallbackPositions[i3 + 2] = z + (Math.random() - 0.5) * spacing * 0.1;
          this.fallbackPrevPositions[i3] = this.fallbackPositions[i3];
          this.fallbackPrevPositions[i3 + 1] = this.fallbackPositions[i3 + 1];
          this.fallbackPrevPositions[i3 + 2] = this.fallbackPositions[i3 + 2];
          pIdx++;
        }
      }
    }
    this.fallbackParticlesCount = pIdx;

    // Create Instanced Mesh
    const sphereGeo = new THREE.SphereGeometry(0.022, 8, 6);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.2,
    });
    this.fallbackMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, targetCount);
    this.fallbackMesh.frustumCulled = false;
    this.fallbackMesh.instanceColor = new THREE.InstancedBufferAttribute(this.fallbackColors, 3);

    for (let i = 0; i < this.fallbackParticlesCount; i++) {
      const i3 = i * 3;
      this.fallbackDummy.position.set(
        this.fallbackPositions[i3],
        this.fallbackPositions[i3 + 1],
        this.fallbackPositions[i3 + 2]
      );
      this.fallbackDummy.scale.set(1, 1, 1);
      this.fallbackDummy.updateMatrix();
      this.fallbackMesh.setMatrixAt(i, this.fallbackDummy.matrix);
      this.fallbackMesh.setColorAt(i, accentCol);
    }
    this.fallbackMesh.instanceMatrix.needsUpdate = true;
    if (this.fallbackMesh.instanceColor) this.fallbackMesh.instanceColor.needsUpdate = true;
    this.fallbackScene.add(this.fallbackMesh);

    // Add Glass Basin Frame
    const boxGeo = new THREE.BoxGeometry(1.8, 1.1, 0.9);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x74c9df, transparent: true, opacity: 0.3 });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    edges.position.set(0, 0.55, 0);
    this.fallbackScene.add(edges);

    host.replaceChildren(this.fallbackRenderer.domElement);
    this.loading = false;
    this.simStateText = this.playing ? 'RUNNING' : 'PAUSED';
    this.solverInfoText = 'WEBGL COMPUTE · SPH PBF';
    this.interactionHint = 'Drag to orbit · Scroll to zoom';
    this.cdr.detectChanges();

    // Start Fallback Animation Loop
    this.fallbackLastFrame = performance.now();
    this.ngZone.runOutsideAngular(() => {
      const loop = (now: number) => {
        this.fallbackAnimId = requestAnimationFrame(loop);
        const dt = Math.min((now - this.fallbackLastFrame) / 1000, 0.033);
        const frameMs = now - this.fallbackLastFrame;
        this.fallbackLastFrame = now;

        if (this.playing && dt > 0) {
          this.stepFallbackPhysics(dt, config);
          this.fallbackSimTime += dt;
        }

        // Update particle visual transforms and colors
        const mesh = this.fallbackMesh;
        const n = this.fallbackParticlesCount;
        for (let i = 0; i < n; i++) {
          const i3 = i * 3;
          this.fallbackDummy.position.set(
            this.fallbackPositions[i3],
            this.fallbackPositions[i3 + 1],
            this.fallbackPositions[i3 + 2]
          );
          const vx = this.fallbackVelocities[i3];
          const vy = this.fallbackVelocities[i3 + 1];
          const vz = this.fallbackVelocities[i3 + 2];
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const t = Math.min(speed / 2.5, 1.0);
          const c = deepCol.clone().lerp(accentCol, t);
          if (speed > 2.0) c.lerp(foamCol, (speed - 2.0) * 0.4);
          mesh.setColorAt(i, c);

          const stretch = 1.0 + Math.min(speed * 0.04, 0.3);
          this.fallbackDummy.scale.set(1.0, stretch, 1.0);
          this.fallbackDummy.updateMatrix();
          mesh.setMatrixAt(i, this.fallbackDummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        this.fallbackControls.update();
        this.fallbackRenderer.render(this.fallbackScene, this.fallbackCamera);

        // Periodically report stats
        if (Math.random() < 0.05) {
          this.ngZone.run(() => {
            this.diagnostics = {
              fps: Math.round(1000 / Math.max(frameMs, 1)),
              frameMs: Number(frameMs.toFixed(1)),
              particles: n,
              time: this.fallbackSimTime,
              substeps: 2,
              iterations: 2,
              limited: false,
            };
            this.cdr.detectChanges();
          });
        }
      };
      this.fallbackAnimId = requestAnimationFrame(loop);
    });
  }

  private stepFallbackPhysics(dt: number, config: Values): void {
    const n = this.fallbackParticlesCount;
    const g = config['gravity'] ?? 9.81;
    const visc = config['viscosity'] ?? 0.02;
    const tension = config['tension'] ?? 0.08;
    const subDt = dt / 2;
    const h = 0.088;
    const h2 = h * h;
    const poly6 = 315 / (64 * Math.PI * Math.pow(h, 9));
    const spikyGrad = -45 / (Math.PI * Math.pow(h, 6));
    const invRho0 = 1 / 1000;
    const mass = 1000 * Math.pow(0.042, 3);
    const invH = 1 / h;

    for (let step = 0; step < 2; step++) {
      // 1. Predict
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        this.fallbackPrevPositions[i3] = this.fallbackPositions[i3];
        this.fallbackPrevPositions[i3 + 1] = this.fallbackPositions[i3 + 1];
        this.fallbackPrevPositions[i3 + 2] = this.fallbackPositions[i3 + 2];

        this.fallbackVelocities[i3 + 1] -= g * subDt;
        this.fallbackPositions[i3] += this.fallbackVelocities[i3] * subDt;
        this.fallbackPositions[i3 + 1] += this.fallbackVelocities[i3 + 1] * subDt;
        this.fallbackPositions[i3 + 2] += this.fallbackVelocities[i3 + 2] * subDt;
      }

      // 2. Spatial Hash
      this.fallbackGridHead.fill(-1);
      const mask = 32767;
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        const cx = Math.floor(this.fallbackPositions[i3] * invH);
        const cy = Math.floor(this.fallbackPositions[i3 + 1] * invH);
        const cz = Math.floor(this.fallbackPositions[i3 + 2] * invH);
        const hash = ((cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791)) & mask;
        this.fallbackGridNext[i] = this.fallbackGridHead[hash];
        this.fallbackGridHead[hash] = i;
      }

      // 3. Density & Lambda
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        const px = this.fallbackPositions[i3];
        const py = this.fallbackPositions[i3 + 1];
        const pz = this.fallbackPositions[i3 + 2];
        let rho = 0;
        let gradSumX = 0, gradSumY = 0, gradSumZ = 0, gradSqSum = 0;

        const cx = Math.floor(px * invH);
        const cy = Math.floor(py * invH);
        const cz = Math.floor(pz * invH);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            for (let oz = -1; oz <= 1; oz++) {
              const hash = (((cx + ox) * 73856093) ^ ((cy + oy) * 19349663) ^ ((cz + oz) * 83492791)) & mask;
              let j = this.fallbackGridHead[hash];
              while (j !== -1) {
                const j3 = j * 3;
                const rx = px - this.fallbackPositions[j3];
                const ry = py - this.fallbackPositions[j3 + 1];
                const rz = pz - this.fallbackPositions[j3 + 2];
                const r2 = rx * rx + ry * ry + rz * rz;
                if (r2 < h2) {
                  const diff = h2 - r2;
                  rho += mass * poly6 * diff * diff * diff;
                  if (r2 > 1e-8) {
                    const r = Math.sqrt(r2);
                    const sp = spikyGrad * (h - r) * (h - r) / r;
                    const gx = rx * sp * mass;
                    const gy = ry * sp * mass;
                    const gz = rz * sp * mass;
                    gradSumX += gx;
                    gradSumY += gy;
                    gradSumZ += gz;
                    gradSqSum += (gx * gx + gy * gy + gz * gz) / mass;
                  }
                }
                j = this.fallbackGridNext[j];
              }
            }
          }
        }
        const constraint = rho * invRho0 - 1.0;
        if (constraint <= 0) {
          this.fallbackLambdas[i] = 0;
        } else {
          const normSq = gradSumX * gradSumX + gradSumY * gradSumY + gradSumZ * gradSumZ;
          const denom = (normSq / mass + gradSqSum) * (invRho0 * invRho0) + 1e-3;
          this.fallbackLambdas[i] = -constraint / denom;
        }
      }

      // 4. Position Correction Solve
      const maxDelta = 0.042 * 0.45;
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        const px = this.fallbackPositions[i3];
        const py = this.fallbackPositions[i3 + 1];
        const pz = this.fallbackPositions[i3 + 2];
        const lamI = this.fallbackLambdas[i];
        let dx = 0, dy = 0, dz = 0;

        const cx = Math.floor(px * invH);
        const cy = Math.floor(py * invH);
        const cz = Math.floor(pz * invH);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            for (let oz = -1; oz <= 1; oz++) {
              const hash = (((cx + ox) * 73856093) ^ ((cy + oy) * 19349663) ^ ((cz + oz) * 83492791)) & mask;
              let j = this.fallbackGridHead[hash];
              while (j !== -1) {
                if (i !== j) {
                  const j3 = j * 3;
                  const rx = px - this.fallbackPositions[j3];
                  const ry = py - this.fallbackPositions[j3 + 1];
                  const rz = pz - this.fallbackPositions[j3 + 2];
                  const r2 = rx * rx + ry * ry + rz * rz;
                  if (r2 < h2 && r2 > 1e-8) {
                    const r = Math.sqrt(r2);
                    const sp = spikyGrad * (h - r) * (h - r) / r;
                    const factor = (lamI + this.fallbackLambdas[j]) * mass * invRho0;
                    dx += rx * sp * factor;
                    dy += ry * sp * factor;
                    dz += rz * sp * factor;
                  }
                }
                j = this.fallbackGridNext[j];
              }
            }
          }
        }
        dx = Math.max(-maxDelta, Math.min(maxDelta, dx));
        dy = Math.max(-maxDelta, Math.min(maxDelta, dy));
        dz = Math.max(-maxDelta, Math.min(maxDelta, dz));
        this.fallbackPositions[i3] += dx;
        this.fallbackPositions[i3 + 1] += dy;
        this.fallbackPositions[i3 + 2] += dz;
      }

      // 5. Bounds & restitution
      const hx = 0.88;
      const hz = 0.42;
      const hy = 1.05;
      const floorY = 0.024;
      for (let i = 0; i < n; i++) {
        const i3 = i * 3;
        if (this.fallbackPositions[i3 + 1] < floorY) {
          this.fallbackPositions[i3 + 1] = floorY;
          this.fallbackVelocities[i3 + 1] *= -0.2;
        } else if (this.fallbackPositions[i3 + 1] > hy) {
          this.fallbackPositions[i3 + 1] = hy;
          this.fallbackVelocities[i3 + 1] *= -0.2;
        }
        if (this.fallbackPositions[i3] < -hx) {
          this.fallbackPositions[i3] = -hx;
          this.fallbackVelocities[i3] *= -0.2;
        } else if (this.fallbackPositions[i3] > hx) {
          this.fallbackPositions[i3] = hx;
          this.fallbackVelocities[i3] *= -0.2;
        }
        if (this.fallbackPositions[i3 + 2] < -hz) {
          this.fallbackPositions[i3 + 2] = -hz;
          this.fallbackVelocities[i3 + 2] *= -0.2;
        } else if (this.fallbackPositions[i3 + 2] > hz) {
          this.fallbackPositions[i3 + 2] = hz;
          this.fallbackVelocities[i3 + 2] *= -0.2;
        }

        // Update velocity
        this.fallbackVelocities[i3] = (this.fallbackPositions[i3] - this.fallbackPrevPositions[i3]) / subDt;
        this.fallbackVelocities[i3 + 1] = (this.fallbackPositions[i3 + 1] - this.fallbackPrevPositions[i3 + 1]) / subDt;
        this.fallbackVelocities[i3 + 2] = (this.fallbackPositions[i3 + 2] - this.fallbackPrevPositions[i3 + 2]) / subDt;
      }
    }
  }

  private disposeWorld(): void {
    if (this.world) {
      this.world.dispose();
      this.world = undefined;
    }
  }

  private disposeFallback(): void {
    if (this.fallbackAnimId !== null) {
      cancelAnimationFrame(this.fallbackAnimId);
      this.fallbackAnimId = null;
    }
    this.fallbackControls?.dispose();
    this.fallbackRenderer?.dispose();
  }

  // =========================================================================
  // ACTIONS & CONTROLS
  // =========================================================================

  togglePlay(): void {
    this.playing = !this.playing;
    if (this.world) this.world.playing = this.playing;
    this.simStateText = this.playing ? 'RUNNING' : 'PAUSED';
  }

  restart(): void {
    this.rebuild(true);
  }

  retry(): void {
    this.rebuild(false);
  }

  resetCamera(): void {
    if (this.world) {
      this.world.resetCamera();
    } else if (this.fallbackControls) {
      this.fallbackCamera.position.fromArray(this.selected.camera);
      this.fallbackControls.target.fromArray(this.selected.target);
      this.fallbackControls.update();
    }
  }

  async capture(): Promise<void> {
    if (this.world) {
      try {
        const blob = await this.world.screenshot();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `particle-fluids-${this.selected.id}-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Snapshot saved');
      } catch (err) {
        console.error('Snapshot failed:', err);
      }
    } else if (this.fallbackRenderer) {
      const link = document.createElement('a');
      link.download = `particle-fluids-${this.selected.id}-${Date.now()}.png`;
      link.href = this.fallbackRenderer.domElement.toDataURL('image/png');
      link.click();
      this.showToast('Snapshot saved');
    }
  }

  resetDefaults(): void {
    this.values = defaults(this.selected);
    this.memory.set(this.selected.id, { ...this.values });
    this.rebuild(true);
  }

  onParamInput(control: Control): void {
    const val = this.values[control.key];
    this.memory.set(this.selected.id, { ...this.values });
    if (!control.restart && this.world) {
      this.world.experiment.setParameter(control.key, val);
    }
  }

  onParamChange(control: Control): void {
    if (control.restart) {
      clearTimeout(this.structuralTimer);
      this.loading = true;
      this.structuralTimer = setTimeout(() => this.rebuild(true), 180);
    }
  }

  onLevelChange(): void {
    this.rebuild(true);
  }

  onSubstepsChange(): void {
    const override = this.substepSelection === 'auto' ? null : Number(this.substepSelection);
    if (this.world) {
      this.world.experiment.loop.substeps = override ?? this.world.experiment.substeps;
    }
  }

  onLoopChange(): void {
    if (this.world) this.world.looping = this.looping;
  }

  onReflectionsChange(): void {
    this.world?.experiment?.setReflections?.(this.reflections);
  }

  onAOChange(): void {
    if (this.world) this.world.ambientOcclusion = this.ambientOcclusion;
  }

  setParticleView(enabled: boolean): void {
    this.particleView = enabled;
    this.world?.experiment?.setParticleView?.(enabled);
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
    this.cdr.detectChanges();
  }
}
