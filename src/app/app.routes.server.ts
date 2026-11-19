import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'threejs/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threejs',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threejsexample',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threejsshader',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threedmodelviewer',
    renderMode: RenderMode.Client,
  },
  {
    path: 'audiovisulizer',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threejsparticleeffects',
    renderMode: RenderMode.Client,
  },
  {
    path: 'threejschess',
    renderMode: RenderMode.Client,
  },
  {
    path: 'chessgame',
    renderMode: RenderMode.Client,
  },
  {
    path: 'openworld',
    renderMode: RenderMode.Client,
  },
  {
    path: 'findmyspotunity',
    renderMode: RenderMode.Client,
  },
  {
    path: 'findmyspot',
    renderMode: RenderMode.Client,
  },
  {
    path: 'babylonjs/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'thirdpersoncharacter',
    renderMode: RenderMode.Client,
  },
  {
    path: 'environment1',
    renderMode: RenderMode.Client,
  },
  {
    path: 'cementindustry',
    renderMode: RenderMode.Client,
  },
  {
    path: 'roboticsarm',
    renderMode: RenderMode.Client,
  },
  {
    path: 'roboticarm',
    renderMode: RenderMode.Client,
  },
  {
    path: 'gearboxes',
    renderMode: RenderMode.Client,
  },
  {
    path: 'gearbox',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductpipes',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductpipers',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductpopers',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductcleaning',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductfaucetproject',
    renderMode: RenderMode.Client,
  },
  {
    path: 'ductfaucet',
    renderMode: RenderMode.Client,
  },
  {
    path: 'indstry/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
