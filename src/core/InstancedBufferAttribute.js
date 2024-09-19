class InstancedBufferAttribute extends BufferAttribute {
    constructor(array, itemSize, normalized, meshPerAttribute = 1) {
        super(array, itemSize, normalized);
        this.isInstancedBufferAttribute = true;
        this.meshPerAttribute = meshPerAttribute;
    }
}

export { InstancedBufferAttribute };