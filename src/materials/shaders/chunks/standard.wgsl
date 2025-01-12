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

@fragment() {{
    #if USE_LIGHT {
        let DIR_NUM : u32 = u32(scene.directionalLightsNum);
        let POINT_NUM : u32 = u32(scene.pointLightsNum);
        var finalColor = scene.ambientColor.rgb;
        let viewDir = normalize(camera.position - input.vPositionW);


        for (var i = 0u; i < DIR_NUM; i++) {
            let light = scene.directionalLights[i];
            let lightDir = normalize(light.direction);
            let diffuseFactor = max(dot(normalize(input.vNormalW), -lightDir), material.transmission);
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
            let NdotL = max(dot(normal, lightDir), material.transmission);
            let halfDir = normalize(lightDir + viewDir);
            let NdotH = max(dot(normal, halfDir), 0.0);
            var attenuation = 1.0 - smoothstep(0.0, light.range, distance);
            attenuation *= attenuation;
            
            let diffuse = light.color.rgb * NdotL * (1.0 + (1.0 - (distance / light.range))) * 2.0;
            let specular = pow(NdotH, material.specular_factor) * material.metalness;
            
            finalColor += (diffuse * material.diffuse.rgb + 
                            specular * material.specular.rgb) * light.intensity * attenuation;
        }

        finalColor = pow(finalColor, vec3f(1.0 / 2.2));

        color = vec4f(color.rgb * finalColor, color.a);
    }

}}