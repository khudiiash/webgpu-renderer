fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (vec3f(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

// Normal Distribution Function (GGX)
fn NDF_GGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;

    let denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

// Geometry Function (Smith GGX)
fn G_Smith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let k = (roughness + 1.0) * (roughness + 1.0) / 8.0; // UE4 style

    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);

    let G_V = NdotV / (NdotV * (1.0 - k) + k);
    let G_L = NdotL / (NdotL * (1.0 - k) + k);

    return G_V * G_L;
}

@fragment() {{
    #if USE_LIGHT {
        let albedo = color.rgb;
        let roughness = material.roughness;
        let metallic = material.metalness;

        var F0 = vec3f(0.04);
        F0 = mix(F0, albedo, metallic);

        var N = normalize(input.vNormalW);
        var V = normalize(camera.position - input.vPositionW);

        var Lo = vec3f(0.0);

        for (var i = 0u; i < scene.directionalLightsNum; i++) {
            let light = scene.directionalLights[i];
            let L = normalize(-light.direction); 
            let H = normalize(V + L);

            let NdotL = max(dot(N, L), 0.0);

            if (NdotL > 0.0) {
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

                Lo += (diffuse + specular) * radiance * NdotL;
            }
        }

        for (var i = 0u; i < scene.pointLightsNum; i++) {
            let light = scene.pointLights[i];
            let L = normalize(light.position - input.vPositionW);
            let H = normalize(V + L);

            let distance = length(light.position - input.vPositionW);
            let attenuation = 1.0 / (distance * distance);

            let NdotL = max(dot(N, L), material.transmission);

            if (NdotL > 0.0) {
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
                Lo += (diffuse + specular) * radiance * NdotL;
            }
        }

        let ambient = scene.ambientColor.rgb * albedo * (1.0 - metallic);

        var finalColor = ambient + Lo;
        color = vec4f(finalColor, color.a);
    }
}}