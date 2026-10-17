import './polyfills.server.mjs';
import{a as S}from"./chunk-QUNNBO66.mjs";import{a as c}from"./chunk-HWOBQNC6.mjs";import{a as t}from"./chunk-IVQBP7DD.mjs";import{a as f}from"./chunk-5MHD7RYD.mjs";import{a as l}from"./chunk-LHV47WRZ.mjs";import{a as s}from"./chunk-PXJSYFAS.mjs";import{a}from"./chunk-GFUU6SAE.mjs";import{a as i}from"./chunk-OLX65JSR.mjs";import{a as n}from"./chunk-IOJXWTGW.mjs";import{a as d}from"./chunk-CJDLBRZX.mjs";import{a as m}from"./chunk-EYMU5DD6.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var o="colorVertexShader",x=`attribute position: vec3f;
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform view: mat4x4f;
#endif
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStoreWGSL[o]||(e.ShadersStoreWGSL[o]=x);var p=[i,t,n,a,c,f,d,l,m,s,S];for(let r of p)e.IncludesShadersStoreWGSL[r.name]||(e.IncludesShadersStoreWGSL[r.name]=r.shader);var b={name:o,shader:x};export{b as a};
