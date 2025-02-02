import { ResourceManager } from '@/engine/ResourceManager';
import { PipelineManager } from '@/engine/PipelineManager';
import { autobind, uuid } from '@/util/general';
import { Mesh } from '@/core/Mesh';
import { Material } from '@/materials/Material';
import { Geometry } from '@/geometry/Geometry';
import { Shader } from '@/materials/shaders/Shader';

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
    shader: Shader;


    constructor(mesh: Mesh) {
        autobind(this);
        this.mesh = mesh;
        this.material = mesh.material;
        this.shader = this.material.shader;
        this.geometry = mesh.geometry;
        this.id = uuid('renderable');

        this.material.on('rebuild', this.rebuild);
        
        this.resourceManager = ResourceManager.getInstance();
        this.pipelineManager = PipelineManager.getInstance();
        
        this.initialize();
    }


    
    initialize() {
        this.shader.insertAttributes(this.geometry.getShaderAttributes());
        this.shader.insertVaryings(this.geometry.getShaderVaryings());
        this.createVertexBuffer();
        this.createIndexBuffer();
        this.createBindGroups();
        
        const pipelineLayout = this.pipelineManager.createPipelineLayout(this.shader.layouts);
        
        this.pipeline = this.pipelineManager.createRenderPipeline({
            shader: this.material.shader,
            renderState: this.material.renderState,
            layout: pipelineLayout,
            vertexBuffers: [this.geometry.getVertexAttributesLayout()],
        });
    }

    rebuild() {
        this.createBindGroups();
        const pipelineLayout = this.pipelineManager.createPipelineLayout(this.shader.layouts);
        
        this.pipeline = this.pipelineManager.createRenderPipeline({
            shader: this.material.shader,
            renderState: this.material.renderState,
            layout: pipelineLayout,
            vertexBuffers: [this.geometry.getVertexAttributesLayout()],
        });
    }

    createBindGroups() {
        this.bindGroups = this.resourceManager.createBindGroups(this.shader, this);
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
                data: this.geometry.getIndices(),
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
            pass.setIndexBuffer(this.indexBuffer, this.geometry.indices.format);
            pass.drawIndexed(this.geometry.indices.count, this.mesh.count);
        } else {
            pass.draw(this.geometry.vertexCount, this.mesh.count);
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