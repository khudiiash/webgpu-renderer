import { uuid } from "@/util/general";
import { ObjectMonitor } from "./ObjectMonitor";

export class Texture {
    public width: number = 0;
    public height: number = 0;
    public loaded: boolean = false;
    public sampler!: GPUSampler;
    public texture!: GPUTexture;
    public id: string = uuid('texture');
    public name: string = 'Texture';

    public magFilter: 'linear' | 'nearest' = 'linear';
    public minFilter: 'linear' | 'nearest' = 'linear';
    public mipmapFilter: 'linear' | 'nearest' = 'linear';
    public addressModeU!: GPUAddressMode;
    public addressModeV!: GPUAddressMode;
    public addressModeW!: GPUAddressMode;

    private loadCbs: Function[] = []
    public device: GPUDevice;

    constructor(device: GPUDevice, width: number = 1, height = 1, usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT, format = 'rgba8unorm' as GPUTextureFormat) {
        this.width = width;
        this.height = height;
        this.device = device;

        new ObjectMonitor({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        }, this).onChange(() => {
            this.notifyChange();
        })

        this.texture = device.createTexture({
            size: { width: this.width, height: this.height },
            format,
            usage: usage,
        });
    }

    getSamplerDescriptor(): GPUSamplerDescriptor {
        return {
            magFilter: this.magFilter,
            minFilter: this.minFilter,
            mipmapFilter: this.mipmapFilter,
            addressModeU: this.addressModeU,
            addressModeV: this.addressModeV,
            addressModeW: this.addressModeW,
        }
    }

    createView(): GPUTextureView {
        return this.texture?.createView();
    }

    onLoaded(callback: Function) {
        if (typeof callback !== 'function') {
            console.error('Texture: Invalid onLoaded callback')
            return;
        }
        if (this.loadCbs.includes(callback)) {
            console.warn('Texture: load callback already added');
            return;
        }

        this.loadCbs.push(callback);
    }

    offLoaded(callback: Function) {
        const index = this.loadCbs.indexOf(callback);
        if (index === -1) {
            console.warn('Texture: load callback not found');
            return;
        }
        this.loadCbs.splice(this.loadCbs.indexOf(callback), 1);
    }

    notifyChange() {
        this.loadCbs.forEach(cb => cb(this.texture));
    }

    setTexture(texture: GPUTexture) {
        if (!texture || !(texture instanceof GPUTexture)) {
            console.error('Texture: Invalid texture');
            return;
        }
        this.texture = texture;
        this.notifyChange();
    }
}