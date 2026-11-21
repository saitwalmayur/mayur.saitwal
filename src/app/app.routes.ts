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
    path: 'threejs/steelfactory',
    title: 'Hot Rolled Strip Steel Manufacturing | Three.js | Mayur Saitwal',
    loadComponent: () => import('./mechanical/steelfactory/steelfactory').then((m) => m.SteelFactory),
  },
  {
    path: 'steelfactory',
    title: 'Hot Rolled Strip Steel Manufacturing | Three.js | Mayur Saitwal',
    loadComponent: () => import('./mechanical/steelfactory/steelfactory').then((m) => m.SteelFactory),
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
    path: 'threejs/gearbox1',
    title: 'Gearbox 1: Epicyclic Planetary Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox1/gearbox1').then((m) => m.Gearbox1),
  },
  {
    path: 'gearbox1',
    title: 'Gearbox 1: Epicyclic Planetary Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox1/gearbox1').then((m) => m.Gearbox1),
  },
  {
    path: 'mechanical/gearbox/gearbox1',
    title: 'Gearbox 1: Epicyclic Planetary Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox1/gearbox1').then((m) => m.Gearbox1),
  },
  {
    path: 'threejs/gearbox2',
    title: 'Gearbox 2: Industrial Worm Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox2/gearbox2').then((m) => m.Gearbox2),
  },
  {
    path: 'gearbox2',
    title: 'Gearbox 2: Industrial Worm Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox2/gearbox2').then((m) => m.Gearbox2),
  },
  {
    path: 'mechanical/gearbox/gearbox2',
    title: 'Gearbox 2: Industrial Worm Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox2/gearbox2').then((m) => m.Gearbox2),
  },
  {
    path: 'threejs/gearbox3',
    title: 'Gearbox 3: Heavy Cast Enclosed Worm Drive Unit | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox3/gearbox3').then((m) => m.Gearbox3),
  },
  {
    path: 'gearbox3',
    title: 'Gearbox 3: Heavy Cast Enclosed Worm Drive Unit | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox3/gearbox3').then((m) => m.Gearbox3),
  },
  {
    path: 'mechanical/gearbox/gearbox3',
    title: 'Gearbox 3: Heavy Cast Enclosed Worm Drive Unit | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox3/gearbox3').then((m) => m.Gearbox3),
  },
  {
    path: 'threejs/gearbox4',
    title: 'Gearbox 4: Dual-Stage Spur Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox4/gearbox4').then((m) => m.Gearbox4),
  },
  {
    path: 'gearbox4',
    title: 'Gearbox 4: Dual-Stage Spur Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox4/gearbox4').then((m) => m.Gearbox4),
  },
  {
    path: 'mechanical/gearbox/gearbox4',
    title: 'Gearbox 4: Dual-Stage Spur Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox4/gearbox4').then((m) => m.Gearbox4),
  },
  {
    path: 'threejs/gearbox5',
    title: 'Gearbox 5: Turboprop Aviation Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox5/gearbox5').then((m) => m.Gearbox5),
  },
  {
    path: 'gearbox5',
    title: 'Gearbox 5: Turboprop Aviation Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox5/gearbox5').then((m) => m.Gearbox5),
  },
  {
    path: 'mechanical/gearbox/gearbox5',
    title: 'Gearbox 5: Turboprop Aviation Reduction Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox5/gearbox5').then((m) => m.Gearbox5),
  },
  {
    path: 'threejs/gearbox6',
    title: 'Gearbox 6: 5-Speed Manual Automotive Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox6/gearbox6').then((m) => m.Gearbox6),
  },
  {
    path: 'gearbox6',
    title: 'Gearbox 6: 5-Speed Manual Automotive Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox6/gearbox6').then((m) => m.Gearbox6),
  },
  {
    path: 'mechanical/gearbox/gearbox6',
    title: 'Gearbox 6: 5-Speed Manual Automotive Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox6/gearbox6').then((m) => m.Gearbox6),
  },
  {
    path: 'threejs/gearbox7',
    title: 'Gearbox 7: Industrial Synchromesh Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox7/gearbox7').then((m) => m.Gearbox7),
  },
  {
    path: 'gearbox7',
    title: 'Gearbox 7: Industrial Synchromesh Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox7/gearbox7').then((m) => m.Gearbox7),
  },
  {
    path: 'mechanical/gearbox/gearbox7',
    title: 'Gearbox 7: Industrial Synchromesh Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox7/gearbox7').then((m) => m.Gearbox7),
  },
  {
    path: 'threejs/gearbox8',
    title: 'Gearbox 8: High-Precision Industrial Planetary Reducer | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox8/gearbox8').then((m) => m.Gearbox8),
  },
  {
    path: 'gearbox8',
    title: 'Gearbox 8: High-Precision Industrial Planetary Reducer | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox8/gearbox8').then((m) => m.Gearbox8),
  },
  {
    path: 'mechanical/gearbox/gearbox8',
    title: 'Gearbox 8: High-Precision Industrial Planetary Reducer | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox8/gearbox8').then((m) => m.Gearbox8),
  },
  {
    path: 'threejs/gearbox9',
    title: 'Gearbox 9: 90° Bevel (Conical) Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox9/gearbox9').then((m) => m.Gearbox9),
  },
  {
    path: 'gearbox9',
    title: 'Gearbox 9: 90° Bevel (Conical) Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox9/gearbox9').then((m) => m.Gearbox9),
  },
  {
    path: 'mechanical/gearbox/gearbox9',
    title: 'Gearbox 9: 90° Bevel (Conical) Gearbox | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox9/gearbox9').then((m) => m.Gearbox9),
  },
  {
    path: 'threejs/gearbox10',
    title: 'Gearbox 10: Precision 90° Bevel Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox10/gearbox10').then((m) => m.Gearbox10),
  },
  {
    path: 'gearbox10',
    title: 'Gearbox 10: Precision 90° Bevel Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox10/gearbox10').then((m) => m.Gearbox10),
  },
  {
    path: 'mechanical/gearbox/gearbox10',
    title: 'Gearbox 10: Precision 90° Bevel Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox10/gearbox10').then((m) => m.Gearbox10),
  },
  {
    path: 'threejs/gearbox11',
    title: 'Gearbox 11: Triple-Speed Bevel Gear Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox11/gearbox11').then((m) => m.Gearbox11),
  },
  {
    path: 'gearbox11',
    title: 'Gearbox 11: Triple-Speed Bevel Gear Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox11/gearbox11').then((m) => m.Gearbox11),
  },
  {
    path: 'mechanical/gearbox/gearbox11',
    title: 'Gearbox 11: Triple-Speed Bevel Gear Transmission | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox11/gearbox11').then((m) => m.Gearbox11),
  },
  {
    path: 'threejs/gearbox12',
    title: 'Gearbox 12: Automotive Offset Hypoid Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox12/gearbox12').then((m) => m.Gearbox12),
  },
  {
    path: 'gearbox12',
    title: 'Gearbox 12: Automotive Offset Hypoid Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox12/gearbox12').then((m) => m.Gearbox12),
  },
  {
    path: 'mechanical/gearbox/gearbox12',
    title: 'Gearbox 12: Automotive Offset Hypoid Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox12/gearbox12').then((m) => m.Gearbox12),
  },
  {
    path: 'threejs/gearbox13',
    title: 'Gearbox 13: Double-Helical Herringbone Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox13/gearbox13').then((m) => m.Gearbox13),
  },
  {
    path: 'gearbox13',
    title: 'Gearbox 13: Double-Helical Herringbone Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox13/gearbox13').then((m) => m.Gearbox13),
  },
  {
    path: 'mechanical/gearbox/gearbox13',
    title: 'Gearbox 13: Double-Helical Herringbone Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox13/gearbox13').then((m) => m.Gearbox13),
  },
  {
    path: 'threejs/gearbox14',
    title: 'Gearbox 14: Beaver-Tail Geneva Indexing Drive | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox14/gearbox14').then((m) => m.Gearbox14),
  },
  {
    path: 'gearbox14',
    title: 'Gearbox 14: Beaver-Tail Geneva Indexing Drive | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox14/gearbox14').then((m) => m.Gearbox14),
  },
  {
    path: 'mechanical/gearbox/gearbox14',
    title: 'Gearbox 14: Beaver-Tail Geneva Indexing Drive | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox14/gearbox14').then((m) => m.Gearbox14),
  },
  {
    path: 'threejs/gearbox15',
    title: 'Gearbox 15: Hypocycloid Scotch Yoke Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox15/gearbox15').then((m) => m.Gearbox15),
  },
  {
    path: 'gearbox15',
    title: 'Gearbox 15: Hypocycloid Scotch Yoke Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox15/gearbox15').then((m) => m.Gearbox15),
  },
  {
    path: 'mechanical/gearbox/gearbox15',
    title: 'Gearbox 15: Hypocycloid Scotch Yoke Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox15/gearbox15').then((m) => m.Gearbox15),
  },
  {
    path: 'threejs/gearbox16',
    title: 'Gearbox 16: External Positive Displacement Gear Pump | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox16/gearbox16').then((m) => m.Gearbox16),
  },
  {
    path: 'gearbox16',
    title: 'Gearbox 16: External Positive Displacement Gear Pump | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox16/gearbox16').then((m) => m.Gearbox16),
  },
  {
    path: 'mechanical/gearbox/gearbox16',
    title: 'Gearbox 16: External Positive Displacement Gear Pump | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox16/gearbox16').then((m) => m.Gearbox16),
  },
  {
    path: 'threejs/gearbox17',
    title: 'Gearbox 17: Differential Superposition Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox17/gearbox17').then((m) => m.Gearbox17),
  },
  {
    path: 'gearbox17',
    title: 'Gearbox 17: Differential Superposition Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox17/gearbox17').then((m) => m.Gearbox17),
  },
  {
    path: 'mechanical/gearbox/gearbox17',
    title: 'Gearbox 17: Differential Superposition Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox17/gearbox17').then((m) => m.Gearbox17),
  },
  {
    path: 'threejs/gearbox18',
    title: 'Gearbox 18: Eccentric Reciprocating Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox18/gearbox18').then((m) => m.Gearbox18),
  },
  {
    path: 'gearbox18',
    title: 'Gearbox 18: Eccentric Reciprocating Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox18/gearbox18').then((m) => m.Gearbox18),
  },
  {
    path: 'mechanical/gearbox/gearbox18',
    title: 'Gearbox 18: Eccentric Reciprocating Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox18/gearbox18').then((m) => m.Gearbox18),
  },
  {
    path: 'threejs/gearbox19',
    title: 'Gearbox 19: Oscillating Sector Gear Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox19/gearbox19').then((m) => m.Gearbox19),
  },
  {
    path: 'gearbox19',
    title: 'Gearbox 19: Oscillating Sector Gear Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox19/gearbox19').then((m) => m.Gearbox19),
  },
  {
    path: 'mechanical/gearbox/gearbox19',
    title: 'Gearbox 19: Oscillating Sector Gear Mechanism | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox19/gearbox19').then((m) => m.Gearbox19),
  },
  {
    path: 'threejs/gearbox20',
    title: 'Gearbox 20: Dual Worm Gear Precision XY Table | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox20/gearbox20').then((m) => m.Gearbox20),
  },
  {
    path: 'gearbox20',
    title: 'Gearbox 20: Dual Worm Gear Precision XY Table | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox20/gearbox20').then((m) => m.Gearbox20),
  },
  {
    path: 'mechanical/gearbox/gearbox20',
    title: 'Gearbox 20: Dual Worm Gear Precision XY Table | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox20/gearbox20').then((m) => m.Gearbox20),
  },
  {
    path: 'threejs/gearbox21',
    title: 'Gearbox 21: Nautilus Logarithmic Spiral Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox21/gearbox21').then((m) => m.Gearbox21),
  },
  {
    path: 'gearbox21',
    title: 'Gearbox 21: Nautilus Logarithmic Spiral Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox21/gearbox21').then((m) => m.Gearbox21),
  },
  {
    path: 'mechanical/gearbox/gearbox21',
    title: 'Gearbox 21: Nautilus Logarithmic Spiral Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox21/gearbox21').then((m) => m.Gearbox21),
  },
  {
    path: 'threejs/gearbox22',
    title: 'Gearbox 22: 3D Interlocking Cube Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox22/gearbox22').then((m) => m.Gearbox22),
  },
  {
    path: 'gearbox22',
    title: 'Gearbox 22: 3D Interlocking Cube Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox22/gearbox22').then((m) => m.Gearbox22),
  },
  {
    path: 'mechanical/gearbox/gearbox22',
    title: 'Gearbox 22: 3D Interlocking Cube Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox22/gearbox22').then((m) => m.Gearbox22),
  },
  {
    path: 'threejs/gearbox23',
    title: 'Gearbox 23: Harmonic Epicyclic Train XXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox23/gearbox23').then((m) => m.Gearbox23),
  },
  {
    path: 'gearbox23',
    title: 'Gearbox 23: Harmonic Epicyclic Train XXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox23/gearbox23').then((m) => m.Gearbox23),
  },
  {
    path: 'mechanical/gearbox/gearbox23',
    title: 'Gearbox 23: Harmonic Epicyclic Train XXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox23/gearbox23').then((m) => m.Gearbox23),
  },
  {
    path: 'threejs/gearbox24',
    title: 'Gearbox 24: High-Density Planetary Array XXXII | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox24/gearbox24').then((m) => m.Gearbox24),
  },
  {
    path: 'gearbox24',
    title: 'Gearbox 24: High-Density Planetary Array XXXII | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox24/gearbox24').then((m) => m.Gearbox24),
  },
  {
    path: 'mechanical/gearbox/gearbox24',
    title: 'Gearbox 24: High-Density Planetary Array XXXII | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox24/gearbox24').then((m) => m.Gearbox24),
  },
  {
    path: 'threejs/gearbox25',
    title: 'Gearbox 25: Kinematic Gear Assemblage XXXXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox25/gearbox25').then((m) => m.Gearbox25),
  },
  {
    path: 'gearbox25',
    title: 'Gearbox 25: Kinematic Gear Assemblage XXXXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox25/gearbox25').then((m) => m.Gearbox25),
  },
  {
    path: 'mechanical/gearbox/gearbox25',
    title: 'Gearbox 25: Kinematic Gear Assemblage XXXXI | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox25/gearbox25').then((m) => m.Gearbox25),
  },
  {
    path: 'threejs/gearbox26',
    title: 'Gearbox 26: Classic Spur Gearmesh Pair | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox26/gearbox26').then((m) => m.Gearbox26),
  },
  {
    path: 'gearbox26',
    title: 'Gearbox 26: Classic Spur Gearmesh Pair | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox26/gearbox26').then((m) => m.Gearbox26),
  },
  {
    path: 'mechanical/gearbox/gearbox26',
    title: 'Gearbox 26: Classic Spur Gearmesh Pair | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox26/gearbox26').then((m) => m.Gearbox26),
  },
  {
    path: 'threejs/gearbox27',
    title: 'Gearbox 27: Heavy Industrial Cast Spur Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox27/gearbox27').then((m) => m.Gearbox27),
  },
  {
    path: 'gearbox27',
    title: 'Gearbox 27: Heavy Industrial Cast Spur Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox27/gearbox27').then((m) => m.Gearbox27),
  },
  {
    path: 'mechanical/gearbox/gearbox27',
    title: 'Gearbox 27: Heavy Industrial Cast Spur Gears | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox27/gearbox27').then((m) => m.Gearbox27),
  },
  {
    path: 'threejs/gearbox28',
    title: 'Gearbox 28: Synchronized Multi-Shaft Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox28/gearbox28').then((m) => m.Gearbox28),
  },
  {
    path: 'gearbox28',
    title: 'Gearbox 28: Synchronized Multi-Shaft Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox28/gearbox28').then((m) => m.Gearbox28),
  },
  {
    path: 'mechanical/gearbox/gearbox28',
    title: 'Gearbox 28: Synchronized Multi-Shaft Gear Train | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox28/gearbox28').then((m) => m.Gearbox28),
  },
  {
    path: 'threejs/gearbox29',
    title: 'Gearbox 29: Open Frame Reduction Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox29/gearbox29').then((m) => m.Gearbox29),
  },
  {
    path: 'gearbox29',
    title: 'Gearbox 29: Open Frame Reduction Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox29/gearbox29').then((m) => m.Gearbox29),
  },
  {
    path: 'mechanical/gearbox/gearbox29',
    title: 'Gearbox 29: Open Frame Reduction Gearset | Mechanical Simulation | Mayur Saitwal',
    loadComponent: () => import('./mechanical/gearbox/gearbox29/gearbox29').then((m) => m.Gearbox29),
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
  {
    path: 'threejsfurniturehome',
    title: '3D Furniture Home | Mayur Saitwal',
    loadComponent: () =>
      import('./threejsfurniturehome/threejsfurniturehome').then((m) => m.Threejsfurniturehome),
  },
  {
    path: 'furniturehome',
    title: '3D Furniture Home | Mayur Saitwal',
    loadComponent: () =>
      import('./threejsfurniturehome/threejsfurniturehome').then((m) => m.Threejsfurniturehome),
  },
  {
    path: 'threejs/furniturehome',
    title: '3D Furniture Home | Mayur Saitwal',
    loadComponent: () =>
      import('./threejsfurniturehome/threejsfurniturehome').then((m) => m.Threejsfurniturehome),
  },
  {
    path: 'match3game',
    title: '3D Match-3 Quest (100 Levels) | Mayur Saitwal',
    loadComponent: () =>
      import('./match3game/match3game').then((m) => m.Match3game),
  },
  {
    path: 'threejs/match3game',
    title: '3D Match-3 Quest (100 Levels) | Mayur Saitwal',
    loadComponent: () =>
      import('./match3game/match3game').then((m) => m.Match3game),
  },
  {
    path: 'threejsmatch3',
    title: '3D Match-3 Quest (100 Levels) | Mayur Saitwal',
    loadComponent: () =>
      import('./match3game/match3game').then((m) => m.Match3game),
  },
];