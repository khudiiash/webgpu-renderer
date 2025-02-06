import { Renderer } from '@/renderer/Renderer';
import { Scene } from '@/core/Scene';
import { Camera } from '@/camera/Camera';
import { PipelineManager, ResourceManager } from '@/engine';

export abstract class RenderPass {
    renderer: Renderer;
    inputs: GPUTexture[] = [];
    outputs: GPUTexture[] = [];

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    public abstract init(resources: ResourceManager, pipelines: PipelineManager): void;

    /**
     * Execute this render pass.
     * @param scene The scene to render.
     * @param camera The camera used for rendering.
     * @param commandEncoder The GPUCommandEncoder used to record rendering commands.
     */
    public abstract execute(
        scene: Scene,
        camera: Camera,
        commandEncoder: GPUCommandEncoder,
    ): void;
}