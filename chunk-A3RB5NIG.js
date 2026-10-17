import{a as e}from"./chunk-L3UYHT7M.js";var i="fluidRenderingParticleThicknessVertexShader",t=`attribute vec3 position;attribute vec2 offset;uniform mat4 view;uniform mat4 projection;
#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE
#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3
attribute vec3 size;
#else
attribute vec2 size;
#endif
#else
uniform vec2 size;
#endif
varying vec2 uv;void main(void) {
#ifdef FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3
vec2 particleSize=size.yz*size.x;
#else
vec2 particleSize=size;
#endif
#ifdef FLUIDRENDERING_CENTERED_OFFSET
vec2 fluidOffset=offset+vec2(0.5);
#else
vec2 fluidOffset=offset;
#endif
vec3 cornerPos;cornerPos.xy=(fluidOffset-vec2(0.5))*particleSize;cornerPos.z=0.0;vec3 viewPos=(view*vec4(position,1.0)).xyz+cornerPos;gl_Position=projection*vec4(viewPos,1.0);uv=fluidOffset;}
`;e.ShadersStore[i]||(e.ShadersStore[i]=t);var f={name:i,shader:t};export{f as a};
