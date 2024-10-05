if (textureDimensions(diffuseMap).x > 1) {
    let wrappedUV = fract(input.vUv);
    color = textureSample(diffuseMap, sampler2D, wrappedUV);
    if (color.a < 0.1) {
        discard;
    }
}

color = vec4f(material.color.rgb * color.rgb, material.color.a);