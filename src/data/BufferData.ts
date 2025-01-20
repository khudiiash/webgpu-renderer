import { arraysEqual } from '@/util/general';
import { DataMonitor } from './DataMonitor';
import { GPUPlainType } from '@/types';
import { Struct } from './Struct';

export type ChangeCallback = (data: BufferData | Float32Array, start: number, end: number) => void;

export class BufferData extends Float32Array {
    [index: number]: number;
    monitor!: DataMonitor;
    protected arrayStride: number;
    static count = 0;

    onChange(_: ChangeCallback): this { return this; }
    offChange(_?: ChangeCallback): this { return this; }

    constructor(arg: ArrayLike<number> | number, arrayStride?: number) {
        if (typeof arg === 'number') {
            if (!Number.isInteger(arg)) {
                console.error('BufferData: length must be an integer', arg);
            }
            if (arrayStride === undefined) {
                super(arg);
            } else {
                super(arg * arrayStride);
            }
        } else {
            super(arg);
        }
        this.arrayStride = arrayStride ?? this.length;
        this.monitor = new DataMonitor(this, this);
    }

    get format(): GPUPlainType | string {
        if ((this.constructor as any).struct as Struct) {
            return (this.constructor as any).struct.name;
        }
        switch (this.arrayStride) {
            case 1: return 'f32';
            case 2: return 'vec2f';
            case 3: return 'vec3f';
            case 4: return 'vec4f';
            case 16: return 'mat4x4f';
            default: return 'f32';
        }
    }

    get arraySize() {
        return this.length / this.arrayStride;
    }

    set(array: ArrayLike<number> | BufferData, offset: number = 0): this {
        if (Array.from(array).some((v => isNaN(v)))) {
            console.error('NaN detected in array', array); // eslint-disable-line no-
            debugger
        }
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

    magnitudeSquared(): number {
        return this.reduce((sum, value) => sum + value ** 2, 0);
    }

    subarray(start: number, end: number): this {
        return new Float32Array(this.buffer, start * 4, end - start) as this;
    }

}