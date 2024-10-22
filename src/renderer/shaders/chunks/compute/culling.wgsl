struct Camera {
  viewProjection: mat4x4f,
  frustumPlanes: array<vec4f, 6>,
  position: vec3f,
}

struct BoundingSphere {
  center: vec3f,
  radius: f32,
}

struct Instance {
  modelMatrix: mat4x4f,
}

struct DrawCommand {
  vertexCount: u32,
  instanceCount: atomic<u32>,
  firstVertex: u32,
  firstInstance: u32,
}

struct VisibleInstance {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> instances: array<Instance>;
@group(0) @binding(2) var<storage, read> boundingSpheres: array<BoundingSphere>;
@group(0) @binding(3) var<storage, read_write> visibilityBuffer: array<atomic<u32>>;
@group(0) @binding(4) var depthTexture: texture_depth_2d;
@group(0) @binding(5) var<storage, read_write> drawCommands: array<DrawCommand>;
@group(0) @binding(6) var<storage, read_write> visibleInstances: array<mat4x4f>;

fn checkFrustum(worldPos: vec3f, radius: f32, frustumPlanes: array<vec4f, 6>) -> bool {
  for (var i = 0u; i < 6u; i++) {
    let plane = frustumPlanes[i];
    let distance = dot(vec4f(worldPos, 1.0), plane);
    if (distance < -radius) {
      return false;
    }
  }
  return true;
}

fn checkOcclusion(worldPos: vec3f, radius: f32, viewProj: mat4x4f) -> bool {
  let projected = viewProj * vec4f(worldPos, 1.0);
  if (projected.w <= 0.0) {
    return false;
  }
  
  let ndc = projected.xyz / projected.w;
  
  // Check if sphere is behind near plane or beyond far plane
  if (ndc.z >= 1.0 || ndc.z <= -1.0) {
    return false;
  }
  
  // Check if sphere is outside screen bounds (with radius)
  let radiusInNDC = (radius * 2.0) / projected.w;
  if (abs(ndc.x) > 1.0 + radiusInNDC || abs(ndc.y) > 1.0 + radiusInNDC) {
    return false;
  }
  
  // Convert to UV space
  let uv = ndc.xy * vec2f(0.5, 0.5) + vec2f(0.5, 0.5);
  let uvSize = vec2f(textureDimensions(depthTexture));
  let pixelCoord = vec2u(uv * uvSize);
  
  // Sample depth with some offset points around center for more robust testing
  let depth = textureLoad(depthTexture, pixelCoord, 0);
  
  // Compare with some bias to avoid z-fighting
  return (ndc.z + radius / projected.w) > depth;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let index = global_id.x;
    if (index >= arrayLength(&instances)) {
        return;
    }

    let instance = instances[index];
    let sphere = boundingSpheres[index];
    let worldCenter = (instance.modelMatrix * vec4f(sphere.center, 1.0)).xyz;
    
    var isVisible = true;
    
    if (!checkFrustum(worldCenter, sphere.radius, camera.frustumPlanes)) {
        isVisible = false;
    }
    
    if (isVisible && !checkOcclusion(worldCenter, sphere.radius, camera.viewProjection)) {
        isVisible = false;
    }

    // If visible, append to visible instances array and increment count
    if (isVisible) {
        let visibleIndex = atomicAdd(&drawCommands[0].instanceCount, 1u);
        visibleInstances[visibleIndex] = instance.modelMatrix;
        atomicStore(&visibilityBuffer[index], 1u);
    } else {
        atomicStore(&visibilityBuffer[index], 0u);
    }
}