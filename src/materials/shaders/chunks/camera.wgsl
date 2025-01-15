struct Camera {
  projection: mat4x4f,
  view: mat4x4f,
  position: vec3f,
  direction: vec3f,
};

@group(0) @binding(1) var<uniform> camera: Camera;