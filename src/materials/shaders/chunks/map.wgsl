fn sampleColor(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, color: vec4f) -> vec4f {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texColor = textureSample(map, mapSampler, wrappedUV);
        return texColor;
    }
    return color;
}

fn sampleNormal(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, normal: vec3f) -> vec3f {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texNormal = textureSample(map, mapSampler, wrappedUV).xyz;
        let normalMatrix = mat3x3f(
            vec3f(1.0, 0.0, 0.0),
            vec3f(0.0, 1.0, 0.0),
            vec3f(0.0, 0.0, 1.0)
        );
        let tangent = normalize(cross(normal, vec3f(0.0, 0.0, 1.0)));
        let bitangent = cross(normal, tangent);
        let TBN = mat3x3f(tangent, bitangent, normal);
        let normalMap = normalize(TBN * (texNormal * 2.0 - 1.0));
        return normalMap;
    }
    return normal;
}

fn sampleMetalness(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, metalness: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texMetalness = textureSample(map, mapSampler, wrappedUV).r;
        return texMetalness;
    }
    return metalness;
}

fn sampleRoughness(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, roughness: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texRoughness = textureSample(map, mapSampler, wrappedUV).r;
        return texRoughness;
    }
    return roughness;
}

fn sampleHeight(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texHeight = textureSample(map, mapSampler, wrappedUV).r;
        return texHeight;
    }
    return 1.0;
}

const NUM_STEPS: i32 = 512;

fn inverse(mat: mat3x3f) -> mat3x3f {
    let a = mat[0][0];
    let b = mat[0][1];
    let c = mat[0][2];
    let d = mat[1][0];
    let e = mat[1][1];
    let f = mat[1][2];
    let g = mat[2][0];
    let h = mat[2][1];
    let i = mat[2][2];
    let A = e * i - f * h;
    let B = f * g - d * i;
    let C = d * h - e * g;
    let det = a * A + b * B + c * C;
    let invDet = 1.0 / det;
    return mat3x3f(
        vec3f(A * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet),
        vec3f(B * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet),
        vec3f(C * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet)
    );
}

fn sampleAO(map: texture_2d<f32>, mapSampler: sampler, uv: vec2f, ao: f32) -> f32 {
    if (textureDimensions(map).x > 1) {
        let wrappedUV = fract(uv);
        let texAO = textureSample(map, mapSampler, wrappedUV).r;
        return texAO;
    }
    return ao;
}

fn modulo(a: f32, b: f32) -> f32 {
	var m = a % b;
	if (m < 0.0) {
		if (b < 0.0) {
			m -= b;
		} else {
			m += b;
		}
	}
	return m;
}

struct ParallaxResult {
    uv: vec2f,
    viewHeight: f32
};
fn computeParallaxLightOcclusion(uv: vec2f, lightViewDir: vec3f, viewHeight: f32, heightMap: texture_2d<f32>, heightMapSampler: sampler) -> bool {
    const numSteps = 64;
    let viewAngle = 1.0 - abs(dot(vec3f(0.0, 0.0, 1.0), lightViewDir));
    let heightScale = 0.1 * (1.0 + viewAngle);
    let scale = 0.5;
    let layerSize = scale / numSteps;
    var shadowUV = uv;
    var shadowLayer = viewHeight;
    var lightOccluded = false;

    let deltaUV = lightViewDir.xy * heightScale;
    let stepUV = deltaUV / numSteps;
    let shadowBias = 0.001 * (1.0 + viewAngle * 2.0);
    
    for (var i = 0; i < 32; i++) {
        shadowUV += stepUV;
        let wrappedShadowUV = fract(shadowUV);
        let sampledHeight = textureSample(heightMap, heightMapSampler, wrappedShadowUV).r;
        shadowLayer += layerSize;
        
        if (sampledHeight > (shadowLayer + shadowBias)) {
            lightOccluded = true;
        }
    }

    return lightOccluded;
}
fn computeParallaxOcclusionMapping(uv: vec2f, viewDir: vec3f, heightMap: texture_2d<f32>, heightMapSampler: sampler) -> ParallaxResult {
    // map
    const numSteps = 64;
    var resultUV = uv;
    let scale = 1.0;
    var layerSize = scale / 64.0;
    let viewAngle = 1.0 - abs(dot(vec3f(0.0, 0.0, 1.0), viewDir));
    let heightScale = 0.3 * (1.0 + viewAngle);
    
    var currentLayer = 0.0;
    var deltaUV = -viewDir.xy * heightScale;
    var stepUV = deltaUV / 64.0;
    // First pass: linear search
    var prevHeight = 0.0;
    var nextHeight = 0.0;
    var prevUV = resultUV;
    let wrappedUV = fract(resultUV);
    nextHeight = textureSample(heightMap, heightMapSampler, wrappedUV).r;
    
    
    for (var i = 0; i < 32; i++) {
        let wrappedUV = fract(resultUV);
        currentLayer += layerSize;
        
        if (nextHeight < currentLayer) {
            prevHeight = nextHeight;
            prevUV = resultUV;
            resultUV += stepUV;
        }
    }
    
    // Binary search refinement
    let numRefinements = 5;
    for (var i = 0; i < numRefinements; i++) {
        let midUV = (prevUV + resultUV) * 0.5;
        let midLayer = (prevHeight + nextHeight) * 0.5;
        let wrappedMidUV = fract(midUV);
        let midHeight = textureSample(heightMap, heightMapSampler, wrappedMidUV).r;
        
        if (midHeight > midLayer) {
            resultUV = midUV;
            nextHeight = midHeight;
        } else {
            prevUV = midUV;
            prevHeight = midHeight;
        }
    }
    
    return ParallaxResult(resultUV, nextHeight);
}

fn getTBN(tangent: vec3f, bitangent: vec3f, normal: vec3f) -> mat3x3<f32> {
    let T = normalize(tangent);
    let B = normalize(bitangent);
    let N = normalize(normal);
    let TBN = mat3x3f(T, B, N);
    return TBN;
}

fn scaleUV(uv: vec2f, scale: vec2f) -> vec2f {
    return (uv - 0.5) * scale + 0.5;
}


@fragment(before:lighting) {{
    // map
    let uvScale = material.uvScale;
    uv = scaleUV(uv, uvScale);

    let parallax = computeParallaxOcclusionMapping(uv, viewDirTan, height_map, height_map_sampler);

    if (textureDimensions(height_map).x > 1) {
        useParallax = true;
        uv = parallax.uv;
        //if (length(uvScale) == 1) {
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                discard;
            }
        //}
    }

    let height = sampleHeight(height_map, height_map_sampler, uv);
    normal = sampleNormal(normal_map, normal_map_sampler, uv, normal);


    color = sampleColor(diffuse_map, diffuse_map_sampler, uv, color);
    if (color.a < material.alpha_test) {
        discard;
    }
    metalness = sampleMetalness(metalness_map, metalness_map_sampler, uv, metalness);
    roughness = sampleRoughness(roughness_map, roughness_map_sampler, uv, roughness);
    ao = sampleAO(ao_map, ao_map_sampler, uv, 1.0);
    color = vec4f(color.rgb * ao, color.a);
    emissive = sampleColor(emissive_map, emissive_map_sampler, uv, emissive);

    if (height < 1.0 && height > 0.0) {
        color = vec4f(color.rgb * height, color.a);
    }


}}