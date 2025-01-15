struct GridMaterial {
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec4f,
    emissive: vec4f,
    sheen: vec4f,

    grid_base_color: vec4f,
    grid_line_color: vec4f,
    grid_offset: f32,
    grid_cell_size: f32,
    grid_line_width: f32,
    grid_uv_mode: f32,

    opacity: f32,
    metalness: f32,
    roughness: f32,
    emissive_factor: f32,
    specular_factor: f32,
    alpha_test: f32,
    transmission: f32,

}

@group(2) @binding(0) var<uniform> material: GridMaterial;

fn fmod(x: vec2<f32>, y: f32) -> vec2<f32> {
    return x - y * floor(x / y);
}

fn fmod2(x: vec2<f32>, y: vec2<f32>) -> vec2<f32> {
    return x - y * floor(x / y);
}

fn getScale(model: mat4x4f) -> vec3f {
    var scale = vec3f(0.0, 0.0, 0.0);
    scale.x = length(model[0].xyz);
    scale.y = length(model[1].xyz);
    scale.z = length(model[2].xyz);
    return scale;
}


@vertex() {{
    output.vScale = getScale(model[input.instance_index]);
}}

@fragment() {{
    let world_pos = input.vPositionW;
    let normal = normalize(input.vNormal);
    
    // Project position based on uvMode instead of normal
    var grid_pos: vec2<f32>;
    
    let mode = material.grid_uv_mode;
    if (mode == 1.0) { // WorldX
        grid_pos = world_pos.yz;
    } else if (mode == 2.0) { // WorldZ
        grid_pos = world_pos.xy;
    } else if (mode == 3.0) { // WorldY
        grid_pos = world_pos.xz;
    } else { 
        // MeshUV - fallback to normal-based
        let abs_normal = abs(normal);
        if (abs_normal.x > abs_normal.y && abs_normal.x > abs_normal.z) {
            grid_pos = world_pos.yz;
        } else if (abs_normal.y > abs_normal.x && abs_normal.y > abs_normal.z) {
            grid_pos = world_pos.xz;
        } else {
            grid_pos = world_pos.xy;
        }
    }

    grid_pos += material.grid_offset;

    // Calculate grid coordinates
    let cell_coords = grid_pos / material.grid_cell_size;
    
    // Calculate distances to nearest grid lines
    let grid_x = abs(fract(cell_coords.x) - 0.5);
    let grid_y = abs(fract(cell_coords.y) - 0.5);
    
    // Create sharp grid lines with proper thickness
    let line_x = step(grid_x, material.grid_line_width);
    let line_y = step(grid_y, material.grid_line_width);
    
    // Combine lines to form grid
    let grid_factor = line_x + line_y;
    
    // Mix colors based on grid factor and apply opacity
    color = mix(material.grid_base_color, material.grid_line_color, min(grid_factor, 1.0));
    color.a *= material.opacity;
}}