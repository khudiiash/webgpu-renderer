import { BufferData } from '@/data';

export class Matrix3 extends BufferData {
    constructor(values?: number[]) {
        super(new Float32Array(9));
        if (values) this.set(values);
        else this.setIdentity();
    }

    setIdentity(): this {
        this[0] = 1; this[1] = 0; this[2] = 0;
        this[3] = 0; this[4] = 1; this[5] = 0;
        this[6] = 0; this[7] = 0; this[8] = 1;
        return this;
    }

    copy(m: Matrix3): this {
        return this.set(m as unknown as number[]);
    }

    multiply(m: Matrix3): this {
        const a = this, b = m;
        const a00 = a[0], a01 = a[1], a02 = a[2];
        const a10 = a[3], a11 = a[4], a12 = a[5];
        const a20 = a[6], a21 = a[7], a22 = a[8];
        const b00 = b[0], b01 = b[1], b02 = b[2];
        const b10 = b[3], b11 = b[4], b12 = b[5];
        const b20 = b[6], b21 = b[7], b22 = b[8];

        this.set([
            a00 * b00 + a01 * b10 + a02 * b20,
            a00 * b01 + a01 * b11 + a02 * b21,
            a00 * b02 + a01 * b12 + a02 * b22,
            a10 * b00 + a11 * b10 + a12 * b20,
            a10 * b01 + a11 * b11 + a12 * b21,
            a10 * b02 + a11 * b12 + a12 * b22,
            a20 * b00 + a21 * b10 + a22 * b20,
            a20 * b01 + a21 * b11 + a22 * b21,
            a20 * b02 + a21 * b12 + a22 * b22
        ]);
        return this;
    }

    invert(): this {
        const m = this,
            a00 = m[0], a01 = m[1], a02 = m[2],
            a10 = m[3], a11 = m[4], a12 = m[5],
            a20 = m[6], a21 = m[7], a22 = m[8],

            b01 = a22 * a11 - a12 * a21,
            b02 = -a22 * a10 + a12 * a20,
            b03 = a21 * a10 - a11 * a20,
            
            det = a00 * b01 + a01 * b02 + a02 * b03;

        if (!det) return this.setIdentity();

        const invDet = 1 / det;
        this.set([
            b01 * invDet,
            (-a22 * a01 + a02 * a21) * invDet,
            (a12 * a01 - a02 * a11) * invDet,
            b02 * invDet,
            (a22 * a00 - a02 * a20) * invDet,
            (-a12 * a00 + a02 * a10) * invDet,
            b03 * invDet,
            (-a21 * a00 + a01 * a20) * invDet,
            (a11 * a00 - a01 * a10) * invDet
        ]);
        return this;
    }

    fromMatrix4(mat4: { [key: number]: number }): this {
        this.set([
            mat4[0], mat4[1], mat4[2],
            mat4[4], mat4[5], mat4[6],
            mat4[8], mat4[9], mat4[10]
        ]);
        return this;
    }
}