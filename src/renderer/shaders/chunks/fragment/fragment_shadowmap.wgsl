let shadowMapSize = f32(textureDimensions(shadowMap).x);
let DIR_LIGHT_NUM = u32(scene.directionalLightsNum);

for (var i = 0u; i < DIR_LIGHT_NUM; i = i + 1u) {
	let lightDirection = scene.directionalLights[0].direction;
	let texelSize = vec2f(1.0) / shadowMapSize;
	let size = f32(textureDimensions(shadowMap).x);
	let shadowConfig = scene.directionalLightShadows[0];
	let posFromLight = (scene.directionalLightMatrices[0] * vec4f(input.vWorldPosition, 1)).xyz;
	var shadowCoord = vec3f(
		posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5, 0.5), 
		posFromLight.z
	);
	shadowCoord.z += shadowConfig.shadowBias;
	var shadow : f32 = 0.0;

	var totalWeight : f32 = 0.0;

	var dx = texelSize.x;
	var dy = texelSize.y;

	var uv = shadowCoord.xy;
	var f = fract( uv * shadowMapSize + 0.5 );
	uv -= f * texelSize;

	shadow = (
		textureSampleCompare( shadowMap, samplerComparison, uv, shadowCoord.z ) +
		textureSampleCompare( shadowMap, samplerComparison, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
		textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 0.0, dy ), shadowCoord.z ) +
		textureSampleCompare( shadowMap, samplerComparison, uv + texelSize, shadowCoord.z ) +
		mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
			 textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
			 f.x ) +
		mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( -dx, dy ), shadowCoord.z ),
			 textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
			 f.x ) +
		mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 0.0, -dy ), shadowCoord.z ),
			 textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
			 f.y ) +
		mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( dx, -dy ), shadowCoord.z ),
			 textureSampleCompare( shadowMap, samplerComparison, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
			 f.y ) +
		mix( mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( -dx, -dy ), shadowCoord.z ),
				  textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
				  f.x ),
			 mix( textureSampleCompare( shadowMap, samplerComparison, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
				  textureSampleCompare( shadowMap, samplerComparison, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
				  f.x ),
			 f.y )
	) * ( 1.0 / 9.0 );

	let lambertFactor = max(dot(lightDirection, normalize(input.vNormal)), 0.0);
	let lightFactor = min(scene.ambientLight.a + shadow * lambertFactor, 1.0);

	// Apply the light factor to the color
	color = vec4(
		color.rgb * lightFactor,
		color.a);

}