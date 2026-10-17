import './polyfills.server.mjs';
import{a as p}from"./chunk-POI2PI3Z.mjs";import{a as m}from"./chunk-DP7OP35T.mjs";import{a as d}from"./chunk-P7GQ62YY.mjs";import{a as c}from"./chunk-GEK3HSY3.mjs";import{a}from"./chunk-ATNKH4RW.mjs";import{a as n}from"./chunk-RXKG2M2W.mjs";import{a as t,b as s}from"./chunk-PDPFFKGC.mjs";import{a as i}from"./chunk-DAL6HOMH.mjs";import{a as l}from"./chunk-LAEQC2DT.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="iblVoxelGridVertexShader",x=`attribute vec3 position;varying vec3 vNormalizedPosition;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
uniform mat4 invWorldScale;uniform mat4 viewMatrix;void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);gl_Position=viewMatrix*invWorldScale*worldPos;vNormalizedPosition.xyz=gl_Position.xyz*0.5+0.5;
#ifdef IS_NDC_HALF_ZRANGE
gl_Position.z=gl_Position.z*0.5+0.5;
#endif
}`;e.ShadersStore[r]||(e.ShadersStore[r]=x);var f=[i,t,a,m,d,c,p,n,l,s];for(let o of f)e.IncludesShadersStore[o.name]||(e.IncludesShadersStore[o.name]=o.shader);var _={name:r,shader:x};export{_ as a};
