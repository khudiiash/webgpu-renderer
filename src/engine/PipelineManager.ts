import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { Shader } from "@/materials/shaders/Shader";
import { RenderState } from "@/renderer/RenderState";
import { hashPipelineState } from "@/util/webgpu";

export class PipelineManager {
  static init(device: GPUDevice) { PipelineManager.#instance = new PipelineManager(device); }
  static getInstance(): PipelineManager { return PipelineManager.#instance; }
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
    const group = PipelineManager.LAYOUT_GROUPS.GLOBAL;
    let binding = 0;
    const global = new BindGroupLayout(this.device, 'Global', 'Global', [
        new Binding(group, binding++, 'Global', 'Scene').uniform().visibility('vertex', 'fragment').var('scene', 'Scene'),
        new Binding(group, binding++, 'Global', 'Camera').uniform().visibility('vertex', 'fragment').var('camera', 'Camera'),
    ]);
    this.layouts.set('Global', global.layout);
    this.layoutDescriptors.set('Global', global);
  }

  private createMeshLayout() {
    const group = PipelineManager.LAYOUT_GROUPS.MESH;
    let binding = 0;
    const mesh = new BindGroupLayout(this.device, 'Mesh', 'Mesh', [
        new Binding(group, binding++, 'Mesh', 'MeshInstances').storage('read').visibility('vertex').var('mesh_instances', 'array<mat4x4f>'),
    ]);
    this.layouts.set('Mesh', mesh.layout);
    this.layoutDescriptors.set('Mesh', mesh);
  }

  private createStandardMaterialLayout() {
     let binding = 0;
     const group = PipelineManager.LAYOUT_GROUPS.MATERIAL;

     const standardMaterial = new BindGroupLayout(this.device, 'StandardMaterial', 'Material', [
        new Binding(group, binding++, 'Material', 'StandardMaterial').uniform().visibility('fragment').var('material', 'StandardMaterial'),

        new Binding(group, binding++, 'Material', 'DiffuseMap').texture().var('diffuse_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'NormalMap').texture().var('normal_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'AoMap').texture().var('ao_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'HeightMap').texture().var('height_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'SpecularMap').texture().var('specular_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'EmissiveMap').texture().var('emissive_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'SheenMap').texture().var('sheen_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'MetalnessMap').texture().var('metalness_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'RoughnessMap').texture().var('roughness_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'AlphaMap').texture().var('alpha_map', 'texture_2d<f32>'),
        new Binding(group, binding++, 'Material', 'TransmissionMap').texture().var('transmission_map', 'texture_2d<f32>'),

        new Binding(group, binding++, 'Material', 'DiffuseMapSampler').sampler().var('diffuse_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'NormalMapSampler').sampler().var('normal_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'AoMapSampler').sampler().var('ao_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'HeightMapSampler').sampler().var('height_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'SpecularMapSampler').sampler().var('specular_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'EmissiveMapSampler').sampler().var('emissive_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'SheenMapSampler').sampler().var('sheen_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'MetalnessMapSampler').sampler().var('metalness_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'RoughnessMapSampler').sampler().var('roughness_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'AlphaMapSampler').sampler().var('alpha_map_sampler', 'sampler'),
        new Binding(group, binding++, 'Material', 'TransmissionMapSampler').sampler().var('transmission_map_sampler', 'sampler'),
     ]);

      this.layouts.set('StandardMaterial', standardMaterial.layout);
      this.layoutDescriptors.set('StandardMaterial', standardMaterial);
  }

  createShaderModule(name: string, code: string): GPUShaderModule {
    const hash = btoa(code);
    if (!this.shaderModule.has(hash)) {
      this.shaderModule.set(hash, this.device.createShaderModule({ label: name, code }));
    }
    return this.shaderModule.get(hash)!;
  }

  createPipelineLayout(bindGroupLayouts: BindGroupLayout[]): GPUPipelineLayout {
    const hash = bindGroupLayouts.map(layout => layout.toString()).join('|');
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
    vertexBuffers?: GPUVertexBufferLayout[];
    format?: GPUTextureFormat
  }): GPURenderPipeline {
    const {
      shader,
      layout,
      renderState = new RenderState(),
      vertexBuffers = [],
      format = navigator.gpu.getPreferredCanvasFormat()
    } = params;

    const hash = hashPipelineState(shader, renderState);

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
        buffers: vertexBuffers || [],
      },
      fragment: fragmentModule ? {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{
          format: format,
          blend: renderState.getBlendState() as GPUBlendState
        }],
      } : undefined,
      primitive: renderState.getPrimitive(),
      depthStencil: renderState.getDepthStencil(),
    };

    const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
    this.pipelineCache.set(hash, pipeline);

    return pipeline;
  }

  createComputePipeline(_: {
    code: string;
    entryPoint: string;
    bindGroups?: GPUBindGroupLayout[];
  }): void {
    // TODO
  }
}