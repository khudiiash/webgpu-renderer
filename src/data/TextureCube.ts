import { Texture, TextureOptions } from "./Texture";
import { TextureLoader } from "@/util/loaders/TextureLoader";
import { Engine } from "@/engine/Engine";

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

    static async from(
        posX: string,
        negX: string,
        posY: string,
        negY: string,
        posZ: string,
        negZ: string,
    ): Promise<TextureCube> {
        const device = Engine.device;
        const faceUrls = [posX, negX, posY, negY, posZ, negZ];
        const textureCube = new TextureCube();

        try {
            const facePromises = faceUrls.map((url, index) =>
                TextureLoader.load(url).then((texture) => {
                    const commandEncoder = device.createCommandEncoder();
                    commandEncoder.copyTextureToTexture(
                        { texture: texture },
                        {
                            texture: textureCube.texture,
                            origin: { x: 0, y: 0, z: index },
                        },
                        {
                            width: textureCube.width,
                            height: textureCube.height,
                            depthOrArrayLayers: 1,
                        },
                    );
                    device.queue.submit([commandEncoder.finish()]);
                }),
            );

            await Promise.all(facePromises);
            textureCube.loaded = true;
            textureCube.notifyChange();

            return textureCube;
        } catch (error) {
            console.error("Failed to load cube texture faces:", error);
            throw error;
        }
    }

    setFace(texture: GPUTexture, faceIndex: number) {
        if (faceIndex < 0 || faceIndex > 5) {
            throw new Error("TextureCube: Invalid face index. Must be between 0 and 5");
        }
        this.setTexture(texture, faceIndex);
    }
}
