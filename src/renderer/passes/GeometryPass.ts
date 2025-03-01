import { RenderPass } from "../RenderPass";
import { Scene } from "@/core/Scene";
import { Camera } from "@/camera/Camera";
import { Object3D } from "@/core/Object3D";
import { Mesh } from "@/core/Mesh";
import { Renderable } from "../Renderable";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Shader } from "@/materials/shaders/Shader";
import { ShaderChunk, ShaderConfig } from "@/materials/shaders";
import { Binding } from "@/data/Binding";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { UniformData } from "@/data";

export class GeometryPass extends RenderPass {
    private positionTexture!: GPUTexture;
    private albedoTexture!: GPUTexture;
    private normalTexture!: GPUTexture;
    private depthTexture!: GPUTexture;
    private pbrTexture!: GPUTexture;
    private renderables: WeakMap<Mesh, Renderable> = new WeakMap();
    private renderPassDescriptor!: GPURenderPassDescriptor;
    public width: number = 1;
    public height: number = 1;

    init(): this {
        this.createTextures();
        this.renderer.on("resize", this.createTextures.bind(this));

        const geometryLayout = new BindGroupLayout(this.renderer.device, "GeometryPass", "Material", [
            new Binding("StandardMaterial").uniform().var("material", "StandardMaterial"),
            new Binding("DiffuseMap").texture().var("diffuse_map", "texture_2d<f32>"),
            new Binding("NormalMap").texture().var("normal_map", "texture_2d<f32>"),
            new Binding("RoughnessMap").texture().var("roughness_map", "texture_2d<f32>"),
            new Binding("MetalnessMap").texture().var("metalness_map", "texture_2d<f32>"),
            new Binding("AoMap").texture().var("ao_map", "texture_2d<f32>"),
            new Binding("HeightMap").texture().var("height_map", "texture_2d<f32>"),
            //new Binding("CubeMap").textureCube().var("cube_map", "texture_3d<f32>"),
            new Binding("Sampler").sampler().var("sampler_color", "sampler"),
        ]);

        this.layouts = [
            this.pipelines.getBindGroupLayoutDescriptor("Global"),
            this.pipelines.getBindGroupLayoutDescriptor("Mesh"),
            geometryLayout,
        ];

        return this;
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;
    }

    private createTextures() {
        if (this.width === this.renderer.width && this.height === this.renderer.height) {
            return;
        }
        this.width = this.renderer.width;
        this.height = this.renderer.height;
        this.positionTexture = this.resources.createTexture("position_texture", {
            size: { width: this.width, height: this.height },
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.albedoTexture = this.resources.createTexture("albedo_texture", {
            size: { width: this.width, height: this.height },
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.normalTexture = this.resources.createTexture("normal_texture", {
            size: { width: this.width, height: this.height },
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.pbrTexture = this.resources.createTexture("pbr_texture", {
            size: { width: this.width, height: this.height },
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTexture = this.resources.createTexture("depth_texture", {
            size: { width: this.width, height: this.height },
            format: "depth32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.outputs = new Map([
            ["position_texture", this.positionTexture],
            ["albedo_texture", this.albedoTexture],
            ["normal_texture", this.normalTexture],
            ["pbr_texture", this.pbrTexture],
            ["depth_texture", this.depthTexture],
        ]);

        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: this.positionTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.albedoTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.normalTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.pbrTexture.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
        };
    }

    createRenderable(mesh: Mesh, camera: Camera) {
        const material = mesh.material as StandardMaterial;
        const config: ShaderConfig = {
            name: "GeometryPassShader",
            defines: {
                USE_UV: mesh.geometry.hasAttribute("uv"),
                USE_NORMAL: mesh.geometry.hasAttribute("normal"),
                USE_BILLBOARD: mesh.useBillboard,
                USE_DEPTH: true,
            },
            attributes: mesh.geometry.getShaderAttributes(),
            varyings: [
                { name: "position", type: "vec3f", location: 0 },
                { name: "normal", type: "vec3f", location: 1 },
                { name: "uv", type: "vec2f", location: 2 },
                { name: "depth", type: "f32", location: 3 },
            ],
            layouts: this.layouts,
            chunks: ["Mesh", "GeometryPass", ...mesh.chunks],
            outputs: [
                { name: "position", type: "vec4f", location: 0 },
                { name: "albedo", type: "vec4f", location: 1 },
                { name: "normal", type: "vec4f", location: 2 },
                { name: "pbr", type: "vec4f", location: 3 },
            ],
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
                StandardMaterial: material.uniforms.get("StandardMaterial")!,
                DiffuseMap: material.diffuse_map,
                NormalMap: material.normal_map,
                RoughnessMap: material.roughness_map,
                MetalnessMap: material.metalness_map,
                AoMap: material.ao_map,
                HeightMap: material.height_map,
                //CubeMap: material.cube_map,
                Sampler: this.resources.defaultSampler,
            }),
        ];
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        const pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            vertexLayouts: mesh.geometry.getVertexAttributesLayout(),
            renderState: mesh.material.renderState,
            targets: [
                { format: "rgba16float" },
                { format: "rgba16float" },
                { format: "rgba16float" },
                { format: "rgba16float" },
            ],
        });
        const renderable = new Renderable(mesh);
        renderable.savePassData(this, { pipeline, bindGroups });
        this.renderables.set(mesh, renderable);

        material.uniforms.get("StandardMaterial")!.onRebuild(() => {
            this.createRenderable(mesh, camera);
        });

        return renderable;
    }

    draw(object: Object3D, camera: Camera, pass: GPURenderPassEncoder) {
        if (object instanceof Mesh) {
            let renderable = this.renderables.get(object) || this.createRenderable(object, camera);
            renderable.applyPassData(this);
            renderable.render(pass);
        }

        for (let child of object.children) {
            this.draw(child, camera, pass);
        }
    }

    public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        this.draw(scene, camera, pass);
        pass.end();
        return this;
    }
}
