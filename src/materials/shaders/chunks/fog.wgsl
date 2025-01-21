@group(Global) @binding(Scene)

fn applyFog(color: vec4f, worldPosition: vec3f, cameraPos: vec3f, fog: Fog) -> vec4f {
    let fogColor = fog.color;
    let fogStart = fog.start;
    let fogEnd = fog.end;
    let fogDensity = fog.density;
    let fogType = fog.fogType;
    let fogDistance = length(worldPosition - cameraPos);
    
    var fogFactor = 1.0;
    
    if (fogType == 0) {
        fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
    } else if (fogType == 1) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDistance * fogDistance);
    } else if (fogType == 2) {
        fogFactor = 1.0 - exp2(-fogDensity * fogDensity * fogDensity * fogDistance * fogDistance * fogDistance);
    }
    
    return mix(color, fogColor, fogFactor);
}