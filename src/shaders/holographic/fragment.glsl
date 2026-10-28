
uniform float uTime;
uniform vec3 uColor;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vGlitchStrength;
varying float vVisible;

void main() {
    // Normal
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing) normal *= -1.0;

    // Stripes
    float stripes = mod((vPosition.z - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    // Fresnel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, vNormal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    // Falloff
    float falloff = smoothstep(0.8, 0.0, fresnel);

    // Holographic
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;
    holographic *= falloff;
    
    float glitchStrength = smoothstep(-0.4, 0.1, vGlitchStrength);
    holographic *= glitchStrength;

    if (vVisible < 0.01) discard;
    
    // Visible
    holographic *= vVisible;

    // Final color
    gl_FragColor = vec4(uColor, holographic);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
