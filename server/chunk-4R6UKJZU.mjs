import './polyfills.server.mjs';
import{a as i}from"./chunk-BU4ZNZW2.mjs";import{a}from"./chunk-WNROYCDI.mjs";import{a as t}from"./chunk-PA2VJV2Q.mjs";import{a as o}from"./chunk-NDHDPNOE.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var r="linePixelShader",l=`#include<clipPlaneFragmentDeclaration>
uniform color: vec4f;
#include<logDepthDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<logDepthFragment>
#include<clipPlaneFragment>
fragmentOutputs.color=uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=l);var m=[t,a,i,o];for(let n of m)e.IncludesShadersStoreWGSL[n.name]||(e.IncludesShadersStoreWGSL[n.name]=n.shader);var s={name:r,shader:l};export{s as a};
