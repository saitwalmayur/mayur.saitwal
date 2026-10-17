import{a as m}from"./chunk-Q46HA5EA.js";import{a as s}from"./chunk-R33FLU7O.js";import{a as d}from"./chunk-NUIUNSV6.js";import{a as c}from"./chunk-PCGJZOHJ.js";import{a,b as n}from"./chunk-ZZH7MXOS.js";import{a as t}from"./chunk-H27XTJZE.js";import{a as i}from"./chunk-6U7JQFO4.js";import{a as e}from"./chunk-L3UYHT7M.js";var r="gpuTransformVertexShader",l=`attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
out vec3 outPosition;const mat4 identity=mat4(
vec4(1.0,0.0,0.0,0.0),
vec4(0.0,1.0,0.0,0.0),
vec4(0.0,0.0,1.0,0.0),
vec4(0.0,0.0,0.0,1.0)
);void main(void) {vec3 positionUpdated=position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
mat4 finalWorld=identity;
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);outPosition=worldPos.xyz;}`;e.ShadersStore[r]||(e.ShadersStore[r]=l);var p=[t,a,m,s,d,c,i,n];for(let o of p)e.IncludesShadersStore[o.name]||(e.IncludesShadersStore[o.name]=o.shader);var v={name:r,shader:l};export{v as a};
