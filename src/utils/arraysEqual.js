function arraysEqual(a, b, aOffset = 0, bOffset = 0) {
    if (!a || !b) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[aOffset + i] !== b[bOffset + i]) {
            return false;
        }
    }
    return true;
}

if (typeof window !== 'undefined') {
    window.arraysEqual = arraysEqual;
}

export { arraysEqual };