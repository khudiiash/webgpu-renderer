class Samplers {
    constructor(renderer) {
        this.device = renderer.device;
        this.samplers = {};
        this.createSampler();
        this.createComparison();
    }
    
    createSampler() {
        const sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            addressModeW: 'repeat',
        });
        
        this.samplers.sampler = sampler;
    }
    
    createNearestSampler() {
        const sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            addressModeW: 'repeat',
        });
        
        this.samplers.nearest = sampler;
    }
    
    getSamplerLayout(type) {
        if (type === 'texture_2d<f32>') {
            return { viewDimension: '2d' };
        }
        
        if (type === 'texture_depth_2d') {
            return { type: 'comparison' };
        }
        if (type === 'texture_3d<f32>') {
            return { viewDimension: '3d'  };
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