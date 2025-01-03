import { UniformData } from "./UniformData.js";
import { Texture } from "../../loaders/TextureLoader.js";

/**
 * @typedef {{
 *   label?: string,
 *   dimension?: '1d' | '2d' | '3d',
 *   mipLevelCount?: number,
 *   sampleCount?: 1 | 4,
 *   format: GPUTextureFormat,
 *   size: {
 *      width: number,    
 *      height: number,
 *      depthOrArrayLayers: number
 *   }
 *   usage: GPUTextureUsageFlags
 * }} TextureDescription
 * 
 * @typedef {{
 *  label?: string,
 *  mappedAtCreation?: boolean,
 *  size: number,
 *  usage: GPUBufferUsage,
 * }} BufferDescription
 * 
 * @typedef {{
 *   label?: string,
 *   buffer?: BufferDescription,
 *   sampler?: {},
 *   texture?: {},
 *   storageTexture?: {},
 * }} GPUBindGroupEntry
 * 
 * 
 * @typedef {{
 *    name: string,
 *    layout: GPUBindGroupLayout,
 *    items: BindGroupConfigItem[],
 * }} BindGroupConfig
 * 
 * @typedef {{
 *    name: string,
 *    binding: number,
 *    dataID: string,
 *    resource: {
 *     buffer?: {
 *       data: ArrayBuffer,
 *       isGlobal?: boolean,
 *       size: number,
 *       type: 'uniform' | 'storage',
 *       offset?: number,
 *       access?: 'read' | 'write' | 'read, write',
 *       usage?: GPUBufferUsageFlags,
 *     }
 *     sampler?: {
 *       type: string
 *     },
 *     texture?: Texture,
 *    },
 * }} BindGroupConfigItem
 */

class GPUResourceManager {
    static #instance = null;

    static getInstance() {
        return GPUResourceManager.#instance;
    }
    constructor(device) {
        if (GPUResourceManager.#instance) {
            return GPUResourceManager.#instance;
        }

        this.device = device;
        this.buffers = new Map();
        this.bufferDescriptors = new Map();
        this.textures = new Map();
        this.textureDescriptors = new Map();
        this.samplers = new Map();
        this.bindGroups = new Map();
        this.references = new Map();
        this.currentFrame = 0;
        this.createDefaultTexture();
        this.createDefaultSampler();
        GPUResourceManager.#instance = this;
    }

