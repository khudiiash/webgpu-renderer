@group(Global) @binding(Camera)
@group(Mesh) @binding(MeshInstances)

@include(Common)

@vertex() {{
    // mesh_start
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

    // normal
    #if USE_NORMAL {
        output.normal = normalize(transform(model, input.normal, 0.0));
    }

    // tangent
    #if USE_TANGENT {
        output.tangent = normalize(transform(model, input.tangent.xyz, 0.0));
        output.bitangent = normalize(transform(model, cross(input.tangent.xyz, input.normal) * input.tangent.w, 0.0));
    }

    #if USE_INSTANCE_INDEX {
        output.instance_index = input.instance_index;
    }

    output.local_position = local_position;

    // position
    var position = transform(model, local_position, 1.0);

    // clip
    output.clip = camera.view_projection * vec4f(position, 1.0);

    // depth
    #if USE_DEPTH {
        output.depth = length(camera.position - position) / (camera.far - camera.near);
    }

    output.position = position;
    // mesh_end
}}
