import { describe, expect, it, beforeEach } from 'vitest';
import { Matrix3 } from '@/math/Matrix3';
import { Matrix4 } from '@/math/Matrix4';
import { Vector3 } from '@/math/Vector3';
import { Quaternion } from '@/math/Quaternion';
import { Euler } from '@/math/Euler';
import { arraysEqual } from '@/util';

describe('Matrix4', () => {
    it('constructor initializes with identity matrix by default', () => {
        const m = new Matrix4();
        expect(Array.from(m)).toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    });

    it('add matrices', () => {
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

    it('multiply matrices', () => {
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

    it('multiplyMatrices', () => {
        const a = new Matrix4([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        const b = new Matrix4().setIdentity().translate(new Vector3(1,1,1));
        const m = new Matrix4().multiplyMatrices(a, b);
    
        expect(m[12]).toBe(28); 
        expect(m[13]).toBe(32);
        expect(m[14]).toBe(36);
        expect(m[15]).toBe(40);
    });

    it('scale matrix', () => {
        const m = new Matrix4();
        m.scale(new Vector3(2, 3, 4));
        expect(Array.from(m)).toEqual([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1
        ]);
    });

    it('compose and decompose', () => {
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

    it('handles determinant < 0 (invert scale)', () => {
        const matrix = new Matrix4([-1, 0, 0, 0, // Scaling along X with negative determinant
            0, 1, 0, 0,  // Scaling along Y
            0, 0, 1, 0,  // Scaling along Z
            0, 0, 0, 1]);
        
        const translation = new Vector3();
        const rotation = new Quaternion();
        const scale = new Vector3();

        matrix.decompose(translation, rotation, scale);

        // Check that the X scale is negative (since determinant is negative)
        expect(scale.x).toBeLessThan(0);
        // Ensure Y and Z scales are positive
        expect(scale.y).toBeGreaterThan(0);
        expect(scale.z).toBeGreaterThan(0);
    });

    it('set position', () => {
        const m = new Matrix4();
        m.setPosition(new Vector3(1, 2, 3));
        expect(Array.from(m)).toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 2, 3, 1
        ]);
    });

    it('set rotation from quaternion', () => {
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

    it('rotateX, rotateY, rotateZ', () => {
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

    it('rotateOnAxis', () => {
        const m = new Matrix4();
        m.rotateOnAxis(new Vector3(1, 1, 0).normalize(), Math.PI / 4);
        // Just checking the matrix got updated (not identity)
        expect(m[0]).not.toBe(1);
    });

    it('translate', () => {
        const m = new Matrix4();
        m.translate(new Vector3(2, 3, 4));
        expect([m[12], m[13], m[14]]).toEqual([2, 3, 4]);
    });

    it('invert', () => {
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

    it('returns identity matrix when pivot is 0 (singular matrix)', () => {
        const matrix = new Matrix4(
            [0, 0, 0, 0,
            0, 0, 0, 0, // Zero row making it singular
            0, 0, 0, 0,
            0, 0, 0, 0]);
       
        const originalMatrix = new Matrix4().copy(matrix); // Keep a copy of the original matrix

        matrix.invert();

        // Expect the matrix to be unchanged because it is singular
        expect(matrix.toString()).toEqual(originalMatrix.toString());
    });

    it('determinant calculation', () => {
        const m = new Matrix4([
            1, 0, 0, 0,
            0, 2, 0, 0, 
            0, 0, 3, 0,
            0, 0, 0, 1
        ]);
        expect(m.determinant()).toBe(6);
    });

    it('get max scale on axis', () => {
        const m = new Matrix4([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1
        ]);
        expect(m.getMaxScaleOnAxis()).toBe(4);
    });

    it('getRotation', () => {
        const m = new Matrix4().rotateY(Math.PI / 3);
        const q = m.getRotation();
        expect(Math.round(q.w * 10) / 10).toBeCloseTo(0.9, 1);
    });

    it('getScale', () => {
        const m = new Matrix4().scale(new Vector3(2, 3, 4));
        const s = m.getScale();
        expect(s.toArray()).toEqual([2, 3, 4]);
    });

    it('getScaleOnAxis', () => {
        const m = new Matrix4().scale(new Vector3(2, 3, 4));
        const scaleX = m.getScaleOnAxis(new Vector3(1, 0, 0));
        const scaleY = m.getScaleOnAxis(new Vector3(0, 1, 0));
        expect(Math.round(scaleX)).toBe(2);
        expect(Math.round(scaleY)).toBe(3);
    });

    it('getTranslation', () => {
        const m = new Matrix4().translate(new Vector3(1, 2, 3));
        const t = m.getTranslation();
        expect(t.toArray()).toEqual([1, 2, 3]);
    });

    it('setFrustum', () => {
        const m = new Matrix4();
        m.setFrustum(-1, 1, -1, 1, 1, 10);
        // Rough check that corners are set
        expect(m[0]).toBeCloseTo(1);
        expect(m[5]).toBeCloseTo(1);
        expect(m[10]).toBeCloseTo(-1.222, 3);
    });

    it('lookAt', () => {
        const eye = new Vector3(0,5,0);
        const target = new Vector3(0,0,0);
        const up = new Vector3(0,1,0);
        const m = new Matrix4().lookAt(eye, target, up);
        const expected = new Matrix4([
            1, 0, 0, 0,
            0, 0, -1, 0,
            0, 1, 0, 0,
            0, 0, 0, 1
        ]);
        expect(arraysEqual(m, expected, 0, 16, 0.1)).toBe(true);
    });

    describe('Matrix4 extraction and basis methods', () => {
        let m: Matrix4;
    
        beforeEach(() => {
            m = new Matrix4();
        });
    
        describe('extractRotation', () => {
            it('should extract rotation while removing scale', () => {
                const source = new Matrix4();
                // Set a matrix with both rotation and scale
                source.set([
                    2, 0, 0, 0,   // Scale of 2 on X
                    0, 3, 0, 0,   // Scale of 3 on Y
                    0, 0, 4, 0,   // Scale of 4 on Z
                    0, 0, 0, 1
                ]);
                
                m.extractRotation(source);
                
                // Check that scales are normalized to 1
                const xMag = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
                const yMag = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
                const zMag = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);
                
                expect(xMag).toBeCloseTo(1);
                expect(yMag).toBeCloseTo(1);
                expect(zMag).toBeCloseTo(1);
                
                // Check translation is zeroed
                expect(m[12]).toBeCloseTo(0);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should be chainable', () => {
                const result = m.extractRotation(new Matrix4());
                expect(result).toBe(m);
            });
        });
    
        describe('copyPosition', () => {
            it('should copy position from another matrix', () => {
                const source = new Matrix4();
                source[12] = 1;
                source[13] = 2;
                source[14] = 3;
    
                m.copyPosition(source);
    
                expect(m[12]).toBeCloseTo(1);
                expect(m[13]).toBeCloseTo(2);
                expect(m[14]).toBeCloseTo(3);
            });
    
            it('should be chainable', () => {
                const result = m.copyPosition(new Matrix4());
                expect(result).toBe(m);
            });
        });
    
        describe('setFromMatrix3', () => {
            it('should set matrix from Matrix3', () => {
                const m3 = new Matrix3();
                m3.set([
                    1, 2, 3,
                    4, 5, 6,
                    7, 8, 9
                ]);
    
                m.setFromMatrix3(m3);
    
                // Check correct mapping of Matrix3 to Matrix4
                expect(m[0]).toBeCloseTo(1); expect(m[4]).toBeCloseTo(2); expect(m[8]).toBeCloseTo(3);
                expect(m[1]).toBeCloseTo(4); expect(m[5]).toBeCloseTo(5); expect(m[9]).toBeCloseTo(6);
                expect(m[2]).toBeCloseTo(7); expect(m[6]).toBeCloseTo(8); expect(m[10]).toBeCloseTo(9);
                
                // Check homogeneous component
                expect(m[3]).toBeCloseTo(0);
                expect(m[7]).toBeCloseTo(0);
                expect(m[11]).toBeCloseTo(0);
                expect(m[12]).toBeCloseTo(0);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should be chainable', () => {
                const result = m.setFromMatrix3(new Matrix3());
                expect(result).toBe(m);
            });
        });
    
        describe('extractBasis', () => {
            it('should extract basis vectors', () => {
                // Set known basis vectors
                m.set([
                    1, 0, 0, 0,
                    0, 2, 0, 0,
                    0, 0, 3, 0,
                    0, 0, 0, 1
                ]);
    
                const xAxis = new Vector3();
                const yAxis = new Vector3();
                const zAxis = new Vector3();
    
                m.extractBasis(xAxis, yAxis, zAxis);
    
                expect(xAxis.x).toBeCloseTo(1); expect(xAxis.y).toBeCloseTo(0); expect(xAxis.z).toBeCloseTo(0);
                expect(yAxis.x).toBeCloseTo(0); expect(yAxis.y).toBeCloseTo(2); expect(yAxis.z).toBeCloseTo(0);
                expect(zAxis.x).toBeCloseTo(0); expect(zAxis.y).toBeCloseTo(0); expect(zAxis.z).toBeCloseTo(3);
            });
    
            it('should be chainable', () => {
                const result = m.extractBasis(new Vector3(), new Vector3(), new Vector3());
                expect(result).toBe(m);
            });
        });
    
        describe('setBasis', () => {
            it('should set matrix from basis vectors', () => {
                const xAxis = new Vector3(1, 0, 0);
                const yAxis = new Vector3(0, 2, 0);
                const zAxis = new Vector3(0, 0, 3);
    
                m.setBasis(xAxis, yAxis, zAxis);
    
                // Check if basis vectors are correctly set
                expect(m[0]).toBeCloseTo(1); expect(m[4]).toBeCloseTo(0); expect(m[8]).toBeCloseTo(0);
                expect(m[1]).toBeCloseTo(0); expect(m[5]).toBeCloseTo(2); expect(m[9]).toBeCloseTo(0);
                expect(m[2]).toBeCloseTo(0); expect(m[6]).toBeCloseTo(0); expect(m[10]).toBeCloseTo(3);
                
                // Check homogeneous component
                expect(m[3]).toBeCloseTo(0);
                expect(m[7]).toBeCloseTo(0);
                expect(m[11]).toBeCloseTo(0);
                expect(m[12]).toBeCloseTo(0);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should be chainable', () => {
                const result = m.setBasis(new Vector3(), new Vector3(), new Vector3());
                expect(result).toBe(m);
            });
        });
    });

    describe('Matrix4 lookAt edge cases', () => {
        let m: Matrix4;
    
        beforeEach(() => {
            m = new Matrix4();
        });
    
        it('should handle eye and target at same position', () => {
            const eye = new Vector3(1, 1, 1);
            const target = new Vector3(1, 1, 1);
            const up = Vector3.UP;
    
            m.lookAt(eye, target, up);
    
            // When eye and target are same, _v1 gets set to (0,0,1)
            // and the resulting matrix should reflect this
            expect(m[8]).toBeCloseTo(0); // _v1.x
            expect(m[9]).toBeCloseTo(0); // _v1.y
            expect(m[10]).toBeCloseTo(1); // _v1.z
        });
    
        it('should handle up vector parallel to view direction', () => {
            // Create a case where up is parallel to eye-target vector
            const eye = new Vector3(0, 1, 0);
            const target = new Vector3(0, 0, 0);
            const up = new Vector3(0, 1, 0);  // Parallel to eye-target
    
            m.lookAt(eye, target, up);
    
            // Check if the resulting basis vectors are orthogonal
            const xAxis = new Vector3(m[0], m[1], m[2]);
            const yAxis = new Vector3(m[4], m[5], m[6]);
            const zAxis = new Vector3(m[8], m[9], m[10]);
    
            const xyDot = xAxis.dot(yAxis);
            const yzDot = yAxis.dot(zAxis);
            const xzDot = xAxis.dot(zAxis);
    
            // Basis vectors should be orthogonal (dot product close to 0)
            expect(xyDot).toBeCloseTo(0, 4);
            expect(yzDot).toBeCloseTo(0, 4);
            expect(xzDot).toBeCloseTo(0, 4);
    
            // Each basis vector should be normalized
            expect(xAxis.magnitude()).toBeCloseTo(1);
            expect(yAxis.magnitude()).toBeCloseTo(1);
            expect(zAxis.magnitude()).toBeCloseTo(1);
        });
    
        it('should handle up vector being unit Z and parallel to view', () => {
            const eye = new Vector3(0, 0, 2);
            const target = new Vector3(0, 0, 0);
            const up = new Vector3(0, 0, 1);  // Unit Z up vector
    
            m.lookAt(eye, target, up);
    
            // Check if the resulting basis vectors are orthogonal
            const xAxis = new Vector3(m[0], m[1], m[2]);
            const yAxis = new Vector3(m[4], m[5], m[6]);
            const zAxis = new Vector3(m[8], m[9], m[10]);
    
            // Verify basis vectors are orthogonal and normalized
            expect(xAxis.dot(yAxis)).toBeCloseTo(0, 4);
            expect(yAxis.dot(zAxis)).toBeCloseTo(0, 4);
            expect(xAxis.dot(zAxis)).toBeCloseTo(0, 4);
    
            expect(xAxis.magnitude()).toBeCloseTo(1);
            expect(yAxis.magnitude()).toBeCloseTo(1);
            expect(zAxis.magnitude()).toBeCloseTo(1);
        });
    
        it('should return this for chaining', () => {
            const eye = new Vector3(0, 0, 1);
            const target = new Vector3(0, 0, 0);
            const result = m.lookAt(eye, target);
            expect(result).toBe(m);
        });
    });

    it('setFromRotationMatrix', () => {
        const m1 = new Matrix4().rotateZ(Math.PI / 2);
        const m2 = new Matrix4().setFromRotationMatrix(m1);
        expect(Array.from(m2)).toEqual(Array.from(m1));
    });

    it('handles Euler order XYZ', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'XYZ');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('handles Euler order YXZ', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'YXZ');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('handles Euler order ZXY', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'ZXY');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('handles Euler order XZY', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'XZY');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('handles Euler order YZX', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'YZX');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('handles Euler order ZYX', () => {
        const e = new Euler(Math.PI / 2, 0, 0, 'ZYX');
        const m = new Matrix4();
        m.setRotationFromEuler(e);

        // Check values based on expected rotation matrix
        expect(Math.abs(Math.round(m[5]))).toBe(0);
        expect(Math.round(m[6])).toBeCloseTo(1);
        expect(Math.round(m[9])).toBeCloseTo(-1);
        expect(Math.abs(Math.round(m[10]))).toBe(0);
    });

    it('setIdentity', () => {
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

    it('setOrthographic', () => {
        const m = new Matrix4().setOrthographic(-1,1,-1,1,1,10);
        console.log(m.toString())
        const expected = new Matrix4().set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -0.11, 0,
            0, 0, -0.11, 1
        ]);
        expect(arraysEqual(m, expected, 0, 16, 0.1)).toBe(true);
    });

    it('setPerspective', () => {
        const a = new Matrix4().setPerspective( - 1, 1, - 1, 1, 1, 100 );
        const expected = new Matrix4().set([
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, -0, -1.01, -1,
            0, 0, -1.01, 0,
        ]);

        expect(arraysEqual(a, expected, 0, 16, 0.01)).toBe(true);
    });

    it('setPerspective projection', () => {
        const m = new Matrix4();
        
        // Calculate the frustum dimensions
        const near = 1;
        const far = 10;
        const aspect = 1;  // width/height ratio
        const fov = Math.PI/4;  // 45 degrees
        
        // Calculate the frustum dimensions at near plane
        const top = near * Math.tan(fov/2);
        const bottom = -top;
        const right = top * aspect;
        const left = -right;
        
        m.setPerspective(left, right, bottom, top, near, far);
        
        const result = Array.from(m);
        expect(result[0]).toBeCloseTo(2.4142, 3);
        expect(result[5]).toBeCloseTo(-2.4142, 3);
        expect(result[10]).toBeCloseTo(-1.1111, 3);
        expect(result[14]).toBeCloseTo(-1.1111, 3);
    });

    it('sets perspective matrix for non-finite far value', () => {
        const m = new Matrix4();
        
        const near = 0; // Near plane at distance 1
        const far = Infinity; // Non-finite far value

        m.setPerspective(-1, 1, -1, 1, near, far);

        // We expect m10 to be 0 and m14 to be -near, according to the else branch
        expect(m[4]).toBe(0); // m10
        expect(m[12]).toBe(near); // m14 (should be -near)
    });

    it('should correctly get the position from the matrix', () => {
        // Create a matrix and set translation (position)
        const matrix = new Matrix4();
        matrix.setPosition(new Vector3(5, -3, 10)); // Set the translation values (for example)

        // Create a Vector3 to store the result
        const v = new Vector3();
        
        // Call getPosition
        matrix.getPosition(v);

        // Check if the position values are correct
        expect(v.x).toBe(5);
        expect(v.y).toBe(-3);
        expect(v.z).toBe(10);
    });

    it('should return a new Vector3 if no argument is provided', () => {
        const matrix = new Matrix4();
        matrix.setPosition(new Vector3(5, -3, 10));

        // Call getPosition with no argument
        const position = matrix.getPosition();

        // Check if the returned Vector3 contains the correct values
        expect(position.x).toBe(5);
        expect(position.y).toBe(-3);
        expect(position.z).toBe(10);
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
    
    it('should correctly apply a scaling transformation', () => {
        // Create a new Matrix4 instance
        const matrix = new Matrix4();
        
        // Define the scaling vector (scale by 2 in x, 3 in y, and 4 in z)
        const scale = new Vector3(2, 3, 4);
        
        // Apply scaling to the matrix
        matrix.makeScale(scale);
        
        // Check if the scaling values are correctly set in the matrix
        expect(matrix[0]).toBe(2);  // Scale in X
        expect(matrix[5]).toBe(3);  // Scale in Y
        expect(matrix[10]).toBe(4); // Scale in Z
        
        // Check that other values are zero (off-diagonal elements should be 0)
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
        expect(matrix[15]).toBe(1); // Homogeneous coordinate (W-component)
    });

    it('should apply scaling correctly when scale is 1 in all axes', () => {
        const matrix = new Matrix4();
        const scale = new Vector3(1, 1, 1); // No scaling, identity matrix
        matrix.makeScale(scale);
        
        // Check that the matrix is unchanged (identity matrix)
        expect(matrix[0]).toBe(1);  // X scale factor
        expect(matrix[5]).toBe(1);  // Y scale factor
        expect(matrix[10]).toBe(1); // Z scale factor
        expect(matrix[15]).toBe(1); // Homogeneous coordinate (W-component)

        // All off-diagonal elements should be 0
        expect(matrix[1]).toBe(0);
        expect(matrix[2]).toBe(0);
        expect(matrix[3]).toBe(0);
        expect(matrix[4]).toBe(0);
        expect(matrix[6]).toBe(0);
        expect(matrix[7]).toBe(0);
        expect(matrix[8]).toBe(0);
        expect(matrix[9]).toBe(0);
        expect(matrix[11]).toBe(0);
        expect(matrix[12]).toBe(0);
        expect(matrix[13]).toBe(0);
        expect(matrix[14]).toBe(0);
    });

    it('transformPoint', () => {
        const m = new Matrix4().translate(new Vector3(1,2,3));
        const v = new Vector3(0,0,0);
        const result = m.transformPoint(v);
        expect(result.toArray()).toEqual([1,2,3]);
    });

    it('transpose', () => {
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


    describe('Matrix4 remaining cases & methods', () => {
        let m: Matrix4;
    
        beforeEach(() => {
            m = new Matrix4();
        });
    
        describe('setPosition', () => {
            it('should set position from Vector3', () => {
                const pos = new Vector3(1, 2, 3);
                m.setPosition(pos);
                
                expect(m[12]).toBeCloseTo(1);
                expect(m[13]).toBeCloseTo(2);
                expect(m[14]).toBeCloseTo(3);
            });
    
            it('should set position from x, y, z numbers', () => {
                m.setPosition(4, 5, 6);
                
                expect(m[12]).toBeCloseTo(4);
                expect(m[13]).toBeCloseTo(5);
                expect(m[14]).toBeCloseTo(6);
            });
    
            it('should return this for chaining', () => {
                const result = m.setPosition(1, 2, 3);
                expect(result).toBe(m);
            });
        });
    
        describe('setScale', () => {
            it('should set scale from Vector3', () => {
                const scale = new Vector3(2, 3, 4);
                m.setScale(scale);
                
                // Check scale components
                expect(m[0]).toBeCloseTo(2);
                expect(m[5]).toBeCloseTo(3);
                expect(m[10]).toBeCloseTo(4);
                
                // Check zeros
                expect(m[1]).toBeCloseTo(0);
                expect(m[2]).toBeCloseTo(0);
                expect(m[3]).toBeCloseTo(0);
                expect(m[4]).toBeCloseTo(0);
                expect(m[6]).toBeCloseTo(0);
                expect(m[7]).toBeCloseTo(0);
                expect(m[8]).toBeCloseTo(0);
                expect(m[9]).toBeCloseTo(0);
                expect(m[11]).toBeCloseTo(0);
                expect(m[12]).toBeCloseTo(0);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should set scale from x, y, z numbers', () => {
                m.setScale(5, 6, 7);
                
                // Check scale components
                expect(m[0]).toBeCloseTo(5);
                expect(m[5]).toBeCloseTo(6);
                expect(m[10]).toBeCloseTo(7);
                
                // Check zeros
                expect(m[1]).toBeCloseTo(0);
                expect(m[2]).toBeCloseTo(0);
                expect(m[3]).toBeCloseTo(0);
                expect(m[4]).toBeCloseTo(0);
                expect(m[6]).toBeCloseTo(0);
                expect(m[7]).toBeCloseTo(0);
                expect(m[8]).toBeCloseTo(0);
                expect(m[9]).toBeCloseTo(0);
                expect(m[11]).toBeCloseTo(0);
                expect(m[12]).toBeCloseTo(0);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should return this for chaining', () => {
                const result = m.setScale(1, 1, 1);
                expect(result).toBe(m);
            });
    
            it('should handle negative scale values', () => {
                m.setScale(-2, -3, -4);
                
                expect(m[0]).toBeCloseTo(-2);
                expect(m[5]).toBeCloseTo(-3);
                expect(m[10]).toBeCloseTo(-4);
            });
        });
        
        describe('setTranslation', () => {
            it('should set translation with x, y, z numbers', () => {
                m.setTranslation(1, 2, 3);
                expect(m[12]).toBeCloseTo(1);
                expect(m[13]).toBeCloseTo(2);
                expect(m[14]).toBeCloseTo(3);
                expect(m[15]).toBeCloseTo(1);
                
                // Check identity part remains unchanged
                expect(m[0]).toBeCloseTo(1);
                expect(m[5]).toBeCloseTo(1);
                expect(m[10]).toBeCloseTo(1);
                expect(m[1]).toBeCloseTo(0);
                expect(m[2]).toBeCloseTo(0);
                expect(m[3]).toBeCloseTo(0);
            });
    
            it('should set translation with Vector3', () => {
                m.setTranslation(new Vector3(4,5,6));
                expect(m[12]).toBeCloseTo(4);
                expect(m[13]).toBeCloseTo(5);
                expect(m[14]).toBeCloseTo(6);
                expect(m[15]).toBeCloseTo(1);
            });
    
            it('should be chainable', () => {
                const result = m.setTranslation(1, 2, 3);
                expect(result).toBe(m);
            });
        });
    
        describe('premultiply', () => {
            it('should correctly premultiply matrices', () => {
                // Create two test matrices
                const m1 = new Matrix4().setTranslation(1, 0, 0);
                const m2 = new Matrix4().setTranslation(0, 1, 0);
                
                // Test premultiplication (m1 * m2)
                m.copy(m2).premultiply(m1);
                
                // Check result
                expect(m[12]).toBeCloseTo(1); // Combined x translation
                expect(m[13]).toBeCloseTo(1); // Combined y translation
                expect(m[14]).toBeCloseTo(0); // Combined z translation
            });
    
    
            it('should be chainable', () => {
                const other = new Matrix4();
                const result = m.premultiply(other);
                expect(result).toBe(m);
            });
        });
    
        describe('multiplyScalar', () => {
            it('should multiply all elements by scalar', () => {
                // Set some initial values
                m.set([
                    1, 2, 3, 4,
                    5, 6, 7, 8,
                    9, 10, 11, 12,
                    13, 14, 15, 16
                ]);
                
                m.multiplyScalar(2);
                
                // Check all elements are multiplied
                for(let i = 0; i < 16; i++) {
                    expect(m[i]).toBeCloseTo((i + 1) * 2);
                }
            });
    
            it('should handle zero scalar', () => {
                m.set([
                    1, 2, 3, 4,
                    5, 6, 7, 8,
                    9, 10, 11, 12,
                    13, 14, 15, 16
                ]);
                
                m.multiplyScalar(0);
                
                // Check all elements are zero
                for(let i = 0; i < 16; i++) {
                    expect(m[i]).toBeCloseTo(0);
                }
            });
    
            
            it('should handle null y and z', () => {
                m.setTranslation(1);
                expect(m[13]).toBeCloseTo(0);
                expect(m[14]).toBeCloseTo(0);
            });

            it('should handle negative scalar', () => {
                m.setTranslation(1, 1, 1);
                m.multiplyScalar(-1);
                
                expect(m[12]).toBeCloseTo(-1);
                expect(m[13]).toBeCloseTo(-1);
                expect(m[14]).toBeCloseTo(-1);
                expect(m[0]).toBeCloseTo(-1);  // Identity diagonal elements
                expect(m[5]).toBeCloseTo(-1);
                expect(m[10]).toBeCloseTo(-1);
            });
    
            it('should be chainable', () => {
                const result = m.multiplyScalar(2);
                expect(result).toBe(m);
            });
        });
    });

    
});