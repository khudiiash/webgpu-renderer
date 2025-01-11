import { describe, it, expect } from 'vitest';
import { Euler } from '../../src/math/Euler';
import { Quaternion } from '../../src/math/Quaternion';
import { Vector3 } from '../../src/math/Vector3';
import { Matrix4 } from '../../src/math/Matrix4';

describe('EulerOrder', () => {
    it('has static predefined orders', () => {
        expect(Euler.XYZ).toBe('XYZ');
        expect(Euler.YZX).toBe('YZX');
        expect(Euler.ZXY).toBe('ZXY');
        expect(Euler.XZY).toBe('XZY');
        expect(Euler.YXZ).toBe('YXZ');
        expect(Euler.ZYX).toBe('ZYX');
    });

    it('has default order set to XYZ', () => {
        expect(Euler.DEFAULT_ORDER).toBe(Euler.XYZ);
    });

    it('can map orders to their respective indices', () => {
        expect(Euler['ORDERS'].indexOf(Euler.XYZ)).toBe(0);
        expect(Euler['ORDERS'].indexOf(Euler.YZX)).toBe(1);
        expect(Euler['ORDERS'].indexOf(Euler.ZXY)).toBe(2);
        expect(Euler['ORDERS'].indexOf(Euler.XZY)).toBe(3);
        expect(Euler['ORDERS'].indexOf(Euler.YXZ)).toBe(4);
        expect(Euler['ORDERS'].indexOf(Euler.ZYX)).toBe(5);
    });

    it('retrieves the correct order number from string or number input', () => {
        const e = new Euler();
        expect(e['__getOrderNum']('XYZ')).toBe(0);
        expect(e['__getOrderNum']('YZX')).toBe(1);
        expect(e['__getOrderNum']('ZXY')).toBe(2);
        expect(e['__getOrderNum']('XZY')).toBe(3);
        expect(e['__getOrderNum']('YXZ')).toBe(4);
        expect(e['__getOrderNum']('ZYX')).toBe(5);
    });

    it('reorders Euler angles properly', () => {
        const e = new Euler(1, 2, 3, 'XYZ');
        e.reorder('ZXY');
        expect(e.order).toBe(Euler.ZXY);
    });

    it('sets from rotation matrix with all orders', () => {
        const m = new Matrix4();
        m.rotateX(Math.PI / 2);
        const e = new Euler();

        for (const order of Euler['ORDERS']) {
            e.setFromRotationMatrix(m, order);
            expect(e.order).toBe(order); // Ensures the order is correctly set
        }
    });

    it('sets from quaternion with all orders', () => {
        const q = new Quaternion();
        q.set([0, 0.707, 0, 0.707]); // 90 degrees around Y
        const e = new Euler();

        for (const order of Euler['ORDERS']) {
            e.setFromQuaternion(q, order);
            expect(e.order).toBe(order);
        }
    });

    it('sets from vector3 with all orders', () => {
        const v = new Vector3(0.5, 1, 1.5);
        const e = new Euler();

        for (const order of Euler['ORDERS']) {
            e.setFromVector3(v, order);
            expect(e.order).toBe(order);
            expect(e.x).toBeCloseTo(v.x);
            expect(e.y).toBeCloseTo(v.y);
            expect(e.z).toBeCloseTo(v.z);
        }
    });
});