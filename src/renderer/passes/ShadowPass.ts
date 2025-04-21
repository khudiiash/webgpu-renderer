import { Camera } from "@/camera";
import { Mesh, Object3D, Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { Binding } from "@/data/Binding";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Renderable } from "../Renderable";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { Shader, ShaderConfig } from "@/shaders/Shader";
import { UniformData } from "@/data/UniformData";
import { RenderState } from "../RenderState";

export class ShadowPass extends RenderPass {
  shadowTexture: any;
  renderPassDescriptor!: GPURenderPassDescriptor;
  private renderables: WeakMap<Mesh, Renderable> = new WeakMap();
    shadowColorTexture: any;

  public init(): this {
    this.createTextures();
    this.renderer.on("resize", this.createTextures.bind(this));

    const globalLayout = new BindGroupLayout(this.renderer.device, "Global", "Global", [
        new Binding("Scene").uniform().var("scene", "Scene"),
        new Binding("Camera").uniform().var("camera", "Camera"),
        new Binding("LightCamera").uniform().var("light_camera", "Camera"),
    ]);

    const shadowLayout = new BindGroupLayout(this.renderer.device, "ShadowPass", "Material", [
      new Binding("DiffuseMap").texture().var("diffuse_map", "texture_2d<f32>"),
      new Binding("Sampler").sampler().var("sampler_color", "sampler"),
      new Binding("Material").uniform().var("material", "StandardMaterial"),
    ]);

    this.layouts = [
      globalLayout,
      this.pipelines.getBindGroupLayoutDescriptor("Mesh"),
      shadowLayout,
    ];

    return this;
  }

  private createTextures() {
    this.shadowTexture = this.resources.createTexture("shadow_texture", {
      label: "Shadow Texture",
      size: { width: 2048 * 4, height: 2048 * 4 },
      format: "depth32float",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.shadowColorTexture = this.resources.createTexture("shadow_color_texture", {
        label: "Shadow Color Texture",
        size: { width: 2048 * 4, height: 2048 * 4 },
        format: this.renderer.format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.outputs = new Map([
        ["shadow_texture", this.shadowTexture],
        ["shadow_color", this.shadowColorTexture],
    ]);

    this.renderPassDescriptor = {
      colorAttachments: [{
          view: this.shadowColorTexture.createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
      }],
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
    const renderable = new Renderable(mesh);
    const config: ShaderConfig = {
      name: "ShadowPass",
      defines: {
        USE_BILLBOARD: mesh.useBillboard,
        USE_UV: true,
      },
      attributes: mesh.geometry.getShaderAttributes(),
      varyings: mesh.varyings,
      layouts: this.layouts,
      chunks: ["ShadowPass", ...mesh.chunks],
    };

    const shader = new Shader(config);

    const bindGroups = [
      this.resources.createBindGroup(this.layouts[0], {
        Scene: mesh.scene?.uniforms.get("Scene") || UniformData.getByName("Scene")!,
        Camera: camera.uniforms.get("Camera")!,
        LightCamera: camera.uniforms.get("Camera")!,
      }),
      this.resources.createBindGroup(this.layouts[1], {
        //MeshInstances: mesh.uniforms.get("MeshInstances")!,
        // in case we want to draw shadows only for visible instances
        MeshInstances: renderable.visibilityInfo?.visibleInstancesBuffer || mesh.uniforms.get("MeshInstances")!,
      }),
      this.resources.createBindGroup(this.layouts[2], {
        DiffuseMap: material.diffuse_map,
        Sampler: this.resources.defaultSampler,
        Material: material.uniforms.get("StandardMaterial")!,
      }),
    ];
    const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
    const renderState = mesh.material.renderState;
    renderState.depthWrite = true;
    const pipeline = this.pipelines.createRenderPipeline({
      shader,
      layout: pipelineLayout,
      vertexLayouts: mesh.geometry.getVertexAttributesLayout(),
      renderState: renderState,
      targets: [
          {
              format: this.renderer.format,
              blend: {
                    color: {
                        operation: 'add',
                        srcFactor: 'one-minus-src-alpha',
                        dstFactor: 'one',
                    },
                    alpha: {
                        operation: "add",
                        srcFactor: "one",
                        dstFactor: "one",
                    }
              }

          },
      ],

    });
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
  private draw(object: Object3D, camera: Camera, lightCamera: Camera, pass: GPURenderPassEncoder) {
    if (object instanceof Mesh && object.castShadow) {
      let renderable = this.renderables.get(object) || this.createRenderable(object, camera);
      const bindGroup0 = this.resources.createBindGroup(this.layouts[0], {
        Scene: object.scene ? object.scene.uniforms.get("Scene")! : UniformData.getByName("Scene")!,
        Camera: camera.uniforms.get("Camera")!,
        LightCamera: lightCamera.uniforms.get("Camera")!,
      });
      renderable.applyPassData(this);
      renderable.bindGroups[0] = bindGroup0;
      renderable.render(pass);
    }

    for (let child of object.children) {
      this.draw(child, camera, lightCamera, pass);
    }
  }

  public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    for (let i = 0; i < scene.directionalLightsNum; i++) {
      const light = scene.directionalLights.getItem(i).parent;
      if (!light.castShadow) {
          continue;
      }
      this.draw(scene, camera, light.shadowCamera, pass);
    }
    pass.end();

    for (const input of this.inputs.entries()) {
      this.outputs.set(input[0], input[1]);
    }

    return this;
  }
}
