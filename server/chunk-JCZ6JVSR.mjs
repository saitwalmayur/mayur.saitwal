import './polyfills.server.mjs';
import{a as s}from"./chunk-2SHLUDOY.mjs";import{a as n}from"./chunk-VJ36QUW3.mjs";import{a as i}from"./chunk-IBNXKYNP.mjs";import{a as t}from"./chunk-Q3F5K7Q7.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";import"./chunk-EOKHPW4D.mjs";var r="volumetricLightingRenderVolumeVertexShader",c=`#include<__decl__sceneVertex>
#include<__decl__meshVertex>
attribute vec3 position;varying vec4 vWorldPos;void main(void) {vec4 worldPos=world*vec4(position,1.0);vWorldPos=worldPos;gl_Position=viewProjection*worldPos;}
`;e.ShadersStore[r]||(e.ShadersStore[r]=c);var d=[n,t,s,i];for(let o of d)e.IncludesShadersStore[o.name]||(e.IncludesShadersStore[o.name]=o.shader);var S={name:r,shader:c};export{S as volumetricLightingRenderVolumeVertexShader};
