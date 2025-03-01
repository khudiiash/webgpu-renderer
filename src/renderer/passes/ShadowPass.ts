import { Camera } from "@/camera";
import { Mesh, Object3D, Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { Binding } from "@/data/Binding";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Renderable } from "../Renderable";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { Shader, ShaderConfig } from "@/materials/shaders/Shader";
import { UniformData } from "@/data/UniformData";
import { RenderState } from "../RenderState";

export class ShadowPass extends RenderPass {
  shadowTexture: any;
  renderPassDescriptor!: GPURenderPassDescriptor;
  private renderables: WeakMap<Mesh, Renderable> = new WeakMap();

  public init(): this {
    this.createTextures();
    this.renderer.on("resize", this.createTextures.bind(this));

    const shadowLayout = new BindGroupLayout(this.renderer.device, "ShadowPass", "Material", [
      new Binding("DiffuseMap").texture().var("diffuse_map", "texture_2d<f32>"),
      new Binding("Sampler").sampler().var("sampler_color", "sampler"),
    ]);

    this.layouts = [
      this.pipelines.getBindGroupLayoutDescriptor("Global"),
      this.pipelines.getBindGroupLayoutDescriptor("Mesh"),
      shadowLayout,
    ];

    return this;
  }

  private createTextures() {
    this.shadowTexture = this.resources.createTexture("shadow_texture", {
      size: { width: 2048 * 4, height: 2048 * 4 },
      format: "depth32float",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.outputs = new Map([["shadow_texture", this.shadowTexture]]);

    this.renderPassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  createRenderable(mesh: Mesh, camera: Camera) {
    const material = mesh.material as StandardMaterial;
    const config: ShaderConfig = {
      name: "ShadowPass",
      defines: {
        USE_BILLBOARD: mesh.useBillboard,
      },
      attributes: mesh.geometry.getShaderAttributes(),
      varyings: [{ name: "uv", type: "vec2f", location: 0 }],
      layouts: this.layouts,
      chunks: ["ShadowPass", ...mesh.chunks],
    };

    const shader = new Shader(config);

    const bindGroups = [
      this.resources.createBindGroup(this.layouts[0], {
        Scene: mesh.scene?.uniforms.get("Scene") || UniformData.getByName("Scene")!,
        Camera: camera.uniforms.get("Camera")!,
      }),
      this.resources.createBindGroup(this.layouts[1], {
        MeshInstances: mesh.uniforms.get("MeshInstances")!,
      }),
      this.resources.createBindGroup(this.layouts[2], {
        DiffuseMap: material.diffuse_map,
        Sampler: this.resources.defaultSampler,
      }),
    ];
    const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
    const renderState = new RenderState({ depthFormat: "depth32float", cullMode: "back" });
    const pipeline = this.pipelines.createRenderPipeline({
      shader,
      layout: pipelineLayout,
      vertexLayouts: mesh.geometry.getVertexAttributesLayout(),
      renderState: renderState,
    });
    const renderable = new Renderable(mesh);
    renderable.savePassData(this, { pipeline, bindGroups });
    this.renderables.set(mesh, renderable);

    material.uniforms.get("StandardMaterial")!.onRebuild(() => {
      this.createRenderable(mesh, camera);
    });

    return renderable;
  }

  public beforeRender(): this {
    return this;
  }
  public afterRender(): this {
    return this;
  }
  private draw(object: Object3D, camera: Camera, pass: GPURenderPassEncoder) {
    if (object instanceof Mesh && object.castShadow) {
      let renderable = this.renderables.get(object) || this.createRenderable(object, camera);
      const bindGroup0 = this.resources.createBindGroup(this.layouts[0], {
        Scene: object.scene.uniforms.get("Scene")!,
        Camera: camera.uniforms.get("Camera")!,
      });
      renderable.applyPassData(this);
      renderable.bindGroups[0] = bindGroup0;
      renderable.render(pass);
    }

    for (let child of object.children) {
      this.draw(child, camera, pass);
    }
  }

  public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    for (let i = 0; i < scene.directionalLightsNum; i++) {
      const light = scene.directionalLights.getItem(i).parent;
      this.draw(scene, light.shadowCamera, pass);
    }
    pass.end();

    for (const input of this.inputs.entries()) {
      this.outputs.set(input[0], input[1]);
    }

    return this;
  }
}
