@group(Global) @binding(Scene)
@group(Global) @binding(Camera)
@group(Material) @binding(StandardMaterial)

@group(Material) @binding(DiffuseMap)
@group(Material) @binding(NormalMap)
@group(Material) @binding(AoMap)
@group(Material) @binding(HeightMap)
@group(Material) @binding(SpecularMap)
@group(Material) @binding(EmissiveMap)
@group(Material) @binding(SheenMap)
@group(Material) @binding(MetalnessMap)
@group(Material) @binding(RoughnessMap)
@group(Material) @binding(AlphaMap)
@group(Material) @binding(TransmissionMap)

@group(Material) @binding(DiffuseMapSampler)
@group(Material) @binding(NormalMapSampler)
@group(Material) @binding(AoMapSampler)
@group(Material) @binding(HeightMapSampler)
@group(Material) @binding(SpecularMapSampler)
@group(Material) @binding(EmissiveMapSampler)
@group(Material) @binding(SheenMapSampler)
@group(Material) @binding(MetalnessMapSampler)
@group(Material) @binding(RoughnessMapSampler)
@group(Material) @binding(AlphaMapSampler)
@group(Material) @binding(TransmissionMapSampler)

@include(Lighting)
@include(Fog)
@include(Map)

@fragment() {{
    // declares
    var uv = input.vUv;
    var diffuse = material.diffuse.rgb;
    var normal = input.vNormalW;
    var ao = 1.0;
    var metalness = material.metalness;
    var roughness = material.roughness;
    var transmission = material.transmission;
    var specular = material.specular;
    var sheen = material.sheen;
    var emissive = material.emissive;
    var emissive_factor = material.emissive_factor;
    var viewHeight = 1.0;
    var useParallax = false;

    let TBN = getTBN(input.vTangentW, input.vBitangentW, normal);
    var viewDir = normalize(camera.position - input.vPositionW);
    var viewDirTan = normalize(TBN * viewDir);

    var lightOccluded = false;

    color = vec4f(diffuse, material.opacity);
    
    // lighting
    if (material.useLight == 1) {
        var albedo = diffuse;
        let F0 = vec3f(0.04);
        let N = normal;
        let V = viewDir;

        var accumulatedLight = vec3f(0.0);

        for (var i = 0u; i < scene.directionalLightsNum; i++) {
            let light = scene.directionalLights[i];
            if (material.usePBR == 1) {
                accumulatedLight += calculate_directional_light_pbr(light, N, V, albedo, F0, roughness, metalness);
            } else {
                accumulatedLight += calculate_directional_light_phong(light, N, V, albedo);
            } 
            if (useParallax) {
                let lightViewDirTan = normalize(TBN * light.direction);
                let isOccluded = computeParallaxLightOcclusion(parallax.uv, lightViewDirTan, parallax.viewHeight, height_map, height_map_sampler); 
                if (isOccluded) {
                    accumulatedLight *= 0.05;
                }
            }
        }

        for (var i = 0u; i < scene.pointLightsNum; i++) {
            let light = scene.pointLights[i];
            if (material.usePBR == 1) {
                accumulatedLight += calculate_point_light_pbr(light, input, N, V, albedo, F0, roughness, metalness, transmission);
            } else {
                accumulatedLight += calculate_point_light_phong(light, input, N, V, albedo);
            }
            if (useParallax) {
                let lightViewDir = normalize(light.position - input.vPositionW);
                let lightViewDirTan = normalize(TBN * lightViewDir);
                let isOccluded = computeParallaxLightOcclusion(parallax.uv, lightViewDirTan, parallax.viewHeight, height_map, height_map_sampler); 
                if (isOccluded) {
                    accumulatedLight *= 0.05;
                }
            }
        }

        color *= vec4f(accumulatedLight, color.a);
    }

    // gamma
    if (material.useGamma == 1) {
        color = vec4f(pow(color.rgb, vec3f(1.0 / 2.2)), color.a);
    }

    // emissive
    if (material.useEmissive == 1) {
        color = calculate_emissive(color, emissive, emissive_factor);
    }

    // fog 
    if (material.useFog == 1) {
        color = applyFog(color, input.vPositionW, camera.position, scene.fog);
    }
}}