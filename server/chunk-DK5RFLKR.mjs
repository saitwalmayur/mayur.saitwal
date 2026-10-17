import './polyfills.server.mjs';
import{a as s}from"./chunk-57NZDVMQ.mjs";import{a as m}from"./chunk-Z55PFZ5B.mjs";import{a as u}from"./chunk-W3VY24XF.mjs";import{a as c}from"./chunk-RNJ3AYRA.mjs";import{a as o}from"./chunk-HWOBQNC6.mjs";import{a as n}from"./chunk-IVQBP7DD.mjs";import{a}from"./chunk-5MHD7RYD.mjs";import{a as f}from"./chunk-LHV47WRZ.mjs";import{a as i}from"./chunk-OLX65JSR.mjs";import{a as d}from"./chunk-CJDLBRZX.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="volumetricLightScatteringPassVertexShader",p=`attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;uniform depthValues: vec2f;
#if defined(ALPHATEST) || defined(NEED_UV)
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
fn main(input: VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;
#if (defined(ALPHATEST) || defined(NEED_UV)) && defined(UV1)
var uvUpdated: vec2f=vertexInputs.uv;
#endif
#if (defined(ALPHATEST) || defined(NEED_UV)) && defined(UV2)
var uv2Updated: vec2f=vertexInputs.uv2;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vertexOutputs.position=uniforms.viewProjection*finalWorld*vec4f(positionUpdated,1.0);
#if defined(ALPHATEST) || defined(NEED_UV)
#ifdef UV1
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uvUpdated,1.0,0.0)).xy;
#endif
#ifdef UV2
vertexOutputs.vUV=(uniforms.diffuseMatrix*vec4f(uv2Updated,1.0,0.0)).xy;
#endif
#endif
}
`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=p);var l=[i,n,s,m,o,u,c,a,d,f];for(let t of l)e.IncludesShadersStoreWGSL[t.name]||(e.IncludesShadersStoreWGSL[t.name]=t.shader);var b={name:r,shader:p};export{b as a};
