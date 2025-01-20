@include(Common)

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (vec3f(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

fn NDF_GGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;

    let denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

fn G_Smith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let G_V = NdotV / (NdotV * (1.0 - k) + k);
    let G_L = NdotL / (NdotL * (1.0 - k) + k);
    return G_V * G_L;
}

fn calculate_directional_light_pbr(light: DirectionalLight, N: vec3f, V: vec3f, albedo: vec3f, F0: vec3f, roughness: f32, metallic: f32) -> vec3f {
    let L = normalize(-light.direction);
    let H = normalize(V + L);
    let NdotL = max(dot(N, L), 0.0);

    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    let D = NDF_GGX(N, H, roughness);
    let G = G_Smith(N, V, L, roughness);

    let numerator = D * F * G;
    let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + EPSILON;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - metallic);
    let diffuse = kD * albedo / PI;
    let radiance = light.intensity * light.color.rgb;

    return (diffuse + specular) * radiance * NdotL;
}


fn calculate_point_light_pbr(light: PointLight, input: FragmentInput, N: vec3f, V: vec3f, albedo: vec3f, F0: vec3f, roughness: f32, metallic: f32, transmission: f32) -> vec3f {
    let L = normalize(light.position - input.vPositionW);
    let H = normalize(V + L);
    let distance = length(light.position - input.vPositionW);
    let attenuation = 1.0 / (distance * distance);
    let NdotL = max(dot(N, L), transmission);

    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    let D = NDF_GGX(N, H, roughness);
    let G = G_Smith(N, V, L, roughness);

    let numerator = D * F * G;
    let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.001;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - metallic);
    let diffuse = kD * albedo / PI;
    let radiance = attenuation * light.intensity * light.color.rgb;

    return (diffuse + specular) * radiance * NdotL;
}

fn calculate_directional_light_phong(light: DirectionalLight, N: vec3f, V: vec3f, albedo: vec3f) -> vec3f {
    let L = normalize(-light.direction);
    let R = reflect(L, N);
    let specular = pow(max(dot(R, V), 0.0), 32.0);
    let diffuse = max(dot(N, L), 0.0);
    let radiance = light.intensity * light.color.rgb;

    return (diffuse * albedo + specular) * radiance;
}

fn calculate_point_light_phong(light: PointLight, input: FragmentInput, N: vec3f, V: vec3f, albedo: vec3f) -> vec3f {
    let L = normalize(light.position - input.vPositionW);
    let R = reflect(L, N);
    let specular = pow(max(dot(R, V), 0.0), 32.0);
    let diffuse = max(dot(N, L), 0.0);
    let distance = length(light.position - input.vPositionW);
    let attenuation = 1.0 / (distance * distance);
    let radiance = attenuation * light.intensity * light.color.rgb;

    return (diffuse * albedo + specular) * radiance;
}

fn calculate_emissive(original_color: vec4f, emissive_color: vec4f, emissive_factor: f32) -> vec4f {
    return original_color + (emissive_color * emissive_factor);
}