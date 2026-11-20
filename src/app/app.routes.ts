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
  {
    path: 'react',
    component: Projects,
    title: 'React Projects | Mayur Saitwal',
    data: { category: 'react' },
  },
  {
    path: 'reactprojects',
    component: Projects,
    title: 'React Projects | Mayur Saitwal',
    data: { category: 'react' },
  },
  {
    path: 'react-native',
    component: Projects,
    title: 'React Native Projects | Mayur Saitwal',
    data: { category: 'react-native' },
  },
  {
    path: 'reactnative',
    component: Projects,
    title: 'React Native Projects | Mayur Saitwal',
    data: { category: 'react-native' },
  },
  {
    path: 'angular',
    component: Projects,
    title: 'Angular Projects | Mayur Saitwal',
    data: { category: 'angular' },
  },
  {
    path: 'angularprojects',
    component: Projects,
    title: 'Angular Projects | Mayur Saitwal',
    data: { category: 'angular' },
  },
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
  {
    path: 'threejs/openworld',
    title: 'Procedural Open World | Mayur Saitwal',
    loadComponent: () => import('./openworld/openworld').then((m) => m.Openworld),
  },
  {
    path: 'openworld',
    title: 'Procedural Open World | Mayur Saitwal',
    loadComponent: () => import('./openworld/openworld').then((m) => m.Openworld),
  },
  {
    path: 'threejs/lowpolyopenworld',
    title: 'Low-Poly Open World | Mayur Saitwal',
    loadComponent: () => import('./lowpolyopenworld/lowpolyopenworld').then((m) => m.Lowpolyopenworld),
  },
  {
    path: 'lowpolyopenworld',
    title: 'Low-Poly Open World | Mayur Saitwal',
    loadComponent: () => import('./lowpolyopenworld/lowpolyopenworld').then((m) => m.Lowpolyopenworld),
  },
  {
    path: 'threejs/environment1',
    title: 'Low-Poly Modular Environment (Env1) | Three.js | Mayur Saitwal',
    loadComponent: () => import('./environment1/environment1').then((m) => m.Environment1),
  },
  {
    path: 'environment1',
    title: 'Low-Poly Modular Environment (Env1) | Three.js | Mayur Saitwal',
    loadComponent: () => import('./environment1/environment1').then((m) => m.Environment1),
  },
  {
    path: 'threejs/cementindustry',
    title: 'Cement Process Flow 3D | Lechler Spray Technology | Mayur Saitwal',
    loadComponent: () =>
      import('./indstry/lechler/cementindustry/cementindustry').then((m) => m.Cementindustry),
  },
  {
    path: 'cementindustry',
    title: 'Cement Process Flow 3D | Lechler Spray Technology | Mayur Saitwal',
    loadComponent: () =>
      import('./indstry/lechler/cementindustry/cementindustry').then((m) => m.Cementindustry),
  },
  {
    path: 'indstry/lechler/cementindustry',
    title: 'Cement Process Flow 3D | Lechler Spray Technology | Mayur Saitwal',
    loadComponent: () =>
      import('./indstry/lechler/cementindustry/cementindustry').then((m) => m.Cementindustry),
  },
  {
    path: 'threejs/roboticsarm',
    title: '6-Axis Industrial Robotic Arm | Pick & Place | Mayur Saitwal',
    loadComponent: () => import('./roboticarm/roboticarm').then((m) => m.Roboticarm),
  },
  {
    path: 'roboticsarm',
    title: '6-Axis Industrial Robotic Arm | Pick & Place | Mayur Saitwal',
    loadComponent: () => import('./roboticarm/roboticarm').then((m) => m.Roboticarm),
  },
  {
    path: 'threejs/roboticarm',
    title: '6-Axis Industrial Robotic Arm | Pick & Place | Mayur Saitwal',
    loadComponent: () => import('./roboticarm/roboticarm').then((m) => m.Roboticarm),
  },
  {
    path: 'roboticarm',
    title: '6-Axis Industrial Robotic Arm | Pick & Place | Mayur Saitwal',
    loadComponent: () => import('./roboticarm/roboticarm').then((m) => m.Roboticarm),
  },
  {
    path: 'threejs/gearboxes',
    title: 'Interactive 3D Industrial Gearboxes | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxes/gearboxes').then((m) => m.Gearboxes),
  },
  {
    path: 'gearboxes',
    title: 'Interactive 3D Industrial Gearboxes | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxes/gearboxes').then((m) => m.Gearboxes),
  },
  {
    path: 'threejs/gearbox',
    title: 'Interactive 3D Industrial Gearboxes | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxes/gearboxes').then((m) => m.Gearboxes),
  },
  {
    path: 'gearbox',
    title: 'Interactive 3D Industrial Gearboxes | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxes/gearboxes').then((m) => m.Gearboxes),
  },
  {
    path: 'threejs/gearboxhome',
    title: 'Industrial 3D Gearbox Engineering Hub | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxhome/gearboxhome').then((m) => m.Gearboxhome),
  },
  {
    path: 'gearboxhome',
    title: 'Industrial 3D Gearbox Engineering Hub | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./gearboxhome/gearboxhome').then((m) => m.Gearboxhome),
  },
  {
    path: 'threejs/ductpipes',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'threejs/ductpipers',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'threejs/ductpopers',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'threejs/ductcleaning',
    title: 'Industrial Duct Cleaning & Rotary Nozzles | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'ductcleaning',
    title: 'Industrial Duct Cleaning & Rotary Nozzles | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'ductpipes',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'ductpipers',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'ductpopers',
    title: 'Industrial HVAC Duct Pipes Network | Three.js | Mayur Saitwal',
    loadComponent: () => import('./ductpipes/ductpipes').then((m) => m.Ductpipes),
  },
  {
    path: 'ductfaucetproject',
    title: 'Modular Circular Duct & Lechler Retractable Spray Cleaning | Three.js | Mayur Saitwal',
    loadComponent: () =>
      import('./ductfaucetproject/ductfaucetproject').then((m) => m.Ductfaucetproject),
  },
  {
    path: 'ductfaucet',
    title: 'Modular Circular Duct & Lechler Retractable Spray Cleaning | Three.js | Mayur Saitwal',
    loadComponent: () =>
      import('./ductfaucetproject/ductfaucetproject').then((m) => m.Ductfaucetproject),
  },
  {
    path: 'threejs/ductfaucetproject',
    title: 'Modular Circular Duct & Lechler Retractable Spray Cleaning | Three.js | Mayur Saitwal',
    loadComponent: () =>
      import('./ductfaucetproject/ductfaucetproject').then((m) => m.Ductfaucetproject),
  },
  {
    path: 'threejs/ductfaucet',
    title: 'Modular Circular Duct & Lechler Retractable Spray Cleaning | Three.js | Mayur Saitwal',
    loadComponent: () =>
      import('./ductfaucetproject/ductfaucetproject').then((m) => m.Ductfaucetproject),
  },
  {
    path: 'threejs/fluidexample1',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'fluidexample1',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'threejs/fluidsexample1',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'fluidsexample1',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'threejs/particle-fluids',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'particle-fluids',
    title: 'Three.js Particle Fluids Simulation | Position-Based Dynamics | Mayur Saitwal',
    loadComponent: () =>
      import('./fluidsexample1/fluidsexample1').then((m) => m.Fluidsexample1),
  },
  {
    path: 'unity',
    title: 'Unity 3D | Mayur Saitwal',
    loadComponent: () => import('./unityprojects/unityprojects').then((m) => m.Unityprojects),
  },
  {
    path: 'unityprojects',
    title: 'Unity 3D | Mayur Saitwal',
    loadComponent: () => import('./unityprojects/unityprojects').then((m) => m.Unityprojects),
  },
  {
    path: 'findmyspotunity',
    title: 'Find My Spot - Unity 3D Game | Mayur Saitwal',
    loadComponent: () => import('./findmyspotunity/findmyspotunity').then((m) => m.Findmyspotunity),
  },
  {
    path: 'findmyspot',
    title: 'Find My Spot - Unity 3D Game | Mayur Saitwal',
    loadComponent: () => import('./findmyspotunity/findmyspotunity').then((m) => m.Findmyspotunity),
  },
  {
    path: 'unity/findmyspot',
    title: 'Find My Spot - Unity 3D Game | Mayur Saitwal',
    loadComponent: () => import('./findmyspotunity/findmyspotunity').then((m) => m.Findmyspotunity),
  },
  {
    path: 'unreal',
    title: 'Unreal Engine | Mayur Saitwal',
    loadComponent: () => import('./unrealprojects/unrealprojects').then((m) => m.Unrealprojects),
  },
  {
    path: 'unrealprojects',
    title: 'Unreal Engine | Mayur Saitwal',
    loadComponent: () => import('./unrealprojects/unrealprojects').then((m) => m.Unrealprojects),
  },
  {
    path: 'threejs/ludo',
    title: '3D Ludo Game | Mayur Saitwal',
    loadComponent: () => import('./ludogame/ludogame').then((m) => m.Ludogame),
  },
  {
    path: 'ludo',
    title: '3D Ludo Game | Mayur Saitwal',
    loadComponent: () => import('./ludogame/ludogame').then((m) => m.Ludogame),
  },
  {
    path: 'ludogame',
    title: '3D Ludo Game | Mayur Saitwal',
    loadComponent: () => import('./ludogame/ludogame').then((m) => m.Ludogame),
  },
  {
    path: 'threejs/tictactoe',
    title: '3D Tic-Tac-Toe | Mayur Saitwal',
    loadComponent: () => import('./tictactoe/tictactoe').then((m) => m.Tictactoe),
  },
  {
    path: 'tictactoe',
    title: '3D Tic-Tac-Toe | Mayur Saitwal',
    loadComponent: () => import('./tictactoe/tictactoe').then((m) => m.Tictactoe),
  },
  {
    path: 'threejs/tetris',
    title: '3D Tetris Game | Mayur Saitwal',
    loadComponent: () => import('./threejstetris/threejstetris').then((m) => m.Threejstetris),
  },
  {
    path: 'tetris',
    title: '3D Tetris Game | Mayur Saitwal',
    loadComponent: () => import('./threejstetris/threejstetris').then((m) => m.Threejstetris),
  },
  {
    path: 'threejstetris',
    title: '3D Tetris Game | Mayur Saitwal',
    loadComponent: () => import('./threejstetris/threejstetris').then((m) => m.Threejstetris),
  },
  {
    path: 'babylonjs',
    title: 'Babylon.js 3D Showcase | Mayur Saitwal',
    loadComponent: () => import('./babylonjsexample/babylonjsexample').then((m) => m.Babylonjsexample),
  },
  {
    path: 'babylonjsexample',
    title: 'Babylon.js 3D Showcase | Mayur Saitwal',
    loadComponent: () => import('./babylonjsexample/babylonjsexample').then((m) => m.Babylonjsexample),
  },
  {
    path: 'babylonjs/element-table',
    title: '3D Periodic Table | Mayur Saitwal',
    loadComponent: () => import('./babylon/elementtable/elementtable').then((m) => m.Elementtable),
  },
  {
    path: 'babylonjs/room',
    title: 'Isometric Cozy Room 3D | Mayur Saitwal',
    loadComponent: () => import('./babylon/room/room').then((m) => m.Room),
  },
  {
    path: 'room',
    title: 'Isometric Cozy Room 3D | Mayur Saitwal',
    loadComponent: () => import('./babylon/room/room').then((m) => m.Room),
  },
  {
    path: 'babylonjs/openworld',
    title: 'Babylon.js Procedural Open World | Mayur Saitwal',
    loadComponent: () => import('./babylon/babylonopenworld/babylonopenworld').then((m) => m.Babylonopenworld),
  },
  {
    path: 'babylonopenworld',
    title: 'Babylon.js Procedural Open World | Mayur Saitwal',
    loadComponent: () => import('./babylon/babylonopenworld/babylonopenworld').then((m) => m.Babylonopenworld),
  },
  {
    path: 'babylonjs/thirdpersoncharacter',
    title: 'Paladin 3D Character & Car | Babylon.js | Mayur Saitwal',
    loadComponent: () =>
      import('./babylon/thirdpersoncharacter/thirdpersoncharacter').then(
        (m) => m.Thirdpersoncharacter
      ),
  },
  {
    path: 'thirdpersoncharacter',
    title: 'Paladin 3D Character & Car | Babylon.js | Mayur Saitwal',
    loadComponent: () =>
      import('./babylon/thirdpersoncharacter/thirdpersoncharacter').then(
        (m) => m.Thirdpersoncharacter
      ),
  },
  {
    path: 'babylonjs/character',
    title: 'Paladin 3D Character & Car | Babylon.js | Mayur Saitwal',
    loadComponent: () =>
      import('./babylon/thirdpersoncharacter/thirdpersoncharacter').then(
        (m) => m.Thirdpersoncharacter
      ),
  },
];
