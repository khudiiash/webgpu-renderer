import { describe, it, expect } from 'vitest'
import { Euler } from '../../src/math/Euler'
import { Quaternion } from '../../src/math/Quaternion'
import { Vector3 } from '../../src/math/Vector3'
import { Matrix4 } from '../../src/math/Matrix4'

describe('Euler', () => {
    it('creates with default values', () => {
        const e = new Euler()
        expect(e.x).toBe(0)
        expect(e.y).toBe(0)
        expect(e.z).toBe(0)
        expect(e.order).toBe(Euler.XYZ)
    })

    it('sets/get x, y, z, and order', () => {
        const e = new Euler()
        e.x = 1
        e.y = 2
        e.z = 3
        e.order = 'ZYX'
        expect(e.x).toBe(1)
        expect(e.y).toBe(2)
        expect(e.z).toBe(3)
        expect(e.order).toBe(Euler.ZYX)
    })

    it('sets from Vector3', () => {
        const e = new Euler()
        const v = new Vector3(0.5, 1, 1.5)
        e.setFromVector3(v, 'YZX')
        expect(e.x).toBeCloseTo(0.5)
        expect(e.y).toBeCloseTo(1)
        expect(e.z).toBeCloseTo(1.5)
        expect(e.order).toBe(Euler.YZX)
    })

    it('reorders Euler angles', () => {
        const e = new Euler(1, 2, 3, 'XYZ')
        e.reorder('ZXY')
        expect(e.order).toBe(Euler.ZXY)
    })

    it('sets from Quaternion', () => {
        const q = new Quaternion()
        q.set([0, 0.707, 0, 0.707]) // 90 deg around Y
        const e = new Euler()
        e.setFromQuaternion(q, 'YXZ')
        expect(e.order).toBe(Euler.YXZ)
        // Approx 0, 1.57, 0
        expect(e.x).toBeCloseTo(0)
        expect(Math.abs(e.y)).toBeCloseTo(Math.PI / 2)
        expect(e.z).toBeCloseTo(0)
    })

    it('sets from RotationMatrix', () => {
        const m = new Matrix4()
        m.rotateX(Math.PI / 2);
        const e = new Euler()
        e.setFromRotationMatrix(m, 'XYZ')
        expect(e.x).toBeCloseTo(Math.PI / 2)
        expect(e.y).toBeCloseTo(0)
        expect(e.z).toBeCloseTo(0)
    })

    it('gets correct order number with __getOrderNum', () => {
        const e = new Euler();

        // Valid order strings
        expect(e['__getOrderNum']('XYZ')).toBe(0);
        expect(e['__getOrderNum']('YZX')).toBe(1);
        expect(e['__getOrderNum']('ZXY')).toBe(2);
        expect(e['__getOrderNum']('XZY')).toBe(3);
        expect(e['__getOrderNum']('YXZ')).toBe(4);
        expect(e['__getOrderNum']('ZYX')).toBe(5);

        // Null and undefined input
        expect(e['__getOrderNum'](null as any)).toBe(Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER));
        expect(e['__getOrderNum'](undefined as any)).toBe(Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER));

        // Input as numbers
        expect(e['__getOrderNum'](3)).toBe(3);

        // Non-string and       expect(e['__getOrderNum']({} as any)).toBe(Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER));
        expect(e['__getOrderNum']([] as any)).toBe(Euler.ORDERS.indexOf(Euler.DEFAULT_ORDER));
    })

    it('handles order XYZ - if branch', () => {
        const matrix = new Matrix4().rotateX(Math.PI / 4).rotateY(Math.PI / 4);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.XYZ);
        expect(euler.x).toBeCloseTo(Math.PI / 4);
        expect(euler.y).toBeCloseTo(Math.PI / 4);
        expect(euler.z).toBeCloseTo(0);
        expect(euler.order).toBe(Euler.XYZ);
    });

    it('handles XYZ order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m13 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateY(Math.PI / 2)  // This causes m13 to be ±1
            .rotateZ(Math.PI / 2); // Additional rotation
    
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.XYZ);
    
        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(Math.PI / 2);  // This comes from atan2(m32, m22)
        expect(euler.y).toBeCloseTo(Math.PI / 2);  // This is the asin(clamp(m13, -1, 1)) result
        expect(euler.z).toBeCloseTo(0);  // This should be zero as per the else branch
    });

    it('handles order YXZ - if branch', () => {
        const matrix = new Matrix4().rotateY(Math.PI / 4).rotateX(Math.PI / 6);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.YXZ);
        expect(euler.x).toBeCloseTo(Math.PI / 6);
        expect(euler.y).toBeCloseTo(Math.PI / 4);
        expect(euler.z).toBeCloseTo(0);
        expect(euler.order).toBe(Euler.YXZ);
    });

    it('handles YXZ order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m23 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateY(Math.PI / 2)  // This causes m23 to be ±1
            .rotateX(Math.PI / 2); // Additional rotation
    
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.YXZ);
    
        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(Math.PI / 2);  // This comes from atan2(m13, m33)
        expect(euler.y).toBeCloseTo(Math.PI / 2);  // This is the asin(clamp(m23, -1, 1)) result
        expect(euler.z).toBeCloseTo(0);  // This should be zero as per the else branch
    });

    it('handles order ZXY - if branch', () => {
        const matrix = new Matrix4().rotateZ(Math.PI / 4).rotateX(Math.PI / 6);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.ZXY);
        expect(euler.x).toBeCloseTo(Math.PI / 6);
        expect(euler.y).toBeCloseTo(0);
        expect(euler.z).toBeCloseTo(Math.PI / 4);
        expect(euler.order).toBe(Euler.ZXY);
    });

    it('handles ZXY order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m32 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateZ(Math.PI / 2)  // This causes m32 to be ±1
            .rotateX(Math.PI / 2); // Additional rotation

        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.ZXY);

        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(Math.PI / 2);  // This comes from atan2(-m31, m33)
        expect(euler.y).toBeCloseTo(0);  // This should be zero due to gimbal lock
        expect(euler.z).toBeCloseTo(Math.PI / 2);  // This comes from atan2(-m12, m22)
    });

    it('handles order ZYX - if branch', () => {
        const matrix = new Matrix4().rotateZ(Math.PI / 4).rotateY(Math.PI / 6);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.ZYX);
        expect(euler.x).toBeCloseTo(0);
        expect(euler.y).toBeCloseTo(Math.PI / 6);
        expect(euler.z).toBeCloseTo(Math.PI / 4);
        expect(euler.order).toBe(Euler.ZYX);
    });

    it('handles ZYX order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m31 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateZ(Math.PI / 2)  // This causes m31 to be ±1
            .rotateY(Math.PI / 2); // Additional rotation
    
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.ZYX);
    
        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(0);  // This comes from atan2(m32, m33)
        expect(euler.y).toBeCloseTo(Math.PI / 2);  // This is the asin(clamp(m31, -1, 1)) result
        expect(euler.z).toBeCloseTo(Math.PI / 2);  // This comes from atan2(m21, m11)
    });

    it('handles order YZX - if branch', () => {
        const matrix = new Matrix4().rotateY(Math.PI / 4).rotateZ(Math.PI / 6);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.YZX);
        expect(euler.x).toBeCloseTo(0);
        expect(euler.y).toBeCloseTo(Math.PI / 4);
        expect(euler.z).toBeCloseTo(Math.PI / 6);
        expect(euler.order).toBe(Euler.YZX);
    });

    it('handles YZX order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m21 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateY(Math.PI / 2)  // This causes m21 to be ±1
            .rotateZ(Math.PI / 2); // Additional rotation
    
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.YZX);
    
        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(0);  // This should be zero
        expect(euler.y).toBeCloseTo(Math.PI / 2);  // This comes from atan2(-m23, m22)
        expect(euler.z).toBeCloseTo(Math.PI / 2);  // This comes from atan2(-m31, m11)
    });

    it('handles order XZY - if branch', () => {
        const matrix = new Matrix4().rotateX(Math.PI / 4).rotateZ(Math.PI / 6);
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.XZY);
        expect(euler.x).toBeCloseTo(Math.PI / 4);
        expect(euler.y).toBeCloseTo(0);
        expect(euler.z).toBeCloseTo(Math.PI / 6);
        expect(euler.order).toBe(Euler.XZY);
    });

    it('handles XZY order - else branch (gimbal lock)', () => {
        // Create a matrix with a large value in m12 (simulating a gimbal lock condition)
        const matrix = new Matrix4()
            .rotateX(Math.PI / 2)  // This causes m12 to be ±1
            .rotateZ(Math.PI / 2); // Additional rotation
    
        const euler = new Euler();
        euler.setFromRotationMatrix(matrix, Euler.XZY);
    
        // Check the values to ensure the else branch is correctly executed
        expect(euler.x).toBeCloseTo(Math.PI / 2);  // This comes from atan2(m32, m22)
        expect(euler.y).toBeCloseTo(0);  // This should be zero
        expect(euler.z).toBeCloseTo(Math.PI / 2);  // This comes from atan2(m13, m11)
    });
    
    it('does not modify Euler angles for unknown order', () => {
        // Create a matrix and Euler object
        const matrix = new Matrix4().rotateX(Math.PI / 4).rotateY(Math.PI / 4);
        const euler = new Euler();
    
        // Save the initial values of euler angles
        const initialX = euler.x;
        const initialY = euler.y;
        const initialZ = euler.z;
    
        // Call setFromRotationMatrix with an unknown order
        // @ts-ignore
        euler.setFromRotationMatrix(matrix, 'INVALID_ORDER');
    
        // Check that the Euler angles have not been modified
        expect(euler.x).toBe(initialX);
        expect(euler.y).toBe(initialY);
        expect(euler.z).toBe(initialZ);
    });

    describe('Euler string methods', () => {
        const RAD2DEG = 180 / Math.PI;
        let euler: Euler;
    
        describe('toString', () => {
            it('should format zero values correctly', () => {
                euler = new Euler(0, 0, 0, 'XYZ');
                const result = euler.toString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(0);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(0);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(0);
                expect(result[3]).toBe('ORDER XYZ }');
            });
    
            it('should format non-zero values correctly', () => {
                euler = new Euler(Math.PI/2, Math.PI/4, Math.PI/6, 'XYZ');
                const result = euler.toString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(Math.PI/2);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(Math.PI/4);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(Math.PI/6);
                expect(result[3]).toBe('ORDER XYZ }');
            });
    
            it('should format negative values correctly', () => {
                euler = new Euler(-Math.PI/2, -Math.PI/4, -Math.PI/6, 'XYZ');
                const result = euler.toString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(-Math.PI/2);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(-Math.PI/4);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(-Math.PI/6);
                expect(result[3]).toBe('ORDER XYZ }');
            });
    
            it('should handle different rotation order', () => {
                euler = new Euler(0, 0, 0, 'ZYX');
                const result = euler.toString().split('\n');
                expect(result[3]).toBe('ORDER ZYX }');
            });
        });
    
        describe('toDegString', () => {
            it('should format zero angles correctly', () => {
                euler = new Euler(0, 0, 0, 'XYZ');
                const result = euler.toDegString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(0);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(0);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(0);
                expect(result[3]).toBe('ORDER XYZ');
            });
    
            it('should format common angles correctly', () => {
                euler = new Euler(Math.PI/2, Math.PI/4, Math.PI/6, 'XYZ');
                const result = euler.toDegString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(90);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(45);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(30);
                expect(result[3]).toBe('ORDER XYZ');
            });
    
            it('should format negative angles correctly', () => {
                euler = new Euler(-Math.PI/2, -Math.PI/4, -Math.PI/6, 'XYZ');
                const result = euler.toDegString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(-90);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(-45);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(-30);
                expect(result[3]).toBe('ORDER XYZ');
            });
    
            it('should handle arbitrary angles correctly', () => {
                const x = 0.123, y = 0.456, z = 0.789;
                euler = new Euler(x, y, z, 'XYZ');
                const result = euler.toDegString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(x * RAD2DEG);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(y * RAD2DEG);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(z * RAD2DEG);
                expect(result[3]).toBe('ORDER XYZ');
            });
    
            it('should handle different rotation order', () => {
                euler = new Euler(Math.PI, Math.PI/2, Math.PI/3, 'ZYX');
                const result = euler.toDegString().split('\n');
                expect(parseFloat(result[0].split(' ')[1])).toBeCloseTo(180);
                expect(parseFloat(result[1].split(' ')[1])).toBeCloseTo(90);
                expect(parseFloat(result[2].split(' ')[1])).toBeCloseTo(60);
                expect(result[3]).toBe('ORDER ZYX');
            });
        });
    });
})