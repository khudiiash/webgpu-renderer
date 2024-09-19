class SamplerAttachment {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.visibility = GPUShaderStage.FRAGMENT;
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
}

export { SamplerAttachment };