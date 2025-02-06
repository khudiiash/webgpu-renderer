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
    var uv = input.uv;
    var diffuse = material.diffuse.rgb;
    var normal = input.normal;
    var position = input.position;
    var ao = 1.0;
    var metalness = material.metalness;
    var roughness = material.roughness;
    var transmission = material.transmission;
    var specular = material.specular;
    var specular_factor = material.specular_factor;
    var sheen = material.sheen;
    var emissive = material.emissive;
    var emissive_factor = material.emissive_factor;
    var opacity = material.opacity;
    var groundColor = scene.groundColor;
    var skyColor = scene.skyColor;
    var indirectIntensity = scene.indirectIntensity;
    var useParallax = false;
    var useTangent = false;
    var viewDir = normalize(camera.position - position);
    var TBN: mat3x3f;
    var ambient = vec3f(0.0);
    var gamma = 2.2;

    if (mesh_options.useTangent == 1) {
        useTangent = true;
        TBN = transpose(getTBN(input.tangent, input.bitangent, input.normal));
        let tangentViewPos = toTangent(TBN, camera.position);
        let tangentWorldPos = toTangent(TBN, position);
        normal = normalize(toTangent(TBN, normal));
        viewDir = normalize(tangentViewPos - tangentWorldPos);
    }


    let uv_scale = material.uv_scale;
    uv = fract(scaleUV(uv, uv_scale));

    color = vec4f(diffuse, opacity);
    
    // lighting
    if (material.useLight == 1) {
        let ddx_uv = dpdx(uv);
        let ddy_uv = dpdy(uv);
        let albedo = diffuse;
        let N = normal;
        let V = viewDir;
        
        // Calculate ambient only once
        let ambient_light = calculate_ambient(N, ao, scene.ambientColor.rgb, scene.ambientColor.a, 
                                            scene.groundColor.rgb, scene.skyColor.rgb, scene.indirectIntensity);
        
        var accumulatedLight = vec3f(0.0);
        
        // Pre-calculate expensive transforms
        let use_pbr = material.usePBR == 1;
        let use_parallax_shadow = useParallax && useTangent;

        // Directional lights
        for (var i = 0u; i < scene.directionalLightsNum; i++) {
            let light = scene.directionalLights[i];
            var L: vec3f;
            if (useTangent) {
                L = TBN * -light.direction;
            } else {
                L = normalize(light.direction);
            }
            
            if (use_pbr) {
                accumulatedLight += calculate_directional_light_pbr(L, V, N, albedo, light, 
                                    roughness, metalness, specular, specular_factor, transmission);
            }
            
            if (use_parallax_shadow) {
                let lightDir = TBN * light.direction;
                let shadowStrength = smoothstep(0.0, 1.0, 
                    get_parallax_shadow(lightDir, parallax, ddx_uv, ddy_uv));
                accumulatedLight *= mix(0.05, 1.0, shadowStrength);
            }
        }

        // Point lights
        if (scene.pointLightsNum > 0u) {
            let pos = position; // Cache position
            
            for (var i = 0u; i < scene.pointLightsNum; i++) {
                let light = scene.pointLights[i];
                var light_vec = light.position - pos;
                let D = length(light_vec);
                
                // Early attenuation check
                let att = calculate_attenuation(D);
                if (att <= 0.0) {
                    continue;
                }
                
                var L: vec3f; 
                if (useTangent) {
                    L = TBN * normalize(light_vec);
                } else {
                    L = normalize(light_vec);
                }
                
                if (use_pbr) {
                    accumulatedLight += calculate_point_light_pbr(L, V, N, D, albedo, light,
                                        roughness, metalness, specular, specular_factor, transmission);
                }
                
                if (use_parallax_shadow) {
                    let lightDir = TBN * normalize(light_vec);
                    let shadowStrength = smoothstep(0.0, 1.0, 
                        get_parallax_shadow(-lightDir, parallax, ddx_uv, ddy_uv));
                    accumulatedLight *= mix(0.05, 1.0, shadowStrength);
                }
            }
        }


        color *= vec4f(clamp(ambient_light + accumulatedLight, vec3f(0.0), vec3f(1.0)), 1.0);
    }

    // gamma
    if (material.useGamma == 1) {
        var gammaCorrected = pow(color.rgb, vec3f(1.0 / gamma));
        color = vec4f(gammaCorrected, color.a);
    }

    // emissive
    if (material.useEmissive == 1) {
        color = calculate_emissive(color, emissive, emissive_factor);
    }

    // opacity
    color = vec4f(color.rgb, color.a * opacity);

    // fog 
    if (material.useFog == 1) {
        color = applyFog(color, position, camera.position, scene.fog);
    }
}}
