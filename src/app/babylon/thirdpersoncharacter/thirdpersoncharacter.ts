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
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopPanel } from '../../top-panel/top-panel';

import '@babylonjs/loaders/FBX';
import '@babylonjs/loaders/glTF';
import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  PBRMaterial,
  ArcRotateCamera,
  TransformNode,
  AnimationGroup,
  ParticleSystem,
  DynamicTexture,
  GlowLayer,
  AbstractMesh,
  Skeleton,
  SceneLoader,
} from '@babylonjs/core';

export type TimeOfDay = 'day' | 'sunset' | 'night';
export type CharacterState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'slash'
  | 'block'
  | 'jump'
  | 'kick'
  | 'powerUp'
  | 'death';

@Component({
  selector: 'app-thirdpersoncharacter',
  standalone: true,
  imports: [CommonModule, RouterLink, TopPanel],
  templateUrl: './thirdpersoncharacter.html',
  styleUrl: './thirdpersoncharacter.scss',
})
export class Thirdpersoncharacter implements AfterViewInit, OnDestroy {
  @ViewChild('renderCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // Reactive UI Signals
  readonly loading = signal(true);
  readonly loadingText = signal('Summoning Paladin J Nordstrom...');
  readonly currentState = signal<CharacterState>('idle');
  readonly isDriving = signal(false);
  readonly canEnterCar = signal(false);
  readonly carSpeedKmH = signal(0);
  readonly soundEnabled = signal(true);
  readonly timeOfDay = signal<TimeOfDay>('day');
  readonly health = signal(100);
  readonly stamina = signal(100);
  readonly availableAnimations = signal<string[]>([]);
  readonly activeActionName = signal('Ready');

  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private shadowGen: ShadowGenerator | null = null;
  private glowLayer: GlowLayer | null = null;
  private hemiLight: HemisphericLight | null = null;
  private dirLight: DirectionalLight | null = null;

  // Character Variables
  private playerRoot: TransformNode | null = null;
  private characterModelRoot: TransformNode | null = null;
  private playerMeshes: AbstractMesh[] = [];
  private playerSkeleton: Skeleton | null = null;
  private animationGroups: Map<string, AnimationGroup> = new Map();
  private currentAnimGroup: AnimationGroup | null = null;

  // Character Movement Physics
  private playerPos = new Vector3(0, 0, 0);
  private playerVelocityY = 0;
  private isGrounded = true;
  private targetPlayerRotation = 0;
  private isAttacking = false;
  private isBlocking = false;

  // Car Variables
  private carRoot: TransformNode | null = null;
  private carChassis: Mesh | null = null;
  private carWheels: Mesh[] = [];
  private carWheelNodes: TransformNode[] = [];
  private carSpeed = 0;
  private carSteerAngle = 0;
  private carHeading = 0;
  private carPos = new Vector3(8, 0, 5);
  private carBrakeLightsMat: StandardMaterial | null = null;

  // Interactive Dummies / Targets
  private dummyTargets: { mesh: Mesh; hp: number; initialPos: Vector3 }[] = [];

  // Input Mapping
  private keys: Record<string, boolean> = {};

  // Audio Context
  private audioCtx: AudioContext | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initBabylon();
    }
  }

  ngOnDestroy(): void {
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
  }

  // --- INITIALIZATION ---
  private async initBabylon(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.06, 0.09, 0.16, 1);
    this.scene.collisionsEnabled = true;

    this.setupCamera(canvas);
    this.setupLighting();
    this.setupEnvironment();
    this.setupCar();

    this.engine.runRenderLoop(() => {
      this.updateGameLoop();
      this.scene?.render();
    });

    window.addEventListener('resize', () => {
      this.engine?.resize();
    });

    setTimeout(() => {
      this.engine?.resize();
    }, 150);

    // Load Character
    await this.loadPaladinCharacter();

    // Scene is ready to display!
    this.loading.set(false);
    this.cdr.detectChanges();

    // Load animations in background
    this.loadAllAnimations();
  }

  // --- CAMERA SETUP ---
  private setupCamera(canvas: HTMLCanvasElement): void {
    if (!this.scene) return;
    this.camera = new ArcRotateCamera(
      'TPCamera',
      -Math.PI / 2,
      Math.PI / 3, // elevated 60 degree third-person view
      8.0, // comfortable view distance
      new Vector3(0, 1.2, 0),
      this.scene
    );
    this.scene.activeCamera = this.camera;
    this.camera.lowerRadiusLimit = 2.5;
    this.camera.upperRadiusLimit = 20;
    this.camera.lowerBetaLimit = 0.2;
    this.camera.upperBetaLimit = Math.PI / 2 - 0.05;
    this.camera.wheelPrecision = 20;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.attachControl(canvas, true);
  }

  // --- LIGHTING & SHADOWS ---
  private setupLighting(): void {
    if (!this.scene) return;

    this.hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    this.hemiLight.intensity = 1.2;
    this.hemiLight.diffuse = new Color3(1, 1, 1);
    this.hemiLight.groundColor = new Color3(0.35, 0.4, 0.5);

    this.dirLight = new DirectionalLight(
      'dirLight',
      new Vector3(-1, -2, -1).normalize(),
      this.scene
    );
    this.dirLight.position = new Vector3(25, 50, 25);
    this.dirLight.intensity = 1.8;
    this.dirLight.diffuse = new Color3(1, 0.98, 0.92);

    this.shadowGen = new ShadowGenerator(2048, this.dirLight);
    this.shadowGen.useBlurExponentialShadowMap = true;
    this.shadowGen.blurKernel = 32;

    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.5;
  }

  // --- ENVIRONMENT & ARENA ---
  private setupEnvironment(): void {
    if (!this.scene) return;

    // Arena Floor
    const ground = MeshBuilder.CreateCylinder(
      'arenaGround',
      {
        diameter: 80,
        height: 0.5,
        tessellation: 64,
      },
      this.scene
    );
    ground.position.y = -0.25;
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.2, 0.24, 0.32);
    groundMat.specularColor = new Color3(0.2, 0.3, 0.4);

    // Dynamic grid texture for high-tech arena
    const dynTex = new DynamicTexture('gridTexture', { width: 1024, height: 1024 }, this.scene, false);
    const ctx = dynTex.getContext();
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 3;
    const step = 64;
    for (let x = 0; x <= 1024; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(1024, x);
      ctx.stroke();
    }
    // Concentric glowing combat rings
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(512, 512, 220, 0, Math.PI * 2);
    ctx.stroke();
    dynTex.update();
    groundMat.diffuseTexture = dynTex;
    ground.material = groundMat;

    // Boundary Neon Pillars
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 38;
      const pillar = MeshBuilder.CreateBox(
        `pillar_${i}`,
        { width: 1.2, height: 6, depth: 1.2 },
        this.scene
      );
      pillar.position = new Vector3(
        Math.cos(angle) * radius,
        3,
        Math.sin(angle) * radius
      );
      pillar.checkCollisions = true;

      const pMat = new StandardMaterial(`pMat_${i}`, this.scene);
      pMat.diffuseColor = new Color3(0.1, 0.15, 0.25);
      pMat.emissiveColor = new Color3(0, 0.4, 0.8);
      pillar.material = pMat;
      this.shadowGen?.addShadowCaster(pillar);
    }

    // Practice Combat Dummy Targets
    this.createCombatDummies();

    // Stunt Ramps for Car
    this.createStuntRamps();
  }

  private createCombatDummies(): void {
    if (!this.scene) return;
    const dummyPositions = [
      new Vector3(-5, 0, 6),
      new Vector3(-8, 0, -4),
      new Vector3(4, 0, -10),
      new Vector3(-12, 0, 10),
    ];

    dummyPositions.forEach((pos, idx) => {
      const dummy = MeshBuilder.CreateCylinder(
        `dummy_${idx}`,
        { height: 1.8, diameterTop: 0.5, diameterBottom: 0.6 },
        this.scene!
      );
      dummy.position = new Vector3(pos.x, 0.9, pos.z);
      dummy.checkCollisions = true;

      const head = MeshBuilder.CreateSphere(`dummyHead_${idx}`, { diameter: 0.5 }, this.scene!);
      head.position.y = 1.1;
      head.parent = dummy;

      const dMat = new StandardMaterial(`dMat_${idx}`, this.scene!);
      dMat.diffuseColor = new Color3(0.85, 0.25, 0.2);
      dMat.emissiveColor = new Color3(0.25, 0.05, 0.05);
      dummy.material = dMat;
      head.material = dMat;

      this.shadowGen?.addShadowCaster(dummy);
      this.dummyTargets.push({ mesh: dummy, hp: 100, initialPos: pos.clone() });
    });
  }

  private createStuntRamps(): void {
    if (!this.scene) return;
    const ramp = MeshBuilder.CreateBox('stuntRamp', { width: 4, height: 1.2, depth: 6 }, this.scene);
    ramp.position = new Vector3(15, 0.3, -8);
    ramp.rotation.x = -Math.PI / 10;
    ramp.checkCollisions = true;

    const rampMat = new StandardMaterial('rampMat', this.scene);
    rampMat.diffuseColor = new Color3(0.9, 0.5, 0.1);
    rampMat.emissiveColor = new Color3(0.3, 0.1, 0.02);
    ramp.material = rampMat;
    this.shadowGen?.addShadowCaster(ramp);
  }

  // --- DRIVABLE 3D CAR CREATION ---
  private setupCar(): void {
    if (!this.scene) return;

    this.carRoot = new TransformNode('carRoot', this.scene);
    this.carRoot.position = this.carPos;

    // Body Chassis
    const chassis = MeshBuilder.CreateBox(
      'carChassis',
      { width: 2.1, height: 0.75, depth: 4.4 },
      this.scene
    );
    chassis.position.y = 0.65;
    chassis.parent = this.carRoot;
    this.carChassis = chassis;

    const carPaintMat = new PBRMaterial('carPaintMat', this.scene);
    carPaintMat.albedoColor = new Color3(0.02, 0.8, 0.98); // Cyber Neon Blue
    carPaintMat.metallic = 0.9;
    carPaintMat.roughness = 0.15;
    chassis.material = carPaintMat;
    this.shadowGen?.addShadowCaster(chassis);

    // Car Roof / Cockpit Canopy
    const roof = MeshBuilder.CreateBox(
      'carRoof',
      { width: 1.6, height: 0.55, depth: 2.2 },
      this.scene
    );
    roof.position = new Vector3(0, 1.25, -0.3);
    roof.parent = this.carRoot;

    const glassMat = new PBRMaterial('glassMat', this.scene);
    glassMat.albedoColor = new Color3(0.05, 0.08, 0.12);
    glassMat.metallic = 0.2;
    glassMat.roughness = 0.05;
    glassMat.alpha = 0.85;
    roof.material = glassMat;

    // Headlights
    const headlightMat = new StandardMaterial('headlightMat', this.scene);
    headlightMat.emissiveColor = new Color3(0.7, 0.95, 1);
    const leftHeadlight = MeshBuilder.CreateBox('leftHL', { width: 0.35, height: 0.15, depth: 0.1 }, this.scene);
    leftHeadlight.position = new Vector3(-0.75, 0.7, 2.2);
    leftHeadlight.material = headlightMat;
    leftHeadlight.parent = this.carRoot;

    const rightHeadlight = MeshBuilder.CreateBox('rightHL', { width: 0.35, height: 0.15, depth: 0.1 }, this.scene);
    rightHeadlight.position = new Vector3(0.75, 0.7, 2.2);
    rightHeadlight.material = headlightMat;
    rightHeadlight.parent = this.carRoot;

    // Taillights / Brake lights
    this.carBrakeLightsMat = new StandardMaterial('brakeLightsMat', this.scene);
    this.carBrakeLightsMat.emissiveColor = new Color3(0.6, 0.05, 0.05);

    const leftTL = MeshBuilder.CreateBox('leftTL', { width: 0.45, height: 0.12, depth: 0.1 }, this.scene);
    leftTL.position = new Vector3(-0.75, 0.75, -2.2);
    leftTL.material = this.carBrakeLightsMat;
    leftTL.parent = this.carRoot;

    const rightTL = MeshBuilder.CreateBox('rightTL', { width: 0.45, height: 0.12, depth: 0.1 }, this.scene);
    rightTL.position = new Vector3(0.75, 0.75, -2.2);
    rightTL.material = this.carBrakeLightsMat;
    rightTL.parent = this.carRoot;

    // Spoiler
    const spoiler = MeshBuilder.CreateBox('spoiler', { width: 2.2, height: 0.08, depth: 0.5 }, this.scene);
    spoiler.position = new Vector3(0, 1.35, -2.0);
    spoiler.material = carPaintMat;
    spoiler.parent = this.carRoot;

    // 4 Wheels
    const wheelPositions = [
      { x: -1.15, y: 0.4, z: 1.4, isFront: true },
      { x: 1.15, y: 0.4, z: 1.4, isFront: true },
      { x: -1.15, y: 0.4, z: -1.4, isFront: false },
      { x: 1.15, y: 0.4, z: -1.4, isFront: false },
    ];

    const tireMat = new StandardMaterial('tireMat', this.scene);
    tireMat.diffuseColor = new Color3(0.08, 0.08, 0.08);

    wheelPositions.forEach((wp, idx) => {
      const wheelNode = new TransformNode(`wheelNode_${idx}`, this.scene!);
      wheelNode.position = new Vector3(wp.x, wp.y, wp.z);
      wheelNode.parent = this.carRoot;
      this.carWheelNodes.push(wheelNode);

      const wheel = MeshBuilder.CreateCylinder(
        `wheel_${idx}`,
        { height: 0.45, diameter: 0.8, tessellation: 24 },
        this.scene!
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.material = tireMat;
      wheel.parent = wheelNode;
      this.shadowGen?.addShadowCaster(wheel);
      this.carWheels.push(wheel);
    });

    // Proximity Marker Ring
    const marker = MeshBuilder.CreateTorus(
      'carMarker',
      { diameter: 5.5, thickness: 0.08, tessellation: 32 },
      this.scene
    );
    marker.position.y = 0.05;
    marker.parent = this.carRoot;
    const markerMat = new StandardMaterial('markerMat', this.scene);
    markerMat.emissiveColor = new Color3(0, 0.95, 1);
    markerMat.alpha = 0.4;
    marker.material = markerMat;
  }

  // --- PALADIN J NORDSTROM FBX LOADER ---
  private async loadPaladinCharacter(): Promise<void> {
    if (!this.scene) return;
    this.loadingText.set('Loading Paladin J Nordstrom 3D model...');

    this.playerRoot = new TransformNode('playerRoot', this.scene);
    this.playerRoot.position = this.playerPos;

    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        '/CharacterWithAnimation/Sword and Shield Pack/',
        'Paladin J Nordstrom.fbx',
        this.scene
      );

      this.playerMeshes = result.meshes;
      if (result.skeletons && result.skeletons.length > 0) {
        this.playerSkeleton = result.skeletons[0];
      }

      // Root of imported FBX
      this.characterModelRoot = result.meshes[0];
      this.characterModelRoot.parent = this.playerRoot;

      // Auto-normalize scale based on bounding box
      const boundingVectors = this.characterModelRoot.getHierarchyBoundingVectors();
      const rawHeight = boundingVectors.max.y - boundingVectors.min.y;

      if (rawHeight > 0) {
        // Standard human height is ~1.85m
        const targetScale = 1.85 / rawHeight;
        this.characterModelRoot.scaling.setAll(targetScale);
        // Align feet with ground (y = 0)
        this.characterModelRoot.position.y = -boundingVectors.min.y * targetScale;
      }

      // Enhance materials and shadows
      result.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        this.shadowGen?.addShadowCaster(mesh);

        if (mesh.material) {
          if (mesh.material instanceof StandardMaterial) {
            mesh.material.specularColor = new Color3(0.5, 0.5, 0.5);
            mesh.material.backFaceCulling = false;
          }
        }
      });

    } catch (err) {
      console.warn('Paladin FBX load notice:', err);
      this.createFallbackHero();
    }
  }

  // --- ANIMATION IMPORTER & RETARGETING ---
  private async loadAllAnimations(): Promise<void> {
    if (!this.scene) return;

    const animFiles: { name: CharacterState; file: string }[] = [
      { name: 'idle', file: 'sword and shield idle.fbx' },
      { name: 'walk', file: 'sword and shield walk.fbx' },
      { name: 'run', file: 'sword and shield run.fbx' },
      { name: 'attack', file: 'sword and shield attack.fbx' },
      { name: 'slash', file: 'sword and shield slash.fbx' },
      { name: 'block', file: 'sword and shield block.fbx' },
      { name: 'jump', file: 'sword and shield jump.fbx' },
      { name: 'kick', file: 'sword and shield kick.fbx' },
      { name: 'powerUp', file: 'sword and shield power up.fbx' },
      { name: 'death', file: 'sword and shield death.fbx' },
    ];

    const availableNames: string[] = [];

    for (const item of animFiles) {
      try {
        const container = await SceneLoader.LoadAssetContainerAsync(
          '/CharacterWithAnimation/Sword and Shield Pack/',
          item.file,
          this.scene
        );

        if (container.animationGroups && container.animationGroups.length > 0) {
          const rawGroup = container.animationGroups[0];
          const retargeted = this.retargetGroup(rawGroup, item.name);
          if (retargeted) {
            this.animationGroups.set(item.name, retargeted);
            availableNames.push(item.name);
            if (item.name === 'idle' && this.currentState() === 'idle') {
              this.playAnimation('idle');
            }
          }
        }
      } catch (e) {
        console.warn(`Could not load animation ${item.name}:`, e);
      }
    }

    this.availableAnimations.set(availableNames);
  }

  private retargetGroup(source: AnimationGroup, name: string): AnimationGroup | null {
    if (!this.playerSkeleton || !this.scene) return null;

    const newGroup = new AnimationGroup(name, this.scene);
    const boneLookup = new Map<string, any>();
    for (const bone of this.playerSkeleton.bones) {
      const node = bone.getTransformNode() ?? bone;
      boneLookup.set(bone.name.toLowerCase(), node);
    }

    for (const tAnim of source.targetedAnimations) {
      const targetName = tAnim.target?.name?.toLowerCase();
      if (!targetName) continue;

      let matchNode = boneLookup.get(targetName);
      if (!matchNode) {
        for (const [key, node] of boneLookup.entries()) {
          if (key.includes(targetName) || targetName.includes(key)) {
            matchNode = node;
            break;
          }
        }
      }

      if (matchNode) {
        newGroup.addTargetedAnimation(tAnim.animation, matchNode);
      }
    }

    return newGroup;
  }

  // Fallback Knight in case FBX fails
  private createFallbackHero(): void {
    if (!this.scene || !this.playerRoot) return;
    const body = MeshBuilder.CreateCylinder(
      'fallbackBody',
      { height: 1.8, diameterTop: 0.6, diameterBottom: 0.7 },
      this.scene
    );
    body.position.y = 0.9;
    body.parent = this.playerRoot;
    const fMat = new StandardMaterial('fMat', this.scene);
    fMat.diffuseColor = new Color3(0.15, 0.5, 0.95);
    fMat.emissiveColor = new Color3(0.05, 0.15, 0.35);
    body.material = fMat;
    this.shadowGen?.addShadowCaster(body);
    this.playerMeshes.push(body);
  }

  // --- ANIMATION PLAYBACK ---
  playAnimation(name: CharacterState, loop = true): void {
    const targetGroup = this.animationGroups.get(name);
    this.currentState.set(name);
    this.activeActionName.set(name.toUpperCase());

    if (this.currentAnimGroup && this.currentAnimGroup !== targetGroup) {
      this.currentAnimGroup.stop();
    }

    if (targetGroup) {
      this.currentAnimGroup = targetGroup;
      targetGroup.start(loop, 1.0, targetGroup.from, targetGroup.to, false);
    }
  }

  // --- INPUT LISTENERS ---
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = true;

    if (key === 'e') {
      this.toggleCarDriving();
    }
    if (!this.isDriving()) {
      if (key === ' ' && this.isGrounded) {
        this.triggerJump();
      } else if (key === 'f' || key === 'j') {
        this.triggerAttack();
      } else if (key === 'q') {
        this.triggerBlock(true);
      } else if (key === 'k') {
        this.triggerKick();
      } else if (key === 'p') {
        this.triggerPowerUp();
      } else if (key === 'r') {
        this.respawnPlayer();
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys[key] = false;

    if (key === 'q') {
      this.triggerBlock(false);
    }
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (this.isDriving()) return;
    if (event.button === 0) {
      this.triggerAttack();
    } else if (event.button === 2) {
      this.triggerBlock(true);
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (event.button === 2) {
      this.triggerBlock(false);
    }
  }

  // --- ACTION TRIGGERS ---
  triggerAttack(): void {
    if (this.isAttacking || this.isDriving()) return;
    this.isAttacking = true;
    const attackType: CharacterState = Math.random() > 0.5 ? 'attack' : 'slash';
    this.playAnimation(attackType, false);
    this.playSound('sword');
    this.checkMeleeHits();

    setTimeout(() => {
      this.isAttacking = false;
      if (!this.isMoving()) {
        this.playAnimation('idle');
      }
    }, 900);
  }

  triggerBlock(blocking: boolean): void {
    if (this.isDriving()) return;
    this.isBlocking = blocking;
    if (blocking) {
      this.playAnimation('block', true);
      this.playSound('block');
    } else if (!this.isMoving()) {
      this.playAnimation('idle');
    }
  }

  triggerJump(): void {
    if (!this.isGrounded || this.isDriving()) return;
    this.playerVelocityY = 0.22;
    this.isGrounded = false;
    this.playAnimation('jump', false);
    this.playSound('jump');
  }

  triggerKick(): void {
    if (this.isAttacking || this.isDriving()) return;
    this.isAttacking = true;
    this.playAnimation('kick', false);
    this.playSound('sword');
    this.checkMeleeHits();

    setTimeout(() => {
      this.isAttacking = false;
      this.playAnimation('idle');
    }, 850);
  }

  triggerPowerUp(): void {
    if (this.isAttacking || this.isDriving()) return;
    this.isAttacking = true;
    this.playAnimation('powerUp', false);
    this.playSound('powerUp');
    this.spawnPowerUpFX();

    setTimeout(() => {
      this.isAttacking = false;
      this.playAnimation('idle');
    }, 1800);
  }

  private spawnPowerUpFX(): void {
    if (!this.scene || !this.playerRoot) return;
    const ps = new ParticleSystem('powerAura', 200, this.scene);
    ps.emitter = this.playerRoot.position.add(new Vector3(0, 1, 0));
    ps.minEmitBox = new Vector3(-0.5, 0, -0.5);
    ps.maxEmitBox = new Vector3(0.5, 1, 0.5);
    ps.color1 = new Color4(0.2, 0.9, 1, 1);
    ps.color2 = new Color4(0.8, 0.2, 1, 1);
    ps.colorDead = new Color4(0, 0, 0, 0);
    ps.minSize = 0.15;
    ps.maxSize = 0.45;
    ps.minLifeTime = 0.4;
    ps.maxLifeTime = 0.9;
    ps.emitRate = 250;
    ps.gravity = new Vector3(0, 4, 0);
    ps.start();
    setTimeout(() => {
      ps.stop();
      setTimeout(() => ps.dispose(), 1000);
    }, 1600);
  }

  private checkMeleeHits(): void {
    if (!this.playerRoot) return;
    const pPos = this.playerRoot.position;
    this.dummyTargets.forEach((target) => {
      const dist = Vector3.Distance(pPos, target.mesh.position);
      if (dist < 2.5) {
        target.hp -= 25;
        this.playSound('hit');
        target.mesh.position.addInPlace(
          target.mesh.position.subtract(pPos).normalize().scale(0.35)
        );
      }
    });
  }

  respawnPlayer(): void {
    this.playerPos = new Vector3(0, 0, 0);
    this.playerVelocityY = 0;
    this.isGrounded = true;
    if (this.playerRoot) {
      this.playerRoot.position = this.playerPos;
    }
    this.health.set(100);
    this.stamina.set(100);
    this.playAnimation('idle');
  }

  // --- CAR DRIVING MECHANICS ---
  toggleCarDriving(): void {
    if (this.isDriving()) {
      // Exit Car
      this.isDriving.set(false);
      this.carSpeed = 0;
      this.carSpeedKmH.set(0);

      // Place Paladin beside car door
      if (this.playerRoot && this.carRoot) {
        const exitOffset = new Vector3(2.2, 0, 0);
        this.playerPos = this.carRoot.position.add(exitOffset);
        this.playerRoot.position = this.playerPos;
        this.playerMeshes.forEach((m) => (m.isVisible = true));
      }
      this.playAnimation('idle');
      this.playSound('carDoor');
    } else {
      if (this.canEnterCar()) {
        this.isDriving.set(true);
        this.playerMeshes.forEach((m) => (m.isVisible = false));
        this.playSound('carStart');
      }
    }
  }

  // --- MAIN GAME UPDATE LOOP ---
  private updateGameLoop(): void {
    if (this.isDriving()) {
      this.updateCarPhysics();
    } else {
      this.updatePlayerMovement();
    }
    this.updateCameraFollow();
    this.checkProximityToCar();
  }

  private isMoving(): boolean {
    return (
      !!this.keys['w'] ||
      !!this.keys['s'] ||
      !!this.keys['a'] ||
      !!this.keys['d'] ||
      !!this.keys['arrowup'] ||
      !!this.keys['arrowdown'] ||
      !!this.keys['arrowleft'] ||
      !!this.keys['arrowright']
    );
  }

  private updatePlayerMovement(): void {
    if (!this.playerRoot || !this.camera || this.isAttacking) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveZ += 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ -= 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    const isRunning = (this.keys['shift'] || this.keys['shiftleft']) && (moveX !== 0 || moveZ !== 0);
    const speed = isRunning ? 0.16 : 0.08;

    if (moveX !== 0 || moveZ !== 0) {
      const camAlpha = this.camera.alpha;
      const angle = Math.atan2(moveX, moveZ) + (camAlpha + Math.PI / 2);

      this.playerPos.x += Math.sin(angle) * speed;
      this.playerPos.z += Math.cos(angle) * speed;

      this.targetPlayerRotation = angle;
      this.playerRoot.rotation.y = this.lerpAngle(
        this.playerRoot.rotation.y,
        this.targetPlayerRotation,
        0.18
      );

      if (isRunning) {
        if (this.currentState() !== 'run') {
          this.playAnimation('run');
        }
      } else {
        if (this.currentState() !== 'walk') {
          this.playAnimation('walk');
        }
      }
    } else if (this.isGrounded && !this.isBlocking && this.currentState() !== 'idle') {
      this.playAnimation('idle');
    }

    // Apply Vertical Gravity & Jump
    if (!this.isGrounded) {
      this.playerVelocityY -= 0.012;
      this.playerPos.y += this.playerVelocityY;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelocityY = 0;
        this.isGrounded = true;
        if (!this.isMoving()) {
          this.playAnimation('idle');
        }
      }
    }

    // Arena boundary clamp
    const distFromCenter = Math.sqrt(this.playerPos.x ** 2 + this.playerPos.z ** 2);
    if (distFromCenter > 36) {
      const angle = Math.atan2(this.playerPos.z, this.playerPos.x);
      this.playerPos.x = Math.cos(angle) * 36;
      this.playerPos.z = Math.sin(angle) * 36;
    }

    this.playerRoot.position = this.playerPos;
  }

  private updateCarPhysics(): void {
    if (!this.carRoot) return;

    const accelRate = 0.008;
    const maxForward = 0.65;
    const maxReverse = -0.22;
    const friction = 0.985;

    if (this.keys['w'] || this.keys['arrowup']) {
      this.carSpeed = Math.min(this.carSpeed + accelRate, maxForward);
    } else if (this.keys['s'] || this.keys['arrowdown']) {
      this.carSpeed = Math.max(this.carSpeed - accelRate * 1.5, maxReverse);
      if (this.carBrakeLightsMat) {
        this.carBrakeLightsMat.emissiveColor = new Color3(1, 0.1, 0.1);
      }
    } else {
      this.carSpeed *= friction;
      if (Math.abs(this.carSpeed) < 0.001) this.carSpeed = 0;
      if (this.carBrakeLightsMat) {
        this.carBrakeLightsMat.emissiveColor = new Color3(0.5, 0.05, 0.05);
      }
    }

    // Steering
    const steerSpeed = 0.038;
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.carSteerAngle = Math.max(this.carSteerAngle - 0.08, -0.45);
      if (Math.abs(this.carSpeed) > 0.02) {
        this.carHeading -= steerSpeed * (this.carSpeed > 0 ? 1 : -1);
      }
    } else if (this.keys['d'] || this.keys['arrowright']) {
      this.carSteerAngle = Math.min(this.carSteerAngle + 0.08, 0.45);
      if (Math.abs(this.carSpeed) > 0.02) {
        this.carHeading += steerSpeed * (this.carSpeed > 0 ? 1 : -1);
      }
    } else {
      this.carSteerAngle *= 0.8;
    }

    if (this.carWheelNodes[0] && this.carWheelNodes[1]) {
      this.carWheelNodes[0].rotation.y = this.carSteerAngle;
      this.carWheelNodes[1].rotation.y = this.carSteerAngle;
    }

    this.carWheels.forEach((w) => {
      w.rotation.x += this.carSpeed * 1.8;
    });

    this.carPos.x += Math.sin(this.carHeading) * this.carSpeed;
    this.carPos.z += Math.cos(this.carHeading) * this.carSpeed;

    const carDist = Math.sqrt(this.carPos.x ** 2 + this.carPos.z ** 2);
    if (carDist > 36) {
      const angle = Math.atan2(this.carPos.z, this.carPos.x);
      this.carPos.x = Math.cos(angle) * 36;
      this.carPos.z = Math.sin(angle) * 36;
      this.carSpeed *= -0.4;
    }

    this.carRoot.position = this.carPos;
    this.carRoot.rotation.y = this.carHeading;

    const kmh = Math.round(Math.abs(this.carSpeed) * 280);
    this.carSpeedKmH.set(kmh);
  }

  private updateCameraFollow(): void {
    if (!this.camera) return;

    const targetPos = this.isDriving() && this.carRoot
      ? this.carRoot.position.add(new Vector3(0, 1.2, 0))
      : this.playerPos.add(new Vector3(0, 1.2, 0));

    this.camera.setTarget(Vector3.Lerp(this.camera.target, targetPos, 0.15));
  }

  private checkProximityToCar(): void {
    if (!this.playerRoot || !this.carRoot) return;
    const dist = Vector3.Distance(this.playerPos, this.carPos);
    this.canEnterCar.set(dist < 4.2 && !this.isDriving());
  }

  private lerpAngle(start: number, end: number, amount: number): number {
    let diff = (end - start) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return start + diff * amount;
  }

  // --- TIME OF DAY SWITCHER ---
  setTimeOfDay(tod: TimeOfDay): void {
    this.timeOfDay.set(tod);
    if (!this.scene || !this.hemiLight || !this.dirLight) return;

    if (tod === 'day') {
      this.scene.clearColor = new Color4(0.06, 0.09, 0.16, 1);
      this.hemiLight.intensity = 1.2;
      this.dirLight.intensity = 1.8;
      this.dirLight.diffuse = new Color3(1, 0.98, 0.92);
    } else if (tod === 'sunset') {
      this.scene.clearColor = new Color4(0.18, 0.08, 0.15, 1);
      this.hemiLight.intensity = 0.8;
      this.dirLight.intensity = 2.0;
      this.dirLight.diffuse = new Color3(1, 0.55, 0.2);
    } else {
      this.scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);
      this.hemiLight.intensity = 0.5;
      this.dirLight.intensity = 1.0;
      this.dirLight.diffuse = new Color3(0.4, 0.7, 1);
    }
  }

  toggleSound(): void {
    this.soundEnabled.set(!this.soundEnabled());
  }

  // --- WEB AUDIO API SYNTHESIZER ---
  private playSound(type: 'sword' | 'block' | 'hit' | 'jump' | 'powerUp' | 'carStart' | 'carDoor'): void {
    if (!this.soundEnabled()) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'sword') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'block') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'powerUp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'carStart') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio autoplay fallback
    }
  }
}
