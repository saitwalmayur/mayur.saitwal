import './polyfills.server.mjs';
import{a as V}from"./chunk-OE7RZQI7.mjs";import{a as d}from"./chunk-ATNKH4RW.mjs";import{a as c}from"./chunk-RXKG2M2W.mjs";import{a as n,b as f}from"./chunk-PDPFFKGC.mjs";import{a as s}from"./chunk-IBKW6CK3.mjs";import{a}from"./chunk-QKYIHE6H.mjs";import{a as r}from"./chunk-DAL6HOMH.mjs";import{a as t}from"./chunk-463M7THM.mjs";import{a as l}from"./chunk-LAEQC2DT.mjs";import{a as m}from"./chunk-Y2QG25TK.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var i="colorVertexShader",x=`attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform mat4 view;
#endif
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStore[i]||(e.ShadersStore[i]=x);var p=[r,n,t,a,d,c,l,f,m,s,V];for(let o of p)e.IncludesShadersStore[o.name]||(e.IncludesShadersStore[o.name]=o.shader);var g={name:i,shader:x};export{g as a};
