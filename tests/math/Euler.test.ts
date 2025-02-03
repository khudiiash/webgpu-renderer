import { describe, it, expect } from 'vitest'
import { Euler, EulerOrder } from '../../src/math/Euler'
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
})