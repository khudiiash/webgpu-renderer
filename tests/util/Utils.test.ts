import { describe, it, expect } from 'vitest'
import { arraysEqual, uuid } from '@/util'
import { Euler } from '@/math/Euler'
import { Quaternion } from '@/math/Quaternion'

describe('Utils', () => {
    describe('ID', () => {
        it('should generate unique IDs', () => {
            const id1 = uuid();
            const id2 = uuid();
            expect(id1).not.toBe(id2)
        })

        it('should include provided key in generated ID', () => {
            const key = 'test'
            const _id = uuid(key);
            expect(_id.startsWith(key + '_')).toBe(true)
        })
    })

    describe('arraysEqual', () => {
        it('should return true for identical arrays', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2, 3]
            expect(arraysEqual(arr1, arr2)).toBe(true)
        })

        it('should return true for identical Float32Arrays', () => {
            const arr1 = new Float32Array([1, 2, 3])
            const arr2 = new Float32Array([1, 2, 3])
            expect(arraysEqual(arr1, arr2)).toBe(true)
        })

        it('should return false for arrays with different lengths', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2]
            expect(arraysEqual(arr1, arr2)).toBe(false)
        })

        it('should return false for arrays with different values', () => {
            const arr1 = [1, 2, 3]
            const arr2 = [1, 2, 4]
            expect(arraysEqual(arr1, arr2)).toBe(false)
        })

        it('should return false when comparing with null', () => {
            const arr = [1, 2, 3]
            expect(arraysEqual(arr, null as any)).toBe(false)
            expect(arraysEqual(null as any, arr)).toBe(false)
        })

        it("should not get stuck in an infinite loop", () => {
            const euler = new Euler().onChange(() => {
                q.setFromEuler(euler);
            });
            const q = new Quaternion().onChange(() => {
                euler.setFromQuaternion(q);
            });

            euler.set([1, 2, 3]);
            
        });
        
    })
})