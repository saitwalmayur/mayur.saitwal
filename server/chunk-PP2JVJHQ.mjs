import './polyfills.server.mjs';
import{a as g}from"./chunk-E2Z35TQ4.mjs";import{a as S,b as p}from"./chunk-TJPL2NNR.mjs";import{a as d}from"./chunk-BU4ZNZW2.mjs";import{a as c}from"./chunk-OVBT2JTF.mjs";import{a as s}from"./chunk-MOYWGW5A.mjs";import{a as m}from"./chunk-JRCLPFUN.mjs";import{a as l}from"./chunk-5NUA7ZU4.mjs";import{a as f}from"./chunk-WNROYCDI.mjs";import{a as n}from"./chunk-FE6TMNQD.mjs";import{a as i}from"./chunk-PA2VJV2Q.mjs";import{a as t}from"./chunk-FS4F7BAE.mjs";import{a}from"./chunk-NDHDPNOE.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";import"./chunk-EOKHPW4D.mjs";var o="gpuRenderParticlesPixelShader",P=`var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;varying vUV: vec2f;varying vColor: vec4f;
#ifdef PREPASS
uniform geometryZeroAlphaDiscard: f32;
#ifdef PREPASS_POSITION
varying vGeometryPositionW: vec3f;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vGeometryNormalW: vec3f;
#endif
#ifdef PREPASS_NORMAL
varying vGeometryNormalV: vec3f;
#endif
#endif
#define PREPASS_VELOCITY_ZERO
#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#include<fogFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#include<clipPlaneFragment>
let textureColor: vec4f=textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV);var baseColor: vec4f=textureColor*input.vColor;
#ifdef PREPASS
let geometryAlbedo: vec3f=toLinearSpaceVec3(baseColor.rgb);
#endif
#ifdef BLENDMULTIPLYMODE
let alpha: f32=input.vColor.a*textureColor.a;baseColor=vec4f(baseColor.rgb*alpha+vec3f(1.0)*(1.0-alpha),baseColor.a);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);
#else
#ifdef IMAGEPROCESSING
baseColor=vec4f(toLinearSpaceVec3(baseColor.rgb),baseColor.a);baseColor=applyImageProcessing(baseColor);
#endif
#endif
#ifdef PREPASS
let geometryColor: vec4f=baseColor;if (geometryColor.a<=0.0 && uniforms.geometryZeroAlphaDiscard>0.0) {discard;}
#ifdef PREPASS_POSITION
let geometryPositionW: vec3f=input.vGeometryPositionW;
#endif
#ifdef PREPASS_LOCAL_POSITION
let geometryPositionL: vec3f=input.vPosition;
#endif
#ifdef PREPASS_DEPTH
let geometryViewDepth: f32=input.vViewPos.z;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
let geometryNormalizedViewDepth: f32=input.vNormViewDepth;
#endif
#ifdef PREPASS_NORMAL
let geometryNormalV: vec3f=normalize(input.vGeometryNormalV);
#endif
#ifdef PREPASS_WORLD_NORMAL
let geometryNormalW: vec3f=normalize(input.vGeometryNormalW);
#endif
#include<geometryRenderingFragment>
#else
fragmentOutputs.color=baseColor;
#endif
}
`;e.ShadersStoreWGSL[o]||(e.ShadersStoreWGSL[o]=P);var u=[m,S,i,c,f,l,s,t,a,d,n,p,g];for(let r of u)e.IncludesShadersStoreWGSL[r.name]||(e.IncludesShadersStoreWGSL[r.name]=r.shader);var F={name:o,shader:P};export{F as gpuRenderParticlesPixelShaderWGSL};
