import { randomFloat } from "../math/MathUtils";

class Textures {
    constructor(renderer) {
        this.renderer = renderer;
        this.device = renderer.device;
        this._textures = {}
        this._views = {};
        this.createDefaultTexture();
        this.createShadowDepthTexture();
        this.createDepthTexture();
        this.createShadowOffsetTexture(4, 3);
    }
    
    
    createDefaultTexture() {
        const texture = this.device.createTexture({
            label: 'Default Texture',
            size: [1, 1],
            format: this.renderer.format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        const data = new Uint8Array([ 255, 0, 0, 255 ]);
        this.device.queue.writeTexture(
            { texture },
            data,
            { bytesPerRow: 4 },
            { width: 1, height: 1 },
        );
        this._textures.default = texture;
        this._views.default = texture.createView();
    }
    
    writeDepthToTexture(depthBuffer) {
        this.device.queue.writeTexture(
            { texture: this.shadowTexture },
            depthBuffer,
            { bytesPerRow: 4 * this.shadowTexture.width },
            { width: this.shadowTexture.width, height: this.shadowTexture.height },
        )
    }
    
    createShadowOffsetTexture(windowSize, filterSize) {
        const numFilterSamples = filterSize * filterSize;
        const bufferSize = windowSize * windowSize * numFilterSamples * 2;
        const data = new Float32Array(bufferSize);
        
        let index = 0;
        for (let texY = 0; texY < windowSize; texY++) {
            for (let texX = 0; texX < windowSize; texX++) {
                for (let v = filterSize - 1; v >= 0; v--) {
                    for (let u = 0; u < filterSize; u++) {
                        let x = (u + 0.5 + randomFloat(-0.5, 0.5)) / filterSize;
                        let y = (v + 0.5 + randomFloat(-0.5, 0.5)) / filterSize;
                        data[index] = Math.sqrt(y) * Math.cos(2 * Math.PI * x);
                        data[index + 1] = Math.sqrt(y) * Math.sin(2 * Math.PI * x);
                        index += 2;
                    }
                }
            }
        }

        const texture = this.device.createTexture({
            dimension: '3d',
            size: [windowSize, windowSize, numFilterSamples / 2],
            format: 'rgba32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
    
        this.device.queue.writeTexture(
            { texture },
            data,
            { 
                bytesPerRow: 4 * 4 * windowSize,
                rowsPerImage: windowSize,
            },
            [windowSize, windowSize, numFilterSamples / 2],
        );
        this._textures.shadowOffset = texture;
        this._views.shadowOffset = texture.createView({ dimension: '3d' });
    }
    
    createShadowDepthTexture() {
        const texture = this.device.createTexture({
            size: [1024, 1024].map(i => i * 2),
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
        });
        
        this._textures.shadowMap = texture;
        this._views.shadowMap = texture.createView();
    }
    
    createDepthTexture() {
        if (this._textures.depth) {
            this._textures.depth.destroy();
        }
        const texture = this.device.createTexture({
            size: [this.renderer.width, this.renderer.height],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        
        this._textures.depth = texture;
        this._views.depth = texture.createView();
    }
    
    add(name, texture) {
        this._textures[name] = texture;
        this._views[name] = texture.createView({ label: name });
    }
    
    remove(name) {
        delete this._textures[name];
        delete this._views[name];
    }
    
    has(name) {
        return this._textures[name] !== undefined;
    }
    
    getTexture(name) {
        return this._textures[name];
    }
    
    getView(name) {
        return this._views[name];
    }
    
}

export { Textures };