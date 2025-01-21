import { ShaderConfig, ShaderVarying, ShaderAttribute } from "./ShaderLibrary";
import { TemplateProcessor } from "./TemplateProcessor";
import { ShaderFormatter } from "./ShaderFormatter";
import { Binding } from "@/data/Binding";
import { BindGroupLayout } from "@/data/BindGroupLayout";

export type ShaderBinding = {
    group: number;
    binding: number;
    resource: unknown;
};

class Shader {
    name: string;
    formatter: ShaderFormatter;
    processor: TemplateProcessor;
    vertexSource!: string;
    fragmentSource!: string;
    computeSource!: string;
    attributes: Map<string, ShaderAttribute>;
    varyings: Map<string, ShaderVarying>;
    options: any;
    bindings: Binding[] = [];
    layouts: BindGroupLayout[] = [];
    
    constructor(name: string, options = {}) {
        this.name = name;
        this.formatter = new ShaderFormatter();
        this.processor = new TemplateProcessor();
        this.attributes = new Map();
        this.varyings = new Map();
        this.options = options;
    }

    addVarying(varying: ShaderVarying) {
        if (varying.interpolate) {
            const { interpolate } = varying;
            const { type, sampling } = interpolate;
            if (type === 'flat' && type && !['first', 'either'].includes(sampling as string)) {
                varying.interpolate.sampling = 'first';
                console.warn(`Invalid sampling mode for flat interpolation: ${varying.interpolate.sampling}. Using 'first' instead.`);
            }
            if (type !== 'flat' && type && ['first', 'either'].includes(sampling as string)) {
                varying.interpolate.sampling = 'center';
                console.warn(`Invalid sampling mode for ${varying.interpolate.type} interpolation: ${varying.interpolate.sampling}. Using 'center' instead.`);
            }
        } else {
            varying.interpolate = {
                type: 'perspective',
                sampling: 'center'
            };
        }
        this.varyings.set(varying.name, {
            name: varying.name,
            type: varying.type,
            location: varying.location,
            interpolate: varying.interpolate,
        });
    }

    addAttribute(attribute: ShaderAttribute) {
        this.attributes.set(attribute.name, attribute);
    }


    generateAttributes() {
        let result = '';
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

    static create(options: ShaderConfig) {
        const shader = new Shader(options.name || 'unnamed');
        const chunks = options.chunks || [];
        const bindings = new Set<Binding>();
        
        if (options.attributes) {
            for (let i = 0; i < options.attributes.length; i++) {
                const attribute = options.attributes[i];
                attribute.location = i;
                shader.addAttribute(attribute);
            }
        }

        if (options.varyings) {
            for (let i = 0; i < options.varyings.length; i++) {
                const varying = options.varyings[i];
                varying.location = i;
                shader.addVarying(varying);
            }
        }

        const varyings = shader.generateVaryings();
        const attributes = shader.generateAttributes();

        if (options.vertexTemplate) {
            shader.vertexSource = ShaderFormatter.format(
                TemplateProcessor.processTemplate(`
                    struct VertexInput {
                        @builtin(vertex_index) vertex_index: u32,
                        @builtin(instance_index) instance_index: u32,
                        ${attributes}
                    }; 

                    struct VertexOutput {
                        @builtin(position) position: vec4f,
                        ${varyings}
                    };

                    ${options.vertexTemplate}`,
                    chunks,
                    )
                );
            if (!shader.verify(shader.vertexSource)) {
                console.error('Vertex shader failed to compile');
            }
            for (const binding of TemplateProcessor.getBindings()) {
                bindings.add(binding);
            }
        }

        if (options.fragmentTemplate) {
            shader.fragmentSource = ShaderFormatter.format(
                TemplateProcessor.processTemplate(`
                    struct FragmentInput {
                        @builtin(position) position: vec4f,
                        @builtin(front_facing) front_facing: bool,
                        ${varyings}
                    };

                    struct FragmentOutput {
                        @location(0) color: vec4f,
                    };

                    ${options.fragmentTemplate}
                    `,
                    chunks,
                )
            );
            if (!shader.verify(shader.fragmentSource)) {
                console.error('Fragment shader failed to compile');
            }
            for (const binding of TemplateProcessor.getBindings()) {
                bindings.add(binding);
            }
        }
        shader.bindings = Array.from(bindings);
        shader.layouts = [...new Set(shader.bindings.map(binding => binding.getBindGroupLayout() as BindGroupLayout))];

        return shader;
    }

    verify(source: string) {
        return !/undefined|\[Object/.test(source);
    }


}

export { Shader };