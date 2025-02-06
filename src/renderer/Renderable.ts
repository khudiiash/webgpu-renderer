import { ResourceManager } from '@/engine/ResourceManager';
import { autobind, uuid } from '@/util/general';
import { Mesh } from '@/core/Mesh';
import { Material } from '@/materials/Material';
import { Geometry } from '@/geometry/Geometry';
import { BufferAttribute } from '@/geometry/BufferAttribute';
import { RenderPass } from './RenderPass';

type PassData = {
    pipeline: GPURenderPipeline,
    bindGroups: GPUBindGroup[],
}

export class Renderable {
    static cache: WeakMap<Mesh, Renderable> = new WeakMap();
    public id!: string;
    public mesh!: Mesh;
    public material!: Material;
    public geometry!: Geometry;
    public pipeline!: GPURenderPipeline;
    public bindGroups: GPUBindGroup[] = [];

    private resources: ResourceManager = ResourceManager.getInstance()
    isIndexed: boolean = false;
    indexBuffer?: GPUBuffer;
    vertexBuffers: GPUBuffer[] = [];
    passData: Map<RenderPass, PassData> = new Map();


    constructor(mesh: Mesh) {
        if (Renderable.cache.has(mesh)) {
            return Renderable.cache.get(mesh) as Renderable;
        }
        autobind(this);
        this.mesh = mesh;
        this.material = mesh.material;
        this.geometry = mesh.geometry;
        this.id = uuid('renderable');

        this.initialize();
    }

    savePassData(pass: RenderPass, data: PassData) {
        this.passData.set(pass, data);
    }

    applyPassData(pass: RenderPass) {
        const data = this.passData.get(pass);
        if (!data) {
            console.error('No pass data found for', pass);
            return;
        }
        this.pipeline = data.pipeline;
        this.bindGroups = data.bindGroups;
    }

    initialize() {
        this.createVertexBuffers();
        this.createIndexBuffer();
    }

    updateBuffer(id: string) {
        this.resources.updateBuffer(id);
    }

    createIndexBuffer() {
        this.isIndexed = this.geometry.isIndexed;
        if (!this.isIndexed) return;
        this.indexBuffer = this.resources.createAndUploadBuffer(
            { 
                name: "Geometry Index Buffer",
                data: this.geometry.getIndices(),
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                id: 'ib_' + this.geometry.id,
            },
        );
    }
    
    createVertexBuffers() {
        this.vertexBuffers = Object.entries(this.mesh.geometry.attributes).filter(a => a).map(([name, attribute]) => this.resources.createVertexBuffer(name, attribute as BufferAttribute))
    }
    
    render(pass: GPURenderPassEncoder) {
        if (!this.pipeline || !this.bindGroups.length) {
            console.error('Pipeline or BindGroup not set, cannot render');
            return;
        }
        pass.setPipeline(this.pipeline);

        for (let i = 0; i < this.bindGroups.length; i++) {
            pass.setBindGroup(i, this.bindGroups[i]);
        }
        
        for (let i = 0; i < this.vertexBuffers.length; i++) {
            pass.setVertexBuffer(i, this.vertexBuffers[i]);
        }
        
        if (this.isIndexed && this.indexBuffer) {
            pass.setIndexBuffer(this.indexBuffer, this.geometry.indices.format);
            pass.drawIndexed(this.geometry.indices.count, this.mesh.count);
        } else {
            pass.draw(this.geometry.vertexCount, this.mesh.count);
        }
    }
    
    dispose() {
        // Clean up resources
        this.resources.releaseResource(`vb_${this.geometry.id}`);
        this.resources.releaseResource(`ib_${this.geometry.id}`);
        this.vertexBuffers.length = 0;
        delete this.indexBuffer;
    }
}