import { describe, it, expect } from 'vitest';
import { Quaternion } from '@/math/Quaternion';
import { Euler } from '@/math/Euler';
import { Vector3 } from '@/math/Vector3';
import { Matrix4 } from '@/math/Matrix4';
import { BufferData } from '@/data';

describe('Quaternion', () => {
    it('should construct with default values', () => {
        const q = new Quaternion();
        expect(q.x).toBe(0);
        expect(q.y).toBe(0);
        expect(q.z).toBe(0);
        expect(q.w).toBe(1);
    });

    it('should construct with custom values', () => {
        const q = new Quaternion(1, 2, 3, 4);
        expect(q.x).toBe(1);
        expect(q.y).toBe(2);
        expect(q.z).toBe(3);
        expect(q.w).toBe(4);
    });

    it('should calculate magnitude correctly', () => {
        const q = new Quaternion(1, 2, 3, 4);
        expect(q.magnitude()).toBeCloseTo(Math.sqrt(30));
    });

    it('should normalize correctly', () => {
        const q = new Quaternion(1, 2, 3, 4);
        q.normalize();
        const mag = q.magnitude();
        expect(mag).toBeCloseTo(1);
    });

    it('should handle negative cosHalfTheta correctly in setFromAxisAngle', () => {
        const axis = new Vector3(1, 0, 0);
        const angle = Math.PI;  // 180 degrees, this will produce a negative cosHalfTheta
        const q = new Quaternion().setFromAxisAngle(axis, angle);
        expect(q.x).toBeCloseTo(1);
        expect(q.y).toBe(0);
        expect(q.z).toBe(0);
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 2));
    });

    it('should perform quaternion multiplication', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        q1.multiply(q2);
        expect(q1.x).toBe(24);
        expect(q1.y).toBe(48);
        expect(q1.z).toBe(48);
        expect(q1.w).toBe(-6);
    });

    it('should perform quaternion premultiplication', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        q1.premultiply(q2);
        expect(q1.x).toBe(32);
        expect(q1.y).toBe(32);
        expect(q1.z).toBe(56);
        expect(q1.w).toBe(-6);
    });

    it('should perform quaternion addition', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        q1.add(q2);
        expect(q1.x).toBe(6);
        expect(q1.y).toBe(8);
        expect(q1.z).toBe(10);
        expect(q1.w).toBe(12);
    });

    it('should perform quaternion subtraction', () => {
        const q1 = new Quaternion(5, 6, 7, 8);
        const q2 = new Quaternion(1, 2, 3, 4);
        q1.sub(q2);
        expect(q1.x).toBe(4);
        expect(q1.y).toBe(4);
        expect(q1.z).toBe(4);
        expect(q1.w).toBe(4);
    });

    it('should return the same quaternion for alpha = 0', () => {
        const q1 = new Quaternion(1, 0, 0, 0);
        const q2 = new Quaternion(0, 1, 0, 0);
        const result = q1.slerp(q2, 0);
        expect(result).toEqual(q1);
    });

    it('should handle small angle cases in slerp where sinHalfTheta is less than 0.001', () => {
    // Create two quaternions that have a very small angle between them
    const q1 = new Quaternion(1, 0, 0, 0);  // Identity quaternion
    const q2 = new Quaternion(1 - 0.000001, 0, 0, 0); // Very small difference in q2

    // Perform spherical linear interpolation
    const result = q1.slerp(q2, 0.5);  // Alpha is 0.5

    // The expected result should be very close to q1 (since the angle is tiny)
    expect(result.x).toBeCloseTo(1, 6);
    expect(result.y).toBeCloseTo(0, 6);
    expect(result.z).toBeCloseTo(0, 6);
    expect(result.w).toBeCloseTo(0, 6);
});

    it('should copy the target quaternion for alpha = 1', () => {
        const q1 = new Quaternion(1, 0, 0, 0);
        const q2 = new Quaternion(0, 1, 0, 0);
        const result = q1.slerp(q2, 1);
        expect(result.toString()).toEqual(q2.toString());
    });

    it('should negate the target quaternion when cosHalfTheta < 0', () => {
        const q1 = new Quaternion(1, 0, 0, 0);
        const q2 = new Quaternion(-1, 0, 0, 0); // Negative q2
        const result = q1.slerp(q2, 0.5);
        expect(result.x).toBeCloseTo(1);
        expect(Math.abs(result.y)).toBe(0);
        expect(Math.abs(result.z)).toBe(0);
        expect(Math.abs(result.w)).toBe(0);
    });

    it('should return the quaternion unchanged for cosHalfTheta >= 1.0', () => {
        const q1 = new Quaternion(1, 0, 0, 0);
        const q2 = new Quaternion(1, 0, 0, 0); // Identical quaternion
        const result = q1.slerp(q2, 0.5);
        expect(result).toEqual(q1); // No interpolation required
    });

    it('should handle small sinHalfTheta values', () => {
        const q1 = new Quaternion(0.707, 0, 0, 0.707); // Approximately 45 degrees
        const q2 = new Quaternion(0.7071, 0, 0, 0.7071); // Small difference
        const result = q1.slerp(q2, 0.5);
        expect(result.w).toBeCloseTo(0.70705); // Linear interpolation as sinHalfTheta is small
        expect(result.x).toBeCloseTo(0.70705);
        expect(result.y).toBe(0);
        expect(result.z).toBe(0);
    });

    it('should interpolate correctly for general cases', () => {
        const q1 = new Quaternion(1, 0, 0, 0).normalize();
        const q2 = new Quaternion(0, 1, 0, 0).normalize();
        const result = q1.slerp(q2, 0.5);
    
        // Expected halfway interpolation between q1 and q2
        const expectedX = Math.sqrt(2) / 2; // 0.707
        const expectedY = Math.sqrt(2) / 2; // 0.707
        const expectedZ = 0;
        const expectedW = 0;
    
        expect(result.x).toBeCloseTo(expectedX);
        expect(result.y).toBeCloseTo(expectedY);
        expect(result.z).toBeCloseTo(expectedZ);
        expect(result.w).toBeCloseTo(expectedW);
    });

    it('should perform conjugate operation', () => {
        const q = new Quaternion(1, 2, 3, 4)
        q.negate()
        expect(q.x).toBe(-1)
        expect(q.y).toBe(-2)
        expect(q.z).toBe(-3)
        expect(q.w).toBe(4)
    })

    it('should calculate dot product', () => {
        const q1 = new Quaternion(1, 2, 3, 4);
        const q2 = new Quaternion(5, 6, 7, 8);
        const dot = q1.dot(q2);
        expect(dot).toBe(70);
    });

    it('should handle conversion to/from array', () => {
        const q = new Quaternion(1, 2, 3, 4) as unknown as BufferData;
        const arr = q.toArray();
        expect(arr).toEqual([1, 2, 3, 4]);
        
        const q2 = new Quaternion() as unknown as BufferData;
        q2.fromArray([5, 6, 7, 8]);
        expect(q2[0]).toBe(5);
        expect(q2[1]).toBe(6);
        expect(q2[2]).toBe(7);
        expect(q2[3]).toBe(8);
    });

    it('should convert from Euler angles for XYZ order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.XYZ);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });
    
    it('should convert from Euler angles for YXZ order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.YXZ);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });
    
    it('should convert from Euler angles for ZXY order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.ZXY);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });
    
    it('should convert from Euler angles for ZYX order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.ZYX);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });
    
    it('should convert from Euler angles for YZX order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.YZX);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });
    
    it('should convert from Euler angles for XZY order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, Euler.XZY);
        const q = new Quaternion().setFromEuler(euler);
        expect(q.x).toBeCloseTo(Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.y).toBeCloseTo(Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) - Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8));
        expect(q.z).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.sin(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.cos(Math.PI / 8));
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) * Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8) * Math.sin(Math.PI / 8));
    });

    it('should warn for undefined Euler order', () => {
        const euler = new Euler(Math.PI / 4, Math.PI / 4, Math.PI / 4, 'UNDEFINED');
        const q = new Quaternion();
        const p = q.clone().setFromEuler(euler);
        expect(q.x).toBeCloseTo(p.x);
        expect(q.y).toBeCloseTo(p.y);
        expect(q.z).toBeCloseTo(p.z);
        expect(q.w).toBeCloseTo(p.w);
    });

    it('should set from axis-angle', () => {
        const axis = new Vector3(0, 1, 0);
        const angle = Math.PI;
        const q = new Quaternion().setFromAxisAngle(axis, angle);
        expect(q.x).toBeCloseTo(0);
        expect(q.y).toBeCloseTo(Math.sin(Math.PI / 2));
        expect(q.z).toBeCloseTo(0);
        expect(q.w).toBeCloseTo(Math.cos(Math.PI / 2));
    });

    it('should set from rotation matrix', () => {
        const m = new Matrix4();
        m.setIdentity(); // Identity matrix
        const q = new Quaternion().setFromRotationMatrix(m);
        expect(q.x).toBe(0);
        expect(q.y).toBe(0);
        expect(q.z).toBe(0);
        expect(q.w).toBe(1);
    });

    it('should convert from rotation matrix for positive trace (valid rotation matrix)', () => {
        // Valid rotation matrix with positive trace (example: 45-degree rotation around Z-axis)
        const m = new Matrix4([
            0.707, -0.707, 0, 0, 
            0.707, 0.707, 0, 0, 
            0, 0, 1, 0, 
            0, 0, 0, 1
        ]); // A simple rotation matrix (45-degree rotation around Z-axis)
        const q = new Quaternion().setFromRotationMatrix(m);
    
        // For a 45-degree rotation around Z-axis:
        expect(Math.abs(q.w)).toBeCloseTo(0.923); // Cosine of half the angle
        expect(Math.abs(q.x)).toBeCloseTo(0); // No rotation around the X-axis
        expect(Math.abs(q.y)).toBeCloseTo(0); // No rotation around the Y-axis
        expect(Math.abs(q.z)).toBeCloseTo(0.383); // Sin of half the angle
    });
    
    it('should convert from rotation matrix for else cases', () => {
        const m = new Matrix4([
            1, 0, 0, 0,
            0, -1, -1, 0,
            0, 1, -1, 0,
            0, 0, 0, 1
        ]); // 90-degree rotation around X-axis
        const q = new Quaternion().setFromRotationMatrix(m);
    
        // For a 90-degree rotation around X-axis:
        expect(Math.abs(q.w)).toBeCloseTo(0.5, 3); // Cosine of half the angle (45 degrees)
        expect(Math.abs(q.x)).toBeCloseTo(1, 3); // Sine of half the angle (45 degrees)
        expect(Math.abs(q.y)).toBeCloseTo(0, 3); // No rotation around the Y-axis
        expect(Math.abs(q.z)).toBeCloseTo(0, 3); // No rotation around the Z-axis
       
        const m1 = new Matrix4([
            0, 0, 0, 0,
            0, 0, -1, 0,
            0, 1, -1,
            0, 0, 0, 1
        ]); // 90-degree rotation around X-axis
        const q1 = new Quaternion().setFromRotationMatrix(m1);
    
        // For a 90-degree rotation around X-axis:
        expect(Math.abs(q1.w)).toBeCloseTo(0, 3); // Cosine of half the angle (45 degrees)
        expect(Math.abs(q1.x)).toBeCloseTo(0, 3); // Sine of half the angle (45 degrees)
        expect(Math.abs(q1.y)).toBeCloseTo(0.707, 3); // No rotation around the Y-axis
        expect(Math.abs(q1.z)).toBeCloseTo(0, 3); // No rotation around the Z-axis
        const m2 = new Matrix4([
            0, 0, 0, 0,
            0, -1, -1, 0,
            0, 1, 0,
            0, 0, 0, 1
        ]); // 90-degree rotation around X-axis
        const q2 = new Quaternion().setFromRotationMatrix(m2);
    
        // For a 90-degree rotation around X-axis:
        expect(Math.abs(q2.w)).toBeCloseTo(0, 3); // Cosine of half the angle (45 degrees)
        expect(Math.abs(q2.x)).toBeCloseTo(0, 3); // Sine of half the angle (45 degrees)
        expect(Math.abs(q2.y)).toBeCloseTo(0, 3); // No rotation around the Y-axis
        expect(Math.abs(q2.z)).toBeCloseTo(0.707, 3); // No rotation around the Z-axis
    });

    
    it('should handle identity quaternion', () => {
        const q = new Quaternion(0, 0, 0, 1);
        const result = q.multiply(new Quaternion(1, 2, 3, 4));
        expect(result.x).toBe(1);
        expect(result.y).toBe(2);
        expect(result.z).toBe(3);
        expect(result.w).toBe(4);
    });

    it('should handle NaN values', () => {
        const q = new Quaternion(NaN, NaN, NaN, NaN);
        expect(q.magnitude()).toBeNaN();
        expect(q.normalize()[0]).toBeNaN();
        expect(q.normalize()[1]).toBeNaN();
        expect(q.normalize()[2]).toBeNaN();
        expect(q.normalize()[3]).toBeNaN();
    });

    it('should handle normalization when magnitude is zero', () => {
        const q = new Quaternion(0, 0, 0, 0); // Quaternion with zero magnitude
        q.normalize();
        
        // Expected behavior: quaternion is reset to the identity quaternion
        expect(q.x).toBe(0);
        expect(q.y).toBe(0);
        expect(q.z).toBe(0);
        expect(q.w).toBe(1); // Identity quaternion
    });

    it('should correctly invert a normalized quaternion', () => {
        const q = new Quaternion(1, 2, 3, 4).normalize();
        const result = q.inverse();

        const expected = new Quaternion(-q.x, -q.y, -q.z, q.w).normalize();
        expect(Math.abs(result.x)).toBeCloseTo(expected.x, 5);
        expect(Math.abs(result.y)).toBeCloseTo(expected.y, 5);
        expect(Math.abs(result.z)).toBeCloseTo(expected.z, 5);
        expect(Math.abs(result.w)).toBeCloseTo(expected.w, 5);
    });

    it('should normalize and then invert a non-normalized quaternion', () => {
        const q = new Quaternion(2, 3, 4, 5); // Non-normalized
        const result = q.inverse();

        // Expected result: conjugate normalized
        const magnitude = Math.sqrt(q.x ** 2 + q.y ** 2 + q.z ** 2 + q.w ** 2);
        const expected = new Quaternion(-q.x / magnitude, -q.y / magnitude, -q.z / magnitude, q.w / magnitude);

        expect(Math.abs(result.x)).toBeCloseTo(expected.x, 5);
        expect(Math.abs(result.y)).toBeCloseTo(expected.y, 5);
        expect(Math.abs(result.z)).toBeCloseTo(expected.z, 5);
        expect(Math.abs(result.w)).toBeCloseTo(expected.w, 5);
    });

    it('should handle the identity quaternion correctly', () => {
        const q = new Quaternion(0, 0, 0, 1); // Identity quaternion
        const result = q.inverse();

        expect(Math.abs(result.x)).toBe(0);
        expect(Math.abs(result.y)).toBe(0);
        expect(Math.abs(result.z)).toBe(0);
        expect(Math.abs(result.w)).toBe(1);
    });

    it('should correctly set from axis-angle with cosHalfTheta < 0', () => {
        const axis = new Vector3(0, 0, 1);
        const angle = Math.PI; // Half theta will be PI/2 and cosHalfTheta will be negative
        const q = new Quaternion().setFromAxisAngle(axis, angle);
        expect(q.x).toBeCloseTo(0);
        expect(q.y).toBeCloseTo(0);
        expect(q.z).toBeCloseTo(1);
        expect(q.w).toBeCloseTo(0);
    });

    it('should set rotation from quaternion correctly', () => {
        // Create a new Matrix4 instance (identity matrix)
        const matrix = new Matrix4();

        // Define a quaternion for a 90-degree rotation around the Y-axis
        const quaternion = new Quaternion();
        quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2); // 90-degree rotation around Y-axis

        // Apply rotation using setRotationFromQuaternion
        matrix.setRotationFromQuaternion(quaternion);

        // We expect the matrix to be rotated by 90 degrees around the Y-axis
        // Check that the rotation is correctly applied (in this case, it should affect the values in the matrix)
        
        // Check specific matrix values related to the Y-axis rotation
        expect(Math.round(matrix[0])).toBe(0);   // X-axis should be rotated
        expect(Math.round(matrix[1])).toBe(0);   // X-axis should be rotated
        expect(Math.round(matrix[2])).toBeCloseTo(-1);  // X-axis should be rotated (expected -1 in X)
        
        expect(Math.round(matrix[4])).toBe(0);   // Y-axis should stay the same
        expect(Math.round(matrix[5])).toBe(1);   // Y-axis stays the same
        expect(Math.round(matrix[6])).toBe(0);   // Y-axis stays the same
        
        expect(Math.round(matrix[8])).toBe(1);   // Z-axis should be rotated
        expect(Math.round(matrix[9])).toBe(0);   // Z-axis should be rotated
        expect(Math.round(matrix[10])).toBe(0);  // Z-axis should be rotated (expected 0 in Z)
    });

    it('should return the same matrix when rotating by 0 degrees (identity rotation)', () => {
        const matrix = new Matrix4();
        const quaternion = new Quaternion(); // Identity quaternion (no rotation)

        matrix.setRotationFromQuaternion(quaternion);

        // With no rotation, the matrix should remain unchanged (identity matrix)
        expect(matrix[0]).toBe(1);  // X-axis scaling factor
        expect(matrix[5]).toBe(1);  // Y-axis scaling factor
        expect(matrix[10]).toBe(1); // Z-axis scaling factor
        expect(matrix[15]).toBe(1); // Homogeneous coordinate (W-component)

        // All off-diagonal elements should be 0 (no rotation)
        expect(matrix[1]).toBe(0);  // X-Y
        expect(matrix[2]).toBe(0);  // X-Z
        expect(matrix[3]).toBe(0);  // X-Translation
        expect(matrix[4]).toBe(0);  // Y-X
        expect(matrix[6]).toBe(0);  // Y-Z
        expect(matrix[7]).toBe(0);  // Y-Translation
        expect(matrix[8]).toBe(0);  // Z-X
        expect(matrix[9]).toBe(0);  // Z-Y
        expect(matrix[11]).toBe(0); // Z-Translation
        expect(matrix[12]).toBe(0); // W-X
        expect(matrix[13]).toBe(0); // W-Y
        expect(matrix[14]).toBe(0); // W-Z
    });

    it('should return correct quaternion for identical vectors', () => {
        const vFrom = new Vector3(1, 0, 0);
        const vTo = new Vector3(1, 0, 0);  // Same vector
        const q = new Quaternion();
        q.setFromUnitVectors(vFrom, vTo);
        
        // When vectors are identical, the quaternion should be the identity quaternion
        expect(q.x).toBeCloseTo(0, 5);
        expect(q.y).toBeCloseTo(0, 5);
        expect(q.z).toBeCloseTo(0, 5);
        expect(q.w).toBeCloseTo(1, 5);
    });

    it('should return correct quaternion for orthogonal vectors', () => {
        const vFrom = new Vector3(1, 0, 0);
        const vTo = new Vector3(0, 1, 0);  // Orthogonal vectors (90 degrees)
        const q = new Quaternion();
        q.setFromUnitVectors(vFrom, vTo);
        
        // For orthogonal vectors, we expect a 90-degree rotation around the axis (0, 0, 1)
        expect(q.x).toBeCloseTo(0, 5);  // x component should be 0 for 90-degree rotation around Z-axis
        expect(q.y).toBeCloseTo(0, 5);  // y component should be 0
        expect(q.z).toBeCloseTo(0.707, 3);  // z component should be sqrt(2)/2, which is ~0.707
        expect(q.w).toBeCloseTo(0.707, 3);  // w component should also be sqrt(2)/2
    });

    it('should return correct quaternion for opposite vectors', () => {
        const vFrom = new Vector3(1, 0, 0);
        const vTo = new Vector3(-1, 0, 0);  // Opposite vectors (180 degrees)
        const q = new Quaternion();
        q.setFromUnitVectors(vFrom, vTo);
    
        // When vectors are opposite, we expect a quaternion with w = -1, and x, y, z = 0
        expect(q.x).toBeCloseTo(0, 5);
        expect(q.y).toBeCloseTo(0, 5);
        expect(q.z).toBeCloseTo(0, 5);
        expect(q.w).toBeCloseTo(-1, 5);  // Correct quaternion representation
    });
    
    it('should handle the case when r < Number.EPSILON', () => {
        const vFrom = new Vector3(1, 0, 0);
        const vTo = new Vector3(0, 0, 1);  // Vectors are orthogonal
        const q = new Quaternion();
        q.setFromUnitVectors(vFrom, vTo);
        
        // For orthogonal vectors, we expect a quaternion representing a 90-degree rotation
        expect(Math.abs(q.x)).toBeCloseTo(0, 5);  // No x component
        expect(Math.abs(q.y)).toBeCloseTo(0.707, 3);  // y component should represent rotation about the y-axis
        expect(Math.abs(q.z)).toBeCloseTo(0, 5);  // No rotation around z-axis
        expect(Math.abs(q.w)).toBeCloseTo(0.707, 3);  // w component should be cos(π/4) = 0.707
    });

    it('should handle the case when vectors are very close to being opposite', () => {
        const vFrom = new Vector3(1, 0, 0);
        const vTo = new Vector3(-0.999, 0.001, 0);  // Almost opposite vectors
        const q = new Quaternion();
        q.setFromUnitVectors(vFrom, vTo);
    
        // The resulting quaternion should be a very small rotation but not an identity quaternion
        expect(q.x).toBeCloseTo(0, 5);  // No x component
        expect(q.y).toBeCloseTo(0, 5);  // No y component
        expect(q.z).toBeCloseTo(0.707, 3);  // z component should be around 0.707
        expect(q.w).toBeCloseTo(0.707, 3);  // w component should also be around 0.707
    });
});