import { Texture } from "@/data/Texture";
import { BufferData } from "@/data/BufferData";
import { UniformData } from "@/data/UniformData";
import { EventCallback, EventEmitter } from "@/core/EventEmitter";
import { Shader } from "@/materials/shaders/Shader";
import { Renderable } from "@/renderer/Renderable";
import { BindGroupLayout } from "@/data/BindGroupLayout";
import { autobind } from "@/util/general";

type TextureDescription = {
    label?: string;
    dimension?: '1d' | '2d' | '3d';
    mipLevelCount?: number;
    sampleCount?: 1 | 4;
    format: GPUTextureFormat;
    size: {
        width: number;
        height: number;
        depthOrArrayLayers: number;
    };
    usage: GPUTextureUsageFlags;
};

type BufferDescription = {
    label?: string;
    mappedAtCreation?: boolean;
    size: number;
    usage: GPUBufferUsageFlags;
};

export class ResourceManager extends EventEmitter {

    private static LARGE_BUFFER_THRESHOLD = 1024 * 1024; // 1MB

    static on(event: string, listener: EventCallback, context?: any) {
        ResourceManager.getInstance()?.on(event, listener, context);
    }

    static off(event: string, listener: EventCallback) {
        ResourceManager.getInstance()?.off(event, listener);
    }

    static fire(event: string, data: any) {
        ResourceManager.getInstance()?.fire(event, data);
    }

    static updateBuffer(dataID: string, start?: number, end?: number) {
        ResourceManager.getInstance()?.updateBuffer(dataID, start, end);
    }

    static #instance: ResourceManager;
    private device!: GPUDevice;
    private buffers!: Map<string, GPUBuffer>;
    private bufferDescriptors!: Map<string, any>;
    private textures!: Map<string, GPUTexture>;
    private textureDescriptors!: Map<string, any>;
    private samplers!: Map<string, GPUSampler>;
    private bindGroups!: Map<string, GPUBindGroup>;
    private references!: Map<string, { refCount: number; lastUsedFrame: number }>;
    private currentFrame!: number;

    defaultTexture!: GPUTexture;
    defaultSampler!: GPUSampler;
    textureViews!: Map<string, GPUTextureView>;

    // Staging buffer ring properties
    private stagingBuffers: GPUBuffer[] = [];
    private availableStagingBuffers: GPUBuffer[] = [];
    private mappingStagingBuffers: Set<GPUBuffer> = new Set();

    private stagedBuffers: Set<string> = new Set();

    static init(device: GPUDevice) {
        if (ResourceManager.#instance) {
            console.error('ResourceManager already initialized');
        } else {
            ResourceManager.#instance = new ResourceManager(device);
        }
    }

    static getInstance() {
        return ResourceManager.#instance;
    }

    constructor(device: GPUDevice) {
        if (ResourceManager.#instance) {
            return ResourceManager.#instance;
        }
        super();
        autobind(this);

        this.device = device;
        this.buffers = new Map();
        this.bufferDescriptors = new Map();
        this.textures = new Map();
        this.textureDescriptors = new Map();
        this.textureViews = new Map();
        this.samplers = new Map();
        this.bindGroups = new Map();
        this.references = new Map();
        this.currentFrame = 0;
        this.createDefaultTexture();
        this.createDefaultSampler();

        // Initialize the staging buffers
        for (let i = 0; i < 3; i++) {
            const buffer = this.device.createBuffer({
                size: ResourceManager.LARGE_BUFFER_THRESHOLD, // Adjust size as needed
                usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
                mappedAtCreation: true,
            });
            this.stagingBuffers.push(buffer);
            this.availableStagingBuffers.push(buffer);
        }
    }

    getTexture(name: string): GPUTexture | undefined {
        return this.textures.get(name);
    }

    getTextureView(name: string): GPUTextureView | undefined {
        return this.textureViews.get(name);
    }

    createDepthTexture(name: string, width: number, height: number) {
        if (this.textures.has(name)) {
            this.destroyTexture(name);
        }
        const texture = this.device.createTexture({
            size: [width, height, 1],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.textures.set(name, texture);
        this.textureViews.set(name, texture.createView());
    }

    destroyTexture(name: string) {
        const texture = this.textures.get(name);
        if (texture) {
            texture.destroy();
            this.textures.delete(name);
            this.textureViews.delete(name);
        }
    }

    /**
     * 
     * @param {string} name 
     * @param {TextureDescription} description 
     * @returns {GPUTexture}
     */
    createTexture(name: string, description: TextureDescription): GPUTexture {
        const texture = this.device.createTexture(description);
        this.textures.set(name, texture);
        this.textureDescriptors.set(name, description);
        this.references.set(name, { refCount: 1, lastUsedFrame: this.currentFrame });
        return texture;
    }

    createDefaultSampler() {
        this.defaultSampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            addressModeW: 'repeat',
        });
    }

