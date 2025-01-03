class ProxyArray {
    /**
     * @param {Array} array 
     * @param {(target: Array, index: number, value: any) => void} onSet Callback function when array elements are set
     */
    constructor(array, onSet) {
        const handler = {
            set(target, property, value) {
                target[property] = value;
                if (onSet) onSet(target, parseInt(index), value);
                return true;
            }
        };
        return new Proxy(array, handler);
    }
}

export { ProxyArray };