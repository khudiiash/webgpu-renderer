const _f32 = new Float32Array(3);

function normalize(f32array) {
    const min = Math.min(...f32array);
    const max = Math.max(...f32array);
    const range = max - min;
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] = (f32array[i] - min) / range;
    }
    return f32array;
}

function clone(f32array) {
    return f32array.slice();
}

function copy(f32array, f32array2) {
    f32array.set(f32array2);
    return f32array;
}

function sub(f32array, value) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] -= value;
    }
    return f32array;
}

function sub2(f32array, f32array2) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] -= f32array2[i];
    }
    return f32array;
}

function sub2new(f32array, f32array2) {
    const result = new Float32Array(f32array.length);
    for (let i = 0; i < f32array.length; i++) {
        result[i] = f32array[i] - f32array2[i];
    }
    return result;
}

function mul(f32array, value) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] *= value;
    }
    return f32array;
}

function mul2(f32array, f32array2) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] *= f32array2[i];
    }
    return f32array;
}

function add(f32array, value) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] += value;
    }
    
    return f32array;
}

function add2(f32array, f32array2) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] += f32array2[i];
    }
    
    return f32array;
}

function div(f32array, value) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] /= value;
    }
    
    return f32array;
}

function div2(f32array, f32array2) {
    for (let i = 0; i < f32array.length; i++) {
        f32array[i] /= f32array2[i];
    }
    
    return f32array;
}


function min(f32array) {
    return Math.min(...f32array);
}

function max(f32array) {
    return Math.max(...f32array);
}

function cross(f32array, f32array2) {
    const x = f32array[1] * f32array2[2] - f32array[2] * f32array2[1];
    const y = f32array[2] * f32array2[0] - f32array[0] * f32array2[2];
    const z = f32array[0] * f32array2[1] - f32array[1] * f32array2[0];
    f32array[0] = x;
    f32array[1] = y;
    f32array[2] = z;
    return f32array;
}

function dot(f32array, f32array2) {
    let sum = 0;
    for (let i = 0; i < f32array.length; i++) {
        sum += f32array[i] * f32array2[i];
    }
    return sum;
}

function distance(f32array, f32array2) {
    let sum = 0;
    for (let i = 0; i < f32array.length; i++) {
        sum += Math.pow(f32array[i] - f32array2[i], 2);
    }
    return Math.sqrt(sum);
}
function length(f32array) {
    let sum = 0;
    for (let i = 0; i < f32array.length; i++) {
        sum += Math.pow(f32array[i], 2);
    }
    return Math.sqrt(sum);
}

export const f32 = { add, add2, clone, copy, cross, div, div2, dot, max, min, mul, mul2, normalize, sub, sub2, sub2new, distance, length };
