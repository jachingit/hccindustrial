
varying float vVisible;

void main() {
    if (vVisible < 0.01) discard;
    
    // Final color
    csm_DiffuseColor.a = vVisible;
}
