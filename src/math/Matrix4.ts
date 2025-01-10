import { BufferData } from "@/data/BufferData";
import { Vector3 } from "./Vector3";
import { Quaternion } from "./Quaternion";
import { Euler } from "./Euler";

export class Matrix4 extends BufferData {
    readonly length: number = 16;
    [index: number]: number;
    readonly isMatrix4: boolean = true;

    static instance = new Matrix4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    static rotationInstance = new Matrix4();

    static IDENTITY = new Matrix4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);


    constructor(values: number[] = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]) {
        super(values);
    }

    add(m: Matrix4): this {
        const te = this;
        const me = m;

        te[0] += me[0]; te[4] += me[4]; te[8] += me[8]; te[12] += me[12];
        te[1] += me[1]; te[5] += me[5]; te[9] += me[9]; te[13] += me[13];
        te[2] += me[2]; te[6] += me[6]; te[10] += me[10]; te[14] += me[14];
        te[3] += me[3]; te[7] += me[7]; te[11] += me[11]; te[15] += me[15];

        return this;
    }

    compose(translation: Vector3, rotation: Quaternion, scale: Vector3): this {
        const te = this;

		const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
		const x2 = x + x,	y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x, sy = scale.y, sz = scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = translation.x;
		te[ 13 ] = translation.y;
		te[ 14 ] = translation.z;
		te[ 15 ] = 1;

		return this;
    }
    decompose(translation: Vector3, rotation: Quaternion, scale: Vector3): this {
        const te = this;

        let sx = _v1.set([ te[ 0 ], te[ 1 ], te[ 2 ] ]).magnitude();
        const sy = _v1.set([ te[ 4 ], te[ 5 ], te[ 6 ] ]).magnitude();
        const sz = _v1.set([ te[ 8 ], te[ 9 ], te[ 10 ] ]).magnitude();

        // if determinant is negative, we need to invert one scale
        const det = this.determinant();
        if ( det < 0 ) sx = - sx;

        translation.x = te[ 12 ];
        translation.y = te[ 13 ];
        translation.z = te[ 14 ];

        // scale the rotation part
        _m1.copy( this );

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        _m1.set([
            te[0] * invSX, te[1] * invSX, te[2] * invSX, 0,
            te[4] * invSY, te[5] * invSY, te[6] * invSY, 0,
            te[8] * invSZ, te[9] * invSZ, te[10] * invSZ, 0,
            0, 0, 0, 1
        ])

        rotation.setFromRotationMatrix( _m1 );

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return this;
    }
    determinant(): number {
        const te = this;
        const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
        const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
        const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
        const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

        return (
            n41 * (+n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34) +
            n42 * (+n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31) +
            n43 * (+n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31) +
            n44 * (-n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31)
        );
    }

    getPosition(v?: Vector3): Vector3 {
        v = v || new Vector3();
        return v.setXYZ(this[12], this[13], this[14]);
    }

    getMaxScaleOnAxis(): number {
        const te = this;
        const scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
        const scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
        const scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
        return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
    }

    getRotation(q?: Quaternion): Quaternion {
        q = q || new Quaternion();
        return q.setFromRotationMatrix(this);
    }

    getScale(v?: Vector3): Vector3 {
        v = v || new Vector3();
        const te = this;
        v.x = Math.sqrt(te[0] * te[0] + te[1] * te[1] + te[2] * te[2]);
        v.y = Math.sqrt(te[4] * te[4] + te[5] * te[5] + te[6] * te[6]);
        v.z = Math.sqrt(te[8] * te[8] + te[9] * te[9] + te[10] * te[10]);
        return v;
    }
    getScaleOnAxis(axis: Vector3): number {
        const scaledAxis = axis.clone().applyMatrix4(this);
        return scaledAxis.magnitude();
    }
    getTranslation(v?: Vector3): Vector3 {
        v = v || new Vector3();
        const te = this;
        v.x = te[12];
        v.y = te[13];
        v.z = te[14];
        return v;
    }
    invert(): this {
        const te = this;

        const matrix: number[][] = [
            [te[0], te[4], te[8], te[12]],
            [te[1], te[5], te[9], te[13]],
            [te[2], te[6], te[10], te[14]],
            [te[3], te[7], te[11], te[15]]
        ];

        let aug: number[][] = [];
        for (let i = 0; i < 4; i++) {
            aug[i] = [];
            for (let j = 0; j < 8; j++) {
                if (j < 4) {
                    aug[i][j] = matrix[i][j];
                } else {
                    aug[i][j] = (j === i + 4) ? 1 : 0;
                }
            }
        }

        for (let i = 0; i < 4; i++) {
            let pivot = aug[i][i];
            if (pivot === 0) return this; // Matrix is singular

            for (let j = 0; j < 8; j++) {
                aug[i][j] /= pivot;
            }

            for (let k = 0; k < 4; k++) {
                if (k !== i) {
                    let factor = aug[k][i];
                    for (let j = 0; j < 8; j++) {
                        aug[k][j] -= factor * aug[i][j];
                    }
                }
            }
        }

        this.set([
            aug[0][4], aug[1][4], aug[2][4], aug[3][4],
            aug[0][5], aug[1][5], aug[2][5], aug[3][5],
            aug[0][6], aug[1][6], aug[2][6], aug[3][6],
            aug[0][7], aug[1][7], aug[2][7], aug[3][7]
        ])

        return this;
    }

    multiply(m: Matrix4): this {
        const a = this;
        const b = m;
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[ 4 + 0];
        const a11 = a[ 4 + 1];
        const a12 = a[ 4 + 2];
        const a13 = a[ 4 + 3];
        const a20 = a[ 8 + 0];
        const a21 = a[ 8 + 1];
        const a22 = a[ 8 + 2];
        const a23 = a[ 8 + 3];
        const a30 = a[12 + 0];
        const a31 = a[12 + 1];
        const a32 = a[12 + 2];
        const a33 = a[12 + 3];
        const b00 = b[0];
        const b01 = b[1];
        const b02 = b[2];
        const b03 = b[3];
        const b10 = b[ 4 + 0];
        const b11 = b[ 4 + 1];
        const b12 = b[ 4 + 2];
        const b13 = b[ 4 + 3];
        const b20 = b[ 8 + 0];
        const b21 = b[ 8 + 1];
        const b22 = b[ 8 + 2];
        const b23 = b[ 8 + 3];
        const b30 = b[12 + 0];
        const b31 = b[12 + 1];
        const b32 = b[12 + 2];
        const b33 = b[12 + 3];

        return this.set([
            a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03,
            a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03,
            a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03,
            a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03,
            a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13,
            a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13,
            a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13,
            a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13,
            a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23,
            a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23,
            a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23,
            a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23,
            a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33,
            a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33,
            a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33,
            a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33,
        ]);
    }
    multiplyMatrices(a: Matrix4, b: Matrix4): this {
        const te = this;
        te.copy(a);
        return te.multiply(b);
    }
    rotateX(radians: number): this {
        return this.rotateOnAxis(new Vector3(1, 0, 0), radians);
    }
    
    rotateY(radians: number): this {
        return this.rotateOnAxis(new Vector3(0, 1, 0), radians);
    }

    rotateZ(radians: number): this {
        return this.rotateOnAxis(new Vector3(0, 0, 1), radians);
    }
    scale(v: Vector3): this {
        const te = this;
        const v0 = v[0];
        const v1 = v[1];
        const v2 = v[2];

        return this.set([
            v0 * te[0], v0 * te[1], v0 * te[2], v0 * te[3],
            v1 * te[4], v1 * te[5], v1 * te[6], v1 * te[7],
            v2 * te[8], v2 * te[9], v2 * te[10], v2 * te[11],
            te[12], te[13], te[14], te[15]
        ])
    }

    rotateOnAxis(axis: Vector3, radians: number): this {
        const te = this;
        let x = axis[0];
        let y = axis[1];
        let z = axis[2];
        const n = Math.sqrt(x * x + y * y + z * z);
        x /= n;
        y /= n;
        z /= n;
        const xx = x * x;
        const yy = y * y;
        const zz = z * z;
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        const oneMinusCosine = 1 - c;

        const r00 = xx + (1 - xx) * c;
        const r01 = x * y * oneMinusCosine + z * s;
        const r02 = x * z * oneMinusCosine - y * s;
        const r10 = x * y * oneMinusCosine - z * s;
        const r11 = yy + (1 - yy) * c;
        const r12 = y * z * oneMinusCosine + x * s;
        const r20 = x * z * oneMinusCosine + y * s;
        const r21 = y * z * oneMinusCosine - x * s;
        const r22 = zz + (1 - zz) * c;

        const m00 = te[0];
        const m01 = te[1];
        const m02 = te[2];
        const m03 = te[3];
        const m10 = te[4];
        const m11 = te[5];
        const m12 = te[6];
        const m13 = te[7];
        const m20 = te[8];
        const m21 = te[9];
        const m22 = te[10];
        const m23 = te[11];

        this.set([
            r00 * m00 + r01 * m10 + r02 * m20, r00 * m01 + r01 * m11 + r02 * m21, r00 * m02 + r01 * m12 + r02 * m22, r00 * m03 + r01 * m13 + r02 * m23,
            r10 * m00 + r11 * m10 + r12 * m20, r10 * m01 + r11 * m11 + r12 * m21, r10 * m02 + r11 * m12 + r12 * m22, r10 * m03 + r11 * m13 + r12 * m23,
            r20 * m00 + r21 * m10 + r22 * m20, r20 * m01 + r21 * m11 + r22 * m21, r20 * m02 + r21 * m12 + r22 * m22, r20 * m03 + r21 * m13 + r22 * m23,
            te[12], te[13], te[14], te[15]
        ])

        return this;
    }
    setFrustum(left: number, right: number, bottom: number, top: number, near: number, far: number): this {
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = - (far + near) / (far - near);
        const d = - (2 * far * near) / (far - near);
    
        this.set([
            x, 0, a, 0,
            0, y, b, 0,
            0, 0, c, d,
            0, 0, -1, 0
        ]);

        return this;
    }

    lookAt(eye: Vector3, target: Vector3, up: Vector3 = Vector3.UP): this {
        const te = this;

        const zAxis = _v1.subVectors(eye, target).normalize();
        const xAxis = _v2.copy(up).cross(zAxis).normalize();
        const yAxis = _v3.copy(xAxis).cross(zAxis).normalize();

        te[ 0] = xAxis[0];  te[ 1] = yAxis[0];  te[ 2] = zAxis[0];  te[ 3] = 0;
        te[ 4] = xAxis[1];  te[ 5] = yAxis[1];  te[ 6] = zAxis[1];  te[ 7] = 0;
        te[ 8] = xAxis[2];  te[ 9] = yAxis[2];  te[10] = zAxis[2];  te[11] = 0;

        te[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
        te[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
        te[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
        te[15] = 1;

        return this;
    }
    setFromRotationMatrix(m: Matrix4): this {
        const te = this;
        te.setIdentity();
        return this.set([
            m[0], m[1], m[2], 0,
            m[4], m[5], m[6], 0,
            m[8], m[9], m[10], 0,
            0, 0, 0, 1
        ]);
    }

    setRotationFromQuaternion(q: Quaternion): this {
        return this.compose(_zero, q, _one);
    }

    setRotationFromEuler(euler: Euler): this {
        const te = this;

		const x = euler.x, y = euler.y, z = euler.z;
		const a = Math.cos( x ), b = Math.sin( x );
		const c = Math.cos( y ), d = Math.sin( y );
		const e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === Euler.XYZ ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === Euler.YXZ ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === Euler.ZXY ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === Euler.ZYX ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === Euler.YZX ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === Euler.XZY ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// bottom row
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// last column
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;
    }

    setIdentity(): this {
        return this.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ])
    }
    setOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): this {
        const w = 1.0 / (right - left);
        const h = 1.0 / (top - bottom);
        const p = 1.0 / (far - near);

        return this.set([
            2 * w, 0, 0, 0,
            0, 2 * h, 0, 0,
            0, 0, -2 * p, 0,
            -(right + left) * w, -(top + bottom) * h, -(far + near) * p, 1
        ])
    }
    setPerspective(fov: number, aspect: number, near: number, far: number): this {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        let m10;
        let m14;
      
        if (Number.isFinite(far)) {
          const rangeInv = 1 / (near - far);
          m10 = far * rangeInv;
          m14 = far * near * rangeInv;
        } else {
          m10 = -1;
          m14 = -near;
        }

        return this.set([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, m10, -1,
            0, 0, m14, 0
        ])
    }
    setPosition(v: Vector3): this {
        return this.set([v.x, v.y, v.z, 1], 12);
    }
    setRotation(q: Quaternion): this {
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        return this.set([
            1 - (yy + zz), xy - wz, xz + wy, 0,
            xy + wz, 1 - (xx + zz), yz - wx, 0,
            xz - wy, yz + wx, 1 - (xx + yy), 0,
            0, 0, 0, 1
        ]);
    }
    transformPoint(v: Vector3): Vector3 {
        const x = v.x;
        const y = v.y;
        const z = v.z;
        const data = this;
        return v.set([
            data[0] * x + data[4] * y + data[8] * z + data[12],
            data[1] * x + data[5] * y + data[9] * z + data[13],
            data[2] * x + data[6] * y + data[10] * z + data[14]
        ]);
    }
    translate(v: Vector3): this {
        const te = this;
        return this.set([te[12] + v.x, te[13] + v.y, te[14] + v.z, 1], 12); 
    }
    transpose(): this {
        const te = this;
        return this.set([
            te[0], te[4], te[8], te[12],
            te[1], te[5], te[9], te[13],
            te[2], te[6], te[10], te[14],
            te[3], te[7], te[11], te[15]
        ]);
    }
}
const _zero = new Vector3();
const _one = new Vector3(1, 1, 1);
const _m1 = new Matrix4();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();