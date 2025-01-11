@fragment {{
    let fogColor = scene.fog.color;
    let fogStart = scene.fog.start;
    let fogEnd = scene.fog.end;
    let fogDensity = scene.fog.density;
    let fogType = scene.fog.fogType;
    let fogDistance = length(input.vPositionW - camera.position);
    
    let height = input.vPositionW.y;
    let heightFalloff = 0.1;
    let groundLevel = 0.0;
    
    var fogFactor = 1.0;
    
    if (fogType == 0) {
        fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
    } else if (fogType == 1) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDistance * fogDistance);
    } else if (fogType == 2) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDensity * fogDistance * fogDistance * fogDistance);
    }
    
    // Apply height-based attenuation
    let heightFactor = exp2(-heightFalloff * max(height - groundLevel, 0.0));
    //fogFactor *= heightFactor;
    
    // Messing around;
    // Remove it!
    /**/
    if (color.r > 0.58) {
        let colorA = vec4f(1.0, 0.8, 0.0, 1.0);
        let colorB = vec4f(0.0, 0.0, 1.0, 1.0);
        let colorC = vec4f(0.0, 1.0, 1.0, 1.0);
        
        let noiseValue = fbm(input.vPositionW.xz * 0.05);
        let noiseFactor = mix(0.0, 1.0, noiseValue);
        color = mix(color, mix(colorA, colorB, noiseFactor), noiseValue);
        color = mix(color, colorC, noiseFactor * 0.5);
        color *= 2.0;
    }
    /**/

    color = mix(color, fogColor, fogFactor);
    color = vec4f(color.rgb * heightFactor * 2, 1.0);

}}