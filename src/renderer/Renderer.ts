import { Mesh } from "@/core/Mesh";
import { Object3D } from "@/core/Object3D";
import { Scene } from "@/core/Scene";
import { Renderable } from "./Renderable";
import { Camera } from "@/camera/Camera";
import { ResourceManager } from "@/engine/ResourceManager";
import { EventCallback, EventEmitter } from "@/core/EventEmitter";
import { RenderGraph } from "./RenderGraph";
import { GeometryPass } from "./passes/GeometryPass";
import { PipelineManager } from "@/engine";
import { ShadingPass } from "./passes/ShadingPass";
import { ProbeAllocationPass } from "./passes/ProbeAllocationPass";
import { DistanceFieldPassFrag } from "./passes/DistanceFieldPassFrag";
import { SkyPass } from "./passes/SkyPass";
import { ShadowPass } from "./passes/ShadowPass";
import { BloomPass } from "./passes/BloomPass";

export class Renderer extends EventEmitter {
    public device!: GPUDevice;
    public context!: GPUCanvasContext;
    public format!: GPUTextureFormat;
    public canvas: HTMLCanvasElement;
    public pipelines!: PipelineManager;
    public renderables: WeakMap<Object3D, Renderable> = new WeakMap();
    public width: number = 0;
    public height: number = 0;
    public aspect: number = 0;
    resources!: ResourceManager;

    static #instance: Renderer;
    private renderGraph!: RenderGraph;
    ready: boolean = false;

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
        this.device = await adapter.requestDevice({
            requiredFeatures: ["float32-filterable"],
        });
        if (!this.device) {
            throw new Error("Failed to get GPU device.");
        }

        this.renderGraph = new RenderGraph(this);

        const canvas = this.canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.aspect = this.width / this.height;

        this.context = canvas.getContext("webgpu") as GPUCanvasContext;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.format,
        });

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                const target = entry.target as HTMLCanvasElement;
                target.width = inlineSize * Math.min(window.devicePixelRatio, 1);
                target.height = blockSize * Math.min(window.devicePixelRatio, 1);
                target.width = Math.max(1, Math.min(target.width, this.device.limits.maxTextureDimension2D));
                target.height = Math.max(1, Math.min(target.height, this.device.limits.maxTextureDimension2D));
                this.width = target.width;
                this.height = target.height;
                this.aspect = this.width / this.height;
                this.fire("resize", { width: this.width, height: this.height, aspect: this.aspect });
                this.onResize();
            }
        });

        observer.observe(this.canvas);
        return this;
    }

    onResize() {
        if (!this.resources) {
            return;
        }
        //this.resources.createDepthTexture('depth', this.width, this.height);
        //this.initRenderPassDescriptor();
    }

    setResources(resources: ResourceManager) {
        this.resources = resources;
        this.pipelines = new PipelineManager(this.device);
        this.resources.createDepthTexture("depth", this.canvas.width, this.canvas.height);
        this.renderGraph.addPass(new GeometryPass(this).init());
        this.renderGraph.addPass(new ShadowPass(this).init());
        this.renderGraph.addPass(new DistanceFieldPassFrag(this).init());
        // this.renderGraph.addPass(new ProbeAllocationPass(this).init());
        this.renderGraph.addPass(new ShadingPass(this).init());
        //this.renderGraph.addPass(new BloomPass(this).init());
        //this.renderGraph.addPass(new ProbeVisualizationPass(this).init());

        this.ready = true;
    }

    createRenderable(mesh: Mesh): Renderable {
        if (this.renderables.has(mesh)) {
            return this.renderables.get(mesh) as Renderable;
        }
        const renderable = new Renderable(mesh);
        this.renderables.set(mesh, renderable);
        return renderable;
    }

    async render(scene: Scene, camera: Camera) {
        scene.update();

        if (!this.ready) {
            return;
        }

        await this.renderGraph.execute(scene, camera);
    }
}
