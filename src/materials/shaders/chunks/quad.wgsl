@vertex() {{
    let pos = array(
        // 1st triangle
        vec2f(-1.0, -1.0), // bottom left
        vec2f( 1.0, -1.0), // bottom right
        vec2f(-1.0,  1.0), // top left

        vec2f(-1.0,  1.0), // top left
        vec2f( 1.0, -1.0), // bottom right
        vec2f( 1.0,  1.0), // top right
    );
    let xy = pos[input.vertex_index];
    output.clip = vec4f(xy, 0.0, 1.0);
    let uv_temp = xy * 0.5 + 0.5;
    output.uv = vec2f(uv_temp.x, 1.0 - uv_temp.y);
}}