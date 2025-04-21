// Improved temporal accumulation with better motion handling and noise reduction
fn enhancedTemporalAccumulation(uv: vec2f, world_pos: vec3f, currentGI: vec3f, normal: vec3f, depth: f32) -> vec3f {
    // Project current world position to previous frame's UV using motion vectors
    let clip_pos = camera.view_projection * vec4f(world_pos, 1.0);
    let prev_clip_pos = camera.prev_view_projection * vec4f(world_pos, 1.0);
    let inv_w = 1.0 / clip_pos.w;
    let inv_prev_w = 1.0 / prev_clip_pos.w;
    let ndc = clip_pos.xy * inv_w;
    let prev_ndc = prev_clip_pos.xy * inv_prev_w;
    let motion = (ndc - prev_ndc) * vec2f(0.5, -0.5);
    let prevUV = uv - motion;

    // Calculate motion metrics
    let motion_length = length(motion);
    let motion_velocity = motion_length * f32(textureDimensions(prev_texture).x); // In pixels per frame

    // Determine accumulation parameters based on motion
    let max_frames = 8.0;
    let min_frames = 4.0;
    // Use more aggressive reduction of history frames during motion
    let frames = u32(mix(max_frames, min_frames, smoothstep(0.0005, 0.005, motion_length)));

    // Adaptive neighborhood sampling based on motion
    let texel_size = 1.0 / vec2f(f32(textureDimensions(prev_texture).x), f32(textureDimensions(prev_texture).y));

    // Improve variance clipping parameters for better noise rejection
    var colorMin = currentGI;
    var colorMax = currentGI;
    var colorAvg = vec3f(0.0);
    var colorVariance = vec3f(0.0);
    var totalWeight = 0.0;

    // Sample neighborhood to establish variance bounds
    // Use adaptive variance radius based on motion - larger radius during motion
    let base_variance_radius = 1;
    let variance_radius = select(base_variance_radius, base_variance_radius + 1, motion_velocity > 2.0);

    for (var y = -variance_radius; y <= variance_radius; y++) {
        for (var x = -variance_radius; x <= variance_radius; x++) {
            if (x == 0 && y == 0) {
                continue;
            }

            let offset = vec2f(f32(x), f32(y));
            let sampleUV = uv + offset * texel_size;

            if (all(sampleUV >= vec2f(0.0)) && all(sampleUV <= vec2f(1.0))) {
                let neighborGI = textureSampleLevel(prev_texture, sampler_color, sampleUV, 0.0).rgb;

                // Adaptive spatial weight based on motion
                // Decrease weight falloff during motion to allow for more blending
                let spatialFalloff = select(0.5, 0.3, motion_velocity > 2.0);
                let spatialWeight = exp(-length(offset) * spatialFalloff);

                colorMin = min(colorMin, neighborGI);
                colorMax = max(colorMax, neighborGI);
                colorAvg += neighborGI * spatialWeight;
                totalWeight += spatialWeight;

                // Accumulate squared differences for variance calculation
                colorVariance += pow(neighborGI - currentGI, vec3f(2.0)) * spatialWeight;
            }
        }
    }

    colorAvg = colorAvg / max(totalWeight, 0.0001);
    colorVariance = colorVariance / max(totalWeight, 0.0001);

    // Calculate standard deviation
    let colorStdDev = sqrt(colorVariance);

    // Expand the variance range based on motion and noise level
    // More aggressive expansion during camera motion to avoid trailing artifacts
    let base_variance_multiplier = 1.5;
    let motion_variance_boost = motion_velocity * 0.05; // Scale with motion speed
    let variance_multiplier = base_variance_multiplier + min(1.5, motion_variance_boost);

    // Use standard deviation for more accurate bounds
    colorMin = colorAvg - colorStdDev * variance_multiplier;
    colorMax = colorAvg + colorStdDev * variance_multiplier;

    // Sample history with bilinear interpolation and adjusted neighborhood
    var historyGI = vec3f(0.0);
    totalWeight = 0.0;

    // Adaptive sample count based on motion - more samples during motion for better noise reduction
    let base_sample_radius = select(1, 2, motion_velocity > 3.0);
    let sample_radius = select(base_sample_radius, base_sample_radius + 1, motion_velocity > 8.0);

    // Compute total samples for normalization
    let sample_count = (sample_radius * 2 + 1) * (sample_radius * 2 + 1);
    var sampleWeight = 1.0 / f32(sample_count);

    // Center sample has highest weight
    if (all(prevUV >= vec2f(0.0)) && all(prevUV <= vec2f(1.0))) {
        let centerSample = textureSampleLevel(prev_texture, sampler_color, prevUV, 0.0).rgb;

        // Reduce center weight during high motion to avoid flickering
        let centerWeightFactor = mix(2.0, 1.2, smoothstep(0.0, 10.0, motion_velocity));
        historyGI += centerSample * sampleWeight * centerWeightFactor;
        totalWeight += sampleWeight * centerWeightFactor;
    }

    // Additional samples with motion-aware pattern
    for (var i = 0; i < sample_radius; i++) {
        // Adaptive sampling density - tighter steps during motion
        let step_scale = mix(1.0, 0.7, smoothstep(0.0, 10.0, motion_velocity));
        let r = f32(i + 1) * texel_size * step_scale;

        // Adjust sampling pattern based on motion direction
        let motion_dir = normalize(vec2f(motion.x, motion.y) + vec2f(0.0001));
        let perp_dir = vec2f(-motion_dir.y, motion_dir.x);

        // More samples during motion, primarily along motion direction
        let sample_angles = select(4, 8, motion_velocity > 5.0);
        for (var j = 0; j < sample_angles; j++) {
            let angle = f32(j) * (2.0 * 3.14159) / f32(sample_angles);

            // Bias sampling pattern along motion direction during high motion
            let motion_bias = smoothstep(0.0, 8.0, motion_velocity) * 0.7;
            let dir = mix(
                motion_dir * cos(angle) + perp_dir * sin(angle),
                motion_dir,
                motion_bias
            );

            let sampleUV = prevUV + normalize(dir) * r;

            if (all(sampleUV >= vec2f(0.0)) && all(sampleUV <= vec2f(1.0))) {
                let sample = textureSampleLevel(prev_texture, sampler_color, sampleUV, 0.0).rgb;

                // Decrease weights for samples far from center during motion
                let distanceWeight = exp(-length(dir) * mix(0.5, 0.3, smoothstep(0.0, 8.0, motion_velocity)));
                let sampleContribution = sampleWeight * distanceWeight;

                historyGI += sample * sampleContribution;
                totalWeight += sampleContribution;
            }
        }
    }

    // Normalize the accumulated samples
    historyGI = historyGI / max(totalWeight, 0.0001);

    // Reject invalid history samples
    let prevSample = textureSampleLevel(position_texture, sampler_color, prevUV, 0.0);
    let prevPos = prevSample.rgb;
    let prevNormal = textureSampleLevel(normal_texture, sampler_color, prevUV, 0.0).rgb;

    // Improved validity check with weighted factors and motion-adaptive thresholds
    let uv_valid = all(prevUV >= vec2f(0.0)) && all(prevUV <= vec2f(1.0));

    // Relax normal validation during motion to avoid flickering
    let normal_threshold = mix(0.2, 0.3, smoothstep(0.0, 5.0, motion_velocity));
    let normal_similarity = dot(normal, prevNormal);
    let normal_valid = (1.0 - max(0.0, normal_similarity)) <= normal_threshold;

    // Adaptive position validation threshold based on motion
    let pos_threshold = mix(0.5, 1.0, smoothstep(0.0, 5.0, motion_velocity));
    let pos_distance = length(prevPos - world_pos);
    let pos_valid = pos_distance <= pos_threshold;

    // Combined validity with higher weight to position for motion
    let min_validity = select(
        0.0,
        mix(
            0.4,  // Higher base validity during motion to reduce flickering
            1.0,  // Full validity when stable
            smoothstep(0.01, 0.0, motion_length)
        ),
        uv_valid && normal_valid && pos_valid
    );

    // Use both minimum validity and continuous validity for smoother transitions
    let normal_factor = smoothstep(0.3, 0.0, 1.0 - max(0.0, normal_similarity));
    let pos_factor = smoothstep(pos_threshold, 0.0, pos_distance);
    let continuous_validity = mix(
        min_validity,
        normal_factor * pos_factor,
        smoothstep(0.0, 5.0, motion_velocity)
    );

    // Clamp history to neighborhood bounds to prevent ghosting
    // More aggressive clamping during motion
    historyGI = clamp(historyGI, colorMin, colorMax);

    // Dynamic blend factor based on motion and frame count
    let cameraSpeed = length(camera.position - camera.prev_position);
    let speedFactor = 1.0 - min(1.0, cameraSpeed * 0.5);

    // More aggressive feedback during motion
    let base_blend = 1.0 / (1.0 + f32(min(scene.frame, frames)));

    // Scale minimum blend with motion to ensure enough noise reduction
    let min_motion_blend = mix(0.05, 0.2, smoothstep(0.0, 10.0, motion_velocity));
    let max_motion_blend = mix(0.3, 0.5, smoothstep(0.0, 10.0, motion_velocity));

    let motionAdaptiveBlend = mix(
        max(max_motion_blend, base_blend * 2.0),  // More current frame influence during motion
        max(min_motion_blend, base_blend * speedFactor),  // More history influence when stable
        smoothstep(0.005, 0.0, motion_length)
    );

    // Final blend factor combining validity and motion adaptation
    // Smoother transition between blending states
    let blendFactor = mix(
        motionAdaptiveBlend * 2.0,  // Higher blend when invalid history
        motionAdaptiveBlend,        // Normal blend with valid history
        continuous_validity
    );

    // Luminance-based noise detection and suppression
    let current_luma = dot(currentGI, vec3f(0.299, 0.587, 0.114));
    let history_luma = dot(historyGI, vec3f(0.299, 0.587, 0.114));

    // High luma differences indicate potential noise or flickering
    let luma_diff = abs(current_luma - history_luma);
    let noise_factor = smoothstep(0.0, 0.2, luma_diff);

    // Apply more aggressive temporal smoothing to noisy areas during motion
    let noise_blend_boost = noise_factor * smoothstep(0.0, 5.0, motion_velocity) * 0.3;
    let final_blend = clamp(blendFactor - noise_blend_boost, 0.05, 0.7);

    // Blend current frame with history
    return mix(historyGI, currentGI, final_blend);
}
// Temporal accumulation with more robust motion rejection
fn robustTemporalAccumulation(uv: vec2f, world_pos: vec3f, currentGI: vec3f, normal: vec3f, depth: f32) -> vec3f {
    // Project current world position to previous frame's UV using motion vectors
    // Transform positions once
    let clip_pos = camera.view_projection * vec4f(world_pos, 1.0);
    let prev_clip_pos = camera.prev_view_projection * vec4f(world_pos, 1.0);
    let inv_w = 1.0 / clip_pos.w;
    let inv_prev_w = 1.0 / prev_clip_pos.w;
    let ndc = clip_pos.xy * inv_w;
    let prev_ndc = prev_clip_pos.xy * inv_prev_w;
    let motion = (ndc - prev_ndc) * vec2f(0.5, -0.5);
    let prevUV = uv - motion;
    let motion_length = length(motion);
    let frames = u32(mix(16.0, 1.0, motion_length));

    // More efficient neighborhood sampling
    let texel_size = 0.5 / vec2f(f32(textureDimensions(prev_texture).x), f32(textureDimensions(prev_texture).y));
    var historyGI = textureSampleLevel(prev_texture, sampler_color, prevUV, 0.0).rgb * 5.0;
    historyGI += textureSampleLevel(prev_texture, sampler_color, prevUV + vec2f(-1.0, -1.0) * texel_size, 0.0).rgb;
    historyGI += textureSampleLevel(prev_texture, sampler_color, prevUV + vec2f(1.0, -1.0) * texel_size, 0.0).rgb;
    historyGI += textureSampleLevel(prev_texture, sampler_color, prevUV + vec2f(-1.0, 1.0) * texel_size, 0.0).rgb;
    historyGI += textureSampleLevel(prev_texture, sampler_color, prevUV + vec2f(1.0, 1.0) * texel_size, 0.0).rgb;
    historyGI /= 9.0;

    let prevSample = textureSampleLevel(position_texture, sampler_color, prevUV, 0.0);
    let prevPos = prevSample.rgb;
    let prevNormal = textureSampleLevel(normal_texture, sampler_color, prevUV, 0.0).rgb;

    // Tighter bounds check
    let valid = select(0.0, 1.0,
        all(prevUV >= vec2f(0.0)) &&
        all(prevUV <= vec2f(1.0)) &&
        (1.0 - max(0.0, dot(normal, prevNormal))) <= 0.2 &&
        length(prevPos - world_pos) <= 1.0
    );

    let cameraSpeed = length(camera.position - camera.prev_position);
    let speedFactor = 1.0 - min(1.0, cameraSpeed * 0.5);
    let frameBlend = min(1.0, 1.0 / (1.0 + f32(min(scene.frame, frames))));
    let blendFactor = mix(0.3, frameBlend * speedFactor, valid);

    return mix(historyGI, currentGI, blendFactor);
}


