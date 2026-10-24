import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export type UnityCategory = 'all' | 'spatial' | 'enterprise' | 'multiplayer' | 'assetstore' | 'webgames';

export interface UnityProjectLink {
  label: string;
  url: string;
  type: 'play' | 'store' | 'case-study' | 'external';
}

export interface UnityProjectItem {
  id: string;
  name: string;
  category: 'spatial' | 'enterprise' | 'multiplayer' | 'assetstore' | 'webgames';
  categoryLabel: string;
  tagline: string;
  description: string;
  imageUrl?: string;
  icon: string;
  techStack: string[];
  features: string[];
  links: UnityProjectLink[];
  architectureDetails?: string;
  metrics?: string;
}

@Component({
  selector: 'app-unityprojects',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './unityprojects.html',
  styleUrl: './unityprojects.scss',
})
export class Unityprojects {
  activeCategory: UnityCategory = 'all';
  searchQuery: string = '';
  selectedProject: UnityProjectItem | null = null;

  readonly projects: UnityProjectItem[] = [
    // Spatial Computing & visionOS / VR
    {
      id: 'apple-vision-pro',
      name: 'Digital Twin - Apple Vision Pro',
      category: 'spatial',
      categoryLabel: 'Spatial Computing / visionOS',
      tagline: 'Enterprise spatial digital twin recognized with 2 Gold Awards at TCS',
      description:
        'Led end-to-end development of a next-generation spatial computing digital twin application on Apple Vision Pro. Built interactive gesture-driven 3D inspection, real-time telemetry streaming, and ultra-high-fidelity PBR rendering.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
      icon: '🥽',
      techStack: ['Unity', 'visionOS', 'C#', 'Polyspatial', 'Blender', 'Xcode'],
      features: [
        'Recognized with 2 Gold Awards at TCS',
        'Spatial gesture interaction & gaze tracking',
        'Real-time IoT telemetry synchronization',
        'Optimized stereoscopic 90fps rendering pipeline',
      ],
      links: [
        {
          label: 'View Showcase',
          url: 'https://www.linkedin.com/posts/tata-consultancy-services-north-america_tcsnycmarathon-runwithtcs-runwithtcsinnyc-ugcPost-7258484777668743169-vD4l/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY',
          type: 'case-study',
        },
      ],
      architectureDetails:
        'Developed utilizing Unity Polyspatial and Swift bridging. Implemented custom spatial shaders and low-overhead geometry instancing to maintain rock-solid 90 FPS per eye without reprojection stutter.',
      metrics: '2 Gold Awards Winner • 90 FPS Spatial Fidelity',
    },
    // Enterprise & Multiplayer Infrastructure (B2B SaaS)
    {
      id: 'avataryug',
      name: 'Avataryug',
      category: 'enterprise',
      categoryLabel: 'B2B SaaS Platform',
      tagline: 'Cross-platform 3D avatar creation engine & scalable multiplayer SaaS infrastructure',
      description:
        'Engineered core 3D avatar mechanics, dynamic skeletal mesh deformation, accessory attachment systems, and scalable multiplayer synchronization pipelines for an enterprise B2B SaaS platform.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/AYlogo.webp',
      icon: '👤',
      techStack: ['Unity', 'C#', 'REST API', 'Unreal Engine', 'Skinning & Rigging', 'Cloud SaaS'],
      features: [
        'B2B SaaS product for cross-platform avatar authoring & dynamic rigging',
        'Real-time skeletal mesh bone binding & blendshapes',
        'Cross-platform avatar export & synchronization',
        'Scalable REST API cloud backend integration',
        'Modular wardrobe & skin customization architecture',
      ],
      links: [
        {
          label: 'Visit Avataryug',
          url: 'https://avataryug.com/showcase',
          type: 'case-study',
        },
      ],
      architectureDetails:
        'Combined custom SkinnedMeshRenderer combine utilities to merge multiple apparel draw calls into a single unified draw call, reducing batch overhead by 70%. Built cloud-connected pipeline for dynamic asset streaming in SaaS environments.',
      metrics: 'Enterprise B2B SaaS • Multi-Platform SDK',
    },
    // Real-Time Multiplayer Games
    {
      id: 'pool-royale',
      name: 'Pool Royale',
      category: 'multiplayer',
      categoryLabel: 'Multiplayer Sports',
      tagline: 'Real-time competitive 8-ball pool with custom physics & server reconciliation',
      description:
        'Built full-stack real-time competitive multiplayer gameplay with deterministic ball-on-ball collision physics, realistic spin and cue friction, cue angle calculations, and live matchmaking.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/poolroyale.png',
      icon: '🎱',
      techStack: ['Unity', 'C#', 'Photon PUN', 'PlayFab', 'Custom 2D/3D Physics'],
      features: [
        'Deterministic collision & ball deflection mechanics',
        'Real-time matchmaking & spectator lobbies',
        'PlayFab backend for inventories, cues & coins',
        'Smooth network interpolation & state reconciliation',
      ],
      links: [
        {
          label: 'Game Info',
          url: 'https://pool-royale-5r7.en.softonic.com/android?ex=RAMP-3507.3&rex=true',
          type: 'play',
        },
      ],
      architectureDetails:
        'Replaced standard PhysX non-deterministic solvers with a custom fixed-point mathematical ball simulator ensuring zero desync between mobile players on high-latency networks.',
      metrics: 'Over 100k+ Matches Simulated',
    },

    // Unity Asset Store Templates
    {
      id: 'bottle-shooter',
      name: 'Bottle Shooter 3D',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Complete 3D target shooting game template with ragdoll & fracture physics',
      description:
        'Commercial source-code template published on the official Unity Asset Store. Features modular weapon aiming systems, bullet trajectory ballistics, fracture glass physics, sound pooling, and responsive UI.',
      imageUrl: 'https://assetstorev1-prd-cdn.unity3d.com/package-screenshot/d4198f30-efc5-4b36-8bee-383f156f0c9e.webp',
      icon: '🎯',
      techStack: ['Unity', 'C#', 'Mesh Slicing', 'Audio Pooling', 'Asset Store'],
      features: [
        'Modular weapon system & trajectory calculation',
        'Dynamic glass shatter & mesh fracture effects',
        'Object pooling for particles & shell casings',
        'Comprehensive inspector documentation & clean code',
      ],
      links: [
        {
          label: 'Asset Store Package',
          url: 'https://assetstore.unity.com/packages/templates/bottle-shooter-89934',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'ace-bike-stunts',
      name: 'Ace Bike Stunts',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'High-octane motorcycle physics & airborne stunt engine template',
      description:
        'Full motorcycle physics starter kit featuring wheel colliders, suspension damping, mid-air gyroscope stabilization, stunt detection scoring, and checkpoint racetrack management.',
      imageUrl: 'https://assetstorev1-prd-cdn.unity3d.com/package-screenshot/4d8f99e2-edf9-4a7b-9f39-3969e9474f11.webp',
      icon: '🏍️',
      techStack: ['Unity', 'C#', 'WheelColliders', 'Suspension Math', 'Asset Store'],
      features: [
        'Custom 2-wheel physics controller with lean dynamics',
        'Mid-air trick detection & rotational combo system',
        'Configurable suspension, torque curves & brake forces',
        'Mobile touch steering & tilt accelerometer support',
      ],
      links: [
        {
          label: 'Asset Store Package',
          url: 'https://assetstore.unity.com/packages/templates/ace-bike-stunts-88565',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'ace-fighter',
      name: 'Ace Fighter Combat',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Aerial dogfight combat simulator with missile tracking & aerodynamics',
      description:
        'Complete 3D arcade flight mechanics template featuring aerodynamic lift/drag math, enemy target radar lock-on, homing heat-seeking missiles, and dogfight AI behaviors.',
      imageUrl: 'https://assetstorev1-prd-cdn.unity3d.com/package-screenshot/25cec6cb-1d35-4500-b302-63421e7ebaee.webp',
      icon: '✈️',
      techStack: ['Unity', 'C#', 'Aerodynamics', 'Targeting AI', 'Asset Store'],
      features: [
        'Full 6-DOF arcade aerodynamic physics',
        'Radar target lock-on & heat-seeker missile guidance',
        'Enemy dogfight AI with evasion patterns',
        'Cinematic cockpit & trailing chase cameras',
      ],
      links: [
        {
          label: 'Asset Store Package',
          url: 'https://assetstore.unity.com/packages/templates/ace-fighter-88101',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'rocket-escape',
      name: 'Rocket Escape',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Precision 2D/3D rocket thrust physics & procedural obstacle gauntlets',
      description:
        'Intense gravity-defying arcade template where players balance momentum, fuel management, and dual-thruster vectors to navigate procedural hazards.',
      imageUrl: 'https://assetstorev1-prd-cdn.unity3d.com/key-image/14f7b279-213f-43d9-9258-558d27907179.webp',
      icon: '🚀',
      techStack: ['Unity', 'C#', 'Vector Physics', 'Procedural Levels', 'Asset Store'],
      features: [
        'Dual-thruster vector physics with momentum inertia',
        'Fuel economy & thermal heat gauge mechanics',
        'Procedural obstacle generation algorithms',
        'Particle exhaust emitters & screen-shake feedback',
      ],
      links: [
        {
          label: 'Asset Store Package',
          url: 'https://assetstore.unity.com/packages/templates/rocket-escape-78174',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'nano-ninja-jump',
      name: 'Nano Ninja Jump',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Fast-paced vertical platformer with wall-climbing & combo mechanics',
      description:
        'Addictive vertical platformer featuring tight wall-jumping physics, obstacle hazards, enemy shuriken mechanics, and procedural platform spawning.',
      icon: '🥷',
      techStack: ['Unity', 'C#', '2D/3D Platforming', 'Object Spawner', 'Asset Store'],
      features: [
        'Fluid wall-sliding and wall-jump mechanics',
        'Dynamic platform generator with scrolling difficulty',
        'Combo multiplier scoring system',
        'Optimized for instant mobile startup & 60fps',
      ],
      links: [
        {
          label: 'Asset Store Package',
          url: 'https://assetstore.unity.com/packages/templates/nano-ninja-jump-67653',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: '3d-fill-template',
      name: '3D Fill - Puzzle Template',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Spatial 3D voxel puzzle mechanics & level progression system',
      description:
        'Complete 3D spatial voxel filling puzzle template. Includes customizable grid dimensions, block snap physics, level editor, and mobile-ready touch input.',
      icon: '🧊',
      techStack: ['Unity', 'C#', 'Voxel Grid', 'Level Editor', 'Asset Store'],
      features: [
        'Grid-based spatial block positioning & snap math',
        'Turnkey level editor with serialization',
        'Clean modular C# architecture & sound manager',
        'Optimized for mobile touch & WebGL',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/3d-fill-264484',
          type: 'store',
        },
        {
          label: 'Play WebGL Demo ↗',
          url: 'https://www.gamepix.com/play/3d-fill',
          type: 'play',
        },
      ],
      metrics: 'Official Unity Asset Store Template • Commercial Release',
    },
    {
      id: 'ball-destination',
      name: 'Ball Destination',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Physics-driven ball navigation & path routing puzzle template',
      description:
        'Turnkey physics puzzle template featuring dynamic ball momentum, path guide mechanics, bounce pads, obstacle physics, and progressive level unlock system.',
      icon: '⚽',
      techStack: ['Unity', 'C#', 'PhysX', 'Trajectory Math', 'Asset Store'],
      features: [
        'Precision trajectory & momentum physics controllers',
        'Interactive switches, bounce pads & directional portals',
        'Dynamic camera follow & isometric view framing',
        'Multi-stage level architecture with star rating',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/ball-destination-318217',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'fit-box',
      name: 'Fit Box',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Geometric shape fitting & spatial logic game starter kit',
      description:
        'Minimalist 3D spatial reasoning puzzle template. Features dynamic shape rotation, socket validation, satisfying snap animations, and clean modular level progression.',
      icon: '🔲',
      techStack: ['Unity', 'C#', 'Geometric Math', 'Animation Curves', 'Asset Store'],
      features: [
        'Precise bounding-box fitting & alignment algorithms',
        'Tactile haptic audio cues & juicy squash-stretch FX',
        'Level generation matrix with scalable difficulty',
        'Full mobile UI integration & pause/settings menu',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/fit-box-312788',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'step-box-template',
      name: 'Step Box - Puzzle Template',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Isometric grid platformer mechanics with reactive tile systems',
      description:
        'Isometric grid-based puzzle platformer template. Features reactive falling tiles, timed hazards, multi-directional movement solvers, and complete level configuration pipeline.',
      icon: '📦',
      techStack: ['Unity', 'C#', 'Isometric Grid', 'Reactive Tiles', 'Asset Store'],
      features: [
        'Tile-based discrete movement controller',
        'Disintegrating floors, pressure switches & elevators',
        'Isometric camera rig with smooth tracking',
        'Mobile virtual D-pad and swipe input handlers',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/step-box-311321',
          type: 'store',
        },
        {
          label: 'Play WebGL Demo ↗',
          url: 'https://www.gamepix.com/play/step-box',
          type: 'play',
        },
      ],
      metrics: 'Official Unity Asset Store Template • Multi-Platform',
    },
    {
      id: 'sequence',
      name: 'Sequence',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Brain-training pattern memory & numerical sequence puzzle kit',
      description:
        'Comprehensive memory and cognitive sequence puzzle game template. Features procedural pattern generator, audio-visual feedback nodes, timer mechanics, and combo multiplier scoring.',
      icon: '🔢',
      techStack: ['Unity', 'C#', 'Pattern Algorithms', 'Audio Synthesis', 'Asset Store'],
      features: [
        'Adaptive procedural sequence generation algorithm',
        'Harmonic audio cues paired with glowing tile nodes',
        'Customizable grid sizes (3x3 to 6x6) and speed tiers',
        'Persistent high score & player progress serializer',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/sequence-231381',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'color-fill',
      name: 'Color Fill 3D',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Satisfying color maze painter & surface trail painting template',
      description:
        'Popular arcade painter mechanic where players slide a roller block across an unpainted 3D maze, dynamically splattering vibrant paint across floor tiles until the board is 100% covered.',
      icon: '🎨',
      techStack: ['Unity', 'C#', 'Mesh Coloring', 'Maze Solvers', 'Asset Store'],
      features: [
        'Dynamic runtime trail mesh & splat paint shader',
        'Seamless tile-coverage percentage calculator',
        'Over 30+ procedurally scalable maze layouts',
        'Haptic vibration and juicy particle bursts',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/color-fill-314202',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'kick-out',
      name: 'Kick Out',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Physics brawler & arena knock-out arcade battle template',
      description:
        'Physics-driven arena arcade template where players push, ram, and kick opposing ragdolls or balls off circular platforms into the void with elastic momentum physics.',
      icon: '🥊',
      techStack: ['Unity', 'C#', 'PhysX Brawler', 'Arena Mechanics', 'Asset Store'],
      features: [
        'Elastic bumper collision & force-vector deflection',
        'Opponent AI with patrol and aggressive charge logic',
        'Shrinking arena boundaries & falling platform edges',
        'Ragdoll physics integration on knock-out impact',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/kick-out-313179',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: '2048-merge-template',
      name: '2048 Merge - Template',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Production-ready 2048 sliding number merge game template',
      description:
        'Complete commercial source code for 2048 number merging puzzle. Includes smooth tile animations, undo moves system, grid matrix solvers, particle merge FX, and sound manager.',
      icon: '🔢',
      techStack: ['Unity', 'C#', 'Matrix Math', 'Particle Systems', 'Asset Store'],
      features: [
        'Optimized grid array mathematical merge logic',
        'Undo system and state preservation stack',
        'Elastic squash-and-stretch tween animations',
        'Mobile touch swipe and keyboard arrow bindings',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/2048-merge-212641',
          type: 'store',
        },
        {
          label: 'Play WebGL Demo ↗',
          url: 'https://www.gamepix.com/play/2048-merge',
          type: 'play',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'jump-ball',
      name: 'Jump Ball',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Endless bouncing platformer with rhythmic obstacle dodging',
      description:
        'Addictive arcade platform jumper template featuring one-touch bounce mechanics, rotating pillar platforms, color hazards, and procedural vertical stage streaming.',
      icon: '🏀',
      techStack: ['Unity', 'C#', 'Spring Physics', 'Procedural Spawner', 'Asset Store'],
      features: [
        'Calculated spring-impulse bounce physics',
        'Rotating platform towers with hazard slice sections',
        'Dynamic color palette transitions every stage',
        'Endless procedural generation and score multiplier',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/jump-ball-311640',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'dot-dot',
      name: 'Dot Dot',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Minimalist precision timing & orbital dot synchronization template',
      description:
        'Hyper-casual reflex game starter kit where players time orbital rotations to connect matching dots without colliding into rotating orbit barricades.',
      icon: '⚪',
      techStack: ['Unity', 'C#', 'Orbital Physics', 'Minimalist UI', 'Asset Store'],
      features: [
        'Smooth circular trajectory and orbital rotation math',
        'One-tap precision timing input system',
        'Minimalist sleek flat design & sound fx',
        'Cross-platform iOS and Android support',
      ],
      links: [
        {
          label: 'Play WebGL Build 🎮',
          url: '/findmyspotunity',
          type: 'play',
        },
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/dot-dot-176671',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },
    {
      id: 'push',
      name: 'Push',
      category: 'assetstore',
      categoryLabel: 'Unity Asset Store',
      tagline: 'Isometric button pusher & logic circuit puzzle template',
      description:
        'Clean spatial puzzle template where players calculate sequential button-push orders to retract pins, trigger pressure plates, and clear mechanical circuit boards.',
      icon: '🔘',
      techStack: ['Unity', 'C#', 'Spatial Logic', 'Circuit Math', 'Asset Store'],
      features: [
        'Tactile button depression animations & mechanical clicks',
        'Non-intersecting path and reverse sequence logic',
        'Modular level schema for rapid stage creation',
        'Zen-like ambient aesthetic with zero time pressure',
      ],
      links: [
        {
          label: 'Asset Store Package ↗',
          url: 'https://assetstore.unity.com/packages/templates/packs/push-179613',
          type: 'store',
        },
      ],
      metrics: 'Official Unity Asset Store Template',
    },

    // Playable 3D Web Games
    {
      id: 'find-my-spot',
      name: 'Find My Spot',
      category: 'webgames',
      categoryLabel: 'Playable WebGL Game',
      tagline: 'High-speed orbital reflex puzzle & precision timing mechanics built with Unity WebGL',
      description:
        'A fast-paced, reflex-testing Unity 3D game. Players time orbital launch trajectories to accurately land the dot in designated spots while avoiding moving barricades and dynamic spatial hazards.',
      imageUrl: '/FindMySpot/TemplateData/webmemd-icon.png',
      icon: '🎯',
      techStack: ['Unity 3D', 'WebGL 2.0', 'C#', 'WebAssembly', 'Orbital Physics', 'Mobile Responsive'],
      features: [
        'Playable directly in browser via Unity WebGL 2.0',
        'Sub-16ms precision collision detection & hit registration',
        'Dynamic rotating obstacle rings & scalable level difficulty',
        'Smooth touch and click controls with haptic visual feedback',
      ],
      links: [
        {
          label: 'Play Game Now 🎮',
          url: '/findmyspotunity',
          type: 'play',
        },
      ],
      architectureDetails:
        'Built with Unity WebGL and C#. Utilizes custom fixed-timestep collision solver and minimal draw calls with GPU instancing. Packaged with Brotli compression and responsive canvas scaling for high-FPS browser execution.',
      metrics: 'Playable Online • 60 FPS WebGL Build • In-Portfolio Game',
    },
    {
      id: '3d-fill',
      name: '3D Fill',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Spatial logic puzzle requiring 3D block awareness & voxel pathfinding',
      description:
        'A challenging 3D puzzle game where players manipulate geometric voxels to completely fill intricate spatial contours within limited move counts.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/fill3d.png',
      icon: '🧊',
      techStack: ['Unity WebGL', 'C#', 'Voxel Math', 'Spatial Logic', 'GamePix'],
      features: [
        'Playable directly in the browser via WebGL',
        'Over 50+ hand-crafted spatial puzzle stages',
        'Satisfying voxel snap animations & haptic audio',
        'Published & featured globally on GamePix',
      ],
      links: [
        {
          label: 'Play Free on GamePix ↗',
          url: 'https://www.gamepix.com/play/3d-fill',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Global WebGL Release',
    },
    {
      id: 'step-box',
      name: 'Step Box',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Strategic grid platformer puzzle where every step triggers environmental reactions',
      description:
        'Interactive 3D puzzle platformer where players calculate sequential steps across floating tile matrices, avoiding falling tiles and timed hazard traps.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/stepbox.png',
      icon: '📦',
      techStack: ['Unity WebGL', 'C#', 'Grid Navigation', 'Puzzle Systems', 'GameArter'],
      features: [
        'Dynamic disintegrating tiles & elevator platforms',
        'Multi-stage checkpoint system with star ratings',
        'Playable on GamePix and GameArter platforms',
        'Smooth low-poly aesthetic & isometric camera',
      ],
      links: [
        {
          label: 'Play on GamePix ↗',
          url: 'https://www.gamepix.com/play/step-box',
          type: 'play',
        },
        {
          label: 'Play on GameArter ↗',
          url: 'https://www.gamearter.com/game/step-box/',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Dual Platform Release',
    },
    {
      id: 'impossible-bump-ball',
      name: 'Impossible Bump Ball',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Reflexive physics bouncer with dynamic rotational obstacles',
      description:
        'Vibrant one-tap arcade game with bouncy physics, rotational timing barriers, color matching deflectors, and procedural speed escalations.',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/impo.png',
      icon: '🔴',
      techStack: ['Unity WebGL', 'C#', 'Physics Bounce', 'Arcade Reflex'],
      features: [
        'Hyper-responsive one-touch physics mechanics',
        'Juicy juice effects: screen shake, squash & stretch',
        'Color-matched collision filter layers',
        'Instant web browser loading',
      ],
      links: [
        {
          label: 'Play on GamePix ↗',
          url: 'https://www.gamepix.com/play/impossible-bump-ball',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Instant WebGL',
    },
    {
      id: 'planet-merge',
      name: 'Planet Merge',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Satisfying gravitational physics puzzle with celestial chain reactions',
      description:
        'Drop and merge celestial bodies inside a gravitational jar. Watch tiny moons combine into planets, gas giants, and radiant suns with juicy physics feedback.',
      imageUrl: 'https://img.gamepix.com/games/planet-merge/cover/planet-merge.png',
      icon: '🪐',
      techStack: ['Unity WebGL', 'C#', '2D/3D Physics', 'Particle FX', 'GamePix'],
      features: [
        'Addictive Suika-style merging physics mechanics',
        'Dynamic gravitational impulse & elastic bounce',
        'Celestial star-burst particle FX and sound cues',
        'Global leaderboard high-score tracking',
      ],
      links: [
        {
          label: 'Play on GamePix ↗',
          url: 'https://www.gamepix.com/play/planet-merge',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Viral Mechanics',
    },
    {
      id: 'match-mania',
      name: 'Match Mania 3D',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Casual 3D object sorting & tile matching with real-time physics chaos',
      description:
        'Search through a pile of scattered 3D objects, match identical items, and clear the board before the countdown expires with realistic physics collisions.',
      imageUrl: 'https://img.gamepix.com/games/match-mania/cover/match-mania.png',
      icon: '🧩',
      techStack: ['Unity WebGL', 'C#', 'Physics Solvers', 'UI Animations'],
      features: [
        'Hundreds of colorful 3D props with PhysX dynamics',
        'Satisfying magnetic match slots & combo streaks',
        'Over 40+ escalating puzzle levels',
        'Optimized for mobile touch & desktop click',
      ],
      links: [
        {
          label: 'Play on GamePix ↗',
          url: 'https://www.gamepix.com/play/match-mania',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Casual 3D',
    },
    {
      id: '2048-merge',
      name: '2048 Merge',
      category: 'webgames',
      categoryLabel: 'Playable Web Game',
      tagline: 'Strategic number puzzle with cascading block merges & combo multipliers',
      description:
        'A dynamic 2048-style number puzzle built with Unity WebGL. Drop and slide matching numerical tiles to merge them into higher multiples, aiming for the 2048 tile and higher with chain reaction combos.',
      imageUrl: 'https://img.gamepix.com/games/2048-merge/cover/2048-merge.png',
      icon: '🔢',
      techStack: ['Unity WebGL', 'C#', 'Tile Logic', 'Particle FX', 'GamePix'],
      features: [
        'Addictive 2048 merging mechanics with physics impact',
        'Cascading combo streaks & score multiplier feedback',
        'Responsive drag and drop controls for touch and mouse',
        'Playable directly in-browser on GamePix with instant loading',
      ],
      links: [
        {
          label: 'Play on GamePix ↗',
          url: 'https://www.gamepix.com/play/2048-merge',
          type: 'play',
        },
      ],
      metrics: 'Playable Online • Puzzle WebGL Release',
    },
  ];

  get filteredProjects(): UnityProjectItem[] {
    return this.projects.filter((p) => {
      const matchesCategory =
        this.activeCategory === 'all' || p.category === this.activeCategory;
      const matchesSearch =
        !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.techStack.some((t) =>
          t.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(category: UnityCategory) {
    this.activeCategory = category;
  }

  openSpecs(project: UnityProjectItem) {
    this.selectedProject = project;
  }

  closeSpecs() {
    this.selectedProject = null;
  }

  getProjectRouterLink(proj: UnityProjectItem): string | null {
    const internalLink = proj.links.find((l) => l.url.startsWith('/'));
    return internalLink ? internalLink.url : null;
  }
}
