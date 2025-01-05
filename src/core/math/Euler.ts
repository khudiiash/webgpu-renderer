import { Matrix4, Quaternion, Vector3 } from '.';
import { BufferData, RAD2DEG } from '@/util';

export type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';

export class Euler extends BufferData {

    static XYZ: EulerOrder = 'XYZ';
    static YZX: EulerOrder = 'YZX';
    static ZXY: EulerOrder = 'ZXY';
    static XZY: EulerOrder = 'XZY';
    static YXZ: EulerOrder = 'YXZ';
    static ZYX: EulerOrder = 'ZYX';

    private static ORDERS: EulerOrder[] = [Euler.XYZ, Euler.YZX, Euler.ZXY, Euler.XZY, Euler.YXZ, Euler.ZYX];
    static DEFAULT_ORDER: EulerOrder = Euler.XYZ;

    static INSTANCE = new Euler();

    constructor(x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER) {
        super([x, y, z, Euler.ORDERS.indexOf(order)]);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }
    get order() { return Euler.ORDERS[this[3]]; }

    set x(value) { this[0] = value; this.monitor.check(); }
    set y(value) { this[1] = value; this.monitor.check(); }
    set z(value) { this[2] = value; this.monitor.check(); }
    set order(value) { this[3] = Euler.ORDERS.indexOf(value); this.monitor.check(); }

    private __getOrderNum(order: EulerOrder | number): number {
        if (typeof order === 'number') return order;
        if (typeof order === 'string') return Euler.ORDERS.indexOf(order as EulerOrder);
        return Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER);
    }
    
    setFromQuaternion(q: Quaternion, order = this.order) {
        Matrix4.INSTANCE.setFromQuaternion(q);
        return this.setFromRotationMatrix(Matrix4.INSTANCE, order);
    }
    
    print() {
        const x = Math.round(this[0] * RAD2DEG);
        const y = Math.round(this[1] * RAD2DEG);
        const z = Math.round(this[2] * RAD2DEG);
        return `Euler { x: ${x}°, y: ${y}°, z: ${z}° }`;
    }
    
    setFromRotationMatrix(m: Matrix4, order = this.order) {
        const m11 = m[0], m12 = m[1], m13 = m[2];
        const m21 = m[4], m22 = m[5], m23 = m[6];
        const m31 = m[8], m32 = m[9], m33 = m[10];

        switch (order) {
            case Euler.XYZ:
                this[1] = Math.asin(Math.max(-1, Math.min(1, m31)));
                if (Math.abs(m31) < 0.9999999) {
                    this[0] = Math.atan2(-m32, m33);
                    this[2] = Math.atan2(-m21, m11);
                } else {
                    this[0] = Math.atan2(m23, m22);
                    this[2] = 0;
                }
                break;

            case Euler.YXZ:
                this[0] = Math.asin(-Math.max(-1, Math.min(1, m23)));
                if (Math.abs(m23) < 0.9999999) {
                    this[1] = Math.atan2(m13, m33);
                    this[2] = Math.atan2(m21, m22);
                } else {
                    this[1] = Math.atan2(-m31, m11);
                    this[2] = 0;
                }
                break;

            case Euler.ZXY:
                this[0] = Math.asin(Math.max(-1, Math.min(1, m32)));
                if (Math.abs(m32) < 0.9999999) {
                    this[1] = Math.atan2(-m31, m33);
                    this[2] = Math.atan2(-m12, m22);
                } else {
                    this[1] = 0;
                    this[2] = Math.atan2(m13, m11);
                }
                break;

            case Euler.ZYX:
                this[1] = Math.asin(-Math.max(-1, Math.min(1, m13)));
                if (Math.abs(m13) < 0.9999999) {
                    this[0] = Math.atan2(m23, m33);
                    this[2] = Math.atan2(m12, m11);
                } else {
                    this[0] = 0;
                    this[2] = Math.atan2(-m21, m22);
                }
                break;

            case Euler.YZX:
                this[2] = Math.asin(Math.max(-1, Math.min(1, m21)));
                if (Math.abs(m21) < 0.9999999) {
                    this[0] = Math.atan2(-m23, m22);
                    this[1] = Math.atan2(-m31, m11);
                } else {
                    this[0] = 0;
                    this[1] = Math.atan2(m13, m33);
                }
                break;

            case Euler.XZY:
                this[2] = Math.asin(-Math.max(-1, Math.min(1, m12)));
                if (Math.abs(m12) < 0.9999999) {
                    this[0] = Math.atan2(m32, m22);
                    this[1] = Math.atan2(m13, m11);
                } else {
                    this[0] = Math.atan2(-m23, m33);
                    this[1] = 0;
                }
                break;
        }

        this.normalize();
        return this;
    }

    // Helper method to normalize angles to [-π, π]
    normalize(): this {
        this[0] = ((this.x + Math.PI) % (2 * Math.PI)) - Math.PI;
        this[1] = ((this.y + Math.PI) % (2 * Math.PI)) - Math.PI;
        this[2] = ((this.z + Math.PI) % (2 * Math.PI)) - Math.PI;
        return this;
    }
    
    setFromVector3(v: Vector3, order = this.order) {
        return this.set([v.x, v.y, v.z, this.__getOrderNum(order)]);
    }
    
    reorder(order: EulerOrder) {
        Quaternion.INSTANCE.setFromEuler(this);
        return this.setFromQuaternion(Quaternion.INSTANCE, order);
    }
    
}
