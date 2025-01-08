import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BufferData } from '@/data/BufferData';
import { DataMonitor } from '@/data/DataMonitor';

describe('DataMonitor', () => {
    let dataMonitor: DataMonitor
    let bufferData: BufferData
    let parentInstance: BufferData & { 
        testMethod(): BufferData
        onChange(callback: Function): BufferData
        offChange(callback: Function): BufferData
    }

    beforeEach(() => {
        bufferData = new Float32Array([0, 0, 0]) as BufferData;
        parentInstance = Object.assign(bufferData as any, {
            testMethod() { 
                (this as any)[0] = 1
                return this
            },
            onChange() {
                return this
            },
            offChange() {
                return this
            }
        })
        dataMonitor = new DataMonitor(parentInstance, bufferData);
    })

    it('should initialize with empty callbacks', () => {
        expect((dataMonitor as any).callbacks).toEqual([])
    })

    it('should add callback', () => {
        const callback = vi.fn()
        dataMonitor.add(callback)
        expect((dataMonitor as any).callbacks).toContain(callback)
    })

    it('should remove callback', () => {
        const callback = vi.fn()
        dataMonitor.add(callback)
        dataMonitor.remove(callback)
        expect((dataMonitor as any).callbacks).not.toContain(callback)
    })

    it('should throw error when adding undefined callback', () => {
        expect(() => dataMonitor.add(undefined as unknown as Function))
            .toThrow('Callback is undefined')
    })

    it('should not add same callback twice', () => {
        const callback = vi.fn()
        dataMonitor.add(callback)
        dataMonitor.add(callback)
        expect((dataMonitor as any).callbacks.length).toBe(1)
    })

    it('should call callbacks when data changes', () => {
        const callback = vi.fn()
        dataMonitor.add(callback)
        parentInstance[0] = 1
        dataMonitor.check()
        expect(callback).toHaveBeenCalledWith(bufferData)
    })

    it('should chain onChange method', () => {
        const callback = vi.fn()
        const result = parentInstance.onChange(callback)
        expect(result).toBe(parentInstance)
    })

    it('should chain offChange method', () => {
        const callback = vi.fn()
        const result = parentInstance.offChange(callback)
        expect(result).toBe(parentInstance)
    })

    it('should not trigger callbacks if data hasnt changed', () => {
        const callback = vi.fn()
        dataMonitor.add(callback)
        dataMonitor.check()
        expect(callback).not.toHaveBeenCalled()
    })
})