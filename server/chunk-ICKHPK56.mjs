import './polyfills.server.mjs';
import{a as c}from"./chunk-57NZDVMQ.mjs";import{a as l}from"./chunk-Z55PFZ5B.mjs";import{a as p}from"./chunk-W3VY24XF.mjs";import{a as m}from"./chunk-RNJ3AYRA.mjs";import{a}from"./chunk-HWOBQNC6.mjs";import{a as n}from"./chunk-IVQBP7DD.mjs";import{a as f}from"./chunk-5MHD7RYD.mjs";import{a as s}from"./chunk-LHV47WRZ.mjs";import{a as r}from"./chunk-OLX65JSR.mjs";import{a as o}from"./chunk-IOJXWTGW.mjs";import{a as d}from"./chunk-CJDLBRZX.mjs";import{a as u}from"./chunk-EYMU5DD6.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";import"./chunk-EOKHPW4D.mjs";var i="selectionVertexShader",v=`attribute position: vec3f;
#ifdef INSTANCES
attribute instanceSelectionId: f32;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#ifdef STORE_CAMERASPACE_Z
uniform view: mat4x4f;
#else
uniform depthValues: vec2f;
#endif
#ifdef INSTANCES
flat varying vSelectionId: f32;
#endif
#ifdef STORE_CAMERASPACE_Z
varying vViewPosZ: f32;
#else
varying vDepthMetric: f32;
#endif
#ifdef ALPHATEST
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f; 
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input: VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var positionUpdated: vec3f=vertexInputs.position;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(positionUpdated,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#ifdef STORE_CAMERASPACE_Z
vertexOutputs.vViewPosZ=(uniforms.view*worldPos).z;
#else
#ifdef USE_REVERSE_DEPTHBUFFER
vertexOutputs.vDepthMetric=((-vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#else
vertexOutputs.vDepthMetric=((vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));
#endif
#endif
#ifdef INSTANCES
vertexOutputs.vSelectionId=vertexInputs.instanceSelectionId;
#endif
#include<clipPlaneVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;e.ShadersStoreWGSL[i]||(e.ShadersStoreWGSL[i]=v);var S=[r,n,c,l,o,a,p,m,f,d,s,u];for(let t of S)e.IncludesShadersStoreWGSL[t.name]||(e.IncludesShadersStoreWGSL[t.name]=t.shader);var b={name:i,shader:v};export{b as selectionVertexShaderWGSL};
