import { Mesh } from "@/core/Mesh";
import { Object3D } from "@/core/Object3D";
import { Scene } from "@/core/Scene";
import { Renderable } from "./Renderable";
import { Camera } from "@/camera/Camera";
import { ResourceManager } from "@/engine/ResourceManager";
import { EventCallback, EventEmitter } from "@/core/EventEmitter";
import { Color } from "@/math/Color";

interface RenderPassDescriptor extends GPURenderPassDescriptor {
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
}

export class Renderer extends EventEmitter {
    public device!: GPUDevice;
    public context!: GPUCanvasContext;
    public format!: GPUTextureFormat;
    public canvas: HTMLCanvasElement;
    private renderables: WeakMap<Object3D, Renderable> = new WeakMap();
    private renderPassDescriptor!: RenderPassDescriptor;
    public width: number = 0;
    public height: number = 0;
    public aspect: number = 0;
    resources!: ResourceManager;

    static #instance: Renderer;

    static on(event: string, listener: EventCallback, context?: any) {
        Renderer.#instance?.on(event, listener, context);
    }

    static off(event: string, listener: EventCallback) {
        Renderer.#instance?.off(event, listener);
    }

    static fire(event: string, data: any) {
        Renderer.#instance?.fire(event, data);
    }

    static getInstance(): Renderer | null {
        if (!Renderer.#instance) {
            return null;
        }
        return Renderer.#instance;
    }

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        Renderer.#instance = this;
    }

    public async init(): Promise<Renderer> {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported in this browser.");
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("Failed to get GPU adapter.");
        }
        this.device = await adapter.requestDevice();
        if (!this.device) {
            throw new Error("Failed to get GPU device.");
        }

        const canvas = this.canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.aspect = this.width / this.height;

        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                const target = entry.target as HTMLCanvasElement;
                target.width = inlineSize * Math.min(window.devicePixelRatio, 2);
                target.height = blockSize * Math.min(window.devicePixelRatio, 2);
                target.width = Math.max(1, Math.min(target.width, this.device.limits.maxTextureDimension2D));
                target.height = Math.max(1, Math.min(target.height, this.device.limits.maxTextureDimension2D));
                this.width = target.width;
                this.height = target.height;
                this.aspect = this.width / this.height;
                this.fire('resize', { width: this.width, height: this.height, aspect: this.aspect });
                this.onResize();
            }
        });
        
        observer.observe(this.canvas);
        return this;
    }

    onResize() {
        this.resources.createDepthTexture('depth', this.width, this.height);
        this.initRenderPassDescriptor();
    }

    setResources(resources: ResourceManager) {
        this.resources = resources;
        this.resources.createDepthTexture('depth', this.canvas.width, this.canvas.height);
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
                    clearValue: [0.4, 0.5, 0.5, 1],
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

    updateClearValue(color: Color) {
        this.renderPassDescriptor.colorAttachments[0].clearValue = color;
    }


    public render(scene: Scene, camera: Camera) {
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        if (!this.renderPassDescriptor) {
            this.initRenderPassDescriptor();
        }

        this.updateTextureView(textureView);
        this.updateClearValue(scene.backgroundColor);

        const pass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        this.draw(scene, camera, pass);
        pass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}