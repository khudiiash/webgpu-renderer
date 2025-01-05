import { describe, it, expect } from 'vitest'
import { Quaternion, Vector3 } from '../../src/math';

describe('Quaternion', () => {
    it('should construct with default values', () => {
        const q = new Quaternion()
        expect(q.x).toBe(0)
        expect(q.y).toBe(0) 
        expect(q.z).toBe(0)
        expect(q.w).toBe(1)
    })

    it('should construct with custom values', () => {
        const q = new Quaternion(1, 2, 3, 4)
        expect(q.x).toBe(1)
        expect(q.y).toBe(2)
        expect(q.z).toBe(3)
        expect(q.w).toBe(4)
    })

    it('should calculate magnitude correctly', () => {
        const q = new Quaternion(1, 2, 3, 4)
        expect(q.magnitude()).toBeCloseTo(Math.sqrt(30))
    })

    it('should normalize correctly', () => {
        const q = new Quaternion(1, 2, 3, 4)
        q.normalize()
        const mag = q.magnitude()
        expect(mag).toBeCloseTo(1)
    })

    it('should perform quaternion multiplication', () => {
        const q1 = new Quaternion(1, 2, 3, 4)
        const q2 = new Quaternion(5, 6, 7, 8)
        q1.multiply(q2)
        expect(q1.x).toBe(24)
        expect(q1.y).toBe(48)
        expect(q1.z).toBe(48)
        expect(q1.w).toBe(-6)
    })

    it('should convert from euler angles', () => {
        const euler = new Vector3(Math.PI/4, 0, 0)
        const q = new Quaternion().setFromEuler(euler)
        expect(q.x).toBeCloseTo(Math.sin(Math.PI/8))
        expect(q.y).toBeCloseTo(0)
        expect(q.z).toBeCloseTo(0)
        expect(q.w).toBeCloseTo(Math.cos(Math.PI/8))
    })

    it('should perform conjugate operation', () => {
        const q = new Quaternion(1, 2, 3, 4)
        q.conjugate()
        expect(q.x).toBe(-1)
        expect(q.y).toBe(-2)
        expect(q.z).toBe(-3)
        expect(q.w).toBe(4)
    })

    it('should calculate dot product', () => {
        const q1 = new Quaternion(1, 2, 3, 4)
        const q2 = new Quaternion(5, 6, 7, 8)
        const dot = q1.dot(q2)
        expect(dot).toBe(70)
    })

    it('should handle conversion to/from array', () => {
        const q = new Quaternion(1, 2, 3, 4)
        const arr = q.toArray()
        expect(arr).toEqual([1, 2, 3, 4])
        
        const q2 = new Quaternion()
        q2.fromArray([5, 6, 7, 8])
        expect(q2.x).toBe(5)
        expect(q2.y).toBe(6)
        expect(q2.z).toBe(7)
        expect(q2.w).toBe(8)
    })
})