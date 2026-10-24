import { Component, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface RelatedProject {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  routerLink?: string;
  externalUrl?: string;
}

@Component({
  selector: 'app-findmyspotunity',
  imports: [CommonModule, RouterLink],
  templateUrl: './findmyspotunity.html',
  styleUrl: './findmyspotunity.scss',
})
export class Findmyspotunity {
  @ViewChild('gameContainer') gameContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('gameIframe') gameIframeRef!: ElementRef<HTMLIFrameElement>;

  readonly gameUrl = '/FindMySpot/index.html';
  currentIframeSrc = '/FindMySpot/index.html';
  
  isLoading = true;
  isDeviceFrame = true;
  isFullscreen = false;
  activeTab: 'guide' | 'tech' | 'features' = 'guide';
  isBrowser = false;

  readonly relatedProjects: RelatedProject[] = [
    {
      id: 'unityprojects',
      name: 'Unity 3D Portfolio',
      category: 'Engine Showcase',
      icon: '🎮',
      description: 'Explore 15+ commercial games, Asset Store packages, and multiplayer systems.',
      routerLink: '/unityprojects',
    },
    {
      id: 'lowpolyopenworld',
      name: 'Procedural Open World',
      category: 'Three.js / 3D',
      icon: '🌲',
      description: 'Infinite procedurally generated biomes, day/night cycles, and terrain noise.',
      routerLink: '/lowpolyopenworld',
    },
    {
      id: 'apple-vision-pro',
      name: 'Apple Vision Pro Twin',
      category: 'Spatial Computing',
      icon: '🥽',
      description: 'Award-winning enterprise spatial computing digital twin built with Unity & visionOS.',
      routerLink: '/unityprojects',
    },
    {
      id: 'pool-royale',
      name: 'Pool Royale 3D',
      category: 'Multiplayer Sports',
      icon: '🎱',
      description: 'Real-time competitive multiplayer 8-ball pool with custom deterministic physics.',
      routerLink: '/unityprojects',
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  onIframeLoad() {
    // Give Unity runtime a brief moment to initialize before dismissing the overlay
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  restartGame() {
    this.isLoading = true;
    // Force iframe reload by re-assigning src with timestamp
    this.currentIframeSrc = `${this.gameUrl}?t=${Date.now()}`;
  }

  toggleDeviceFrame() {
    this.isDeviceFrame = !this.isDeviceFrame;
  }

  toggleFullscreen() {
    if (!this.isBrowser) return;

    const elem = this.gameContainerRef?.nativeElement;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          this.isFullscreen = true;
        }).catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        });
      }
    }
  }

  setTab(tab: 'guide' | 'tech' | 'features') {
    this.activeTab = tab;
  }
}
