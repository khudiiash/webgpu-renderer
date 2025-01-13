struct StandardMaterial {
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec4f,
    emissive: vec4f,
    sheen: vec4f,
    opacity: f32,
    metalness: f32,
    roughness: f32,
    emissive_factor: f32,
    specular_factor: f32,
    alpha_test: f32,
    transmission: f32,
}

@group(2) @binding(0) var<uniform> material: StandardMaterial;

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
        let DIR_NUM : u32 = u32(scene.directionalLightsNum);
        let POINT_NUM : u32 = u32(scene.pointLightsNum);

        // Base color (albedo)
        let albedo = color.rgb; // Assume you have this parameter
        let roughness = material.roughness;
        let metallic = material.metalness;

        // Calculate reflectance at normal incidence (F0)
        var F0 = vec3f(0.04); // Default reflectance for dielectrics

        // If metallic, use albedo as F0
        F0 = mix(F0, albedo, metallic);

        var N = normalize(input.vNormalW);
        var V = normalize(camera.position - input.vPositionW);

        var Lo = vec3f(0.0);

        // Accumulate light contributions
        for (var i = 0u; i < DIR_NUM; i++) {
            let light = scene.directionalLights[i];
            let L = normalize(-light.direction); // Light direction towards surface
            let H = normalize(V + L);

            let NdotL = max(dot(N, L), 0.0);

            if (NdotL > 0.0) {
                // Calculate the Fresnel term
                let F = fresnelSchlick(max(dot(H, V), 0.0), F0);

                // Calculate the NDF
                let D = NDF_GGX(N, H, roughness);

                // Calculate the Geometry function
                let G = G_Smith(N, V, L, roughness);

                // Cook-Torrance BRDF
                let numerator = D * F * G;
                let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.001; // Add small epsilon to prevent division by zero
                let specular = numerator / denominator;

                // kS is equal to Fresnel term
                let kS = F;
                // kD is diffuse component and is (1 - kS) * (1 - metallic)
                let kD = (vec3f(1.0) - kS) * (1.0 - metallic);

                // Lambertian diffuse
                let diffuse = kD * albedo / PI;

                // Add to outgoing radiance Lo
                let radiance = light.intensity * light.color.rgb; // You may need to scale with light.intensity

                Lo += (diffuse + specular) * radiance * NdotL;
            }
        }

        // Similar loop for point lights
        for (var i = 0u; i < POINT_NUM; i++) {
            let light = scene.pointLights[i];
            let L = normalize(light.position - input.vPositionW);
            let H = normalize(V + L);

            let distance = length(light.position - input.vPositionW);
            let attenuation = 1.0 / (distance * distance); // Inverse square falloff

            let NdotL = max(dot(N, L), material.transmission);

            if (NdotL > 0.0) {
                // Calculate the Fresnel term
                let F = fresnelSchlick(max(dot(H, V), 0.0), F0);

                // Calculate the NDF
                let D = NDF_GGX(N, H, roughness);

                // Calculate the Geometry function
                let G = G_Smith(N, V, L, roughness);

                // Cook-Torrance BRDF
                let numerator = D * F * G;
                let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.001;
                let specular = numerator / denominator;

                // kS is equal to Fresnel term
                let kS = F;
                // kD is diffuse component and is (1 - kS) * (1 - metallic)
                let kD = (vec3f(1.0) - kS) * (1.0 - metallic);

                // Lambertian diffuse
                let diffuse = kD * albedo / PI;

                // Add to outgoing radiance Lo
                let radiance = attenuation * light.intensity * light.color.rgb; // Attenuate radiance

                Lo += (diffuse + specular) * radiance * NdotL;
            }
        }

        // Ambient lighting (Image-Based Lighting could be used here)
        let ambient = scene.ambientColor.rgb * albedo * (1.0 - metallic);

        var finalColor = ambient + Lo;

        // Apply gamma correction
        finalColor = pow(finalColor, vec3f(1.0 / 2.2));

        color = vec4f(finalColor, color.a);
    }

}}