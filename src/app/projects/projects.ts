import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  name: string;
  imageUrl?: string;
  links: ProjectLink[];
  techStack?: string;
  details?: string;
}

@Component({
  selector: 'app-projects',
  imports: [CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  selectedProject: Project | null = null;
  selectedPlayProject: Project | null = null;

  openPlayLinks(project: Project) {
    this.selectedPlayProject = project;
  }

  closePlayLinks() {
    this.selectedPlayProject = null;
  }

  professionalProjects: Project[] = [
    {
      name: 'Avataryug',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/AYlogo.webp',
      links: [{ label: 'Detail', url: 'https://avataryug.com/showcase' }],
      techStack: 'Unity, C#, Rest API, Unreal Engine',
      details: 'Developed core mechanics and scalable multiplayer systems used for enterprise gaming.'
    },
    {
      name: 'Pool Royale',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/poolroyale.png',
      links: [{ label: 'Detail', url: 'https://pool-royale-5r7.en.softonic.com/android?ex=RAMP-3507.3&rex=true' }],
      techStack: 'Unity, C#, Playfab, Photon',
      details: 'Built scalable real-time gameplay experiences and player progression features.'
    },
    {
      name: 'Digital Twin - Apple Vision Pro',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
      links: [{ label: 'Detail', url: 'https://www.linkedin.com/posts/tata-consultancy-services-north-america_tcsnycmarathon-runwithtcs-runwithtcsinnyc-ugcPost-7258484777668743169-vD4l/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY' }],
      techStack: 'Photoshop, Unity, C#, Blender, Xcode',
      details: 'Led the development of a spatial computing application on Apple Vision Pro, recognized with two Gold awards.'
    },
    {
      name: 'CNC Machine 3D Platform',
      imageUrl: 'https://raw.githubusercontent.com/saitwalmayur/saitwalmayur/main/icon/applevision.png',
      links: [{ label: 'Detail', url: 'https://www.linkedin.com/posts/thapasjoseph_augmentedreality-virtualreality-spatialcomputing-activity-7295082810858524673-hpVv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAduOT4BroteUiiLGXBzeJpj6T4oXuEQ0VY' }],
      techStack: 'Angular, Three.js, C#, Blender',
      details: 'Built an interactive CNC machine visualization platform for inspecting parts and managing spare-part procurement.'
    }
  ];

  indieProjects: Project[] = [
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
      links: [
        { label: 'GamePix', url: 'https://www.gamepix.com/play/step-box' },
        { label: 'GameArter', url: 'https://www.gamearter.com/game/step-box/' }
      ],
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

  openInfo(project: Project) {
    this.selectedProject = project;
  }

  closeInfo() {
    this.selectedProject = null;
  }
}
