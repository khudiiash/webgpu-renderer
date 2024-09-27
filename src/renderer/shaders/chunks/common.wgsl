const PI : f32 = 3.14159265359;
const PI2 : f32 = 6.28318530718;
const PI_HALF : f32 = 1.57079632679;
const EPSILON : f32 = 0.0001;

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

fn snoise(v: vec2<f32>) -> f32 {
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