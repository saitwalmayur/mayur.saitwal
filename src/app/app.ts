import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TopPanel } from './top-panel/top-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  protected readonly title = signal('mayursaitwal');
  protected readonly isThreeJs = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.checkRoute(event.urlAfterRedirects || event.url);
      });

    this.checkRoute(this.router.url);
  }

  private checkRoute(url: string) {
    const isThree =
      url.includes('/threejs') ||
      url.includes('/threejsexample') ||
      url.includes('/threejsshader') ||
      url.includes('/threedmodelviewer') ||
      url.includes('/audiovisulizer') ||
      url.includes('/threejsparticleeffects');

    this.isThreeJs.set(isThree);
  }
}
