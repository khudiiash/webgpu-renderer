import { jest } from '@jest/globals';
import { Vector4 } from '../../math/Vector4';

describe('Vector4', () => {
  let onChangeSpy;
  
  beforeEach(() => {
    onChangeSpy = jest.fn();
  });

  describe('Constructor and Basic Properties', () => {
    test('constructor creates vector with default values', () => {
      const v = new Vector4();
      expect(v[0]).toBe(0);
      expect(v[1]).toBe(0);
      expect(v[2]).toBe(0);
      expect(v[3]).toBe(0);
      expect(v.isVector4).toBe(true);
    });

    test('constructor creates vector with provided values', () => {
      const v = new Vector4(1, 2, 3, 4);
      expect(v[0]).toBe(1);
      expect(v[1]).toBe(2);
      expect(v[2]).toBe(3);
      expect(v[3]).toBe(4);
    });
  });

  describe('Getters and Setters', () => {
    test('getters return correct values', () => {
      const v = new Vector4(1, 2, 3, 4);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
      expect(v.w).toBe(4);
    });

    test('setters update values and trigger onChange', () => {
      const v = new Vector4(1, 2, 3, 4).onChange(onChangeSpy);
      v.x = 5;
      v.y = 6;
      v.z = 7;
      v.w = 8;
      expect(v.x).toBe(5);
      expect(v.y).toBe(6);
      expect(v.z).toBe(7);
      expect(v.w).toBe(8);
      expect(onChangeSpy).toHaveBeenCalledTimes(4);
    });

    test('setX/Y/Z/W methods work correctly', () => {
      const v = new Vector4().onChange(onChangeSpy);
      v.setX(1).setY(2).setZ(3).setW(4);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
      expect(v.w).toBe(4);
      expect(onChangeSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Vector Operations', () => {
    test('add modifies vector correctly', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(4, 5, 6, 7);
      v1.add(v2);
      expect(v1[0]).toBe(5);
      expect(v1[1]).toBe(7);
      expect(v1[2]).toBe(9);
      expect(v1[3]).toBe(11);
    });

    test('sub modifies vector correctly', () => {
      const v1 = new Vector4(4, 5, 6, 7);
      const v2 = new Vector4(1, 2, 3, 4);
      v1.sub(v2);
      expect(v1[0]).toBe(3);
      expect(v1[1]).toBe(3);
      expect(v1[2]).toBe(3);
      expect(v1[3]).toBe(3);
    });

    test('multiplyScalar scales vector correctly', () => {
      const v = new Vector4(1, 2, 3, 4).onChange(onChangeSpy);
      v.multiplyScalar(2);
      expect(v[0]).toBe(2);
      expect(v[1]).toBe(4);
      expect(v[2]).toBe(6);
      expect(v[3]).toBe(8);
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Vector Mathematics', () => {
    test('length returns correct magnitude', () => {
      const v = new Vector4(1, 2, 2, 0);
      expect(v.length()).toBeCloseTo(3);
    });

    test('normalize makes vector unit length', () => {
      const v = new Vector4(2, 2, 2, 2).onChange(onChangeSpy);
      v.normalize();
      expect(v.length()).toBeCloseTo(1);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('dot product calculation', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);
      expect(v1.dot(v2)).toBeCloseTo(70); // 1*5 + 2*6 + 3*7 + 4*8
    });

    test('manhattanLength returns correct value', () => {
      const v = new Vector4(1, -2, 3, -4);
      expect(v.manhattanLength()).toBe(10); // |1| + |-2| + |3| + |-4|
    });
  });

  describe('Component Operations', () => {
    test('setComponent and getComponent work correctly', () => {
      const v = new Vector4(1, 2, 3, 4).onChange(onChangeSpy);
      v.setComponent(0, 5);
      expect(v.getComponent(0)).toBe(5);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('setScalar sets all components', () => {
      const v = new Vector4().onChange(onChangeSpy);
      v.setScalar(1);
      expect(v[0]).toBe(1);
      expect(v[1]).toBe(1);
      expect(v[2]).toBe(1);
      expect(v[3]).toBe(1);
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('clone creates independent copy', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = v1.clone();
      v2.x = 5;
      expect(v1.x).toBe(1);
      expect(v2.x).toBe(5);
    });

    test('copy copies values correctly', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4();
      v2.copy(v1);
      expect(v2[0]).toBe(1);
      expect(v2[1]).toBe(2);
      expect(v2[2]).toBe(3);
      expect(v2[3]).toBe(4);
    });

    test('toArray converts to array correctly', () => {
      const v = new Vector4(1, 2, 3, 4);
      const arr = [];
      v.toArray(arr);
      expect(arr).toEqual([1, 2, 3, 4]);
    });

    test('fromArray sets values correctly', () => {
      const v = new Vector4().onChange(onChangeSpy);
      v.fromArray([1, 2, 3, 4]);
      expect(v[0]).toBe(1);
      expect(v[1]).toBe(2);
      expect(v[2]).toBe(3);
      expect(v[3]).toBe(4);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('clear sets all components to zero', () => {
      const v = new Vector4(1, 2, 3, 4).onChange(onChangeSpy);
      v.clear();
      expect(v[0]).toBe(0);
      expect(v[1]).toBe(0);
      expect(v[2]).toBe(0);
      expect(v[3]).toBe(0);
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    test('addVectors adds vectors correctly', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);
      const result = Vector4.addVectors(v1, v2);
      expect(result[0]).toBe(6);
      expect(result[1]).toBe(8);
      expect(result[2]).toBe(10);
      expect(result[3]).toBe(12);
    });

    test('subVectors subtracts vectors correctly', () => {
      const v1 = new Vector4(5, 6, 7, 8);
      const v2 = new Vector4(1, 2, 3, 4);
      const result = Vector4.subVectors(v1, v2);
      expect(result[0]).toBe(4);
      expect(result[1]).toBe(4);
      expect(result[2]).toBe(4);
      expect(result[3]).toBe(4);
    });
  });
});