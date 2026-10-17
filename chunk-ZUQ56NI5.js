import{a as t}from"./chunk-L3UYHT7M.js";var e="gaussianSplattingVertexDeclaration",a=`attribute vec3 position;attribute vec4 splatIndex0;attribute vec4 splatIndex1;attribute vec4 splatIndex2;attribute vec4 splatIndex3;uniform mat4 view;uniform mat4 projection;uniform mat4 world;uniform vec4 vEyePosition;
#ifdef PREPASS
uniform mat4 inverseProjection;
#endif
`;t.IncludesShadersStore[e]||(t.IncludesShadersStore[e]=a);var r={name:e,shader:a};export{r as a};
