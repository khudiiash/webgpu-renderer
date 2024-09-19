
class TextureAttachment {
    constructor(name, type, texture, visibility = GPUShaderStage.FRAGMENT) {
        this.name = name;
        this.type = type;
        this.texture = texture;
        this.layout = this.getLayoutByType(type);
        this.visibility = visibility;
    }
    
    setResource(resource) {
        this.resource = resource;
        return this;
    }
    
    getLayoutByType(type) { 
        if (type === 'texture_2d<f32>') {
            return { };
        }
        
        if (type === 'texture_depth_2d') {
            return { sampleType: 'depth' };
        }
    }
    
    getBindGroupString(group = 0, binding = 0) {
        return `\n@group(${group}) @binding(${binding}) var ${this.name}: ${this.type};`;
    }
}


export { TextureAttachment };