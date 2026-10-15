import { Routes } from '@angular/router';
import { HomeScreen } from './home-screen/home-screen';
import { ContactScreen } from './contact-screen/contact-screen';
import { ExperienceScreen } from './experience-screen/experience-screen';
import { Projects } from './projects/projects';
import { Showcase } from './showcase/showcase';

export const routes: Routes = [
  { path: '', component: HomeScreen },
  { path: 'experience', component: ExperienceScreen },
  { path: 'projects', component: Projects },
  {
    path: 'threejs',
    loadComponent: () => import('./threejsexample/threejsexample').then((m) => m.Threejsexample),
  },
  {
    path: 'threejsexample',
    loadComponent: () => import('./threejsexample/threejsexample').then((m) => m.Threejsexample),
  },
  {
    path: 'threejs/shaders',
    loadComponent: () => import('./threejsshader/threejsshader').then((m) => m.Threejsshader),
  },
  {
    path: 'threejsshader',
    loadComponent: () => import('./threejsshader/threejsshader').then((m) => m.Threejsshader),
  },
  {
    path: 'threejs/model-viewer',
    loadComponent: () => import('./threedmodelviewer/threedmodelviewer').then((m) => m.Threedmodelviewer),
  },
  {
    path: 'threedmodelviewer',
    loadComponent: () => import('./threedmodelviewer/threedmodelviewer').then((m) => m.Threedmodelviewer),
  },
  {
    path: 'threejs/audio-visualizer',
    loadComponent: () => import('./audiovisulizer/audiovisulizer').then((m) => m.Audiovisulizer),
  },
  {
    path: 'audiovisulizer',
    loadComponent: () => import('./audiovisulizer/audiovisulizer').then((m) => m.Audiovisulizer),
  },
  {
    path: 'threejs/particles',
    loadComponent: () => import('./threejsparticleeffects/threejsparticleeffects').then((m) => m.Threejsparticleeffects),
  },
  {
    path: 'threejsparticleeffects',
    loadComponent: () => import('./threejsparticleeffects/threejsparticleeffects').then((m) => m.Threejsparticleeffects),
  },
  { path: 'showcase', component: Showcase },
  { path: 'contact', component: ContactScreen },
];
