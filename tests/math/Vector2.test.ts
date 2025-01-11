import { describe, it, expect } from 'vitest';
import { Vector2 } from '@/math/Vector2';

describe('Vector2', () => {
    it('creates with default values', () => {
        const v = new Vector2();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.isVector2).toBe(true);
        expect(v.length).toBe(2);
    });

    it('creates with custom values', () => {
        const v = new Vector2(1, 2);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
    });

    it('sets and gets values through properties', () => {
        const v = new Vector2();
        v.x = 1;
        v.y = 2;
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
    });

    it('adds vectors', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(2, 3);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
    });

    it('subtracts vectors', () => {
        const v1 = new Vector2(3, 4);
        const v2 = new Vector2(1, 1);
        v1.sub(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
    });

    it('multiplies vectors', () => {
        const v1 = new Vector2(2, 3);
        const v2 = new Vector2(2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
    });

    it('divides vectors', () => {
        const v1 = new Vector2(4, 6);
        const v2 = new Vector2(2, 2);
        v1.divide(v2);
        expect(v1.x).toBe(2);
        expect(v1.y).toBe(3);
    });

    it('calculates dot product', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(2, 3);
        const dot = v1.dot(v2);
        expect(dot).toBe(8); // 1*2 + 2*3
    });

    it('calculates magnitude', () => {
        const v = new Vector2(3, 4);
        expect(v.magnitude()).toBe(5); // sqrt(3^2 + 4^2) = 5
    });

    it('clones vector', () => {
        const v1 = new Vector2(1, 2);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2).not.toBe(v1); // Different instances
    });

    it('copies vector', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
    });

    it('checks equality', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(1, 2);
        const v3 = new Vector2(1, 3);
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v3)).toBe(false);
    });

    it('sets from array', () => {
        const v = new Vector2();
        const array = [5, 6, 7, 8];
        v.set(array, 1);
        expect(v.x).toBe(6);
        expect(v.y).toBe(7);
    });

    it('sets individual components', () => {
        const v = new Vector2();
        v.setX(5);
        v.setY(6);
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
    });

    it('converts to array with offset', () => {
        const v = new Vector2(1, 2);
        const array: number[] = [];
        v.toArray(array, 1);
        expect(array).toEqual([undefined, 1, 2]);
    });

    it('converts to array with default parameters', () => {
        const v = new Vector2(1, 2);
        const array = v.toArray();
        expect(array).toEqual([1, 2]);
    });

    it('handles array conversion with existing array', () => {
        const v = new Vector2(1, 2);
        const existingArray = [9, 9, 9];
        v.toArray(existingArray, 1);
        expect(existingArray).toEqual([9, 1, 2]);
    });
});