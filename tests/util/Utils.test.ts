import { describe, it, expect } from 'vitest'
import { Utils } from '../../src/util/Utils'

describe('Utils', () => {
    describe('ID', () => {
        it('should generate unique IDs', () => {
            const id1 = Utils.ID()
            const id2 = Utils.ID()
            expect(id1).not.toBe(id2)
        })

        it('should include provided key in generated ID', () => {
            const key = 'test'
            const id = Utils.ID(key)
            expect(id.startsWith(key + '_')).toBe(true)
        })
    })

    describe('arraysEqual', () => {
        it('should return true for identical arrays', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2, 3]
            expect(Utils.arraysEqual(arr1, arr2)).toBe(true)
        })

        it('should return true for identical Float32Arrays', () => {
            const arr1 = new Float32Array([1, 2, 3])
            const arr2 = new Float32Array([1, 2, 3])
            expect(Utils.arraysEqual(arr1, arr2)).toBe(true)
        })

        it('should return false for arrays with different lengths', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2]
            expect(Utils.arraysEqual(arr1, arr2)).toBe(false)
        })

        it('should return false for arrays with different values', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2, 4]
            expect(Utils.arraysEqual(arr1, arr2)).toBe(false)
        })

        it('should return false when comparing with null', () => {
            const arr = [1, 2, 3]
            expect(Utils.arraysEqual(arr, null as any)).toBe(false)
            expect(Utils.arraysEqual(null as any, arr)).toBe(false)
        })
    })
})