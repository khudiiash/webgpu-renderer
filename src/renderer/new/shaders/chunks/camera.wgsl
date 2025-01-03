struct Camera {
  view: mat4x4f,
  projection: mat4x4f,
};

@group(0) @binding(1) var<uniform> camera: Camera;