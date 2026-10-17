import './polyfills.server.mjs';
import{a as r}from"./chunk-NW7RVBCE.mjs";var e="clearQuadPixelShader",t=`uniform color: vec4f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=uniforms.color;}
`;r.ShadersStoreWGSL[e]||(r.ShadersStoreWGSL[e]=t);var a={name:e,shader:t};export{a};
