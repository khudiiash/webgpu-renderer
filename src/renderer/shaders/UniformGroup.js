import { StringUtils } from "../utils/StringUtils";

class UniformGroup {
    constructor({ name, uniforms, bindGroup = 0, visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT }) {
        this.name = name;
        this.uniforms = uniforms;
        this.visibility = visibility;
        this.bindGroup = bindGroup;
        this.byteSize = this.calculateGroupSize();
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
    }
    
    mergeData() {
        let offset = 0;
        
        this.uniforms.forEach((uniform) => {
            uniform.bufferOffset = offset;
            this._data.set(uniform.data, offset);
            offset += uniform.data.length;
        }); 
    }
    
    calculateGroupSize() {
        const size = this.uniforms.reduce((acc, uniform) => {
            return acc + uniform.byteSize;
        }, 0);
        
        return Math.ceil(size / 16) * 16;
    }

    getStructsString() {
        let structStrings = '';
        if (this.uniforms.length > 1) {
            this.uniforms.forEach((uniform) => {
                if (uniform.isStruct || uniform.isStructArray) {
                    structStrings += uniform.structString;
                }
            });
        }
        return structStrings;
    }

    getMainStructString() {
        let uniformString = '';

        if (this.uniforms.length > 1) {
            uniformString = `struct ${StringUtils.capitalize(this.name)} {\n`;
            this.uniforms.forEach((uniform) => {
                uniformString += `    ${uniform.getString()}`
            });
            uniformString += '}\n';
        }
        if (this.uniforms.length === 1) {
            uniformString = this.uniforms[0].structString;
        }
        return uniformString;
    }
    
    get(name) {
        return this.uniforms.find(uniform => uniform.name === name);
    }
    
    set(name, value) {
        const uniform = this.uniforms.find(uniform => uniform.name === name);
        uniform.set(value);
        //this._data.set(uniform.data, uniform.bufferOffset);
    }
    
    getBindGroupString(bindGroup = 0, binding = 0) {
        const isComplex = this.uniforms.length > 1 || this.uniforms[0].isStruct || this.uniforms[0].isStructArray;
        const type = isComplex ? StringUtils.capitalize(this.name) : this.uniforms[0].type;
        return `@group(${bindGroup}) @binding(${binding}) var<uniform> ${this.name}: ${type};\n`;
    }
    
    clone() {
        return new UniformGroup({
            name: this.name,
            uniforms: this.uniforms.map(uniform => uniform.clone()),
            bindGroup: this.bindGroup,
            perMesh: this.perMesh,
            visibility: this.visibility
        });
    }

    get data() {
        return this._data;
    }
    
}

export { UniformGroup };