    /**
     * 
     * @param {string} name 
     * @param {TextureDescription} description 
     * @returns {GPUTexture}
     */
    createTexture(name, description) {
        if (this.textures.has(name)) {
            this.references.get(name).refCount++;
            return this.textures.get(name);
        }

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
    createBuffer(name, description, dataID) {
        if (this.buffers.has(dataID)) {
            this.references.get(dataID).refCount++;
            return this.buffers.get(dataID);
        }

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

    getTypeSize(type) {
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

    createVertexBuffer(name, data) {
        return this.createBuffer(name, {
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    }

    createBindGroupLayout(descriptor) {
        return this.device.createBindGroupLayout(descriptor);
    }

    getOrCreateBuffer(name, description, dataID) {
        if (this.buffers.has(dataID)) {
            return this.buffers.get(dataID);
        }
        return this.createBuffer(name, description, dataID);
    }

    /**
     * @param {BindGroupConfig} config 
     * @returns {GPUBindGroup}
     */
    createBindGroup(config) {
        const name = config.name;

        /**
         * @type {GPUBindGroupDescriptor}
         */
        const descriptor = { 
            label: name,
            layout: config.layout,
            entries: []
         };

        for (const item of config.items) {
            const resource = item.resource;

            const entry = {
                label: item.name,
                binding: item.binding,
            };
            if (resource.buffer) {
                let buffer = this.createAndUploadBuffer({
                    name: item.name,
                    data: resource.buffer.data,
                    usage: resource.buffer.usage,
                    id: item.dataID,
                });
                entry.resource = { buffer, offset: resource.buffer.offset || 0, size: resource.buffer.size };
            }
            if (resource.texture) {
                if (resource.texture instanceof Texture) {
                    this.textures.set(resource.texture.label, resource.texture);
                    const view = resource.texture.createView();
                    entry.resource = view ?? this.defaultTexture.createView();
                } 
            }
            if (resource.sampler) {
                let sampler = resource.sampler.type ? 
                    this.createSampler(resource.sampler.type) :
                    this.defaultSampler;

                entry.resource = sampler;
            }

            descriptor.entries.push(entry);
        }

        const bindGroup = this.device.createBindGroup(descriptor);
        this.bindGroups.set(name, bindGroup);
        this.references.set(name, { refCount: 1, lastUsedFrame: this.currentFrame });
        return bindGroup; 
    }

    createSampler(type) {
        if (this.samplers.has(type)) {
            return this.samplers.get(type);
        }
        const sampler = this.device.createSampler(JSON.parse(type));
        this.samplers.set(type, sampler);
        return sampler;
    }

    updateBuffer(dataID) {
        const buffer = this.buffers.get(dataID);
        if (!buffer) {
            console.error(`Buffer ${dataID} does not exist`);
            return;
        }

        const uniformData = UniformData.getByID(dataID);
        if (!uniformData) {
            console.error(`UniformData ${dataID} does not exist`);
            return;
        }

        this.device.queue.writeBuffer(buffer, 0, uniformData.data);
    }
    
    /**
     * @param {string} name 
     */
    markResourceUsed(name) {
        const ref = this.references.get(name);
        if (ref) {
            ref.lastUsedFrame = this.currentFrame;
        }
    }

    /**
     * @param {string} name 
     */
    releaseResource(name) {
        const ref = this.references.get(name);
        if (!ref) return;

        ref.refCount--;
        if (ref.refCount <= 0) {
            // Destroy the resource
            if (this.textures.has(name)) {
                this.textures.get(name).destroy();
                this.textures.delete(name);
                this.textureDescriptors.delete(name);
            }
            if (this.buffers.has(name)) {
                this.buffers.get(name).destroy();
                this.buffers.delete(name);
                this.bufferDescriptors.delete(name);
            }
            this.references.delete(name);
        }
    }

    beginFrame() {
        this.currentFrame++;
        this.cleanupUnusedResources();
    }

    cleanupUnusedResources(maxUnusedFrames = 60) {
        for (const [name, ref] of this.references.entries()) {
            if (this.currentFrame - ref.lastUsedFrame > maxUnusedFrames) {
                this.releaseResource(name);
            }
        }
    }

    createDefaultTexture() {
        this.defaultTexture = this.device.createTexture({
            size: { width: 1, height: 1, depthOrArrayLayers: 1 },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING
        });
    }

    /**
     * 
     * @param {TextureDescription} description 
     * @returns {GPUTexture}
     */
    getTemporaryTexture(description) {
        const tempName = `temp_${this.currentFrame}_${Math.random()}`;
        return this.createTexture(tempName, description);
    }

    createRenderTarget(name, width, height, format) {
        return this.createTexture(name, {
            size: { width, height, depthOrArrayLayers: 1 },
            format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        })
    }

    /**
     * @param {{
     *    name: string,
     *    data: ArrayBuffer,
     *    usage: GPUBufferUsageFlags,
     *    id: string
     * }} description
     */
    createAndUploadBuffer({ name, data, usage, id }) {
        if (this.buffers.has(id)) {
            const buffer = this.buffers.get(id);
            this.device.queue.writeBuffer(buffer, 0, data);
            return buffer;
        }
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: usage
        });
        this.device.queue.writeBuffer(buffer, 0, data);
        this.buffers.set(id, buffer);
        this.references.set(id, { refCount: 1, lastUsedFrame: this.currentFrame });
        return buffer;
    }
    /**
     *  @returns {{
     *    textures: number,
     *    buffers: number,
     *    totalMemory: number
     * }}
     */
    getResourceStats() {
        let totalMemory = 0; 

        for (const [_, desc] of this.textureDescriptors) {
            const size = desc.size;
            const bytesPerPixel = this.getFormatSize(desc.format);
            totalMemory += size.width * size.height * size.depthOrArrayLeyers * bytesPerPixel;
        }

        for (const [_, desc] of this.bufferDescriptors) {
            totalMemory += desc.size;
        }

        return {
            textures: this.textures.size,
            buffers: this.buffers.size,
            totalMemory
        }
    }

    /**
     * 
     * @param {GPUTextureFormat} format 
     * @returns {number}
     */
    getFormatSize(format) {
        // Simplified format size calculation
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
                return 4; // Default assumption
        }
    }
}

export { GPUResourceManager };