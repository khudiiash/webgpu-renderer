import { BufferData } from "../../data/BufferData";

export function arraysEqual(a: BufferData | Float32Array | ArrayLike<number>, b: BufferData | Float32Array | ArrayLike<number>, precision: number = 1e-6): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (Math.abs(a[i] - b[i]) > precision) return false;
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

export function autobind(context: any) {
    Object.getOwnPropertyNames(Object.getPrototypeOf(context))
        .filter(key => key !== 'constructor' && typeof context[key] === 'function')
        .forEach(key => {
            context[key] = context[key].bind(context);
        });
}
