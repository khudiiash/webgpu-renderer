class BindGroups {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
    }
    
    
    // createBindGroupLayout(object, label = '') {
    //     if (this.bindGroupLayoutCache.has(object.material.type)) {
    //         return this.bindGroupLayoutCache.get(object.material.type);
    //     }
        
    //     const samplerTypes = new Set(); 
        
    //     const entries = [];
    //     let binding = 0;

    //     for (const group of object.material.uniforms) {
    //         const groupGPU = {
    //             label,
    //             binding: binding++,
    //             visibility: group.visibility,
    //             resource: { buffer: { type: 'uniform' } }
    //         };
    //         entries.push(groupGPU);
    //     }
        
    //     for (const texture of object.material.textures) {
    //         const textureGPU = {
    //             label,
    //             binding: binding++,
    //             visibility: texture.visibility,
    //             texture: texture.textureLayout,
    //         };
    //         samplerTypes.add(texture.samplerType);
    //         entries.push(textureGPU);
    //     }
        
        
    //     for (const type of samplerTypes) {
    //         const sampler = {
    //             label,
    //             binding: binding++,
    //             visibility: GPUShaderStage.FRAGMENT,
    //             sampler: this.renderer.samplers.getSamplerLayout(type)
    //         };
    //         entries.push(sampler)
    //     }
        

    //     const layout = this.device.createBindGroupLayout({
    //         label: `${object.material.type} Bind Group Layout`,
    //         entries
    //     });

    //     this.bindGroupLayoutCache.set(object.material.type, layout);

    //     return layout;
    // }
    // 

    createRenderBindGroupLayout(renderObject) {
        const mesh = renderObject.mesh;
        const material = mesh.material;
        const entries = [];
        let binding = 0;

        for (const uniform of material.uniforms) {
            const groupGPU = {
                binding: binding++,
                visibility: uniform.visibility,
                buffer: { type: 'uniform' }
            };
            entries.push(groupGPU);
        }
        
        for (const texture of material.textures) {
            const textureGPU = {
                binding: binding++,
                visibility: texture.visibility,
                texture: texture.layout
            };
            entries.push(textureGPU);
        }
        
        for (const sampler of material.samplers) {
            const samplerGPU = {
                binding: binding++,
                visibility: sampler.visibility,
                sampler: sampler.layout
            };
            entries.push(samplerGPU);
        }

        const layout = this.device.createBindGroupLayout({
            label: `${material.type} Bind Group Layout`,
            entries
        });

        return layout;
    }
    
    createRenderBindGroup(renderObject) {
        let binding = 0;
        const mesh = renderObject.mesh;

        const uniforms = mesh.material.uniforms.map((uniform, i) => {
            let buffer = null;
            if (uniform.perMesh) {
                buffer = this.renderer.buffers.createUniformBuffer(uniform);
            } else {
                buffer = this.renderer.buffers.get(uniform.name) ?? this.renderer.buffers.createUniformBuffer(uniform); 
            }
            renderObject.setUniformBuffer(uniform.name, buffer);
            
            return {
                binding: binding++,
                resource: { buffer }
            }
        });
        const textures = mesh.material.textures.map(texture => {
            let resource = texture.texture?.createView() || this.renderer.textures.getView(texture.name);


            return {
                binding: binding++,
                resource
            }
        });
        
        const samplers = mesh.material.samplers.map(sampler => {
            return {
                binding: binding++,
                resource: this.renderer.samplers.get(sampler.type)
            }
        });

        const bindGroup = {
            label: `${mesh.material.type} Bind Group`,
            layout: renderObject.render.pipeline.getBindGroupLayout(0),
            entries:  [
                ...uniforms,
                ...textures,
                ...samplers,
            ]       
        };

        const group = this.device.createBindGroup(bindGroup);
        return group;
    }    

    createShadowBindGroup(modelBuffer, layout) {
        const shadowBindGroup = this.device.createBindGroup({
            label: 'Group for shadow pass',
            layout: layout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.renderer.buffers.get('lightProjViewMatrix') ?? 
                        this.renderer.buffers.createBuffer('lightProjViewMatrix', 64, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
                    }
                }
            ]
        })

        return shadowBindGroup;
    }
    
    
    updateBinding(binding) {
        const { buffer } = binding;
        const bufferGPU = this.renderer.get(binding).buffer;
        this.device.queue.writeBuffer(bufferGPU, 0, buffer, 0);
    }
    
}

export { BindGroups };