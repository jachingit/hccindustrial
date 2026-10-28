
uniform float uTime;
uniform float uSpeed;
uniform float uProcessStart;
uniform float uProcessEnd;
uniform float uBlend;
uniform float uProcessTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vGlitchStrength;
varying float vVisible;

#include ../includes/processVisibility.glsl

float random2D(vec2 value) {
    return fract(sin(dot(value.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch
    float glitchTime = uTime + modelPosition.z;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76);
    glitchStrength /= 3.0;
    glitchStrength *= 0.5;

    modelPosition.x += (random2D(modelPosition.xy + uTime) - 0.5) * glitchStrength;
    modelPosition.y += (random2D(modelPosition.yx + uTime) - 0.5) * glitchStrength;
    
    // Model normal
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    
    // Color process
    float progress = mod((modelPosition.z * 0.01) + uProcessTime * uSpeed, 1.0);
    float visible = processVisibility(progress, uProcessStart, uProcessEnd, uBlend);
    
    // Varyings
    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
    vGlitchStrength = glitchStrength;
    vVisible = visible;
}
