fn sampleColor(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, color: vec4f) -> vec4f {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texColor = textureSample(map, mapSampler, wrappedUV);
        return texColor;
    }
    return color;
}