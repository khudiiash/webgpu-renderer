class Textures {
    constructor(renderer) {
        this.renderer = renderer;
        this.device = renderer.device;
        this._textures = {}
        this._views = {};
        this.createDefaultTexture();
        this.createShadowDepthTexture();
        this.createDepthTexture();
    }
    
    createDefaultTexture() {
        const texture = this.device.createTexture({
            size: [1, 1],
            format: this.renderer.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this._textures.default = texture;
        this._views.default = texture.createView();
    }
    
    createShadowDepthTexture() {
        const texture = this.device.createTexture({
            size: [1024, 1024].map(i => i * 8),
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
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
        this._views[name] = texture.createView();
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