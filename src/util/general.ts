import { BufferData } from "@/data/BufferData";


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

export function snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function capCase(str: string): string {
    return str.replace(/_./g, (match) => match.charAt(1).toUpperCase());
}

export function camelCase(str: string): string {
    return str.replace(/_./g, (match) => match.charAt(1).toUpperCase());
}

export function boolToNum(value: any, defaultValue: number = 0): number {
    if (value === undefined) {
        return defaultValue;
    }
    return value === true ? 1 : 0;
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
        .filter((key) => {
            const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(context), key);
            return key !== 'constructor' && desc && typeof desc.value === 'function';
        })
        .forEach((key) => {
            context[key] = context[key].bind(context);
        });
}

export function capString(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

