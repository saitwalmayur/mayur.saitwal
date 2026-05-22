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
}

@Component({
  selector: 'app-gaming-projects',
  imports: [CommonModule],
  templateUrl: './gaming-projects.html',
  styleUrl: './gaming-projects.scss',
})
export class GamingProjects {
  personalGames: Game[] = [
    {
      name: '3D Fill',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/fill3d.png',
      links: [{ label: 'Play Now', url: 'https://play.google.com/store/apps/details?id=com.EduIsFun.EduIsFun&pli=1' }]
    },
    {
      name: 'Step Box',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/stepbox.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/step-box' }]
    },
    {
      name: 'Impossible Bump Ball',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/impo.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/impossible-bump-ball' }]
    },
    {
      name: 'Snake Color',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/snakecolor.png',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/snake-color' }]
    },
    {
      name: 'Match Mania',
      links: [{ label: 'Play Now', url: 'https://www.gamepix.com/play/match-mania' }]
    }
  ];
}
