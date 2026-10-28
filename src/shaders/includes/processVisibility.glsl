// 0..1 visibility of a process window [start, end] on a looping 0..1 timeline.
// Fades are centered on the window edges, so neighbouring windows crossfade
// with alphas that sum to exactly 1.
float processVisibility(float progress, float start, float end, float blend) {
    float duration = end - start;

    // signed distance from window start, wrapped to [-0.5, 0.5)
    float p = mod(progress - start + 0.5, 1.0) - 0.5;

    float fadeIn  = smoothstep(-blend, blend, p);
    float fadeOut = 1.0 - smoothstep(duration - blend, duration + blend, p);

    return fadeIn * fadeOut;
}
