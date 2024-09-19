let DIR_NUM : u32 = u32(scene.directionalLightsNum);

for (var i = 0u; i < DIR_NUM; i = i + 1u) {
     let light = scene.directionalLights[i];
     if (light.color.a == 0.0) {
         continue;
     }
     let lightDot = dot(input.vNormal, light.direction);
     let lightColor = vec3f(light.color.rgb * lightDot * light.intensity);
     let diffuseFactor = max(lightDot, 0.0);
     var specularFactor = 0.0;
     let specularColor = vec3f(1.0, 1.0, 1.0);
     if (diffuseFactor > 0.0) {
         let viewDirection = normalize(input.vViewDirection);
         let halfVector = normalize(-light.direction + viewDirection);
         let specularAngle = max(dot(halfVector, input.vNormal), 0.0);
         specularFactor = pow(specularAngle, 32.0);
     }

     color = vec4f(
         color.rgb * scene.ambientLight.rgb * scene.ambientLight.a +
         color.rgb * diffuseFactor * lightColor +
         color.rgb * specularFactor * specularColor,
         color.a
     );
}
