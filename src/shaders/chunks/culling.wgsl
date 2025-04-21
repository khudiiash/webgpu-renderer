struct DrawCommand {
  vertexCount: u32,
  instanceCount: atomic<u32>,
  firstVertex: u32,
  firstInstance: u32,
}

fn transformBoundingSphere(transform: mat4x4f, localSphere: BoundingSphere) -> vec4f {
  let worldCenter: vec3f = (transform * vec4f(localSphere.center, 1.0)).xyz;
  let scaleX: f32 = length(transform[0].xyz);
  let scaleY: f32 = length(transform[1].xyz);
  let scaleZ: f32 = length(transform[2].xyz);
  let maxScale: f32 = max(max(scaleX, scaleY), scaleZ);
  let worldRadius: f32 = localSphere.radius * maxScale;
  return vec4f(worldCenter, worldRadius);
}

fn intersectsSphere(center: vec3f, radius: f32) -> bool {
    let negRadius = -radius;

    for (var i = 0; i < 6; i++) {
        let plane: vec4<f32> = camera.frustum[i];
        let distance: f32 = dot(plane.xyz, center) + plane.w;
        if (distance < negRadius) {
            return false;
        }
    }

    return true;
}



@compute() {{
    let index = input.global_invocation_id.x;
    if (index >= arrayLength(&instances)) {
        return;
    }

    let instance = instances[index];

    let worldSphere: vec4<f32> = transformBoundingSphere(instance, bounding_sphere);
    let center: vec3<f32> = worldSphere.xyz;
    let radius: f32 = worldSphere.w;

    var sphereInFrustum: bool = intersectsSphere(center, radius);
    let distToCamera = distance(camera.position, center);
    if (distToCamera > 80.0 + radius) {
        sphereInFrustum = false;
    }

    if (sphereInFrustum) {
        let visibleIndex = atomicAdd(&draw_command_buffer[0].instanceCount, 1u);
        visible_instances_buffer[visibleIndex] = instance;
        atomicStore(&visibility_buffer[index], 1u);
    } else {
        atomicStore(&visibility_buffer[index], 0u);
    }
}}
