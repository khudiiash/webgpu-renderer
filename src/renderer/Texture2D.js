export class Texture2D {
    constructor(device, width, height, format = 'rgba8unorm', usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT) {
        this.device = device;
        this.width = width;
        this.height = height;
        this.format = format;
        this.usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT; //usage;

        this.texture = this.device.createTexture({
            size: { width: this.width, height: this.height },
            format: this.format,
            usage: this.usage,
        });

        this.view = this.texture.createView();
        this.createSampler();
    }

    // Create a default sampler for this texture
    createSampler() {
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });
    }

    // Set the texture as a bind group resource
    createBindGroupLayout(bindGroupLayout) {
        return this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.view,
                },
                {
                    binding: 1,
                    resource: this.sampler,
                },
            ],
        });
    }

    // Update the texture with image data (image or raw data)
    updateWithImageData(imageData) {
        this.device.queue.writeTexture(
            { texture: this.texture },
            imageData,
            { bytesPerRow: this.width * 4 },
            { width: this.width, height: this.height }
        );
    }

    // Destroy the texture
    destroy() {
        this.texture?.destroy();
    }
}