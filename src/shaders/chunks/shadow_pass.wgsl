@include(Common)

@vertex() {{
    // model
    var model = mesh_instances[input.instance_index];

    // local_position
    var local_position = input.position;

    // billboard
    #if USE_BILLBOARD {
        model = getBillboardModelMatrix(model, camera.view);
    }

    // uv
    #if USE_UV {
        output.uv = input.uv;
    }

    output.local_position = local_position;

    // position
    var position = transform(model, local_position, 1.0);

    // clip
    output.clip = light_camera.view_projection * vec4f(position, 1.0);
}}

@fragment(first) {{
    var color = material.diffuse.rgb;
    if (textureDimensions(diffuse_map).x > 1) {
        let diffuseSample = textureSample(diffuse_map, sampler_color, input.uv);
        if (diffuseSample.a < material.alpha_cutoff) {
            discard;
        }
    }

    output.color = vec4f(color * (1.0 - material.opacity), material.opacity);
}}
