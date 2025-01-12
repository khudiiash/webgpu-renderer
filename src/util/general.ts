import { BufferData } from "@/data/BufferData";

function isTypedArray(arr: any): arr is Float32Array | BufferData {
    return arr instanceof Float32Array || arr instanceof BufferData;
}

export function arraysEqual(a: BufferData | Float32Array | ArrayLike<number>, b: BufferData | Float32Array | ArrayLike<number>, precision: number = 1e-6): boolean {
    // Early returns for obvious cases
    if (a === b) return true;
    if (!a || !b) return false;
    
    const len = a.length;
    if (len !== b.length) return false;

    // Fast path for TypedArrays using SIMD-like batch processing
    if (isTypedArray(a) && isTypedArray(b)) {
        // Process 4 elements at a time
        const precisionsVec = new Float32Array(4).fill(precision);
        const len4 = len & ~3; // Round down to multiple of 4
        
        // Main loop - process 4 elements at once
        for (let i = 0; i < len4; i += 4) {
            // Load 4 elements from each array
            const diff0 = Math.abs(a[i] - b[i]);
            const diff1 = Math.abs(a[i + 1] - b[i + 1]);
            const diff2 = Math.abs(a[i + 2] - b[i + 2]);
            const diff3 = Math.abs(a[i + 3] - b[i + 3]);

            // Check all differences in one go
            if ((diff0 > precision) || (diff1 > precision) || 
                (diff2 > precision) || (diff3 > precision)) {
                return false;
            }
        }

        // Handle remaining elements
        for (let i = len4; i < len; i++) {
            if (Math.abs(a[i] - b[i]) > precision) return false;
        }

        return true;
    }

    // Fallback for non-TypedArrays - still optimized
    const aArr = a as ArrayLike<number>;
    const bArr = b as ArrayLike<number>;
    
    // Process elements in batches of 8 for better loop unrolling
    const len8 = len & ~7;
    for (let i = 0; i < len8; i += 8) {
        if (Math.abs(aArr[i] - bArr[i]) > precision ||
            Math.abs(aArr[i + 1] - bArr[i + 1]) > precision ||
            Math.abs(aArr[i + 2] - bArr[i + 2]) > precision ||
            Math.abs(aArr[i + 3] - bArr[i + 3]) > precision ||
            Math.abs(aArr[i + 4] - bArr[i + 4]) > precision ||
            Math.abs(aArr[i + 5] - bArr[i + 5]) > precision ||
            Math.abs(aArr[i + 6] - bArr[i + 6]) > precision ||
            Math.abs(aArr[i + 7] - bArr[i + 7]) > precision) {
            return false;
        }
    }

    // Handle remaining elements
    for (let i = len8; i < len; i++) {
        if (Math.abs(aArr[i] - bArr[i]) > precision) return false;
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