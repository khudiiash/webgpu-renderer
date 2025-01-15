struct StandardMaterial {
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec4f,
    emissive: vec4f,
    sheen: vec4f,
    opacity: f32,
    metalness: f32,
    roughness: f32,
    emissive_factor: f32,
    specular_factor: f32,
    alpha_test: f32,
    transmission: f32,
}

@group(2) @binding(0) var<uniform> material: StandardMaterial;