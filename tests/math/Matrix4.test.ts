import { describe, expect, test } from 'vitest';
import { Matrix4, Vector3, Quaternion } from '../../src/math';

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
        
        // Round values to avoid floating point issues
        const result = Array.from(m).map(v => Math.round(v * 1000) / 1000);
        expect(result).toEqual([
            0, 0, 1, 0,
            0, 1, 0, 0,
            -1, 0, 0, 0,
            0, 0, 0, 1
        ]);
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

    test('set perspective projection', () => {
        const m = new Matrix4();
        m.setPerspective(Math.PI/4, 1, 1, 100);
        
        const result = Array.from(m).map(v => Math.round(v * 1000) / 1000);
        expect(result[0]).toBeCloseTo(2.414, 2); // focal length
        expect(result[5]).toBeCloseTo(2.414, 2); // focal length
        expect(result[10]).toBeCloseTo(-1.020, 2); // near/far transform
        expect(result[14]).toBeCloseTo(-2.020, 2); // perspective divide
    });
});