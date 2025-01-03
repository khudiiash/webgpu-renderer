// Types for pipeline configuration
/**
 * @typedef {{
 *      code: string,
 *      entryPoint: string
 * }} ShaderConfig
 * 
 * @typedef {{
 *    format: GPUVertexFormat,
 *    offset: number,
 *    shaderLocation: number
 * }} VertexAttribute
 * 
 * @typedef {{
 *  arrayStride: number,
 *  attributes: VertexAttribute[],
 *  stepMode?: GPUVertexStepMode
 * }} VertexBufferLayout
 * 
 * @typedef {{
 *     name: string,
 *     vertex: ShaderConfig,
 *     fragment?: ShaderConfig,
 *     primitive?: {
 *          topology: GPUPrimitiveTopology,
 *          cullMode?: GPUCullMode,
 *          frontFace?: GPUFrontFace
 *      },
 *      depthStencil?: {
 *          format: GPUTextureFormat,
 *          depthWriteEnabled: boolean,
 *          depthCompare: GPUCompareFunction
 *      },
 *      vertex_buffers?: VertexBufferLayout[],
 *      colorTargets?: {
 *          format: GPUTextureFormat,
 *          blend?: GPUBlendState
 *      }[],
 *      bindGroups?: GPUBindGroupLayout[]
 * }} PipelineDescriptor
 * 
 * @typedef {{
 *   binding: number,
 *   visibility: GPUShaderStage,
 *   buffer?: {
 *     type?: 'uniform' | 'storage' | 'readonly-storage',
 *     hasDynamicOffset?: boolean,
 *     minBindingSize?: number
 *   },
 *   sampler?: {
 *     type?: 'filtering' | 'non-filtering' | 'comparison',
 *   },
 *   texture?: {
 *     sampleType?: 'float' | 'depth',
 *     viewDimension?: '1d' | '2d' | '2d-array' | '3d' | 'cube' | 'cube-array',
 *     multisampled?: boolean,
 *   },
 *   storageTexture?: {
 *    access?: 'read-only' | 'write-only',
 *    format?: GPUTextureFormat,
 *    viewDimension?: '1d' | '2d' | '2d-array' | '3d',
 *    multisampled?: boolean,
 *   },
 * 
 * }} GPUBindGroupEntry
 *   
 * @typedef {{
 *    label?: string,
 *    entries: GPUBindGroupEntry[]
 * }} BindGroupLayoutDescriptor
 * 
 */



// Hash function for pipeline state
function hashPipelineState(desc) {
    return JSON.stringify({
        vertex: desc.vertex,
        fragment: desc.fragment,
        primitive: desc.primitive,
        depthStencil: desc.depthStencil,
        vertex_buffers: desc.vertex_buffers,
        colorTargets: desc.colorTargets
    });
}

class PipelineManager {
    static #instance = null;
    static getInstance() {
        if (!PipelineManager.#instance) {
            throw new Error('PipelineManager has not been initialized'); 
        }
        return PipelineManager.#instance;
    }

    device = null;
    shaderModule = new Map();
    pipelineCache = new Map();
    bindGroupLayoutCache = new Map();
    pipelineLayoutCache = new Map();

    /**
     * @param {GPUDevice} device 
     */
    constructor(device) {
        if (PipelineManager.#instance) {
            return PipelineManager.#instance;
        }
        this.device = device;
        this.shaderModule = new Map();
        this.pipelineCache = new Map();
        this.bindGroupLayoutCache = new Map();
        this.pipelineLayoutCache = new Map();
        PipelineManager.#instance = this
        PipelineManager.createDefaultLayouts(device);
    }

    static LAYOUT_GROUPS = {
        GLOBAL: 0,
        MODEL: 1,
        MATERIAL: 2
    };

    static getDefaultBindGroupLayout(group) {
        const { GLOBAL, MODEL, MATERIAL } = PipelineManager.LAYOUT_GROUPS;
        switch (group) {
            case GLOBAL: return PipelineManager.layouts.global.layout;
            case MODEL: return PipelineManager.layouts.model.layout;
            case MATERIAL: return PipelineManager.layouts.material.layout;
        }
    }
        
