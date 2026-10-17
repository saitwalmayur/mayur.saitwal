import './polyfills.server.mjs';
import{a as l}from"./chunk-RPSY6S5T.mjs";import{a}from"./chunk-MLBHNVOP.mjs";import{a as o}from"./chunk-TZQL4XVW.mjs";import{a as i}from"./chunk-QBPZZCGN.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var n="linePixelShader",t=`#include<clipPlaneFragmentDeclaration>
uniform vec4 color;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[n]||(e.ShadersStore[n]=t);var c=[o,a,l,i];for(let r of c)e.IncludesShadersStore[r.name]||(e.IncludesShadersStore[r.name]=r.shader);var s={name:n,shader:t};export{s as a};
