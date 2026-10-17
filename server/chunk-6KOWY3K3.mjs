import './polyfills.server.mjs';
import{a}from"./chunk-FE6TMNQD.mjs";import{a as o}from"./chunk-PA2VJV2Q.mjs";import{a as t}from"./chunk-FS4F7BAE.mjs";import{a as i}from"./chunk-NDHDPNOE.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="colorPixelShader",f=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vColor: vec4f;
#else
uniform color: vec4f;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
fragmentOutputs.color=input.vColor;
#else
fragmentOutputs.color=uniforms.color;
#endif
#include<fogFragment>(color,fragmentOutputs.color)
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=f);var d=[o,t,i,a];for(let n of d)e.IncludesShadersStoreWGSL[n.name]||(e.IncludesShadersStoreWGSL[n.name]=n.shader);var u={name:r,shader:f};export{u as a};
