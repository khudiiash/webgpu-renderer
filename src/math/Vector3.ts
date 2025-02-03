import { BufferData } from "@/data/BufferData";
import { Matrix4 } from "./Matrix4";
import { BufferAttribute } from "@/geometry/BufferAttribute";
import { Matrix3 } from "./Matrix3";
import { Quaternion } from "./Quaternion";
import { isArrayOrBuffer } from "@/util";

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

    set x(value) { this[0] = value; this.monitor.check(0); }
    set y(value) { this[1] = value; this.monitor.check(1); }
    set z(value) { this[2] = value; this.monitor.check(2); }

    constructor();
    constructor(x: number, y: number, z: number);
    constructor(values: ArrayLike<number> | BufferData, offset?: number);

    constructor(...args: any) {
        super([0, 0, 0], 3);
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
        } else if (isArrayOrBuffer(args[0])) {
            let offset = args[1] || 0;
            this[0] = args[0][offset];
            this[1] = args[0][offset + 1];
            this[2] = args[0][offset + 2];
        }
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

    divide(v: Vector3 | number): this {
        if (v instanceof Vector3) {
            if (v[0] === 0 || v[1] === 0 || v[2] === 0) {
                throw new Error('Division by zero');
            }
            this[0] /= v[0];
            this[1] /= v[1];
            this[2] /= v[2];
        }
        if (typeof v === 'number') {
            if (v === 0) {
                throw new Error('Division by zero');
            }
            this[0] /= v;
            this[1] /= v;
            this[2] /= v;
        }
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
        } else {
            this[0] *= scalar;
            this[1] *= scalar;
            this[2] *= scalar;
        }
        return this;
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

    crossVectors(a: Vector3, b: Vector3): this {
        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];

        this[0] = ay * bz - az * by;
        this[1] = az * bx - ax * bz;
        this[2] = ax * by - ay * bx;
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
        const x = this.x, y = this.y, z = this.z;
        const e = m;
        const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );
        this[0] = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
        this[1] = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
        this[2] = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;
        return this;
    }

    applyQuaternion(q: Quaternion): this {
		const vx = this.x, vy = this.y, vz = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
		const tx = 2 * ( qy * vz - qz * vy );
		const ty = 2 * ( qz * vx - qx * vz );
		const tz = 2 * ( qx * vy - qy * vx );
		this.setSilent(
            vx + qw * tx + qy * tz - qz * ty,
		    vy + qw * ty + qz * tx - qx * tz,
		    vz + qw * tz + qx * ty - qy * tx,
        );
		return this;
    }

    transformDirection(m: Matrix4): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        const e = m;

        this[0] = e[0] * x + e[4] * y + e[8] * z;
        this[1] = e[1] * x + e[5] * y + e[9] * z;
        this[2] = e[2] * x + e[6] * y + e[10] * z;
        return this;
    }

    applyMatrix3(m: Matrix3): this {
        const x = this[0];
        const y = this[1];
        const z = this[2];

        const e = m;

        this[0] = e[0] * x + e[3] * y + e[6] * z;
        this[1] = e[1] * x + e[4] * y + e[7] * z;
        this[2] = e[2] * x + e[5] * y + e[8] * z;
        return this;
    }

    negate(): this {
        this[0] = -this[0];
        this[1] = -this[1];
        this[2] = -this[2];
        return this;
    }

    lerp( v: Vector3, alpha: number ) {
		this[0] += ( v.x - this.x ) * alpha;
		this[1] += ( v.y - this.y ) * alpha;
		this[2] += ( v.z - this.z ) * alpha;
		return this;
	}

	lerpVectors(v1: Vector3, v2: Vector3, alpha: number) {
		this[0] = v1.x + ( v2.x - v1.x ) * alpha;
		this[1] = v1.y + ( v2.y - v1.y ) * alpha;
		this[2] = v1.z + ( v2.z - v1.z ) * alpha;
		return this;
	}

    applyNormalMatrix(m: Matrix3): this {
        return this.applyMatrix3(m).normalize();
    }

    setFromBufferAttribute(attribute: BufferAttribute, index: number): this {
        this[0] = attribute.getX(index);
        this[1] = attribute.getY(index);
        this[2] = attribute.getZ(index);
        return this;
    }

    set(x: number, y: number, z: number): this;
    set(x: ArrayLike<number> | BufferData, offset?: number): this;
    set(...args: any) {
        if (isArrayOrBuffer(args[0])) {
            let offset = args[1] || 0;
            this[0] = args[0][offset];
            this[1] = args[0][offset + 1];
            this[2] = args[0][offset + 2];
        } else {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
        }
        return this;
    }

    setSilent(x: number, y: number, z: number): this;
    setSilent(x: ArrayLike<number> | BufferData, offset?: number): this;
    setSilent(...args: any) {
        if (isArrayOrBuffer(args[0])) {
            let offset = args[1] || 0;
            this[0] = args[0][offset];
            this[1] = args[0][offset + 1];
            this[2] = args[0][offset + 2];
        } else {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
        }
        return this;
    }

    setFromMatrixColumn(matrix: Matrix4, index: number): this {
        if (index < 0 || index > 3) {
            throw new Error('Index out of bounds');
        }
        return this.fromArray(matrix, index * 4);
    }

    setFromMatrixPosition(matrix: Matrix4): this {
        return this.fromArray(matrix, 12);
    }

    static lerp(v1: Vector3, v2: Vector3, t: number): Vector3 {
        return new Vector3(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t,
            v1.z + (v2.z - v1.z) * t
        );
    }

    static lerp(v1: Vector3, v2: Vector3, t: number): Vector3 {
        return new Vector3(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t,
            v1.z + (v2.z - v1.z) * t
        );
    }

    setFromSphericalCoords(radius: number, phi: number, theta: number): this {
        const sinPhiRadius = Math.sin(phi) * radius;
        this[0] = sinPhiRadius * Math.sin(theta);
        this[1] = Math.cos(phi) * radius;
        this[2] = sinPhiRadius * Math.cos(theta);
        return this;
    }

    normalize(): this {
        const length = Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
        if (length === 0) {
            return this;
        }
        this[0] /= length;
        this[1] /= length;
        this[2] /= length;
        return this;
    }

    clone(): this {
        return new Vector3(this[0], this[1], this[2]) as this;
    }
}