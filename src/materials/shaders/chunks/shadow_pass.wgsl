@include(Common)

@vertex() {{
    // model
    var model = mesh_instances[input.instance_index];

    // billboard
    #if USE_BILLBOARD {
        model = getBillboardModelMatrix(model, camera.view);
    }

    // uv
    #if USE_UV {
        output.uv = input.uv;
    }

    // clip
    output.clip = camera.view_projection * model * vec4f(input.position, 1.0);
}}

@fragment(first) {{
    if (textureDimensions(diffuse_map).x > 1) {
        let diffuseSample = textureSample(diffuse_map, sampler_color, input.uv);
        if (diffuseSample.a < 0.75) {
            discard;
        }
    }
}}
