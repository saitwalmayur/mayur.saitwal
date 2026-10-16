import { Routes } from '@angular/router';
import { HomeScreen } from './home-screen/home-screen';
import { ContactScreen } from './contact-screen/contact-screen';
import { ExperienceScreen } from './experience-screen/experience-screen';
import { Projects } from './projects/projects';
import { Showcase } from './showcase/showcase';

export const routes: Routes = [
  { path: '', component: HomeScreen, title: 'Home | Mayur Saitwal' },
  { path: 'experience', component: ExperienceScreen, title: 'Experience | Mayur Saitwal' },
  { path: 'projects', component: Projects, title: 'Projects | Mayur Saitwal' },
  { path: 'showcase', component: Showcase, title: 'Showcase | Mayur Saitwal' },
  { path: 'contact', component: ContactScreen, title: 'Contact | Mayur Saitwal' },
  {
    path: 'threejs',
    title: 'Three.js Demo | Mayur Saitwal',
    loadComponent: () => import('./threejsexample/threejsexample').then((m) => m.Threejsexample),
  },
  {
    path: 'threejsexample',
    title: 'Three.js Demo | Mayur Saitwal',
    loadComponent: () => import('./threejsexample/threejsexample').then((m) => m.Threejsexample),
  },
  {
    path: 'threejs/shaders',
    title: 'Three.js Shaders | Mayur Saitwal',
    loadComponent: () => import('./threejsshader/threejsshader').then((m) => m.Threejsshader),
  },
  {
    path: 'threejsshader',
    title: 'Three.js Shaders | Mayur Saitwal',
    loadComponent: () => import('./threejsshader/threejsshader').then((m) => m.Threejsshader),
  },
  {
    path: 'threejs/model-viewer',
    title: '3D Model Viewer | Mayur Saitwal',
    loadComponent: () => import('./threedmodelviewer/threedmodelviewer').then((m) => m.Threedmodelviewer),
  },
  {
    path: 'threedmodelviewer',
    title: '3D Model Viewer | Mayur Saitwal',
    loadComponent: () => import('./threedmodelviewer/threedmodelviewer').then((m) => m.Threedmodelviewer),
  },
  {
    path: 'threejs/audio-visualizer',
    title: 'Audio Visualizer | Mayur Saitwal',
    loadComponent: () => import('./audiovisulizer/audiovisulizer').then((m) => m.Audiovisulizer),
  },
  {
    path: 'audiovisulizer',
    title: 'Audio Visualizer | Mayur Saitwal',
    loadComponent: () => import('./audiovisulizer/audiovisulizer').then((m) => m.Audiovisulizer),
  },
  {
    path: 'threejs/particles',
    title: 'Particle Effects | Mayur Saitwal',
    loadComponent: () => import('./threejsparticleeffects/threejsparticleeffects').then((m) => m.Threejsparticleeffects),
  },
  {
    path: 'threejsparticleeffects',
    title: 'Particle Effects | Mayur Saitwal',
    loadComponent: () => import('./threejsparticleeffects/threejsparticleeffects').then((m) => m.Threejsparticleeffects),
  },
  {
    path: 'threejs/chess',
    title: 'Three.js Chess | Mayur Saitwal',
    loadComponent: () => import('./threejschess/threejschess').then((m) => m.Threejschess),
  },
  {
    path: 'threejschess',
    title: 'Three.js Chess | Mayur Saitwal',
    loadComponent: () => import('./threejschess/threejschess').then((m) => m.Threejschess),
  },
  {
    path: 'chessgame',
    title: 'Chess Game | Mayur Saitwal',
    loadComponent: () => import('./threejschess/threejschess').then((m) => m.Threejschess),
  },
];
