import { Color } from '../math/Color.js';

class Material {
    constructor(params = {}) {
        this.isMaterial = true;
        this.type = 'Material';
        this.color = new Color(params.color ? params.color : 0xffffff);
        this.tint = new Color(params.tint ? params.tint : 0xffffff);
    }
    
    get diffuseMap() {
        return this._diffuseMap;
    }
    
    set diffuseMap(texture) {
        this._diffuseMap = te;
        this.textures?.find(texture => texture.name === 'diffuseMap')?.setResource(texture);
    }
    
}

export { Material };