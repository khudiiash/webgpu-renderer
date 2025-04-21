import { Camera } from "@/camera";
import { Mesh, Object3D, Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { Renderable } from "../Renderable";
import { StandardMaterial } from "@/materials/StandardMaterial";
import { Shader, ShaderConfig } from "@/shaders/Shader";
import { UniformData } from "@/data/UniformData";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";
import { RenderState } from "../RenderState";

export class ForwardPass extends RenderPass {
    renderables: WeakMap<Mesh, Renderable> = new WeakMap();
    quadRenderLayout!: BindGroupLayout;
    quadRenderShader!: Shader;
    quadPipeline!: GPURenderPipeline;

    public init(): this {
        this.quadRenderLayout = new BindGroupLayout(this.device, "Quad", "Global", [
            new Binding("DeferredTexture").texture().var("deferred_texture", "texture_2d<f32>"),
            new Binding("SamplerColor").sampler().var("sampler_color", "sampler"),
        ]);
        this.quadRenderShader = new Shader({
            name: "QuadRender",
            chunks: ["Quad"],
            varyings: [{ name: "uv", type: "vec2f", location: 0 }],
            layouts: [this.quadRenderLayout],
            outputs: [{ name: "color", type: "vec4f", location: 0 }],
            fragment: `
                @fragment(input) -> output {
                    output.color = textureSample(deferred_texture, sampler_color, input.uv);
                    return output;
                }
            `,
        });
        this.quadPipeline = this.pipelines.createRenderPipeline({
            shader: this.quadRenderShader,
            layout: this.pipelines.createPipelineLayout([this.quadRenderLayout]),
            targets: [{ format: this.renderer.format }],
            renderState: new RenderState({
                depthWrite: false,
                depthTest: true,
            }),
        });
        this.layouts = [
            new BindGroupLayout(this.device, "Global", "Global", [
                new Binding("Scene").uniform().var("scene", "Scene"),
                new Binding("Camera").uniform().var("camera", "Camera"),
                new Binding("DeferredTexture").texture().var("deferred_texture", "texture_2d<f32>"),
                new Binding("SamplerColor").sampler().var("sampler_color", "sampler"),
            ]),
            this.pipelines.getBindGroupLayoutDescriptor("Mesh"),
            this.pipelines.getBindGroupLayoutDescriptor("StandardMaterial"),
        ];
        return this;
    }
    public beforeRender(): this {
        return this;
    }
    private createRenderable(mesh: Mesh, camera: Camera): Renderable {
        const material = mesh.material as StandardMaterial;
        const renderable = new Renderable(mesh);
        const config: ShaderConfig = {
            name: "ForwardPass",
            defines: {
                USE_UV: mesh.geometry.hasAttribute("uv"),
                USE_NORMAL: mesh.geometry.hasAttribute("normal"),
                USE_BILLBOARD: mesh.useBillboard,
                USE_DEPTH: true,
            },
            attributes: mesh.geometry.getShaderAttributes(),
            varyings: [
                { name: "position", type: "vec3f", location: 0 },
                { name: "local_position", type: "vec3f", location: 1 },
                { name: "normal", type: "vec3f", location: 2 },
                { name: "uv", type: "vec2f", location: 3 },
                { name: "depth", type: "f32", location: 4 },
            ],
            layouts: this.layouts,
            chunks: ["Mesh", "Forward", ...mesh.chunks],
            outputs: [
                { name: "color", type: "vec4f", location: 0 },
            ],
        };

        const shader = new Shader(config);

        const bindGroups = [
            this.resources.createBindGroup(this.layouts[0], {
                Scene: mesh.scene?.uniforms.get("Scene") || UniformData.getByName("Scene")!,
                Camera: camera.uniforms.get("Camera")!,
            }),
            this.resources.createBindGroup(this.layouts[1], {
                MeshInstances: renderable.visibilityInfo?.visibleInstancesBuffer || mesh.uniforms.get("MeshInstances")!,
            }),
            this.resources.createBindGroup(this.layouts[2], {
                StandardMaterial: material.uniforms.get("StandardMaterial")!,
                DiffuseMap: material.diffuse_map,
                NormalMap: material.normal_map,
                RoughnessMap: material.roughness_map,
                MetalnessMap: material.metalness_map,
                AoMap: material.ao_map,
                HeightMap: material.height_map,
                CubeMap: material.cube_map,
                Sampler: this.resources.defaultSampler,
            }),
        ];

        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        mesh.material.renderState.depthWrite = false;
        const pipeline = this.pipelines.createRenderPipeline({
            shader,
            layout: pipelineLayout,
            vertexLayouts: mesh.geometry.getVertexAttributesLayout(),
            renderState: mesh.material.renderState,
            targets: [
                {
                    format: this.renderer.format,
                    blend: mesh.material.renderState.getBlendState(),
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

    getTransparentMeshes(objects: Object3D[]): Mesh[] {
        return objects.filter((object) => object instanceof Mesh && object.material.renderState.transparent) as Mesh[];
    }

    sortTransparentMeshes(objects: Mesh[], camera: Camera): Mesh[] {   
        return objects.sort((a, b) => {
            const aPosition = a.position;
            const bPosition = b.position;
            const aRadius = a.geometry.boundingSphere.radius;
            const bRadius = b.geometry.boundingSphere.radius;
            const aDistance = aPosition.distanceTo(camera.position);
            const bDistance = bPosition.distanceTo(camera.position);
            const aViewDistance = aDistance - aRadius;
            const bViewDistance = bDistance - bRadius;
            return aViewDistance - bViewDistance;
        });
    }

    draw(transparentMeshes: Mesh[], camera: Camera, pass: GPURenderPassEncoder): void {
        for (const mesh of transparentMeshes) {
            if (mesh.isCulled && !mesh.isInstanced) {
                if (!camera.frustum.intersectsObject(mesh)) {
                    continue;
                }
            }
            let renderable = this.renderables.get(mesh) || this.createRenderable(mesh, camera);
            renderable.applyPassData(this);
            renderable.bindGroups[0] =
                this.resources.createBindGroup(this.layouts[0], {
                    Scene: mesh.scene?.uniforms.get("Scene") || UniformData.getByName("Scene")!,
                    Camera: camera.uniforms.get("Camera")!,
                    DeferredTexture: this.inputs.get("deferred_texture")!,
                    SamplerColor: this.resources.defaultSampler,
                }),
            renderable.render(pass);
        }
    }

    public afterRender(scene?: Scene, camera?: Camera): this {
        return this;
    }

    public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.renderer.context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
            depthStencilAttachment: {
                view: this.resources.getTexture("depth_texture")!.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "load",
                depthStoreOp: "store",
            },
        });

        // draw quad with deferred texture
        pass.setPipeline(this.quadPipeline);
        pass.setBindGroup(0, this.resources.createBindGroup(this.quadRenderLayout, {
            DeferredTexture: this.inputs.get("deferred_texture")!,
            SamplerColor: this.resources.defaultSampler,
        }));
        pass.draw(6);

        const transparentMeshes = this.getTransparentMeshes(scene.meshes);
        const sortedTransparentMeshes = this.sortTransparentMeshes(transparentMeshes, camera);

        // draw transparent objects
        this.draw(sortedTransparentMeshes, camera, pass);
        pass.end();

        return this;
    }

}
