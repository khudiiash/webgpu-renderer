let shadowMapSize = f32(textureDimensions(shadowMap).x);
let DIR_LIGHT_NUM = u32(scene.directionalLightsNum);

for (var i = 0u; i < DIR_LIGHT_NUM; i = i + 1u) {
    let light = scene.directionalLights[i];
    var intensity = light.intensity;

    let shadowConfig = scene.directionalLightShadows[i];
    let matrix = scene.directionalLightMatrices[i];
    var visibility = 0.0;
    var shadowBias = shadowConfig.shadowBias;
    
    let posFromLight = matrix * vec4f(input.vWorldPosition, 1.0);
    let shadowPos = vec3f(
        posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
        posFromLight.z
    );

    let oneOverShadowDepthTextureSize = 1.0 / shadowMapSize;
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;

            visibility += textureSampleCompare(
                shadowMap, samplerComparison,
                shadowPos.xy + offset, shadowPos.z - shadowBias,
            );
        }
    }
    visibility /= 9.0;

    let lambertFactor = max(dot(normalize(light.direction), normalize(input.vNormal)), 0.0);
    let lightingFactor = min(scene.ambientColor.a + visibility * lambertFactor, 1.0);
    if (shadowPos.x > 0 && shadowPos.y > 0 && shadowPos.x < 1 && shadowPos.y < 1) {
        color = vec4(color.rgb * lightingFactor, color.a);
    }

}