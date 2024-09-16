let posFromLight = lights.directionalLights[0].projection * mvp.modelMatrix * vec4f(input.position, 1.0);
output.vShadowPosition = vec3f(
    posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
    posFromLight.z
);