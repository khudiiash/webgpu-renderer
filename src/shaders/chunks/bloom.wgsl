// Get luminance of a color
fn get_luminance(color: vec3<f32>) -> f32 {
    return dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn get_glow(radius: f32, dist: f32, color: vec3<f32>) -> vec3<f32> {
    let lum = get_luminance(color);
    if (lum < bloom_config.threshold) {
        return vec3<f32>(0.0);
    }
    let strength = pow(radius / max(dist, EPSILON), bloom_config.falloff);
    return color * strength;
}

fn ray_direction(frag_coord: vec2<f32>, fov: f32) -> vec3<f32> {
    let screen_size=  vec2f(textureDimensions(albedo_texture));
    let xy = frag_coord - screen_size * 0.5;
    let z = screen_size.y * 0.5 / tan(radians(fov * 0.5));
    return normalize(vec3<f32>(xy, z));
}

// Sample emissive value from 2D texture using screen UV
fn sample_emissive(uv: vec2<f32>) -> vec3f {
    if (all(uv >= vec2<f32>(0.0)) && all(uv <= vec2<f32>(1.0))) {
        return textureSampleLevel(albedo_texture, sampler_color, uv, 0).rgb;
    }
    return vec3f(0.0);
}

fn ray_march(uv: vec2<f32>, depth: f32) -> vec4<f32> {
    var total_glow = vec3<f32>(0.0);

    // Sample base emissive
    let base_color = sample_emissive(uv);
    let base_lum = get_luminance(base_color);

    // Start with base emission if above threshold
    if (base_lum > bloom_config.threshold) {
        total_glow += base_color;
    }

    // Sample in a circular pattern
    let num_samples = 16;
    let num_rings = 8;

    for (var i = 0; i < num_samples; i++) {
        let angle = f32(i) / f32(num_samples) * 6.28318530718;

        for (var j = 1; j <= num_rings; j++) {
            let sample_radius = bloom_config.radius * f32(j) / f32(num_rings);
            let offset = vec2<f32>(
                cos(angle) * sample_radius,
                sin(angle) * sample_radius
            );

            let sample_uv = uv + offset;
            let sample_color = sample_emissive(sample_uv);

            // Weight by distance from center
            let dist_weight = 1.0 / (f32(j) * f32(num_samples));
            total_glow += get_glow(bloom_config.radius, length(offset), sample_color) * dist_weight;
        }
    }

    return vec4<f32>(total_glow * bloom_config.intensity, 1.0);
}

// ACES tone mapping
fn ACES(x: vec3<f32>) -> vec3<f32> {
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

@fragment(before:fog) {{
    var ray_marched = ray_march(input.uv, depth);
    finalColor = vec3f(ray_marched.rgb + finalColor);
}}
