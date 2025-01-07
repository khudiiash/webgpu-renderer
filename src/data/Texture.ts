import { uuid } from "@/util";

export class Texture {
    public width: number = 0;
    public height: number = 0;
    public loaded: boolean = false;
    public resource!: GPUTexture;
    public samplerType!: string
    private loadCbs: Function[] = []
    public id: string = uuid('texture');
    public name: string = 'Texture';

    constructor() {

    }

    createView(): GPUTextureView {
        return this.resource?.createView();
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

    setResource(resource: GPUTexture) {
        this.resource = resource;
        this.loadCbs.forEach(cb => cb(this.resource));
    }
}