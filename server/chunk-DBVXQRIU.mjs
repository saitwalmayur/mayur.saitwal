import './polyfills.server.mjs';
import{a as u}from"./chunk-POI2PI3Z.mjs";import{a as s}from"./chunk-DP7OP35T.mjs";import{a as m}from"./chunk-P7GQ62YY.mjs";import{a as p}from"./chunk-GEK3HSY3.mjs";import{a}from"./chunk-ATNKH4RW.mjs";import{a as d}from"./chunk-RXKG2M2W.mjs";import{a as o,b as l}from"./chunk-PDPFFKGC.mjs";import{a as r}from"./chunk-DAL6HOMH.mjs";import{a as n}from"./chunk-463M7THM.mjs";import{a as f}from"./chunk-LAEQC2DT.mjs";import{a as c}from"./chunk-Y2QG25TK.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";import"./chunk-EOKHPW4D.mjs";var t="selectionVertexShader",v=`attribute vec3 position;
#ifdef INSTANCES
attribute float instanceSelectionId;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef STORE_CAMERASPACE_Z
uniform mat4 view;
#else
uniform vec2 depthValues;
#endif
#ifdef INSTANCES
flat varying float vSelectionId;
#endif
#ifdef STORE_CAMERASPACE_Z
varying float vViewPosZ;
#else
varying float vDepthMetric;
#endif
#ifdef ALPHATEST
varying vec2 vUV;uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
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
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef UV2
vUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
vViewPosZ=(view*worldPos).z;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vDepthMetric=((-gl_Position.z+depthValues.x)/(depthValues.y));
#else
vDepthMetric=((gl_Position.z+depthValues.x)/(depthValues.y));
#endif
#endif
#ifdef INSTANCES
vSelectionId=instanceSelectionId;
#endif
#include<clipPlaneVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;e.ShadersStore[t]||(e.ShadersStore[t]=v);var V=[r,o,s,m,n,a,p,u,d,f,l,c];for(let i of V)e.IncludesShadersStore[i.name]||(e.IncludesShadersStore[i.name]=i.shader);var I={name:t,shader:v};export{I as selectionVertexShader};