fn countBits(val: i32) -> i32 {
    var v = val;
    v = (v & 0x55555555) + ((v >> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    v = (v & 0x0F0F0F0F) + ((v >> 4) & 0x0F0F0F0F);
    v = (v & 0x00FF00FF) + ((v >> 8) & 0x00FF00FF);
    v = (v & 0x0000FFFF) + ((v >> 16) & 0x0000FFFF);
    return v;
}

// Helper to create a random value from a 2D position
fn rand21(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

// Helper to convert degrees to radians
fn radians(degrees: f32) -> f32 {
    return degrees * 0.01745329252; // PI/180
}

// Helper function to get the tangent-bitangent-normal matrix
fn getTBNFromNormal(normal: vec3f) -> mat3x3f {
    // Find least-dominant axis of normal for stable tangent construction
    var tangent: vec3f;
    if (abs(normal.x) < abs(normal.y) && abs(normal.x) < abs(normal.z)) {
        tangent = normalize(vec3f(0.0, -normal.z, normal.y));
    } else if (abs(normal.y) < abs(normal.z)) {
        tangent = normalize(vec3f(-normal.z, 0.0, normal.x));
    } else {
        tangent = normalize(vec3f(-normal.y, normal.x, 0.0));
    }

    let bitangent = normalize(cross(normal, tangent));
    return mat3x3f(tangent, bitangent, normal);
}

// Modified isLit function to better handle emissive objects
fn isLit(pos: vec3f, normal: vec3f, pbr: vec4f) -> bool {
    // Check if the object itself is emissive
    if (pbr.a > 0.0) {
        return true; // The object is self-illuminating
    }

    // Sample the shadow map
    for (var i = 0u; i < scene.directionalLightsNum; i = i + 1u) {
        let light = scene.directionalLights[i];
        let posFromLight = light.view_projection * vec4f(pos, 1.0);
        let shadowPos = vec3f(
            posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5),
            posFromLight.z
        );
        let shadow = shadow_pcf(shadowPos, shadow_texture, sampler_depth);

        let L = normalize(-light.direction);
        let NdotL = max(dot(normal, L), 0.0);

        if (shadow > 0.5 && NdotL > 0.0) {
            return true;
        }
    }

    return false;
}

// GI computation using screen space horizons
fn computeGI(uv: vec2f, world_pos: vec3f, normal: vec3f, albedo: vec3f, depth: f32) -> vec3f {
    let screenSize = vec2f(f32(textureDimensions(position_texture).x), f32(textureDimensions(position_texture).y));
    let invScreenSize = vec2f(1.0) / screenSize;
    let pixelCoord = uv * screenSize;

    // Constants for the algorithm
    let numHorizons = 4;
    let numSteps = 256;
    let lightCoeff = 2.0;
    let stepCoeff = 0.05;

    // View space transforms
    let viewNormal = (camera.view * vec4f(normal, 0.0)).xyz;
    let viewPos = (camera.view * vec4f(world_pos, 1.0)).xyz;

    // Create TBN in view space for consistent sampling
    let tbn = getTBNFromNormal(viewNormal);

    var result = vec3f(0.0);

    // Random angle offset to reduce banding artifacts
    let randPhiOffset = rand21(uv + vec2f(f32(scene.frame) * 0.01));

    // Sample multiple horizon directions
    for (var i = 0; i < numHorizons; i = i + 1) {
        let phi = f32(i) * radians(120.0) + randPhiOffset * radians(360.0);
        let ssDir = vec2f(cos(phi), sin(phi));

        var stepDist = 1.0;

        var bitMask = 0i;

        for (var s = 1; s < numSteps; s = s + 1) {
            let currentStep = max(1.0, stepDist * stepCoeff);
            let sampleUV = uv + ssDir * stepDist * invScreenSize;
            stepDist += currentStep * 2.0; // Even faster progression

            if (sampleUV.x <= 0.0 || sampleUV.x >= 1.0 || sampleUV.y <= 0.0 || sampleUV.y >= 1.0) {
                break;
            }

            let samplePosition = textureSampleLevel(position_texture, sampler_color, sampleUV, 0.0);

            if (length(samplePosition.xyz) > 1000.0) {
                continue;
            }

            let sampleViewPos = (camera.view * vec4f(samplePosition.xyz, 1.0)).xyz;
            let delta = sampleViewPos - viewPos;

            let normalDot = dot(viewNormal, delta) - 0.001;
            let tangentDist = length(delta - normalDot * viewNormal);

            let angle1f = atan2(normalDot, tangentDist);
            let angle2f = atan2(normalDot - 0.04 * max(1.0, stepDist * 0.08), tangentDist);

            let angle1 = max(0.0, ceil(angle1f / (3.14159 * 0.5) * 32.0));
            let angle2 = max(0.0, floor(angle2f / (3.14159 * 0.5) * 32.0));

            var sBitMask = 0i;
            if (angle1 > angle2) {
                let bits = i32(pow(2.0, angle1 - angle2) - 1.0);
                sBitMask = bits << u32(angle2);
            }

            let newBits = countBits(sBitMask & (~bitMask));

            if (newBits > 0) {
                let sampleNormal = textureSampleLevel(normal_texture, sampler_color, sampleUV, 0.0);
                let sampleAlbedo = textureSampleLevel(albedo_texture, sampler_color, sampleUV, 0.0);
                let sampleViewNormal = normalize((camera.view * vec4f(sampleNormal.xyz, 0.0)).xyz);

                let horizonWeight = f32(newBits) / max(1.0, angle1 - angle2);
                let cosAngle1 = cos(angle1 * 3.14159 / 32.0);
                let cosAngle2 = cos(angle2 * 3.14159 / 32.0);
                let solidAngleTerm = (pow(cosAngle2, 2.0) - pow(cosAngle1, 2.0));
                let normalFactor = sqrt(max(0.0, dot(sampleViewNormal, -normalize(delta))));
                let samplePbr = textureSampleLevel(pbr_texture, sampler_color, sampleUV, 0.0);

                var inDirectLight = false;
                let hasEmission = isLit(samplePosition.xyz, sampleNormal.xyz, samplePbr);

                var directLightFactor = 1.0;
                if (textureDimensions(prev_texture).x > 1) {
                    let directLight = textureSampleLevel(prev_texture, sampler_color, sampleUV, 0.0).rgb;
                    let directLightIntensity = dot(directLight, vec3f(0.299, 0.587, 0.114));
                    directLightFactor = mix(0.3, 1.2, min(1.0, directLightIntensity * 2.5));
                    inDirectLight = directLightIntensity > 0.3 || hasEmission;
                } else {
                    inDirectLight = hasEmission;
                }

                var lightingFactor = select(directLightFactor, 4.0, inDirectLight);
                var sampleEmission = select(vec3f(0), samplePbr.a * sampleAlbedo.rgb * 1.5, hasEmission);
                result += (sampleAlbedo.rgb + sampleEmission) * horizonWeight * solidAngleTerm * normalFactor * lightCoeff * lightingFactor;
            }

            bitMask = bitMask | sBitMask;
        }
    }

    result = result / f32(numHorizons) * 0.8;

    let intensity = dot(result, vec3f(0.299, 0.587, 0.114));
    let darkBoost = max(0.0, 0.25 - intensity) * 2.0;
    result = mix(result, albedo * max(intensity, 0.08), darkBoost);

    let minAmbient = 0.05;
    result = result + albedo * minAmbient;

    return result;
}

fn tgvDenoise(uv: vec2f, gi: vec3f, world_pos: vec3f, normal: vec3f, albedo: vec3f) -> vec3f {
    // Parameters for TGV denoising
    let alpha = 2.0; // Data fidelity weight
    let beta = 1.0;  // First-order regularization weight
    let gamma = 0.5; // Second-order regularization weight

    let kernelRadius = 2;
    var v = vec3f(0.0);      // Dual variable for first-order term
    var w = mat2x3f(        // Dual variable for second-order term
        vec3f(0.0),
        vec3f(0.0)
    );

    let screenSize = vec2f(f32(textureDimensions(position_texture).x), f32(textureDimensions(position_texture).y));
    let invScreenSize = vec2f(1.0) / screenSize;

    // First iteration: compute gradients
    var gradX = vec3f(0.0);
    var gradY = vec3f(0.0);

    for (var dy = -kernelRadius; dy <= kernelRadius; dy++) {
        for (var dx = -kernelRadius; dx <= kernelRadius; dx++) {
            let offset = vec2f(f32(dx), f32(dy));
            let sampleUV = uv + offset * invScreenSize;

            if (all(sampleUV >= vec2f(0.0)) && all(sampleUV <= vec2f(1.0))) {
                let sampleGI = textureSampleLevel(prev_texture, sampler_color, sampleUV, 0.0).rgb;
                let sampleNormal = textureSampleLevel(normal_texture, sampler_color, sampleUV, 0.0).rgb;
                let samplePos = textureSampleLevel(position_texture, sampler_color, sampleUV, 0.0).rgb;

                // Weight based on normal and position similarity
                let normalWeight = pow(max(0.0, dot(normal, sampleNormal)), 8.0);
                let posWeight = exp(-length(world_pos - samplePos) * 0.1);
                let weight = normalWeight * posWeight;

                if (dx == 1) { gradX += (sampleGI - gi) * weight; }
                if (dy == 1) { gradY += (sampleGI - gi) * weight; }
            }
        }
    }

    // Update dual variables
    v += (gradX + gradY) * alpha;
    w[0] += gradX * beta;
    w[1] += gradY * beta;

    // Project dual variables
    let vLen = length(v);
    if (vLen > 1.0) { v = v / vLen; }

    var wLen = length(w[0]);
    if (wLen > gamma) { w[0] = w[0] * (gamma / wLen); }
    wLen = length(w[1]);
    if (wLen > gamma) { w[1] = w[1] * (gamma / wLen); }

    // Final denoised result
    var result = gi;
    result -= (v + w[0] + w[1]) / (alpha + beta + gamma);

    return result;
}

fn bilateralDenoise(uv: vec2f, gi: vec3f, world_pos: vec3f, normal: vec3f, albedo: vec3f) -> vec3f {
    let screenSize = vec2f(f32(textureDimensions(position_texture).x), f32(textureDimensions(position_texture).y));
    let invScreenSize = vec2f(1.0) / screenSize;
    let kernelRadius = 8.0;
    var result = vec3f(0.0);
    var totalWeight = 0.0;

    // Gaussian factors for spatial distance
    let sigma_spatial = 8.0;
    let sigma_color = 0.3;
    let sigma_normal = 0.1;

    for (var dy = -kernelRadius; dy <= kernelRadius; dy += 1.0) {
        for (var dx = -kernelRadius; dx <= kernelRadius; dx += 1.0) {
            let offset = vec2f(dx, dy);
            let sampleUV = uv + offset * invScreenSize;

            // Skip out-of-bounds samples
            if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
                continue;
            }

            let sampleGI = textureSampleLevel(prev_texture, sampler_color, sampleUV, 0.0).rgb;
            let sampleNormal = textureSampleLevel(normal_texture, sampler_color, sampleUV, 0.0).rgb;
            let samplePos = textureSampleLevel(position_texture, sampler_color, sampleUV, 0.0).rgb;
            let sampleAlbedo = textureSampleLevel(albedo_texture, sampler_color, sampleUV, 0.0).rgb;

            // Calculate weights
            let spatial_dist = length(offset) / sigma_spatial;
            let normal_dist = length(normal - sampleNormal) / sigma_normal;
            let color_dist = length(albedo - sampleAlbedo) / sigma_color;
            let position_dist = length(world_pos - samplePos) * 0.1;

            // Combine all weights
            let weight = exp(-spatial_dist * spatial_dist - normal_dist * normal_dist - color_dist * color_dist - position_dist * position_dist);

            result += sampleGI * weight;
            totalWeight += weight;
        }
    }

    return result / max(totalWeight, 0.0001);
}

fn rand_2d(uv: vec2f) -> f32 {
    return fract(sin(dot(uv, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn mod_f32(x: f32, y: f32) -> f32 {
    return x - y * floor(x/y);
}

  fn calc_direct(uv: vec2f, albedo: vec3f, position: vec3f, normal: vec3f, pbr: vec4f) -> vec3f {
      let roughness = clamp(pbr.r, 0.001, 1.0);
      let metalness = clamp(pbr.g, 0.0, 1.0);
      let ao        = clamp(pbr.b, 0.0, 1.0);
      let emission  = pbr.a;


      var F0 = vec3f(0.04);
      F0 = mix(F0, albedo, metalness);

      let ambient = getAmbient(normal, position, pbr);

      var Lo = vec3f(0.0);

      // Pre-compute view direction
      let V = normalize(camera.position - position);
      var visibility = 1.0;
      var shadowColor = vec3f(0.0);

      // --- Directional lights ---
      for (var i = 0u; i < scene.directionalLightsNum; i += 1u) {
          let light = scene.directionalLights[i];
          let posFromLight = light.view_projection * vec4f(position, 1.0);
          let shadowPos = vec3f(
              posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
              posFromLight.z
          );
          let shadow = shadow_pcf(shadowPos, shadow_texture, sampler_depth);
          let shadowColorSample = textureSampleLevel(shadow_color, sampler_color, shadowPos.xy, 0.0).rgb;
          visibility = min(visibility, shadow);
          shadowColor = mix(shadowColorSample.rgb, vec3f(1), shadow);

          let L = normalize(-light.direction);
          let H = normalize(V + L);
          let NdotL = max(dot(normal, L), 0.0);
          let NdotV = max(dot(normal, V), 0.0);
          if (NdotL > 0.0) {
              // Cook-Torrance BRDF calculations
              let D = DistributionGGX(normal, H, roughness);
              let G = GeometrySmith(normal, V, L, roughness);
              let F0 = mix(vec3(0.04), albedo, metalness);
              let F = FresnelSchlick(max(dot(H, V), 0.0), F0);

              // kS is the specular reflectance, kD is the diffuse component (energy conservation)
              let kS = F;
              let kD = (vec3f(1) - kS) * (1.0 - metalness);              // Metals have almost no diffuse contribution.

              let numerator    = D * G * F;
              let denominator = 4.0 * NdotV * NdotL;
              let specular = numerator / denominator;
              let radiance = light.color.rgb * light.intensity;
              let direct = (kD * albedo / PI + specular) * radiance * NdotL;

              Lo += direct * (ambient + shadowColor);
          }
      }

      // --- Point lights ---
      for (var i = 0u; i < scene.pointLightsNum; i += 1u) {
          let light = scene.pointLights[i];
          let L_vector = light.position - position;
          let distance = length(L_vector);
          let L = normalize(L_vector);
          let H = normalize(V + L);
          let NdotL = max(dot(normal, L), 0.0);
          let NdotV = max(dot(normal, V), 0.0);
          if (NdotL > 0.0) {
              // Attenuation (inverse-square law)
              let attenuation = calculate_attenuation(distance) * light.intensity;
              let lightRadiance = light.color.rgb * attenuation;

              let D = DistributionGGX(normal, H, roughness);
              let G = GeometrySmith(normal, V, L, roughness);
              let F = FresnelSchlick(max(dot(H, V), 0.0), F0);
              let specular = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);

              let kS = F;
              var kD = vec3f(1.0) - kS;
              kD *= (1.0 - metalness);
              let diffuse = albedo;

              Lo += (kD * diffuse + specular) * lightRadiance * NdotL;
          }
      }
      var finalColor = (ambient + Lo + emission) * albedo;
      finalColor = ACES_FILM(finalColor);
      finalColor = vec3f(pow(finalColor, vec3f(1.0 / 2.2)));

      return finalColor;
  }

fn getAmbient( normal: vec3f, world_pos: vec3f, pbr: vec4f) -> vec3f {
    if (textureDimensions(environment).x > 1) {
        let normalWorld = normalize(normal);
        let V = normalize(camera.position - world_pos);

        // For reflections
        let reflectionDir = reflect(-V, normal);
        let reflectionColor = textureSampleLevel(environment, sampler_color, reflectionDir, 0);

        // For diffuse environment lighting
        let diffuseLight = textureSampleLevel(environment, sampler_color, normal, 0);

        // Simple mix for demo purposes
        if (length(world_pos) < 1000.0) {
            let roughness = pbr.r;
            let metallic = pbr.g;
            let envColor = mix(diffuseLight.rgb, reflectionColor.rgb, metallic);
            return envColor * (1.0 - roughness) * scene.ambient.a;
        }
        return vec3f(0.0);
    } else {
        return scene.ambient.rgb * scene.ambient.a;
    }
}


@fragment() {{
  // samples
  let positionSample = textureSample(position_texture, sampler_color, input.uv);
  let normalSample = textureSample(normal_texture, sampler_color, input.uv);
  let albedoSample = textureSample(albedo_texture, sampler_color, input.uv);
  let pbrSample = textureSample(pbr_texture, sampler_color, input.uv);

  // defines
  let world_pos = positionSample.rgb;
  let depth = positionSample.a;
  var normal = normalSample.rgb;
  let albedo = albedoSample.rgb;
  let useLight = albedoSample.a;
  let useFog = normalSample.a;

  var distFromCamera = length(world_pos - camera.position);
  if (distFromCamera > 1000) {
    output.color = vec4f(albedo, 1);
    output.gi = vec4f(0);
    return output;
  }


  var finalColor = vec3f(albedo);
  // direct
  var direct = calc_direct(input.uv, albedo, world_pos, normal, pbrSample);

  var currentGI = vec3f(0);
  var accumulatedGI = vec3f(0);
  var indirectGI = vec3f(0);

//   currentGI = computeGI(input.uv, world_pos, normal, albedo, depth);
//   accumulatedGI = enhancedTemporalAccumulation(input.uv, world_pos, currentGI, normal, depth);
//   indirectGI = accumulatedGI * albedo;

    if (useLight == 1) {
      finalColor = direct + indirectGI;
    }

  // fog
  if (useFog == 1) {
    let fogDistance = length(world_pos - camera.position);
    let fogColor = scene.fog.color.rgb;
    let fogStart = scene.fog.start;
    let fogEnd = scene.fog.end;
    let fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
    finalColor = mix(finalColor, fogColor, fogFactor);
  }

  if (length(albedo) == 0.0) {
    finalColor = scene.background.rgb;
  }

  // deferred_output
  output.color = vec4f(finalColor, 1.0);
  output.gi = vec4f(accumulatedGI, 1.0);
}}
