let _seed = 1234567;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function clamp(value: number, min: number = 0, max: number = 1): number {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
    return start + t * (end - start);
}

export function inverseLerp(start: number, end: number, value: number): number {
    return (value - start) / (end - start);
}

export function map(value: number, start1: number, end1: number, start2: number, end2: number): number {
    return lerp(start2, end2, inverseLerp(start1, end1, value));
}

export function smoothStep(start: number, end: number, t: number): number {
    return lerp(start, end, t * t * (3 - 2 * t));
}

export function smootherStep(start: number, end: number, t: number): number {
    return lerp(start, end, t * t * t * (t * (t * 6 - 15) + 10));
}

export function seedRandom(s?: number): number {
    if (s !== undefined) _seed = s;
    let t = _seed += 0x6D2B79F5;

    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);

    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

export function distance(x1: number, y1: number,  x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(value: number, array: Float32Array | Uint32Array | Uint16Array | Uint8Array | Int32Array | Int16Array | Int8Array): number {
    switch (array.constructor) {
        case Float32Array:
            return value;

        case Uint32Array:
            return Math.round(value * 4294967295.0);

        case Uint16Array:
            return Math.round(value * 65535.0);

        case Uint8Array:
            return Math.round(value * 255.0);

        case Int32Array:
            return Math.round(value * 2147483647.0);

        case Int16Array:
            return Math.round(value * 32767.0);

        case Int8Array:
            return Math.round(value * 127.0);

        default:
            throw new Error('Invalid component type.');
    }
}

export function denormalize(value: number, array: Float32Array | Uint32Array | Uint16Array | Uint8Array | Int32Array | Int16Array | Int8Array): number {
    switch (array.constructor) {
        case Float32Array:
            return value;

        case Uint32Array:
            return value / 4294967295.0;

        case Uint16Array:
            return value / 65535.0;

        case Uint8Array:
            return value / 255.0;

        case Int32Array:
            return value / 2147483647.0;

        case Int16Array:
            return value / 32767.0;

        case Int8Array:
            return value / 127.0;

        default:
            throw new Error('Invalid component type.');
    }
}

export function fract(value: number): number {
    return value - Math.floor(value);
}

export function mod(value: number, n: number): number {
    return ((value % n) + n) % n;
}

export function modMinMax(value: number, min: number, max: number): number {
    return mod(value - min, max - min) + min;
}

export function isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0 && value !== 0;
}
