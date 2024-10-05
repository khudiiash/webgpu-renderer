import { USE } from '../constants';

class TextureAttachment {
    constructor(name, type, texture, use = USE.RENDER | USE.SHADOW, visibility = GPUShaderStage.FRAGMENT) {
        this.name = name;
        this.type = type;
        this.use = use;
        this.texture = texture;
        this.layout = this.getLayoutByType(type);
        this.visibility = visibility;
    }
    
    setTexture(texture) {
        this.texture = texture;
        return this;
    }
    
    getLayoutByType(type) { 
        if (type === 'texture_2d<f32>') {
            return { };
        }
        
        if (type === 'texture_depth_2d') {
            return { sampleType: 'depth' };
        }
        if (type === 'texture_3d<f32>') {
            return { viewDimension: '3d', sampleType: 'unfilterable-float'  };
        }
    }
    
    getBindGroupString(group = 0, binding = 0) {
        return `\n@group(${group}) @binding(${binding}) var ${this.name}: ${this.type};`;
    }
    
    get useRender() {
        return this.use & USE.RENDER;
    }
    
    get useShadow() {
        return this.use & USE.SHADOW;
    }
    
    get useCompute() {
        return this.use & USE.COMPUTE;
    }
}


export { TextureAttachment };