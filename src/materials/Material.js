import { Color } from '../math/Color.js';
import { generateID } from '../math/MathUtils.js';
import { Events } from '../core/Events.js';

class Material extends Events {
    constructor(params = {}) {
        super();
        this.id = generateID();
        this.isMaterial = true;
        this.type = 'Material';
        this.cullFace = 'back';
    }
    
    get diffuseMap() {
        return this._diffuseMap;
    }
    
    set diffuseMap(texture) {
        this._diffuseMap = texture;
        this.textures?.find(texture => texture.name === 'diffuseMap')?.setTexture(texture);
        this.emit('update');
    }
    
    write(data, offset = 0) {
        this.emit('write', { data, offset });
    }
    
}

export { Material };