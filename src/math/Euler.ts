import { Matrix4 } from './Matrix4';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
import { BufferData } from '@/data/BufferData';
import { clamp, RAD2DEG } from '@/util/math';

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

    static instance = new Euler();

    constructor(x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER) {
        super([x, y, z, Euler.ORDERS.indexOf(order)]);
    }

    get x() { return this[0]; }
    get y() { return this[1]; }
    get z() { return this[2]; }
    get order() { return Euler.ORDERS[this[3]]; }

    set x(value) { this[0] = value; this.monitor.check(0, 1); }
    set y(value) { this[1] = value; this.monitor.check(1, 2); }
    set z(value) { this[2] = value; this.monitor.check(2, 3); }
    set order(value) { this[3] = Euler.ORDERS.indexOf(value); this.monitor.check(3, 4); }

    private __getOrderNum(order: EulerOrder | number): number {
        if (typeof order === 'number') return order;
        if (typeof order === 'string') return Euler.ORDERS.indexOf(order as EulerOrder);
        return Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER);
    }
    
    setFromQuaternion(q: Quaternion, order = this.order): this {
        Quaternion.instance.copy(q);
        const m = Matrix4.instance;
        m.setRotationFromQuaternion(q);
        this.setFromRotationMatrix(m, order);
        return this;
    }
    
	setFromRotationMatrix(m: Matrix4, order = this.order) {
		const te = m;
		const m11 = te[0], m12 = te[4], m13 = te[8];
		const m21 = te[1], m22 = te[5], m23 = te[9];
		const m31 = te[2], m32 = te[6], m33 = te[10];
	
		switch (order) {
			case Euler.XYZ:
				this[1] = Math.asin(clamp(m13, -1, 1));
				if (Math.abs(m13) < 0.9999999) {
					this[0] = Math.atan2(-m23, m33);
					this[2] = Math.atan2(-m12, m11);
				} else {
					this[0] = Math.atan2(m32, m22);
					this[2] = 0;
				}
				break;
	
			case Euler.YXZ:
				this[0] = Math.asin(-clamp(m23, -1, 1));
				if (Math.abs(m23) < 0.9999999) {
					this[1] = Math.atan2(m13, m33);
					this[2] = Math.atan2(m21, m22);
				} else {
					this[1] = Math.atan2(-m31, m11);
					this[2] = 0;
				}
				break;
	
			case Euler.ZXY:
				this[0] = Math.asin(clamp(m32, -1, 1));
				if (Math.abs(m32) < 0.9999999) {
					this[1] = Math.atan2(-m31, m33);
					this[2] = Math.atan2(-m12, m22);
				} else {
					this[1] = 0;
					this[2] = Math.atan2(m21, m11);
				}
				break;
	
			case Euler.ZYX:
				this[1] = Math.asin(-clamp(m31, -1, 1));
				if (Math.abs(m31) < 0.9999999) {
					this[0] = Math.atan2(m32, m33);
					this[2] = Math.atan2(m21, m11);
				} else {
					this[0] = 0;
					this[2] = Math.atan2(-m12, m22);
				}
				break;
	
			case Euler.YZX:
				this[2] = Math.asin(clamp(m21, -1, 1));
				if (Math.abs(m21) < 0.9999999) {
					this[0] = Math.atan2(-m23, m22);
					this[1] = Math.atan2(-m31, m11);
				} else {
					this[0] = 0;
					this[1] = Math.atan2(m13, m33);
				}
				break;
	
			case Euler.XZY:
				this[2] = Math.asin(-clamp(m12, -1, 1));
				if (Math.abs(m12) < 0.9999999) {
					this[0] = Math.atan2(m32, m22);
					this[1] = Math.atan2(m13, m11);
				} else {
					this[0] = Math.atan2(-m23, m33);
					this[1] = 0;
				}
				break;
	
			default:
				console.warn('Euler: .setFromRotationMatrix() unknown order: ' + order);
		}
		this[3] = Euler.ORDERS.indexOf(order);
		return this;
	}

	toDegString() {
		return `X ${this.x * RAD2DEG}\nY ${this.y * RAD2DEG}\nZ ${this.z * RAD2DEG}\nORDER ${this.order}`;
	}

	toString() {
		return `X ${this.x}\nY ${this.y}\nZ ${this.z}\nORDER ${this.order} }`;
	}

    setFromVector3(v: Vector3, order = this.order) {
        return this.set([v.x, v.y, v.z, this.__getOrderNum(order)]);
    }
    
    reorder(order: EulerOrder) {
        Quaternion.instance.setFromEuler(this);
        return this.setFromQuaternion(Quaternion.instance, order);
    }
    
}
