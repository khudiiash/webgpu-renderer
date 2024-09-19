for (var i = 0; i < scene.directionalLightsNum; i++) {
    output.vShadowCoord = vec3f(
        posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
        posFromLight.z
    );
}