import './polyfills.server.mjs';
import{a as d}from"./chunk-5DU6KYIJ.mjs";import{a as n}from"./chunk-TZQL4XVW.mjs";import{a as i}from"./chunk-NE73WI3R.mjs";import{a}from"./chunk-QBPZZCGN.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="colorPixelShader",l=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
gl_FragColor=vColor;
#else
gl_FragColor=color;
#endif
#include<fogFragment>(color,gl_FragColor)
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[r]||(e.ShadersStore[r]=l);var c=[n,i,a,d];for(let o of c)e.IncludesShadersStore[o.name]||(e.IncludesShadersStore[o.name]=o.shader);var C={name:r,shader:l};export{C as a};
