import { RenderPass } from "../RenderPass";
import { Scene } from "@/core/Scene";
import { Camera } from "@/camera/Camera";
import { Object3D } from "@/core/Object3D";
import { Mesh } from "@/core/Mesh";
import { Renderable } from "../Renderable";
import { Shader } from "@/shaders/Shader";
import { ShaderChunk, ShaderConfig } from "@/shaders";
import { MeshVisibilityInfo } from "@/data/MeshVisibilityInfo";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";

export class CullingPass extends RenderPass {
    renderables: Map<Mesh, Renderable> = new Map();

    init(): this {
        const globalBindingLayout = new BindGroupLayout(this.device, "Global", "Global", [
            new Binding("Camera").uniform().visibility("compute").var("camera", "Camera"),
        ]);
        const meshBindingLayout = new BindGroupLayout(this.device, "MeshCulling", "Mesh", [
            new Binding("MeshInstances").storage("read").visibility("compute").var("instances", "array<mat4x4f>"),
            new Binding("BoundingSphere").uniform().visibility("compute").var("bounding_sphere", "BoundingSphere"),
            new Binding("VisibilityBuffer").storage("read_write").visibility("compute").var("visibility_buffer", "array<atomic<u32>>"),
            new Binding("DrawCommandBuffer").storage("read_write").visibility("compute").var("draw_command_buffer", "array<DrawCommand>"),
            new Binding("VisibleInstancesBuffer").storage("read_write").visibility("compute").var("visible_instances_buffer", "array<mat4x4f>"),
            new Binding("InstanceIndicesBuffer").storage("read_write").visibility("compute").var("instance_indices_buffer", "array<u32>"),
        ])
        this.layouts = [
            globalBindingLayout,
            meshBindingLayout
        ];

        return this;
    }

    public beforeRender(): this {
        return this;
    }

    public afterRender(): this {
        return this;
    }

    createRenderable(mesh: Mesh, camera: Camera) {
        const config: ShaderConfig = {
            name: "CullingPass",
            layouts: this.layouts,
            chunks: ["Culling"],
            compute: `
                @compute(input) @workgroup_size(64, 1, 1) {
                    {{compute}}
                }
            `
        };

        const shader = new Shader(config);

        const visibilityInfo = new MeshVisibilityInfo(this.device, mesh);

        const bindGroups = [
            this.resources.createBindGroup(this.layouts[0], {
                Camera: camera.uniforms.get("Camera")!,
            }),
            this.resources.createBindGroup(this.layouts[1], {
                MeshInstances: mesh.uniforms.get("MeshInstances")!,
                BoundingSphere: mesh.uniforms.get("BoundingSphere")!,
                VisibilityBuffer: visibilityInfo.visibilityBuffer,
                VisibleInstancesBuffer: visibilityInfo.visibleInstancesBuffer,
                DrawCommandBuffer: visibilityInfo.drawCommandBuffer,
                InstanceIndicesBuffer: visibilityInfo.instanceIndicesBuffer,
            }),
        ];
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        const pipeline = this.pipelines.createComputePipeline({
            name: "CullingPass",
            layout: pipelineLayout,
            shader,
        });
        const renderable = new Renderable(mesh);
        renderable.visibilityInfo = visibilityInfo;
        renderable.savePassData(this, { pipeline, bindGroups });
        this.renderables.set(mesh, renderable);
        return renderable;
    }

    process(object: Object3D, camera: Camera, pass: GPUComputePassEncoder) {
        if (object instanceof Mesh && object.isCulled && object.isInstanced) {
            let renderable = this.renderables.get(object) || this.createRenderable(object, camera);
            renderable.applyPassData(this);
            pass.setPipeline(renderable.pipeline as GPUComputePipeline);
            for (let i = 0; i < renderable.bindGroups.length; i ++) {
                pass.setBindGroup(i, renderable.bindGroups[i]);
            }
            const { visibilityInfo } = renderable;
            this.device.queue.writeBuffer(visibilityInfo.drawCommandBuffer, 4, new Uint32Array([0]));
            const dispatchSize = Math.ceil(object.count / 64);
            pass.dispatchWorkgroups(dispatchSize);
        }

        for (let child of object.children) {
            this.process(child, camera, pass);
        }
    }

    public execute(encoder: GPUCommandEncoder, scene: Scene, camera: Camera): this {
        const pass = encoder.beginComputePass();
        this.process(scene, camera, pass);
        pass.end();
        return this;
    }
}
