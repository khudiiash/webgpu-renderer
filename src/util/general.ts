import { BufferData } from "@/data/BufferData";

function isTypedArray(arr: any): arr is Float32Array | BufferData {
    return arr instanceof Float32Array || arr instanceof BufferData;
}

const weakMap = new WeakMap();

export function arraysEqual(a: BufferData | Float32Array | ArrayLike<number>, b: BufferData | Float32Array | ArrayLike<number>, start: number, end: number): boolean {
    // Early returns for obvious cases
    if (a === b) return true;
    if (!a || !b) return false;
    
    const len = a.length;
    if (len !== b.length) return false;
    if (weakMap.has(a)) {
        const i = weakMap.get(a);
        if (a[i] !== b[i]) {
            return false;
        }
    }

    for (let i = start; i < end; i++) {
        if (a[i] !== b[i]) {
            weakMap.set(a, i);
            return false;
        }
    }

    return true;
}


export function objectsEqual(a: { [key: string]: any }, b: { [key: string]: any }): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (let key in a) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

export function cleanFloat(value: number): number {
    return Math.round(value * 1e6) / 1e6;
}

export function uuid(key: string = ''): string {
    return key + '_' + Math.random().toString(36).substring(2, 9);
}

export function num(...args: any[]): boolean {
    for (let arg of args) {
        if (typeof arg !== 'number' || !Number.isFinite(arg)) {
            return false;
        }
    }
    return true;
}

export function align16(value: number): number {
    return Math.ceil(value / 16) * 16;
}

export function align4(value: number): number {
    return Math.ceil(value / 4) * 4;
}

export function isAlign16(value: number): boolean {
    return value % 16 === 0;
}

export function isAlign4(value: number): boolean {
    return value % 4 === 0;
}

export function autobind(context: any) {
    Object.getOwnPropertyNames(Object.getPrototypeOf(context))
        .filter((key) => {
            const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(context), key);
            return key !== 'constructor' && desc && typeof desc.value === 'function';
        })
        .forEach((key) => {
            context[key] = context[key].bind(context);
        });
}

export function alignArray(array: ArrayLike<number>): Float32Array {
    const len = array.length;
    const aligned = new Float32Array(align4(len));
    aligned.set(array);
    return aligned;
}