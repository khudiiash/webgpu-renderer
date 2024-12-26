export class UniformBuffer {
    constructor(device, size) {
        this.device = device;
        this.size = size;
        
        // Create the buffer
        this.buffer = this.device.createBuffer({
            size: this.size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });

        // Map the buffer to write data
        this.mapData = new Float32Array(this.buffer.getMappedRange());
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
