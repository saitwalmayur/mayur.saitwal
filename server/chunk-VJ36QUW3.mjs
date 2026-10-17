import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var o="sceneVertexDeclaration",r=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=r);var t={name:o,shader:r};export{t as a};
