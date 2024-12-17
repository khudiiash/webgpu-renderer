import { Euler } from '../../math/Euler';
import { Matrix4 } from '../../math/Matrix4';
import { jest } from '@jest/globals';
import { DEG2RAD, RAD2DEG } from '../../math/MathUtils';


describe('Euler', () => {
    let euler;
    
    beforeEach(() => {
        euler = new Euler();
    });
    
    test('should initialize with default values', () => {
        expect(euler.x).toBe(0);
        expect(euler.y).toBe(0);
        expect(euler.z).toBe(0);
        expect(euler.order).toBe('xyz');
    });
    
    test('handles full range of -180 to +180 degrees', () => {
        // Test various angles in degrees, converted to radians
        const testAngles = [
            [-180, 0, 0],
            [-90, 0, 0],
            [0, 0, 0],
            [90, 0, 0],
            [180, 0, 0],
            [0, -180, 0],
            [0, -90, 0],
            [0, 90, 0],
            [0, 180, 0],
            [0, 0, -180],
            [0, 0, -90],
            [0, 0, 90],
            [0, 0, 180],
        ];

        testAngles.forEach(([x, y, z]) => {
            const radX = x * DEG2RAD;
            const radY = y * DEG2RAD;
            const radZ = z * DEG2RAD;
            
            euler.set(radX, radY, radZ);
            
            // Convert back to degrees for easier debugging
            const degX = euler.x * RAD2DEG;
            const degY = euler.y * RAD2DEG;
            const degZ = euler.z * RAD2DEG;
            
            expect(degX).toBeCloseTo(x);
            expect(degY).toBeCloseTo(y);
            expect(degZ).toBeCloseTo(z);
        });
    });
    
    test('setFromRotationMatrix should handle 90 degree rotations correctly', () => {
        const testCases = [
            {
                name: 'X 90°',
                matrix: [
                    1, 0, 0, 0,
                    0, 0, -1, 0,
                    0, 1, 0, 0,
                    0, 0, 0, 1
                ],
                expected: [Math.PI/2, 0, 0]
            },
            {
                name: 'Y 90°',
                matrix: [
                    0, 0, 1, 0,
                    0, 1, 0, 0,
                    -1, 0, 0, 0,
                    0, 0, 0, 1
                ],
                expected: [0, Math.PI/2, 0]
            },
            {
                name: 'Z 90°',
                matrix: [
                    0, -1, 0, 0,
                    1, 0, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ],
                expected: [0, 0, Math.PI/2]
            }
        ];

        testCases.forEach(({ name, matrix, expected }) => {
            const m = new Matrix4(matrix);
            euler.setFromRotationMatrix(m, 'xyz');
            
            expect(euler.x).toBeCloseTo(expected[0], 6, `${name} X angle`);
            expect(euler.y).toBeCloseTo(expected[1], 6, `${name} Y angle`);
            expect(euler.z).toBeCloseTo(expected[2], 6, `${name} Z angle`);
        });
    });
    
    test('setter and getter for x, y, z should work', () => {
        euler.x = 1;
        euler.y = 2;
        euler.z = 3;
        
        expect(euler.x).toBe(1);
        expect(euler.y).toBe(2);
        expect(euler.z).toBe(3);
    });
    
    test('setter and getter for order should work', () => {
        euler.order = 'zyx';
        expect(euler.order).toBe('zyx');
    });
    
    test('toArray should return correct array', () => {
        euler.set(1, 2, 3);
        const array = [];
        euler.toArray(array);
        
        expect(array).toEqual([1, 2, 3]);
    });
    
    test('toArray with offset should work', () => {
        euler.set(1, 2, 3);
        const array = [0, 0];
        euler.toArray(array, 2);
        
        expect(array).toEqual([0, 0, 1, 2, 3]);
    });
    
    test('set should update values and trigger callback', () => {
        const mockCallback = jest.fn();
        euler.onChange(mockCallback);
        
        euler.set(1, 2, 3, 'zyx');
        
        expect(euler.x).toBe(1);
        expect(euler.y).toBe(2);
        expect(euler.z).toBe(3);
        expect(euler.order).toBe('zyx');
        expect(mockCallback).toHaveBeenCalled();
    });
    
    test('copy should create exact copy', () => {
        const original = new Euler(1, 2, 3, 'zyx');
        euler.copy(original);
        
        expect(euler.x).toBe(original.x);
        expect(euler.y).toBe(original.y);
        expect(euler.z).toBe(original.z);
        expect(euler.order).toBe(original.order);
    });
    
    test('clone should create independent copy', () => {
        euler.set(1, 2, 3, 'zyx');
        const clone = euler.clone();
        
        expect(clone.equals(euler)).toBe(true);
        
        euler.x = 4;
        expect(clone.equals(euler)).toBe(false);
    });
    
    test('equals should correctly compare Euler angles', () => {
        const a = new Euler(1, 2, 3, 'xyz');
        const b = new Euler(1, 2, 3, 'xyz');
        const c = new Euler(1, 2, 3, 'zyx');
        const d = new Euler(4, 2, 3, 'xyz');
        
        expect(a.equals(b)).toBe(true);
        expect(a.equals(c)).toBe(false);
        expect(a.equals(d)).toBe(false);
    });
    
    test('print should format angles in degrees', () => {
        euler.set(Math.PI / 2, Math.PI / 4, Math.PI, 'xyz');
        const output = euler.print();
        
        expect(output).toBe('Euler { x: 90°, y: 45°, z: 180° }');
    });
    
    test('iterator should yield correct values', () => {
        euler.set(1, 2, 3, 'zyx');
        const values = [...euler];
        
        expect(values).toEqual([1, 2, 3, 'zyx']);
    });
    
    test('onChange callback should be triggered for all changes', () => {
        const mockCallback = jest.fn();
        euler.onChange(mockCallback);
        
        euler.x = 1;
        euler.y = 2;
        euler.z = 3;
        euler.order = 'zyx';
        
        expect(mockCallback).toHaveBeenCalledTimes(4);
    });
});