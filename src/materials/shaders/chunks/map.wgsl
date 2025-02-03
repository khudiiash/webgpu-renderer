fn sampleColor(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, color: vec4f) -> vec4f {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texColor = textureSample(map, mapSampler, wrappedUV);
        return texColor;
    }
    return color;
}

fn sampleNormal(uv: vec2f, normal: vec3f) -> vec3f {
    // Early return if no normal map
    if (textureDimensions(normal_map).x <= 1) {
        return normal;
    }
    let sample = textureSample(normal_map, normal_map_sampler, uv);
    return normalize(sample.xyz * 2.0 - 1.0);
}

fn sampleMetalness(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, metalness: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texMetalness = textureSample(map, mapSampler, wrappedUV).r;
        return texMetalness;
    }
    return metalness;
}

fn sampleRoughness(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, roughness: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texRoughness = textureSample(map, mapSampler, wrappedUV).r;
        return texRoughness;
    }
    return roughness;
}

fn sampleHeight(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texHeight = textureSample(map, mapSampler, wrappedUV).r;
        return texHeight;
    }
    return 1.0;
}

fn sampleAO(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, ao: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texAO = textureSample(map, mapSampler, wrappedUV).r;
        return texAO;
    }
    return ao;
}

struct ParallaxResult {
    uv: vec2f,
    viewHeight: f32
};

fn parallax_occlusion_mapping(startUV: vec2f, viewDirTS: vec3f) -> vec3f {
    let ddx = dpdx(startUV);
    let ddy = dpdy(startUV);
    var depthScale = material.height_scale;
    var depthLayers = 32;
    
    let uvDelta = viewDirTS.xy * depthScale / (-viewDirTS.z * f32(depthLayers));
    let depthDelta = 1.0 / f32(depthLayers);
    let posDelta = vec3f(uvDelta, depthDelta);
    
    var currentPos = vec3f(startUV, 1.0);
    var prevPos = currentPos;
    
    // First pass: find approximate intersection point
    for (var i = 0; i < depthLayers; i++) {
        let heightSample = textureSampleGrad(height_map, height_map_sampler, currentPos.xy, ddx, ddy).r;
        if (currentPos.z <= heightSample) {
            break;
        }
        prevPos = currentPos;
        currentPos -= posDelta;
    }
    
    // Second pass: binary search for precise intersection
    let numBinarySteps = 5;
    for (var i = 0; i < numBinarySteps; i++) {
        let midPos = (currentPos + prevPos) * 0.5;
        let heightSample = textureSampleGrad(height_map, height_map_sampler, midPos.xy, ddx, ddy).r;
        
        if (midPos.z <= heightSample) {
            currentPos = midPos;
        } else {
            prevPos = midPos;
        }
    }
    
    return currentPos;
}

fn get_parallax_shadow(lightDirTS: vec3f, currentPos: vec3f, ddx: vec2f, ddy: vec2f) -> f32 {
    let numShadowSteps = 32; 
    let shadowStepSize = 1.0 / f32(numShadowSteps);
    
    var rayPos = currentPos;
    let rayStep = vec3f(lightDirTS.xy * shadowStepSize * 0.1, shadowStepSize);
    
    var shadow = 1.0;
    rayPos += rayStep;
    
    for (var i = 0; i < numShadowSteps; i++) {
        let heightSample = textureSampleGrad(height_map, height_map_sampler, rayPos.xy, ddx, ddy).r;
        
        if (rayPos.z < heightSample) {
            shadow = 0.0;
            break;
        }
        
        rayPos += rayStep;
        if (rayPos.z >= 1.0) { break; }
    }
    
    return shadow;
}

@fragment(before:lighting) {{
    // map
    var parallax = vec3f(uv, 0.0);

    if (textureDimensions(height_map).x > 1 && useTangent) {
        parallax = parallax_occlusion_mapping(uv, viewDir);
        uv = parallax.xy;
        useParallax = true;
        if (uv_scale.x == 1.0 && uv_scale.y == 1.0) {
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                discard;
            }
        }
    }

    if (textureDimensions(normal_map).x > 1 && useTangent) {
        var normalSample = textureSample(normal_map, normal_map_sampler, uv).rgb;
        if (material.invert_normal == 1) {
            normalSample.g = 1.0 - normalSample.g;
        }
        normal = normalize(normalSample * 2.0 - 1.0); // in tangent space
    }


    // diffuse_map
    let diffuseSample = sampleColor(diffuse_map, diffuse_map_sampler, uv, color);
    if (diffuseSample.a < material.alpha_test || color.a < material.alpha_test) {
        discard;
    }
    if (diffuseSample.a < 1.0 && (uv.x < 0.02 || uv.x > 0.98 || uv.y < 0.02 || uv.y > 0.98)) {
        discard;
    }
    color = vec4f(color.rgb * diffuseSample.rgb * diffuseSample.a, color.a * diffuseSample.a);
    metalness = sampleMetalness(metalness_map, metalness_map_sampler, uv, metalness);
    roughness = sampleRoughness(roughness_map, roughness_map_sampler, uv, roughness);
    ao = sampleAO(ao_map, ao_map_sampler, uv, ao);
    color = vec4f(color.rgb * ao, color.a);
    emissive = sampleColor(emissive_map, emissive_map_sampler, uv, emissive);
}}