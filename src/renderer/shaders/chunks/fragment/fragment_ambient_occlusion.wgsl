    let depth = textureSample(depthTexture, samplerLinear, input.uv).r;
    let normal = textureSample(normalTexture, samplerLinear, input.uv).xyz * 2.0 - 1.0;
    let randomVec = textureSample(randomTexture, samplerLinear, input.uv * 1024.0).xyz;

    // Reconstruct position from depth
    let clipSpacePosition = vec4<f32>(input.uv * 2.0 - 1.0, depth, 1.0);
    let viewSpacePosition = projectionMatrix * clipSpacePosition;
    let position = viewSpacePosition.xyz / viewSpacePosition.w;

    // Create TBN matrix
    let tangent = normalize(randomVec - normal * dot(randomVec, normal));
    let bitangent = cross(normal, tangent);
    let tbn = mat3x3<f32>(tangent, bitangent, normal);

    var occlusion: f32 = 0.0;
    for (var i: i32 = 0; i < 64; i++) {
        // Get sample position
        var samplePos = tbn * sampleKernel[i];
        samplePos = position + samplePos * 0.5; // 0.5 is the radius

        // Project sample position
        let offset = vec4<f32>(samplePos, 1.0);
        let sampleClipSpace = projectionMatrix * offset;
        let sampleUV = sampleClipSpace.xy / sampleClipSpace.w * 0.5 + 0.5;

        // Get sample depth
        let sampleDepth = textureSample(depthTexture, samplerLinear, sampleUV).r;

        // Compare depths
        let rangeCheck = smoothstep(0.0, 1.0, 0.5 / abs(position.z - sampleDepth));
        occlusion += select(0.0, 1.0, sampleDepth >= samplePos.z) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / 64.0);
    return vec4<f32>(occlusion, occlusion, occlusion, 1.0);