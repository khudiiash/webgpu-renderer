  if (material.useWind == 1.0) {
  // Transform wind direction from world space to model space
    let worldToModelRotation = transpose(mat3x3<f32>(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz));
    let windDirectionModelSpace = normalize(worldToModelRotation * material.windDirection.xyz);
    
    let normalizedHeight = input.position.y / material.windHeight;
    
    // Coherent wind calculation using world position
    let worldNoiseScale = 0.01;
    let worldTimeScale = material.windSpeed;
    let worldNoise = noise2D(vec2f(
        dot(worldPosition.xz, windDirectionModelSpace.xz) * worldNoiseScale + time * worldTimeScale,
        worldPosition.y * worldNoiseScale * 0.1
    ));
    
    let baseWindStrength = material.windStrength * (0.8 + worldNoise * 0.4);
    let windStrength = baseWindStrength * pow(normalizedHeight, 2.0) * abs(sin(time * 0.5)) * worldNoise;
    
    // Calculate primary bending
    let bendFactor = windStrength;
    let xzOffset = windDirectionModelSpace.xz * bendFactor * pow(normalizedHeight, 2.0);
    let yOffset = -bendFactor * normalizedHeight * (1.0 - normalizedHeight);
    
    // Apply primary bending
    let bentPosition = vec3f(
        input.position.x + xzOffset.x,
        input.position.y + yOffset,
        input.position.z + xzOffset.y
    );
    
    // Individual branch movement (local noise)
    let localNoiseScale = 0.1; // Adjust for desired local noise frequency
    let localTimeScale = material.windSpeed;  // Adjust for desired local movement speed
    let localNoise = noise2D(vec2f(
        input.position.xz * localNoiseScale + vec2f(f32(input.instanceIndex) * 10.0) + time * localTimeScale
    ));
    
    let branchAmplitude = 0.05 * normalizedHeight; // More movement higher up the tree
    let branchMovement = vec3f(
        localNoise * branchAmplitude,
        abs(localNoise) * branchAmplitude * 0.5,
        localNoise * branchAmplitude
    ) * 10.0;
    
    // Combine coherent bending with individual branch movement
    let finalPosition = bentPosition + branchMovement;
    
    // Apply final position
    worldPosition = modelMatrix * vec4f(finalPosition, 1.0);
  }