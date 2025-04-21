var height_uv = input.uv;

if (textureDimensions(heightMap).x > 1) {
    let dp1 = dpdx(input.positionW);
    let dp2 = dpdy(input.positionW);
    let duv1 = dpdx(input.uv);
    let duv2 = dpdy(input.uv);
    color = vec4(1, 0, 0, 1);

    // Calculate tangent and bitangent
    let r = 1.0 / (duv1.x * duv2.y - duv1.y * duv2.x);
    let tangent = (dp1 * duv2.y - dp2 * duv1.y) * r;
    let bitangent = (dp2 * duv1.x - dp1 * duv2.x) * r;
    let view_dir = camera.direction;
    var tbn = mat3x3<f32>(
        normalize(tangent),
        normalize(bitangent),
        normalize(input.normalV)
    );
    
    let view_dir_tangent = normalize(tbn * view_dir);

    // Parallax mapping parameters
    let height_scale = 0.1;  // Adjust this for stronger/weaker effect
    let num_layers = 2.0;    // More layers = better quality but slower
    
    // Calculate step size
    let layer_depth = 1.0 / num_layers;
    var current_layer_depth = 0.0;
    
    // Calculate initial UV offset per layer
    let delta_uv = (view_dir_tangent.xy * height_scale) / (view_dir_tangent.z * num_layers);
    
    var current_uv = input.uv;
    var current_depth = textureSample(heightMap, sampler2D, current_uv).r;
    
    // While the current depth is less than the layer depth, move to next layer
    for (var i = 0u; i < 2u; i = i + 1u) {
        if (current_layer_depth >= 1.0) {
            break;
        }
        
        current_uv -= delta_uv;
        current_depth = textureSample(heightMap, sampler2D, current_uv).r;
        current_layer_depth += layer_depth;
    }
    
    // Get previous values for interpolation
    let prev_uv = current_uv + delta_uv;
    let prev_depth = textureSample(heightMap, sampler2D, prev_uv).r - 
                    (current_layer_depth - layer_depth);
    
    // Get depth after current layer
    let after_depth = current_depth - current_layer_depth;
    
    // Interpolate UVs based on depth difference
    let weight = after_depth / (after_depth - prev_depth);
    let final_uv = prev_uv * weight + current_uv * (1.0 - weight);
    
    if (textureDimensions(diffuseMap).x > 1) {
        color = textureSample(diffuseMap, sampler2D, final_uv);
    }
}