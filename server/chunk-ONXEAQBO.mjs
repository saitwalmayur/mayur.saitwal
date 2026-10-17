import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var o="sceneFragmentDeclaration",n=`uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;uniform mat4 inverseProjection;
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=n);var i={name:o,shader:n};export{i as a};
