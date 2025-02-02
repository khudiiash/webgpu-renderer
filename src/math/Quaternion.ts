import { BufferData } from "@/data/BufferData";
import { Vector3 } from "./Vector3";
import { Matrix4 } from "./Matrix4";
import { Euler } from "./Euler";
import { Matrix3 } from "./Matrix3";
import { B } from "vitest/dist/chunks/benchmark.geERunq4.js";


export class Quaternion extends BufferData {
    [index: number]: number;
    static instance = new Quaternion();

    readonly length: number = 4;
    readonly isQuaternion: boolean = true;

    constructor();
    constructor(x: number, y: number, z: number, w: number);
    constructor(values: ArrayLike<number> | BufferData, offset?: number);

    constructor(...args: any) {
        super([0, 0, 0, 1]);
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 1; 
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
    }

    get x(): number { return this[0]; }
    get y(): number { return this[1]; }
    get z(): number { return this[2]; }
    get w(): number { return this[3]; }

    set x(value: number) { this[0] = value; this.monitor.check(0); }
    set y(value: number) { this[1] = value; this.monitor.check(1); }
    set z(value: number) { this[2] = value; this.monitor.check(2); }
    set w(value: number) { this[3] = value; this.monitor.check(3); }


    slerp(q: Quaternion, alpha: number): this {
        if (alpha === 0) return this;
        if (alpha === 1) return this.copy(q);

        const x = this.x, y = this.y, z = this.z, w = this.w;
        let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

        if (cosHalfTheta < 0) {
            this[3] = -q.w;
            this[0] = -q.x;
            this[1] = -q.y;
            this[2] = -q.z;
            cosHalfTheta = -cosHalfTheta;
        } else {
            this.copy(q);
        }

        if (cosHalfTheta >= 1.0) return this;

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.0015) {
            this[3] = 0.5 * (w + this.w);
            this[0] = 0.5 * (x + this.x);
            this[1] = 0.5 * (y + this.y);
            this[2] = 0.5 * (z + this.z);
            return this;
        }

        const ratioA = Math.sin((1 - alpha) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(alpha * halfTheta) / sinHalfTheta;

        this[3] = (w * ratioA + this.w * ratioB);
        this[0] = (x * ratioA + this.x * ratioB);
        this[1] = (y * ratioA + this.y * ratioB);
        this[2] = (z * ratioA + this.z * ratioB);

        return this;
    }

    invert(): this {
        return this.negate().normalize();
    }

    dot(q: Quaternion): number {
        return this.x * q.x + this.y * q.y + 
               this.z * q.z + this.w * q.w;
    }

    add(q: Quaternion): this {
        this[0] += q[0];
        this[1] += q[1];
        this[2] += q[2];
        this[3] += q[3];
        return this;
    }

    sub(q: Quaternion): this {
        this[0] -= q[0];
        this[1] -= q[1];
        this[2] -= q[2];
        this[3] -= q[3];
        return this;
    }

    multiply(q: Quaternion): this {
        const x = this[0], y = this[1], z = this[2], w = this[3];
        this[0] = w * q[0] + x * q[3] + y * q[2] - z * q[1];
        this[1] = w * q[1] - x * q[2] + y * q[3] + z * q[0];
        this[2] = w * q[2] + x * q[1] - y * q[0] + z * q[3];
        this[3] = w * q[3] - x * q[0] - y * q[1] - z * q[2];
        return this;
    }

    premultiply(q: Quaternion): this {
        const x = this[0], y = this[1], z = this[2], w = this[3];
        this[0] = q[3] * x + q[0] * w + q[1] * z - q[2] * y;
        this[1] = q[3] * y - q[0] * z + q[1] * w + q[2] * x;
        this[2] = q[3] * z + q[0] * y - q[1] * x + q[2] * w;
        this[3] = q[3] * w - q[0] * x - q[1] * y - q[2] * z;
        return this;
    }

