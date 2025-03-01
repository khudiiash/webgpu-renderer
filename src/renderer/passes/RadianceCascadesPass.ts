import { BindGroupLayout } from "@/data/BindGroupLayout";
import { RenderPass } from "../RenderPass";
import { Shader } from "@/materials/shaders/Shader";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data";
import { Vector2 } from "@/math/Vector2";
import { Struct } from "@/data/Struct";

export class RadianceCascadesPass extends RenderPass {
  uniforms!: UniformData;

  public init(): this {
    const uniformsStruct = new Struct("RadianceCascadesUniforms", {
      renderExtent: "vec2f",
      cascadeIndex: "f32",
      cascadeCount: "f32",
      cascadeExtent: "vec2f",
      cascadeInterval: "f32",
      cascadeLinear: "f32",
    });

    this.uniforms = new UniformData(this, {
      isGlobal: true,
      name: "RadianceCascadesUniforms",
      struct: uniformsStruct,
      values: {
        renderExtent: new Vector2(this.renderer.width, this.renderer.height),
        cascadeIndex: 0,
        cascadeCount: 4,
        cascadeExtent: new Vector2(0.5, 0.5),
        cascadeInterval: 0.5,
        cascadeLinear: 0.5,
      },
    });

    const bindGroupLayout = new BindGroupLayout(this.device, "RadianceCascades", "Global", [
      new Binding("Uniforms").uniform().visibility("fragment").var("uniforms", "RadianceCascadesUniforms"),
      new Binding("SceneTexture").texture().var("scene_texture", "texture_2d<f32>"),
      new Binding("DistanceTexture").texture().var("distance_texture", "texture_2d<f32>"),
      new Binding("Sampler").sampler().var("sampler_color", "sampler"),
    ]);
    this.layouts = [bindGroupLayout];

    const shader = new Shader({
      name: "RadianceCascades",
      layouts: [bindGroupLayout],
      chunks: ["Common", "Quad", "RadianceCascades"],
      varyings: [{ name: "uv", type: "vec2f" }],
    });

    const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
    this.pipeline = this.pipelines.createRenderPipeline({
      shader,
      layout: pipelineLayout,
    });
    return this;
  }
  public beforeRender(): this {
    return this;
  }
  public afterRender(): this {
    return this;
  }
  public execute(encoder: GPUCommandEncoder): this {
    const bindGroup = this.resources.createBindGroup(this.layouts[0], {
      Uniforms: this.uniforms,
      SceneTexture: this.inputs.get("albedo_texture")!,
      DistanceTexture: this.inputs.get("distance_texture")!,
      sampler_color: this.resources.defaultSampler,
    });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.renderer.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    pass.setPipeline(this.pipeline as GPURenderPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();

    return this;
  }
}
