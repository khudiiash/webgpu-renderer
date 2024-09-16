import { GPUTypeSize } from '../utils/Constants.js';
import { UniformUtils } from './UniformUtils.js';
import { Color } from '../../math/Color.js';
import { Matrix4 } from '../../math/Matrix4.js';

class Uniform {
    constructor(name) {
        this.name = name;
        this.isUniform = true;
        this.byteSize = 0;
        this._needsUpdate = true;
    }
    
    setBuffer(buffer) {
        this.buffer = buffer;
        return this;
    }
    
    color(value) {
        if (!value instanceof Color) {
            throw new Error('Uniform.color: value must be an instance of Color');
        }
        this.value = value;
        this.isColor = true;
        this.type = 'vec4f';
        this.byteSize = value.byteSize;
        this._data = new Float32Array(value.data);
        return this;
    }
    
    textureDepth(value) {
        this.value = value;
        this.isTextureDepth = true;
        this.type = 'texture_depth_2d<f32>';
        this.byteSize = 0;
        this._data = new Float32Array([]);
        return this;
    }
    
    samplerComparison(value) {
        this.value = value;
        this.isSamplerComparison = true;
        this.type = 'sampler_comparison';
        this.byteSize = 0;
        this._data = new Float32Array([]);
        return this;
    }
    
    float(value) {
        this.value = value;
        this.byteSize = 4;
        this.type = 'f32';
        this.isFloat = true;
        this._data = new Float32Array([value]);
        return this;
    }
    
    int(value) {
        this.value = value;
        this.byteSize = 4;
        this.isInt = true;
        this.type = 'i32';
        this._data = new Int32Array([value]);
        return this;
    }
    
    mat4(value) {
        this.value = value;
        this.byteSize = Matrix4.byteSize;
        this.isMat4 = true;
        this.type = 'mat4x4f';
        this._data = new Float32Array(value.data);
        return this;
    }
    
    mat3(value) {
        this.value = value;
        this.byteSize = 36;
        this.isMat3 = true;
        this.type = 'mat3x3f';
        this._data = new Float32Array(value.data);
        return this;
    }
    
    
    structArray(value, struct, count = 1) {
        this.value = value; 
        this.struct = struct;
        this.byteSize = struct.byteSize * count;
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
        this._data.set(value);
        this.type = `array<${struct.name}, ${count}>`;
        this.isArray = true;
        return this;
    }
    
    floatArray(value = 1) {
        this.value = value;
        this.byteSize = value.length * 4;
        this.isFloatArray = true;
        this._data = new Float32Array(value);
        return this;
    }
    
    vec3Array(value, count = 1) {
        this.value = value;
        this.byteSize = value.length * 12;
        this.isVec3Array = true;
        this._data = new Float32Array(value);
        return this;
    }
    
    vec4Array(value, count = 1) {
        this.value = value;
        this.byteSize = value.length * 16;
        this.isVec4Array = true;
        this._data = new Float32Array(value);
        return this;
    }
    
    set(value) {
        this.value = value;
        if (this.isColor || this.isMat4 || this.isMat3) {
            this._data.set(value.data);
        }
        if (this.isFloat || this.isInt) {
            this._data[0] = value;
        }
        return this;
    }

    get data() {
        return this._data;
    }
    
    get needsUpdate() {
        return this._needsUpdate;
    }
    
    getString() {
        return `${this.name}: ${this.type},\n`;
    }
}

export { Uniform };