import { describe, test, expect } from 'vitest';
import { Vector3 } from '@/math/Vector3';

describe('Vector3', () => {
    test('constructor initializes with default values', () => {
        const v = new Vector3();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    test('constructor initializes with provided values', () => {
        const v = new Vector3(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    test('lock() must prevent any value changes', () => {
        const v = new Vector3();
        v.lock();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    })

    test('unlock() must allow value changes', () => {
        const v = new Vector3();
        v.lock();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
        v.unlock();
        v.x = 1;
        v.y = 2;
        v.z = 3;
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    test('add() adds vectors correctly', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(2, 3, 4);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(5);
        expect(v1.z).toBe(7);
    });

    test('sub() subtracts vectors correctly', () => {
        const v1 = new Vector3(5, 5, 5);
        const v2 = new Vector3(2, 1, 3);
        v1.sub(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
        expect(v1.z).toBe(2);
    });

    test('multiply() multiplies vectors correctly', () => {
        const v1 = new Vector3(2, 3, 4);
        const v2 = new Vector3(2, 2, 2);
        v1.multiply(v2);
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
        expect(v1.z).toBe(8);
    });

    test('cross() computes cross product correctly', () => {
        const v1 = new Vector3(1, 0, 0);
        const v2 = new Vector3(0, 1, 0);
        v1.cross(v2);
        expect(v1.x).toBe(0);
        expect(v1.y).toBe(0);
        expect(v1.z).toBe(1);
    });

    test('dot() computes dot product correctly', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const result = v1.dot(v2);
        expect(result).toBe(32);
    });

    test('magnitude() calculates length correctly', () => {
        const v = new Vector3(3, 4, 0);
        expect(v.magnitude()).toBe(5);
    });

    test('clone() creates a new identical vector', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1);
    });

    test('equals() compares vectors correctly', () => {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(1, 2, 3);
        const v3 = new Vector3(1, 2, 4);
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v3)).toBe(false);
    });
});