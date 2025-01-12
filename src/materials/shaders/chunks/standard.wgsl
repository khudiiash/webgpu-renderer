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
}

@group(2) @binding(0) var<uniform> material: StandardMaterial;

@fragment {{
    #if USE_LIGHT {
        let DIR_NUM : u32 = u32(scene.directionalLightsNum);
        let POINT_NUM : u32 = u32(scene.pointLightsNum + 1);
        var finalColor = material.ambient.rgb * scene.ambientColor.rgb;
        let viewDir = normalize(camera.position - input.vPositionW);


        for (var i = 0u; i < DIR_NUM; i++) {
            let light = scene.directionalLights[i];
            let lightDir = normalize(light.direction);
            let diffuseFactor = max(dot(normalize(input.vNormalW), -lightDir), 0.0);
            let halfDir = normalize(-lightDir + viewDir);
            let specularFactor = pow(max(dot(normalize(input.vNormalW), halfDir), 0.0), material.specular_factor);
        
            finalColor += (light.color.rgb * (diffuseFactor * material.diffuse.rgb +
                                specularFactor * material.specular.rgb * material.metalness) *
                                light.intensity);
        }

        for (var i = 0u; i < POINT_NUM; i++) {
            let light = scene.pointLights[i];
            let lightVec = light.position - input.vPositionW;
            let distance = length(lightVec);
            
            if (distance > light.range) {
                continue;
            }
            
            let lightDir = normalize(lightVec);
            let normal = normalize(input.vNormalW);
            let NdotL = max(dot(normal, lightDir), 0.0);
            let halfDir = normalize(lightDir + viewDir);
            let NdotH = max(dot(normal, halfDir), 0.0);
            var attenuation = 1.0 - smoothstep(0.0, light.range, distance);
            attenuation *= attenuation;
            
            let diffuse = light.color.rgb * NdotL;
            let specular = pow(NdotH, material.specular_factor) * material.metalness;
            
            finalColor += (diffuse * material.diffuse.rgb + 
                            specular * material.specular.rgb) * light.intensity * attenuation;
        }

        color = vec4<f32>(finalColor, material.opacity);
    }
}}