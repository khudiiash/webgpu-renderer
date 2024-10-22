import { StringUtils } from "../utils/StringUtils";
import { Utils } from "../utils/Utils";
import { USE } from "../constants";

/**
 * Represents a group of uniforms for a shader program.
 * @class
 * @memberof renderer.shaders
 * 
 * @param {Object} options - The options for creating the UniformGroup.
 * @param {string} options.name - The name of the uniform group.
 * @param {Array} options.uniforms - An array of uniform objects.
 * @param {number} [options.bindGroup=0] - The bind group index.
 * @param {boolean} [options.perMesh=false] - Indicates if the uniform group is per mesh.
 * @param {boolean} [options.isMaterial=false] - Indicates if the uniform group is for material.
 * @param {string} [options.type='uniform'] - The type of the uniform group 
 * @param {'read' | 'read, write'} [options.storageType='read'] - The storage type of the uniform group.
 * @param {'uniform' | 'stroage'} [options.bufferType='uniform'] - The buffer type of the uniform group (uniform | storage).
 * @param {number} [options.visibility=GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT] - The visibility of the uniform group.
 */
class UniformGroup {
    
    constructor({ 
        name, 
        uniforms, 
        bindGroup = 0, 
        perMesh = false, 
        isMaterial = false, 
        type = 'uniform', 
        use = USE.RENDER | USE.SHADOW,
        storageOp = 'read', 
        bufferType = 'uniform',
        visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    }) {
        this.name = name;
        this.uniforms = uniforms;
        this.visibility = visibility;
        this.perMesh = perMesh;
        this.isMaterial = isMaterial;
        this.type = type;
        this.use = use;
        this.bindGroup = bindGroup;
        this.storageOp = storageOp;
        this.bufferType = bufferType;
        this.calculateGroupByteSize();
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
        this.offsets = {};
        this.byteOffsets = {};
        let offset = 0;
        let byteOffset = 0;

        this.bufferLayout = this.bufferType === 'uniform' ? 'uniform' : 
            this.storageOp === 'read' ? 
                'read-only-storage' : 
                'storage';

        this.bufferTypeString = this.bufferType === 'uniform' ? 'uniform' : `storage, ${this.storageOp}`;

        this.uniforms.forEach((uniform) => {
            uniform.bufferOffset = offset;
            this.offsets[uniform.name] = offset;
            offset += uniform.byteSize / Float32Array.BYTES_PER_ELEMENT;
            this.byteOffsets[uniform.name] = byteOffset;
            byteOffset += uniform.byteSize;
        });
    }
    
    mergeData() {
        let offset = 0;
        
        this.uniforms.forEach((uniform) => {
            uniform.bufferOffset = offset;
            this._data.set(uniform.data, offset);
            offset += uniform.data.length;
        }); 
    }
    
    calculateGroupByteSize() {
        const size = this.uniforms.reduce((acc, uniform) => {
            return acc + uniform.byteSize;
        }, 0);
        
        this.byteSize = Utils.align16(size);
        return this.byteSize;
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
    
    getByName(name) {
        return this.uniforms.find(uniform => uniform.name === name);
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
        if (!uniform) {
            return;
        }
        uniform.set(value);
        //this._data.set(uniform.data, uniform.bufferOffset);
    }
    
    getBindGroupString(bindGroup = 0, binding = 0) {
        const isComplex = this.uniforms.length > 1 || this.uniforms[0].isStruct || this.uniforms[0].isStructArray;
        const type = isComplex ? StringUtils.capitalize(this.name) : this.uniforms[0].type;
        return `@group(${bindGroup}) @binding(${binding}) var<${this.bufferTypeString}> ${this.name}: ${type};\n`;
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
    
    has(name) {
        return this.uniforms.some(uniform => uniform.name === name);
    }
    
    get useShadow() {
        return this.use & USE.SHADOW;
    }
    
    get useRender() {
        return this.use & USE.RENDER;
    }
    
    get useCompute() {
        return this.use & USE.COMPUTE;
    }

    get data() {
        return this._data;
    }
    
}

export { UniformGroup };