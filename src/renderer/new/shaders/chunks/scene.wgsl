struct Fog {
    fogType: f32,
    start: f32,
    end: f32,
    density: f32,
    color: vec3f,
}

struct DirectionalLight {
    direction: vec3f,
    color: vec3f,
    intensity: f32,
}

struct Scene {
    fog: Fog,
    ambientLight: vec3f,
    directionalLight: DirectionalLight,
    time: f32,
}

@group(0) @binding(0) var<uniform> scene: Scene;
