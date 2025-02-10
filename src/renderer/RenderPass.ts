import { Renderer } from '@/renderer/Renderer';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { PipelineManager, ResourceManager } from '@/engine';
import { BindGroupLayout } from '@/data/BindGroupLayout';

export abstract class RenderPass {
    renderer: Renderer;
    device: GPUDevice;
    inputs: Map<string, GPUTexture | GPUBuffer> = new Map();
    outputs: Map<string, GPUTexture | GPUBuffer> = new Map();
    resources: ResourceManager;
    pipelines: PipelineManager;
    pipeline!: GPURenderPipeline | GPUComputePipeline;
    bindGroup!: GPUBindGroup;
    layouts: BindGroupLayout[];

    constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.device = renderer.device;
        this.resources = renderer.resources;
        this.pipelines = renderer.pipelines;
        this.layouts = [];
    }

    public abstract init(): this;

    /**
     * Execute this render pass.
     * @param scene The scene to render.
     * @param camera The camera used for rendering.
     * @param commandEncoder The GPUCommandEncoder used to record rendering commands.
     */
    public abstract execute(
        encoder: GPUCommandEncoder,
        scene?: Scene,
        camera?: Camera,
    ): this;
}