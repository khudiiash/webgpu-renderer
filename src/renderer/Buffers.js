class Buffers {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this._buffers = new Map();
    }
    
    createUniformBuffer(uniform, data) {
        const buffer = this.device.createBuffer({
            label: uniform.name,
            size: uniform.byteSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        if (uniform.data) {
            this.device.queue.writeBuffer(buffer, 0, uniform.data);
        }

        if (data) {
            this.device.queue.writeBuffer(buffer, 0, data);
        }
        
        this._buffers.set(uniform.name, buffer);
        return buffer;
    }
    
    createBuffer(name, size, usage) {
        const buffer = this.device.createBuffer({
            label: name,
            size,
            usage,
        });
        this._buffers.set(name, buffer);
        return buffer;
    }
    
    createStorageBuffer(name, data) {
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        
        this._buffers.set(name, buffer);
        return buffer;
    }
    
    createIndexBuffer(data, name = 'Index Buffer') {
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        try {
            this.device.queue.writeBuffer(buffer, 0, data);
        } catch(e) {
            console.log(e);
        }
        return buffer;
    }
    
    createVertexBuffer(data, label = 'Vertex Buffer') {
        const buffer = this.device.createBuffer({
            label: label,
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(buffer, 0, data);
        return buffer;
    }
    
    writeBuffer(name, data, offset = 0) {
        const buffer = this._buffers.get(name);
        this.device.queue.writeBuffer(buffer, offset, data);
    }
    
    has(name) {
        return this._buffers.has(name);
    }
    
    get(name) {
        return this._buffers.get(name);
    }
    
    delete(name) {
        this._buffers.delete(name);
    }
    
    clear() {
        this._buffers.clear();
    }
    
}

export { Buffers };