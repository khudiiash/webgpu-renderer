let worldPos = (modelMatrix * vec4f(input.position, 1.0)).xyz;
output.vFogDistance = length(worldPos - camera.position);