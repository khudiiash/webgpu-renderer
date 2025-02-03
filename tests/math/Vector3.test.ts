import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from '@/math/Vector3';
import { Matrix4 } from '@/math/Matrix4';

describe('Vector3', () => {
    it('static properties return correct vectors', () => {
        expect(Vector3.zero.toString()).toEqual(new Vector3(0, 0, 0).toString());
        expect(Vector3.one.toString()).toEqual(new Vector3(1, 1, 1).toString());
        expect(Vector3.up.toString()).toEqual(new Vector3(0, 1, 0).toString());
        expect(Vector3.down.toString()).toEqual(new Vector3(0, -1, 0).toString());
        expect(Vector3.left.toString()).toEqual(new Vector3(-1, 0, 0).toString());
        expect(Vector3.right.toString()).toEqual(new Vector3(1, 0, 0).toString());
        expect(Vector3.forward.toString()).toEqual(new Vector3(0, 0, -1).toString());
        expect(Vector3.back.toString()).toEqual(new Vector3(0, 0, 1).toString());
    });

    it('static constants exist and have correct values', () => {
        expect(Vector3.ZERO.toString()).toEqual(new Vector3(0, 0, 0).toString());
        expect(Vector3.ONE.toString()).toEqual(new Vector3(1, 1, 1).toString());
        expect(Vector3.UP.toString()).toEqual(new Vector3(0, 1, 0).toString());
        expect(Vector3.DOWN.toString()).toEqual(new Vector3(0, -1, 0).toString());
        expect(Vector3.LEFT.toString()).toEqual(new Vector3(-1, 0, 0).toString());
        expect(Vector3.RIGHT.toString()).toEqual(new Vector3(1, 0, 0).toString());
        expect(Vector3.FORWARD.toString()).toEqual(new Vector3(0, 0, -1).toString());
        expect(Vector3.BACK.toString()).toEqual(new Vector3(0, 0, 1).toString());
    });

    it('constructor initializes with default values', () => {
        const v = new Vector3();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
        expect(v.isVector3).toBe(true);
        expect(v.length).toBe(3);
    });

    it('constructor initializes with provided values', () => {
        const v = new Vector3(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    it('constructor initializes with array-like values', () => {
        const v = new Vector3([1, 2, 3]);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    })

    it('constructor initializes with BufferData', () => {
        const v = new Vector3(new Float32Array([1, 2, 3]));
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    })

    it('constructor initializes with BufferData and offset', () => {
        const v = new Vector3(new Float32Array([0, 1, 2, 3]), 1);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    })

    
    it('set values', () => {
        const v = new Vector3();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    it('add() adds vectors correctly when unlocked', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(2, 3, 4);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
        expect(v1.z).toBe(7);
    });

    it('addVectors() adds two vectors into this vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(2, 3, 4);
        const result = new Vector3().addVectors(v1, v2);
        expect(result.x).toBe(3);
        expect(result.y).toBe(5);
        expect(result.z).toBe(7);
    });

    it('sub() subtracts vectors correctly when unlocked', () => {
        const v1 = new Vector3(5, 5, 5);
        const v2 = new Vector3(2, 1, 3);
        v1.sub(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
        expect(v1.z).toBe(2);
    });

    it('subVectors() subtracts two vectors into this vector', () => {
        const v1 = new Vector3(5, 5, 5);
        const v2 = new Vector3(2, 1, 3);
        const result = new Vector3().subVectors(v1, v2);
        expect(result.x).toBe(3);
        expect(result.y).toBe(4);
        expect(result.z).toBe(2);
    });

    it('multiply() multiplies vectors correctly when unlocked', () => {
        const v1 = new Vector3(2, 3, 4);
        const v2 = new Vector3(2, 2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
        expect(v1.z).toBe(8);
    });

    it('multiplyVectors() multiplies two vectors into this vector', () => {
        const v1 = new Vector3(2, 3, 4);
        const v2 = new Vector3(2, 2, 2);
        const result = new Vector3().multiplyVectors(v1, v2);
        expect(result.x).toBe(4);
        expect(result.y).toBe(6);
        expect(result.z).toBe(8);
    });

    it('scale() scales vector by number', () => {
        const v = new Vector3(1, 2, 3);
        v.scale(2);
        expect(v.x).toBe(2);
        expect(v.y).toBe(4);
        expect(v.z).toBe(6);
    });

    it('scale() scales vector by Vector3', () => {
        const v = new Vector3(1, 2, 3);
        v.scale(new Vector3(2, 3, 4));
        expect(v.x).toBe(2);
        expect(v.y).toBe(6);
        expect(v.z).toBe(12);
    });

    it('cross() computes cross product correctly when unlocked', () => {
        const v1 = new Vector3(1, 0, 0);
        const v2 = new Vector3(0, 1, 0);
        v1.cross(v2);
        expect(v1.x).toBe(0);
        expect(v1.y).toBe(0);
        expect(v1.z).toBe(1);
    });

    it('dot() computes dot product correctly', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = v1.dot(v2);
        expect(result).toBe(32);
    });

    it('clamp() clamps vector components between min and max', () => {
        const v = new Vector3(0, 5, -1);
        const min = new Vector3(-0.5, 0, 0);
        const max = new Vector3(0.5, 1, 1);
        v.clamp(min, max);
        expect(v.x).toBe(0);
        expect(v.y).toBe(1);
        expect(v.z).toBe(0);
    });

    it('distanceTo() calculates distance correctly', () => {
        const v1 = new Vector3(1, 1, 1);
        const v2 = new Vector3(4, 5, 1);
        expect(v1.distanceTo(v2)).toBe(5);
    });

    it('applyMatrix4() transforms vector correctly', () => {
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

    it('setFromMatrixColumn() sets vector from matrix column', () => {
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

    it('setFromMatrixPosition() sets vector from matrix position', () => {
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

    it('normalize() normalizes vector', () => {
        const v = new Vector3(3, 0, 0);
        v.normalize();
        expect(v.x).toBe(1);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    it('normalize() handles zero vector', () => {
        const v = new Vector3(0, 0, 0);
        v.normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    it('clone() creates an identical but separate vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1); // Ensure it's a separate instance
    });
    
    it('copy() copies values from another vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1); // Ensure it's a separate instance
    });
    
    it('length() calculates the correct magnitude', () => {
        const v = new Vector3(3, 4, 0);
        expect(v.magnitude()).toBe(5); // Pythagorean theorem
    });
    
    it('lerp() interpolates between two vectors', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 0.5);
        expect(result.x).toBe(5);
        expect(result.y).toBe(5);
        expect(result.z).toBe(5);
    });

    it('lerp() returns first vector when t = 0', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 0);
        expect(result.x).toBe(v1.x);
        expect(result.y).toBe(v1.y);
        expect(result.z).toBe(v1.z);
    });

    it('lerp() returns second vector when t = 1', () => {
        const v1 = new Vector3(0, 0, 0);
        const v2 = new Vector3(10, 10, 10);
        const result = Vector3.lerp(v1, v2, 1);
        expect(result.x).toBe(v2.x);
        expect(result.y).toBe(v2.y);
        expect(result.z).toBe(v2.z);
    });

    it('normalize() normalizes vector', () => {
        const v = new Vector3(3, 4, 0);
        v.normalize();
        expect(v.x).toBeCloseTo(0.6);
        expect(v.y).toBeCloseTo(0.8);
        expect(v.z).toBe(0);
    });

    it('normalize() returns vector unchanged if magnitude is zero', () => {
        const v = new Vector3(0, 0, 0);
        v.normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    it('should correctly divide components by another vector', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(2, 3, 4);
        v1.divide(v2);
        expect(v1[0]).toBe(3);
        expect(v1[1]).toBe(3);
        expect(v1[2]).toBe(3);
    });

    it('should handle division by zero', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(2, 0, 4); // Zero in the second component
        expect(() => v1.divide(v2)).toThrow('Division by zero');
    });

    it('should remain unchanged when dividing by a vector of ones', () => {
        const v1 = new Vector3(6, 9, 12);
        const v2 = new Vector3(1, 1, 1);
        v1.divide(v2);
        expect(v1[0]).toBe(6);
        expect(v1[1]).toBe(9);
        expect(v1[2]).toBe(12);
    });

    it('setFromMatrixColumn() sets vector from matrix column', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixColumn(m, 1);
        expect(v.toString()).toEqual(new Vector3(5, 6, 7).toString());
    });

    it('setFromMatrixPosition() sets vector from matrix position', () => {
        const m = new Matrix4().set([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const v = new Vector3().setFromMatrixPosition(m);
        expect(v.toString()).toEqual(new Vector3(13, 14, 15).toString());
    });

    it('setFromMatrixColumn() should throw error for invalid index', () => {
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


    it('setFromMatrixColumn() should correctly set vector from matrix column when unlocked', () => {
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


    describe('Vector3.setFromSphericalCoords', () => {
        let v: Vector3;
    
        beforeEach(() => {
            v = new Vector3();
        });
    
        it('should set vector from standard spherical coordinates', () => {
            // Test case 1: Standard angles and radius
            v.setFromSphericalCoords(1, Math.PI/2, 0);
            expect(v.x).toBeCloseTo(0);
            expect(v.y).toBeCloseTo(0);
            expect(v.z).toBeCloseTo(1);
    
            // Test case 2: Different radius
            v.setFromSphericalCoords(2, Math.PI/2, Math.PI/2);
            expect(v.x).toBeCloseTo(2);
            expect(v.y).toBeCloseTo(0);
            expect(v.z).toBeCloseTo(0);
    
            // Test case 3: Different phi angle
            v.setFromSphericalCoords(1, Math.PI/4, 0);
            expect(v.x).toBeCloseTo(0);
            expect(v.y).toBeCloseTo(Math.cos(Math.PI/4));
            expect(v.z).toBeCloseTo(Math.sin(Math.PI/4));
        });
    
        it('should handle edge cases', () => {
            // Test case 4: Zero radius
            v.setFromSphericalCoords(0, Math.PI/2, Math.PI/2);
            expect(v.x).toBeCloseTo(0);
            expect(v.y).toBeCloseTo(0);
            expect(v.z).toBeCloseTo(0);
    
            // Test case 5: Full rotation
            v.setFromSphericalCoords(1, Math.PI/2, 2 * Math.PI);
            expect(v.x).toBeCloseTo(0);
            expect(v.y).toBeCloseTo(0);
            expect(v.z).toBeCloseTo(1);
    
            // Test case 6: Negative radius
            v.setFromSphericalCoords(-1, Math.PI/2, 0);
            expect(v.x).toBeCloseTo(0);
            expect(v.y).toBeCloseTo(0);
            expect(v.z).toBeCloseTo(-1);
        });
    
        it('should maintain chainability', () => {
            // Test case 7: Method chaining
            const result = v.setFromSphericalCoords(1, Math.PI/2, 0);
            expect(result).toBe(v);
        });
    });

});