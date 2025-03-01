import { BindGroupLayout } from "@/data/BindGroupLayout";
import { RenderPass } from "../RenderPass";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data";
import { Struct } from "@/data/Struct";
import { Color } from "@/math/Color";
import { Shader } from "@/materials/shaders/Shader";

export class SkyPass extends RenderPass {
  uniforms!: UniformData;
  public beforeRender(): this {
    return this;
  }

  public afterRender(): this {
    return this;
  }

  public init(): this {
    this.uniforms = new UniformData(this, {
      name: "SkyUniforms",
      isGlobal: true,
      struct: new Struct("SkyUniforms", {
        skyColor: "vec4f",
      }),
      values: {
        skyColor: new Color(0.8, 0.8, 1, 1),
      },
    });
    const bindGroupLayout = new BindGroupLayout(this.device, "Sky", "Global", [
      new Binding("GColor").texture().visibility("fragment").var("g_color", "texture_2d<f32>"),
      new Binding("SkyUniforms").uniform().visibility("fragment").var("sky_uniforms", "SkyUniforms"),
      new Binding("Scene").uniform().visibility("fragment").var("scene", "Scene"),
      new Binding("Sampler").sampler().visibility("fragment").var("sampler_color", "sampler"),
    ]);
    this.layouts = [bindGroupLayout];

    const shader = new Shader({
      name: "SkyPass",
      layouts: this.layouts,
      chunks: ["Noise", "Common", "Quad"],
      varyings: [{ name: "uv", type: "vec2f", location: 0 }],
      fragment: `
        @fragment(input) -> output {
          let color = textureSample(g_color, sampler_color, input.uv);
          if (color.a != 0.0) {
             discard;
          }

          let skyColor = sky_uniforms.skyColor;
          output.color = vec4(skyColor.rgb, 1.0);

          return output;
        }
      `,
    });
    console.log(shader.fragmentSource);

    const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
    this.pipeline = this.pipelines.createRenderPipeline({
      layout: pipelineLayout,
      shader: shader,
      targets: [{ format: this.renderer.format }],
    });
    return this;
  }

  private createBindGroup(): void {
    this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
      GColor: this.inputs.get("albedo_texture")!,
      SkyUniforms: this.uniforms,
      Scene: UniformData.getByName("Scene")!,
      Sampler: this.resources.defaultSampler,
    });
  }

  public execute(encoder: GPUCommandEncoder): this {
    this.createBindGroup();
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
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6);
    pass.end();

    for (const [key, input] of this.inputs.entries()) {
      this.outputs.set(key, input);
    }

    return this;
  }
}
