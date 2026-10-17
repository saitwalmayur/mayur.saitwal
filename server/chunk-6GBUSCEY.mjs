import './polyfills.server.mjs';
import{a as d}from"./chunk-ITTWKXWF.mjs";import{a as f}from"./chunk-T2BL6IIQ.mjs";import{a as t}from"./chunk-S5YROTDY.mjs";import{a as o}from"./chunk-TZQL4XVW.mjs";import{a as n}from"./chunk-QBPZZCGN.mjs";import{a}from"./chunk-NW7RVBCE.mjs";var r="shadowMapFragmentExtraDeclaration",p=`#if SM_FLOAT==0
#include<packingFunctions>
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#include<bayerDitherFunctions>
uniform vec2 softTransparentShadowSM;
#endif
varying float vDepthMetricSM;
#if SM_USEDISTANCE==1
uniform vec3 lightDataSM;varying vec3 vPositionWSM;
#endif
uniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;
#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1
varying float zSM;
#endif
`;a.IncludesShadersStore[r]||(a.IncludesShadersStore[r]=p);var S={name:r,shader:p};var i="shadowMapPixelShader",c=`#include<shadowMapFragmentExtraDeclaration>
#ifdef ALPHATEXTURE
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#include<clipPlaneFragment>
#ifdef ALPHATEXTURE
vec4 opacityMap=texture2D(diffuseSampler,vUV);float alphaFromAlphaTexture=opacityMap.a;
#if SM_SOFTTRANSPARENTSHADOW==1
if (softTransparentShadowSM.y==1.0) {opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);alphaFromAlphaTexture=opacityMap.x+opacityMap.y+opacityMap.z;}
#endif
#ifdef ALPHATESTVALUE
if (alphaFromAlphaTexture<ALPHATESTVALUE)
discard;
#endif
#endif
#if SM_SOFTTRANSPARENTSHADOW==1
#ifdef ALPHATEXTURE
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alphaFromAlphaTexture) discard;
#else
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x) discard;
#endif
#endif
#include<shadowMapFragment>
}`;a.ShadersStore[i]||(a.ShadersStore[i]=c);var s=[t,d,S,o,n,f];for(let e of s)a.IncludesShadersStore[e.name]||(a.IncludesShadersStore[e.name]=e.shader);var y={name:i,shader:c};export{y as a};
