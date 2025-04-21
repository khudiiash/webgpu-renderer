@include(Common)
const F0 = vec3f(0.04);

// Helper function: GGX Normal Distribution Function (NDF)
fn DistributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a2     = pow(roughness, 2.0);
    let NdotH  = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let nom    = a2;
    var denom  = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return nom / denom;
}

// Helper function: Schlicks approximation for the Geometry term (single direction)
fn GeometrySchlickGGX(NdotV: f32, k: f32) -> f32 {
    let nom = NdotV;
    let denom = NdotV * (1.0 - k) + k;
    return nom / denom;
}

// Helper function: Combined geometry function using Smiths method
fn GeometrySmith(N: vec3f, V: vec3f, L: vec3f, k: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2  = GeometrySchlickGGX(NdotV, k);
    let ggx1  = GeometrySchlickGGX(NdotL, k);
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
