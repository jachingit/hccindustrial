uniform float uTime;
uniform float uSpeed;
uniform float uProcessStart;
uniform float uProcessEnd;
uniform float uBlend;

varying float vVisible;

#include ../includes/processVisibility.glsl

void main() {
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    
    // Color process
    float progress = mod((modelPosition.z * 0.01) + uTime * uSpeed, 1.0);
    float visible = processVisibility(progress, uProcessStart, uProcessEnd, uBlend);

    // Varyings
    vVisible = visible;
}
