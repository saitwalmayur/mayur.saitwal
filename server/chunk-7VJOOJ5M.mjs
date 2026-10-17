import './polyfills.server.mjs';
import{a as p}from"./chunk-POI2PI3Z.mjs";import{a as v}from"./chunk-DP7OP35T.mjs";import{a as l}from"./chunk-P7GQ62YY.mjs";import{a as m}from"./chunk-GEK3HSY3.mjs";import{a as n}from"./chunk-ATNKH4RW.mjs";import{a as d}from"./chunk-RXKG2M2W.mjs";import{a as r,b as c}from"./chunk-PDPFFKGC.mjs";import{a as o}from"./chunk-DAL6HOMH.mjs";import{a}from"./chunk-463M7THM.mjs";import{a as f}from"./chunk-LAEQC2DT.mjs";import{a as s}from"./chunk-Y2QG25TK.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var t="glowMapGenerationVertexShader",V=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;varying vec4 vPosition;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform mat4 diffuseMatrix;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform mat4 opacityMatrix;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform mat4 emissiveMatrix;
#endif
#ifdef VERTEXALPHA
attribute vec4 color;varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef CUBEMAP
vPosition=worldPos;gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#else
vPosition=viewProjection*worldPos;gl_Position=vPosition;
#endif
#ifdef DIFFUSE
#ifdef DIFFUSEUV1
vUVDiffuse=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef DIFFUSEUV2
vUVDiffuse=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef OPACITY
#ifdef OPACITYUV1
vUVOpacity=vec2(opacityMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef OPACITYUV2
vUVOpacity=vec2(opacityMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef EMISSIVE
#ifdef EMISSIVEUV1
vUVEmissive=vec2(emissiveMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef EMISSIVEUV2
vUVEmissive=vec2(emissiveMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef VERTEXALPHA
vColor=color;
#endif
#include<clipPlaneVertex>
}`;e.ShadersStore[t]||(e.ShadersStore[t]=V);var u=[o,r,v,l,a,n,m,p,d,f,c,s];for(let i of u)e.IncludesShadersStore[i.name]||(e.IncludesShadersStore[i.name]=i.shader);var y={name:t,shader:V};export{y as a};
