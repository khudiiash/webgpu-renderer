  if (material.useWind == 1.0) {
  // Transform wind direction from world space to model space
    let worldToModelRotation = transpose(mat3x3<f32>(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz));
    let windDirectionModelSpace = normalize(worldToModelRotation * material.windDirection.xyz);
    
    let normalizedHeight = input.position.y / material.windHeight;
    
    // Coherent wind calculation using world position
    let worldNoiseScale = material.windHeight * 0.05; // Adjust for desired world noise frequency
    let worldTimeScale = material.windSpeed;
    let worldNoise = noise2D(vec2f(
        dot(worldPosition.xz, windDirectionModelSpace.xz) * worldNoiseScale + time * worldTimeScale,
        worldPosition.y * worldNoiseScale
    ));
    
    let baseWindStrength = material.windStrength * (0.8 + worldNoise * 0.4);
    let windStrength = baseWindStrength * pow(normalizedHeight, 2.0) * sin(time) * worldNoise;
    
    // Calculate primary bending
    let bendFactor = windStrength;
    let xzOffset = windDirectionModelSpace.xz * bendFactor * pow(normalizedHeight, 2.0);
    let yOffset = bendFactor * normalizedHeight * (1.0 - normalizedHeight);
    
    // Apply primary bending/
    let bentPosition = vec3f(
        input.position.x + xzOffset.x,
        input.position.y,
        input.position.z + xzOffset.y
    );
    
    // Individual branch movement (local noise)
    let localNoiseScale = material.windHeight * 0.1; // Adjust for desired local noise frequency
    let localTimeScale = material.windSpeed;  // Adjust for desired local movement speed
    let localNoise = noise2D(vec2f(
        input.position.xz * localNoiseScale + vec2f(f32(input.instanceIndex) * 1.0) + time * localTimeScale
    ));
    
    let branchAmplitude =  normalizedHeight; // More movement higher up;
    
    // Calculate distance from x=0, z=0
    let distanceFromOrigin = length(input.position.xz);
    
    // Scale branch movement based on distance from origin
    let scaledBranchAmplitude = branchAmplitude * distanceFromOrigin * 0.05;
    
    // move vertices more when further from center axis
    let branchMovement = vec3f(
        localNoise * scaledBranchAmplitude,
        abs(localNoise) * scaledBranchAmplitude,
        localNoise * scaledBranchAmplitude,
    );
    
    // Combine coherent bending with individual branch movement
    let finalPosition = bentPosition + branchMovement;
    
    // Apply final position
    worldPosition = modelMatrix * vec4f(finalPosition, 1.0);
  }