    /**
     * 
     * @param {string} name 
     * @param {BufferDescription} description 
     * @returns 
     */
    createBuffer(name: string, description: BufferDescription, dataID: string) {
        const buffer = this.device.createBuffer({ 
            label: name,
            size: description.size,
            usage: description.usage,
        });
        this.buffers.set(dataID, buffer);
        this.bufferDescriptors.set(dataID, description);
        this.references.set(name, { refCount: 1, lastUsedFrame: this.currentFrame });
        return buffer;
    }

    getTypeSize(type: string) {
        switch (type) {
            case 'f32':
            case 'i32':
            case 'u32':
                return 4;
            case 'vec2f':
                return 8;
            case 'vec3f':
                return 12;
            case 'vec4f':
                return 16;
            case 'mat2x2f':
                return 16;
            case 'mat3x3f':
                return 36;
            case 'mat4x4f':
                return 64;
            default:
                return 0;
        }
    }

    createVertexBuffer(name: string, data: BufferData, dataID: string) {
        return this.createAndUploadBuffer({
            name,
            data,
            usage: GPUBufferUsage.VERTEX,
            id: dataID
        });
    }

    getOrCreateBuffer(name: string, description: BufferDescription, dataID: string): GPUBuffer {
        if (this.buffers.has(dataID)) {
            return this.buffers.get(dataID) as GPUBuffer;
        }
        return this.createBuffer(name, description, dataID);
    }

    createBindGroups(shader: Shader, renderable?: Renderable): GPUBindGroup[] {
        const layouts = shader.layouts;
        const bindGroups: GPUBindGroup[] = [];
        for (const layout of layouts) {
            bindGroups.push(this.createBindGroup(layout, renderable));
        }

        return bindGroups;
    }

    rebuildBindGroups(shader: Shader, renderable?: Renderable) {
        this.createBindGroups(shader, renderable);
    }

    createBindGroup(layout: BindGroupLayout, renderable?: Renderable): GPUBindGroup {
        const name = layout.name;

        const descriptor: any = { 
            label: name,
            layout: layout.layout,
            entries: []
        };

        if (layout.isGlobal) {
            for (const binding of layout.bindings) {
                const data = UniformData.getByName(binding.description.bindingName);
                if (data) {
                    const dataID = data.id;
                    const buffer = this.createAndUploadBuffer({ 
                        name: binding.description.bindingName,
                        data: data.getBuffer(),
                        usage: data.getBufferUsage(),
                        id: dataID
                    });
                    data.offChange(this.updateBuffer);
                    data.onChange(this.updateBuffer);
                    descriptor.entries.push(binding.getBindGroupEntry(buffer));
                }

            }
        }
        if (layout.isMesh) {
            for (const binding of layout.bindings) {
                const data = renderable?.mesh.uniforms.get(binding.description.bindingName);
                if (data) {
                    const dataID = data.id;
                    const buffer = this.createAndUploadBuffer({
                        name: binding.description.bindingName,
                        data: data.getBuffer(),
                        usage: data.getBufferUsage(),
                        id: dataID
                    });
                    data.offChange(this.updateBuffer);
                    data.onChange(this.updateBuffer);
                    descriptor.entries.push(binding.getBindGroupEntry(buffer));
                }
            }
        }

        if (layout.isMaterial) {
            const data = renderable?.material.uniforms.get(layout.name)!;
            const samplers: Array<GPUSampler> = [];
            const samplersIterator = samplers[Symbol.iterator]();
            for (const binding of layout.bindings) {
                if (binding.isBuffer) {
                    const dataID = data.id;
                    const buffer = this.createAndUploadBuffer({
                        name: binding.description.bindingName,
                        data: data.getBuffer(),
                        usage: data.getBufferUsage(),
                        id: dataID
                    });
                    descriptor.entries.push(binding.getBindGroupEntry(buffer));
                }
                if (binding.isTexture) {
                    const texture = data.getTexture(binding.description.varName) as Texture;
                    descriptor.entries.push(binding.getBindGroupEntry(texture.texture));
                    samplers.push(this.getOrCreateSampler(texture.getSamplerDescriptor()));
                }
                if (binding.isSampler) {
                    const sampler = samplersIterator.next().value as GPUSampler;
                    descriptor.entries.push(binding.getBindGroupEntry(sampler));
                }
            }
        }


        const bindGroup = this.device.createBindGroup(descriptor as GPUBindGroupDescriptor);
        this.bindGroups.set(name, bindGroup);
        this.references.set(name, { refCount: 1, lastUsedFrame: this.currentFrame });
        return bindGroup; 
    }

