fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
    return F0 + (vec3<f32>(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
    let a: f32 = roughness * roughness;
    let a2: f32 = a * a;
    let NdotH: f32 = max(dot(N, H), 0.0);
    let NdotH2: f32 = NdotH * NdotH;

    let num: f32 = a2;
    let denom: f32 = (NdotH2 * (a2 - 1.0) + 1.0);
    return num / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r: f32 = (roughness + 1.0);
    let k: f32 = (r * r) / 8.0;

    let num: f32 = NdotV;
    let denom: f32 = NdotV * (1.0 - k) + k;
    return num / denom;
}

fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
    let NdotV: f32 = max(dot(N, V), 0.0);
    let NdotL: f32 = max(dot(N, L), 0.0);
    let ggx2: f32 = geometrySchlickGGX(NdotV, roughness);
    let ggx1: f32 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

fn pbr(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, albedo: vec3<f32>, metallic: f32, roughness: f32, ao: f32) -> vec3<f32> {
    let H: vec3<f32> = normalize(V + L);
    let radiance: vec3<f32> = vec3<f32>(1.0); // Assume white light for simplicity

    let F0: vec3<f32> = mix(vec3<f32>(0.04), albedo, metallic);
    let F: vec3<f32> = fresnelSchlick(max(dot(H, V), 0.0), F0);

    let NDF: f32 = distributionGGX(N, H, roughness);
    let G: f32 = geometrySmith(N, V, L, roughness);

    let numerator: vec3<f32> = NDF * G * F;
    let denominator: f32 = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001;
    let specular: vec3<f32> = numerator / vec3<f32>(denominator);

    let kS: vec3<f32> = F;
    let kD: vec3<f32> = vec3<f32>(1.0) - kS;
    kD *= 1.0 - metallic;

    let NdotL: f32 = max(dot(N, L), 0.0);
    let Lo: vec3<f32> = (kD * albedo / PI + specular) * radiance * NdotL;

    let ambient: vec3<f32> = vec3<f32>(0.03) * albedo * ao;
    let color: vec3<f32> = ambient + Lo;

    return color;
}

@fragment {{
    // PBR lighting model
    let N: vec3<f32> = normalize(input.vNormalW);
    let V: vec3<f32> = normalize(-input.vPositionW);
    let albedo: vec3<f32> = material.albedo;
    let metallic: f32 = material.metallic;
    let roughness: f32 = material.roughness;
    let ao: f32 = material.ao;

    let color: vec3<f32> = vec3<f32>(0.0);
    for (var i = 0u; i < MAX_LIGHTS; i = i + 1u) {
        let light = scene.lights[i];
        let lightDir = normalize(light.position - input.vPositionW);
        let lightColor = light.color;

        // Calculate the PBR lighting model
        color += pbr(N, V, lightDir, albedo, metallic, roughness, ao) * lightColor;
    }

    // Apply gamma correction
    color = pow(color, vec3<f32>(1.0 / 2.2));

    // Output the final color
    output.color = vec4(color, material.alpha);
}}
