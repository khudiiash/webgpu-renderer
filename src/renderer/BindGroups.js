class BindGroups {
    constructor(device, renderer) {
        this.device = device;
        this.renderer = renderer;
        this.layoutCache = new Map();
        this.groupCache = new Map();
    }
    
    
    createRenderBindGroupLayout(renderObject) {
        const mesh = renderObject.mesh;
        const material = mesh.material;
        const entries = [];
        let binding = 0;

        for (const uniform of material.uniforms) {
            if (!uniform.useRender) continue;
            const groupGPU = {
                label: uniform.name,
                binding: binding++,
                visibility: uniform.visibility,
                buffer: { type: uniform.bufferLayout }
            };
            entries.push(groupGPU);
        }
        
        for (const texture of material.textures) {
            if (!texture.useRender) continue;
            const textureGPU = {
                label: texture.name,
                binding: binding++,
                visibility: texture.visibility,
                texture: texture.layout
            };
            entries.push(textureGPU);
        }
        
        for (const sampler of material.samplers) {
            if (!sampler.useRender) continue;
            const samplerGPU = {
                label: sampler.name,
                binding: binding++,
                visibility: sampler.visibility,
                sampler: sampler.layout
            };
            entries.push(samplerGPU);
        }
        
        const layout = this.device.createBindGroupLayout({
            label: `${material.type} Render Bind Group Layout`,
            entries
        });
        
        this.layoutCache.set(material, layout);
        

        return layout;
    }
    
    createRenderBindGroup(renderObject, layout) {
        let binding = 0;
        const mesh = renderObject.mesh;
        const skinned = []

        const uniforms = mesh.material.uniforms
            .filter(uniform => uniform.useRender)
            .map((uniform, i) => {
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

        const textures = mesh.material.textures.filter(t => t.useRender).map(texture => {
            let resource = texture.texture?.createView({ label: texture.name }) || this.renderer.textures.getView(texture.name) || this.renderer.textures.getView('default');

            return {
                binding: binding++,
                resource
            }
        });
        
        const samplers = mesh.material.samplers.filter(s => s.useRender).map(sampler => {
            return {
                binding: binding++,
                resource: this.renderer.samplers.get(sampler.type)
            }
        });

        const bindGroup = {
            label: `${mesh.material.type} Render Bind Group`,
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
        // if (this.layoutCache.has(renderObject.mesh.material)) {
        //     return this.layoutCache.get(renderObject.mesh.material);
        // }
        const mesh = renderObject.mesh;
        const material = mesh.material;
        const entries = [];
        let binding = 0;

        for (const uniform of material.uniforms) {
            if (!uniform.useShadow) continue;
            const groupGPU = {
                label: uniform.name,
                binding: binding++,
                visibility: uniform.visibility,
                buffer: { type: uniform.bufferLayout }
            };
            entries.push(groupGPU);
        }
        
        for (const texture of material.textures) {
            if (!texture.useShadow) continue;
            const textureGPU = {
                label: texture.name,
                binding: binding++,
                visibility: texture.visibility,
                texture: texture.layout
            };
            entries.push(textureGPU);
        }
        
        for (const sampler of material.samplers) {
            if (!sampler.useShadow) continue;
            const samplerGPU = {
                label: sampler.name,
                binding: binding++,
                visibility: sampler.visibility,
                sampler: sampler.layout
            };
            entries.push(samplerGPU);
        }
        
        const layout = this.device.createBindGroupLayout({
            label: `${material.type} Shadow Bind Group Layout`,
            entries
        });
        
        this.layoutCache.set(material, layout);

        return layout;
    }

    createShadowBindGroup(renderObject, layout) {
        const mesh = renderObject.mesh;
        let binding = 0;
        const skinned = []

        const uniforms = mesh.material.uniforms
            .filter(uniform => uniform.useShadow)
            .map((uniform, i) => {
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

        const textures = mesh.material.textures.filter(t => t.useShadow).map(texture => {
            let resource = texture.texture?.createView() || this.renderer.textures.getView(texture.name) || this.renderer.textures.getView('default');

            return {
                binding: binding++,
                resource
            }
        });
        
        const samplers = mesh.material.samplers.filter(s => s.useShadow).map(sampler => {
            return {
                binding: binding++,
                resource: this.renderer.samplers.get(sampler.type)
            }
        });

        const bindGroup = {
            label: `${mesh.material.type} Shadow Bind Group`,
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
    
    
    updateBinding(binding) {
        const { buffer } = binding;
        const bufferGPU = this.renderer.get(binding).buffer;
        this.device.queue.writeBuffer(bufferGPU, 0, buffer, 0);
    }
    
}

export { BindGroups };