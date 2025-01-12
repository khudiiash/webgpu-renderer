import { ResourceManager } from '@/engine/ResourceManager';
import { PipelineManager } from '@/engine/PipelineManager';
import { UniformData } from '@/data/UniformData';
import { autobind, uuid } from '@/util/general';
import { Mesh } from '@/core/Mesh';
import { Material } from '@/materials/Material';
import { Geometry } from '@/geometry/Geometry';

export type BindGroupConfig = {
    name: string;
    layout: GPUBindGroupLayout;
    items: Array<{
        name: string;
        binding: number;
        dataID: string;
        resource: any;
    }>;
};

export class Renderable {
    public id: string;
    public mesh: Mesh;
    public material: Material;
    public geometry: Geometry;
    public pipeline!: GPURenderPipeline;
    public bindGroups!: GPUBindGroup[];

    private resourceManager: ResourceManager;
    private pipelineManager: PipelineManager;
    isIndexed: boolean = false;
    indexBuffer?: GPUBuffer;
    vertexBuffer?: GPUBuffer;


    constructor(mesh: Mesh) {
        autobind(this);
        this.mesh = mesh;
        this.material = mesh.material;
        this.geometry = mesh.geometry;
        this.id = uuid('renderable');

        this.material.on('rebuild', this.rebuild);
        
        this.resourceManager = ResourceManager.getInstance();
        this.pipelineManager = PipelineManager.getInstance();
        
        this.initialize();
    }

    getBindGroupLayouts() {
        const bindings = this.material.shader.bindings;
        const layouts = [];
        for (const binding of bindings) {
            const layout = PipelineManager.getDefaultBindGroupLayout(binding.group);
            layouts[binding.group] = layout;
        }

        return layouts;
    }
    
    initialize() {
        this.createVertexBuffer();
        this.createIndexBuffer();
        this.createBindGroups();
        
        const pipelineLayout = this.pipelineManager.createPipelineLayout(this.getBindGroupLayouts());
        
        this.pipeline = this.pipelineManager.createRenderPipeline({
            material: this.material,
            layout: pipelineLayout,
            vertexBuffers: [this.geometry.getVertexAttributesLayout()],
        });
    }

    rebuild() {
        this.createBindGroups();
        const pipelineLayout = this.pipelineManager.createPipelineLayout(this.getBindGroupLayouts());
        
        this.pipeline = this.pipelineManager.createRenderPipeline({
            material: this.material,
            layout: pipelineLayout,
            vertexBuffers: [this.geometry.getVertexAttributesLayout()],
        });
    }

    createBindGroups() {
        const shader = this.material.shader;
        const bindings = shader.bindings;
        const bindGroups = [];
        const layouts = this.getBindGroupLayouts();
        const { GLOBAL, MODEL, MATERIAL } = PipelineManager.LAYOUT_GROUPS;

        for (let i = 0; i < layouts.length; i++) {
            const layout = layouts[i];
            const groupBindings = bindings.filter(b => b.group === i);
            
            const config: BindGroupConfig = {
                name: `bgl_${shader.name}_${i}`,
                layout: layout,
                items: []
            };

            for (const binding of groupBindings) {
                let uniformData;
                switch (binding.group) {
                    case GLOBAL:
                        uniformData = UniformData.getByName(binding.name);
                        break;
                    case MODEL:
                        uniformData = this.mesh.uniforms;
                        break;
                    case MATERIAL:
                        uniformData = this.material.uniforms;
                        break;
                }
                if (!uniformData) continue;
                const dataID = uniformData.id;

                if (/texture/.test(binding.type)) {
                    const texture = uniformData.textures.get(binding.name);
                    config.items.push({
                        name: binding.name,
                        binding: binding.binding,
                        dataID, 
                        resource: { texture, dataID }
                    });
                } else if (/sampler/.test(binding.type)) {
                    const type = uniformData.textures.get(binding.name)?.sampler;
                    config.items.push({
                        name: binding.name,
                        binding: binding.binding,
                        dataID,
                        resource: { sampler: { type } }
                    });
                } else {
                    const dataID = uniformData.id;
                    const desc = uniformData.getBufferDescriptor();
                    if (desc) {
                        config.items.push({
                            name: binding.name,
                            binding: binding.binding,
                            dataID,
                            resource: { buffer: desc }
                        });
                    }
                }

                uniformData.onRebuild(this.rebuildBindGroups);
            }

            bindGroups[i] = this.resourceManager.createBindGroup(config);
        }
        this.bindGroups = bindGroups;
    }

    updateBuffer(id: string) {
        this.resourceManager.updateBuffer(id);
    }

    rebuildBindGroups() {
        this.createBindGroups();
    }

    createIndexBuffer() {
        this.isIndexed = this.geometry.isIndexed;
        if (!this.isIndexed) return;

        this.indexBuffer = this.resourceManager.createAndUploadBuffer(
            { 
                name: "Geometry Index Buffer",
                data: this.geometry.indices as ArrayBuffer, 
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                id: 'ib_' + this.geometry.id,
            },
        );
    }
    
    createVertexBuffer() {
        this.vertexBuffer = this.resourceManager.createAndUploadBuffer({
            name: "Geometry Vertex Buffer",
            data: this.geometry.getPacked() as Float32Array,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            id: 'vb_' + this.geometry.id,
        });
        return this.vertexBuffer;
    }
    
    render(pass: GPURenderPassEncoder) {
        pass.setPipeline(this.pipeline);

        for (let i = 0; i < this.bindGroups.length; i++) {
            pass.setBindGroup(i, this.bindGroups[i]);
        }
        
        pass.setVertexBuffer(0, this.vertexBuffer);
        
        if (this.isIndexed && this.indexBuffer) {
            pass.setIndexBuffer(this.indexBuffer, this.geometry.indexFormat as GPUIndexFormat);
            pass.drawIndexed(this.geometry.indices.length, this.mesh.count);
        } else {
            pass.draw(this.geometry.vertexCount, 1, 0, 0);
        }
    }
    
    dispose() {
        // Clean up resources
        this.resourceManager.releaseResource(`vb_${this.geometry.id}`);
        this.resourceManager.releaseResource(`ib_${this.geometry.id}`);
        delete this.vertexBuffer;
        delete this.indexBuffer;
    }
}