fn shadow_pcf(shadowPos: vec3f, shadowMap: texture_depth_2d, shadowSampler: sampler_comparison) -> f32 {
    var visibility = 0.0;
    let bias = 0.00001;
    let oneOverShadowDepthTextureSize = 1.0 / vec2f(textureDimensions(shadowMap));
    let Q = 4;
    for (var y = -Q; y <= Q; y++) {
        for (var x = -Q; x <= Q; x++) {
            let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;
            visibility += textureSampleCompare(
                shadowMap, shadowSampler,
                shadowPos.xy + offset, shadowPos.z - bias
            );
        }
    }
    let div = pow(f32(Q) * 2.0 + 1.0, 2.0);
    visibility /= f32(div);
    return visibility;
}
