import { describe, it, expect } from 'vitest';
import { Matrix3 } from '@/math/Matrix3';
import { Matrix4 } from '@/math/Matrix4';

describe('Matrix3', () => {
    describe('constructor', () => {
        it('initializes with identity matrix by default', () => {
            const matrix = new Matrix3();
            expect(Array.from(matrix)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        });

        it('initializes with provided values', () => {
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const matrix = new Matrix3(values);
            expect(Array.from(matrix)).toEqual(values);
        });
    });

    describe('setIdentity', () => {
        it('sets matrix to identity', () => {
            const matrix = new Matrix3(2, 3, 4, 5, 6, 7, 8, 9, 10);
            matrix.setIdentity();
            expect(Array.from(matrix)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        });

        it('returns this for chaining', () => {
            const matrix = new Matrix3();
            expect(matrix.setIdentity()).toBe(matrix);
        });
    });

    describe('copy', () => {
        it('copies values from another matrix', () => {
            const source = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
            const target = new Matrix3();
            target.copy(source);
            expect(Array.from(target)).toEqual(Array.from(source));
        });

        it('returns this for chaining', () => {
            const matrix = new Matrix3();
            expect(matrix.copy(new Matrix3())).toBe(matrix);
        });
    });

    describe('multiply', () => {
        it('correctly multiplies two matrices', () => {
            const a = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
            const b = new Matrix3(9, 8, 7, 6, 5, 4, 3, 2, 1);
            a.multiply(b);
            expect(Array.from(a)).toEqual([30, 24, 18, 84, 69, 54, 138, 114, 90]);
        });

        it('handles identity matrix multiplication', () => {
            const matrix = new Matrix3([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const identity = new Matrix3();
            matrix.multiply(identity);
            expect(Array.from(matrix)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it('returns this for chaining', () => {
            const matrix = new Matrix3();
            expect(matrix.multiply(new Matrix3())).toBe(matrix);
        });
    });

    describe('invert', () => {
        it('correctly inverts a non-singular matrix', () => {
            const matrix = new Matrix3([4, 0, 0, 0, 2, 0, 0, 0, 1]);
            matrix.invert();
            expect(Array.from(matrix)).toEqual([0.25, 0, 0, 0, 0.5, 0, 0, 0, 1]);
        });

        it('returns identity for singular matrix', () => {
            const matrix = new Matrix3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            matrix.invert();
            expect(Array.from(matrix)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        });

        it('returns this for chaining', () => {
            const matrix = new Matrix3();
            expect(matrix.invert()).toBe(matrix);
        });
    });

    describe('fromMatrix4', () => {
        it('correctly extracts 3x3 matrix from 4x4 matrix', () => {
            const mat4 = new Matrix4(
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16
            );
            const matrix = new Matrix3();
            matrix.fromMatrix4(mat4);
            expect(Array.from(matrix)).toEqual([1, 2, 3, 5, 6, 7, 9, 10, 11]);
        });
    });
});