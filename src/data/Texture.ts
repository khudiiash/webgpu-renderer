import { num, uuid } from "@/util/general";
import { ObjectMonitor } from "./ObjectMonitor";
import { Engine } from "@/engine/Engine";

export interface TextureOptions {
    width?: number;
    height?: number;
    depth?: number;
    format?: GPUTextureFormat;
    usage?: number;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUFilterMode;
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    dimension?: GPUTextureDimension;
    invertY?: boolean;
    generateMipmaps?: boolean;
}

export class Texture {
    static DEFAULT_USAGE: number =
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.COPY_DST;
    public width: number = 1;
    public height: number = 1;
    public depth: number = 1;
    public usage: number = Texture.DEFAULT_USAGE;
    public loaded: boolean = false;
    public sampler!: GPUSampler;
    public texture!: GPUTexture;
    public textures: Map<number, GPUTexture> = new Map();
    public id: string = uuid("texture");
    public name: string = "Texture";
    public dimension: GPUTextureDimension = "2d";
    public generateMipmaps: boolean = false;

    public magFilter: GPUFilterMode = "linear";
    public minFilter: GPUFilterMode = "linear";
    public mipmapFilter: GPUFilterMode = "linear";
    public addressModeU: GPUAddressMode = "clamp-to-edge";
    public addressModeV: GPUAddressMode = "clamp-to-edge";
    public addressModeW: GPUAddressMode = "clamp-to-edge";

    protected loadCbs: Function[] = [];
    protected device!: GPUDevice;
    protected format: GPUTextureFormat = "rgba8unorm";

    constructor(options: TextureOptions = {}) {
        const device = Engine.device;
        if (!device) {
            throw new Error("Texture: Invalid device");
        }

        this.width = options.width ?? this.width;
        this.height = options.height ?? this.height;
        this.depth = options.depth ?? this.depth;
        this.device = device;
        this.format = options.format ?? this.format;
        this.usage = options.usage ?? this.usage;

        this.setOptions(options);

        new ObjectMonitor(
            {
                magFilter: this.magFilter,
                minFilter: this.minFilter,
                mipmapFilter: this.mipmapFilter,
                addressModeU: this.addressModeU,
                addressModeV: this.addressModeV,
                addressModeW: this.addressModeW,
            },
            this,
        ).onChange(() => {
            this.updateSampler();
        });

        this.createTexture();
        this.createSampler();
    }

    protected createTexture() {
        this.texture = this.device.createTexture({
            size: {
                width: this.width,
                height: this.height,
                depthOrArrayLayers: this.depth,
            },
            format: this.format,
            usage: this.usage,
            dimension: this.dimension,
        });
        this.textures.set(0, this.texture);
    }

    protected createSampler() {
        this.sampler = this.device.createSampler(this.getSamplerDescriptor());
    }

    setOptions(options: TextureOptions) {
        if (!options) return;
        if (num(options.width)) this.width = options.width as number;

        if (options.magFilter) this.magFilter = options.magFilter;
        if (options.minFilter) this.minFilter = options.minFilter;
        if (options.mipmapFilter) this.mipmapFilter = options.mipmapFilter;
        if (options.addressModeU) this.addressModeU = options.addressModeU;
        if (options.addressModeV) this.addressModeV = options.addressModeV;
        if (options.addressModeW) this.addressModeW = options.addressModeW;
        if (options.dimension) this.dimension = options.dimension;
        if (options.generateMipmaps !== undefined) this.generateMipmaps = options.generateMipmaps;
    }

    getSamplerDescriptor(): GPUSamplerDescriptor {
        return {
            magFilter: this.magFilter,
            minFilter: this.minFilter,
            mipmapFilter: this.mipmapFilter,
            addressModeU: this.addressModeU,
            addressModeV: this.addressModeV,
            addressModeW: this.addressModeW,
        };
    }

    protected updateSampler() {
        if (this.sampler) {
            this.sampler = this.device.createSampler(this.getSamplerDescriptor());
        }
        this.notifyChange();
    }

    onLoaded(callback: Function): this {
        if (typeof callback !== "function") {
            throw new Error("Texture: Invalid onLoaded callback");
        }
        if (!this.loadCbs.includes(callback)) {
            this.loadCbs.push(callback);
        }
        return this;
    }

    offLoaded(callback?: Function): this {
        if (!callback) {
            this.loadCbs = [];
            return this;
        }
        const index = this.loadCbs.indexOf(callback);
        if (index !== -1) {
            this.loadCbs.splice(index, 1);
        }
        return this;
    }

    protected notifyChange() {
        this.loadCbs.forEach((cb) => cb(this));
    }

    setTexture(texture: GPUTexture, index = 0) {
        if (!texture || !(texture instanceof GPUTexture)) {
            throw new Error("Texture: Invalid texture");
        }
        if (index === 0) {
            this.texture = texture;
        }

        this.textures.set(index, texture);
        this.loaded = true;
        this.notifyChange();
    }

    getTexture(index = 0) {
        return this.textures.get(index);
    }

    destroy() {
        this.textures.forEach((texture) => texture.destroy());
        this.textures.clear();
        this.loadCbs = [];
    }
}
