import { ShaderLibrary } from "./ShaderLibrary";
import { TemplateProcessor } from "./TemplateProcessor";
import { ShaderFormatter } from "./ShaderFormatter";
import { Binding } from "@/data/Binding";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { ShaderChunk } from "./ShaderChunk";
import { hashString } from "@/util";

export type ShaderVarying = {
    name: string;
    type: string;
    location?: number;
    interpolate?: { type: 'flat' | 'perspective' | 'linear', sampling?: 'center' | 'centroid' | 'sample' | 'first' | 'either' }
}

export type ShaderAttribute = {
    name: string;
    type: string;
    location?: number;
}

export type ShaderOutput = {
    location: number;
    name: string;
    type: string;
}

export type ShaderDefines = {
    [key: string]: boolean
};

export type ShaderConfig = {
    name?: string;
    attributes?: ShaderAttribute[];
    varyings?: ShaderVarying[];
    chunks?: (string | ShaderChunk)[];
    outputs?: ShaderOutput[];
    vertex?: string;
    fragment?: string;
    compute?: string;
    defines?: ShaderDefines;
    layouts?: BindGroupLayout[];
}

class Shader {
    static cache: Map<string, Shader> = new Map();
    static DEFAULTS = {
        VERTEX: `
            @vertex(input) -> output {
                {{vertex}}
                return output;
            }
        `,
        FRAGMENT: `
            @fragment(input) -> output {
                {{fragment}}
                return output;
            }
        `,
        COMPUTE: `
            @compute(input) -> output {
                {{compute}}
                return output;
            }
        `,

        OUTPUTS: [
            { location: 0, name: 'color', type: 'vec4f' }
        ],

        ATTRIBUTES: [
            { name: 'position', type: 'vec3f' },
            { name: 'normal', type: 'vec3f' },
            { name: 'uv', type: 'vec2f' },
        ],

        VARYINGS: [
            { name: 'position', type: 'vec4f' },
            { name: 'normal', type: 'vec3f' },
            { name: 'uv', type: 'vec2f' },
        ]
    }
    name!: string;
    formatter!: ShaderFormatter;
    processor!: TemplateProcessor;
    vertexSource!: string;
    fragmentSource!: string;
    computeSource!: string;
    attributes!: Map<string, ShaderAttribute>;
    varyings!: Map<string, ShaderVarying>;
    outputs!: Map<string, ShaderOutput>;
    options: ShaderConfig = {}
    defines!: Map<string, boolean>;
    chunks: Set<ShaderChunk> = new Set();
    layouts: BindGroupLayout[] = [];

    BUILTIN_VERTEX_ATTRIBUTES = [
        { name: 'vertex_index', type: 'u32' },
    ];
    isCompute: boolean = false;
    
    constructor(options: ShaderConfig) {
        const cache = hashString(JSON.stringify(options));
        if (Shader.cache.has(cache)) {
            console.log('Using cached shader');
            return Shader.cache.get(cache) as Shader;
        }
        Shader.cache.set(cache, this);
        this.name = options.name || 'Shader';
        this.formatter = new ShaderFormatter();
        this.processor = new TemplateProcessor();
        this.attributes = new Map();
        this.varyings = new Map();
        this.outputs = new Map();
        this.defines = new Map();
        this.options = options;
        this.isCompute = !!options.compute;

        const chunks = options.chunks || [];
        const attributes = options.attributes || [];
        const varyings = options.varyings || [];
        const outputs = options.outputs || Shader.DEFAULTS.OUTPUTS;
        const defines = options.defines || {};

        for (let chunk of chunks) {
            if (typeof chunk === 'string') {
                chunk = ShaderLibrary.getChunk(chunk) as ShaderChunk;
                if (!chunk) continue;
            }
            this.chunks.add(chunk);
        }
        for (const attribute of attributes) {
            this.attributes.set(attribute.name, attribute);
        }

        for (const varying of varyings) {
            this.varyings.set(varying.name, varying);
        }

        for (const output of outputs) {
            this.outputs.set(output.name, output);
        }

        for (const define of Object.keys(defines)) {
            this.defines.set(define, defines[define]);
        }

        this.layouts = this.options.layouts || [];

        this.build();
    }

    setDefines(defines: Record<string, boolean>) {
        this.defines = new Map(Object.entries(defines));
        this.build();
    }

    addChunk(chunk: ShaderChunk | string) {
        if (typeof chunk === 'string') {
            const c = ShaderLibrary.getChunk(chunk);
            if (!c) {
                console.error(`Chunk ${chunk} not found`);
                return;
            }

            this.chunks.add(c);
        } else if (chunk instanceof ShaderChunk) {
            this.chunks.add(chunk);
        } else {
            console.error('Invalid chunk type');
        }
        return this;
    }


