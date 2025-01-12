#include <scene>

fn phong(normal: vec3<f32>, lightDir: vec3<f32>, viewDir: vec3<f32>, lightColor: vec3<f32>, ambientColor: vec3<f32>, shininess: f32) -> vec3<f32> {
    // Normalize the input vectors
    let N = normalize(normal);
    let L = normalize(lightDir);
    let V = normalize(viewDir);
    
    // Calculate the ambient component
    let ambient = ambientColor;
    
    // Calculate the diffuse component
    let diff = max(dot(N, L), 0.0);
    let diffuse = diff * lightColor;
    
    // Calculate the specular component
    let R = reflect(-L, N);
    let spec = pow(max(dot(R, V), 0.0), shininess);
    let specular = spec * lightColor;
    
    // Combine the components
    let color = ambient + diffuse + specular;
    
    return color;
}

@fragment() {{
    // Phong lighting model
    let N: vec3<f32> = normalize(input.vNormalW);
    let V: vec3<f32> = normalize(-input.vPositionW);
    let ambientColor: vec3<f32> = scene.ambientColor;
    let shininess: f32 = material.shininess;
    
    for (var i = 0u; i < MAX_LIGHTS; i = i + 1u) {{
        let light = scene.lights[i];
        let lightDir = normalize(light.position - input.vPositionW);
        let lightColor = light.color;
        
        // Calculate the Phong lighting model
        color += phong(N, lightDir, V, lightColor, ambientColor, shininess);
    }}
    
    // Apply gamma correction
    color = pow(color, vec3<f32>(1.0 / 2.2));
}}