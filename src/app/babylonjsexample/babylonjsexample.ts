import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BabylonProjectItem {
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
  selector: 'app-babylonjsexample',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './babylonjsexample.html',
  styleUrl: './babylonjsexample.scss',
})
export class Babylonjsexample {
  readonly projects: BabylonProjectItem[] = [
    {
      id: 'element-table',
      route: '/babylonjs/element-table',
      title: '3D Periodic Table & Bohr Atom',
      tagline: 'Interactive 3D table of all 118 elements with animated atomic orbits',
      description:
        'Explore all 118 chemical elements in an interactive 3D periodic table. Hover or click any element to inspect its live 3D Bohr atom structure with spinning electron shells, energy levels, and elemental data.',
      tags: ['118 Elements', 'Bohr Atom Model', 'Dynamic Textures', 'Orbital Mechanics'],
      icon: '🧪',
      features: ['All 118 Elements & Categories', 'Animated Electron Shells', 'Element Inspector & Navigator', '3D Orbit Camera Controls'],
      gradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.22), rgba(156, 39, 176, 0.12))',
    },

  ];
}
