import './polyfills.server.mjs';
import{a as v}from"./chunk-DERZUW6J.mjs";import{a as l}from"./chunk-57NZDVMQ.mjs";import{a as c}from"./chunk-Z55PFZ5B.mjs";import{a as u}from"./chunk-WNROYCDI.mjs";import{a as p}from"./chunk-W3VY24XF.mjs";import{a as x}from"./chunk-RNJ3AYRA.mjs";import{a}from"./chunk-HWOBQNC6.mjs";import{a as i}from"./chunk-IVQBP7DD.mjs";import{a as f}from"./chunk-5MHD7RYD.mjs";import{a as s}from"./chunk-LHV47WRZ.mjs";import{a as o}from"./chunk-OLX65JSR.mjs";import{a as n}from"./chunk-IOJXWTGW.mjs";import{a as d}from"./chunk-CJDLBRZX.mjs";import{a as m}from"./chunk-EYMU5DD6.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="outlineVertexShader",S=`attribute position: vec3f;attribute normal: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
uniform offset: f32;
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#ifdef ALPHATEST
varying vUV: vec2f;uniform diffuseMatrix: mat4x4f; 
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input: VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;var normalUpdated: vec3f=vertexInputs.normal;
#ifdef UV1
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#ifdef UV2
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
var offsetPosition: vec3f=positionUpdated+(normalUpdated*uniforms.offset);
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld*vec4f(offsetPosition,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#ifdef ALPHATEST
#ifdef UV1
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=S);var V=[o,i,l,c,n,a,u,p,x,f,d,s,m,v];for(let t of V)e.IncludesShadersStoreWGSL[t.name]||(e.IncludesShadersStoreWGSL[t.name]=t.shader);var k={name:r,shader:S};export{k as a};
