import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Application, Container, Graphics } from 'pixi.js';

export type PixiDemoType = 'galaxy' | 'jelly' | 'constellation' | 'fireworks';

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: number;
  alpha: number;
  angle?: number;
  speed?: number;
  dist?: number;
  decay?: number;
}

interface JellyCritter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: number;
  eyeColor: number;
  stretchX: number;
  stretchY: number;
  targetScaleX: number;
  targetScaleY: number;
  phase: number;
}

@Component({
  selector: 'app-pixijshome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pixijshome.html',
  styleUrl: './pixijshome.scss',
})
export class Pixijshome implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pixiContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  public isBrowser: boolean;
  public app: Application | null = null;
  public activeDemo: PixiDemoType = 'galaxy';

  // Live Performance Stats
  public fps: number = 60;
  public spriteCount: number = 2000;
  public rendererName: string = 'WebGL 2';

  // Interactive Controls
  public particleTargetCount: number = 2500;
  public forceStrength: number = 50; // 0 to 100
  public activeColorPalette: string = 'cyberpunk'; // 'cyberpunk' | 'fire' | 'emerald' | 'rainbow'

  // Pointer tracking
  private pointerX: number = 0;
  private pointerY: number = 0;
  private isPointerDown: boolean = false;
  private isPointerOver: boolean = false;

  // Pixi Scene Layers
  private mainStage: Container | null = null;
  private gfxLayer: Graphics | null = null;

  // Simulation Entities
  private galaxyParticles: ParticleNode[] = [];
  private jellyCritters: JellyCritter[] = [];
  private constellationNodes: ParticleNode[] = [];
  private fireworkSparks: ParticleNode[] = [];

  // FPS calculation
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {}

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.initPixiApp();
    this.switchDemo(this.activeDemo);
  }

  ngOnDestroy(): void {
    if (this.app) {
      try {
        this.app.destroy(true, { children: true });
      } catch (e) {
        console.warn('Pixi app destroy notice:', e);
      }
      this.app = null;
    }
  }

  // =========================================================================
  // PIXI.JS V8 APPLICATION INITIALIZATION
  // =========================================================================
  private async initPixiApp(): Promise<void> {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.pointerX = width / 2;
    this.pointerY = height / 2;

    this.app = new Application();
    await this.app.init({
      width,
      height,
      backgroundColor: 0x090c15,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    container.appendChild(this.app.canvas);

    // Main scene container
    this.mainStage = new Container();
    this.gfxLayer = new Graphics();
    this.mainStage.addChild(this.gfxLayer);
    this.app.stage.addChild(this.mainStage);

    // Renderer info
    this.rendererName = this.app.renderer.type ? 'WebGL 2 Accelerated' : 'WebGPU / WebGL';

    // Event Listeners
    window.addEventListener('resize', this.onResize.bind(this));

    // Pointer events on canvas
    const canvas = this.app.canvas;
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.isPointerOver = true;
    });

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      if (this.activeDemo === 'fireworks') {
        const rect = canvas.getBoundingClientRect();
        this.spawnFirework(e.clientX - rect.left, e.clientY - rect.top);
      }
    });

    canvas.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    canvas.addEventListener('pointerleave', () => {
      this.isPointerOver = false;
    });

    // Start simulation ticker
    this.app.ticker.add((ticker) => {
      this.updateLoop(ticker.deltaTime);
    });
  }

  private onResize(): void {
    if (!this.app || !this.containerRef) return;
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.app.renderer.resize(width, height);
  }

  // =========================================================================
  // DEMO SWITCHING & DATA SETUP
  // =========================================================================
  public switchDemo(demo: PixiDemoType): void {
    this.activeDemo = demo;
    if (!this.app || !this.gfxLayer) return;

    this.gfxLayer.clear();
    this.galaxyParticles = [];
    this.jellyCritters = [];
    this.constellationNodes = [];
    this.fireworkSparks = [];

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    if (demo === 'galaxy') {
      this.initGalaxyDemo(width, height);
    } else if (demo === 'jelly') {
      this.initJellyDemo(width, height);
    } else if (demo === 'constellation') {
      this.initConstellationDemo(width, height);
    } else if (demo === 'fireworks') {
      this.initFireworksDemo(width, height);
    }

    this.cdr.detectChanges();
  }

  // 1. Nebula Whirlpool Particle Swarm
  private initGalaxyDemo(width: number, height: number): void {
    this.particleTargetCount = 2500;
    const count = this.particleTargetCount;
    this.spriteCount = count;
    const cx = width / 2;
    const cy = height / 2;

    const colors = this.getPaletteColors();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.pow(Math.random(), 0.7) * (Math.min(width, height) * 0.42);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.galaxyParticles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        angle,
        dist,
        speed: 0.005 + Math.random() * 0.015,
        radius: 1.2 + Math.random() * 2.2,
        color,
        alpha: 0.35 + Math.random() * 0.65,
      });
    }
  }

  // 2. Bouncing Jelly Critters
  private initJellyDemo(width: number, height: number): void {
    const count = 90;
    this.spriteCount = count;
    const colors = this.getPaletteColors();

    for (let i = 0; i < count; i++) {
      const baseRadius = 14 + Math.random() * 22;
      const color = colors[i % colors.length];

      this.jellyCritters.push({
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        baseRadius,
        color,
        eyeColor: 0xffffff,
        stretchX: 1,
        stretchY: 1,
        targetScaleX: 1,
        targetScaleY: 1,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // 3. Cyber Constellation Web
  private initConstellationDemo(width: number, height: number): void {
    const count = 160;
    this.spriteCount = count;
    const colors = this.getPaletteColors();

    for (let i = 0; i < count; i++) {
      this.constellationNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        radius: 2.5 + Math.random() * 2.5,
        color: colors[i % colors.length],
        alpha: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // 4. Orbital Fireworks Burst
  private initFireworksDemo(width: number, height: number): void {
    this.spriteCount = 0;
    // Spawn initial bursts
    for (let b = 0; b < 3; b++) {
      const bx = width * 0.25 + Math.random() * (width * 0.5);
      const by = height * 0.25 + Math.random() * (height * 0.4);
      this.spawnFirework(bx, by);
    }
  }

  public spawnFirework(x: number, y: number): void {
    const sparkCount = 140;
    const colors = this.getPaletteColors();
    const burstColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.2;
      const speed = 2.0 + Math.random() * 6.5;

      this.fireworkSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.8 + Math.random() * 2.2,
        color: burstColor,
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.016,
      });
    }
  }

  // =========================================================================
  // ANIMATION LOOP & SIMULATION UPDATE
  // =========================================================================
  private updateLoop(dt: number): void {
    if (!this.app || !this.gfxLayer) return;

    this.calculateFps();

    const gfx = this.gfxLayer;
    gfx.clear();

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    if (this.activeDemo === 'galaxy') {
      this.updateGalaxy(gfx, width, height, dt);
    } else if (this.activeDemo === 'jelly') {
      this.updateJelly(gfx, width, height, dt);
    } else if (this.activeDemo === 'constellation') {
      this.updateConstellation(gfx, width, height, dt);
    } else if (this.activeDemo === 'fireworks') {
      this.updateFireworks(gfx, width, height, dt);
    }
  }

  private updateGalaxy(gfx: Graphics, width: number, height: number, dt: number): void {
    const cx = this.isPointerOver ? this.pointerX : width / 2;
    const cy = this.isPointerOver ? this.pointerY : height / 2;
    const forceFactor = (this.forceStrength / 50) * (this.isPointerDown ? 2.5 : 1.0);

    for (let i = 0; i < this.galaxyParticles.length; i++) {
      const p = this.galaxyParticles[i];
      p.angle! += p.speed! * dt * forceFactor;

      // Distance wobble
      const targetDist = p.dist!;
      const currentDist = targetDist + Math.sin(p.angle! * 3) * 12;

      p.x = cx + Math.cos(p.angle!) * currentDist;
      p.y = cy + Math.sin(p.angle!) * currentDist;

      // Draw particle circle with Pixi v8 Graphics API
      gfx.circle(p.x, p.y, p.radius);
      gfx.fill({ color: p.color, alpha: p.alpha });
    }
  }

  private updateJelly(gfx: Graphics, width: number, height: number, dt: number): void {
    for (let i = 0; i < this.jellyCritters.length; i++) {
      const j = this.jellyCritters[i];

      // Move
      j.x += j.vx * dt;
      j.y += j.vy * dt;

      // Pointer avoidance / chase
      if (this.isPointerOver) {
        const dx = this.pointerX - j.x;
        const dy = this.pointerY - j.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 1) {
          const repel = (180 - dist) / 180;
          const sign = this.isPointerDown ? 1.5 : -1.5;
          j.vx += (dx / dist) * repel * sign * 0.8;
          j.vy += (dy / dist) * repel * sign * 0.8;
        }
      }

      // Drag
      j.vx *= 0.985;
      j.vy *= 0.985;

      // Bounce off walls with squash-and-stretch
      if (j.x < j.baseRadius) {
        j.x = j.baseRadius;
        j.vx = -j.vx * 0.9;
        j.stretchX = 0.6;
        j.stretchY = 1.4;
      } else if (j.x > width - j.baseRadius) {
        j.x = width - j.baseRadius;
        j.vx = -j.vx * 0.9;
        j.stretchX = 0.6;
        j.stretchY = 1.4;
      }

      if (j.y < j.baseRadius) {
        j.y = j.baseRadius;
        j.vy = -j.vy * 0.9;
        j.stretchX = 1.4;
        j.stretchY = 0.6;
      } else if (j.y > height - j.baseRadius) {
        j.y = height - j.baseRadius;
        j.vy = -j.vy * 0.9;
        j.stretchX = 1.4;
        j.stretchY = 0.6;
      }

      // Spring stretch back to 1.0
      j.stretchX += (1.0 - j.stretchX) * 0.1;
      j.stretchY += (1.0 - j.stretchY) * 0.1;

      // Draw cute jelly body (Ellipse with stretch)
      const radX = j.baseRadius * j.stretchX;
      const radY = j.baseRadius * j.stretchY;

      gfx.ellipse(j.x, j.y, radX, radY);
      gfx.fill({ color: j.color, alpha: 0.85 });
      gfx.stroke({ width: 2, color: 0xffffff, alpha: 0.35 });

      // Draw cute expressive eyes
      const eyeOffset = radX * 0.35;
      const eyeY = j.y - radY * 0.15;
      gfx.circle(j.x - eyeOffset, eyeY, radX * 0.22);
      gfx.fill({ color: 0xffffff, alpha: 0.95 });
      gfx.circle(j.x + eyeOffset, eyeY, radX * 0.22);
      gfx.fill({ color: 0xffffff, alpha: 0.95 });

      // Pupils looking toward velocity
      const lookX = Math.max(-3, Math.min(3, j.vx * 0.8));
      const lookY = Math.max(-3, Math.min(3, j.vy * 0.8));
      gfx.circle(j.x - eyeOffset + lookX, eyeY + lookY, radX * 0.11);
      gfx.fill({ color: 0x09090b, alpha: 1.0 });
      gfx.circle(j.x + eyeOffset + lookX, eyeY + lookY, radX * 0.11);
      gfx.fill({ color: 0x09090b, alpha: 1.0 });
    }
  }

  private updateConstellation(gfx: Graphics, width: number, height: number, dt: number): void {
    const nodes = this.constellationNodes;
    const maxLinkDist = 110;

    // 1. Move nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      if (n.x < 0 || n.x > width) n.vx = -n.vx;
      if (n.y < 0 || n.y > height) n.vy = -n.vy;
    }

    // 2. Draw connecting proximity lines
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxLinkDist) {
          const alpha = (1.0 - dist / maxLinkDist) * 0.45;
          gfx.moveTo(n1.x, n1.y);
          gfx.lineTo(n2.x, n2.y);
          gfx.stroke({ width: 1.2, color: n1.color, alpha });
        }
      }

      // Link with mouse cursor
      if (this.isPointerOver) {
        const mdx = this.pointerX - n1.x;
        const mdy = this.pointerY - n1.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < 160) {
          const mAlpha = (1.0 - mDist / 160) * 0.7;
          gfx.moveTo(n1.x, n1.y);
          gfx.lineTo(this.pointerX, this.pointerY);
          gfx.stroke({ width: 1.8, color: 0x00f2fe, alpha: mAlpha });
        }
      }

      // Draw node circle
      gfx.circle(n1.x, n1.y, n1.radius);
      gfx.fill({ color: n1.color, alpha: n1.alpha });
    }
  }

  private updateFireworks(gfx: Graphics, width: number, height: number, dt: number): void {
    for (let i = this.fireworkSparks.length - 1; i >= 0; i--) {
      const s = this.fireworkSparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 0.08 * dt; // Gravity
      s.vx *= 0.985;
      s.vy *= 0.985;
      s.alpha -= (s.decay || 0.015) * dt;

      if (s.alpha <= 0) {
        this.fireworkSparks.splice(i, 1);
        continue;
      }

      gfx.circle(s.x, s.y, s.radius * s.alpha);
      gfx.fill({ color: s.color, alpha: s.alpha });
    }

    this.spriteCount = this.fireworkSparks.length;

    // Auto trigger new fireworks periodically
    if (Math.random() < 0.03 && this.fireworkSparks.length < 800) {
      const rx = width * 0.2 + Math.random() * (width * 0.6);
      const ry = height * 0.15 + Math.random() * (height * 0.5);
      this.spawnFirework(rx, ry);
    }
  }

  // =========================================================================
  // UTILITIES & PALETTES
  // =========================================================================
  public setPalette(pal: string): void {
    this.activeColorPalette = pal;
    this.switchDemo(this.activeDemo);
  }

  private getPaletteColors(): number[] {
    if (this.activeColorPalette === 'cyberpunk') {
      return [0x00f2fe, 0x4facfe, 0xfa709a, 0xfee140, 0x38bdf8, 0xa855f7];
    } else if (this.activeColorPalette === 'fire') {
      return [0xff4500, 0xff8c00, 0xffd700, 0xff0000, 0xf97316];
    } else if (this.activeColorPalette === 'emerald') {
      return [0x10b981, 0x34d399, 0x059669, 0x065f46, 0x22c55e, 0x6ee7b7];
    }
    // Rainbow
    return [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
  }

  private calculateFps(): void {
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
  }
}
