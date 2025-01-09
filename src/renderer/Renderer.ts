import { Mesh, Object3D, Scene } from "@/core";
import { Renderable } from ".";
import { Camera } from "@/camera";
import { ResourceManager } from "@/engine";

interface RenderPassDescriptor extends GPURenderPassDescriptor {
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
}

export class Renderer {
    public device!: GPUDevice;
    public context!: GPUCanvasContext;
    public format!: GPUTextureFormat;
    public canvas: HTMLCanvasElement;
    private renderables: WeakMap<Object3D, Renderable> = new WeakMap();
    private renderPassDescriptor!: RenderPassDescriptor;
    resources!: ResourceManager;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public async init(): Promise<Renderer> {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported in this browser.");
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("Failed to get GPU adapter.");
        }

        const canvas = this.canvas;

        this.device = await adapter.requestDevice();
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.format,
        });
        return this;
    }

    setResources(resources: ResourceManager) {
        this.resources = resources;
    }

    draw(object: Object3D, camera: Camera, pass: GPURenderPassEncoder) {
        if (object instanceof Mesh) {
            let renderable = this.renderables.get(object) ?? new Renderable(object);
            !this.renderables.has(object) && this.renderables.set(object, renderable);
            renderable.render(pass);
        }

        for (let child of object.children) {
            this.draw(child, camera, pass);
        }
    }
    private initRenderPassDescriptor() {
        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    // @ts-ignore
                    view: undefined, // Will be set later
                    clearValue: { r: 0.4, g: 0.5, b: 0.5, a: 1.0 },
                    loadOp: 'clear' as GPULoadOp,
                    storeOp: 'store' as GPUStoreOp,
                }
            ],
            depthStencilAttachment: {
                view: this.resources.getTextureView('depth') as GPUTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear' as GPULoadOp,
                depthStoreOp: 'store' as GPUStoreOp,
            }
        };
    }

    updateTextureView(textureView: GPUTextureView) {
        this.renderPassDescriptor.colorAttachments[0].view = textureView;
    }


    public render(scene: Scene, camera: Camera) {
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        if (!this.renderPassDescriptor) {
            this.initRenderPassDescriptor();
        }

        this.updateTextureView(textureView);

        const pass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        this.draw(scene, camera, pass);
        pass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}