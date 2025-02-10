@group(Global) @binding(Scene)
@group(Global) @binding(Camera)
@group(Global) @binding(Position)
@group(Global) @binding(Color)
@group(Global) @binding(Normal)
@group(Global) @binding(Depth)
@group(Global) @binding(SamplerColor)
@group(Global) @binding(SamplerDepth)

@include(Common)
@include(Lighting)

struct ScreenSpaceGIParams {
    resolution: vec2f,
    frame_count: u32,
    light_intensity: f32,
    num_steps: u32,
    num_directions: u32,
}

fn count_bits(val: i32) -> i32 {
    var x = val;
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    return (((x + (x >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

fn random2d(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn distanceToProbe(pixelPos: vec3f, probePos: vec3f) -> f32 {
    return length(pixelPos - probePos);
}

fn getProbeColor(cascadeLevel: f32) -> vec3f {
    switch(u32(cascadeLevel)) {
        case 0u: { return vec3f(1.0, 0.0, 0.0); }    // Red
        case 1u: { return vec3f(0.0, 1.0, 0.0); }    // Green
        case 2u: { return vec3f(0.0, 0.0, 1.0); }    // Blue
        case 3u: { return vec3f(1.0, 1.0, 0.0); }    // Yellow
        case 4u: { return vec3f(1.0, 0.0, 1.0); }    // Magenta
        default: { return vec3f(1.0, 1.0, 1.0); }    // White
    }
}


fn calculate_screen_space_gi(
    position: vec3f,
    normal: vec3f,
    uv: vec2f,
    color_texture: texture_2d<f32>,
    position_texture: texture_2d<f32>,
    normal_texture: texture_2d<f32>,
    params: ScreenSpaceGIParams,
    sampler_color: sampler
) -> vec3f {
    var indirect = vec3f(0.0);
    
    // Pre-compute view space transforms
    let view_pos = (camera.view * vec4f(position, 1.0)).xyz;
    let view_normal = normalize((camera.view * vec4f(normal, 0.0)).xyz);

    let probeVisualizationRadius = 0.1; // Adjust this value to make probes bigger/smaller
    
    for(var dir = 0u; dir < params.num_directions; dir++) {
        // Calculate ray direction
        let rand_phi = (f32(dir) + random2d(uv + vec2f(f32(params.frame_count)))) * 
                      2.0 * PI / f32(params.num_directions);
        let ss_dir = vec2f(cos(rand_phi), sin(rand_phi));
        
        var step_dist = 5.0;
        let step_coeff = 0.15 + 0.15 * random2d(uv + vec2f(f32(params.frame_count) * 3.26346));
        var bit_mask = 0i;
        
        for(var step = 0u; step < params.num_steps; step++) {
            let current_step = max(1.0, step_dist * step_coeff);
            let sample_uv = uv + ss_dir * (step_dist / params.resolution);
            
            // Always sample textures (uniform control flow)
            let sample_pos = textureSample(position_texture, sampler_color, sample_uv).xyz;
            let sample_normal = textureSample(normal_texture, sampler_color, sample_uv).xyz;
            let sample_color = textureSample(color_texture, sampler_color, sample_uv).rgb;
            
            // Convert to view space
            let sample_view_pos = (camera.view * vec4f(sample_pos, 1.0)).xyz;
            let sample_view_normal = normalize((camera.view * vec4f(sample_normal, 0.0)).xyz);
            
            let delta_pos = sample_view_pos - view_pos;
            let nor_dot = dot(view_normal, delta_pos) - 0.001;
            let tan_dist = length(delta_pos - nor_dot * view_normal);
            
            let angle1 = atan2(nor_dot, tan_dist);
            let angle2 = atan2(nor_dot - 0.03 * max(1.0, step_dist * 0.07), tan_dist);
            
            let angle1_bit = i32(max(0.0, ceil(angle1 / (PI * 0.5) * 32.0)));
            let angle2_bit = i32(max(0.0, floor(angle2 / (PI * 0.5) * 32.0)));
            
            let shift_amount = u32(max(0, angle1_bit - angle2_bit));
            let base_mask = (1u << shift_amount) - 1u;
            let sample_bit_mask = i32(base_mask << u32(max(0, angle2_bit)));
            let new_bits = count_bits(sample_bit_mask & (~bit_mask));
            
            let angle_weight = (pow(cos(f32(angle2_bit) * PI / 64.0), 2.0) - 
                              pow(cos(f32(angle1_bit) * PI / 64.0), 2.0));
            
            let normal_weight = sqrt(max(0.0, dot(sample_view_normal, 
                                                -normalize(delta_pos))));
            
            let sample_contribution = f32(new_bits) * sample_color * params.light_intensity * 
                                    angle_weight * normal_weight / 
                                    max(1.0, f32(angle1_bit - angle2_bit));
            
            // Use uniform control flow
            let valid_sample = all(sample_uv >= vec2f(0.0)) && 
                             all(sample_uv <= vec2f(1.0));
            
            indirect += select(vec3f(0.0), sample_contribution, valid_sample);
            bit_mask |= sample_bit_mask;
            step_dist += current_step;
        }
    }
    
    return indirect / f32(params.num_directions);
}

@fragment() {{ 
    let uv = input.uv;
    let color = textureSample(color_texture, sampler_color, uv);
    var normal = textureSample(normal_texture, sampler_color, uv).xyz;
    let position = textureSample(position_texture, sampler_color, uv);
    let depth = position.w;

    var direct = vec3f(0.0);
    var indirect = vec3f(0.0);

    // Direct lighting calculation
    for (var i = 0u; i < scene.directionalLightsNum; i += 1u) {
        let light = scene.directionalLights[i];
        let light_dir = -light.direction;
        let n_dot_l = max(dot(normal, light_dir), 0.0);
        let diffuse = color.rgb * n_dot_l * light.color.rgb;
        
        let view_dir = normalize(camera.position - position.xyz);
        let half_dir = normalize(view_dir + light_dir);
        let n_dot_h = max(dot(normal, half_dir), 0.0);
        let specular = pow(n_dot_h, 32.0) * light.color.rgb * light.intensity;
        
        direct += diffuse + specular;
    }

    // Point lights
    for (var i = 0u; i < scene.pointLightsNum; i += 1u) {
        let light = scene.pointLights[i];
        let light_dir = light.position - position.xyz;
        let light_distance = length(light_dir);
        let light_dir_normalized = normalize(light_dir);
        let attenuation = calculate_attenuation(light_distance);
        let n_dot_l = max(dot(normal, light_dir_normalized), 0.0);
        let diffuse = color.rgb * n_dot_l * light.color.rgb * attenuation;
        
        let view_dir = normalize(camera.position - position.xyz);
        let half_dir = normalize(view_dir + light_dir_normalized);
        let n_dot_h = max(dot(normal, half_dir), 0.0);
        let specular = pow(n_dot_h, 32.0) * light.color.rgb * attenuation * light.intensity;
        
        direct += diffuse + specular;
    }

    // Screen Space GI parameters
    var gi_params: ScreenSpaceGIParams;
    gi_params.resolution = vec2f(textureDimensions(color_texture));
    gi_params.frame_count = u32(scene.frame);
    gi_params.light_intensity = 1.0;
    gi_params.num_steps = 8u;          
    gi_params.num_directions = 4u; 
    
    // indirect = calculate_screen_space_gi(
    //     position.xyz,
    //     normal,
    //     uv,
    //     color_texture,
    //     position_texture,
    //     normal_texture,
    //     gi_params,
    //     sampler_color
    // );

    // ambient
    let ambient = color.rgb * 0.2;

    var lighting = ambient + direct + indirect;
    output.color = vec4f(color.rgb * lighting, color.a);
}}