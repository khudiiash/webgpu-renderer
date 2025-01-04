import { BufferData } from '@utils/BufferData';

export class Vector3 extends BufferData implements Math.Vector3 {

    readonly isVector3: boolean = true;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super([x, y, z]);
    }

    add(v: Math.Vector3): this {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        return this;
    }

    sub(v: Math.Vector3): this {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        return this;
    }

    divide(v: Math.Vector3): this {
        this[0] /= v[0];
        this[1] /= v[1];
        this[2] /= v[2];
        return this;
    }

    multiply(v: Math.Vector3): this {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        return this;
    }

    cross(v: Math.Vector3): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        this[0] = y * v[2] - z * v[1];
        this[1] = z * v[0] - x * v[2];
        this[2] = x * v[1] - y * v[0];

        return this;
    }

    dot(v: Math.Vector3): number {
        return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
    }

    applyMatrix4(m: Math.Matrix4): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        const e = m;

        this[0] = e[0] * x + e[4] * y + e[8] * z + e[12];
        this[1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        this[2] = e[2] * x + e[6] * y + e[10] * z + e[14];

        return this;
    }

    toArray(array?: number[], offset?: number): number[] {
        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this[0];
        array[offset + 1] = this[1];
        array[offset + 2] = this[2];

        return array; 
    }

    fromArray(array: number[], offset: number = 0): this {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        this[2] = array[offset + 2];
        return this;
    }

    clone(): this {
        return new Vector3(this[0], this[1], this[2]) as this;
    }

    copy(v: this): this {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        return this;
    }

    equals(v: this): boolean {
        return this[0] === v[0] && this[1] === v[1] && this[2] === v[2];
    }

    set(array: ArrayLike<number>, offset: number = 0): this {
        this[0] = array[offset];
        this[1] = array[offset + 1];
        this[2] = array[offset + 2];
        return this;
    }

    setX(x: number): this {
        this[0] = x;
        return this;
    }

    setY(y: number): this {
        this[1] = y;
        return this;
    }

    setZ(z: number): this {
        this[2] = z;
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }

    set x(value) { this[0] = value; }
    set y(value) { this[1] = value; }
    set z(value) { this[2] = value; }
}