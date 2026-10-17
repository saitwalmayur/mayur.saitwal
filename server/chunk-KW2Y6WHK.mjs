import './polyfills.server.mjs';
import{a as p}from"./chunk-POI2PI3Z.mjs";import{a as m}from"./chunk-DP7OP35T.mjs";import{a as c}from"./chunk-P7GQ62YY.mjs";import{a as l}from"./chunk-GEK3HSY3.mjs";import{a as n}from"./chunk-ATNKH4RW.mjs";import{a}from"./chunk-RXKG2M2W.mjs";import{a as i,b as d}from"./chunk-PDPFFKGC.mjs";import{a as t}from"./chunk-DAL6HOMH.mjs";import{a as s}from"./chunk-LAEQC2DT.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var o="pickingVertexShader",f=`attribute vec3 position;
#if defined(INSTANCES)
attribute float instanceMeshID;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform mat4 viewProjection;
#if defined(INSTANCES)
flat varying float vMeshID;
#endif
void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewProjection*worldPos;
#if defined(INSTANCES)
vMeshID=instanceMeshID;
#endif
}
`;e.ShadersStore[o]||(e.ShadersStore[o]=f);var h=[t,i,m,c,n,l,p,a,s,d];for(let r of h)e.IncludesShadersStore[r.name]||(e.IncludesShadersStore[r.name]=r.shader);var k={name:o,shader:f};export{k as a};
