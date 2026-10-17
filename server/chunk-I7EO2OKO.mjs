import './polyfills.server.mjs';
import{a as p}from"./chunk-H732ZOSW.mjs";import{a as d}from"./chunk-4CGTHZPZ.mjs";import{a as g}from"./chunk-RPSY6S5T.mjs";import{a as c}from"./chunk-DTYY5NKB.mjs";import{a as s}from"./chunk-GIVHHB2N.mjs";import{a as f}from"./chunk-RZE5WNFI.mjs";import{a as t}from"./chunk-6GWLPTIE.mjs";import{a as m}from"./chunk-MLBHNVOP.mjs";import{a as l}from"./chunk-5DU6KYIJ.mjs";import{a}from"./chunk-TZQL4XVW.mjs";import{a as i}from"./chunk-NE73WI3R.mjs";import{a as n}from"./chunk-QBPZZCGN.mjs";import{a as e}from"./chunk-NW7RVBCE.mjs";var o="particlesPixelShader",S=`#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
varying vec2 vUV;varying vec4 vColor;uniform vec4 textureMask;uniform sampler2D diffuseSampler;
#ifdef PREPASS
uniform float geometryZeroAlphaDiscard;
#ifdef PREPASS_POSITION
varying vec3 vGeometryPositionW;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vec3 vGeometryNormalW;
#endif
#ifdef PREPASS_NORMAL
varying vec3 vGeometryNormalV;
#endif
#endif
#define PREPASS_VELOCITY_ZERO
#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#ifdef RAMPGRADIENT
varying vec4 remapRanges;uniform sampler2D rampSampler;
#endif
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 textureColor=texture2D(diffuseSampler,vUV);vec4 baseColor=(textureColor*textureMask+(vec4(1.,1.,1.,1.)-textureMask))*vColor;
#ifdef PREPASS
vec3 geometryAlbedo=toLinearSpace(baseColor.rgb);
#endif
#ifdef RAMPGRADIENT
float alpha=baseColor.a;float remappedColorIndex=clamp((alpha-remapRanges.x)/remapRanges.y,0.0,1.0);vec4 rampColor=texture2D(rampSampler,vec2(1.0-remappedColorIndex,0.));baseColor.rgb*=rampColor.rgb;float finalAlpha=baseColor.a;baseColor.a=clamp((alpha*rampColor.a-remapRanges.z)/remapRanges.w,0.0,1.0);
#endif
#ifdef BLENDMULTIPLYMODE
float sourceAlpha=vColor.a*textureColor.a;baseColor.rgb=baseColor.rgb*sourceAlpha+vec3(1.0)*(1.0-sourceAlpha);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor.rgb=toLinearSpace(baseColor.rgb);
#else
#ifdef IMAGEPROCESSING
baseColor.rgb=toLinearSpace(baseColor.rgb);baseColor=applyImageProcessing(baseColor);
#endif
#endif
gl_FragColor=baseColor;
#ifdef PREPASS
vec4 geometryColor=gl_FragColor;if (geometryColor.a<=0.0 && geometryZeroAlphaDiscard>0.0) {discard;}
#ifdef PREPASS_POSITION
vec3 geometryPositionW=vGeometryPositionW;
#endif
#ifdef PREPASS_LOCAL_POSITION
vec3 geometryPositionL=vPosition;
#endif
#ifdef PREPASS_DEPTH
float geometryViewDepth=vViewPos.z;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
float geometryNormalizedViewDepth=vNormViewDepth;
#endif
#ifdef PREPASS_NORMAL
vec3 geometryNormalV=normalize(vGeometryNormalV);
#endif
#ifdef PREPASS_WORLD_NORMAL
vec3 geometryNormalW=normalize(vGeometryNormalW);
#endif
#include<geometryRenderingFragment>
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[o]||(e.ShadersStore[o]=S);var P=[f,d,a,c,m,t,s,i,n,g,l,p];for(let r of P)e.IncludesShadersStore[r.name]||(e.IncludesShadersStore[r.name]=r.shader);var O={name:o,shader:S};export{O as a};
