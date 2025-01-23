import { describe, it, expect } from 'vitest';
import { Vector4 } from '@/math/Vector4';
import { Matrix4 } from '@/math/Matrix4';

describe('Vector4', () => {
    it('creates with default values', () => {
        const v = new Vector4();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
        expect(v.w).toBe(0);
        expect(v.isVector4).toBe(true);
        expect(v.length).toBe(4);
    });

    it('creates with custom values', () => {
        const v = new Vector4(1, 2, 3, 4);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
        expect(v.w).toBe(4);
    });

    it('sets and gets values through properties', () => {
        const v = new Vector4();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        v.w = 4;
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
        expect(v.w).toBe(4);
    });

    it('adds vectors', () => {
        const v1 = new Vector4(1, 2, 3, 4);
        const v2 = new Vector4(2, 3, 4, 5);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
        expect(v1.z).toBe(7);
        expect(v1.w).toBe(9);
    });

    it('subtracts vectors', () => {
        const v1 = new Vector4(3, 4, 5, 6);
        const v2 = new Vector4(1, 1, 1, 1);
        v1.sub(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
        expect(v1.z).toBe(4);
        expect(v1.w).toBe(5);
    });

    it('multiplies vectors', () => {
        const v1 = new Vector4(2, 3, 4, 5);
        const v2 = new Vector4(2, 2, 2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
        expect(v1.z).toBe(8);
        expect(v1.w).toBe(10);
    });

    it('divides vectors', () => {
        const v1 = new Vector4(4, 6, 8, 10);
        const v2 = new Vector4(2, 2, 2, 2);
        v1.divide(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
        expect(v1.z).toBe(4);
        expect(v1.w).toBe(5);
    });

    it('calculates dot product', () => {
        const v1 = new Vector4(1, 2, 3, 4);
        const v2 = new Vector4(2, 3, 4, 5);
        const dot = v1.dot(v2);
        expect(dot).toBe(40); // 1*2 + 2*3 + 3*4 + 4*5
    });

    it('calculates manhattan length', () => {
        const v = new Vector4(1, -2, 3, -4);
        expect(v.manhattanLength()).toBe(10); // |1| + |-2| + |3| + |-4|
    });

    it('calculates magnitude', () => {
        const v = new Vector4(1, 2, 2, 4);
        expect(v.magnitude()).toBe(5); // sqrt(1^2 + 2^2 + 2^2 + 4^2) = sqrt(25) = 5
    });

    it('applies matrix4 transformation', () => {
        const v = new Vector4(1, 2, 3, 1);
        const m = new Matrix4().set([
            2, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 2, 0,
            1, 1, 1, 1
        ]);
        v.applyMatrix4(m);
        expect(v.x).toBe(3); // 2*1 + 0*2 + 0*3 + 1*1
        expect(v.y).toBe(5); // 0*1 + 2*2 + 0*3 + 1*1
        expect(v.z).toBe(7); // 0*1 + 0*2 + 2*3 + 1*1
        expect(v.w).toBe(1); // 0*1 + 0*2 + 0*3 + 1*1
    });

    it('sets from matrix column', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector4();
        v.setFromMatrixColumn(m, 1); // Second column
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
        expect(v.z).toBe(7);
        expect(v.w).toBe(8);
    });

    it('clones vector', () => {
        const v1 = new Vector4(1, 2, 3, 4);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2.w).toBe(4);
        expect(v2).not.toBe(v1); // Different instances
    });

    it('copies vector', () => {
        const v1 = new Vector4(1, 2, 3, 4);
        const v2 = new Vector4();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2.w).toBe(4);
    });

    it('checks equality', () => {
        const v1 = new Vector4(1, 2, 3, 4);
        const v2 = new Vector4(1, 2, 3, 4);
        const v3 = new Vector4(1, 2, 3, 5);
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v3)).toBe(false);
    });

    it('sets from array', () => {
        const v = new Vector4();
        const array = [5, 6, 7, 8, 9, 10];
        v.set(array, 1);
        expect(v.x).toBe(6);
        expect(v.y).toBe(7);
        expect(v.z).toBe(8);
        expect(v.w).toBe(9);
    });

    it('converts to array', () => {
        const v = new Vector4(1, 2, 3, 4);
        const array: number[] = [];
        v.toArray(array, 1);
        expect(array).toEqual([undefined, 1, 2, 3, 4]);
    });

    it('converts to array with default parameters', () => {
        const v = new Vector4(1, 2, 3, 4);
        const array = v.toArray();
        expect(array).toEqual([1, 2, 3, 4]);
    });
});