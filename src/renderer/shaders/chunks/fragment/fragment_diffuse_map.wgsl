if (textureDimensions(diffuseMap).x > 1) {
    let wrappedUV = fract(input.vUv);
    color = textureSample(diffuseMap, diffuseSampler, wrapp);
}