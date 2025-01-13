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
fn hash(p: vec2i) -> i32 {
    let h = p.x * 374761393 + p.y * 668265263; // Prime numbers
    return ((h ^ (h >> 13)) * 1274126177) & 255;
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

fn perlinNoise(p: vec2f) -> f32 {
    let pi = vec2i(floor(p));

    let xf = fract(p.x);
    let yf = fract(p.y);

    let u = fade(xf);
    let v = fade(yf);

    let n00 = grad(hash(pi + vec2i(0, 0)), xf, yf);
    let n10 = grad(hash(pi + vec2i(1, 0)), xf - 1.0, yf);
    let n01 = grad(hash(pi + vec2i(0, 1)), xf, yf - 1.0);
    let n11 = grad(hash(pi + vec2i(1, 1)), xf - 1.0, yf - 1.0);

    let nx0 = lerp(n00, n10, u);
    let nx1 = lerp(n01, n11, u);
    let nxy = lerp(nx0, nx1, v);

    return 0.5 * (nxy + 1.0);
}