import { Texture } from "@/data/Texture";
import { BufferData } from "@/data/BufferData";
import { UniformData } from "@/data/UniformData";
import { Engine } from "./Engine";

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

type GPUBindGroupEntryConfig = {
    label?: string;
    buffer?: BufferDescription;
    sampler?: {};
    texture?: {};
    storageTexture?: {};
};

type GPUResource = GPUBuffer | GPUTexture | GPUSampler;

type GPUBindGroupEntry = {
    label?: string;
    binding: number;
    resource: { buffer: GPUBuffer, offset?: number, size: number } | GPUTextureView | GPUSampler;
}

type BindGroupConfig = {
    name: string;
    layout: GPUBindGroupLayout;
    items: BindGroupConfigItem[];
};

type BindGroupConfigItem = {
    name: string;
    binding: number;
    dataID: string;
    resource: {
        buffer?: {
            data: ArrayBuffer;
            isGlobal?: boolean;
            size: number;
            type: 'uniform' | 'storage';
            offset?: number;
            access?: 'read' | 'write' | 'read, write';
            usage?: GPUBufferUsageFlags;
        };
        sampler?: {
            type: string;
        };
        texture?: Texture;
    };
};

export class ResourceManager {
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
        this.createDepthTexture('depth', Engine.settings.width, Engine.settings.height);
    }

    getTexture(name: string): GPUTexture | undefined {
        return this.textures.get(name);
    }

    getTextureView(name: string): GPUTextureView | undefined {
        return this.textureViews.get(name);
    }

    createDepthTexture(name: string, width: number, height: number) {
        const texture = this.device.createTexture({
            size: [width, height, 1],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.textures.set(name, texture);
        this.textureViews.set(name, texture.createView());
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
        })
    }

    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor) {
        return this.device.createBindGroupLayout(descriptor);
    }

    getOrCreateBuffer(name: string, description: any, dataID: string) {
        if (this.buffers.has(dataID)) {
            return this.buffers.get(dataID);
        }
        return this.createBuffer(name, description, dataID);
    }

    createBindGroup(config: BindGroupConfig): GPUBindGroup {
        const name = config.name;

        const descriptor: any = { 
            label: name,
            layout: config.layout,
            entries: []
         };

        for (const item of config.items) {
            const resource = item.resource;

            const entry: GPUBindGroupEntry = {
                label: item.name,
                binding: item.binding,
                resource: {} as any
            };
            if (resource.buffer) {
                let buffer = this.createAndUploadBuffer({
                    name: item.name,
                    data: resource.buffer.data,
                    usage: resource.buffer.usage ?? GPUBufferUsage.UNIFORM,
                    id: item.dataID,
                });
                entry.resource = { buffer, offset: resource.buffer.offset || 0, size: resource.buffer.size };
            }
            if (resource.texture) {
                if (resource.texture instanceof Texture) {
                    this.textures.set(resource.texture.id, resource.texture.texture);
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

            descriptor.entries[item.binding] = entry;
        }

        const bindGroup = this.device.createBindGroup(descriptor as GPUBindGroupDescriptor);
        this.bindGroups.set(name, bindGroup);
        this.references.set(name, { refCount: 1, lastUsedFrame: this.currentFrame });
        return bindGroup; 
    }

    createSampler(type: string): GPUSampler {
        if (this.samplers.has(type)) {
            return this.samplers.get(type) as GPUSampler;
        }
        const sampler = this.device.createSampler(JSON.parse(type));
        this.samplers.set(type, sampler);
        return sampler;
    }

    updateBuffer(dataID: string) {
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
            this.references.delete(name);
        }
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
    createAndUploadBuffer({ name, data, usage, id }: {
            name: string;
            data: ArrayBuffer;
            usage: GPUBufferUsageFlags;
            id: string;
        }) {
        if (this.buffers.has(id)) {
            const buffer = this.buffers.get(id) as GPUBuffer;
            this.device.queue.writeBuffer(buffer, 0, data);
            return buffer;
        }
        const buffer = this.device.createBuffer({
            label: name,
            size: data.byteLength,
            usage: usage
        });
        const uniformData = UniformData.getByID(id);
        if (uniformData) {
            uniformData.onChange(() => {
                this.device.queue.writeBuffer(buffer, 0, uniformData.data);
            })
        }
        this.device.queue.writeBuffer(buffer, 0, data);
        this.buffers.set(id, buffer);
        this.bufferDescriptors.set(id, { size: data.byteLength, usage });
        this.references.set(id, { refCount: 1, lastUsedFrame: this.currentFrame });
        return buffer;
    }
    formatSize = (size: number) => {
        if (size === 0) return 0;
        const isB = size < 1024;
        const isKB = size < 1024 * 1024;
        const isMB = size < 1024 * 1024 * 1024;
        if (isB) return size + ' B';
        if (isKB) return (size / 1024).toFixed(2) + ' KB';
        if (isMB) return (size / 1024 / 1024).toFixed(2) + ' MB';
    }

    getResourceStats(): {
        textures: number;
        buffers: number;
        totalMemory: string
    } {
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
            totalMemory: this.formatSize(totalMemory) as string
        }
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
}