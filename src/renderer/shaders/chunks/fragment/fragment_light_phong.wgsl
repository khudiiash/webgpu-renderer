let DIR_NUM : u32 = u32(scene.directionalLightsNum);

for (var i = 0u; i < DIR_NUM; i = i + 1u) {
     let light = scene.directionalLights[i];
     if (light.direction.y < 0.0) {
        color = vec4f(color.rgb * scene.ambientColor.a, color.a);
        continue;
     }
     let lightDot = dot(input.vNormal, light.direction);
     let lightColor = vec3f(light.color.rgb * lightDot * light.intensity);
     let diffuseFactor = max(lightDot, 0.0);
     
     // Phong Specular Calculation
     var finalSpecular = vec3f(0);
     if (material.shininess > 0) {
         let viewDir = normalize(camera.position - input.vWorldPosition);
         let reflectDir = reflect(-light.direction, input.vNormal);
         let spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
         let phongSpecular = material.specularColor.rgb * spec;
         finalSpecular = phongSpecular;
     }
     
     let lightDirY = max(light.direction.y, 0.0);

    color = vec4f(
        color.rgb *  lightDirY * scene.ambientColor.rgb * scene.ambientColor.a +
        color.rgb * diffuseFactor * lightColor +
        finalSpecular * lightDirY,
        color.a
    );
}
