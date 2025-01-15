import { arraysEqual } from '@/util/general';
import { DataMonitor } from './DataMonitor';

export type ChangeCallback = (data: ArrayLike<number>, start: number, end: number) => void;
const _buffers: any = {};

export class BufferData extends Float32Array {
    [index: number]: number;
    monitor!: DataMonitor;
    arrayStride: number;
    static count = 0;

    onChange(callback: ChangeCallback): this { return this; }
    offChange(callback?: ChangeCallback): this { return this; }

    constructor(arg: ArrayLike<number> | number, arrayStride: number = typeof arg === 'number' ? 1 : arg.length) {
        if (typeof arg === 'number') {
            super(arg * arrayStride);
        } else {
            super(arg);
        }
        if (!_buffers[this.constructor.name]) {
            _buffers[this.constructor.name] = 1;
        } else {
            _buffers[this.constructor.name]++;
        }
        this.arrayStride = arrayStride;
        this.monitor = new DataMonitor(this, this, arrayStride);
    }

    set(array: ArrayLike<number> | BufferData, offset: number = 0): this {
        super.set(array, offset);
        this.monitor.check(offset, offset + array.length);
        return this;
    }


    setSilent(array: ArrayLike<number> | BufferData, offset: number = 0): this {
        super.set(array, offset);
        return this;
    }

    copy(data: BufferData): this {
        super.set(data);
        this.monitor.check();
        return this;
    }

    copySilent(data: BufferData): this {
        super.set(data);
        return this;
    }

    clone(): this {
        return new (this.constructor as any)(...this) as this;
    }

    equals(data: BufferData): boolean {
        return arraysEqual(this, data, 0, this.length);
    }

    fromArray(array: ArrayLike<number> | BufferData, start: number = 0, end: number = array.length - 1): this {
        const length = Math.min(this.length, end - start + 1);
        for (let i = 0; i < length; i++) {
            this[i] = array[start + i];
        }
        this.monitor.check();
        return this;
    }

    fromArraySilent(array: ArrayLike<number> | BufferData, start: number = 0, end: number = array.length - 1): this {
        const length = Math.min(this.length, end - start + 1);
        for (let i = 0; i < length; i++) {
            this[i] = array[start + i];
        }
        return this;
    }

    toArray(array: number[] = [], offset: number = 0): number[] {
        for (let i = 0; i < this.length; i++) {
            array[offset + i] = this[i];
        }

        return array;
    }

    magnitude(): number {
        return Math.sqrt(this.reduce((sum, value) => sum + value ** 2, 0));
    }

}