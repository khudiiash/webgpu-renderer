import { Matrix4 } from '../../math/Matrix4';
import { Vector3 } from '../../math/Vector3';
import { Quaternion } from '../../math/Quaternion';
import { arraysEqual } from '../../utils/arraysEqual';
import { jest } from '@jest/globals';

describe('Matrix4 Additional Tests', () => {
    let matrix;
    
    beforeEach(() => {
        matrix = new Matrix4();
    });


    test('onChange callback should be called when matrix changes', () => {
        const callback = jest.fn();
        matrix.onChange(callback);
        matrix.scale(1, 2, 3);
        expect(callback).toHaveBeenCalled();
    });

    test('onChange callback should not be called when matrix does not change', () => {
        const callback = jest.fn();
        matrix.onChange(callback);
        matrix.scale(1, 1, 1);
        expect(callback).not.toHaveBeenCalled();
    });

    test('lookAtRotation should create correct rotation matrix', () => {
        const eye = new Vector3(0, 0, 5);
        const target = new Vector3(0, 0, 0);
        const up = new Vector3(0, 1, 0);

        matrix.lookAtRotation(eye, target, up);
        
        // Check if forward vector (z-axis) points to -z
        expect(matrix[8]).toBeCloseTo(0);
        expect(matrix[9]).toBeCloseTo(0);
        expect(matrix[10]).toBeCloseTo(-1);
    });

    test('identity should reset matrix to identity', () => {
        matrix.translate(1, 2, 3);
        matrix.identity();
        
        expect(arraysEqual(matrix, new Matrix4())).toBe(true);
    });

    test('print should return correct string representation', () => {
        const result = matrix.identity().print();
        expect(result).toBe('1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1');
    });

    test('setFromQuaternion should set correct rotation', () => {
        const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
        matrix.setFromQuaternion(q);
        
        expect(matrix[0]).toBeCloseTo(0);
        expect(matrix[2]).toBeCloseTo(1);
        expect(matrix[8]).toBeCloseTo(-1);
        expect(matrix[10]).toBeCloseTo(0);
    });

    test('transpose should correctly transpose matrix', () => {
        matrix.set(
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        );
        matrix.transpose();
        
        expect(matrix[1]).toBe(5);
        expect(matrix[2]).toBe(9);
        expect(matrix[3]).toBe(13);
        expect(matrix[4]).toBe(2);
    });

    test('getMaxScaleOnAxis should return largest scale', () => {
        matrix.scale(2, 3, 4);
        expect(matrix.getMaxScaleOnAxis()).toBeCloseTo(4);
    });

    test('transformPoint should correctly transform point', () => {
        matrix.translate(1, 2, 3);
        const point = new Vector3(1, 1, 1);
        matrix.transformPoint(point);
        
        expect(point.x).toBe(2);
        expect(point.y).toBe(3);
        expect(point.z).toBe(4);
    });

    test('rotateX/Y/Z should correctly rotate matrix', () => {
        matrix.rotateX(Math.PI / 2);
        expect(matrix[5]).toBeCloseTo(0);
        expect(matrix[6]).toBeCloseTo(1);
        
        matrix.identity().rotateY(Math.PI / 2);
        expect(matrix[0]).toBeCloseTo(0);
        expect(matrix[2]).toBeCloseTo(-1);
        
        matrix.identity().rotateZ(Math.PI / 2);
        expect(matrix[0]).toBeCloseTo(0);
        expect(matrix[1]).toBeCloseTo(1);
    });

    test('fromArray and toArray should work correctly', () => {
        const array = [
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ];
        
        matrix.fromArray(array);
        const result = [];
        matrix.toArray(result);
        
        expect(result).toEqual(array);
    });

    test('onChange callback should be called when matrix changes', () => {
        let called = false;
        matrix.onChange(() => called = true);
        
        matrix.translate(1, 2, 3);
        expect(called).toBe(true);
    });

    test('equalsArray should correctly compare with array', () => {
        const array = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
        
        expect(matrix.equalsArray(array)).toBe(true);
        array[0] = 2;
        expect(matrix.equalsArray(array)).toBe(false);
    });

    test('frustum should create correct perspective matrix', () => {
        matrix.frustum(-1, 1, -1, 1, 1, 100);
        
        // Check some key elements that define a perspective projection
        expect(matrix[0]).toBe(1);  // focal length x
        expect(matrix[5]).toBe(1);  // focal length y
        expect(matrix[10]).toBeCloseTo(-1, 1);  // depth translation
        expect(matrix[14]).toBeCloseTo(-1, 1);  // depth scaling
    });
});