    setFromEuler(euler: Euler): this {
        const { x, y, z, order } = euler;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		const cos = Math.cos;
		const sin = Math.sin;

		const c1 = cos( x / 2 );
		const c2 = cos( y / 2 );
		const c3 = cos( z / 2 );

		const s1 = sin( x / 2 );
		const s2 = sin( y / 2 );
		const s3 = sin( z / 2 );

		switch ( order ) {
			case Euler.XYZ:
				this[0] = s1 * c2 * c3 + c1 * s2 * s3;
				this[1] = c1 * s2 * c3 - s1 * c2 * s3;
				this[2] = c1 * c2 * s3 + s1 * s2 * c3;
				this[3] = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case Euler.YXZ:
				this[0] = s1 * c2 * c3 + c1 * s2 * s3;
				this[1] = c1 * s2 * c3 - s1 * c2 * s3;
				this[2] = c1 * c2 * s3 - s1 * s2 * c3;
				this[3] = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case Euler.ZXY:
				this[0] = s1 * c2 * c3 - c1 * s2 * s3;
				this[1] = c1 * s2 * c3 + s1 * c2 * s3;
				this[2] = c1 * c2 * s3 + s1 * s2 * c3;
				this[3] = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case Euler.ZYX:
				this[0] = s1 * c2 * c3 - c1 * s2 * s3;
				this[1] = c1 * s2 * c3 + s1 * c2 * s3;
				this[2] = c1 * c2 * s3 - s1 * s2 * c3;
				this[3] = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case Euler.YZX:
				this[0] = s1 * c2 * c3 + c1 * s2 * s3;
				this[1] = c1 * s2 * c3 + s1 * c2 * s3;
				this[2] = c1 * c2 * s3 - s1 * s2 * c3;
				this[3] = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case Euler.XZY:
				this[0] = s1 * c2 * c3 - c1 * s2 * s3;
				this[1] = c1 * s2 * c3 - s1 * c2 * s3;
				this[2] = c1 * c2 * s3 + s1 * s2 * c3;
				this[3] = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			default:
				console.warn( 'Quaternion.setFromEuler(): unknown Euler order: ' + order );

		}

		return this;
    }

    setFromAxisAngle(axis: Vector3, angle: number): this {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        this[0] = axis.x * s;
        this[1] = axis.y * s;
        this[2] = axis.z * s;
        this[3] = Math.cos(halfAngle);
        return this;
    }

    setFromRotationMatrix(m: Matrix4 | Matrix3): this {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        const m11 = m[0], m12 = m[4], m13 = m[8],
              m21 = m[1], m22 = m[5], m23 = m[9],
              m31 = m[2], m32 = m[6], m33 = m[10],
              trace = m11 + m22 + m33;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            this[3] = 0.25 / s;
            this[0] = (m32 - m23) * s;
            this[1] = (m13 - m31) * s;
            this[2] = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            this[3] = (m32 - m23) / s;
            this[0] = 0.25 * s;
            this[1] = (m12 + m21) / s;
            this[2] = (m13 + m31) / s;
        } else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            this[3] = (m13 - m31) / s;
            this[0] = (m12 + m21) / s;
            this[1] = 0.25 * s;
            this[2] = (m23 + m32) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            this[3] = (m21 - m12) / s;
            this[0] = (m13 + m31) / s;
            this[1] = (m23 + m32) / s;
            this[2] = 0.25 * s;
        }

        return this;
    }

    setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this {
        let r = vFrom.dot(vTo) + 1;
        
        if (r < Number.EPSILON) {
            // Explicit case for opposite vectors (180 degree rotation)
            this[0] = 0;
            this[1] = 0;
            this[2] = 0;
            this[3] = -1;  // Representing a 180 degree rotation (reflection)
            return this.normalize();
        }
        
        // Normal computation for non-opposite vectors
        this[0] = vFrom.y * vTo.z - vFrom.z * vTo.y;
        this[1] = vFrom.z * vTo.x - vFrom.x * vTo.z;
        this[2] = vFrom.x * vTo.y - vFrom.y * vTo.x;
        this[3] = r;
        
        return this.normalize();
    }    

    negate(): this {
        this[0] *= -1;
        this[1] *= -1;
        this[2] *= -1;
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    normalize(): this {
        let l = Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]);
        if (l === 0) {
            this[0] = 0;
            this[1] = 0;
            this[2] = 0;
            this[3] = 1;
        } else {
            l = 1 / l;
            this[0] *= l;
            this[1] *= l;
            this[2] *= l;
            this[3] *= l;
        }
        return this;
    }

    set(x: number, y: number, z: number, w: number): this;
    set(values: ArrayLike<number> | BufferData, offset?: number): this;
    set(...args: any): this {
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 1;
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
        return this;
    }

    setSilent(x: number, y: number, z: number, w: number): this;
    setSilent(values: ArrayLike<number> | BufferData, offset?: number): this;
    setSilent(...args: any): this {
        if (typeof args[0] === 'number') {
            this[0] = args[0];
            this[1] = args[1] ?? 0;
            this[2] = args[2] ?? 0;
            this[3] = args[3] ?? 1;
        } else if (args[0] instanceof BufferData || Array.isArray(args[0])) {
            super.setSilent(args[0], args[1] || 0);
        }
        return this;
    }
}
