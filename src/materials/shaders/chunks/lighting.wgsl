@include(Common)
const F0 = vec3f(0.04);

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn NDVF_GGX(NdotH: f32, roughness: f32) -> f32 {
    let alpha = roughness * roughness;
    let alpha2 = alpha * alpha;
    let NdotH2 = NdotH * NdotH;
    let denom = NdotH2 * (alpha2 - 1.0) + 1.0;
    return alpha2 / (PI * denom * denom);
}

fn G_Smith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2  = GeometrySchlickGGX(NdotV, roughness);
    let ggx1  = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let num = a2;
    var denom = NdotH2 * (a2 - 1.0) + 1.0;
    denom = PI * denom * denom;
    return num / denom;
}
fn GeometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = roughness + 1.0;
    let k = (r * r) / 8.0;
    let num = NdotV;
    let denom = NdotV * (1.0 - k) + k;
    return num / denom;
}

fn calculate_brdf(L: vec3f, V: vec3f, N: vec3f, lightColor: vec3f, roughness: f32, albedo: vec3f, metalness: f32, specularColor: vec4f, specular_factor: f32, attenuation: f32) -> vec3f {
    let H = normalize(V + L);
    let NDF = distributionGGX(N, H, roughness); 
    let G = G_Smith(N, V, L, roughness);
    let F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    
    var kS = F;
    var kD = vec3f(1.0) - kS;
    kD *= 1.0 - metalness;
    let radiance = lightColor * attenuation;

    let numerator = NDF * G * F;
    let denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + EPSILON;
    let specular = numerator / denominator;

    let NdotL = max(dot(N, L), 0.0);
    return (kD * albedo / PI + specular) * radiance * NdotL;
}

fn calculate_attenuation(D: f32) -> f32 {
    return 1.0 / (1.0 + 0.09 * D + 0.032 * D * D);
}

fn calculate_ambient(normal: vec3f, ao: f32, ambientColor: vec3f, ambientIntensity: f32, groundColor: vec3f, skyColor: vec3f, indirectIntensity: f32) -> vec3f {
    let upDot = dot(normal, vec3f(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    return (ambientColor + mix(groundColor, skyColor, upDot) * indirectIntensity) * ao * ambientIntensity;
}

fn calculate_point_light_pbr(L: vec3f, V: vec3f, N: vec3f, D: f32, albedo: vec3f, light: PointLight, roughness: f32, metalness: f32, specular: vec4f, specular_factor: f32, transmission: f32) -> vec3f {
    let attenuation = calculate_attenuation(D);
    
    return calculate_brdf(L, V, N, light.color.rgb, roughness, albedo, metalness, light.color * specular, specular_factor, attenuation) 
           * light.color.rgb * light.intensity;
}

fn calculate_directional_light_pbr(L: vec3f, V: vec3f, N: vec3f, albedo: vec3f, light: DirectionalLight, roughness: f32, metallic: f32, specular: vec4f, specular_factor: f32, transmission: f32) -> vec3f {
    let attenuation = 1.0;
    return calculate_brdf(L, V, N, light.color.rgb, roughness, albedo, metallic, light.color * specular, specular_factor, attenuation) 
           * light.color.rgb * light.intensity;
}

fn calculate_emissive(original_color: vec4f, emissive_color: vec4f, emissive_factor: f32) -> vec4f {
    return vec4f(original_color.rgb + emissive_color.rgb * emissive_factor, original_color.a);
}