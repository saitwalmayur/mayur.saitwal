import './polyfills.server.mjs';
import{a as o,b as a}from"./chunk-VFMVJOTH.mjs";import{a as t}from"./chunk-VKD2XYBS.mjs";import{a as i}from"./chunk-5NUA7ZU4.mjs";import{a as r}from"./chunk-NW7RVBCE.mjs";var n="hdrFilteringPixelShader",u=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform alphaG: f32;var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=radiance(uniforms.alphaG,inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;r.ShadersStoreWGSL[n]||(r.ShadersStoreWGSL[n]=u);var c=[i,o,t,a];for(let e of c)r.IncludesShadersStoreWGSL[e.name]||(r.IncludesShadersStoreWGSL[e.name]=e.shader);var S={name:n,shader:u};export{S as a};
