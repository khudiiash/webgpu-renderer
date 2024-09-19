struct MVP {
    modelMatrix: mat4x4f,
    viewMatrix: mat4x4f, 
    projectionMatrix: mat4x4f,
}

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    let mvp: MVP = MVP {
        modelMatrix: input.modelMatrix,
        viewMatrix: input.viewMatrix,
        projectionMatrix: input.projectionMatrix,
    };

    let position = mvp.projectionMatrix * mvp.viewMatrix * mvp.modelMatrix * vec4<f32>(input.position, 1.0);
    let normal = mvp.projectionMatrix * mvp.viewMatrix * mvp.modelMatrix * vec4<f32>(input.normal, 0.0);

    return VertexOutput {
        position: position.xyz,
        normal: normal.xyz,
        uv: input.uv,
    };
}