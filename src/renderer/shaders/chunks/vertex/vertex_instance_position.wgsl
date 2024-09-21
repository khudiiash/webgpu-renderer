let modelMatrix = instances[input.instanceIndex];
output.position = camera.projection * camera.view * modelMatrix * vec4f(input.position, 1.0);