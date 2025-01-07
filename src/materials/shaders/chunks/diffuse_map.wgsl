@group(2) @binding(1) var diffuse_map: texture_2d<f32>;
@group(2) @binding(2) var color_sampler: sampler;

@fragment {{
    let diffuseSampled = textureSample(diffuse_map, color_sampler, input.vUv); 
    if (textureDimensions(diffuse_map).x > 1) {
        color *= diffuseSampled;
    }
}}