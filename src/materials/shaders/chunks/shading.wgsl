fn count_bits(val: i32) -> i32 {
    // Counting bits using parallel bits counting approach
    var v = val;
    v = (v & 0x55555555) + ((v >> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    v = (v & 0x0F0F0F0F) + ((v >> 4) & 0x0F0F0F0F);
    v = (v & 0x00FF00FF) + ((v >> 8) & 0x00FF00FF);
    v = (v & 0x0000FFFF) + ((v >> 16) & 0x0000FFFF);
    return v;
}

fn rand_2d(uv: vec2f) -> f32 {
    return fract(sin(dot(uv, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn mod_f32(x: f32, y: f32) -> f32 {
    return x - y * floor(x/y);
}

// Screen Space Horizon GI calculation
fn calculate_sshgi(
    frag_coord: vec2f,
    position: vec3f,
    normal: vec3f,
    frame: f32,
    screen_size: vec2f,
) -> vec3f {
    let PI = 3.14159265359;
    let STEPS = 16.0;
    let NUM_DIRECTIONS = 4.0;

    // Initialize accumulator for indirect lighting
    var indirect = vec3f(0.0);

    // Convert world-space normal to view space
    let view_normal = normalize((camera.view * vec4f(normal, 0)).xyz);

    // Generate base random angle for the current frame
    let pixel_index = fract(frag_coord / vec2f(4.0));
    let rand_offset = rand_2d(frag_coord * 10.0);
    // Using custom modulo function for angle calculation
    let frame_offset = mod_f32(floor(pixel_index.x) + floor(pixel_index.y) * 4.0 +
                                  frame * 5.0, 16.0);
    var rand_phi = (frame_offset + rand_offset) * 2.0 * PI / 16.0;
    // Sample in multiple directions around the hemisphere
    for (var dir = 0.0; dir < NUM_DIRECTIONS; dir += 1.0) {
        rand_phi += PI * 0.5;  // Rotate 90 degrees for each direction
        let ss_dir = vec2f(cos(rand_phi), sin(rand_phi));

        var step_dist = 1.0;
        let step_coeff = 0.15 + 0.15 * rand_2d(frag_coord * (1.4 + frame * 3.26346));
        var bit_mask = 0;

        // Trace along the direction
        for (var step = 1.0; step < STEPS; step += 1.0) {
            let current_step = max(1.0, step_dist * step_coeff);
            let sample_uv = frag_coord + ss_dir * step_dist;
            step_dist += current_step;

            // Check if we're still within screen bounds
            if (any(sample_uv < vec2f(1.0)) || any(sample_uv >= screen_size)) {
                break;
            }

            let sample_pos = textureSampleLevel(position_texture, sampler_color, sample_uv, 0).xyz;
            let sample_normal = textureSampleLevel(normal_texture, sampler_color, sample_uv, 0).xyz;
            var sample_color = textureSampleLevel(albedo_texture, sampler_color, sample_uv, 0);
            if (sample_color.a == 0.0) {
              break;
            }



            // Calculate angles for horizon mapping
            let delta = normalize(sample_pos - position);
            let nor_dot = dot(view_normal, delta) - 0.001;
            let tan_dist = length(delta - nor_dot * view_normal);

            let angle1 = atan2(nor_dot, tan_dist);
            let angle2 = atan2(nor_dot - 0.03 * max(1.0, step_dist * 0.07), tan_dist);

            // Convert angles to bit positions (32-bit resolution)
            let angle1_bit = max(0.0, ceil(angle1 / (PI * 0.5) * 32.0));
            let angle2_bit = max(0.0, floor(angle2 / (PI * 0.5) * 32.0));

            // Create and apply the sample bitmask
            let sample_bits = (i32(pow(2.0, angle1_bit - angle2_bit)) - 1) << u32(angle2_bit);
            let contribution = f32(count_bits(sample_bits & (~bit_mask)));

            // Calculate the contribution weight
            let angle_weight = (pow(cos(angle2_bit * PI / 32.0), 2.0) -
                              pow(cos(angle1_bit * PI / 32.0), 2.0));
            let normal_weight = sqrt(max(0.0, dot(sample_normal, -delta)));

            indirect += contribution * sample_color.rgb * angle_weight * normal_weight /
                      max(1.0, angle1_bit - angle2_bit);

            bit_mask |= sample_bits;
        }
    }

    return indirect / NUM_DIRECTIONS;
}

// Main lighting calculation integration
fn calc_indirect(uv: vec2f, world_pos: vec3f, normal: vec3f) -> vec3f {
    let frame = 1024.0;
    let res = vec2f(textureDimensions(albedo_texture));
    return calculate_sshgi(uv * res, world_pos, normal, frame, res);
}

// Main physically based lighting function
  fn calc_direct(albedo: vec3f, position: vec3f, normal: vec3f, pbr: vec4f) -> vec3f {
      // Extract PBR parameters
      let roughness = clamp(pbr.r, 0.001, 1.0);
      let metalness = clamp(pbr.g, 0.0, 1.0);
      let ao        = clamp(pbr.b, 0.0, 1.0);
      let emission  = pbr.a; // Emission intensity (could be multiplied with texture emission color)

      // Calculate base reflectance at normal incidence (F0)
      var F0 = vec3f(0.04); // Common value for dielectrics
      F0 = mix(F0, albedo, metalness); // For metals, F0 is the albedo

      // Ambient light contribution (modulated by AO)
      let ambient = mix(scene.groundColor.rgb, scene.skyColor.rgb, normal.y * 0.5 + 0.5) * scene.ambientColor.a * ao;

      // Initialize outgoing radiance
      var Lo = vec3f(0.0);

      // Pre-compute view direction
      let viewDir = normalize(camera.position - position);
      var visibility = 1.0;

      // --- Directional lights ---
      for (var i = 0u; i < scene.directionalLightsNum; i += 1u) {
          let light = scene.directionalLights[i];
          let posFromLight = light.view_projection * vec4f(position, 1.0);
          let shadowPos = vec3f(
              posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
              posFromLight.z
          );
          let shadow = shadow_pcf(shadowPos, shadow_texture, sampler_depth);
          visibility = min(visibility, shadow);

          // For directional lights, light.direction points from light to scene, so reverse it
          let L = normalize(-light.direction);
          let H = normalize(viewDir + L);
          let NdotL = max(dot(normal, L), 0.0);
          let NdotV = max(dot(normal, viewDir), 0.0);
          if (NdotL > 0.0) {
              // Cook-Torrance BRDF calculations
              let D = DistributionGGX(normal, H, roughness);
              let G = GeometrySmith(normal, viewDir, L, roughness);
              let F = FresnelSchlick(max(dot(H, viewDir), 0.0), F0);
              // Specular term using Cook-Torrance denominator; add a small constant to avoid divide-by-zero.
              let specular = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);

              // kS is the specular reflectance, kD is the diffuse component (energy conservation)
              let kS = F;
              var kD = vec3f(1.0) - kS;
              // Metals have almost no diffuse contribution.
              kD *= (1.0 - metalness);

              // Lambertian diffuse term.
              let diffuse = (albedo / PI);

              // Radiance from the directional light.
              let lightRadiance = light.color.rgb * light.intensity;

              // Accumulate contribution.
              Lo += (kD * diffuse + specular) * lightRadiance * NdotL * visibility;
          }
      }

      // --- Point lights ---
      for (var i = 0u; i < scene.pointLightsNum; i += 1u) {
          let light = scene.pointLights[i];
          let L_vector = light.position - position;
          let distance = length(L_vector);
          let L = normalize(L_vector);
          let H = normalize(viewDir + L);
          let NdotL = max(dot(normal, L), 0.0);
          let NdotV = max(dot(normal, viewDir), 0.0);
          if (NdotL > 0.0) {
              // Attenuation (inverse-square law)
              let attenuation = calculate_attenuation(distance) * light.intensity;
              let lightRadiance = light.color.rgb * attenuation;

              let D = DistributionGGX(normal, H, roughness);
              let G = GeometrySmith(normal, viewDir, L, roughness);
              let F = FresnelSchlick(max(dot(H, viewDir), 0.0), F0);
              let specular = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);

              let kS = F;
              var kD = vec3f(1.0) - kS;
              kD *= (1.0 - metalness);
              let diffuse = (albedo / PI);

              Lo += (kD * diffuse + specular) * lightRadiance * NdotL;
          }
      }
      var finalColor = ambient + Lo + emission * albedo;
      finalColor = SRGB(clamp(finalColor, vec3f(0.0), vec3f(1.0)));
      finalColor = pow(finalColor, vec3f(1.0 / 2.2));
      finalColor = ACES_FILM(finalColor);

      return finalColor;
  }
@fragment() {{
  // samples
  let positionSample = textureSample(position_texture, sampler_color, input.uv);
  let normalSample = textureSample(normal_texture, sampler_color, input.uv);
  let albedoSample = textureSample(albedo_texture, sampler_color, input.uv);
  let pbrSample = textureSample(pbr_texture, sampler_color, input.uv);

  // defines
  let world_pos = positionSample.rgb;
  let depth = positionSample.a;
  let normal = normalSample.rgb;
  let albedo = albedoSample.rgb;
  let useLight = albedoSample.a;
  let useFog = normalSample.a;


  var finalColor = vec3f(albedo);
  // direct
  var direct = calc_direct(albedo, world_pos, normal, pbrSample);
  // indirect
  var indirect = vec3f(0);

  if (useLight == 1) {
      finalColor = direct + indirect;
  }

  // fog
  if (useFog == 1) {
    let fogDistance = length(world_pos - camera.position);
    let fogColor = scene.fog.color.rgb;
    let fogStart = scene.fog.start;
    let fogEnd = scene.fog.end;
    let fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
    finalColor = mix(finalColor, fogColor, fogFactor);
  }
  if (length(albedo) == 0.0) {
    finalColor = scene.backgroundColor.rgb;
  }

  output.color = vec4f(finalColor, 1.0);
}}
