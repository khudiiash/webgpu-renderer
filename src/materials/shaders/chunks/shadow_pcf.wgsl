@group(3) @binding(0) var shadowMap: texture_depth_2d;
@group(3) @binding(1) var samplerComparison: sampler_comparison;

fn shadow_pcf(shadowPos: vec3<f32>, shadowMap: texture_depth_2d, shadowSampler: sampler_comparison) -> f32 {
    // Convert to 2D position for PCF sampling
    let pos = vec2<f32>(shadowPos.xy);
    let depth = shadowPos.z;
    
    // PCF kernel size (3x3)
    let size = 1.0;
    let texelSize = 1.0 / 2048.0; // Adjust based on shadow map size
    
    var shadow = 0.0;
    
    // 3x3 PCF filtering
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2<f32>(f32(x), f32(y)) * texelSize * size;
            shadow += textureSampleCompare(
                shadowMap,
                shadowSampler,
                pos + offset,
                depth - 0.005 // bias to reduce shadow acne
            );
        }
    }
    
    // Average the samples (9 samples total)
    return shadow / 9.0;
}

@fragment {{
    let shadowPos = project(input.vPositionW, camera.view, camera.projection);
    let shadow = shadow_pcf(shadowPos, shadowMap, samplerComparison);
    
    color *= shadow;
}}
