@group(0) @binding(2) var diffuseMap: texture_2d<f32>;
@group(0) @binding(3) var sampler2D: sampler;

struct FragmentInput {
    @builtin(position) position: vec4f,
    @location(0) vUv: vec2f,
}

@fragment
fn main(input: FragmentInput) -> @location(0) f32 {
    return input.position.z / input.position.w;
}