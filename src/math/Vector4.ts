import { BufferData } from "@/data/BufferData";
import { Matrix4 } from "./Matrix4";

export class Vector4 extends BufferData {
    [index: number]: number;
    readonly length: number = 4;
    readonly isVector4: boolean = true;

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }
    get w() { return this[3]; }

    set x(value) { this[0] = value; this.monitor.check(0); }
    set y(value) { this[1] = value; this.monitor.check(1); }
    set z(value) { this[2] = value; this.monitor.check(2); }
    set w(value) { this[3] = value; this.monitor.check(3); }

    constructor();
    constructor(x: number, y: number, z: number, w: number);
    constructor(values: ArrayLike<number> | BufferData, offset?: number);

    constructor(...args: any) {
        super([0, 0, 0, 0], 4);
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 0;
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
    }

    add(v: Vector4): this {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        this[3] += v[3];
        return this;
    }

    sub(v: Vector4): this {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        this[3] -= v[3];
        return this;
    }

    multiply(v: Vector4): this {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        this[3] *= v[3];
        return this;
    }

    divide(v: Vector4): this {
        this[0] /= v[0];
        this[1] /= v[1];
        this[2] /= v[2];
        this[3] /= v[3];
        return this;
    }

    dot(v: Vector4): number {
        return this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * v[3];
    }

    manhattanLength(): number {
        return Math.abs(this[0]) + Math.abs(this[1]) + Math.abs(this[2]) + Math.abs(this[3]);
    }

    magnitude(): number {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]);
    }

    applyMatrix4(m: Matrix4): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];
        const w = this[3];
        const e = m;

        this[0] = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
        this[1] = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
        this[2] = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
        this[3] = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

        return this;
    }

    setFromMatrixColumn(matrix: Matrix4, index: number): this {
        return this.fromArray(matrix, index * 4);
    }

    equals(v: this): boolean {
        return this[0] === v[0] && this[1] === v[1] && 
               this[2] === v[2] && this[3] === v[3];
    }

    set(x: number, y: number, z: number, w: number): this;
    set(v: ArrayLike<number> | BufferData, offset?: number): this;
    set(...args: any): this {
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 0;
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
        return this;
    }

    setSilent(x: number, y: number, z: number, w: number): this;
    setSilent(v: ArrayLike<number> | BufferData, offset?: number): this;
    setSilent(...args: any): this {
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 0;
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
        return this;
    }
}