// StagingBuffer.js
class StagingBuffer {
    constructor(device, layout, label) {
        this.device = device;
        this.layout = layout;
        this.size = layout.size;
        this.buffer = null; // Initialize to null
        this.mappedRange = null;
        this.data = null;
        this.label = label
        this.createBuffer();
    }

    createBuffer() {
        this.buffer = this.device.createBuffer({
            label: this.label,
            size: this.size,
            usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
        });
    }

    async mapAsync(mode) {
        await this.buffer.mapAsync(mode);
        this.mappedRange = this.buffer.getMappedRange();
        this.data = new Float32Array(this.mappedRange); // Create or update the view
    }

    unmap() {
        this.buffer.unmap();
        this.mappedRange = null;
        this.data = null; // Important: Clear the view
    }

    write(data) {
        if (!this.data) {
            console.error("Buffer is not mapped. Call mapAsync first.");
            return;
        }
        this.data.set(data);
    }

    async update(data) {
        if (this.mapPending) {
            await this.mapPending; // Wait for any pending map operations
        }

        this.mapPending = this.buffer.mapAsync(GPUMapMode.WRITE);
        await this.mapPending;
        this.mappedRange = this.buffer.getMappedRange();
        this.data = new Float32Array(this.mappedRange);

        this.write(data);
        this.buffer.unmap();
                this.mapPending = null;
    }

    getBuffer() {
        return this.buffer;
    }

    destroy() {
        this.buffer?.destroy();
        this.buffer = null; // Important: Clear the reference
        this.mappedRange = null;
        this.data = null;
    }
}

export { StagingBuffer };