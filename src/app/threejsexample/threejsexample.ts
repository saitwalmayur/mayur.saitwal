import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ThreeProjectItem {
  id: string;
  route: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  icon: string;
  features: string[];
  gradient: string;
}

@Component({
  selector: 'app-threejsexample',
  imports: [CommonModule, RouterLink],
  templateUrl: './threejsexample.html',
  styleUrl: './threejsexample.scss',
})
export class Threejsexample {
  readonly projects: ThreeProjectItem[] = [
    {
      id: 'fluidexample1',
      route: '/threejs/fluidexample1',
      title: 'Particle Fluids Simulation',
      tagline: 'Position-Based Dynamics & SPH fluid physics engine in Three.js',
      description:
        'Interactive real-time 3D particle fluid simulation inspired by Dan Greenheck’s threejs-particle-fluids. Features dam break, water drop impact, viscous honey coiling, whirlpool vortices, and multiphase liquids with live telemetry.',
      tags: ['Three.js', 'PBD Fluids', 'SPH Simulation', 'Spatial Hashing', 'Viscoelastic', 'Multiphase'],
      icon: '🌊',
      features: ['Dam Break & Crown Splash', 'Viscous Honey Coiling', 'Vortex Whirlpools', 'Spatial Hash Grid', 'Interactive Splash Tool'],
      gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(99, 102, 241, 0.1))',
    },
    {
      id: 'shaders',
      route: '/threejs/shaders',
      title: 'Custom GLSL Shaders',
      tagline: 'Procedural vertex displacement, UV pan flow & fragment dynamics',
      description:
        'Live GLSL shader pipeline executing custom math directly on the GPU. Manipulate mathematical waveforms, animated UV pan flows, color harmonics, and cyber grid dynamics in real time.',
      tags: ['GLSL', 'UV Pan Shader', 'Vertex Displacement', 'Fragment Shader', 'GPU Math'],
      icon: '✨',
      features: ['UV Pan & Wave Shaders', 'Directional Pan Flow', 'Preset Palettes', 'Live Uniform Tuning', 'Wireframe Morphing'],
      gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.05))',
    },
    {
      id: 'model-viewer',
      route: '/threejs/model-viewer',
      title: '3D Model Viewer & Studio',
      tagline: 'Interactive 3D model inspector with lighting & GLTF support',
      description:
        'Studio environment with 3-point lighting, ground grid, and smooth OrbitControls. Inspect built-in procedural models or load your own .GLTF / .GLB files directly.',
      tags: ['GLTF / GLB', 'PBR Materials', 'Studio Lighting', 'OrbitControls'],
      icon: '🛸',
      features: ['GLB/GLTF File Upload', 'Preset 3D Models', 'Lighting Controls', 'Real-time Polycount'],
      gradient: 'linear-gradient(135deg, rgba(150, 201, 61, 0.2), rgba(0, 242, 254, 0.05))',
    },
    {
      id: 'audio-visualizer',
      route: '/threejs/audio-visualizer',
      title: 'Audio-Reactive Visualizer',
      tagline: 'Real-time frequency spectrum & dynamic 3D audio waves',
      description:
        'Interactive Web Audio API synthesizer connected to a Three.js 3D waveform visualizer. Watch geometric rings and spectrum bars dance to sound frequencies.',
      tags: ['Web Audio API', 'Frequency Analyzer', 'Dynamic Geometry', 'Audio Waveform'],
      icon: '🎵',
      features: ['Live Audio Synthesis', 'FFT Frequency Spectrum', 'Dynamic 3D Rings', 'Interactive Beats'],
      gradient: 'linear-gradient(135deg, rgba(229, 46, 113, 0.2), rgba(255, 138, 0, 0.05))',
    },
    {
      id: 'particles',
      route: '/threejs/particles',
      title: '3D Particle Vortex & Galaxy',
      tagline: 'GPU particle galaxy with cursor force fields & turbulence',
      description:
        'High-performance 3D particle simulation with thousands of luminous points orbiting in mathematical vortex fields, reacting dynamically to mouse movement.',
      tags: ['BufferGeometry', 'Particle Physics', 'Vortex Math', 'Interactive Controls'],
      icon: '🌌',
      features: ['5,000+ GPU Points', 'Mouse Attraction Field', 'Color Wave Cycles', 'Turbulence Physics'],
      gradient: 'linear-gradient(135deg, rgba(121, 40, 202, 0.25), rgba(0, 242, 254, 0.05))',
    },
    {
      id: 'chess',
      route: '/threejs/chess',
      title: '3D Chess Arena vs AI',
      tagline: 'Interactive 3D chess game with intelligent minimax AI engine',
      description:
        'Battle against an autonomous chess AI in an immersive 3D arena. Features raycasting piece selection, legal move guidance, smooth leap animations, move notation, and adjustable AI difficulty.',
      tags: ['Game AI', 'Raycasting', 'Procedural 3D Pieces', 'Minimax'],
      icon: '♟️',
      features: ['Minimax AI Opponent', '3 Difficulty Levels', 'Move History Log', 'Multi-Angle Camera'],
      gradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 242, 254, 0.05))',
    },
    {
      id: 'openworld',
      route: '/threejs/openworld',
      title: 'Procedural 3D Open World',
      tagline: 'Infinite procedural terrain, dynamic biomes & 3rd-person character controller',
      description:
        'Explore an endless procedurally generated 3D open world. Features third-person character movement with physics & animations, dynamic terrain chunk streaming, biomes, foliage, day/night lighting, and smooth third-person camera.',
      tags: ['Procedural World', '3rd-Person Controller', 'Perlin Noise', 'Chunk Streaming', 'Dynamic Biomes'],
      icon: '🌍',
      features: ['Third-Person Character Controller', 'Procedural Heightmap & Chunks', 'Trees, Rocks & Foliage', 'Day/Night Cycle & Atmospheric Fog', 'WASD + Sprint + Jump Controls'],
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.1))',
    },
    {
      id: 'lowpolyopenworld',
      route: '/threejs/lowpolyopenworld',
      title: 'Low-Poly Procedural World',
      tagline: 'Infinite world generated procedurally with FBX low-poly assets & rich biomes',
      description:
        'Endless low-poly procedural landscape rendered with stylized FBX assets (mountains, trees, boulders, shrubs, flora, fallen timber). Features Red Rock Canyon and Lush Forest biomes, chunk streaming, dynamic day/night cycles, and third-person explorer.',
      tags: ['FBX Assets', 'Low-Poly World', 'Procedural Terrain', 'Red Canyon & Lush Forest', 'Dynamic Chunks'],
      icon: '🏔️',
      features: ['30+ Low-Poly FBX Assets', 'Red Rock Canyon & Lush Forest', 'Non-Indexed Faceted Meshes', 'Dynamic Chunk Streaming', 'Third-Person Explorer & Mobile Controls'],
      gradient: 'linear-gradient(135deg, rgba(234, 88, 12, 0.3), rgba(16, 185, 129, 0.2))',
    },
    {
      id: 'environment1',
      route: '/threejs/environment1',
      title: 'Low-Poly Modular Environment (Env1)',
      tagline: '700+ low-poly FBX asset world, third-person game explorer & asset exhibition',
      description:
        'Interactive modular 3D game world constructed from 700+ Env1 low-poly FBX assets. Features handcrafted island diorama with river, forest, bone desert, and crystal plateau, playable third-person character, time-of-day lighting, and full model exhibition.',
      tags: ['700+ FBX Assets', 'Modular Tiles', 'Third-Person Game', 'Asset Exhibition', 'Three.js'],
      icon: '🏝️',
      features: ['Modular Ground & River Tiles', 'Third-Person Game Explorer', 'Asset Catalog & In-World Spawner', 'Museum Exhibition Row Mode', 'Day / Sunset / Night Lighting'],
      gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.28), rgba(99, 102, 241, 0.18))',
    },
    {
      id: 'cementindustry',
      route: '/cementindustry',
      title: '3D Cement Process Flow Visualization',
      tagline: 'Interactive process engineering infographic with animated gas, dust & water spray',
      description:
        'Compact 3D cement process flow diagram featuring Rotary Kiln, Gas Conditioning Tower (GCT), Cyclone Preheater, Fabric Filter Baghouse, and Exhaust Stack with ID fan. Includes animated warm gas flow, Lechler twin-fluid water spray lances, dust vortex streams, raycasted equipment inspection, and technical engineering parameters.',
      tags: ['Lechler Spray Tech', 'Process Engineering', '3D Infographic', 'Three.js', 'Particle Systems'],
      icon: '🏭',
      features: ['Rotary Kiln & SNCR DeNOx Lance', 'GCT 100% Evaporative Cooling', 'Cyclone Dust Vortex Centrifugal Separation', 'Baghouse Filter Pulse-Jet Matrix', 'Raycaster Equipment Inspector & Specs Drawer'],
      gradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(249, 115, 22, 0.22))',
    },
    {
      id: 'roboticsarm',
      route: '/threejs/roboticsarm',
      title: '6-Axis Industrial Robotic Arm (Pick & Place)',
      tagline: 'Precision factory automation, PBR metallic textures, pick-and-place flow & joint controls',
      description:
        'Industrial robotic automation workcell featuring an articulate multi-axis robotic arm with dual gripper fingers transferring machined cyber battery components between Infeed and Outfeed conveyor stations. Features PBR textured metallic shaders, automatic continuous pick-and-place loop, real-time 6-DOF joint telemetry, manual teleoperation sliders, audio feedback, and multi-angle camera inspection.',
      tags: ['Three.js', 'Robotic Arm', 'Pick & Place', 'GLTF / PBR', 'Factory Automation', 'Web Audio API'],
      icon: '🦾',
      features: ['Automated Pick & Place Workcell', 'Dual Infeed & Outfeed Conveyors', 'Interactive Manual 6-DOF Sliders', 'PBR Metallic & Normal Maps', 'Real-Time Joint Telemetry HUD', 'Multi-Angle Camera Presets'],
      gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.35), rgba(59, 130, 246, 0.2))',
    },
    {
      id: 'gearboxes',
      route: '/threejs/gearboxes',
      title: 'Industrial 3D Gearboxes & Mechanical Kinematics',
      tagline: 'Interactive mechanical engineering simulation of 29 real-world gearboxes, bevel transmissions & kinematic mechanisms',
      description:
        'Interactive mechanical engineering simulation showcasing 29 distinct industrial gear transmissions, gearboxes, and kinematic mechanisms: Planetary Epicyclic, Worm Speed Reducers, Conical 90° Bevels, Hypoid Differentials, Double-Helical Herringbones, Multi-Speed Manual Automotive Transmissions, Geneva Beaver-Tail Indexing Drives, Hypocycloid Scotch Yokes, Nautilus Spiral Gears, and 3D Interlocking Cube Gears. Features PBR metallic reflections, X-Ray & Cutaway housing modes, real-time kinematics, and search/filtering.',
      tags: ['Three.js', 'Mechanical Engineering', '29 Gearboxes', 'Kinematics', 'Planetary Gears', 'Metallic Shaders'],
      icon: '⚙️',
      features: ['29 Industrial Models & Kinematics', 'Synchronized Gear Motion Mechanics', 'PBR Metallic Finish Selector', 'X-Ray & Cutaway Housing Views', 'Model Search & Category Filters', 'Engineering Velocity Telemetry HUD'],
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(16, 185, 129, 0.22))',
    },
    {
      id: 'ductpipes',
      route: '/threejs/ductpipes',
      title: 'Industrial Factory Spiral Ductwork Structure',
      tagline: 'Massive multi-tier factory ventilation structure with 1.5m spiral-seam ducts, gored elbows, blowers & GLB export',
      description:
        'Large-scale industrial plant ventilation structure modeled directly after industrial factory reference installations. Features massive 1.5m spiral-wound galvanized ducts with helical seams, 5-piece segmented gored 90° elbows, aerodynamic conical reducers, down-firing vertical drops with bell-mouth diffusers, centrifugal blower fans with electric motors, high-bay steel roof trusses, animated airflow streamlines, and 1-click GLB 3D model export.',
      tags: ['Three.js', 'Industrial Spiral Ducts', 'Factory Ventilation', 'Gored Elbows', 'Blower Fans', 'GLB Export'],
      icon: '🏭',
      features: [
        'Massive 1.5m Spiral-Seam Round Duct Trunk',
        '5-Piece Segmented Gored 90° Elbows',
        'Aerodynamic Conical Transition Reducers',
        'Downward Vertical Drops with Bellmouth Diffusers',
        'Centrifugal Fan Blowers with Electric Motors',
        '1-Click GLB 3D Model File Download',
      ],
      gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.4), rgba(16, 185, 129, 0.25))',
    },
    {
      id: 'ductfaucet',
      route: '/threejs/ductfaucet',
      title: 'Industrial Factory Spiral Ductwork Structure',
      tagline: 'Massive multi-tier factory ventilation structure with 1.5m spiral-seam ducts, gored elbows, blowers, and GLB export',
      description:
        'Large-scale industrial plant ventilation structure modeled directly after industrial factory reference installations. Features massive 1.5m spiral-wound galvanized ducts with helical seams, 5-piece segmented gored 90° elbows, aerodynamic conical reducers, down-firing vertical drops with bell-mouth diffusers, centrifugal blower fans with electric motors, high-bay steel roof trusses, animated airflow streamlines, and 1-click GLB 3D model export.',
      tags: ['Three.js', 'Industrial Spiral Ducts', 'Factory Ventilation', 'Gored Elbows', 'Blower Fans', 'GLB Export'],
      icon: '🏭',
      features: [
        'Massive 1.5m Spiral-Seam Round Duct Trunk',
        '5-Piece Segmented Gored 90° Elbows',
        'Aerodynamic Conical Transition Reducers',
        'Downward Vertical Drops with Bellmouth Diffusers',
        'Centrifugal Fan Blowers with Electric Motors',
        '1-Click GLB 3D Model File Download',
      ],
      gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.4), rgba(16, 185, 129, 0.25))',
    },
    {
      id: 'ludo',
      route: '/threejs/ludo',
      title: '3D Ludo Arena (2-4 Players)',
      tagline: 'Multiplayer 3D Ludo with Real Players & Computer AI Bots',
      description:
        'Full classic Ludo recreated in WebGL with luxury 3D board, procedural pawns, 3D animated tumbling dice with pips, Web Audio sound effects, and configurable 2, 3, or 4 players with Real Player or Computer AI opponents.',
      tags: ['Three.js', 'Ludo Game', 'Game AI', '3D Physics Dice', 'Web Audio API'],
      icon: '🎲',
      features: ['2, 3, or 4 Players Support', 'Real Player or AI Bot Option', '3D Tumbling Rolling Dice', 'Step-by-Step Hop Animations', 'Captures & Extra Turns', 'Multi-Angle Camera'],
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(59, 130, 246, 0.15))',
    },
    {
      id: 'tictactoe',
      route: '/threejs/tictactoe',
      title: '3D Tic-Tac-Toe Arena',
      tagline: 'Futuristic 3D WebGL Tic-Tac-Toe with Minimax AI & Raycasting',
      description:
        'Sleek 3D Tic-Tac-Toe built with Three.js. Features raycasted tile selection, animated neon 3D X & O pieces, winning laser beam, Web Audio sound effects, and intelligent Minimax AI or 2-player mode.',
      tags: ['Three.js', 'Tic-Tac-Toe', 'Minimax AI', 'Raycasting', 'Web Audio API'],
      icon: '⭕',
      features: ['Unbeatable Minimax AI', '2-Player Local Mode', 'Drop Bounce Animation', 'Winning Laser Line', 'Audio Synthesis'],
      gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(244, 63, 94, 0.15))',
    },
    {
      id: 'tetris',
      route: '/threejs/tetris',
      title: '3D Tetris Arena (Blockout)',
      tagline: 'Cyberpunk 3D WebGL Tetris with Pitch/Yaw/Roll Rotations & Layer Clears',
      description:
        'Step into the 3D pit in this cyberpunk WebGL recreation of 3D Tetris (Blockout). Manipulate falling polyominoes across 3 axes of rotation, inspect with 3D orbit camera, track layer depth fill gauges, and clear full horizontal slices with explosive neon particles.',
      tags: ['Three.js', '3D Tetris', 'Blockout', 'Spatial Puzzle', 'Web Audio API', 'Particle Physics'],
      icon: '🧊',
      features: ['3D Pitch, Yaw & Roll Rotations', '3D Ghost Drop Projection', 'Holographic Next & Hold Pedestals', 'Explosive Layer Collapse', 'Synthesized Audio Effects', 'Multi-Angle Camera Views'],
      gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.3), rgba(168, 85, 247, 0.18))',
    },
  ];
}
