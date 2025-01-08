import { BufferData } from "@/util";
import { Matrix4, Vector3, Euler } from "@/math";


export class Quaternion extends BufferData {
    [index: number]: number;
    static INSTANCE = new Quaternion();

    readonly length: number = 4;
    readonly isQuaternion: boolean = true;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        super([x, y, z, w]);
    }

    get x(): number { return this[0]; }
    get y(): number { return this[1]; }
    get z(): number { return this[2]; }
    get w(): number { return this[3]; }

    set x(value: number) { this[0] = value; this.monitor.check(); }
    set y(value: number) { this[1] = value; this.monitor.check(); }
    set z(value: number) { this[2] = value; this.monitor.check(); }
    set w(value: number) { this[3] = value; this.monitor.check(); }


    slerp(q: Quaternion, alpha: number): this {
        if (alpha === 0) return this;
        if (alpha === 1) return this.copy(q);

        const x = this.x, y = this.y, z = this.z, w = this.w;
        let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

        if (cosHalfTheta < 0) {
            this.w = -q.w;
            this.x = -q.x;
            this.y = -q.y;
            this.z = -q.z;
            cosHalfTheta = -cosHalfTheta;
        } else {
            this.copy(q);
        }

        if (cosHalfTheta >= 1.0) return this;

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.001) {
            this.w = 0.5 * (w + this.w);
            this.x = 0.5 * (x + this.x);
            this.y = 0.5 * (y + this.y);
            this.z = 0.5 * (z + this.z);
            return this;
        }

        const ratioA = Math.sin((1 - alpha) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(alpha * halfTheta) / sinHalfTheta;

        this.w = (w * ratioA + this.w * ratioB);
        this.x = (x * ratioA + this.x * ratioB);
        this.y = (y * ratioA + this.y * ratioB);
        this.z = (z * ratioA + this.z * ratioB);

        return this;
    }

    inverse(): this {
        return this.conjugate().normalize();
    }

    dot(q: Quaternion): number {
        return this.x * q.x + this.y * q.y + 
               this.z * q.z + this.w * q.w;
    }

    add(q: Quaternion): this {
        this.x += q.x;
        this.y += q.y;
        this.z += q.z;
        this.w += q.w;
        return this;
    }

    sub(q: Quaternion): this {
        this.x -= q.x;
        this.y -= q.y;
        this.z -= q.z;
        this.w -= q.w;
        return this;
    }

    multiply(q: Quaternion): this {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        this.x = w * q.x + x * q.w + y * q.z - z * q.y;
        this.y = w * q.y - x * q.z + y * q.w + z * q.x;
        this.z = w * q.z + x * q.y - y * q.x + z * q.w;
        this.w = w * q.w - x * q.x - y * q.y - z * q.z;
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
        console.warn({
            type: 'quat from euler',
            input: x + ', ' + y + ', ' + z,
            output: this[0] + ', ' + this[1] + ', ' + this[2] + ', ' + this[3]
        })

		return this;
    }

    setFromAxisAngle(axis: Vector3, angle: number): this {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);
        return this;
    }

    setFromRotationMatrix(m: Matrix4): this {
        const m11 = m[0], m12 = m[4], m13 = m[8],
              m21 = m[1], m22 = m[5], m23 = m[9],
              m31 = m[2], m32 = m[6], m33 = m[10];

        const trace = m11 + m22 + m33;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            this.w = 0.25 / s;
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            this.w = (m32 - m23) / s;
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;
        } else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            this.w = (m13 - m31) / s;
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            this.w = (m21 - m12) / s;
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;
        }

        return this;
    }

    setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this {
        let r = vFrom.dot(vTo) + 1;
        if (r < Number.EPSILON) {
            r = 0;
            if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
                this.x = -vFrom.y;
                this.y = vFrom.x;
                this.z = 0;
                this.w = r;
            } else {
                this.x = 0;
                this.y = -vFrom.z;
                this.z = vFrom.y;
                this.w = r;
            }
        } else {
            this.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
            this.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
            this.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
            this.w = r;
        }
        return this.normalize();
    }

    conjugate(): this {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    normalize(): this {
        let l = this.magnitude();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }
}
