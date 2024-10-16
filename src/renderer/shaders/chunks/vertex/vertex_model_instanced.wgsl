let modelMatrix = instances[input.instanceIndex];
var worldPosition = modelMatrix * vec4f(input.position, 1.0);
var worldNormal = normalize((modelMatrix * vec4f(input.normal, 0.0)).xyz);