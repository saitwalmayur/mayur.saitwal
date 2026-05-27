import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GameLink {
  label: string;
  url: string;
}

export interface Game {
  name: string;
  imageUrl?: string;
  links: GameLink[];
  techStack?: string;
  details?: string;
}

@Component({
  selector: 'app-gaming-projects',
  imports: [CommonModule],
  templateUrl: './gaming-projects.html',
  styleUrl: './gaming-projects.scss',
})
export class GamingProjects {
  selectedGame: Game | null = null;

  personalGames: Game[] = [
    {
      name: '3D Fill',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/fill3d.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/3d-fill' }],
      techStack: 'Unity, C#, Photoshop, Blender',
      details: 'A challenging 3D puzzle game requiring spatial awareness to fill blocks.'
    },
    {
      name: 'Step Box',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/stepbox.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/step-box' }],
      techStack: 'Unity, C#, Photoshop, Blender',
      details: 'An interactive 3D platformer puzzle where every step requires a strategic move.'
    },
    {
      name: 'Impossible Bump Ball',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/impo.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/impossible-bump-ball' }],
      techStack: 'Unity, C#, Photoshop, Blender',
      details: 'A casual tap game with colorful graphics and bumping mechanics.'
    },
    {
      name: 'Snake Color',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/snakecolor.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/snake-color' }],
      techStack: 'Unity, C#, Photoshop, Blender',
      details: 'A modern, vibrant twist on the classic snake game mechanic.'
    },
    {
      name: 'Match Mania',
      imageUrl: 'https://img.gamepix.com/games/match-mania/cover/match-mania.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/match-mania' }],
      techStack: 'Unity, C#, Photoshop, Blender',
      details: 'A fun Match-3 style puzzle game with satisfying combo effects.'
    }
  ];

  openInfo(game: Game) {
    this.selectedGame = game;
  }

  closeInfo() {
    this.selectedGame = null;
  }
}