    static createDefaultLayouts(device) {
        const global = {
            group: 0,
            entries: [
                {
                    binding: 0, // Scene
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 1, // Camera
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
            ]
        };

        const model = {
            group: 1,
            entries: [
                {
                    binding: 0, // Model
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        };

        const material = {
            group: 2,
            entries: [
                {
                    binding: 0, // Material
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 1, // Diffuse Texture
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2, // Linear Sampler
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
            ]
        };


        PipelineManager.layouts = {
            global: {
                group: 0,
                layout: device.createBindGroupLayout({
                        label: 'Global',
                        entries: global.entries            
                    }),
            },
            model: {
                group: 1,
                layout: device.createBindGroupLayout({
                    label: 'Model',
                    entries: model.entries
                }),
            },
            material: {
                group: 2,
                layout: device.createBindGroupLayout({
                    label: 'Material',
                    entries: material.entries
                }),
            }
        };            

    }

    /**
     *  Create a shader module from code
     *  @param {string} name
     *  @param {string} code
     * @returns {GPUShaderModule}
     * */
    createShaderModule(name, code) {
        const hash = btoa(code); // Simple hash for shader code
        if (!this.shaderModule.has(hash)) {
            this.shaderModule.set(hash, this.device.createShaderModule({ label: name, code }));
        }
        return this.shaderModule.get(hash);
    }

    /**
     * 
     * @param {import("./shaders/ShaderLibrary").Shader} shader 
     * @returns {BindGroupLayoutDescriptor}
     */
    createBindGroupLayoutDescriptor(shader) {
        const bindings = shader.bindings;
        const entries = []; 

        for (const [name, data] of bindings.entries()) {
            const entry = {
                label: name,
                binding: data.binding,
                visibility: data.visibility || (GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT)
            };
            if (data.buffer) {
                entry.buffer = {};
            }
            if (data.isTexture) {
                entry.texture = {};
            }
            if (data.isSampler) {
                entry.sampler = {};
            }

            entries.push(entry);
        }

        return {
            label: shader.name,
            entries
        };
    }

    /**
     * 
     * @param {string} name
     * @param {GPUBindGroupDescriptor} descriptor 
     * @returns {GPUBindGroupLayout}
     */
    createBindGroupLayout(descriptor) {
        const hash = JSON.stringify(descriptor);
        if (!this.bindGroupLayoutCache.has(hash)) {
            this.bindGroupLayoutCache.set(
                hash,
                this.device.createBindGroupLayout(descriptor)
            );
        }
        return this.bindGroupLayoutCache.get(hash);
    }

    /**
     * @param {GPUBindGroupLayout[]} bindGroupLayouts 
     * @returns {GPUPipelineLayout}
     */
    createPipelineLayout(bindGroupLayouts) {
        const hash = bindGroupLayouts.map(layout => layout.toString()).join('|');
        if (!this.pipelineLayoutCache.has(hash)) {
            this.pipelineLayoutCache.set(
                hash,
                this.device.createPipelineLayout({
                    bindGroupLayouts
                })
            );
        }
        return this.pipelineLayoutCache.get(hash);
    }


    /**
     * @param {{
     *  shader: Shader,
     *  layout: GPUPipelineLayout,
     *  vertexBuffers: GPUBuffer[]
     * }}
     * */
    createRenderPipeline({ material, layout, vertexBuffers }) {
        const shader = material.shader;
        const hash = hashPipelineState(shader);
        
        if (this.pipelineCache.has(hash)) {
            return this.pipelineCache.get(hash);
        }

        const vertexModule = this.createShaderModule('vs_' + shader.name, shader.vertexSource);
        const fragmentModule = shader.fragmentSource
            ? this.createShaderModule('fs_' + shader.name, shader.fragmentSource)
            : undefined;

        const pipelineDescriptor = {
            layout: layout || 'auto',
            vertex: {
                module: vertexModule,
                buffers: vertexBuffers || [], 
            },
            fragment: fragmentModule ? {
                module: fragmentModule,
                targets: [{ format: navigator.gpu.getPreferredCanvasFormat() } ] 
            } : undefined
        };

        const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
        this.pipelineCache.set(hash, pipeline);
        
        return pipeline;
    }

    // Helper method for creating common pipeline configurations
    /**
     * 
     * @param {{
     *     vertexShader: string,
     *     fragmentShader: string,
     *     colorFormat?: GPUTextureFormat,
     *     depthFormat?: GPUTextureFormat
     * }} params 
     * @returns {GPURenderPipeline}
     */
    createDefaultPipeline(params) {
        return this.createRenderPipeline({
            name: 'default',
            vertex: {
                code: params.vertexShader,
                entryPoint: 'main'
            },
            fragment: {
                code: params.fragmentShader,
                entryPoint: 'main'
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'ccw'
            },
            depthStencil: params.depthFormat ? {
                format: params.depthFormat,
                depthWriteEnabled: true,
                depthCompare: 'less'
            } : undefined,
            colorTargets: [{
                format: params.colorFormat || 'bgra8unorm',
                blend: {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    },
                    alpha: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    }
                }
            }]
        });
    }

    // Create a compute pipeline
    /**
     * @param {{
     *   code: string,
     *   entryPoint: string,
     *   bindGroups?: GPUBindGroupLayout[]
     * }} desc
     * @returns {GPUComputePipeline}
     */
    createComputePipeline(desc) {
        const module = this.createShaderModule(desc.code);
        
        return this.device.createComputePipeline({
            layout: desc.bindGroups 
                ? this.createPipelineLayout(desc.bindGroups)
                : 'auto',
            compute: {
                module,
                entryPoint: desc.entryPoint
            }
        });
    }

}

export { PipelineManager };