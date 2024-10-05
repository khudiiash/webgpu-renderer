import { USE } from "../constants";

class SamplerAttachment {
  constructor(name, type, use = USE.RENDER | USE.SHADOW, visibility = GPUShaderStage.FRAGMENT) {
    this.name = name;
    this.type = type;
    this.use = use;
    this.visibility = visibility;
    this.layout = this.getLayoutByType(type);
  }
  
  getLayoutByType(type) {
    if (type === 'sampler') {
      return { };
    }
    
    if (type === 'sampler_comparison') {
      return { type: 'comparison' };
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

export { SamplerAttachment };