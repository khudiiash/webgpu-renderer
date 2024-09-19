class RenderObject {
    constructor(mesh) {
        this.mesh = mesh;
        this.name = mesh.name;

        this.buffers = {
            vertex: null,
            index: null,
        }
        
        this.render = {
            pipeline: null,
            bindGroup: null,
        }
        
        this.shadow = {
            pipeline: null,
            bindGroup: null,
        }
    }
    
    setVertexBuffer(vertex) {
        this.buffers.vertex = vertex;
    }
    
    setIndexBuffer(index) {
        this.buffers.index = index;
    }
    
    setUniformBuffer(name, buffer) {
        this.buffers[name] = buffer;
    }

    setRenderPipeline(pipeline) {
        this.render.pipeline = pipeline;
        return this;
    }
    
    setShadowPipeline(pipeline) {
        this.shadow.pipeline = pipeline;
        return this;
    }
    
    setRenderBindGroup(bindGroup) {
        this.render.bindGroup = bindGroup;
        return this;
    }
    
    setShadowBindGroup(bindGroup) {
        this.shadow.bindGroup = bindGroup;
        return this;
    }
    
}

export { RenderObject };