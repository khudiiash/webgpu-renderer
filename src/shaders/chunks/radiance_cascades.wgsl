// Constants and helper functions
const TAU: f32 = 6.283185;

fn v2f16(v: vec2f) -> f32 {
  return v.y * 0.0039215689 + v.x;
}

fn srgb(c: vec3f) -> vec3f {
  return pow(c, vec3f(2.2));
}

fn linearize(c: vec3f) -> vec3f {
  return pow(c, vec3f(1.0 / 2.2));
}

fn raymarch(origin: vec2f, delta: vec2f, interval: f32) -> vec4f {
  let scale: f32 = length(uniforms.renderExtent) / 256.0;
  var rr: f32 = 0.0;
  var ii: f32 = 0.0;
  let ee: f32 = 0.0001;


  // WGSL does not allow non-constant loop bounds with float induction variables.
  // Here we use a while loop that approximates the GLSL "for" loop.
  while (ii < interval) {
    let ray: vec2f = (origin + delta * rr) * (1.0 / uniforms.in_RenderExtent);
    let sampleDF: vec4f = textureSampleLevel(distance_texture, sampler_color, ray, 0);
    let dd: f32 = v2f16(sampleDF.xy);
    rr = rr + scale * dd;

    // If weve marched past the allowed interval or left the [0,1] domain, break.
    if (rr >= interval || any(floor(ray) != vec2f(0.0))) {
      break;
    }
    // If we have hit something (distance is below threshold), return the scene radiance.
    if (dd <= ee) {
      let sampleRS: vec4f = textureSampleLevel(scene_textuer, sampler_color, ray, 0);
      return vec4f(srgb(sampleRS.rgb), 0.0);
    }
    ii = ii + 1.0;
  }
  return vec4f(0.0, 0.0, 0.0, 1.0);
}

fn merge(radiance: vec4f, index: f32, extent: vec2f, probe: vec2f) -> vec4f {
  if (radiance.a == 0.0 || uniforms.cascadeIndex >= uniforms.cascadeCount - 1.0) {
    return vec4f(radiance.rgb, 1.0 - radiance.a);
  }

  let angularN1: f32 = pow(2.0, floor(uniforms.in_CascadeIndex + 1.0));
  let extentN1: vec2f = floor(uniforms.cascadeExtent / angularN1);
  var interpN1: vec2f = vec2f(modf(index, angularN1).fract, floor(index / angularN1)) * extentN1;
  interpN1 = interpN1 + clamp((probe * 0.5) + 0.25, vec2f(0.5), extentN1 - 0.5);
  let sample_base: vec4f = textureSampleLevel(
    gm_BaseTexture,
    gm_BaseTexture_sampler,
    interpN1 * (1.0 / uniforms.cascadeExtent),
    0
  );
  return radiance + sample_base;
}

@fragment(input) -> output {
  // Compute cascade coordinates.
  let coord: vec2f = floor(in_TexelCoord * uniforms.in_CascadeExtent);
  let sqr_angular: f32 = pow(2.0, floor(uniforms.in_CascadeIndex));
  let extent: vec2f = floor(uniforms.in_CascadeExtent / sqr_angular);
  let probe: vec4f = vec4f(mod(coord, extent), floor(coord / extent));

  // Compute interval and other cascade-specific values.
  var interval: f32 = (1.0 - pow(4.0, uniforms.in_CascadeIndex)) / (1.0 - 4.0);
  interval = interval * uniforms.in_CascadeInterval;
  let linear: vec2f = vec2f(uniforms.in_CascadeLinear * pow(2.0, uniforms.in_CascadeIndex));
  let limit: f32 = uniforms.in_CascadeInterval * pow(4.0, uniforms.in_CascadeIndex);
  let origin: vec2f = (probe.xy + vec2f(0.5)) * linear;
  let angular: f32 = sqr_angular * sqr_angular * 4.0;
  let index: f32 = (probe.z + (probe.w * sqr_angular)) * 4.0;

  var fragColor: vec4f = vec4f(0.0);
  // Loop over 4 directions
  for (var i: i32 = 0; i < 4; i = i + 1) {
    let preavg: f32 = index + f32(i);
    let theta: f32 = (preavg + 0.5) * (TAU / angular);
    let delta: vec2f = vec2f(cos(theta), -sin(theta));
    let ray: vec2f = origin + (delta * interval);
    let radiance: vec4f = raymarch(ray, delta, limit);
    fragColor = fragColor + merge(radiance, preavg, extent, probe.xy) * 0.25;
  }

  if (uniforms.in_CascadeIndex == 0.0) {
    fragColor = vec4f(linearize(fragColor.rgb), 1.0);
  }

  output.color = fragColor;
  return output;
}
