import { Material } from "@/materials";
import { RenderState } from "@/renderer/RenderState";

type ShaderConfig = {
    code: string;
    entryPoint: string;
  };
  
  type VertexAttribute = {
    format: GPUVertexFormat;
    offset: number;
    shaderLocation: number;
  };
  
  type VertexBufferLayout = {
    arrayStride: number;
    attributes: VertexAttribute[];
    stepMode?: GPUVertexStepMode;
  };
  
  type PipelineDescriptor = {
    name: string;
    vertex: ShaderConfig;
    fragment?: ShaderConfig;
    primitive?: {
      topology: GPUPrimitiveTopology;
      cullMode?: GPUCullMode;
      frontFace?: GPUFrontFace;
    };
    depthStencil?: {
      format: GPUTextureFormat;
      depthWriteEnabled: boolean;
      depthCompare: GPUCompareFunction;
    };
    vertex_buffers?: VertexBufferLayout[];
    colorTargets?: {
      format: GPUTextureFormat;
      blend?: GPUBlendState;
    }[];
    bindGroups?: GPUBindGroupLayout[];
  };
  
  type GPUBindGroupEntry = {
    binding: number;
    visibility: typeof GPUShaderStage;
    buffer?: {
      type?: 'uniform' | 'storage' | 'readonly-storage';
      hasDynamicOffset?: boolean;
      minBindingSize?: number;
    };
    sampler?: {
      type?: 'filtering' | 'non-filtering' | 'comparison';
    };
    texture?: {
      sampleType?: 'float' | 'depth';
      viewDimension?: '1d' | '2d' | '2d-array' | '3d' | 'cube' | 'cube-array';
      multisampled?: boolean;
    };
    storageTexture?: {
      access?: 'read-only' | 'write-only';
      format?: GPUTextureFormat;
      viewDimension?: '1d' | '2d' | '2d-array' | '3d';
      multisampled?: boolean;
    };
  };
  
  type BindGroupLayoutDescriptor = {
    label?: string;
    entries: GPUBindGroupEntry[];
  };
  
  type Layouts = {
    global: {
      group: number;
      layout: GPUBindGroupLayout;
    };
    model: {
      group: number;
      layout: GPUBindGroupLayout;
    };
    material: {
      group: number;
      layout: GPUBindGroupLayout;
    };
  };
  
  function hashPipelineState(desc: PipelineDescriptor): string {
    return JSON.stringify({
      vertex: desc.vertex,
      fragment: desc.fragment,
      primitive: desc.primitive,
      depthStencil: desc.depthStencil,
      vertex_buffers: desc.vertex_buffers,
      colorTargets: desc.colorTargets
    });
  }
  
export class PipelineManager {
    static #instance: PipelineManager;

    private device!: GPUDevice;
    private shaderModule!: Map<string, GPUShaderModule>;
    private pipelineCache!: Map<string, GPURenderPipeline>;
    private bindGroupLayoutCache!: Map<string, GPUBindGroupLayout>;
    private pipelineLayoutCache!: Map<string, GPUPipelineLayout>;
    private static layouts: Layouts;

    static init(device: GPUDevice) {
        if (PipelineManager.#instance) {
            throw new Error('PipelineManager has already been initialized');
        }
        PipelineManager.#instance = new PipelineManager(device);
    }

    static getInstance(): PipelineManager {
        if (!PipelineManager.#instance) {
            throw new Error('PipelineManager has not been initialized');
        }
        return PipelineManager.#instance;
    }
  
    static readonly LAYOUT_GROUPS = {
      GLOBAL: 0,
      MODEL: 1,
      MATERIAL: 2
    } as const;
  
    constructor(device: GPUDevice) {
      if (PipelineManager.#instance) {
        return PipelineManager.#instance;
      }
      this.device = device;
      this.shaderModule = new Map();
      this.pipelineCache = new Map();
      this.bindGroupLayoutCache = new Map();
      this.pipelineLayoutCache = new Map();
      PipelineManager.#instance = this;
      PipelineManager.createDefaultLayouts(device);
    }
  
  
    static getDefaultBindGroupLayout(group: number): GPUBindGroupLayout {
      const { GLOBAL, MODEL, MATERIAL } = PipelineManager.LAYOUT_GROUPS;
      switch (group) {
        case GLOBAL: return PipelineManager.layouts.global.layout;
        case MODEL: return PipelineManager.layouts.model.layout;
        case MATERIAL: return PipelineManager.layouts.material.layout;
        default: throw new Error(`Invalid group: ${group}`);
      }
    }
  
