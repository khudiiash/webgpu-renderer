@fragment {{
    let fogColor = scene.fog.color;
    let fogStart = scene.fog.start;
    let fogEnd = scene.fog.end;
    let fogDensity = scene.fog.density;
    let fogType = scene.fog.fogType;
    let fogDistance = length(input.vPositionW - camera.position);
    
    var fogFactor = 1.0;
    
    if (fogType == 0) {
        fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
    } else if (fogType == 1) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDistance * fogDistance);
    } else if (fogType == 2) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDensity * fogDistance * fogDistance * fogDistance);
    }
    
    color = mix(color, fogColor, fogFactor);
}}