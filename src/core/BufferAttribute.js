import { Vector3 } from '../math/Vector3.js';
import { Vector2 } from '../math/Vector2.js';

const _vector = new Vector3();
const _vector2 = new Vector2();

class BufferAttribute {
    constructor(array, itemSize, normalized = false) {
        this.array = array;
        this.isBufferAttribute = true;
        this.itemSize = itemSize;
        this.normalized = normalized === true;
        this.version = 0;
    }
    get count() {
        return this.array.length / this.itemSize;
    } 

    set needsUpdate(value) {
        if (value === true) {
            this.version++;
        }
        this._needsUpdate =value;
    }
    
    get needsUpdate() {
        return this._needsUpdate;
    }
    
    getX(index) {
        return this.array[index * this.itemSize];
    }
    
    setX(index, x) {
        this.array[index * this.itemSize] = x;
        return this;
    }
    
    getY(index) {
        return this.array[index * this.itemSize + 1];
    }

    setY(index, y) {
        this.array[index * this.itemSize + 1] = y;
        return this;
    }

    getZ(index) {
        return this.array[index * this.itemSize + 2];
    }
    
    setZ(index, z) {
        this.array[index * this.itemSize + 2] = z;
        return this;
    }

    getW(index) {
        return this.array[index * this.itemSize + 3];
    }
    
    setW(index, w) {
        this.array[index * this.itemSize + 3] = w;
        return this;
    }
    
    setXYZW(index, x, y, z, w) {
        const index2 = index * this.itemSize;
        this.array[index2] = x;
        this.array[index2 + 1] = y;
        this.array[index2 + 2] = z;
        this.array[index2 + 3] = w;
        return this;
    }

    getComponent(index, componentIndex) {
        return this.array[index * this.itemSize + componentIndex];
    }

    setComponent(index, componentIndex, value) {
        this.array[index * this.itemSize + componentIndex] = value;
        return this;
    }
    
    set(value, offset = 0) {
        this.array.set(value, offset);
        return this;
    }
    
    getComponent(index, componentIndex) {
        return this.array[index * this.itemSize + componentIndex];
    }
    
    setComponent(index, componentIndex, value) {
        this.array[index * this.itemSize + componentIndex] = value;
    }
    
    copyArray(array) {
        this.array.set(array);
        return this;
    }
}

function getGPUType(array, itemSize) {
    const pf = array instanceof Float32Array ? 'f' : 'i';
    if (itemSize === 1) return pf + '32';
    if (itemSize === 2) return 'vec2' + pf;
    if (itemSize === 3) return 'vec3' + pf;
    if (itemSize === 4) return 'vec4' + pf;
    if (itemSize === 9) return 'mat3x3' + pf;
    if (itemSize === 16) return 'mat4x4' + pf;
     
}

class Float32BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
        super(new Float32Array(array), itemSize, normalized);
        this.format = 'float32x' + itemSize;
        this.type = getGPUType(this.array, itemSize);
    }
}

class Uint16BufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
        super(new Uint16Array(array), itemSize, normalized);
        this.format = 'uint16x' + itemSize;
        this.type = getGPUType(this.array, itemSize);
    }
}

class Uint32ArrayBufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized) {
        super(new Uint32Array(array), itemSize, normalized);
        this.format = 'uint32x' + itemSize;
        this.type = getGPUType(this.array, itemSize);
    }
}

export { BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint32ArrayBufferAttribute };