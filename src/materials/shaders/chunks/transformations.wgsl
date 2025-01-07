// transformations.wgsl - A comprehensive transform chunk for WebGPU shaders

fn transformToWorldSpace(localPos: vec3<f32>, instanceIndex: u32) -> vec3<f32> {
    var worldPos: vec4<f32>;
    
    // If using instancing, apply instance transform
    if (instanceIndex != 0xFFFFFFFF) {
        worldPos = instanceTransforms[instanceIndex].matrix * vec4<f32>(localPos, 1.0);
    } else {
        worldPos = transform.model * vec4<f32>(localPos, 1.0);
    }
    
    return worldPos.xyz;
}

// Transform a position all the way to clip space
fn transformToClipSpace(localPos: vec3<f32>, instanceIndex: u32) -> vec4<f32> {
    let worldPos = transformToWorldSpace(localPos, instanceIndex);
    let viewPos = transform.view * vec4<f32>(worldPos, 1.0);
    return transform.projection * viewPos;
}

// Transform a normal vector, considering non-uniform scaling
fn transformNormal(localNormal: vec3<f32>, instanceIndex: u32) -> vec3<f32> {
    var normalMatrix: mat4x4<f32>;
    
    if (instanceIndex != 0xFFFFFFFF) {
        normalMatrix = instanceTransforms[instanceIndex].normalMatrix;
    } else {
        normalMatrix = transform.normal;
    }
    
    // Transform and renormalize the normal
    return normalize((normalMatrix * vec4<f32>(localNormal, 0.0)).xyz);
}

// Helper for transforming tangent vectors (for normal mapping)
fn transformTangent(localTangent: vec3<f32>, instanceIndex: u32) -> vec3<f32> {
    // Tangents transform like vectors (not normals), so we use the model matrix
    if (instanceIndex != 0xFFFFFFFF) {
        return normalize((instanceTransforms[instanceIndex].matrix * vec4<f32>(localTangent, 0.0)).xyz);
    }
    return normalize((transform.model * vec4<f32>(localTangent, 0.0)).xyz);
}

// Calculate view direction in world space
fn calculateViewDirection(worldPos: vec3<f32>) -> vec3<f32> {
    // Extract camera position from view matrix (inverse of the translation component)
    let cameraPos = vec3<f32>(
        transform.view[3][0],
        transform.view[3][1],
        transform.view[3][2]
    );
    return normalize(cameraPos - worldPos);
}

// Build a TBN matrix for normal mapping
fn buildTBNMatrix(normal: vec3<f32>, tangent: vec3<f32>) -> mat3x3<f32> {
    let N = normalize(normal);
    let T = normalize(tangent - dot(tangent, N) * N); // Gram-Schmidt orthogonalization
    let B = cross(N, T);
    return mat3x3<f32>(T, B, N);
}

// Helper for billboard transformations (always facing camera)
fn calculateBillboardMatrix(worldPos: vec3<f32>) -> mat4x4<f32> {
    let viewDir = calculateViewDirection(worldPos);
    let right = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), viewDir));
    let up = cross(viewDir, right);
    
    return mat4x4<f32>(
        vec4<f32>(right, 0.0),
        vec4<f32>(up, 0.0),
        vec4<f32>(viewDir, 0.0),
        vec4<f32>(worldPos, 1.0)
    );
}
