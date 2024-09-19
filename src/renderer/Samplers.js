class Samplers {
    constructor(renderer) {
        this.device = renderer.device;
        this.samplers = {};
        this.createSampler();
        this.createComparison();
    }
    
    createSampler() {
        const sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            addressModeW: 'repeat',
        });
        
        this.samplers.sampler = sampler;
    }
    
    getSamplerLayout(type) {
        if (type === 'texture_2d<f32>') {
            return { };
        }
        
        if (type === 'texture_depth_2d') {
            return { type: 'comparison' };
        }
    }
    
    createComparison() {
        const sampler = this.device.createSampler({
            compare: 'less',
        });
        
        this.samplers.sampler_comparison = sampler;
    }

    add(name, sampler) {
        this.samplers[name] = sampler;
    }
    
    remove(name) {
        delete this.samplers[name];
    }
    
    has(name) {
        return this.samplers[name] !== undefined;
    }
    
    get(name) {
        return this.samplers[name];
    }
}

export { Samplers };