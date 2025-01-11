import { Texture } from "./Texture";

export class DataTexture extends Texture {
    public data: Uint8Array;
    public width: number;
    public height: number;

    constructor(device: GPUDevice, width: number, height: number, data: Uint8Array) {
        super(device, width, height);
        this.data = data;
        this.width = width;
        this.height = height;
    }
}