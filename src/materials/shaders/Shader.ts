import { ShaderConfig, ShaderVarying, ShaderBuiltin, ShaderDefines, ShaderAttribute } from "./ShaderLibrary";
import { TemplateProcessor } from "./TemplateProcessor";
import { ShaderFormatter } from "./ShaderFormatter";

class Shader {
    name: string;
    formatter: ShaderFormatter;
    processor: TemplateProcessor;
    vertexSource!: string;
    fragmentSource!: string;
    computeSource!: string;
    defines: ShaderDefines;
    attributes: Map<string, ShaderAttribute>;
    varyings: Map<string, ShaderVarying>;
    builtins: Map<string, ShaderBuiltin>;
    options: any;
    bindings: any;
    
    constructor(name: string, options = {}) {
        this.name = name;
        this.formatter = new ShaderFormatter();
        this.processor = new TemplateProcessor();
        this.defines = {};
        this.attributes = new Map();
        this.varyings = new Map();
        this.builtins = new Map();
        this.options = options;
        this.bindings = [];
    }

    addVarying(varying: ShaderVarying) {
        this.varyings.set(varying.name, {
            name: varying.name,
            type: varying.type,
            location: varying.location,
            interpolate: {
                type: varying.interpolate?.type || 'perspective',
                sampling: varying.interpolate?.sampling || 'center'
            }
        });
    }

    addAttribute(attribute: ShaderAttribute) {
        this.attributes.set(attribute.name, attribute);
    }

    addBuiltin(builtin: ShaderBuiltin) {
        this.builtins.set(builtin.name, builtin);
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
            result += `@location(${varying.location}) @interpolate(${varying.interpolate?.type || 'perspective'}, ${varying.interpolate?.sampling || 'center'}) ${name}: ${varying.type},\n`;
        }
        return result;
    }

    static create(options: ShaderConfig, defines: ShaderDefines) {
        const shader = new Shader(options.name || 'unnamed');
        const bindings = shader.bindings;
        
        if (options.builtins) {
            for (let i = 0; i < options.builtins.length; i++) {
                const builtin = options.builtins[i];
                shader.addBuiltin(builtin);
            }
        }
        if (options.attributes) {
            for (let i = 0; i < options.attributes.length; i++) {
                const attribute = options.attributes[i];
                shader.addAttribute(attribute);
            }
        }

        if (options.varyings) {
            for (let i = 0; i < options.varyings.length; i++) {
                const varying = options.varyings[i];
                shader.addVarying(varying);
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


        return shader;
    }
}

export { Shader };