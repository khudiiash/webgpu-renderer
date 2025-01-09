import { BufferData } from "@/data/BufferData";
import { Matrix4 } from "./Matrix4";

export class Vector3 extends BufferData {
    [index: number]: number;
    readonly length: number = 3;
    readonly isVector3: boolean = true;

    static get zero(): Vector3 { return new Vector3(0, 0, 0); }
    static get one(): Vector3 { return new Vector3(1, 1, 1); }
    static get up(): Vector3 { return new Vector3(0, 1, 0); }
    static get down(): Vector3 { return new Vector3(0, -1, 0); }
    static get left(): Vector3 { return new Vector3(-1, 0, 0); }
    static get right(): Vector3 { return new Vector3(1, 0, 0); }
    static get forward(): Vector3 { return new Vector3(0, 0, -1); }
    static get back(): Vector3 { return new Vector3(0, 0, 1); }

    static ZERO = new Vector3(0, 0, 0);
    static ONE = new Vector3(1, 1, 1);
    static UP = new Vector3(0, 1, 0);
    static DOWN = new Vector3(0, -1, 0);
    static LEFT = new Vector3(-1, 0, 0);
    static RIGHT = new Vector3(1, 0, 0);
    static FORWARD = new Vector3(0, 0, -1);
    static BACK = new Vector3(0, 0, 1);

    static instance = new Vector3();

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }

    set x(value) { this[0] = value; this.monitor.check(); }
    set y(value) { this[1] = value; this.monitor.check(); }
    set z(value) { this[2] = value; this.monitor.check(); }

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super([x, y, z]);
    }

    add(v: Vector3): this {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        return this;
    }

    addVectors(a: Vector3, b: Vector3): Vector3 {
        this[0] = a[0] + b[0];
        this[1] = a[1] + b[1];
        this[2] = a[2] + b[2];
        return this;
    }

    sub(v: Vector3): this {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        return this;
    }

    subVectors(a: Vector3, b: Vector3): Vector3 {
        this[0] = a[0] - b[0];
        this[1] = a[1] - b[1];
        this[2] = a[2] - b[2];
        return this;
    }

    divide(v: Vector3): this {
        this[0] /= v[0];
        this[1] /= v[1];
        this[2] /= v[2];
        return this;
    }

    multiply(v: Vector3): this {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        return this;
    }

    multiplyVectors(a: Vector3, b: Vector3): this {
        this[0] = a[0] * b[0];
        this[1] = a[1] * b[1];
        this[2] = a[2] * b[2];
        return this;
    }

    scale(scalar: number | Vector3): this {
        if (scalar instanceof Vector3) {
            this[0] *= scalar[0];
            this[1] *= scalar[1];
            this[2] *= scalar[2];
            return this;
        } else {
            this[0] *= scalar;
            this[1] *= scalar;
            this[2] *= scalar;
            return this;
        }
    }

    cross(v: Vector3): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        this[0] = y * v[2] - z * v[1];
        this[1] = z * v[0] - x * v[2];
        this[2] = x * v[1] - y * v[0];

        return this;
    }

    dot(v: Vector3): number {
        return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
    }

    clamp(min: Vector3, max: Vector3): this {
        this[0] = Math.max(min[0], Math.min(max[0], this[0]));
        this[1] = Math.max(min[1], Math.min(max[1], this[1]));
        this[2] = Math.max(min[2], Math.min(max[2], this[2]));
        return this;
    }

    distanceTo(v: Vector3): number {
        const dx = this[0] - v[0];
        const dy = this[1] - v[1];
        const dz = this[2] - v[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    applyMatrix4(m: Matrix4): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        const e = m;

        this[0] = e[0] * x + e[4] * y + e[8] * z + e[12];
        this[1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        this[2] = e[2] * x + e[6] * y + e[10] * z + e[14];

        return this;
    }

    setFromMatrixColumn(matrix: Matrix4, index: number): this {
        return this.fromArray(matrix, index * 4);
    }

    normalize(): this {
        const length = this.magnitude();
        if (length === 0) return this;
        this[0] /= length;
        this[1] /= length;
        this[2] /= length;

        return this;
    }

}