for (var i: u32 = 0u; i < 4; i = i + 1u) {
    let light = lights.directionalLights[i];
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
        color.rgb * lights.ambientLightColor.rgb * lights.ambientLightColor.a +
        color.rgb * diffuseFactor * lightColor +
        color.rgb * specularFactor * specularColor,
        color.a
    );
}
