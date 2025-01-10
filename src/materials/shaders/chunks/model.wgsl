@group(1) @binding(0) var<storage> model: array<mat4x4f>;

fn getScreenPosition(position: vec3f, model: mat4x4f, view: mat4x4f, projection: mat4x4f) -> vec4f {
    return view * projection * model * vec4f(position, 1.0);
}

fn getWorldPosition(position: vec3f, model: mat4x4f) -> vec3f {
    return (model * vec4f(position, 1.0)).xyz;
}

fn getWorldNormal(normal: vec3f, model: mat4x4f) -> vec3f {
    return normalize((model * vec4f(normal, 0.0)).xyz);
}

@vertex {{
    screenPosition = getScreenPosition(input.position, model[input.instance_index], camera.view, camera.projection);
    worldPosition = getWorldPosition(input.position, model[input.instance_index]);
    worldNormal = getWorldNormal(input.normal, model[input.instance_index]);
    uv = input.uv;
    normal = input.normal;
}}