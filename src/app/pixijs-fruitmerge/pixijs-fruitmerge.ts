import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Inject,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  Text,
  TextStyle,
  Assets,
} from 'pixi.js';
import { FRUIT_TIERS, FruitTierConfig } from './fruit-types';
import { FruitAudioService } from './fruit-audio.service';

export interface FruitBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  rotation: number;
  vRot: number;
  sprite: Sprite;
  container: Container;
  isMerging: boolean;
  scaleFactor: number;
  targetScale: number;
  dangerTime: number; // Seconds spent resting above danger line
}

export interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  alpha: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

@Component({
  selector: 'app-pixijs-fruitmerge',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pixijs-fruitmerge.html',
  styleUrl: './pixijs-fruitmerge.scss',
})
export class PixijsFruitmerge implements OnInit, OnDestroy {
  @ViewChild('canvasHost', { static: true })
  canvasHostRef!: ElementRef<HTMLDivElement>;

  // Game Dimensions (Glass container logical space)
  readonly boxWidth = 420;
  readonly boxHeight = 620;
  readonly wallLeft = 18;
  readonly wallRight = 402;
  readonly floorY = 596;
  readonly dangerLineY = 115;
  readonly dropY = 48;
  readonly svgScaleRatio = 256 / 244; // SVG body has r=122 in 256 box; this scales sprite to exact pixel match

  // Game State
  score = 0;
  bestScore = 0;
  comboCount = 0;
  comboTimer = 0;
  isGameOver = false;
  isPaused = false;
  canDrop = true;
  dropCooldown = 0;
  dangerWarning = false;

  // Dropper
  dropperTier = 0;
  nextTier = 1;
  dropperX = 210;
  isAiming = false;

  // PixiJS
  app: Application | null = null;
  private worldContainer!: Container;
  private fruitsContainer!: Container;
  private particlesContainer!: Container;
  private uiOverlayContainer!: Container;
  private glassBoxGfx!: Graphics;
  private guideLineGfx!: Graphics;
  private particlesGfx!: Graphics;
  private dropperSprite!: Sprite;
  private dropperFruitGfx!: Graphics;

  // Fruit Entities & Textures
  fruits: FruitBody[] = [];
  fruitTextures: Map<number, Texture> = new Map();
  private nextId = 1;
  private particles: JuiceParticle[] = [];
  floatingScores: FloatingScore[] = [];

  // Ticker handle
  private tickerFn: ((ticker: { deltaTime: number }) => void) | null = null;
  private isBrowser = false;
  private soundEnabled = true;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    public audio: FruitAudioService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get currentFruitConfig(): FruitTierConfig {
    return FRUIT_TIERS[this.dropperTier] || FRUIT_TIERS[0];
  }

  get nextFruitConfig(): FruitTierConfig {
    return FRUIT_TIERS[this.nextTier] || FRUIT_TIERS[0];
  }

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;

    // Load High Score from localStorage
    try {
      const saved = localStorage.getItem('fruitmerge_best_score');
      if (saved) this.bestScore = parseInt(saved, 10) || 0;
    } catch {
      this.bestScore = 0;
    }

