import './polyfills.server.mjs';
import{a as c}from"./chunk-57NZDVMQ.mjs";import{a as d}from"./chunk-Z55PFZ5B.mjs";import{a as l}from"./chunk-W3VY24XF.mjs";import{a as p}from"./chunk-RNJ3AYRA.mjs";import{a as n}from"./chunk-HWOBQNC6.mjs";import{a as i}from"./chunk-IVQBP7DD.mjs";import{a}from"./chunk-5MHD7RYD.mjs";import{a as m}from"./chunk-LHV47WRZ.mjs";import{a as o}from"./chunk-OLX65JSR.mjs";import{a as s}from"./chunk-CJDLBRZX.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var t="pickingVertexShader",f=`attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceMeshID: f32;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(INSTANCES)
flat varying vMeshID: f32;
#endif
@vertex
fn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#if defined(INSTANCES)
vertexOutputs.vMeshID=vertexInputs.instanceMeshID;
#endif
}
`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=f);var S=[o,i,c,d,n,l,p,a,s,m];for(let r of S)e.IncludesShadersStoreWGSL[r.name]||(e.IncludesShadersStoreWGSL[r.name]=r.shader);var I={name:t,shader:f};export{I as a};
