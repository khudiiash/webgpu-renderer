import { Color } from '../../math/Color.js';
import { Vector3 } from '../../math/Vector3.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { Utils } from '../utils/Utils.js';
import { StringUtils } from '../utils/StringUtils.js';
import { TYPE_BYTE_SIZE, TYPE_COUNT } from '../constants/index.js';

class Uniform {
    constructor(name) {
        this.name = name;
        this.isUniform = true;
        this.byteSize = 0;
        this.bufferOffset = 0;
        this._needsUpdate = true;
        this._data = new Float32Array([]);
    }
    
    setBuffer(buffer) {
        this.buffer = buffer;
        return this;
    }
    
    uint(value) {
        this.value = value || 0;
        this.isUint = true;
        this.type = 'u32';
        this.byteSize = 4;
        this._data = new Float32Array([value]);
        return this;
    }
    
    color(value) {
        this.value = value || new Color();
        this.isColor = true;
        this.type = 'vec4f';
        this.byteSize = Color.byteSize;
        this._data = this.value.data;
        return this;
    }
    
    vec2(value) {
        this.value = value || [0, 0];
        this.isVector2 = true;
        this.type = 'vec2f';
        this.byteSize = 8;
        this._data = new Float32Array(this.value);
        return this;
    }
    
    vec3(value) {
        this.value = value || [0, 0, 0];
        this.isVector3 = true;
        this.type = 'vec3f';
        this.byteSize = 12;
        this._data = new Float32Array(this.value);
        return this;
    }
    
    vec4(value) {
        this.value = value || [0, 0, 0, 0];
        this.isVector4 = true;
        this.type = 'vec4f';
        this.byteSize = 16;
        this._data = new Float32Array(this.value.data);
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
        this._data = new Float32Array([value]);
        return this;
    }
    
    mat4(value) {
        this.value = value || new Matrix4().identity()
        this.byteSize = Matrix4.byteSize;
        this.isMat4 = true;
        this.type = 'mat4x4f';
        this._data = this.value.data;
        return this;
    }
    
    storage(count, type) {
        this.isStorage = true;
        this.type = `array<${type}>`;
        this.byteSize = count * TYPE_BYTE_SIZE[type];
        this._data = new Float32Array(count * TYPE_COUNT[type]);
        return this;
    }
    
    mat4Array(count) {
        this.value = [];
        this.byteSize = Matrix4.byteSize * count;
        this.isMat4Array = true;
        this.type = `array<mat4x4f, ${count}>`;
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
        return this;
    }
    
    mat3(value) {
        this.value = value;
        this.byteSize = 64;
        this.isMat3 = true;
        this.type = 'mat3x3f';
        this._data = new Float32Array(value.data);
        return this;
    }
    
    struct(structName, struct) {
        this.isStruct = true;
        this.structString = StringUtils.structToString(structName, struct);
        this.type = structName;
        const size = Object.values(struct).reduce((acc, type) => {
            return acc + TYPE_BYTE_SIZE[type];
        }, 0);
        this.byteSize = Utils.align16(size);
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
        return this;
    }
    
    
    structArray(structName, struct, count = 1) {
        this.isStructArray = true;
        this.structString = StringUtils.structToString(structName, struct);
        const byteSize = Utils.getStructByteSize(struct) * count;
        this.byteSize = Math.ceil(byteSize / 16) * 16;
        this.type = `array<${structName}, ${count}>`;
        this._data = new Float32Array(this.byteSize / Float32Array.BYTES_PER_ELEMENT);
        return this;
    }
    
    set(value) {
        this.value = value;
        if (value.data) {
            this._data.set(value.data);
        }
        if (typeof value === 'number') {
            this._data[0] = value;
        }
        if (Array.isArray(value) && value[0].data) {
            let offset = 0;
            for (let i = 0; i < value.length; i++) {
                this._data.set(value[i].data, offset);
                offset += value[i].data.length;
            }
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
    
    clone() {
        const uniform = new Uniform(this.name);
        Object.assign(uniform, this);
        uniform._data = new Float32Array(this._data);
        return uniform;
    }
    
}

export { Uniform };