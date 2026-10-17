import './polyfills.server.mjs';
import{a as t,b as c}from"./chunk-3HCESSUG.mjs";import{a as o}from"./chunk-ZZWSQ4WB.mjs";import{a as n}from"./chunk-6GWLPTIE.mjs";import{a as r}from"./chunk-NW7RVBCE.mjs";var i="hdrIrradianceFilteringPixelShader",d=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
#ifdef IBL_CDF_FILTERING
uniform sampler2D icdfTexture;
#endif
uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=irradiance(inputTexture,direction,vFilteringInfo,0.0,vec3(1.0),direction
#ifdef IBL_CDF_FILTERING
,icdfTexture
#endif
);gl_FragColor=vec4(color*hdrScale,1.0);}`;r.ShadersStore[i]||(r.ShadersStore[i]=d);var a=[n,t,o,c];for(let e of a)r.IncludesShadersStore[e.name]||(r.IncludesShadersStore[e.name]=e.shader);var F={name:i,shader:d};export{F as a};
