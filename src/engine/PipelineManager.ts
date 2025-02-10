import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { Shader } from "@/materials/shaders/Shader";
import { RenderState } from "@/renderer/RenderState";
import { hashPipelineState } from "@/util/webgpu";

export class PipelineManager {
  static init(device: GPUDevice) { PipelineManager.#instance = new PipelineManager(device); }
  static getInstance(): PipelineManager { return PipelineManager.#instance; }

  static getGroupByName(name: string): number {
    return PipelineManager.LAYOUT_GROUPS[name.toUpperCase() as keyof typeof PipelineManager.LAYOUT_GROUPS];
  }
  static readonly LAYOUT_GROUPS = { GLOBAL: 0, MESH: 1, MATERIAL: 2, OTHER: 3, } as const;
  static #instance: PipelineManager;

  private device!: GPUDevice;
  private shaderModule!: Map<string, GPUShaderModule>;
  private pipelineCache!: Map<string, GPURenderPipeline>;
  private pipelineLayoutCache!: Map<string, GPUPipelineLayout>;
  private layouts: Map<string, GPUBindGroupLayout> = new Map();
  private layoutDescriptors: Map<string, BindGroupLayout> = new Map();


  constructor(device: GPUDevice) {
    if (PipelineManager.#instance) {
      return PipelineManager.#instance;
    }
    this.device = device;
    this.shaderModule = new Map();
    this.pipelineCache = new Map();
    this.pipelineLayoutCache = new Map();
    PipelineManager.#instance = this;
    this.createDefaultLayouts();
  }

  private createDefaultLayouts() {
    this.layouts = new Map();
    this.createGlobalLayout();
    this.createMeshLayout();
    this.createStandardMaterialLayout();
  }

  private createGlobalLayout(): void {
    const global = new BindGroupLayout(this.device, 'Global', 'Global', [
        new Binding('Scene').uniform().visibility('vertex', 'fragment').var('scene', 'Scene'),
        new Binding('Camera').uniform().visibility('vertex', 'fragment').var('camera', 'Camera'),
    ]);
    this.addBindGroupLayout(global);
  }

  private createMeshLayout() {
    const mesh = new BindGroupLayout(this.device, 'Mesh', 'Mesh', [
        new Binding('MeshInstances').storage('read').visibility('vertex').var('mesh_instances', 'array<mat4x4f>'),
    ]);
    this.addBindGroupLayout(mesh);
  }

  private createStandardMaterialLayout() {
     const standardMaterial = new BindGroupLayout(this.device, 'StandardMaterial', 'Material', [
        new Binding('StandardMaterial').uniform().visibility('fragment').var('material', 'StandardMaterial'),
        new Binding('DiffuseMap').texture().var('diffuse_map', 'texture_2d<f32>'),
        new Binding('NormalMap').texture().var('normal_map', 'texture_2d<f32>'),
        new Binding('AoMap').texture().var('ao_map', 'texture_2d<f32>'),
        new Binding('HeightMap').texture().var('height_map', 'texture_2d<f32>'),
        new Binding('SpecularMap').texture().var('specular_map', 'texture_2d<f32>'),
        new Binding('EmissiveMap').texture().var('emissive_map', 'texture_2d<f32>'),
        new Binding('SheenMap').texture().var('sheen_map', 'texture_2d<f32>'),
        new Binding('MetalnessMap').texture().var('metalness_map', 'texture_2d<f32>'),
        new Binding('RoughnessMap').texture().var('roughness_map', 'texture_2d<f32>'),
        new Binding('AlphaMap').texture().var('alpha_map', 'texture_2d<f32>'),
        new Binding('TransmissionMap').texture().var('transmission_map', 'texture_2d<f32>'),

        new Binding('DiffuseMapSampler').sampler().var('diffuse_map_sampler', 'sampler'),
        new Binding('NormalMapSampler').sampler().var('normal_map_sampler', 'sampler'),
        new Binding('AoMapSampler').sampler().var('ao_map_sampler', 'sampler'),
        new Binding('HeightMapSampler').sampler().var('height_map_sampler', 'sampler'),
        new Binding('SpecularMapSampler').sampler().var('specular_map_sampler', 'sampler'),
        new Binding('EmissiveMapSampler').sampler().var('emissive_map_sampler', 'sampler'),
        new Binding('SheenMapSampler').sampler().var('sheen_map_sampler', 'sampler'),
        new Binding('MetalnessMapSampler').sampler().var('metalness_map_sampler', 'sampler'),
        new Binding('RoughnessMapSampler').sampler().var('roughness_map_sampler', 'sampler'),
        new Binding('AlphaMapSampler').sampler().var('alpha_map_sampler', 'sampler'),
        new Binding('TransmissionMapSampler').sampler().var('transmission_map_sampler', 'sampler'),
     ]);

     this.addBindGroupLayout(standardMaterial);
  }

  addBindGroupLayout(layout: BindGroupLayout): void {
    this.layouts.set(layout.name, layout.layout);
    this.layoutDescriptors.set(layout.name, layout);
  }

  getBindGroupLayoutDescriptor(name: string): BindGroupLayout {
    return this.layoutDescriptors.get(name)!;
  }

  createShaderModule(name: string, code: string): GPUShaderModule {
    const hash = btoa(code);
    if (!this.shaderModule.has(hash)) {
      this.shaderModule.set(hash, this.device.createShaderModule({ label: name, code }));
    }
    return this.shaderModule.get(hash)!;
  }

  createPipelineLayout(bindGroupLayouts: BindGroupLayout[]): GPUPipelineLayout {
    const hash = bindGroupLayouts.map(layout => layout.id).join('|');
    console.log(hash);
    if (!this.pipelineLayoutCache.has(hash)) {
      this.pipelineLayoutCache.set(
        hash,
        this.device.createPipelineLayout({
          bindGroupLayouts: bindGroupLayouts.map(bgl => bgl.layout)
        })
      );
    } 
    return this.pipelineLayoutCache.get(hash)!;
  }

  createRenderPipeline(params: {
    shader: Shader,
    renderState?: RenderState,
    layout?: GPUPipelineLayout;
    vertexLayouts?: GPUVertexBufferLayout[];
    targets?: GPUColorTargetState[]
  }): GPURenderPipeline {
    let {
      shader,
      layout,
      vertexLayouts = [],
      targets = [],
      renderState
    } = params;

    renderState = renderState || RenderState.DEFAULT;
    const hash = hashPipelineState(shader, renderState, targets, vertexLayouts);

    if (this.pipelineCache.has(hash)) {
      return this.pipelineCache.get(hash)!;
    }

    const vertexModule = this.createShaderModule('vs_' + shader.name, shader.vertexSource);
    const fragmentModule = shader.fragmentSource
      ? this.createShaderModule('fs_' + shader.name, shader.fragmentSource)
      : undefined;

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: shader.name,
      layout: layout || 'auto',
      vertex: {
        module: vertexModule,
        buffers: vertexLayouts || [],
      },
      fragment: fragmentModule ? {
        module: fragmentModule,
        targets: targets,
      } : undefined,
      primitive: renderState.getPrimitive(),
    };

    if (params.renderState?.depthWrite === true) {
      pipelineDescriptor.depthStencil = renderState.getDepthStencil();
    }

    const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
    this.pipelineCache.set(hash, pipeline);

    return pipeline;
  }

  createComputePipeline(params: {
    shader: Shader,
    name?: string,
    layout?: GPUPipelineLayout,
  }): GPUComputePipeline {
    return this.device.createComputePipeline({
      label: params.name || params.shader.name || 'ComputePipeline',
      compute: {
        module: this.createShaderModule('cs_' + params.shader.name, params.shader.computeSource),
      },
      layout: params.layout || 'auto',
    });
  }
}