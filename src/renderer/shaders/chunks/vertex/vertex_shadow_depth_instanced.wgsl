@group(0) @binding(0) var<storage, read> instances: array<mat4x4f>;
@group(0) @binding(1) var<uniform> lightProjectionView: mat4x4f;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) vUv: vec2f,
}

@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
) -> VertexOutput {
    var output = VertexOutput();
    output.position = lightProjectionView * instances[instanceIndex] * vec4f(position, 1.0);
    output.vUv = vec2f(1, 1);
    return output;
}