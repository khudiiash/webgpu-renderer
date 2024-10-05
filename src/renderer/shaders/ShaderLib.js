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
            case 'joints':
                return 'vec4f';
            case 'weights':
                return 'vec4f';
        }
    }
    
    static formatShaderCode(code) {
        return code.replace(/\n\s{12}/g, '\n').replace(/ {4,}(?=(const|struct|@group))/g, '')
                   .replace(/ {1,}(?=(const|struct|@group))/g, '')
                   .replace(/\n\s{1,}@location/g, '\n    @location')
                   .replace(/;\r\n/g, ';\n    ');
    }
    
    static composeShadow(mesh) {
        const { geometry, material } = mesh;
        let mBinding = 0;
        const vertexAttributesLayout = geometry.getVertexAttributesLayout();
        const uniforms = material.uniforms.filter(u => u.useShadow);
        const textures = material.textures.filter(t => t.useShadow);
        const samplers = material.samplers.filter(s => s.useShadow);

        let bindings = uniforms.map((uniformGroup, i) => uniformGroup.getBindGroupString(0, mBinding++)).join('\n');
        bindings += textures.map((texture, i) => texture.getBindGroupString(0, mBinding++)).join('\n');
        bindings += samplers.map((sampler, i) => sampler.getBindGroupString(0, mBinding++)).join('\n');

        const depStructs = uniforms.map(uniformGroup => uniformGroup.getStructsString()).join('\n');
        const structs = uniforms.map(uniformGroup => uniformGroup.getMainStructString()).join('\n');
        const attributes = vertexAttributesLayout.attributes.map(attribute => `@location(${attribute.shaderLocation}) ${attribute.name}: ${ShaderLib.getAttributeType(attribute)},`).join('\n   ');
        const vertexChunks = material.chunks.vertex.filter(c => c.useShadow || c[mesh.type]?.useShadow).map(c => c.code ? c : c[mesh.type]);
        const vertexChunksString = vertexChunks.map(c => c.code).join('\n    ');
        const varyings = vertexChunks.map(c => c.varyings).flat().map((varying, index) => varying.toString(index) + ',',).join('\n   ');
        const fragmentChunks = material.chunks.fragment.filter(c => c.useShadow).map(c => c.code || c[mesh.type].code).join('\n    ');

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
                ${vertexChunksString}
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
            
            @fragment
            fn main(input: FragmentInput) -> @location(0) f32 {
                var color = vec4f(1.0);
                ${fragmentChunks}
                return input.position.z / input.position.w;
            }
        `;
        
        return {
            vertexShader,
            fragmentShader,
        }
    }
    
    static compose(mesh) {
        const { geometry, material } = mesh;
        let mBinding = 0;

        const vertexAttributesLayout = geometry.getVertexAttributesLayout();
        const uniforms = material.uniforms.filter(u => u.useRender);
        const textures = material.textures.filter(t => t.useRender);
        const samplers = material.samplers.filter(s => s.useRender);

        let bindings = uniforms.map((uniformGroup, i) => uniformGroup.getBindGroupString(0, mBinding++)).join('\n');
        bindings += textures.map((texture, i) => texture.getBindGroupString(0, mBinding++)).join('\n');
        bindings += samplers.map((sampler, i) => sampler.getBindGroupString(0, mBinding++)).join('\n');

        const depStructs = uniforms.map(uniformGroup => uniformGroup.getStructsString()).join('\n');
        const structs = uniforms.map(uniformGroup => uniformGroup.getMainStructString()).join('\n');
        const attributes = vertexAttributesLayout.attributes.map(attribute => `@location(${attribute.shaderLocation}) ${attribute.name}: ${ShaderLib.getAttributeType(attribute)},`).join('\n   ');
        const vertexChunks = material.chunks.vertex.filter(c => c.useRender || c[mesh.type]?.useRender).map(c => c.code ? c : c[mesh.type]);
        const vertexChunksString = vertexChunks.map(c => c.code).join('\n    ');
        const varyings = vertexChunks.map(c => c.varyings).flat().map((varying, index) => varying.toString(index) + ',',).join('\n   ');
        const fragmentChunks = material.chunks.fragment.filter(c => c.useRender).map(c => c.code || c[mesh.type].code).join('\n    ');

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
                ${vertexChunksString}
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
                //output.color = vec4f(vec3f(material.alpha), 1.0);
                return output;
            }
        `;
        return {
            vertexShader,
            fragmentShader,
        }
    }
    

    
}

export { ShaderLib };