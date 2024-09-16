import { ShaderChunks } from './ShaderChunks.js';
import { UniformLib } from './UniformLib.js';

class ShaderLib {
    constructor() {
    }
    
    static getAttributeType(attribute) {
        switch (attribute.name) {
            case 'position':
            case 'normal':
            case 'color':
                return 'vec3f';
            case 'uv':
                return 'vec2f';
        }
    }
    
    static formatShaderCode(code) {
        return code.replace(/\n\s{12}/g, '\n').replace(/ {4,}(?=(const|struct|@group))/g, '')
                   .replace(/ {1,}(?=(const|struct|@group))/g, '')
                   .replace(/\n\s{1,}@location/g, '\n    @location')
                   .replace(/;\r\n/g, ';\n    ');
    }
    
    static compose(mesh) {
        const { geometry, material } = mesh;
        let mBinding = 0;
        const vertexAttributesLayout = geometry.getVertexAttributesLayout();
        let bindings = material.uniforms?.map((uniformGroup, i) => uniformGroup.getBindGroupString(1, mBinding++)).join('\n');
        bindings += material.textures?.map((texture, i) => texture.getBindGroupString(1, mBinding++)).join('\n') + material.samplers?.map((sampler, i) => sampler.getBindGroupString(1, mBinding++)).join('\n');
        const structs = material.uniforms?.map(uniformGroup => uniformGroup.getStructString()).join('\n');
        const varyings = material.chunks.vertex.map(chunk => chunk.varyings).flat().map((varying, index) => `@location(${index}) ${varying.toString()},`).join('\n   ');
        const attributes = vertexAttributesLayout.attributes.map(attribute => `@location(${attribute.shaderLocation}) ${attribute.name}: ${ShaderLib.getAttributeType(attribute)},`).join('\n   ');
        const vertexChunks = material.chunks.vertex.map(chunk => chunk.code).join('\n    ');
        const fragmentChunks = material.chunks.fragment.map(chunk => chunk.code).join('\n    ');

        const vertexShader = ShaderLib.formatShaderCode(`
            ${ShaderChunks.common.code}

            struct MVP {
                modelMatrix: mat4x4f,
                viewMatrix: mat4x4f,
                projectionMatrix: mat4x4f,
            }
            
            ${structs}
            
            @group(0) @binding(0) var<uniform> mvp: MVP;

            ${bindings}


            struct VertexInput { 
                ${attributes} 
            } 
            struct VertexOutput {
                @builtin(position) position: vec4f,
                ${varyings}
            }
            
            @vertex
            fn main(input: VertexInput) -> VertexOutput {
                let pos = vec4f(input.position, 1.0);
                let modelViewMatrix = mvp.viewMatrix * mvp.modelMatrix;
                var position = mvp.projectionMatrix * mvp.viewMatrix * mvp.modelMatrix * pos;
                var output: VertexOutput;
                output.position = position;
                ${vertexChunks}
                return output;
            }
        `);
        const fragmentShader = ShaderLib.formatShaderCode(`
            ${ShaderChunks.common.code}
            
            ${structs}

            ${bindings}

            struct FragmentInput {
                @builtin(position) position: vec4f,
                ${varyings}
            }
            
            struct FragmentOutput {
                @location(0) color: vec4f
            }
            
            @fragment
            fn main(input: FragmentInput) -> FragmentOutput {
                var output: FragmentOutput;
                var color = generic.color;
                ${fragmentChunks}
                output.color = color;
                return output;
            }
        `);
        
        return {
            vertexShader,
            fragmentShader,
        }
    }
    

    
}

export { ShaderLib };