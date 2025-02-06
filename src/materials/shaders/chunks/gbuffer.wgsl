@fragment(last) {{
    // store the normal in the gbuffer
    output.normal = vec4f(normalize(input.normal), 0.0);
}}