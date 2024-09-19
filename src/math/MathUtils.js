let _seed = 1234567;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
    return start + t * (end - start);
}

function inverseLerp(start, end, value) {
    return (value - start) / (end - start);
}

function map(value, start1, end1, start2, end2) {
    return lerp(start2, end2, inverseLerp(start1, end1, value));
}

function smoothStep(start, end, t) {
    return lerp(start, end, t * t * (3 - 2 * t));
}

function smootherStep(start, end, t) {
    return lerp(start, end, t * t * t * (t * (t * 6 - 15) + 10));
}

function seedRandom(seed) {
    if ( s !== undefined ) _seed = s;
    let t = _seed += 0x6D2B79F5;

    t = Math.imul( t ^ t >>> 15, t | 1 );

    t ^= t + Math.imul( t ^ t >>> 7, t | 61 );

    return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;
}

function normalize(value, array) {
    switch (array.constructor) {
        case Float32Array:
            return value;

        case Uint32Array:
            return Math.round( value * 4294967295.0 );

        case Uint16Array:
            return Math.round( value * 65535.0 );

        case Uint8Array:
            return Math.round( value * 255.0 );

        case Int32Array:
            return Math.round( value * 2147483647.0 );

        case Int16Array:
            return Math.round( value * 32767.0 );

        case Int8Array:
            return Math.round( value * 127.0 );

        default:
            throw new Error( 'Invalid component type.' );
    }
}

function denormalize(value, array) {
    switch ( array.constructor ) {
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
            throw new Error( 'Invalid component type.' );
    }
}

function fract(value) {
    return value - Math.floor(value);
}

function mod(value, n) {
    return ((value % n) + n) % n;
}

function modMinMax(value, min, max) {
    return mod(value - min, max - min) + min;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}




export {
    DEG2RAD,
    RAD2DEG,
    randomFloat, 
    randomInt, 
    generateID, 
    clamp, 
    lerp, 
    inverseLerp, 
    map, 
    smoothStep, 
    smootherStep, 
    seedRandom, 
    normalize, 
    denormalize, 
    fract, 
    mod, 
    modMinMax,
    isPowerOf2
};