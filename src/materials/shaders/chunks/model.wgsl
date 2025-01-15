@group(1) @binding(0) var<storage> model: array<mat4x4f>;

fn getMVP(model: mat4x4f, view: mat4x4f, projection: mat4x4f) -> mat4x4f {
    return projection * view * model;
}
fn getScreenPosition(projection: mat4x4f, view: mat4x4f, model: mat4x4f, position: vec3f) -> vec4f {
    return projection * view * model * vec4f(position, 1.0);
}

fn getWorldPosition(position: vec3f, model: mat4x4f) -> vec3f {
    return (model * vec4f(position, 1.0)).xyz;
}

fn getWorldNormal(normal: vec3f, model: mat4x4f) -> vec3f {
    return normalize((model * vec4f(normal, 0.0)).xyz);
}


fn transformTangent(localTangent: vec3<f32>, matrix: mat4x4f) -> vec3<f32> {
    return normalize((matrix * vec4f(localTangent, 0.0)).xyz);
}

// Build a TBN matrix for normal mapping
fn buildTBNMatrix(normal: vec3<f32>, tangent: vec3<f32>) -> mat3x3<f32> {
    let N = normalize(normal);
    let T = normalize(tangent - dot(tangent, N) * N); // Gram-Schmidt orthogonalization
    let B = cross(N, T);
    return mat3x3<f32>(T, B, N);
}
fn getBillboardModelMatrix(modelMatrix: mat4x4<f32>, viewMatrix: mat4x4<f32>) -> mat4x4<f32> {
 // Extract translation from the model matrix
    let modelTranslation = vec3f(modelMatrix[3].x, modelMatrix[3].y, modelMatrix[3].z);

    // Extract scale factors from the model matrix
    let scaleX = length(vec3f(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
    let scaleY = length(vec3f(modelMatrix[1].x, modelMatrix[1].y, modelMatrix[1].z));
    let scaleZ = length(vec3f(modelMatrix[2].x, modelMatrix[2].y, modelMatrix[2].z));

    // Construct a scaling matrix
    let scaleMatrix = mat3x3f(
        vec3f(scaleX, 0.0, 0.0),
        vec3f(0.0, scaleY, 0.0),
        vec3f(0.0, 0.0, scaleZ)
    );

    // Extract rotation part of the view matrix (upper-left 3x3)
    let viewRotation = mat3x3f(
        vec3f(viewMatrix[0].x, viewMatrix[0].y, viewMatrix[0].z),
        vec3f(viewMatrix[1].x, viewMatrix[1].y, viewMatrix[1].z),
        vec3f(viewMatrix[2].x, viewMatrix[2].y, viewMatrix[2].z)
    );

    // Compute the camera rotation matrix (transpose of the view rotation)
    let cameraRotation = transpose(viewRotation);

    // Apply a 180-degree rotation around the Y-axis to flip the billboard
    let rotate180Y = mat3x3f(
        vec3f( -1.0,  0.0,  0.0 ),
        vec3f(  0.0,  1.0,  0.0 ),
        vec3f(  0.0,  0.0, -1.0 )
    );

    // Correct camera rotation by applying the 180-degree rotation
    let correctedCameraRotation = cameraRotation * rotate180Y;

    // Build the billboard rotation matrix by combining corrected camera rotation and model scale
    let billboardRotation = correctedCameraRotation * scaleMatrix;

    // Assemble the billboard model matrix with the corrected rotation
    return mat4x4f(
        vec4f(billboardRotation[0], 0.0),
        vec4f(billboardRotation[1], 0.0),
        vec4f(billboardRotation[2], 0.0),
        vec4f(modelTranslation, 1.0)
    );
}

@vertex() {{
    worldPosition = getWorldPosition(position, model[input.instance_index]);
    worldNormal = getWorldNormal(normal, model[input.instance_index]);
    #if USE_BILLBOARD {
        let modelMatrix = getBillboardModelMatrix(model[input.instance_index], camera.view);
        screenPosition = getScreenPosition(camera.projection, camera.view, modelMatrix, position);
    } else {
        screenPosition = getScreenPosition( camera.projection, camera.view, model[input.instance_index], position );
    }
    uv = input.uv;
    normal = input.normal;
}}