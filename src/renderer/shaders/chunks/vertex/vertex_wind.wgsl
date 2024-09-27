if (material.useWind == 1) {
    let noise_scale = 0.01;
    let noise_input = output.vWorldPosition.xz * noise_scale + time * scene.wind.speed;
    let distFromOrigin = length(input.position.xz);
    let dir = input.position.xz;
    let distFactorX = 1.0 - clamp(distFromOrigin / 10.0, 0.0, 1.0) * dir.x;
    let distFactorZ = 1.0 - clamp(distFromOrigin / 10.0, 0.0, 1.0) * dir.y;
    
    let noise_value = snoise(noise_input) * 2.0 - 1.0;
    let height_factor = clamp(input.position.y * 0.1, 0.0, 1.0);

    let wind_factor_x = sin(time * scene.wind.speed + input.position.x * 0.1);
    let wind_factor_z = cos(time * scene.wind.speed + input.position.z * 0.1);
    let wind_factor = wind_factor_x + wind_factor_z;

    let wind_offset = vec3f(
        wind_factor_x * scene.wind.strength * height_factor * noise_value * distFactorX,
        abs(wind_factor) * scene.wind.strength * 0.2 * height_factor,
        wind_factor_z * scene.wind.strength * height_factor * noise_value * distFactorZ
    );

    let animated_position = input.position + wind_offset;

    let worldPosition = (modelMatrix * vec4f(input.position + wind_offset, 1.0)).xyz;

    output.position = camera.projection * camera.view * vec4f(worldPosition, 1.0);
}