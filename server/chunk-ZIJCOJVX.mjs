import './polyfills.server.mjs';
import{a as n}from"./chunk-CYMSIDGI.mjs";import{a as t}from"./chunk-2KQ3VOWK.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";import"./chunk-EOKHPW4D.mjs";var r="volumetricLightingRenderVolumeVertexShader",s=`#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute position : vec3f;varying vWorldPos: vec4f;@vertex
fn main(input : VertexInputs)->FragmentInputs {let worldPos=mesh.world*vec4f(vertexInputs.position,1.0);vertexOutputs.vWorldPos=worldPos;vertexOutputs.position=scene.viewProjection*worldPos;}
`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=s);var i=[t,n];for(let o of i)e.IncludesShadersStoreWGSL[o.name]||(e.IncludesShadersStoreWGSL[o.name]=o.shader);var l={name:r,shader:s};export{l as volumetricLightingRenderVolumeVertexShaderWGSL};
