import { ShaderLibrary } from "./ShaderLibrary";

class Shader {
    constructor(name, options = {}) {
        this.name = name;
        this.vertexSource = null;
        this.fragmentSource = null;
        this.computeSource = null;
        this.bindGroups = new Map();
        this.defines = new Map();
        this.attributes = new Map();
        this.varyings = new Map();
        this.builtins = new Map();
        this.options = options;
        this.bindings = [];
    }

    setTexture(name, texture) {
        this.textures.set(name, texture);
    }

    setSampler(name, sampler) {
        this.samplers.set(name, sampler);
    }

    setUniform(name, value) {
        this.uniforms.set(name, value);
    }


    addVarying(name, type, location, interpolate = {}) {
        this.varyings.set(name, {
            type,
            location,
            interpolate: {
                type: interpolate.type || 'perspective',
                sampling: interpolate.sampling || 'center'
            }
        });
    }

    addAttrbiute(name, type, location) {
        this.attributes.set(name, {
            type,
            location,
        });
    }

    addBuiltin(name, type) {
        this.builtins.set(name, type);
    }

    generateAttributes() {
        let result = '';
        for (const [name, type] of this.builtins) {
            result += `@builtin(${name}) ${name}: ${type},\n`;
        }
        for (const [name, attribute] of this.attributes) {
            result += `@location(${attribute.location}) ${name}: ${attribute.type},\n`;
        }
        return result;
    }

    generateVaryings() {
        let result = '';
        for (const [name, varying] of this.varyings) {
            result += `@location(${varying.location}) @interpolate(${varying.interpolate.type}, ${varying.interpolate.sampling}) ${name}: ${varying.type},\n`;
        }
        return result;
    }

    static create(options = {}, defines = {}) {
        const library = ShaderLibrary.getInstance();
        const shader = new Shader(options.name || 'unnamed');
        const bindings = shader.bindings;
        
        if (options.builtins) {
            for (let i = 0; i < options.builtins.length; i++) {
                const builtin = options.builtins[i];
                shader.addBuiltin(
                    builtin.name,
                    builtin.type,
                );
            }
        }
        if (options.attributes) {
            for (let i = 0; i < options.attributes.length; i++) {
                const attribute = options.attributes[i];
                shader.addAttrbiute(
                    attribute.name,
                    attribute.type,
                    attribute.location ?? i,
                );
            }
        }

        if (options.varyings) {
            for (let i = 0; i < options.varyings.length; i++) {
                const varying = options.varyings[i];
                shader.addVarying(
                    varying.name,
                    varying.type,
                    varying.location ?? i,
                    varying.interpolate
                );
            }
        }

        const varyings = shader.generateVaryings();
        const attributes = shader.generateAttributes();

        if (options.vertexTemplate) {
            shader.vertexSource = library.processTemplate(`
                    struct VertexInput {
                        ${attributes}
                    }; 

                    struct VertexOutput {
                        @builtin(position) position: vec4f,
                        ${varyings}
                    };

                    ${options.vertexTemplate}`,
                defines,
                bindings,
            );
        }

        if (options.fragmentTemplate) {
            shader.fragmentSource = library.processTemplate(`
                    struct FragmentInput {
                        @builtin(position) position: vec4f,
                        ${varyings.replace(/@interpolate\(([\w]+), ([\w]+)\)/g, '')}
                    };

                    struct FragmentOutput {
                        @location(0) color: vec4f,
                    };

                    ${options.fragmentTemplate}
                `,
                defines,
                bindings,
            );
        }

        return shader;
    }

    getVisibility(name) {
        let visibility = 0;
        if (this.vertexSource?.includes(name)) {
            visibility |= GPUShaderStage.VERTEX;
        }
        if (this.fragmentSource?.includes(name)) {
            visibility |= GPUShaderStage.FRAGMENT;
        }
        if (this.computeSource?.includes(name)) {
            visibility |= GPUShaderStage.COMPUTE;
        }

        return visibility;
    }


    //extractBindings() {
    //     const bindingRegex = /@group\((\d+)\)\s@binding\((\d+)\)\svar(?:<(\w+)(?:,\s(\w+))?>)? (\w+)\: (\w+(?:<.*>)?);/g;
    //     const code = {
    //         vertex: this.vertexSource,
    //         fragment: this.fragmentSource,
    //         compute: this.computeSource,
    //     }

    //     Object.entries(code).forEach(([ key, code ]) => {
    //         let match;
    //         while ((match = bindingRegex.exec(code)) !== null) {
    //             const [_, group, binding, buffer, access, varName, type] = match;
    //             //let visibility;
    //             // switch (key) {
    //             //     case 'vertex': visibility = GPUShaderStage.VERTEX; break;
    //             //     case 'fragment': visibility = GPUShaderStage.FRAGMENT; break;
    //             //     case 'compute': visibility = GPUShaderStage.COMPUTE; break;
    //             // }
    //             // const bindingInfo = {
    //             //     name: varName,
    //             //     group: parseInt(group),
    //             //     binding: parseInt(binding),
    //             //     visibility,
    //             //     buffer: buffer,
    //             //     access: access,
    //             //     type: type,
    //             //     isUniform: buffer === 'uniform',
    //             //     isStorage: buffer === 'storage',
    //             //     isSampler: type.includes('sampler'),
    //             //     isTexture: type.includes('texture'),
    //             // };
    //             this.bindings.push(varName);
    //         }       
    //     });

    //     return this.bindings;
    // }

}

export { Shader };