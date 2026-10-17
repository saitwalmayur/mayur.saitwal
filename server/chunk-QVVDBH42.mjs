import './polyfills.server.mjs';
import{a as o}from"./chunk-BU4ZNZW2.mjs";import{a as i}from"./chunk-WNROYCDI.mjs";import{a}from"./chunk-PA2VJV2Q.mjs";import{a as t}from"./chunk-NDHDPNOE.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var n="outlinePixelShader",l=`uniform color: vec4f;
#ifdef ALPHATEST
varying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;
#endif
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#ifdef ALPHATEST
if (textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vUV).a<0.4) {discard;}
#endif
#include<logDepthFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStoreWGSL[n]||(e.ShadersStoreWGSL[n]=l);var f=[a,i,t,o];for(let r of f)e.IncludesShadersStoreWGSL[r.name]||(e.IncludesShadersStoreWGSL[r.name]=r.shader);var s={name:n,shader:l};export{s as a};
