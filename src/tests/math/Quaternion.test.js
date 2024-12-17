import { jest } from '@jest/globals';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Euler } from '../../math/Euler';

describe('Quaternion', () => {
  let onChangeSpy;
  
  beforeEach(() => {
    onChangeSpy = jest.fn();
  });

  describe('Constructor and Basic Properties', () => {
    test('constructor creates identity quaternion by default', () => {
      const q = new Quaternion();
      expect(q[0]).toBe(0); // x
      expect(q[1]).toBe(0); // y
      expect(q[2]).toBe(0); // z
      expect(q[3]).toBe(1); // w
      expect(q.isQuaternion).toBe(true);
    });

    test('constructor creates quaternion with provided values', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q[0]).toBe(1);
      expect(q[1]).toBe(2);
      expect(q[2]).toBe(3);
      expect(q[3]).toBe(4);
    });
  });

  describe('Getters and Setters', () => {
    test('getters return correct values', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.x).toBe(1);
      expect(q.y).toBe(2);
      expect(q.z).toBe(3);
      expect(q.w).toBe(4);
    });

    test('setters update values and trigger onChange', () => {
      const q = new Quaternion().onChange(onChangeSpy);
      q.x = 1;
      q.y = 2;
      q.z = 3;
      q.w = 4;
      expect(q.x).toBe(1);
      expect(q.y).toBe(2);
      expect(q.z).toBe(3);
      expect(q.w).toBe(4);
      expect(onChangeSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Rotation Operations', () => {
    test('setFromAxisAngle sets correct rotation', () => {
      const q = new Quaternion().onChange(onChangeSpy);
      const axis = new Vector3(0, 1, 0); // Y axis
      const angle = Math.PI / 2; // 90 degrees
      
      q.setFromAxisAngle(axis, angle);
      
      // For a 90-degree rotation around Y axis:
      expect(q.x).toBeCloseTo(0);
      expect(q.y).toBeCloseTo(Math.sin(angle/2));
      expect(q.z).toBeCloseTo(0);
      expect(q.w).toBeCloseTo(Math.cos(angle/2));
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('rotateY performs correct rotation', () => {
      const q = new Quaternion().onChange(onChangeSpy);
      q.rotateY(Math.PI / 2);
      
      // For a 90-degree rotation around Y axis:
      expect(q.x).toBeCloseTo(0);
      expect(q.y).toBeCloseTo(Math.sin(Math.PI/4));
      expect(q.z).toBeCloseTo(0);
      expect(q.w).toBeCloseTo(Math.cos(Math.PI/4));
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('setFromEuler sets correct rotation', () => {
      const q = new Quaternion().onChange(onChangeSpy);
      const euler = new Euler(Math.PI/4, 0, 0); // 45 degrees around X
      
      q.setFromEuler(euler, true);
      
      expect(q.x).toBeCloseTo(Math.sin(Math.PI/8));
      expect(q.y).toBeCloseTo(0);
      expect(q.z).toBeCloseTo(0);
      expect(q.w).toBeCloseTo(Math.cos(Math.PI/8));
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Quaternion Operations', () => {
    test('multiply combines rotations correctly', () => {
      const q1 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2);
      const q2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2);
      const q = new Quaternion();
      
      q.multiply(q1, q2);
      
      // Two 90-degree rotations = 180-degree rotation
      expect(q.y).toBeCloseTo(1);
      expect(q.w).toBeCloseTo(0);
    });

    test('inverse creates correct inverse rotation', () => {
      const q = new Quaternion(0, 1, 0, 0).onChange(onChangeSpy); // 180° around Y
      q.inverse();
      
      expect(q.x).toBeCloseTo(0);
      expect(q.y).toBeCloseTo(-1);
      expect(q.z).toBeCloseTo(0);
      expect(q.w).toBeCloseTo(0);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('getForwardVector returns correct direction', () => {
      const q = new Quaternion(); // Identity quaternion
      const forward = new Vector3();
      q.getForwardVector(forward);
      
      expect(forward.x).toBeCloseTo(0);
      expect(forward.y).toBeCloseTo(0);
      expect(forward.z).toBeCloseTo(1);
    });
  });

  describe('Utility Methods', () => {
    test('copy copies values correctly', () => {
      const q1 = new Quaternion(1, 2, 3, 4);
      const q2 = new Quaternion().onChange(onChangeSpy);
      q2.copy(q1);
      
      expect(q2.x).toBe(1);
      expect(q2.y).toBe(2);
      expect(q2.z).toBe(3);
      expect(q2.w).toBe(4);
    });

    test('toArray converts to array correctly', () => {
      const q = new Quaternion(1, 2, 3, 4);
      const arr = [];
      q.toArray(arr);
      
      expect(arr).toEqual([1, 2, 3, 4]);
    });

    test('fromArray sets values correctly', () => {
      const q = new Quaternion().onChange(onChangeSpy);
      q.fromArray([1, 2, 3, 4]);
      
      expect(q.x).toBe(1);
      expect(q.y).toBe(2);
      expect(q.z).toBe(3);
      expect(q.w).toBe(4);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('equalsArray compares correctly', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.equalsArray([1, 2, 3, 4])).toBe(true);
      expect(q.equalsArray([4, 3, 2, 1])).toBe(false);
    });
  });

  describe('Interpolation', () => {
    test('slerpQuaternions interpolates correctly', () => {
        const q1 = new Quaternion(); // Identity
        const q2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI); // 180° Y rotation
        const q = new Quaternion();
        
        // Test halfway interpolation (90 degrees)
        q.slerpQuaternions(q1, q2, 0.5);
        expect(q.y).toBeCloseTo(Math.sin(Math.PI/4)); // ≈ 0.7071067811865475
        expect(q.w).toBeCloseTo(Math.cos(Math.PI/4)); // ≈ 0.7071067811865475
        expect(q.x).toBeCloseTo(0);
        expect(q.z).toBeCloseTo(0);
      });
  
      test('slerpQuaternions handles different t values', () => {
        const q1 = new Quaternion(); // Identity
        const q2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI); // 180° Y rotation
        const q = new Quaternion();
        
        // Test start of interpolation (t=0)
        q.slerpQuaternions(q1, q2, 0);
        expect(q.w).toBeCloseTo(1);
        expect(q.y).toBeCloseTo(0);
        expect(q.x).toBeCloseTo(0);
        expect(q.z).toBeCloseTo(0);
        
        // Test end of interpolation (t=1)
        q.slerpQuaternions(q1, q2, 1);
        // Instead of testing specific values, test that it represents a 180° rotation
        const forward = new Vector3(0, 0, 1);
        const rotated = new Vector3(0, 0, 1);
        q.getForwardVector(rotated);
        expect(rotated.x).toBeCloseTo(0);
        expect(rotated.y).toBeCloseTo(0);
        expect(rotated.z).toBeCloseTo(-1); // Should be pointing in opposite direction
      });
  
      // Add test for actual rotation effect
      test('slerpQuaternions produces correct rotations', () => {
        const q1 = new Quaternion(); // Identity
        const q2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI); // 180° Y rotation
        const q = new Quaternion();
        
        // Test 90-degree rotation (t=0.5)
        q.slerpQuaternions(q1, q2, 0.5);
        expect(q.y).toBeCloseTo(Math.sin(Math.PI/4)); // ≈ 0.7071067811865475
        expect(q.w).toBeCloseTo(Math.cos(Math.PI/4)); // ≈ 0.7071067811865475
      });
  });

  describe('Debug Methods', () => {
    test('print returns correct string format', () => {
      const q = new Quaternion(1, 2, 3, 4);
      expect(q.print()).toBe('Quat { x: 1, y: 2, z: 3, w: 4 }');
    });

    test('printEuler returns euler angles in degrees', () => {
      const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2);
      const result = q.printEuler();
      expect(result).toContain('90'); // Should contain 90 degrees for Y rotation
    });
  });
});