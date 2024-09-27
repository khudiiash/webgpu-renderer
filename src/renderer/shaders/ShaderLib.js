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
        let bindings = material.uniforms?.map((uniformGroup, i) => uniformGroup.getBindGroupString(0, mBinding++)).join('\n');
        bindings += material.textures?.map((texture, i) => texture.getBindGroupString(0, mBinding++)).join('\n');
        bindings += material.samplers?.map((sampler, i) => sampler.getBindGroupString(0, mBinding++)).join('\n');

        const depStructs = material.uniforms?.map(uniformGroup => uniformGroup.getStructsString()).join('\n');
        const structs = material.uniforms?.map(uniformGroup => uniformGroup.getMainStructString()).join('\n');
        const varyings = material.chunks.vertex.map(chunk => chunk.varyings).flat().map((varying, index) => varying.toString(index) + ',',).join('\n   ');
        const attributes = vertexAttributesLayout.attributes.map(attribute => `@location(${attribute.shaderLocation}) ${attribute.name}: ${ShaderLib.getAttributeType(attribute)},`).join('\n   ');
        const vertexChunks = material.chunks.vertex.map(chunk => chunk.code).join('\n    ');
        const fragmentChunks = material.chunks.fragment.map(chunk => chunk.code).join('\n    ');

        const vertexShader = ShaderLib.formatShaderCode(`
            ${ShaderChunks.common.code}

            ${depStructs}

            ${structs}
            
            ${bindings}
            
            struct VertexInput { 
                @builtin(instance_index) instanceIndex: u32,
                ${attributes} 
            } 
            struct VertexOutput {
                @builtin(position) position: vec4f,
                ${varyings}
            }
            
            @vertex
            fn main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                ${vertexChunks}
                return output;
            }
        `);
        const fragmentShader = `
            ${ShaderChunks.common.code}
            
            ${depStructs}

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
                var color = material.color;
                ${fragmentChunks}
                output.color = color;
                return output;
            }
        `;
        
        console.log(vertexShader);
        
        return {
            vertexShader,
            fragmentShader,
        }
    }
    

    
}

export { ShaderLib };