    this.rollNextDropperFruits(true);
    await this.initPixiApp();
  }

  ngOnDestroy(): void {
    if (this.app) {
      if (this.tickerFn) {
        this.app.ticker.remove(this.tickerFn);
        this.tickerFn = null;
      }
      this.app.destroy(true, { children: true, texture: false });
      this.app = null;
    }
  }

  // ---------------------------------------------------------------------------
  // PIXI APPLICATION INITIALIZATION
  // ---------------------------------------------------------------------------
  private async initPixiApp(): Promise<void> {
    const host = this.canvasHostRef.nativeElement;

    this.app = new Application();
    await this.app.init({
      width: this.boxWidth,
      height: this.boxHeight,
      backgroundColor: 0x0f172a,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 2, 2.5),
      autoDensity: true,
      antialias: true,
    });

    host.appendChild(this.app.canvas);

    // Root Containers
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.glassBoxGfx = new Graphics();
    this.worldContainer.addChild(this.glassBoxGfx);

    this.guideLineGfx = new Graphics();
    this.worldContainer.addChild(this.guideLineGfx);

    this.fruitsContainer = new Container();
    this.worldContainer.addChild(this.fruitsContainer);

    this.particlesGfx = new Graphics();
    this.worldContainer.addChild(this.particlesGfx);

    this.uiOverlayContainer = new Container();
    this.worldContainer.addChild(this.uiOverlayContainer);

    // Build or Load Fruit Textures
    await this.loadFruitTextures();

    // Create Dropper Visual Indicator
    this.dropperSprite = new Sprite();
    this.dropperSprite.anchor.set(0.5);
    this.dropperSprite.y = this.dropY;
    this.uiOverlayContainer.addChild(this.dropperSprite);
    this.updateDropperVisual();

    // Draw Glass Container Box
    this.renderGlassAquarium();

    // Set up Ticker Physics Loop
    this.tickerFn = (ticker: { deltaTime: number }) => {
      this.updateGameLoop(ticker.deltaTime);
    };
    this.app.ticker.add(this.tickerFn);
  }

  // ---------------------------------------------------------------------------
  // TEXTURE GENERATION / LOADING
  // ---------------------------------------------------------------------------
  private async loadFruitTextures(): Promise<void> {
    for (const config of FRUIT_TIERS) {
      try {
        const svgPath = `assets/fruitmerge/${config.svgName}`;
        const tex = await Assets.load(svgPath);
        if (tex) {
          this.fruitTextures.set(config.tier, tex);
          continue;
        }
      } catch {
        // Fallback to high-res procedural canvas texture
      }
      // Generate crisp fallback texture
      const canvasTex = this.generateFallbackCanvasTexture(config);
      this.fruitTextures.set(config.tier, canvasTex);
    }
  }

  private generateFallbackCanvasTexture(config: FruitTierConfig): Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;
    const r = 122;

    // Outer Glow / Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Body Gradient
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, config.cssColor);
    grad.addColorStop(1, '#000000');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Watermelon Stripes for Tier 9 & 10
    if (config.tier >= 9) {
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = -2; i <= 2; i++) {
        const sx = cx + i * (r * 0.35);
        ctx.beginPath();
        ctx.moveTo(sx - 10, cy - r + 15);
        ctx.quadraticCurveTo(sx + 20, cy, sx - 15, cy + r - 15);
        ctx.stroke();
      }
    }

    // Specular Highlight
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    // Cute Cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.48, cy + r * 0.15, r * 0.18, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.48, cy + r * 0.15, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Cute / Grumpy Face
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(3, r * 0.06);
    ctx.lineCap = 'round';

    // Eyes
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.05, r * 0.09, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.28, cy - r * 0.05, r * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Eye Glints
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.31, cy - r * 0.08, r * 0.03, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.25, cy - r * 0.08, r * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (Frown / Cute Pout)
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.3, r * 0.18, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();

    return Texture.from(canvas);
  }

  // ---------------------------------------------------------------------------
  // GLASS AQUARIUM RENDERING
  // ---------------------------------------------------------------------------
  private renderGlassAquarium(): void {
    const g = this.glassBoxGfx;
    g.clear();

    const w = this.boxWidth;
    const h = this.boxHeight;
    const wl = this.wallLeft;
    const wr = this.wallRight;
    const fy = this.floorY;

    // Inner Glass Refraction / Tint
    g.roundRect(wl, 70, wr - wl, fy - 70, 16);
    g.fill({ color: 0x38bdf8, alpha: 0.06 });

    // Glass Side Walls
    g.moveTo(wl, 60);
    g.lineTo(wl, fy);
    g.stroke({ width: 7, color: 0xbae6fd, alpha: 0.75 });

    g.moveTo(wr, 60);
    g.lineTo(wr, fy);
    g.stroke({ width: 7, color: 0xbae6fd, alpha: 0.75 });

    // Inner Specular Bevel Line (Left)
    g.moveTo(wl + 5, 80);
    g.lineTo(wl + 5, fy - 10);
    g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

    // Bottom Base Platform Shelf
    g.roundRect(wl - 10, fy, (wr - wl) + 20, 18, 6);
    g.fill({ color: 0x64748b, alpha: 0.9 });
    g.stroke({ width: 2, color: 0x94a3b8, alpha: 0.95 });

    // Wooden / Metallic Trim
    g.roundRect(wl - 14, fy + 16, (wr - wl) + 28, 6, 2);
    g.fill({ color: 0x475569 });

    // Top Opening Acrylic Caps
    g.roundRect(wl - 6, 52, 12, 12, 4);
    g.fill({ color: 0xe0f2fe, alpha: 0.9 });
    g.roundRect(wr - 6, 52, 12, 12, 4);
    g.fill({ color: 0xe0f2fe, alpha: 0.9 });
  }

  private drawDangerLine(): void {
    const g = this.glassBoxGfx;
    // Redraw danger line
    const color = this.dangerWarning ? 0xef4444 : 0xf87171;
    const alpha = this.dangerWarning ? 0.9 : 0.45;

    // Draw dashed danger line
    const startX = this.wallLeft + 4;
    const endX = this.wallRight - 4;
    const y = this.dangerLineY;

    g.moveTo(startX, y);
    g.lineTo(endX, y);
    g.stroke({
      width: this.dangerWarning ? 3.5 : 2,
      color,
      alpha,
    });
  }

  // ---------------------------------------------------------------------------
  // MAIN GAME TICKER LOOP
  // ---------------------------------------------------------------------------
  private updateGameLoop(dt: number): void {
    if (this.isGameOver || this.isPaused) return;

    // Clamp delta time to avoid large jumps
    const step = Math.min(dt, 2.0);

    // Update Drop Cooldown
    if (this.dropCooldown > 0) {
      this.dropCooldown -= step * 0.016;
      if (this.dropCooldown <= 0) {
        this.canDrop = true;
      }
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= step * 0.016;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Sub-Stepped Physics Simulation for extreme stability & tight contact
    const subSteps = 8;
    const subDt = (step * 0.016) / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.stepPhysics(subDt);
      this.resolveCollisionsAndMerges();
    }

    // Visual synchronization and animations
    this.updateFruitVisuals(step);

    // Draw Aiming Guide Line
    this.drawAimGuideLine();

    // Update Particles
    this.updateParticles(step);

    // Check Danger Threshold Line
    this.checkDangerLine(step);
  }

  // ---------------------------------------------------------------------------
  // 2D CIRCLE PHYSICS ENGINE
  // ---------------------------------------------------------------------------
  private stepPhysics(dt: number): void {
    const gravity = 880; // px/s^2
    const airResistance = 0.9995;

    for (const f of this.fruits) {
      if (f.isMerging) continue;

      // Apply Gravity
      f.vy += gravity * dt;

      // Air Damping
      f.vx *= airResistance;
      f.vy *= airResistance;

      // Position Update
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Rotation Update
      f.rotation += f.vRot * dt;
      f.vRot *= 0.985;

      // Left Wall Boundary
      if (f.x - f.radius < this.wallLeft) {
        f.x = this.wallLeft + f.radius;
        f.vx = -f.vx * 0.35;
        f.vRot = -f.vy * 0.02;
        if (Math.abs(f.vx) > 40) this.audio.playBounce(0.3);
      }

      // Right Wall Boundary
      if (f.x + f.radius > this.wallRight) {
        f.x = this.wallRight - f.radius;
        f.vx = -f.vx * 0.35;
        f.vRot = f.vy * 0.02;
        if (Math.abs(f.vx) > 40) this.audio.playBounce(0.3);
      }

      // Floor Boundary
      if (f.y + f.radius > this.floorY) {
        f.y = this.floorY - f.radius;
        if (f.vy > 50) this.audio.playBounce(Math.min(1.0, f.vy / 400));
        f.vy = -f.vy * 0.3;
        // Friction with floor
        f.vx *= 0.88;
        f.vRot += (f.vx / f.radius) * 0.4;
      }
    }
  }

  private resolveCollisionsAndMerges(): void {
    const restitution = 0.18;
    const count = this.fruits.length;

    for (let i = 0; i < count; i++) {
      const f1 = this.fruits[i];
      if (!f1 || f1.isMerging) continue;

      for (let j = i + 1; j < count; j++) {
        const f2 = this.fruits[j];
        if (!f2 || f2.isMerging) continue;

        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = f1.radius + f2.radius;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          // --- MERGE CONDITION ---
          if (f1.tier === f2.tier && f1.tier < FRUIT_TIERS.length - 1) {
            this.executeMerge(f1, f2);
            return; // Exit sub-step to allow clean spawn
          }

          // --- STANDARD RIGID CIRCLE COLLISION ---
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Positional correction (Prevent sinking)
          const m1 = f1.mass;
          const m2 = f2.mass;
          const totalMass = m1 + m2;

          const ratio1 = m2 / totalMass;
          const ratio2 = m1 / totalMass;

          f1.x -= nx * overlap * ratio1;
          f1.y -= ny * overlap * ratio1;
          f2.x += nx * overlap * ratio2;
          f2.y += ny * overlap * ratio2;

          // Normal relative velocity
          const rvx = f2.vx - f1.vx;
          const rvy = f2.vy - f1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const impulse = (-(1 + restitution) * velAlongNormal) / (1 / m1 + 1 / m2);

            f1.vx -= (impulse / m1) * nx;
            f1.vy -= (impulse / m1) * ny;
            f2.vx += (impulse / m2) * nx;
            f2.vy += (impulse / m2) * ny;

            // Rolling angular friction
            const tangentX = -ny;
            const tangentY = nx;
            const velAlongTangent = rvx * tangentX + rvy * tangentY;
            const tangentImpulse = (-velAlongTangent * 0.15) / (1 / m1 + 1 / m2);

            f1.vRot -= (tangentImpulse / f1.radius) * 0.5;
            f2.vRot += (tangentImpulse / f2.radius) * 0.5;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FRUIT MERGING LOGIC & JUICE FX
  // ---------------------------------------------------------------------------
  private executeMerge(f1: FruitBody, f2: FruitBody): void {
    f1.isMerging = true;
    f2.isMerging = true;

    const midX = (f1.x + f2.x) / 2;
    const midY = (f1.y + f2.y) / 2;
    const nextTier = f1.tier + 1;
    const config = FRUIT_TIERS[nextTier];

    // Scoring & Combo
    this.comboCount++;
    this.comboTimer = 1.6;
    const comboBonus = this.comboCount > 1 ? (this.comboCount - 1) * 10 : 0;
    const points = config.score + comboBonus;

    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try {
        localStorage.setItem('fruitmerge_best_score', this.bestScore.toString());
      } catch {}
    }

    // Audio Cue
    this.audio.playMerge(nextTier);

    // Juice Splash Particles
    this.spawnJuiceBurst(midX, midY, config.color, 24);

    // Floating Score Label
    this.floatingScores.push({
      x: midX,
      y: midY - 10,
      text: `+${points}${this.comboCount > 1 ? ` (x${this.comboCount})` : ''}`,
      color: config.cssColor,
      alpha: 1.0,
      vy: -1.8,
      life: 0,
    });

    // Remove merged pair
    this.fruitsContainer.removeChild(f1.container);
    this.fruitsContainer.removeChild(f2.container);
    this.fruits = this.fruits.filter((f) => f !== f1 && f !== f2);

    // Spawn upgraded fruit at midpoint with upward bounce impulse
    const upgraded = this.createFruitEntity(nextTier, midX, midY);
    upgraded.vy = -160; // Gentle pop
    upgraded.vx = (Math.random() - 0.5) * 60;
    upgraded.scaleFactor = 0.5; // Pop-in scale bounce
    this.fruits.push(upgraded);
  }

  // ---------------------------------------------------------------------------
  // FRUIT CREATION & VISUAL MANAGEMENT
  // ---------------------------------------------------------------------------
  private createFruitEntity(tier: number, x: number, y: number): FruitBody {
    const config = FRUIT_TIERS[tier];
    const container = new Container();
    container.x = x;
    container.y = y;

    const sprite = new Sprite(this.fruitTextures.get(tier) || Texture.WHITE);
    sprite.anchor.set(0.5);
    sprite.width = config.radius * 2 * this.svgScaleRatio;
    sprite.height = config.radius * 2 * this.svgScaleRatio;
    container.addChild(sprite);

    this.fruitsContainer.addChild(container);

    return {
      id: this.nextId++,
      tier,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: config.radius,
      mass: config.mass,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 2,
      sprite,
      container,
      isMerging: false,
      scaleFactor: 1.0,
      targetScale: 1.0,
      dangerTime: 0,
    };
  }

  private updateFruitVisuals(dt: number): void {
    for (const f of this.fruits) {
      if (f.isMerging) continue;

      // Animate scale bounce
      if (f.scaleFactor < f.targetScale) {
        f.scaleFactor = Math.min(f.targetScale, f.scaleFactor + dt * 0.12);
      }

      f.container.x = f.x;
      f.container.y = f.y;
      f.container.rotation = f.rotation;
      f.container.scale.set(f.scaleFactor);
    }
  }

  // ---------------------------------------------------------------------------
  // DROPPER & USER CONTROLS
  // ---------------------------------------------------------------------------
  setDropperPosition(clientX: number): void {
    if (!this.canvasHostRef) return;
    const rect = this.canvasHostRef.nativeElement.getBoundingClientRect();
    const scale = this.boxWidth / rect.width;
    const localX = (clientX - rect.left) * scale;

    const radius = this.currentFruitConfig.radius;
    const minX = this.wallLeft + radius + 4;
    const maxX = this.wallRight - radius - 4;

    this.dropperX = Math.max(minX, Math.min(maxX, localX));
    this.dropperSprite.x = this.dropperX;
  }

  dropCurrentFruit(): void {
    if (!this.canDrop || this.isGameOver || this.isPaused) return;

    this.canDrop = false;
    this.dropCooldown = 0.55;

    const tier = this.dropperTier;
    const fruit = this.createFruitEntity(tier, this.dropperX, this.dropY + 12);
    fruit.vy = 80;
    this.fruits.push(fruit);

    this.audio.playDrop();

    // Advance to next fruit
    this.rollNextDropperFruits(false);
    this.updateDropperVisual();
  }

  private rollNextDropperFruits(isInitial = false): void {
    if (isInitial) {
      // Small tiers 0-2 for initial launch
      this.dropperTier = Math.floor(Math.random() * 3);
      this.nextTier = Math.floor(Math.random() * 4);
    } else {
      this.dropperTier = this.nextTier;
      // Weighted selection (tiers 0 to 4)
      const r = Math.random();
      if (r < 0.4) this.nextTier = 0;
      else if (r < 0.7) this.nextTier = 1;
      else if (r < 0.9) this.nextTier = 2;
      else if (r < 0.97) this.nextTier = 3;
      else this.nextTier = 4;
    }
  }

  private updateDropperVisual(): void {
    if (!this.dropperSprite) return;
    const tex = this.fruitTextures.get(this.dropperTier) || Texture.WHITE;
    this.dropperSprite.texture = tex;
    const r = this.currentFruitConfig.radius;
    this.dropperSprite.width = r * 2 * this.svgScaleRatio;
    this.dropperSprite.height = r * 2 * this.svgScaleRatio;
    this.dropperSprite.x = this.dropperX;
    this.dropperSprite.y = this.dropY;
  }

  private drawAimGuideLine(): void {
    const g = this.guideLineGfx;
    g.clear();

    if (!this.canDrop || this.isGameOver) return;

    const x = this.dropperX;
    const startY = this.dropY + this.currentFruitConfig.radius + 6;
    const endY = this.floorY;

    // Dashed trajectory guideline
    const dash = 7;
    const gap = 5;
    let currY = startY;

    while (currY < endY) {
      const nextY = Math.min(currY + dash, endY);
      g.moveTo(x, currY);
      g.lineTo(x, nextY);
      g.stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
      currY += dash + gap;
    }
  }

  // ---------------------------------------------------------------------------
  // DANGER LINE & GAME OVER
  // ---------------------------------------------------------------------------
  private checkDangerLine(dt: number): void {
    let anyAboveDanger = false;

    for (const f of this.fruits) {
      if (f.isMerging) continue;

      // Check if fruit has come to rest and is crossing the danger line
      const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (f.y - f.radius < this.dangerLineY && speed < 180 && f.y > this.dropY + 30) {
        f.dangerTime += dt * 0.016;
        anyAboveDanger = true;

        if (f.dangerTime > 2.2) {
          this.triggerGameOver();
          return;
        }
      } else {
        f.dangerTime = Math.max(0, f.dangerTime - dt * 0.016 * 2);
      }
    }

    this.dangerWarning = anyAboveDanger;
    if (this.dangerWarning && Math.random() < 0.04) {
      this.audio.playWarning();
    }

    this.drawDangerLine();
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.audio.playGameOver();
  }

  // ---------------------------------------------------------------------------
  // JUICE PARTICLES & FLOATING SCORES
  // ---------------------------------------------------------------------------
  private spawnJuiceBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color,
        alpha: 1.0,
        radius: 2.5 + Math.random() * 3.5,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
      });
    }
  }

  private updateParticles(dt: number): void {
    const g = this.particlesGfx;
    g.clear();

    const dtSec = dt * 0.016;

    // Update Juice Droplets
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtSec;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vy += 650 * dtSec; // Particle gravity
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.alpha = 1.0 - p.life / p.maxLife;

      g.circle(p.x, p.y, p.radius);
      g.fill({ color: p.color, alpha: p.alpha });
    }

    // Update Floating Score Labels
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const s = this.floatingScores[i];
      s.life += dtSec;
      s.y += s.vy;
      s.alpha = Math.max(0, 1.0 - s.life / 0.9);

      if (s.life >= 0.9) {
        this.floatingScores.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // USER ACTIONS & RESTART
  // ---------------------------------------------------------------------------
  restartGame(): void {
    // Clear all fruits
    for (const f of this.fruits) {
      this.fruitsContainer.removeChild(f.container);
    }
    this.fruits = [];
    this.particles = [];
    this.floatingScores = [];
    this.score = 0;
    this.comboCount = 0;
    this.isGameOver = false;
    this.dangerWarning = false;
    this.canDrop = true;
    this.rollNextDropperFruits(true);
    this.updateDropperVisual();
  }

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.audio.setSoundEnabled(this.soundEnabled);
  }

  goHome(): void {
    this.router.navigate(['/pixijshome']);
  }

  // Keyboard controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.isGameOver) return;

    if (event.code === 'Space' || event.code === 'ArrowDown') {
      event.preventDefault();
      this.dropCurrentFruit();
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      this.dropperX = Math.max(this.wallLeft + this.currentFruitConfig.radius + 4, this.dropperX - 20);
      this.dropperSprite.x = this.dropperX;
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      this.dropperX = Math.min(this.wallRight - this.currentFruitConfig.radius - 4, this.dropperX + 20);
      this.dropperSprite.x = this.dropperX;
    }
  }
}
