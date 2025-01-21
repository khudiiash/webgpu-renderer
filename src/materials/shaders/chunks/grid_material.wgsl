#struct(grid_material)

@group(2) @binding(0) var<uniform> material: GridMaterial;

fn fmod(x: vec2f, y: f32) -> vec2f {
    return x - y * floor(x / y);
}

fn fmod2(x: vec2f, y: vec2f) -> vec2f {
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
    
    var grid_pos: vec2f;
    
    let mode = material.grid_uv_mode;
    if (mode == 1.0) {
        grid_pos = world_pos.yz;
    } else if (mode == 2.0) {
        grid_pos = world_pos.xy;
    } else if (mode == 3.0) {
        grid_pos = world_pos.xz;
    } else { 
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

    let cell_coords = grid_pos / material.grid_cell_size;
    let grid_x = abs(fract(cell_coords.x) - 0.5);
    let grid_y = abs(fract(cell_coords.y) - 0.5);
    let line_x = step(grid_x, material.grid_line_width);
    let line_y = step(grid_y, material.grid_line_width);
    let grid_factor = line_x + line_y;
    color = mix(material.grid_base_color, material.grid_line_color, min(grid_factor, 1.0));
    color.a *= material.opacity;
}}