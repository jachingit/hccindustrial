varying vec3 vColor;
varying float vVisible;

void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5) discard;
    
    if (vVisible < 0.01) discard;
    
    gl_FragColor = vec4(vColor, vVisible);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}