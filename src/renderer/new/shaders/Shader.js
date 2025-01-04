import { ShaderLibrary } from "./ShaderLibrary";
import { TemplateProcessor } from "./TemplateProcessor";
import { ShaderFormatter } from "./ShaderFormatter";

class Shader {
    constructor(name, options = {}) {
        this.name = name;
        this.formatter = new ShaderFormatter();
        this.processor = new TemplateProcessor();
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
            shader.vertexSource = ShaderFormatter.format(
                TemplateProcessor.processTemplate(`
                    struct VertexInput {
                        ${attributes}
                    }; 

                    struct VertexOutput {
                        @builtin(position) position: vec4f,
                        ${varyings}
                    };

                    ${options.vertexTemplate}`,
                    defines,
                    bindings)
                );
        }

        if (options.fragmentTemplate) {
            shader.fragmentSource = ShaderFormatter.format(
                TemplateProcessor.processTemplate(`
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
                )
            );
        }

        console.log(shader.fragmentSource);

        return shader;
    }
}

export { Shader };