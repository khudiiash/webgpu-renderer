import { BindGroupLayout } from "@/data/BindGroupLayout";
import { RenderPass } from "../RenderPass";
import { Binding } from "@/data/Binding";
import { UniformData } from "@/data";
import { Struct } from "@/data/Struct";
import { Color } from "@/math/Color";
import { Shader } from "@/materials/shaders/Shader";

export class TemporalAccumulationPass extends RenderPass {
  uniforms!: UniformData;
  accumulationTexture: GPUTexture;
  public beforeRender(): this {
    return this;
  }

  public afterRender(): this {
    return this;
  }

  public init(): this {
    this.uniforms = new UniformData(this, {
      name: "TemporalAccumulationUniforms",
      isGlobal: true,
      struct: new Struct("TemporalAccumulationUniforms", {
        TemporalAccumulationColor: "vec4f",
      }),
      values: {
        TemporalAccumulationColor: new Color(0.8, 0.8, 1, 1),
      },
    });
    const bindGroupLayout = new BindGroupLayout(this.device, "TemporalAccumulation", "Global", [
      new Binding("InputTexture").texture().visibility("fragment").var("input_texture", "texture_2d<f32>"),
      new Binding("Sampler").sampler().visibility("fragment").var("sampler_color", "sampler"),
    ]);
    this.layouts = [bindGroupLayout];

    const shader = new Shader({
      name: "TemporalAccumulationPass",
      layouts: this.layouts,
      chunks: ["Noise", "Common", "Quad"],
      varyings: [{ name: "uv", type: "vec2f", location: 0 }],
      fragment: `
        @fragment(input) -> output {
          let color = textureSample(g_color, sampler_color, input.uv);
          if (color.a != 0.0) {
             discard;
          }

          let TemporalAccumulationColor = sky_uniforms.skyColor;
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

  private createTextures() {
    this.accumulationTexture = this.resources.createTexture("accumulation_texture", {
      size: { width: this.renderer.width, height: this.renderer.height },
      format: this.renderer.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
    });
  }

  private createBindGroup(): void {
    this.bindGroup = this.resources.createBindGroup(this.layouts[0], {
      InputTexture: this.inputs.get("shaded_texture")!,
      Sampler: this.resources.defaultSampler,
    });
  }

  public execute(encoder: GPUCommandEncoder): this {
    this.createBindGroup();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.accumulationTexture.createView(),
          loadOp: "load",
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
