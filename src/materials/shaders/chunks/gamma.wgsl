@fragment() {{
    #if USE_GAMMA {
        color = vec4f(pow(color.rgb, vec3f(1.0 / 2.2)), color.a);
    }
}}