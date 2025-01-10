import { arraysEqual } from '@/util/general';
import { DataMonitor } from './DataMonitor';

export type ChangeCallback = (instance: any, data: BufferData) => void;

export class BufferData extends Float32Array {
    [index: number]: number;
    monitor!: DataMonitor;

    onChange(callback: ChangeCallback): this { return this; }
    offChange(callback?: ChangeCallback): this { return this; }

    constructor(arg: ArrayLike<number> | ArrayBuffer | number) {
        if (typeof arg === 'number') {
            super(arg);
        } else {
            super(arg);
        }
        this.monitor = new DataMonitor(this, this);
    }

    set(array: ArrayLike<number> | BufferData, offset: number = 0): this {
        super.set(array, offset);
        this.monitor.check();
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

    equals(data: BufferData, precision: number = 1e-6): boolean {
        return arraysEqual(this, data, precision);
    }

    fromArray(array: ArrayLike<number> | BufferData, offset: number = 0): this {
        return this.set(array, offset);
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