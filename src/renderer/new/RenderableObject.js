import { GPUResourceManager } from './GPUResourceManager.js';
import { PipelineManager } from './PipelineManager.js';
import { UniformData } from './UniformData.js';
import { autobind, Utils } from '../../utils';

class RenderableObject {
    constructor(mesh) {
        autobind(this);
        this.mesh = mesh;
        this.material = mesh.material;
        this.geometry = mesh.geometry;
        this.id = Utils.GUID('renderable');
        
        this.resourceManager = GPUResourceManager.getInstance();
        this.pipelineManager = PipelineManager.getInstance();
        
        this.pipeline = null;
        this.data = new Map();
        
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

    createBindGroups() {
        const shader = this.material.shader;
        const bindings = shader.bindings;
        const bindGroups = [];
        const layouts = this.getBindGroupLayouts();
        const { GLOBAL, MODEL, MATERIAL } = PipelineManager.LAYOUT_GROUPS;

        for (let i = 0; i < layouts.length; i++) {
            const layout = layouts[i];
            const groupBindings = bindings.filter(b => b.group === i);
            
            const config = {
                name: `bgl_${shader.name}_${i}`,
                layout: layout,
                items: []
            };

            for (const binding of groupBindings) {
                let uniformData;
                if (binding.group === GLOBAL) {
                    uniformData = UniformData.getByName(binding.name);    
                } else if (binding.group === MODEL) {
                    uniformData = this.mesh.uniforms;
                } else if (binding.group === MATERIAL) {
                    uniformData = this.material.uniforms;
                }
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
                    const type = uniformData.textures.get(binding.name)?.samplerType;
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
                uniformData.onChange(this.updateBuffer);
            }

            bindGroups[i] = this.resourceManager.createBindGroup(config);
        }
        this.bindGroups = bindGroups;
    }

    updateBuffer(id) {
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
                data: this.geometry.indices, 
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                id: 'ib_' + this.geometry.id,
            },
        );
    }
    
    createVertexBuffer() {
        this.vertexBuffer = this.resourceManager.createAndUploadBuffer({
            name: "Geometry Vertex Buffer",
            data: this.geometry.packed,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            id: 'vb_' + this.geometry.id,
        });
        return this.vertexBuffer;
    }
    
    render(passEncoder) {
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        
        // Set vertex buffers
        for (const [name, buffer] of this.vertexBuffers.entries()) {
            if (name === 'index') continue;
            const location = this.getAttributeLocation(name);
            passEncoder.setVertexBuffer(location, buffer);
        }
        
        // Draw
        if (this.vertexBuffers.has('index')) {
            const indexBuffer = this.vertexBuffers.get('index');
            passEncoder.setIndexBuffer(indexBuffer, 'uint16');
            passEncoder.drawIndexed(this.mesh.indices.length);
        } else {
            passEncoder.draw(this.mesh.positions.length / 3);
        }
    }
    
    getAttributeLocation(name) {
        // Map attribute names to shader locations
        const locationMap = {
            position: 0,
            normal: 1,
            uv: 2
        };
        return locationMap[name] || 0;
    }
    
    dispose() {
        // Clean up resources
        for (const [name, _] of this.vertexBuffers.entries()) {
            this.resourceManager.releaseResource(`${this.mesh.id}_${name}`);
        }
    }
}

export { RenderableObject };