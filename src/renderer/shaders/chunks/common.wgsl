const PI : f32 = 3.14159265359;
const PI2 : f32 = 6.28318530718;
const PI_HALF : f32 = 1.57079632679;
const EPSILON : f32 = 0.0001;

fn noise1D(x: f32) -> f32 {
    return fract(sin(x) * 43758.5453);
}

fn noise2D(x: vec2f) -> f32 {
    return fract(sin(dot(x, vec2(12.9898, 78.233))) * 43758.5453);
}
