import { Matrix4 } from '../../math/Matrix4';
import { Vector3 } from '../../math/Vector3';
import { Quaternion } from '../../math/Quaternion';

describe('Matrix4', () => {
    let matrix;
    
    beforeEach(() => {
        matrix = new Matrix4();
    });
    
    test('should initialize with identity matrix by default', () => {
        expect(matrix).toEqual(new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]));
    });
    
    test('should initialize with custom values', () => {
        const customMatrix = new Matrix4([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
        
        expect(Array.from(customMatrix)).toEqual([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16
        ]);
    });
    
    test('lookAt should create correct view matrix', () => {
        const eye = new Vector3(0, 0, 5);
        const target = new Vector3(0, 0, 0);
        const up = new Vector3(0, 1, 0);
        
        matrix.lookAt(eye, target, up);
        const expected = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -5, 1
        ];
        for (let i = 0; i < 16; i++) {
            expect(matrix[i]).toBeCloseTo(expected[i]);
        }
    });
    
    test('multiply should correctly multiply two matrices', () => {
        const m1 = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 2, 3, 1
        ]);
        
        const m2 = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            4, 5, 6, 1
        ]);
        
        m1.multiply(m2);
        
        expect(m1[12]).toBe(5); // Translation X
        expect(m1[13]).toBe(7); // Translation Y
        expect(m1[14]).toBe(9); // Translation Z
    });
    
    test('determinant should return correct value', () => {
        matrix.set([
            1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 3, 0,
            0, 0, 0, 1
        ]);
        
        expect(matrix.determinant()).toBe(6);
    });
    
    test('invert should correctly invert the matrix', () => {
        const original = new Matrix4([
            1, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 3, 0,
            1, 2, 3, 1
        ]);
        
        const inverted = original.clone().invert();
        const result = new Matrix4();
        result.multiplyMatrices(original, inverted);
        
        // Should be approximately identity matrix
        for (let i = 0; i < 16; i++) {
            if (i % 5 === 0) { // Diagonal elements
                expect(result[i]).toBeCloseTo(1);
            } else {
                expect(result[i]).toBeCloseTo(0);
            }
        }
    });
    
    test('compose should build matrix from position, quaternion and scale', () => {
        const position = new Vector3(1, 2, 3);
        const quaternion = new Quaternion();
        const scale = new Vector3(2, 2, 2);
        
        matrix.compose(position, quaternion, scale);
        
        const decomposedPosition = new Vector3();
        const decomposedQuaternion = new Quaternion();
        const decomposedScale = new Vector3();
        
        matrix.decompose(decomposedPosition, decomposedQuaternion, decomposedScale);
        
        expect(decomposedPosition).toEqual(position);
        expect(decomposedScale).toEqual(scale);
        expect(decomposedQuaternion).toEqual(quaternion);
    });
    
    test('translate should correctly translate the matrix', () => {
        const translation = new Vector3(1, 2, 3);
        matrix.translate(translation);
        
        expect(matrix[12]).toBe(1);
        expect(matrix[13]).toBe(2);
        expect(matrix[14]).toBe(3);
    });
    
    test('scale should correctly scale the matrix', () => {
        matrix.scale(2);
        
        expect(matrix[0]).toBe(2);
        expect(matrix[5]).toBe(2);
        expect(matrix[10]).toBe(2);
    });
    
    test('clone should create a new independent copy', () => {
        matrix.translate(1, 2, 3);
        const clone = matrix.clone();
        
        expect(clone.toArray()).toEqual(matrix.toArray());
        
        matrix.translate(1, 0, 0);
        expect(clone.toArray()).not.toEqual(matrix.toArray());
    });
    
    test('equals should correctly compare matrices', () => {
        const m1 = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        const m2 = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        expect(m1.equals(m2)).toBe(true);
        
        m2[12] = 1;
        expect(m1.equals(m2)).toBe(false);
    });
});