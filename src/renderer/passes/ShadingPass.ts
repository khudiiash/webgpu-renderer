import { RenderPass } from "../RenderPass";
import { Shader, ShaderConfig } from "@/materials/shaders";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { Texture2D, UniformData } from "@/data";
import { Scene } from "@/core/Scene";
import { Camera } from "@/camera/Camera";

export class ShadingPass extends RenderPass {
    private renderPassDescriptor!: GPURenderPassDescriptor;
    circlesTexture!: Texture2D;

    public init(): this {
        // Create shader modules for a fullscreen quad
        const device = this.renderer.device;
        // this.createTextures();
        // this.renderer.on("resize", this.createTextures.bind(this));
        this.layouts = [
            new BindGroupLayout(device, "Shading", "Global", [
                new Binding("PositionTexture").texture().var("position_texture", "texture_2d<f32>"),
                new Binding("NormalTexture").texture().var("normal_texture", "texture_2d<f32>"),
                new Binding("AlbedoTexture").texture().var("albedo_texture", "texture_2d<f32>"),
                new Binding("PBRTexture").texture().var("pbr_texture", "texture_2d<f32>"),
                new Binding("DistanceTexture").texture().var("distance_texture", "texture_2d<f32>"),
                new Binding("ShadowTexture").texture({ sampleType: "depth" }).var("shadow_texture", "texture_depth_2d"),
                new Binding("Scene").uniform().visibility("fragment").var("scene", "Scene"),
                new Binding("Camera").uniform().visibility("fragment").var("camera", "Camera"),
                new Binding("Sampler").sampler().var("sampler_color", "sampler"),
                new Binding("SamplerDepth").sampler({ type: "comparison" }).var("sampler_depth", "sampler_comparison"),
            ]),
        ];

        const shaderConfig: ShaderConfig = {
            name: "ScreenSpaceShading",
            chunks: ["Noise", "Common", "Lighting", "Shadow", "Shading", "Quad"],
            layouts: this.layouts,
            varyings: [{ name: "uv", type: "vec2f", location: 0 }],
        };

        const shader = new Shader(shaderConfig);

        // Create pipeline layout
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);

        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            targets: [{ format: this.renderer.format }],
        });

        return this;
    }

    createBindGroup(scene: Scene, camera: Camera) {
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            PositionTexture: this.inputs.get("position_texture") as GPUTexture,
            NormalTexture: this.inputs.get("normal_texture") as GPUTexture,
            AlbedoTexture: this.inputs.get("albedo_texture") as GPUTexture,
            PBRTexture: this.inputs.get("pbr_texture") as GPUTexture,
            DistanceTexture: this.inputs.get("distance_texture") as GPUTexture,
            ShadowTexture: this.inputs.get("shadow_texture") as GPUTexture,
            Scene: scene.uniforms.get("Scene")!,
            Camera: camera.uniforms.get("Camera")!,
            Sampler: this.resources.defaultSampler,
            SamplerDepth: this.resources.getOrCreateSampler({ compare: "less" }),
        });
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;
    }

    createRenderPassDescriptor(scene: Scene) {
        this.renderPassDescriptor = {
            label: "ShadingPass",
            colorAttachments: [
                {
                    view: this.renderer.context.getCurrentTexture().createView(),
                    clearValue: scene.backgroundColor,
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

        //this.outputs.set("shaded_texture", this.shadedTexture);

        return this;
    }
}
