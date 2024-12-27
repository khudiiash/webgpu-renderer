// UniformBuffer.js
class UniformBuffer {
    constructor(device, layout) {
        this.device = device;
        this.layout = layout;
        this.size = layout.size;
        this.createBuffer();
    }


    createBuffer() {
        this.buffer = this.device.createBuffer({
            size: this.size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true // Add mappedAtCreation
        });
        this.mappedRange = this.buffer.getMappedRange();
        this.data = new Float32Array(this.mappedRange); // Create Float32Array view
    }

    async mapAsync(mode) {
        await this.buffer.mapAsync(mode);
        this.mappedRange = this.buffer.getMappedRange();
        this.data = new Float32Array(this.mappedRange); // Update the view after mapping
    }

    getMappedRange() {
        return this.mappedRange;
    }

    unmap() {
        this.buffer.unmap();
    }

    write(data) {
        this.data.set(data);
    }
    // Update uniform buffer data
    update(data) {
        const range = this.buffer.getMappedRange();
        new Float32Array(range).set(data);
        this.buffer.unmap();
    }

    // Get the buffer for binding to a pipeline
    getBuffer() {
        return this.buffer;
    }

    // Destroy the buffer when no longer needed
    destroy() {
        this.buffer?.destroy();
    }
}

export { UniformBuffer };