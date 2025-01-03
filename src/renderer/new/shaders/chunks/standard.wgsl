struct StandardMaterial {
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec4f,
    emissive: vec4f,
    sheen: vec4f,
    opacity: f32,
    metalness: f32,
    roughness: f32,
    emissiveFactor: f32,
    specularFactor: f32,
    alphaTest: f32,
}

@group(2) @binding(0) var<uniform> material: StandardMaterial;

@fragment {{
    color = material.diffuse;
}}