    getOrCreateSampler(descriptor: GPUSamplerDescriptor): GPUSampler {
        const hash = JSON.stringify(descriptor);
        if (this.samplers.has(hash)) {
            return this.samplers.get(hash) as GPUSampler;
        }
        const sampler = this.device.createSampler(descriptor);
        this.samplers.set(hash, sampler);
        this.references.set(hash, { refCount: 1, lastUsedFrame: this.currentFrame });
        return sampler;
    }

    /**
     * @param {string} name 
     */
    markResourceUsed(name: string): void {
        const ref = this.references.get(name);
        if (ref) {
            ref.lastUsedFrame = this.currentFrame;
        }
    }

    releaseResource(name: string): void {
        const ref = this.references.get(name);
        if (!ref) return;

        ref.refCount--;
        if (ref.refCount <= 0) {
            // Destroy the resource
            if (this.textures.has(name)) {
                const texture = this.textures.get(name);
                if (texture) {
                    texture.destroy();
                    this.textures.delete(name);
                    this.textureDescriptors.delete(name);
                }
            }
            if (this.buffers.has(name)) {
                const buffer = this.buffers.get(name);
                if (buffer) {
                    buffer.destroy();
                    this.buffers.delete(name);
                    this.bufferDescriptors.delete(name);
                }
            }
            this.references.delete(name);
        }
    }

    beginFrame() {
        this.currentFrame++;
        this.cleanupUnusedResources();
    }

    createDefaultTexture() {
        this.defaultTexture = this.device.createTexture({
            size: { width: 1, height: 1, depthOrArrayLayers: 1 },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING
        });
    }

    /**
     * @param {TextureDescription} description 
     * @returns {GPUTexture}
     */
    getTemporaryTexture(description: TextureDescription): GPUTexture {
        const tempName = `temp_${this.currentFrame}_${Math.random()}`;
        return this.createTexture(tempName, description);
    }

