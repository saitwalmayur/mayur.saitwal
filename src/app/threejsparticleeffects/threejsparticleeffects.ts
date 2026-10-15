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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ParticleEffectItem {
  id: 'galaxy' | 'supernova' | 'dna' | 'cyberRain' | 'blackHole' | 'torusWarp';
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-threejsparticleeffects',
  imports: [CommonModule, RouterLink],
  templateUrl: './threejsparticleeffects.html',
  styleUrl: './threejsparticleeffects.scss',
})
export class Threejsparticleeffects implements AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewportContainer') containerRef!: ElementRef<HTMLDivElement>;

  readonly effectOptions: ParticleEffectItem[] = [
    {
      id: 'galaxy',
      name: 'Spiral Galaxy',
      icon: '🌀',
      description: '4-arm golden spiral galaxy with Keplerian orbital angular momentum',
    },
    {
      id: 'supernova',
      name: 'Supernova Burst',
      icon: '🎆',
      description: 'Continuous spherical kinetic explosion with radial shockwave cycles',
    },
    {
      id: 'dna',
      name: 'DNA Double Helix',
      icon: '🧬',
      description: 'Dual helical intertwined strands connected by horizontal base rungs',
    },
    {
      id: 'cyberRain',
      name: 'Matrix Cyber Rain',
      icon: '🌧️',
      description: 'High-speed vertical digital rain with floor collision splash dynamics',
    },
    {
      id: 'blackHole',
      name: 'Black Hole Event Horizon',
      icon: '🕳️',
      description: 'Relativistic accretion disk with extreme core gravity and polar relativistic jets',
    },
    {
      id: 'torusWarp',
      name: 'Torus Quantum Flux',
      icon: '🪐',
      description: 'Continuous dual-axis toroidal surface vortex with harmonic wave undulations',
    },
  ];

  activeEffectId: 'galaxy' | 'supernova' | 'dna' | 'cyberRain' | 'blackHole' | 'torusWarp' = 'galaxy';
  particleTheme: 'cyber' | 'cosmic' | 'fire' | 'matrix' | 'ice' = 'cyber';
  particleCount = 6000;
  simulationSpeed = 1.0;
  autoRotate = true;
  isDockCollapsed = false;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private isBrowser = false;

  private particleSystem: THREE.Points | null = null;
  private positions!: Float32Array;
  private originalData!: Float32Array; // extra per-particle data (radius, angle, speed, etc.)
  private mouse = new THREE.Vector2(0, 0);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  get currentEffect(): ParticleEffectItem {
    return this.effectOptions.find((e) => e.id === this.activeEffectId) || this.effectOptions[0];
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.initThree();
    }
  }

  toggleDock() {
    this.isDockCollapsed = !this.isDockCollapsed;
    this.cdr.detectChanges();
  }

  selectEffect(effectId: 'galaxy' | 'supernova' | 'dna' | 'cyberRain' | 'blackHole' | 'torusWarp') {
    if (this.activeEffectId === effectId) return;
    this.activeEffectId = effectId;
    if (this.scene) {
      this.rebuildParticles();
    }
    this.cdr.detectChanges();
  }

  setTheme(theme: 'cyber' | 'cosmic' | 'fire' | 'matrix' | 'ice') {
    this.particleTheme = theme;
    if (this.scene) {
      this.rebuildParticles();
    }
    this.cdr.detectChanges();
  }

  onSpeedChange(event: Event) {
    this.simulationSpeed = parseFloat((event.target as HTMLInputElement).value);
  }

  setParticleCount(count: number) {
    this.particleCount = count;
    if (this.scene) {
      this.rebuildParticles();
    }
    this.cdr.detectChanges();
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0e0e18, 0.035);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 2.5, 6);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 1.5;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 1.0;

    this.rebuildParticles();
    this.animate();
  }

  private rebuildParticles() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.Material).dispose();
      this.particleSystem = null;
    }

    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.originalData = new Float32Array(count * 4); // [r/data1, theta/data2, speed/data3, phase/data4]
    const colors = new Float32Array(count * 3);

    const { colorA, colorB, colorCore } = this.getThemeColors(this.particleTheme);

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0;
      let d1 = 0, d2 = 0, d3 = 0, d4 = 0;
      let colorFactor = Math.random();

      switch (this.activeEffectId) {
        case 'supernova': {
          // Spherical velocity burst
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * Math.PI * 2;
          const speed = 0.8 + Math.random() * 2.5;
          const phase = Math.random() * 5.0; // staggered spawn offset

          d1 = Math.sin(phi) * Math.cos(theta); // normalized vx
          d2 = Math.sin(phi) * Math.sin(theta); // normalized vy
          d3 = Math.cos(phi);                  // normalized vz
          d4 = speed;                          // velocity multiplier

          x = d1 * 0.1;
          y = d2 * 0.1;
          z = d3 * 0.1;
          colorFactor = speed / 3.3;
          break;
        }

        case 'dna': {
          // Double Helix strands + connecting rungs
          const t = (i / count) * 10 - 5; // y-span [-5, 5]
          const strand = i % 3;
          const angle = t * 2.2;
          const radius = 1.6;

          if (strand === 0) {
            x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.15;
            z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.15;
            y = t;
            colorFactor = 0.1;
          } else if (strand === 1) {
            x = Math.cos(angle + Math.PI) * radius + (Math.random() - 0.5) * 0.15;
            z = Math.sin(angle + Math.PI) * radius + (Math.random() - 0.5) * 0.15;
            y = t;
            colorFactor = 0.9;
          } else {
            // Horizontal ladder bridge rungs
            const lerpFactor = Math.random();
            const x1 = Math.cos(angle) * radius;
            const z1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle + Math.PI) * radius;
            const z2 = Math.sin(angle + Math.PI) * radius;
            x = THREE.MathUtils.lerp(x1, x2, lerpFactor);
            z = THREE.MathUtils.lerp(z1, z2, lerpFactor);
            y = t + (Math.random() - 0.5) * 0.05;
            colorFactor = 0.5;
          }

          d1 = radius;
          d2 = angle;
          d3 = t;
          d4 = strand;
          break;
        }

        case 'cyberRain': {
          // Falling neon streaming columns
          x = (Math.random() - 0.5) * 10;
          z = (Math.random() - 0.5) * 10;
          y = (Math.random() - 0.5) * 8;
          const fallSpeed = 3.5 + Math.random() * 4.5;

          d1 = x;
          d2 = z;
          d3 = fallSpeed;
          d4 = Math.random() * Math.PI * 2; // shimmer phase
          colorFactor = (y + 4) / 8;
          break;
        }

        case 'blackHole': {
          // Rapid relativistic accretion disk + polar high-energy jets
          const isJet = i < count * 0.12; // 12% in polar jets
          if (isJet) {
            const dir = i % 2 === 0 ? 1 : -1;
            const jetDist = Math.random() * 5.0;
            const jetSpread = Math.pow(jetDist / 5, 1.8) * 0.45;
            x = (Math.random() - 0.5) * jetSpread;
            z = (Math.random() - 0.5) * jetSpread;
            y = dir * (0.4 + jetDist);
            d1 = 0; // mark as jet
            d2 = dir;
            d3 = 3.0 + Math.random() * 3.0;
            d4 = jetDist;
            colorFactor = 1.0;
          } else {
            // Accretion disk
            const radius = 0.7 + Math.pow(Math.random(), 1.5) * 4.2;
            const theta = Math.random() * Math.PI * 2;
            x = Math.cos(theta) * radius;
            z = Math.sin(theta) * radius;
            y = (Math.random() - 0.5) * (0.12 + radius * 0.04);
            d1 = radius;
            d2 = theta;
            d3 = 2.5 / Math.sqrt(radius); // Keplerian orbital speed
            d4 = y;
            colorFactor = (radius - 0.7) / 4.2;
          }
          break;
        }

        case 'torusWarp': {
          // Torus Surface Field
          const R = 2.4;
          const r = 0.95 + (Math.random() - 0.5) * 0.2;
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          x = (R + r * Math.cos(v)) * Math.cos(u);
          z = (R + r * Math.cos(v)) * Math.sin(u);
          y = r * Math.sin(v);

          d1 = u;
          d2 = v;
          d3 = r;
          d4 = Math.random() * Math.PI * 2;
          colorFactor = (Math.sin(v) + 1) * 0.5;
          break;
        }

        case 'galaxy':
        default: {
          // 4-arm logarithmic spiral galaxy
          const arm = i % 4;
          const radius = Math.pow(Math.random(), 0.65) * 4.8;
          const spin = radius * 1.4;
          const angle = (arm * Math.PI) / 2 + spin + (Math.random() - 0.5) * 0.45;

          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          y = (Math.random() - 0.5) * (0.8 / (1 + radius * 0.6));

          d1 = radius;
          d2 = angle;
          d3 = 0.8 / (0.8 + radius); // flat rotation curve
          d4 = y;
          colorFactor = radius / 4.8;
          break;
        }
      }

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      // Color computation
      const mixedColor = colorCore
        ? colorCore.clone().lerp(colorA.clone().lerp(colorB, colorFactor), Math.min(1, colorFactor + 0.15))
        : colorA.clone().lerp(colorB, colorFactor);

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointSize = this.activeEffectId === 'supernova' ? 0.055 : 0.042;
    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  private getThemeColors(theme: 'cyber' | 'cosmic' | 'fire' | 'matrix' | 'ice') {
    switch (theme) {
      case 'cosmic':
        return {
          colorCore: new THREE.Color(0xffffff),
          colorA: new THREE.Color(0xff007f),
          colorB: new THREE.Color(0x7928ca),
        };
      case 'fire':
        return {
          colorCore: new THREE.Color(0xffffff),
          colorA: new THREE.Color(0xffaa00),
          colorB: new THREE.Color(0xf12711),
        };
      case 'matrix':
        return {
          colorCore: new THREE.Color(0xffffff),
          colorA: new THREE.Color(0x00ff88),
          colorB: new THREE.Color(0x006633),
        };
      case 'ice':
        return {
          colorCore: new THREE.Color(0xffffff),
          colorA: new THREE.Color(0x70e1ff),
          colorB: new THREE.Color(0x0052d4),
        };
      case 'cyber':
      default:
        return {
          colorCore: new THREE.Color(0xffffff),
          colorA: new THREE.Color(0x00f2fe),
          colorB: new THREE.Color(0x4facfe),
        };
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.containerRef) return;
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 2.5, 6);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const dt = 0.016 * this.simulationSpeed;
    const time = Date.now() * 0.001 * this.simulationSpeed;

    if (this.controls) {
      this.controls.update();
    }

    if (this.particleSystem && this.positions && this.originalData) {
      const positionAttr = this.particleSystem.geometry.attributes['position'] as THREE.BufferAttribute;
      const pos = positionAttr.array as Float32Array;
      const count = this.particleCount;

      switch (this.activeEffectId) {
        case 'galaxy': {
          for (let i = 0; i < count; i++) {
            const r = this.originalData[i * 4];
            let angle = this.originalData[i * 4 + 1];
            const speed = this.originalData[i * 4 + 2];
            const origY = this.originalData[i * 4 + 3];

            angle += speed * dt * 0.6;
            this.originalData[i * 4 + 1] = angle;

            pos[i * 3] = Math.cos(angle) * r;
            pos[i * 3 + 1] = origY + Math.sin(time * 2 + r * 2) * 0.08;
            pos[i * 3 + 2] = Math.sin(angle) * r;
          }
          break;
        }

        case 'supernova': {
          const maxDist = 5.2;
          for (let i = 0; i < count; i++) {
            const vx = this.originalData[i * 4];
            const vy = this.originalData[i * 4 + 1];
            const vz = this.originalData[i * 4 + 2];
            const speed = this.originalData[i * 4 + 3];

            pos[i * 3] += vx * speed * dt;
            pos[i * 3 + 1] += vy * speed * dt;
            pos[i * 3 + 2] += vz * speed * dt;

            const dist = Math.sqrt(
              pos[i * 3] * pos[i * 3] +
              pos[i * 3 + 1] * pos[i * 3 + 1] +
              pos[i * 3 + 2] * pos[i * 3 + 2]
            );

            if (dist > maxDist) {
              // Reset to core with slight jitter
              pos[i * 3] = vx * 0.05;
              pos[i * 3 + 1] = vy * 0.05;
              pos[i * 3 + 2] = vz * 0.05;
            }
          }
          break;
        }

        case 'dna': {
          const wave = Math.sin(time * 1.5) * 0.2;
          for (let i = 0; i < count; i++) {
            const radius = this.originalData[i * 4];
            let angle = this.originalData[i * 4 + 1];
            const t = this.originalData[i * 4 + 2];
            const strand = this.originalData[i * 4 + 3];

            const currentAngle = angle + time * 0.8;

            if (strand === 0) {
              pos[i * 3] = Math.cos(currentAngle) * radius;
              pos[i * 3 + 1] = t + wave;
              pos[i * 3 + 2] = Math.sin(currentAngle) * radius;
            } else if (strand === 1) {
              pos[i * 3] = Math.cos(currentAngle + Math.PI) * radius;
              pos[i * 3 + 1] = t + wave;
              pos[i * 3 + 2] = Math.sin(currentAngle + Math.PI) * radius;
            } else {
              const x1 = Math.cos(currentAngle) * radius;
              const z1 = Math.sin(currentAngle) * radius;
              const x2 = Math.cos(currentAngle + Math.PI) * radius;
              const z2 = Math.sin(currentAngle + Math.PI) * radius;
              const lerpFactor = (i % 10) / 10;
              pos[i * 3] = THREE.MathUtils.lerp(x1, x2, lerpFactor);
              pos[i * 3 + 1] = t + wave;
              pos[i * 3 + 2] = THREE.MathUtils.lerp(z1, z2, lerpFactor);
            }
          }
          break;
        }

        case 'cyberRain': {
          const floorY = -4.2;
          const ceilingY = 4.2;
          for (let i = 0; i < count; i++) {
            const speed = this.originalData[i * 4 + 2];
            pos[i * 3 + 1] -= speed * dt;

            if (pos[i * 3 + 1] < floorY) {
              pos[i * 3 + 1] = ceilingY;
              pos[i * 3] = (Math.random() - 0.5) * 10;
              pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            }
          }
          break;
        }

        case 'blackHole': {
          for (let i = 0; i < count; i++) {
            const isJet = this.originalData[i * 4] === 0;
            if (isJet) {
              const dir = this.originalData[i * 4 + 1];
              const jetSpeed = this.originalData[i * 4 + 2];
              pos[i * 3 + 1] += dir * jetSpeed * dt;

              if (Math.abs(pos[i * 3 + 1]) > 5.5) {
                pos[i * 3 + 1] = dir * 0.4;
                pos[i * 3] = (Math.random() - 0.5) * 0.1;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
              }
            } else {
              let r = this.originalData[i * 4];
              let theta = this.originalData[i * 4 + 1];
              const omega = this.originalData[i * 4 + 2];
              const origY = this.originalData[i * 4 + 3];

              theta += omega * dt * 0.7;
              r -= 0.15 * dt; // slow pull towards singularity

              if (r < 0.6) {
                r = 4.2; // respawn at outer rim
              }

              this.originalData[i * 4] = r;
              this.originalData[i * 4 + 1] = theta;

              pos[i * 3] = Math.cos(theta) * r;
              pos[i * 3 + 1] = origY;
              pos[i * 3 + 2] = Math.sin(theta) * r;
            }
          }
          break;
        }

        case 'torusWarp': {
          const R = 2.4;
          for (let i = 0; i < count; i++) {
            let u = this.originalData[i * 4];
            let v = this.originalData[i * 4 + 1];
            const r = this.originalData[i * 4 + 2];

            u += 0.4 * dt;
            v += 0.7 * dt;

            this.originalData[i * 4] = u;
            this.originalData[i * 4 + 1] = v;

            pos[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
            pos[i * 3 + 1] = r * Math.sin(v) + Math.sin(u * 3 + time * 2) * 0.15;
            pos[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
          }
          break;
        }
      }

      positionAttr.needsUpdate = true;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

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
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.particleSystem) {
      this.scene?.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.Material).dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
