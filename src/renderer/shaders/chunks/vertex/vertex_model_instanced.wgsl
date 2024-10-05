let modelMatrix = instances[input.instanceIndex];
var worldPosition = modelMatrix * vec4f(input.position, 1.0);