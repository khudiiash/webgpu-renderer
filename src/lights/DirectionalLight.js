import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';
import { Vector3 } from '../math/Vector3.js';
import { UniformData } from '../renderer/new/UniformData.js';
const _zero = new Vector3(0, 0, 0);

class DirectionalLight extends Light {

    constructor(options = {}) {
        super(options);
        Object.defineProperties(this, {
            isDirectionalLight: { value: true, writable: false },
        });
        
        this.uniforms = new UniformData({
            name: 'directional_light',
            values: {
                color: this.color,
                direction: this.direction,
                intensity: this.intensity,
            }
        });
    }

    // updateMatrix() 
    //     super.updateMatrix();
    //     this.shadow.updateMatrices(this);
    // }
    
    // setPosition(x, y, z) {
    //     super.setPosition(x, y, z);
    // }
    
    // updateMatrixWorld(force) {
    //     super.updateMatrixWorld(force);
    //     if (this.position.length()) {
    //         this.direction.subVectors(this.position, _zero).normalize();
    //     }
    //     this.shadow.updateMatrices(this);
    // }
    
    // updateWorldMatrix(force) {
    //     super.updateWorldMatrix(force);
    //     if (this.position.length()) {
    //         this.direction.subVectors(this.position, _zero).normalize();
    //     }
    //     this.shadow.updateMatrices(this);

    //     if (!this.direction.equalsArray(this._data, this.offsets.get(this.direction))) { 
    //         this._data.set(this.direction.data, this.offsets.get(this.direction));
    //         this.write(this._data, 'directionalLights'); 
    //     }
    // }
    
    // lookAt(x, y, z) {
    //     super.lookAt(x, y, z);
    //     this.quaternion.getForwardVector(this.direction);
    //     this._data.set(this.direction.data, 4);
    //     if (!this.direction.equalsArray(this._data, 4)) { 
    //         this._data.set(this.direction.data, 4);
    //         this.write(this._data, 'directionalLights'); 
    //     }
    // }

}

export { DirectionalLight };