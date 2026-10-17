import './polyfills.server.mjs';
import{a as t,b as c}from"./chunk-3HCESSUG.mjs";import{a as o}from"./chunk-ZZWSQ4WB.mjs";import{a as n}from"./chunk-6GWLPTIE.mjs";import{a as r}from"./chunk-NW7RVBCE.mjs";var i="hdrFilteringPixelShader",a=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;r.ShadersStore[i]||(r.ShadersStore[i]=a);var l=[n,t,o,c];for(let e of l)r.IncludesShadersStore[e.name]||(r.IncludesShadersStore[e.name]=e.shader);var p={name:i,shader:a};export{p as a};
