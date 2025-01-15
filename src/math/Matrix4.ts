import { BufferData } from "@/data/BufferData";
import { Vector3 } from "./Vector3";
import { Quaternion } from "./Quaternion";
import { Euler } from "./Euler";
import { Matrix3 } from "./Matrix3";

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
        v[0] = Math.hypot(te[0], te[1], te[2]);
        v[1] = Math.hypot(te[4], te[5], te[6]);
        v[2] = Math.hypot(te[8], te[9], te[10]);
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
        const n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
              n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
              n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
              n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15];

        const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
        const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
        const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
        const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if (det === 0) return this.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        const detInv = 1 / det;

        return this.set([
            t11 * detInv,
            (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv,
            (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv,
            (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv,

            t12 * detInv,
            (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv,
            (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv,
            (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv,

            t13 * detInv,
            (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv,
            (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv,
            (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv,

            t14 * detInv,
            (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv,
            (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv,
            (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv
        ]);
    }

    setTranslation(x: number | Vector3, y: number, z: number): this {
        if (x instanceof Vector3) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        this.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
        return this;
    }


    scale( v: Vector3 ): this {
		const te = this;
		const x = v.x, y = v.y, z = v.z;

		te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
		te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
		te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
		te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

		return this;
	}




	multiply( m: Matrix4 ): this {
		return this.multiplyMatrices( this, m );

	}
    premultiply(m: Matrix4): this {
        return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(a: Matrix4, b: Matrix4): this {
        const te = this;

        const a11 = a[0], a12 = a[4], a13 = a[8], a14 = a[12];
        const a21 = a[1], a22 = a[5], a23 = a[9], a24 = a[13];
        const a31 = a[2], a32 = a[6], a33 = a[10], a34 = a[14];
        const a41 = a[3], a42 = a[7], a43 = a[11], a44 = a[15];

        const b11 = b[0], b12 = b[4], b13 = b[8], b14 = b[12];
        const b21 = b[1], b22 = b[5], b23 = b[9], b24 = b[13];
        const b31 = b[2], b32 = b[6], b33 = b[10], b34 = b[14];
        const b41 = b[3], b42 = b[7], b43 = b[11], b44 = b[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;
    }

    multiplyScalar( s: number ) {
		const te = this;
		te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
		te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
		te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
		te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

		return this;

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

        _v1.subVectors(eye, target);

        if (_v1.magnitudeSquared() === 0) {
            // eye and target are in the same position
            _v1.z = 1;
        }

        _v1.normalize();
        _v2.crossVectors(up, _v1);

        if (_v2.magnitudeSquared() === 0) {
            // up and z are parallel
            if (Math.abs(up.z) === 1) {
                _v1.x += 0.0001;
            } else {
                _v1.z += 0.0001;
            }

            _v1.normalize();
            _v2.crossVectors(up, _v1);
        }

        _v2.normalize();
        _v3.crossVectors(_v1, _v2);

        te[0] = _v2.x; te[4] = _v3.x; te[8] = _v1.x;
        te[1] = _v2.y; te[5] = _v3.y; te[9] = _v1.y;
        te[2] = _v2.z; te[6] = _v3.z; te[10] = _v1.z;

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

    extractRotation(m: Matrix4): this {
        // this method does not support reflection matrices
        const te = this;
        const me = m;

        const scaleX = 1 / _v1.set([me[0], me[1], me[2]]).magnitude();
        const scaleY = 1 / _v1.set([me[4], me[5], me[6]]).magnitude();
        const scaleZ = 1 / _v1.set([me[8], me[9], me[10]]).magnitude();

        te[0] = me[0] * scaleX;
        te[1] = me[1] * scaleX;
        te[2] = me[2] * scaleX;
        te[3] = 0;

        te[4] = me[4] * scaleY;
        te[5] = me[5] * scaleY;
        te[6] = me[6] * scaleY;
        te[7] = 0;

        te[8] = me[8] * scaleZ;
        te[9] = me[9] * scaleZ;
        te[10] = me[10] * scaleZ;
        te[11] = 0;

        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return this;
    }

    copyPosition(m: Matrix4): this {
        this[12] = m[12];
        this[13] = m[13];
        this[14] = m[14];
        return this;
    }

    setFromMatrix3(m: Matrix3): this {
        const me = m;
        this.set([
            me[0], me[3], me[6], 0,
            me[1], me[4], me[7], 0,
            me[2], me[5], me[8], 0,
            0, 0, 0, 1
        ]);
        return this;
    }

    extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this {
        xAxis.setFromMatrixColumn(this, 0);
        yAxis.setFromMatrixColumn(this, 1);
        zAxis.setFromMatrixColumn(this, 2);
        return this;
    }

    setBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this {
        this.set([
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        ])
        return this;
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

        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = near * p;

        return this.set([
            2 * w, 0, 0, 0,
            0, 2 * h, 0, 0,
            0, 0, -1 * p, 0,
            -x, -y, -z, 1
        ]);
    }
    setPerspective(left: number, right: number, top: number, bottom: number, near: number, far: number): this {
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);

        const c = -far / (far - near);
        const d = (-far * near) / (far - near);

        return this.set([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, c, -1,
            a, b, d, 0
        ]);
    }
    setPosition( x: Vector3 | number, y: number, z: number ) {
		const te = this;

		if ( x instanceof Vector3 ) {
			te[ 12 ] = x.x;
			te[ 13 ] = x.y;
			te[ 14 ] = x.z;

		} else {
			te[12] = x;
			te[13] = y;
			te[14] = z;
		}

		return this;
	}

    setScale(x: Vector3 | number, y: number, z: number): this {
        if (x instanceof Vector3) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        this.set([
            x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1
        ]);
        return this;
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
    transpose() {
		const te = this;
		let tmp;

		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

		return this;

	}

    toString() {
        const te = this;
        return `${te[0]} ${te[4]} ${te[8]} ${te[12]}\n${te[1]} ${te[5]} ${te[9]} ${te[13]}\n${te[2]} ${te[6]} ${te[10]} ${te[14]}\n${te[3]} ${te[7]} ${te[11]} ${te[15]}`;
    }
}
const _zero = new Vector3();
const _one = new Vector3(1, 1, 1);
const _m1 = new Matrix4();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();