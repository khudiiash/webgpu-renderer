import { describe, test, expect } from 'vitest';
import { Vector3 } from '@/math/Vector3';
import { Matrix4 } from '@/math/Matrix4';

describe('Vector3', () => {
    test('static properties return correct vectors', () => {
        expect(Vector3.zero.toString()).toEqual(new Vector3(0, 0, 0).toString());
        expect(Vector3.one.toString()).toEqual(new Vector3(1, 1, 1).toString());
        expect(Vector3.up.toString()).toEqual(new Vector3(0, 1, 0).toString());
        expect(Vector3.down.toString()).toEqual(new Vector3(0, -1, 0).toString());
        expect(Vector3.left.toString()).toEqual(new Vector3(-1, 0, 0).toString());
        expect(Vector3.right.toString()).toEqual(new Vector3(1, 0, 0).toString());
        expect(Vector3.forward.toString()).toEqual(new Vector3(0, 0, -1).toString());
        expect(Vector3.back.toString()).toEqual(new Vector3(0, 0, 1).toString());
    });

    test('static constants exist and have correct values', () => {
        expect(Vector3.ZERO.toString()).toEqual(new Vector3(0, 0, 0).toString());
        expect(Vector3.ONE.toString()).toEqual(new Vector3(1, 1, 1).toString());
        expect(Vector3.UP.toString()).toEqual(new Vector3(0, 1, 0).toString());
        expect(Vector3.DOWN.toString()).toEqual(new Vector3(0, -1, 0).toString());
        expect(Vector3.LEFT.toString()).toEqual(new Vector3(-1, 0, 0).toString());
        expect(Vector3.RIGHT.toString()).toEqual(new Vector3(1, 0, 0).toString());
        expect(Vector3.FORWARD.toString()).toEqual(new Vector3(0, 0, -1).toString());
        expect(Vector3.BACK.toString()).toEqual(new Vector3(0, 0, 1).toString());
    });

    test('constructor initializes with default values', () => {
        const v = new Vector3();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
        expect(v.isVector3).toBe(true);
        expect(v.length).toBe(3);
    });

    test('constructor initializes with provided values', () => {
        const v = new Vector3(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    test('lock() prevents value changes', () => {
        const v = new Vector3();
        v.lock();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    test('unlock() allows value changes', () => {
        const v = new Vector3();
        v.lock();
        v.x = 1;
        v.unlock();
        v.x = 2;
        expect(v.x).toBe(2);
    });

    test('add() adds vectors correctly when unlocked', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(2, 3, 4);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
        expect(v1.z).toBe(7);
    });

    test('addVectors() adds two vectors into this vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(2, 3, 4);
        const result = new Vector3().addVectors(v1, v2);
        expect(result.x).toBe(3);
        expect(result.y).toBe(5);
        expect(result.z).toBe(7);
    });

    test('sub() subtracts vectors correctly when unlocked', () => {
        const v1 = new Vector3(5, 5, 5);
        const v2 = new Vector3(2, 1, 3);
        v1.sub(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
        expect(v1.z).toBe(2);
    });

    test('subVectors() subtracts two vectors into this vector', () => {
        const v1 = new Vector3(5, 5, 5);
        const v2 = new Vector3(2, 1, 3);
        const result = new Vector3().subVectors(v1, v2);
        expect(result.x).toBe(3);
        expect(result.y).toBe(4);
        expect(result.z).toBe(2);
    });

    test('multiply() multiplies vectors correctly when unlocked', () => {
        const v1 = new Vector3(2, 3, 4);
        const v2 = new Vector3(2, 2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
        expect(v1.z).toBe(8);
    });

    test('multiplyVectors() multiplies two vectors into this vector', () => {
        const v1 = new Vector3(2, 3, 4);
        const v2 = new Vector3(2, 2, 2);
        const result = new Vector3().multiplyVectors(v1, v2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
        expect(result.z).toBe(8);
    });

    test('scale() scales vector by number', () => {
        const v = new Vector3(1, 2, 3);
        v.scale(2);
        expect(v.x).toBe(2);
        expect(v.y).toBe(4);
        expect(v.z).toBe(6);
    });

    test('scale() scales vector by Vector3', () => {
        const v = new Vector3(1, 2, 3);
        v.scale(new Vector3(2, 3, 4));
        expect(v.x).toBe(2);
        expect(v.y).toBe(6);
        expect(v.z).toBe(12);
    });

    test('cross() computes cross product correctly when unlocked', () => {
        const v1 = new Vector3(1, 0, 0);
        const v2 = new Vector3(0, 1, 0);
        v1.cross(v2);
        expect(v1.x).toBe(0);
        expect(v1.y).toBe(0);
        expect(v1.z).toBe(1);
    });

    test('dot() computes dot product correctly', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = v1.dot(v2);
        expect(result).toBe(32);
    });

    test('clamp() clamps vector components between min and max', () => {
        const v = new Vector3(0, 5, -1);
        const min = new Vector3(-0.5, 0, 0);
        const max = new Vector3(0.5, 1, 1);
        v.clamp(min, max);
        expect(v.x).toBe(0);
        expect(v.y).toBe(1);
        expect(v.z).toBe(0);
    });

    test('distanceTo() calculates distance correctly', () => {
        const v1 = new Vector3(1, 1, 1);
        const v2 = new Vector3(4, 5, 1);
        expect(v1.distanceTo(v2)).toBe(5);
    });

    test('applyMatrix4() transforms vector correctly', () => {
        const v = new Vector3(1, 2, 3);
        const m = new Matrix4().set([
            2, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 2, 0,
            1, 2, 3, 1
        ]);
        v.applyMatrix4(m);
        expect(v.x).toBe(3);
        expect(v.y).toBe(6);
        expect(v.z).toBe(9);
    });

    test('setFromMatrixColumn() sets vector from matrix column', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixColumn(m, 1);
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
        expect(v.z).toBe(7);
    });

    test('setFromMatrixPosition() sets vector from matrix position', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixPosition(m);
        expect(v.x).toBe(13);
        expect(v.y).toBe(14);
        expect(v.z).toBe(15);
    });

    test('setXYZ() sets vector components', () => {
        const v = new Vector3();
        v.setXYZ(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    test('normalize() normalizes vector', () => {
        const v = new Vector3(3, 0, 0);
        v.normalize();
        expect(v.x).toBe(1);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    test('normalize() handles zero vector', () => {
        const v = new Vector3(0, 0, 0);
        v.normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    test('locked vector ignores all modifications', () => {
        const v = new Vector3(1, 1, 1).lock();
        
        // Test various operations on a locked vector
        v.add(new Vector3(1, 1, 1));
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.sub(new Vector3(1, 1, 1));
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.multiply(new Vector3(2, 2, 2));
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.scale(2);
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.cross(new Vector3(0, 1, 0));
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.setXYZ(5, 5, 5);
        expect(v.x).toBe(1);
        expect(v.y).toBe(1);
        expect(v.z).toBe(1);
    
        v.unlock(); // Unlock the vector and test again
        v.setXYZ(5, 5, 5);
        expect(v.x).toBe(5);
        expect(v.y).toBe(5);
        expect(v.z).toBe(5);
    });
    
    test('clone() creates an identical but separate vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1); // Ensure it's a separate instance
    });
    
    test('copy() copies values from another vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1); // Ensure it's a separate instance
    });
    
    test('length() calculates the correct magnitude', () => {
        const v = new Vector3(3, 4, 0);
        expect(v.magnitude()).toBe(5); // Pythagorean theorem
    });
    
    test('lerp() interpolates between two vectors', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 0.5);
        expect(result.x).toBe(5);
        expect(result.y).toBe(5);
        expect(result.z).toBe(5);
    });

    test('lerp() returns first vector when t = 0', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 0);
        expect(result.x).toBe(v1.x);
        expect(result.y).toBe(v1.y);
        expect(result.z).toBe(v1.z);
    });

    test('lerp() returns second vector when t = 1', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 1);
        expect(result.x).toBe(v2.x);
        expect(result.y).toBe(v2.y);
        expect(result.z).toBe(v2.z);
    });

    test('normalize() normalizes vector', () => {
        const v = new Vector3(3, 4, 0);
        v.normalize();
        expect(v.x).toBeCloseTo(0.6);
        expect(v.y).toBeCloseTo(0.8);
        expect(v.z).toBe(0);
    });

    test('normalize() returns vector unchanged if magnitude is zero', () => {
        const v = new Vector3(0, 0, 0);
        v.normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    test('should correctly divide components by another vector', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(2, 3, 4);
        v1.divide(v2);
        expect(v1[0]).toBe(3);
        expect(v1[1]).toBe(3);
        expect(v1[2]).toBe(3);
    });

    test('should not modify the vector if it is locked', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(2, 3, 4);
        v1.locked = true;
        v1.divide(v2);
        expect(v1[0]).toBe(6);
        expect(v1[1]).toBe(9);
        expect(v1[2]).toBe(12);
    });

    test('should handle division by zero', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(2, 0, 4); // Zero in the second component
        expect(() => v1.divide(v2)).toThrow('Division by zero');
    });

    test('should remain unchanged when dividing by a vector of ones', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(1, 1, 1);
        v1.divide(v2);
        expect(v1[0]).toBe(6);
        expect(v1[1]).toBe(9);
        expect(v1[2]).toBe(12);
    });

    test('setFromMatrixColumn() sets vector from matrix column', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixColumn(m, 1);
        expect(v.toString()).toEqual(new Vector3(5, 6, 7).toString());
    });

    test('setFromMatrixPosition() sets vector from matrix position', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixPosition(m);
        expect(v.toString()).toEqual(new Vector3(13, 14, 15).toString());
    });

    test('setFromMatrixColumn() should throw error for invalid index', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3();

        expect(() => v.setFromMatrixColumn(m, -1)).toThrowError('Index out of bounds');
        expect(() => v.setFromMatrixColumn(m, 4)).toThrowError('Index out of bounds');
    });

    test('setFromMatrixColumn() should not modify vector if locked', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().lock();

        // Attempt to set vector from matrix column
        v.setFromMatrixColumn(m, 1);
        
        // The vector should remain unchanged due to locking
        expect(v.toString()).toEqual(new Vector3(0, 0, 0).toString());  // Assuming default initialization
    });

    test('setFromMatrixColumn() should correctly set vector from matrix column when unlocked', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3();

        v.setFromMatrixColumn(m, 1);
        expect(v.toString()).toEqual(new Vector3(5, 6, 7).toString());
    });

    test('setFromMatrixPosition() should not modify vector if locked', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().lock();

        // Attempt to set vector from matrix position
        v.setFromMatrixPosition(m);
        
        // The vector should remain unchanged due to locking
        expect(v.toString()).toEqual(new Vector3(0, 0, 0).toString());  // Assuming default initialization
    });

    test('setFromMatrixPosition() should correctly set vector from matrix position when unlocked', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3();

        v.setFromMatrixPosition(m);
        expect(v.toString()).toEqual(new Vector3(13, 14, 15).toString());
    });

});