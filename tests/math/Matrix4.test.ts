import { describe, expect, test } from 'vitest';
//import { Matrix4, Vector3, Quaternion, Euler } from '@/math';
import { Matrix4 } from '@/math/Matrix4';
import { Vector3 } from '@/math/Vector3';
import { Quaternion } from '@/math/Quaternion';
import { Euler } from '@/math/Euler';

describe('Matrix4', () => {
    test('constructor initializes with identity matrix by default', () => {
        const m = new Matrix4();
        expect(Array.from(m)).toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    });

    test('add matrices', () => {
        const m1 = new Matrix4([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const m2 = new Matrix4([
            1, 1, 1, 1,
            1, 1, 1, 1, 
            1, 1, 1, 1,
            1, 1, 1, 1
        ]);
        m1.add(m2);
        expect(Array.from(m1)).toEqual([
            2, 3, 4, 5,
            6, 7, 8, 9,
            10, 11, 12, 13,
            14, 15, 16, 17
        ]);
    });

    test('multiply matrices', () => {
        const m1 = new Matrix4([
            1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 3, 0,
            1, 2, 3, 1
        ]);
        const m2 = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 2, 3, 1
        ]);
        m1.multiply(m2);
        expect(Array.from(m1)).toEqual([
            1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 3, 0,
            2, 6, 12, 1
        ]);
    });

    test('multiplyMatrices', () => {
        const a = new Matrix4([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const b = new Matrix4().setIdentity().translate(new Vector3(1,1,1));
        const m = new Matrix4().multiplyMatrices(a, b);
        expect(m[12]).toBe(14); 
        expect(m[13]).toBe(15);
        expect(m[14]).toBe(16);
    });

    test('scale matrix', () => {
        const m = new Matrix4();
        m.scale(new Vector3(2, 3, 4));
        expect(Array.from(m)).toEqual([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1
        ]);
    });

    test('compose and decompose', () => {
        const t = new Vector3(1, 2, 3);
        const r = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
        const s = new Vector3(2, 2, 2);
        const m = new Matrix4().compose(t, r, s);

        const outT = new Vector3();
        const outR = new Quaternion();
        const outS = new Vector3();
        m.decompose(outT, outR, outS);

        expect(outT.toArray()).toEqual([1, 2, 3]);
        expect(Math.round(outS.x)).toEqual(2);
        expect(Math.round(outS.y)).toEqual(2);
        expect(Math.round(outS.z)).toEqual(2);
    });

    test('set position', () => {
        const m = new Matrix4();
        m.setPosition(new Vector3(1, 2, 3));
        expect(Array.from(m)).toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 2, 3, 1
        ]);
    });

    test('set rotation from quaternion', () => {
        const m = new Matrix4();
        const q = new Quaternion();
        q.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2);
        m.setRotation(q);
        
        const result = Array.from(m).map(v => Math.round(v * 1000) / 1000);
        expect(result).toEqual([
            0, 0, 1, 0,
            0, 1, 0, 0,
            -1, 0, 0, 0,
            0, 0, 0, 1
        ]);
    });

    test('rotateX, rotateY, rotateZ', () => {
        const m = new Matrix4();
        m.rotateX(Math.PI / 2).rotateY(Math.PI / 2).rotateZ(Math.PI / 2);
        const result = Array.from(m).map(v => Number(v.toFixed(2)));
        // Just ensure it doesn't throw and changes the matrix
        expect(result).not.toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    });

    test('rotateOnAxis', () => {
        const m = new Matrix4();
        m.rotateOnAxis(new Vector3(1, 1, 0).normalize(), Math.PI / 4);
        // Just checking the matrix got updated (not identity)
        expect(m[0]).not.toBe(1);
    });

    test('translate', () => {
        const m = new Matrix4();
        m.translate(new Vector3(2, 3, 4));
        expect([m[12], m[13], m[14]]).toEqual([2, 3, 4]);
    });

    test('invert', () => {
        const m = new Matrix4([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1
        ]);
        m.invert();
        expect(m[0]).toBeCloseTo(0.5);
        expect(m[5]).toBeCloseTo(1 / 3);
        expect(m[10]).toBeCloseTo(0.25);
    });

    test('determinant calculation', () => {
        const m = new Matrix4([
            1, 0, 0, 0,
            0, 2, 0, 0, 
            0, 0, 3, 0,
            0, 0, 0, 1
        ]);
        expect(m.determinant()).toBe(6);
    });

    test('get max scale on axis', () => {
        const m = new Matrix4([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1
        ]);
        expect(m.getMaxScaleOnAxis()).toBe(4);
    });

    test('getRotation', () => {
        const m = new Matrix4().rotateY(Math.PI / 3);
        const q = m.getRotation();
        expect(Math.round(q.w * 10) / 10).toBeCloseTo(0.9, 1);
    });

    test('getScale', () => {
        const m = new Matrix4().scale(new Vector3(2, 3, 4));
        const s = m.getScale();
        expect(s.toArray()).toEqual([2, 3, 4]);
    });

    test('getScaleOnAxis', () => {
        const m = new Matrix4().scale(new Vector3(2, 3, 4));
        const scaleX = m.getScaleOnAxis(new Vector3(1, 0, 0));
        const scaleY = m.getScaleOnAxis(new Vector3(0, 1, 0));
        expect(Math.round(scaleX)).toBe(2);
        expect(Math.round(scaleY)).toBe(3);
    });

    test('getTranslation', () => {
        const m = new Matrix4().translate(new Vector3(1, 2, 3));
        const t = m.getTranslation();
        expect(t.toArray()).toEqual([1, 2, 3]);
    });

    test('setFrustum', () => {
        const m = new Matrix4();
        m.setFrustum(-1, 1, -1, 1, 1, 10);
        // Rough check that corners are set
        expect(m[0]).toBeCloseTo(1);
        expect(m[5]).toBeCloseTo(1);
        expect(m[10]).toBeCloseTo(-1.222, 3);
    });

    test('lookAt', () => {
        const eye = new Vector3(0,0,5);
        const target = new Vector3(0,0,0);
        const up = new Vector3(0,1,0);
        const m = new Matrix4().lookAt(eye, target, up);
        // Z should be negative in translation
        expect(m[14]).toBeLessThan(0);
    });

    test('setFromRotationMatrix', () => {
        const m1 = new Matrix4().rotateZ(Math.PI / 2);
        const m2 = new Matrix4().setFromRotationMatrix(m1);
        expect(Array.from(m2)).toEqual(Array.from(m1));
    });

    test('setRotationFromEuler', () => {
        const e = new Euler(Math.PI/2, 0, 0, 'XYZ');
        const m = new Matrix4();
        m.setRotationFromEuler(e);
        // Check rotation set in top-left
        expect(Math.round(m[5])).toBe(0);
        expect(Math.round(m[6])).toBe(-1);
        expect(Math.round(m[9])).toBe(1);
        expect(Math.round(m[10])).toBe(0);
    });

    test('setIdentity', () => {
        const m = new Matrix4([
            2, 3, 4, 5,
            5, 6, 7, 8,
            9, 10, 11,12,
            13,14,15,16
        ]);
        m.setIdentity();
        expect(Array.from(m)).toEqual([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]);
    });

    test('setOrthographic', () => {
        const m = new Matrix4().setOrthographic(-1,1,-1,1,1,10);
        // W-value for translation
        expect(m[12]).toBe(0);
        expect(m[13]).toBe(0);
        expect(m[14]).toBeCloseTo(-1.222, 3);
    });

    test('setPerspective projection', () => {
        const m = new Matrix4();
        m.setPerspective(Math.PI/4, 1, 1, 100);
        const result = Array.from(m).map(v => Math.round(v * 1000) / 1000);
        expect(result[0]).toBeCloseTo(2.414, 2);
        expect(result[5]).toBeCloseTo(2.414, 2);
        expect(result[10]).toBeCloseTo(-1.020, 2);
        expect(result[14]).toBeCloseTo(-2.020, 2);
    });

    test('transformPoint', () => {
        const m = new Matrix4().translate(new Vector3(1,2,3));
        const v = new Vector3(0,0,0);
        const result = m.transformPoint(v);
        expect(result.toArray()).toEqual([1,2,3]);
    });

    test('transpose', () => {
        const m = new Matrix4([
            1,2,3,4,
            5,6,7,8,
            9,10,11,12,
            13,14,15,16
        ]);
        m.transpose();
        expect(Array.from(m)).toEqual([
            1,5,9,13,
            2,6,10,14,
            3,7,11,15,
            4,8,12,16
        ]);
    });
});