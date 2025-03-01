import { Camera } from "@/camera";
import { Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data";
import { Struct } from "@/data/Struct";
import { Shader } from "@/materials/shaders/Shader";

export class BloomPass extends RenderPass {
    uniform!: UniformData;

    public init(): this {
        const struct = new Struct("BloomConfig", {
            threshold: "f32",
            intensity: "f32",
            radius: "f32",
            falloff: "f32",
        });
        this.layouts = [
            new BindGroupLayout(this.device, "Bloom", "Global", [
                new Binding("InputTexture").texture().var("input_texture", "texture_2d<f32>"),
                new Binding("Camera").uniform().var("camera", "Camera"),
                new Binding("BloomConfig").uniform().var("config", "BloomConfig"),
                new Binding("Sampler").sampler().var("sampler_color", "sampler"),
            ]),
        ];

        const shader = new Shader({
            name: "Bloom",
            layouts: this.layouts,
            chunks: ["Quad", "Bloom"],
            varyings: [{ name: "uv", type: "vec2f", location: 0 }],
        });

        const layout = this.pipelines.createPipelineLayout(this.layouts);
        this.pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout,
            targets: [{ format: this.renderer.format }],
        });
        return this;
    }
    private createBindGroups(camera: Camera) {
        this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
            InputTexture: this.inputs.get("shaded_texture") as GPUTexture,
            Camera: camera.uniforms.get("Camera")!,
            BloomConfig: this.uniform,
            Sampler: this.resources.defaultSampler,
        });
    }
    public beforeRender(): this {
        return this;
    }
    public afterRender(): this {
        return this;
    }
    public execute(encoder: GPUCommandEncoder, scene?: Scene, camera?: Camera): this {
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.renderer.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        });
        this.createBindGroups(camera!);
        pass.setPipeline(this.pipeline as GPURenderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();
        return this;
    }
}
