import { Object3D }  from '../core/Object3D.js';
import { Color } from '../math/Color.js';
import { Vector3 } from '../math/Vector3.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';

class Light extends Object3D {
    constructor({ color = '#ffffff', intensity = 1 } = {}) {
        super();
        this.isLight = true;
        this.bufferOffset = 0;
        this.type = 'Light';
        this.target = new Vector3();
        this._color = new Color(color);
        this._intensity = intensity;
        this._castShadow = false;
    }
    
    /**
     * @param {number} value
     */
    set intensity(value) {
        this.intensity = value;
        this.data.set([this.intensity], 12);
        this.needsUpdate = true;
    }
    
    get intensity() {
        return this._intensity;
    } 
    
    set color(value) {
        this.color.set(value);
        this.data.set(this.color.data, 0);
        this.needsUpdate = true;
    }
    
    get color() {
        return this._color;
    }
    
    setColor(color) {
        this.color.set(color);
    }
    
    lookAt(x, y, z) {
        super.lookAt(x, y, z);
        this.target.set(x, y, z);
        this.shadow?.updateMatrices(this);
    }
    
    setPosition(x, y, z) {
        super.setPosition(x, y, z);
        this.lookAt(this.target.x, this.target.y, this.target.z);
        this.shadow?.updateMatrices(this);
    }
}

export { Light };