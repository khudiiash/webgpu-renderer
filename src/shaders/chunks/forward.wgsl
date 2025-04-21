@fragment() {{
    // let clip = input.clip;
    // var uv = clip.xy / scene.resolution;
    // var deferred = textureSample(deferred_texture, sampler_color, uv);
    var color = material.diffuse.rgb;
    if (textureDimensions(diffuse_map).x > 1) {
        let uv = input.uv;
        let diffuseSample = textureSample(diffuse_map, sampler_color, uv);
        if (diffuseSample.a < material.alpha_cutoff) {
            discard;
        }
        color *= diffuseSample.rgb;
    }
    var opacity = material.opacity;
    output.color = vec4f(color, opacity);
}}
