let DIR_NUM : u32 = u32(scene.directionalLightsNum);

// Apply ambient light separately from the directional light loop
var finalColor = color.rgb * scene.ambientLight.color.rgb * scene.ambientLight.intensity * material.ambientIntensity;

for (var i = 0u; i < DIR_NUM; i = i + 1u) {
    let light = scene.directionalLights[i];
    let lightDot = dot(input.vNormal, light.direction);
    let lightColor = vec3f(light.color.rgb * light.intensity);
    let diffuseFactor = max(lightDot, 0.0);
    
    // Phong Specular Calculation
    var finalSpecular = vec3f(0);
    if (material.shininess > 0) {
        let viewDir = camera.direction;
        let reflectDir = reflect(-light.direction, input.vNormal);
        let spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        let phongSpecular = material.specularColor.rgb * spec * light.intensity;
        finalSpecular = phongSpecular;
    }
    
    // Add directional light contribution
    finalColor += color.rgb * diffuseFactor * lightColor + finalSpecular;
}

// Ensure the final color doesn't exceed (1, 1, 1)
finalColor = min(finalColor, vec3f(1.0));

color = vec4f(finalColor, color.a * material.alpha);