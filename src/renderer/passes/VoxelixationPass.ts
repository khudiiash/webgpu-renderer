import { Camera } from "@/camera";
import { Mesh, Object3D, Scene } from "@/core";
import { RenderPass } from "../RenderPass";
import { Renderable } from "../Renderable";
import { UniformData } from "@/data";
import { Shader, ShaderConfig } from "@/materials/shaders/Shader";
import { StandardMaterial } from "@/materials";
import { Struct } from "@/data/Struct";
import { Vector3 } from "@/math";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { Binding } from "@/data/Binding";

export class VoxelizationPass extends RenderPass {
    renderables: WeakMap<Object3D, Renderable> = new WeakMap();

    dimensions: Vector3 = new Vector3(64, 64, 64);
    worldSize: Vector3 = new Vector3(10, 10, 10);
    voxelTexture!: GPUTexture;
    voxelUniforms!: UniformData;
    meshBindGroupLayout: BindGroupLayout;

    public init(): this {
        this.createTextures();
        this.voxelUniforms = new UniformData(this, {
            name: "Voxel",
            isGlobal: true,
            struct: new Struct("Voxel", {
                dimensions: "vec3f",
                worldSize: "vec3f",
            }),
            values: {
                dimensions: this.dimensions,
                worldSize: this.worldSize,
            },
        });
        this.layouts = [
            null,
            new BindGroupLayout(this.device, "Mesh", "Mesh", [
                new Binding("MeshInstances").storage("read").var("instances", "array<mat4x4f>"),
                new Binding("MeshVertices").storage("read").var("vertices", "array<vec3f>"),
                new Binding("MeshIndices").storage("read").var("indices", "array<uint32>"),
            ]),
            new BindGroupLayout(this.device, "StandardMaterial", "Material", [
                new Binding("StandardMaterial").uniform().var("material", "StandardMaterial"),
                new Binding("DiffuseMap").texture().var("diffuse_map", "texture2d<f32>"),
                new Binding("NormalMap").texture().var("normal_map", "texture2d<f32>"),
                new Binding("Sampler").sampler().var("sampler_color", "sampler"),
            ]),
        ];
        return this;
    }
    createTextures() {
        this.voxelTexture = this.resources.createTexture("voxel", {
            size: { width: this.dimensions.x, height: this.dimensions.y, depthOrArrayLayers: this.dimensions.z },
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
            format: "rgba32float",
            dimension: "3d",
        });
    }
    public beforeRender(): this {
        return this;
    }
    public afterRender(): this {
        return this;
    }
    private createRenderable(mesh: Mesh, camera: Camera) {
        const material = mesh.material as StandardMaterial;
        const compute = `
            fn worldToVoxel(worldPos: vec3f) -> vec3<u32> {
              let normalized = (worldPos + uniforms.worldSize * 0.5) / uniforms.worldSize;
              return vec3<u32>(normalized * uniforms.dimensions);
            }

            fn transformVertex(vertex: vec4f, transform: mat4x4f) -> vec3f {
              return (transform * vertex).xyz;
            }

            fn triangleBoxIntersect(v0: vec3f, v1: vec3f, v2: vec3f, boxMin: vec3f, boxMax: vec3f) -> bool {
              let boxCenter = (boxMin + boxMax) * 0.5;
              let boxHalfSize = (boxMax - boxMin) * 0.5;

              let triMin = min(min(v0, v1), v2);
              let triMax = max(max(v0, v1), v2);

              return all(triMin <= boxMax) && all(triMax >= boxMin);
            }

            @compute @workgroup_size(8, 8, 8)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
              if (any(global_id >= vec3<u32>(uniforms.dimensions))) {
                return;
              }

              let voxelSize = uniforms.worldSize / uniforms.dimensions;
              let voxelMin = (vec3f(global_id) / uniforms.dimensions) * uniforms.worldSize - uniforms.worldSize * 0.5;
              let voxelMax = voxelMin + voxelSize;

              // Process each triangle for each instance
              for (var instanceIdx = 0u; instanceIdx < arrayLength(&instances); instanceIdx++) {
                      let transform = instances[instanceIdx];

                for (var i = 0u; i < arrayLength(&indices); i += 3u) {
                  let idx0 = indices[i];
                  let idx1 = indices[i + 1u];
                  let idx2 = indices[i + 2u];

                  // Transform vertices by instance transform
                  let v0 = transformVertex(vertices[idx0], transform);
                  let v1 = transformVertex(vertices[idx1], transform);
                  let v2 = transformVertex(vertices[idx2], transform);

                  if (triangleBoxIntersect(v0, v1, v2, voxelMin, voxelMax)) {
                    textureStore(voxelGrid, global_id, vec4<u32>(1u, 0u, 0u, 0u));
                    break; // Early exit once we know the voxel is occupied
                  }
                }
              }
            }
        `;
        const config: ShaderConfig = {
            name: "VoxelizationPassShader",
            attributes: mesh.geometry.getShaderAttributes(),
            layouts: this.layouts,
        };

        const shader = new Shader(config);

        const bindGroups = [
            null,
            this.resources.createBindGroup(this.layouts[1], {
                MeshInstances: mesh.uniforms.get("MeshInstances")!,
                MeshVertices: this.resources.createAndUploadBuffer({
                    id: "vbc_" + mesh.geometry.id,
                    name: "MeshVertices",
                    usage: GPUShaderStage.COMPUTE,
                    data: mesh.geometry.attributes.position!.data,
                }),
                MeshIndices: this.resources.createAndUploadBuffer({
                    id: "ibc_" + mesh.geometry.id,
                    name: "MeshIndices",
                    usage: GPUShaderStage.COMPUTE,
                    data: mesh.geometry.indices.data,
                }),
            }),
            this.resources.createBindGroup(this.layouts[2], {
                StandardMaterial: material.uniforms.get("StandardMaterial")!,
                DiffuseMap: material.diffuse_map,
                NormalMap: material.normal_map,
                Sampler: this.resources.defaultSampler,
            }),
        ];
        const pipelineLayout = this.pipelines.createPipelineLayout(this.layouts);
        const pipeline = this.pipelines.createComputePipeline({
            shader,
            layout: pipelineLayout,
        });
        const renderable = new Renderable(mesh);
        renderable.savePassData(this, { pipeline, bindGroups });
        this.renderables.set(mesh, renderable);

        material.uniforms.get("StandardMaterial")!.onRebuild(() => {
            this.createRenderable(mesh, camera);
        });

        return renderable;
    }
    private voxelize(object: Object3D, camera: Camera, pass: GPUComputePassEncoder) {
        if (object instanceof Mesh) {
            let renderable = this.renderables.get(object) || this.createRenderable(object, camera);
            renderable.applyPassData(this);
            pass.setPipeline(renderable.pipeline as GPUComputePipeline);
            for (let i = 0; i < renderable.bindGroups.length; i++) {
                pass.setBindGroup(i, renderable.bindGroups[i]);
            }
            pass.dispatchWorkgroups(
                Math.ceil(this.dimensions.x / 8),
                Math.ceil(this.dimensions.y / 8),
                Math.ceil(this.dimensions.z / 8),
            );
        }

        for (let child of object.children) {
            this.voxelize(child, camera, pass);
        }
    }
    public execute(encoder: GPUCommandEncoder, scene?: Scene, camera?: Camera): this {
        const pass = encoder.beginComputePass();
        return this;
    }
}
