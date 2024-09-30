class BindGroups {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this.layoutCache = new Map();
        this.groupCache = new Map();
    }
    
    
    createRenderBindGroupLayout(renderObject) {
        if (this.layoutCache.has(renderObject.mesh.material)) {
            return this.layoutCache.get(renderObject.mesh.material);
        }
        const mesh = renderObject.mesh;
        const material = mesh.material;
        const entries = [];
        let binding = 0;

        for (const uniform of material.uniforms) {
            const groupGPU = {
                label: uniform.name,
                binding: binding++,
                visibility: uniform.visibility,
                buffer: { type: uniform.bufferLayout }
            };
            entries.push(groupGPU);
        }
        
        for (const texture of material.textures) {
            const textureGPU = {
                label: texture.name,
                binding: binding++,
                visibility: texture.visibility,
                texture: texture.layout
            };
            entries.push(textureGPU);
        }
        
        for (const sampler of material.samplers) {
            const samplerGPU = {
                label: sampler.name,
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
        
        this.layoutCache.set(material, layout);
        

        return layout;
    }
    
    createRenderBindGroup(renderObject, layout) {
        let binding = 0;
        const mesh = renderObject.mesh;
        const skinned = []

        const uniforms = mesh.material.uniforms.map((uniform, i) => {
            let buffer = null;

            if (uniform.perMesh) {
                buffer = this.renderer.buffers.createUniformBuffer(uniform, mesh);
            } else if (uniform.isMaterial) {
                buffer = this.renderer.buffers.createUniformBuffer(uniform, mesh.material);
            } else {
                buffer = this.renderer.buffers.createUniformBuffer(uniform); 
            }
            
            renderObject.setUniformBuffer(uniform.name, buffer);
            
            return {
                label: uniform.name,
                binding: binding++,
                resource: { buffer }
            }
        });

        const textures = mesh.material.textures.map(texture => {
            let resource = texture.texture?.createView() || this.renderer.textures.getView(texture.name) || this.renderer.textures.getView('default');

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
            layout: layout,
            entries:  [
                ...uniforms,
                ...skinned,
                ...textures,
                ...samplers,
            ]       
        };
        
        const group = this.device.createBindGroup(bindGroup);
        return group;
    }    
    
    createShadowBindGroupLayout(renderObject) {
        const mesh = renderObject.mesh;
        const isInstanced = mesh.isInstancedMesh;
        const bufferType = isInstanced ? 'read-only-storage' : 'uniform'; 
        
        const layout = this.device.createBindGroupLayout({
            label: `Shadow Bind Group Layout`,
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: bufferType }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                }
            ]
        });

        return layout;
    }

    createShadowBindGroup(renderObject, layout) {
        const mesh = renderObject.mesh;
        const buffers = this.renderer.buffers;
        const model = buffers.get(mesh, 'model') || buffers.get(mesh, 'instances');
        const entries = [
                {
                    binding: 0,
                    resource: {
                        buffer: model 
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.renderer.buffers.get('lightProjViewMatrix') ?? 
                        this.renderer.buffers.createBuffer('lightProjViewMatrix', 64, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
                    }
                },
                {
                    binding: 2,
                    resource: renderObject.mesh.material.diffuseMap?.createView() || this.renderer.textures.getView('default'),
                },
                {
                    binding: 3,
                    resource: this.renderer.samplers.get('sampler')
                }
            ];
        const shadowBindGroup = this.device.createBindGroup({
            label: 'Group for shadow pass',
            layout: layout,
            entries
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