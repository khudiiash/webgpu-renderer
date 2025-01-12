import { Mesh } from "@/core/Mesh";
import { Object3D } from "@/core/Object3D";
import { Scene } from "@/core/Scene";
import { Renderable } from "./Renderable";
import { Camera } from "@/camera/Camera";
import { ResourceManager } from "@/engine/ResourceManager";
import { EventCallback, EventEmitter } from "@/core/EventEmitter";
import { Color } from "@/math/Color";
import { RenderGraph } from './RenderGraph';

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
    private renderGraph!: RenderGraph;

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

        this.renderGraph = new RenderGraph(this.device);

        this.renderGraph.addTexture({
            name: 'mainColor',
            format: this.format,
            width: this.width,
            height: this.height,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });

        this.renderGraph.addTexture({
            name: 'depth',
            format: 'depth32float',
            width: this.width,
            height: this.height,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
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

    public render(scene: Scene, camera: Camera) {
        
        const mainColorTexture = this.renderGraph.getTexture('mainColor');
        const depthTexture = this.renderGraph.getTexture('depth');
        
        if (!mainColorTexture || !depthTexture) {
            console.error('Required textures not found');
            return;
        }
        
        this.renderGraph.clear();
    
        //  main render pass
        this.renderGraph.addPass({
            name: 'mainPass',
            colorAttachments: [{
                texture: 'mainColor',
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: scene.backgroundColor
            }],
            depthStencilAttachment: {
                texture: 'depth',
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0
            }
        }, (encoder: GPUCommandEncoder, resources: Map<string, GPUTextureView>) => {
            const mainColorView = resources.get('mainColor');
            const depthView = resources.get('depth');
    
            if (!mainColorView || !depthView) {
                console.error('Required texture views not found');
                return;
            }
    
            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: mainColorView,
                    clearValue: scene.backgroundColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
                depthStencilAttachment: {
                    view: depthView,
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                }
            });
    
            // Draw scene using existing draw method
            this.draw(scene, camera, renderPass);
            renderPass.end();
        });
    
        // Add presentation pass
        this.renderGraph.addPass({
            name: 'presentPass',
            colorAttachments: [{
                texture: 'mainColor',
                loadOp: 'load',
                storeOp: 'store'
            }]
        }, (encoder: GPUCommandEncoder, resources: Map<string, GPUTextureView>) => {
            const mainColorView = resources.get('mainColor');
            if (!mainColorView) {
                console.error('Main color view not found for presentation');
                return;
            }
        
            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 0, g: 0, b: 0, a: 1 }
                }]
            });
            renderPass.end();
        });
        
        this.renderGraph.execute();
    }
}