    /**
     * @param {{
     *    name: string,
     *    data: ArrayBuffer,
     *    usage: GPUBufferUsageFlags,
     *    id: string
     * }} description
     */
    createAndUploadBuffer({ name, data, usage, id }: { name: string; data: ArrayBuffer; usage: GPUBufferUsageFlags; id: string; }) {
        if (this.buffers.has(id)) {
            const buffer = this.buffers.get(id) as GPUBuffer;
            return buffer;
        }
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: usage | GPUBufferUsage.COPY_DST
        });
        const uniformData = UniformData.getByID(id);
        if (uniformData) {
            uniformData.onChange((id, start, end) => {
                this.updateBuffer(id, start, end);
            });
        }
        this.device.queue.writeBuffer(buffer, 0, data);
        this.buffers.set(id, buffer);
        this.bufferDescriptors.set(id, { size: data.byteLength, usage });
        this.references.set(id, { refCount: 1, lastUsedFrame: this.currentFrame });

        if (data.byteLength >= ResourceManager.LARGE_BUFFER_THRESHOLD) {
            this.stagedBuffers.add(id);
        }

        return buffer;
    }

    formatSize = (size: number) => {
        if (size === 0) return '0 B';
        const isB = size < 1024;
        const isKB = size < 1024 * 1024;
        const isMB = size < 1024 * 1024 * 1024;
        if (isB) return size + ' B';
        if (isKB) return (size / 1024).toFixed(2) + ' KB';
        if (isMB) return (size / 1024 / 1024).toFixed(2) + ' MB';
        return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    }

    getResourceStats(): {
        textures: number;
        buffers: number;
        totalMemory: string;
    } {
        let totalMemory = 0; 

        for (const [_, desc] of this.textureDescriptors) {
            const size = desc.size;
            const bytesPerPixel = this.getFormatSize(desc.format);
            totalMemory += size.width * size.height * size.depthOrArrayLayers * bytesPerPixel;
        }

        for (const [_, desc] of this.bufferDescriptors) {
            totalMemory += desc.size;
        }

        return {
            textures: this.textures.size,
            buffers: this.buffers.size,
            totalMemory: this.formatSize(totalMemory) as string
        };
    }

    getFormatSize(format: GPUTextureFormat): number {
        switch (format) {
            case 'rgba8unorm':
            case 'rgba8sint':
            case 'rgba8uint':
                return 4;
            case 'rg11b10ufloat':
                return 4;
            case 'rgba16float':
                return 8;
            case 'rgba32float':
                return 16;
            default:
                return 4;
        }
    }

    async updateBuffer(dataID: string, start?: number, end?: number) {
        const buffer = this.buffers.get(dataID);
        if (!buffer) return;

        const uniformData = UniformData.getByID(dataID);
        if (!uniformData) return;

        if (uniformData.getBuffer().byteLength >= ResourceManager.LARGE_BUFFER_THRESHOLD) {
            await this.updateBufferStaged(dataID, uniformData.getBuffer(), start, end);
        } else {
            // Small buffer - use direct write
            if (start !== undefined && end !== undefined) {
                this.device.queue.writeBuffer(
                    buffer,
                    start * 4,
                    uniformData.getBuffer(),
                    start * 4,
                    (end - start) * 4
                );
            } else {
                this.device.queue.writeBuffer(buffer, 0, uniformData.getBuffer());
            }
        }
    }

    private async updateBufferStaged(dataID: string, data: ArrayBuffer, start?: number, end?: number) {
        const targetBuffer = this.buffers.get(dataID)!;
        let stagingBuffer: GPUBuffer | undefined;

        // Try to get an available staging buffer
        if (this.availableStagingBuffers.length > 0) {
            stagingBuffer = this.availableStagingBuffers.pop()!;
        } else {
            // If none are available, create a new one with mappedAtCreation: true
            stagingBuffer = this.device.createBuffer({
                size: Math.max(ResourceManager.LARGE_BUFFER_THRESHOLD, data.byteLength),
                usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
                mappedAtCreation: true,
            });
            this.stagingBuffers.push(stagingBuffer);
        }

        // Access the mapped range
        const arrayBuffer = stagingBuffer.getMappedRange();

        // Calculate the region to update
        const updateStart = start !== undefined ? start * 4 : 0;
        const updateEnd = end !== undefined ? end * 4 : data.byteLength;
        const updateSize = updateEnd - updateStart;

        // Copy data into the mapped staging buffer
        new Uint8Array(arrayBuffer).set(new Uint8Array(data, updateStart, updateSize));

        // Unmap the buffer so it can be used in copyBufferToBuffer
        stagingBuffer.unmap();

        // Schedule the copy command
        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(
            stagingBuffer, 0,
            targetBuffer, updateStart,
            updateSize
        );
        this.device.queue.submit([commandEncoder.finish()]);

        // Immediately start mapping the buffer again
        this.mappingStagingBuffers.add(stagingBuffer);
        stagingBuffer.mapAsync(GPUMapMode.WRITE).then(() => {
            this.mappingStagingBuffers.delete(stagingBuffer);
            this.availableStagingBuffers.push(stagingBuffer);
        }).catch((error) => {
            console.error('Error mapping staging buffer:', error);
            // Handle error, possibly destroy the buffer
        });

        // No need to await here, as we're not depending on the mapping to complete before proceeding
    }

    // Cleanup unused resources and manage staging buffers if needed
    cleanupUnusedResources(maxUnusedFrames = 60) {
        for (const [name, ref] of this.references.entries()) {
            if (this.currentFrame - ref.lastUsedFrame > maxUnusedFrames) {
                this.releaseResource(name);
            }
        }
        // Optionally, clean up staging buffers if they exceed a certain amount
        if (this.stagingBuffers.length > 10) {
            // For example, keep only 5 staging buffers
            const excessBuffers = this.stagingBuffers.splice(5);
            for (const buffer of excessBuffers) {
                buffer.destroy();
                this.availableStagingBuffers = this.availableStagingBuffers.filter(b => b !== buffer);
                this.mappingStagingBuffers.delete(buffer);
            }
        }
    }
}