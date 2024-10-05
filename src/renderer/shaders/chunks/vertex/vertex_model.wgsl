let modelMatrix = model;
var worldPosition = modelMatrix * vec4f(input.position, 1.0);

output.vWorldPosition = worldPosition.xyz;
output.vPosition = input.position;