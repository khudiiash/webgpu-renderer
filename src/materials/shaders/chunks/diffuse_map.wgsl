@group(2) @binding(1) var diffuse_map: texture_2d<f32>;
@group(2) @binding(2) var color_sampler: sampler;

@fragment() {{
    if (textureDimensions(diffuse_map).x > 1) {
        let wrappedUV = fract(input.vUv);
        color = textureSample(diffuse_map, color_sampler, wrappedUV);
        if (color.a < 0.3) {
            discard;
        }
    }

    color = vec4f(material.diffuse.rgb * color.rgb, material.opacity);
}}