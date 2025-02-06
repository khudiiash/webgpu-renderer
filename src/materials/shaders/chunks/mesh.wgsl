@group(Global) @binding(Camera)
@group(Mesh) @binding(MeshInstances)

@include(Common)

@vertex() {{
    // model
    var model = mesh_instances[input.instance_index];


    // local_position
    var local_position = input.position;
    #if USE_LOCAL_POSITION {
        output.local_position = local_position;
    }

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

    // position
    output.position = transform(model, local_position, 1.0);

    // clip 
    output.clip = camera.projection * camera.view * vec4f(output.position, 1.0);

    // depth
    #if USE_DEPTH {
        output.depth = output.clip.z / output.clip.w;
    }
}}