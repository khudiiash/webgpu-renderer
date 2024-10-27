fn getDepthOffset(worldPos: vec3f) -> f32 {
    let h = dot(worldPos, vec3f(0.8191725, 0.6710726, 0.9497474));
    return fract(h * 1677.0) * 0.0001;
}

fn getScaleFromMatrix(matrix: mat4x4f) -> vec3f {
    // Each column vector's length represents the scale in that axis
    let scaleX = length(matrix[0].xyz);
    let scaleY = length(matrix[1].xyz);
    let scaleZ = length(matrix[2].xyz);
    
    return vec3f(scaleX, scaleY, scaleZ);
}

fn isOccluded(worldPos: vec3f, radius: f32, viewProj: mat4x4f) -> bool {
    let projected = viewProj * vec4f(worldPos, 1.0);
    
    // Early out if behind camera
    if (projected.w <= 0.0) {
        return true;
    }
    
    let ndc = projected.xyz / projected.w;
    
    // Convert NDC depth to 0-1 range
    let depthNorm = (ndc.z + 1.0) * 0.5 + getDepthOffset(worldPos);
    
    // Apply radius in view space (before projection)
    // This is a simplified approach - ideally radius should be projected properly
    let radiusInDepth = radius / projected.w;
    let depth = depthNorm - radiusInDepth;
    
    // Convert to UV space (handle Y-flip if needed based on API)
    let uv = vec2f(ndc.x * 0.5 + 0.5, ndc.y * -0.5 + 0.5); // Flip Y for Vulkan
    let uvSize = vec2f(textureDimensions(depthTexture));
    let pixelCoord = vec2u(uv * uvSize);
    
    // Sample depth
    let storedDepth = textureLoad(depthTexture, pixelCoord, 0);
    
    // Compare with bias to avoid z-fighting
    let bias = 0.0001;
    return depth > (storedDepth + bias);
}

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
@group(0) @binding(1) var<uniform> boundingSphere: BoundingSphere;
@group(0) @binding(2) var<storage, read> instances: array<Instance>;
@group(0) @binding(3) var depthTexture: texture_depth_2d;
@group(0) @binding(4) var<storage, read_write> drawCommands: array<DrawCommand>;
@group(0) @binding(5) var<storage, read_write> visibleInstances: array<mat4x4f>;

fn inFrustum(worldPos: vec3f, radius: f32, frustumPlanes: array<vec4f, 6>) -> bool {
  for (var i = 0u; i < 6u; i++) {
    let plane = frustumPlanes[i];
    let distance = dot(vec4f(worldPos, 1.0), plane);
    if (distance < -radius) {
      return false;
    }
  }
  return true;
}



@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let index = global_id.x;
    if (index >= arrayLength(&instances)) {
        return;
    }

    let instance = instances[index];
    let sphere = boundingSphere;
    let scale = getScaleFromMatrix(instance.modelMatrix);
    let radius = sphere.radius * max(max(scale.x, scale.y), scale.z);
    let worldCenter = (instance.modelMatrix * vec4f(sphere.center, 1.0)).xyz;
    let cameraPos = camera.position;
    var isInsideSphere = distance(worldCenter, cameraPos) < radius * scale.x;
    var isVisible = true;

    var isFar = distance(worldCenter, cameraPos) > 200.0;
    if (isFar && radius < 10.0) {
        isVisible = false;
    }
    
    if (!isInsideSphere) {
        if (!inFrustum(worldCenter, radius, camera.frustumPlanes)) {
            isVisible = false;
        }
        
        if (isVisible && isOccluded(worldCenter, radius, camera.viewProjection)) {
            isVisible = false;
        }
    }


    // If visible, append to visible instances array and increment count
    if (isVisible) {
        let visibleIndex = atomicAdd(&drawCommands[0].instanceCount, 1u);
        visibleInstances[visibleIndex] = instance.modelMatrix;
    } 
}