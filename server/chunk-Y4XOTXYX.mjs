import './polyfills.server.mjs';
import{a as o,b as c}from"./chunk-VFMVJOTH.mjs";import{a as t}from"./chunk-VKD2XYBS.mjs";import{a as n}from"./chunk-5NUA7ZU4.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var i="hdrIrradianceFilteringPixelShader",a=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
var inputTextureSampler: sampler;var inputTexture: texture_cube<f32>;
#ifdef IBL_CDF_FILTERING
var icdfTextureSampler: sampler;var icdfTexture: texture_2d<f32>;
#endif
uniform vFilteringInfo: vec2f;uniform hdrScale: f32;varying direction: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec3f=irradiance(inputTexture,inputTextureSampler,input.direction,uniforms.vFilteringInfo,0.0,vec3f(1.0),input.direction
#ifdef IBL_CDF_FILTERING
,icdfTexture,icdfTextureSampler
#endif
);fragmentOutputs.color= vec4f(color*uniforms.hdrScale,1.0);}`;e.ShadersStoreWGSL[i]||(e.ShadersStoreWGSL[i]=a);var u=[n,o,t,c];for(let r of u)e.IncludesShadersStoreWGSL[r.name]||(e.IncludesShadersStoreWGSL[r.name]=r.shader);var S={name:i,shader:a};export{S as a};
