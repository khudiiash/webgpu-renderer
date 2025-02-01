import { TextureMipGenerator } from './TextureMipGenerator';

export class TextureLoader {
    private mipGenerator!: TextureMipGenerator;
    static #instance: TextureLoader;
    static _texturesCreated: number = 0;

    static async load(url: string, options = { rotateY: false }) {
        return TextureLoader.getInstance().load(url, options);
    }

    static async loadFromBlob(blob: Blob) {
        return TextureLoader.getInstance().loadFromBlob(blob);
    }

    static async getBitmap(url: string) {
        return TextureLoader.getInstance().getBitmap(url);
    }

    static getInstance(): TextureLoader {
        if (!TextureLoader.#instance) {
            throw new Error('TextureLoader has not been initialized');
        }
        return TextureLoader.#instance;
    }

    static init(device: GPUDevice) {
        if (TextureLoader.#instance) {
            return TextureLoader.#instance;
        }
        TextureLoader.#instance = new TextureLoader(device);
        return TextureLoader.#instance;
    }

    constructor(private device: GPUDevice) {
        if (TextureLoader.#instance) {
            return TextureLoader.#instance;
        }
        this.mipGenerator = new TextureMipGenerator(device);
    }

    async getBitmap(url: string) {
        const res = await fetch(url);
        const blob = await res.blob();
        return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    }

    async load(url: string, options = { rotateY: false }) {
        const img = await this.getBitmap(url);
        return this.createTexture(img, { mips: true });
    }

    async loadFromBlob(blob: Blob) {
        const img = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
        return this.createTexture(img, { mips: true });
    }

    private numMipLevels(...sizes: number[]) {
        return 1 + Math.floor(Math.log2(Math.max(...sizes)));
    }

    private createTexture(source: ImageBitmap, options: { mips?: boolean, name?: string } = {}) {
        const texture = this.device.createTexture({
            label: options.name || 'Texture_' + TextureLoader._texturesCreated++,
            size: [source.width, source.height],
            format: 'rgba8unorm',
            mipLevelCount: options.mips ? this.numMipLevels(source.width, source.height) : 1,
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source },
            { texture },
            [source.width, source.height]
        );

        if (texture.mipLevelCount > 1) {
            this.mipGenerator.generateMips(texture);
        }

        return texture;
    }
}