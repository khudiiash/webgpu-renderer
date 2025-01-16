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
    public width: number = 0;
    public height: number = 0;
    public aspect: number = 0;
    resources!: ResourceManager;
    private renderGraph!: RenderGraph;

    static #instance: Renderer;

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

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.aspect = this.width / this.height;

        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });

        this.renderGraph = new RenderGraph(this.device, this.context);

        // Add render targets
        this.renderGraph.addTexture({
            name: 'mainColor',
            format: this.format,
            width: this.width,
            height: this.height,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.renderGraph.addTexture({
            name: 'depth',
            format: 'depth32float',
            width: this.width,
            height: this.height,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.setupResizeObserver();
        return this;
    }

    private setupResizeObserver() {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                const dpr = Math.min(window.devicePixelRatio, 2);
                
                this.width = Math.min(inlineSize * dpr, this.device.limits.maxTextureDimension2D);
                this.height = Math.min(blockSize * dpr, this.device.limits.maxTextureDimension2D);
                this.canvas.width = Math.max(1, this.width);
                this.canvas.height = Math.max(1, this.height);
                this.aspect = this.width / this.height;

                this.renderGraph.resize(this.width, this.height);
                this.fire('resize', { width: this.width, height: this.height, aspect: this.aspect });
            }
        });
        
        observer.observe(this.canvas);
    }

    onResize() {
        this.resources.createDepthTexture('depth', this.width, this.height);
    }

    setResources(resources: ResourceManager) {
        this.resources = resources;
    }

    private draw(object: Object3D, camera: Camera, pass: GPURenderPassEncoder) {
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
        if (!this.renderGraph.verifyRequiredTextures(['mainColor', 'depth'])) {
            return;
        }
        
        this.renderGraph.clear();
    
        // Main render pass
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
    
            if (!mainColorView || !depthView) return;
    
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
    
            this.draw(scene, camera, renderPass);
            renderPass.end();
        });

        // Add presentation pass
        this.renderGraph.addPresentationPass('mainColor');
        
        // Execute the frame
        this.renderGraph.execute();
    }
}