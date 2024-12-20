import { map } from "../math/MathUtils";
import { arraysEqual } from "../utils/arraysEqual";

class Buffers {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this._objects = new Map();
        this._buffers = new Map();
        this._data = new Map();
        this._instanceBuffers = new Map();
        this.createLightProjectionViewBuffer();
    }
    
    createLightProjectionViewBuffer() {
        const buffer = this.device.createBuffer({
            label: 'Light Projection View Buffer',
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._buffers.set('lightProjViewMatrix', buffer);
    }
    
    createShadowDepthBuffer(shadowTexture) {
        const buffer = this.device.createBuffer({
            label: 'Shadow Depth Buffer',
            size: shadowTexture.width * shadowTexture.height * 4,
            usage:  GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        this._buffers.set('shadowDepth', buffer);
    }
    
    createUniformBuffer(uniform, object) {
        if (object && this._objects.has(object) && this._objects.get(object).has(uniform.name)) {
            return this._objects.get(object).get(uniform.name);
        }
        if (!object && this._buffers.has(uniform.name)) {
            return this._buffers.get(uniform.name);
        }

        let buffer;
        try {
            buffer = this.device.createBuffer({
                label: uniform.name,
                size: uniform.byteSize,
                usage: GPUBufferUsage[uniform.bufferType.toUpperCase()] | GPUBufferUsage.COPY_DST,
            });
        } catch(e) {
            debugger;
        }
        
        
        if (object) {
            if (!this._objects.has(object)) {
                this._objects.set(object, new Map());
            }
            this._objects.get(object).set(uniform.name, buffer);

            if (object.data) {
                this.write(buffer, object.data);
                this._data.set(buffer, new Float32Array(object.data));
            }
            if (object.isMaterial) {
                this.write(buffer, object.data);
            }

            if (uniform.name === 'instances') {
                buffer.label = object.name;
                this.write(buffer, object.instanceMatrix || object.matrixWorld.data);
                this._data.set(buffer, new Float32Array(object.instanceMatrix ?? object.matrixWorld.data));
                this._instanceBuffers.set(object, buffer);
            }

            object.on('write', ({ data, name, byteOffset }) => {
                this.write(this._objects.get(object)?.get(name), data, byteOffset)
            }, this);    

            if (!uniform.perMesh) {
                this._buffers.set(uniform.name, buffer);
            } else {
                this._buffers.set(object, buffer);
            }
        } else {
            this._buffers.set(uniform.name, buffer);
            if (uniform.data) {
                this.write(buffer, uniform.data);
                this._data.set(buffer, new Float32Array(uniform.data));
            }
        }

        return buffer;
    }
    
    write(buffer, data, byteOffset = 0) {
        if (!buffer || !data) return false;
        if (typeof buffer === 'string' && this._buffers.has(buffer)) {
            buffer = this._buffers.get(buffer);
        }
        if (!(buffer instanceof GPUBuffer)) return false;
        if (arraysEqual(this._data.get(buffer), data)) return false;

        this.device.queue.writeBuffer(buffer, byteOffset, data);
        this._data.get(buffer)?.set(data, byteOffset / Float32Array.BYTES_PER_ELEMENT);
        return true;
    }
    
    getBufferData(buffer) {
        if (!buffer) return;
        if (buffer instanceof GPUBuffer) {
            return this._data.get(buffer);
        }
        if (typeof buffer === 'string') {
            buffer = this._buffers.get(buffer);
            return this._data.get(buffer);        
        }
        if (buffer.isObject3D) {
            return this._data.get(this._objects.get(buffer)?.get('model'));
        }
    }
    
    getBufferDataByObject(object, name) {
        return this._data.get(this._objects.get(object).get(name));
    }
    
    getInstanceBuffer(object) {
        return this._instanceBuffers.get(object);
    }
    
    
    createBuffer(name, size, usage, data) {
        const buffer = this.device.createBuffer({
            label: name,
            size: size,
            usage: usage,
        });
        if (data) {
            this.device.queue.writeBuffer(buffer, 0, data);
            this._data.set(buffer, new Float32Array(data));
        } else {
            this._data.set(buffer, new Float32Array(size / Float32Array.BYTES_PER_ELEMENT));
        }
        this._buffers.set(name, buffer);
        return buffer;
    }
    
    
    createIndexBuffer(data, name = 'Index Buffer') {
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(buffer, 0, data);
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
    
    
    has(name) {
        return this._buffers.has(name);
    }
    
    get(buffer, uniformName) {
        if (typeof buffer === 'string') {
            return this._buffers.get(buffer);
        } else if (buffer.isObject3D && uniformName) {
            return this._objects.get(buffer)?.get(uniformName);
        } else if (buffer.isObject3D) {
            return this._objects.get(buffer);
        }
    }
    
    delete(name) {
        this._buffers.delete(name);
    }
    
    clear() {
        this._buffers.clear();
    }
    
}

export { Buffers };