@include(Common)
const F0 = vec3f(0.04);

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (vec3f(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

fn calculateNormalizedVectors(V: vec3f, L: vec3f, N: vec3f, transmission: f32) -> vec4f {
    let H = normalize(V + L);
    let NdotL = max(dot(N, L), transmission);
    let NdotV = max(dot(N, V), 0.0);
    let NdotH = max(dot(N, H), 0.0);
    let HdotV_direct = max(dot(H, V), 0.0);
    let HdotV_transmission = abs(dot(H, V));
    let HdotV = mix(HdotV_direct, HdotV_transmission, transmission);
    return vec4f(NdotL, NdotV, NdotH, HdotV);
}

fn NDF_GGX(NdotH: f32, roughness: f32) -> f32 {
    let alpha = roughness * roughness;
    let alpha2 = alpha * alpha;
    let NdotH2 = NdotH * NdotH;
    let denom = NdotH2 * (alpha2 - 1.0) + 1.0;
    return alpha2 / (PI * denom * denom);
}

fn G_Smith(NdotV: f32, NdotL: f32, roughness: f32) -> f32 {
    let r = roughness + 1.0;
    let k = (r * r) * 0.125;  
    let G_V = NdotV / (NdotV * (1.0 - k) + k);
    let G_L = NdotL / (NdotL * (1.0 - k) + k);
    return G_V * G_L;
}

fn calculate_brdf(dots: vec4f, roughness: f32, albedo: vec3f, metalness: f32, specularColor: vec4f, specular_factor: f32) -> vec3f {
    let D = NDF_GGX(dots.z, roughness);
    let G = G_Smith(dots.y, dots.x, roughness);
    let F = fresnelSchlick(dots.w, F0);
    
    let specular = (D * G * F) / max(4.0 * dots.y * dots.x, 0.001) * specular_factor * specularColor.rgb;
    let kD = (1.0 - F) * (1.0 - metalness);
    
    return kD * albedo / PI + specular;
}

fn calculate_attenuation(D: f32) -> f32 {
    return 1.0 / (1.0 + 0.09 * D + 0.032 * D * D);
}

fn calculate_ambient(normal: vec3f, ao: f32, ambientColor: vec3f, ambientIntensity: f32, groundColor: vec3f, skyColor: vec3f, indirectIntensity: f32) -> vec3f {
    let upDot = dot(normal, vec3f(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    return (ambientColor + mix(groundColor, skyColor, upDot) * indirectIntensity) * ao * ambientIntensity;
}

fn calculate_point_light_pbr(L: vec3f, V: vec3f, N: vec3f, D: f32, albedo: vec3f, light: PointLight, roughness: f32, metalness: f32, specular: vec4f, specular_factor: f32, transmission: f32) -> vec3f {
    let dots = calculateNormalizedVectors(V, L, N, transmission);
    if (dots.x <= 0.0) { return vec3f(0.0); }
    
    return calculate_brdf(dots, roughness, albedo, metalness, light.color * specular, specular_factor) 
           * light.color.rgb * light.intensity * dots.x * calculate_attenuation(D);
}

fn calculate_directional_light_pbr(L: vec3f, V: vec3f, N: vec3f, albedo: vec3f, light: DirectionalLight, roughness: f32, metallic: f32, specular: vec4f, specular_factor: f32, transmission: f32) -> vec3f {
    let dots = calculateNormalizedVectors(V, L, N, transmission);
    if (dots.x <= 0.0) { return vec3f(0.0); }
    
    return calculate_brdf(dots, roughness, albedo, metallic, light.color * specular, specular_factor) 
           * light.color.rgb * light.intensity * dots.x;
}

fn calculate_emissive(original_color: vec4f, emissive_color: vec4f, emissive_factor: f32) -> vec4f {
    return vec4f(original_color.rgb + emissive_color.rgb * emissive_factor, original_color.a);
}