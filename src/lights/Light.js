import { Object3D }  from '../core/Object3D.js';
import { Color } from '../math/Color.js';
import { Vector3 } from '../math/Vector3.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';

class Light extends Object3D {
    constructor(options = {}) {
        super();
        Object.defineProperties(this, {
            isLight: { value: true, writable: false },
            color: { value: new Color(options.color || 0xFFFFFF) },
            intensity: { value: options.intensity || 1 },
            shadow: { value: null, writable: true },
        });
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
    
    lookAt(x, y, z) {
        super.lookAt(x, y, z);
        this.target.set(x, y, z);
        this.shadow?.updateMatrices(this);
    }
}

export { Light };