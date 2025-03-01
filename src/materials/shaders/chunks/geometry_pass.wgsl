@include(Common)
@include(Noise)

fn parallax_occlusion_mapping(startUV: vec2f, viewDirTS: vec3f, layers: i32, world_pos: vec3f) -> vec3f {
    // in case of wind needed
    // let n = perlinNoise(startUV * 10.1 + scene.time) * 0.005;
    // let n2 = perlinNoise(startUV * 3.1 + scene.time) * 0.005;
    //let uv = startUV + vec2f(sin(n), cos(n)) + vec2f(n2);
    let uv = startUV;
    let ddx = dpdx(uv);
    let ddy = dpdy(uv);
    var depthScale = material.height_scale;
    var depthLayers = layers;

    let uvDelta = viewDirTS.xy * depthScale / (-viewDirTS.z * f32(depthLayers));
    let depthDelta = 1.0 / f32(depthLayers);
    let posDelta = vec3f(uvDelta, depthDelta);

    var currentPos = vec3f(uv, 1.0);
    var prevPos = currentPos;

    // First pass: find approximate intersection point
    for (var i = 0; i < depthLayers; i++) {
        let heightSample = textureSampleGrad(height_map, sampler_color, currentPos.xy, ddx, ddy).r;
        if (currentPos.z <= heightSample) {
            break;
        }
        prevPos = currentPos;
        currentPos -= posDelta;
    }

    // Second pass: binary search for precise intersection
    let numBinarySteps = 5;
    for (var i = 0; i < numBinarySteps; i++) {
        let midPos = (currentPos + prevPos) * 0.5;
        let heightSample = textureSampleGrad(height_map, sampler_color, midPos.xy, ddx, ddy).r;

        if (midPos.z <= heightSample) {
            currentPos = midPos;
        } else {
            prevPos = midPos;
        }
    }

    return currentPos;
}

@fragment() {{
    var albedo = material.diffuse.rgb;
    var normal = input.normal;
    var uv = input.uv;
    var position = input.position;
    var roughness = material.roughness;
    var metalness = material.metalness;
    var ao = 1.0;
    var emissive = select(0.0, material.emissive.a, material.useEmissive == 1);
    albedo *= (1.0 + emissive);


    let dpdx_pos = dpdx(position);
    let dpdy_pos = dpdy(position);
    let dpdx_uv  = dpdx(uv);
    let dpdy_uv  = dpdy(uv);
    var tangent: vec3f = normalize(dpdy_uv.y * dpdx_pos - dpdx_uv.y * dpdy_pos);
    var bitangent: vec3f = normalize(-dpdy_uv.x * dpdx_pos + dpdx_uv.x * dpdy_pos);
    tangent = normalize(tangent - input.normal * dot(input.normal, tangent));
    let TBN = mat3x3f(tangent, bitangent, input.normal);

    uv = scaleUV(uv, material.uv_scale);
    var parallaxDepth = 1.0;

    // maps
    if (textureDimensions(height_map).x > 1) {
        // height_map
        let viewDir = -normalize(camera.position - position);
        var viewDirTS = normalize(TBN * viewDir);
        let minLayers: u32 = 1;
        let maxLayers: u32 = 256;
        let viewDot = abs(dot(normal, viewDir));
        let layers = f32(minLayers) + f32(maxLayers - minLayers) * (1.0 - viewDot);
        let parallax = parallax_occlusion_mapping(uv, viewDirTS, i32(layers), position);
        uv = parallax.xy;
        parallaxDepth = parallax.z;
    }

    if (textureDimensions(diffuse_map).x > 1) {
        // diffuse_map
        let diffuseSample = textureSample(diffuse_map, sampler_color, uv);
        albedo *= diffuseSample.rgb;
        if (diffuseSample.a < 0.3) {
            discard;
        }
    }

    if (textureDimensions(normal_map).x > 1) {
        // normal_map
        let normalMapSample: vec3f = textureSample(normal_map, sampler_color, uv).rgb;
        let mappedNormal = normalize(normalMapSample * 2.0 - vec3f(1.0));
        normal = normalize(TBN * mappedNormal);
    }

    if (textureDimensions(roughness_map).x > 1) {
        roughness = textureSample(roughness_map, sampler_color, uv).g;
    }

    if (textureDimensions(metalness_map).x > 1) {
        metalness = textureSample(metalness_map, sampler_color, uv).b;
    }

    if (textureDimensions(ao_map).x > 1) {
        ao = textureSample(ao_map, sampler_color, uv).r;
    }

    let useLight = material.useLight;
    let useFog = material.useFog;

    output.position = vec4f(position, input.depth);
    output.albedo = vec4f(albedo, f32(material.useLight));
    output.normal = vec4f(normal, f32(material.useFog));
    output.pbr = vec4f(roughness, metalness, ao, emissive);
}}
