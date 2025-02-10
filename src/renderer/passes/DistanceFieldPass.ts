import { Camera } from "@/camera";
import { Scene } from "@/core";
import { RenderPass } from "../RenderPass";

class DistanceFieldPass extends RenderPass {
    numPasses: number = 0;
    textures!: GPUTexture[];
    jfaRenderTargets!: GPUTexture[];
    public init(): this {
        const { width, height } = this.renderer;
        this.numPasses = Math.ceil(Math.log2(Math.max(width, height)));
        this.jfaRenderTargets = [
            this.resources.createTexture('jfa_0', { size: { width, height }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT }),
            this.resources.createTexture('jfa_1', { size: { width, height }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT }),
        ]
        return this;
    }

    public compute(): this {
    }
    public execute(encoder: GPUCommandEncoder, scene?: Scene, camera?: Camera): this {
        throw new Error("Method not implemented.");
    }

}