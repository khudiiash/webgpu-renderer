const PI = 3.14159265359;
const PI2 = 6.28318530718;
const PI_OVER_2 = 1.57079632679;
const EPSILON = 0.001;
const TAU = 6.283185;

fn V2F16(v: vec2f) -> f32 {
    return v.y * f32(0.0039215689) + v.x;
}

fn mod2(a: f32, b: f32) -> f32 {
    return a - b * floor(a / b);
}

fn F16V2(f: f32) -> vec2f {
    return vec2f(f32(f * 255.0) * f32(0.0039215689), fract(f * 255.0));
}

fn SRGB(c: vec3f) -> vec3f {
    return pow(c, vec3f(2.2));
}

fn LINEARIZE(c: vec3f) -> vec3f {
    return pow(c, vec3f(1.0 / 2.2));
}

fn ACES_FILM(c: vec3f) -> vec3f {
    //Aces film curve
    return clamp((c*(2.51*c + 0.03))/(c*(2.43*c + 0.59) + 0.14), vec3f(0), vec3f(1));
}

fn remap(value: f32, min1: f32, max1: f32, min2: f32, max2: f32) -> f32 {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

fn easeOutExpo(v: f32, ext: f32)-> f32 {
    return select(1.0 - pow(2, -ext * v), v, v == 1.0);
}

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

fn outBounds(uv: vec2f) -> bool {
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
    return fract(uv * scale);
}

fn worldToTangentSpace(worldDir: vec3f, TBN: mat3x3f) -> vec3f {
    return normalize(transpose(TBN) * worldDir);
}

fn inverse3x3(m: mat3x3f) -> mat3x3f {
    // Rearrange the matrix elements from column-major order.
    // Here, the first row is: m[0][0], m[1][0], m[2][0].
    let a = m[0][0]; // first row, first column
    let b = m[1][0]; // first row, second column
    let c = m[2][0]; // first row, third column
    let d = m[0][1]; // second row, first column
    let e = m[1][1]; // second row, second column
    let f = m[2][1]; // second row, third column
    let g = m[0][2]; // third row, first column
    let h = m[1][2]; // third row, second column
    let i = m[2][2]; // third row, third column

    let det: f32 = a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
    let invDet = 1.0 / det;

    // Construct the inverse matrix.
    // The matrix constructor takes column vectors.
    return mat3x3f(
        vec3f((e*i - f*h) * invDet, (f*g - d*i) * invDet, (d*h - e*g) * invDet),
        vec3f((c*h - b*i) * invDet, (a*i - c*g) * invDet, (b*g - a*h) * invDet),
        vec3f((b*f - c*e) * invDet, (c*d - a*f) * invDet, (a*e - b*d) * invDet)
    );
}
