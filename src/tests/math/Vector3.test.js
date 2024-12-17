import { jest } from '@jest/globals';
import { Vector3 } from '../../math/Vector3';

describe('Vector3', () => {
  let onChangeSpy;
  
  beforeEach(() => {
    onChangeSpy = jest.fn();
  });

  describe('Constructor and Static Properties', () => {
    test('constructor creates vector with default values', () => {
      const v = new Vector3();
      expect(v[0]).toBe(0);
      expect(v[1]).toBe(0);
      expect(v[2]).toBe(0);
      expect(v.isVector3).toBe(true);
    });

    test('constructor creates vector with provided values', () => {
      const v = new Vector3(1, 2, 3);
      expect(v[0]).toBe(1);
      expect(v[1]).toBe(2);
      expect(v[2]).toBe(3);
    });

    test('static constants are correctly defined', () => {
      expect(Vector3.ZERO[0]).toBe(0);
      expect(Vector3.ZERO[1]).toBe(0);
      expect(Vector3.ZERO[2]).toBe(0);
      
      expect(Vector3.RIGHT[0]).toBe(1);
      expect(Vector3.RIGHT[1]).toBe(0);
      expect(Vector3.RIGHT[2]).toBe(0);
    });
  });

  describe('Getters and Setters', () => {
    test('getters return correct values', () => {
      const v = new Vector3(1, 2, 3);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });

    test('setters update values and trigger onChange', () => {
      const v = new Vector3(1, 2, 3).onChange(onChangeSpy);
      v.x = 4;
      v.y = 5;
      v.z = 6;
      expect(v.x).toBe(4);
      expect(v.y).toBe(5);
      expect(v.z).toBe(6);
      expect(onChangeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Vector Operations', () => {
    test('add modifies vector correctly', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      v1.add(v2);
      expect(v1[0]).toBe(5);
      expect(v1[1]).toBe(7);
      expect(v1[2]).toBe(9);
    });

    test('sub modifies vector correctly', () => {
      const v1 = new Vector3(4, 5, 6);
      const v2 = new Vector3(1, 2, 3);
      v1.sub(v2);
      expect(v1[0]).toBe(3);
      expect(v1[1]).toBe(3);
      expect(v1[2]).toBe(3);
    });

    test('multiplyScalar scales vector correctly', () => {
      const v = new Vector3(1, 2, 3).onChange(onChangeSpy);
      v.multiplyScalar(2);
      expect(v[0]).toBe(2);
      expect(v[1]).toBe(4);
      expect(v[2]).toBe(6);
      expect(onChangeSpy).toHaveBeenCalled();
    });
  });

  describe('Vector Mathematics', () => {
    test('length returns correct magnitude', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.length()).toBeCloseTo(5);
    });

    test('normalize makes vector unit length', () => {
      const v = new Vector3(3, 4, 0).onChange(onChangeSpy);
      v.normalize();
      expect(v.length()).toBeCloseTo(1);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('dot product calculation', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      expect(v1.dot(v2)).toBeCloseTo(32);
    });
  });

  describe('Utility Methods', () => {
    test('clone creates independent copy', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = v1.clone();
      v2.x = 4;
      expect(v1.x).toBe(1);
      expect(v2.x).toBe(4);
    });

    test('clear sets all components to zero', () => {
      const v = new Vector3(1, 2, 3).onChange(onChangeSpy);
      v.clear();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('fromArray sets values correctly', () => {
      const v = new Vector3().onChange(onChangeSpy);
      v.fromArray([1, 2, 3]);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
      expect(onChangeSpy).toHaveBeenCalled();
    });

    test('toArray returns correct array', () => {
      const v = new Vector3(1, 2, 3);
      const arr = [];
      v.toArray(arr);
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('Advanced Operations', () => {
    test('lerp interpolates correctly', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(10, 10, 10);
      v1.lerp(v2, 0.5);
      expect(v1.x).toBeCloseTo(5);
      expect(v1.y).toBeCloseTo(5);
      expect(v1.z).toBeCloseTo(5);
    });

    test('random generates values within range', () => {
      const v = new Vector3().random(0, 1);
      expect(v.x).toBeGreaterThanOrEqual(0);
      expect(v.x).toBeLessThanOrEqual(1);
      expect(v.y).toBeGreaterThanOrEqual(0);
      expect(v.y).toBeLessThanOrEqual(1);
      expect(v.z).toBeGreaterThanOrEqual(0);
      expect(v.z).toBeLessThanOrEqual(1);
    });
  });
});