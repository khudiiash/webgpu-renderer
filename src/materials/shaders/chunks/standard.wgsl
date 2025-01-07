struct StandardMaterial {
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec4f,
    emissive: vec4f,
    sheen: vec4f,
    opacity: f32,
    metalness: f32,
    roughness: f32,
    emissiveFactor: f32,
    specularFactor: f32,
    alphaTest: f32,
}

@group(2) @binding(0) var<uniform> material: StandardMaterial;

@fragment {{
    #if USE_LIGHTING {
        let DIR_NUM : u32 = u32(scene.directionalLightsNum);
        var finalColor = color.rgb * material.diffuse.rgb * scene.ambientColor.rgb * scene.ambientColor.a;
        for (var i = 0u; i < DIR_NUM; i = i + 1u) {
            let light = scene.directionalLights[i];
            let lightDir = normalize(light.direction);
            let normal = normalize(input.vNormalW);
            let diffuseFactor = max(dot(normal, -lightDir), 0.0);
            let diffuse = light.color.rgb * diffuseFactor;

            let viewDir = normalize(camera.position - input.vPositionW);
            let halfDir = normalize(-lightDir + viewDir);
            let specularFactor = pow(max(dot(normal, halfDir), 0.0), material.specularFactor);
            let specular = light.color.rgb * specularFactor * material.metalness;

            finalColor += (diffuse * material.diffuse.rgb + specular * material.specular.rgb) * light.intensity;
        }

        finalColor = min(finalColor, vec3f(1.0));

        color *= vec4f(finalColor, 1.0);
    }
}}