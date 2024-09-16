let shadowMapSize = f32(textureDimensions(shadowMap).x);
let lightDirection = lights.directionalLights[0].direction;
let texelSize = vec2f(1.0) / shadowMapSize;
let size = f32(textureDimensions(shadowMap).x);
var shadowCoord = input.vShadowPosition;
shadowCoord.z += 0.0001;
var shadow : f32 = 0.0;

var totalWeight : f32 = 0.0;

var dx = texelSize.x;
var dy = texelSize.y;

var uv = shadowCoord.xy;
var f = fract( uv * shadowMapSize + 0.5 );
uv -= f * texelSize;

// Calculate the blur factor based on the distance from the object casting the shadow
var blurFactor : f32 = 0.001 * (1.0 - shadowCoord.z); // Increased blur factor to cover a larger area

// Smooth linear gradient weights for a larger kernel
let kernelSize : i32 = 5;
for(var x : i32 = -kernelSize; x <= kernelSize; x = x + 1) {
    for(var y : i32 = -kernelSize; y <= kernelSize; y = y + 1) {
        var offset : vec2f = vec2f(f32(x), f32(y)) * blurFactor;
        var distance : f32 = length(vec2f(f32(x), f32(y))) / f32(kernelSize);
        var weight : f32 = 1.0 - distance; // Linear gradient weight
        shadow = shadow + textureSampleCompare(shadowMap, shadowSampler, uv + offset, shadowCoord.z) * weight;
        totalWeight = totalWeight + weight;
    }
}

shadow = shadow / totalWeight; // Average the samples with weights


// Calculate the light factor based on the shadow value, lambert factor, and fade factor
let lambertFactor = max(dot(input.vNormal, lightDirection), 0.0);
let lightFactor = min(0. + shadow * lambertFactor, 1.0);

// Apply the light factor to the color
color = vec4(
    color.rgb * lightFactor,
    color.a);