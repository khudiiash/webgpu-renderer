class TextureAttachment {
    constructor(name, type, resourceLayout, resourceBinding, resource, visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT) {
        this.name = name;
        this.type = type;
        this.resourceLayout = resourceLayout; 
        this.resourceBinding = resourceBinding;
        this.resource = resource;
        this.visibility = visibility;
    }
    
    setResource(resource) {
        this.resource = resource;
        return this;
    }
    
    getBindGroupString(group = 0, binding = 0) {
        return `\n@group(${group}) @binding(${binding}) var ${this.name}: ${this.type};`;
    }
}


export { TextureAttachment };