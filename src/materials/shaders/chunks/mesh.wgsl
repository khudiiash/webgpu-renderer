@group(Global) @binding(Camera)
@group(Mesh) @binding(MeshInstances)
@group(Mesh) @binding(MeshOptions)

fn getMVP(model: mat4x4f, view: mat4x4f, projection: mat4x4f) -> mat4x4f {
    return projection * view * model;
}
fn getScreenPosition(projection: mat4x4f, view: mat4x4f, model: mat4x4f, position: vec3f) -> vec4f {
    return projection * view * model * vec4f(position, 1.0);
}

fn transformTangent(matrix: mat4x4f, localTangent: vec3f) -> vec3<f32> {
    return normalize((matrix * vec4f(localTangent, 0.0)).xyz);
}

fn buildTBNMatrix(normal: vec3f, tangent: vec3f) -> mat3x3<f32> {
    let N = normalize(normal);
    let T = normalize(tangent - dot(tangent, N) * N); // Gram-Schmidt orthogonalization
    let B = cross(N, T);
    return mat3x3<f32>(T, B, N);
}

fn transformPosition(matrix: mat4x4f, vector: vec3f) -> vec3f {
    return (matrix * vec4f(vector, 1.0)).xyz;
}

fn getBillboardModelMatrix(modelMatrix: mat4x4<f32>, viewMatrix: mat4x4<f32>) -> mat4x4<f32> {
    let modelTranslation = vec3f(modelMatrix[3].x, modelMatrix[3].y, modelMatrix[3].z);

    let scaleX = length(vec3f(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
    let scaleY = length(vec3f(modelMatrix[1].x, modelMatrix[1].y, modelMatrix[1].z));
    let scaleZ = length(vec3f(modelMatrix[2].x, modelMatrix[2].y, modelMatrix[2].z));

    let scaleMatrix = mat3x3f(
        vec3f(scaleX, 0.0, 0.0),
        vec3f(0.0, scaleY, 0.0),
        vec3f(0.0, 0.0, scaleZ)
    );

    let viewRotation = mat3x3f(
        vec3f(viewMatrix[0].x, viewMatrix[0].y, viewMatrix[0].z),
        vec3f(viewMatrix[1].x, viewMatrix[1].y, viewMatrix[1].z),
        vec3f(viewMatrix[2].x, viewMatrix[2].y, viewMatrix[2].z)
    );

    let cameraRotation = transpose(viewRotation);

    let rotate180Y = mat3x3f(
        vec3f( -1.0,  0.0,  0.0 ),
        vec3f(  0.0,  1.0,  0.0 ),
        vec3f(  0.0,  0.0, -1.0 )
    );

    let correctedCameraRotation = cameraRotation * rotate180Y;
    let billboardRotation = correctedCameraRotation * scaleMatrix;

    return mat4x4f(
        vec4f(billboardRotation[0], 0.0),
        vec4f(billboardRotation[1], 0.0),
        vec4f(billboardRotation[2], 0.0),
        vec4f(modelTranslation, 1.0)
    );
}

@vertex() {{
    // model
    var model = mesh_instances[input.instance_index];

    if (mesh_options.useBillboard == 1) {
        // billboard
        model = getBillboardModelMatrix(model, camera.view);
        screenPosition = getScreenPosition(camera.projection, camera.view, model, position);
    } else {
        // screen_position
        screenPosition = getScreenPosition(camera.projection, camera.view, model, position);
    }
    // uv
    uv = input.uv;
    // normal
    normal = input.normal;

    // world_tangent
    worldTangent = transformTangent(model, input.tangent);
    // world_bitangent
    worldBitangent = transformTangent(model, input.bitangent);
    // world_position
    worldPosition = transformPosition(model, position);
    // world_normal
    worldNormal = transformPosition(model, normal);
}}