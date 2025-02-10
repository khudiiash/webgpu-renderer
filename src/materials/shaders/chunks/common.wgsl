const PI = 3.14159265359;
const PI2 = 6.28318530718;
const PI_OVER_2 = 1.57079632679;
const EPSILON = 0.001;
const TAU = 6.28318530718;

fn getTBN(tangent: vec3f, bitangent: vec3f, normal: vec3f) -> mat3x3f {
    var T = normalize(tangent);
    let B = normalize(bitangent);
    let N = normalize(normal);
    // TBN must form a right handed coord system.
    // Some models have symetric UVs. Check and fix.
    if (dot(cross(N, T), B) < 0.0) {
        T = T * -1.0;
    }
    return mat3x3f(T, B, N);
}



fn out_bounds(uv: vec2f) -> bool {
    return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
}

fn isZeroMat3(m: mat3x3f) -> bool {
    return length(m[0] + m[1] + m[2]) < EPSILON;
}

fn isZeroMat4(m: mat4x4f) -> bool {
    return length(m[0] + m[1] + m[2] + m[3]) < EPSILON;
}

fn transform(matrix: mat4x4f, vector: vec3f, w: f32) -> vec3f {
    return (matrix * vec4f(vector, w)).xyz;
}

fn toTangent(TBN: mat3x3f, vector: vec3f) -> vec3f {
    return TBN * vector;
}


fn getBillboardModelMatrix(modelMatrix: mat4x4f, viewMatrix: mat4x4f) -> mat4x4f {
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

    let billboardRotation = cameraRotation * scaleMatrix;

    return mat4x4f(
        vec4f(billboardRotation[0], 0.0),
        vec4f(billboardRotation[1], 0.0),
        vec4f(billboardRotation[2], 0.0),
        vec4f(modelTranslation, 1.0)
    );
}


fn scaleUV(uv: vec2f, scale: vec2f) -> vec2f {
    return (uv - 0.5) * scale + 0.5;
}

fn worldToTangentSpace(worldDir: vec3f, TBN: mat3x3f) -> vec3f {
    return normalize(transpose(TBN) * worldDir);
}