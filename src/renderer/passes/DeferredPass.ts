import { RenderPass } from "../RenderPass";
import { Shader, ShaderConfig } from "@/shaders";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { Texture2D, UniformData } from "@/data";
import { Scene } from "@/core/Scene";
import { Camera } from "@/camera/Camera";
import { Color } from "@/math";
import { RenderState } from "../RenderState";

export class DeferredPass extends RenderPass {
    private renderPassDescriptor!: GPURenderPassDescriptor;
    circlesTexture!: Texture2D;
    deferredTexture: GPUTexture;

    public init(): this {
        // Create shader modules for a fullscreen quad
        const device = this.renderer.device;
        this.createTextures();
        this.renderer.on("resize", this.createTextures.bind(this));
        this.layouts = [
            new BindGroupLayout(device, "Shading", "Global", [
                new Binding("PositionTexture").texture().var("position_texture", "texture_2d<f32>"),
                new Binding("DepthTexture").texture().var("depth_texture", "texture_2d<f32>"),
                new Binding("NormalTexture").texture().var("normal_texture", "texture_2d<f32>"),
                new Binding("AlbedoTexture").texture().var("albedo_texture", "texture_2d<f32>"),
                new Binding("PBRTexture").texture().var("pbr_texture", "texture_2d<f32>"),
                new Binding("PrevTexture").texture().var("prev_texture", "texture_2d<f32>"),
                new Binding("DistanceTexture").texture().var("distance_texture", "texture_2d<f32>"),
                new Binding("ShadowTexture").texture({ sampleType: "depth" }).var("shadow_texture", "texture_depth_2d"),
                new Binding("ShadowColor").texture().var("shadow_color", "texture_2d<f32>"),
                new Binding("Scene").uniform().visibility("fragment").var("scene", "Scene"),
                new Binding("Environment").textureCube().visibility("fragment").var("environment", "texture_cube<f32>"),
                new Binding("Camera").uniform().visibility("fragment").var("camera", "Camera"),
                new Binding("Sampler").sampler().var("sampler_color", "sampler"),
                new Binding("SamplerDepth").sampler({ type: "comparison" }).var("sampler_depth", "sampler_comparison"),
            ]),
        ];

        const shaderConfig: ShaderConfig = {
            name: "DeferredShader",
            chunks: ["Noise", "Common", "Lighting", "Shadow", "Deferred", "Quad"],
            layouts: this.layouts,
            varyings: [{ name: "uv", type: "vec2f", location: 0 }],
            outputs: [
                { name: "color", type: "vec4f", location: 0 },
                { name: "gi", type: "vec4f", location: 1 },
            ]
        };

        const shader = new Shader(shaderConfig);

        // Create pipeline layout
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);

        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            targets: [
                { format: this.renderer.format},
                { format: this.renderer.format}
            ],
        });

        return this;
    }

    createTextures() {
        if (this.prevGI) {
            this.prevGI.destroy();
        }
        this.prevGI = this.resources.createTexture("prev_gi_texture", {
            label: "PreviousFrame",
            size: { width: this.renderer.width, height: this.renderer.height },
            format: this.renderer.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
        });
        this.gi = this.resources.createTexture("gi_texture", {
            label: "GITexture",
            size: { width: this.renderer.width, height: this.renderer.height },
            format: this.renderer.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
        });

        this.deferredTexture = this.resources.createTexture("deferred_texture", {
            label: "DeferredTexture",
            size: { width: this.renderer.width, height: this.renderer.height },
            format: this.renderer.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
        });
    }

    createBindGroup(scene: Scene, camera: Camera) {
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            PositionTexture: this.inputs.get("position_texture") as GPUTexture,
            DepthTexture: this.inputs.get("depth_texture") as GPUTexture,
            NormalTexture: this.inputs.get("normal_texture") as GPUTexture,
            AlbedoTexture: this.inputs.get("albedo_texture") as GPUTexture,
            PBRTexture: this.inputs.get("pbr_texture") as GPUTexture,
            PrevTexture: this.prevGI,
            DistanceTexture: this.inputs.get("distance_texture") as GPUTexture,
            ShadowTexture: this.inputs.get("shadow_texture") as GPUTexture,
            ShadowColor: this.inputs.get("shadow_color") as GPUTexture,
            Scene: scene.uniforms.get("Scene")!,
            Environment: scene.environment,
            Camera: camera.uniforms.get("Camera")!,
            Sampler: this.resources.defaultSampler,
            SamplerDepth: this.resources.getOrCreateSampler({ compare: "less" }),
        });
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(scene: Scene, camera: Camera): this {
        camera.prevPosition.copy(camera.position);
        camera.prevViewProjection.copy(camera.matrixViewProjection);
        return this;
    }

    createRenderPassDescriptor(scene: Scene) {
        const backgroundColor = scene.background instanceof Color ? scene.background : new Color(0, 0, 0, 1);
        this.renderPassDescriptor = {
            label: "DeferredPass",
            colorAttachments: [
                {
                    view: this.deferredTexture.createView(),
                    clearValue: backgroundColor,
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.gi.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: "load",
                    storeOp: "store",
                },
            ],
        };
    }

    /**
     * Render a fullscreen quad using the color texture produced in the GeometryPass.
     */
    public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
        this.createBindGroup(scene, camera);
        this.createRenderPassDescriptor(scene);

        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        pass.setPipeline(this.pipeline as GPURenderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();

        for (const [key, value] of this.inputs.entries()) {
            this.outputs.set(key, value);
        }

        encoder.copyTextureToTexture(
            { texture: this.gi },
            { texture: this.prevGI },
            { width: this.renderer.width, height: this.renderer.height },
        );

        this.outputs.set("deferred_texture", this.deferredTexture);

        return this;
    }
}
