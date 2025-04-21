// Fade function
fn fade(t: f32) -> f32 {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Linear interpolation
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    return a + t * (b - a);
}

// Gradient directions
const gradients: array<vec2f, 8> = array<vec2f, 8>(
    vec2f(1.0, 1.0), vec2f(-1.0, 1.0),
    vec2f(1.0, -1.0), vec2f(-1.0, -1.0),
    vec2f(1.0, 0.0), vec2f(-1.0, 0.0),
    vec2f(0.0, 1.0), vec2f(0.0, -1.0)
);


// Hash function
fn hash21(p: vec2i) -> i32 {
    let h = p.x * 374761393 + p.y * 668265263; // Prime numbers
    return ((h ^ (h >> 13)) * 1274126177) & 255;
}

fn hash21f(p: vec2f) -> f32 {
    var p3  = fract(vec3f(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

fn hash11(n: u32) -> f32 {
    var n_mut = (n << 13u) ^ n;
    n_mut = n_mut * (n_mut * n_mut * 15731u + 789221u) + 1376312589u;
    return f32(n_mut & 0x7fffffffu) / f32(0x7fffffffu);
}

// This is a hashing function that takes in an unsigned integer seed and shuffles it around to make it seem random
// The output is in the range 0 to 1, so you do not have to worry about that and can easily convert it to any other
// range you desire by multiplying the output with any number.
fn hash(n: u32) -> f32 {
    // integer hash copied from Hugo Elias
    var n_mut: u32 = (n << 13u) ^ n;
    // Break down the calculation to avoid overflow
    n_mut = n_mut * (n_mut * n_mut * 15731u + 0x789221u);
    // Use a value within u32 range
    n_mut = n_mut + 0x13763121u;
    return f32(n_mut & 0x7fffffffu) / f32(0x7fffffffu);
}

// Gradient function
fn grad(hash: i32, x: f32, y: f32) -> f32 {
    let h = hash & 7; // Convert low 3 bits of hash code

    // Use 'select' to replace 'if' expressions
    let u = select(y, x, h < 4); // If h < 4, u = x; else u = y
    let v = select(x, y, h < 4); // If h < 4, v = y; else v = x

    // Compute the terms using 'select'
    let term1 = select(-u, u, (h & 1) == 0);
    let term2 = select(-2.0 * v, 2.0 * v, (h & 2) == 0);

    return term1 + term2;
}

fn rand(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn perlinNoise(p: vec2f) -> f32 {
    let pi = vec2i(floor(p));

    let xf = fract(p.x);
    let yf = fract(p.y);

    let u = fade(xf);
    let v = fade(yf);

    let n00 = grad(hash21(pi + vec2i(0, 0)), xf, yf);
    let n10 = grad(hash21(pi + vec2i(1, 0)), xf - 1.0, yf);
    let n01 = grad(hash21(pi + vec2i(0, 1)), xf, yf - 1.0);
    let n11 = grad(hash21(pi + vec2i(1, 1)), xf - 1.0, yf - 1.0);

    let nx0 = lerp(n00, n10, u);
    let nx1 = lerp(n01, n11, u);
    let nxy = lerp(nx0, nx1, v);

    return 0.5 * (nxy + 1.0);
}
