// UniformLibGroup.js
const UniformLibGroup = {
    camera: {
        projectionMatrix: { type: 'mat4x4f' },
        viewMatrix: { type: 'mat4x4f' },
        position: { type: 'vec3f' },
        size: 192 // Calculated size (64 + 64 + 12)
    },
    scene: {
        fog: {
            color: { type: 'vec3f' },
            near: { type: 'f32' },
            far: { type: 'f32' },
            size: 20
        },
        ambientLight: {
            color: { type: 'vec4f' },
            intensity: { type: 'f32' },
            _pad: { type: 'f32' },
            _pad2: { type: 'f32' },
            _pad3: { type: 'f32' },
            size: 32
        },
        directionalLights: {
            direction: { type: 'vec3f' },
            color: { type: 'vec3f' },
            intensity: { type: 'f32' },
            _pad: { type: 'f32' },
            size: 28
        },
        directionalLightShadows: {
            bias: { type: 'f32' },
            normalBias: { type: 'f32' },
            pcf: { type: 'f32' },
            _pad: { type: 'f32' },
            size: 16
        },
        directionalLightMatrices: { type: 'mat4x4f', size: 64 },
        directionalLightsNum: { type: 'f32', size: 4 },
        pointLightsNum: { type: 'f32', size: 4 },
        pad2: { type: 'f32', size: 4 },
        size: 128
    },
    light: {
        position: { type: 'vec3f' },
        intensity: { type: 'f32' },
        size: 16
    },
    params: {
        voxelGridSize: { type: 'u32' },
        maxRayDistance: { type: 'f32' },
        size: 8
    }
};

export { UniformLibGroup };