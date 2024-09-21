let modelMatrix = model;
output.position = camera.projection * camera.view * modelMatrix * vec4f(input.position, 1);