import { Texture, TextureOptions } from "./Texture";
import { TextureLoader } from "@/util/loaders/TextureLoader";
import { Engine } from "@/engine/Engine";
import { compareStrings } from "@/util";

export interface TextureCubeOptions extends TextureOptions {
    // Add any cube-specific options here
}

export class TextureCube extends Texture {
    static get DEFAULT() {
        return new TextureCube();
    }

    constructor(options: TextureCubeOptions = {}) {
        super({
            ...options,
            dimension: "2d",
        });
    }

    protected createTexture() {
        this.texture = this.device.createTexture({
            size: {
                width: this.width,
                height: this.height,
                depthOrArrayLayers: 6, // Cube textures always have 6 faces
            },
            format: this.format,
            usage: this.usage,
            dimension: "2d",
        });
        this.textures.set(0, this.texture);
    }

    createView(options: GPUTextureViewDescriptor = {}): GPUTextureView {
        return this.texture.createView({
            dimension: "cube",
            ...options,
        });
    }

    static from(
        posX: string,
        negX: string,
        posY: string,
        negY: string,
        posZ: string,
        negZ: string,
    ): TextureCube {
        const device = Engine.device;
        const faceUrls = [posX, negX, posY, negY, posZ, negZ];
        const textureCube = new TextureCube();

        try {
            const facePromises = faceUrls.map(async (url, i) => {
                const texture = await TextureLoader.load(url);
                texture.label = `face_${i}`;
                return texture;
            });
            Promise.all(facePromises).then(textures => {
                textures = textures.sort((a, b) => compareStrings(a.label, b.label));
                textureCube.width = textures[0].width;
                textureCube.height = textures[0].height;
                textureCube.createTexture();

                for (let i = 0; i < textures.length; i++) {
                    const texture = textures[i];
                    const commandEncoder = device.createCommandEncoder();
                    commandEncoder.copyTextureToTexture(
                        { texture: texture },
                        { texture: textureCube.texture, origin: [0, 0, i] },
                        [texture.width, texture.height],
                    );
                    device.queue.submit([commandEncoder.finish()]);
                }

                textureCube.loaded = true;
                textureCube.notifyChange();
            });

            return textureCube;
        } catch (error) {
            console.error("Failed to load cube texture faces:", error);
            throw error;
        }
    }
}
