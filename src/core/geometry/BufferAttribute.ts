import { Vector3 } from '@/math/Vector3.js';
import { Vector2 } from '@/math/Vector2.js';

const _vector = new Vector3();
const _vector2 = new Vector2();

class BufferAttribute {
    data: Float32Array | Uint16Array | Uint32Array;
    itemSize: number;
    normalized: boolean;
    version: number;
    private _needsUpdate: boolean;
    isBufferAttribute: boolean;

    constructor(data: Float32Array | Uint16Array | Uint32Array, itemSize: number, normalized = false) {
        this.data = data;
        this.itemSize = itemSize;
        this.normalized = normalized;
        this.version = 0;
        this.isBufferAttribute = true;
        this._needsUpdate = false;
    }

    get count(): number {
        return this.data.length / this.itemSize;
    }

    set needsUpdate(value: boolean) {
        if (value) {
            this.version++;
        }
        this._needsUpdate = value;
    }

    get needsUpdate(): boolean {
        return this._needsUpdate;
    }

    getX(index: number): number {
        return this.data[index * this.itemSize];
    }

    setX(index: number, x: number): this {
        this.data[index * this.itemSize] = x;
        return this;
    }

    getY(index: number): number {
        return this.data[index * this.itemSize + 1];
    }

    setY(index: number, y: number): this {
        this.data[index * this.itemSize + 1] = y;
        return this;
    }

    getZ(index: number): number {
        return this.data[index * this.itemSize + 2];
    }

    setZ(index: number, z: number): this {
        this.data[index * this.itemSize + 2] = z;
        return this;
    }

    getW(index: number): number {
        return this.data[index * this.itemSize + 3];
    }

    setW(index: number, w: number): this {
        this.data[index * this.itemSize + 3] = w;
        return this;
    }

    setXYZW(index: number, x: number, y: number, z: number, w: number): this {
        const index2 = index * this.itemSize;
        this.data[index2] = x;
        this.data[index2 + 1] = y;
        this.data[index2 + 2] = z;
        this.data[index2 + 3] = w;
        return this;
    }

    getComponent(index: number, componentIndex: number): number {
        return this.data[index * this.itemSize + componentIndex];
    }

    setComponent(index: number, componentIndex: number, value: number): this {
        this.data[index * this.itemSize + componentIndex] = value;
        return this;
    }

    set(value: ArrayLike<number>, offset = 0): this {
        this.data.set(value, offset);
        return this;
    }

    copyArray(array: ArrayLike<number>): this {
        this.data.set(array);
        return this;
    }
}

function getGPUType(array: Float32Array | Uint16Array | Uint32Array, itemSize: number): string {
    const pf = array instanceof Float32Array ? 'f' : 'i';
    switch (itemSize) {
        case 1: return pf + '32';
        case 2: return 'vec2' + pf;
        case 3: return 'vec3' + pf;
        case 4: return 'vec4' + pf;
        case 9: return 'mat3x3' + pf;
        case 16: return 'mat4x4' + pf;
        default: throw new Error('Unsupported itemSize');
    }
}

class Float32BufferAttribute extends BufferAttribute {
    format: string;
    type: string;

    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
        super(new Float32Array(array), itemSize, normalized);
        this.format = 'float32x' + itemSize;
        this.type = getGPUType(this.data, itemSize);
    }
}

class Uint16BufferAttribute extends BufferAttribute {
    format: string;
    type: string;

    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
        super(new Uint16Array(array), itemSize, normalized);
        this.format = 'uint16x' + itemSize;
        this.type = getGPUType(this.data, itemSize);
    }
}

class Uint32BufferAttribute extends BufferAttribute {
    format: string;
    type: string;

    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean) {
        super(new Uint32Array(array), itemSize, normalized);
        this.format = 'uint32x' + itemSize;
        this.type = getGPUType(this.data, itemSize);
    }
}

export { BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute };