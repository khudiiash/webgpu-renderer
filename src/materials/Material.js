import { Color } from '../math/Color.js';
import { generateID } from '../math/MathUtils.js';

class Material {
    constructor(params = {}) {
        this.id = generateID();
        this.isMaterial = true;
        this.type = 'Material';
    }
    
    get diffuseMap() {
        return this._diffuseMap;
    }
    
    set diffuseMap(texture) {
        this._diffuseMap = texture;
        this.textures?.find(texture => texture.name === 'diffuseMap')?.setTexture(texture);
        this.needsBindGroupUpdate = true;
    }
    
}

export { Material };