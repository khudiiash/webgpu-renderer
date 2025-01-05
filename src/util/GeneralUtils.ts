import { BufferData } from "../core/data/BufferData";

function arraysEqual(a: BufferData | Float32Array | ArrayLike<number>, b: BufferData | Float32Array | ArrayLike<number>, precision: number = 1e-6): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (Math.abs(a[i] - b[i]) > precision) return false;
    }
    return true;
}

function cleanFloat(value: number): number {
    return Math.round(value * 1e6) / 1e6;
}

function id(key: string = ''): string {
    return key + '_' + Math.random().toString(36).substring(2, 9);
}

export { 
    arraysEqual, 
    cleanFloat, 
    id 
};