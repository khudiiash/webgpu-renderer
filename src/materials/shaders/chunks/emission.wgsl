@fragment {{
    color = vec4f(color.rgb * material.emissive.rgb * material.emissive_factor, 1.0);
}}