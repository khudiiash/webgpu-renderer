var normal = input.vNormalW;
if (textureDimensions(normalMap).x > 1) {
    let dp1 = dpdx(input.vPositionW);
    let dp2 = dpdy(input.vPositionW);
    let duv1 = dpdx(input.vUv);
    let duv2 = dpdy(input.vUv);

    // Calculate tangent and bitangent
    let r = 1.0 / (duv1.x * duv2.y - duv1.y * duv2.x);
    let tangent = (dp1 * duv2.y - dp2 * duv1.y) * r;
    let bitangent = (dp2 * duv1.x - dp1 * duv2.x) * r;

    // Rest is same as before
    let normal_map_value = textureSample(normalMap, sampler2D, input.vUv).xyz;
    let normal_from_map = normal_map_value * 2.0 - 1.0;

    let tbn = mat3x3<f32>(
        normalize(tangent),
        normalize(bitangent),
        normalize(normal)
    );

    normal = normalize(tbn * normal_from_map);
}