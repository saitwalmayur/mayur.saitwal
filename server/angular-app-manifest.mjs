
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/mayur.saitwal/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/mayur.saitwal"
  },
  {
    "renderMode": 2,
    "route": "/mayur.saitwal/projects"
  },
  {
    "renderMode": 2,
    "route": "/mayur.saitwal/contact"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 9094, hash: '1e8ae032d7c449d2311db1861bc85566b2beb18149e3e20614b0f5b5166c7e60', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: '6017089a67d1e565aca3d5e21767e9e7102922840092e5f8ccc083970733f04c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 14592, hash: 'c4991a83f342c3f76f207959bd18131690bb2bbbf7e17c98abb1aa464af96f4b', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'contact/index.html': {size: 16585, hash: '026cc7ea1961032a8af15237313f56cc2723a05a72d2410b31486f774dab9b5c', text: () => import('./assets-chunks/contact_index_html.mjs').then(m => m.default)},
    'projects/index.html': {size: 46382, hash: '745eca04473ac0040763c20ff472a12ec1270e98ce0d8d586ce14441e8c4e67e', text: () => import('./assets-chunks/projects_index_html.mjs').then(m => m.default)},
    'styles-AMNJBKU3.css': {size: 8518, hash: 'p86NWPZe06M', text: () => import('./assets-chunks/styles-AMNJBKU3_css.mjs').then(m => m.default)}
  },
};
