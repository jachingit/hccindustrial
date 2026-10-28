uniform float uTime;
uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;
uniform float uSpeed;
uniform float uProcessStart;
uniform float uProcessEnd;
uniform float uBlend;

attribute vec2 aParticlesUv;
attribute vec3 aColor;
attribute float aSize;

varying vec3 vColor;
varying float vVisible;

#include ../includes/processVisibility.glsl

void main() {
    vec4 particle = texture(uParticlesTexture, aParticlesUv);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    float sizeIn = smoothstep(0.0, 0.1, particle.a);
    float sizeOut = 1.0 - smoothstep(0.7, 1.0, particle.a);
    float size = min(sizeIn, sizeOut);

    gl_PointSize = size * aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / -viewPosition.z);
    
    // Color process
    float progress = mod((modelPosition.z * 0.01) + uTime * uSpeed, 1.0);
    float visible = processVisibility(progress, uProcessStart, uProcessEnd, uBlend);

    // Varyings
    vColor = aColor;
    vVisible = visible;
}