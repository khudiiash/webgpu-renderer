@group(0) @binding(0) var<uniform> model: mat4x4f;
@group(0) @binding(1) var<uniform> lightProjectionView: mat4x4f;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) vUv: vec2f,
}

@vertex
fn main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
) -> VertexOutput {
    var output = VertexOutput();
    output.position = lightProjectionView * model * vec4f(position, 1.0);
    output.vUv = uv;
    return output;
}