    private static createDefaultLayouts(device: GPUDevice): void {
      const global = {
        group: 0,
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {}
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {}
          },
        ]
      };
  
      const model = {
        group: 1,
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
          }
        ]
      };
  
      const material = {
        group: 2,
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {}
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {}
          },
          {
            binding: 2,
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
  
    createShaderModule(name: string, code: string): GPUShaderModule {
      const hash = btoa(code);
      if (!this.shaderModule.has(hash)) {
        this.shaderModule.set(hash, this.device.createShaderModule({ label: name, code }));
      }
      return this.shaderModule.get(hash)!;
    }
  
    createBindGroupLayoutDescriptor(shader: { name: string; bindings: Map<string, any> }): BindGroupLayoutDescriptor {
      const entries: GPUBindGroupEntry[] = [];
  
      for (const [name, data] of shader.bindings.entries()) {
        const entry: GPUBindGroupEntry = {
          binding: data.binding,
          visibility: data.visibility || (GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT)
        };
  
        if (data.buffer) entry.buffer = {};
        if (data.isTexture) entry.texture = {};
        if (data.isSampler) entry.sampler = {};
  
        entries.push(entry);
      }
  
      return {
        label: shader.name,
        entries
      };
    }
  
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout {
      const hash = JSON.stringify(descriptor);
      if (!this.bindGroupLayoutCache.has(hash)) {
        this.bindGroupLayoutCache.set(
          hash,
          this.device.createBindGroupLayout(descriptor)
        );
      }
      return this.bindGroupLayoutCache.get(hash)!;
    }
  
    createPipelineLayout(bindGroupLayouts: GPUBindGroupLayout[]): GPUPipelineLayout {
      const hash = bindGroupLayouts.map(layout => layout.toString()).join('|');
      if (!this.pipelineLayoutCache.has(hash)) {
        this.pipelineLayoutCache.set(
          hash,
          this.device.createPipelineLayout({
            bindGroupLayouts
          })
        );
      }
      return this.pipelineLayoutCache.get(hash)!;
    }
  
    createRenderPipeline(params: {
      material: Material;
      layout?: GPUPipelineLayout;
      vertexBuffers?: GPUVertexBufferLayout[];
    }): GPURenderPipeline {
      const { material, layout, vertexBuffers } = params;
      const shader = material.shader;
      const hash = hashPipelineState(shader as unknown as PipelineDescriptor);
  
      if (this.pipelineCache.has(hash)) {
        return this.pipelineCache.get(hash)!;
      }
  
      const vertexModule = this.createShaderModule('vs_' + shader.name, shader.vertexSource);
      const fragmentModule = shader.fragmentSource
        ? this.createShaderModule('fs_' + shader.name, shader.fragmentSource)
        : undefined;
  
      const pipelineDescriptor: GPURenderPipelineDescriptor = {
        layout: layout || 'auto',
        vertex: {
          module: vertexModule,
          entryPoint: 'main',
          buffers: vertexBuffers || [],
        },
        fragment: fragmentModule ? {
          module: fragmentModule,
          entryPoint: 'main',
          targets: [{ 
            format: navigator.gpu.getPreferredCanvasFormat(),
            blend: material.renderState.getBlendState()
          }],
        } : undefined,
        primitive: material.renderState.getPrimitive(),
        depthStencil: material.renderState.getDepthStencil(),
      };
  
      const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
      this.pipelineCache.set(hash, pipeline);
  
      return pipeline;
    }
  
    createDefaultPipeline(params: {
      vertexShader: string;
      fragmentShader: string;
      colorFormat?: GPUTextureFormat;
      depthFormat?: GPUTextureFormat;
    }): GPURenderPipeline {
      const desc: PipelineDescriptor = {
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
      };
  
      return this.createRenderPipeline({
        material: {
          shader: {
            name: desc.name,
            vertexSource: desc.vertex.code,
            fragmentSource: desc.fragment?.code,
          },
          renderState: {
            getBlendState: () => desc.colorTargets![0].blend!,
            getPrimitive: () => desc.primitive!,
            getDepthStencil: () => desc.depthStencil as GPUDepthStencilState
          }
        }
      });
    }
  
    createComputePipeline(desc: {
      code: string;
      entryPoint: string;
      bindGroups?: GPUBindGroupLayout[];
    }): GPUComputePipeline {
      const module = this.createShaderModule('compute', desc.code);
  
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