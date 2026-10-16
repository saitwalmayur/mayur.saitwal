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
      id: 'shaders',
      route: '/threejs/shaders',
      title: 'Custom GLSL Shaders',
      tagline: 'Procedural vertex displacement & fragment wave dynamics',
      description:
        'Live GLSL shader pipeline executing custom math directly on the GPU. Manipulate mathematical waveforms, color harmonics, and fluid distortion in real time.',
      tags: ['GLSL', 'Vertex Shader', 'Fragment Shader', 'GPU Math'],
      icon: '✨',
      features: ['Real-time GPU Waveform', 'Preset Palettes', 'Live Uniform Tuning', 'Wireframe Morphing'],
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
  ];
}