    removeChunk(chunk: ShaderChunk | string) {
        if (typeof chunk === 'string') {
            const c = ShaderLibrary.getChunk(chunk);
            if (!c) {
                console.error(`Chunk ${chunk} not found`);
                return;
            }

            this.chunks.delete(c);
        } else if (chunk instanceof ShaderChunk) {
            this.chunks.delete(chunk);
        } else {
            console.error('Invalid chunk type');
        }

        return this;
    }

    build() {
        const chunks = Array.from(this.chunks);
        const varyings = this.generateVaryings();
        const attributes = this.generateAttributes();
        const outputs = this.generateOutputs();
        const defines = this.defines;
        const layouts = this.layouts;

        if (this.isCompute) {
            // TODO
            return;
        } 


        const templateV = this.options.vertex || Shader.DEFAULTS.VERTEX;
        this.vertexSource = ShaderFormatter.format(
            TemplateProcessor.processTemplate(`
                    struct VertexInput {
                        @builtin(vertex_index) vertex_index: u32,
                        @builtin(instance_index) instance_index: u32,
                        ${attributes}
                    }; 

                    struct VertexOutput {
                        @builtin(position) clip: vec4f,
                        ${varyings}
                    };

                    ${templateV}
                `,
                layouts,
                chunks,
                defines,
            )
        );

        if (!this.verify(this.vertexSource)) {
            console.error('Vertex shader failed to compile');
            debugger
        }

        const templateF = this.options.fragment || Shader.DEFAULTS.FRAGMENT;
        this.fragmentSource = ShaderFormatter.format(
            TemplateProcessor.processTemplate(`
                    struct FragmentInput {
                        @builtin(position) clip: vec4f,
                        @builtin(front_facing) front_facing: bool,
                        ${varyings}
                    };

                    struct FragmentOutput {
                        ${outputs}
                    };

                    ${templateF}
                `,
                layouts,
                chunks,
                defines,
            )
        );
        if (!this.verify(this.fragmentSource)) {
            console.error('Fragment shader failed to compile');
            debugger
        }

    }

    addVarying(varying: ShaderVarying) {
        this.varyings.set(varying.name, varying);
        return this;
    }

    addAttribute(attribute: ShaderAttribute) {
        this.attributes.set(attribute.name, attribute);
        return this;
    }

    addOutput(output: ShaderOutput) {
        this.outputs.set(output.name, output);
        return this;
    }


    generateAttributes(): string {
        let result = '';
        for (const [name, attribute] of this.attributes) {
            result += `@location(${attribute.location}) ${name}: ${attribute.type},\n`;
        }
        return result;
    }

    generateOutputs(): string {
        let result = '';
        for (const output of this.outputs.values()) {
            result += `@location(${output.location}) ${output.name}: ${output.type},\n`;
        }
        return result;
    }

    generateVaryings() {
        let result = '';
        for (const [name, varying] of this.varyings) {

            if (varying.interpolate) {
                const { interpolate } = varying;
                let { type, sampling } = interpolate;
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

            result += `@location(${varying.location}) @interpolate(${varying.interpolate?.type || 'perspective'}, ${varying.interpolate?.sampling || 'center'}) ${name}: ${varying.type},\n`;
        }
        return result;
    }

    setAttributes(attributes: ShaderAttribute[]) {
        this.attributes.clear();
        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }

        this.vertexSource = this.vertexSource.replace(/struct VertexInput {[\s\S]*?};/, '');
        const attributesString = this.generateAttributes();
        this.vertexSource = ShaderFormatter.format(`struct VertexInput { 
            @builtin(vertex_index) vertex_index: u32,
            @builtin(instance_index) instance_index: u32,
            ${attributesString} 
        }; \n${this.vertexSource}`);
    }

    // setDefines(defines: Record<string, boolean>) {
    //     this.defines = defines;
    //     this.vertexSource = ShaderFormatter.format(TemplateProcessor.processDefines(defines, this.vertexSource));
    //     this.fragmentSource = ShaderFormatter.format(TemplateProcessor.processDefines(defines, this.fragmentSource));
    //     this.computeSource = ShaderFormatter.format(TemplateProcessor.processDefines(defines, this.computeSource));
    // }

    setVaryings(varyings: ShaderVarying[]) {
        this.varyings.clear();
        for (const varying of varyings) {
            this.addVarying(varying);
        }

        this.vertexSource = this.vertexSource.replace(/struct VertexOutput {[\s\S]*?};/, '');
        this.fragmentSource = this.fragmentSource.replace(/struct FragmentInput {[\s\S]*?};/, '');

        const varyingsString = this.generateVaryings();
        this.vertexSource = ShaderFormatter.format(`struct VertexOutput { 
            @builtin(position) clip: vec4f,
            ${varyingsString} 
        }; \n${this.vertexSource}`);
        this.fragmentSource = ShaderFormatter.format(`struct FragmentInput { 
            @builtin(position) clip: vec4f,
            @builtin(front_facing) front_facing: bool,
            ${varyingsString} 
        }; \n${this.fragmentSource}`);
    }


    verify(source: string) {
        return !/undefined|\[Object/.test(source);
    }



}

export { Shader };