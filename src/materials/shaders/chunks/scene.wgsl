struct Fog {
    color: vec4f,
    fogType: f32,
    start: f32,
    end: f32,
    density: f32,
}

struct DirectionalLight {
    color: vec4f,
    direction: vec3f,
    intensity: f32
}

struct PointLight {
    color: vec4f,
    position: vec3f,
    intensity: f32,
    range: f32
}

struct Scene {
    fog: Fog,
    ambientColor: vec4f,
    backgroundColor: vec4f,
    time: f32,
    frame: f32,
    directionalLightsNum: f32,
    pointLightsNum: f32,
    directionalLights: array<DirectionalLight, 8>,
    pointLights: array<PointLight, 32>,
}

@group(0) @binding(0) var<uniform> scene: Scene;
