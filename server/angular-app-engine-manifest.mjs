
export default {
  basePath: 'https://saitwalmayur.github.io/mayur.saitwal',
  allowedHosts: [],
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
