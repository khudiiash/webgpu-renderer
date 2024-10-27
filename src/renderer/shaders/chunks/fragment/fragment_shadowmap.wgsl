let shadowMapSize = f32(textureDimensions(shadowMap).x);
let DIR_LIGHT_NUM = u32(scene.directionalLightsNum);

for (var i = 0u; i < MAX_LIGHTS; i++) {
    var visibility = 0.0;
    var lightingFactor = 0.0;
    var shadowPos = vec3<f32>(0.0);

    if (i < DIR_LIGHT_NUM) {
        let light = scene.directionalLights[i];
        let shadowConfig = scene.directionalLightShadows[i];
        let matrix = scene.directionalLightMatrices[i];
        let shadowBias = shadowConfig.shadowBias;
        let lightPos = light.direction * -500.0;
        let distToLight = length(lightPos - input.vPositionW);

        let posFromLight = matrix * vec4f(input.vPositionW, 1.0);
        shadowPos = vec3f(
            posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
            posFromLight.z
        );

        // Implement PCF directly in the loop
        let pcfScale = 1.0; // Adjust for shadow softness
        let texelSize = 0.2 / shadowMapSize;
        var totalSamples = 0.0;
        
        for (var x = -pcfScale; x <= pcfScale; x += 1.0) {
            for (var y = -pcfScale; y <= pcfScale; y += 1.0) {
                let offset = vec2<f32>(x, y) * texelSize * shadowConfig.shadowMapRandomRadius;
                visibility += textureSampleCompare(
                    shadowMap,
                    samplerComparison,
                    shadowPos.xy + offset,
                    shadowPos.z - shadowBias
                );
                totalSamples += 1.0;
            }
        }
        
        visibility = visibility / totalSamples;

        let lambertFactor = max(dot(normalize(light.direction), normalize(normal)), 0.0);
        lightingFactor = min(scene.ambientLight.intensity + visibility * lambertFactor * light.intensity, 1.0);
    }

    if (all(shadowPos.xy > vec2f(0.0)) && all(shadowPos.xy < vec2f(1.0))) {
        color = vec4(color.rgb * lightingFactor, material.alpha);
    }
}