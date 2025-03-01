@include(Common)
const F0 = vec3f(0.04);

// Helper function: GGX Normal Distribution Function (NDF)
fn DistributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a      = roughness * roughness;
    let a2     = a * a;
    let NdotH  = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let nom    = a2;
    let denom  = (NdotH2 * (a2 - 1.0) + 1.0);
    return nom / (PI * denom * denom);
}

// Helper function: Schlicks approximation for the Geometry term (single direction)
fn GeometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = roughness + 1.0;
    let k = (r * r) / 8.0; // k factor remaps roughness, common choice for GGX
    return NdotV / (NdotV * (1.0 - k) + k);
}

// Helper function: Combined geometry function using Smiths method
fn GeometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2  = GeometrySchlickGGX(NdotV, roughness);
    let ggx1  = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

// Helper function: Fresnel using Schlicks approximation
fn FresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (vec3f(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

// A sample attenuation function for point lights, adjust as needed.
fn calculate_attenuation(distance: f32) -> f32 {
    let constant: f32 = 1.0;
    let linear: f32 = 0.09;
    let quadratic: f32 = 0.032;
    return 1.0 / (constant + linear * distance + quadratic * distance * distance);
}
