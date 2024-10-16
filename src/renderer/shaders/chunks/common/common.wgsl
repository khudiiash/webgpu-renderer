const PI : f32 = 3.14159265359;
const PI2 : f32 = 6.28318530718;
const PI_HALF : f32 = 1.57079632679;
const EPSILON : f32 = 0.0001;
const m = mat3x3f( 0.00,  0.80,  0.60,
              -0.80,  0.36, -0.48,
              -0.60, -0.48,  0.64 );

fn noise1D(x: f32) -> f32 {
    return fract(sin(x) * 43758.5453);
}

fn mod289_3(x: vec3<f32>) -> vec3<f32> {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn mod289_2(x: vec2<f32>) -> vec2<f32> {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn permute(x: vec3<f32>) -> vec3<f32> {
    return mod289_3(((x * 34.) + 1.) * x);
}

fn bezier(t: f32, p0: vec3f, p1: vec3f, p2: vec3f) -> vec3f {
    let u = 1.0 - t;
    return u * u * p0 + 2.0 * u * t * p1 + t * t * p2;
}

fn noise2D(v: vec2<f32>) -> f32 {
  // Precompute values for skewed triangular grid
  let C = vec4<f32>(
    .211324865405187,
    // (3.0-sqrt(3.0))/6.0
    .366025403784439,
    // 0.5*(sqrt(3.0)-1.0)
    -.577350269189626,
    // -1.0 + 2.0 * C.x
    0.024390243902439);
    // 1.0 / 41.0

    // First corner (x0)
    var i = floor(v + dot(v, C.yy));
    let x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    let i1 = select(
        vec2<f32>(0., 1.),
        vec2<f32>(1., 0.),
        x0.x > x0.y);
    let x1 = x0.xy + C.xx - i1;
    let x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289_2(i);
    let p = permute(
        permute(i.y + vec3<f32>(0., i1.y, 1.)) + i.x + vec3<f32>(0., i1.x, 1.));
    var m = max(0.5 - vec3<f32>(
        dot(x0, x0),
        dot(x1, x1),
        dot(x2, x2)
    ), vec3<f32>(0.));

    m = m * m;
    m = m * m;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    let x = 2. * fract(p * C.www) - 1.;
    let h = abs(x) - .5;
    let ox = floor(x + .5);
    let a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m = m * (1.79284291400159 - .85373472095314 * (a0 * a0 + h * h));

    // Compute final noise value at P
    let g = vec3<f32>(
        a0.x * x0.x + h.x * x0.y,
        a0.yz * vec2<f32>(x1.x, x2.x) + h.yz * vec2<f32>(x1.y, x2.y)
    );

    return 130. * dot(m, g);
}


fn saturate(x: f32) -> f32 {
    return clamp(x, 0.0, 1.0);
}

fn saturate3(x: vec3<f32>) -> vec3<f32> {
    return clamp(x, vec3(0.0), vec3(1.0));
}

fn linearstep(minValue: f32, maxValue: f32, v: f32) -> f32 {
    return clamp((v - minValue) / (maxValue - minValue), 0.0, 1.0);
}

fn inverseLerp(minValue: f32, maxValue: f32, v: f32) -> f32 {
    return (v - minValue) / (maxValue - minValue);
}

fn inverseLerpSat(minValue: f32, maxValue: f32, v: f32) -> f32 {
    return saturate((v - minValue) / (maxValue - minValue));
}

fn remap(v: f32, inMin: f32, inMax: f32, outMin: f32, outMax: f32) -> f32 {
    let t = inverseLerp(inMin, inMax, v);
    return mix(outMin, outMax, t);
}

fn smootherstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn smootherstep2(edge0: vec2<f32>, edge1: vec2<f32>, x: vec2<f32>) -> vec2<f32> {
    let t = clamp((x - edge0) / (edge1 - edge0), vec2(0.0), vec2(1.0));
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn smootherstep3(edge0: vec3<f32>, edge1: vec3<f32>, x: vec3<f32>) -> vec3<f32> {
    let t = clamp((x - edge0) / (edge1 - edge0), vec3(0.0), vec3(1.0));
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn circularOut(t: f32) -> f32 {
    return sqrt((2.0 - t) * t);
}

fn random(vec2f: vec2<f32>) -> f32 {
    return fract(sin(dot(vec2f, vec2<f32>(12.9898, 78.233)) * 43758.5453));
}
const MAX_LIGHTS = 4;
const MAX_SAMPLES = 32; 

fn inverse3x3(m: mat3x3<f32>) -> mat3x3<f32> {
    let a00 = m[0][0]; let a01 = m[0][1]; let a02 = m[0][2];
    let a10 = m[1][0]; let a11 = m[1][1]; let a12 = m[1][2];
    let a20 = m[2][0]; let a21 = m[2][1]; let a22 = m[2][2];

    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    let invDet = 1.0 / det;

    let result = mat3x3<f32>(
        vec3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11)) * invDet,
        vec3(b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10)) * invDet,
        vec3(b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) * invDet
    );

    return result;
}