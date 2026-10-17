import './polyfills.server.mjs';
import{a as t}from"./chunk-RPSY6S5T.mjs";import{a}from"./chunk-MLBHNVOP.mjs";import{a as n}from"./chunk-TZQL4XVW.mjs";import{a as o}from"./chunk-QBPZZCGN.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var i="outlinePixelShader",l=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform vec4 color;
#ifdef ALPHATEST
varying vec2 vUV;uniform sampler2D diffuseSampler;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (texture2D(diffuseSampler,vUV).a<0.4)
discard;
#endif
#include<logDepthFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[i]||(e.ShadersStore[i]=l);var d=[n,a,o,t];for(let r of d)e.IncludesShadersStore[r.name]||(e.IncludesShadersStore[r.name]=r.shader);var p={name:i,shader:l};export{p as a};
