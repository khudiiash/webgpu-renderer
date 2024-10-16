output.position = projectionView * worldPosition;
output.vPosition = input.position;
output.vPositionW = worldPosition.xyz;
output.vNormal = input.normal;
output.vNormalW = normalize(worldNormal);