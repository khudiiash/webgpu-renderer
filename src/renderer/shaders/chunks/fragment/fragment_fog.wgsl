let fogStart = scene.fog.start;
let fogEnd = scene.fog.end;
let fogDensity = scene.fog.density;
let fogType = scene.fog.fogType;
let fogDistance = input.vFogDistance;

var fogFactor = 1.0;

if (fogType == 0) {
    // Linear fog
    fogFactor = 1.0 - clamp((fogEnd - fogDistance) / (fogEnd - fogStart), 0.0, 1.0);
} else if (fogType == 1) {
    // Exponential fog
    fogFactor = exp2(-fogDensity * fogDensity * fogDistance * fogDistance);
} else if (fogType == 2) {
    // Exponential squared fog
    fogFactor = exp2(-fogDensity * fogDensity * fogDensity * fogDistance * fogDistance * fogDistance);
}

let fogColor = scene.fog.color;

color = mix(color, fogColor, fogFactor);
