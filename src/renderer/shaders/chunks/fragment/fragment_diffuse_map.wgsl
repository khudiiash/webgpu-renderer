if (textureDimensions(diffuseMap).x > 1) {
    let wrappedUV = fract(input.vUv);
    color = textureSample(diffuseMap, sampler2D, wrappedUV);
    if (color.a < 0.5) {
        discard;
    }
}