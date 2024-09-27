class RenderObject {
    constructor(mesh) {
        this.mesh = mesh;
        this.name = mesh.name;

        this.buffers = {
            vertex: null,
            index: null,
        }
        
        this.render = {
            layout: null,
            pipeline: null,
            bindGroup: null,
        }
        
        this.shadow = {
            layout: null,
            pipeline: null,
            bindGroup: null,
        }
    }
    
    setModelBuffer(buffer) {
        this.buffers.model = buffer;
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
    
    setModelBuffer(buffer) {
        this.buffers.model = buffer;
    }

    setRenderPipeline(pipeline, layout) {
        this.render.pipeline = pipeline;
        this.render.layout = layout;
        return this;
    }
    
    setShadowPipeline(pipeline, layout) {
        this.shadow.pipeline = pipeline;
        this.shadow.layout = layout;
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