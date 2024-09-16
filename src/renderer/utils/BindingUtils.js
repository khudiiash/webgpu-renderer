
class BindingUtils {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this.bindGroupLayoutCache = new Map();
        this.bindGroupCache = new Map();
        this.buffersCache = new Map();
        this.samplersCache = new Map();
        this.objectBindGroup = this.device.createBindGroupLayout({
            label: 'Model View Projection Bind Group',
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform'
                    }
                }
            ]
        });
    }
    
    getObjectBindGroupLayout() {
        return this.objectBindGroup;
    }

    createMaterialBindGroupLayout(object, label = '') {
        if (this.bindGroupLayoutCache.has(object.material.type)) {
            return this.bindGroupLayoutCache.get(object.material.type);
        }
        
        const entries = [];
        let binding = 0;
        for (const group of object.material.uniforms) {
            const groupGPU = {
                label,
                binding: binding++,
                visibility: group.visibility,
                ...group.resource            
            };
            entries.push(groupGPU);
        }
        
        for (const texture of object.material.textures) {
            const textureGPU = {
                label,
                binding: binding++,
                visibility: texture.visibility,
                texture: texture.resourceLayout,
            };
            entries.push(textureGPU);
        }
        
        for (const sampler of object.material.samplers) {
            const samplerGPU = {
                label,
                binding: binding++,
                visibility: sampler.visibility,
                sampler: sampler.resourceLayout,
            };
            entries.push(samplerGPU);
        }

        const layout = this.device.createBindGroupLayout({
            label: `${object.material.type} Bind Group Layout`,
            entries
        });
        this.bindGroupLayoutCache.set(object.material.type, layout);
        return layout;
    }
    
    createMaterialBindGroup(object, layout, buffers) {
        if (this.bindGroupCache.has(object.material)) {
            return this.bindGroupCache.get(object.material);
        }

        let binding = 0;
        const uniforms = object.material.uniforms.map((uniform, i) => {
            let resource = {};
            if (uniform.resource.buffer) {
                if (uniform.name === 'lights' || uniform.name === 'fog') {
                    if (this.buffersCache.has(uniform)) {
                        resource.buffer = this.buffersCache.get(uniform);
                    } else {
                        const buffer = this.device.createBuffer({
                            label: uniform.name,
                            size: uniform.bufferSize,
                            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                        }); 
                        this.device.queue.writeBuffer(buffer, 0, uniform.data);
                        resource.buffer = buffer;
                        this.buffersCache.set(uniform, buffer);
                    }
                } else {
                    const buffer = this.device.createBuffer({
                        label: uniform.name,
                        size: uniform.bufferSize,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                    }); 
                    this.device.queue.writeBuffer(buffer, 0, uniform.data);
                    resource.buffer = buffer;
                }
                buffers[uniform.name] = resource.buffer;
                resource.buffer = resource.buffer;
            }
            
            return {
                binding: binding++,
                resource
            }
        });
        const textures = object.material.textures.map(texture => {
            let resource = {};
            if (texture.name === 'shadowMap') {
                   resource = this.renderer.shadowTextureView
            }
            else if (texture.resource instanceof GPUTexture) {
                resource = texture.resource.createView();
            } else {
                resource = this.renderer.defaultTextureView
            }

            return {
                binding: binding++,
                resource
            }
        });
        
        const samplers = object.material.samplers.map(sampler => {
            let resource = this.device.createSampler(sampler.resourceBinding);
            this.depthSampler = resource;
            return {
                binding: binding++,
                resource
            }
        });

        const bindGroup = {
            label: `${object.material.type} Bind Group`,
            layout,
            entries:  [
                ...uniforms,
                ...textures,
                ...samplers,
            ]       
        };

        const group = this.device.createBindGroup(bindGroup);
        this.bindGroupCache.set(object.material, group);
        return group;
    }
    
    createShadowBindGroup(pipeline, buffers) {
        const shadowBindGroup = this.device.createBindGroup({
            label: 'Group for shadow pass',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: buffers.modelMatrixBuffer 
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: buffers.lightBuffer
                    }
                }
            ]
        })

        return shadowBindGroup;
    }
    
    createObjectBindGroup(object, layout, buffers) {
        const buffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        buffers.mvp = buffer;

        const bindGroup = {
            label: 'Model View Projection Bind Group',
            layout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer }
                }
            ]
        };
        return this.device.createBindGroup(bindGroup); 
    }

    
    updateBinding(binding) {
        const { buffer } = binding;
        const bufferGPU = this.renderer.get(binding).buffer;
        this.device.queue.writeBuffer(bufferGPU, 0, buffer, 0);
    }
    
}

export { BindingUtils };