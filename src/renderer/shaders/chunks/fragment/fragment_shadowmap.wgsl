let shadowMapSize = f32(textureDimensions(shadowMap).x);
let DIR_LIGHT_NUM = u32(scene.directionalLightsNum);
for (var i = 0u; i < MAX_LIGHTS; i++) {
    var visibility = 0.0;
    var lightingFactor = 0.0;
    var shadowPos = vec3<f32>(0.0);

    if (i < u32(scene.directionalLightsNum)) {
        let light = scene.directionalLights[i];
        let shadowConfig = scene.directionalLightShadows[i];
        let matrix = scene.directionalLightMatrices[i];
        let shadowBias = shadowConfig.shadowBias * 40.0;
        let lightPos = light.direction * -500.0;
        let distToLight = length(lightPos - input.vWorldPosition);
        
        let posFromLight = matrix * vec4f(input.vWorldPosition, 1.0);
        shadowPos = vec3f(
            posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
            posFromLight.z
        );
        
        let f = fract(input.position.xy / shadowConfig.shadowMapOffsetTextureSize);
        var offsetCoord = vec3<i32>(0, vec2<i32>(f * shadowConfig.shadowMapOffsetTextureSize));

        var sum: f32 = 0.0;
        let samplesDiv2 = min(i32(shadowConfig.shadowMapOffsetFilterSize * shadowConfig.shadowMapOffsetFilterSize / 2.0), MAX_SAMPLES / 2);
        let texelSize = 1.0 / shadowMapSize;
        let bias = shadowBias;
        let normalizeDistFactor = 1.0 / distToLight;

        for (var j = 0; j < MAX_SAMPLES / 2; j++) {
            if (j >= samplesDiv2) { break; }
            offsetCoord.x = j;
            let offsets = textureLoad(shadowOffset, offsetCoord, 0) * shadowConfig.shadowMapRandomRadius;
            
            sum += textureSampleCompare(
                shadowMap, samplerComparison,
                shadowPos.xy + offsets.rg * texelSize, shadowPos.z - bias
            );
            sum += textureSampleCompare(
                shadowMap, samplerComparison,
                shadowPos.xy + offsets.ba * texelSize, shadowPos.z - bias
            );
        }

        visibility = sum / f32(samplesDiv2 * 2) + normalizeDistFactor;

        let lambertFactor = max(dot(normalize(light.direction), normalize(input.vNormal)), 0.0);
        lightingFactor = min(scene.ambientLight.intensity + visibility * lambertFactor * light.intensity, 1.0);
    }

    if (all(shadowPos.xy > vec2f(0.0)) && all(shadowPos.xy < vec2f(1.0))) {
        color = vec4(color.rgb * lightingFactor, color.a * material.alpha);
    }
}