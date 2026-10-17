import './polyfills.server.mjs';
import{a as v}from"./chunk-BFPVDDH2.mjs";import{a as V}from"./chunk-POI2PI3Z.mjs";import{a as m}from"./chunk-DP7OP35T.mjs";import{a as s}from"./chunk-P7GQ62YY.mjs";import{a as p}from"./chunk-MLBHNVOP.mjs";import{a as u}from"./chunk-GEK3HSY3.mjs";import{a as n}from"./chunk-ATNKH4RW.mjs";import{a as d}from"./chunk-RXKG2M2W.mjs";import{a as i,b as c}from"./chunk-PDPFFKGC.mjs";import{a as r}from"./chunk-DAL6HOMH.mjs";import{a}from"./chunk-463M7THM.mjs";import{a as l}from"./chunk-LAEQC2DT.mjs";import{a as f}from"./chunk-Y2QG25TK.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var o="outlineVertexShader",x=`attribute vec3 position;attribute vec3 normal;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform float offset;
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef ALPHATEST
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;vec3 normalUpdated=normal;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#ifdef UV2
vec2 uv2Updated=uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
vec3 offsetPosition=positionUpdated+(normalUpdated*offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(offsetPosition,1.0);gl_Position=viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`;e.ShadersStore[o]||(e.ShadersStore[o]=x);var h=[r,i,m,s,a,n,p,u,V,d,l,c,f,v];for(let t of h)e.IncludesShadersStore[t.name]||(e.IncludesShadersStore[t.name]=t.shader);var j={name:o,shader:x};export{j as a};
